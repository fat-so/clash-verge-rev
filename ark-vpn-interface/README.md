# 方舟VPN Ark VPN · VPN desktop interface

A layout-first React + TypeScript frontend with a warm ivory, forest-green and soft-peach palette. Traditional Chinese throughout. The project is self-contained and original; no upstream files were cloned or modified.

## Run

Requirements: Node.js 20.19+ or 22.12+.

```bash
npm ci
npm run dev
```

Open the local Vite address printed in the terminal. Alternatively, double-click `Ark-VPN-preview.html` to view the packaged interface without installing dependencies. Regenerate it with `npm run build:standalone`.

```bash
npm run typecheck
npm run build
npm run preview
```

## Included screens

- Overview: illustrated connection canvas, local connection-state transitions, location selection, proxy mode, system proxy/TUN toggles, local traffic display.
- Locations: country/city search in Chinese or English, recommendation/favorite filters, favorites, active location.
- Routing: selectable rule/global/direct modes, searchable rule list, add/delete custom domain-suffix rules.
- Subscriptions: usage presentation, switching subscriptions, local addition and refresh feedback.
- Preferences: locally controlled settings, consistent with overview switches.
- Responsive desktop/tablet/mobile layouts, keyboard focus indicators, accessible control names, reduced-motion support.

## Important implementation boundary

This is a frontend-only UI deliverable. All nodes, latency values, quotas, traffic statistics and subscriptions are fixture data. The connection button changes React state only; it does not establish a VPN, change the system proxy, install a TUN adapter or provide network protection. Subscription URLs are neither fetched nor saved. No APIs, Tauri commands, backend, analytics, external fonts or external assets are integrated. Settings reset on reload by design.

## Structure

- `src/App.tsx`: shell, reusable controls, page views, local interaction state
- `src/data.ts`: strongly typed fixtures
- `src/Scenery.tsx`: original vector landscape
- `src/styles.css`: visual tokens, components, responsive breakpoints
- `tests/ui.mjs`: Playwright interaction and screenshot checks
- `Ark-VPN-preview.html`: self-contained preview, open directly in a modern browser
- `tests/results.json`: actual non-visual interaction test results

This source can be transplanted into a future Clash Verge frontend. Future integration should replace local state at component boundaries; this package does not touch upstream behavior or implement an adapter.

## Verification

TypeScript typecheck and Vite production build pass. DOM-based interaction tests cover navigation, state changes, filtering, routing, subscription actions, and modal keyboard focus. Run `npm run test:dom`.

Visual browser validation could not be completed in the execution environment: local Chromium socket creation is restricted and the cloud browser cannot reach the local development server. No screenshots are included or claimed. The Playwright test script is supplied for use in a supported local browser environment.

## UI checks

Start the development server at port 5173, then run `npm run test:ui`. Set `CHROMIUM_PATH` if Chromium is not at `/usr/bin/chromium`. The tests use the system Chromium binary and do not need a browser download.

## Reference sources

Read-only visual/product research:

- https://www.expressvpn.com/vpn-download/vpn-windows
- https://github.com/clash-verge-rev
- https://github.com/clash-verge-rev/clash-verge-rev

No ExpressVPN logos, proprietary illustrations or assets are included.
