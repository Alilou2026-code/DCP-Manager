// ============================================================
// DCP MANAGER — RAPPROCHEMENT DES STOCKS GS / GC
//
// Module INDÉPENDANT :
// - il ne modifie aucune route existante ;
// - il n'écrit RIEN dans la base SQLite (données volatiles) ;
// - le résultat est gardé en mémoire uniquement et disparaît
//   au redémarrage du serveur.
//
// Fichiers sources : texte dont les colonnes sont alignées
// par des espaces :
//
//   RÉFÉRENCE   DÉSIGNATION   QUANTITÉ
//
// Règles :
// - la référence est la clé du rapprochement ;
// - la désignation du Stock GC est prioritaire (documents
//   officiels : factures, bons de livraison...) ;
// - la désignation du Stock GS n'est utilisée que si l'article
//   est absent du Stock GC (ou sans désignation dans le GC).
// ============================================================

import * as XLSX from "xlsx"

// ============================================================
// ÉTAT EN MÉMOIRE (JAMAIS ÉCRIT EN BASE)
// ============================================================

let rapprochementState = {
  rows: [],
  generatedAt: null,
}

const EXPORT_TITLE = "Inventaire - Rapprochement des stocks GS / GC"

// ============================================================
// OUTILS
// ============================================================

function roundQuantity(value) {
  const rounded = Math.round((Number(value) || 0) * 100) / 100
  return rounded === 0 ? 0 : rounded
}

function normalizeReference(value) {
  return String(value ?? "")
    .replace(/\u00a0/g, " ")
    .trim()
    .toUpperCase()
}

function parseQuantity(token) {
  const number = parseFloat(String(token ?? "").replace(",", "."))
  return Number.isFinite(number) ? number : 0
}

// ============================================================
// LECTURE D'UNE LIGNE  :  RÉFÉRENCE   DÉSIGNATION   QUANTITÉ
// ============================================================

function parseStockServiceLine(line) {
  const text = String(line ?? "")
    .replace(/^\uFEFF/, "")
    .replace(/\u00a0/g, " ")
    .trim()

  if (!text) {
    return null
  }

  // Lignes de pied de page ou de report éventuelles
  if (/^(total|totaux|report)(\s|:|$)/i.test(text)) {
    return null
  }

  // Référence = 1er bloc, quantité = dernier bloc,
  // désignation = tout ce qui se trouve entre les deux.
  const match = text.match(
    /^(\S+)(?:\s+(.*?))?\s+(-?\d+(?:[.,]\d+)?)$/
  )

  if (!match) {
    return null
  }

  return {
    reference: match[1].trim(),
    designation: (match[2] || "").replace(/\s+/g, " ").trim(),
    quantite: parseQuantity(match[3]),
  }
}

// ============================================================
// LECTURE D'UN FICHIER COMPLET
// ============================================================

function parseStockServiceContent(content) {
  const lines = String(content ?? "")
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)

  const articles = new Map()
  const lignesIgnorees = []

  let total = 0
  let valid = 0
  let ignored = 0
  let doublons = 0

  lines.forEach((line, index) => {
    if (line.trim() === "") {
      return
    }

    total++

    const article = parseStockServiceLine(line)

    if (!article) {
      ignored++

      if (lignesIgnorees.length < 10) {
        lignesIgnorees.push({
          numero: index + 1,
          contenu: line.trim(),
        })
      }

      return
    }

    valid++

    const key = normalizeReference(article.reference)
    const existing = articles.get(key)

    // Une même référence répétée dans le fichier : quantités cumulées
    if (existing) {
      existing.quantite += article.quantite

      if (!existing.designation && article.designation) {
        existing.designation = article.designation
      }

      doublons++
    } else {
      articles.set(key, { ...article })
    }
  })

  let quantiteTotale = 0

  for (const article of articles.values()) {
    quantiteTotale += article.quantite
  }

  return {
    articles,
    total,
    valid,
    ignored,
    doublons,
    quantiteTotale: roundQuantity(quantiteTotale),
    lignesIgnorees,
  }
}

// ============================================================
// RAPPROCHEMENT GS / GC (CLÉ = RÉFÉRENCE)
// ============================================================

function buildRapprochementRows(gsArticles, gcArticles) {
  const keys = new Set([...gsArticles.keys(), ...gcArticles.keys()])
  const rows = []

  for (const key of keys) {
    const gs = gsArticles.get(key)
    const gc = gcArticles.get(key)

    const qtesGS = roundQuantity(gs ? gs.quantite : 0)
    const qtesGC = roundQuantity(gc ? gc.quantite : 0)
    const ecart = roundQuantity(qtesGS - qtesGC)

    let observations

    if (!gs) {
      observations = "Absent du stock GS"
    } else if (!gc) {
      observations = "Absent du stock GC"
    } else if (ecart !== 0) {
      observations = "Écart"
    } else {
      observations = "Conforme"
    }

    rows.push({
      Reference: (gc || gs).reference,
      Designation: gc?.designation || gs?.designation || "",
      QtesGS: qtesGS,
      QtesGC: qtesGC,
      Ecart: ecart,
      Observations: observations,
    })
  }

  rows.sort((a, b) =>
    String(a.Reference).localeCompare(String(b.Reference))
  )

  return rows
}

// ============================================================
// DONNÉES POUR L'EXPORT
// ============================================================

function buildExportRows(rows) {
  return rows.map((row) => ({
    "Référence": row.Reference || "",
    "Désignation": row.Designation || "",
    "Qté Stock GS": Number(row.QtesGS) || 0,
    "Qté Stock GC": Number(row.QtesGC) || 0,
    "Écart (GS - GC)": Number(row.Ecart) || 0,
    "Observations": row.Observations || "",
  }))
}

function getPdfColumns() {
  return [
    { name: "Référence", key: "Reference", width: 14 },
    { name: "Désignation", key: "Designation", width: 34 },
    { name: "Qté Stock GS", key: "QtesGS", width: 10, numeric: true },
    { name: "Qté Stock GC", key: "QtesGC", width: 10, numeric: true },
    { name: "Écart (GS - GC)", key: "Ecart", width: 10, numeric: true },
    { name: "Observations", key: "Observations", width: 22 },
  ]
}

function createXlsxBuffer(rows) {
  const worksheet = XLSX.utils.json_to_sheet(rows)

  worksheet["!cols"] = [
    { wch: 24 },
    { wch: 55 },
    { wch: 16 },
    { wch: 16 },
    { wch: 18 },
    { wch: 24 },
  ]

  const workbook = XLSX.utils.book_new()

  XLSX.utils.book_append_sheet(workbook, worksheet, "Inventaire")

  return XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  })
}

// ============================================================
// ENREGISTREMENT DES ROUTES
//
// Les générateurs TXT, HTML et PDF existants de server.js sont
// réutilisés tels quels (ils sont passés en paramètre).
// ============================================================

export function registerRapprochement(
  app,
  { createTxtContent, createHtmlContent, createPdfBuffer }
) {
  // ----------------------------------------------------------
  // ANALYSE D'UN FICHIER (GS OU GC) — aucune écriture en base
  // ----------------------------------------------------------

  app.post("/api/rapprochement/analyse", (req, res) => {
    try {
      const { content, source } = req.body

      if (source !== "GS" && source !== "GC") {
        return res.status(400).json({
          success: false,
          message: "Source de stock invalide (GS ou GC attendu).",
        })
      }

      if (typeof content !== "string") {
        return res.status(400).json({
          success: false,
          message: `Le contenu du fichier Stock ${source} est invalide.`,
        })
      }

      const parsed = parseStockServiceContent(content)

      if (parsed.valid === 0) {
        return res.status(400).json({
          success: false,
          message: `Aucun article valide n'a été trouvé dans le fichier Stock ${source}. Chaque ligne doit contenir une référence, une désignation et une quantité.`,
          lignesAnalysees: parsed.total,
          exemplesLignesIgnorees: parsed.lignesIgnorees,
        })
      }

      res.json({
        success: true,
        message: `Fichier Stock ${source} analysé.`,
        source,
        total: parsed.total,
        valid: parsed.valid,
        ignored: parsed.ignored,
        references: parsed.articles.size,
        doublons: parsed.doublons,
        quantiteTotale: parsed.quantiteTotale,
        exemplesLignesIgnorees: parsed.lignesIgnorees,
      })
    } catch (error) {
      console.error("Erreur analyse stock GS/GC :", error)

      res.status(500).json({
        success: false,
        message:
          error.message ||
          "Une erreur est survenue pendant l'analyse du fichier de stock.",
      })
    }
  })

  // ----------------------------------------------------------
  // GÉNÉRATION DE L'INVENTAIRE — résultat gardé en mémoire
  // ----------------------------------------------------------

  app.post("/api/rapprochement/generate", (req, res) => {
    try {
      const { gsContent, gcContent } = req.body

      if (typeof gsContent !== "string") {
        return res.status(400).json({
          success: false,
          message: "Le contenu du fichier Stock GS est invalide.",
        })
      }

      if (typeof gcContent !== "string") {
        return res.status(400).json({
          success: false,
          message: "Le contenu du fichier Stock GC est invalide.",
        })
      }

      const gs = parseStockServiceContent(gsContent)
      const gc = parseStockServiceContent(gcContent)

      if (gs.valid === 0) {
        return res.status(400).json({
          success: false,
          message: "Aucun article valide n'a été trouvé dans le fichier Stock GS.",
        })
      }

      if (gc.valid === 0) {
        return res.status(400).json({
          success: false,
          message: "Aucun article valide n'a été trouvé dans le fichier Stock GC.",
        })
      }

      const rows = buildRapprochementRows(gs.articles, gc.articles)

      rapprochementState = {
        rows,
        generatedAt: new Date().toISOString(),
      }

      const countBy = (observation) =>
        rows.filter((row) => row.Observations === observation).length

      res.json({
        success: true,
        message: "Inventaire généré.",
        lignes: rows.length,
        conformes: countBy("Conforme"),
        ecarts: countBy("Écart"),
        absentsGS: countBy("Absent du stock GS"),
        absentsGC: countBy("Absent du stock GC"),
        quantiteGS: gs.quantiteTotale,
        quantiteGC: gc.quantiteTotale,
        ecartTotal: roundQuantity(gs.quantiteTotale - gc.quantiteTotale),
      })
    } catch (error) {
      console.error("Erreur génération inventaire GS/GC :", error)

      res.status(500).json({
        success: false,
        message:
          error.message ||
          "Une erreur est survenue pendant la génération de l'inventaire.",
      })
    }
  })

  // ----------------------------------------------------------
  // EXPORT DE L'INVENTAIRE : XLSX / TXT / HTML / PDF
  // ----------------------------------------------------------

  app.get("/api/export/rapprochement", async (req, res) => {
    try {
      const format = String(req.query.format || "")
        .trim()
        .toLowerCase()

      if (!["xlsx", "txt", "pdf", "html"].includes(format)) {
        return res.status(400).json({
          success: false,
          message: "Format d'export invalide.",
        })
      }

      if (rapprochementState.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message:
            "Aucun inventaire n'a été généré. Cliquez d'abord sur « Générer l'inventaire ».",
        })
      }

      const rawRows = rapprochementState.rows

      if (format === "xlsx") {
        const buffer = createXlsxBuffer(buildExportRows(rawRows))

        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )

        res.end(buffer)
        return
      }

      if (format === "txt") {
        const content = createTxtContent(buildExportRows(rawRows))

        res.setHeader("Content-Type", "text/plain; charset=utf-8")

        res.end(content)
        return
      }

      if (format === "html") {
        const content = createHtmlContent(
          EXPORT_TITLE,
          buildExportRows(rawRows)
        )

        res.setHeader("Content-Type", "text/html; charset=utf-8")

        res.end(content)
        return
      }

      const buffer = await createPdfBuffer(
        EXPORT_TITLE,
        rawRows,
        getPdfColumns()
      )

      res.setHeader("Content-Type", "application/pdf")

      res.end(buffer)
    } catch (error) {
      console.error("Erreur export inventaire GS/GC :", error)

      res.status(500).json({
        success: false,
        message:
          error.message ||
          "Erreur inconnue pendant l'export de l'inventaire.",
      })
    }
  })
}
