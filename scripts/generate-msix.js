const fs = require('fs');
const path = require('path');

/**
 * electron-builder afterAllArtifactBuild hook.
 * Inspects generated artifacts, clones any .appx bundle into a matching .msix bundle,
 * and registers it with the electron-builder publish pipeline.
 */
module.exports = async function (buildResult) {
  const newArtifacts = [];
  const artifactPaths = buildResult.artifactPaths || [];

  for (const artifactPath of artifactPaths) {
    if (artifactPath.endsWith('.appx')) {
      const msixPath = artifactPath.replace(/\.appx$/, '.msix');
      try {
        fs.copyFileSync(artifactPath, msixPath);
        console.log(`[Build Hook] Generated MSIX artifact from AppX: ${path.basename(msixPath)}`);
        newArtifacts.push(msixPath);
      } catch (err) {
        console.warn(`[Build Hook] Warning: Failed to clone AppX to MSIX:`, err.message);
      }
    }
  }

  return newArtifacts;
};
