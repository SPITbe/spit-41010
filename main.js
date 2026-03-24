const { app, BrowserWindow, ipcMain, shell, dialog, Menu } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');
const https = require('https');
const open = require('open');

const { resolveProjectDir } = require('./apps-root');

let version = '';
try {
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf-8'));
    version = pkg.version;
} catch {}

let mainWindow = null;
let idGenWindow = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 900,
        height: 600,
        title: 'SPIT Launcher',
        icon: path.join(__dirname, 'icon.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    mainWindow.loadFile('index.html');
}

function safeSend(channel, payload) {
    const win = BrowserWindow.getFocusedWindow() || mainWindow;
    if (win && !win.isDestroyed()) {
        win.webContents.send(channel, payload);
    }
}

/* ================= MENU ================= */

const toolMenu = Menu.buildFromTemplate([
    {
        label: 'Fichier',
        submenu: [
            {
                label: 'Importer liste json',
                accelerator: 'CmdOrCtrl+I',
                click: () => safeSend('import-json')
            },
            {
                label: 'Basculer la recherche',
                accelerator: 'CmdOrCtrl+F',
                click: () => safeSend('toggle-search')
            },
            {
                label: 'Ouvrir générateur d\'ID',
                accelerator: 'CmdOrCtrl+G',
                click: openIdGeneratorWindow
            },
            { type: 'separator' },
            { role: 'quit', label: 'Quitter' }
        ]
    },
    {
        label: 'Filtre',
        submenu: [
            {
                label: 'Filtrer par framework…',
                accelerator: 'CmdOrCtrl+Alt+F',
                click: () => safeSend('filter-framework')
            },
            {
                label: 'Filtrer par client…',
                accelerator: 'CmdOrCtrl+Alt+C',
                click: () => safeSend('filter-client')
            },
            { type: 'separator' },
            {
                label: 'Réinitialiser le filtre',
                accelerator: 'CmdOrCtrl+Alt+X',
                click: () => safeSend('filter-clear')
            }
        ]
    },
    {
        label: 'À propos',
        submenu: [
            {
                label: 'À propos de SPIT Launcher',
                click: () => dialog.showMessageBox({
                    type: 'info',
                    title: 'À propos',
                    message: `SPIT Launcher\nVersion ${version}\n\nDéveloppé par SPIT.`,
                    buttons: ['OK']
                })
            },
            {
                label: 'Dépôt GitHub',
                click: () => shell.openExternal('https://github.com/SPITbe/spit-41010')
            },
            {
                label: 'Site SPIT',
                click: () => shell.openExternal('https://sp-it.be')
            }
        ]
    }
]);

Menu.setApplicationMenu(toolMenu);

/* ================= IPC ================= */

ipcMain.handle('get-version', () => version);

ipcMain.on('open-vscode', (_, folder) => {
        const absolutePath = resolveProjectDir(folder);
    exec(`code "${absolutePath}"`, err => {
        if (err) {
            dialog.showErrorBox('Erreur VS Code', 'Impossible d’ouvrir VS Code.');
        }
    });
});

ipcMain.handle('check-dirs', (_, appId) => {
    const root = resolveProjectDir(appId);
  return {
    root: fs.existsSync(root),
        frontend: fs.existsSync(`${root}-frontend`),
        backend: fs.existsSync(`${root}-backend`)
  };
});

ipcMain.handle('open-folder-dialog', async () => {
    const result = await dialog.showOpenDialog({
        properties: ['openDirectory']
    });
    return result.canceled ? null : result.filePaths[0];
});

ipcMain.on('open-external', (_, url) => {
    if (typeof url === 'string') {
        shell.openExternal(url);
    }
});

ipcMain.handle('save-apps-root', async (_, appsRoot) => {
    try {
        const configPath = path.join(app.getPath('userData'), 'spitconfig.json');
        fs.writeFileSync(configPath, JSON.stringify({ appsRoot }, null, 2), 'utf8');
        return true;
    } catch {
        return false;
    }
});

ipcMain.on('open-github', (_, url) => {
    if (typeof url === 'string') {
        shell.openExternal(url);
    }
});

ipcMain.on('open-app-folder', (_, folder) => {
    const absolutePath = resolveProjectDir(folder);
    shell.openPath(absolutePath);
});

ipcMain.on('build-app', async (_, { appId, framework }) => {
  const win = BrowserWindow.getFocusedWindow();
  if (!win) return;

  try {
    switch (framework) {
      case 'angular':
        await require('./build-angular')(appId, win);
        break;

      case 'vue':
        await require('./build-vue')(appId, win);
        break;

      case 'electron':
        await require('./build-electron')(appId, win);
        break;

      case 'express':
        await require('./package-express')(appId, win);
        break;

      default:
        throw new Error(`Framework non supporté : ${framework}`);
    }

  } catch (e) {
    dialog.showErrorBox('Erreur', e.message);
  }
});

/* ================= VERSION CHECK (LOCAL + ONLINE) ================= */

function readJsonFileSafe(filePath) {
    try {
        if (!fs.existsSync(filePath)) return null;
        const raw = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

function readPackageJsonSafe(projectDir) {
    const pkgPath = path.join(projectDir, 'package.json');
    const pkg = readJsonFileSafe(pkgPath);
    if (!pkg) return null;
    return {
        name: pkg.name,
        version: pkg.version,
        engines: pkg.engines,
        dependencies: pkg.dependencies,
        devDependencies: pkg.devDependencies
    };
}

ipcMain.handle('get-local-project-packages', (_, { appId }) => {
    if (typeof appId !== 'string' || !appId.trim()) return null;

    const rootDir = resolveProjectDir(appId);
    const frontendDir = resolveProjectDir(`${appId}-frontend`);
    const backendDir = resolveProjectDir(`${appId}-backend`);

    return {
        root: {
            dir: rootDir,
            exists: fs.existsSync(rootDir),
            packageJson: readPackageJsonSafe(rootDir)
        },
        frontend: {
            dir: frontendDir,
            exists: fs.existsSync(frontendDir),
            packageJson: readPackageJsonSafe(frontendDir)
        },
        backend: {
            dir: backendDir,
            exists: fs.existsSync(backendDir),
            packageJson: readPackageJsonSafe(backendDir)
        }
    };
});

function httpsGetJson(url) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, {
            headers: {
                'User-Agent': 'SPIT-Launcher'
            }
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
                if (res.statusCode && res.statusCode >= 400) {
                    return reject(new Error(`HTTP ${res.statusCode}`));
                }
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.setTimeout(6500, () => {
            req.destroy(new Error('timeout'));
        });
    });
}

async function fetchNpmLatest(pkgName) {
    const encoded = encodeURIComponent(pkgName).replace(/^%40/, '%40').replace(/%2F/g, '%2F');
    const url = `https://registry.npmjs.org/${encoded}`;
    const json = await httpsGetJson(url);
    const latest = json && json['dist-tags'] ? json['dist-tags'].latest : null;
    return typeof latest === 'string' ? latest : null;
}

async function fetchNodeLts() {
    const url = 'https://nodejs.org/dist/index.json';
    const json = await httpsGetJson(url);
    if (!Array.isArray(json)) return null;

    const firstLts = json.find(e => e && e.lts);
    if (!firstLts || typeof firstLts.version !== 'string') return null;
    return firstLts.version; // ex: "v22.11.0"
}

ipcMain.handle('get-online-versions', async (_, { npmPackages, includeNodeLts }) => {
    const uniquePkgs = Array.isArray(npmPackages)
        ? Array.from(new Set(npmPackages.filter(p => typeof p === 'string' && p.trim()).map(p => p.trim())))
        : [];

    const npmLatest = {};
    await Promise.all(uniquePkgs.map(async (pkg) => {
        try {
            npmLatest[pkg] = await fetchNpmLatest(pkg);
        } catch {
            npmLatest[pkg] = null;
        }
    }));

    let nodeLts = null;
    if (includeNodeLts) {
        try {
            nodeLts = await fetchNodeLts();
        } catch {
            nodeLts = null;
        }
    }

    return { npmLatest, nodeLts };
});


/* ================= ID GENERATOR ================= */

function openIdGeneratorWindow() {
    if (idGenWindow && !idGenWindow.isDestroyed()) {
        return idGenWindow.focus();
    }

    idGenWindow = new BrowserWindow({
        width: 400,
        height: 350,
        title: 'Générateur d\'ID',
        icon: path.join(__dirname, 'icon.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    idGenWindow.setMenu(null);
    idGenWindow.loadFile('id-generator.html');
    idGenWindow.on('closed', () => idGenWindow = null);
}

/* ================= APP LIFECYCLE ================= */

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
