const { contextBridge, shell, ipcRenderer } = require('electron');
const username = 'SPITbe';
const PROJECT_PREFIX = 'spit-';
contextBridge.exposeInMainWorld('api', {
    openGitHubRepo: (appId) => {
        const url = `https://github.com/${username}/${PROJECT_PREFIX}${appId}`;
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
    },
    getVersion: async () => {
        return await ipcRenderer.invoke('get-version');
    },
    onImportJson: (callback) => {
        ipcRenderer.on('import-json', callback);
    },
    onToggleSearch: (callback) => {
        ipcRenderer.on('toggle-search', (event, value) => callback(value));
    }
});