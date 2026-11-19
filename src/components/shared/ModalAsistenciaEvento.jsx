import { useEffect, useState } from "react";
import { collection, query, where, getDocs, getDoc, doc } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";

function DownloadIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function calcularEdad(birthDate) {
  if (!birthDate) return null;
  const hoy = new Date();
  const [y, m, d] = birthDate.split("-").map(Number);
  const nac = new Date(y, m - 1, d);
  let edad = hoy.getFullYear() - nac.getFullYear();
  if (hoy < new Date(hoy.getFullYear(), nac.getMonth(), nac.getDate())) edad--;
  return edad;
}

function formatFechaNac(birthDate) {
  if (!birthDate) return "—";
  const [y, m, d] = birthDate.split("-");
  return `${d}/${m}/${y}`;
}

function formatHora(timestamp) {
  if (!timestamp?.toDate) return "—";
  return timestamp.toDate().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
}

// Timestamp de Firestore → milisegundos, para ordenar (sin fecha va al final)
function aMillis(timestamp) {
  return timestamp?.toMillis ? timestamp.toMillis() : Infinity;
}

export default function ModalAsistenciaEvento({ evento, onCerrar }) {
  const [asistentes, setAsistentes] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [generando, setGenerando]   = useState(null); // "confirmados-pdf" | "confirmados-excel" | "asistencia-pdf" | "asistencia-excel" | null

  useEffect(() => {
    const q = query(collection(db, "asistencias"), where("eventoId", "==", evento.id));
    getDocs(q)
      .then((snap) => setAsistentes(snap.docs.map((d) => d.data())))
      .catch((err) => console.error("Error cargando asistentes:", err))
      .finally(() => setLoading(false));
  }, [evento.id]);

  // Confirmaron vía app (botón de confirmar) — orden: primero en confirmar
  const listaConfirmados = asistentes
    .filter((a) => a.estado === "confirmado")
    .sort((a, b) => aMillis(a.fecha ?? a.confirmadoEn) - aMillis(b.fecha ?? b.confirmadoEn));
  // Asistencia real: fueron escaneados con QR y recibieron puntos — orden: primero en marcar
  const listaAsistieron = asistentes
    .filter((a) => !!a.confirmadoEn)
    .sort((a, b) => aMillis(a.confirmadoEn) - aMillis(b.confirmadoEn));

  const construirEncabezados = (incluirHora) => [
    "#",
    ...(incluirHora ? ["Hora"] : []),
    "Nombre", "Celular", "F. Nacimiento", "Miembro", "Edad", "Estaca", "Barrio",
  ];

  // Trae los perfiles y arma las filas de la tabla (compartido entre PDF y Excel)
  const armarFilas = async (lista, incluirHora) => {
    const perfiles = await Promise.all(
      lista.map((a) =>
        getDoc(doc(db, "users", a.uid))
          .then((snap) => (snap.exists() ? snap.data() : {}))
          .catch(() => ({}))
      )
    );
    return lista.map((a, i) => {
      const p    = perfiles[i] ?? {};
      const edad = calcularEdad(p.birthDate);
      const nombre = (`${p.name ?? ""} ${p.lastName ?? ""}`).trim() || a.nombre || "—";
      return [
        i + 1,
        ...(incluirHora ? [formatHora(a.confirmadoEn)] : []),
        nombre,
        p.phone       ?? "—",
        formatFechaNac(p.birthDate),
        p.relation === "miembro" ? "Sí" : "No",
        edad != null ? `${edad}` : "—",
        p.stateValue  ?? "—",
        p.parish      ?? "—",
      ];
    });
  };

  const generarPDF = async (lista, tipo) => {
    if (lista.length === 0) return;
    setGenerando(`${tipo}-pdf`);
    try {
      const incluirHora = tipo === "asistencia";
      const filas = await armarFilas(lista, incluirHora);

      const { jsPDF }             = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const pdf      = new jsPDF();
      const pageW    = pdf.internal.pageSize.getWidth();
      const titulo   = evento.titulo ?? "Evento";
      const fechaEvt = evento.fecha  ?? "—";

      const tituloReporte = tipo === "asistencia"
        ? "Reporte de Asistencia Real"
        : "Reporte de Confirmados";

      pdf.setFillColor(127, 29, 29);
      pdf.rect(0, 0, pageW, 30, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(14);
      pdf.setFont(undefined, "bold");
      pdf.text(tituloReporte, 14, 12);
      pdf.setFontSize(9);
      pdf.setFont(undefined, "normal");
      const tituloCorto = titulo.length > 65 ? titulo.substring(0, 62) + "..." : titulo;
      pdf.text(tituloCorto, 14, 22);
      pdf.text(`Fecha: ${fechaEvt}`, pageW - 14, 22, { align: "right" });

      pdf.setTextColor(60, 60, 60);
      pdf.setFontSize(10);
      pdf.setFont(undefined, "normal");
      pdf.text(
        `Confirmaron: ${listaConfirmados.length}   •   Asistencia real: ${listaAsistieron.length}   •   En este reporte: ${lista.length}`,
        14, 42
      );

      const columnStyles = incluirHora
        ? {
            0: { cellWidth: 8,  halign: "center" }, // #
            1: { cellWidth: 14, halign: "center" }, // Hora
            2: { cellWidth: 40 },                   // Nombre
            3: { cellWidth: 24 },                   // Celular
            4: { cellWidth: 20 },                   // F. Nacimiento
            5: { cellWidth: 16, halign: "center" }, // Miembro
            6: { cellWidth: 11, halign: "center" }, // Edad
          }
        : {
            0: { cellWidth: 8,  halign: "center" }, // #
            1: { cellWidth: 45 },                   // Nombre
            2: { cellWidth: 26 },                   // Celular
            3: { cellWidth: 22 },                   // F. Nacimiento
            4: { cellWidth: 17, halign: "center" }, // Miembro
            5: { cellWidth: 12, halign: "center" }, // Edad
          };

      autoTable(pdf, {
        startY: 48,
        head: [construirEncabezados(incluirHora)],
        body: filas,
        headStyles:         { fillColor: [127, 29, 29], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
        bodyStyles:         { fontSize: 8 },
        alternateRowStyles: { fillColor: [253, 245, 245] },
        columnStyles,
        margin: { left: 10, right: 10 },
      });

      const finalY = pdf.lastAutoTable.finalY + 8;
      pdf.setFontSize(9);
      pdf.setFont(undefined, "bold");
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Total: ${lista.length} personas`, 14, finalY);
      pdf.setFont(undefined, "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(160, 160, 160);
      const ahora = new Date().toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" });
      pdf.text(`Generado el ${ahora} · UP JAS AQP`, pageW - 14, finalY, { align: "right" });

      const slug   = titulo.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]/g, "-").substring(0, 30);
      const sufijo = tipo === "asistencia" ? "asistencia" : "confirmados";
      pdf.save(`${sufijo}-${slug}-${fechaEvt}.pdf`);
    } catch (err) {
      console.error("Error generando PDF:", err);
      alert("Error al generar el reporte. Intenta de nuevo.");
    } finally {
      setGenerando(null);
    }
  };

  const generarExcel = async (lista, tipo) => {
    if (lista.length === 0) return;
    setGenerando(`${tipo}-excel`);
    try {
      const incluirHora = tipo === "asistencia";
      const filas = await armarFilas(lista, incluirHora);
      const titulo   = evento.titulo ?? "Evento";
      const fechaEvt = evento.fecha  ?? "—";

      const XLSX = await import("xlsx");
      const hoja = XLSX.utils.aoa_to_sheet([construirEncabezados(incluirHora), ...filas]);
      hoja["!cols"] = incluirHora
        ? [{ wch: 4 }, { wch: 8 }, { wch: 28 }, { wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 8 }, { wch: 18 }, { wch: 18 }]
        : [{ wch: 4 }, { wch: 28 }, { wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 8 }, { wch: 18 }, { wch: 18 }];

      const libro = XLSX.utils.book_new();
      const nombreHoja = tipo === "asistencia" ? "Asistencia real" : "Confirmados";
      XLSX.utils.book_append_sheet(libro, hoja, nombreHoja);

      const slug   = titulo.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]/g, "-").substring(0, 30);
      const sufijo = tipo === "asistencia" ? "asistencia" : "confirmados";
      XLSX.writeFile(libro, `${sufijo}-${slug}-${fechaEvt}.xlsx`);
    } catch (err) {
      console.error("Error generando Excel:", err);
      alert("Error al generar el reporte. Intenta de nuevo.");
    } finally {
      setGenerando(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4">
      <div className="w-full sm:max-w-md bg-white sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col">

        <div className="flex justify-center pt-3 pb-1 sm:hidden flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-200" />
        </div>

        <div className="flex items-center justify-between px-5 pt-4 pb-3 flex-shrink-0 border-b border-slate-100">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Asistencia</p>
            <p className="font-bold text-slate-800 text-sm mt-0.5 truncate max-w-[240px]">{evento.titulo}</p>
          </div>
          <button
            onClick={onCerrar}
            className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 transition"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-7 w-7 animate-spin rounded-full border-4 border-slate-100 border-t-violet-500" />
          </div>
        ) : (
          <div className="px-5 py-5 flex flex-col gap-4">

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-violet-200 bg-violet-50 px-3 py-4 text-center">
                <p className="text-2xl font-bold text-violet-700">{listaConfirmados.length}</p>
                <p className="text-[10px] font-semibold text-slate-400 mt-1 uppercase tracking-wide">Confirmaron</p>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-4 text-center">
                <p className="text-2xl font-bold text-emerald-700">{listaAsistieron.length}</p>
                <p className="text-[10px] font-semibold text-slate-400 mt-1 uppercase tracking-wide">Asistencia</p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <p className="px-1 text-[11px] font-bold text-violet-700 uppercase tracking-wide">
                  Confirmados ({listaConfirmados.length})
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => generarPDF(listaConfirmados, "confirmados")}
                    disabled={generando !== null || listaConfirmados.length === 0}
                    className="flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold text-white transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: "linear-gradient(135deg,#4c1d95,#6d28d9)" }}
                  >
                    {generando === "confirmados-pdf" ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    ) : (
                      <>
                        <DownloadIcon />
                        PDF
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => generarExcel(listaConfirmados, "confirmados")}
                    disabled={generando !== null || listaConfirmados.length === 0}
                    className="flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold text-violet-700 border border-violet-300 bg-violet-50 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {generando === "confirmados-excel" ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-violet-300 border-t-violet-700" />
                    ) : (
                      <>
                        <DownloadIcon />
                        Excel
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <p className="px-1 text-[11px] font-bold text-emerald-700 uppercase tracking-wide">
                  Asistencia real ({listaAsistieron.length})
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => generarPDF(listaAsistieron, "asistencia")}
                    disabled={generando !== null || listaAsistieron.length === 0}
                    className="flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold text-white transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: "linear-gradient(135deg,#065f46,#059669)" }}
                  >
                    {generando === "asistencia-pdf" ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    ) : (
                      <>
                        <DownloadIcon />
                        PDF
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => generarExcel(listaAsistieron, "asistencia")}
                    disabled={generando !== null || listaAsistieron.length === 0}
                    className="flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold text-emerald-700 border border-emerald-300 bg-emerald-50 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {generando === "asistencia-excel" ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-300 border-t-emerald-700" />
                    ) : (
                      <>
                        <DownloadIcon />
                        Excel
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {listaConfirmados.length === 0 && (
              <p className="text-center text-xs text-slate-400">Nadie ha confirmado asistencia aún</p>
            )}
          </div>
        )}

        <div className="px-5 pb-5 pt-1 flex-shrink-0">
          <button
            onClick={onCerrar}
            className="w-full py-3 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-500 hover:bg-slate-50 transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
