import { Component } from "react";
import { mostrarToast } from "../../services/toast";

// Si algo falla al dibujar una pantalla, se muestra un mensaje con opción de reintentar
// en vez de dejar la app en blanco. Un error en una pestaña no tumba el resto de la app.
//   resetKey: cuando cambia (por ejemplo, al cambiar de pestaña) se vuelve a intentar solo.
//   pantallaCompleta: para la red de seguridad general de toda la aplicación.
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Error al dibujar la pantalla:", error, info?.componentStack);
    mostrarToast("Hubo un problema en esta sección. Puedes reintentar.");
  }

  componentDidUpdate(prev) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  reintentar = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;

    if (this.props.pantallaCompleta) {
      return (
        <div className="flex min-h-screen items-center justify-center px-6" style={{ background: "var(--bg-base)" }}>
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl">
            <p className="mb-1 text-lg font-bold text-slate-800">Algo salió mal</p>
            <p className="mb-5 text-sm text-slate-500">
              La aplicación tuvo un problema inesperado. Recárgala para continuar; tus datos no se perdieron.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full rounded-2xl py-3 text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, #1a4270, #2d69a3)" }}
            >
              Recargar
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="px-4 pt-10">
        <div className="rounded-3xl border border-red-100 bg-white p-6 text-center shadow-sm">
          <p className="mb-1 text-base font-bold text-slate-800">Esta sección tuvo un problema</p>
          <p className="mb-4 text-sm text-slate-500">Puedes reintentar o cambiar de pestaña.</p>
          <button
            onClick={this.reintentar}
            className="rounded-2xl bg-slate-800 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }
}
