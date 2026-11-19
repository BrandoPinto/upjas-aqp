export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-3">
        <div
          className="h-10 w-10 rounded-full border-4 border-blue-100 border-t-blue-600"
          style={{ animation: "spin 0.8s linear infinite" }}
        />
        <p className="text-sm text-slate-400">Cargando...</p>
      </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}