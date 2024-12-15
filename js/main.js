console.log('Loading main.js...');
import {structures} from './structures.js';
import {updateGrid} from './viewers.js';

// ウィンドウリサイズ時にグリッドを更新
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(updateGrid(structures), 100);
});

// スライダーの変更イベントを監視
document.getElementById('columns').addEventListener('input', updateGrid.bind(null, structures));

// 初期表示
document.addEventListener('DOMContentLoaded', () => {
    updateGrid(structures);
});

// ページ遷移時にビューアを破棄
window.addEventListener('beforeunload', () => {
    viewers.forEach(viewer => {
        if (viewer && viewer.plugin) {
            viewer.plugin.dispose();
        }
    });
});