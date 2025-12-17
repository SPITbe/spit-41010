
# SPIT Launcher

<p align="center">
	<img src="https://img.shields.io/badge/Projet-SPIT%20Launcher-32455B?style=for-the-badge&logo=visualstudiocode&logoColor=white" alt="Projet SPIT Launcher" />
</p>

Application Electron pour ouvrir rapidement vos projets (frontend/backend) dans VSCode et accéder à leurs dépôts GitHub, à partir d'une configuration JSON personnalisable.

---

## 🎨 Couleur principale

<span style="color:#32455B;font-weight:bold">#32455B</span> (bleu principal de l'application)

---

## ✨ Fonctionnalités principales

- Lancement instantané de VSCode sur vos dossiers frontend/backend
- Accès direct aux dépôts GitHub associés
- Interface moderne, responsive et personnalisable
- Sélecteur de fichier JSON de configuration (Ctrl+J)
- Affichage dynamique des boutons selon l'existence des dossiers
- Affichage de la version de l'app (VER)
- Support multi-plateforme (Windows, Linux, Mac)

---

## 🚀 Démarrage rapide

```bash
npm install
electron .
```
L'application s'ouvre automatiquement. Configurez le chemin du fichier JSON au premier lancement ou via Ctrl+J.

---

## 🛠️ Scripts utiles

- Lancer l'app en dev :
	```bash
	npm start
	```
- Générer un build (installateur) :
	```bash
	npm run build
	```

---

## 📦 Structure technique

- `main.js` : Processus principal Electron, gestion des fenêtres, IPC, menu
- `preload.js` : Bridge sécurisé entre Node.js et le renderer (contextBridge)
- `index.html` : UI principale, chargement dynamique des apps depuis le JSON
- `style.css` : Styles modernes et responsives
- `list-apps.json` : Exemple de configuration des apps à lancer
- `package.json` : Dépendances, scripts, version

---


## ⚙️ Configuration du fichier JSON

Le fichier de configuration doit être un JSON de la forme :

```json
{
	"app1": {
		"appId": "app1",
		"application": "Nom de l'app",
		"clientId": "Client X",
		"color": "#1976d2"
	},
	"app2": {
		"appId": "app2",
		"application": "Nom de l'app 2",
		"clientId": "Client Y",
		"color": "#43a047"
	}
}
```

- Placez ce fichier où vous voulez, puis sélectionnez-le dans l'app (Ctrl+J).
- Par défaut, les dossiers VSCode doivent suivre la convention `spit-<appId>-frontend`, `spit-<appId>-backend` ou simplement `spit-<appId>`,
  et être placés dans le dossier parent configuré dans le code (exemple : `D:/GitHub/`, mais ce chemin est personnalisable selon vos besoins).

---

## 🔧 Personnalisation du préfixe des dossiers

Vous pouvez adapter le préfixe utilisé pour les dossiers VSCode (par défaut `spit-`).

- Pour cela, modifiez la variable `const prefix = 'spit-'` dans le code source (`index.html` ou `preload.js` selon votre logique).
- Exemple : pour utiliser le préfixe `myproj-`, remplacez simplement la valeur par `const prefix = 'myproj-'`.
- Les conventions de nommage deviendront alors `myproj-<appId>-frontend`, `myproj-<appId>-backend` ou `myproj-<appId>`.

---

## 📄 Licence

Ce projet est sous licence MIT. SPIT Launcher n'est affilié à aucun éditeur tiers.
