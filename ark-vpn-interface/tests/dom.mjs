import { JSDOM } from "jsdom";
import { build } from "esbuild";
import { writeFile, rm } from "node:fs/promises";
const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost",
});
for (const key of [
  "window",
  "document",
  "HTMLElement",
  "HTMLInputElement",
  "Node",
  "MutationObserver",
  "getComputedStyle",
  "KeyboardEvent",
  "Event",
])
  globalThis[key] = dom.window[key];
Object.defineProperty(globalThis, "navigator", {
  value: dom.window.navigator,
  configurable: true,
});
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
await build({
  entryPoints: ["src/App.tsx"],
  outfile: "tests/.app.mjs",
  bundle: true,
  format: "esm",
  platform: "node",
  external: ["react", "react-dom", "react/jsx-runtime", "lucide-react"],
});
const React = await import("react");
const { render, screen, within, cleanup, waitFor } =
  await import("@testing-library/react");
const { default: userEvent } = await import("@testing-library/user-event");
const { default: App } = await import("./.app.mjs");
const user = userEvent.setup({ document: dom.window.document });
render(React.createElement(App));
const checks = [];
function check(ok, name) {
  if (!ok) throw Error(name);
  checks.push(name);
}
const click = async (name) =>
  user.click(screen.getByRole("button", { name, exact: true }));
const nav = async (name) =>
  user.click(
    within(screen.getByRole("navigation")).getByRole("button", {
      name,
      exact: true,
    }),
  );
check(
  !!screen.getByRole("heading", { name: "世界很大，自由連上。" }),
  "Overview renders",
);
check(!!screen.getByRole("link", { name: "方舟VPN Ark VPN，返回總覽" }), "Bilingual product identity and accessible home label");
check(document.querySelector(".brand-wordmark").textContent === "方舟VPNArk VPN", "Chinese and English wordmark");
await click("開始連線");
await screen.findByRole("button", { name: "中斷連線" }, { timeout: 2000 });
check(!!screen.getByText("自在，已連線。"), "Connection state transition");
await click("中斷連線");
await user.click(document.querySelector(".selected-location"));
const dialog = screen.getByRole("dialog");
check(dialog.contains(document.activeElement), "Modal receives focus");
await user.type(
  screen.getByRole("textbox", { name: "搜尋國家或城市" }),
  "London",
);
await user.click(
  screen.getByRole("button", { name: /英國.*倫敦.*United Kingdom/ }),
);
check(
  document.querySelector(".selected-location").textContent.includes("倫敦"),
  "Location search and selection",
);
check(
  document.activeElement === document.querySelector(".selected-location"),
  "Modal focus restored",
);
await nav("連線位置");
await user.type(
  screen.getByRole("textbox", { name: "搜尋國家或城市" }),
  "不存在",
);
check(!!screen.getByText("找不到符合的位置"), "Empty search state");
await click("清除搜尋");
await click("收藏倫敦");
await click("我的最愛");
check(
  !!screen.getByRole("button", { name: "取消收藏倫敦" }),
  "Favorite filtering",
);
await nav("流量規則");
await click("新增規則");
check(
  screen.getByRole("dialog").contains(document.activeElement),
  "Rule modal receives focus",
);
await user.type(screen.getByLabelText("規則名稱"), "工作空間");
await user.type(screen.getByLabelText("網域後綴"), "example.com");
await click("加入規則");
check(!!screen.getByText("DOMAIN-SUFFIX · example.com"), "Add custom rule");
await click("刪除工作空間");
check(!screen.queryByText("DOMAIN-SUFFIX · example.com"), "Delete custom rule");
await user.type(screen.getByRole("textbox", { name: "搜尋規則" }), "自訂");
check(!!screen.getByText("影音串流"), "Rule-type search");
await nav("訂閱管理");
await click("使用訂閱");
check(
  document.querySelector(".subscription-hero h2").textContent === "日常備用",
  "Switch subscription",
);
await click("新增訂閱");
await user.type(screen.getByLabelText("訂閱名稱"), "週末旅行");
await user.type(
  screen.getByLabelText("訂閱網址"),
  "https://example.com/subscribe",
);
await click("加入訂閱");
check(
  document.querySelectorAll(".subscription-row").length === 3,
  "Add subscription",
);
await click("全部重新整理");
await screen.findByText("訂閱資訊已重新整理");
checks.push("Refresh local subscription");
await nav("偏好設定");
await user.click(screen.getByRole("switch", { name: "TUN 模式", exact: true }));
await nav("總覽");
check(
  screen
    .getByRole("switch", { name: "TUN 模式", exact: true })
    .getAttribute("aria-checked") === "true",
  "Preferences synchronized with overview",
);
await click("開啟選單");
check(
  document.querySelector(".sidebar").classList.contains("mobile-open"),
  "Open mobile navigation",
);
await user.keyboard("{Escape}");
check(
  !document.querySelector(".sidebar").classList.contains("mobile-open"),
  "Escape closes navigation",
);
await click("使用指南");
const hd = screen.getByRole("dialog");
check(hd.contains(document.activeElement), "Guide modal receives focus");
await user.tab();
check(hd.contains(document.activeElement), "Dialog focus remains trapped");
await user.keyboard("{Escape}");
check(!screen.queryByRole("dialog"), "Escape dismisses dialog");
check(
  !/開發中|不能用|設計語言|原型|prototype/i.test(document.body.textContent),
  "Excluded disclaimers absent",
);
await writeFile(
  "tests/results.json",
  JSON.stringify(
    {
      environment: "JSDOM; no visual layout validation",
      passed: checks.length,
      checks,
      browserStatus:
        "Chromium sockets blocked; cloud browser cannot access local server",
    },
    null,
    2,
  ),
);
console.log(JSON.stringify({ passed: checks.length, checks }, null, 2));
cleanup();
await rm("tests/.app.mjs");

