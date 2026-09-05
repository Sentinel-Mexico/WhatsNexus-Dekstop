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

### 2.1 Automated Multiplatform CI/CD Pipeline (GitHub Actions)
WhatsNexus includes a fully automated build pipeline defined in `.github/workflows/build.yml`. When changes are pushed directly to `main` or a release tag (`v*`) is published, GitHub Actions matrix builds standalone release artifacts for all supported desktop targets:
- **Linux (x64 & arm64)**: `.deb` and `.AppImage`.
- **macOS (x64 & Apple Silicon arm64)**: `.dmg`.
- **Windows (x64)**: NSIS installer `.exe`.

### 2.2 Local Manual Packaging
For local testing or standalone compilation, `electron-packager` can be used:

```bash
# Linux
npx electron-packager . WhatsNexus --platform=linux --arch=x64 --out=dist/ --overwrite --icon=src/assets/icon.png

# Windows
npx electron-packager . WhatsNexus --platform=win32 --arch=x64 --out=dist/ --overwrite --icon=src/assets/icon.ico

# macOS
npx electron-packager . WhatsNexus --platform=darwin --arch=x64 --out=dist/ --overwrite --icon=src/assets/icon.icns
```

---

## 3. Maintenance Procedures & Release Checklist

Before tagging or releasing any update:

1. **Verify Code Syntax & Integrity:**
   ```bash
   node -c src/main.js
   node -c src/preload-main.js
   node -c src/renderer/renderer.js
   node -c src/preload.js
   node -c scripts/download-doom.js
   ```
2. **Synchronize Offline Freedoom Assets:**
   ```bash
   npm run download-doom
   ```
3. **SemVer Compliance & Version Quartet:**
   - Determine increment type (PATCH, MINOR, or MAJOR).
   - Synchronize the Version Quartet (`package.json`, `package-lock.json`, root `README.md`, and `changelog-dev.md`).
4. **Changelog Updates:**
   - On `Dev`: Document granular changes under `[VERSION] - YYYY-MM-DD` in `changelog-dev.md` (strictly in English).
   - On `main` (Production Releases): Summarize all milestone features into `changelog.md` (in neutral English). Do not touch `changelog.md` during feature branch or development cycles.
5. **Mandatory Documentation Audit:**
   - Review root `README.md` and all documentation in `/docs` to ensure 100% agreement with the latest codebase state before merging into `main`.
6. **Git Commit & Push:**
   - Commit message: `"v.<VERSION> <type>: <summary>"`.
   - Push to `origin/Dev` during ongoing development.
   - Merge/push to `origin/main` for production releases.
