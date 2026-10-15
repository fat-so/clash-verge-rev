# Ark managed VPN client

The Ark home page uses the initial interface landscape, logo and ivory/forest palette. It calls the member API at `/api/v1/vpn`; the API base URL is an origin, and the bearer token identifies the member. Credentials remain in memory. No panel or cloud credentials belong in this app.

A serialized lifecycle requests a lease, creates a local profile through the shared mutation service, selects it and checks native validation before acknowledging success. The page reports configuration applied, not verified Internet connectivity. No speed probes, system proxy toggles or TUN toggles are used. Disconnect restores the prior profile and removes only profiles owned by this lifecycle, then releases the lease. Heartbeat and renewal are owned by a shared client service and continue across page navigation. Closing the application stops heartbeats; the server timeout bounds the lease.

Transport follows PRE-SPEC: direct JSON responses with leaseId, config, expireAt and heartbeatSeconds. Every mutation uses requestId; heartbeat includes requestId too. Failed apply is acknowledged with success=false. Settings cannot change during an active lease.

Build web assets with `pnpm web:build`. Do not run prebuild or signed installer builds. Native replacement and external connectivity require separate validation.

## Verification

`node --test scripts/ark-session.test.mjs` tests apply-before-ACK, negative ACK, heartbeat replacement and duplicate-click serialization using injected fake services. These tests perform no cloud requests, probes or native network changes. Browser rendering and native deployment must be reported separately.


## Current local validation

The root TypeScript check, production web build, targeted ESLint and architecture checks passed. Four lifecycle tests passed. Dependencies were installed without lifecycle scripts; no installer/signing build was run. The installed desktop executable has not been replaced, and no real core/cloud connection has been exercised.

Feature commits completed locally on 2026-10-15:
- `feat(ark): integrate managed VPN lease lifecycle` — services/ark-api, ark-session, ark-profiles, store/ark-client, lifecycle and HTTP transport tests. Documentation is committed separately.
- `feat(ark): add branded managed VPN home` — Ark page/styles, scenery/logo, navigation, bootstrap and changelog.

The earlier Git sandbox block was resolved through approved execution outside the sandbox. Commits: 2d831e31 (lifecycle) and 77bf1992 (home). No ACL changes or push were performed.

## Recovery and follow-up validation

Default development API origin is `http://127.0.0.1:3100`. After a lost ACK response or heartbeat failure, the page exposes a lease synchronization action. It reads GET session without allocating a new lease, applies the current configuration if needed and acknowledges it again. A native profile already current for that lease is not recreated. An absent or expired server session clears the owned local profile. Network errors never silently become a connected state.

`node --test scripts/ark-session.test.mjs scripts/ark-http.test.mjs` passes five tests. The HTTP test opens an ephemeral loopback server and exercises the actual fetch transport, bearer header, request IDs, a lost ACK response, heartbeat HTTP 503, recovery and disconnect. Native profile effects remain injected fakes in this test.

Installed Mihomo Meta v1.19.31 accepts the VLESS xhttp template shape using configuration-test-only mode (`-t`); no proxy listener or speed probe was started. This validates syntax, not actual server connectivity.

Browser visual QA was attempted through CUA Chrome, but Chrome was unavailable and browser/app inventory was empty. No rendered screenshot or browser interaction is claimed. The root desktop frontend still requires Tauri runtime for normal boot; web build success alone is not desktop validation.

## Native library retry (2026-10-15)

Approved execution outside the sandbox completed `cargo build --lib --locked -p clash-verge` in 3m 10s with Rust 1.99.0. TypeScript and production Vite build also passed again. The x64 debug app_lib.dll is 8,521,728 bytes (SHA256 976EF53D10B3938CBCB458704A1A79DC24E5A16D6DB23C0B571B1A052612CEB8). No source or lockfile changes were needed.

The previous Schannel failure occurred during dependency download, before compilation or signing. The same crate URL fails to connect under CodexSandboxOffline and returns HTTP 200 under the approved abc11 context. This supports an execution-environment/network cause; the exact historical Schannel credential failure was not reproduced. TLS verification was not disabled.

The resulting DLL exports only underlying aws-lc/deelevate symbols, not an application entry point. The installed executable does not import app_lib.dll; main.rs directly calls app_lib::run(). Therefore this artifact cannot be treated as a drop-in UI replacement. An independent unsigned executable build and runtime validation remain necessary. No installation, application launch, VPN change or signing was performed.
