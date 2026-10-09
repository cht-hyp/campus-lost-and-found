(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./core.js'));
  else root.CampusClaims = factory(root.CampusCore);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Core) {
  'use strict';
  const LIMITS = { contact: 100, note: 200 };

  function validateClaim(input) {
    input = input || {};
    const errors = {};
    const contact = typeof input.contact === 'string' ? input.contact.trim() : '';
    const note = typeof input.note === 'string' ? input.note.trim() : '';
    if (!input.postId) errors.postId = '缺少信息编号';
    if (!input.claimerId) errors.claimerId = '无法识别当前用户';
    if (!contact) errors.contact = '请填写联系方式';
    else if (contact.length > LIMITS.contact) errors.contact = `联系方式不能超过 ${LIMITS.contact} 个字符`;
    if (note.length > LIMITS.note) errors.note = `说明不能超过 ${LIMITS.note} 个字符`;
    return errors;
  }

  function createClaim(input, now = new Date()) {
    const errors = validateClaim(input);
    if (Object.keys(errors).length)
      throw new Core.DomainError('VALIDATION', '请检查认领申请', errors);
    return {
      id: Core.makeId(),
      claimerId: input.claimerId,
      contact: input.contact.trim(),
      note: input.note.trim(),
      createdAt: now.toISOString(),
      status: 'pending'
    };
  }

  function submitClaim(posts, postId, claim) {
    const post = posts.find((item) => item.id === postId);
    if (!post) throw new Core.DomainError('NOT_FOUND', '这条信息不存在');
    if (post.ownerId === claim.claimerId)
      throw new Core.DomainError('FORBIDDEN', '不能认领自己发布的信息');
    return posts.map((item) =>
      item.id === postId ? { ...item, claims: [...(item.claims || []), claim] } : item
    );
  }

  function decideClaim(posts, postId, claimId, decision, ownerId, now = new Date()) {
    const post = posts.find((item) => item.id === postId);
    if (!post) throw new Core.DomainError('NOT_FOUND', '这条信息不存在');
    if (post.ownerId !== ownerId)
      throw new Core.DomainError('FORBIDDEN', '只能处理自己发布信息的认领申请');
    if (!['accepted', 'rejected'].includes(decision))
      throw new Core.DomainError('VALIDATION', '无效的处理结果');
    const claim = (post.claims || []).find((item) => item.id === claimId);
    if (!claim) throw new Core.DomainError('NOT_FOUND', '这条认领申请不存在');
    if (claim.status !== 'pending') return posts;
    return posts.map((item) => {
      if (item.id !== postId) return item;
      const claims = (item.claims || []).map((c) =>
        c.id === claimId ? { ...c, status: decision } : c
      );
      const resolved = decision === 'accepted' && item.status !== 'resolved';
      return {
        ...item,
        claims,
        status: resolved ? 'resolved' : item.status,
        updatedAt: resolved ? now.toISOString() : item.updatedAt
      };
    });
  }

  return { LIMITS, validateClaim, createClaim, submitClaim, decideClaim };
});
