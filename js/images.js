(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./core.js'));
  else root.CampusImages = factory(root.CampusCore);
})(globalThis, function (Core) {
  'use strict';
  const TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  const MAX_FILE_BYTES = 10 * 1024 * 1024;
  const MAX_PIXELS = 24000000;

  function validateFile(file) {
    if (!file) throw new Error('请选择图片');
    if (!TYPES.includes(String(file.type).toLowerCase()))
      throw new Error('请选择 JPG、PNG 或 WebP 图片');
    if (!Number.isFinite(file.size) || file.size <= 0) throw new Error('不能使用空文件');
    if (file.size > MAX_FILE_BYTES) throw new Error('图片不能超过 10 MB');
  }

  function fitDimensions(width, height, maxSide = 1200) {
    if (![width, height, maxSide].every((n) => Number.isFinite(n) && n > 0))
      throw new Error('图片尺寸不正确');
    const scale = Math.min(1, maxSide / Math.max(width, height));
    return {
      width: Math.max(1, Math.round(width * scale)),
      height: Math.max(1, Math.round(height * scale))
    };
  }

  async function preparePhoto(file) {
    validateFile(file);
    const url = URL.createObjectURL(file);
    try {
      const image = await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () =>
          reject(new Error('无法读取这张图片，请选择有效的 JPG、PNG 或 WebP 文件'));
        img.src = url;
      });
      if (image.naturalWidth * image.naturalHeight > MAX_PIXELS)
        throw new Error('图片分辨率过高，请选择 2400 万像素以内的图片');
      const canvas = document.createElement('canvas');
      let maxSide = 1200;
      let quality = 0.84;
      for (let attempt = 0; attempt < 8; attempt += 1) {
        const size = fitDimensions(image.naturalWidth, image.naturalHeight, maxSide);
        canvas.width = size.width;
        canvas.height = size.height;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('浏览器暂时无法处理图片，请重试');
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, size.width, size.height);
        context.drawImage(image, 0, 0, size.width, size.height);
        const result = canvas.toDataURL('image/jpeg', quality);
        if (result.startsWith('data:image/jpeg;base64,') && result.length <= Core.MAX_IMAGE_LENGTH)
          return result;
        if (quality > 0.5) quality -= 0.16;
        else {
          maxSide = Math.round(maxSide * 0.75);
          quality = 0.72;
        }
      }
      throw new Error('图片无法压缩到可保存的大小，请换一张图片');
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  return { validateFile, fitDimensions, preparePhoto };
});
