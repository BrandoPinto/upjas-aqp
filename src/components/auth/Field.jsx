import { useState } from "react";

export default function Field({
  id,
  label,
  type = "text",
  value = "",
  onChange,
  icon,
  right,
  error,
  autoComplete = "off",
  dark = false,
}) {
  const [focused, setFocused] = useState(false);
  const safeValue = value ?? "";
  const lifted = focused || safeValue.length > 0;

  const containerClass = dark
    ? "border-white/10 bg-white/[0.06] text-white focus-within:border-[#54aeb6]/45 focus-within:bg-white/[0.08]"
    : "border-slate-200 bg-slate-50 text-slate-800 focus-within:border-[#54aeb6]/50 focus-within:bg-white";

  const labelClass = dark
    ? lifted
      ? "text-[#54aeb6] text-[10px] top-1.5"
      : "text-[rgba(240,244,248,0.30)] text-sm top-1/2 -translate-y-1/2"
    : lifted
      ? "text-[#54aeb6] text-[10px] top-1.5"
      : "text-slate-400 text-sm top-1/2 -translate-y-1/2";

  const iconClass = dark
    ? focused
      ? "text-[#54aeb6]"
      : "text-[rgba(240,244,248,0.35)]"
    : focused
      ? "text-[#54aeb6]"
      : "text-slate-400";

  return (
    <div className="w-full">
      <div
        className={`relative flex w-full items-center rounded-2xl border px-4 transition-all duration-200 ${containerClass} ${error ? "!border-[#d74468]/50" : ""}`}
        style={dark ? { backdropFilter: "blur(20px)" } : undefined}
      >
        <span className={`flex-shrink-0 transition-colors duration-200 ${iconClass}`}>
          {icon}
        </span>

        <div className="relative ml-3 flex-1">
          <label
            htmlFor={id}
            className={`pointer-events-none absolute left-0 font-medium transition-all duration-200 ${labelClass}`}
          >
            {label}
          </label>

          <input
            id={id}
            type={type}
            value={safeValue}
            onChange={onChange}
            autoComplete={autoComplete}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className={`w-full bg-transparent pb-1.5 pt-5 text-sm outline-none ${
              dark ? "text-[#f0f4f8] placeholder-transparent" : "text-slate-800 placeholder-transparent"
            }`}
          />
        </div>

        {right && (
          <span
            className={`ml-2 flex-shrink-0 cursor-pointer transition-colors duration-200 ${
              dark
                ? "text-[rgba(240,244,248,0.35)] hover:text-[rgba(240,244,248,0.70)]"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            {right}
          </span>
        )}
      </div>

      {error && (
        <p className="mt-1.5 ml-1 text-xs font-medium text-[#d74468]">
          {error}
        </p>
      )}
    </div>
  );
}
