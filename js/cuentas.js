/**
 * cuentas.js — Las cuentas del gimnasio. Solo calcula, nunca guarda nada.
 */

const Cuentas = (() => {
  const mismasActividades = (a, b) => a.length === b.length && a.every((x) => b.includes(x));

  // Precio de un grupo de actividades: si hay un combo exacto vale el combo;
  // si no, la suma de los precios sueltos.
  function precioDe(actividades, negocio) {
    if (!actividades.length) return { monto: 0, detalle: 'Elegí al menos una actividad' };
    const combo = (negocio.combos || []).find((c) => mismasActividades(c.actividades || [], actividades));
    if (combo) return { monto: Number(combo.precio) || 0, detalle: `Combo ${combo.nombre}` };
    const monto = actividades.reduce((t, a) => t + (Number(negocio.precios?.[a]) || 0), 0);
    return { monto, detalle: actividades.length > 1 ? 'Suma de cada actividad' : 'Precio de la actividad' };
  }

  // Reparte un cobro entre las actividades del alumno, según el precio suelto
  // de cada una. Sin precios cargados, reparte en partes iguales.
  function reparto(monto, actividades, negocio) {
    if (!actividades.length) return {};
    const precios = actividades.map((a) => Number(negocio.precios?.[a]) || 0);
    const total = precios.reduce((t, p) => t + p, 0);
    const resultado = {};
    let asignado = 0;
    actividades.forEach((a, i) => {
      const parte = total ? (monto * precios[i]) / total : monto / actividades.length;
      const redondeada = i === actividades.length - 1 ? monto - asignado : Math.round(parte);
      resultado[a] = redondeada;
      asignado += redondeada;
    });
    return resultado;
  }

  // Una fila por actividad para el cuadro del mes.
  function cuadro({ mes, alumnos, pagos, asistencias, pagosProfes, negocio, equipo }) {
    return CONFIG.actividades.map((act) => {
      const clases = asistencias.filter((a) => a.actividad === act.id);
      const presentes = clases.flatMap((c) => c.presentes || []);
      const recaudado = pagos.reduce((t, p) => t + (p.reparto?.[act.id] || 0), 0);
      const porcentaje = Number(negocio.porcentajes?.[act.id]) || 0;
      const aPagar = Math.round((recaudado * porcentaje) / 100);
      const deLaActividad = pagosProfes.filter((p) => p.actividad === act.id);
      const pagado = deLaActividad.filter((p) => p.periodo === mes).reduce((t, p) => t + p.monto, 0);
      const ultimo = deLaActividad.map((p) => p.fecha).sort().pop() || null;
      return {
        ...act,
        inscriptos: alumnos.filter((a) => (a.actividades || []).includes(act.id)).length,
        vinieron: new Set(presentes).size,
        asistencias: presentes.length,
        recaudado, porcentaje, aPagar, pagado, ultimo,
        saldo: aPagar - pagado,
        profes: equipo.filter((e) => (e.actividades || []).includes(act.id)),
      };
    });
  }

  return { precioDe, reparto, cuadro };
})();
