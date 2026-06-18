// One-off inspector for v0-optimus-delta.vercel.app
// Captures structure, design tokens, and screenshots into docs/optimus-inspection/
// Goal: understand layout & motion language so we can write fresh code that matches the feel.

import puppeteer from "puppeteer-core";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const TARGET = "https://v0-optimus-delta.vercel.app/";
const OUT_DIR = path.resolve("docs/optimus-inspection");
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BROWSER_BIN = EDGE; // Edge avoids conflicting with the user's live Chrome session

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function run() {
  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(path.join(OUT_DIR, "screenshots"), { recursive: true });

  const userDataDir = path.join(OUT_DIR, `.browser-profile-${Date.now()}`);
  const browser = await puppeteer.launch({
    executablePath: BROWSER_BIN,
    headless: "new",
    userDataDir,
    pipe: true, // bypass WebSocket port singleton check
    defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
    args: [
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-features=Translate,OptimizationHints",
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

  console.log("Loading", TARGET);
  await page.goto(TARGET, { waitUntil: "networkidle2", timeout: 60_000 });
  await wait(2500); // let animations settle

  // -- Full-page desktop screenshot
  await page.screenshot({
    path: path.join(OUT_DIR, "screenshots", "full-desktop.png"),
    fullPage: true,
  });
  console.log("✓ full-desktop.png");

  // -- Section-by-section viewport screenshots (scroll & capture)
  const sectionAnchors = await page.evaluate(() => {
    const sections = Array.from(document.querySelectorAll("section, header, footer, main > div"));
    return sections.slice(0, 20).map((el, i) => {
      const rect = el.getBoundingClientRect();
      return {
        index: i,
        tag: el.tagName.toLowerCase(),
        id: el.id || null,
        cls: (el.className || "").toString().slice(0, 120),
        y: rect.top + window.scrollY,
        height: Math.round(rect.height),
        textPreview: (el.innerText || "").replace(/\s+/g, " ").slice(0, 80),
      };
    });
  });
  await writeFile(
    path.join(OUT_DIR, "section-anchors.json"),
    JSON.stringify(sectionAnchors, null, 2),
    "utf8"
  );
  console.log(`✓ section-anchors.json — ${sectionAnchors.length} candidates`);

  // -- Design tokens: computed styles on representative elements
  const tokens = await page.evaluate(() => {
    const pick = (el, props) =>
      el ? Object.fromEntries(props.map((p) => [p, getComputedStyle(el).getPropertyValue(p)])) : null;

    const root = document.documentElement;
    const body = document.body;
    const h1 = document.querySelector("h1");
    const h2 = document.querySelector("h2");
    const nav = document.querySelector("nav, header");
    const primaryBtn = document.querySelector("a[href], button");
    const allButtons = Array.from(document.querySelectorAll("a, button")).slice(0, 10);

    // Pull all CSS custom properties from :root
    const rootStyles = getComputedStyle(root);
    const customProps = {};
    for (let i = 0; i < rootStyles.length; i++) {
      const prop = rootStyles[i];
      if (prop.startsWith("--")) {
        customProps[prop] = rootStyles.getPropertyValue(prop).trim();
      }
    }

    const typoProps = [
      "font-family", "font-size", "font-weight", "line-height",
      "letter-spacing", "color", "text-transform",
    ];
    const boxProps = [
      "background-color", "border", "border-radius", "padding",
      "margin", "box-shadow", "color",
    ];

    return {
      rootCustomProps: customProps,
      bodyFont: pick(body, typoProps),
      h1: h1 ? { ...pick(h1, typoProps), tag: "h1", text: h1.innerText.slice(0, 100) } : null,
      h2: h2 ? { ...pick(h2, typoProps), tag: "h2", text: h2.innerText.slice(0, 100) } : null,
      nav: pick(nav, [...typoProps, ...boxProps]),
      primaryBtn: pick(primaryBtn, [...typoProps, ...boxProps]),
      buttonSamples: allButtons.map((b) => ({
        text: (b.innerText || "").trim().slice(0, 30),
        styles: pick(b, [...typoProps, ...boxProps]),
      })),
    };
  });
  await writeFile(
    path.join(OUT_DIR, "design-tokens.json"),
    JSON.stringify(tokens, null, 2),
    "utf8"
  );
  console.log("✓ design-tokens.json");

  // -- All animation/transition declarations across stylesheets
  const motion = await page.evaluate(() => {
    const out = { keyframes: [], transitions: [], animations: [], transforms: [] };
    try {
      for (const sheet of Array.from(document.styleSheets)) {
        let rules;
        try { rules = sheet.cssRules; } catch { continue; }
        if (!rules) continue;
        for (const rule of Array.from(rules)) {
          if (rule.type === CSSRule.KEYFRAMES_RULE) {
            out.keyframes.push({ name: rule.name, cssText: rule.cssText.slice(0, 500) });
          } else if (rule.style) {
            const t = rule.style.transition || rule.style.getPropertyValue("transition");
            const a = rule.style.animation || rule.style.getPropertyValue("animation");
            const xf = rule.style.transform || rule.style.getPropertyValue("transform");
            if (t) out.transitions.push({ selector: rule.selectorText, value: t });
            if (a) out.animations.push({ selector: rule.selectorText, value: a });
            if (xf && xf !== "none") out.transforms.push({ selector: rule.selectorText, value: xf });
          }
        }
      }
    } catch (e) {
      out.error = e.message;
    }
    // dedupe by string key
    const dedupe = (arr) => Array.from(new Set(arr.map((x) => JSON.stringify(x)))).map((s) => JSON.parse(s));
    return {
      keyframes: dedupe(out.keyframes).slice(0, 40),
      transitions: dedupe(out.transitions).slice(0, 60),
      animations: dedupe(out.animations).slice(0, 40),
      transforms: dedupe(out.transforms).slice(0, 40),
    };
  });
  await writeFile(
    path.join(OUT_DIR, "motion.json"),
    JSON.stringify(motion, null, 2),
    "utf8"
  );
  console.log(`✓ motion.json — ${motion.keyframes.length} keyframes, ${motion.transitions.length} transitions, ${motion.animations.length} animations`);

  // -- Outline HTML: strip text content, keep structure (helps see component shape)
  const outline = await page.evaluate(() => {
    const walk = (el, depth = 0) => {
      if (depth > 12) return "";
      if (el.nodeType !== 1) return "";
      const tag = el.tagName.toLowerCase();
      const skip = ["script", "style", "noscript", "svg", "path", "g", "circle", "rect", "line"];
      if (skip.includes(tag)) return "";
      const cls = (el.className || "").toString().slice(0, 80);
      const text = (el.childNodes.length === 1 && el.childNodes[0].nodeType === 3)
        ? ` "${el.textContent.trim().slice(0, 60)}"`
        : "";
      const indent = "  ".repeat(depth);
      const children = Array.from(el.children).map((c) => walk(c, depth + 1)).filter(Boolean).join("\n");
      return `${indent}<${tag}${cls ? ` class="${cls}"` : ""}>${text}\n${children}`;
    };
    return walk(document.body);
  });
  await writeFile(
    path.join(OUT_DIR, "outline.html.txt"),
    outline,
    "utf8"
  );
  console.log(`✓ outline.html.txt — ${outline.length} bytes`);

  // -- Section screenshots: scroll and capture
  for (let i = 0; i < Math.min(sectionAnchors.length, 14); i++) {
    const s = sectionAnchors[i];
    if (s.height < 200) continue;
    await page.evaluate((y) => window.scrollTo(0, y - 20), s.y);
    await wait(600);
    await page.screenshot({
      path: path.join(OUT_DIR, "screenshots", `section-${String(i).padStart(2, "0")}.png`),
      clip: { x: 0, y: 20, width: 1440, height: Math.min(900, s.height + 40) },
    });
  }
  console.log(`✓ ${Math.min(sectionAnchors.length, 14)} section screenshots`);

  // -- Hover states on key elements
  await page.evaluate(() => window.scrollTo(0, 0));
  await wait(500);
  const hoverTargets = [
    { name: "nav-link", sel: "header a, nav a", index: 1 },
    { name: "primary-cta", sel: "a, button", index: 0 },
    { name: "card", sel: "article, [class*='card']", index: 0 },
  ];
  for (const t of hoverTargets) {
    const handle = await page.evaluateHandle(({ sel, index }) => {
      const els = document.querySelectorAll(sel);
      return els[index] || null;
    }, t);
    const el = handle.asElement();
    if (!el) continue;
    try {
      await el.scrollIntoView();
      await wait(300);
      const box = await el.boundingBox();
      if (!box) continue;
      // baseline
      await page.screenshot({
        path: path.join(OUT_DIR, "screenshots", `hover-${t.name}-before.png`),
        clip: {
          x: Math.max(0, box.x - 20),
          y: Math.max(0, box.y - 20),
          width: Math.min(800, box.width + 40),
          height: Math.min(400, box.height + 40),
        },
      });
      // hover
      await el.hover();
      await wait(400);
      await page.screenshot({
        path: path.join(OUT_DIR, "screenshots", `hover-${t.name}-after.png`),
        clip: {
          x: Math.max(0, box.x - 20),
          y: Math.max(0, box.y - 20),
          width: Math.min(800, box.width + 40),
          height: Math.min(400, box.height + 40),
        },
      });
    } catch (e) {
      console.log(`hover ${t.name} skipped: ${e.message}`);
    }
  }
  console.log("✓ hover screenshots");

  // -- Mobile screenshot
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true });
  await page.evaluate(() => window.scrollTo(0, 0));
  await wait(800);
  await page.screenshot({
    path: path.join(OUT_DIR, "screenshots", "full-mobile.png"),
    fullPage: true,
  });
  console.log("✓ full-mobile.png");

  await browser.close();
  console.log("\nDone. Output:", OUT_DIR);
}

run().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
