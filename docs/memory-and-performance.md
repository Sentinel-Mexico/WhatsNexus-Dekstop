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
// Enable background timer throttling and occlusion-based wake-up throttling
app.commandLine.appendSwitch('disable-background-timer-throttling', 'false');
app.commandLine.appendSwitch('enable-features', 'CalculateNativeWinOcclusion,IntensiveWakeUpThrottling,ThrottleDisplayNoneAndVisibilityHiddenCrossOriginIframes');

// Disable unnecessary background media services and Wayland color manager issues
app.commandLine.appendSwitch('disable-features', 'HardwareMediaKeyHandling,MediaSessionService,WaylandWpColorManagerV1');

// Permit immediate audio playback without user gesture blocking
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
```

> [!NOTE]
> Aggressive flags such as `--enable-low-end-device-mode` and artificial `--renderer-process-limit` caps are intentionally avoided. On modern multi-monitor, high-DPI, and Wayland compositor environments, low-end device mode starves the GPU tile rasterizer memory budget, leading to missing tile artifacts (black or stale rectangular patches). True memory efficiency is achieved cleanly via the 20-minute hibernation cycle, active tab throttling, and lazy loading.

---

## 5. Debounced Preload Observers & Fallback Polling Cancellation

In `src/preload.js`, DOM mutation observers that monitor for profile picture updates and unread chat indicators are debounced using timer thresholds (2500ms) and restricted specifically to `#app` or `#side` container nodes rather than unbounded `document.body` observations. When tabs are in the background, observer callbacks are bypassed (`isTabActive === false`), and a hard 60-second self-termination timer automatically deallocates the observer once profile initialization is complete.

---

## 6. Asynchronous Locale I/O & In-Memory Map Caching

The `load-locale` IPC handler in `src/main.js` employs non-blocking asynchronous file I/O (`fs.promises.readFile` and `fs.promises.access`) paired with an in-memory `Map` cache (`localeCache`). 

When switching languages, parsed locale dictionaries are retained in memory. Subsequent lookups or language resets resolve synchronously from RAM with zero disk I/O, reducing locale load latency to sub-millisecond speeds and preventing disk thrashing across 55 supported languages.

---

## 7. RAM-Only Notification Avatar Pipeline

The native desktop notification pipeline converts incoming base64 circular avatars directly into native image instances in memory using Electron's `nativeImage.createFromDataURL(data.iconDataUrl)`. 

By completely eliminating temporary disk file writes (`fs.writeFileSync` inside `userData`), disk wear is prevented during high-frequency messaging bursts, avoiding I/O bottlenecks and ensuring instantaneous notification dispatch.

---

## 8. WebContents Explicit Destruction & Guest Memory Freeing

To prevent dangling Chromium renderer processes from leaking RAM when accounts are deleted or hibernated:
1. `hibernateWebview(id)` and `executeDeleteAccount(id)` in `src/renderer/renderer.js` invoke `webview.stop()` immediately before DOM removal.
2. The renderer calls `electronAPI.destroyWebviewContents(partition)` which signals the main process to locate all `WebContents` assigned to the session partition, call `wc.stop()` and `wc.destroy()`, and trigger garbage collection.

---

## 9. Adaptive Network Polling (Smart Polling) & Power-Saving Pausing

During offline network loss states, linear continuous polling is replaced with an adaptive stepped backoff algorithm (`[5000, 10000, 30000, 60000]` ms) to conserve CPU cycles and battery. 
Furthermore, polling probes and offline duration timer ticks are automatically paused whenever the application window is minimized or occluded (`document.hidden`), resuming immediately upon regain of visibility or focus.

---

## 10. Minigame (DinoGame) & Animation Dormancy

The integrated offline T-Rex minigame registers `blur` and `visibilitychange` listeners to immediately cancel active `requestAnimationFrame` render loops via `pausar()` when the application loses focus or is minimized. Its `destruir()` method cleanly unbinds all canvas and window event listeners, ensuring zero residual CPU cycles when connectivity is restored.
