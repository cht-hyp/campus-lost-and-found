(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports)
    module.exports = factory(require('./storage.js'), require('./core.js'));
  else root.CampusBackup = factory(root.CampusStorage, root.CampusCore);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Storage, Core) {
  'use strict';
  const APP = 'campus-lost-and-found';
  const SCHEMA = 1;

  function exportPayload(state, now = new Date()) {
    return {
      app: APP,
      schemaVersion: SCHEMA,
      exportedAt: now.toISOString(),
      ownerId: state.ownerId,
      posts: state.posts
    };
  }

  function serialize(state, now) {
    return JSON.stringify(exportPayload(state, now), null, 2);
  }

  function parse(text) {
    let payload;
    try {
      payload = JSON.parse(text);
    } catch (_) {
      throw new Core.DomainError('IMPORT_INVALID', '不是有效的 JSON 文件，请选择导出的备份文件。');
    }
    if (!payload || payload.app !== APP || payload.schemaVersion !== SCHEMA)
      throw new Core.DomainError('IMPORT_INVALID', '文件不是本应用导出的备份，或版本不兼容。');
    const state = { version: 1, ownerId: payload.ownerId, posts: payload.posts };
    if (!Storage.validState(state))
      throw new Core.DomainError('IMPORT_INVALID', '备份内容不完整或已损坏，未做任何修改。');
    return state;
  }

  function merge(current, incoming) {
    const byId = new Map(current.posts.map((post) => [post.id, post]));
    incoming.posts.forEach((post) => byId.set(post.id, post));
    return { version: 1, ownerId: incoming.ownerId, posts: [...byId.values()] };
  }

  return { APP, SCHEMA, exportPayload, serialize, parse, merge };
});
