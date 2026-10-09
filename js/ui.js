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
    image:
      '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="2"/><path d="m3 17 5-5 4 4 4-6 5 7"/>',
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
    download: '<path d="M12 4v11m0 0 4-4m-4 4-4-4M5 19h14"/>',
    upload: '<path d="M12 15V4m0 0-4 4m4-4 4 4M5 19h14"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>'
  };
  function icon(name, className = '') {
    return `<svg class="icon ${className}" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.info}</svg>`;
  }
  const itemPictures = {
    证件卡片: [
      '#edf4ff',
      '#d7e5fa',
      '<path d="m65 29 15 19 16-19" stroke="#72a1dd" stroke-width="7"/><rect x="32" y="50" width="100" height="67" rx="10" fill="#d4e2f6"/><rect x="29" y="45" width="100" height="67" rx="10" fill="white" stroke="#9bbce8" stroke-width="2"/><path d="M39 45h80a10 10 0 0 1 10 10v9H29v-9a10 10 0 0 1 10-10Z" fill="#5c91d7"/><circle cx="55" cy="80" r="8" fill="#a9c9f0"/><path d="M42 99c0-14 26-14 26 0" fill="#a9c9f0"/><path d="M82 78h30M82 89h24M82 100h19" stroke="#9eb8d9" stroke-width="4"/><rect x="73" y="51" width="14" height="4" rx="2" fill="#d9e8fb"/>'
    ],
    数码设备: [
      '#edf3fc',
      '#d5e1f2',
      '<path d="M43 83V65a37 37 0 0 1 74 0v18" stroke="#a3bfdf" stroke-width="13"/><path d="M43 79V65a37 37 0 0 1 74 0v14" stroke="#547ba9" stroke-width="9"/><path d="M52 55a30 30 0 0 1 56 0" stroke="#c8dbef" stroke-width="5"/><rect x="34" y="76" width="24" height="39" rx="11" fill="#527cad"/><rect x="39" y="76" width="22" height="39" rx="10" fill="#f9fbff" stroke="#a6c3e5" stroke-width="2"/><rect x="103" y="76" width="24" height="39" rx="11" fill="#527cad"/><rect x="99" y="76" width="22" height="39" rx="10" fill="#f9fbff" stroke="#a6c3e5" stroke-width="2"/><path d="M47 86v18M109 86v18" stroke="#d9e6f5" stroke-width="4"/>'
    ],
    钥匙: [
      '#fff5e6',
      '#f0dfc2',
      '<path d="m81 74 34 32v12h-12v-9H92v-9L72 81" fill="#ced7df" stroke="#9eabb7" stroke-width="2"/><circle cx="63" cy="66" r="21" fill="#e3ad55" stroke="#cc9440" stroke-width="2"/><path d="m66 86 10 40h15l-3-12h-8l-2-10h-8" fill="#e3ad55" stroke="#cc9440" stroke-width="2"/><circle cx="63" cy="61" r="7" fill="#fff5e6"/><ellipse cx="76" cy="46" rx="18" ry="20" stroke="#a6b3c0" stroke-width="5"/><rect x="93" y="56" width="20" height="32" rx="7" fill="#709dc3" transform="rotate(-17 103 72)"/><circle cx="101" cy="62" r="3" fill="#dceaf6"/>'
    ],
    包袋: [
      '#f3f2ec',
      '#e1dfd2',
      '<path d="M45 55h73l8 73H37l8-73Z" fill="#d8c9aa"/><path d="M40 51h73l8 73H32l8-73Z" fill="#fcf7e9" stroke="#c6b995" stroke-width="2"/><path d="M55 60V43a22 22 0 0 1 44 0v17" stroke="#6f8fa0" stroke-width="7"/><path d="M60 60V44a17 17 0 0 1 34 0v16" stroke="#f3f2ec" stroke-width="3"/><rect x="52" y="77" width="48" height="34" rx="4" fill="#a4b8bf"/><path d="M60 84h32M61 103h29" stroke="#d6e1e3" stroke-width="2"/>'
    ],
    衣物饰品: [
      '#f5f0fa',
      '#e4d9ec',
      '<path d="m49 39-24 22 15 20 11-9v52h56V72l11 9 15-20-24-22-17-7H66l-17 7Z" fill="#b6a0cb"/><path d="m45 35-24 22 15 20 11-9v52h56V68l11 9 15-20-24-22-17-7H62l-17 7Z" fill="#ddcee9" stroke="#b6a0cb" stroke-width="2"/><path d="M62 28c0 18 26 18 26 0" stroke="#9f88b6" stroke-width="5"/><path d="M55 111h40M31 61l9 11M111 72l9-11" stroke="#c1add3" stroke-width="4"/><rect x="111" y="95" width="13" height="36" rx="4" fill="#b6a0cb"/><circle cx="117.5" cy="112" r="12" fill="#fbf9fd" stroke="#a48bbd" stroke-width="2"/><path d="M118 105v8l5 3" stroke="#9b86b0" stroke-width="2"/>'
    ],
    生活用品: [
      '#edf7f7',
      '#d4e7e8',
      '<rect x="59" y="26" width="42" height="23" rx="6" fill="#6d929e"/><path d="M65 33h30M65 40h30" stroke="#95b4bd" stroke-width="2"/><rect x="52" y="46" width="56" height="80" rx="14" fill="#a8ccd3" stroke="#7da9b5" stroke-width="2"/><path d="M61 62v43" stroke="#dfedef" stroke-width="5"/><rect x="66" y="72" width="28" height="23" rx="5" fill="#e7f2f3"/><path d="M74 80h12M74 87h8" stroke="#9dbdc5" stroke-width="3"/><path d="M67 49h26" stroke="#d6e8ec" stroke-width="3"/>'
    ],
    书本文具: [
      '#fff3ed',
      '#f0ddd1',
      '<rect x="34" y="86" width="91" height="34" rx="5" fill="#c7d5dc"/><path d="M43 93h78v18H43" fill="#fffdfa"/><path d="M48 99h68M48 104h68" stroke="#dce1df" stroke-width="2"/><path d="M43 112h79" stroke="#a2b8c3" stroke-width="3"/><rect x="32" y="38" width="78" height="59" rx="6" fill="#d29b79" transform="rotate(-8 71 68)"/><path d="m38 42 7 54" stroke="#b78063" stroke-width="5"/><path d="m55 51 34-5M57 62l28-4" stroke="#f5d9bf" stroke-width="4"/><path d="m89 37 2 20 5-5 6 4-2-20" fill="#9ab8ad"/><path d="m118 47 8 3-17 57-8-2 17-58Z" fill="#d3ad57"/><path d="m101 105 8 2-7 8-1-10Z" fill="#ebd6b4"/><path d="m118 47 2-7 8 3-2 7" fill="#d4b4ae"/>'
    ],
    其他: [
      '#eff3fa',
      '#d8e1ef',
      '<path d="M80 34v77c0 18 24 18 24 0" stroke="#8c9eb6" stroke-width="5"/><path d="M28 79a52 52 0 0 1 104 0c-9-8-18-8-27 0-8-8-17-8-25 0-9-8-18-8-27 0-8-8-17-8-25 0Z" fill="#739bc5" stroke="#6689b2" stroke-width="2"/><path d="M53 79c0-27 27-52 27-52S63 55 66 76M105 79c0-27-25-52-25-52s17 28 14 49" fill="#adc8e3"/><path d="M80 23v7" stroke="#6689b2" stroke-width="4"/><path d="M80 83v27c0 18 24 18 24 0" stroke="#b3967d" stroke-width="5"/>'
    ]
  };
  function itemArt(category) {
    const selected = Object.hasOwn(itemPictures, category) ? category : '其他';
    const [background, shadow, picture] = itemPictures[selected];
    return `<svg class="item-art" data-category="${selected}" viewBox="0 0 160 160" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="160" height="160" rx="18" fill="${background}"/><ellipse cx="80" cy="132" rx="45" ry="6" fill="${shadow}"/>${picture}</svg>`;
  }
  function itemVisual(category, photo, alt = '物品照片') {
    return photo
      ? `<img class="item-photo" src="${escapeHTML(photo)}" alt="${escapeHTML(alt)}">`
      : itemArt(category);
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
    itemVisual,
    formatDate,
    relativeTime,
    localNow
  };
});
