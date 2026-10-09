const test = require('node:test');
const assert = require('node:assert/strict');
const Claims = require('../js/claims.js');

const now = new Date('2026-10-09T00:00:00Z');
function post(overrides = {}) {
  return { id: 'p1', ownerId: 'me', type: 'lost', status: 'open', ...overrides };
}
function claim(overrides = {}) {
  return {
    id: 'c1',
    claimerId: 'other',
    contact: 'QQ 12345678',
    note: '',
    createdAt: now.toISOString(),
    status: 'pending',
    ...overrides
  };
}

test('有效认领申请可以创建并去除首尾空格', () => {
  const c = Claims.createClaim(
    { postId: 'p1', claimerId: 'other', contact: '  QQ 123 ', note: '  我捡到了  ' },
    now
  );
  assert.equal(c.contact, 'QQ 123');
  assert.equal(c.note, '我捡到了');
  assert.equal(c.status, 'pending');
  assert.equal(c.createdAt, now.toISOString());
  assert.ok(c.id);
});
test('缺少联系方式或作者时拒绝', () => {
  assert.ok(Claims.validateClaim({ postId: 'p1', claimerId: 'other', contact: '  ' }, now).contact);
  assert.ok(Claims.validateClaim({ postId: 'p1', contact: 'QQ' }, now).claimerId);
  assert.throws(
    () => Claims.createClaim({ postId: 'p1', claimerId: 'other', contact: '' }, now),
    (e) => e.code === 'VALIDATION'
  );
});
test('不能认领自己发布的信息', () => {
  assert.throws(
    () => Claims.submitClaim([post()], 'p1', claim({ claimerId: 'me' })),
    (e) => e.code === 'FORBIDDEN'
  );
});
test('发布者确认认领后信息标记为已解决', () => {
  const withClaim = Claims.submitClaim([post()], 'p1', claim());
  const decided = Claims.decideClaim(withClaim, 'p1', 'c1', 'accepted', 'me', now);
  assert.equal(decided[0].status, 'resolved');
  assert.equal(decided[0].claims[0].status, 'accepted');
});
test('拒绝认领不改信息状态', () => {
  const withClaim = Claims.submitClaim([post()], 'p1', claim());
  const decided = Claims.decideClaim(withClaim, 'p1', 'c1', 'rejected', 'me', now);
  assert.equal(decided[0].status, 'open');
  assert.equal(decided[0].claims[0].status, 'rejected');
});
test('他人不能处理认领申请，重复处理保持不变', () => {
  const withClaim = Claims.submitClaim([post()], 'p1', claim());
  assert.throws(
    () => Claims.decideClaim(withClaim, 'p1', 'c1', 'accepted', 'someone', now),
    (e) => e.code === 'FORBIDDEN'
  );
  const done = Claims.decideClaim(withClaim, 'p1', 'c1', 'accepted', 'me', now);
  assert.deepEqual(Claims.decideClaim(done, 'p1', 'c1', 'rejected', 'me', now), done);
});
