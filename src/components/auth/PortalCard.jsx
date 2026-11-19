export default function PortalCard({ icon, title, subtitle, onClick, dark }) {
  const base = dark
    ? "border-white/12 bg-white/5 hover:bg-white/10 hover:border-white/25"
    : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/50";

  return (
    <button
      onClick={onClick}
      type="button"
      className={`group flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all duration-200 active:scale-[0.98] ${base}`}
      style={dark ? { backdropFilter: "blur(20px)" } : undefined}
    >
      <div
        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-all duration-200 ${
          dark
            ? "border border-blue-400/25 bg-blue-500/15 text-blue-300 group-hover:bg-blue-500/25"
            : "border border-blue-200 bg-blue-100 text-blue-600 group-hover:bg-blue-200"
        }`}
      >
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className={`text-sm font-semibold ${dark ? "text-white" : "text-slate-800"}`}>
          {title}
        </p>
        <p className={`mt-0.5 text-xs ${dark ? "text-white/35" : "text-slate-400"}`}>
          {subtitle}
        </p>
      </div>

      <span
        className={`transition-all duration-200 group-hover:translate-x-0.5 ${
          dark ? "text-white/25 group-hover:text-white/60" : "text-slate-300 group-hover:text-blue-400"
        }`}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </span>
    </button>
  );
}