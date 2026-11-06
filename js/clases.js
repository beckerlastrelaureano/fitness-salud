/**
 * clases.js — Agenda semanal de turnos, con cupo. Cada profe ve solo los
 * turnos de sus actividades. Los alumnos se anotan con un tilde en el turno.
 */

const Clases = (() => {
  const { $, $$, esc, ic } = U;
  const { estado, nombreActividad, porNombre, cabecera, conCarga, campo } = UI;
  const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const XLSX_URL = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';

  // Lunes de esta semana.
  const lunes = () => U.sumarDias(U.hoy(), -U.diaTurno(U.hoy()));

  // Actividades con turnos que puede manejar quien entró.
  function actividadesPropias() {
    const { sesion } = estado;
    return UI.actividadesDeClase().filter((a) => sesion.rol === 'dueno' || sesion.actividades.includes(a.id));
  }

  async function clases(cont) {
    const [turnos, equipo, alumnos] = await Promise.all([UI.turnosVisibles(), Datos.listarEquipo(),
      Datos.listarAlumnos({ conContacto: estado.sesion.rol === 'dueno' })]);
    const inicio = lunes();
    const fechaDe = (i) => U.sumarDias(inicio, i);
    const anotados = (t) => alumnos.filter((a) => (a.turnos || []).includes(t.id));

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
            const n = anotados(t).length;
            return `<button type="button" class="tarjeta turno" data-id="${esc(t.id)}"><span class="fila" style="justify-content:space-between"><span class="t-num" style="font-weight:600;font-size:15px">${esc(t.hora)}</span>
              <span class="chip ${n >= t.cupo ? 'chip-rojo' : 'chip-acento'} t-num" style="height:22px">${n} / ${t.cupo}</span></span>
              <span style="font-weight:600">${esc(nombreActividad(t.actividad))}</span><span class="dato-pie">${esc(t.profe) || 'Sin profe'}</span></button>`;
          }).join('') || '<p class="t-tenue" style="font-size:12px;padding:4px">Sin turnos</p>'}</div>`;
      }).join('')}</div>`;

    $('#nuevo').addEventListener('click', () => modalTurno(null, equipo, alumnos));
    $$('[data-id]', cont).forEach((b) => b.addEventListener('click', () => {
      modalTurno(turnos.find((x) => x.id === b.dataset.id), equipo, alumnos);
    }));
    $('#bajar').addEventListener('click', (e) => conCarga(e.currentTarget, () => bajarExcel(turnos, anotados)));
    $('#excel').addEventListener('change', async (e) => {
      const archivo = e.target.files[0];
      e.target.value = '';
      if (!archivo) return;
      try { await cargarExcel(archivo); App.enrutar(); }
      catch (err) { console.error(err); U.aviso(err.message, 'error', 6000); }
    });
  }

  function modalTurno(t, equipo, alumnos) {
    const nuevo = !t;
    const propias = actividadesPropias();
    const { sesion } = estado;
    const esDueno = sesion.rol === 'dueno';
    t = t || { dia: 0, hora: '18:00', actividad: propias[0]?.id, profe: sesion.rol === 'profe' ? sesion.nombre : '', cupo: 10 };
    const opcionesProfe = (actividad) => `<option value="">Sin profe</option>${equipo.filter((p) => (p.actividades || []).includes(actividad))
      .map((p) => `<option ${p.nombre === t.profe ? 'selected' : ''}>${esc(p.nombre)}</option>`).join('')}`;
    const elegidos = new Set(alumnos.filter((a) => (a.turnos || []).includes(t.id)).map((a) => a.dni));
    const telefonos = new Map(alumnos.map((a) => [a.dni, a.telefono || '']));
    const d = U.modal(`<form class="modal-cuerpo"><h2 class="t-titulo">${nuevo ? 'Nuevo turno' : `${esc(nombreActividad(t.actividad))} · ${esc(t.hora)}`}</h2>
      ${nuevo ? '' : `<a class="btn btn-secundario" href="#/asistencia/${esc(t.actividad)}">${ic('check')}Pasar lista</a>`}
      ${campo('Actividad', `<select class="input select" name="actividad">${propias.map((a) => `<option value="${a.id}" ${a.id === t.actividad ? 'selected' : ''}>${esc(a.nombre)}</option>`).join('')}</select>`)}
      <div class="dos-columnas">
        ${campo('Día', `<select class="input select" name="dia">${DIAS.map((n, i) => `<option value="${i}" ${i === t.dia ? 'selected' : ''}>${n}</option>`).join('')}</select>`)}
        ${campo('Hora', `<input class="input t-num" name="hora" type="time" required value="${esc(t.hora)}">`)}
      </div>
      <div class="dos-columnas">
        ${sesion.rol === 'dueno' ? campo('Profe', `<select class="input select" name="profe">${opcionesProfe(t.actividad)}</select>`) : ''}
        ${campo('Cupo', `<input class="input t-num" name="cupo" inputmode="numeric" required value="${esc(t.cupo)}">`)}
      </div>
      <div class="campo"><label id="titulo-anotados"></label><div class="picker-lista" id="anotar"></div></div>
      <div class="acciones">
        ${nuevo ? '' : '<button type="button" class="btn btn-peligro" id="borrar">Eliminar</button>'}
        <button type="button" class="btn btn-fantasma" data-cerrar>Cancelar</button>
        <button class="btn btn-primario">Guardar</button></div></form>`);
    const f = $('form', d);

    const deLaActividad = () => alumnos.filter((a) => (a.actividades || []).includes(f.actividad.value)).sort(porNombre);
    const anotadosAhora = () => deLaActividad().filter((a) => elegidos.has(a.dni));
    const contarAnotados = () => { $('#titulo-anotados', d).textContent = `Alumnos anotados: ${anotadosAhora().length} de ${f.cupo.value || 0}`; };

    function enlaceWhatsapp(a) {
      const link = U.linkWhatsapp(telefonos.get(a.dni), Panel.mensajeWhatsapp(a, U.estadoCuota(a.vence)));
      return link ? `<a class="btn btn-secundario btn-chico" href="${esc(link)}" target="_blank" rel="noopener">WhatsApp</a>` : '';
    }

    // Un tilde por alumno de la actividad. El dueño ve además su celular.
    function pintarAnotar() {
      $('#anotar', d).innerHTML = deLaActividad().map((a) => `<div class="anotar-fila" data-dni="${esc(a.dni)}">
        <label class="fila" style="flex:1 1 100%;min-width:0;cursor:pointer"><input type="checkbox" data-anotar ${elegidos.has(a.dni) ? 'checked' : ''}><span style="overflow-wrap:anywhere">${esc(a.nombre)}</span></label>
        ${esDueno ? `<div class="anotar-contacto"><input class="input t-num" data-tel inputmode="tel" aria-label="Celular de ${esc(a.nombre)}" placeholder="Celular" value="${esc(telefonos.get(a.dni))}"><span data-wa>${enlaceWhatsapp(a)}</span></div>` : ''}
      </div>`).join('') || '<p class="vacio-chico" style="border:0">No hay alumnos en esta actividad. Sumala en la ficha del alumno.</p>';
      contarAnotados();
    }

    f.actividad.addEventListener('change', () => { if (f.profe) f.profe.innerHTML = opcionesProfe(f.actividad.value); pintarAnotar(); });
    f.cupo.addEventListener('input', contarAnotados);
    $('#anotar', d).addEventListener('change', (e) => {
      const dni = e.target.closest('[data-dni]')?.dataset.dni;
      if (!dni) return;
      if (e.target.matches('[data-anotar]')) { if (e.target.checked) elegidos.add(dni); else elegidos.delete(dni); contarAnotados(); }
      if (e.target.matches('[data-tel]')) {
        telefonos.set(dni, e.target.value.trim());
        e.target.closest('[data-dni]').querySelector('[data-wa]').innerHTML = enlaceWhatsapp(alumnos.find((a) => a.dni === dni));
      }
    });
    pintarAnotar();

    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const cupo = Number(U.soloDigitos(f.cupo.value)) || 0;
      if (!cupo) return U.aviso('Poné el cupo', 'error');
      const anotados = anotadosAhora();
      if (cupo < anotados.length) return U.aviso(`Hay ${anotados.length} anotados y el cupo es ${cupo}`, 'error');
      const datos = { dia: Number(f.dia.value), hora: f.hora.value, actividad: f.actividad.value, profe: f.profe ? f.profe.value : t.profe, cupo };
      conCarga($('.btn-primario', f), async () => {
        const id = nuevo ? U.nuevoId() : t.id;
        await Datos.guardarTurno(id, datos);
        await Datos.anotarEnTurno(id, alumnos, anotados.map((a) => a.dni));
        if (esDueno) await Promise.all(alumnos.filter((a) => telefonos.get(a.dni) !== (a.telefono || '')).map((a) => Datos.guardarTelefono(a, telefonos.get(a.dni))));
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

  async function bajarExcel(turnos, anotados) {
    await U.cargarScript(XLSX_URL);
    const filas = [...turnos].sort((a, b) => a.dia - b.dia || a.hora.localeCompare(b.hora))
      .map((t) => ({ Día: DIAS[t.dia], Hora: t.hora, Clase: nombreActividad(t.actividad), Profe: t.profe, Cupo: t.cupo,
        Anotados: anotados(t).sort(porNombre).map((a) => a.nombre).join(', ') }));
    const hoja = XLSX.utils.json_to_sheet(filas.length ? filas : [{ Día: 'Lunes', Hora: '18:00', Clase: 'Pilates', Profe: '', Cupo: 10, Anotados: '' }]);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Clases');
    XLSX.writeFile(libro, 'clases.xlsx');
  }

  // Suma turnos desde un Excel con las columnas Día, Hora, Clase, Profe y Cupo.
  async function cargarExcel(archivo) {
    await U.cargarScript(XLSX_URL);
    const libro = XLSX.read(await archivo.arrayBuffer());
    const filas = XLSX.utils.sheet_to_json(libro.Sheets[libro.SheetNames[0]], { raw: false });
    const propias = actividadesPropias();
    const buscarDia = (t) => DIAS.findIndex((d) => U.normalizar(d) === U.normalizar(t));
    const buscarActividad = (t) => propias.find((a) => U.normalizar(a.nombre) === U.normalizar(t))?.id;
    const turnos = filas.map((f) => ({ dia: buscarDia(f['Día'] ?? f.Dia), hora: String(f.Hora || '').trim(), actividad: buscarActividad(f.Clase),
      profe: String(f.Profe || '').trim(), cupo: Number(f.Cupo) || 0 }))
      .filter((t) => t.dia >= 0 && t.hora && t.actividad && t.cupo);
    if (!turnos.length) throw new Error('No encontré turnos. Usá las columnas Día, Hora, Clase, Profe, Cupo.');
    await Promise.all(turnos.map((t) => Datos.guardarTurno(U.nuevoId(), t)));
    U.aviso(`${turnos.length} turno${turnos.length === 1 ? '' : 's'} cargado${turnos.length === 1 ? '' : 's'}`);
  }

  return { clases };
})();
