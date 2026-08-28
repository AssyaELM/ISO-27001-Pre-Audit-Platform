const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();
  
  await page.goto('http://127.0.0.1:3103/ai-documents');
  await page.waitForTimeout(2000);
  
  await page.click('text=Information Security Policy');
  await page.waitForTimeout(2000);
  
  const [ download ] = await Promise.all([
    page.waitForEvent('download', { timeout: 15000 }),
    page.click('button:has-text("Export PDF")')
  ]);
  
  const dest = 'C:/Users/HP/.gemini/antigravity/brain/573fa27b-8349-4194-a662-dc415025cc28/Information_Security_Policy.pdf';
  await download.saveAs(dest);
  console.log('Saved to', dest);
  
  await browser.close();
})();
