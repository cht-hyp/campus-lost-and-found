// 可选的响应式验收：用实际 Chrome 检查页面溢出及导航可点击性。
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

(async () => {
  const project = path.resolve(__dirname, '..');
  const output = path.join(project, 'artifacts');
  await fs.mkdir(output, { recursive: true });
  const url = pathToFileURL(path.join(project, 'index.html')).href;
  const browser = await chromium.launch({
    executablePath:
      process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true
  });
  const checks = [];
  try {
    const context = await browser.newContext({ locale: 'zh-CN', timezoneId: 'Asia/Shanghai' });
    await context.setOffline(true);
    const page = await context.newPage();
    for (const width of [320, 390, 768, 960, 1024, 1200, 1440, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of [
        'home',
        'search?category=生活用品',
        'publish',
        'detail/demo-1',
        'mine'
      ]) {
        await page.goto(url + '#/' + route);
        await page.waitForSelector('.page-heading');
        const geometry = await page.evaluate(() => ({
          overflow: document.documentElement.scrollWidth > innerWidth,
          navigation: [...document.querySelectorAll('.main-nav a')].every((link) => {
            const rect = link.getBoundingClientRect();
            const hit = document.elementFromPoint(
              rect.x + rect.width / 2,
              rect.y + rect.height / 2
            );
            return (
              rect.x >= 0 &&
              rect.right <= innerWidth &&
              rect.bottom <= innerHeight &&
              link.contains(hit)
            );
          })
        }));
        assert.equal(geometry.overflow, false, `${width}px ${route} 横向溢出`);
        assert.equal(geometry.navigation, true, `${width}px ${route} 导航被遮挡`);
        checks.push(`${width}px ${route}`);
      }
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    for (const [route, file] of [
      ['home', 'layout-home-desktop.png'],
      ['publish', 'layout-publish-desktop.png'],
      ['detail/demo-1', 'layout-detail-desktop.png']
    ]) {
      await page.goto(url + '#/' + route);
      await page.waitForSelector('.page-heading');
      await page.screenshot({
        path: path.join(output, file),
        fullPage: true,
        animations: 'disabled'
      });
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(url + '#/home');
    await page.waitForSelector('.post-card');
    await page.screenshot({
      path: path.join(output, 'layout-home-mobile.png'),
      fullPage: true,
      animations: 'disabled'
    });
    await fs.writeFile(
      path.join(output, 'layout-results.json'),
      JSON.stringify(
        {
          checkedAt: new Date().toISOString(),
          browser: await browser.version(),
          offline: true,
          passed: checks.length,
          checks
        },
        null,
        2
      )
    );
    console.log(`Layout checks: ${checks.length} passed across 8 viewport widths`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
