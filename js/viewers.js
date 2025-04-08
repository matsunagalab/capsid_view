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
function createGridItem(structure) {
    //const molstarUrl = `https://molstar.org/viewer/?pdb=${structure.name}&preset=default&collapse-left-panel=1`;//
    // const molstarUrl = `https://molstar.org/viewer/?mvs-format=mvsj&mvs-url=${structure.mvsj}&collapse-left-panel=1`;    
    // structure.snapshotのURL末尾がmoljまたはmolxかを確認
    const url = new URL(structure.snapshot);
    const urlType = url.pathname.split('.').pop();
    if (urlType !== 'molj' && urlType !== 'molx') {
        throw new Error(`Invalid snapshot URL type: ${urlType}`);
    }
    const molstarUrl = `https://molstar.org/viewer/?snapshot-url-type=${urlType}&snapshot-url=${structure.snapshot}&collapse-left-panel=1`;    
    return `
        <div class="bg-white p-4 rounded-lg shadow">
            <h2 class="text-lg font-semibold mb-2">
                <a href="${molstarUrl}" target="_blank" class="text-blue-600 hover:text-blue-800 hover:underline">
                    ${structure.name}
                </a>
            </h2>
            <div id="${structure.id}" class="aspect-square" ></div>
        </div>
    `;
}

// グリッドを更新する関数
async function updateGrid(structures) {
    const viewers = new Map(); // プラグインの状態を追跡
    const gridContainer = document.getElementById('grid-container');
    // const columns = document.getElementById('columns').value;
    // const viewerSize = calculateViewerSize(columns);
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

    // document.getElementById('columns-value').textContent = columns;

    viewers.forEach(viewer => {
        if (viewer && viewer.plugin) {
            viewer.plugin.dispose();
        }
    });
    viewers.clear();

    // gridContainer.className = `grid gap-4 grid-cols-${columns}`;
    gridContainer.innerHTML = structures.map(structure => 
        createGridItem(structure)
    ).join('');

    // molstarビューアを初期化
    for (const structure of structures) {
        try {
            // structure.idに対応する要素をもっていたら、そのviewerを削除  
            // if (viewers.has(structure.id)) {
            //     console.log(`viewer ${structure.id} is already exist`);
            //     const viewer = viewers.get(structure.id);
            //     if (viewer && viewer.plugin) {
            //         viewer.plugin.dispose();
            //         viewer = null;
            //     }
            // }
            // if (viewer) {
            //     console.log(`viewer ${structure.id} が存在します`);
            //     viewer.dispose(); // 古いコンテキストを破棄
            //     // viewer = null;    // 参照を削除
            // }            

            const viewer = await molstar.Viewer.create(
                structure.id,
                { ...viewerOptions, canvas3d: { ...viewerOptions.canvas3d } }
            );
            
            viewers.set(structure.id, viewer);
            
            try {
                // スナップショットを読み込む
                // structure.snapshotのURL末尾がmoljまたはmolxかを確認
                const url = new URL(structure.snapshot);
                const urlType = url.pathname.split('.').pop();
                if (urlType !== 'molj' && urlType !== 'molx') {
                    throw new Error(`Invalid snapshot URL type: ${urlType}`);
                }
                await viewer.loadSnapshotFromUrl(structure.snapshot, urlType);
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

// 選択したアイテムによってstructuresをフィルタリングする関数
function filteringStructures(structures, tag) {
    const filteredStructures = structures.filter(structure =>
        structure.tag.includes(tag) // tagに基づいてフィルタリング
    );
    updateGrid(filteredStructures);

    console.log(`選択されたタグ: ${tag}`);
    console.log('フィルタリング結果:', filteredStructures);
}

export {updateGrid, filteringStructures};