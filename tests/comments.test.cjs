const test = require('node:test');
const assert = require('node:assert/strict');
const Comments = require('../js/comments.js');

const now = new Date('2026-10-09T00:00:00Z');

test('有效留言可以创建并去除首尾空格', () => {
  const c = Comments.createComment({ postId: 'p1', authorId: 'me', text: '  蓝色卡套  ' }, now);
  assert.equal(c.text, '蓝色卡套');
  assert.equal(c.postId, 'p1');
  assert.equal(c.authorId, 'me');
  assert.equal(c.createdAt, now.toISOString());
  assert.ok(c.id);
});
test('空留言与超长留言被拒绝', () => {
  assert.ok(Comments.validateComment({ postId: 'p1', authorId: 'me', text: '   ' }, now).text);
  assert.ok(Comments.validateComment({ postId: 'p1', authorId: 'me', text: '字'.repeat(201) }, now).text);
  assert.throws(
    () => Comments.createComment({ postId: 'p1', authorId: 'me', text: '' }, now),
    (e) => e.code === 'VALIDATION'
  );
});
test('缺少信息或作者时拒绝', () => {
  assert.ok(Comments.validateComment({ text: 'x' }, now).postId);
  assert.ok(Comments.validateComment({ postId: 'p1', text: 'x' }, now).authorId);
});
test('留言追加到指定信息，其他信息不变', () => {
  const comment = { id: 'c1', postId: 'p1', authorId: 'me', text: 'hello', createdAt: now.toISOString() };
  const next = Comments.addComment([{ id: 'p1' }, { id: 'p2' }], 'p1', comment);
  assert.deepEqual(next[0].comments, [comment]);
  assert.equal(next[1].comments, undefined);
  assert.equal(next[0].id, 'p1');
});
test('对已有留言的信息继续追加', () => {
  const first = { id: 'c1', postId: 'p1', authorId: 'me', text: '一', createdAt: now.toISOString() };
  const second = { id: 'c2', postId: 'p1', authorId: 'me', text: '二', createdAt: now.toISOString() };
  const once = Comments.addComment([{ id: 'p1', comments: [first] }], 'p1', second);
  assert.deepEqual(once[0].comments, [first, second]);
});
test('给不存在的消息留言报错', () => {
  assert.throws(
    () => Comments.addComment([{ id: 'p1' }], 'nope', { id: 'c1' }),
    (e) => e.code === 'NOT_FOUND'
  );
});
