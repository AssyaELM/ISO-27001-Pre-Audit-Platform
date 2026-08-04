import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const cdpOrigin = process.env.CDP_ORIGIN ?? "http://127.0.0.1:9333";
const appOrigin = process.argv[2] ?? "http://127.0.0.1:3104";
const qaScope = process.env.QA_SCOPE ?? "all";
const requestedViewport = process.env.QA_VIEWPORT ?? "";
const requestedRoute = process.env.QA_ROUTE ?? "";
const outputDir = path.resolve(process.cwd(), "qa", "responsive-all");

const viewports = [
  { name: "mobile-390x844", width: 390, height: 844 },
  { name: "tablet-768x1024", width: 768, height: 1024 },
  { name: "laptop-1024x768", width: 1024, height: 768 },
  { name: "laptop-1280x720", width: 1280, height: 720 },
  { name: "desktop-1440x900", width: 1440, height: 900 },
];
const activeViewports = requestedViewport
  ? viewports.filter((viewport) => viewport.name === requestedViewport)
  : viewports;

const routes = [
  { name: "landing", pathname: "/" },
  { name: "login", pathname: "/login" },
  { name: "signup", pathname: "/signup" },
  { name: "forgot-password", pathname: "/forgot-password" },
  { name: "check-email", pathname: "/check-email?flow=signup", pendingFlow: "signup" },
  { name: "set-new-password", pathname: "/set-new-password" },
  { name: "password-updated", pathname: "/password-updated" },
];
const activeRoutes = requestedRoute ? routes.filter((route) => route.name === requestedRoute) : routes;

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
      if (!message.id) return;
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
  const response = await client.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.text ?? "Runtime evaluation failed");
  return response.result.value;
}

async function waitForReady(client) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      if (await evaluate(client, "document.readyState === 'complete'")) break;
    } catch {
      // A Next.js development navigation can briefly replace the execution context.
    }
    await delay(50);
  }
  try {
    await evaluate(client, "document.fonts.ready.then(() => true)");
  } catch {
    await delay(100);
  }
  try {
    await evaluate(client, `Promise.all(Array.from(document.images).map((image) => {
      if (image.complete) return true;
      return new Promise((resolve) => {
        image.addEventListener('load', () => resolve(true), { once: true });
        image.addEventListener('error', () => resolve(false), { once: true });
      });
    })).then(() => true)`);
  } catch {
    await delay(150);
  }
  await delay(220);
}

async function setViewport(client, viewport) {
  await client.send("Emulation.setDeviceMetricsOverride", {
    width: viewport.width,
    height: viewport.height,
    screenWidth: viewport.width,
    screenHeight: viewport.height,
    deviceScaleFactor: 1,
    mobile: viewport.width < 600,
  });
}

async function navigate(client, pathname, viewport, pendingFlow) {
  await setViewport(client, viewport);
  if (pendingFlow) {
    await client.send("Page.navigate", { url: `${appOrigin}/login` }).catch(() => undefined);
    await waitForReady(client);
    await evaluate(client, `(() => {
      localStorage.setItem('normcore-language', 'en');
      sessionStorage.setItem('normcore-pending-auth-email', 'alex@company.com');
      sessionStorage.setItem('normcore-pending-auth-flow', '${pendingFlow}');
      return true;
    })()`);
  }
  await client.send("Page.navigate", { url: `${appOrigin}${pathname}` }).catch(() => undefined);
  await waitForReady(client);
  await evaluate(client, "localStorage.setItem('normcore-language', 'en'); true").catch(() => undefined);
  await evaluate(client, "window.scrollTo(0, 0); true").catch(() => undefined);
}

async function inspect(client, expectedPathname, viewport, scope) {
  return evaluate(client, `(() => {
    const visible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    };
    const rect = (element) => {
      const value = element.getBoundingClientRect();
      return { top: value.top, right: value.right, bottom: value.bottom, left: value.left, width: value.width, height: value.height };
    };
    const important = Array.from(document.querySelectorAll('main,header,form,.auth-card,.onboarding-panel,.onboarding-form-area,.onboarding-panel-footer,button,input,[class$="-card"]')).filter(visible);
    const outside = important.map((element) => ({
      tag: element.tagName,
      className: element.className?.toString?.() ?? '',
      ...rect(element),
    })).filter((item) => item.left < -1 || item.right > window.innerWidth + 1);
    const controls = Array.from(document.querySelectorAll('button,input,a.auth-back-link,a.auth-flow-back')).filter((element) => {
      if (!visible(element)) return false;
      if (element.tagName === 'INPUT' && Number(getComputedStyle(element).opacity) === 0) return false;
      return true;
    }).map((element) => ({
      tag: element.tagName,
      className: element.className?.toString?.() ?? '',
      ...rect(element),
    }));
    const shortControls = controls.filter((item) => item.height < 40 && item.width < 40);
    const primary = document.querySelector('.auth-submit,.onboarding-continue,.hero-actions .button-primary');
    const card = document.querySelector('.auth-card,.onboarding-panel');
    const headerParts = ['.onboarding-logo', '.onboarding-global-progress', '.onboarding-save'].map((selector) => {
      const element = document.querySelector(selector);
      if (!element) return { selector, exists: false };
      const style = getComputedStyle(element);
      return { selector, exists: true, display: style.display, visibility: style.visibility, opacity: style.opacity, bounds: rect(element) };
    });
    return {
      pathname: location.pathname,
      language: document.documentElement.lang,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      document: { width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight },
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      outside,
      shortControls,
      primary: primary ? rect(primary) : null,
      card: card ? rect(card) : null,
      scrollY: window.scrollY,
      headerParts,
      bodyOverflowX: getComputedStyle(document.body).overflowX,
      scope: ${JSON.stringify(scope)},
      expectedPathname: ${JSON.stringify(expectedPathname)},
    };
  })()`);
}

async function screenshot(client, fileName) {
  await evaluate(client, `(async () => {
    const header = document.querySelector('.onboarding-header,.auth-header,.site-header');
    if (header) {
      header.style.willChange = 'transform';
      header.style.transform = 'translateZ(0)';
      header.getBoundingClientRect();
    }
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    return true;
  })()`);
  const response = await client.send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: false,
  });
  const filePath = path.join(outputDir, fileName);
  await writeFile(filePath, Buffer.from(response.data, "base64"));
  return filePath;
}

function failuresFor(result, viewport) {
  const failures = [];
  if (result.pathname !== result.expectedPathname) failures.push(`unexpected-route:${result.pathname}`);
  if (result.language !== "en") failures.push("unexpected-language");
  if (result.horizontalOverflow) failures.push("horizontal-overflow");
  if (result.outside.length) failures.push("important-element-outside-viewport");
  if (result.shortControls.length) failures.push("control-under-40px");
  const isLaptop = viewport.name.startsWith("laptop-");
  if (isLaptop && result.primary && result.primary.bottom > viewport.height + 1) {
    failures.push("primary-action-below-laptop-viewport");
  }
  if (isLaptop && result.scope !== "landing" && result.card && (result.card.top < -1 || result.card.bottom > viewport.height + 1)) {
    failures.push("card-not-fully-visible-on-laptop");
  }
  if (isLaptop && result.scope !== "landing" && result.document.height > viewport.height + 1) {
    failures.push("laptop-page-requires-scroll");
  }
  return failures;
}

async function inspectSelectOverlay(client) {
  const before = await evaluate(client, `(() => {
    const panel = document.querySelector('.onboarding-panel').getBoundingClientRect();
    return { height: panel.height, bottom: panel.bottom };
  })()`);
  await evaluate(client, "document.querySelector('.onboarding-combobox').click(); true");
  await delay(180);
  const after = await evaluate(client, `(() => {
    const panel = document.querySelector('.onboarding-panel').getBoundingClientRect();
    const dropdown = document.querySelector('.onboarding-dropdown');
    const dropdownRect = dropdown.getBoundingClientRect();
    const backButton = document.querySelector('.onboarding-back');
    const nextButton = document.querySelector('.onboarding-continue');
    const back = backButton.getBoundingClientRect();
    const next = nextButton.getBoundingClientRect();
    const style = getComputedStyle(dropdown);
    const receivesPointerAtCenter = (button, bounds) => {
      const target = document.elementFromPoint(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2);
      return Boolean(target && (target === button || button.contains(target)));
    };
    return {
      panelHeight: panel.height,
      panelBottom: panel.bottom,
      dropdown: { top: dropdownRect.top, bottom: dropdownRect.bottom, height: dropdownRect.height },
      position: style.position,
      maxHeight: style.maxHeight,
      backVisible: back.top >= 0 && back.bottom <= innerHeight,
      nextVisible: next.top >= 0 && next.bottom <= innerHeight,
      backUnobscured: receivesPointerAtCenter(backButton, back),
      nextUnobscured: receivesPointerAtCenter(nextButton, next),
    };
  })()`);
  return { before, after };
}

async function advanceOnboarding(client, screen) {
  if (screen === 0) {
    await evaluate(client, `(() => {
      const input = document.querySelector('.onboarding-field input');
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(input, 'Acme Ltd');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    })()`);
  } else if (screen === 1) {
    await evaluate(client, "document.querySelector('.company-size-option').click(); true");
  } else if (screen === 2) {
    await evaluate(client, "document.querySelector('.onboarding-combobox').click(); true");
    await delay(100);
    await evaluate(client, "document.querySelector('.onboarding-options button').click(); true");
  }
  await delay(150);
  await evaluate(client, "document.querySelector('.onboarding-continue').click(); true");
  await delay(650);
  await evaluate(client, `(() => {
    const previous = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, 0);
    document.documentElement.style.scrollBehavior = previous;
    return true;
  })()`);
  await delay(150);
}

const targets = await fetch(`${cdpOrigin}/json/list`).then((response) => response.json());
const target = targets.find((item) => item.type === "page");
if (!target) throw new Error("No Chrome page target found");

await mkdir(outputDir, { recursive: true });
const client = new CDPClient(target.webSocketDebuggerUrl);
await client.open();
await client.send("Page.enable");
await client.send("Runtime.enable");

const authResults = [];
if (qaScope !== "onboarding") {
  for (const route of activeRoutes) {
    for (const viewport of activeViewports) {
      await navigate(client, route.pathname, viewport, route.pendingFlow);
      const result = await inspect(client, route.pathname.split("?")[0], viewport, route.name === "landing" ? "landing" : "auth");
      const failures = failuresFor(result, viewport);
      const capture = await screenshot(client, `${route.name}-${viewport.name}.png`);
      authResults.push({ route: route.name, viewport, result, failures, capture });
    }
  }
}

const onboardingResults = [];
if (qaScope !== "auth") {
  for (const viewport of activeViewports) {
    await setViewport(client, viewport);
    await client.send("Page.navigate", { url: `${appOrigin}/login` }).catch(() => undefined);
    await waitForReady(client);
    await evaluate(client, "localStorage.setItem('normcore-language', 'en'); localStorage.removeItem('normcore-onboarding-organization-v1'); true");
    await client.send("Page.navigate", { url: `${appOrigin}/onboarding` }).catch(() => undefined);
    await waitForReady(client);

    for (let screen = 0; screen < 4; screen += 1) {
      const result = await inspect(client, "/onboarding", viewport, `onboarding-${screen + 1}`);
      const failures = failuresFor(result, viewport);
      let selectOverlay = null;
      if (screen >= 2) {
        selectOverlay = await inspectSelectOverlay(client);
        if (Math.abs(selectOverlay.after.panelHeight - selectOverlay.before.height) > 1) failures.push("dropdown-changes-panel-height");
        if (selectOverlay.after.position !== "absolute") failures.push("dropdown-is-not-an-overlay");
        if (!selectOverlay.after.backVisible || !selectOverlay.after.nextVisible || !selectOverlay.after.backUnobscured || !selectOverlay.after.nextUnobscured) failures.push("navigation-hidden-when-dropdown-opens");
        await screenshot(client, `onboarding-screen-${screen + 1}-${viewport.name}-dropdown-open.png`);
        await evaluate(client, "document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); true");
        await delay(100);
      }
      const capture = await screenshot(client, `onboarding-screen-${screen + 1}-${viewport.name}.png`);
      onboardingResults.push({ screen: screen + 1, viewport, result, selectOverlay, failures, capture });
      if (screen < 3) await advanceOnboarding(client, screen);
    }
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  appOrigin,
  authResults,
  onboardingResults,
};
await writeFile(path.join(outputDir, "responsive-all-qa-report.json"), `${JSON.stringify(report, null, 2)}\n`);
client.close();

for (const item of authResults) {
  console.log(`${item.route} ${item.viewport.name}: ${item.failures.length ? `FAIL ${item.failures.join(", ")}` : "PASS"}`);
}
for (const item of onboardingResults) {
  console.log(`onboarding-${item.screen} ${item.viewport.name}: ${item.failures.length ? `FAIL ${item.failures.join(", ")}` : "PASS"}`);
}

if ([...authResults, ...onboardingResults].some((item) => item.failures.length)) process.exitCode = 1;
