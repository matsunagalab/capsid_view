console.log('Loading main.js...');
import {structures} from './structures.js';
import {filteringStructures} from './viewers.js';

let selectedTag = 'paper'; // 初期値
const dropdownItems = document.querySelectorAll('.dropdown-item');
console.log(dropdownItems);
// 各ドロップダウン項目にイベントリスナーを追加
dropdownItems.forEach(item => {
    item.addEventListener('click', (event) => {
        event.preventDefault(); // デフォルトの動作を防ぐ
        selectedTag = item.dataset.value; // data-value属性からタグを取得
        filteringStructures(structures, selectedTag);
    });
});

// スライダーの変更イベントを監視
// document.getElementById('columns').addEventListener('input', updateGrid.bind(null, structures_set));

// 初期表示
document.addEventListener('DOMContentLoaded', () => {
    filteringStructures(structures, selectedTag);
});

// ウィンドウリサイズ時にグリッドを更新
let resizeTimeout;
// ウィンドウの幅が変わったときのみグリッドを更新
let lastWindowWidth = window.innerWidth;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        const currentWindowWidth = window.innerWidth;

        if (currentWindowWidth !== lastWindowWidth) {
            lastWindowWidth = currentWindowWidth;
            filteringStructures(structures, selectedTag);
        }
    }, 100); // デバウンス
});

// ページ遷移時にビューアを破棄
window.addEventListener('beforeunload', () => {
    viewers.forEach(viewer => {
        if (viewer && viewer.plugin) {
            viewer.plugin.dispose();
        }
    });
});