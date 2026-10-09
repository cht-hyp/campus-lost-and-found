const test = require('node:test');
const assert = require('node:assert/strict');
const { serialize, parse, merge } = require('../js/backup.js');

function record(overrides = {}) {
  return {
    id: 'p1',
    ownerId: 'me',
    type: 'lost',
    status: 'open',
    title: '校园卡',
    category: '证件卡片',
    location: '图书馆',
    occurredAt: '2026-10-01T10:00',
    description: '蓝色卡套',
    contact: 'QQ：12345678',
    createdAt: '2026-10-01T03:00:00.000Z',
    updatedAt: '2026-10-01T03:00:00.000Z',
    ...overrides
  };
}
const state = { version: 1, ownerId: 'me', posts: [record()] };
const stamp = new Date('2026-10-09T00:00:00Z');

test('导出可被完整解析，往返不丢字段', () => {
  const parsed = parse(serialize(state, stamp));
  assert.equal(parsed.ownerId, 'me');
  assert.equal(parsed.posts.length, 1);
  assert.equal(parsed.posts[0].title, '校园卡');
});
test('导出时间戳与版本写入 JSON', () => {
  const payload = JSON.parse(serialize(state, stamp));
  assert.equal(payload.app, 'campus-lost-and-found');
  assert.equal(payload.schemaVersion, 1);
  assert.equal(payload.exportedAt, '2026-10-09T00:00:00.000Z');
});
test('拒绝非 JSON 文本', () => {
  assert.throws(() => parse('{broken'), (e) => e.code === 'IMPORT_INVALID');
});
test('拒绝非本应用或版本不兼容的备份', () => {
  const other = { app: 'other', schemaVersion: 1, ownerId: 'me', posts: [] };
  const newer = { app: 'campus-lost-and-found', schemaVersion: 2, ownerId: 'me', posts: [] };
  assert.throws(() => parse(JSON.stringify(other)), (e) => e.code === 'IMPORT_INVALID');
  assert.throws(() => parse(JSON.stringify(newer)), (e) => e.code === 'IMPORT_INVALID');
});
test('拒绝内容损坏的备份', () => {
  const bad = {
    app: 'campus-lost-and-found',
    schemaVersion: 1,
    ownerId: 'me',
    posts: [record({ status: 'invalid' })]
  };
  assert.throws(() => parse(JSON.stringify(bad)), (e) => e.code === 'IMPORT_INVALID');
});
test('合并时导入记录按编号覆盖，本机记录保留', () => {
  const current = {
    version: 1,
    ownerId: 'local',
    posts: [record({ id: 'a', title: '旧A' }), record({ id: 'b', title: '本机B' })]
  };
  const incoming = {
    version: 1,
    ownerId: 'remote',
    posts: [record({ id: 'a', title: '新A' }), record({ id: 'c', title: '导入C' })]
  };
  const merged = merge(current, incoming);
  const titles = Object.fromEntries(merged.posts.map((p) => [p.id, p.title]));
  assert.equal(titles.a, '新A');
  assert.equal(titles.b, '本机B');
  assert.equal(titles.c, '导入C');
  assert.equal(merged.posts.length, 3);
});
test('合并后采用备份中的匿名身份', () => {
  const merged = merge(
    { version: 1, ownerId: 'local', posts: [] },
    { version: 1, ownerId: 'remote', posts: [record()] }
  );
  assert.equal(merged.ownerId, 'remote');
});
