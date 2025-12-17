const { contextBridge, shell, ipcRenderer } = require('electron');

const username = 'SPITbe'
contextBridge.exposeInMainWorld('api', {
    openGitHubRepo: (appId) => {
        const username = 'SPITbe';
        const url = `https://github.com/${username}/${appId}`;
        ipcRenderer.send('open-github', url);
    },
    openVSCode: (folder) => {
        ipcRenderer.send('open-vscode', folder);
    },
    checkDirs: async (appId) => {
        return await ipcRenderer.invoke('check-dirs', appId);
    },
    openFileDialog: async () => {
        return await ipcRenderer.invoke('open-file-dialog');
    }
});