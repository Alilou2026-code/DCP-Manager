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
        border-b border-slate-200
        bg-white
        text-slate-700
        select-none
        dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300
      "
    >
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
                border-slate-200 px-4 text-[13px] font-medium
                transition-colors cursor-pointer
                ${
                  openMenu === menu
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
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
                  overflow-hidden rounded-lg
                  border border-slate-200
                  bg-white py-1.5
                  text-slate-700
                  shadow-lg
                  dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300
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
                        text-slate-600
                        transition-colors cursor-pointer
                        hover:bg-blue-50
                        hover:text-blue-600
                        dark:text-neutral-300 dark:hover:bg-blue-950/40 dark:hover:text-blue-400
                      "
                    >
                      <span className="flex w-5 justify-center">
                        {Icon && (
                          <Icon className="h-4 w-4 text-slate-400 dark:text-neutral-500" />
                        )}
                      </span>

                      <span className="font-medium">{item.label}</span>
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