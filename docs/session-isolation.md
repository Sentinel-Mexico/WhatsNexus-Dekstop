# Session Isolation & Multi-Account Architecture

## 1. The Core Problem

Standard web browsers manage browsing data on a per-origin basis. Because WhatsApp Web operates under a single origin (`https://web.whatsapp.com`), any standard browser session shares:
- **IndexedDB**: Where WhatsApp Web saves encrypted chat databases, signal keys, and offline message queues.
- **Cookies & Tokens**: Authentication cookies and handshake tokens.
- **LocalStorage & SessionStorage**: Client-side state flags and UI preferences.
- **Service Workers & Cache Storage**: Background synchronization workers and cached assets.

Consequently, logging into a second WhatsApp account in a standard browser environment requires either incognito windows (which do not persist after closing) or distinct browser profiles.

---

## 2. The WhatsNexus Solution: Electron `StoragePartition`

WhatsNexus solves this limitation natively through Electron's **`StoragePartition`** subsystem using encapsulated `<webview>` guest contexts.

```text
                       WhatsNexus Application Window
+-------------------------------------------------------------------------+
|  Sidebar                                                                |
|  [ Acc 1 ] ---> <webview partition="persist:acc_1725372800001">         |
|                 +-- IndexedDB: Session 1 (Personal)                     |
|                 +-- Cookies: Auth 1                                     |
|                 +-- Cache: Isolated Cache Store 1                       |
|                                                                         |
|  [ Acc 2 ] ---> <webview partition="persist:acc_1725372800002">         |
|                 +-- IndexedDB: Session 2 (Work)                         |
|                 +-- Cookies: Auth 2                                     |
|                 +-- Cache: Isolated Cache Store 2                       |
|                                                                         |
|  [ Acc 3 ] ---> <webview partition="persist:acc_1725372800003">         |
|                 +-- IndexedDB: Session 3 (Support)                      |
|                 +-- Cookies: Auth 3                                     |
|                 +-- Cache: Isolated Cache Store 3                       |
+-------------------------------------------------------------------------+
```

### 2.1 The `persist:` Prefix
In Electron, partition names without a prefix are stored in-memory and wiped when the process terminates. By prefixing every account partition with `persist:`, WhatsNexus ensures that:
- The session is written directly to the host filesystem under `~/.config/whatsnexus/Partitions/acc_<timestamp>/` (on Linux) or equivalent app data paths on Windows/macOS.
- Users **only need to scan the QR code once**. On subsequent launches, the session restores immediately without re-authentication.

### 2.2 Strict Boundary & Security Guarantees
- **Zero Cross-Talk**: Network requests, cookies, and indexed databases for Account A are physically impossible to access from Account B's renderer process.
- **Sandboxed Execution (`sandbox: true`)**: Each window and `<webview>` operates under full Chromium sandboxing with `contextIsolation: true` and `nodeIntegration: false`, preventing guest scripts from accessing local system APIs.
- **Deny-by-Default Hardware Permissions**: Hardware access requests across all sessions (`session.setPermissionRequestHandler` and `session.setPermissionCheckHandler`) default strictly to `false` unless explicitly authorized by the user for camera, microphone, screen sharing, or geolocation.
- **Independent Notification Subsystems**: Preload scripts attached to each partition handle message notifications independently, preventing cross-account state confusion.

---

## 3. Account Lifecycle Implementation

### 3.1 Account Creation
When the user clicks "Add Account" or the application initializes for the first time:
```javascript
function addAccount(name = null) {
  const accountId = 'acc_' + Date.now();
  const account = {
    id: accountId,
    name: accountName,
    partition: `persist:${accountId}`,
    avatarUrl: null,
    dnd: false,
    enabled: true,
    lastAccessed: Date.now(),
    hibernated: false
  };

  accounts.push(account);
  saveAccounts();
  renderAllSidebarAccounts();
  createWebviewContainer(account);
  activateAccount(accountId);
}
```

> [!TIP]
> **Account Activation/Deactivation:** Accounts can be deactivated via Settings. Deactivating an account keeps its persistent partition data (`persist:acc_<id>`) on disk while removing it from the sidebar and destroying its active `<webview>` from the DOM to conserve RAM and suppress notifications. Re-enabling the account restores it immediately to the sidebar without requiring QR re-authentication.

### 3.2 Webview DOM Instantiation
The webview is created with strict isolation attributes:
```javascript
function buildWebviewDOM(account, parentContainer) {
  const webview = document.createElement('webview');
  webview.id = `webview_${account.id}`;
  webview.setAttribute('src', 'https://web.whatsapp.com/');
  webview.setAttribute('partition', account.partition);
  webview.setAttribute('webpreferences', 'backgroundThrottling=yes');
  webview.setAttribute('preload', `file://${preloadPath}`);
  webview.setAttribute('useragent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ...');
  parentContainer.appendChild(webview);
}
```

### 3.3 Account Deletion Safeguard
To prevent accidental session loss, deleting an account triggers a confirmation modal (`#delete-account-modal`) displaying the targeted account name, danger warning, and explicit cancel/confirm actions (supporting Escape key dismissal). Upon confirmation, its DOM container is removed, the `<webview>` is destroyed, its sidebar tab is purged, and `localStorage` is updated. To release disk space permanently, the underlying partition folder in the OS application data path can also be purged when required.
