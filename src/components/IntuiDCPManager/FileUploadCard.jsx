import { useRef } from "react"
import {
  Users,
  ShoppingCart,
  Package,
  Database,
  FileSpreadsheet,
  FileText,
  Upload,
  X,
} from "lucide-react"

function FileUploadCard({
  title,
  description,
  required = false,
  accept,
  file,
  onFileChange,
  isValidFile = true,
}) {
  const inputRef = useRef(null)

  const handleSelect = (event) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      onFileChange(selectedFile)
    }
  }

  const handleRemove = () => {
    onFileChange(null)
    if (inputRef.current) {
      inputRef.current.value = ""
    }
  }

  // --- Sélection de l'icône thématique selon le titre de la carte ---
  const getThematicIcon = () => {
    const t = title.toLowerCase()
    if (t.includes("client")) {
      return <Users className="h-4 w-4 text-blue-500 dark:text-blue-400" />
    }
    if (t.includes("vente")) {
      // Si vous voulez une icône spécifique pour les ventes ou clients
      return <Users className="h-4 w-4 text-blue-500 dark:text-blue-400" />
    }
    if (t.includes("achat")) {
      return <ShoppingCart className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
    }
    if (t.includes("inventaire")) {
      return <Package className="h-4 w-4 text-purple-500 dark:text-purple-400" />
    }
    if (t.includes("stock")) {
      return <Database className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
    }
    return accept?.includes(".xlsx") ? (
      <FileSpreadsheet className="h-4 w-4 text-blue-600 dark:text-blue-400" />
    ) : (
      <FileText className="h-4 w-4 text-slate-600 dark:text-neutral-400" />
    )
  }

  // --- Détermination de l'état du badge ---
  let badgeText = required ? "Obligatoire" : "Facultatif"
  let badgeClass = required
    ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/40"
    : "bg-slate-100 text-slate-500 border-transparent dark:bg-neutral-800 dark:text-neutral-400"

  if (file) {
    if (!isValidFile) {
      badgeText = "Mauvais"
      badgeClass = "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/40"
    } else {
      badgeText = "Chargé"
      badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/40"
    }
  }

  return (
    <div
      className="
        flex
        flex-col
        justify-between
        h-full
        rounded-xl
        border
        border-slate-200
        bg-white
        p-3.5
        shadow-sm
        transition-all
        hover:border-slate-300
        dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700
      "
    >
      {/* En-tête : Titre et badge dynamique */}
      <div>
        <div className="flex items-center justify-between gap-1.5 mb-1.5">
          <span className="text-xs font-bold text-slate-900 dark:text-neutral-100 truncate" title={title}>
            {title}
          </span>

          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${badgeClass}`}>
            {badgeText}
          </span>
        </div>

        {/* Description ou Nom du fichier sélectionné avec l'icône thématique */}
        <div className="min-h-[30px] flex items-center">
          {file ? (
            <div className="flex items-center justify-between w-full bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 gap-2 dark:bg-neutral-800/60 dark:border-neutral-800">
              <div className="flex items-center gap-1.5 min-w-0">
                {getThematicIcon()}
                <span
                  className="truncate text-[11px] font-medium text-slate-700 dark:text-neutral-300"
                  title={file.name}
                >
                  {file.name}
                </span>
              </div>
              <button
                type="button"
                onClick={handleRemove}
                title="Retirer le fichier"
                className="
                  flex
                  h-4
                  w-4
                  shrink-0
                  items-center
                  justify-center
                  rounded-md
                  text-slate-400
                  hover:bg-slate-200
                  hover:text-red-600
                  dark:text-neutral-500 dark:hover:bg-neutral-700 dark:hover:text-red-400
                "
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 w-full min-w-0">
              <span className="shrink-0">{getThematicIcon()}</span>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400 truncate" title={description}>
                {description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bouton d'action en bas */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-neutral-800">
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleSelect}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="
            w-full
            flex
            items-center
            justify-center
            gap-1.5
            rounded-lg
            border
            border-slate-200
            bg-slate-50
            hover:bg-slate-100
            py-1.5
            px-3
            text-xs
            font-semibold
            text-slate-700
            transition-colors
            cursor-pointer
            dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-200
          "
        >
          <Upload className="h-3.5 w-3.5 text-slate-500 dark:text-neutral-400" />
          {file ? "Remplacer..." : "Importer"}
        </button>
      </div>
    </div>
  )
}

export default FileUploadCard