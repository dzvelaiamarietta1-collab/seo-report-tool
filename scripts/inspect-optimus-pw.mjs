// Playwright-based inspector for v0-optimus-delta.vercel.app
// Captures structure, design tokens, motion declarations, and screenshots
// into docs/optimus-inspection/. Used as reference material to inform a
// from-scratch rebuild in Georgian for our SEO audit tool.

import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const TARGET = "https://v0-optimus-delta.vercel.app/";
const OUT_DIR = path.resolve("docs/optimus-inspection");

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function run() {
  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(path.join(OUT_DIR, "screenshots"), { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  console.log("Loading", TARGET);
  await page.goto(TARGET, { waitUntil: "networkidle", timeout: 60_000 });
  await wait(2500);

  // -- Full desktop screenshot
  await page.screenshot({
    path: path.join(OUT_DIR, "screenshots", "full-desktop.png"),
    fullPage: true,
  });
  console.log("OK full-desktop.png");

  // -- Identify sections
  const sectionAnchors = await page.evaluate(() => {
    const sections = Array.from(document.querySelectorAll("section, header, footer, main > div"));
    return sections.slice(0, 20).map((el, i) => {
      const rect = el.getBoundingClientRect();
      return {
        index: i,
        tag: el.tagName.toLowerCase(),
        id: el.id || null,
        cls: (el.className || "").toString().slice(0, 200),
        y: rect.top + window.scrollY,
        height: Math.round(rect.height),
        textPreview: (el.innerText || "").replace(/\s+/g, " ").slice(0, 100),
      };
    });
  });
  await writeFile(
    path.join(OUT_DIR, "section-anchors.json"),
    JSON.stringify(sectionAnchors, null, 2),
    "utf8"
  );
  console.log(`OK section-anchors.json (${sectionAnchors.length})`);

  // -- Design tokens
  const tokens = await page.evaluate(() => {
    const pick = (el, props) =>
      el ? Object.fromEntries(props.map((p) => [p, getComputedStyle(el).getPropertyValue(p)])) : null;

    const root = document.documentElement;
    const body = document.body;
    const h1 = document.querySelector("h1");
    const h2s = Array.from(document.querySelectorAll("h2")).slice(0, 5);
    const h3s = Array.from(document.querySelectorAll("h3")).slice(0, 5);
    const nav = document.querySelector("nav, header");
    const buttons = Array.from(document.querySelectorAll("a[class], button[class]")).slice(0, 8);
    const sections = Array.from(document.querySelectorAll("section")).slice(0, 8);

    const rootStyles = getComputedStyle(root);
    const customProps = {};
    for (let i = 0; i < rootStyles.length; i++) {
      const prop = rootStyles[i];
      if (prop.startsWith("--")) customProps[prop] = rootStyles.getPropertyValue(prop).trim();
    }

    const typoProps = ["font-family","font-size","font-weight","line-height","letter-spacing","color","text-transform"];
    const boxProps = ["background-color","border","border-radius","padding","margin","box-shadow","width","height","display","gap"];

    return {
      rootCustomProps: customProps,
      bodyFont: pick(body, typoProps),
      bodyBg: pick(body, ["background-color","color"]),
      h1: h1 ? { ...pick(h1, [...typoProps, "max-width"]), text: h1.innerText.slice(0, 120) } : null,
      h2: h2s.map(el => ({ ...pick(el, typoProps), text: el.innerText.slice(0, 80) })),
      h3: h3s.map(el => ({ ...pick(el, typoProps), text: el.innerText.slice(0, 80) })),
      nav: pick(nav, [...typoProps, ...boxProps]),
      buttons: buttons.map(b => ({
        text: (b.innerText || "").trim().slice(0, 40),
        cls: (b.className || "").toString().slice(0, 200),
        styles: pick(b, [...typoProps, ...boxProps]),
      })),
      sectionBackgrounds: sections.map(s => ({
        cls: (s.className || "").toString().slice(0, 200),
        bg: getComputedStyle(s).backgroundColor,
        color: getComputedStyle(s).color,
        padding: getComputedStyle(s).padding,
        textPreview: (s.innerText || "").replace(/\s+/g, " ").slice(0, 60),
      })),
    };
  });
  await writeFile(
    path.join(OUT_DIR, "design-tokens.json"),
    JSON.stringify(tokens, null, 2),
    "utf8"
  );
  console.log("OK design-tokens.json");

  // -- Motion / transition / animation declarations
  const motion = await page.evaluate(() => {
    const out = { keyframes: [], transitions: [], animations: [] };
    try {
      for (const sheet of Array.from(document.styleSheets)) {
        let rules;
        try { rules = sheet.cssRules; } catch { continue; }
        if (!rules) continue;
        for (const rule of Array.from(rules)) {
          if (rule.type === CSSRule.KEYFRAMES_RULE) {
            out.keyframes.push({ name: rule.name, cssText: rule.cssText.slice(0, 800) });
          } else if (rule.style) {
            const t = rule.style.transition || rule.style.getPropertyValue("transition");
            const a = rule.style.animation || rule.style.getPropertyValue("animation");
            if (t) out.transitions.push({ selector: rule.selectorText, value: t });
            if (a) out.animations.push({ selector: rule.selectorText, value: a });
          }
        }
      }
    } catch (e) {
      out.error = e.message;
    }
    const dedupe = (arr) => Array.from(new Set(arr.map(x => JSON.stringify(x)))).map(s => JSON.parse(s));
    return {
      keyframes: dedupe(out.keyframes).slice(0, 60),
      transitions: dedupe(out.transitions).slice(0, 80),
      animations: dedupe(out.animations).slice(0, 60),
    };
  });
  await writeFile(
    path.join(OUT_DIR, "motion.json"),
    JSON.stringify(motion, null, 2),
    "utf8"
  );
  console.log(`OK motion.json (${motion.keyframes.length} kf, ${motion.transitions.length} tr, ${motion.animations.length} an)`);

  // -- Structural outline (no text content, just element tree + classes)
  const outline = await page.evaluate(() => {
    const walk = (el, depth = 0) => {
      if (depth > 14) return "";
      if (el.nodeType !== 1) return "";
      const tag = el.tagName.toLowerCase();
      const skip = ["script", "style", "noscript", "path", "g", "circle", "rect", "line", "polyline", "polygon"];
      if (skip.includes(tag)) return "";
      const cls = (el.className || "").toString().slice(0, 160);
      const onlyText = el.childNodes.length === 1 && el.childNodes[0].nodeType === 3;
      const text = onlyText ? ` "${el.textContent.trim().slice(0, 80)}"` : "";
      const indent = "  ".repeat(depth);
      const children = Array.from(el.children).map(c => walk(c, depth + 1)).filter(Boolean).join("\n");
      return `${indent}<${tag}${cls ? ` class="${cls}"` : ""}>${text}${children ? "\n" + children : ""}`;
    };
    return walk(document.body);
  });
  await writeFile(
    path.join(OUT_DIR, "outline.html.txt"),
    outline,
    "utf8"
  );
  console.log(`OK outline.html.txt (${outline.length} bytes)`);

  // -- Section screenshots (scroll & viewport-clip)
  let captured = 0;
  for (let i = 0; i < Math.min(sectionAnchors.length, 16); i++) {
    const s = sectionAnchors[i];
    if (s.height < 200 || s.height > 4000) continue;
    await page.evaluate((y) => window.scrollTo(0, y - 20), s.y);
    await wait(700);
    await page.screenshot({
      path: path.join(OUT_DIR, "screenshots", `section-${String(i).padStart(2, "0")}.png`),
      clip: { x: 0, y: 20, width: 1440, height: Math.min(900, s.height + 40) },
    });
    captured++;
  }
  console.log(`OK ${captured} section screenshots`);

  // -- Hover states
  await page.evaluate(() => window.scrollTo(0, 0));
  await wait(500);
  const hoverTargets = [
    { name: "nav-link", sel: "header a, nav a", index: 1 },
    { name: "primary-cta", sel: "a[class*='bg-'], button[class*='bg-']", index: 0 },
    { name: "capability-row", sel: "section:has(h2) > div > div, article", index: 0 },
  ];
  for (const t of hoverTargets) {
    try {
      const locator = page.locator(t.sel).nth(t.index);
      if (await locator.count() === 0) continue;
      await locator.scrollIntoViewIfNeeded();
      await wait(300);
      const box = await locator.boundingBox();
      if (!box) continue;
      const clip = {
        x: Math.max(0, box.x - 30),
        y: Math.max(0, box.y - 30),
        width: Math.min(900, box.width + 60),
        height: Math.min(500, box.height + 60),
      };
      await page.screenshot({
        path: path.join(OUT_DIR, "screenshots", `hover-${t.name}-before.png`),
        clip,
      });
      await locator.hover();
      await wait(500);
      await page.screenshot({
        path: path.join(OUT_DIR, "screenshots", `hover-${t.name}-after.png`),
        clip,
      });
      console.log(`OK hover-${t.name}`);
    } catch (e) {
      console.log(`hover ${t.name} skipped: ${e.message}`);
    }
  }

  // -- Mobile full
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await wait(900);
  await page.screenshot({
    path: path.join(OUT_DIR, "screenshots", "full-mobile.png"),
    fullPage: true,
  });
  console.log("OK full-mobile.png");

  // -- Save raw HTML for cheerio parsing later if needed
  const html = await page.content();
  await writeFile(path.join(OUT_DIR, "raw.html"), html, "utf8");
  console.log(`OK raw.html (${html.length} bytes)`);

  await browser.close();
  console.log("\nDone:", OUT_DIR);
}

run().catch(e => { console.error("FATAL:", e); process.exit(1); });
