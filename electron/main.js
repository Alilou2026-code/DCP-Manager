// ============================================================
// DCP MANAGER — PROCESSUS PRINCIPAL ELECTRON
// ============================================================

import { app, BrowserWindow, dialog, ipcMain } from "electron"
import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

// ============================================================
// CHEMINS DU PROCESSUS PRINCIPAL
// ============================================================

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ============================================================
// URL DU SERVEUR LOCAL DCP
// ============================================================

const DCP_SERVER_URL = "http://localhost:3001"

// ============================================================
// CRÉATION DE LA FENÊTRE PRINCIPALE
// ============================================================

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.resolve(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  // ----------------------------------------------------------
  // MODE DÉVELOPPEMENT
  // ----------------------------------------------------------

  if (!app.isPackaged) {
    win.loadURL("http://localhost:5173")
    win.webContents.openDevTools({ mode: "detach" })
  } else {
    // --------------------------------------------------------
    // MODE INSTALLÉ
    // --------------------------------------------------------
    win.loadFile(path.join(__dirname, "../dist/index.html"))
  }

  // ----------------------------------------------------------
  // AFFICHAGE APRÈS CHARGEMENT
  // ----------------------------------------------------------

  win.once("ready-to-show", () => {
    win.show()
  })
}

// ============================================================
// EXPORT D'UN ÉTAT DCP
// ============================================================

async function handleSaveDcp(_event, type) {
  if (type !== "ventes" && type !== "stock") {
    throw new Error("Type d'état DCP invalide.")
  }

  const suggestedName =
    type === "ventes" ? "Etat_ventes_DCP.xlsx" : "Etat_stock_DCP.xlsx"

  const filters = [
    { name: "Classeur Excel (*.xlsx)", extensions: ["xlsx"] },
    { name: "Fichier texte (*.txt)", extensions: ["txt"] },
    { name: "Document PDF (*.pdf)", extensions: ["pdf"] },
    { name: "Page Web HTML (*.html)", extensions: ["html"] },
  ]

  const result = await dialog.showSaveDialog({
    title:
      type === "ventes"
        ? "Enregistrer l'État des ventes DCP"
        : "Enregistrer l'État de stock DCP",
    defaultPath: suggestedName,
    buttonLabel: "Enregistrer",
    filters,
  })

  if (result.canceled || !result.filePath) {
    return { canceled: true }
  }

  let filePath = result.filePath

  // Extraction de l'extension si tapée directement par l'utilisateur
  let ext = path.extname(filePath).replace(".", "").toLowerCase()

  // Si l'utilisateur n'a pas saisi d'extension, déduction d'après le filtre sélectionné
  if (!ext) {
    const filterIndex = Number.isInteger(result.filterIndex)
      ? result.filterIndex
      : 0
    const formats = ["xlsx", "txt", "pdf", "html"]
    ext = formats[filterIndex] || "xlsx"
    filePath = `${filePath}.${ext}`
  }

  const format = ext

  const response = await fetch(
    `${DCP_SERVER_URL}/api/export/dcp?type=${encodeURIComponent(
      type
    )}&format=${encodeURIComponent(format)}`
  )

  if (!response.ok) {
    let message = "Erreur pendant la génération du fichier."
    try {
      const data = await response.json()
      if (data?.message) message = data.message
    } catch {
      // Ignorer l'erreur d'analyse JSON
    }
    throw new Error(message)
  }

  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  await fs.writeFile(filePath, buffer)
let anomalyFilePath = null

if (type === "stock") {
  const anomalyResponse = await fetch(
    `${DCP_SERVER_URL}/api/export/anomalies`
  )

  if (!anomalyResponse.ok) {
    throw new Error(
      "L'État de stock a été enregistré, mais le rapport d'anomalies n'a pas pu être récupéré."
    )
  }

  const anomalyText = await anomalyResponse.text()

  anomalyFilePath = path.join(
    path.dirname(filePath),
    "Rapport_anomalies_DCP.txt"
  )

  await fs.writeFile(anomalyFilePath, anomalyText, "utf8")
}
return {
  canceled: false,
  filePath,
  fileName: path.basename(filePath),
  format: format.toUpperCase(),
  anomalyFileName: anomalyFilePath
    ? path.basename(anomalyFilePath)
    : null,
}
}

// ============================================================
// EXPORT DE L'INVENTAIRE (RAPPROCHEMENT DES STOCKS GS / GC)
// ============================================================

async function handleSaveRapprochement() {
  const filters = [
    { name: "Classeur Excel (*.xlsx)", extensions: ["xlsx"] },
    { name: "Fichier texte (*.txt)", extensions: ["txt"] },
    { name: "Document PDF (*.pdf)", extensions: ["pdf"] },
    { name: "Page Web HTML (*.html)", extensions: ["html"] },
  ]

  const result = await dialog.showSaveDialog({
    title: "Enregistrer l'inventaire (rapprochement des stocks)",
    defaultPath: "Inventaire_rapprochement_stocks.xlsx",
    buttonLabel: "Enregistrer",
    filters,
  })

  if (result.canceled || !result.filePath) {
    return { canceled: true }
  }

  let filePath = result.filePath

  // Extraction de l'extension si tapée directement par l'utilisateur
  let ext = path.extname(filePath).replace(".", "").toLowerCase()

  // Si l'utilisateur n'a pas saisi d'extension, déduction d'après le filtre sélectionné
  if (!ext) {
    const filterIndex = Number.isInteger(result.filterIndex)
      ? result.filterIndex
      : 0
    const formats = ["xlsx", "txt", "pdf", "html"]
    ext = formats[filterIndex] || "xlsx"
    filePath = `${filePath}.${ext}`
  }

  const format = ext

  const response = await fetch(
    `${DCP_SERVER_URL}/api/export/rapprochement?format=${encodeURIComponent(
      format
    )}`
  )

  if (!response.ok) {
    let message = "Erreur pendant la génération du fichier."
    try {
      const data = await response.json()
      if (data?.message) message = data.message
    } catch {
      // Ignorer l'erreur d'analyse JSON
    }
    throw new Error(message)
  }

  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  await fs.writeFile(filePath, buffer)

  return {
    canceled: false,
    filePath,
    fileName: path.basename(filePath),
    format: format.toUpperCase(),
  }
}

// ============================================================
// INITIALISATION ELECTRON
// ============================================================

app.whenReady().then(() => {
  ipcMain.handle("dcp:save-export", handleSaveDcp)
  ipcMain.handle("dcp:save-rapprochement", handleSaveRapprochement)
  createWindow()

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// ============================================================
// FERMETURE DE L'APPLICATION
// ============================================================

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})
