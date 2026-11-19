export default function Divider({ text }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-slate-200" />
      <span className="text-xs text-slate-400">{text}</span>
      <div className="h-px flex-1 bg-slate-200" />
    </div>
  );
}