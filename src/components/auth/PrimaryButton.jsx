const SPINNER = (
  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
    />
  </svg>
);

export default function PrimaryButton({ loading, label, loadingText, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      type="button"
      className="group relative w-full overflow-hidden rounded-2xl py-3.5 text-sm font-bold text-white transition-transform active:scale-[0.98] disabled:opacity-60"
      style={{
        background: "linear-gradient(135deg,#54aeb6,#2d69a3)",
        boxShadow: "0 6px 24px rgba(45,105,163,.45), inset 0 1px 0 rgba(255,255,255,.2)",
      }}
    >
      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      <span className="relative flex items-center justify-center gap-2">
        {loading ? (
          <>
            {SPINNER}
            {loadingText}
          </>
        ) : (
          <>
            {label}
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </>
        )}
      </span>
    </button>
  );
}