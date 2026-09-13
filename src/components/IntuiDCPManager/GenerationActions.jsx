import {
  FileCheck2,
  PackageCheck,
} from "lucide-react"

function GenerationActions({
  canGenerateStock,
  onGenerateVentes,
  onGenerateStock,
}) {
  return (
    <div className="border-t border-[#c7d0d5] bg-[#eef2f4] p-4">
      <div className="mb-3">
        <span className="text-[12px] font-semibold text-[#465861]">
          Génération des états DCP
        </span>

        <p className="mt-1 text-[11px] text-[#7a878e]">
          Les prérequis sont vérifiés au lancement du traitement.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onGenerateVentes}
          className="
            flex
            h-9
            items-center
            gap-2
            border
            border-[#3e6f8c]
            bg-[#477c9b]
            px-4
            text-[12px]
            font-medium
            text-white
            transition-colors
            hover:bg-[#386b87]
          "
        >
          <FileCheck2 className="h-4 w-4" />
          Générer l'État de ventes DCP
        </button>

        <button
          type="button"
          disabled={!canGenerateStock}
          onClick={onGenerateStock}
          className="
            flex
            h-9
            items-center
            gap-2
            border
            border-[#547b55]
            bg-[#638d62]
            px-4
            text-[12px]
            font-medium
            text-white
            transition-colors
            hover:bg-[#537a52]
            disabled:cursor-not-allowed
            disabled:border-[#b8c1c6]
            disabled:bg-[#d9dee1]
            disabled:text-[#8a9499]
          "
        >
          <PackageCheck className="h-4 w-4" />
          Générer l'État de stock DCP
        </button>
      </div>
    </div>
  )
}

export default GenerationActions