const test = require('node:test');
const assert = require('node:assert/strict');
const UI = require('../js/ui.js');

test('用户 HTML 和引号在页面中成为普通文字', () => {
  assert.equal(
    UI.escapeHTML('<img src="x" onerror=\'alert(1)\'>&'),
    '&lt;img src=&quot;x&quot; onerror=&#39;alert(1)&#39;&gt;&amp;'
  );
});
test('空 hash 进入首页', () => {
  assert.equal(UI.parseRoute('').name, 'home');
});
test('详情路由解码编号并保留查询条件', () => {
  const route = UI.parseRoute('#/detail/a%20b?type=found');
  assert.equal(route.name, 'detail');
  assert.equal(route.id, 'a b');
  assert.equal(route.params.get('type'), 'found');
});
test('非法编码及多余路径进入未找到页而不是使应用崩溃', () => {
  assert.equal(UI.parseRoute('#/detail/%E0%A4').name, 'not-found');
  assert.equal(UI.parseRoute('#/detail/one/extra').name, 'not-found');
  assert.equal(UI.parseRoute('#/unknown').name, 'not-found');
});
test('查询链接正确编码中文与 &，往返保留关键词', () => {
  const route = UI.parseRoute(
    UI.searchHash({ keyword: '钥匙 & 卡', category: '钥匙', location: '图书馆', type: 'found' })
  );
  const filters = UI.searchFilters(route.params);
  assert.deepEqual(filters, {
    keyword: '钥匙 & 卡',
    category: '钥匙',
    location: '图书馆',
    type: 'found',
    sort: '',
    dateFrom: '',
    dateTo: ''
  });
});
test('未知类型不作为筛选条件隐藏所有记录', () => {
  assert.equal(UI.searchFilters(new URLSearchParams('type=invalid')).type, 'all');
});
test('剪贴板写入成功后才返回成功', async () => {
  let saved = '';
  const result = await UI.copyContact('QQ 12345678', {
    async writeText(value) {
      saved = value;
    }
  });
  assert.equal(result.copied, true);
  assert.equal(saved, 'QQ 12345678');
});
test('剪贴板拒绝时保留可人工复制的完整文本', async () => {
  const result = await UI.copyContact('微信：demo', {
    async writeText() {
      throw new Error('NotAllowedError');
    }
  });
  assert.deepEqual(result, { copied: false, text: '微信：demo' });
});
test('没有剪贴板 API 时同样提供人工复制文本', async () => {
  assert.deepEqual(await UI.copyContact('QQ 123', undefined), { copied: false, text: 'QQ 123' });
});
test('排序与日期范围在查询链接中往返保留', () => {
  const route = UI.parseRoute(
    UI.searchHash({ sort: 'occurred', dateFrom: '2026-10-01', dateTo: '2026-10-08' })
  );
  assert.deepEqual(UI.searchFilters(route.params), {
    keyword: '',
    category: '',
    location: '',
    type: 'all',
    sort: 'occurred',
    dateFrom: '2026-10-01',
    dateTo: '2026-10-08'
  });
});
test('非法排序与日期被忽略', () => {
  const filters = UI.searchFilters(new URLSearchParams('sort=hacked&from=not-a-date&to=2026-13-99'));
  assert.equal(filters.sort, '');
  assert.equal(filters.dateFrom, '');
  assert.equal(filters.dateTo, '');
});
