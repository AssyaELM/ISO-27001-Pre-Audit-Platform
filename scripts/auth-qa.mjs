import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const cdpOrigin = process.env.CDP_ORIGIN ?? "http://127.0.0.1:9444";
const appOrigin = process.argv[2] ?? "http://127.0.0.1:3105";
const outputDir = path.resolve(process.cwd(), "qa", "auth-white");

class CDPClient {
  constructor(url) {
    this.socket = new WebSocket(url);
    this.nextId = 1;
    this.pending = new Map();
  }

  async open() {
    await new Promise((resolve, reject) => {
      this.socket.addEventListener("open", resolve, { once: true });
      this.socket.addEventListener("error", reject, { once: true });
    });
    this.socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(message.error.message));
      else pending.resolve(message.result);
    });
  }

  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    this.socket.close();
  }
}

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function evaluate(client, expression) {
  const result = await client.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text ?? "Evaluation failed");
  return result.result.value;
}

async function navigate(client, pathname, width, height, language = "en") {
  await client.send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    screenWidth: width,
    screenHeight: height,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await client.send("Page.navigate", { url: `${appOrigin}/login` });
  await delay(250);
  await evaluate(client, `localStorage.setItem('normcore-language', '${language}'); true`);
  await client.send("Page.navigate", { url: `${appOrigin}${pathname}` });
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (await evaluate(client, "document.readyState === 'complete'")) break;
    await delay(100);
  }
  await evaluate(client, "document.fonts.ready.then(() => true)");
  await delay(400);
  await evaluate(client, "window.scrollTo(0, 0); true");
  await delay(100);
}

async function inspectAuth(client, pathname, width, height, language) {
  await navigate(client, pathname, width, height, language);
  return evaluate(client, `(() => {
    const visible = (element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
    };
    const selectors = [
      '.auth-back-link', '.auth-form-heading p',
      '.auth-field > span', '.auth-field input', '.auth-check', '.auth-text-button',
      '.auth-submit', '.auth-form-message', '.auth-divider em', '.auth-switch',
      '.auth-trust-note p'
    ];
    const text = selectors.flatMap((selector) => Array.from(document.querySelectorAll(selector)))
      .filter(visible)
      .map((element) => ({ selector: element.className || element.tagName, size: parseFloat(getComputedStyle(element).fontSize) }));
    return {
      pathname: location.pathname,
      language: document.documentElement.lang,
      title: document.querySelector('#auth-title')?.textContent,
      viewportWidth: document.documentElement.clientWidth,
      documentWidth: document.documentElement.scrollWidth,
      minimumTextSize: Math.min(...text.map((item) => item.size)),
      undersized: text.filter((item) => item.size < 16),
      loginHref: document.querySelector('.auth-switch a')?.getAttribute('href'),
      homeHref: document.querySelector('.auth-back-link')?.getAttribute('href'),
    };
  })()`);
}

async function inspectFlowPage(client, testCase) {
  await navigate(client, "/login", testCase.width, testCase.height, testCase.language);
  if (testCase.pendingFlow) {
    await evaluate(client, `
      sessionStorage.setItem('normcore-pending-auth-email', 'capiso83@gmail.com');
      sessionStorage.setItem('normcore-pending-auth-flow', '${testCase.pendingFlow}');
      true
    `);
  }
  await client.send("Page.navigate", { url: `${appOrigin}${testCase.pathname}` });
  await delay(500);
  await evaluate(client, "window.scrollTo(0, 0); true");

  const result = await evaluate(client, `(() => {
    const selectors = [
      '.auth-back-link', '.auth-flow-heading h1', '.auth-flow-description',
      '.auth-field > span', '.auth-field input', '.auth-submit',
      '.auth-secondary-action', '.auth-flow-links', '.auth-flow-back',
      '.auth-form-message', '.auth-trust-note p'
    ];
    const visible = (element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
    };
    const text = selectors.flatMap((selector) => Array.from(document.querySelectorAll(selector)))
      .filter(visible)
      .map((element) => ({ selector: element.className || element.tagName, size: parseFloat(getComputedStyle(element).fontSize) }));
    return {
      pathname: location.pathname,
      language: document.documentElement.lang,
      title: document.querySelector('#auth-title')?.textContent ?? null,
      viewportWidth: document.documentElement.clientWidth,
      documentWidth: document.documentElement.scrollWidth,
      minimumTextSize: Math.min(...text.map((item) => item.size)),
      undersized: text.filter((item) => item.size < 16),
      hasLanguageButton: Boolean(document.querySelector('.auth-language-control')),
    };
  })()`);

  const failures = [];
  if (result.pathname !== testCase.pathname.split("?")[0]) failures.push("wrong-route");
  if (result.language !== testCase.language) failures.push("wrong-language");
  if (result.title !== testCase.title) failures.push("wrong-title");
  if (result.documentWidth > result.viewportWidth + 1) failures.push("horizontal-overflow");
  if (result.undersized.length) failures.push("text-under-16px");
  if (result.hasLanguageButton) failures.push("unexpected-language-button");
  return { ...testCase, result, failures };
}

async function capture(client, filename) {
  const result = await client.send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: false,
  });
  const outputPath = path.join(outputDir, filename);
  await writeFile(outputPath, Buffer.from(result.data, "base64"));
  return outputPath;
}

const targets = await fetch(`${cdpOrigin}/json/list`).then((response) => response.json());
const target = targets.find((item) => item.type === "page");
if (!target) throw new Error("No Chrome page target found");

await mkdir(outputDir, { recursive: true });
const client = new CDPClient(target.webSocketDebuggerUrl);
await client.open();
await client.send("Page.enable");
await client.send("Runtime.enable");

const cases = [
  { pathname: "/login", width: 390, height: 844, language: "en", title: "Welcome back" },
  { pathname: "/signup", width: 390, height: 1000, language: "en", title: "Create your account" },
  { pathname: "/login", width: 768, height: 1024, language: "fr", title: "Bon retour" },
  { pathname: "/signup", width: 768, height: 1024, language: "fr", title: "Créez votre compte" },
];

const results = [];
for (const testCase of cases) {
  const result = await inspectAuth(client, testCase.pathname, testCase.width, testCase.height, testCase.language);
  const failures = [];
  if (result.pathname !== testCase.pathname) failures.push("wrong-route");
  if (result.language !== testCase.language) failures.push("wrong-language");
  if (result.title !== testCase.title) failures.push("wrong-title");
  if (result.documentWidth > result.viewportWidth + 1) failures.push("horizontal-overflow");
  if (result.undersized.length) failures.push("text-under-16px");
  if (result.loginHref !== (testCase.pathname === "/login" ? "/signup" : "/login")) failures.push("wrong-auth-link");
  if (result.homeHref !== "/") failures.push("wrong-home-link");
  results.push({ ...testCase, result, failures });
}

const flowCases = [
  { pathname: "/forgot-password", width: 390, height: 844, language: "en", title: "Forgot your password?" },
  { pathname: "/check-email?flow=signup", width: 390, height: 844, language: "en", title: "Check your email", pendingFlow: "signup" },
  { pathname: "/set-new-password", width: 390, height: 844, language: "en", title: "Set a new password" },
  { pathname: "/password-updated", width: 390, height: 844, language: "en", title: "Password updated" },
  { pathname: "/check-email?flow=recovery", width: 768, height: 1024, language: "fr", title: "Consultez votre e-mail", pendingFlow: "recovery" },
];

const flowResults = [];
for (const testCase of flowCases) flowResults.push(await inspectFlowPage(client, testCase));

await navigate(client, "/", 1280, 720, "en");
const landingLinks = await evaluate(client, `(() => ({
  desktop: document.querySelector('.header-actions a[href="/signup"]')?.getAttribute('href') ?? null,
  mobile: document.querySelector('.mobile-menu-footer a[href="/signup"]')?.getAttribute('href') ?? null,
}))()`);

const languageFlow = await evaluate(client, `(async () => {
  const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
  const readLanding = () => ({
    signIn: document.querySelector('.header-actions .sign-in')?.textContent?.trim() ?? null,
    createAccount: document.querySelector('.header-actions a[href="/signup"]')?.textContent?.trim() ?? null,
    language: document.documentElement.lang,
  });

  const englishLanding = readLanding();
  document.querySelector('.language-control').click();
  await wait(150);
  const frenchLanding = readLanding();
  document.querySelector('.header-actions a[href="/signup"]').click();
  await wait(500);
  const frenchSignup = {
    pathname: location.pathname,
    title: document.querySelector('#auth-title')?.textContent ?? null,
    language: document.documentElement.lang,
    hasLanguageButton: Boolean(document.querySelector('.auth-language-control')),
  };
  return { englishLanding, frenchLanding, frenchSignup };
})()`);

await client.send("Page.navigate", { url: `${appOrigin}/` });
await delay(500);
const englishFlow = await evaluate(client, `(async () => {
  const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
  document.querySelector('.language-control').click();
  await wait(150);
  const landing = {
    signIn: document.querySelector('.header-actions .sign-in')?.textContent?.trim() ?? null,
    createAccount: document.querySelector('.header-actions a[href="/signup"]')?.textContent?.trim() ?? null,
    language: document.documentElement.lang,
  };
  document.querySelector('.header-actions .sign-in').click();
  await wait(500);
  return {
    landing,
    login: {
      pathname: location.pathname,
      title: document.querySelector('#auth-title')?.textContent ?? null,
      language: document.documentElement.lang,
      hasLanguageButton: Boolean(document.querySelector('.auth-language-control')),
    },
  };
})()`);

const languageFlowPass =
  languageFlow.englishLanding.signIn === "Sign in" &&
  languageFlow.englishLanding.createAccount === "Create account" &&
  languageFlow.englishLanding.language === "en" &&
  languageFlow.frenchLanding.signIn === "Se connecter" &&
  languageFlow.frenchLanding.createAccount === "Créer un compte" &&
  languageFlow.frenchLanding.language === "fr" &&
  languageFlow.frenchSignup.pathname === "/signup" &&
  languageFlow.frenchSignup.title === "Créez votre compte" &&
  languageFlow.frenchSignup.language === "fr" &&
  languageFlow.frenchSignup.hasLanguageButton === false &&
  englishFlow.landing.signIn === "Sign in" &&
  englishFlow.landing.createAccount === "Create account" &&
  englishFlow.landing.language === "en" &&
  englishFlow.login.pathname === "/login" &&
  englishFlow.login.title === "Welcome back" &&
  englishFlow.login.language === "en" &&
  englishFlow.login.hasLanguageButton === false;

await navigate(client, "/login", 390, 844, "en");
const loginScreenshot = await capture(client, "login-mobile-corrected.png");
await navigate(client, "/signup", 390, 1000, "en");
const signupScreenshot = await capture(client, "signup-mobile-corrected.png");
await navigate(client, "/forgot-password", 390, 844, "en");
const forgotScreenshot = await capture(client, "forgot-password-mobile.png");
await navigate(client, "/login", 390, 844, "en");
await evaluate(client, "sessionStorage.setItem('normcore-pending-auth-email','capiso83@gmail.com'); sessionStorage.setItem('normcore-pending-auth-flow','signup'); true");
await client.send("Page.navigate", { url: `${appOrigin}/check-email?flow=signup` });
await delay(500);
await evaluate(client, "window.scrollTo(0, 0); true");
const otpScreenshot = await capture(client, "check-email-otp-mobile.png");

const report = {
  generatedAt: new Date().toISOString(),
  results,
  flowResults,
  landingLinks,
  languageFlow,
  englishFlow,
  languageFlowPass,
  screenshots: [loginScreenshot, signupScreenshot, forgotScreenshot, otpScreenshot],
};
await writeFile(path.join(outputDir, "auth-qa-report.json"), `${JSON.stringify(report, null, 2)}\n`);
client.close();

for (const item of results) {
  console.log(`${item.language} ${item.pathname} ${item.width}x${item.height}: ${item.failures.length ? `FAIL ${item.failures.join(", ")}` : "PASS"}`);
}
for (const item of flowResults) {
  console.log(`${item.language} ${item.pathname} ${item.width}x${item.height}: ${item.failures.length ? `FAIL ${item.failures.join(", ")}` : "PASS"}`);
}
console.log(`Landing signup links: ${landingLinks.desktop === "/signup" && landingLinks.mobile === "/signup" ? "PASS" : "FAIL"}`);
console.log(`Landing language inheritance: ${languageFlowPass ? "PASS" : "FAIL"}`);

if (
  results.some((item) => item.failures.length) ||
  flowResults.some((item) => item.failures.length) ||
  landingLinks.desktop !== "/signup" ||
  landingLinks.mobile !== "/signup" ||
  !languageFlowPass
) {
  process.exitCode = 1;
}
