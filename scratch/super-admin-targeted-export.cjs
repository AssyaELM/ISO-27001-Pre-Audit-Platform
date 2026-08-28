const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--allow-file-access-from-files'],
  });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1 });
  const root = path.resolve('mockups/super-admin');
  const url = `file:///${path.join(root, 'index.html').replace(/\\/g, '/')}`;
  const screens = [
    ['settings', 'normcore-super-admin-settings-high-fidelity.png'],
    ['empty-states', 'normcore-super-admin-empty-states-high-fidelity.png'],
    ['feedback-states', 'normcore-super-admin-feedback-states-high-fidelity.png'],
  ];
  for (const [screen, filename] of screens) {
    await page.goto(`${url}?screen=${screen}`, { waitUntil: 'load' });
    await page.screenshot({ path: path.join(root, 'exports', filename), fullPage: true });
    console.log(`${screen}: ${await page.locator('.screen.active h1').first().textContent()}`);
  }
  await browser.close();
})();
