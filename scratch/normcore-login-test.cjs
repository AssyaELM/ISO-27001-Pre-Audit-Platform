const { chromium } = require('playwright');

(async () => {
  const URL = 'http://127.0.0.1:3103';
  const EMAIL = 'usera@qa.com';
  const PASS = 'QaPassword123!';
  const executablePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

  const browser = await chromium.launch({ headless: true, executablePath });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('response', (resp) => {
    if (resp.url().includes('/api/auth/') || resp.url().includes('/dashboard') || resp.url().includes('/login')) {
      console.log('[RESP]', resp.status(), resp.request().method(), resp.url());
    }
  });

  await page.goto(`${URL}/login?next=%2Fdashboard`);
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASS);
  await page.click('button:has-text("Sign in")');
  await page.waitForTimeout(6000);
  console.log('final', page.url());
  const cookies = await context.cookies();
  console.log('cookies', cookies.filter(c => c.name.includes('normcore') || c.name.includes('sb-')).map(c => ({ name: c.name, value: c.value.slice(0, 30) })));
  console.log('title', await page.title());
  console.log('body', (await page.locator('body').innerText()).slice(0, 500));
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
