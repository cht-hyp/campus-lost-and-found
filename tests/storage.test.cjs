const test = require('node:test');
const assert = require('node:assert/strict');
const Core = require('../js/core.js');
const { createRepository, STORAGE_KEY } = require('../js/storage.js');

function memoryStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    }
  };
}
function record(overrides = {}) {
  return {
    id: 'p1',
    ownerId: 'someone-else',
    type: 'lost',
    status: 'open',
    title: '校园卡',
    category: '证件卡片',
    location: '图书馆',
    occurredAt: '2024-01-01T10:00',
    description: '蓝色卡套',
    contact: 'QQ：12345678',
    createdAt: '2024-01-01T03:00:00.000Z',
    updatedAt: '2024-01-01T03:00:00.000Z',
    ...overrides
  };
}
function repository(storage, options = {}) {
  return createRepository(storage, {
    idFactory: () => 'local-owner',
    seedPosts: [record()],
    ...options
  });
}

test('首次启动保存匿名身份及示例，示例不属于当前用户', () => {
  const storage = memoryStorage();
  const state = repository(storage).load();
  assert.equal(state.version, 1);
  assert.equal(state.ownerId, 'local-owner');
  assert.equal(state.posts.length, 1);
  assert.notEqual(state.posts[0].ownerId, state.ownerId);
  assert.equal(JSON.parse(storage.getItem(STORAGE_KEY)).ownerId, 'local-owner');
});
test('再次加载保留原身份，不重复添加示例', () => {
  const storage = memoryStorage();
  repository(storage).load();
  const state = repository(storage, { idFactory: () => 'different-owner' }).load();
  assert.equal(state.ownerId, 'local-owner');
  assert.equal(state.posts.length, 1);
});
test('发布记录在重新创建仓库后仍可读取', () => {
  const storage = memoryStorage();
  const repo = repository(storage);
  const state = repo.load();
  const created = Core.createPost(
    record({ title: '新发布钥匙', category: '钥匙' }),
    state.ownerId,
    { id: 'new' }
  );
  repo.save({ ...state, posts: [...state.posts, created] });
  const reloaded = repository(storage).load();
  assert.equal(reloaded.posts.length, 2);
  assert.equal(reloaded.posts[1].title, '新发布钥匙');
});
test('已完成状态和编辑内容跨仓库加载保持一致', () => {
  const storage = memoryStorage();
  const repo = repository(storage);
  const state = repo.load();
  const own = record({ ownerId: state.ownerId, type: 'found' });
  const resolved = Core.resolvePost(own, state.ownerId);
  const edited = Core.editPost(resolved, { ...own, title: '带蓝色卡套的校园卡' }, state.ownerId);
  repo.save({ ...state, posts: [edited] });
  const saved = repository(storage).load().posts[0];
  assert.equal(saved.title, '带蓝色卡套的校园卡');
  assert.equal(Core.statusLabel(saved), '已归还');
});
test('浏览器拒绝读取时返回明确错误', () => {
  const storage = {
    getItem() {
      throw new Error('SecurityError');
    }
  };
  assert.throws(
    () => repository(storage).load(),
    (e) => e.code === 'STORAGE_READ'
  );
});
test('首次初始化无法保存时不伪造成功', () => {
  const storage = {
    getItem() {
      return null;
    },
    setItem() {
      throw new Error('QuotaExceededError');
    }
  };
  assert.throws(
    () => repository(storage).load(),
    (e) => e.code === 'STORAGE_WRITE'
  );
});
test('保存失败不会破坏之前保存的数据', () => {
  const storage = memoryStorage();
  const repo = repository(storage);
  const state = repo.load();
  const previous = storage.getItem(STORAGE_KEY);
  storage.setItem = () => {
    throw new Error('QuotaExceededError');
  };
  assert.throws(
    () => repo.save({ ...state, posts: [] }),
    (e) => e.code === 'STORAGE_WRITE'
  );
  assert.equal(storage.getItem(STORAGE_KEY), previous);
});
test('损坏 JSON 不会被示例数据静默覆盖', () => {
  const storage = memoryStorage();
  storage.setItem(STORAGE_KEY, '{broken');
  assert.throws(
    () => repository(storage).load(),
    (e) => e.code === 'STORAGE_CORRUPT'
  );
  assert.equal(storage.getItem(STORAGE_KEY), '{broken');
});
for (const [name, badState] of [
  ['未知版本', { version: 2, ownerId: 'me', posts: [] }],
  ['缺少身份', { version: 1, ownerId: '', posts: [] }],
  ['记录数组类型错误', { version: 1, ownerId: 'me', posts: {} }],
  ['未知完成状态', { version: 1, ownerId: 'me', posts: [record({ status: 'invalid' })] }],
  ['重复编号', { version: 1, ownerId: 'me', posts: [record(), record()] }],
  ['恶意对象字段', { version: 1, ownerId: 'me', posts: [record({ title: { html: '<script>' } })] }],
  ['非法时间戳', { version: 1, ownerId: 'me', posts: [record({ createdAt: 'not-a-date' })] }]
]) {
  test(`拒绝${name}并保留原数据`, () => {
    const storage = memoryStorage();
    const original = JSON.stringify(badState);
    storage.setItem(STORAGE_KEY, original);
    assert.throws(
      () => repository(storage).load(),
      (e) => e.code === 'STORAGE_CORRUPT'
    );
    assert.equal(storage.getItem(STORAGE_KEY), original);
  });
}
test('HTML 字样作为普通文本原样保存，不篡改用户内容', () => {
  const storage = memoryStorage();
  const repo = repository(storage);
  const state = repo.load();
  repo.save({ ...state, posts: [record({ title: '<img src=x onerror=alert(1)>' })] });
  assert.equal(repo.load().posts[0].title, '<img src=x onerror=alert(1)>');
});

test('照片和完成状态持久化，旧的无图片记录仍可读取', () => {
  const storage = memoryStorage();
  const repo = repository(storage);
  const state = repo.load();
  assert.equal(state.posts[0].image, undefined);
  const image = 'data:image/jpeg;base64,/9j/2Q==';
  repo.save({ ...state, posts: [record({ image, status: 'resolved' })] });
  const saved = repository(storage).load().posts[0];
  assert.equal(saved.image, image);
  assert.equal(saved.status, 'resolved');
});
test('非法图片数据不会覆盖已经保存的记录', () => {
  const storage = memoryStorage();
  const repo = repository(storage);
  const state = repo.load();
  const original = storage.getItem(STORAGE_KEY);
  assert.throws(
    () => repo.save({ ...state, posts: [record({ image: 'https://example.com/x' })] }),
    (error) => error.code === 'STORAGE_CORRUPT'
  );
  assert.equal(storage.getItem(STORAGE_KEY), original);
});
