(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CampusCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const CATEGORIES = Object.freeze([
    '证件卡片',
    '数码设备',
    '钥匙',
    '包袋',
    '衣物饰品',
    '生活用品',
    '书本文具',
    '其他'
  ]);
  const LOCATIONS = Object.freeze(['图书馆', '教学楼', '食堂', '宿舍', '操场', '校门']);
  const LIMITS = Object.freeze({ title: 60, location: 80, description: 1000, contact: 100 });
  const LABELS = {
    title: '物品名称',
    category: '物品类别',
    location: '地点',
    occurredAt: '时间',
    description: '物品描述',
    contact: '联系方式'
  };

  class DomainError extends Error {
    constructor(code, message, errors) {
      super(message);
      this.name = 'DomainError';
      this.code = code;
      this.errors = errors || {};
    }
  }

  function text(value) {
    return typeof value === 'string' ? value.trim() : '';
  }

  function parseLocalDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
    const [year, month, day, hour, minute] = value.match(/\d+/g).map(Number);
    if (year < 2000 || month < 1 || month > 12 || hour > 23 || minute > 59) return null;
    const result = new Date(year, month - 1, day, hour, minute);
    if (
      result.getFullYear() !== year ||
      result.getMonth() !== month - 1 ||
      result.getDate() !== day
    )
      return null;
    return result;
  }

  function validatePost(input, now = new Date()) {
    input = input || {};
    const errors = {};
    if (input.type !== 'lost' && input.type !== 'found') errors.type = '请选择寻物或招领';
    Object.keys(LABELS).forEach((field) => {
      const value = text(input[field]);
      if (!value) errors[field] = `请填写${LABELS[field]}`;
      else if (LIMITS[field] && value.length > LIMITS[field])
        errors[field] = `${LABELS[field]}不能超过 ${LIMITS[field]} 个字符`;
    });
    if (text(input.category) && !CATEGORIES.includes(text(input.category)))
      errors.category = '请选择有效的物品类别';
    if (text(input.occurredAt)) {
      const date = parseLocalDate(text(input.occurredAt));
      if (!date) errors.occurredAt = '请填写有效的日期和时间';
      else if (date > now) errors.occurredAt = '时间不能晚于现在';
    }
    return errors;
  }

  function validatedFields(input, now) {
    const errors = validatePost(input, now);
    if (Object.keys(errors).length) throw new DomainError('VALIDATION', '请检查填写的信息', errors);
    const result = { type: input.type };
    Object.keys(LABELS).forEach((field) => {
      result[field] = text(input[field]);
    });
    return result;
  }

  function makeId() {
    return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  }

  function createPost(input, ownerId, options = {}) {
    if (!text(ownerId))
      throw new DomainError('OWNER_REQUIRED', '无法识别本地发布者，请检查浏览器存储');
    const now = options.now || new Date();
    return {
      ...validatedFields(input, now),
      id: options.id || makeId(),
      ownerId,
      status: 'open',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };
  }

  function assertOwner(post, ownerId) {
    if (!post) throw new DomainError('NOT_FOUND', '这条信息不存在');
    if (!text(ownerId) || post.ownerId !== ownerId)
      throw new DomainError('FORBIDDEN', '只能管理当前浏览器发布的信息');
  }

  function editPost(post, input, ownerId, now = new Date()) {
    assertOwner(post, ownerId);
    const fields = validatedFields({ ...input, type: post.type }, now);
    return { ...post, ...fields, updatedAt: now.toISOString() };
  }

  function resolvePost(post, ownerId, now = new Date()) {
    assertOwner(post, ownerId);
    if (post.status === 'resolved') return { ...post };
    return { ...post, status: 'resolved', updatedAt: now.toISOString() };
  }

  function statusLabel(post) {
    if (post.type === 'lost') return post.status === 'resolved' ? '已找到' : '寻找中';
    return post.status === 'resolved' ? '已归还' : '待认领';
  }

  function filterPosts(posts, filters = {}) {
    const keyword = text(filters.keyword).toLocaleLowerCase();
    const location = text(filters.location).toLocaleLowerCase();
    return posts
      .filter(
        (post) =>
          (!filters.type || filters.type === 'all' || post.type === filters.type) &&
          (!filters.category || post.category === filters.category) &&
          (!location || post.location.toLocaleLowerCase().includes(location)) &&
          (!filters.ownerId || post.ownerId === filters.ownerId) &&
          (!keyword ||
            [post.title, post.location, post.description].some((value) =>
              value.toLocaleLowerCase().includes(keyword)
            ))
      )
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }

  return {
    CATEGORIES,
    LOCATIONS,
    LIMITS,
    DomainError,
    validatePost,
    createPost,
    editPost,
    resolvePost,
    statusLabel,
    filterPosts,
    makeId
  };
});
