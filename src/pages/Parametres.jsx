import { useState } from "react"
import { Settings, Sun, Moon, MonitorSmartphone, Check } from "lucide-react"

import { getStoredTheme, setTheme } from "@/lib/theme"

const themeChoices = [
  {
    id: "light",
    label: "Clair",
    description: "Fond clair, thème actuel de l'application.",
    icon: Sun,
  },
  {
    id: "dark",
    label: "Sombre",
    description: "Fond gris foncé, plus reposant en faible luminosité.",
    icon: Moon,
  },
  {
    id: "system",
    label: "Automatique",
    description: "Suit le thème choisi dans Windows.",
    icon: MonitorSmartphone,
  },
]

export default function Parametres() {
  const [theme, setThemeState] = useState(() => getStoredTheme())

  const handleSelect = (id) => {
    setTheme(id)
    setThemeState(id)
  }

  return (
    <div className="w-full min-h-[600px] bg-slate-100 dark:bg-neutral-950 p-6 overflow-y-auto space-y-6">

      {/* En-tête */}
      <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 px-6 py-4 flex items-center gap-4 shadow-sm rounded-2xl">
        <div className="p-3 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 rounded-xl">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-neutral-100">
            Paramètres
          </h1>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
            Préférences de l'application DCP Manager
          </p>
        </div>
      </div>

      {/* Apparence */}
      <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-5 shadow-sm space-y-4 max-w-2xl">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
            Apparence
          </h2>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
            Choisissez le thème de l'interface.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {themeChoices.map((choice) => {
            const Icon = choice.icon
            const active = theme === choice.id

            return (
              <button
                key={choice.id}
                type="button"
                onClick={() => handleSelect(choice.id)}
                className={`relative flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-colors cursor-pointer ${
                  active
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-600"
                    : "border-slate-200 dark:border-neutral-700 hover:border-slate-300 dark:hover:border-neutral-600"
                }`}
              >
                {active && (
                  <span className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white">
                    <Check className="h-3 w-3" />
                  </span>
                )}

                <Icon
                  className={`w-5 h-5 ${
                    active
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-slate-400 dark:text-neutral-500"
                  }`}
                />

                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-neutral-100">
                    {choice.label}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                    {choice.description}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Aperçu des prochains réglages */}
      <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-5 shadow-sm max-w-2xl">
        <h2 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
          D'autres réglages arrivent bientôt
        </h2>
        <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 leading-relaxed">
          Semestre par défaut, dossier d'export, sauvegarde de la base de
          données et informations de la société.
        </p>
      </div>

    </div>
  )
}
