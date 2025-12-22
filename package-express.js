const { dialog, shell } = require('electron')
const path = require('path')
const fs = require('fs')
const archiver = require('archiver')

module.exports = async function packageExpress(appId, win) {
  const basePath = 'D:/GitHub/'
  const appDir = path.join(basePath, `spit-${appId}`)
  const pkgPath = path.join(appDir, 'package.json')

  if (!fs.existsSync(pkgPath)) {
    dialog.showMessageBox(win, {
      type: 'error',
      title: 'Erreur',
      message: `package.json introuvable dans ${appDir}`
    })
    return
  }

  const timestamp = new Date()
    .toISOString()
    .replace(/[-:T.]/g, '')
    .slice(0, 14)

  const zipName = `spit-${appId}-api-${timestamp}.zip`
  const zipPath = path.join(appDir, zipName)

  try {
    const output = fs.createWriteStream(zipPath)
    const archive = archiver('zip', { zlib: { level: 9 } })

    output.on('close', async () => {
      dialog.showMessageBox(win, {
        type: 'info',
        title: 'Serveur prêt',
        message: `Archive Express créée : ${zipName}`
      })

      await shell.openPath(appDir)
    })

    archive.on('error', err => {
      throw err
    })

    archive.glob('**/*', {
      cwd: appDir,
      ignore: [
        'node_modules/**',
        '.git/**',
        '*.log',
        zipName
      ]
    })

    archive.pipe(output)
    await archive.finalize()
  } catch (err) {
    dialog.showMessageBox(win, {
      type: 'error',
      title: 'Erreur',
      message: `Erreur lors de l’archivage : ${err.message}`
    })
  }
}
