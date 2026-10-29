const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const PROJECT_PREFIX = process.env.PROJECT_PREFIX || 'spit-';
const DEFAULT_BASE_DIR = process.env.SPIT_BASE_DIR || 'D:/GitHub/';

function readUserConfig() {
  try {
    const configPath = path.join(app.getPath('userData'), 'spitconfig.json');
    if (!fs.existsSync(configPath)) return null;
    const raw = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function getAppsRoot() {
  const cfg = readUserConfig();
  const fromCfg = cfg && typeof cfg.appsRoot === 'string' ? cfg.appsRoot.trim() : '';
  return fromCfg || DEFAULT_BASE_DIR;
}

function getProjectPrefix() {
  return PROJECT_PREFIX;
}

function resolveProjectDir(folder) {
  // folder: "<appId>", "<appId>-frontend", "<appId>-backend" ...
  const baseDir = getAppsRoot();
  const variantMatch = /^(.*)-(frontend|backend)$/.exec(folder);
  if (variantMatch) {
    const [, appId, variant] = variantMatch;
    const suffixedDir = path.join(baseDir, `${PROJECT_PREFIX}${folder}`);
    const nestedDir = path.join(baseDir, `${PROJECT_PREFIX}${appId}`, variant);
    if (fs.existsSync(suffixedDir)) return suffixedDir;
    if (fs.existsSync(nestedDir)) return nestedDir;
    return suffixedDir;
  }
  return path.join(baseDir, `${PROJECT_PREFIX}${folder}`);
}

module.exports = {
  getAppsRoot,
  getProjectPrefix,
  resolveProjectDir
};
