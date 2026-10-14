import { readdir, readFile, writeFile } from "node:fs/promises";
const assets = await readdir("dist/assets");
const css = await readFile(
  "dist/assets/" + assets.find((x) => x.endsWith(".css")),
  "utf8",
);
const js = await readFile(
  "dist/assets/" + assets.find((x) => x.endsWith(".js")),
  "utf8",
);
await writeFile(
  "Ark-VPN-preview.html",
  '<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#f6f5ef"><title>方舟VPN Ark VPN · 自由，從這裡開始</title><style>' +
    css +
    '</style></head><body><div id="root"></div><script type="module">' +
    js +
    "</script></body></html>",
);
console.log("Created Ark-VPN-preview.html");
