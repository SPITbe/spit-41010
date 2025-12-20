const { contextBridge, ipcRenderer } = require('electron');

const username = 'SPITbe';
const PROJECT_PREFIX = 'spit-';

contextBridge.exposeInMainWorld('api', {
    /* ========= ACTIONS ========= */

    openGitHubRepo(appId) {
        if (typeof appId !== 'string') return;
        ipcRenderer.send('open-github', `https://github.com/${username}/${PROJECT_PREFIX}${appId}`);
    },

    openVSCode(folder) {
        if (typeof folder !== 'string') return;
        ipcRenderer.send('open-vscode', folder);
    },

    buildApp: (appId, framework) => {
        ipcRenderer.send('build-app', appId, framework); 
    },
    
    openAppFolder: (folder) => {
        if (typeof folder !== 'string') return;
        ipcRenderer.send('open-app-folder', folder);
    },

    openExternal: (url) => {
        if (typeof url !== 'string') return;
        ipcRenderer.send('open-external', url);
},
    /* ========= ASYNC ========= */

    checkDirs(appId) {
        return ipcRenderer.invoke('check-dirs', appId);
    },

    openFileDialog() {
        return ipcRenderer.invoke('open-file-dialog');
    },

    openFolderDialog() {
        return ipcRenderer.invoke('open-folder-dialog');
    },

    getVersion() {
        return ipcRenderer.invoke('get-version');
    },

    saveAppsRoot(appsRoot) {
        return ipcRenderer.invoke('save-apps-root', appsRoot);
    },

    /* ========= EVENTS ========= */

    onImportJson(callback) {
        const listener = () => callback();
        ipcRenderer.on('import-json', listener);
        return () => ipcRenderer.removeListener('import-json', listener);
    },

    onToggleSearch(callback) {
        const listener = () => callback();
        ipcRenderer.on('toggle-search', listener);
        return () => ipcRenderer.removeListener('toggle-search', listener);
    },

    onBuildFinished(callback) {
        const listener = () => callback();
        ipcRenderer.on('build-finished', listener);
        return () => ipcRenderer.removeListener('build-finished', listener);
    }
});
