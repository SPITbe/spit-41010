const { app, BrowserWindow, ipcMain, shell, dialog, Menu } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');

let version = '';
try {
    const pkgPath = path.join(__dirname, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    version = pkg.version;
} catch (e) {}

function createWindow() {
    const launcher = new BrowserWindow({
        width: 900,
        height: 600,
        title: 'SPIT Launcher',
        icon: path.join(__dirname,'icon.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        }
    });

    launcher.loadFile('index.html');
}

const toolMenu = Menu.buildFromTemplate([
    {
        label: 'Fichiers',
        submenu: [
            {label: 'Importer liste json', click: () => {
                BrowserWindow.getFocusedWindow().webContents.send('import-json');
            }},
            {type: 'separator'},
            {role: 'quit', label: 'Quitter'}
        ],
    },
    {
        label: 'A propos',
        submenu: [
            {label: 'À propos de SPIT Launcher', click: () => {
                dialog.showMessageBox({
                    type: 'info',
                    title: 'À propos de SPIT Launcher',
                    message: `SPIT Launcher\nVersion ${version}\n\nDéveloppé par SPIT.\nTous droits réservés.`,
                    buttons: ['OK']
                });
            }},
            {label: 'Visiter le dépôt GitHub', click: () => {
                shell.openExternal('https://github.com/SPITbe/spit-41010');
            }},
            {label: 'Visiter le site de SPIT', click: () => {
                shell.openExternal('https://sp-it.be');
            }}
        ]
    }
])


// Handler pour exposer la version au renderer (doit être enregistré avant tout usage)
ipcMain.handle('get-version', () => version);

Menu.setApplicationMenu(toolMenu);

ipcMain.on('open-vscode', (event, folder) => {
        const absolutePath = path.join('D:/GitHub/', `spit-${folder}`);
        exec(`code "${absolutePath}"`);
});

ipcMain.handle('check-dirs', (event, appId) => {
    const base = 'D:/GitHub/';
    const frontend = path.join(base, `spit-${appId}-frontend`);
    const backend = path.join(base, `spit-${appId}-backend`);
    return {
        frontend: fs.existsSync(frontend),
        backend: fs.existsSync(backend)
    };
});

app.whenReady().then(() => {
    createWindow();
})

ipcMain.handle('open-file-dialog', async () => {
    const result = await dialog.showOpenDialog({
        title: 'Sélectionner un fichier JSON',
        properties: ['openFile'],
        filters: [
            { name: 'JSON', extensions: ['json'] },
            { name: 'Tous les fichiers', extensions: ['*'] }
        ]
    });
    if (result.canceled || !result.filePaths.length) return null;
    return result.filePaths[0];
});

ipcMain.on('open-github', (event, url) => {
    shell.openExternal(url);
});