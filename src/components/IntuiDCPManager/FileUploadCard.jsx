import { useRef } from "react"
import {
  FileText,
  FileSpreadsheet,
  Upload,
  X,
} from "lucide-react"

function FileUploadCard({
  title,
  description,
  required = false,
  accept,
  file,
  onFileChange,
}) {
  const inputRef = useRef(null)

  const handleSelect = (event) => {
    const selectedFile = event.target.files?.[0]

    if (selectedFile) {
      onFileChange(selectedFile)
    }
  }

  const handleRemove = () => {
    onFileChange(null)

    if (inputRef.current) {
      inputRef.current.value = ""
    }
  }

  const isExcel = accept?.includes(".xlsx")

  const FileIcon = isExcel ? FileSpreadsheet : FileText

  return (
    <div
      className="
        flex
        min-h-[92px]
        items-center
        gap-4
        border
        border-[#c7d0d5]
        bg-white
        px-4
        py-3
      "
    >
      {/* Icône */}
      <div
        className="
          flex
          h-11
          w-11
          shrink-0
          items-center
          justify-center
          rounded
          bg-[#e8eef2]
          text-[#4d7187]
        "
      >
        <FileIcon className="h-5 w-5" />
      </div>

      {/* Informations */}
      <div className="min-w-0 flex-1">

        <div className="flex items-center gap-2">

          <span className="text-[13px] font-semibold text-[#35434b]">
            {title}
          </span>

          {required && (
            <span className="text-[11px] font-medium text-[#a24d4d]">
              Obligatoire
            </span>
          )}

          {!required && (
            <span className="text-[11px] text-[#78858c]">
              Facultatif
            </span>
          )}

        </div>

        {file ? (
          <div className="mt-1 flex items-center gap-2">

            <span
              className="
                max-w-[450px]
                truncate
                text-[12px]
                text-[#3f667c]
              "
              title={file.name}
            >
              {file.name}
            </span>

            <button
              type="button"
              onClick={handleRemove}
              title="Retirer le fichier"
              className="
                flex
                h-5
                w-5
                items-center
                justify-center
                rounded
                text-[#78858c]
                hover:bg-[#edf0f2]
                hover:text-[#a24d4d]
              "
            >
              <X className="h-3.5 w-3.5" />
            </button>

          </div>
        ) : (
          <p className="mt-1 text-[11px] text-[#7b878d]">
            {description}
          </p>
        )}

      </div>

      {/* Bouton sélectionner */}
      <div className="shrink-0">

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleSelect}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="
            flex
            h-8
            items-center
            gap-2
            border
            border-[#aebdc6]
            bg-[#f3f5f6]
            px-3
            text-[12px]
            font-medium
            text-[#405e70]
            hover:bg-[#e5edf2]
          "
        >
          <Upload className="h-3.5 w-3.5" />

          {file ? "Modifier" : "Importer"}
        </button>

      </div>

    </div>
  )
}

export default FileUploadCard