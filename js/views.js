(function (root) {
  'use strict';
  const C = root.CampusCore;
  const U = root.CampusUI;
  const e = U.escapeHTML;
  const icon = U.icon;
  const link = (route, id) => `#/${route}/${encodeURIComponent(id)}`;

  function pageHeader(title, back = '') {
    return `<header class="page-heading"><div>${back}</div><h1>${title}</h1><div></div></header>`;
  }
  function backButton(action = 'back') {
    return `<button type="button" class="icon-button" data-action="${action}" aria-label="返回">${icon('back')}</button>`;
  }
  function badge(post) {
    return `<span class="status-badge ${post.status === 'resolved' ? 'resolved' : ''}">${C.statusLabel(post)}</span>`;
  }
  function typeBadge(post) {
    return `<span class="type-badge ${post.type}">${post.type === 'lost' ? '寻物' : '招领'}</span>`;
  }
  function card(post, mine = false, keyword = '') {
    return `<article class="post-card">
      <a class="card-link" href="${link('detail', post.id)}" aria-label="查看${e(post.title)}详情">
        <div class="card-art">${U.itemVisual(post.category, post.image, post.title + '照片')}</div>
        <div class="card-body"><div class="card-title-row"><h3>${U.highlight(post.title, keyword)}</h3>${badge(post)}</div>
          <div class="card-meta">${icon('pin')}<span>${U.highlight(post.location, keyword)}</span></div>
          <div class="card-meta">${icon('clock')}<span>${U.formatDate(post.occurredAt)}</span></div>
          <div class="card-tags">${typeBadge(post)}<span>${e(post.category)}</span>${post.ownerId === 'demo' ? '<span class="demo-badge">示例</span>' : ''}</div>
        </div>
      </a>
      ${mine ? `<div class="card-management"><a class="button secondary small-button" href="${link('edit', post.id)}">编辑信息</a><button type="button" class="button secondary small-button" data-action="resolve" data-id="${e(post.id)}" ${post.status === 'resolved' ? 'disabled' : ''}>${post.status === 'resolved' ? '已完成' : '标记为' + (post.type === 'lost' ? '已找到' : '已归还')}</button></div>` : ''}
    </article>`;
  }
  function cards(posts, mine = false, keyword = '') {
    return `<div class="cards-grid">${posts.map((post) => card(post, mine, keyword)).join('')}</div>`;
  }
  function options(values, value, label) {
    return `<option value="">${label}</option>${values.map((item) => `<option value="${e(item)}" ${item === value ? 'selected' : ''}>${e(item)}</option>`).join('')}`;
  }
  function typeTabs(type, action) {
    return `<div class="type-tabs" aria-label="信息类型">${[
      ['all', '全部'],
      ['lost', '寻物'],
      ['found', '招领']
    ]
      .map(
        ([value, label]) =>
          `<button type="button" class="type-tab ${type === value ? 'active' : ''}" data-action="${action}" data-type="${value}" aria-pressed="${type === value}">${label}</button>`
      )
      .join('')}</div>`;
  }
  function filtersForm(filters) {
    const sortOptions = [
      ['', '最新发布优先'],
      ['oldest', '最早发布优先'],
      ['occurred', '最近发生优先'],
      ['occurred-asc', '最早发生优先']
    ];
    return `<form id="filter-form" class="filter-panel" role="search">
      <div class="search-row"><div class="search-input-wrap">${icon('search')}<input type="search" name="keyword" aria-label="搜索物品" placeholder="搜索物品名称、地点或描述" value="${e(filters.keyword)}" maxlength="100" autocomplete="off"></div><button type="submit" class="button primary">搜索</button></div>
      <div class="filter-row">${typeTabs(filters.type, 'type-filter')}<input type="hidden" name="type" value="${filters.type}">
        <div class="filter-selects"><label class="sr-only" for="filter-category">筛选类别</label><select name="category" id="filter-category">${options(C.CATEGORIES, filters.category, '全部类别')}</select>
        <label class="sr-only" for="filter-location">筛选地点</label><select name="location" id="filter-location">${options(C.LOCATIONS, filters.location, '全部地点')}</select><button type="button" class="text-button" data-action="clear-filters">清空筛选</button></div>
      </div>
      <div class="filter-row filter-extra">
        <label class="filter-inline" for="filter-sort"><span>排序</span><select name="sort" id="filter-sort">${sortOptions.map(([value, label]) => `<option value="${value}" ${value === filters.sort ? 'selected' : ''}>${label}</option>`).join('')}</select></label>
        <label class="filter-inline" for="filter-from"><span>起始日期</span><input type="date" name="dateFrom" id="filter-from" value="${e(filters.dateFrom)}"></label>
        <label class="filter-inline" for="filter-to"><span>结束日期</span><input type="date" name="dateTo" id="filter-to" value="${e(filters.dateTo)}"></label>
      </div></form>`;
  }
  function empty(title, description, action) {
    return `<div class="empty-state"><h2>${title}</h2>${description ? `<p>${description}</p>` : ''}${action || ''}</div>`;
  }
  function list(state, filters, heading) {
    const result = C.filterPosts(state.posts, filters);
    return `${filtersForm(filters)}<div class="list-heading"><h2>${heading}</h2><span>${result.length} 条信息</span></div>
      ${result.length ? cards(result, false, filters.keyword) : empty('暂时没有匹配的信息', '请更换关键词或筛选条件。', '<button type="button" class="button secondary" data-action="clear-filters">清空筛选</button>')}`;
  }
  function home(state) {
    return `${pageHeader('校园失物招领')}${list(state, { type: 'all', keyword: '', category: '', location: '' }, '最近发布')}`;
  }
  function search(state, filters) {
    return `${pageHeader('搜索物品')}${list(state, filters, '搜索结果')}`;
  }
  function mine(state, filters) {
    const posts = C.filterPosts(state.posts, { ownerId: state.ownerId, type: filters.type });
    return `${pageHeader('我的发布')}<div class="mine-filters">${typeTabs(filters.type, 'mine-type')}<span>${posts.length} 条信息</span></div>
      ${posts.length ? cards(posts, true) : empty('还没有发布信息', '', '<a class="button primary" href="#/publish">发布信息</a>')}
      ${dataCard()}`;
  }
  function dataCard() {
    return `<section class="surface data-card"><h2>数据管理</h2>
      <p>数据仅保存在当前浏览器。导出备份可迁移到其他设备，也可导入已有备份恢复。</p>
      <div class="data-actions">
        <button type="button" class="button secondary" data-action="export-data">${icon('download')}导出备份</button>
        <button type="button" class="button secondary" data-action="choose-import">${icon('upload')}导入备份</button>
        <input id="import-file" type="file" accept=".json,application/json" hidden>
      </div></section>`;
  }
  function detail(post, ownerId) {
    const own = post.ownerId === ownerId;
    const scene = post.type === 'lost' ? '遗失' : '拾取';
    return `${pageHeader(own ? '我的发布详情' : '信息详情', backButton())}<div class="detail-layout">
      <article class="surface detail-card"><div class="detail-art">${U.itemVisual(post.category, post.image, post.title + '照片')}</div><div class="detail-body">
        <div class="detail-title-row"><h2>${e(post.title)}</h2>${badge(post)}</div>
        <div class="detail-badges">${typeBadge(post)}<span>${e(post.category)}</span>${post.ownerId === 'demo' ? '<span class="demo-badge">示例</span>' : ''}</div>
        <dl class="detail-data"><div><dt>${scene}地点</dt><dd>${e(post.location)}</dd></div><div><dt>${scene}时间</dt><dd>${U.formatDate(post.occurredAt, true)}</dd></div><div><dt>发布时间</dt><dd>${U.formatDate(post.createdAt, true)}</dd></div></dl>
        <h3>物品描述</h3><p class="item-description">${e(post.description)}</p>
      </div></article>
      <aside class="aside-stack"><section class="surface contact-card"><h2>联系方式</h2><p class="contact-value">${e(post.contact)}</p><button type="button" class="button primary full-width" data-action="copy" data-id="${e(post.id)}">${icon('copy')}复制联系方式</button></section>
        ${own ? `<section class="surface owner-card"><div class="owner-actions"><a class="button secondary full-width" href="${link('edit', post.id)}">编辑信息</a><button type="button" class="button primary full-width" data-action="resolve" data-id="${e(post.id)}" ${post.status === 'resolved' ? 'disabled' : ''}>${post.status === 'resolved' ? '已完成' : '标记为' + (post.type === 'lost' ? '已找到' : '已归还')}</button></div></section>` : ''}
      </aside></div>${commentsSection(post, ownerId)}`;
  }
  function commentsSection(post, ownerId) {
    const comments = post.comments || [];
    const items = comments
      .map(
        (comment) =>
          `<li class="comment"><div class="comment-head"><span class="comment-author">${comment.authorId === ownerId ? '我' : '其他用户'}</span><span class="comment-time">${U.formatDate(comment.createdAt, true)}</span></div><p class="comment-text">${e(comment.text)}</p></li>`
      )
      .join('');
    return `<section class="surface comments-card"><h2>留言（${comments.length}）</h2>
      <form id="comment-form" class="comment-form" data-post-id="${e(post.id)}"><textarea id="comment-text" name="text" rows="2" maxlength="200" placeholder="补充线索或说明，例如物品细节、联系方式" aria-label="留言内容" required></textarea><span id="error-text" class="field-error" data-error-for="text"></span>
        <div class="comment-actions"><button type="submit" class="button primary small-button">发表留言</button></div></form>
      ${comments.length ? `<ul class="comment-list">${items}</ul>` : '<p class="comment-empty">还没有留言。</p>'}</section>`;
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
    return `${pageHeader(editing ? '编辑信息' : '发布信息', backButton('cancel-form'))}<section class="surface editor-card"><form id="post-form" novalidate data-id="${e(post ? post.id : '')}">
      <fieldset class="type-field"><legend>信息类型</legend><div class="type-options">${[
        ['lost', '寻物'],
        ['found', '招领']
      ]
        .map(
          ([type, title]) =>
            `<label class="type-option"><input type="radio" name="type" value="${type}" ${value.type === type ? 'checked' : ''} ${editing ? 'disabled' : ''}><span>${title}</span></label>`
        )
        .join('')}</div></fieldset>
      <div id="form-summary" class="form-summary" role="alert" tabindex="-1"></div><div class="fields-grid">
        ${field('title', '物品名称', input('title', '请输入物品名称', 'maxlength="60" autocomplete="off"'))}
        ${field('category', '物品类别', `<select id="post-category" name="category" required aria-describedby="error-category">${options(C.CATEGORIES, value.category, '请选择物品类别')}</select>`)}
        ${field('location', scene + '地点', input('location', '请输入具体地点', 'maxlength="80" autocomplete="off" list="campus-locations"') + `<datalist id="campus-locations">${C.LOCATIONS.map((x) => `<option value="${x}">`).join('')}</datalist>`)}
        ${field('occurredAt', scene + '时间', input('occurredAt', '', `type="datetime-local" min="2000-01-01T00:00" max="${U.localNow()}"`))}
        <div class="field wide photo-field"><label for="post-photo">物品图片<span class="optional-label">（可选）</span></label>
          <div class="photo-control"><div id="photo-preview" class="photo-preview">${U.itemVisual(value.category, value.image)}</div><div class="photo-actions">
            <div class="photo-buttons"><button type="button" class="button secondary" data-action="choose-photo">${icon('image')}选择图片</button><button type="button" class="text-button" data-action="remove-photo" ${value.image ? '' : 'hidden'}>移除图片</button></div>
            <p id="photo-hint" class="photo-hint">JPG、PNG、WebP，最大 10 MB</p><span id="photo-status" class="photo-status" role="status">${value.image ? '已添加图片' : '默认类别图片'}</span>
          </div></div>
          <input id="post-photo" type="file" accept="image/jpeg,image/png,image/webp" aria-describedby="photo-hint error-image" hidden>
          <input id="post-image" name="image" type="hidden" value="${e(value.image || '')}"><span id="error-image" class="field-error" data-error-for="image" role="alert"></span>
        </div>
        ${field('description', '物品描述', `<textarea id="post-description" name="description" rows="4" maxlength="1000" placeholder="请输入颜色、外观等物品特征" required aria-describedby="error-description">${e(value.description || '')}</textarea>`, true)}
        ${field('contact', '联系方式', input('contact', '手机号、微信号或 QQ 号', 'maxlength="100" autocomplete="off"'), true)}
      </div><div class="form-actions"><button type="button" class="button secondary" data-action="cancel-form">取消</button><button type="submit" class="button primary">${editing ? '保存修改' : '立即发布'}</button></div>
    </form></section>`;
  }
  function success(post) {
    return `${pageHeader('发布成功')}<section class="surface success-card"><div class="success-symbol">${icon('check')}</div><p class="success-post">${e(post.title)}</p><div class="success-actions"><a class="button primary" href="${link('detail', post.id)}">查看这条信息</a><a class="button secondary" href="#/mine">查看我的发布</a></div><a class="text-button" href="#/home">返回首页</a></section>`;
  }
  function notFound(message = '这条信息不存在。') {
    return empty(
      '暂时无法打开这个页面',
      e(message),
      '<a class="button primary" href="#/home">返回首页</a>'
    );
  }
  function fatal(error) {
    return `<section class="surface fatal-panel"><h1>暂时无法读取本地数据</h1><p>${e(error.message)}</p><button type="button" class="button primary" data-action="retry">重试</button></section>`;
  }
  root.CampusViews = { home, search, mine, detail, editor, success, notFound, fatal };
})(globalThis);
