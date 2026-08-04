import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const cdpOrigin = process.env.CDP_ORIGIN ?? "http://127.0.0.1:9333";
const appUrl = process.argv[2] ?? process.env.APP_URL ?? "http://127.0.0.1:3104/";
const outputDir = path.resolve(process.cwd(), "qa", "ui-correction");

const viewportCases = [
  { name: "mobile-375", width: 375, height: 812 },
  { name: "mobile-390", width: 390, height: 844 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "desktop-1024", width: 1024, height: 768 },
  { name: "laptop-1280", width: 1280, height: 720 },
  { name: "desktop-1440", width: 1440, height: 900 },
];

const zoomCases = [
  { name: "zoom-100", zoom: 1, width: 1440, height: 900 },
  { name: "zoom-125", zoom: 1.25, width: 1152, height: 720 },
  { name: "zoom-150", zoom: 1.5, width: 960, height: 600 },
  { name: "zoom-200", zoom: 2, width: 720, height: 450 },
];

const screenshotCases = [
  { name: "normcore-desktop-1440x900", width: 1440, height: 900 },
  { name: "normcore-laptop-1280x720", width: 1280, height: 720 },
  { name: "normcore-mobile-390x844", width: 390, height: 844 },
  { name: "normcore-tablet-768x1024", width: 768, height: 1024 },
];

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

async function delay(milliseconds) {
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function evaluate(client, expression) {
  const result = await client.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text ?? "Runtime evaluation failed");
  }
  return result.result.value;
}

async function prepareViewport(client, width, height) {
  await client.send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    screenWidth: width,
    screenHeight: height,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await client.send("Page.navigate", { url: appUrl });
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const ready = await evaluate(client, "document.readyState");
    if (ready === "complete") break;
    await delay(100);
  }
  await evaluate(client, "document.fonts.ready.then(() => true)");
  await evaluate(client, "localStorage.removeItem('normcore-language'); window.dispatchEvent(new Event('normcore-language-change')); true");
  await delay(700);
  await evaluate(client, "window.scrollTo(0, 0); true");
  await delay(100);
}

async function inspectPage(client, testCase) {
  await prepareViewport(client, testCase.width, testCase.height);
  const geometry = await evaluate(client, `(() => {
    const q = (selector) => document.querySelector(selector);
    const qa = (selector) => Array.from(document.querySelectorAll(selector));
    const rect = (element) => {
      const value = element.getBoundingClientRect();
      return { top: value.top, right: value.right, bottom: value.bottom, left: value.left, width: value.width, height: value.height };
    };
    const header = rect(q('.site-header'));
    const essentialSelectors = [
      '.hero-description',
      '.hero-reassurance',
      '.section-intro > p',
      '.content-card p',
      '.step-card p',
      '.domain-card p',
      '.feature-card p',
      '.audience-card p',
      '.ai-content > p',
      '.ai-capabilities p',
      '.faq-item p',
      '.final-cta-copy > p'
    ];
    const essentialText = essentialSelectors.flatMap((selector) => qa(selector)).map((element) => ({
      selector: element.className || element.tagName,
      fontSize: parseFloat(getComputedStyle(element).fontSize),
      color: getComputedStyle(element).color,
    }));
    const cardElements = qa('.content-card,.step-card,.domain-card,.feature-card,.audience-card');
    const badCards = cardElements.map((element) => ({ className: element.className, ...rect(element) })).filter((item) =>
      item.width <= 0 || item.height <= 0 || item.left < -1 || item.right > window.innerWidth + 1
    );
    const overflowElements = qa('body *').map((element) => ({
      element,
      bounds: rect(element),
      style: getComputedStyle(element),
    })).filter((item) =>
      item.style.position !== 'fixed' && item.style.display !== 'none' &&
      (item.bounds.left < -1 || item.bounds.right > window.innerWidth + 1)
    ).slice(0, 12).map((item) => ({
      tag: item.element.tagName,
      className: item.element.className?.toString?.() ?? '',
      left: item.bounds.left,
      right: item.bounds.right,
      width: item.bounds.width,
    }));
    const heroHeading = rect(q('.hero-copy h1'));
    const heroDescription = rect(q('.hero-description'));
    const heroActions = rect(q('.hero-actions'));
    const heroSupport = rect(q('.hero-reassurance'));
    const rail = q('.scene-rail');
    const railStyle = getComputedStyle(rail);
    const railLinks = qa('.scene-rail a').map((link) => ({
      label: link.getAttribute('aria-label'),
      href: link.getAttribute('href'),
      current: link.getAttribute('aria-current'),
      tabIndex: link.tabIndex,
    }));
    const columnCount = (selector) => {
      const tops = qa(selector).map((element) => Math.round(element.getBoundingClientRect().top));
      if (!tops.length) return 0;
      const firstTop = tops[0];
      return tops.filter((top) => Math.abs(top - firstTop) <= 2).length;
    };
    return {
      language: document.documentElement.lang,
      viewport: { width: window.innerWidth, height: window.innerHeight, clientWidth: document.documentElement.clientWidth },
      documentWidth: document.documentElement.scrollWidth,
      header,
      hero: { heading: heroHeading, description: heroDescription, actions: heroActions, support: heroSupport },
      minEssentialFontSize: Math.min(...essentialText.map((item) => item.fontSize)),
      undersizedText: essentialText.filter((item) => item.fontSize < 16),
      badCards,
      overflowElements,
      columns: {
        steps: columnCount('.step-card'),
        domains: columnCount('.domain-card'),
        features: columnCount('.feature-card'),
      },
      rail: {
        display: railStyle.display,
        visible: railStyle.display !== 'none' && railStyle.visibility !== 'hidden',
        links: railLinks,
      },
    };
  })()`);

  const anchorOffsets = await evaluate(client, `(async () => {
    const ids = ['problem','how-it-works','security','features','ai-assistant','audience','faq'];
    const results = [];
    const previousBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';
    for (const id of ids) {
      const section = document.getElementById(id);
      section.scrollIntoView({ block: 'start' });
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const headerBottom = document.querySelector('.site-header').getBoundingClientRect().bottom;
      results.push({ id, top: section.getBoundingClientRect().top, headerBottom });
    }
    document.documentElement.style.scrollBehavior = previousBehavior;
    return results;
  })()`);

  const railActivations = await evaluate(client, `(async () => {
    const ids = ['product','problem','how-it-works','security','features','ai-assistant','audience','faq','get-started'];
    const results = [];
    const previousBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';
    for (const id of ids) {
      document.getElementById(id).scrollIntoView({ block: 'center' });
      let activeHref = null;
      for (let attempt = 0; attempt < 12; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 50));
        activeHref = document.querySelector('.scene-rail a[aria-current="step"]')?.getAttribute('href') ?? null;
        if (activeHref === '#' + id) break;
      }
      results.push({
        id,
        activeHref,
      });
    }
    document.documentElement.style.scrollBehavior = previousBehavior;
    return results;
  })()`);

  const faqBackground = await evaluate(client, `getComputedStyle(document.getElementById('faq')).backgroundColor`);

  const failures = [];
  if (geometry.language !== "en") failures.push("default-language-not-english");
  if (geometry.documentWidth > geometry.viewport.clientWidth + 1) failures.push("horizontal-overflow");
  if (geometry.badCards.length) failures.push("card-outside-viewport");
  if (geometry.undersizedText.length) failures.push("essential-text-under-16px");
  if (anchorOffsets.some((item) => item.top < item.headerBottom - 1)) failures.push("header-overlaps-anchor");
  if (testCase.width === 1280 && testCase.height === 720) {
    if (geometry.hero.heading.top < geometry.header.bottom - 1) failures.push("hero-heading-under-header");
    if (geometry.hero.support.bottom > geometry.viewport.height - 8) failures.push("hero-copy-outside-initial-viewport");
  }
  const expectedColumns = testCase.width > 1320 ? 4 : testCase.width > 620 ? 2 : 1;
  if (geometry.columns.steps !== expectedColumns || geometry.columns.domains !== expectedColumns || geometry.columns.features !== expectedColumns) {
    failures.push(`unexpected-grid-columns:${expectedColumns}`);
  }
  const railShouldBeVisible = testCase.width > 860;
  if (geometry.rail.visible !== railShouldBeVisible) failures.push("unexpected-rail-visibility");
  if (geometry.rail.links.some((link) => !link.label || !link.href || link.tabIndex < 0)) failures.push("rail-accessibility");
  if (railActivations.some((item) => item.activeHref !== `#${item.id}`)) failures.push("incorrect-rail-activation");
  if (!faqBackground.startsWith("rgba") || Number(faqBackground.split(",")[3]?.replace(")", "")) < 0.5) {
    failures.push("faq-background-not-dimmed");
  }

  return { ...testCase, geometry, anchorOffsets, railActivations, faqBackground, failures };
}

async function capture(client, screenshotCase) {
  await prepareViewport(client, screenshotCase.width, screenshotCase.height);
  const result = await client.send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: false,
  });
  const filePath = path.join(outputDir, `${screenshotCase.name}.png`);
  await writeFile(filePath, Buffer.from(result.data, "base64"));
  return filePath;
}

const targets = await fetch(`${cdpOrigin}/json/list`).then((response) => response.json());
const target = targets.find((item) => item.type === "page");
if (!target) throw new Error("No Chrome page target found");

await mkdir(outputDir, { recursive: true });
const client = new CDPClient(target.webSocketDebuggerUrl);
await client.open();
await client.send("Page.enable");
await client.send("Runtime.enable");

const viewportResults = [];
for (const testCase of viewportCases) viewportResults.push(await inspectPage(client, testCase));
const zoomResults = [];
for (const testCase of zoomCases) zoomResults.push(await inspectPage(client, testCase));

const screenshots = [];
for (const screenshotCase of screenshotCases) screenshots.push(await capture(client, screenshotCase));

const report = {
  generatedAt: new Date().toISOString(),
  viewportResults,
  zoomResults,
  screenshots,
};
await writeFile(path.join(outputDir, "ui-qa-report.json"), `${JSON.stringify(report, null, 2)}\n`);

client.close();

for (const result of [...viewportResults, ...zoomResults]) {
  console.log(`${result.name}: ${result.failures.length ? `FAIL ${result.failures.join(", ")}` : "PASS"}`);
}
console.log(`Screenshots: ${screenshots.join(", ")}`);

if ([...viewportResults, ...zoomResults].some((result) => result.failures.length)) process.exitCode = 1;
