import {
  Database,
  UserCircle,
} from "lucide-react"

function TitleBar() {
  return (
    <div
      className="
        flex h-12 shrink-0 items-center
        border-b border-[#aebdc7]
        bg-[#e8eef2]
      "
    >
      <div className="flex min-w-[270px] items-center px-5">
        <div>
          <div className="text-[16px] font-semibold tracking-wide text-[#294f6b]">
            DCP MANAGER
          </div>

          <div className="text-[10px] uppercase tracking-wider text-[#6b7d88]">
            Gestionnaire des états DCP
          </div>
        </div>
      </div>

      <div className="h-7 w-px bg-[#bdcbd3]" />

      <div className="flex items-center gap-2 px-5">
        <Database className="h-4 w-4 text-[#47728d]" />

        <span className="text-[12px] text-[#687983]">
          Base de données :
        </span>

        <span className="flex items-center gap-1.5 text-[12px] font-medium text-[#456273]">
          <span className="h-2 w-2 rounded-full bg-[#6c9d45]" />
          Connectée
        </span>
      </div>

      <div className="flex-1" />

      <div
        className="
          flex h-full items-center gap-2
          border-l border-[#bdcbd3]
          px-5
        "
      >
        <UserCircle className="h-5 w-5 text-[#47728d]" />

        <div>
          <div className="text-[11px] text-[#71818b]">
            Profil utilisateur
          </div>

          <div className="text-[12px] font-medium text-[#34576d]">
            Admin
          </div>
        </div>
      </div>
    </div>
  )
}

export default TitleBar