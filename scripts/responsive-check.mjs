import { existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright-core";
import { preview } from "vite";

const root = path.resolve(import.meta.dirname, "..");
const artifacts = path.join(root, "artifacts");
const PORT = 4173;
const baseUrl = `http://127.0.0.1:${PORT}`;

const chromeCandidates = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "/usr/bin/google-chrome",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter(Boolean);

const executablePath = chromeCandidates.find((candidate) => existsSync(candidate));

if (!executablePath) {
  console.error("No Chrome/Edge executable found. Set CHROME_PATH and retry.");
  process.exit(1);
}

if (!existsSync(path.join(root, "dist", "index.html"))) {
  console.error("dist/index.html not found. Run `npm run build` first.");
  process.exit(1);
}

mkdirSync(artifacts, { recursive: true });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {
      // Server not ready yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("Preview server did not start in time.");
}

async function assertNoHorizontalOverflow(page, label) {
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  assert(
    overflow.scrollWidth <= overflow.clientWidth + 1,
    `${label}: horizontal overflow (${overflow.scrollWidth}px > ${overflow.clientWidth}px)`
  );
  console.log(`  ✓ ${label}: no horizontal overflow (${overflow.clientWidth}px viewport)`);
}

async function fillClientDetails(page, projectTitle) {
  await page.locator("#client-fullName").fill("Alex Rivera");
  await page.locator("#client-businessName").fill("Northline Coffee");
  await page.locator("#client-email").fill("client@example.com");
  await page.locator("#client-contactNumber").fill("0917 123 4567");
  await page.locator("#client-projectTitle").fill(projectTitle);
  await page
    .locator("#client-projectDescription")
    .fill("A launch campaign with a clear, editorial visual direction.");
  await page
    .locator("#client-specialInstructions")
    .fill("Use the existing brand palette and include the brand mark.");
}

async function assertSkipLinkHidden(page, label) {
  const result = await page.evaluate(() => {
    const element = document.querySelector(".skip-link");
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    return {
      bottom: rect.bottom,
      active: document.activeElement === element,
    };
  });
  assert(result, `${label}: skip link not found.`);
  assert(!result.active, `${label}: skip link should not hold focus.`);
  assert(
    result.bottom <= 1,
    `${label}: skip link is visible without focus (bottom ${result.bottom}px).`
  );
}

async function selectService(page, name) {
  const card = page
    .locator(".service-card")
    .filter({ hasText: name })
    .first();
  await card.click();
  await page.locator("#calculator").waitFor();
  await page.locator("#price-summary").waitFor();
}

async function runDesktop(browser) {
  console.log("\nDesktop 1440 × 1000");
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto(baseUrl, { waitUntil: "networkidle" });

  assert(
    (await page.locator(".service-card").count()) === 23,
    "Expected all 23 workbook services to render."
  );
  await assertNoHorizontalOverflow(page, "Landing page");
  await assertSkipLinkHidden(page, "Desktop landing page");
  await page.screenshot({
    path: path.join(artifacts, "desktop-landing.png"),
  });

  await selectService(page, "Logo Design");
  await fillClientDetails(page, "Northline Coffee logo");
  await page.locator("#service-quantity").fill("2");
  await page
    .locator(".choice-card")
    .filter({ hasText: "Complex" })
    .first()
    .click();
  await page
    .locator(".choice-card")
    .filter({ hasText: "Needs copywriting" })
    .first()
    .click();
  await page
    .locator(".choice-card")
    .filter({ hasText: "Needs photo editing" })
    .first()
    .click();
  await page
    .locator(".choice-card")
    .filter({ hasText: "Express" })
    .first()
    .click();

  const fixedWarning = await page
    .locator(".inline-alert")
    .filter({ hasText: "Fixed-price package" })
    .count();
  assert(fixedWarning > 0, "Expected the fixed-price quantity warning.");
  const summary = await page.locator("#price-summary").innerText();
  assert(/Estimated total/.test(summary), "Expected an estimated total.");
  assert(/Express fee/i.test(summary), "Expected the Express fee in the summary.");

  await page.locator("#calculator").scrollIntoViewIfNeeded();
  await page.screenshot({
    path: path.join(artifacts, "desktop-calculator.png"),
  });

  await page.locator("#quotation").scrollIntoViewIfNeeded();
  await page.locator(".quotation-sheet").waitFor();
  const quoteSummary = await page.locator(".quotation-sheet").innerText();
  assert(/Northline Coffee logo/.test(quoteSummary), "Expected project title in quote.");
  assert(/Base Design Fee/.test(quoteSummary), "Expected the base fee line in the quote.");
  assert(/Copywriting/.test(quoteSummary), "Expected a separate copywriting line.");
  assert(/Photo Editing/.test(quoteSummary), "Expected a separate photo editing line.");
  assert(/Total estimated project fee/.test(quoteSummary), "Expected quote total row.");
  await page.screenshot({
    path: path.join(artifacts, "desktop-quotation-viewport.png"),
  });

  await page.locator(".quotation-actions button", { hasText: "Request This Quotation" }).click();
  await page.locator("#request-dialog-title").waitFor();
  assert(
    /Request this quotation/.test(await page.locator("#request-dialog-title").innerText()),
    "Expected the request dialog."
  );
  await page.locator(".acknowledgement input").check({ force: true });
  await page.getByRole("button", { name: /Continue to send options/i }).click();
  await page.getByText("Your quotation is ready to send", { exact: true }).waitFor();
  const sendOptions = await page.locator(".send-options").innerText();
  assert(/prefilled email draft/i.test(sendOptions), "Expected an email draft option.");
  assert(/Print or save as PDF/i.test(sendOptions), "Expected a print option.");
  const sendNote = await page.locator(".send-note").innerText();
  assert(/No request has been sent yet/i.test(sendNote), "Send confirmation must be honest.");
  const mailto = await page.locator('.send-option[href^="mailto:"]').getAttribute("href");
  assert(mailto?.startsWith("mailto:"), "Expected a prefilled mailto link.");
  await page.screenshot({
    path: path.join(artifacts, "desktop-request-dialog.png"),
  });
  await page.getByRole("button", { name: /^Done$/ }).click();

  const tableFits = await page.evaluate(() => {
    const wrap = document.querySelector(".quote-table-wrap");
    if (!wrap) return false;
    return wrap.scrollWidth <= wrap.clientWidth + 1;
  });
  assert(tableFits, "Quotation table overflows its container on desktop.");

  await page.pdf({
    path: path.join(artifacts, "quotation-a4.pdf"),
    format: "A4",
    printBackground: true,
  });
  const pdfSize = statSync(path.join(artifacts, "quotation-a4.pdf")).size;
  assert(pdfSize > 10_000, `Print PDF looks too small (${pdfSize} bytes).`);
  const pdfText = readFileSync(path.join(artifacts, "quotation-a4.pdf"), "latin1");
  const pageCount = Number(pdfText.match(/\/Count\s+(\d+)/)?.[1] ?? 0);
  assert(pageCount === 1, `Expected the sample A4 quotation to fit one page; got ${pageCount}.`);
  console.log(
    `  ✓ A4 print PDF generated (${(pdfSize / 1024).toFixed(0)} KB, ${pageCount} page)`
  );

  const mobileBarVisible = await page.locator(".mobile-summary").isVisible();
  assert(!mobileBarVisible, "Mobile summary bar should be hidden on desktop.");
  console.log("  ✓ compact mobile summary hidden on desktop");

  await page.close();
}

async function runMobile(browser) {
  console.log("\nMobile 390 × 844");
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await assertNoHorizontalOverflow(page, "Mobile landing page");
  await assertSkipLinkHidden(page, "Mobile landing page");
  await page.screenshot({
    path: path.join(artifacts, "mobile-landing.png"),
  });

  await selectService(page, "Social Media Graphics");
  const mobileBar = page.locator(".mobile-summary");
  assert(await mobileBar.isVisible(), "Expected the compact mobile summary bar.");

  await page.locator("#service-quantity").focus();
  await page.waitForTimeout(280);
  const barHiddenWhileEditing = await page.evaluate(() => {
    const element = document.querySelector(".mobile-summary");
    if (!element) return false;
    const style = getComputedStyle(element);
    return style.pointerEvents === "none" && parseFloat(style.opacity) < 0.1;
  });
  assert(
    barHiddenWhileEditing,
    "Compact summary should hide while a field is focused so it cannot cover inputs."
  );
  console.log("  ✓ compact summary hides while editing fields");
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  });
  await page.waitForTimeout(280);

  await fillClientDetails(page, "Meridian social campaign");
  await page.locator("#service-quantity").fill("5");
  await page
    .locator(".choice-card")
    .filter({ hasText: "Rush" })
    .first()
    .click();
  await page.locator('label[for="addon-mockups"]').click();
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  });
  await page.waitForTimeout(280);

  assert(await mobileBar.isVisible(), "Expected the compact mobile summary bar.");
  const barText = await mobileBar.innerText();
  assert(/estimated total/i.test(barText), "Expected compact total in mobile summary.");
  assert(/review quote/i.test(barText), "Expected a mobile review action.");
  console.log("  ✓ compact summary bar visible and actionable");

  const hasBottomPadding = await page.evaluate(() => {
    const shell = document.querySelector(".app-shell");
    return shell ? parseFloat(getComputedStyle(shell).paddingBottom) > 0 : false;
  });
  assert(hasBottomPadding, "Expected bottom padding so the summary bar does not cover fields.");

  await page.locator("#calculator").scrollIntoViewIfNeeded();
  await page.screenshot({
    path: path.join(artifacts, "mobile-calculator.png"),
  });

  await page.locator("#quotation").scrollIntoViewIfNeeded();
  await page.locator(".quotation-sheet").waitFor();
  await assertNoHorizontalOverflow(page, "Mobile quotation page");
  await assertSkipLinkHidden(page, "Mobile quotation page");
  const quoteSummary = await page.locator(".quotation-sheet").innerText();
  assert(/Meridian social campaign/.test(quoteSummary), "Expected mobile quote title.");
  assert(/5 graphics/.test(quoteSummary), "Expected dynamic per-unit quantity in quote.");
  assert(/Base Design Fee/.test(quoteSummary), "Expected base fee in mobile quote.");
  const tableFits = await page.evaluate(() => {
    const wrap = document.querySelector(".quote-table-wrap");
    if (!wrap) return false;
    return wrap.scrollWidth <= wrap.clientWidth + 1;
  });
  assert(tableFits, "Quotation table overflows on mobile.");
  console.log("  ✓ mobile quotation table fits the viewport");
  await page.screenshot({
    path: path.join(artifacts, "mobile-quotation.png"),
  });
  await page.locator(".quote-table").scrollIntoViewIfNeeded();
  await page.screenshot({
    path: path.join(artifacts, "mobile-quotation-table.png"),
  });

  await page.close();
}

async function runTablet(browser) {
  console.log("\nTablet 768 × 1024");
  const page = await browser.newPage({
    viewport: { width: 768, height: 1024 },
    hasTouch: true,
  });
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await assertNoHorizontalOverflow(page, "Tablet landing page");
  await selectService(page, "Menu Design");
  await page.locator("#service-quantity").fill("4");
  await fillClientDetails(page, "Harbour menu redesign");
  await assertNoHorizontalOverflow(page, "Tablet calculator page");
  await page.close();
}

async function runCustomReviewCheck(browser) {
  console.log("\nCustom-price manual review");
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await selectService(page, "Other Custom Design");

  const summary = await page.locator("#price-summary").innerText();
  assert(/Custom quotation required/i.test(summary), "Expected manual-review summary.");
  assert(!/Estimated total/i.test(summary), "Custom service must not show a total.");
  assert(/Request a custom quote/i.test(summary), "Expected a custom quote action.");

  await page.locator("#quotation").scrollIntoViewIfNeeded();
  const quote = await page.locator(".quotation-sheet").innerText();
  assert(/Custom quotation required/i.test(quote), "Expected custom notice in quote.");
  assert(/To be quoted/i.test(quote) || /confirmed after the scope review/i.test(quote), "Expected no arbitrary custom amount.");
  await page.screenshot({
    path: path.join(artifacts, "desktop-custom-review.png"),
  });
  console.log("  ✓ custom service shows manual review and no invented total");
  await page.close();
}

let server;

try {
  console.log(`Starting Vite preview at ${baseUrl}`);
  server = await preview({
    root,
    preview: {
      port: PORT,
      strictPort: true,
      host: "127.0.0.1",
    },
  });
  await waitForServer();

  const browser = await chromium.launch({
    executablePath,
    headless: true,
  });

  try {
    await runDesktop(browser);
    await runMobile(browser);
    await runTablet(browser);
    await runCustomReviewCheck(browser);
  } finally {
    await browser.close();
  }

  console.log("\nResponsive checks passed. Screenshots and PDF are in artifacts/.");
} finally {
  await server?.close();
}
