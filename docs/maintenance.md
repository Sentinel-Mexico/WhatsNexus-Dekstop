# Maintenance, Development & Release Operations

## 1. Development Setup

### 1.1 Prerequisites
- **Node.js**: Version 18.x or higher (LTS recommended).
- **npm**: Version 9.x or higher.
- **Git**: Installed and configured.

### 1.2 Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/Sentinel-Mexico/WhatsNexus-Dekstop.git
cd WhatsNexus-Dekstop
git checkout Dev
npm install
```

### 1.3 Running Locally
To launch the application in development mode:
```bash
npm start
```
Or directly using the Electron CLI:
```bash
npx electron .
```

---

## 2. Packaging & Building

WhatsNexus utilizes `electron-packager` for compiling standalone distributable binaries across desktop platforms.

### 2.1 Linux Build
```bash
npx electron-packager . WhatsNexus \
  --platform=linux \
  --arch=x64 \
  --out=dist/ \
  --overwrite \
  --icon=src/assets/icon.png
```

### 2.2 Windows Build
```bash
npx electron-packager . WhatsNexus \
  --platform=win32 \
  --arch=x64 \
  --out=dist/ \
  --overwrite \
  --icon=src/assets/icon.ico
```

### 2.3 macOS Build
```bash
npx electron-packager . WhatsNexus \
  --platform=darwin \
  --arch=x64 \
  --out=dist/ \
  --overwrite \
  --icon=src/assets/icon.icns
```

---

## 3. Maintenance Procedures & Release Checklist

Before tagging or releasing any update:

1. **Verify Code Syntax & Linting:**
   ```bash
   node -c src/main.js
   node -c src/renderer/renderer.js
   node -c src/preload.js
   ```
2. **SemVer Compliance:**
   - Determine increment type (PATCH, MINOR, or MAJOR).
   - Bump version in `package.json`.
3. **Lockfile Synchronization:**
   - Execute `npm install` to synchronize `package-lock.json`.
4. **Changelog Updates:**
   - On `Dev`: Document granular changes under `[VERSION] - YYYY-MM-DD` in `changelog-dev.md`.
   - On `main` (Release Only): Compile a high-level summary of all milestone features into `changelog.md`.
5. **Git Commit & Push:**
   - Commit message: `"v.<VERSION> <type>: <summary>"`.
   - Push strictly to `origin/Dev` during ongoing development.
