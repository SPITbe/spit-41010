const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');

function createWindow() {
    const launcher = new BrowserWindow({
        width: 900,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        }
    });

    launcher.loadFile('index.html');
}

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

ipcMain.on('open-github', (event, url) => {
    shell.openExternal(url);
});