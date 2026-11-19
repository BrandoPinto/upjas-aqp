// Una persona tiene UN solo documento de asistencia por evento, con este id.
// Ahí se juntan las dos cosas que pueden pasar:
//   · confirmó desde la app            → estado "confirmado" y `fecha`
//   · la escanearon en el evento       → `confirmadoEn`
// (Antes la confirmación usaba "usuario_evento" y el escáner "evento_usuario": eran dos
//  documentos distintos y los reportes mostraban a la misma persona duplicada.)
export const idAsistencia = (eventoId, uid) => `${eventoId}_${uid}`;

const vacio = (v) => v === undefined || v === null || v === "";

/**
 * Une varios documentos de asistencia de la misma persona en el mismo evento en uno solo.
 * `docs` es una lista de objetos planos `{ id, ...datos }`. Devuelve los datos del documento unificado.
 *
 *  - Se conserva cada dato del primer documento que lo tenga; los documentos que confirmó la
 *    propia persona (traen `fecha`) van primero, porque tienen los datos más completos.
 *  - `estado: "confirmado"` solo si la persona confirmó desde la app (hay `fecha`). El escáner antes
 *    lo ponía a todos, y eso inflaba "Confirmaron" con gente que solo fue escaneada.
 */
export const fusionarAsistencias = (docs) => {
  const ordenados = [...docs].sort((a, b) => Number(!!b.fecha) - Number(!!a.fecha));
  const unido = {};
  for (const d of ordenados) {
    for (const [k, v] of Object.entries(d)) {
      if (k === "id" || k === "estado") continue;
      if (vacio(unido[k]) && !vacio(v)) unido[k] = v;
    }
  }
  if (docs.some((d) => d.fecha)) unido.estado = "confirmado";
  return unido;
};
