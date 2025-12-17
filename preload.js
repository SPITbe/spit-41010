const { contextBridge, shell, ipcRenderer } = require('electron');

const username = 'SPITbe'

contextBridge.exposeInMainWorld('api', {
    openGitHubRepo: (repo) => {
        const url = `https://github.com/${username}/${repo}`;
        ipcRenderer.send('open-github', url);
    },
    openVSCode: (folder) => {
        ipcRenderer.send('open-vscode', `${folder}`);
    },
    checkDirs: async (appId) => {
        return await ipcRenderer.invoke('check-dirs', appId);
    }
});