import {
  Database,
  UserCircle,
} from "lucide-react"

function TitleBar() {
  return (
    <div
      className="
        flex h-12 shrink-0 items-center
        border-b border-slate-200
        bg-white
        select-none
        dark:border-neutral-800 dark:bg-neutral-900
      "
    >
      <div className="flex min-w-[270px] items-center px-5">
        <div>
          <div className="text-[15px] font-bold tracking-wide text-slate-800 dark:text-neutral-100">
            DCP MANAGER
          </div>

          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium dark:text-neutral-500">
            Gestionnaire des états DCP
          </div>
        </div>
      </div>

      <div className="h-6 w-px bg-slate-200 dark:bg-neutral-800" />

      <div className="flex items-center gap-2 px-5">
        <Database className="h-4 w-4 text-slate-400 dark:text-neutral-500" />

        <span className="text-[12px] text-slate-500 dark:text-neutral-400">
          Base de données :
        </span>

        <span className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-700 dark:text-neutral-200">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Connectée
        </span>
      </div>

      <div className="flex-1" />

      <div
        className="
          flex h-full items-center gap-2.5
          border-l border-slate-200
          px-5
          bg-slate-50/50
          dark:border-neutral-800 dark:bg-neutral-800/50
        "
      >
        <UserCircle className="h-5 w-5 text-slate-400" />

        <div>
          <div className="text-[10px] text-slate-400 uppercase tracking-wider dark:text-neutral-500">
            Profil utilisateur
          </div>

          <div className="text-[12px] font-semibold text-slate-700 dark:text-neutral-200">
            Admin
          </div>
        </div>
      </div>
    </div>
  )
}

export default TitleBar