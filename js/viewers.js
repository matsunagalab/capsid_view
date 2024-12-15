// サイズ計算関数を修正
function calculateViewerSize(columns) {
    // ウィンドウの幅から直接計算
    const windowWidth = window.innerWidth;
    // 最小マージンのみを考慮（両側2px = 4px）
    const gap = 16; // gap-4 = 1rem = 16px
    const padding = 8; // 両側合わせて8px
    const availableWidth = windowWidth - (padding * columns) - (gap * (columns - 1)) - 4; // 4pxはページマージン
    const size = Math.floor(availableWidth / columns);
    
    // サイズの制限を追加
    const minSize = 200;
    const maxSize = 500;
    return Math.max(minSize, Math.min(size, maxSize));
}

// structures.js から構造データを読み込む


// ビューアのサイズを計算する関数
function calculateViewerSize(columns) {
    // コンテナの幅から1グリッドの幅を計算
    const container = document.querySelector('.container');
    const containerWidth = container.clientWidth;
    // パディングとギャップを考慮してグリッドサイズを計算
    const gap = 16; // gap-4 = 1rem = 16px
    const padding = 32; // p-4 = 1rem padding on each side = 32px total
    const availableWidth = containerWidth - (padding * columns) - (gap * (columns - 1));
    const size = Math.floor(availableWidth / columns);
    
    // サイズの制限を追加
    const minSize = 200;
    const maxSize = 500;
    return Math.max(minSize, Math.min(size, maxSize));
}

// グリッドアイテムを生成する関数
function createGridItem(structure, size) {
    //const molstarUrl = `https://molstar.org/viewer/?pdb=${structure.name}&preset=default&collapse-left-panel=1`;//
    // const molstarUrl = `https://molstar.org/viewer/?mvs-format=mvsj&mvs-url=${structure.mvsj}&collapse-left-panel=1`;    
    const molstarUrl = `https://molstar.org/viewer/?snapshot-url-type=molj&snapshot-url=${structure.snapshot}&collapse-left-panel=1`;    
    return `
        <div class="bg-white p-4 rounded-lg shadow">
            <h2 class="text-lg font-semibold mb-2">
                <a href="${molstarUrl}" target="_blank" class="text-blue-600 hover:text-blue-800 hover:underline">
                    ${structure.name}
                </a>
            </h2>
            <div id="${structure.id}" style="width: 100%; height: ${size}px;"></div>
        </div>
    `;
}

// Molstarビューアのオプション
const viewerOptions = {
    layoutIsExpanded: false,
    layoutShowControls: false,
    layoutShowRemoteState: false,
    layoutShowSequence: false,
    layoutShowLog: false,
    layoutShowLeftPanel: false,
    layoutShowStructureSourceControls: false,
    viewportShowAnimation: false,
    viewportShowExpand: false,
    viewportShowSelectionMode: false,
    viewportShowTrajectoryControls: false,
    canvas3d: {
        antialiasing: true,
        backgroundColor: { r: 255, g: 255, b: 255, a: 1 }
    }
};

// プラグインの状態を追跡
const viewers = new Map();

// グリッドを更新する関数
async function updateGrid() {
    const gridContainer = document.getElementById('grid-container');
    const columns = document.getElementById('columns').value;
    document.getElementById('columns-value').textContent = columns;

    const viewerSize = calculateViewerSize(columns);

    viewers.forEach(viewer => {
        if (viewer && viewer.plugin) {
            viewer.plugin.dispose();
        }
    });
    viewers.clear();

    gridContainer.className = `grid gap-4 grid-cols-${columns}`;
    gridContainer.innerHTML = structures.map(structure => 
        createGridItem(structure, viewerSize)
    ).join('');

    // molstarビューアを初期化
    for (const structure of structures) {
        try {
            const viewer = await molstar.Viewer.create(
                structure.id,
                { ...viewerOptions, canvas3d: { ...viewerOptions.canvas3d } }
            );
            
            viewers.set(structure.id, viewer);
            
            try {
                // スナップショットを読み込む
                await viewer.loadSnapshotFromUrl(structure.snapshot, 'molj');
                // await viewer.loadMvsFromUrl(structure.mvsj, 'mvsj')
            } catch (snapshotError) {
                console.warn(`Snapshot load failed for ${structure.name}, falling back to default structure:`, snapshotError);
                // スナップショットのロードに失敗した場合、通常の構造読み込みにフォールバック
                await viewer.loadStructureFromUrl(structure.url, structure.format)
                    .then(() => {
                        const plugin = viewer.plugin;
                        const state = plugin.state.data;
                        const update = state.build()
                            .update(state.select('structure-representation'), (old) => {
                                return {
                                    ...old,
                                    type: 'cartoon',
                                    color: 'chain-id'
                                };
                            });
                        plugin.runTask(plugin.state.updateTree(update));
                    });
            }
        } catch (error) {
            console.error(`Error initializing viewer for ${structure.name}:`, error);
        }
    }
}

// ウィンドウリサイズ時にグリッドを更新
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(updateGrid, 100);
});

// スライダーの変更イベントを監視
document.getElementById('columns').addEventListener('input', updateGrid);

// 初期表示
document.addEventListener('DOMContentLoaded', () => {
    updateGrid();
});

// ページ遷移時にビューアを破棄
window.addEventListener('beforeunload', () => {
    viewers.forEach(viewer => {
        if (viewer && viewer.plugin) {
            viewer.plugin.dispose();
        }
    });
});