/**
 * Mockup 用 SVG symbol sprite。
 *
 * 以 <script src="_assets/icons.js"></script> 引入後，頁面即可用
 * <svg class="ic"><use href="#i-sun"/></svg> 取用。
 *
 * 刻意不依賴任何 CDN 或 webfont —— 設計稿必須在離線、無網路、
 * 未來任何時間點都能原樣打開。
 *
 * 全部為 24x24 viewBox、stroke-based，顏色繼承 currentColor，
 * 尺寸由 CSS 的 .ic { width/height } 控制。
 */
(function () {
  var SPRITE = [
    // xmlns 是必要的：以 image/svg+xml 解析時缺 namespace 會直接得到 parsererror
    '<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0"' +
      ' style="position:absolute" aria-hidden="true">',

    sym(
      'i-sun',
      '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4"/>',
    ),

    sym('i-cloud', '<path d="M7 18a4.6 4.4 0 0 1 0-9 5 4.5 0 0 1 8.5-2A4.3 4 0 0 1 19 18Z"/>'),

    sym(
      'i-cloud-rain',
      '<path d="M7 15a4.6 4.4 0 0 1 0-9 5 4.5 0 0 1 8.5-2A4.3 4 0 0 1 19 15Z"/><path d="M9 18l-1 2M13 18l-1 2M17 18l-1 2"/>',
    ),

    sym('i-moon', '<path d="M12 3a9 9 0 1 0 9 9 6.8 6.8 0 0 1-9-9Z"/>'),

    sym('i-droplet', '<path d="M12 3.5 16.5 10a5.5 5.5 0 1 1-9 0Z"/>'),

    sym(
      'i-wind',
      '<path d="M4 8h9a2.5 2.5 0 1 0-2.5-2.5M3 12h13a2.5 2.5 0 1 1 2.5 2.5M4 16h8a2.5 2.5 0 1 1 2.5 2.5"/>',
    ),

    sym('i-umbrella', '<path d="M3 12a9 9 0 0 1 18 0Z"/><path d="M12 12v7a2 2 0 0 0 4 0"/>'),

    sym(
      'i-uv',
      '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.2 5.2l1.6 1.6M17.2 17.2l1.6 1.6M18.8 5.2l-1.6 1.6M6.8 17.2l-1.6 1.6"/>',
    ),

    sym(
      'i-refresh',
      '<path d="M20 11a8.1 8.1 0 0 0-15.5-2M4.5 5v4h4"/><path d="M4 13a8.1 8.1 0 0 0 15.5 2M19.5 19v-4h-4"/>',
    ),

    sym(
      'i-calendar',
      '<rect x="4" y="5" width="16" height="16" rx="3"/><path d="M16 3v4M8 3v4M4 11h16"/>',
    ),

    sym('i-clock', '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),

    sym(
      'i-map-pin',
      '<circle cx="12" cy="11" r="3"/><path d="M17.7 16.7 13.4 20.9a2 2 0 0 1-2.8 0l-4.3-4.2a8 8 0 1 1 11.4 0Z"/>',
    ),

    sym(
      'i-settings',
      '<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="9" cy="6" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="8" cy="18" r="2"/>',
    ),

    sym(
      'i-wifi-off',
      '<path d="M12 18h.01M9.2 14.8a4 4 0 0 1 5.6 0M6.4 11.9a8 8 0 0 1 4.1-2.2M3.4 9a12 12 0 0 1 4-2.6M17.6 11.9a8 8 0 0 0-2.2-1.5M20.6 9a12 12 0 0 0-6.9-3.2M3 3l18 18"/>',
    ),

    sym('i-info', '<circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v4h1"/>'),

    sym('i-search', '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M21 21l-5.8-5.8"/>'),

    sym('i-plus', '<path d="M12 5v14M5 12h14"/>'),

    sym('i-chevron-right', '<path d="M9 6l6 6-6 6"/>'),

    sym('i-navigation', '<path d="M12 18.5 5 21l7-18 7 18-7-2.5Z"/>'),

    sym('i-check', '<path d="M5 12.5 10 17.5 19 7"/>'),

    '</svg>',
  ].join('');

  function sym(id, body) {
    return (
      '<symbol id="' +
      id +
      '" viewBox="0 0 24 24" fill="none" stroke="currentColor"' +
      ' stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
      body +
      '</symbol>'
    );
  }

  function inject() {
    // 以 DOMParser 解析後 import 節點，而非 innerHTML/insertAdjacentHTML。
    // SPRITE 是本檔的靜態常數、不含任何外部輸入，但仍避開 HTML 注入 sink，
    // 免得日後有人照著這個寫法把變數塞進去。
    //
    // 用 text/html 而非 image/svg+xml：HTML parser 會自動把 <svg> 子樹放進
    // SVG namespace，XML parser 則要求每層都有正確的 xmlns，少一個就整份失效
    // （症狀是 symbol 節點的 namespaceURI 為 null，<use> 靜默不渲染）。
    var doc = new DOMParser().parseFromString(SPRITE, 'text/html');
    var root = doc.body.firstElementChild;
    if (root) {
      document.body.insertBefore(document.importNode(root, true), document.body.firstChild);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();
