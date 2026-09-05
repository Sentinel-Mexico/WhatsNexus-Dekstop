const fs = require('fs');
const path = require('path');
const https = require('https');

const doomDir = path.join(__dirname, '..', 'src', 'assets', 'doom');

const files = [
  {
    name: 'websockets-doom.js',
    url: 'https://silentspacemarine.com/websockets-doom.js',
    minSize: 200000
  },
  {
    name: 'websockets-doom.wasm',
    url: 'https://silentspacemarine.com/websockets-doom.wasm',
    minSize: 2000000
  },
  {
    name: 'default.cfg',
    url: 'https://silentspacemarine.com/default.cfg',
    minSize: 500
  },
];

const freedoomZipUrl = 'https://github.com/freedoom/freedoom/releases/download/v0.13.0/freedoom-0.13.0.zip';
const freedoomWadName = 'freedoom1.wad';
const freedoomMinSize = 25000000;

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to download ${url}: status code ${res.statusCode}`));
      }
      const fileStream = fs.createWriteStream(dest);
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close(resolve);
      });
      fileStream.on('error', reject);
    }).on('error', reject);
  });
}

async function checkFreedoomWad() {
  const destPath = path.join(doomDir, freedoomWadName);
  if (fs.existsSync(destPath)) {
    const stats = fs.statSync(destPath);
    if (stats.size >= freedoomMinSize) {
      console.log(`[Doom Setup] ${freedoomWadName} already exists (${(stats.size / 1024 / 1024).toFixed(2)} MB).`);
      return;
    }
  }

  console.log(`[Doom Setup] ${freedoomWadName} missing. Downloading Freedoom release...`);
  const tmpZipPath = path.join(doomDir, 'freedoom_tmp.zip');
  try {
    await downloadFile(freedoomZipUrl, tmpZipPath);
    console.log('[Doom Setup] Extracting freedoom1.wad...');
    const { execSync } = require('child_process');
    try {
      execSync(`unzip -p "${tmpZipPath}" "freedoom-0.13.0/freedoom1.wad" > "${destPath}"`, { stdio: 'ignore' });
    } catch {
      execSync(`tar -xf "${tmpZipPath}" --strip-components=1 -C "${doomDir}" "freedoom-0.13.0/freedoom1.wad"`, { stdio: 'ignore' });
    }
    if (fs.existsSync(tmpZipPath)) fs.unlinkSync(tmpZipPath);
    console.log(`[Doom Setup] Successfully installed ${freedoomWadName}!`);
  } catch (err) {
    if (fs.existsSync(tmpZipPath)) fs.unlinkSync(tmpZipPath);
    console.error(`[Doom Setup] Failed to download or extract ${freedoomWadName}:`, err.message);
  }
}

async function main() {
  if (!fs.existsSync(doomDir)) {
    fs.mkdirSync(doomDir, { recursive: true });
  }

  for (const item of files) {
    const destPath = path.join(doomDir, item.name);
    let needDownload = true;
    if (fs.existsSync(destPath)) {
      const stats = fs.statSync(destPath);
      if (stats.size >= item.minSize) {
        console.log(`[Doom Setup] ${item.name} already exists (${(stats.size / 1024 / 1024).toFixed(2)} MB).`);
        needDownload = false;
      }
    }
    if (needDownload) {
      console.log(`[Doom Setup] Downloading ${item.name}...`);
      try {
        await downloadFile(item.url, destPath);
        console.log(`[Doom Setup] Successfully downloaded ${item.name}!`);
      } catch (err) {
        console.error(`[Doom Setup] Error downloading ${item.name}:`, err);
      }
    }
  }

  // Ensure Freedoom Phase 1 IWAD is present
  await checkFreedoomWad();

  // Clean up legacy, redundant, or proprietary files from older Doom implementations if present
  const legacyFiles = ['doom.wasm', 'doom.js', 'doom1.wad'];
  for (const legacy of legacyFiles) {
    const legacyPath = path.join(doomDir, legacy);
    if (fs.existsSync(legacyPath)) {
      try {
        fs.unlinkSync(legacyPath);
        console.log(`[Doom Setup] Cleaned up legacy/proprietary file: ${legacy}`);
      } catch (err) {
        // ignore
      }
    }
  }
}

main().catch(console.error);
