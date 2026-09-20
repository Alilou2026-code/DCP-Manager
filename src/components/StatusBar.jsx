export default function StatusBar() {
  return (
    <footer className="flex items-center justify-between px-4 py-1.5 bg-white text-slate-500 text-xs border-t border-slate-200 shrink-0 select-none">
      <div className="flex items-center gap-4">
        <span className="font-medium text-slate-700">DCP Manager</span>
        <span className="text-slate-300">|</span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          Base de données : OK
        </span>
      </div>
      <div className="flex items-center gap-4 text-slate-400">
        <span>Prêt</span>
        <span className="text-slate-300">|</span>
        <span className="font-medium text-slate-600">Version 1.0</span>
      </div>
    </footer>
  )
}