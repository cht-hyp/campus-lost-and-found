// 可选开发验收工具；网页运行不依赖 Playwright。安装和运行方式见 README。
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

(async () => {
  const project = path.resolve(__dirname, '..');
  const entry = path.resolve(process.env.CAMPUS_ENTRY || path.join(project, 'index.html'));
  const output = path.join(project, 'artifacts');
  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({
    executablePath:
      process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai'
  });
  await context.setOffline(true);
  const page = await context.newPage();
  const errors = [];
  const checks = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.setDefaultTimeout(10000);
  let photoFile;
  let savedPhoto;
  let foundPhoto;
  async function check(name, action) {
    await action();
    checks.push(name);
    console.log(`PASS ${name}`);
  }
  async function menu(name) {
    await page.locator('.main-nav').getByRole('link', { name, exact: true }).click();
  }
  async function fillPost(title, type = 'lost') {
    await page.getByLabel(type === 'found' ? '招领' : '寻物', { exact: true }).check();
    await page.getByLabel('物品名称', { exact: false }).fill(title);
    await page
      .getByLabel('物品类别', { exact: false })
      .selectOption(type === 'found' ? '生活用品' : '数码设备');
    await page
      .getByLabel(type === 'found' ? '拾取地点' : '遗失地点', { exact: false })
      .fill(type === 'found' ? '东区食堂门口' : '图书馆二楼');
    await page
      .getByLabel(type === 'found' ? '拾取时间' : '遗失时间', { exact: false })
      .fill('2024-01-01T10:00');
    await page
      .getByLabel('物品描述', { exact: false })
      .fill('白色物品，蓝色贴纸。<img src=x onerror="window.injected=1">');
    await page.locator('#post-form').getByLabel('联系方式', { exact: false }).fill('微信：qa_demo');
  }

  try {
    await check('Chrome 直接打开 HTML，初始化 8 条示例', async () => {
      await page.goto(pathToFileURL(entry).href);
      await page.getByRole('heading', { name: '校园失物招领', exact: true }).waitFor();
      await page.waitForSelector('.post-card');
      assert.equal(await page.locator('.post-card').count(), 8);
      assert.ok(page.url().startsWith('file:'));
      await page.screenshot({ path: path.join(output, 'home-desktop.png'), fullPage: true });
      // 由浏览器绘制固定测试样本，确保真实走解码、压缩与存储流程。
      const png = await page.evaluate(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 2400;
        canvas.height = 1600;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#e6eef5';
        ctx.fillRect(0, 0, 2400, 1600);
        ctx.fillStyle = '#6c94b9';
        ctx.fillRect(850, 400, 700, 850);
        ctx.fillStyle = '#d2e0ed';
        ctx.fillRect(950, 500, 140, 650);
        ctx.fillStyle = '#456b8e';
        ctx.fillRect(850, 300, 700, 150);
        return canvas.toDataURL('image/png').split(',')[1];
      });
      photoFile = {
        name: '验收物品.png',
        mimeType: 'image/png',
        buffer: Buffer.from(png, 'base64')
      };
    });
    await check('空表单显示字段错误', async () => {
      await page.getByRole('link', { name: '发布信息', exact: true }).first().click();
      await page.getByRole('button', { name: '立即发布', exact: true }).click();
      await page.locator('[data-error-for="title"]').filter({ hasText: '请填写' }).waitFor();
      await page.getByRole('button', { name: '取消', exact: true }).click();
      await menu('发布信息');
    });
    await check('未上传照片时默认图片随类别切换', async () => {
      assert.equal(await page.locator('[data-action="remove-photo"]').isVisible(), false);
      await page.getByLabel('物品类别', { exact: false }).selectOption('钥匙');
      await page.locator('#photo-preview svg[data-category="钥匙"]').waitFor();
      await page.getByLabel('物品类别', { exact: false }).selectOption('书本文具');
      await page.locator('#photo-preview svg[data-category="书本文具"]').waitFor();
    });
    await check('选择照片生成预览并按比例压缩', async () => {
      await page.locator('#post-photo').setInputFiles(photoFile);
      await page.locator('#photo-preview .item-photo').waitFor();
      savedPhoto = await page.locator('#post-image').inputValue();
      assert.ok(savedPhoto.startsWith('data:image/jpeg;base64,'));
      assert.ok(savedPhoto.length <= 360000);
      assert.deepEqual(
        await page
          .locator('#photo-preview .item-photo')
          .evaluate((img) => ({ width: img.naturalWidth, height: img.naturalHeight })),
        { width: 1200, height: 800 }
      );
    });
    await check('发布寻物并进入真实详情', async () => {
      await fillPost('验收用蓝牙耳机');
      await page.screenshot({ path: path.join(output, 'publish-desktop.png'), fullPage: true });
      await page.getByRole('button', { name: '立即发布', exact: true }).click();
      await page.getByRole('heading', { name: '发布成功' }).waitFor();
      await page.getByRole('link', { name: '查看这条信息', exact: true }).click();
      await page.getByRole('heading', { name: '验收用蓝牙耳机', exact: true }).waitFor();
      assert.equal(await page.locator('.detail-art .item-photo').getAttribute('src'), savedPhoto);
    });
    await check('用户 HTML 仅显示为文本', async () => {
      assert.equal(await page.evaluate(() => window.injected), undefined);
      assert.ok((await page.locator('.item-description').innerText()).includes('<img'));
    });
    await check('发布者完成寻物，刷新仍为已找到', async () => {
      await page.getByRole('button', { name: '标记为已找到', exact: true }).click();
      await page.getByRole('button', { name: '确认完成', exact: true }).click();
      await page.locator('.status-badge').filter({ hasText: '已找到' }).first().waitFor();
      assert.equal(await page.locator('.detail-art .item-photo').getAttribute('src'), savedPhoto);
      await page.reload();
      await page.locator('.status-badge').filter({ hasText: '已找到' }).first().waitFor();
    });
    await check('编辑已完成信息不重置状态', async () => {
      await page.getByRole('link', { name: '编辑信息', exact: true }).click();
      assert.equal(await page.locator('#post-image').inputValue(), savedPhoto);
      await page.getByLabel('物品名称', { exact: false }).fill('验收用白色耳机');
      await page.getByRole('button', { name: '保存修改', exact: true }).click();
      await page.getByRole('button', { name: '确认保存', exact: true }).click();
      await page.getByRole('heading', { name: '验收用白色耳机', exact: true }).waitFor();
      await page.locator('.status-badge').filter({ hasText: '已找到' }).first().waitFor();
      await page.screenshot({ path: path.join(output, 'detail-desktop.png'), fullPage: true });
    });
    await check('非法类型、损坏图片和超大文件不会替换已有照片', async () => {
      await page.getByRole('link', { name: '编辑信息', exact: true }).click();
      for (const [file, message] of [
        [
          {
            name: 'unsafe.svg',
            mimeType: 'image/svg+xml',
            buffer: Buffer.from('<svg onload="alert(1)"/>')
          },
          '请选择 JPG'
        ],
        [
          { name: 'broken.png', mimeType: 'image/png', buffer: Buffer.from('not an image') },
          '无法读取'
        ],
        [
          { name: 'large.png', mimeType: 'image/png', buffer: Buffer.alloc(10485761) },
          '不能超过 10 MB'
        ]
      ]) {
        await page.locator('#post-photo').setInputFiles(file);
        await page.locator('#error-image').filter({ hasText: message }).waitFor();
        assert.equal(await page.locator('#post-image').inputValue(), savedPhoto);
      }
      await page.getByRole('button', { name: '取消', exact: true }).click();
    });
    await check('只修改照片也会提醒未保存，放弃后原照片保留', async () => {
      await page.getByRole('link', { name: '编辑信息', exact: true }).click();
      await page.getByRole('button', { name: '移除图片', exact: true }).click();
      await menu('首页');
      await page.getByRole('button', { name: '继续编辑', exact: true }).click();
      assert.equal(await page.locator('#post-image').inputValue(), '');
      await page.locator('#photo-preview svg[data-category="数码设备"]').waitFor();
      await page.getByRole('button', { name: '取消', exact: true }).click();
      await page.getByRole('button', { name: '放弃修改', exact: true }).click();
      assert.equal(await page.locator('.detail-art .item-photo').getAttribute('src'), savedPhoto);
    });
    await check('我的发布仅包含当前浏览器记录', async () => {
      await menu('我的发布');
      assert.equal(await page.locator('.post-card').count(), 1);
      assert.ok((await page.locator('.post-card .status-badge').innerText()).includes('已找到'));
      assert.ok((await page.locator('.post-card').innerText()).includes('验收用白色耳机'));
      assert.equal(await page.locator('.post-card .item-photo').getAttribute('src'), savedPhoto);
    });
    await check('未保存离开取消后保留表单', async () => {
      await page.getByRole('link', { name: '编辑信息', exact: true }).click();
      await page.getByLabel('物品名称', { exact: false }).fill('尚未保存的名称');
      await menu('首页');
      await page.getByRole('button', { name: '继续编辑', exact: true }).click();
      assert.equal(
        await page.getByLabel('物品名称', { exact: false }).inputValue(),
        '尚未保存的名称'
      );
    });
    await check('浏览器后退取消后恢复原路由和表单', async () => {
      await page.goBack();
      await page.getByRole('button', { name: '继续编辑', exact: true }).click();
      await page.waitForFunction(() => location.hash.startsWith('#/edit/'));
      await page.locator('#confirm-dialog').waitFor({ state: 'hidden' });
      assert.equal(
        await page.getByLabel('物品名称', { exact: false }).inputValue(),
        '尚未保存的名称'
      );
      await menu('首页');
      await page.getByRole('button', { name: '放弃修改', exact: true }).click();
      await page.waitForSelector('.post-card');
    });
    await check('历史菜单跳过同路由记录后，取消后退仍恢复发布页', async () => {
      const isolated = await browser.newContext();
      await isolated.setOffline(true);
      const historyPage = await isolated.newPage();
      historyPage.setDefaultTimeout(10000);
      await historyPage.goto(pathToFileURL(entry).href);
      const nav = historyPage.locator('.main-nav');
      await nav.getByRole('link', { name: '发布信息', exact: true }).click();
      await nav.getByRole('link', { name: '首页', exact: true }).click();
      await historyPage.evaluate(() => history.go(-2));
      await historyPage.waitForFunction(() => history.state.campusIndex === 0);
      await nav.getByRole('link', { name: '发布信息', exact: true }).click();
      await historyPage.getByLabel('物品名称', { exact: false }).fill('历史跳转后未保存的物品');
      await historyPage.goBack();
      await historyPage.getByRole('button', { name: '继续编辑', exact: true }).click();
      await historyPage.waitForFunction(
        () => location.hash === '#/publish' && history.state.campusIndex === 1
      );
      assert.equal(
        await historyPage.getByLabel('物品名称', { exact: false }).inputValue(),
        '历史跳转后未保存的物品'
      );
      assert.equal(await historyPage.locator('#confirm-dialog').isVisible(), false);
      await isolated.close();
    });
    await check('关键词与类别地点组合筛选', async () => {
      await page.getByRole('searchbox', { name: '搜索物品' }).fill('验收用');
      await page.getByLabel('筛选类别', { exact: true }).selectOption('数码设备');
      await page.getByLabel('筛选地点', { exact: true }).selectOption('图书馆');
      await page.getByRole('button', { name: '搜索', exact: true }).click();
      await page.waitForFunction(() => location.hash.startsWith('#/search'));
      assert.equal(await page.locator('.post-card').count(), 1);
    });
    await check('无结果有提示并可清空筛选', async () => {
      await page.getByRole('searchbox', { name: '搜索物品' }).fill('完全不存在的物品');
      await page.getByRole('button', { name: '搜索', exact: true }).click();
      await page.getByRole('heading', { name: '暂时没有匹配的信息' }).waitFor();
      await page.getByRole('button', { name: '清空筛选', exact: true }).last().click();
      assert.equal(await page.locator('.post-card').count(), 9);
    });
    await check('招领发布及已归还流程', async () => {
      await page.getByRole('link', { name: '发布信息', exact: true }).first().click();
      await fillPost('验收用保温杯', 'found');
      await page.locator('#post-photo').setInputFiles(photoFile);
      await page.locator('#photo-preview .item-photo').waitFor();
      foundPhoto = await page.locator('#post-image').inputValue();
      await page.getByRole('button', { name: '立即发布', exact: true }).click();
      await page.getByRole('link', { name: '查看这条信息', exact: true }).click();
      await page.getByRole('button', { name: '标记为已归还', exact: true }).click();
      await page.getByRole('button', { name: '确认完成', exact: true }).click();
      await page.locator('.status-badge').filter({ hasText: '已归还' }).first().waitFor();
      assert.equal(await page.locator('.detail-art .item-photo').getAttribute('src'), foundPhoto);
    });
    await check('剪贴板被拒绝时可人工复制', async () => {
      await page.evaluate(() =>
        Object.defineProperty(navigator, 'clipboard', {
          configurable: true,
          value: { writeText: () => Promise.reject(new Error('NotAllowedError')) }
        })
      );
      await page.getByRole('button', { name: '复制联系方式', exact: true }).click();
      await page.getByRole('heading', { name: '手动复制联系方式', exact: true }).waitFor();
      assert.equal(await page.locator('#manual-contact').inputValue(), '微信：qa_demo');
      await page.getByRole('button', { name: '关闭', exact: true }).click();
    });
    await check('我的发布按寻物招领筛选，前进后退保留筛选条件', async () => {
      await menu('我的发布');
      assert.equal(await page.locator('.post-card').count(), 2);
      await page.getByRole('button', { name: '寻物', exact: true }).click();
      assert.equal(await page.locator('.post-card').count(), 1);
      assert.ok((await page.locator('.post-card').innerText()).includes('验收用白色耳机'));
      await page.getByRole('button', { name: '招领', exact: true }).click();
      assert.equal(await page.locator('.post-card').count(), 1);
      assert.ok((await page.locator('.post-card').innerText()).includes('验收用保温杯'));
      await page.goBack();
      await page.waitForFunction(() => location.hash === '#/mine?type=lost');
      await page.goForward();
      await page.waitForFunction(() => location.hash === '#/mine?type=found');
      assert.ok((await page.locator('.post-card .status-badge').innerText()).includes('已归还'));
    });
    await check('编辑可更换照片，完成状态保持', async () => {
      await page.getByRole('link', { name: '编辑信息', exact: true }).click();
      const replacement = await page.evaluate(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 300;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#99bbcc';
        ctx.fillRect(0, 0, 300, 200);
        return canvas.toDataURL('image/jpeg').split(',')[1];
      });
      await page.locator('#post-photo').setInputFiles({
        name: '新照片.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from(replacement, 'base64')
      });
      await page.locator('#photo-status').filter({ hasText: '新照片.jpg' }).waitFor();
      const changed = await page.locator('#post-image').inputValue();
      assert.notEqual(changed, foundPhoto);
      await page.getByRole('button', { name: '保存修改', exact: true }).click();
      await page.getByRole('button', { name: '确认保存', exact: true }).click();
      assert.equal(await page.locator('.detail-art .item-photo').getAttribute('src'), changed);
      await page.locator('.status-badge').filter({ hasText: '已归还' }).waitFor();
    });
    await check('移除照片后恢复类别插画，刷新仍保持', async () => {
      await page.getByRole('link', { name: '编辑信息', exact: true }).click();
      await page.getByRole('button', { name: '移除图片', exact: true }).click();
      await page.getByRole('button', { name: '保存修改', exact: true }).click();
      await page.getByRole('button', { name: '确认保存', exact: true }).click();
      await page.locator('.detail-art svg[data-category="生活用品"]').waitFor();
      await page.reload();
      await page.locator('.detail-art svg[data-category="生活用品"]').waitFor();
      await page.locator('.status-badge').filter({ hasText: '已归还' }).waitFor();
    });
    await check('390px 窄屏无横向溢出', async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      await menu('首页');
      await page.locator('#toast').waitFor({ state: 'hidden' });
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        true
      );
      await page.screenshot({ path: path.join(output, 'home-mobile.png') });
      await page.locator('.post-card').first().scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(output, 'list-mobile.png') });
    });
    await check('图片处理期间取消离开保留表单与待处理图片', async () => {
      await menu('发布信息');
      await page.evaluate(() => {
        window.originalPreparePhoto = CampusImages.preparePhoto;
        CampusImages.preparePhoto = (file) =>
          new Promise((resolve, reject) => {
            window.releasePhoto = () => window.originalPreparePhoto(file).then(resolve, reject);
          });
      });
      await page.locator('#post-photo').setInputFiles(photoFile);
      await page.locator('#photo-status').filter({ hasText: '正在处理图片' }).waitFor();
      assert.equal(
        await page.getByRole('button', { name: '立即发布', exact: true }).isDisabled(),
        true
      );
      await menu('首页');
      await page.getByRole('button', { name: '继续编辑', exact: true }).click();
      await page.evaluate(() => window.releasePhoto());
      await page.locator('#photo-preview .item-photo').waitFor();
      await page.evaluate(() => {
        CampusImages.preparePhoto = window.originalPreparePhoto;
      });
      await page.getByRole('button', { name: '取消', exact: true }).click();
      await page.getByRole('button', { name: '放弃修改', exact: true }).click();
    });
    await check('放弃正在处理的图片不会写入下一张新表单', async () => {
      await menu('发布信息');
      await page.evaluate(() => {
        CampusImages.preparePhoto = (file) =>
          new Promise((resolve, reject) => {
            window.releasePhoto = () => window.originalPreparePhoto(file).then(resolve, reject);
          });
      });
      await page.locator('#post-photo').setInputFiles(photoFile);
      await page.locator('#photo-status').filter({ hasText: '正在处理图片' }).waitFor();
      await menu('首页');
      await page.getByRole('button', { name: '放弃修改', exact: true }).click();
      await menu('发布信息');
      await page.evaluate(() => window.releasePhoto());
      await page.evaluate(() => {
        CampusImages.preparePhoto = window.originalPreparePhoto;
      });
      assert.equal(await page.locator('#post-image').inputValue(), '');
      assert.equal(await page.locator('#photo-preview .item-photo').count(), 0);
      assert.equal(
        await page.getByRole('button', { name: '立即发布', exact: true }).isDisabled(),
        false
      );
    });
    await check('保存失败保留输入且不进入成功页', async () => {
      await page.getByRole('link', { name: '发布信息', exact: true }).first().click();
      await fillPost('保存失败的物品');
      await page.locator('#post-photo').setInputFiles(photoFile);
      await page.locator('#photo-preview .item-photo').waitFor();
      await page.setViewportSize({ width: 320, height: 844 });
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        true
      );
      await page.setViewportSize({ width: 390, height: 844 });
      await page.screenshot({ path: path.join(output, 'publish-mobile.png'), fullPage: true });
      await page.evaluate(() => {
        Storage.prototype.setItem = function () {
          throw new Error('QuotaExceededError');
        };
      });
      await page.getByRole('button', { name: '立即发布', exact: true }).click();
      await page.locator('#form-summary').filter({ hasText: '保存失败' }).waitFor();
      assert.equal(
        await page.getByLabel('物品名称', { exact: false }).inputValue(),
        '保存失败的物品'
      );
      assert.ok(page.url().includes('#/publish'));
      assert.ok((await page.locator('#post-image').inputValue()).startsWith('data:image/jpeg;'));
    });
    await check('他人详情不提供管理入口，伪造编辑路径被拒绝', async () => {
      const other = await context.newPage();
      await other.goto(pathToFileURL(entry).href + '#/detail/demo-1');
      await other.getByRole('heading', { name: '蓝牙耳机', exact: true }).waitFor();
      assert.equal(await other.locator('.owner-actions').count(), 0);
      await other.goto(pathToFileURL(entry).href + '#/edit/demo-1');
      await other.getByRole('heading', { name: '暂时无法打开这个页面' }).waitFor();
      assert.equal(await other.locator('#post-form').count(), 0);
      await other.close();
    });
    await check('不存在的记录显示恢复入口', async () => {
      const other = await context.newPage();
      await other.goto(pathToFileURL(entry).href + '#/detail/does-not-exist');
      await other.getByRole('heading', { name: '暂时无法打开这个页面' }).waitFor();
      assert.equal(await other.getByRole('link', { name: '返回首页', exact: true }).count(), 1);
      await other.close();
    });
    await check('损坏的本地数据不会被初始化覆盖', async () => {
      const isolated = await browser.newContext();
      await isolated.addInitScript(() => localStorage.setItem('campus-lost-found:v1', '{broken'));
      const damaged = await isolated.newPage();
      await damaged.goto(pathToFileURL(entry).href);
      await damaged.getByRole('heading', { name: '暂时无法读取本地数据' }).waitFor();
      assert.equal(
        await damaged.evaluate(() => localStorage.getItem('campus-lost-found:v1')),
        '{broken'
      );
      await isolated.close();
    });
    await check('浏览器禁用存储时显示明确提示', async () => {
      const isolated = await browser.newContext();
      await isolated.addInitScript(() =>
        Object.defineProperty(window, 'localStorage', {
          get() {
            throw new DOMException('存储已禁用', 'SecurityError');
          }
        })
      );
      const blocked = await isolated.newPage();
      await blocked.goto(pathToFileURL(entry).href);
      await blocked.getByRole('heading', { name: '暂时无法读取本地数据' }).waitFor();
      await isolated.close();
    });
    await check('浏览器没有未捕获脚本错误', async () => assert.deepEqual(errors, []));
    const report = {
      browser: await browser.version(),
      entry: 'file:// index.html',
      offline: true,
      viewport: '1440x1000 / 390x844',
      passed: checks.length,
      checks,
      errors,
      checkedAt: new Date().toISOString()
    };
    await fs.writeFile(path.join(output, 'browser-results.json'), JSON.stringify(report, null, 2));
    console.log(`Browser checks: ${checks.length} passed, ${errors.length} page errors`);
  } catch (error) {
    await page
      .screenshot({ path: path.join(output, 'failure.png'), fullPage: true })
      .catch(() => {});
    console.error(error);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
