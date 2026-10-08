const test = require('node:test');
const assert = require('node:assert/strict');
const Core = require('../js/core.js');

const now = new Date(2026, 9, 8, 14, 0);
const valid = {
  type: 'lost', title: '蓝牙耳机', category: '数码设备', location: '图书馆二楼',
  occurredAt: '2026-10-08T09:30', description: '白色充电盒，右侧有一张蓝色贴纸。',
  contact: '微信：campus_demo'
};
function post(overrides = {}) {
  return {
    id: 'p1', ownerId: 'me', status: 'open', ...valid,
    createdAt: '2026-10-08T02:00:00.000Z', updatedAt: '2026-10-08T02:00:00.000Z',
    ...overrides
  };
}

test('完整寻物信息可以发布，并去除文本首尾空格', () => {
  const item = Core.createPost({ ...valid, title: '  蓝牙耳机  ' }, 'me', { id: 'new1', now });
  assert.equal(item.id, 'new1');
  assert.equal(item.title, '蓝牙耳机');
  assert.equal(item.ownerId, 'me');
  assert.equal(item.type, 'lost');
  assert.equal(item.status, 'open');
  assert.equal(item.createdAt, now.toISOString());
});
test('完整招领信息可以发布', () => {
  assert.equal(Core.createPost({ ...valid, type: 'found' }, 'me', { id: 'f1', now }).type, 'found');
});
for (const field of ['title', 'category', 'location', 'occurredAt', 'description', 'contact']) {
  test(`缺少必填 ${field} 时拒绝发布`, () => {
    const input = { ...valid, [field]: '   ' };
    assert.ok(Core.validatePost(input, now)[field]);
    assert.throws(() => Core.createPost(input, 'me', { now }), e => e.code === 'VALIDATION');
  });
}
test('拒绝未知信息类型和非字符串输入', () => {
  assert.ok(Core.validatePost({ ...valid, type: 'other' }, now).type);
  assert.ok(Core.validatePost({ ...valid, contact: { text: '123' } }, now).contact);
});
test('拒绝不存在的日期', () => {
  assert.ok(Core.validatePost({ ...valid, occurredAt: '2026-02-30T10:00' }, now).occurredAt);
});
test('拒绝未来时间', () => {
  assert.ok(Core.validatePost({ ...valid, occurredAt: '2026-10-09T10:00' }, now).occurredAt);
});
test('超长名称不能发布', () => {
  assert.ok(Core.validatePost({ ...valid, title: '物'.repeat(61) }, now).title);
});
test('联系方式接受 QQ 或微信，不只允许手机号', () => {
  assert.deepEqual(Core.validatePost({ ...valid, contact: 'QQ 12345678，晚间联系' }, now), {});
});
test('没有发布者身份时拒绝创建', () => {
  assert.throws(() => Core.createPost(valid, '', { now }), e => e.code === 'OWNER_REQUIRED');
});

const records = [
  post({ id: 'old', title: '校园卡', category: '证件卡片', location: '第一教学楼', description: '姓名已遮挡', createdAt: '2026-10-06T02:00:00.000Z' }),
  post({ id: 'new', title: 'AirPods 耳机', location: '图书馆', description: '白色充电盒', type: 'found' }),
  post({ id: 'middle', title: '水杯', category: '生活用品', location: '图书馆二楼', description: '蓝色的杯子', createdAt: '2026-10-07T02:00:00.000Z' })
];
test('标题搜索不区分英文大小写并忽略首尾空格', () => {
  assert.deepEqual(Core.filterPosts(records, { keyword: '  airpods ' }).map(p => p.id), ['new']);
});
test('关键词可以匹配地点', () => {
  assert.deepEqual(Core.filterPosts(records, { keyword: '教学楼' }).map(p => p.id), ['old']);
});
test('关键词可以匹配描述', () => {
  assert.deepEqual(Core.filterPosts(records, { keyword: '蓝色' }).map(p => p.id), ['middle']);
});
test('空关键词展示所有记录且按发布时间倒序', () => {
  assert.deepEqual(Core.filterPosts(records, { keyword: ' ' }).map(p => p.id), ['new', 'middle', 'old']);
  assert.equal(records[0].id, 'old');
});
test('没有匹配项时返回空数组', () => {
  assert.deepEqual(Core.filterPosts(records, { keyword: '不存在的物品' }), []);
});
test('类别、地点与类型筛选取交集', () => {
  assert.deepEqual(Core.filterPosts(records, { category: '数码设备', location: '图书馆', type: 'found' }).map(p => p.id), ['new']);
  assert.deepEqual(Core.filterPosts(records, { category: '证件卡片', location: '图书馆' }), []);
});
test('我的发布只返回本人记录，完成记录不会被隐藏', () => {
  assert.deepEqual(Core.filterPosts([post(), post({ id: 'other', ownerId: 'other' }), post({ id: 'done', status: 'resolved' })], { ownerId: 'me' }).map(p => p.id), ['p1', 'done']);
});

test('本人编辑更新资料，保留唯一编号和原始发布时间', () => {
  const original = post();
  const changed = Core.editPost(original, { ...valid, title: '白色耳机', id: 'hacked', ownerId: 'other' }, 'me', now);
  assert.equal(changed.title, '白色耳机');
  assert.equal(changed.id, 'p1');
  assert.equal(changed.ownerId, 'me');
  assert.equal(changed.createdAt, '2026-10-08T02:00:00.000Z');
  assert.equal(original.title, '蓝牙耳机');
});
test('编辑资料不重置已完成状态，也不更改发布类型', () => {
  const changed = Core.editPost(post({ status: 'resolved' }), { ...valid, type: 'found', status: 'open' }, 'me', now);
  assert.equal(changed.status, 'resolved');
  assert.equal(changed.type, 'lost');
});
test('他人不能编辑记录', () => {
  assert.throws(() => Core.editPost(post(), valid, 'other', now), e => e.code === 'FORBIDDEN');
});
test('他人不能完成记录', () => {
  assert.throws(() => Core.resolvePost(post(), 'other', now), e => e.code === 'FORBIDDEN');
});
test('寻物完成后显示已找到，原对象不被修改', () => {
  const original = post();
  const resolved = Core.resolvePost(original, 'me', now);
  assert.equal(resolved.status, 'resolved');
  assert.equal(Core.statusLabel(resolved), '已找到');
  assert.equal(original.status, 'open');
});
test('招领完成后显示已归还', () => {
  assert.equal(Core.statusLabel(Core.resolvePost(post({ type: 'found' }), 'me', now)), '已归还');
});
test('进行中的寻物与招领具有不同标签', () => {
  assert.equal(Core.statusLabel(post()), '寻找中');
  assert.equal(Core.statusLabel(post({ type: 'found' })), '待认领');
});
test('重复完成不改变完成时间', () => {
  const resolved = Core.resolvePost(post(), 'me', now);
  assert.deepEqual(Core.resolvePost(resolved, 'me', new Date(2026, 9, 8, 15)), resolved);
});
test('对不存在记录的操作具有明确错误', () => {
  assert.throws(() => Core.resolvePost(null, 'me', now), e => e.code === 'NOT_FOUND');
});
