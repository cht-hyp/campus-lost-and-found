(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CampusUI = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  function escapeHTML(value) {
    return String(value == null ? '' : value).replace(
      /[&<>"']/g,
      (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]
    );
  }
  function parseRoute(hash) {
    const [rawPath, query = ''] = (hash || '#/home').replace(/^#\/?/, '').split('?');
    const parts = rawPath.split('/');
    const params = new URLSearchParams(query);
    let name = parts[0] || 'home';
    let id;
    if (['detail', 'edit', 'success'].includes(name)) {
      if (parts.length !== 2 || !parts[1]) name = 'not-found';
      else {
        try {
          id = decodeURIComponent(parts[1]);
        } catch (_) {
          name = 'not-found';
        }
      }
    } else if (!['home', 'search', 'publish', 'mine'].includes(name) || parts.length !== 1)
      name = 'not-found';
    return { name, id, params };
  }
  function searchFilters(params) {
    return {
      keyword: params.get('q') || '',
      category: params.get('category') || '',
      location: params.get('location') || '',
      type: ['lost', 'found'].includes(params.get('type')) ? params.get('type') : 'all'
    };
  }
  function searchHash(filters) {
    const params = new URLSearchParams();
    if (filters.keyword) params.set('q', filters.keyword);
    if (filters.category) params.set('category', filters.category);
    if (filters.location) params.set('location', filters.location);
    if (filters.type && filters.type !== 'all') params.set('type', filters.type);
    return '#/search' + (params.size ? `?${params}` : '');
  }
  async function copyContact(value, clipboard) {
    try {
      if (!clipboard || typeof clipboard.writeText !== 'function')
        throw new Error('Clipboard unavailable');
      await clipboard.writeText(value);
      return { copied: true };
    } catch (_) {
      return { copied: false, text: value };
    }
  }
  const paths = {
    search: '<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/>',
    pin: '<path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    arrow: '<path d="M4 12h15m-5-5 5 5-5 5"/>',
    back: '<path d="M20 12H5m5-5-5 5 5 5"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    edit: '<path d="m15 5 4 4M5 19l4-1L20 7a2.8 2.8 0 0 0-4-4L5 14l-1 6Z"/>',
    copy: '<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
    heart:
      '<path d="M20.5 5.5a5 5 0 0 0-7 0L12 7l-1.5-1.5a5 5 0 0 0-7 7L12 21l8.5-8.5a5 5 0 0 0 0-7Z"/>',
    shield: '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/><path d="m8 12 3 3 5-6"/>',
    home: '<path d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-8h6v8"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
    bulb: '<path d="M9 18h6M10 21h4M8 14a7 7 0 1 1 8 0l-1 4H9l-1-4Z"/>',
    chevron: '<path d="m9 5 7 7-7 7"/>',
    refresh:
      '<path d="M20 7v5h-5M4 17v-5h5"/><path d="M6 7a7 7 0 0 1 12-2l2 3M4 16l2 3a7 7 0 0 0 12-2"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>'
  };
  function icon(name, className = '') {
    return `<svg class="icon ${className}" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.info}</svg>`;
  }
  const itemPaths = {
    证件卡片:
      '<rect x="13" y="20" width="70" height="50" rx="9" fill="white"/><circle cx="34" cy="39" r="7"/><path d="M23 58c0-14 22-14 22 0M55 35h16M55 45h12M55 55h16"/>',
    数码设备:
      '<path d="M23 49V35a25 25 0 0 1 50 0v14"/><rect x="16" y="42" width="17" height="30" rx="8" fill="white"/><rect x="63" y="42" width="17" height="30" rx="8" fill="white"/><path d="M70 72c0 12-11 12-20 12"/>',
    钥匙: '<circle cx="33" cy="32" r="17" fill="white"/><circle cx="33" cy="32" r="5"/><path d="m45 45 33 33h8V65H73V54H62L45 45Z" fill="white"/>',
    包袋: '<path d="M22 34h52l5 48H17l5-48Z" fill="white"/><path d="M34 40V27a14 14 0 0 1 28 0v13M34 62h28"/>',
    衣物饰品:
      '<path d="m32 16-19 14 11 20 9-5v35h30V45l9 5 11-20-19-14c-3 16-29 16-32 0Z" fill="white"/>',
    生活用品:
      '<path d="M24 24h38v53a9 9 0 0 1-9 9H33a9 9 0 0 1-9-9V24Z" fill="white"/><path d="M24 18h38M62 36h7a13 13 0 0 1 0 26h-7M35 41h16M35 50h12"/>',
    书本文具:
      '<path d="M17 20h24l7 6 7-6h24v59H55l-7 5-7-5H17V20Z" fill="white"/><path d="M48 26v58M26 35h13M26 45h13M57 35h13M57 45h13"/>',
    其他: '<path d="M14 48a34 34 0 0 1 68 0H14Z" fill="white"/><path d="M48 14v61a9 9 0 0 0 18 0M30 48c0-20 18-34 18-34s18 14 18 34"/>'
  };
  function itemArt(category) {
    return `<svg class="item-art" viewBox="0 0 96 96" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${itemPaths[category] || itemPaths['其他']}</svg>`;
  }
  function formatDate(value, full = false) {
    return new Intl.DateTimeFormat('zh-CN', {
      ...(full ? { year: 'numeric' } : {}),
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(new Date(value));
  }
  function relativeTime(value) {
    const minutes = Math.max(0, Math.floor((Date.now() - Date.parse(value)) / 60000));
    if (minutes < 1) return '刚刚发布';
    if (minutes < 60) return `${minutes} 分钟前`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)} 小时前`;
    return `${Math.floor(minutes / 1440)} 天前`;
  }
  function localNow() {
    const date = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
  return {
    escapeHTML,
    parseRoute,
    searchFilters,
    searchHash,
    copyContact,
    icon,
    itemArt,
    formatDate,
    relativeTime,
    localNow
  };
});
