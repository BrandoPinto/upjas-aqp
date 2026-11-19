const GRADIENT = "linear-gradient(135deg, #1a4270 0%, #2d69a3 40%, #2d69a3 70%, #54aeb6 100%)";

const Decoraciones = () => (
  <>
    <div
      className="absolute right-[-10%] top-[-30%] h-48 w-48 rounded-full opacity-20 pointer-events-none"
      style={{ background: "radial-gradient(circle, #54aeb6 0%, transparent 70%)" }}
    />
    <div
      className="absolute bottom-[-10%] left-[-5%] h-32 w-32 rounded-full opacity-15 pointer-events-none"
      style={{ background: "radial-gradient(circle, #2d69a3 0%, transparent 70%)" }}
    />
  </>
);

export default function OverlayToggle({ isRegister, onSwitch }) {
  return (
    <>
      {/* ── MÓVIL: tarjeta simple al fondo del formulario ─────────── */}
      <div className="md:hidden w-full px-4 pt-2 pb-4">
        <div
          className="relative overflow-hidden w-full flex min-h-[130px] flex-col items-center justify-center gap-3 rounded-[24px] px-6 py-5 text-center text-white shadow-xl"
          style={{ background: GRADIENT }}
        >
          <Decoraciones />
          <div className="relative z-10 flex flex-col items-center gap-2">
            <h2 className="font-marca text-xl font-bold tracking-tight">¡Hola!</h2>
            <p className="text-sm text-white/80">
              {isRegister ? "¿Ya tiene cuenta?" : "¿No tiene cuenta?"}
            </p>
            <button
              type="button"
              onClick={() => onSwitch(isRegister ? "login" : "register")}
              className="mt-1 rounded-full border-2 border-white/60 px-7 py-2 text-sm font-semibold text-white transition-all duration-300 hover:bg-white/15 active:scale-95"
            >
              {isRegister ? "Iniciar sesión" : "Registrarse"}
            </button>
          </div>
        </div>
      </div>

      {/* ── DESKTOP: panel deslizante absoluto ────────────────────── */}
      <div className="hidden md:block pointer-events-none absolute inset-0 z-[5] overflow-hidden rounded-[28px]">
        <div
          className="pointer-events-auto absolute left-0 top-0 bottom-0 w-1/2 flex flex-col items-center justify-center gap-3 px-8 text-center text-white shadow-2xl transition-transform duration-700 ease-in-out"
          style={{
            background: GRADIENT,
            /*
             * El panel ocupa la mitad IZQUIERDA (left:0, width:50%).
             * Login  → debe verse a la DERECHA → translateX(100%) lo desplaza su propio ancho
             * Registro → debe verse a la IZQUIERDA → translateX(0)
             */
            transform: isRegister ? "translateX(0%)" : "translateX(100%)",
            boxShadow: "8px 0 40px rgba(26,66,112,0.45)",
          }}
        >
          <Decoraciones />

          {/* Contenido con fade cruzado */}
          <div className="relative z-10 flex flex-col items-center gap-3">

            {/* Estado REGISTRO (visible cuando isRegister=true) */}
            <div
              className="flex flex-col items-center gap-3 transition-all duration-500 ease-in-out"
              style={{
                opacity:        isRegister ? 1 : 0,
                transform:      isRegister ? "translateY(0)" : "translateY(8px)",
                position:       isRegister ? "relative" : "absolute",
                pointerEvents:  isRegister ? "auto" : "none",
              }}
            >
              <h2 className="font-marca text-2xl font-bold tracking-tight">¡Hola!</h2>
              <p className="text-white/85">¿Ya tiene cuenta?</p>
              <button
                type="button"
                onClick={() => onSwitch("login")}
                className="rounded-full border-2 border-white/60 px-7 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-white/15 active:scale-95"
              >
                Iniciar sesión
              </button>
            </div>

            {/* Estado LOGIN (visible cuando isRegister=false) */}
            <div
              className="flex flex-col items-center gap-3 transition-all duration-500 ease-in-out"
              style={{
                opacity:        isRegister ? 0 : 1,
                transform:      isRegister ? "translateY(-8px)" : "translateY(0)",
                position:       isRegister ? "absolute" : "relative",
                pointerEvents:  isRegister ? "none" : "auto",
              }}
            >
              <h2 className="font-marca text-2xl font-bold tracking-tight">¡Hola!</h2>
              <p className="text-white/85">¿No tiene cuenta?</p>
              <button
                type="button"
                onClick={() => onSwitch("register")}
                className="rounded-full border-2 border-white/60 px-7 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-white/15 active:scale-95"
              >
                Registrarse
              </button>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
