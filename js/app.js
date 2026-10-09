(function () {
  'use strict';
  const C = window.CampusCore;
  const U = window.CampusUI;
  const V = window.CampusViews;
  const Backup = window.CampusBackup;
  const app = document.getElementById('app');
  let repository;
  let state;
  let currentHash = location.hash || '#/home';
  let routeIndex = Number.isInteger(history.state && history.state.campusIndex)
    ? history.state.campusIndex
    : 0;
  let lastListHash = '#/home';
  let dirty = false;
  let initialForm = '';
  let busy = false;
  let toastTimer;
  let photoSequence = 0;
  let photoLoading = false;
  history.replaceState({ campusIndex: routeIndex }, '', currentHash);

  function findPost(id) {
    return state && state.posts.find((post) => post.id === id);
  }
  function toast(message) {
    const element = document.getElementById('toast');
    element.textContent = message;
    element.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      element.hidden = true;
    }, 4200);
  }
  function confirmAction(title, message, okLabel, cancelLabel = '取消') {
    const dialog = document.getElementById('confirm-dialog');
    if (dialog.open) return Promise.resolve(false);
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-message').textContent = message;
    const ok = document.getElementById('confirm-ok');
    const cancel = document.getElementById('confirm-cancel');
    ok.textContent = okLabel;
    cancel.textContent = cancelLabel;
    dialog.returnValue = '';
    return new Promise((resolve) => {
      // close 事件异步触发；立即结束当前交互，避免旧事件干扰下一次弹窗。
      const finish = (accepted) => {
        ok.onclick = null;
        cancel.onclick = null;
        dialog.oncancel = null;
        dialog.close(accepted ? 'yes' : 'cancel');
        resolve(accepted);
      };
      ok.onclick = () => finish(true);
      cancel.onclick = () => finish(false);
      dialog.oncancel = (event) => {
        event.preventDefault();
        finish(false);
      };
      dialog.showModal();
    });
  }
  function mayLeave() {
    return dirty
      ? confirmAction(
          '还有未保存的修改',
          '离开后，本次填写但尚未保存的内容将被放弃。',
          '放弃修改',
          '继续编辑'
        )
      : Promise.resolve(true);
  }

  function readPostForm(form) {
    const data = new FormData(form);
    const type = form.querySelector('[name="type"]:checked');
    const input = { type: type ? type.value : 'lost' };
    ['title', 'category', 'location', 'occurredAt', 'description', 'contact', 'image'].forEach(
      (name) => {
        input[name] = data.get(name) || '';
      }
    );
    return input;
  }
  function updateDirty() {
    const form = document.getElementById('post-form');
    dirty = Boolean(form && (photoLoading || JSON.stringify(readPostForm(form)) !== initialForm));
  }

  function refreshPhotoPreview(name = '') {
    const form = document.getElementById('post-form');
    if (!form) return;
    const image = form.elements.image.value;
    document.getElementById('photo-preview').innerHTML = U.itemVisual(
      form.elements.category.value,
      image
    );
    document.getElementById('photo-status').textContent = photoLoading
      ? '正在处理图片…'
      : image
        ? name || '已添加图片'
        : '默认类别图片';
    form.querySelector('[data-action="remove-photo"]').hidden = !image;
    form.querySelector('[data-action="choose-photo"]').disabled = photoLoading;
    form.querySelector('button[type="submit"]').disabled = busy || photoLoading;
  }

  async function selectPhoto(file) {
    if (!file) return;
    const form = document.getElementById('post-form');
    const sequence = ++photoSequence;
    const active = () =>
      sequence === photoSequence && document.getElementById('post-form') === form;
    let name = '';
    photoLoading = true;
    document.getElementById('error-image').textContent = '';
    refreshPhotoPreview();
    updateDirty();
    try {
      const image = await CampusImages.preparePhoto(file);
      if (!active()) return;
      form.elements.image.value = image;
      name = file.name;
    } catch (error) {
      if (active()) document.getElementById('error-image').textContent = error.message;
    } finally {
      if (active()) {
        photoLoading = false;
        document.getElementById('post-photo').value = '';
        refreshPhotoPreview(name);
        updateDirty();
      }
    }
  }

  function render() {
    if (!state) return;
    photoSequence += 1;
    photoLoading = false;
    const route = U.parseRoute(currentHash);
    const post = findPost(route.id);
    if (['home', 'search', 'mine'].includes(route.name)) lastListHash = currentHash;
    if (route.name === 'home') app.innerHTML = V.home(state);
    else if (route.name === 'search')
      app.innerHTML = V.search(state, U.searchFilters(route.params));
    else if (route.name === 'mine') app.innerHTML = V.mine(state, U.searchFilters(route.params));
    else if (route.name === 'publish')
      app.innerHTML = V.editor(null, route.params.get('type') === 'found' ? 'found' : 'lost');
    else if (route.name === 'detail' && post) app.innerHTML = V.detail(post, state.ownerId);
    else if (route.name === 'success' && post && post.ownerId === state.ownerId)
      app.innerHTML = V.success(post);
    else if (route.name === 'edit' && post && post.ownerId === state.ownerId)
      app.innerHTML = V.editor(post);
    else
      app.innerHTML = V.notFound(
        route.name === 'edit' ? '只能编辑当前浏览器发布的信息。' : undefined
      );

    const labels = {
      home: '首页',
      search: '寻找物品',
      publish: '发布信息',
      mine: '我的发布',
      edit: '编辑信息',
      success: '发布成功',
      detail: post ? post.title : '信息详情'
    };
    document.title =
      route.name === 'home'
        ? '校园失物招领'
        : `${labels[route.name] || '页面不存在'} - 校园失物招领`;
    document.querySelectorAll('[data-nav]').forEach((anchor) => {
      const active = anchor.dataset.nav === route.name;
      anchor.classList.toggle('active', active);
      if (active) anchor.setAttribute('aria-current', 'page');
      else anchor.removeAttribute('aria-current');
    });
    const form = document.getElementById('post-form');
    initialForm = form ? JSON.stringify(readPostForm(form)) : '';
    dirty = false;
    document.getElementById('main-content').focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }

  async function navigate(hash, force = false) {
    if (busy || (!force && hash === currentHash)) return;
    if (!(await mayLeave())) return;
    dirty = false;
    if (hash !== currentHash) {
      routeIndex += 1;
      history.pushState({ campusIndex: routeIndex }, '', hash);
    }
    currentHash = hash;
    render();
  }

  // 历史菜单可能跳到同一个 hash，不会触发 hashchange，仍需同步当前位置。
  window.addEventListener('popstate', () => {
    const index = history.state && history.state.campusIndex;
    if ((location.hash || '#/home') === currentHash && Number.isInteger(index)) routeIndex = index;
  });

  // 点击导航在改变 URL 前检查；浏览器后退则用历史索引恢复原位置，保留表单 DOM。
  window.addEventListener('hashchange', async () => {
    const target = location.hash || '#/home';
    if (target === currentHash) return;
    const targetIndex = history.state && history.state.campusIndex;
    if (await mayLeave()) {
      dirty = false;
      currentHash = target;
      routeIndex = Number.isInteger(targetIndex) ? targetIndex : routeIndex + 1;
      history.replaceState({ campusIndex: routeIndex }, '', target);
      render();
    } else if (Number.isInteger(targetIndex) && targetIndex !== routeIndex) {
      history.go(routeIndex - targetIndex);
    } else {
      history.replaceState({ campusIndex: routeIndex }, '', currentHash);
    }
  });
  window.addEventListener('beforeunload', (event) => {
    if (dirty) {
      event.preventDefault();
      event.returnValue = '';
    }
  });

  function commit(changePosts) {
    // 每次操作读取最新记录，避免另一个标签页刚写入的数据被旧列表覆盖。
    const latest = repository.load();
    const next = { ...latest, posts: changePosts(latest.posts, latest.ownerId) };
    repository.save(next);
    state = next;
  }
  function filterValues() {
    const form = document.getElementById('filter-form');
    return Object.fromEntries(new FormData(form));
  }
  function showFormErrors(errors, message) {
    const form = document.getElementById('post-form');
    form.querySelectorAll('[data-error-for]').forEach((element) => {
      const field = element.dataset.errorFor;
      element.textContent = errors[field] || '';
      const input = document.getElementById(`post-${field}`);
      if (errors[field]) input.setAttribute('aria-invalid', 'true');
      else input.removeAttribute('aria-invalid');
    });
    const summary = document.getElementById('form-summary');
    summary.textContent =
      message || (Object.keys(errors).length ? '还有一些信息需要补充，请查看下方提示。' : '');
    const first = form.querySelector('[aria-invalid="true"]');
    if (first) first.focus();
    else if (message) summary.focus();
  }
  async function submitPost(form) {
    if (busy || photoLoading) return;
    const input = readPostForm(form);
    const errors = C.validatePost(input);
    showFormErrors(errors);
    if (Object.keys(errors).length) return;
    const id = form.dataset.id;
    const button = form.querySelector('button[type="submit"]');
    busy = true;
    button.disabled = true;
    try {
      if (
        id &&
        !(await confirmAction(
          '保存这次修改？',
          '确认后，新的物品资料将展示在列表和详情中，原有状态保持不变。',
          '确认保存'
        ))
      )
        return;
      let saved;
      commit((posts, ownerId) => {
        if (id) {
          saved = C.editPost(
            posts.find((post) => post.id === id),
            input,
            ownerId
          );
          return posts.map((post) => (post.id === id ? saved : post));
        }
        saved = C.createPost(input, ownerId);
        return [...posts, saved];
      });
      dirty = false;
      busy = false;
      await navigate(`#/${id ? 'detail' : 'success'}/${encodeURIComponent(saved.id)}`);
      if (id) toast('修改已保存');
    } catch (error) {
      showFormErrors(error.errors || {}, error.message);
    } finally {
      busy = false;
      button.disabled = false;
    }
  }
  async function resolve(id) {
    const post = findPost(id);
    if (!post || busy) return;
    const label = post.type === 'lost' ? '已找到' : '已归还';
    const approved = await confirmAction(
      `确认标记为“${label}”？`,
      '更新后，其他浏览者会看到完成状态。这条信息会继续保留，方便查看。',
      '确认完成'
    );
    if (!approved) return;
    try {
      commit((posts, ownerId) => {
        const changed = C.resolvePost(
          posts.find((item) => item.id === id),
          ownerId
        );
        return posts.map((item) => (item.id === id ? changed : item));
      });
      render();
      toast(`状态已更新为“${label}”`);
    } catch (error) {
      toast(error.message);
    }
  }
  async function copy(id) {
    const post = findPost(id);
    if (!post) return;
    let clipboard;
    try {
      clipboard = navigator.clipboard;
    } catch (_) {
      clipboard = undefined;
    }
    const result = await U.copyContact(post.contact, clipboard);
    if (result.copied) toast('联系方式已复制');
    else {
      const dialog = document.getElementById('copy-dialog');
      const input = document.getElementById('manual-contact');
      input.value = result.text;
      dialog.showModal();
      input.focus();
      input.select();
    }
  }
  function exportData() {
    try {
      const json = Backup.serialize(repository.load());
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `campus-lost-and-found-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      toast('备份已导出');
    } catch (error) {
      toast(error.message);
    }
  }
  async function importData(file) {
    if (!file) return;
    let incoming;
    try {
      incoming = Backup.parse(await file.text());
    } catch (error) {
      toast(error.message);
      return;
    }
    const approved = await confirmAction(
      '导入这份备份？',
      `将合并 ${incoming.posts.length} 条记录并恢复备份中的身份，本机原有记录按编号保留。`,
      '确认导入'
    );
    if (!approved) return;
    try {
      const latest = repository.load();
      const next = Backup.merge(latest, incoming);
      repository.save(next);
      state = next;
      render();
      toast('备份已导入');
    } catch (error) {
      toast(error.message);
    }
  }

  document.addEventListener('click', async (event) => {
    const skip = event.target.closest('.skip-link');
    if (skip) {
      event.preventDefault();
      document.getElementById('main-content').focus();
      return;
    }
    const anchor = event.target.closest('a[href^="#/"]');
    if (
      anchor &&
      event.button === 0 &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.shiftKey &&
      !event.altKey
    ) {
      event.preventDefault();
      await navigate(anchor.getAttribute('href'));
      return;
    }
    const button = event.target.closest('[data-action]');
    if (!button || button.disabled) return;
    const action = button.dataset.action;
    if (action === 'type-filter') {
      const filters = filterValues();
      filters.type = button.dataset.type;
      await navigate(U.searchHash(filters));
    } else if (action === 'mine-type') {
      await navigate(
        button.dataset.type === 'all' ? '#/mine' : '#/mine?type=' + button.dataset.type
      );
    } else if (action === 'choose-photo') document.getElementById('post-photo').click();
    else if (action === 'remove-photo') {
      photoSequence += 1;
      photoLoading = false;
      document.getElementById('post-image').value = '';
      document.getElementById('post-photo').value = '';
      document.getElementById('error-image').textContent = '';
      refreshPhotoPreview();
      updateDirty();
    } else if (action === 'clear-filters') await navigate('#/search', true);
    else if (action === 'cancel-form') {
      const id = document.getElementById('post-form').dataset.id;
      await navigate(id ? `#/detail/${encodeURIComponent(id)}` : '#/home');
    } else if (action === 'back') await navigate(lastListHash);
    else if (action === 'resolve') await resolve(button.dataset.id);
    else if (action === 'copy') await copy(button.dataset.id);
    else if (action === 'export-data') exportData();
    else if (action === 'choose-import') document.getElementById('import-file').click();
    else if (action === 'retry') boot();
  });
  document.addEventListener('submit', async (event) => {
    if (event.target.id === 'filter-form') {
      event.preventDefault();
      await navigate(U.searchHash(filterValues()), true);
    } else if (event.target.id === 'post-form') {
      event.preventDefault();
      await submitPost(event.target);
    }
  });
  document.addEventListener('input', (event) => {
    if (!event.target.closest('#post-form')) return;
    updateDirty();
    if (event.target.name) {
      const error = document.querySelector(`[data-error-for="${event.target.name}"]`);
      if (error) error.textContent = '';
      event.target.removeAttribute('aria-invalid');
    }
  });
  document.addEventListener('change', (event) => {
    if (!event.target.closest('#post-form')) return;
    if (event.target.id === 'post-photo') {
      selectPhoto(event.target.files[0]);
      return;
    }
    if (event.target.name === 'category') refreshPhotoPreview();
    if (event.target.name === 'type') {
      const scene = event.target.value === 'found' ? '拾取' : '遗失';
      document.querySelector('[data-scene-label="location"]').textContent = scene + '地点';
      document.querySelector('[data-scene-label="occurredAt"]').textContent = scene + '时间';
    }
    updateDirty();
  });
  document.addEventListener('change', (event) => {
    if (event.target.id === 'import-file') {
      importData(event.target.files[0]);
      event.target.value = '';
    }
  });
  document
    .getElementById('copy-close')
    .addEventListener('click', () => document.getElementById('copy-dialog').close());
  window.addEventListener('storage', (event) => {
    if (event.key !== CampusStorage.STORAGE_KEY || !repository) return;
    try {
      state = repository.load();
      if (dirty) toast('另一个标签页更新了数据，你正在填写的内容仍然保留。');
      else render();
    } catch (error) {
      toast(error.message);
    }
  });

  function boot() {
    try {
      repository = CampusStorage.createRepository(window.localStorage, { seedPosts: CampusSeed });
      state = repository.load();
      render();
    } catch (error) {
      state = null;
      app.innerHTML = V.fatal(error);
    }
  }
  boot();
})();
