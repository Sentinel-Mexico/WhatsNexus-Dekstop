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
  {
    name: 'doom1.wad',
    url: 'https://media.githubusercontent.com/media/cnlohr/embeddedDOOM/master/src/support/doom1.wad',
    minSize: 4000000
  }
];

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

  // Clean up legacy/redundant files from older Doom implementations if present
  const legacyFiles = ['doom.wasm', 'doom.js'];
  for (const legacy of legacyFiles) {
    const legacyPath = path.join(doomDir, legacy);
    if (fs.existsSync(legacyPath)) {
      try {
        fs.unlinkSync(legacyPath);
        console.log(`[Doom Setup] Cleaned up legacy file: ${legacy}`);
      } catch (err) {
        // ignore
      }
    }
  }
}

main().catch(console.error);
