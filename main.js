const { app, BrowserWindow, ipcMain, shell, dialog, Menu } = require('electron');
const path = require('path');
const { exec, spawn } = require('child_process');
const fs = require('fs');
const archiver = require('archiver');
const open = require('open'); 

const PROJECT_PREFIX = process.env.PROJECT_PREFIX || 'spit-';
const BASE_DIR = process.env.SPIT_BASE_DIR || 'D:/GitHub/';

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
        label: 'Fichiers',
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
    const absolutePath = path.join(BASE_DIR, `${PROJECT_PREFIX}${folder}`);
    exec(`code "${absolutePath}"`, err => {
        if (err) {
            dialog.showErrorBox('Erreur VS Code', 'Impossible d’ouvrir VS Code.');
        }
    });
});

ipcMain.handle('check-dirs', (_, appId) => {
    const root = path.join(BASE_DIR, `${PROJECT_PREFIX}${appId}`);
    return {
        frontend: fs.existsSync(`${root}-frontend`),
        backend: fs.existsSync(`${root}-backend`),
        root: fs.existsSync(root)
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
    const absolutePath = path.join(BASE_DIR, `${PROJECT_PREFIX}${folder}`);
    shell.openPath(absolutePath);
});

ipcMain.on('build-app', async (event, appId, framework) => {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) return;

    try {
        switch (framework) {
            case 'angular':
                const buildAngular = require('./build-angular');
                await buildAngular(appId, win)
                break;
            case 'electron':
                const buildElectron = require('./build-electron');
                await buildElectron(appId, win)
                break;
            case 'vue': 
                const buildVue = require('./build-vue');
                await buildVue(appId, win)
                break;
            case 'express':
                const buildExpress = require('./package-express');
                await buildExpress(appId, win)
                break;
            default:
                throw new Error('Framework de build inconnu');
        }
        if (win && !win.isDestroyed()) win.webContents.send('build-finished');
    }
    catch (error) {
        dialog.showErrorBox('Erreur', error?.message?.toString() || 'Erreur inconnue');
        if (win && !win.isDestroyed()) win.webContents.send('build-finished');
    }
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
