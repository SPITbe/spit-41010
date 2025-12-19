const { dialog, shell } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

module.exports = async function buildElectron(appId, win) {
    const basePath = 'D:/GitHub/';
    const appDir = path.join(basePath, `spit-${appId}`);
    const pkgPath = path.join(appDir, 'package.json');

    if (!fs.existsSync(pkgPath)) {
        dialog.showMessageBox(win, {
            type: 'error',
            title: 'Erreur',
            message: `package.json introuvable dans ${appDir}`
        });
        return;
    }

    const child = spawn('npm', ['run', 'build'], {
        cwd: appDir,
        shell: true
    });

    child.stdout.on('data', data => {
        const text = data.toString();
        console.log(text); 
        win.webContents.send('build-output', text);
    });

    child.stderr.on('data', data => {
        const text = data.toString();
        console.error(text);
        win.webContents.send('build-output', text);
    });

    child.on('close', async code => {
        win.webContents.send('build-finished');

        if (code !== 0) {
            dialog.showMessageBox(win, {
                type: 'error',
                title: 'Erreur de build',
                message: `Le build a échoué pour ${appId}`
            });
            return;
        }

        const distPath = path.join(appDir, 'dist');
        if (!fs.existsSync(distPath)) {
            dialog.showMessageBox(win, {
                type: 'warning',
                title: 'Build terminé',
                message: 'Build terminé mais dossier dist introuvable'
            });
            return;
        }

        console.log(`Build terminé pour ${appId}, ouverture de ${distPath}`);
        await shell.openPath(distPath);
    });
}
