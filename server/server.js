// ============================================================
// DCP MANAGER — SERVEUR
// IMPORTS PRINCIPAUX
// ============================================================

import express from "express"
import db from "./database.js"

// ============================================================
// BIBLIOTHÈQUES D'EXPORT
// ============================================================

import * as XLSX from "xlsx"
import PDFDocument from "pdfkit"

// Rapprochement des stocks GS / GC (module séparé, données volatiles)
import { registerRapprochement } from "./rapprochement.js"

// ============================================================
// STOCKAGE EN MÉMOIRE DES STATS POUR LE DASHBOARD
// ============================================================
let dernierRapportAnomaliesDCP = ""
let globalDashboardStats = {
  valeurConsommation: 0,
  valeurVentes: 0,
  valeurAchats: 0,
  valeurStock: 0,
  volumeStock: 0,
  totalClients: 0,
  referencesAvecEcart: 0,
  achatsLignes: 0,
  achatsQte: 0,
  ventesLignes: 0,
  ventesQte: 0,
  inventaireLignes: 0
};

// ============================================================
// INITIALISATION DU SERVEUR
// ============================================================

const app = express()
const PORT = 3001

app.use(
  express.json({
    limit: "50mb",
  })
)

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*")
  res.header(
    "Access-Control-Allow-Methods",
    "GET,POST,OPTIONS"
  )
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type"
  )
  next()
})

function parseNumber(val) {
  if (!val) return 0
  // Remplace les espaces, retours à la ligne et convertit les virgules en points
  const cleanStr = val.toString().replace(/\s/g, "").replace(",", ".").trim()
  const num = parseFloat(cleanStr)
  return isNaN(num) ? 0 : num
}

function processEtatStockRow(line) {
  const columns = line.split("\t")
  if (columns.length < 2) return null

  // 1. Extraction de la Référence et de la Désignation depuis la 1ère colonne
  const rawRefDesig = columns[0]?.trim() || ""
  let reference = rawRefDesig
  let designation = rawRefDesig

  // Si la 1ère colonne contient un tiret qui sépare la Réf et la Désignation (ex: "YAK132-CRIC PNEUMATIQUE...")
  const dashIndex = rawRefDesig.indexOf("-")
  if (dashIndex !== -1) {
    reference = rawRefDesig.slice(0, dashIndex).trim()
    designation = rawRefDesig.slice(dashIndex + 1).trim()
  }

  // 2. Récupération exacte des colonnes avec nettoyage numérique
  const dateImport = columns[1]?.trim() || ""
  const qtesImport = parseNumber(columns[2])
  const valeurDRHT = parseNumber(columns[3])
  const qtesVendues = parseNumber(columns[4])
  const resteEnStock = parseNumber(columns[5])
  const observations = columns[6]?.trim() || ""

  return {
    reference,
    designation,
    dateImport,
    qtesImport,
    valeurDRHT,
    qtesVendues,
    resteEnStock,
    observations
  }
}

function parseDateSage(value) {
  const date = String(value ?? "")
    .replace(/\u00a0/g, " ")
    .trim()

  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
    return null
  }

  const [dayText, monthText, yearText] =
    date.split("/")

  const day = Number(dayText)
  const month = Number(monthText)
  const year = Number(yearText)

  const parsed = new Date(
    year,
    month - 1,
    day
  )

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null
  }

  return `${String(day).padStart(
    2,
    "0"
  )}/${String(month).padStart(
    2,
    "0"
  )}/${year}`
}

function parseDateSageDateAchat(value) {
  const date = String(value ?? "")
    .replace(/\u00a0/g, " ")
    .trim()

  if (!/^\d{6}$/.test(date)) {
    return null
  }

  const day = Number(date.slice(0, 2))
  const month = Number(date.slice(2, 4))
  const year = Number(`20${date.slice(4, 6)}`)

  const parsed = new Date(
    year,
    month - 1,
    day
  )

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null
  }

  return `${String(day).padStart(
    2,
    "0"
  )}/${String(month).padStart(
    2,
    "0"
  )}/${year}`
}

function parseClientLine(line) {
  const columns = line.split("\t")

  if (columns.length < 3) {
    return null
  }

  const code = columns[0]?.trim() || ""
  const raisonSociale = columns[1]?.trim() || ""
  const rcn = columns[2]?.trim() || ""

  let rawAdresse = columns[3]?.trim() || ""
  if (columns[4]) {
    rawAdresse = `${rawAdresse} ${columns[4].trim()}`.trim()
  }

  let ville = ""
  let adresse = rawAdresse

  if (rawAdresse) {
    const firstWordMatch = rawAdresse.match(/^([A-ZÀ-ÖØ-ß-]+)(?:\s+(.*))?$/)

    if (firstWordMatch) {
      const candidateVille = firstWordMatch[1]
      const restOfAdresse = firstWordMatch[2] || ""

      const addressKeywords = ["RUE", "CIT", "CITE", "ZONE", "LOT", "BVD", "BOULEVARD", "AVENUE", "QTR", "ROUTE", "BP", "CENTRE"]

      if (!addressKeywords.includes(candidateVille)) {
        ville = candidateVille
        adresse = restOfAdresse
      }
    }

    if (!ville) {
      const lastDotIndex = rawAdresse.lastIndexOf(".")
      if (lastDotIndex !== -1) {
        const afterDot = rawAdresse.slice(lastDotIndex + 1).trim()
        if (afterDot && afterDot === afterDot.toUpperCase() && !/\d/.test(afterDot)) {
          ville = afterDot
          adresse = rawAdresse.slice(0, lastDotIndex).trim()
        }
      }
    }
  }

  return {
    code,
    raisonSociale,
    rcn,
    ville,
    adresse,
  }
}

function parseVenteLine(line) {
  const columns = line.split("\t")

  if (columns.length < 7) {
    return null
  }

  const codeClient = columns[0]?.trim() || ""
  const reference = columns[1]?.trim() || ""
  const designation = columns[2]?.trim() || ""
  const qtesVendues = parseNumber(columns[3])
  const prixUnitaireHT = parseNumber(columns[4])
  const factureN = columns[5]?.trim() || ""
  const mtnVentesHT = qtesVendues * prixUnitaireHT

  if (!codeClient || !reference) {
    return null
  }

  return {
    codeClient,
    reference,
    designation,
    qtesVendues,
    prixUnitaireHT,
    factureN,
    mtnVentesHT,
  }
}

function parseAchatLine(line) {
  const columns = line.split("\t")

  if (columns.length < 8) {
    return null
  }

  const journal = columns[0]?.trim() || ""
  const codeFournisseur = columns[1]?.trim() || ""
  const dateBrute = columns[2]?.trim() || ""
  const reference = columns[3]?.trim() || ""
  const designation = columns[4]?.trim() || ""
  const qtesImport = parseNumber(columns[5])
  const prUnitHT = parseNumber(columns[6])
  const factureN = columns[7]?.trim() || ""

  if (!reference) {
    return null
  }

  const dateImport = parseDateSageDateAchat(dateBrute) || parseDateSage(dateBrute)

  if (!dateImport) {
    return {
      invalid: true,
      journal,
      codeFournisseur,
      dateBrute,
      reference,
      designation,
      qtesImport,
      prUnitHT,
      factureN,
    }
  }

  return {
    invalid: false,
    journal,
    codeFournisseur,
    dateBrute,
    dateImport,
    reference,
    designation,
    qtesImport,
    prUnitHT,
    factureN,
    valeurImport: qtesImport * prUnitHT,
  }
}

function parseInventaireLine(line) {
  const normalizedLine = String(line ?? "")
    .replace(/\u00a0/g, " ")
    .trim()

  if (!normalizedLine) {
    return null
  }

  const lowerLine = normalizedLine.toLowerCase()

  if (
    lowerLine.startsWith("report") ||
    lowerLine.startsWith("total") ||
    lowerLine.startsWith("légende") ||
    lowerLine.startsWith("legende") ||
    lowerLine.startsWith("inventaire :") ||
    lowerLine.startsWith("sarl ") ||
    lowerLine.startsWith("© sage") ||
    lowerLine.startsWith("©sage")
  ) {
    return null
  }

  if (
    lowerLine.includes("référence") &&
    lowerLine.includes("désignation")
  ) {
    return null
  }

  let text = normalizedLine

  const endLetterMatch = text.match(/\s+([CLSFG])\s*$/i)

  if (endLetterMatch) {
    text = text.slice(0, endLetterMatch.index).trim()
  }

    // CORRECTION : Un nombre ne peut pas contenir d'espaces multiples ou de tabulations internes.
  // On autorise un seul espace optionnel pour les milliers (ex: 2 500) mais pas plus.
  const numberPattern = "-?\\d+(?:\\s?\\d+)*(?:[.,]\\d+)?";

  const finalValuesRegex = new RegExp(
    `^(.*?)[ \\t]+(${numberPattern})[ \\t]+(${numberPattern})[ \\t]+(${numberPattern})$`
  )

  const match = text.match(finalValuesRegex)

  if (!match) {
    return null
  }

  const articlePart = match[1].trim()
  const qtesEnStock = parseNumber(match[2])
  const prUnitHT = parseNumber(match[3])
  const mtnDRHT = parseNumber(match[4])

  const articleMatch = articlePart.match(/^(\S+)[ \t]+(.+)$/)

  if (!articleMatch) {
    return null
  }

  const reference = articleMatch[1].trim()
  const designation = articleMatch[2].replace(/\s+/g, " ").trim()

  if (!reference || !designation) {
    return null
  }

  return {
    reference,
    designation,
    qtesEnStock,
    prUnitHT,
    mtnDRHT,
  }
}

function cleanHistoricalArticleCell(value) {
  return String(value ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/^"+|"+$/g, "")
    .trim()
    .replace(/\s+/g, " ")
}

function getKnownReferences() {
  const references = []

  const inventoryReferences = db.prepare(`
    SELECT Reference FROM Inventaire WHERE Reference IS NOT NULL AND TRIM(Reference) <> ''
  `).all()
  for (const row of inventoryReferences) {
    references.push(String(row.Reference).trim())
  }

  const salesReferences = db.prepare(`
    SELECT DISTINCT Reference FROM EtatVentesDCP WHERE Reference IS NOT NULL AND TRIM(Reference) <> ''
  `).all()
  for (const row of salesReferences) {
    references.push(String(row.Reference).trim())
  }

  const stockReferences = db.prepare(`
    SELECT DISTINCT Reference FROM EtatStockDCP WHERE Reference IS NOT NULL AND TRIM(Reference) <> ''
  `).all()
  for (const row of stockReferences) {
    references.push(String(row.Reference).trim())
  }

  return Array.from(new Set(references.filter(Boolean))).sort(
    (a, b) => b.length - a.length
  )
}

function findHistoricalReference(articleText) {
  const cleaned = cleanHistoricalArticleCell(articleText)
  if (!cleaned) return null

  const upperCleaned = cleaned.toUpperCase()
  const knownReferences = getKnownReferences()

  for (const reference of knownReferences) {
    const upperReference = reference.toUpperCase()
    const expectedPrefix = `${upperReference}-`

    if (upperCleaned.startsWith(expectedPrefix)) {
      const designation = cleaned.slice(reference.length + 1).trim()
      if (designation) return { reference, designation }
    }
  }

  for (const reference of knownReferences) {
    const upperReference = reference.toUpperCase()
    const expectedPrefix = `${upperReference} `

    if (upperCleaned.startsWith(expectedPrefix)) {
      const designation = cleaned.slice(reference.length + 1).trim()
      if (designation) return { reference, designation }
    }
  }

  const separatorIndex = cleaned.indexOf("-")
  if (separatorIndex <= 0) return null

  const reference = cleaned.slice(0, separatorIndex).trim()
  const designation = cleaned.slice(separatorIndex + 1).trim()

  if (!reference || !designation) return null

  return { reference, designation }
}

function parseStockAnterieurLine(line) {
  const columns = line.split("\t")
  if (columns.length < 6) return null

  const articleCell = cleanHistoricalArticleCell(columns[0])
  const dateImport = String(columns[1] ?? "").replace(/\u00a0/g, " ").trim()
  const qtesImport = parseNumber(columns[2])
  const valeurDRHT = parseNumber(columns[3])
  const qtesVendues = parseNumber(columns[4])
  const resteEnStock = parseNumber(columns[5])
  const observations = columns.slice(6).join(" ").replace(/\u00a0/g, " ").trim()

  if (!articleCell) return null

  const article = findHistoricalReference(articleCell)
  if (!article) return null

  const validDate = parseDateSage(dateImport)
  if (!validDate) return null

  return {
    reference: article.reference,
    designation: articleCell,
    dateImport: validDate,
    qtesImport,
    valeurDRHT,
    qtesVendues,
    resteEnStock,
    observations,
  }
}

function formatQuantityForObservation(val) {
  return Number(val).toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

function appendObservation(base, text) {
  if (!base || !base.trim()) return text
  return `${base.trim()} | ${text}`
}

// ============================================================
// NORMALISATION D'UNE RÉFÉRENCE ARTICLE
// ============================================================

function normalizeReference(value) {
  return String(value ?? "")
    .replace(/\u00a0/g, " ")
    .trim()
    .toUpperCase()
}


// ============================================================
// CONVERSION D'UNE DATE DCP EN VALEUR TRIABLE
// Format attendu : DD/MM/YYYY
// ============================================================

function convertDcpDateToSortableNumber(
  value
) {
  const date =
    String(value ?? "").trim()

  const match =
    date.match(
      /^(\d{2})\/(\d{2})\/(\d{4})$/
    )

  if (!match) {
    return 99999999
  }

  const day =
    Number(match[1])

  const month =
    Number(match[2])

  const year =
    Number(match[3])

  return (
    year * 10000 +
    month * 100 +
    day
  )
}
// ============================================================
// PRÉPARATION DES DONNÉES POUR LES EXPORTS DCP
// ============================================================


// ============================================================
// ÉTAT DES VENTES DCP
// ============================================================

function getEtatVentesForExport() {
  return db.prepare(`
    SELECT
      RaisonSociale,
      RCN,
      Ville,
      Adresse,
      Reference,
      Designation,
      QtesVendues,
      MtnVentesHT,
      FactureN,
      Observations
    FROM EtatVentesDCP
    ORDER BY
      IdEtatV
  `).all()
}


// ============================================================
// ÉTAT DE STOCK DCP
// ============================================================

function getEtatStockForExport() {
  return db.prepare(`
    SELECT
      Reference,
      Designation,
      DateImport,
      QtesImport,
      ValeurDRHT,
      QtesVendues,
      ResteEnStock,
      Observations
    FROM EtatStockDCP
    ORDER BY
      Reference COLLATE NOCASE,
      DateImport,
      IdEtatS
  `).all()
}


// ============================================================
// DONNÉES VENTES POUR EXPORT
// ============================================================

function buildVentesExportRows(rows) {
  return rows.map((row) => ({
    "Raison sociale":
      row.RaisonSociale || "",

    "RC n°":
      row.RCN || "",

    "Ville":
      row.Ville || "",

    "Adresse":
      row.Adresse || "",

    "Référence":
      row.Reference || "",

    "Désignation":
      row.Designation || "",

    "Qtés vendues":
      Number(row.QtesVendues) || 0,

    "Mtn Ventes HT":
      Number(row.MtnVentesHT) || 0,

    "Facture N°":
      row.FactureN || "",

    "Observations":
      row.Observations || "",
  }))
}


// ============================================================
// DONNÉES STOCK POUR EXPORT
// ============================================================

function buildStockExportRows(rows) {
  return rows.map((row) => ({
    "Référence":
      row.Reference || "",

    "Désignation":
      row.Designation || "",

    "Date import":
      row.DateImport || "",

    "Qtés import":
      Number(row.QtesImport) || 0,

    "Valeur D.R. HT":
      Number(row.ValeurDRHT) || 0,

    "Qtés vendues":
      Number(row.QtesVendues) || 0,

    "Reste en stock":
      Number(row.ResteEnStock) || 0,

    "Observations":
      row.Observations || "",
  }))
}


// ============================================================
// CRÉATION DU FICHIER XLSX
// ============================================================

function createXlsxBuffer(rows) {
  const worksheet =
    XLSX.utils.json_to_sheet(rows)

  // ----------------------------------------------------------
  // Largeurs de colonnes
  // ----------------------------------------------------------

  worksheet["!cols"] = [
    { wch: 28 },
    { wch: 50 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 20 },
    { wch: 18 },
    { wch: 18 },
    { wch: 55 },
  ]

  const workbook =
    XLSX.utils.book_new()

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "Etat DCP"
  )

  // ----------------------------------------------------------
  // Véritable fichier XLSX
  // ----------------------------------------------------------

  return XLSX.write(
    workbook,
    {
      type: "buffer",
      bookType: "xlsx",
    }
  )
}


// ============================================================
// CRÉATION DU FICHIER TXT
// ============================================================

function createTxtContent(rows) {
  if (rows.length === 0) {
    return "\uFEFF"
  }

  const headers =
    Object.keys(rows[0])

  const lines = [
    headers.join("\t"),
  ]

  for (const row of rows) {
    lines.push(
      headers
        .map((header) =>
          String(
            row[header] ?? ""
          )
            .replace(/\t/g, " ")
            .replace(/\r?\n/g, " ")
        )
        .join("\t")
    )
  }

  return (
    "\uFEFF" +
    lines.join("\r\n")
  )
}


// ============================================================
// ÉCHAPPEMENT HTML
// ============================================================

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}


// ============================================================
// CRÉATION DU FICHIER HTML
// ============================================================

function createHtmlContent(
  title,
  rows
) {
  const headers =
    rows.length
      ? Object.keys(rows[0])
      : []

  const headerHtml =
    headers
      .map(
        (header) =>
          `<th>${escapeHtml(header)}</th>`
      )
      .join("")

  const bodyHtml =
    rows
      .map(
        (row) =>
          `<tr>${headers
            .map(
              (header) =>
                `<td>${escapeHtml(
                  row[header]
                )}</td>`
            )
            .join("")}</tr>`
      )
      .join("")

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(title)}</title>

<style>

body {
  font-family: Arial, Helvetica, sans-serif;
  margin: 25px;
  color: #243746;
}

h1 {
  font-size: 20px;
  margin-bottom: 20px;
}

table {
  border-collapse: collapse;
  width: 100%;
  font-size: 11px;
}

th,
td {
  border: 1px solid #b8c5cd;
  padding: 6px;
  text-align: left;
  vertical-align: top;
}

th {
  background: #e2ebf0;
  font-weight: bold;
}

tr:nth-child(even) {
  background: #f7f9fa;
}

</style>
</head>

<body>

<h1>${escapeHtml(title)}</h1>

<table>

<thead>
<tr>
${headerHtml}
</tr>
</thead>

<tbody>
${bodyHtml}
</tbody>

</table>

</body>
</html>`
}


// ============================================================
// CRÉATION DU PDF
// ============================================================

function createPdfBuffer(
  title,
  rows,
  columns
) {
  return new Promise(
    (resolve, reject) => {
      const doc =
        new PDFDocument({
          size: "A4",
          layout: "landscape",
          margin: 30,
        })

      const chunks = []

      doc.on(
        "data",
        (chunk) => {
          chunks.push(chunk)
        }
      )

      doc.on(
        "end",
        () => {
          resolve(
            Buffer.concat(chunks)
          )
        }
      )

      doc.on(
        "error",
        reject
      )

      // --------------------------------------------------------
      // Titre
      // --------------------------------------------------------

      doc
        .fontSize(18)
        .font("Helvetica-Bold")
        .text(title)

      doc.moveDown(0.5)

      doc
        .fontSize(8)
        .font("Helvetica")
        .text(
          `Généré le ${new Date().toLocaleString(
            "fr-FR"
          )}`
        )

      doc.moveDown(1)

      // --------------------------------------------------------
      // Colonnes PDF
      // --------------------------------------------------------

      const availableWidth =
        doc.page.width -
        doc.page.margins.left -
        doc.page.margins.right

      const totalWidth =
        columns.reduce(
          (total, column) =>
            total + column.width,
          0
        )

      const widths =
        columns.map(
          (column) =>
            (
              column.width /
              totalWidth
            ) *
            availableWidth
        )

      const rowHeight = 30

      // --------------------------------------------------------
      // En-tête
      // --------------------------------------------------------

      function drawHeader() {
        let x =
          doc.page.margins.left

        const y =
          doc.y

        doc
          .font("Helvetica-Bold")
          .fontSize(6.5)

        columns.forEach(
          (
            column,
            index
          ) => {
            doc
              .rect(
                x,
                y,
                widths[index],
                rowHeight
              )
              .stroke()

            doc.text(
              column.name,
              x + 3,
              y + 4,
              {
                width:
                  widths[index] - 6,
                height:
                  rowHeight - 6,
                ellipsis: true,
              }
            )

            x +=
              widths[index]
          }
        )

        doc.y =
          y + rowHeight
      }

      drawHeader()

      // --------------------------------------------------------
      // Lignes
      // --------------------------------------------------------

      doc
        .font("Helvetica")
        .fontSize(6)

      for (const row of rows) {
        if (
          doc.y >
          doc.page.height - 65
        ) {
          doc.addPage()
          drawHeader()
        }

        const y =
          doc.y

        let x =
          doc.page.margins.left

        columns.forEach(
          (
            column,
            index
          ) => {
            let value =
              row[column.key]

            if (
              column.numeric
            ) {
              value =
                Number(value || 0)
                  .toLocaleString(
                    "fr-FR",
                    {
                      maximumFractionDigits:
                        2,
                    }
                  )
            }

            value =
              String(value ?? "")

            doc
              .rect(
                x,
                y,
                widths[index],
                rowHeight
              )
              .stroke()

            doc.text(
              value,
              x + 3,
              y + 4,
              {
                width:
                  widths[index] - 6,
                height:
                  rowHeight - 6,
                ellipsis: true,
              }
            )

            x +=
              widths[index]
          }
        )

        doc.y =
          y + rowHeight
      }

      doc.end()
    }
  )
}


// ============================================================
// COLONNES PDF — ÉTAT DES VENTES
// ============================================================

function getVentesPdfColumns() {
  return [
    {
      name:
        "Raison sociale",
      key:
        "RaisonSociale",
      width: 12,
    },

    {
      name:
        "RC n°",
      key:
        "RCN",
      width: 7,
    },

    {
      name:
        "Ville",
      key:
        "Ville",
      width: 7,
    },

    {
      name:
        "Adresse",
      key:
        "Adresse",
      width: 12,
    },

    {
      name:
        "Référence",
      key:
        "Reference",
      width: 8,
    },

    {
      name:
        "Désignation",
      key:
        "Designation",
      width: 15,
    },

    {
      name:
        "Qtés vendues",
      key:
        "QtesVendues",
      width: 7,
      numeric: true,
    },

    {
      name:
        "Mtn Ventes HT",
      key:
        "MtnVentesHT",
      width: 8,
      numeric: true,
    },

    {
      name:
        "Facture N°",
      key:
        "FactureN",
      width: 7,
    },

    {
      name:
        "Observations",
      key:
        "Observations",
      width: 17,
    },
  ]
}


// ============================================================
// COLONNES PDF — ÉTAT DE STOCK
// ============================================================

function getStockPdfColumns() {
  return [
    {
      name:
        "Référence",
      key:
        "Reference",
      width: 9,
    },

    {
      name:
        "Désignation",
      key:
        "Designation",
      width: 22,
    },

    {
      name:
        "Date import",
      key:
        "DateImport",
      width: 8,
    },

    {
      name:
        "Qtés import",
      key:
        "QtesImport",
      width: 8,
      numeric: true,
    },

    {
      name:
        "Valeur D.R. HT",
      key:
        "ValeurDRHT",
      width: 10,
      numeric: true,
    },

    {
      name:
        "Qtés vendues",
      key:
        "QtesVendues",
      width: 9,
      numeric: true,
    },

    {
      name:
        "Reste en stock",
      key:
        "ResteEnStock",
      width: 9,
      numeric: true,
    },

    {
      name:
        "Observations",
      key:
        "Observations",
      width: 25,
    },
  ]
}

app.post("/api/clients/import", (req, res) => {
  try {
    const { content } = req.body
    if (typeof content !== "string") {
      return res.status(400).json({ success: false, message: "Le contenu du fichier est invalide." })
    }

    const lines = content.split(/\r?\n/).map((line) => line.trimEnd()).filter((line) => line.trim() !== "")

    const selectClient = db.prepare(`SELECT IdClt FROM Clients WHERE Code = ?`)
    const updateClient = db.prepare(`
      UPDATE Clients SET RaisonSociale = @raisonSociale, RCN = @rcn, Ville = @ville, Adresse = @adresse WHERE Code = @code
    `)
    const insertClient = db.prepare(`
      INSERT INTO Clients (Code, RaisonSociale, RCN, Ville, Adresse) VALUES (@code, @raisonSociale, @rcn, @ville, @adresse)
    `)

    const importClients = db.transaction((clientLines) => {
      let added = 0, updated = 0, ignored = 0
      for (const line of clientLines) {
        const client = parseClientLine(line)
        if (!client || !client.code) { ignored++; continue }

        const existing = selectClient.get(client.code)
        if (existing) {
          updateClient.run(client)
          updated++
        } else {
          insertClient.run(client)
          added++
        }
      }
      return { added, updated, ignored, total: clientLines.length }
    })

    const result = importClients(lines)
    res.json({ success: true, message: "Import des clients terminé.", ...result })
  } catch (error) {
    res.status(500).json({ success: false, message: "Une erreur est survenue pendant l'import des clients." })
  }
})

app.post("/api/ventes/generate", (req, res) => {
  try {
    const { content } = req.body
    if (typeof content !== "string") {
      return res.status(400).json({ success: false, message: "Le contenu du fichier des ventes est invalide." })
    }

    const lines = content.split(/\r?\n/).map((line) => line.trimEnd()).filter((line) => line.trim() !== "")
    const findClient = db.prepare(`SELECT RaisonSociale, RCN, Ville, Adresse FROM Clients WHERE Code = ?`)
    const insertVente = db.prepare(`
      INSERT INTO EtatVentesDCP (RaisonSociale, RCN, Ville, Adresse, Reference, Designation, QtesVendues, MtnVentesHT, FactureN, Observations)
      VALUES (@raisonSociale, @rcn, @ville, @adresse, @reference, @designation, @qtesVendues, @mtnVentesHT, @factureN, @observations)
    `)
    const clearEtatVentes = db.prepare(`DELETE FROM EtatVentesDCP`)

    const generateVentes = db.transaction((venteLines) => {
      let generated = 0, ignored = 0, clientsIntrouvables = 0
      const codesClientsIntrouvables = new Set()

      clearEtatVentes.run()

const ventesValides = []

for (const line of venteLines) {
  const vente =
    parseVenteLine(line)

  if (!vente) {
    ignored++
    continue
  }

  const client =
    findClient.get(
      vente.codeClient
    )

  if (!client) {
    clientsIntrouvables++

    codesClientsIntrouvables.add(
      vente.codeClient
    )

    continue
  }

  ventesValides.push({
    vente,
    client,
  })
}

ventesValides.sort((a, b) => {
  const factureA = Number(a.vente.factureN)
  const factureB = Number(b.vente.factureN)

  const aValide =
    Number.isFinite(factureA)

  const bValide =
    Number.isFinite(factureB)

  if (!aValide && !bValide) {
    return 0
  }

  if (!aValide) {
    return 1
  }

  if (!bValide) {
    return -1
  }

  return factureA - factureB
})

for (const { vente, client } of ventesValides) {
  insertVente.run({
    raisonSociale:
      client.RaisonSociale,
    rcn:
      client.RCN,
    ville:
      client.Ville,
    adresse:
      client.Adresse,
    reference:
      vente.reference,
    designation:
      vente.designation,
    qtesVendues:
      vente.qtesVendues,
    mtnVentesHT:
      vente.mtnVentesHT,
    factureN:
      vente.factureN,
    observations:
      "",
  })

  generated++
}

      return {
        generated,
        ignored,
        clientsIntrouvables,
        codesClientsIntrouvables: Array.from(codesClientsIntrouvables),
        total: venteLines.length,
      }
    })

    const result = generateVentes(lines)
    res.json({ success: true, message: "État de ventes DCP généré.", ...result })
  } catch (error) {
    res.status(500).json({ success: false, message: "Une erreur est survenue pendant la génération de l'État de ventes DCP." })
  }
})

app.post("/api/achats/analyse", (req, res) => {
  try {
    const { content } = req.body
    if (typeof content !== "string") {
      return res.status(400).json({ success: false, message: "Le contenu du fichier des achats est invalide." })
    }

    const lines = content.split(/\r?\n/).map((line) => line.trimEnd()).filter((line) => line.trim() !== "")
    let valid = 0, ignored = 0, datesInvalides = 0, quantiteTotale = 0, valeurTotale = 0
    const references = new Set()
    const arrivages = new Set()
    const erreurs = []

    for (const line of lines) {
      const achat = parseAchatLine(line)
      if (!achat) { ignored++; continue }
      if (achat.invalid) {
        datesInvalides++
        erreurs.push({ reference: achat.reference, date: achat.dateBrute, designation: achat.designation })
        continue
      }

      valid++
      references.add(achat.reference)
      arrivages.add(`${achat.reference}|${achat.dateImport}`)
      quantiteTotale += achat.qtesImport
      valeurTotale += achat.valeurImport
    }

    res.json({
      success: true,
      message: "Fichier des achats analysé.",
      total: lines.length,
      valid,
      ignored,
      datesInvalides,
      references: references.size,
      arrivages: arrivages.size,
      quantiteTotale,
      valeurTotale,
      erreurs: erreurs.slice(0, 20),
    })
  } catch (error) {
    res.status(500).json({ success: false, message: "Une erreur est survenue pendant l'analyse du fichier des achats." })
  }
})

app.post("/api/inventaire/import", (req, res) => {
  try {
    const { content } = req.body
    if (typeof content !== "string") {
      return res.status(400).json({ success: false, message: "Le contenu du fichier de l'inventaire est invalide." })
    }

    const lines = content.split(/\r?\n/)
    const articles = []
    let lignesNonArticles = 0

    for (const line of lines) {
      if (!line.trim()) continue
      const article = parseInventaireLine(line)
      if (article) articles.push(article)
      else lignesNonArticles++
    }

    if (articles.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Aucun article valide n'a été trouvé dans le fichier d'inventaire.",
        lignesAnalysees: lines.length,
      })
    }

    // 1. Déclaration de la variable de nettoyage (qui manquait)
    const deleteInventaire = db.prepare(`DELETE FROM Inventaire`)
    
    const insertInventaire = db.prepare(`
      INSERT INTO Inventaire (Reference, Designation, QtesEnStock, PRUnitHT, MtnDRHT)
      VALUES (@reference, @designation, @qtesEnStock, @prUnitHT, @mtnDRHT)
    `)

    // 2. Transaction sécurisée avec cumul multi-entrepôts (Outilux + Hammadi)
    const importInventaire = db.transaction((inventoryArticles) => {
      // Nettoyage initial de la table de la base de données
      deleteInventaire.run()
      
      const aggregatedArticles = new Map()

      for (const article of inventoryArticles) {
        const refKey = article.reference.trim().toUpperCase()
        if (aggregatedArticles.has(refKey)) {
          const existing = aggregatedArticles.get(refKey)
          existing.qtesEnStock += article.qtesEnStock
          existing.mtnDRHT += article.mtnDRHT
        } else {
          aggregatedArticles.set(refKey, { ...article })
        }
      }

      // Insertion finale des données cumulées et propres
      for (const article of aggregatedArticles.values()) {
        insertInventaire.run(article)
      }
    })

    importInventaire(articles)


    const quantiteTotale = articles.reduce((total, a) => total + a.qtesEnStock, 0)
    const valeurTotale = articles.reduce((total, a) => total + a.mtnDRHT, 0)

    res.json({
      success: true,
      message: "Inventaire importé avec succès.",
      articles: articles.length,
      quantiteTotale,
      valeurTotale,
      lignesAnalysees: lines.length,
      lignesNonArticles,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Une erreur est survenue pendant l'import de l'inventaire.",
    })
  }
})

app.post("/api/stock-anterieur/import", (req, res) => {
  try {
    const { content } = req.body
    if (typeof content !== "string") {
      return res.status(400).json({ success: false, message: "Le contenu du fichier de stock DCP antérieur est invalide." })
    }

    const cleanContent = content.replace(/^\uFEFF/, "")
    const lines = cleanContent.split(/\r?\n/)
    const articles = []
    const lignesIgnorees = []

    for (let index = 0; index < lines.length; index++) {
      const line = lines[index]
      if (!line.trim()) continue
      const stock = parseStockAnterieurLine(line)
      if (stock) articles.push(stock)
      else lignesIgnorees.push({ numero: index + 1, contenu: line.trim() })
    }

    if (articles.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Aucune ligne valide de stock DCP antérieur n'a été trouvée.",
        lignesAnalysees: lines.length,
        lignesIgnorees: lignesIgnorees.length,
        exemplesLignesIgnorees: lignesIgnorees.slice(0, 10),
      })
    }

    const deleteEtatStock = db.prepare(`DELETE FROM EtatStockDCP`)
    const insertEtatStock = db.prepare(`
      INSERT INTO EtatStockDCP (Reference, Designation, DateImport, QtesImport, ValeurDRHT, QtesVendues, ResteEnStock, Observations)
      VALUES (@reference, @designation, @dateImport, @qtesImport, @valeurDRHT, @qtesVendues, @resteEnStock, @observations)
    `)

    const importStock = db.transaction((stockArticles) => {
      deleteEtatStock.run()
      for (const article of stockArticles) insertEtatStock.run(article)
    })

    importStock(articles)

    const quantiteImportTotale = articles.reduce((t, a) => t + a.qtesImport, 0)
    const valeurTotale = articles.reduce((t, a) => t + a.valeurDRHT, 0)
    const quantiteVendueTotale = articles.reduce((t, a) => t + a.qtesVendues, 0)
    const resteTotal = articles.reduce((t, a) => t + a.resteEnStock, 0)

    res.json({
      success: true,
      message: "État de stock DCP antérieur importé avec succès.",
      articles: articles.length,
      lignesAnalysees: lines.length,
      lignesIgnorees: lignesIgnorees.length,
      quantiteImportTotale,
      valeurTotale,
      quantiteVendueTotale,
      resteTotal,
      exemplesLignesIgnorees: lignesIgnorees.slice(0, 10),
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Une erreur est survenue pendant l'import du stock DCP antérieur.",
    })
  }
})

// ============================================================
// GÉNÉRATION DE L'ÉTAT DE STOCK DCP
// FIFO PAR ARRIVAGE
//
// RÈGLE MÉTIER :
// Les ventes de la période sont imputées chronologiquement
// sur les stocks restants des arrivages les plus anciens.
//
// Exemple :
// Arrivage 1 : reste 5
// Arrivage 2 : reste 100
// Arrivage 3 : reste 150
// Ventes période : 133
//
// Résultat FIFO :
// Arrivage 1 : vendu 5  -> reste 0
// Arrivage 2 : vendu 100 -> reste 0
// Arrivage 3 : vendu 28 -> reste 122
//
// Les nouveaux arrivages de la période ne sont consommés
// que lorsque les stocks antérieurs sont épuisés.
// ============================================================

app.post("/api/stock/generate", (req, res) => {
  try {
    const {
      achatsContent,
      stockAnterieurContent,
      semestre,
    } = req.body

    // ----------------------------------------------------------
    // 1. VÉRIFICATION DU FICHIER DES ACHATS
    // ----------------------------------------------------------

    if (typeof achatsContent !== "string") {
      return res.status(400).json({
        success: false,
        message:
          "Le contenu du fichier des achats est invalide.",
      })
    }

    // ----------------------------------------------------------
    // 2. LECTURE ET ANALYSE DES ACHATS DE LA PÉRIODE
    // ----------------------------------------------------------

    const achatsLines = achatsContent
      .split(/\r?\n/)
      .map((line) => line.trimEnd())
      .filter(
        (line) => line.trim() !== ""
      )

    const achatsValides = []

    for (const line of achatsLines) {
      const achat = parseAchatLine(line)

      if (!achat || achat.invalid) {
        continue
      }

      // --------------------------------------------------------
      // Filtre S1 / S2
      // --------------------------------------------------------

      if (
        semestre &&
        achat.dateImport
      ) {
        const parts =
          achat.dateImport.split("/")

        if (parts.length === 3) {
          const month =
            Number.parseInt(
              parts[1],
              10
            )

          if (
            semestre === "S1" &&
            month > 6
          ) {
            continue
          }

          if (
            semestre === "S2" &&
            month <= 6
          ) {
            continue
          }
        }
      }

      achatsValides.push(achat)
    }

    // ----------------------------------------------------------
    // 3. REGROUPEMENT DES ACHATS PAR :
    //
    //      RÉFÉRENCE + DATE D'IMPORT
    //
    // Même référence + même date = même arrivage.
    // Même référence + date différente = nouvel arrivage.
    // ----------------------------------------------------------

    const arrivalsByReference =
      new Map()

    for (const achat of achatsValides) {
      const refKey =
        achat.reference
          .trim()
          .toUpperCase()

      if (
        !arrivalsByReference.has(
          refKey
        )
      ) {
        arrivalsByReference.set(
          refKey,
          new Map()
        )
      }

      const arrivalsByDate =
        arrivalsByReference.get(
          refKey
        )

      const dateKey =
        achat.dateImport

      if (
        !arrivalsByDate.has(
          dateKey
        )
      ) {
        arrivalsByDate.set(
          dateKey,
          {
            reference:
              achat.reference.trim(),

            designation:
              achat.designation.trim(),

            dateImport:
              achat.dateImport,

            qtesImport: 0,

            valeurImport: 0,
          }
        )
      }

      const arrival =
        arrivalsByDate.get(
          dateKey
        )

      arrival.qtesImport +=
        achat.qtesImport

      arrival.valeurImport +=
        achat.valeurImport
    }

    // ----------------------------------------------------------
    // 4. LECTURE DU STOCK DCP ANTÉRIEUR
    //
    // TRÈS IMPORTANT :
    //
    // Une même référence peut avoir plusieurs lignes.
    // Nous conservons TOUTES les lignes.
    //
    // Exemple :
    //
    // EXW220OTI
    //   1er arrivage -> reste 5
    //   2e arrivage  -> reste 100
    //   3e arrivage  -> reste 150
    //
    // Elles ne doivent surtout pas être fusionnées.
    // ----------------------------------------------------------

    const previousStockByReference =
      new Map()

    if (
      typeof stockAnterieurContent ===
        "string" &&
      stockAnterieurContent.trim() !== ""
    ) {
      const previousLines =
        stockAnterieurContent
          .replace(/^\uFEFF/, "")
          .split(/\r?\n/)
          .map((line) =>
            line.trimEnd()
          )
          .filter(
            (line) =>
              line.trim() !== ""
          )

      for (const line of previousLines) {
        const previous =
          parseStockAnterieurLine(line)

        if (!previous) {
          continue
        }

        const refKey =
          previous.reference
            .trim()
            .toUpperCase()

        if (
          !previousStockByReference.has(
            refKey
          )
        ) {
          previousStockByReference.set(
            refKey,
            []
          )
        }

        previousStockByReference
          .get(refKey)
          .push({
            reference:
              previous.reference,

            designation:
              previous.designation,

            dateImport:
              previous.dateImport,

            qtesImport:
              previous.qtesImport,

            valeurDRHT:
              previous.valeurDRHT,

            qtesVendues:
              previous.qtesVendues,

            resteEnStock:
              previous.resteEnStock,

            observations:
              previous.observations || "",
          })
      }
    }

    // ENRICHISSEMENT FINANCIER AUTONOME (Conserve 100% des lignes pour l'état DCP)
    for (const [refKey, rows] of previousStockByReference.entries()) {
      for (const row of rows) {
        let coutUnitaireRevient = 0;
        let valeurResteInitialReel = 0;

        // On ne calcule la règle de trois financière QUE si le lot est vivant
        if (Number(row.resteEnStock) > 0 && Number(row.qtesImport) > 0) {
          coutUnitaireRevient = Number(row.valeurDRHT) / Number(row.qtesImport);
          valeurResteInitialReel = coutUnitaireRevient * Number(row.resteEnStock);
        }

        // On greffe les propriétés financières sans jamais supprimer la ligne
        row.coutUnitaireRevient = coutUnitaireRevient;
        row.valeurResteInitialReel = valeurResteInitialReel;
      }
    }

    // ----------------------------------------------------------
    // 5. SI AUCUN FICHIER ANTÉRIEUR N'EST FOURNI
    //
    // On récupère l'état présent en base.
    // ----------------------------------------------------------

    if (
      previousStockByReference.size ===
        0
    ) {
      const previousRows =
        db.prepare(`
          SELECT
            Reference,
            Designation,
            DateImport,
            QtesImport,
            ValeurDRHT,
            QtesVendues,
            ResteEnStock,
            Observations
          FROM EtatStockDCP
          ORDER BY IdEtatS ASC
        `).all()

      for (
        const previous of previousRows
      ) {
        const refKey =
          String(
            previous.Reference ?? ""
          )
            .trim()
            .toUpperCase()

        if (!refKey) {
          continue
        }

        if (
          !previousStockByReference.has(
            refKey
          )
        ) {
          previousStockByReference.set(
            refKey,
            []
          )
        }

        previousStockByReference
          .get(refKey)
          .push({
            ...previous,
          })
      }
    }

    // ----------------------------------------------------------
    // 6. TRI CHRONOLOGIQUE DES ARRIVAGES ANTÉRIEURS
    // ----------------------------------------------------------

    for (
      const rows of
        previousStockByReference.values()
    ) {
      rows.sort(
        (a, b) => {
          const [dayA, monthA, yearA] =
            String(
              a.dateImport || ""
            )
              .split("/")
              .map(Number)

          const [dayB, monthB, yearB] =
            String(
              b.dateImport || ""
            )
              .split("/")
              .map(Number)

          const valueA =
            Number.isFinite(
              yearA
            )
              ? yearA * 10000 +
                monthA * 100 +
                dayA
              : 99999999

          const valueB =
            Number.isFinite(
              yearB
            )
              ? yearB * 10000 +
                monthB * 100 +
                dayB
              : 99999999

          return valueA - valueB
        }
      )
    }

    // ----------------------------------------------------------
    // 7. LECTURE DES VENTES DE LA PÉRIODE
    // ----------------------------------------------------------

    const salesRows =
      db.prepare(`
        SELECT
          UPPER(TRIM(Reference)) AS RefKey,
          Reference,
          SUM(QtesVendues) AS TotalVentes
        FROM EtatVentesDCP
        WHERE
          Reference IS NOT NULL
          AND TRIM(Reference) <> ''
        GROUP BY
          UPPER(TRIM(Reference))
      `).all()

    const salesByReference =
      new Map()

    for (
      const row of salesRows
    ) {
      salesByReference.set(
        row.RefKey,
        {
          reference:
            row.Reference,

          qtesVendues:
            Number(
              row.TotalVentes
            ) || 0,
        }
      )
    }

    // ----------------------------------------------------------
    // 8. LECTURE DE L'INVENTAIRE
    //
    // Le stock réel final de référence vient de l'inventaire.
    // ----------------------------------------------------------

    const inventoryRows =
      db.prepare(`
        SELECT
          UPPER(TRIM(Reference)) AS RefKey,
          Reference,
          Designation,
          QtesEnStock,
          PRUnitHT,
          MtnDRHT
        FROM Inventaire
        WHERE
          Reference IS NOT NULL
          AND TRIM(Reference) <> ''
      `).all()

    const inventoryByReference =
      new Map()

    for (
      const row of inventoryRows
    ) {
      inventoryByReference.set(
        row.RefKey,
        {
          reference:
            row.Reference,

          designation:
            row.Designation,

          qtesEnStock:
            Number(
              row.QtesEnStock
            ) || 0,

          prUnitHT:
            Number(
              row.PRUnitHT
            ) || 0,

          mtnDRHT:
            Number(
              row.MtnDRHT
            ) || 0,
        }
      )
    }

    // ----------------------------------------------------------
    // 9. RÉUNION DE TOUTES LES RÉFÉRENCES
    // ----------------------------------------------------------

    const allReferenceKeys =
      new Set([
        ...previousStockByReference.keys(),
        ...arrivalsByReference.keys(),
        ...salesByReference.keys(),
        ...inventoryByReference.keys(),
      ])

    const generatedRows = []

    let totalArrivals = 0
    let referencesAvecAnomalie = 0

    // ----------------------------------------------------------
    // 10. TRAITEMENT DE CHAQUE RÉFÉRENCE
    // ----------------------------------------------------------

    // Variable pour cumuler la consommation réelle ligne par référence
    let cumulConsommationDashboard = 0;

    for (
      const refKey of allReferenceKeys
    ) {
      const previousRows =
        previousStockByReference.get(
          refKey
        ) || []

      const arrivalMap =
        arrivalsByReference.get(
          refKey
        ) || new Map()

      const currentArrivals =
        Array.from(
          arrivalMap.values()
        ).sort(
          (a, b) => {
            const [dayA, monthA, yearA] =
              a.dateImport
                .split("/")
                .map(Number)

            const [dayB, monthB, yearB] =
              b.dateImport
                .split("/")
                .map(Number)

            const valueA =
              yearA * 10000 +
              monthA * 100 +
              dayA

            const valueB =
              yearB * 10000 +
              monthB * 100 +
              dayB

            return valueA - valueB
          }
        )

      const saleArticle =
        salesByReference.get(
          refKey
        )

      const inventoryArticle =
        inventoryByReference.get(
          refKey
        )

      const reference =
        inventoryArticle?.reference ||
        previousRows[0]?.reference ||
        currentArrivals[0]?.reference ||
        saleArticle?.reference ||
        refKey

      const designationSource =
        inventoryArticle?.designation ||
        previousRows[0]?.designation ||
        currentArrivals[0]?.designation ||
        reference

      const fullDesignation =
        String(
          designationSource
        )
          .toUpperCase()
          .startsWith(
            `${String(reference)
              .trim()
              .toUpperCase()}-`
          )
          ? designationSource
          : `${reference}-${designationSource}`

      // --------------------------------------------------------
      // 11. TOTAL DES VENTES ACTUELLES
      // --------------------------------------------------------

      const ventesPeriode =
        saleArticle?.qtesVendues ||
        0

      let ventesRestantes =
        ventesPeriode

      // --------------------------------------------------------
      // 12. CRÉATION DES LIGNES ANTÉRIEURES
      //
      // FIFO :
      //
      // Les ventes sont imputées aux lignes antérieures
      // les plus anciennes en premier.
      // --------------------------------------------------------

      const previousGeneratedRows =
        []

      let stockAntérieurTotal = 0

      for (
        const previousRow of previousRows
      ) {
        const resteAvantVente =
          Number(
            previousRow.resteEnStock
          ) || 0

        stockAntérieurTotal +=
          resteAvantVente

        let ventesSurCetteLigne =
          0

        if (
          ventesRestantes > 0 &&
          resteAvantVente > 0
        ) {
          ventesSurCetteLigne =
            Math.min(
              ventesRestantes,
              resteAvantVente
            )

          ventesRestantes -=
            ventesSurCetteLigne
        }

        // ------------------------------------------------------
        // Le reste du LOT après le FIFO.
        // ------------------------------------------------------

        // Accumulation de la consommation sur ce lot antérieur re-valorisé
        cumulConsommationDashboard += ventesSurCetteLigne * (previousRow.coutUnitaireRevient || 0);

        const resteApresFIFO =
          resteAvantVente -
          ventesSurCetteLigne

        // ------------------------------------------------------
        // 13. OBSERVATIONS DE LA LIGNE ANTÉRIEURE
        // ------------------------------------------------------

        let observations = ""

        if (
          ventesSurCetteLigne > 0
        ) {
          if (
            Number(
              previousRow.qtesVendues
            ) > 0
          ) {
            observations =
              `${formatQuantityForObservation(
                ventesSurCetteLigne
              )}PCS dans la période ${formatQuantityForObservation(
                previousRow.qtesVendues
              )}PCS antérieures`
          } else {
            observations =
              `${formatQuantityForObservation(
                ventesSurCetteLigne
              )}PCS dans la période`
          }
        } else {
          observations =
            previousRow.observations ||
            ""
        }

        previousGeneratedRows.push({
          reference,

          // On conserve le champ complet
          // référence + désignation du fichier antérieur.
          designation:
            previousRow.designation ||
            fullDesignation,

          dateImport:
            previousRow.dateImport,

          qtesImport:
            previousRow.qtesImport,

          valeurDRHT:
            previousRow.valeurDRHT,

          qtesVendues:
            ventesSurCetteLigne,

          // IMPORTANT :
          // ici le reste est réellement mis à jour
          // selon le FIFO.
          resteEnStock:
            resteApresFIFO,

          observations,
        })
      }

      // --------------------------------------------------------
      // 14. TRAITEMENT DES NOUVEAUX ARRIVAGES
      //
      // Ils ne reçoivent des ventes que lorsque les stocks
      // antérieurs ont été totalement épuisés.
      // --------------------------------------------------------

      const currentGeneratedRows =
        []

      const totalPreviousArrivals =
        previousRows.length

      for (
        let index = 0;
        index <
        currentArrivals.length;
        index++
      ) {
        const arrival =
          currentArrivals[index]

        let ventesSurCetteLigne =
          0

        if (
          ventesRestantes > 0 &&
          arrival.qtesImport > 0
        ) {
          ventesSurCetteLigne =
            Math.min(
              ventesRestantes,
              arrival.qtesImport
            )

          ventesRestantes -=
            ventesSurCetteLigne
        }

        // ------------------------------------------------------
        // Reste de CE lot.
        // ------------------------------------------------------

        // Accumulation de la consommation sur ce nouvel arrivage d'achat
        let coutUnitaireAchat = 0;
        if (Number(arrival.qtesImport) > 0) {
          coutUnitaireAchat = Number(arrival.valeurImport) / Number(arrival.qtesImport);
        }
        cumulConsommationDashboard += ventesSurCetteLigne * coutUnitaireAchat;

        const resteNouvelArrivage =
          Math.max(
            0,
            arrival.qtesImport -
              ventesSurCetteLigne
          )

        // ------------------------------------------------------
        // 15. OBSERVATION DU NOUVEL ARRIVAGE
        // ------------------------------------------------------

        const numeroArrivage =
          totalPreviousArrivals +
          index +
          1

        const anneeArrivage =
          arrival.dateImport.slice(-4)

        let observationArrivage

        if (
          numeroArrivage === 1
        ) {
          observationArrivage =
            `1er Arrivage ${anneeArrivage}`
        } else if (
          numeroArrivage === 2
        ) {
          observationArrivage =
            `2ème Arrivage ${anneeArrivage}`
        } else {
          observationArrivage =
            `${numeroArrivage}ème Arrivage ${anneeArrivage}`
        }

        let observations =
          observationArrivage

        if (
          ventesSurCetteLigne > 0
        ) {
          observations =
            appendObservation(
              observations,
              `${formatQuantityForObservation(
                ventesSurCetteLigne
              )}PCS dans la période`
            )
        }

        currentGeneratedRows.push({
          reference,

          designation:
            fullDesignation,

          dateImport:
            arrival.dateImport,

          qtesImport:
            arrival.qtesImport,

          valeurDRHT:
            arrival.valeurImport,

          qtesVendues:
            ventesSurCetteLigne,

          resteEnStock:
            resteNouvelArrivage,

          observations,
        })

        totalArrivals++
      }

      // --------------------------------------------------------
      // 16. SI LES VENTES DÉPASSENT TOUT LE STOCK DISPONIBLE
      // --------------------------------------------------------

      if (
        ventesRestantes > 0
      ) {
        const observation =
          `Ventes non affectées : ${formatQuantityForObservation(
            ventesRestantes
          )} PCS`

        const targetRow =
          currentGeneratedRows[0] ||
          previousGeneratedRows[0]

        if (targetRow) {
          targetRow.observations =
            appendObservation(
              targetRow.observations,
              observation
            )
        }

        referencesAvecAnomalie++
      }

      // --------------------------------------------------------
      // 17. CONTRÔLE FINAL AVEC L'INVENTAIRE
      //
      // On compare le total des restes reconstruits par FIFO
      // au stock réellement constaté dans l'inventaire.
      // --------------------------------------------------------

      const resteDcpReconstitue =
        previousGeneratedRows.reduce(
          (total, row) =>
            total + row.resteEnStock,
          0
        ) +
        currentGeneratedRows.reduce(
          (total, row) =>
            total + row.resteEnStock,
          0
        )

      if (
        inventoryArticle &&
        Math.abs(
          resteDcpReconstitue -
            inventoryArticle.qtesEnStock
        ) > 0.000001
      ) {
        const ecart =
          inventoryArticle.qtesEnStock -
          resteDcpReconstitue

        const signe =
          ecart > 0
            ? "+"
            : ""

        const observationEcart =
          `Écart inventaire : DCP ${formatQuantityForObservation(
            resteDcpReconstitue
          )} PCS / inventaire ${formatQuantityForObservation(
            inventoryArticle.qtesEnStock
          )} PCS (${signe}${formatQuantityForObservation(
            ecart
          )} PCS)`

        // ------------------------------------------------------
        // L'écart est placé sur la ligne qui a reçu
        // les ventes FIFO en priorité.
        // ------------------------------------------------------

        const targetRow =
          previousGeneratedRows.find(
            (row) =>
              row.qtesVendues > 0
          ) ||
          previousGeneratedRows[
            previousGeneratedRows.length -
              1
          ] ||
          currentGeneratedRows[
            currentGeneratedRows.length -
              1
          ]

        if (targetRow) {
          targetRow.observations =
            appendObservation(
              targetRow.observations,
              observationEcart
            )
        }

        referencesAvecAnomalie++
      }

      // --------------------------------------------------------
      // 18. CAS D'UNE RÉFÉRENCE SANS ARRIVAGE ANTÉRIEUR
      // ET SANS ARRIVAGE ACTUEL
      // --------------------------------------------------------

      if (
        previousGeneratedRows.length ===
          0 &&
        currentGeneratedRows.length ===
          0
      ) {
        const resteInventaire =
          inventoryArticle
            ? inventoryArticle.qtesEnStock
            : 0

        let observations = ""

        if (
          ventesPeriode > 0
        ) {
          observations =
            `${formatQuantityForObservation(
              ventesPeriode
            )}PCS dans la période`
        }

        generatedRows.push({
          reference,

          designation:
            fullDesignation,

          dateImport:
            "",

          qtesImport:
            0,

          valeurDRHT:
            0,

          qtesVendues:
            ventesPeriode,

          resteEnStock:
            resteInventaire,

          observations,
        })

        continue
      }

      // --------------------------------------------------------
      // 19. AJOUT DES LIGNES ANTÉRIEURES
      // --------------------------------------------------------

      generatedRows.push(
        ...previousGeneratedRows
      )

      // --------------------------------------------------------
      // 20. AJOUT DES NOUVEAUX ARRIVAGES
      // --------------------------------------------------------

      generatedRows.push(
        ...currentGeneratedRows
      )
    }

    // ----------------------------------------------------------
    // 21. TRI FINAL
    // Référence puis date d'import.
    // ----------------------------------------------------------

    generatedRows.sort(
      (a, b) => {
        const refCompare =
          String(a.reference)
            .localeCompare(
              String(b.reference)
            )

        if (
          refCompare !== 0
        ) {
          return refCompare
        }

        const [dayA, monthA, yearA] =
          String(
            a.dateImport || ""
          )
            .split("/")
            .map(Number)

        const [dayB, monthB, yearB] =
          String(
            b.dateImport || ""
          )
            .split("/")
            .map(Number)

        const dateA =
          Number.isFinite(yearA)
            ? yearA * 10000 +
              monthA * 100 +
              dayA
            : 99999999

        const dateB =
          Number.isFinite(yearB)
            ? yearB * 10000 +
              monthB * 100 +
              dayB
            : 99999999

        return dateA - dateB
      }
    )

    // ----------------------------------------------------------
    // 22. ENREGISTREMENT DANS EtatStockDCP
    // ----------------------------------------------------------

    const deleteEtatStock =
      db.prepare(`
        DELETE FROM EtatStockDCP
      `)

    const insertEtatStock =
      db.prepare(`
        INSERT INTO EtatStockDCP (
          Reference,
          Designation,
          DateImport,
          QtesImport,
          ValeurDRHT,
          QtesVendues,
          ResteEnStock,
          Observations
        )
        VALUES (
          @reference,
          @designation,
          @dateImport,
          @qtesImport,
          @valeurDRHT,
          @qtesVendues,
          @resteEnStock,
          @observations
        )
      `)

    const saveStock =
      db.transaction((rows) => {
        deleteEtatStock.run()

        for (
          const row of rows
        ) {
          insertEtatStock.run(row)
        }
      })

    saveStock(
      generatedRows
    )

    // ----------------------------------------------------------
    // 23. CALCUL DES TOTAUX
    // ----------------------------------------------------------

    const quantiteImportTotale =
      generatedRows.reduce(
        (total, row) =>
          total + row.qtesImport,
        0
      )

    const valeurTotale =
      generatedRows.reduce(
        (total, row) =>
          total + row.valeurDRHT,
        0
      )

    const quantiteVendueTotale =
      generatedRows.reduce(
        (total, row) =>
          total + row.qtesVendues,
        0
      )

    const resteTotal =
      generatedRows.reduce(
        (total, row) =>
          total + row.resteEnStock,
        0
      )

    // ----------------------------------------------------------
    // 24. RÉPONSE AU FRONTEND
    // ----------------------------------------------------------

    // AUTOMATISATION DES CALCULS DU DASHBOARD (Fin de la génération de stock)
    
    // 1. Calcul de la valeur financière réelle du stock résiduel (Pièces restantes × Coût unitaire d'origine du lot)
    let valeurFinanciereStockActuel = 0;
    for (const row of generatedRows) {
      let coutCalculé = 0;
      if (Number(row.qtesImport) > 0) {
        coutCalculé = Number(row.valeurDRHT) / Number(row.qtesImport);
      }
      valeurFinanciereStockActuel += row.resteEnStock * coutCalculé;
    }

    // 2. Extraction automatique des compteurs réels depuis les tables SQLite (Correction CodeClient)
    const statsVentes = db.prepare(`SELECT COUNT(*) AS Lignes, SUM(QtesVendues) AS Qte FROM EtatVentesDCP`).get() || { Lignes: 0, Qte: 0 };
    const statsInventaire = db.prepare(`SELECT COUNT(*) AS Lignes FROM Inventaire`).get() || { Lignes: 0 };
    const totalVentesHT = db.prepare(`SELECT SUM(MtnVentesHT) AS Total FROM EtatVentesDCP`).get()?.Total || 0;
    
    // Remplacement sécurisé : Compte le nombre de clients présents dans la table Clients pour le Dashboard
    const statsClients = db.prepare(`SELECT COUNT(*) AS Total FROM Clients`).get() || { Total: 0 };

    // 3. Sauvegarde dans notre objet global mémoire pour l'affichage immédiat sur l'interface
    globalDashboardStats.valeurConsommation = cumulConsommationDashboard;
    globalDashboardStats.valeurVentes = totalVentesHT;
    globalDashboardStats.valeurAchats = achatsValides.reduce((total, a) => total + (a.valeurImport || 0), 0); // Total achats analytiques de la période
    globalDashboardStats.valeurStock = valeurFinanciereStockActuel; // Vrai coût de revient du stock de clôture
    globalDashboardStats.volumeStock = resteTotal; // Volume physique total d'unités
    globalDashboardStats.totalClients = statsClients.Total || 0;
    globalDashboardStats.referencesAvecEcart = referencesAvecAnomalie;
    globalDashboardStats.achatsLignes = achatsValides.length;
    globalDashboardStats.achatsQte = quantiteImportTotale;
    globalDashboardStats.ventesLignes = statsVentes.Lignes || 0;
    globalDashboardStats.ventesQte = statsVentes.Qte || 0;
    globalDashboardStats.inventaireLignes = statsInventaire.Lignes || 0;
const anomalies = generatedRows.filter((row) => {
  const observation = String(row.observations || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()

  if (observation.includes("ecart")) {
    return true
  }

return (
  row.dateImport === "" &&
  Number(row.qtesImport) === 0 &&
  Number(row.valeurDRHT) === 0 &&
  Number(row.qtesVendues) > 0 &&
  Number(row.resteEnStock) > 0
)
})

dernierRapportAnomaliesDCP =
  "RAPPORT D'ANOMALIES DCP\n" +
  "========================\n\n"

if (anomalies.length === 0) {
  dernierRapportAnomaliesDCP += "Aucune anomalie détectée.\n"
} else {
  dernierRapportAnomaliesDCP += anomalies
    .map((row) => {
      const observation = String(row.observations || "")

      const typeAnomalie = observation
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .includes("ecart")
        ? "Écart"
        : "Mouvement sans approvisionnement"

      return [
        `Référence : ${row.reference || ""}`,
        `Désignation : ${row.designation || ""}`,
        `Date import : ${row.dateImport || ""}`,
        `Qtés importées : ${row.qtesImport ?? ""}`,
        `Valeur D.R. HT : ${row.valeurDRHT ?? ""}`,
        `Qtés vendues : ${row.qtesVendues ?? ""}`,
        `Reste en stock : ${row.resteEnStock ?? ""}`,
        `Type d'anomalie : ${typeAnomalie}`,
        `Observation : ${observation}`,
        "",
        "------------------------------------------------------------",
        "",
      ].join("\n")
    })
    .join("\n")
}
    res.json({
      success: true,

      message:
        `État de stock DCP ${
          semestre
            ? semestre + " "
            : ""
        }généré avec succès.`,

      lignesGenerees:
        generatedRows.length,

      articles:
        allReferenceKeys.size,

      arrivages:
        totalArrivals,

      referencesAvecAnomalie,

      quantiteImportTotale,

      valeurTotale,

      quantiteVendueTotale,

      resteTotal,
    })
  } catch (error) {
    console.error(
      "Erreur génération stock DCP :",
      error
    )

    res.status(500).json({
      success: false,

      message:
        error.message ||
        "Une erreur est survenue pendant la génération de l'État de stock DCP.",
    })
  }
})
// ============================================================
// ROUTE D'EXPORT DES ÉTATS DCP
//
// Formats disponibles :
// XLSX / TXT / PDF / HTML
// ============================================================
app.get("/api/export/anomalies", (req, res) => {
  res.setHeader("Content-Type", "text/plain; charset=utf-8")
  res.send("\uFEFF" + dernierRapportAnomaliesDCP)
})
app.get(
  "/api/export/dcp",
  async (req, res) => {
    try {
      const type =
        String(
          req.query.type || ""
        )
          .trim()
          .toLowerCase()

      const format =
        String(
          req.query.format || ""
        )
          .trim()
          .toLowerCase()

      // --------------------------------------------------------
      // Vérification du type
      // --------------------------------------------------------

      if (
        type !== "ventes" &&
        type !== "stock"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Type d'état DCP invalide.",
        })
      }

      // --------------------------------------------------------
      // Vérification du format
      // --------------------------------------------------------

      if (
        ![
          "xlsx",
          "txt",
          "pdf",
          "html",
        ].includes(format)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Format d'export invalide.",
        })
      }

      // --------------------------------------------------------
      // Lecture des données
      // --------------------------------------------------------

      const rawRows =
        type === "ventes"
          ? getEtatVentesForExport()
          : getEtatStockForExport()


      // ========================================================
      // XLSX
      // ========================================================

      if (
        format === "xlsx"
      ) {
        const rows =
          type === "ventes"
            ? buildVentesExportRows(
                rawRows
              )
            : buildStockExportRows(
                rawRows
              )

        const buffer =
          createXlsxBuffer(
            rows
          )

        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )

        res.end(buffer)

        return
      }


      // ========================================================
      // TXT
      // ========================================================

      if (
        format === "txt"
      ) {
        const rows =
          type === "ventes"
            ? buildVentesExportRows(
                rawRows
              )
            : buildStockExportRows(
                rawRows
              )

        const content =
          createTxtContent(
            rows
          )

        res.setHeader(
          "Content-Type",
          "text/plain; charset=utf-8"
        )

        res.end(content)

        return
      }


      // ========================================================
      // HTML
      // ========================================================

      if (
        format === "html"
      ) {
        const rows =
          type === "ventes"
            ? buildVentesExportRows(
                rawRows
              )
            : buildStockExportRows(
                rawRows
              )

        const title =
          type === "ventes"
            ? "État des ventes DCP"
            : "État de stock DCP"

        const content =
          createHtmlContent(
            title,
            rows
          )

        res.setHeader(
          "Content-Type",
          "text/html; charset=utf-8"
        )

        res.end(content)

        return
      }


      // ========================================================
      // PDF
      // ========================================================

      if (
        format === "pdf"
      ) {
        const title =
          type === "ventes"
            ? "État des ventes DCP"
            : "État de stock DCP"

        const columns =
          type === "ventes"
            ? getVentesPdfColumns()
            : getStockPdfColumns()

        const buffer =
          await createPdfBuffer(
            title,
            rawRows,
            columns
          )

        res.setHeader(
          "Content-Type",
          "application/pdf"
        )

        res.end(buffer)

        return
      }
    } catch (error) {
      // --------------------------------------------------------
      // Remonter la vraie erreur à Electron
      // --------------------------------------------------------

      console.error(
        "Erreur export DCP :",
        error
      )

      res.status(500).json({
        success: false,
        message:
          error.message ||
          "Erreur inconnue pendant l'export DCP.",
      })
    }
  }
)
// ============================================================
// ROUTE POUR ALIMENTER LE TABLEAU DE BORD DYNAMIQUE
// ============================================================
app.get("/api/dashboard/stats", (req, res) => {
  try {
    res.json({
      success: true,
      ...globalDashboardStats
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================
// RAPPROCHEMENT DES STOCKS GS / GC
// Module séparé : ./rapprochement.js (aucune écriture en base)
// ============================================================
registerRapprochement(app, {
  createTxtContent,
  createHtmlContent,
  createPdfBuffer,
})

app.listen(PORT, () => {
  console.log(`Serveur DCP Manager démarré sur http://localhost:${PORT}`)
})