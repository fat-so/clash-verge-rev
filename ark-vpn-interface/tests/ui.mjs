import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const page = await browser.newPage({
  viewport: { width: 1440, height: 1050 },
  deviceScaleFactor: 1,
});
const errors = [];
const requests = [];
const checks = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("request", (r) => requests.push(r.url()));
const check = (ok, name) => {
  if (!ok) throw Error(name);
  checks.push(name);
};
await mkdir("screenshots", { recursive: true });
await page.goto("http://127.0.0.1:5173");
await page.waitForLoadState("networkidle");
await page.screenshot({
  path: "screenshots/01-overview-desktop.png",
  fullPage: true,
});
check(
  await page.getByRole("heading", { name: "世界很大，自由連上。" }).isVisible(),
  "Overview renders",
);
await page.getByRole("button", { name: "開始連線", exact: true }).click();
await page.getByRole("button", { name: "中斷連線", exact: true }).waitFor();
check(
  await page.getByText("自在，已連線。").isVisible(),
  "Local connection state transition",
);
await page.screenshot({
  path: "screenshots/02-overview-connected.png",
  fullPage: true,
});
await page.getByRole("button", { name: "中斷連線", exact: true }).click();
await page.locator(".selected-location").click();
await page.getByRole("textbox", { name: "搜尋國家或城市" }).fill("London");
await page.getByRole("button", { name: /英國.*倫敦.*United Kingdom/ }).click();
check(
  await page
    .locator(".selected-location")
    .innerText()
    .then((t) => t.includes("倫敦")),
  "Location dialog search and selection",
);
await page
  .getByRole("navigation")
  .getByRole("button", { name: "連線位置" })
  .click();
await page.getByRole("textbox", { name: "搜尋國家或城市" }).fill("不存在");
check(
  await page.getByText("找不到符合的位置").isVisible(),
  "Location empty search",
);
await page.getByRole("button", { name: "清除搜尋" }).click();
await page.getByRole("button", { name: "收藏倫敦", exact: true }).click();
await page.getByRole("button", { name: "我的最愛", exact: true }).click();
check(
  await page
    .getByRole("button", { name: "取消收藏倫敦", exact: true })
    .isVisible(),
  "Favorite toggle and filtering",
);
await page.getByRole("button", { name: "全部位置", exact: true }).click();
await page.screenshot({
  path: "screenshots/03-locations-desktop.png",
  fullPage: true,
});
await page
  .getByRole("navigation")
  .getByRole("button", { name: "流量規則" })
  .click();
await page.getByRole("button", { name: "全域模式", exact: false }).click();
await page.getByRole("button", { name: "新增規則" }).click();
await page.getByLabel("規則名稱").fill("工作空間");
await page.getByLabel("網域後綴").fill("example.com");
await page.getByRole("button", { name: "加入規則" }).click();
check(
  await page.getByText("DOMAIN-SUFFIX · example.com").isVisible(),
  "Add local routing rule",
);
await page.screenshot({
  path: "screenshots/04-routing-desktop.png",
  fullPage: true,
});
await page.getByRole("button", { name: "刪除工作空間" }).click();
check(
  (await page.getByText("DOMAIN-SUFFIX · example.com").count()) === 0,
  "Delete custom routing rule",
);
await page
  .getByRole("navigation")
  .getByRole("button", { name: "訂閱管理" })
  .click();
await page.getByRole("button", { name: "使用訂閱", exact: true }).click();
check(
  (await page.locator(".subscription-hero h2").innerText()) === "日常備用",
  "Switch subscription",
);
await page.getByRole("button", { name: "新增訂閱" }).click();
await page.getByLabel("訂閱名稱").fill("週末旅行");
await page.getByLabel("訂閱網址").fill("https://example.com/subscribe");
await page.getByRole("button", { name: "加入訂閱" }).click();
check(
  (await page.locator(".subscription-row").count()) === 3,
  "Add local subscription without request",
);
await page.getByRole("button", { name: "全部重新整理" }).click();
await page.getByText("訂閱資訊已重新整理").waitFor();
await page.screenshot({
  path: "screenshots/05-subscriptions-desktop.png",
  fullPage: true,
});
await page
  .getByRole("navigation")
  .getByRole("button", { name: "偏好設定" })
  .click();
await page.getByRole("switch", { name: "TUN 模式", exact: true }).click();
check(
  (await page
    .getByRole("switch", { name: "TUN 模式", exact: true })
    .getAttribute("aria-checked")) === "true",
  "Settings toggle",
);
await page.screenshot({
  path: "screenshots/06-settings-desktop.png",
  fullPage: true,
});
await page
  .getByRole("navigation")
  .getByRole("button", { name: "總覽", exact: true })
  .click();
check(
  (await page
    .getByRole("switch", { name: "TUN 模式", exact: true })
    .getAttribute("aria-checked")) === "true",
  "Settings synchronized with overview",
);
await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({
  path: "screenshots/07-overview-mobile.png",
  fullPage: true,
});
check(
  await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth,
  ),
  "No mobile horizontal overflow",
);
await page.getByRole("button", { name: "開啟選單" }).click();
await page
  .getByRole("navigation")
  .getByRole("button", { name: "連線位置" })
  .click();
check(
  await page
    .getByRole("heading", { name: "連線位置", exact: true })
    .isVisible(),
  "Mobile navigation",
);
await page.screenshot({
  path: "screenshots/08-locations-mobile.png",
  fullPage: true,
});
check(
  !/開發中|不能用|設計語言|原型|prototype/i.test(
    await page.locator("body").innerText(),
  ),
  "Excluded UI disclaimers absent",
);
check(errors.length === 0, "No browser runtime errors");
check(
  requests.every(
    (u) => u.startsWith("http://127.0.0.1:5173/") || u.startsWith("data:"),
  ),
  "No external requests or API calls",
);
await writeFile(
  "tests/results.json",
  JSON.stringify(
    {
      checks,
      errors,
      requestOrigins: [...new Set(requests.map((u) => new URL(u).origin))],
      screenshots: 8,
    },
    null,
    2,
  ),
);
console.log(JSON.stringify({ passed: checks.length, checks, errors }, null, 2));
await browser.close();
