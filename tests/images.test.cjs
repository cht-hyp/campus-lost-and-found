const test = require('node:test');
const assert = require('node:assert/strict');
const Images = require('../js/images.js');

for (const type of ['image/jpeg', 'image/png', 'image/webp']) {
  test(`允许选择 ${type}`, () => {
    assert.doesNotThrow(() => Images.validateFile({ type, size: 1024 }));
  });
}
test('允许恰好 10 MB，拒绝超过 10 MB', () => {
  assert.doesNotThrow(() => Images.validateFile({ type: 'image/png', size: 10485760 }));
  assert.throws(() => Images.validateFile({ type: 'image/png', size: 10485761 }), /10 MB/);
});
test('不接受 SVG、文本和没有类型的文件', () => {
  for (const type of ['image/svg+xml', 'text/plain', '']) {
    assert.throws(() => Images.validateFile({ type, size: 1024 }), /JPG、PNG 或 WebP/);
  }
});
test('空文件与缺少文件给出明确错误', () => {
  assert.throws(() => Images.validateFile({ type: 'image/png', size: 0 }), /空文件/);
  assert.throws(() => Images.validateFile(null), /请选择/);
});
test('横图按比例缩小至 1200 像素', () => {
  assert.deepEqual(Images.fitDimensions(2400, 1600), { width: 1200, height: 800 });
});
test('竖图按比例缩小且小图不放大', () => {
  assert.deepEqual(Images.fitDimensions(1000, 2000), { width: 600, height: 1200 });
  assert.deepEqual(Images.fitDimensions(320, 240), { width: 320, height: 240 });
});
test('极窄图最小一像素，非法尺寸被拒绝', () => {
  assert.deepEqual(Images.fitDimensions(1, 10000), { width: 1, height: 1200 });
  assert.throws(() => Images.fitDimensions(0, 100), /尺寸/);
  assert.throws(() => Images.fitDimensions(Infinity, 100), /尺寸/);
});
