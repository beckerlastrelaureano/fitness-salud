/**
 * clases.js — Agenda semanal de clases grupales, con cupo y anotados.
 */

const Clases = (() => {
  const { $, $$, esc, ic } = U;
  const { cabecera, conCarga, campo } = UI;
  const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const XLSX_URL = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';

  // Lunes de esta semana.
  function lunes() {
    const hoy = U.hoy();
    const dia = new Date(`${hoy}T12:00:00`).getDay();
    return U.sumarDias(hoy, -((dia + 6) % 7));
  }

  async function clases(cont) {
    const [turnos, equipo] = await Promise.all([Datos.listarTurnos(), Datos.listarEquipo()]);
    const inicio = lunes();
    const fechaDe = (i) => U.sumarDias(inicio, i);

    cont.innerHTML = `${cabecera({ titulo: 'Clases', sub: `Semana del ${U.fechaNum(fechaDe(0), true)} al ${U.fechaNum(fechaDe(5), true)}`,
        acciones: `<label class="btn btn-fantasma" style="cursor:pointer">${ic('subir')}Cargar desde Excel<input id="excel" type="file" class="oculto" accept=".xlsx,.xls,.csv"></label>
          <button class="btn btn-fantasma" id="bajar">${ic('tabla')}Descargar Excel</button>
          <button class="btn btn-primario" id="nuevo">${ic('mas')}Nuevo turno</button>` })}
      <div class="fila t-suave" style="gap:16px;font-size:12px"><span class="fila" style="gap:6px"><span class="punto" style="color:var(--acento2)"></span>Con lugar</span>
        <span class="fila" style="gap:6px"><span class="punto" style="color:var(--rojo-txt)"></span>Completo</span></div>
      <div class="semana">${DIAS.map((nombre, i) => {
        const delDia = turnos.filter((t) => t.dia === i).sort((a, b) => a.hora.localeCompare(b.hora));
        return `<div class="semana-dia"><div class="semana-cab"><span class="t-titulo" style="font-size:15px">${nombre}</span><span class="t-num t-tenue" style="font-size:12px">${U.fechaNum(fechaDe(i), true)}</span></div>
          ${delDia.map((t) => {
            const n = (t.anotados || []).length;
            return `<button type="button" class="tarjeta turno" data-id="${esc(t.id)}"><span class="fila" style="justify-content:space-between"><span class="t-num" style="font-weight:600;font-size:15px">${esc(t.hora)}</span>
              <span class="chip ${n >= t.cupo ? 'chip-rojo' : 'chip-acento'} t-num" style="height:22px">${n} / ${t.cupo}</span></span>
              <span style="font-weight:600">${esc(t.clase)}</span><span class="dato-pie">${esc(t.profe) || 'Sin profe'}</span></button>`;
          }).join('') || '<p class="t-tenue" style="font-size:12px;padding:4px">Sin turnos</p>'}</div>`;
      }).join('')}</div>`;

    $('#nuevo').addEventListener('click', () => modalTurno(null, equipo));
    $$('[data-id]', cont).forEach((b) => b.addEventListener('click', () => modalTurno(turnos.find((t) => t.id === b.dataset.id), equipo)));
    $('#bajar').addEventListener('click', (e) => conCarga(e.currentTarget, () => bajarExcel(turnos)));
    $('#excel').addEventListener('change', async (e) => {
      const archivo = e.target.files[0];
      e.target.value = '';
      if (!archivo) return;
      try { await cargarExcel(archivo); App.enrutar(); }
      catch (err) { console.error(err); U.aviso(err.message, 'error', 6000); }
    });
  }

  function modalTurno(t, equipo) {
    const nuevo = !t;
    t = t || { dia: 0, hora: '18:00', clase: '', profe: '', cupo: 10, anotados: [] };
    const d = U.modal(`<form class="modal-cuerpo"><h2 class="t-titulo">${nuevo ? 'Nuevo turno' : 'Editar turno'}</h2>
      <div class="dos-columnas">
        ${campo('Día', `<select class="input select" name="dia">${DIAS.map((n, i) => `<option value="${i}" ${i === t.dia ? 'selected' : ''}>${n}</option>`).join('')}</select>`)}
        ${campo('Hora', `<input class="input t-num" name="hora" type="time" required value="${esc(t.hora)}">`)}
      </div>
      ${campo('Clase', `<input class="input" name="clase" required list="lista-clases" value="${esc(t.clase)}">
        <datalist id="lista-clases">${CONFIG.actividades.map((a) => `<option value="${esc(a.nombre)}">`).join('')}</datalist>`)}
      <div class="dos-columnas">
        ${campo('Profe', `<select class="input select" name="profe"><option value="">Sin profe</option>${equipo.map((p) => `<option ${p.nombre === t.profe ? 'selected' : ''}>${esc(p.nombre)}</option>`).join('')}</select>`)}
        ${campo('Cupo', `<input class="input t-num" name="cupo" inputmode="numeric" required value="${esc(t.cupo)}">`)}
      </div>
      ${campo('Anotados', `<textarea class="input" name="anotados" rows="4" placeholder="Uno por línea">${esc((t.anotados || []).join('\n'))}</textarea>`)}
      <div class="acciones">
        ${nuevo ? '' : '<button type="button" class="btn btn-peligro" id="borrar">Eliminar</button>'}
        <button type="button" class="btn btn-fantasma" data-cerrar>Cancelar</button>
        <button class="btn btn-primario">Guardar</button></div></form>`);
    const f = $('form', d);
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const cupo = Number(U.soloDigitos(f.cupo.value)) || 0;
      const anotados = f.anotados.value.split('\n').map((s) => s.trim()).filter(Boolean);
      if (!cupo) return U.aviso('Poné el cupo', 'error');
      if (anotados.length > cupo) return U.aviso(`Hay ${anotados.length} anotados y el cupo es ${cupo}`, 'error');
      const datos = { dia: Number(f.dia.value), hora: f.hora.value, clase: f.clase.value.trim(), profe: f.profe.value, cupo, anotados };
      conCarga($('.btn-primario', f), async () => {
        await Datos.guardarTurno(nuevo ? U.nuevoId() : t.id, datos);
        d.close();
        U.aviso('Turno guardado');
        App.enrutar();
      });
    });
    const borrar = $('#borrar', d);
    if (borrar) borrar.addEventListener('click', async () => {
      if (!(await U.confirmar('¿Eliminar este turno?', 'Eliminar'))) return;
      conCarga(borrar, async () => {
        await Datos.borrarTurno(t.id);
        d.close();
        U.aviso('Turno eliminado');
        App.enrutar();
      });
    });
  }

  async function bajarExcel(turnos) {
    await U.cargarScript(XLSX_URL);
    const filas = [...turnos].sort((a, b) => a.dia - b.dia || a.hora.localeCompare(b.hora))
      .map((t) => ({ Día: DIAS[t.dia], Hora: t.hora, Clase: t.clase, Profe: t.profe, Cupo: t.cupo, Anotados: (t.anotados || []).join(', ') }));
    const hoja = XLSX.utils.json_to_sheet(filas.length ? filas : [{ Día: 'Lunes', Hora: '18:00', Clase: 'Pilates', Profe: '', Cupo: 10, Anotados: '' }]);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Clases');
    XLSX.writeFile(libro, 'clases.xlsx');
  }

  // Suma turnos desde un Excel con las mismas columnas que "Descargar Excel".
  async function cargarExcel(archivo) {
    await U.cargarScript(XLSX_URL);
    const libro = XLSX.read(await archivo.arrayBuffer());
    const filas = XLSX.utils.sheet_to_json(libro.Sheets[libro.SheetNames[0]], { raw: false });
    const buscarDia = (t) => DIAS.findIndex((d) => U.normalizar(d) === U.normalizar(t));
    const turnos = filas.map((f) => ({ dia: buscarDia(f['Día'] ?? f.Dia), hora: String(f.Hora || '').trim(), clase: String(f.Clase || '').trim(),
      profe: String(f.Profe || '').trim(), cupo: Number(f.Cupo) || 0,
      anotados: String(f.Anotados || '').split(',').map((s) => s.trim()).filter(Boolean) }))
      .filter((t) => t.dia >= 0 && t.hora && t.clase && t.cupo);
    if (!turnos.length) throw new Error('No encontré turnos. Usá las columnas Día, Hora, Clase, Profe, Cupo.');
    await Promise.all(turnos.map((t) => Datos.guardarTurno(U.nuevoId(), t)));
    U.aviso(`${turnos.length} turno${turnos.length === 1 ? '' : 's'} cargado${turnos.length === 1 ? '' : 's'}`);
  }

  return { clases };
})();
