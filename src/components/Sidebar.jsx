import {
  Home,
  FileSpreadsheet,
  LayoutDashboard,
  Settings,
  HelpCircle,
  ChevronLeft,
} from "lucide-react"

export default function Sidebar({ activeTab, setActiveTab, isCollapsed, toggleCollapse }) {
  const menuItems = [
    { id: "accueil", label: "Accueil", icon: Home, color: "text-amber-500 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/40" },
    { id: "intui", label: "IntuiDCP Manager", icon: FileSpreadsheet, color: "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/40" },
    { id: "tableau", label: "Tableau de bord", icon: LayoutDashboard, color: "text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-950/40" },
  ]

  const bottomItems = [
    { id: "parametres", label: "Paramètres", icon: Settings, color: "text-slate-600 bg-slate-100 dark:text-neutral-300 dark:bg-neutral-800" },
    { id: "aide", label: "Aide", icon: HelpCircle, color: "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/40" },
  ]

  return (
    <aside
      className={`relative flex flex-col bg-white border-r border-slate-200 dark:bg-neutral-900 dark:border-neutral-800 transition-all duration-300 ease-in-out ${
        isCollapsed ? "w-20" : "w-64"
      } shrink-0 select-none shadow-xs`}
    >
      {/* En-tête de la sidebar avec bouton de réduction fonctionnel */}
      <div className="p-4 border-b border-slate-100 dark:border-neutral-800 flex items-center justify-between min-h-[65px]">
        {!isCollapsed && (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="p-2 bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 rounded-xl shrink-0">
              <LayoutDashboard className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 truncate">
              Navigation
            </span>
          </div>
        )}
        <button
          onClick={toggleCollapse}
          type="button"
          className={`p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100 dark:hover:bg-neutral-700 transition-colors cursor-pointer ${
            isCollapsed ? "mx-auto" : "ml-auto"
          }`}
          title={isCollapsed ? "Agrandir le volet" : "Réduire le volet"}
        >
          <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Menu Principal */}
      <div className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto overflow-x-hidden">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <div
                className={`p-1.5 rounded-lg shrink-0 transition-colors ${
                  isActive ? "bg-white/20 text-white" : item.color
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </button>
          )
        })}
      </div>

      {/* Menu du bas (Paramètres, Aide) */}
      <div className="p-3 border-t border-slate-100 dark:border-neutral-800 space-y-1.5 overflow-x-hidden">
        {bottomItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <div
                className={`p-1.5 rounded-lg shrink-0 transition-colors ${
                  isActive ? "bg-white/20 text-white" : item.color
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </button>
          )
        })}
      </div>
    </aside>
  )
}