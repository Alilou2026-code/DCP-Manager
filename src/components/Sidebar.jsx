import {
  Menu,
  Home,
  FileText,
  BarChart3,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

function Sidebar({
  collapsed,
  onToggle,
  activeTab,
  onSelect,
}) {
  const items = [
    {
      id: "home",
      label: "Accueil",
      icon: Home,
    },
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
    <aside
      className={`
        flex shrink-0 flex-col
        border-r border-[#b9c8d1]
        bg-[#dfe8ed]
        transition-all duration-200
        ${collapsed ? "w-[54px]" : "w-[220px]"}
      `}
    >
      <div
        className="
          flex h-11 shrink-0 items-center
          border-b border-[#c0cdd5]
          bg-[#d5e1e8]
        "
      >
        <button
          type="button"
          onClick={onToggle}
          title={collapsed ? "Développer le volet" : "Réduire le volet"}
          className="
            flex h-full w-[54px] shrink-0
            items-center justify-center
            text-[#42677e]
            hover:bg-[#c8d8e2]
          "
        >
          <Menu className="h-5 w-5" />
        </button>

        {!collapsed && (
          <>
            <span className="flex-1 text-[12px] font-semibold uppercase tracking-wide text-[#4c6878]">
              Navigation
            </span>

            <button
              type="button"
              onClick={onToggle}
              title="Réduire le volet"
              className="
                mr-2 flex h-7 w-7 items-center
                justify-center rounded
                text-[#527386]
                hover:bg-[#c8d8e2]
              "
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </>
        )}

        {collapsed && (
          <div className="flex flex-1 justify-center">
            <ChevronRight className="h-4 w-4 text-[#527386]" />
          </div>
        )}
      </div>

      <nav className="flex flex-1 flex-col py-2">
        {items.map((item) => {
          const Icon = item.icon
          const selected =
            activeTab === item.id ||
            (item.id === "home" && activeTab === "home")

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              title={collapsed ? item.label : undefined}
              className={`
                mx-2 mb-1 flex h-10
                items-center rounded-sm
                transition-colors
                ${collapsed ? "justify-center" : "gap-3 px-3"}
                ${
                  selected
                    ? `
                      bg-[#ffffff]
                      text-[#245c80]
                      shadow-[inset_4px_0_0_#3d7192]
                    `
                    : `
                      text-[#4c626f]
                      hover:bg-[#cfdee6]
                      hover:text-[#285b79]
                    `
                }
              `}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />

              {!collapsed && (
                <span className="text-[12px] font-medium">
                  {item.label}
                </span>
              )}
            </button>
          )
        })}

        <div className="my-3 border-t border-[#c1cdd4]" />

        <button
          type="button"
          title={collapsed ? "Paramètres" : undefined}
          className={`
            mx-2 flex h-10
            items-center rounded-sm
            text-[#4c626f]
            hover:bg-[#cfdee6]
            hover:text-[#285b79]
            ${collapsed ? "justify-center" : "gap-3 px-3"}
          `}
        >
          <Settings className="h-[18px] w-[18px] shrink-0" />

          {!collapsed && (
            <span className="text-[12px] font-medium">
              Paramètres
            </span>
          )}
        </button>

        <button
          type="button"
          title={collapsed ? "Aide" : undefined}
          className={`
            mx-2 mt-1 flex h-10
            items-center rounded-sm
            text-[#4c626f]
            hover:bg-[#cfdee6]
            hover:text-[#285b79]
            ${collapsed ? "justify-center" : "gap-3 px-3"}
          `}
        >
          <HelpCircle className="h-[18px] w-[18px] shrink-0" />

          {!collapsed && (
            <span className="text-[12px] font-medium">
              Aide
            </span>
          )}
        </button>
      </nav>
    </aside>
  )
}

export default Sidebar