
import IntuiDCPManager from "@/components/IntuiDCPManager/IntuiDCPManager"
import {
  FileText,
  BarChart3,
} from "lucide-react"

function IntuiDCPContent() {
  return <IntuiDCPManager />
}

function DashboardContent() {
  return (
    <section className="flex h-full flex-col bg-[#f3f6f8]">

      <div className="border-b border-[#c8d3da] bg-white px-6 py-4">
        <h1 className="text-[18px] font-semibold text-[#294f6b]">
          Tableau de bord
        </h1>

        <p className="mt-1 text-[12px] text-[#71818b]">
          Vue synthétique de l'activité DCP
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center p-8">
        <div
          className="
            w-full max-w-[900px]
            border border-[#c7d2d9]
            bg-white
            shadow-[0_1px_4px_rgba(39,65,80,0.10)]
          "
        >
          <div
            className="
              flex h-10 items-center
              border-b border-[#c7d2d9]
              bg-[#e2ebf0]
              px-4
            "
          >
            <BarChart3 className="mr-2 h-4 w-4 text-[#3e6d89]" />

            <span className="text-[12px] font-semibold text-[#38596b]">
              Tableau de bord
            </span>
          </div>

          <div className="p-6">
            <p className="text-[13px] text-[#5e707c]">
              Les indicateurs et graphiques seront intégrés ici.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

function MainTabs({
  activeTab,
  onChange,
}) {
  const tabs = [
    {
      id: "intui",
      label: "IntuiDCP Manager",
      icon: FileText,
    },
    {
      id: "dashboard",
      label: "Tableau de bord",
      icon: BarChart3,
    },
  ]

  return (
    <div className="flex min-h-0 flex-1 flex-col">

      <div
        className="
          flex h-10 shrink-0 items-end
          border-b border-[#aebdc7]
          bg-[#dce5ea]
          px-2
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
                text-[12px]
                transition-colors
                ${
                  active
                    ? `
                      relative -mb-px
                      border-[#aebdc7]
                      bg-[#f3f6f8]
                      font-semibold
                      text-[#245c80]
                    `
                    : `
                      border-transparent
                      bg-transparent
                      text-[#60727e]
                      hover:bg-[#cedce4]
                      hover:text-[#285b79]
                    `
                }
              `}
            >
              <Icon className="h-4 w-4" />

              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      <div className="min-h-0 flex-1">
        {activeTab === "intui" && (
          <IntuiDCPContent />
        )}

        {activeTab === "dashboard" && (
          <DashboardContent />
        )}
      </div>

    </div>
  )
}

export default MainTabs