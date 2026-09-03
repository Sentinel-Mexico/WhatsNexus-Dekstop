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
| • Low-end device mode              | • 20-minute idle tab hibernation           |
| • Site isolation trials disabled   | • Complete Webview DOM destruction         |
| • Compact V8 heap (128 MB max-old) | • Startup lazy loading                     |
| • Background tab throttling        | • Debounced preload mutation observers     |
| • Renderer process limit caps      | • Instant session re-hydration            |
+------------------------------------+--------------------------------------------+
```

---

## 2. Automated Tab Hibernation

### 2.1 The Hibernation Cycle
1. When an account is inactive (not the currently visible account), its last interaction timestamp `acc.lastAccessed` is tracked.
2. Every 60 seconds, a background interval triggers `checkHibernation()`.
3. If an account has been idle for more than **20 minutes** (`HIBERNATION_TIMEOUT = 20 * 60 * 1000`), WhatsNexus triggers `hibernateWebview(acc.id)`.

```javascript
function hibernateWebview(id) {
  const acc = accounts.find(a => a.id === id);
  if (!acc) return;
  
  const webview = document.getElementById(`webview_${id}`);
  if (webview) {
    webview.remove(); // TOTAL DESTRUCTION: Destroys the Chromium guest renderer process
  }
  
  const overlay = document.getElementById(`hibernation_${id}`);
  if (overlay) {
    overlay.classList.remove('hidden');
  }
  
  acc.hibernated = true;
}
```

### 2.2 Why DOM Destruction?
Unlike simply applying `display: none` or `visibility: hidden` (which keeps the Chromium renderer process alive and consuming full RAM), calling `webview.remove()` completely terminates the sandboxed guest renderer process, freeing all associated VRAM, heap memory, and socket connections.

### 2.3 Awakening & Session Restoration
When the user switches back to a hibernated account, or clicks the "Wake Up" action on the hibernation screen:
```javascript
window.wakeWebview = (id) => {
  const acc = accounts.find(a => a.id === id);
  if (!acc) return;
  
  acc.lastAccessed = Date.now();
  if (acc.hibernated) {
    const overlay = document.getElementById(`hibernation_${id}`);
    if (overlay) overlay.classList.add('hidden');
    
    const container = document.getElementById(`container_${id}`);
    if (container) buildWebviewDOM(acc, container);
    
    acc.hibernated = false;
  }
};
```
Because the partition data is persistently cached on disk (`persist:acc_<id>`), WhatsApp Web re-authenticates and restores active chats within ~2 seconds without requiring QR re-scanning.

---

## 3. Startup Lazy Loading

When WhatsNexus boots up with multiple configured accounts:
- **Only the previously active account** (or the first account in the list) is actively instantiated into the DOM.
- All other accounts are marked as `hibernated = true` and rendered with a dormant hibernation overlay.
- This prevents the application from launching 5–10 simultaneous Chromium renderers on cold boot, reducing initial memory usage by **up to 80%**.

---

## 4. Chromium Engine Optimization Switches

Configured in `src/main.js` before the Electron `app` is ready:

```javascript
// Disable unnecessary background media services
app.commandLine.appendSwitch('disable-features', 'HardwareMediaKeyHandling,MediaSessionService,WaylandWpColorManagerV1');

// Reduce process overhead for site isolation
app.commandLine.appendSwitch('disable-site-isolation-trials');

// Limit background network activity
app.commandLine.appendSwitch('disable-background-networking');
app.commandLine.appendSwitch('disable-ipc-flooding-protection');

// Aggressive VRAM and RAM reduction
app.commandLine.appendSwitch('enable-low-end-device-mode');
app.commandLine.appendSwitch('renderer-process-limit', '2');

// Compact V8 JavaScript heap (limits old-space allocation per isolate to 128MB)
app.commandLine.appendSwitch('js-flags', '--optimize_for_size --max-old-space-size=128');

// Minimize disk cache I/O overhead for shaders
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
```

---

## 5. Debounced Preload Observers

In `src/preload.js`, DOM mutation observers that monitor for profile picture updates and unread chat indicators are debounced using timer thresholds. This ensures that rapid incoming messages or UI updates inside WhatsApp Web do not trigger repeated IPC transmissions or strain the host renderer's event loop.
