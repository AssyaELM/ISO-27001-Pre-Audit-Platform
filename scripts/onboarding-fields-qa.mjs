import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const cdpOrigin = process.env.CDP_ORIGIN ?? "http://127.0.0.1:9333";
const appOrigin = process.env.APP_ORIGIN ?? "http://127.0.0.1:3105";
const outputDir = path.resolve(process.cwd(), "qa", "onboarding-fields");

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

async function waitForPage(client) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      if (await evaluate(client, "document.readyState === 'complete'")) break;
    } catch {
      // The execution context can briefly change during a Next.js navigation.
    }
    await delay(80);
  }
  await delay(350);
}

async function waitForSelector(client, selector) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      if (await evaluate(client, `Boolean(document.querySelector(${JSON.stringify(selector)}))`)) return;
    } catch {
      // The execution context can briefly change during a Next.js navigation.
    }
    await delay(100);
  }
  throw new Error(`Timed out waiting for selector: ${selector}`);
}

async function navigate(client, pathname) {
  await client.send("Page.navigate", { url: `${appOrigin}${pathname}` }).catch(() => undefined);
  await waitForPage(client);
}

async function setInput(client, selector, value) {
  await evaluate(client, `(() => {
    const input = document.querySelector(${JSON.stringify(selector)});
    if (!(input instanceof HTMLInputElement)) throw new Error('Input not found: ${selector}');
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(input, ${JSON.stringify(value)});
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  })()`);
  await delay(120);
}

async function click(client, selector) {
  await evaluate(client, `(() => {
    const element = document.querySelector(${JSON.stringify(selector)});
    if (!(element instanceof HTMLElement)) throw new Error('Element not found: ${selector}');
    element.click();
    return true;
  })()`);
  await delay(220);
}

async function pressKey(client, key, code = key) {
  const keyCode = key === "Enter" ? 13 : key === " " ? 32 : key === "Escape" ? 27 : key === "ArrowDown" ? 40 : key === "ArrowUp" ? 38 : 0;
  await client.send("Input.dispatchKeyEvent", {
    type: key === " " ? "keyDown" : "rawKeyDown",
    key,
    code,
    windowsVirtualKeyCode: keyCode,
    nativeVirtualKeyCode: keyCode,
  });
  await client.send("Input.dispatchKeyEvent", {
    type: "keyUp",
    key,
    code,
    windowsVirtualKeyCode: keyCode,
    nativeVirtualKeyCode: keyCode,
  });
  await delay(180);
}

async function capture(client, name) {
  const result = await client.send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: false,
  });
  const filePath = path.join(outputDir, `${name}.png`);
  await writeFile(filePath, Buffer.from(result.data, "base64"));
  return filePath;
}

const results = [];
function check(name, condition, details = {}) {
  results.push({ name, passed: Boolean(condition), details });
  if (!condition) throw new Error(`Failed: ${name}`);
}

const targets = await fetch(`${cdpOrigin}/json/list`).then((response) => response.json());
const target = targets.find((item) => item.type === "page");
if (!target) throw new Error("No Chrome page target found");

await mkdir(outputDir, { recursive: true });
const client = new CDPClient(target.webSocketDebuggerUrl);
await client.open();
await client.send("Page.enable");
await client.send("Runtime.enable");
await client.send("Emulation.setDeviceMetricsOverride", {
  width: 1280,
  height: 720,
  screenWidth: 1280,
  screenHeight: 720,
  deviceScaleFactor: 1,
  mobile: false,
});

try {
  await navigate(client, "/login");
  await evaluate(client, `(() => {
    localStorage.setItem('normcore-language', 'en');
    localStorage.setItem('normcore-onboarding-organization-v1', JSON.stringify({
      organizationName: 'Acme Ltd',
      companySize: '51–200',
      countryCode: '',
      industryId: '',
      otherIndustry: '',
      currentScreen: 1,
      completed: false
    }));
    return true;
  })()`);
  await navigate(client, "/onboarding");
  await waitForSelector(client, ".company-size-option");

  let state = await evaluate(client, `(() => ({
    selected: document.querySelectorAll('.company-size-option[aria-checked="true"]').length,
    continueDisabled: document.querySelector('.onboarding-continue').disabled,
    visibleChecks: Array.from(document.querySelectorAll('.selection-check')).filter((item) => getComputedStyle(item).display !== 'none').length,
    asset: document.querySelector('.company-size-art img')?.getAttribute('src') ?? ''
  }))()`);
  check("no legacy/demo company size is restored", state.selected === 0, state);
  check("Continue is disabled with no company size", state.continueDisabled === true, state);
  check("no selection check is visible initially", state.visibleChecks === 0, state);
  check("unselected company artwork is used", state.asset.includes("company-size-unselected.png"), state);
  await capture(client, "company-size-initial");

  await click(client, '[data-company-size="1–10"]');
  state = await evaluate(client, `(() => ({
    selected: Array.from(document.querySelectorAll('.company-size-option[aria-checked="true"]')).map((item) => item.dataset.companySize),
    continueDisabled: document.querySelector('.onboarding-continue').disabled
  }))()`);
  check("one company size can be selected", state.selected.length === 1 && state.selected[0] === "1–10", state);
  check("Continue is enabled after a company size selection", state.continueDisabled === false, state);

  await click(client, '[data-company-size="51–200"]');
  state = await evaluate(client, `(() => ({
    selected: Array.from(document.querySelectorAll('.company-size-option[aria-checked="true"]')).map((item) => item.dataset.companySize),
    selectedClasses: document.querySelectorAll('.company-size-option.is-selected').length,
    visibleChecks: Array.from(document.querySelectorAll('.selection-check')).filter((item) => getComputedStyle(item).display !== 'none').length
  }))()`);
  check("company size selection is exclusive", state.selected.length === 1 && state.selected[0] === "51–200", state);
  check("only one selected class and check remain", state.selectedClasses === 1 && state.visibleChecks === 1, state);

  await click(client, ".onboarding-continue");
  await click(client, ".onboarding-back");
  state = await evaluate(client, `(() => ({
    selected: Array.from(document.querySelectorAll('.company-size-option[aria-checked="true"]')).map((item) => item.dataset.companySize),
    continueDisabled: document.querySelector('.onboarding-continue').disabled
  }))()`);
  check("a real company size selection is restored on Back", state.selected.length === 1 && state.selected[0] === "51–200" && !state.continueDisabled, state);

  state = await evaluate(client, `(() => {
    const panel = document.querySelector('.onboarding-panel').getBoundingClientRect();
    const grid = document.querySelector('.company-size-grid').getBoundingClientRect();
    const footer = document.querySelector('.onboarding-panel-footer').getBoundingClientRect();
    const options = Array.from(document.querySelectorAll('.company-size-option'));
    const hitTargets = options.every((option) => {
      const rect = option.getBoundingClientRect();
      const target = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
      return target === option || option.contains(target);
    });
    return {
      optionCount: options.length,
      panelContainsGrid: grid.left >= panel.left && grid.right <= panel.right && grid.top >= panel.top && grid.bottom <= panel.bottom,
      footerFollowsGrid: footer.top >= grid.bottom,
      footerInsidePanel: footer.left >= panel.left && footer.right <= panel.right && footer.bottom <= panel.bottom + 1,
      hitTargets,
      pageAtTop: window.scrollY === 0 && document.documentElement.scrollTop === 0
    };
  })()`);
  check("company size grid stays inside the main card", state.optionCount === 6 && state.panelContainsGrid, state);
  check("company size footer stays after the grid and inside the card", state.footerFollowsGrid && state.footerInsidePanel, state);
  check("all six company size choices remain clickable without an overlay", state.hitTargets, state);
  check("restoring company size resets the page scroll", state.pageAtTop, state);

  await click(client, ".onboarding-save");
  await navigate(client, "/onboarding");
  await waitForSelector(client, ".company-size-option");
  state = await evaluate(client, `(() => ({
    selected: Array.from(document.querySelectorAll('.company-size-option[aria-checked="true"]')).map((item) => item.dataset.companySize),
    selectedClasses: document.querySelectorAll('.company-size-option.is-selected').length,
    continueDisabled: document.querySelector('.onboarding-continue').disabled,
    scrollY: window.scrollY
  }))()`);
  check("Save and exit restores exactly one company size", state.selected.length === 1 && state.selected[0] === "51–200" && state.selectedClasses === 1, state);
  check("Continue remains enabled and the restored screen starts at the top", !state.continueDisabled && state.scrollY === 0, state);

  await click(client, ".onboarding-continue");
  state = await evaluate(client, `(() => ({
    expanded: document.querySelector('[aria-controls="country-options"]').getAttribute('aria-expanded'),
    dropdown: Boolean(document.getElementById('country-options'))
  }))()`);
  check("country menu is closed on initial display", state.expanded === "false" && !state.dropdown, state);

  await click(client, '[aria-controls="country-options"]');
  state = await evaluate(client, `(() => {
    const options = Array.from(document.querySelectorAll('#country-listbox [role="option"]'));
    const list = document.getElementById('country-listbox');
    const first = options[0]?.getBoundingClientRect();
    return {
      count: options.length,
      labels: options.map((option) => option.textContent.trim()),
      visibleOptions: first ? list.clientHeight / first.height : 0,
      panelHeight: document.querySelector('.onboarding-panel').getBoundingClientRect().height,
      backTarget: (() => {
        const button = document.querySelector('.onboarding-back');
        const rect = button.getBoundingClientRect();
        const target = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
        return target === button || button.contains(target);
      })(),
      nextTarget: (() => {
        const button = document.querySelector('.onboarding-continue');
        const rect = button.getBoundingClientRect();
        const target = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
        return target === button || button.contains(target);
      })()
    };
  })()`);
  check("complete alphabetically sorted country list is shown", state.count >= 240 && state.labels.every((label, index, labels) => index === 0 || labels[index - 1].localeCompare(label, 'en', { sensitivity: 'base' }) <= 0), state);
  check("about five to six countries are visible on laptop", state.visibleOptions >= 5 && state.visibleOptions <= 6.8, state);
  check("country popover keeps navigation clickable", state.backTarget && state.nextTarget, state);
  await capture(client, "country-list-laptop");

  await setInput(client, '#country-options input', 'A');
  state = await evaluate(client, `(() => {
    const normalize = (value) => value.normalize('NFD').replace(/\\p{Diacritic}/gu, '').toLowerCase();
    const labels = Array.from(document.querySelectorAll('#country-listbox [role="option"]')).map((option) => option.textContent.trim());
    return { labels, allStartWithA: labels.length > 0 && labels.every((label) => normalize(label).startsWith('a')) };
  })()`);
  check("A filters immediately to country names beginning with A", state.allStartWithA, state);

  await setInput(client, '#country-options input', 'zzzzzz');
  state = await evaluate(client, `(() => ({
    optionCount: document.querySelectorAll('#country-listbox [role="option"]').length,
    message: document.querySelector('.onboarding-no-results')?.textContent.trim() ?? ''
  }))()`);
  check("no country result message is shown", state.optionCount === 0 && state.message === "No country found", state);

  await setInput(client, '#country-options input', 'A');
  await evaluate(client, "document.querySelector('#country-options input').focus(); true");
  await pressKey(client, "ArrowDown", "ArrowDown");
  await pressKey(client, "Enter", "Enter");
  state = await evaluate(client, `(() => ({
    expanded: document.querySelector('[aria-controls="country-options"]').getAttribute('aria-expanded'),
    value: document.querySelector('[aria-controls="country-options"] span').textContent.trim()
  }))()`);
  check("arrow and Enter select one country and close the menu", state.expanded === "false" && state.value.normalize("NFD").replace(/\p{Diacritic}/gu, "").startsWith("A"), state);

  await click(client, '[aria-controls="country-options"]');
  await evaluate(client, "document.querySelector('#country-options input').focus(); true");
  await pressKey(client, "Escape", "Escape");
  state = await evaluate(client, "document.querySelector('[aria-controls=\"country-options\"]').getAttribute('aria-expanded')");
  check("Escape closes the country menu", state === "false", { expanded: state });

  await evaluate(client, "localStorage.setItem('normcore-language', 'fr'); window.dispatchEvent(new Event('normcore-language-change')); true");
  await delay(250);
  await click(client, '[aria-controls="country-options"]');
  state = await evaluate(client, `(() => {
    const labels = Array.from(document.querySelectorAll('#country-listbox [role="option"]')).map((option) => option.textContent.trim());
    return {
      labels,
      fieldLabel: document.getElementById('country-label')?.textContent.trim() ?? '',
      sorted: labels.every((label, index) => index === 0 || labels[index - 1].localeCompare(label, 'fr', { sensitivity: 'base' }) <= 0),
      hasFrenchGermany: labels.includes('Allemagne'),
      hasEnglishGermany: labels.includes('Germany')
    };
  })()`);
  check("country names follow the landing language in French", state.fieldLabel.startsWith("Pays principal") && state.sorted && state.hasFrenchGermany && !state.hasEnglishGermany, state);
  await setInput(client, '#country-options input', 'zzzzzz');
  state = await evaluate(client, "document.querySelector('.onboarding-no-results')?.textContent.trim() ?? ''");
  check("French no-result message is shown", state === "Aucun pays trouvé", { message: state });
  await pressKey(client, "Escape", "Escape");
  await evaluate(client, "localStorage.setItem('normcore-language', 'en'); window.dispatchEvent(new Event('normcore-language-change')); true");
  await delay(250);

  await click(client, ".onboarding-continue");

  state = await evaluate(client, `(() => ({
    expanded: document.querySelector('[aria-controls="industry-options"]').getAttribute('aria-expanded'),
    dropdown: Boolean(document.getElementById('industry-options'))
  }))()`);
  check("industry menu is closed on initial display", state.expanded === "false" && !state.dropdown, state);
  await delay(400);
  state = await evaluate(client, "document.querySelector('[aria-controls=\"industry-options\"]').getAttribute('aria-expanded')");
  check("industry menu does not open without interaction", state === "false", { expanded: state });
  await capture(client, "industry-closed");

  await evaluate(client, "document.querySelector('[aria-controls=\"industry-options\"]').focus(); true");
  await pressKey(client, "Enter", "Enter");
  state = await evaluate(client, "document.querySelector('[aria-controls=\"industry-options\"]').getAttribute('aria-expanded')");
  check("Enter opens the industry menu", state === "true", { expanded: state });
  await pressKey(client, "Escape", "Escape");
  state = await evaluate(client, "document.querySelector('[aria-controls=\"industry-options\"]').getAttribute('aria-expanded')");
  check("Escape closes the industry menu", state === "false", { expanded: state });

  await pressKey(client, " ", "Space");
  state = await evaluate(client, "document.querySelector('[aria-controls=\"industry-options\"]').getAttribute('aria-expanded')");
  check("Space opens the industry menu", state === "true", { expanded: state });
  await client.send("Input.dispatchMouseEvent", { type: "mousePressed", x: 18, y: 120, button: "left", clickCount: 1 });
  await client.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: 18, y: 120, button: "left", clickCount: 1 });
  await delay(180);
  state = await evaluate(client, "document.querySelector('[aria-controls=\"industry-options\"]').getAttribute('aria-expanded')");
  check("outside click closes the industry menu", state === "false", { expanded: state });

  await click(client, '[aria-controls="industry-options"]');
  await click(client, '[data-industry-id="software-saas"]');
  state = await evaluate(client, `(() => ({
    expanded: document.querySelector('[aria-controls="industry-options"]').getAttribute('aria-expanded'),
    savedIndustry: JSON.parse(localStorage.getItem('normcore-onboarding-organization-v1')).industryId,
    value: document.querySelector('[aria-controls="industry-options"] span').textContent.trim()
  }))()`);
  check("industry selection is unique and closes the menu", state.expanded === "false" && state.savedIndustry === "software-saas" && state.value === "Software / SaaS", state);

  await click(client, '[aria-controls="industry-options"]');
  state = await evaluate(client, `(() => ({
    selected: Array.from(document.querySelectorAll('.industry-options [aria-selected="true"]')).map((item) => item.dataset.industryId)
  }))()`);
  check("only the saved industry is selected when reopened", state.selected.length === 1 && state.selected[0] === "software-saas", state);
  await click(client, '[data-industry-id="other"]');
  state = await evaluate(client, `(() => ({
    expanded: document.querySelector('[aria-controls="industry-options"]').getAttribute('aria-expanded'),
    otherVisible: Boolean(document.querySelector('.onboarding-other-field input')),
    otherRequired: document.querySelector('.onboarding-other-field input')?.required ?? false,
    value: document.querySelector('[aria-controls="industry-options"] span').textContent.trim()
  }))()`);
  check("Other closes the menu and shows a required free-text field", state.expanded === "false" && state.otherVisible && state.otherRequired && state.value === "Other", state);
  await capture(client, "industry-other");

  await click(client, ".onboarding-continue");
  state = await evaluate(client, `(() => ({
    error: document.querySelector('.onboarding-status .is-error')?.textContent.trim() ?? '',
    saved: document.querySelector('.onboarding-status p:not(.is-error)')?.textContent.trim() ?? ''
  }))()`);
  check("blank Other value blocks completion", Boolean(state.error) && !state.saved, state);

  await setInput(client, ".onboarding-other-field input", "Renewable energy services");
  await click(client, ".onboarding-continue");
  state = await evaluate(client, `(() => ({
    error: document.querySelector('.onboarding-status .is-error')?.textContent.trim() ?? '',
    saved: document.querySelector('.onboarding-status p:not(.is-error)')?.textContent.trim() ?? ''
  }))()`);
  check("completed Other value allows saving", !state.error && Boolean(state.saved), state);
} finally {
  const report = {
    generatedAt: new Date().toISOString(),
    appOrigin,
    passed: results.filter((result) => result.passed).length,
    failed: results.filter((result) => !result.passed).length,
    results,
  };
  await writeFile(path.join(outputDir, "onboarding-fields-qa-report.json"), `${JSON.stringify(report, null, 2)}\n`);
  client.close();
}

for (const result of results) console.log(`${result.passed ? "PASS" : "FAIL"} ${result.name}`);
