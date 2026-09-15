 import { useState } from "react"
import {
  FileText,
  Package,
} from "lucide-react"

import FileUploadCard from "./FileUploadCard"
import GenerationActions from "./GenerationActions"

function IntuiDCPManager() {
  const [files, setFiles] = useState({
    clients: null,
    ventes: null,
    achats: null,
    inventaire: null,
    stockAnterieur: null,
  })

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
    if (!file) {
      return
    }

    try {
      const content =
        await file.text()

      const response =
        await fetch(
          "http://localhost:3001/api/clients/import",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              content,
            }),
          }
        )

      const result =
        await response.json()

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            "Erreur pendant l'import."
        )
      }

      alert(
        `Import terminé .\n\n` +
          `Clients ajoutés : ${result.added}\n` +
          `Clients mis à jour : ${result.updated}\n` +
          `Lignes ignorées : ${result.ignored}`
      )
    } catch (error) {
      console.error(
        "Erreur import clients :",
        error
      )

      alert(
        `Impossible d'importer les clients.\n\n${error.message}`
      )
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
    alert(
      "Impossible de générer les ventes DCP.\n\n" +
        "Veuillez d'abord sélectionner l'état des clients Sage."
    )
    return
  }

  if (!files.ventes) {
    alert(
      "Impossible de générer les ventes DCP.\n\n" +
        "Veuillez d'abord sélectionner l'état des ventes Sage."
    )
    return
  }

  try {
    const content = await files.ventes.text()

    const response = await fetch(
      "http://localhost:3001/api/ventes/generate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
        }),
      }
    )

    const result = await response.json()

    if (!response.ok || !result.success) {
      throw new Error(
        result.message ||
          "Erreur pendant la génération de l'état de ventes DCP."
      )
    }

    let message =
      `État de ventes DCP généré avec succès.\n\n` +
      `Lignes générées : ${result.generated}\n` +
      `Lignes ignorées : ${result.ignored}\n` +
      `Clients introuvables : ${result.clientsIntrouvables}`

    if (
      result.codesClientsIntrouvables &&
      result.codesClientsIntrouvables.length > 0
    ) {
      message +=
        `\n\nCodes clients introuvables :\n` +
        result.codesClientsIntrouvables.join(", ")
    }

    alert(message)

    const saved = await saveDcpExport("ventes")

    if (saved?.canceled) {
      return
    }

    alert(
      `État des ventes DCP enregistré avec succès.\n\n` +
        `Fichier : ${saved.fileName}\n` +
        `Format : ${saved.format.toUpperCase()}`
    )
  } catch (error) {
    console.error(
      "Erreur génération ventes DCP :",
      error
    )

    alert(
      `Impossible de générer l' état de ventes DCP.\n\n${error.message}`
    )
  }
}

  const handleAnalyseAchats =
    async (file) => {
      if (!file) {
        return
      }

      try {
        const content =
          await file.text()

        const response =
          await fetch(
            "http://localhost:3001/api/achats/analyse",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                content,
              }),
            }
          )

        const result =
          await response.json()

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result.message ||
              "Erreur pendant l'analyse du fichier des achats."
          )
        }

        alert(
          `Fichier des achats analysé avec succès.\n\n` +
            `Lignes du fichier : ${result.total}\n` +
            `Lignes valides : ${result.valid}\n` +
            `Lignes ignorées : ${result.ignored}\n` +
            `Dates invalides : ${result.datesInvalides}\n` +
            `Références : ${result.references}\n` +
            `Arrivages : ${result.arrivages}\n` +
            `Quantité totale : ${result.quantiteTotale.toLocaleString(
              "fr-FR"
            )}\n` +
            `Valeur totale HT : ${result.valeurTotale.toLocaleString(
              "fr-FR",
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }
            )} DA`
        )
      } catch (error) {
        console.error(
          "Erreur analyse achats :",
          error
        )

        alert(
          `Impossible d'analyser le fichier des achats.\n\n${error.message}`
        )
      }
    }

  const handleImportInventaire =
    async (file) => {
      if (!file) {
        return
      }

      try {
        const content =
          await file.text()

        const response =
          await fetch(
            "http://localhost:3001/api/inventaire/import",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                content,
              }),
            }
          )

        const result =
          await response.json()

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result.message ||
              "Erreur pendant l'import de l'inventaire."
          )
        }

        alert(
          `Inventaire importé avec succès.\n\n` +
            `Articles importés : ${result.articles}\n` +
            `Quantité totale : ${result.quantiteTotale.toLocaleString(
              "fr-FR"
            )}\n` +
            `Valeur totale : ${result.valeurTotale.toLocaleString(
              "fr-FR",
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }
            )} DA\n` +
            `Lignes analysées : ${result.lignesAnalysees}\n` +
            `Lignes non articles : ${result.lignesNonArticles}`
        )
      } catch (error) {
        console.error(
          "Erreur import inventaire :",
          error
        )

        alert(
          `Impossible d'importer l'inventaire.\n\n${error.message}`
        )
      }
    }

  const handleImportStockAnterieur =
    async (file) => {
      if (!file) {
        return
      }

      try {
        const content =
          await file.text()

        const response =
          await fetch(
            "http://localhost:3001/api/stock-anterieur/import",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                content,
              }),
            }
          )

        const result =
          await response.json()

        if (
          !response.ok ||
          !result.success
        ) {
          let details =
            result.message ||
            "Erreur pendant l'import du stock DCP antérieur."

          if (
            result.exemplesLignesIgnorees &&
            result.exemplesLignesIgnorees.length >
              0
          ) {
            details +=
              `\n\nPremières lignes non reconnues :\n` +
              result.exemplesLignesIgnorees
                .map(
                  (ligne) =>
                    `Ligne ${ligne.numero} : ${ligne.contenu}`
                )
                .join("\n")
          }

          throw new Error(details)
        }

        let message =
          `État de stock DCP antérieur importé avec succès.\n\n` +
          `Lignes importées : ${result.articles}\n` +
          `Lignes analysées : ${result.lignesAnalysees}\n` +
          `Lignes ignorées : ${result.lignesIgnorees}\n` +
          `Quantité importée : ${result.quantiteImportTotale.toLocaleString(
            "fr-FR"
          )}\n` +
          `Valeur DRHT : ${result.valeurTotale.toLocaleString(
            "fr-FR",
            {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }
          )} DA\n` +
          `Quantité vendue : ${result.quantiteVendueTotale.toLocaleString(
            "fr-FR"
          )}\n` +
          `Reste en stock : ${result.resteTotal.toLocaleString(
            "fr-FR"
          )}`

        if (
          result.exemplesLignesIgnorees &&
          result.exemplesLignesIgnorees.length >
            0
        ) {
          message +=
            `\n\nPremières lignes ignorées :\n` +
            result.exemplesLignesIgnorees
              .map(
                (ligne) =>
                  `Ligne ${ligne.numero} : ${ligne.contenu}`
              )
              .join("\n")
        }

        alert(message)

        console.log(
          "Import stock DCP antérieur terminé :",
          result
        )
      } catch (error) {
        console.error(
          "Erreur import stock DCP antérieur :",
          error
        )

        alert(
          `Impossible d'importer l'état de stock DCP antérieur.\n\n${error.message}`
        )
      }
    }

const handleGenerateStock = async () => {
  if (!canGenerateStock) {
    alert(
      "Veuillez sélectionner les 4 fichiers obligatoires avant de générer l'état de stock DCP."
    )
    return
  }

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

    alert(
      `État de stock DCP généré avec succès.\n\n` +
        `Lignes générées : ${result.lignesGenerees}\n` +
        `Articles : ${result.articles}\n` +
        `Arrivages : ${result.arrivages}\n` +
        `Références avec écart : ${result.referencesAvecEcart}\n` +
        `Quantité importée : ${result.quantiteImportTotale.toLocaleString(
          "fr-FR"
        )}\n` +
        `Valeur DRHT : ${result.valeurTotale.toLocaleString(
          "fr-FR",
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }
        )} DA\n` +
        `Quantité  vendue : ${result.quantiteVendueTotale.toLocaleString(
          "fr-FR"
        )}\n` +
        `Reste en stock : ${result.resteTotal.toLocaleString(
          "fr-FR"
        )}`
    )

    const saved = await saveDcpExport("stock")

    if (saved?.canceled) {
      return
    }

    alert(
      `État de stock DCP enregistré avec succès.\n\n` +
        `Fichier : ${saved.fileName}\n` +
        `Format : ${saved.format.toUpperCase()}`
    )
  } catch (error) {
    console.error(
      "Erreur génération stock DCP :",
      error
    )

    alert(
      `Impossible de générer l'état de stock DCP.\n\n${error.message}`
    )
  }
}

  return (
    <section className="flex h-full min-h-0 flex-col bg-[#f3f6f8]">
      <div className="shrink-0 border-b border-[#c8d3da] bg-white px-6 py-4">
        <div className="flex items-center gap-3">
          <div
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded
              bg-[#e2ebf0]
              text-[#3e6d89]
            "
          >
            <FileText className="h-5 w-5" />
          </div>

          <div>
            <h1 className="text-[18px] font-semibold text-[#294f6b]">
              IntuiDCP Manager
            </h1>

            <p className="mt-1 text-[12px] text-[#71818b]">
              Importation des fichiers sources et génération des états DCP
            </p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-6">
        <div className="mx-auto w-full max-w-[1050px]">
          <div
            className="
              border
              border-[#c7d2d9]
              bg-white
              shadow-[0_1px_4px_rgba(39,65,80,0.08)]
            "
          >
            <div
              className="
                flex
                h-11
                items-center
                border-b
                border-[#c7d2d9]
                bg-[#e2ebf0]
                px-4
              "
            >
              <Package className="mr-2 h-4 w-4 text-[#3e6d89]" />

              <span className="text-[12px] font-semibold text-[#38596b]">
                Fichiers sources
              </span>
            </div>

            <div className="space-y-2 p-4">
              <FileUploadCard
                title=" État des clients Sage"
                description="Fichier texte :  état des clients Sage .txt"
                required
                accept=".txt"
                file={files.clients}
                onFileChange={(file) => {
                  updateFile(
                    "clients",
                    file
                  )

                  if (file) {
                    handleImportClients(
                      file
                    )
                  }
                }}
              />

              <FileUploadCard
                title=" État des ventes Sage"
                description="Fichier texte :  état des ventes Sage .txt"
                required
                accept=".txt"
                file={files.ventes}
                onFileChange={(file) =>
                  updateFile(
                    "ventes",
                    file
                  )
                }
              />

              <FileUploadCard
                title=" État des achats Sage"
                description="Fichier texte :  état des achats Sage .txt"
                required
                accept=".txt"
                file={files.achats}
                onFileChange={(file) => {
                  updateFile(
                    "achats",
                    file
                  )

                  if (file) {
                    handleAnalyseAchats(
                      file
                    )
                  }
                }}
              />

              <FileUploadCard
                title="Inventaire au..."
                description="Fichier texte brut : Inventaire Sage .txt"
                required
                accept=".txt"
                file={files.inventaire}
                onFileChange={(file) => {
                  updateFile(
                    "inventaire",
                    file
                  )

                  if (file) {
                    handleImportInventaire(
                      file
                    )
                  }
                }}
              />

              <FileUploadCard
                title=" État de stock DCP antérieur S1/S2"
                description="Fichier texte brut de l'état de stock DCP précédent"
                accept=".txt"
                file={files.stockAnterieur}
                onFileChange={(file) => {
                  updateFile(
                    "stockAnterieur",
                    file
                  )

                  if (file) {
                    handleImportStockAnterieur(
                      file
                    )
                  }
                }}
              />
            </div>

            <GenerationActions
              canGenerateStock={
                canGenerateStock
              }
              onGenerateVentes={
                handleGenerateVentes
              }
              onGenerateStock={
                handleGenerateStock
              }
            />
          </div>
        </div>
      </div>
    </section>
  )
}

export default IntuiDCPManager