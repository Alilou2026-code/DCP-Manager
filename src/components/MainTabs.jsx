import IntuiDCPManager from "@/components/IntuiDCPManager/IntuiDCPManager"
import Dashboard from "@/components/Dashboard/Dashboard"
import ActivityPanel from "@/components/Dashboard/ActivityPanel"
import {
  Home,
  FileText,
  BarChart3,
} from "lucide-react"

function ActivityContent({ onNavigate }) {
  return <ActivityPanel onNavigate={onNavigate} />
}

function IntuiDCPContent() {
  return <IntuiDCPManager />
}

function DashboardContent() {
  return <Dashboard />
}

function MainTabs({
  activeTab,
  onChange,
  onNavigate,
}) {
  const tabs = [
    {
      id: "accueil",
      label: "Accueil",
      icon: Home,
    },
    {
      id: "intui",
      label: "IntuiDCP Manager",
      icon: FileText,
    },
    {
      id: "tableau",
      label: "Tableau de bord",
      icon: BarChart3,
    },
  ]

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white dark:bg-neutral-900">

      {/* Barre des onglets */}
      <div
        className="
          flex h-10 shrink-0 items-end
          border-b border-slate-200
          bg-white
          px-2
          dark:border-neutral-800 dark:bg-neutral-900
        "
      >
        {tabs.map((tab) => {
          const Icon = tab.icon
          const active = activeTab === tab.id

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`
                flex h-9 items-center gap-2
                border-x border-t px-5
                text-[12px] font-medium
                transition-colors cursor-pointer rounded-t-lg
                ${
                  active
                    ? `
                      relative -mb-px
                      border-slate-200
                      bg-white
                      font-semibold
                      text-blue-600
                      shadow-xs
                      dark:border-neutral-800
                      dark:bg-neutral-900
                      dark:text-blue-400
                    `
                    : `
                      border-transparent
                      bg-slate-50/50
                      text-slate-500
                      hover:bg-slate-100
                      hover:text-slate-800
                      dark:bg-neutral-800/40
                      dark:text-neutral-400
                      dark:hover:bg-neutral-800
                      dark:hover:text-neutral-100
                    `
                }
              `}
            >
              <Icon className={`h-4 w-4 ${active ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-neutral-500"}`} />

              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Contenu de la page active */}
      <div className="min-h-0 flex-1 bg-white dark:bg-neutral-900">
        {activeTab === "accueil" && (
          <ActivityContent onNavigate={onNavigate} />
        )}

        {activeTab === "intui" && (
          <IntuiDCPContent />
        )}

        {(activeTab === "dashboard" || activeTab === "tableau") && (
          <DashboardContent />
        )}
      </div>

    </div>
  )
}

export default MainTabs