// ============================================================
// DCP MANAGER — PRELOAD
// PONT SÉCURISÉ ENTRE REACT ET ELECTRON
// ============================================================

import { contextBridge, ipcRenderer } from "electron"

// ============================================================
// API ELECTRON EXPOSÉE À REACT
// ============================================================

contextBridge.exposeInMainWorld("electronAPI", {
  saveDcpExport: (type) => ipcRenderer.invoke("dcp:save-export", type),
  isElectron: true,
})