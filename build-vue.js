const { dialog, shell } = require('electron')
const path = require('path')
const fs = require('fs')
const archiver = require('archiver')
const { spawn } = require('child_process')

module.exports = async function buildVue(appId, win) {
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

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
  const buildScripts = Object.keys(pkg.scripts || {}).filter(s =>
    s.startsWith('build')
  )

  if (buildScripts.length === 0) {
    dialog.showMessageBox(win, {
      type: 'error',
      title: 'Erreur',
      message: 'Aucun script de build trouvé dans package.json'
    })
    return
  }

  let chosenScript = buildScripts[0]

  if (buildScripts.length > 1) {
    const { response } = await dialog.showMessageBox(win, {
      type: 'question',
      buttons: buildScripts,
      title: 'Choix du build',
      message: `Plusieurs scripts de build disponibles pour ${appId}, lequel lancer ?`
    })

    if (response === -1) {
      win.webContents.send('build-cancelled')
      return
    }

    chosenScript = buildScripts[response]
  }

  const child = spawn('npm', ['run', chosenScript], {
    cwd: appDir,
    shell: true
  })

  let errorOutput = ''

  child.stdout.on('data', data => {
    const text = data.toString()
    console.log(text)
    win.webContents.send('build-output', text)
  })

  child.stderr.on('data', data => {
    const text = data.toString()
    errorOutput += text
    console.error(text)
    win.webContents.send('build-output', text)
  })

  child.on('close', async code => {
    win.webContents.send('build-finished')

    if (code !== 0) {
      dialog.showMessageBox(win, {
        type: 'error',
        title: 'Erreur de build',
        message: `Le build a échoué\n${errorOutput || 'Aucune sortie d’erreur détectée.'}`
      })
      return
    }

    const distPath = path.join(appDir, 'dist')

    if (!fs.existsSync(distPath)) {
      dialog.showMessageBox(win, {
        type: 'warning',
        title: 'Build terminé',
        message: 'Build terminé mais dossier dist introuvable'
      })
      return
    }

    const timestamp = new Date()
      .toISOString()
      .replace(/[-:T.]/g, '')
      .slice(0, 14)

    const zipName = `spit-${appId}-${timestamp}.zip`
    const zipPath = path.join(distPath, zipName)

    try {
      const output = fs.createWriteStream(zipPath)
      const archive = archiver('zip', { zlib: { level: 9 } })

      output.on('close', async () => {
        dialog.showMessageBox(win, {
          type: 'info',
          title: 'Build terminé',
          message: `Build Vue terminé et archive créée : ${zipName}`
        })

        await shell.openPath(distPath)
      })

      archive.on('error', err => {
        throw err
      })

      archive.glob('**/*', {
        cwd: distPath,
        ignore: [zipName]
      })

      archive.pipe(output)
      await archive.finalize()
    } catch (err) {
      dialog.showMessageBox(win, {
        type: 'error',
        title: 'Erreur',
        message: `Erreur lors de la création de l’archive : ${err.message}`
      })
    }
  })
}
