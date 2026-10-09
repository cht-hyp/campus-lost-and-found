const test = require('node:test');
const assert = require('node:assert/strict');
const Stats = require('../js/stats.js');

test('空列表返回全零统计', () => {
  assert.deepEqual(Stats.summarize([]), {
    total: 0,
    open: 0,
    resolved: 0,
    lost: 0,
    found: 0,
    recoveredRate: 0,
    byCategory: {},
    byLocation: {}
  });
});
test('统计类型、状态与找回率', () => {
  const posts = [
    { type: 'lost', status: 'open', category: '证件卡片', location: '图书馆' },
    { type: 'found', status: 'resolved', category: '证件卡片', location: '图书馆' },
    { type: 'lost', status: 'resolved', category: '钥匙', location: '食堂' }
  ];
  const s = Stats.summarize(posts);
  assert.equal(s.total, 3);
  assert.equal(s.open, 1);
  assert.equal(s.resolved, 2);
  assert.equal(s.lost, 2);
  assert.equal(s.found, 1);
  assert.equal(s.recoveredRate, 67);
  assert.deepEqual(s.byCategory, { 证件卡片: 2, 钥匙: 1 });
  assert.deepEqual(s.byLocation, { 图书馆: 2, 食堂: 1 });
});
test('找回率四舍五入到整数百分比', () => {
  const one = [{ type: 'lost', status: 'resolved', category: '其他', location: '校门' }];
  assert.equal(Stats.summarize(one).recoveredRate, 100);
  const mixed = [
    { type: 'lost', status: 'open', category: '其他', location: '校门' },
    { type: 'found', status: 'open', category: '其他', location: '校门' },
    { type: 'lost', status: 'resolved', category: '其他', location: '校门' }
  ];
  assert.equal(Stats.summarize(mixed).recoveredRate, 33);
});
test('缺少类别或地点归入未分类', () => {
  const s = Stats.summarize([{ type: 'lost', status: 'open' }]);
  assert.deepEqual(s.byCategory, { 未分类: 1 });
  assert.deepEqual(s.byLocation, { 未分类: 1 });
});
