import puppeteer from "puppeteer-core";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const userDataDir = path.resolve(`./tmp-profile-${Date.now()}`);
await mkdir(userDataDir, { recursive: true });

const configs = [
  {
    name: "Edge + headless:new + WebSocket",
    opts: {
      executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
      headless: "new",
      userDataDir,
      args: ["--no-sandbox"],
      dumpio: true,
    },
  },
  {
    name: "Chrome + headless:true + WebSocket",
    opts: {
      executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      headless: true,
      userDataDir,
      args: ["--no-sandbox"],
      dumpio: true,
    },
  },
];

for (const cfg of configs) {
  const fresh = userDataDir + "-" + cfg.name.replace(/\W+/g, "_");
  await mkdir(fresh, { recursive: true });
  cfg.opts.userDataDir = fresh;
  console.log(`\n=== Trying: ${cfg.name} ===`);
  try {
    const browser = await puppeteer.launch(cfg.opts);
    const v = await browser.version();
    console.log("SUCCESS:", v);
    await browser.close();
    process.exit(0);
  } catch (e) {
    console.log("FAILED:", e.message);
  }
}
console.log("\nAll attempts failed.");
process.exit(1);
