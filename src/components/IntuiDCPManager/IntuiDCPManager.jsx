import { useState } from "react"
import {
  FileText,
  FileSpreadsheet,
  FileUp,
  Download,
  Loader2,
} from "lucide-react"

import FileUploadCard from "./FileUploadCard"
import GenerationActions from "./GenerationActions"
import CustomDialog from "../CustomDialog"

function IntuiDCPManager() {
  const [files, setFiles] = useState({
    clients: null,
    ventes: null,
    achats: null,
    inventaire: null,
    stockAnterieur: null,
  })

  // État pour le chargement bloquant
  const [isLoading, setIsLoading] = useState(false)
  const [loadingText, setLoadingText] = useState("Traitement en cours...")

  // État pour la modale personnalisée
  const [dialogConfig, setDialogConfig] = useState({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
    details: [],
    onConfirm: null,
  })

  const closeDialog = () => {
    setDialogConfig((prev) => ({ ...prev, isOpen: false, onConfirm: null }))
  }

  const canGenerateStock =
    files.clients !== null &&
    files.ventes !== null &&
    files.achats !== null &&
    files.inventaire !== null

  const updateFile = (key, file) => {
    setFiles((current) => ({
      ...current,
      [key]: file,
    }))
  }

  const handleImportClients = async (file) => {
    if (!file) return

    setIsLoading(true)
    setLoadingText("Importation et traitement des clients en cours...")

    try {
      const content = await file.text()

      const response = await fetch(
        "http://localhost:3001/api/clients/import",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content }),
        }
      )

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Erreur pendant l'import.")
      }

      setDialogConfig({
        isOpen: true,
        type: "success",
        title: "Import terminé",
        message: "L'intégration du fichier clients s'est déroulée avec succès.",
        details: [
          { label: "Clients ajoutés", value: result.added },
          { label: "Clients mis à jour", value: result.updated },
          { label: "Lignes ignorées", value: result.ignored }
        ],
        onConfirm: null
      })
    } catch (error) {
      console.error("Erreur import clients :", error)
      setDialogConfig({
        isOpen: true,
        type: "error",
        title: "Erreur d'importation",
        message: `Impossible d'importer les clients.\n\n${error.message}`,
        details: [],
        onConfirm: null
      })
    } finally {
      setIsLoading(false)
    }
  }

  // ============================================================
  // EXPORT NATIF DCP VIA ELECTRON
  // ============================================================

  async function saveDcpExport(type) {
    if (
      !window.electronAPI ||
      typeof window.electronAPI.saveDcpExport !== "function"
    ) {
      throw new Error(
        "L'API native Electron d'enregistrement n'est pas disponible."
      )
    }

    return await window.electronAPI.saveDcpExport(type)
  }

  const handleGenerateVentes = async () => {
    if (!files.clients) {
      setDialogConfig({
        isOpen: true,
        type: "error",
        title: "Prérequis manquant",
        message: "Veuillez d'abord sélectionner l'état des clients Sage pour générer les ventes DCP.",
        details: [],
        onConfirm: null
      })
      return
    }

    if (!files.ventes) {
      setDialogConfig({
        isOpen: true,
        type: "error",
        title: "Prérequis manquant",
        message: "Veuillez d'abord sélectionner l'état des ventes Sage pour générer les ventes DCP.",
        details: [],
        onConfirm: null
      })
      return
    }

    setIsLoading(true)
    setLoadingText("Génération de l'état des ventes DCP en cours...")

    try {
      const content = await files.ventes.text()

      const response = await fetch(
        "http://localhost:3001/api/ventes/generate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content }),
        }
      )

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Erreur pendant la génération de l'état de ventes DCP."
        )
      }

      let detailsList = [
        { label: "Lignes générées", value: result.generated },
        { label: "Lignes ignorées", value: result.ignored },
        { label: "Clients introuvables", value: result.clientsIntrouvables }
      ]

      if (
        result.codesClientsIntrouvables &&
        result.codesClientsIntrouvables.length > 0
      ) {
        detailsList.push({
          label: "Codes introuvables",
          value: result.codesClientsIntrouvables.join(", ")
        })
      }

      // Affichage de la 1ère modale de succès avec liaison du clic OK sur l'export
      setDialogConfig({
        isOpen: true,
        type: "success",
        title: "État de ventes DCP généré",
        message: "Le traitement s'est terminé avec succès. Cliquez sur OK pour enregistrer le fichier.",
        details: detailsList,
        onConfirm: async () => {
          const saved = await saveDcpExport("ventes")

          if (saved?.canceled) {
            return
          }

          // Affichage de la modale finale de réussite de l'enregistrement
          setDialogConfig({
            isOpen: true,
            type: "success",
            title: "Export réussi",
            message: "L'état des ventes DCP a été enregistré avec succès.",
            details: [
              { label: "Fichier", value: saved.fileName },
              { label: "Format", value: saved.format.toUpperCase() }
            ],
            onConfirm: null
          })
        }
      })
    } catch (error) {
      console.error("Erreur génération ventes DCP :", error)
      setDialogConfig({
        isOpen: true,
        type: "error",
        title: "Erreur de génération",
        message: `Impossible de générer l'état de ventes DCP.\n\n${error.message}`,
        details: [],
        onConfirm: null
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnalyseAchats = async (file) => {
    if (!file) return

    setIsLoading(true)
    setLoadingText("Analyse volumétrique du fichier des achats...")

    try {
      const content = await file.text()

      const response = await fetch(
        "http://localhost:3001/api/achats/analyse",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content }),
        }
      )

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Erreur pendant l'analyse du fichier des achats."
        )
      }

      setDialogConfig({
        isOpen: true,
        type: "success",
        title: "Analyse des achats réussie",
        message: "Le fichier des achats a été analysé avec succès.",
        details: [
          { label: "Lignes du fichier", value: result.total },
          { label: "Lignes valides", value: result.valid },
          { label: "Lignes ignorées", value: result.ignored },
          { label: "Dates invalides", value: result.datesInvalides },
          { label: "Références", value: result.references },
          { label: "Arrivages", value: result.arrivages },
          { label: "Quantité totale", value: result.quantiteTotale.toLocaleString("fr-FR") },
          { label: "Valeur totale HT", value: `${result.valeurTotale.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA` }
        ],
        onConfirm: null
      })
    } catch (error) {
      console.error("Erreur analyse achats :", error)
      setDialogConfig({
        isOpen: true,
        type: "error",
        title: "Erreur d'analyse",
        message: `Impossible d'analyser le fichier des achats.\n\n${error.message}`,
        details: [],
        onConfirm: null
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleImportInventaire = async (file) => {
    if (!file) return

    setIsLoading(true)
    setLoadingText("Importation de l'inventaire en cours...")

    try {
      const content = await file.text()

      const response = await fetch(
        "http://localhost:3001/api/inventaire/import",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content }),
        }
      )

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Erreur pendant l'import de l'inventaire."
        )
      }

      setDialogConfig({
        isOpen: true,
        type: "success",
        title: "Inventaire importé",
        message: "L'importation de l'inventaire s'est déroulée avec succès.",
        details: [
          { label: "Articles importés", value: result.articles },
          { label: "Quantité totale", value: result.quantiteTotale.toLocaleString("fr-FR") },
          { label: "Valeur totale", value: `${result.valeurTotale.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA` },
          { label: "Lignes analysées", value: result.lignesAnalysees },
          { label: "Lignes non articles", value: result.lignesNonArticles }
        ],
        onConfirm: null
      })
    } catch (error) {
      console.error("Erreur import inventaire :", error)
      setDialogConfig({
        isOpen: true,
        type: "error",
        title: "Erreur d'importation",
        message: `Impossible d'importer l'inventaire.\n\n${error.message}`,
        details: [],
        onConfirm: null
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleImportStockAnterieur = async (file) => {
    if (!file) return

    setIsLoading(true)
    setLoadingText("Traitement du stock antérieur...")

    try {
      const content = await file.text()

      const response = await fetch(
        "http://localhost:3001/api/stock-anterieur/import",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content }),
        }
      )

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Erreur pendant l'import du stock DCP antérieur."
        )
      }

      let detailsList = [
        { label: "Lignes importées", value: result.articles },
        { label: "Lignes analysées", value: result.lignesAnalysees },
        { label: "Lignes ignorées", value: result.lignesIgnorees },
        { label: "Quantité importée", value: result.quantiteImportTotale.toLocaleString("fr-FR") },
        { label: "Valeur DRHT", value: `${result.valeurTotale.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA` },
        { label: "Quantité vendue", value: result.quantiteVendueTotale.toLocaleString("fr-FR") },
        { label: "Reste en stock", value: result.resteTotal.toLocaleString("fr-FR") }
      ]

      setDialogConfig({
        isOpen: true,
        type: "success",
        title: "Stock antérieur importé",
        message: "L'état de stock DCP antérieur a été importé avec succès.",
        details: detailsList,
        onConfirm: null
      })
    } catch (error) {
      console.error("Erreur import stock DCP antérieur :", error)
      setDialogConfig({
        isOpen: true,
        type: "error",
        title: "Erreur d'importation",
        message: `Impossible d'importer l'état de stock DCP antérieur.\n\n${error.message}`,
        details: [],
        onConfirm: null
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateStock = async () => {
    if (!canGenerateStock) {
      setDialogConfig({
        isOpen: true,
        type: "error",
        title: "Prérequis manquants",
        message: "Veuillez sélectionner les 4 fichiers obligatoires avant de générer l'état de stock DCP.",
        details: [],
        onConfirm: null
      })
      return
    }

    setIsLoading(true)
    setLoadingText("Génération et calcul de l'état de stock DCP...")

    try {
      const achatsContent = await files.achats.text()

      const stockAnterieurContent = files.stockAnterieur
        ? await files.stockAnterieur.text()
        : null

      const response = await fetch(
        "http://localhost:3001/api/stock/generate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            achatsContent,
            stockAnterieurContent,
          }),
        }
      )

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Erreur pendant la génération de l'état de stock DCP."
        )
      }

      let detailsList = [
        { label: "Lignes générées", value: result.lignesGenerees },
        { label: "Articles", value: result.articles },
        { label: "Arrivages", value: result.arrivages },
        { label: "Références avec écart", value: result.referencesAvecEcart },
        { label: "Quantité importée", value: result.quantiteImportTotale.toLocaleString("fr-FR") },
        { label: "Valeur DRHT", value: `${result.valeurTotale.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA` },
        { label: "Quantité vendue", value: result.quantiteVendueTotale.toLocaleString("fr-FR") },
        { label: "Reste en stock", value: result.resteTotal.toLocaleString("fr-FR") }
      ]

      // Affichage de la 1ère modale de succès avec liaison du clic OK sur l'export
      setDialogConfig({
        isOpen: true,
        type: "success",
        title: "État de stock DCP généré",
        message: "La génération de l'état de stock s'est déroulée avec succès. Cliquez sur OK pour enregistrer le fichier.",
        details: detailsList,
        onConfirm: async () => {
          const saved = await saveDcpExport("stock")

          if (saved?.canceled) {
            return
          }

          // Affichage de la modale finale de réussite de l'enregistrement
          setDialogConfig({
            isOpen: true,
            type: "success",
            title: "Export réussi",
            message: "L'état de stock DCP a été enregistré avec succès.",
            details: [
              { label: "Fichier", value: saved.fileName },
              { label: "Format", value: saved.format.toUpperCase() }
            ],
            onConfirm: null
          })
        }
      })
    } catch (error) {
      console.error("Erreur génération stock DCP :", error)
      setDialogConfig({
        isOpen: true,
        type: "error",
        title: "Erreur de génération",
        message: `Impossible de générer l'état de stock DCP.\n\n${error.message}`,
        details: [],
        onConfirm: null
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="relative flex h-full min-h-0 flex-col bg-slate-50 overflow-y-auto">
      
      {/* OVERLAY DE CHARGEMENT BLOQUANT */}
      {isLoading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white px-6 py-5 rounded-2xl shadow-2xl border border-slate-100 flex items-center gap-4 max-w-sm w-full mx-4">
            <Loader2 className="w-7 h-7 text-blue-600 animate-spin shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-slate-900">Patientez s'il vous plaît</h4>
              <p className="text-xs text-slate-500 mt-0.5">{loadingText}</p>
            </div>
          </div>
        </div>
      )}

      {/* En-tête principal moderne et lumineux */}
      <div className="shrink-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm m-6 mb-0 rounded-2xl">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              IntuiDCP Manager
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Centre d'intégration des fichiers sources Sage & Génération des états réglementaires
            </p>
          </div>
        </div>
        {/* Badge BDD OK */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Base de données : OK
        </div>
      </div>

      {/* Contenu principal */}
      <div className="min-h-0 flex-1 p-6 space-y-6">
        <div className="mx-auto w-full max-w-[1200px] space-y-6">
          
          {/* SECTION : FICHIERS SOURCES SAGE */}
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Fichiers sources d'importation Sage
              </h2>
              <span className="text-xs text-slate-400">
                Formats acceptés : TXT, CSV (séparateur tabulation ou point-virgule)
              </span>
            </div>

            {/* Grille des cartes des fichiers sources */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              
              <FileUploadCard
                title="État des clients Sage"
                description={files.clients ? files.clients.name : "état des clients Sage .txt"}
                required
                accept=".txt"
                file={files.clients}
                onFileChange={(file) => {
                  updateFile("clients", file)
                  if (file) {
                    handleImportClients(file)
                  }
                }}
              />

              <FileUploadCard
                title="État des ventes Sage"
                description={files.ventes ? files.ventes.name : "état des ventes Sage .txt"}
                required
                accept=".txt"
                file={files.ventes}
                onFileChange={(file) =>
                  updateFile("ventes", file)
                }
              />

              <FileUploadCard
                title="État des achats Sage"
                description={files.achats ? files.achats.name : "état des achats Sage .txt"}
                required
                accept=".txt"
                file={files.achats}
                onFileChange={(file) => {
                  updateFile("achats", file)
                  if (file) {
                    handleAnalyseAchats(file)
                  }
                }}
              />

              <FileUploadCard
                title="Inventaire au..."
                description={files.inventaire ? files.inventaire.name : "Inventaire Sage .txt"}
                required
                accept=".txt"
                file={files.inventaire}
                onFileChange={(file) => {
                  updateFile("inventaire", file)
                  if (file) {
                    handleImportInventaire(file)
                  }
                }}
              />

              <FileUploadCard
                title="Stock Antérieur S1/S2"
                description={files.stockAnterieur ? files.stockAnterieur.name : "état de stock DCP précédent"}
                accept=".txt"
                file={files.stockAnterieur}
                onFileChange={(file) => {
                  updateFile("stockAnterieur", file)
                  if (file) {
                    handleImportStockAnterieur(file)
                  }
                }}
              />

            </div>
          </div>

          {/* SECTION : GÉNÉRATION DES ÉTATS RÉGLEMENTAIRES */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Génération des états réglementaires DCP
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Les prérequis sont vérifiés au lancement du traitement. Choisissez l'extension dans le dialogue système.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={handleGenerateVentes}
                disabled={isLoading}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" /> Générer l'État de Ventes DCP
              </button>

              <button
                onClick={handleGenerateStock}
                disabled={!canGenerateStock || isLoading}
                className={`px-4 py-2.5 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-all shadow-sm ${
                  canGenerateStock && !isLoading
                    ? "bg-emerald-700 hover:bg-emerald-800 cursor-pointer" 
                    : "bg-slate-300 cursor-not-allowed opacity-70"
                }`}
              >
                <Download className="w-4 h-4" /> Générer l'État de Stock DCP
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Modale globale personnalisée pour les résultats */}
      <CustomDialog
        isOpen={dialogConfig.isOpen}
        type={dialogConfig.type}
        title={dialogConfig.title}
        message={dialogConfig.message}
        details={dialogConfig.details}
        onClose={closeDialog}
        confirmText="OK"
        onConfirm={dialogConfig.onConfirm}
      />
    </section>
  )
}

export default IntuiDCPManager