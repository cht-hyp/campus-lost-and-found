(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./core.js'));
  else root.CampusComments = factory(root.CampusCore);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Core) {
  'use strict';
  const MAX_COMMENT = 200;

  function validateComment(input, now = new Date()) {
    input = input || {};
    const errors = {};
    const value = typeof input.text === 'string' ? input.text.trim() : '';
    if (!value) errors.text = '请先填写留言内容';
    else if (value.length > MAX_COMMENT) errors.text = `留言不能超过 ${MAX_COMMENT} 个字符`;
    if (!input.postId) errors.postId = '缺少信息编号';
    if (!input.authorId) errors.authorId = '无法识别当前用户';
    return errors;
  }

  function createComment(input, now = new Date()) {
    const errors = validateComment(input, now);
    if (Object.keys(errors).length)
      throw new Core.DomainError('VALIDATION', '请检查留言内容', errors);
    return {
      id: Core.makeId(),
      postId: input.postId,
      authorId: input.authorId,
      text: input.text.trim(),
      createdAt: now.toISOString()
    };
  }

  function addComment(posts, postId, comment) {
    const post = posts.find((item) => item.id === postId);
    if (!post) throw new Core.DomainError('NOT_FOUND', '这条信息不存在');
    return posts.map((item) =>
      item.id === postId ? { ...item, comments: [...(item.comments || []), comment] } : item
    );
  }

  return { MAX_COMMENT, validateComment, createComment, addComment };
});
