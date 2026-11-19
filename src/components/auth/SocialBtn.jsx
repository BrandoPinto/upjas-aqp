export default function SocialBtn({ icon, label, onClick, dark = false }) {
  const base = dark
    ? "border-white/15 bg-white/8 text-white/60 hover:bg-white/15 hover:border-white/30 hover:text-white"
    : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700";

  return (
    <button
      onClick={onClick}
      type="button"
      className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition-all duration-200 active:scale-[0.97] ${base}`}
      style={dark ? { backdropFilter: "blur(16px)" } : undefined}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}