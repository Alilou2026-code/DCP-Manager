import {
  HelpCircle,
  Info,
  Users,
  ShoppingCart,
  Package,
  Database,
  FileCheck2,
  PackageCheck,
  Download,
} from "lucide-react"

const workflowSteps = [
  {
    icon: Users,
    title: "1. Importer les fichiers sources Sage",
    description:
      "État des clients, État des ventes, État des achats et Inventaire sont obligatoires. Stock Antérieur S1/S2 est facultatif.",
  },
  {
    icon: FileCheck2,
    title: "2. Générer l'État de ventes DCP",
    description:
      "Nécessite l'État des clients et l'État des ventes. Le fichier est enregistré dans le format choisi (xlsx, txt, PDF ou HTML).",
  },
  {
    icon: PackageCheck,
    title: "3. Générer l'État de stock DCP",
    description:
      "Nécessite les 4 fichiers obligatoires. Le Stock Antérieur, s'il est fourni, permet le calcul FIFO par arrivage.",
  },
  {
    icon: Package,
    title: "4. Rapprochement des stocks (Stock GS / Stock GC)",
    description:
      "Importez les deux fichiers de stock, puis cliquez sur « Générer l'inventaire ». Ces données ne sont pas enregistrées en base.",
  },
]

const fileFormats = [
  {
    icon: Users,
    title: "État des clients Sage (.txt)",
    columns: "Code client — Raison sociale — RC — Ville — Adresse",
    example:
      "41000101  ETS WEST ELECTRIQUE (GHEZAL ADDA)  07A3932054 00/27  MOSTAGANEM  QTR COLONNEL AMIROUCHE ,OULD AISSABELKACEM N°29 PART 42.",
  },
  {
    icon: ShoppingCart,
    title: "État des ventes Sage (.txt)",
    columns: "Code client — Réf-Art — Désignation — Qtés — Prx_U_HT — N°_FAC — Date",
    example:
      "41000103  0153161  AGRAFEUSE PNEUMATIQUE EM10-80-AT  3  11503,88  2  40126",
  },
  {
    icon: ShoppingCart,
    title: "État des achats Sage (.txt)",
    columns:
      "Type — Code_fourni — Date — Réf_Art — Désignation — Qtés — Prx_U_HT — N°_Facture",
    example:
      "16  40000201  090226  NMT1520R  POMPE HP 200BAR 145RPM  168,0000  30918,240000  V25000182",
  },
  {
    icon: Package,
    title: "Inventaire Sage (.txt)",
    columns: "Réf_Art — Désignation — Qtés_Stk — Prx_R_U — Valeur_R — CMUP",
    example:
      "090511  BOUCHON ROUGE-BYPASS  763.00  101.00  77 065,02  C",
  },
  {
    icon: Database,
    title: "Stock GS (.txt) — service de gestion des stocks",
    columns: "Réf_Art — Désignation — Qtés_Stk",
    example: "WGG3550  SERINGUE D'ASPIRATION HUILE  1848,00",
  },
  {
    icon: Database,
    title: "Stock GC (.txt) — service de gestion commerciale",
    columns: "Réf_Art — Désignation — Qtés_Stk",
    example: "WGG3550  SERINGUE D'ASPIRATION HUILE  1848,00",
  },
]

const glossary = [
  ["RC", "Registre de commerce"],
  ["Réf-Art / Réf_Art", "Référence article"],
  ["Qtés / Qtés_Stk", "Quantités (en stock, le cas échéant)"],
  ["Prx_U_HT", "Prix unitaire hors taxes"],
  ["N°_FAC / N°_Facture", "Numéro de facture"],
  ["Code_fourni", "Code fournisseur"],
  ["Prx_R_U", "Prix de revient unitaire"],
  ["Valeur_R", "Valeur de revient globale"],
  ["CMUP", "Coût Moyen Unitaire Pondéré"],
]

export default function Aide() {
  return (
    <div className="w-full min-h-[600px] bg-slate-100 dark:bg-neutral-950 p-6 overflow-y-auto space-y-6">

      {/* En-tête */}
      <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 px-6 py-4 flex items-center gap-4 shadow-sm rounded-2xl">
        <div className="p-3 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-xl">
          <HelpCircle className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-neutral-100">
            Aide
          </h1>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
            Guide d'utilisation de DCP Manager
          </p>
        </div>
      </div>

      {/* Démarche générale */}
      <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-5 shadow-sm space-y-4 max-w-3xl">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
            Démarche générale
          </h2>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
            Les 4 grandes étapes de l'onglet IntuiDCP Manager.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {workflowSteps.map((step) => {
            const Icon = step.icon
            return (
              <div
                key={step.title}
                className="flex gap-3 rounded-xl border border-slate-100 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800/60 p-3"
              >
                <div className="shrink-0 w-8 h-8 rounded-lg bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-slate-500 dark:text-neutral-400" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-neutral-100">
                    {step.title}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
                    {step.description}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex items-start gap-2 text-[11px] text-slate-500 dark:text-neutral-400 pt-2 border-t border-slate-100 dark:border-neutral-800">
          <Download className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            Chaque export propose 4 formats : Excel (.xlsx), texte (.txt), PDF
            et HTML. Le format est choisi dans le dialogue d'enregistrement
            Windows au moment de l'export.
          </span>
        </div>
      </div>

      {/* Formats des fichiers sources */}
      <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-5 shadow-sm space-y-4 max-w-3xl">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
            Formats des fichiers sources
          </h2>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
            Fichiers texte (.txt) générés par Sage Gestion Commerciale, colonnes
            séparées par tabulation.
          </p>
        </div>

        <div className="space-y-3">
          {fileFormats.map((format) => {
            const Icon = format.icon
            return (
              <div
                key={format.title}
                className="rounded-xl border border-slate-100 dark:border-neutral-800 overflow-hidden"
              >
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-neutral-800/60 px-3 py-2 border-b border-slate-100 dark:border-neutral-800">
                  <Icon className="w-3.5 h-3.5 text-slate-500 dark:text-neutral-400 shrink-0" />
                  <span className="text-xs font-semibold text-slate-900 dark:text-neutral-100">
                    {format.title}
                  </span>
                </div>
                <div className="px-3 py-2.5 space-y-1.5">
                  <div className="text-[11px] text-slate-600 dark:text-neutral-300">
                    <span className="font-semibold text-slate-500 dark:text-neutral-400">
                      Colonnes :{" "}
                    </span>
                    {format.columns}
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 dark:text-neutral-400 bg-slate-50 dark:bg-neutral-800/60 rounded-lg px-2 py-1.5 overflow-x-auto whitespace-pre">
                    {format.example}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <p className="text-[11px] text-slate-400 dark:text-neutral-500 pt-2 border-t border-slate-100 dark:border-neutral-800">
          Le Stock Antérieur S1/S2 (facultatif) correspond à l'État de stock
          DCP généré lors de la période précédente, réimporté pour le calcul
          FIFO par arrivage.
        </p>
      </div>

      {/* Glossaire */}
      <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-5 shadow-sm space-y-3 max-w-3xl">
        <h2 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
          Glossaire des abréviations
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
          {glossary.map(([term, meaning]) => (
            <div key={term} className="flex justify-between gap-3 text-[11px] py-1 border-b border-slate-50 dark:border-neutral-800/60">
              <span className="font-semibold text-slate-700 dark:text-neutral-200 shrink-0">
                {term}
              </span>
              <span className="text-slate-500 dark:text-neutral-400 text-right">
                {meaning}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* À propos */}
      <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-5 shadow-sm flex items-center gap-4 max-w-3xl">
        <div className="p-3 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 rounded-xl">
          <Info className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
            À propos de DCP Manager
          </h2>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
            Gestionnaire des états DCP — Version 1.0
          </p>
        </div>
      </div>

    </div>
  )
}
