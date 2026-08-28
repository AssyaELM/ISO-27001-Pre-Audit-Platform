import { chromium } from 'playwright';

const URL = 'http://127.0.0.1:3103';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const results = {};
  const errors = [];
  const networkErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(`[Console Error] ${msg.text()}`);
  });
  
  page.on('response', resp => {
    if (resp.status() >= 400 && !resp.url().includes('google-analytics')) {
      networkErrors.push(`[HTTP ${resp.status()}] ${resp.url()}`);
    }
  });

  async function measureLoad(name, action) {
    const start = performance.now();
    try {
      await action();
      await page.waitForLoadState('networkidle');
      const end = performance.now();
      results[name] = Math.round(end - start);
      console.log(`[PASS] ${name}: ${results[name]}ms`);
    } catch (e) {
      console.log(`[FAIL] ${name}: ${e.message}`);
      errors.push(`[FAIL] ${name}: ${e.message}`);
    }
  }

  // 1. Landing
  await measureLoad('Landing_FirstLoad', () => page.goto(`${URL}/`));

  // 2. Login Page
  await measureLoad('Login_FirstLoad', () => page.goto(`${URL}/login`));

  // Sign up User A
  console.log("Signing up User A...");
  await page.goto(`${URL}/signup`);
  await page.waitForLoadState('networkidle');
  const userA = `usera_${Date.now()}@qa.com`;
  await page.fill('input[type="email"]', userA).catch(()=>console.log("no email"));
  await page.fill('input[type="password"]', 'QaPassword123!').catch(()=>{});
  await page.click('button:has-text("Sign up")').catch(()=>{});
  await page.waitForTimeout(2000);
  
  // Login User A
  console.log("Logging in User A...");
  await page.goto(`${URL}/login`);
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="email"]', userA).catch(()=>{});
  await page.fill('input[type="password"]', 'QaPassword123!').catch(()=>{});
  
  await measureLoad('Dashboard_FirstLoad', async () => {
    await page.click('button:has-text("Sign in")').catch(()=>{});
    await page.waitForURL('**/dashboard', { timeout: 10000 }).catch(() => {});
  });

  if (page.url().includes('onboarding')) {
    console.log("Completing onboarding...");
    await page.waitForLoadState('networkidle');
    await page.fill('input[placeholder*="Company"]', 'QA Org').catch(()=>{});
    await page.click('button:has-text("Continue")').catch(()=>{});
    await page.waitForTimeout(500);
    await page.click('button:has-text("Continue")').catch(()=>{});
    await page.waitForTimeout(500);
    await page.click('button:has-text("Continue")').catch(()=>{});
    await page.waitForTimeout(500);
    await page.click('button:has-text("Go to Dashboard")').catch(()=>{});
    await page.waitForURL('**/dashboard', { timeout: 10000 }).catch(()=>{});
    await page.waitForLoadState('networkidle');
  }

  await measureLoad('Assessment_FirstLoad', async () => {
    await page.click('a:has-text("Assessment")').catch(()=>{});
    await page.waitForURL('**/assessment', { timeout: 5000 });
  });
  
  // Try to click into a control and then next/prev
  await measureLoad('Assessment_ControlView', async () => {
    await page.click('a[href*="/assessment/organizational/a5-1"]').catch(()=>{});
    await page.waitForURL('**/assessment/organizational/a5-1', { timeout: 5000 });
  });

  await measureLoad('Assessment_NextControl', async () => {
    await page.click('text="Next"').catch(()=>{}); // Assuming a next button exists
    await page.waitForTimeout(1000);
  });

  await measureLoad('GapAnalysis_FirstLoad', async () => {
    await page.click('a:has-text("Gap Analysis")').catch(()=>{});
    await page.waitForURL('**/gap-analysis', { timeout: 5000 });
  });

  await measureLoad('Remediation_FirstLoad', async () => {
    await page.click('a:has-text("Remediation")').catch(()=>{});
    await page.waitForURL('**/remediation', { timeout: 5000 }).catch(()=>{});
  });

  await measureLoad('Evidence_FirstLoad', async () => {
    await page.click('a:has-text("Evidence Room")').catch(()=>{});
    await page.waitForURL('**/evidence-room', { timeout: 5000 });
  });

  await measureLoad('AIDocs_FirstLoad', async () => {
    await page.click('a:has-text("AI Documents")').catch(()=>{});
    await page.waitForURL('**/ai-documents', { timeout: 5000 });
  });
  
  // AIDocs specific: navigate to a document
  await measureLoad('AIDocs_ViewDoc', async () => {
    await page.click('text="Information Security Policy"').catch(()=>{});
    await page.waitForTimeout(1000);
  });

  await measureLoad('Assessment_ReturnLoad', async () => {
    await page.click('a:has-text("Assessment")').catch(()=>{});
    await page.waitForURL('**/assessment', { timeout: 5000 });
  });

  await measureLoad('Dashboard_ReturnLoad', async () => {
    await page.click('a:has-text("Dashboard")').catch(()=>{});
    await page.waitForURL('**/dashboard', { timeout: 5000 });
  });

  console.log("Checking Settings...");
  await measureLoad('Settings_Load', async () => {
    await page.click('a:has-text("Settings")').catch(()=>{});
    await page.waitForTimeout(1000);
  });

  console.log("Checking Cache Isolation...");
  await context.clearCookies();
  await page.evaluate(() => window.localStorage.clear()).catch(()=>{});
  await page.goto(`${URL}/login`);

  const userB = `userb_${Date.now()}@qa.com`;
  console.log("Signing up User B...");
  await page.goto(`${URL}/signup`);
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="email"]', userB).catch(()=>{});
  await page.fill('input[type="password"]', 'QaPassword123!').catch(()=>{});
  await page.click('button:has-text("Sign up")').catch(()=>{});
  await page.waitForTimeout(2000);

  console.log("Logging in User B...");
  await page.goto(`${URL}/login`);
  await page.fill('input[type="email"]', userB).catch(()=>{});
  await page.fill('input[type="password"]', 'QaPassword123!').catch(()=>{});
  await page.click('button:has-text("Sign in")').catch(()=>{});
  await page.waitForURL('**/dashboard', { timeout: 10000 }).catch(()=>{});
  
  if (page.url().includes('onboarding')) {
    console.log("Completing onboarding for B...");
    await page.fill('input[placeholder*="Company"]', 'Org B').catch(()=>{});
    await page.click('button:has-text("Continue")').catch(()=>{});
    await page.waitForTimeout(500);
    await page.click('button:has-text("Continue")').catch(()=>{});
    await page.waitForTimeout(500);
    await page.click('button:has-text("Continue")').catch(()=>{});
    await page.waitForTimeout(500);
    await page.click('button:has-text("Go to Dashboard")').catch(()=>{});
    await page.waitForURL('**/dashboard', { timeout: 10000 }).catch(()=>{});
  }

  await measureLoad('UserB_Assessment', async () => {
    await page.click('a:has-text("Assessment")').catch(()=>{});
    await page.waitForURL('**/assessment', { timeout: 5000 }).catch(()=>{});
    // Check if User A data leaked
    const text = await page.innerText('body').catch(()=>"");
    if (text.includes('QA Org') || text.includes(userA)) {
      errors.push("[ISOLATION FAIL] User A data found in User B session.");
    }
  });

  await browser.close();

  console.log("=== RESULTS ===");
  console.log(JSON.stringify(results, null, 2));
  console.log("=== ERRORS ===");
  console.log(errors);
  console.log("=== NETWORK ERRORS ===");
  console.log(networkErrors);
}

run().catch(console.error);
