import { CheckCircle2, AlertCircle, HelpCircle, X } from "lucide-react"

export default function CustomDialog({
  isOpen,
  type = "success", // "success" | "error" | "confirm" | "info"
  title,
  message,
  details = [], // Tableau optionnel pour afficher des lignes de stats (ex: Clients ajoutés: 0)
  onConfirm,
  onClose,
  confirmText = "OK",
  cancelText = "Annuler",
}) {
  if (!isOpen) return null

  const config = {
    success: {
      icon: CheckCircle2,
      iconColor: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/40",
      borderColor: "border-emerald-100 dark:border-emerald-900/40",
      buttonColor: "bg-emerald-600 hover:bg-emerald-700 text-white",
    },
    error: {
      icon: AlertCircle,
      iconColor: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-50 dark:bg-red-950/40",
      borderColor: "border-red-100 dark:border-red-900/40",
      buttonColor: "bg-red-600 hover:bg-red-700 text-white",
    },
    confirm: {
      icon: HelpCircle,
      iconColor: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/40",
      borderColor: "border-blue-100 dark:border-blue-900/40",
      buttonColor: "bg-blue-600 hover:bg-blue-700 text-white",
    },
    info: {
      icon: HelpCircle,
      iconColor: "text-slate-600 dark:text-neutral-300",
      bgColor: "bg-slate-50 dark:bg-neutral-800/60",
      borderColor: "border-slate-100 dark:border-neutral-800",
      buttonColor: "bg-slate-900 hover:bg-slate-800 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-white",
    },
  }

  const current = config[type] || config.info
  const IconComponent = current.icon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl scale-in-95 animate-in duration-200 dark:border-neutral-800 dark:bg-neutral-900">
        
        {/* En-tête */}
        <div className="flex items-start gap-4">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${current.bgColor} ${current.borderColor}`}>
            <IconComponent className={`h-5 w-5 ${current.iconColor}`} />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-slate-900 leading-snug dark:text-neutral-100">
              {title}
            </h3>
            <p className="mt-1 text-xs text-slate-600 leading-relaxed dark:text-neutral-300">
              {message}
            </p>

            {/* Affichage des détails / statistiques si présents */}
            {details.length > 0 && (
              <div className="mt-3 space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100 dark:bg-neutral-800/60 dark:border-neutral-800">
                {details.map((item, index) => (
                  <div key={index} className="flex justify-between text-xs">
                    <span className="text-slate-500 dark:text-neutral-400">{item.label} :</span>
                    <span className="font-semibold text-slate-800 dark:text-neutral-100">{item.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Boutons */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-neutral-800">
          {type === "confirm" && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
            >
              {cancelText}
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (onConfirm) onConfirm()
              onClose()
            }}
            className={`w-full rounded-xl px-4 py-2 text-xs font-semibold shadow-sm transition-colors cursor-pointer ${current.buttonColor}`}
          >
            {confirmText}
          </button>
        </div>

      </div>
    </div>
  )
}