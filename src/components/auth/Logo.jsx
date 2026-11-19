export default function IrtLogo({ size = 64 }) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <div
        className="absolute inset-0 rounded-full opacity-40"
        style={{
          background: "radial-gradient(circle, #54aeb6 0%, transparent 70%)",
          filter: "blur(8px)",
        }}
      />

      <div
        className="absolute inset-0 rounded-full"
        style={{
          padding: 2,
          background: "conic-gradient(from 0deg, #54aeb6, #2d69a3, #1a4270, #54aeb6)",
          animation: "spinRing 8s linear infinite",
        }}
      >
        <div className="h-full w-full rounded-full" style={{ background: "#0d1b2e" }} />
      </div>

      <div
        className="relative flex h-3/4 w-3/4 items-center justify-center rounded-full"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
      >
        <svg viewBox="0 0 32 32" width={size * 0.45} height={size * 0.45} fill="none">
          <circle
            cx="16"
            cy="16"
            r="8"
            stroke="url(#lg1)"
            strokeWidth="3.5"
            fill="none"
            strokeLinecap="round"
            strokeDasharray="34 16"
            strokeDashoffset="-4"
          />
          <circle cx="16" cy="16" r="3.5" fill="white" opacity="0.95" />
          <defs>
            <linearGradient id="lg1" x1="6" y1="6" x2="26" y2="26" gradientUnits="userSpaceOnUse">
              <stop stopColor="#54aeb6" />
              <stop offset="1" stopColor="#2d69a3" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}
