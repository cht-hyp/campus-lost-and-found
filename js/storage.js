(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./core.js'));
  else root.CampusStorage = factory(root.CampusCore);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Core) {
  'use strict';
  const STORAGE_KEY = 'campus-lost-found:v1';
  const nonempty = (value) => typeof value === 'string' && value.trim().length > 0;
  const isTimestamp = (value) => nonempty(value) && Number.isFinite(Date.parse(value));

  function validState(state) {
    if (!state || state.version !== 1 || !nonempty(state.ownerId) || !Array.isArray(state.posts))
      return false;
    const ids = new Set();
    return state.posts.every((post) => {
      if (!post || !nonempty(post.id) || !nonempty(post.ownerId) || ids.has(post.id)) return false;
      ids.add(post.id);
      if (
        !['open', 'resolved'].includes(post.status) ||
        !isTimestamp(post.createdAt) ||
        !isTimestamp(post.updatedAt)
      )
        return false;
      // 已保存的时间不应因为系统时钟回拨而无法读取；新建与编辑仍按当前时间校验。
      return Object.keys(Core.validatePost(post, new Date(9999, 11, 31))).length === 0;
    });
  }

  function createRepository(storage, options = {}) {
    const key = options.key || STORAGE_KEY;

    function save(state) {
      if (!validState(state))
        throw new Core.DomainError('STORAGE_CORRUPT', '本地数据格式不正确，未覆盖原有数据');
      try {
        storage.setItem(key, JSON.stringify(state));
      } catch (_) {
        throw new Core.DomainError(
          'STORAGE_WRITE',
          '保存失败。请检查浏览器是否允许本地存储，或是否空间不足；填写内容仍然保留。'
        );
      }
      return state;
    }

    function load() {
      let raw;
      try {
        raw = storage.getItem(key);
      } catch (_) {
        throw new Core.DomainError(
          'STORAGE_READ',
          '无法读取本地数据。请在 Chrome 普通窗口中打开，并允许本地存储。'
        );
      }
      if (raw === null) {
        return save({
          version: 1,
          ownerId: (options.idFactory || Core.makeId)(),
          posts: JSON.parse(JSON.stringify(options.seedPosts || []))
        });
      }
      let state;
      try {
        state = JSON.parse(raw);
      } catch (_) {
        throw new Core.DomainError(
          'STORAGE_CORRUPT',
          '本地数据损坏，已保留原始内容。请先备份数据，再按 README 的步骤处理。'
        );
      }
      if (!validState(state))
        throw new Core.DomainError(
          'STORAGE_CORRUPT',
          '本地数据版本或格式不正确，已保留原始内容。请参照 README 处理。'
        );
      return state;
    }
    return { load, save };
  }

  return { STORAGE_KEY, createRepository };
});
