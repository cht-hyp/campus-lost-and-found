(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CampusStats = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  function countBy(posts, key) {
    const counts = {};
    posts.forEach((post) => {
      const value = post[key] || '未分类';
      counts[value] = (counts[value] || 0) + 1;
    });
    return counts;
  }

  function summarize(posts) {
    const total = posts.length;
    const resolved = posts.filter((post) => post.status === 'resolved').length;
    const lost = posts.filter((post) => post.type === 'lost').length;
    return {
      total,
      open: total - resolved,
      resolved,
      lost,
      found: total - lost,
      recoveredRate: total ? Math.round((resolved / total) * 100) : 0,
      byCategory: countBy(posts, 'category'),
      byLocation: countBy(posts, 'location')
    };
  }

  return { summarize };
});
