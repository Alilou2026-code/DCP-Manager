function StatusBar() {
  return (
    <footer
      className="
        flex h-6 shrink-0 items-center
        border-t border-[#aebdc7]
        bg-[#d8e1e6]
        px-3
        text-[10px]
        text-[#5d707c]
      "
    >
      <span>
        DCP Manager
      </span>

      <span className="mx-3 text-[#94a5ae]">
        |
      </span>

      <span className="font-medium text-[#52725d]">
        Base de données : OK
      </span>

      <span className="mx-3 text-[#94a5ae]">
        |
      </span>

      <span>
        Prêt
      </span>

      <div className="flex-1" />

      <span>
        Version 1.0
      </span>
    </footer>
  )
}

export default StatusBar