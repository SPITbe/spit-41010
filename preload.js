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

    buildApp: (payloadOrAppId, framework) => {
        if (payloadOrAppId && typeof payloadOrAppId === 'object') {
            ipcRenderer.send('build-app', payloadOrAppId);
            return;
        }

        if (typeof payloadOrAppId !== 'string') return;
        ipcRenderer.send('build-app', { appId: payloadOrAppId, framework });
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

    getLocalProjectPackages(appId) {
        return ipcRenderer.invoke('get-local-project-packages', { appId });
    },

    getOnlineVersions({ npmPackages, includeNodeLts } = {}) {
        return ipcRenderer.invoke('get-online-versions', { npmPackages, includeNodeLts });
    },

    openJsonFile(jsonPath) {
        return ipcRenderer.invoke('open-json-file', { jsonPath });
    },

    getAppsJson() {
        return ipcRenderer.invoke('get-apps-json');
    },

    saveAppsJson(data) {
        return ipcRenderer.invoke('save-apps-json', { data });
    },

    getAppsJsonPath() {
        return ipcRenderer.invoke('get-apps-json-path');
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
    },

    onFilterFramework(callback) {
        const listener = () => callback();
        ipcRenderer.on('filter-framework', listener);
        return () => ipcRenderer.removeListener('filter-framework', listener);
    },

    onFilterClient(callback) {
        const listener = () => callback();
        ipcRenderer.on('filter-client', listener);
        return () => ipcRenderer.removeListener('filter-client', listener);
    },

    onFilterClear(callback) {
        const listener = () => callback();
        ipcRenderer.on('filter-clear', listener);
        return () => ipcRenderer.removeListener('filter-clear', listener);
    },

    onOpenConfigJson(callback) {
        const listener = () => callback();
        ipcRenderer.on('open-config-json', listener);
        return () => ipcRenderer.removeListener('open-config-json', listener);
    }
});
