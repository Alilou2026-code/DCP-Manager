import { useState } from "react"
import {
  ChevronDown,
  FilePlus2,
  FolderOpen,
  X,
  Settings,
  HelpCircle,
  Info,
} from "lucide-react"

const menus = {
  Fichier: [
    { label: "Nouveau traitement", icon: FilePlus2 },
    { label: "Ouvrir un traitement", icon: FolderOpen },
    { label: "Fermer", icon: X },
  ],

  Traitements: [
    { label: "IntuiDCP Manager" },
    { label: "État de ventes DCP" },
    { label: "État de stock DCP" },
  ],

  Paramètres: [
    { label: "Base de données", icon: Settings },
    { label: "Utilisateurs" },
    { label: "Préférences" },
  ],

  Aide: [
    { label: "Aide DCP Manager", icon: HelpCircle },
    { label: "À propos de DCP Manager", icon: Info },
  ],
}

function MenuBar() {
  const [openMenu, setOpenMenu] = useState(null)

  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu)
  }

  return (
    <header
      className="
        relative z-50 flex h-9 shrink-0 items-center
        border-b border-[#284c68]
        bg-[#315f80]
        text-white
      "
    >
      <div
        className="
          flex h-full min-w-[180px] items-center
          border-r border-[#477493]
          bg-[#284f6b]
          px-4
        "
      >
        <span className="text-[13px] font-semibold tracking-wide text-white">
          DCP MANAGER
        </span>
      </div>

      <nav className="flex h-full items-center">
        {Object.entries(menus).map(([menu, items]) => (
          <div
            key={menu}
            className="relative h-full"
          >
            <button
              type="button"
              onClick={() => toggleMenu(menu)}
              className={`
                flex h-full items-center gap-1 border-r
                border-[#477493] px-4 text-[13px]
                transition-colors
                ${
                  openMenu === menu
                    ? "bg-white text-[#294f6b]"
                    : "text-white hover:bg-[#3f7295]"
                }
              `}
            >
              <span>{menu}</span>

              <ChevronDown
                className={`
                  h-3.5 w-3.5 transition-transform
                  ${openMenu === menu ? "rotate-180" : ""}
                `}
              />
            </button>

            {openMenu === menu && (
              <div
                className="
                  absolute left-0 top-9 min-w-[245px]
                  overflow-hidden rounded-b-md
                  border border-[#b9c7d0]
                  bg-white py-1
                  text-[#303f49]
                  shadow-[0_5px_15px_rgba(0,0,0,0.22)]
                "
              >
                {items.map((item) => {
                  const Icon = item.icon

                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => setOpenMenu(null)}
                      className="
                        flex w-full items-center gap-3
                        px-3 py-2 text-left text-[13px]
                        text-[#35444e]
                        transition-colors
                        hover:bg-[#e7f0f6]
                        hover:text-[#245a7d]
                      "
                    >
                      <span className="flex w-5 justify-center">
                        {Icon && (
                          <Icon className="h-4 w-4 text-[#52758b]" />
                        )}
                      </span>

                      <span>{item.label}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="flex-1" />
    </header>
  )
}

export default MenuBar