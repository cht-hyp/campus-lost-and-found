(function (root) {
  'use strict';
  const C = root.CampusCore;
  const U = root.CampusUI;
  const e = U.escapeHTML;
  const icon = U.icon;
  const link = (route, id) => `#/${route}/${encodeURIComponent(id)}`;
  function badge(post) {
    return `<span class="status-badge ${post.status === 'resolved' ? 'resolved' : ''}">${post.status === 'resolved' ? icon('check') : ''}${C.statusLabel(post)}</span>`;
  }
  function typeBadge(post) {
    return `<span class="type-badge ${post.type}">${post.type === 'lost' ? '寻物' : '招领'}</span>`;
  }
  function card(post, mine = false) {
    return `<article class="post-card">
      <a class="card-link" href="${link('detail', post.id)}" aria-label="查看${e(post.title)}详情">
        <div class="card-art tone-${C.CATEGORIES.indexOf(post.category)}"><span class="card-type type-badge ${post.type}">${post.type === 'lost' ? '寻物' : '招领'}</span>${U.itemArt(post.category)}</div>
        <div class="card-body"><div class="card-title-row"><h3>${e(post.title)}</h3>${badge(post)}</div>
          <div class="card-meta">${icon('pin')}<span>${e(post.location)}</span></div>
          <div class="card-meta">${icon('clock')}<span>${post.type === 'lost' ? '遗失' : '拾取'}于 ${U.formatDate(post.occurredAt)}</span></div>
          <p class="card-description">${e(post.description)}</p>
          <div class="card-bottom"><span>${U.relativeTime(post.createdAt)}${post.ownerId === 'demo' ? '<span class="demo-badge">示例</span>' : ''}</span><span class="view-link">查看详情 ${icon('arrow')}</span></div>
        </div>
      </a>
      ${mine ? `<div class="card-management"><a class="button secondary small-button" href="${link('edit', post.id)}">${icon('edit')}编辑信息</a><button type="button" class="button soft small-button" data-action="resolve" data-id="${e(post.id)}" ${post.status === 'resolved' ? 'disabled' : ''}>${post.status === 'resolved' ? icon('check') + '已完成' : '标记为' + (post.type === 'lost' ? '已找到' : '已归还')}</button></div>` : ''}
    </article>`;
  }
  function cards(posts, mine = false) {
    return `<div class="cards-grid">${posts.map((post) => card(post, mine)).join('')}</div>`;
  }
  function options(values, value, label) {
    return `<option value="">${label}</option>${values.map((item) => `<option value="${e(item)}" ${item === value ? 'selected' : ''}>${e(item)}</option>`).join('')}`;
  }
  function filtersForm(filters) {
    return `<form id="filter-form" class="filter-panel" role="search">
      <div class="search-row"><div class="search-input-wrap">${icon('search')}<input type="search" name="keyword" aria-label="搜索物品" placeholder="搜索物品名称、地点或描述…" value="${e(filters.keyword)}" maxlength="100" autocomplete="off"></div><button type="submit" class="button primary">搜索</button></div>
      <div class="filter-row"><div class="type-tabs" aria-label="信息类型">${[
        ['all', '全部信息'],
        ['lost', '寻物'],
        ['found', '招领']
      ]
        .map(
          ([value, label]) =>
            `<button type="button" class="type-tab ${filters.type === value ? 'active' : ''}" data-action="type-filter" data-type="${value}" aria-pressed="${filters.type === value}">${label}</button>`
        )
        .join('')}</div>
        <input type="hidden" name="type" value="${filters.type}">
        <div class="filter-selects"><label class="sr-only" for="filter-category">筛选类别</label><select name="category" id="filter-category">${options(C.CATEGORIES, filters.category, '全部类别')}</select>
        <label class="sr-only" for="filter-location">筛选地点</label><select name="location" id="filter-location">${options(C.LOCATIONS, filters.location, '全部地点')}</select><button type="button" class="text-button" data-action="clear-filters">清空筛选</button></div>
      </div></form>`;
  }
  function empty(title, description, action) {
    return `<div class="empty-state"><div class="empty-symbol">${icon('search')}</div><h2>${title}</h2><p>${description}</p>${action}</div>`;
  }
  function list(state, filters) {
    const result = C.filterPosts(state.posts, filters);
    return `${filtersForm(filters)}<div class="results-meta"><span>共找到 <strong>${result.length}</strong> 条信息</span><span>${icon('clock')}按发布时间排序 · 示例信息已标注</span></div>
      ${result.length ? cards(result) : empty('暂时没有匹配的信息', '换个关键词试试，或减少一些筛选条件。', '<button type="button" class="button soft" data-action="clear-filters">清空筛选</button>')}`;
  }
  function home(state) {
    const lost = state.posts.filter((p) => p.type === 'lost' && p.status === 'open').length;
    const found = state.posts.filter((p) => p.type === 'found' && p.status === 'open').length;
    const done = state.posts.filter((p) => p.status === 'resolved').length;
    return `<section class="hero" aria-labelledby="home-title"><div class="hero-copy"><div class="eyebrow"><span class="dot"></span>让善意在校园流动</div><h1 id="home-title">失物有归处，<br><span>寻找有回应。</span></h1><p>遗落的也许是一件小物，找回的却是一整天的安心。<br>在这里，让每一份善意与需要相遇。</p><div class="hero-actions"><a class="button primary" href="#/publish?type=lost">${icon('search')}我丢东西了</a><a class="button secondary" href="#/publish?type=found">${icon('heart')}我捡到东西</a></div></div><div class="hero-art"><img src="assets/campus.svg" width="480" height="300" alt="耳机和校园卡信息卡片旁的放大镜"></div></section>
      <div class="stat-row" aria-label="信息统计"><div class="stat"><div class="stat-icon">${icon('search')}</div><div><div class="stat-number">${lost}</div><div class="stat-label">正在寻找</div></div></div><div class="stat"><div class="stat-icon">${icon('heart')}</div><div><div class="stat-number">${found}</div><div class="stat-label">等待认领</div></div></div><div class="stat"><div class="stat-icon">${icon('check')}</div><div><div class="stat-number">${done}</div><div class="stat-label">已经团圆</div></div></div></div>
      <section aria-labelledby="board-title"><div class="section-heading"><h2 id="board-title">校园失物动态<small>发现身边的线索</small></h2><span class="section-note">每一条信息，都是一份希望</span></div>${list(state, { type: 'all', keyword: '', category: '', location: '' })}</section>
      <div class="tip-strip">${icon('bulb')}<div><strong>一点小提示，帮助物品更快回家</strong>搜索时试试物品名称或地点；联系认领时核对物品特征，找回或归还后记得更新状态。</div></div>`;
  }
  function search(state, filters) {
    return `<div class="page-heading"><div class="eyebrow">FIND SOMETHING · 寻找线索</div><h1>找一找，也许它就在这里</h1><p>从一条线索开始，用关键词和筛选缩小寻找范围。</p></div>${list(state, filters)}`;
  }
  function mine(state) {
    const posts = C.filterPosts(state.posts, { ownerId: state.ownerId });
    return `<div class="page-heading"><div class="eyebrow">MY POSTS · 我的发布</div><h1>每一条发布，都有后续<span class="count-pill">${posts.length}</span></h1><p>查看、修改信息，或为这段寻找画上一个圆满的句号。</p></div>
      <div class="mine-notice">${icon('info')}这里展示当前浏览器发布的信息。请继续使用同一浏览器和文件路径管理。</div>
      ${posts.length ? cards(posts, true) : empty('还没有发布信息', '有东西遗落了，或捡到了等待主人的物品？从这里开始。', '<a class="button primary" href="#/publish">' + icon('plus') + '发布第一条信息</a>')}`;
  }
  function detail(post, ownerId) {
    const own = post.ownerId === ownerId;
    const scene = post.type === 'lost' ? '遗失' : '拾取';
    return `<div class="breadcrumb"><a href="#/home">首页</a>${icon('chevron')}<span>信息详情</span></div><div class="detail-layout">
      <article class="surface"><div class="detail-art tone-${C.CATEGORIES.indexOf(post.category)}">${U.itemArt(post.category)}</div><div class="detail-body"><div class="detail-badges">${typeBadge(post)}${badge(post)}<span class="category-badge">${e(post.category)}</span>${post.ownerId === 'demo' ? '<span class="demo-badge">示例信息</span>' : ''}</div>
      <h1>${e(post.title)}</h1><p class="publish-date">发布于 ${U.formatDate(post.createdAt, true)}${own ? ' · 你发布的信息' : ''}</p>
      <div class="detail-data"><div class="data-item">${icon('pin')}<div><span>${scene}地点</span><strong>${e(post.location)}</strong></div></div><div class="data-item">${icon('clock')}<div><span>${scene}时间</span><strong>${U.formatDate(post.occurredAt, true)}</strong></div></div></div>
      <h2>物品描述</h2><p class="item-description">${e(post.description)}</p></div></article>
      <aside class="aside-stack"><section class="surface contact-card"><div class="contact-heading">${icon('user')}<h2>联系发布者</h2></div><p class="contact-value">${e(post.contact)}</p><button type="button" class="button primary full-width" data-action="copy" data-id="${e(post.id)}">${icon('copy')}复制联系方式</button><p class="contact-hint">${post.status === 'resolved' ? '这条信息已完成，请留意状态，减少重复联系。' : '请通过发布者留下的方式联系，并说明你看到的物品信息。'}</p></section>
      ${own ? `<section class="surface owner-card"><h3>管理这条信息</h3><p>${post.status === 'resolved' ? '已经完成啦，感谢你及时更新状态。' : '物品找回或归还后，请及时标记完成。'}</p><div class="owner-actions"><a class="button secondary full-width" href="${link('edit', post.id)}">${icon('edit')}编辑信息</a><button type="button" class="button soft full-width" data-action="resolve" data-id="${e(post.id)}" ${post.status === 'resolved' ? 'disabled' : ''}>${icon('check')}${post.status === 'resolved' ? '已完成' : '标记为' + (post.type === 'lost' ? '已找到' : '已归还')}</button></div></section>` : ''}
      <section class="safety-card"><h3>${icon('shield')}让善意多一份安心</h3><p>认领前请核对物品特征。证件号码等隐私信息不宜公开；交还物品时，选择校园内的公共场所。</p></section></aside></div>
      <button type="button" class="text-button back-link" data-action="back">${icon('back')}返回信息列表</button>`;
  }
  function editor(post, preferredType = 'lost') {
    const editing = Boolean(post);
    const value = post || { type: preferredType, occurredAt: U.localNow() };
    const scene = value.type === 'found' ? '拾取' : '遗失';
    function field(name, label, content, wide = false) {
      return `<div class="field ${wide ? 'wide' : ''}"><label for="post-${name}"><span ${name === 'location' || name === 'occurredAt' ? `data-scene-label="${name}"` : ''}>${label}</span><span class="required" aria-hidden="true">*</span></label>${content}<span id="error-${name}" class="field-error" data-error-for="${name}"></span></div>`;
    }
    function input(name, placeholder, extra = '') {
      return `<input id="post-${name}" name="${name}" value="${e(value[name] || '')}" placeholder="${placeholder}" aria-describedby="error-${name}" required ${extra}>`;
    }
    return `<div class="breadcrumb"><a href="#/home">首页</a>${icon('chevron')}<span>${editing ? '编辑信息' : '发布信息'}</span></div><div class="page-heading"><div class="eyebrow">${editing ? 'EDIT POST · 补充线索' : 'SHARE A CLUE · 传递善意'}</div><h1>${editing ? '让信息更完整，让寻找更容易' : '一条信息，一次重逢的可能'}</h1><p>${editing ? '修改物品资料后保存，信息状态会继续保留。' : '认真填写每一条线索，帮助物品早一点回到主人身边。'}</p></div>
      <div class="editor-layout"><section class="surface editor-card"><form id="post-form" novalidate data-id="${e(post ? post.id : '')}"><h2>选择信息类型</h2><div class="type-options">${[
        ['lost', '我丢东西了', '发布寻物，寻找遗落的物品'],
        ['found', '我捡到了', '发布招领，等待物品的主人']
      ]
        .map(
          ([type, title, note]) =>
            `<label class="type-option"><input type="radio" name="type" value="${type}" ${value.type === type ? 'checked' : ''} ${editing ? 'disabled' : ''}><span><strong>${title}</strong><small>${note}</small></span></label>`
        )
        .join('')}</div>
      <h2>填写物品信息</h2><div id="form-summary" class="form-summary" role="alert" tabindex="-1"></div><div class="fields-grid">
      ${field('title', '物品名称', input('title', '例如：白色蓝牙耳机、校园卡', 'maxlength="60" autocomplete="off"'))}
      ${field('category', '物品类别', `<select id="post-category" name="category" required aria-describedby="error-category">${options(C.CATEGORIES, value.category, '请选择物品类别')}</select>`)}
      ${field('location', scene + '地点', input('location', '例如：图书馆二楼、第一教学楼', 'maxlength="80" autocomplete="off" list="campus-locations"') + `<datalist id="campus-locations">${C.LOCATIONS.map((x) => `<option value="${x}">`).join('')}</datalist>`)}
      ${field('occurredAt', scene + '时间', input('occurredAt', '', `type="datetime-local" min="2000-01-01T00:00" max="${U.localNow()}"`))}
      ${field('description', '物品描述', `<textarea id="post-description" name="description" rows="5" maxlength="1000" placeholder="描述颜色、外观、明显特征，或补充更多有帮助的线索…" required aria-describedby="error-description">${e(value.description || '')}</textarea>`, true)}
      ${field('contact', '联系方式', input('contact', '手机号、微信号或 QQ 号，请注明联系渠道', 'maxlength="100" autocomplete="off"') + '<span class="field-help">请留下你愿意公开的联系方式，方便对方与你联系。</span>', true)}
      </div><div class="form-actions"><button type="button" class="button secondary" data-action="cancel-form">取消</button><button type="submit" class="button primary">${editing ? '保存修改' : '立即发布'}${icon('arrow')}</button></div><p class="form-note">${editing ? '发布类型不再修改；物品资料和原有完成状态分别保存。' : '发布后，可在“我的发布”中修改资料或更新状态。'}</p></form></section>
      <aside class="aside-stack"><section class="surface editor-tips"><h3>${icon('bulb')}写好一条信息的小技巧</h3>${[
        ['名称简洁、准确', '写出具体物品名称，方便对方通过关键词找到你。'],
        ['线索越清楚，寻找越容易', '补充颜色、外观和大致位置，不必写出所有验证细节。'],
        ['联系方式保持畅通', '选择常用的联系方式，认领时进一步核对物品特征。']
      ]
        .map(
          ([title, note], i) =>
            `<div class="tip-item"><span class="tip-number">${i + 1}</span><div><strong>${title}</strong><p>${note}</p></div></div>`
        )
        .join(
          ''
        )}<p class="editor-disclaimer">请发布真实信息，避免公开完整证件号码、密码等隐私内容。</p></section><section class="safety-card"><h3>${icon('heart')}让这份善意有始有终</h3><p>物品找回或归还后，记得在“我的发布”中更新状态，让后来的同学少一份重复询问。</p></section></aside></div>`;
  }
  function success(post) {
    return `<section class="success-card"><div class="success-symbol">${icon('check')}</div><h1>发布成功</h1><p>你的信息已经出现在校园失物动态中。<br>愿每一段寻找，都能迎来好消息。</p><div class="success-post">${typeBadge(post)} <strong>${e(post.title)}</strong></div><div class="success-actions"><a class="button primary" href="${link('detail', post.id)}">查看这条信息 ${icon('arrow')}</a><a class="button secondary" href="#/mine">查看我的发布</a></div><a class="back-link" href="#/home">${icon('back')}返回首页</a></section>`;
  }
  function notFound(message = '这条信息不存在，或你暂时无法管理它。') {
    return empty(
      '暂时无法打开这个页面',
      e(message),
      '<a class="button primary" href="#/home">返回首页</a>'
    );
  }
  function fatal(error) {
    return `<section class="surface fatal-panel"><div class="empty-symbol">${icon('info')}</div><h1>暂时无法读取本地数据</h1><p>${e(error.message)}<br>请先保留现有数据，查看 README 中的“存储问题”说明。</p><button type="button" class="button primary" data-action="retry">${icon('refresh')}重试</button></section>`;
  }
  root.CampusViews = { home, search, mine, detail, editor, success, notFound, fatal };
})(globalThis);
