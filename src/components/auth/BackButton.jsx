export default function BackButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      type="button"
      className="mb-5 flex items-center gap-2 text-sm text-[rgba(240,244,248,0.40)] transition-colors hover:text-[#f0f4f8]"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
      </svg>
      Volver
    </button>
  );
}
