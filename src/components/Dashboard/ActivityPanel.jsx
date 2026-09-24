import { 
  Home, 
  BarChart3, 
  FileSpreadsheet, 
  Settings, 
  ShieldCheck, 
  Clock, 
  ArrowRight, 
  Database,
  Layers,
  HelpCircle
} from "lucide-react"

export default function ActivityPanel({ onNavigate }) {
  const dateJour = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="w-full min-h-[600px] bg-slate-100 dark:bg-neutral-950 p-6 overflow-y-auto space-y-6">
      
      {/* BANDEAU DE BIENVENUE */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 dark:from-emerald-700 dark:to-teal-800 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">
            Bienvenue dans DCP Manager
          </h1>
          <p className="text-blue-100 text-sm max-w-xl">
            Gestionnaire centralisé des flux, des stocks et de la volumétrie Sage.
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/10 text-right shrink-0">
          <div className="text-xs text-blue-200 font-medium flex items-center gap-1.5 justify-end">
            <Clock className="w-3.5 h-3.5" /> Session active
          </div>
          <div className="text-sm font-semibold capitalize mt-0.5">
            {dateJour}
          </div>
        </div>
      </div>

      {/* RACCOURCIS PRINCIPAUX */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-800 dark:text-neutral-100 uppercase tracking-wider px-1">
          Accès Rapides & Modules Principaux
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* CARTE INTUIDCP */}
          <div 
            onClick={() => onNavigate && onNavigate("intui")} 
            className="group bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 cursor-pointer hover:border-emerald-500 transition-all dark:bg-neutral-900 dark:border-neutral-800"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-neutral-100">IntuiDCP Manager</h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 leading-relaxed">
                  Gérez et consultez les lignes détaillées des états et imports.
                </p>
              </div>
            </div>
          </div>

          {/* CARTE TABLEAU DE BORD */}
          <div 
            onClick={() => onNavigate && onNavigate("tableau")} 
            className="group bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 cursor-pointer hover:border-emerald-500 transition-all dark:bg-neutral-900 dark:border-neutral-800"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-neutral-100">Tableau de bord & Stats</h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 leading-relaxed">
                  Visualisez la vue consolidée des flux et des volumes de stock.
                </p>
              </div>
            </div>
          </div>

          {/* CARTE PARAMÈTRES */}
          <div 
            onClick={() => onNavigate && onNavigate("parametres")} 
            className="group bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 cursor-pointer hover:border-emerald-500 transition-all dark:bg-neutral-900 dark:border-neutral-800"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-neutral-100">Paramètres & Base</h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 leading-relaxed">
                  Configurez les préférences de l'application et la base SQLite.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  )
}
