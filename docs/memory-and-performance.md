# Memory Management & Performance Architecture

## 1. The Resource Challenge

A single WhatsApp Web tab typically allocates **200 MB to 450 MB of RAM** due to heavy client-side React rendering, WebSocket keep-alives, offline indexed databases, and media caching.

For a power user running 5 to 10 accounts concurrently, a naive multi-webview desktop wrapper would consume **2 GB to 4.5 GB of RAM**, leading to system sluggishness, CPU throttling, and poor battery life on mobile devices.

WhatsNexus achieves an ultra-low memory profile through a multi-tier optimization strategy:

```text
+---------------------------------------------------------------------------------+
|                         WhatsNexus Resource Optimization                        |
+------------------------------------+--------------------------------------------+
|        Process / Engine Level      |             Application Level              |
+------------------------------------+--------------------------------------------+
| • Site isolation trials disabled   | • 20-minute idle tab hibernation           |
| • Background networking disabled   | • Complete Webview DOM destruction         |
| • IPC flooding protection disabled | • Startup lazy loading                     |
| • Background tab throttling        | • Debounced preload mutation observers     |
| • Wayland color manager workaround | • Instant session re-hydration            |
+------------------------------------+--------------------------------------------+
```

---

## 2. Automated Tab Hibernation

### 2.1 The Hibernation Cycle
1. When an account is inactive (not the currently visible account), its last interaction timestamp `acc.lastAccessed` is tracked.
2. Every 60 seconds, `checkHibernation()` verifies whether any inactive account has exceeded the `HIBERNATION_TIMEOUT = 20 * 60 * 1000` (20 minutes).
3. Once expired, `hibernateWebview(id)` removes the `<webview>` element completely from the DOM, causing Chromium to terminate the underlying renderer process and instantly reclaiming **200 MB to 450 MB of RAM** per hibernated tab.
4. An informative hibernation overlay replaces the webview, notifying the user that the tab is asleep to conserve memory.
5. Clicking "Reactivar Cuenta" or switching back to the account instantly calls `wakeWebview(id)`, mounting a new `<webview>` element that seamlessly reconnects with the authenticated session partition.

---

## 3. Webview Viewport & Visibility Management

In Electron, toggling `<webview>` visibility via CSS `display: none` can cause Chromium's compositor to drop the GPU rasterization surface, resulting in black box artifacts or delayed texture rebuilds upon reactivation.

To guarantee zero-flicker tab switching and preserve GPU rasterization integrity:
- Inactive accounts and full-window views are hidden using `visibility: hidden; opacity: 0; pointer-events: none; z-index: -1;` with absolute positioning.
- Active accounts use `visibility: visible; opacity: 1; pointer-events: auto; z-index: 1;`.
- This ensures the underlying Chromium guest renderers maintain correct viewport coordinates without visual tearing or graphical corruption.

---

## 4. Chromium Engine Optimization Switches

Configured in `src/main.js` before the Electron `app` is ready:

```javascript
// Disable unnecessary background media services and Wayland color manager issues
app.commandLine.appendSwitch('disable-features', 'HardwareMediaKeyHandling,MediaSessionService,WaylandWpColorManagerV1');

// Permit immediate audio playback without user gesture blocking
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
```

> [!NOTE]
> Aggressive flags such as `--enable-low-end-device-mode` and artificial `--renderer-process-limit` caps are intentionally avoided. On modern multi-monitor, high-DPI, and Wayland compositor environments, low-end device mode starves the GPU tile rasterizer memory budget, leading to missing tile artifacts (black or stale rectangular patches). True memory efficiency is achieved cleanly via the 20-minute hibernation cycle and lazy loading.

---

## 5. Debounced Preload Observers

In `src/preload.js`, DOM mutation observers that monitor for profile picture updates and unread chat indicators are debounced using timer thresholds. This ensures that rapid incoming messages or UI updates inside WhatsApp Web do not trigger repeated IPC transmissions or strain the host renderer's event loop.
