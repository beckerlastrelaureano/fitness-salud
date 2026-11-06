/**
 * panel.js — Secciones de gestión: Inicio, Actividades, Alumnos, ficha del
 * alumno, Asistencia, Precios, Cuadro y Profes.
 */

const Panel = (() => {
  const { $, $$, esc, ic } = U;
  const { estado, actividadDe, usaRutinas, turnosVisibles, textoTurno, nombreActividad, nombresActividades, porNombre, primerNombre, chipCuota, avatar, cabecera, conCarga, campo,
    eleccionActividades, leerEleccion, panelVacio, dato } = UI;

  const fechaUltima = (filas, dni) => filas.filter((p) => p.dni === dni).map((p) => p.fecha).sort().pop() || null;
  const haceDias = (fecha) => (fecha ? -U.diasHasta(fecha) : null);
  function ultimaVez(fecha) {
    if (!fecha) return 'Nunca vino';
    const d = haceDias(fecha);
    return d === 0 ? 'Hoy' : d === 1 ? 'Ayer' : `Hace ${d} días`;
  }

  // ---------------------------------------------------------------------
  // Inicio
  // ---------------------------------------------------------------------
  async function inicio(cont) {
    const hoy = U.hoy();
    const [alumnos, filas] = await Promise.all([Datos.listarAlumnos(), Datos.presencias(U.sumarDias(hoy, -60), hoy)]);
    const conEstado = alumnos.map((a) => ({ ...a, est: U.estadoCuota(a.vence), ultima: fechaUltima(filas, a.dni) }));
    const deHoy = filas.filter((f) => f.fecha === hoy);
    const solos = deHoy.filter((f) => f.por === 'alumno').length;
    const deben = conEstado.filter((a) => ['vencida', 'sin-pago'].includes(a.est.clave));
    const vencen = conEstado.filter((a) => a.est.clave === 'por-vencer').sort((a, b) => a.vence.localeCompare(b.vence));
    const sinVenir = conEstado
      .filter((a) => (a.ultima ? haceDias(a.ultima) > 7 : a.fechaAlta && haceDias(a.fechaAlta) > 7))
      .sort((a, b) => (a.ultima || '').localeCompare(b.ultima || ''));
    const nombreDe = (dni) => alumnos.find((a) => a.dni === dni)?.nombre || `DNI ${dni}`;

    const dias = Array.from({ length: 7 }, (_, i) => U.sumarDias(hoy, i - 6));
    const conteo = dias.map((d) => filas.filter((f) => f.fecha === d).length);
    const tope = Math.max(1, ...conteo);
    const hora = new Date().getHours();
    const saludo = hora < 12 ? 'Buen día' : hora < 20 ? 'Buenas tardes' : 'Buenas noches';

    const filaAlumno = (a, derecha, sub) => `<a class="lista-fila" href="#/alumnos/${esc(a.dni)}">${avatar(a.nombre)}
      <div class="datos"><strong>${esc(a.nombre)}</strong><small>${esc(sub)}</small></div>${derecha}</a>`;

    cont.innerHTML = `${cabecera({ titulo: saludo, migas: esc(U.fechaLarga(hoy)),
        acciones: `<a class="btn btn-secundario" href="#/asistencia">${ic('calendario')}Asistencia de hoy</a>
          <a class="btn btn-primario" href="#/alumnos/nuevo">${ic('mas')}Nuevo alumno</a>` })}
      <section class="resumen" aria-label="Resumen">
        ${dato({ titulo: 'Alumnos activos', icono: 'alumnos', numero: alumnos.length, pie: 'en el gimnasio', href: '#/alumnos' })}
        ${dato({ titulo: 'Vinieron hoy', icono: 'check-circulo', numero: deHoy.length, color: 'c-verde', pie: `${solos} lo registraron solos`, href: '#/asistencia' })}
        ${dato({ titulo: 'Deben la cuota', icono: 'alerta', numero: deben.length, color: 'c-rojo', pie: `de ${alumnos.length} alumnos`, href: '#/alumnos' })}
        ${dato({ titulo: 'Vencen esta semana', icono: 'plata', numero: vencen.length, color: 'c-amarillo', pie: 'en los próximos 7 días', href: '#/alumnos' })}
        ${dato({ titulo: 'Sin venir +7 días', icono: 'reloj', numero: sinVenir.length, pie: 'conviene escribirles', href: '#/alumnos' })}
      </section>
      <div class="grilla-auto">
        <section class="panel" style="overflow:hidden"><div class="panel-cab"><h2 class="t-titulo">Cuotas que vencen esta semana</h2><span class="chip chip-amarillo t-num">${vencen.length}</span></div>
          ${vencen.map((a) => filaAlumno(a, `<span class="t-num t-suave">vence ${U.fechaNum(a.vence, true)}</span>`, `DNI ${a.dni}`)).join('') || panelVacio('Ninguna cuota vence en los próximos 7 días.')}</section>
        <section class="panel" style="overflow:hidden"><div class="panel-cab"><h2 class="t-titulo">Hace más de 7 días que no vienen</h2><span class="chip chip-neutro t-num">${sinVenir.length}</span></div>
          ${sinVenir.slice(0, 8).map((a) => filaAlumno(a, a.ultima ? `<span class="t-num t-suave">${haceDias(a.ultima)} días</span>` : '', a.ultima ? `Última vez: ${U.fechaNum(a.ultima)}` : 'Nunca vino')).join('') || panelVacio('Todos vinieron en la última semana.')}</section>
        <section class="panel" style="overflow:hidden"><div class="panel-cab"><h2 class="t-titulo">Vinieron hoy</h2><a class="link" href="#/asistencia">Ver todo</a></div>
          ${deHoy.slice(0, 8).map((f) => filaAlumno({ dni: f.dni, nombre: nombreDe(f.dni) },
            `<span class="chip ${f.por === 'alumno' ? 'chip-acento' : 'chip-neutro'}">${f.por === 'alumno' ? 'Lo registró' : 'Marcado por el profe'}</span>`,
            f.dia ? `Hizo el Día ${f.dia} · ${f.hora}` : nombresActividades(f.actividades))).join('') || panelVacio('Todavía no vino nadie hoy.')}</section>
        <section class="panel"><div class="panel-cab"><h2 class="t-titulo">Asistencia de los últimos 7 días</h2></div>
          <div class="barras">${dias.map((d, i) => `<div class="barra ${d === hoy ? 'hoy' : ''}"><span class="t-num">${conteo[i]}</span>
            <i style="height:${Math.round((conteo[i] / tope) * 90)}px"></i><span>${d === hoy ? 'Hoy' : U.diaSemana(d)}</span></div>`).join('')}</div></section>
      </div>`;
  }

  // ---------------------------------------------------------------------
  // Asistencia (dueño y profes)
  // ---------------------------------------------------------------------
  async function panelLista(cont, actividad, alumnos) {
    const lista = alumnos.filter((a) => (a.actividades || []).includes(actividad)).sort(porNombre);
    let fecha = U.hoy();
    cont.innerHTML = `<section class="panel" style="overflow:hidden">
      <div class="panel-cab" style="align-items:flex-end;flex-wrap:wrap">
        <div><h2 class="t-titulo">${esc(nombreActividad(actividad))}</h2><span class="sub">${lista.length} alumno${lista.length === 1 ? '' : 's'}</span></div>
        <div class="campo"><label>Fecha</label><input type="date" class="input t-num" id="fecha" value="${fecha}" max="${fecha}" style="width:170px"></div>
      </div>
      <div id="lista-asistencia"></div>
      <div style="padding:14px 18px;border-top:1px solid var(--borde2)" ${lista.length ? '' : 'hidden'}>
        <button class="btn btn-primario btn-ancho" id="guardar-asistencia">Guardar asistencia</button></div>
    </section>`;

    const contar = () => {
      const n = $$('#lista-asistencia input:checked', cont).length;
      $('#guardar-asistencia', cont).textContent = `Guardar asistencia (${n})`;
    };

    async function cargar() {
      const presentes = await Datos.asistencia(fecha, actividad);
      $('#lista-asistencia', cont).innerHTML = lista.map((a) => `<label class="lista-fila">${avatar(a.nombre)}
        <div class="datos"><strong>${esc(a.nombre)}</strong><small>DNI ${esc(a.dni)}</small></div>
        <input type="checkbox" value="${esc(a.dni)}" style="width:22px;height:22px;accent-color:var(--acento)" ${presentes.includes(a.dni) ? 'checked' : ''}></label>`).join('')
        || panelVacio('Todavía no hay alumnos en esta actividad.');
      contar();
    }

    $('#lista-asistencia', cont).addEventListener('change', contar);
    $('#fecha', cont).addEventListener('change', (e) => { fecha = e.target.value || U.hoy(); cargar(); });
    $('#guardar-asistencia', cont).addEventListener('click', (e) => {
      const presentes = $$('#lista-asistencia input:checked', cont).map((i) => i.value);
      conCarga(e.currentTarget, async () => {
        await Datos.guardarAsistencia(fecha, actividad, presentes);
        U.aviso(`Asistencia guardada: ${presentes.length} presente${presentes.length === 1 ? '' : 's'}`);
      }).then(contar);
    });
    await cargar();
  }

  // Lista de un turno: el profe elige fecha y turno, suma alumnos de su
  // actividad a la clase y tilda quién vino.
  async function panelTurnos(cont, actividad, alumnos, turnos) {
    const propios = turnos.filter((t) => t.actividad === actividad).sort((a, b) => a.hora.localeCompare(b.hora));
    let fecha = U.hoy();
    let turnoId = null;
    // Los recién sumados quedan tildados como presentes hasta que se guarde.
    let sumados = new Set();
    cont.innerHTML = `<section class="panel" style="overflow:hidden">
      <div class="panel-cab" style="align-items:flex-end;flex-wrap:wrap">
        <div><h2 class="t-titulo">${esc(nombreActividad(actividad))}</h2><span class="sub" id="dia-texto"></span></div>
        <div class="campo"><label>Fecha</label><input type="date" class="input t-num" id="fecha" value="${fecha}" max="${fecha}" style="width:170px"></div>
      </div>
      <div class="filtros" id="turnos-dia" style="padding:0 18px 14px"></div>
      <div id="lista-asistencia"></div>
      <div style="padding:14px 18px 0;border-top:1px solid var(--borde2)" id="caja-sumar" hidden>
        <button type="button" class="btn btn-secundario btn-ancho" id="sumar-alumnos">${ic('mas')}Sumar alumnos a esta clase</button></div>
      <div style="padding:14px 18px" id="caja-guardar"><button class="btn btn-primario btn-ancho" id="guardar-asistencia">Guardar asistencia</button></div>
    </section>`;
    const contar = () => {
      const n = $$('#lista-asistencia input:checked', cont).length;
      $('#guardar-asistencia', cont).textContent = `Guardar asistencia (${n})`;
    };
    const deLaActividad = () => alumnos.filter((a) => (a.actividades || []).includes(actividad)).sort(porNombre);
    const anotadosEn = (id) => alumnos.filter((a) => (a.turnos || []).includes(id)).sort(porNombre);

    async function pintar() {
      const delDia = propios.filter((t) => t.dia === U.diaTurno(fecha));
      if (!delDia.some((t) => t.id === turnoId)) turnoId = delDia[0]?.id || null;
      $('#dia-texto', cont).textContent = U.fechaLarga(fecha);
      $('#turnos-dia', cont).innerHTML = delDia.map((t) => `<button type="button" class="filtro ${t.id === turnoId ? 'activo' : ''}" data-t="${esc(t.id)}">${esc(t.hora)}${t.profe ? ` · ${esc(primerNombre(t.profe))}` : ''}</button>`).join('');
      $('#caja-guardar', cont).hidden = true;
      $('#caja-sumar', cont).hidden = !turnoId;
      if (!turnoId) { $('#lista-asistencia', cont).innerHTML = panelVacio('No hay turnos este día.'); return; }
      const turno = propios.find((t) => t.id === turnoId);
      const anotados = anotadosEn(turnoId);
      const presentes = await Datos.asistenciaTurno(fecha, turnoId);
      $('#dia-texto', cont).textContent = `${U.fechaLarga(fecha)} · ${anotados.length} de ${turno.cupo} en la clase`;
      $('#lista-asistencia', cont).innerHTML = anotados.map((a) => `<label class="lista-fila">${avatar(a.nombre)}
        <div class="datos"><strong>${esc(a.nombre)}</strong><small>DNI ${esc(a.dni)}</small></div>
        <input type="checkbox" value="${esc(a.dni)}" style="width:22px;height:22px;accent-color:var(--acento)" ${presentes.includes(a.dni) || sumados.has(a.dni) ? 'checked' : ''}></label>`).join('')
        || panelVacio('Todavía no hay alumnos en esta clase. Sumalos con el botón de abajo.');
      $('#caja-guardar', cont).hidden = !anotados.length;
      contar();
    }

    // Elegir alumnos de la actividad que todavía no están en el turno.
    function modalSumar() {
      const turno = propios.find((t) => t.id === turnoId);
      const libres = deLaActividad().filter((a) => !(a.turnos || []).includes(turnoId));
      const lugar = Math.max(0, turno.cupo - anotadosEn(turnoId).length);
      const d = U.modal(`<form class="modal-cuerpo"><h2 class="t-titulo">Sumar a ${esc(nombreActividad(actividad))} · ${esc(textoTurno(turno))}</h2>
        <p class="t-suave" id="sumar-lugar"></p>
        ${libres.length > 6 ? `<div class="buscador">${ic('buscar', 16)}<input class="input" id="buscar-sumar" placeholder="Buscar por nombre o DNI…"></div>` : ''}
        <div class="picker-lista">${libres.map((a) => `<label class="anotar-fila" data-busca="${esc(U.normalizar(`${a.nombre} ${a.dni}`))}" style="cursor:pointer">
          <input type="checkbox" value="${esc(a.dni)}"><span style="flex:1;min-width:0;overflow-wrap:anywhere">${esc(a.nombre)}</span><small class="t-tenue t-num">${esc(a.dni)}</small></label>`).join('')
          || `<p class="vacio-chico" style="border:0">Todos los alumnos de ${esc(nombreActividad(actividad))} ya están en esta clase.</p>`}</div>
        <div class="acciones"><button type="button" class="btn btn-fantasma" data-cerrar>Cancelar</button>
          <button class="btn btn-primario" ${libres.length ? '' : 'disabled'}>Sumar a la clase</button></div></form>`);
      const f = $('form', d);
      const elegidos = () => $$('.picker-lista input:checked', d).map((i) => i.value);
      const mostrarLugar = () => {
        const n = elegidos().length;
        $('#sumar-lugar', d).textContent = `Quedan ${lugar} lugar${lugar === 1 ? '' : 'es'} de ${turno.cupo}.${n ? ` Elegiste ${n}.` : ''}`;
      };
      f.addEventListener('change', mostrarLugar);
      const buscar = $('#buscar-sumar', d);
      if (buscar) buscar.addEventListener('input', () => {
        const texto = U.normalizar(buscar.value);
        $$('[data-busca]', d).forEach((fila) => { fila.hidden = !fila.dataset.busca.includes(texto); });
      });
      mostrarLugar();
      f.addEventListener('submit', (e) => {
        e.preventDefault();
        const nuevos = elegidos();
        if (!nuevos.length) return U.aviso('Elegí al menos un alumno', 'error');
        if (nuevos.length > lugar) return U.aviso(`El cupo es ${turno.cupo}: ${lugar === 1 ? 'queda 1 lugar' : `quedan ${lugar} lugares`}`, 'error');
        conCarga($('.btn-primario', f), async () => {
          await Datos.anotarEnTurno(turnoId, alumnos, [...anotadosEn(turnoId).map((a) => a.dni), ...nuevos]);
          nuevos.forEach((dni) => sumados.add(dni));
          d.close();
          U.aviso(`${nuevos.length === 1 ? 'Alumno sumado' : `${nuevos.length} alumnos sumados`}. Ahora guardá la asistencia.`);
          await pintar();
        });
      });
    }

    $('#turnos-dia', cont).addEventListener('click', (e) => { const b = e.target.closest('[data-t]'); if (b) { turnoId = b.dataset.t; sumados = new Set(); pintar(); } });
    $('#lista-asistencia', cont).addEventListener('change', contar);
    $('#fecha', cont).addEventListener('change', (e) => { fecha = e.target.value || U.hoy(); sumados = new Set(); pintar(); });
    $('#sumar-alumnos', cont).addEventListener('click', modalSumar);
    $('#guardar-asistencia', cont).addEventListener('click', (e) => {
      const presentes = $$('#lista-asistencia input:checked', cont).map((i) => i.value);
      const turno = propios.find((t) => t.id === turnoId);
      conCarga(e.currentTarget, async () => {
        await Datos.guardarAsistenciaTurno(fecha, turno, presentes);
        sumados = new Set();
        U.aviso(`Asistencia guardada: ${presentes.length} presente${presentes.length === 1 ? '' : 's'}`);
      }).then(contar);
    });
    await pintar();
  }

  // Clases con turno; Musculación con la lista simple, como Gym App.
  const panelActividad = (cont, id, alumnos, turnos) =>
    (actividadDe(id)?.tipo === 'clase' ? panelTurnos(cont, id, alumnos, turnos) : panelLista(cont, id, alumnos));

  async function asistencia(cont, param) {
    const { sesion } = estado;
    const propias = sesion.rol === 'profe' ? sesion.actividades : CONFIG.actividades.map((a) => a.id);
    cont.innerHTML = cabecera({ titulo: 'Asistencia', sub: sesion.rol === 'profe' ? 'Marcá quién vino a tu clase.' : '' });
    if (!propias.length) {
      cont.insertAdjacentHTML('beforeend', '<p class="t-suave">Todavía no tenés actividades asignadas. Avisale al dueño.</p>');
      return;
    }
    const [alumnos, turnos] = await Promise.all([Datos.listarAlumnos(), turnosVisibles()]);
    cont.insertAdjacentHTML('beforeend', '<div class="filtros" id="filtros-act"></div><div id="lista-act"></div>');
    const abrir = (id) => {
      $('#filtros-act').innerHTML = propias.map((a) => `<button type="button" class="filtro ${a === id ? 'activo' : ''}" data-act="${a}">${esc(nombreActividad(a))}</button>`).join('');
      panelActividad($('#lista-act'), id, alumnos, turnos);
    };
    $('#filtros-act').addEventListener('click', (e) => { const b = e.target.closest('[data-act]'); if (b) abrir(b.dataset.act); });
    abrir(propias.includes(param) ? param : propias[0]);
  }

  // ---------------------------------------------------------------------
  // Actividades
  // ---------------------------------------------------------------------
  async function actividades(cont, id) {
    const [alumnos, negocio, equipo, turnos] = await Promise.all([Datos.listarAlumnos(), Datos.negocio(), Datos.listarEquipo(), Datos.listarTurnos()]);
    if (!id) {
      cont.innerHTML = `${cabecera({ titulo: 'Actividades', sub: 'Tocá una para ver sus alumnos y pasar lista.' })}
        <div class="grilla-actividades">${CONFIG.actividades.map((a) => {
          const n = alumnos.filter((x) => (x.actividades || []).includes(a.id)).length;
          const profes = equipo.filter((e) => (e.actividades || []).includes(a.id)).map((e) => primerNombre(e.nombre));
          return `<a class="tarjeta actividad" href="#/actividades/${a.id}"><strong>${esc(a.nombre)}</strong>
            <span class="dato-num">${n}</span><span class="dato-pie">alumno${n === 1 ? '' : 's'}</span>
            <span class="dato-pie">${U.plata(negocio.precios[a.id])} · ${profes.length ? esc(profes.join(', ')) : 'sin profe'}</span></a>`;
        }).join('')}</div>`;
      return;
    }
    const delMes = await Datos.asistenciasDelMes(U.mesActual());
    const clases = delMes.filter((c) => c.actividad === id);
    const lista = alumnos.filter((a) => (a.actividades || []).includes(id)).sort(porNombre);
    cont.innerHTML = `${cabecera({ titulo: nombreActividad(id), migas: `<a href="#/actividades">Actividades</a>${ic('der', 14)}${esc(nombreActividad(id))}` })}
      <div class="grilla-auto"><div id="pasar-lista"></div>
      <section class="panel" style="overflow:hidden"><div class="panel-cab"><h2 class="t-titulo">Alumnos · ${esc(U.nombreMes(U.mesActual()))}</h2></div>
        ${lista.map((a) => {
          const vino = clases.filter((c) => (c.presentes || []).includes(a.dni)).length;
          return `<a class="lista-fila" href="#/alumnos/${esc(a.dni)}">${avatar(a.nombre)}
            <div class="datos"><strong>${esc(a.nombre)}</strong><small>Vino ${vino} de ${clases.length} clase${clases.length === 1 ? '' : 's'}</small></div>
            ${chipCuota(U.estadoCuota(a.vence))}</a>`;
        }).join('') || panelVacio('Todavía no hay alumnos en esta actividad.')}</section></div>`;
    await panelActividad($('#pasar-lista'), id, alumnos, turnos);
  }

  // ---------------------------------------------------------------------
  // Alumnos
  // ---------------------------------------------------------------------
  function mensajeWhatsapp(a, est) {
    const gym = estado.gym.nombre;
    const nombre = primerNombre(a.nombre);
    if (est.clave === 'al-dia') return `Hola ${nombre}! Te escribimos de ${gym}.`;
    const cuota = { 'por-vencer': `Tu cuota ${est.detalle.toLowerCase()}.`, vencida: 'Tu cuota está vencida.', 'sin-pago': 'Todavía no registramos tu pago.' }[est.clave];
    return `Hola ${nombre}! Te escribimos de ${gym}. ${cuota} El valor es ${U.plata(a.monto)}. ¡Te esperamos!`;
  }

  // Lo que se le puede cobrar: su cuota, cada actividad suelta o un combo.
  function opcionesDeCobro(a, negocio) {
    return [
      { nombre: 'Su cuota', precio: a.monto, actividades: a.actividades || [] },
      ...CONFIG.actividades.map((x) => ({ nombre: x.nombre, precio: Number(negocio.precios?.[x.id]) || 0, actividades: [x.id] })),
      ...(negocio.combos || []).map((c) => ({ nombre: `Combo ${c.nombre}`, precio: Number(c.precio) || 0, actividades: c.actividades || [] })),
    ];
  }

  function modalCobro(a, negocio, alTerminar) {
    const est = U.estadoCuota(a.vence);
    const opciones = opcionesDeCobro(a, negocio);
    const d = U.modal(`<form class="modal-cuerpo">
      <h2 class="t-titulo">Cobrar a ${esc(a.nombre)}</h2>
      <p>${chipCuota(est)} <span class="t-suave">${esc(nombresActividades(a.actividades))}</span></p>
      ${campo('Qué paga', `<select class="input select" name="concepto">${opciones.map((o, i) => `<option value="${i}">${esc(o.nombre)} · ${U.plata(o.precio)}</option>`).join('')}</select>`)}
      <div class="dos-columnas">
        ${campo('Meses', `<select class="input select" name="meses">${[1, 2, 3, 6, 12].map((m) => `<option value="${m}">${m} ${m === 1 ? 'mes' : 'meses'}</option>`).join('')}</select>`)}
        ${campo('Monto ($)', '<input class="input t-num" name="monto" inputmode="numeric">')}
      </div>
      <p class="t-suave">Queda pagado hasta: <strong id="nv"></strong></p>
      <div class="acciones"><button type="button" class="btn btn-fantasma" data-cerrar>Cancelar</button>
      <button class="btn btn-primario">Registrar pago</button></div></form>`);
    const f = $('form', d);
    const mostrar = () => {
      $('#nv', d).textContent = U.fechaCorta(U.nuevoVencimiento(a.vence, Number(f.meses.value)));
      f.monto.value = opciones[Number(f.concepto.value)].precio * Number(f.meses.value);
    };
    f.meses.addEventListener('change', mostrar);
    f.concepto.addEventListener('change', mostrar);
    mostrar();
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      conCarga($('.btn-primario', f), async () => {
        const elegida = opciones[Number(f.concepto.value)];
        const vence = await Datos.registrarPago(a, { monto: Number(U.soloDigitos(f.monto.value)) || 0, meses: Number(f.meses.value),
          concepto: elegida.nombre, actividades: elegida.actividades }, negocio);
        a.vence = vence;
        d.close();
        U.aviso(`Pago registrado · vence ${U.fechaCorta(vence)}`);
        alTerminar();
      });
    });
  }

  function modalAlumno(a, { alumnos, negocio, rutinas, turnos }, alTerminar) {
    const nuevo = !a;
    a = a || { dni: '', nombre: '', telefono: '', actividades: [], turnos: [], monto: 0, montoManual: false, vence: '', notas: '', rutinaId: null };
    const elegidos = new Set(a.turnos || []);
    const d = U.modal(`<form class="modal-cuerpo">
      <h2 class="t-titulo">${nuevo ? 'Nuevo alumno' : 'Editar alumno'}</h2>
      ${campo('Nombre y apellido', `<input class="input" name="nombre" required value="${esc(a.nombre)}">`)}
      ${campo('DNI', `<input class="input t-num" name="dni" required inputmode="numeric" placeholder="Sin puntos" value="${esc(a.dni)}" ${nuevo ? '' : 'disabled'}>`)}
      ${campo('Celular', `<input class="input" name="telefono" inputmode="tel" value="${esc(a.telefono)}" placeholder="Para mandarle mensajes">`)}
      ${campo('Actividades', eleccionActividades('act', a.actividades))}
      <div id="turnos-alumno" class="col" style="gap:10px"></div>
      <p class="t-suave">Debería pagar: <strong id="sugerido"></strong> <small id="detalle-precio"></small></p>
      <label class="interruptor"><span class="t-suave">Ponerle otro precio</span><input type="checkbox" name="manual" ${a.montoManual ? 'checked' : ''}></label>
      <div id="campo-monto">${campo('Cuota ($)', `<input class="input t-num" name="monto" inputmode="numeric" value="${esc(a.monto || '')}">`)}</div>
      <div id="campo-rutina">${campo('Rutina', `<select class="input select" name="rutina"><option value="">Sin rutina</option>${rutinas.map((r) => `<option value="${esc(r.id)}" ${r.id === a.rutinaId ? 'selected' : ''}>${esc(r.nombre)}</option>`).join('')}</select>`)}</div>
      ${campo('Pagado hasta', `<input class="input t-num" name="vence" type="date" value="${esc(a.vence || '')}">`, nuevo ? 'Si no pagó todavía, dejalo vacío y usá “Cobrar”.' : 'Solo para corregir. Los pagos se cargan con “Cobrar”.')}
      ${campo('Notas', `<textarea class="input" name="notas" rows="2">${esc(a.notas)}</textarea>`)}
      <div class="acciones"><button type="button" class="btn btn-fantasma" data-cerrar>Cancelar</button>
        <button class="btn btn-primario">Guardar</button></div></form>`);
    const f = $('form', d);

    function actualizarPrecio() {
      const precio = Cuentas.precioDe(leerEleccion(f, 'act'), negocio);
      $('#sugerido', d).textContent = U.plata(precio.monto);
      $('#detalle-precio', d).textContent = precio.detalle;
      $('#campo-monto', d).hidden = !f.manual.checked;
    }
    // Un tilde por cada turno de las actividades elegidas.
    function pintarTurnos() {
      const clases = leerEleccion(f, 'act').filter((id) => actividadDe(id)?.tipo === 'clase');
      $('#turnos-alumno', d).innerHTML = clases.map((id) => {
        const propios = turnos.filter((t) => t.actividad === id).sort((x, y) => x.dia - y.dia || x.hora.localeCompare(y.hora));
        return campo(`Turnos de ${nombreActividad(id)}`, propios.length ? `<div class="eleccion">${propios.map((t) => {
          const ocupados = alumnos.filter((x) => x.dni !== a.dni && (x.turnos || []).includes(t.id)).length;
          const lleno = ocupados >= t.cupo && !elegidos.has(t.id);
          return `<label><input type="checkbox" data-turno="${esc(t.id)}" ${elegidos.has(t.id) ? 'checked' : ''} ${lleno ? 'disabled' : ''}><span class="filtro" ${lleno ? 'style="opacity:.5"' : ''}>${esc(textoTurno(t))}${lleno ? ' · completo' : ''}</span></label>`;
        }).join('')}</div>` : '<p class="t-tenue" style="font-size:12px">Todavía no hay turnos. Crealos en Clases.</p>');
      }).join('');
      $('#campo-rutina', d).hidden = !usaRutinas(leerEleccion(f, 'act'));
    }
    $('#turnos-alumno', d).addEventListener('change', (e) => {
      const id = e.target.dataset.turno;
      if (id) { if (e.target.checked) elegidos.add(id); else elegidos.delete(id); }
    });
    f.addEventListener('change', (e) => { actualizarPrecio(); if (e.target.name === 'act') pintarTurnos(); });
    actualizarPrecio();
    pintarTurnos();

    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const elegidas = leerEleccion(f, 'act');
      const montoManual = f.manual.checked;
      const dni = nuevo ? U.soloDigitos(f.dni.value) : a.dni;
      if (!dni) return U.aviso('El DNI es obligatorio', 'error');
      if (nuevo && alumnos.some((x) => x.dni === dni)) return U.aviso('Ya hay un alumno con ese DNI', 'error');
      if (!elegidas.length) return U.aviso('Elegí al menos una actividad', 'error');
      const turnosAlumno = turnos.filter((t) => elegidos.has(t.id) && elegidas.includes(t.actividad)).map((t) => t.id);
      const datos = { ...a, dni, nombre: f.nombre.value.trim(), telefono: f.telefono.value.trim(), actividades: elegidas, turnos: turnosAlumno, montoManual,
        monto: montoManual ? Number(U.soloDigitos(f.monto.value)) || 0 : Cuentas.precioDe(elegidas, negocio).monto,
        rutinaId: usaRutinas(elegidas) ? f.rutina.value || null : null, vence: f.vence.value || null, notas: f.notas.value.trim(), fechaAlta: a.fechaAlta || U.hoy() };
      conCarga($('.btn-primario', f), async () => {
        await Datos.guardarAlumno(datos);
        d.close();
        U.aviso(nuevo ? 'Alumno agregado' : 'Cambios guardados');
        alTerminar(datos);
      });
    });
  }

  async function alumnos(cont, dni) {
    if (dni && dni !== 'nuevo') return ficha(cont, dni);
    const hoy = U.hoy();
    const [lista, negocio, rutinas, filas, turnos] = await Promise.all([Datos.listarAlumnos({ conContacto: true }), Datos.negocio(),
      Datos.listarRutinas(), Datos.presencias(U.sumarDias(hoy, -60), hoy), Datos.listarTurnos()]);
    let filtro = 'todos';
    let texto = '';
    const debe = (a) => ['vencida', 'sin-pago'].includes(U.estadoCuota(a.vence).clave);
    const nombreRutina = (id) => rutinas.find((r) => r.id === id)?.nombre || 'Sin rutina';

    cont.innerHTML = `${cabecera({ titulo: 'Alumnos', acciones: `<button class="btn btn-secundario" id="al-dia">Poner a todos al día (1 mes)</button>
        <button class="btn btn-primario" id="nuevo">${ic('mas')}Nuevo alumno</button>` })}
      <div class="buscador">${ic('buscar', 16)}<input class="input" id="buscar" placeholder="Buscar por nombre o DNI…"></div>
      <div class="filtros" id="filtros"></div>
      <section class="panel tabla-caja"><table class="tabla"><thead><tr><th>Alumno</th><th>Actividades</th><th>Rutina</th><th>Última vez</th><th>Vencimiento</th><th>Cuota</th><th>Mensaje</th></tr></thead><tbody id="filas"></tbody></table></section>`;

    function pintar() {
      const n = (f) => lista.filter(f).length;
      $('#filtros').innerHTML = [['todos', `Todos ${lista.length}`], ['al-dia', `Al día ${n((a) => !debe(a))}`], ['deben', `Deben ${n(debe)}`]]
        .map(([k, t]) => `<button type="button" class="filtro ${filtro === k ? 'activo' : ''}" data-f="${k}">${t}</button>`).join('');
      const visibles = lista
        .filter((a) => filtro === 'todos' || (filtro === 'deben') === debe(a))
        .filter((a) => !texto || U.normalizar(`${a.nombre} ${a.dni}`).includes(texto))
        .sort(porNombre);
      $('#filas').innerHTML = visibles.map((a) => {
        const est = U.estadoCuota(a.vence);
        const wa = U.linkWhatsapp(a.telefono, mensajeWhatsapp(a, est));
        return `<tr class="clic" data-dni="${esc(a.dni)}"><td><div class="fila">${avatar(a.nombre)}<div class="datos"><strong>${esc(a.nombre)}</strong><small class="t-num">DNI ${esc(a.dni)}</small></div></div></td>
          <td>${esc(nombresActividades(a.actividades)) || '—'}</td><td class="t-suave">${esc(nombreRutina(a.rutinaId))}</td>
          <td class="t-suave">${ultimaVez(fechaUltima(filas, a.dni))}</td><td class="t-num">${U.fechaNum(a.vence)}</td><td>${chipCuota(est)}</td>
          <td>${wa ? `<a class="btn btn-secundario btn-chico" href="${esc(wa)}" target="_blank" rel="noopener">WhatsApp</a>` : '<span class="t-tenue">Sin celular</span>'}</td></tr>`;
      }).join('') || `<tr><td colspan="7">${lista.length ? 'Nadie coincide con la búsqueda.' : 'Todavía no cargaste alumnos. Empezá con “Nuevo alumno”.'}</td></tr>`;
    }

    const alCambiar = () => { if (location.hash === '#/alumnos') App.enrutar(); else location.hash = '#/alumnos'; };
    const abrirNuevo = () => modalAlumno(null, { alumnos: lista, negocio, rutinas, turnos }, alCambiar);
    $('#filtros').addEventListener('click', (e) => { const b = e.target.closest('[data-f]'); if (b) { filtro = b.dataset.f; pintar(); } });
    $('#buscar').addEventListener('input', (e) => { texto = U.normalizar(e.target.value); pintar(); });
    $('#nuevo').addEventListener('click', abrirNuevo);
    $('#filas').addEventListener('click', (e) => { if (e.target.closest('a')) return; const f = e.target.closest('[data-dni]'); if (f) location.hash = `#/alumnos/${f.dataset.dni}`; });
    $('#al-dia').addEventListener('click', async (e) => {
      const deudores = lista.filter(debe);
      if (!deudores.length) return U.aviso('Ya están todos al día');
      if (!(await U.confirmar(`¿Poner a ${deudores.length} alumno${deudores.length === 1 ? '' : 's'} al día por 1 mes? Corre el vencimiento pero no registra ningún cobro.`, 'Poner al día'))) return;
      conCarga(e.target.closest('button'), async () => {
        for (const a of deudores) a.vence = await Datos.ponerAlDia(a);
        U.aviso('Listo, quedaron al día');
        pintar();
      });
    });
    pintar();
    if (dni === 'nuevo') abrirNuevo();
  }

  // Ficha de un alumno
  async function ficha(cont, dni) {
    const [lista, negocio, rutinas, pagos, turnos] = await Promise.all([Datos.listarAlumnos({ conContacto: true }), Datos.negocio(),
      Datos.listarRutinas(), Datos.pagosDeAlumno(dni), Datos.listarTurnos()]);
    const a = lista.find((x) => x.dni === dni);
    if (!a) { cont.innerHTML = `${cabecera({ titulo: 'No encontramos ese alumno' })}<a class="btn btn-secundario" href="#/alumnos" style="width:max-content">Volver a Alumnos</a>`; return; }
    let mes = U.mesActual();
    const est = U.estadoCuota(a.vence);
    const wa = U.linkWhatsapp(a.telefono, mensajeWhatsapp(a, est));
    const ordenados = pagos.sort((x, y) => y.fecha.localeCompare(x.fecha)).slice(0, 5);
    const rehacer = () => ficha(cont, dni);

    cont.innerHTML = `<div><p class="migas"><a href="#/alumnos">Alumnos</a>${ic('der', 14)}${esc(a.nombre)}</p>
        <div class="cabecera"><h1 class="t-titulo"><span class="fila" style="gap:16px">${avatar(a.nombre, 56)}<span>${esc(a.nombre)}</span></span></h1>
          <div class="fila" style="flex-wrap:wrap;gap:10px">
            ${wa ? `<a class="btn btn-secundario" href="${esc(wa)}" target="_blank" rel="noopener">Mensaje</a>` : ''}
            <button class="btn btn-secundario" id="editar">${ic('editar')}Editar</button>
            <button class="btn btn-peligro" id="borrar">${ic('borrar')}Eliminar alumno</button></div></div>
        <div class="fila" style="flex-wrap:wrap;gap:8px;margin-top:8px"><span class="t-num t-suave">DNI ${esc(a.dni)}</span>${chipCuota(est)}
          ${a.fechaAlta ? `<span class="chip chip-neutro">Alumno desde ${U.fechaNum(a.fechaAlta)}</span>` : ''}</div></div>
      <div class="grilla-auto"><div class="col" style="gap:18px">
        <section class="panel col" style="padding:22px;gap:16px">
          <div class="fila" style="justify-content:space-between"><h2 class="t-titulo">Cuota</h2><span class="t-num" style="font-weight:600">${U.plata(a.monto)}</span></div>
          <p class="t-suave">${esc(est.detalle)}</p>
          <button class="btn btn-primario" id="cobrar">${ic('plata')}Registrar pago</button>
          <div><span class="etq">ÚLTIMOS PAGOS</span>
            ${ordenados.map((p) => `<div class="fila" style="justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--borde2);font-size:13px"><span class="t-num">${U.fechaNum(p.fecha)}</span><span class="t-num" style="font-weight:600">${U.plata(p.monto)}</span>${p.concepto ? `<span class="t-suave">${esc(p.concepto)}</span>` : ''}<span class="t-suave">vence <span class="t-num">${U.fechaNum(p.venceNuevo)}</span></span></div>`).join('') || '<p class="t-tenue" style="padding:10px 0">Todavía no hay pagos.</p>'}
          </div></section>
        <section class="panel col" style="padding:22px;gap:14px" id="caja-calendario"></section></div>
      <div class="col" style="gap:18px">
        <section class="panel col" style="padding:22px;gap:12px"><h2 class="t-titulo">Actividades</h2>
          <p>${esc(nombresActividades(a.actividades)) || 'Sin actividad'}</p>
          ${turnos.filter((t) => (a.turnos || []).includes(t.id)).map((t) => `<p class="t-suave">${esc(nombreActividad(t.actividad))}: ${esc(textoTurno(t))}</p>`).join('')}
          ${a.telefono ? `<p class="t-suave">Celular: <span class="t-num">${esc(a.telefono)}</span></p>` : ''}
          ${a.notas ? `<p class="t-suave">${esc(a.notas)}</p>` : ''}</section>
        <section class="panel col" style="padding:22px;gap:12px" ${usaRutinas(a.actividades) ? '' : 'hidden'}><h2 class="t-titulo">Rutina</h2>
          ${campo('Rutina asignada', `<select class="input select" id="rutina"><option value="">Sin rutina</option>${rutinas.map((r) => `<option value="${esc(r.id)}" ${r.id === a.rutinaId ? 'selected' : ''}>${esc(r.nombre)}</option>`).join('')}</select>`)}
          ${a.rutinaId ? `<a class="btn btn-secundario" href="#/rutinas/${esc(a.rutinaId)}">Ver rutina</a>` : ''}</section></div></div>`;

    async function pintarCalendario() {
      const filas = await Datos.presencias(`${mes}-01`, `${mes}-31`);
      const dias = new Set(filas.filter((f) => f.dni === dni).map((f) => f.fecha));
      const [anio, m] = mes.split('-').map(Number);
      const huecos = (new Date(anio, m - 1, 1).getDay() + 6) % 7;
      const total = new Date(anio, m, 0).getDate();
      const hoy = U.hoy();
      const celdas = Array.from({ length: total }, (_, i) => {
        const fecha = `${mes}-${String(i + 1).padStart(2, '0')}`;
        return `<span class="${dias.has(fecha) ? 'vino' : ''} ${fecha === hoy ? 'hoy' : ''}">${i + 1}</span>`;
      }).join('');
      $('#caja-calendario').innerHTML = `<div class="fila" style="justify-content:space-between"><h2 class="t-titulo">Asistencia · ${esc(U.nombreMes(mes))}</h2>
          <div class="fila" style="gap:4px"><span class="t-num t-suave" style="margin-right:8px">${dias.size} día${dias.size === 1 ? '' : 's'}</span>
          <button class="btn btn-fantasma btn-icono" id="mes-antes" aria-label="Mes anterior">${ic('izq')}</button>
          <button class="btn btn-fantasma btn-icono" id="mes-despues" aria-label="Mes siguiente" ${mes >= U.mesActual() ? 'disabled' : ''}>${ic('der')}</button></div></div>
        <div class="calendario">${['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d) => `<span class="cab">${d}</span>`).join('')}${'<span></span>'.repeat(huecos)}${celdas}</div>`;
      const mover = (n) => { mes = U.sumarMeses(`${mes}-01`, n).slice(0, 7); pintarCalendario(); };
      $('#mes-antes').addEventListener('click', () => mover(-1));
      $('#mes-despues').addEventListener('click', () => mover(1));
    }

    $('#editar').addEventListener('click', () => modalAlumno(a, { alumnos: lista, negocio, rutinas, turnos }, rehacer));
    $('#cobrar').addEventListener('click', () => modalCobro(a, negocio, rehacer));
    $('#rutina').addEventListener('change', async (e) => {
      try { await Datos.asignarRutina(dni, e.target.value); U.aviso('Rutina asignada'); rehacer(); }
      catch (err) { U.aviso(err.message, 'error', 5000); }
    });
    $('#borrar').addEventListener('click', async (e) => {
      if (!(await U.confirmar(`¿Eliminar a ${a.nombre}? Se pierde su ficha (los cobros ya registrados quedan).`, 'Eliminar'))) return;
      conCarga(e.target.closest('button'), async () => {
        await Datos.borrarAlumno(dni);
        U.aviso('Alumno eliminado');
        location.hash = '#/alumnos';
      });
    });
    await pintarCalendario();
  }

  // Alumnos del profe: solo los de sus actividades, sin datos de contacto.
  async function misAlumnos(cont) {
    const { sesion } = estado;
    const [lista, turnos] = await Promise.all([Datos.listarAlumnos(), turnosVisibles()]);
    const propios = lista.filter((a) => (a.actividades || []).some((x) => sesion.actividades.includes(x))).sort(porNombre);
    const turnosDe = (a) => turnos.filter((t) => (a.turnos || []).includes(t.id));
    cont.innerHTML = `${cabecera({ titulo: 'Mis alumnos', sub: nombresActividades(sesion.actividades) })}
      <section class="panel" style="overflow:hidden">${propios.map((a) => `<div class="lista-fila" style="cursor:default">${avatar(a.nombre)}
        <div class="datos"><strong>${esc(a.nombre)}</strong><small>${esc(nombresActividades((a.actividades || []).filter((x) => sesion.actividades.includes(x))))}</small>
          ${turnosDe(a).length ? `<small>${esc(turnosDe(a).map(textoTurno).join(' · '))}</small>` : ''}</div></div>`).join('') || panelVacio('Todavía no hay alumnos en tus actividades.')}</section>`;
  }

  // ---------------------------------------------------------------------
  // Precios y combos
  // ---------------------------------------------------------------------
  async function precios(cont) {
    const negocio = await Datos.negocio();
    const combos = (negocio.combos || []).map((c) => ({ ...c }));
    cont.innerHTML = `${cabecera({ titulo: 'Precios', sub: 'Valor por mes de cada actividad y combo.' })}
      <form id="f-precios" class="grilla-auto">
      <section class="panel col" style="padding:22px;gap:14px"><h2 class="t-titulo">Precio por actividad</h2>
        ${CONFIG.actividades.map((a) => campo(`${a.nombre} ($)`, `<input class="input t-num" inputmode="numeric" name="precio-${a.id}" value="${esc(negocio.precios[a.id] || '')}">`)).join('')}
      </section>
      <section class="panel col" style="padding:22px;gap:14px"><h2 class="t-titulo">Combos</h2>
        <p class="t-suave">Si un alumno hace justo esas actividades, paga el precio del combo.</p>
        <div id="lista-combos" class="col"></div>
        <button type="button" class="btn btn-secundario" id="nuevo-combo">${ic('mas')}Agregar combo</button>
        <button class="btn btn-primario" id="guardar-precios">Guardar precios</button>
      </section></form>`;

    function leerCombos() {
      $$('.combo', cont).forEach((el, i) => {
        combos[i].nombre = $('[data-c=nombre]', el).value.trim();
        combos[i].precio = Number(U.soloDigitos($('[data-c=precio]', el).value)) || 0;
        combos[i].actividades = leerEleccion(el, `combo-${i}`);
      });
    }

    function pintarCombos() {
      $('#lista-combos').innerHTML = combos.map((c, i) => `<div class="combo tarjeta col" style="padding:14px">
        ${campo('Nombre del combo', `<input class="input" data-c="nombre" value="${esc(c.nombre)}">`)}
        ${campo('Incluye', eleccionActividades(`combo-${i}`, c.actividades))}
        ${campo('Precio ($)', `<input class="input t-num" data-c="precio" inputmode="numeric" value="${esc(c.precio || '')}">`)}
        <button type="button" class="btn btn-peligro btn-chico" data-quitar="${i}">Quitar combo</button>
      </div>`).join('') || '<p class="t-tenue">Todavía no hay combos.</p>';
    }

    $('#lista-combos').addEventListener('click', (e) => {
      const b = e.target.closest('[data-quitar]');
      if (!b) return;
      leerCombos();
      combos.splice(Number(b.dataset.quitar), 1);
      pintarCombos();
    });
    $('#nuevo-combo').addEventListener('click', () => {
      leerCombos();
      combos.push({ id: crypto.randomUUID(), nombre: '', actividades: [], precio: 0 });
      pintarCombos();
    });
    pintarCombos();

    const f = $('#f-precios');
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      leerCombos();
      if (combos.some((c) => !c.nombre || c.actividades.length < 2)) return U.aviso('Cada combo necesita nombre y al menos 2 actividades', 'error');
      const valores = {};
      for (const a of CONFIG.actividades) valores[a.id] = Number(U.soloDigitos(f[`precio-${a.id}`].value)) || 0;
      conCarga($('#guardar-precios'), async () => {
        const cambiados = await Datos.aplicarPrecios({ ...negocio, precios: valores, combos });
        U.aviso(cambiados ? `Precios guardados. Se actualizó la cuota de ${cambiados} alumno${cambiados === 1 ? '' : 's'}.` : 'Precios guardados');
      });
    });
  }

  // ---------------------------------------------------------------------
  // Cuadro del mes
  // ---------------------------------------------------------------------
  async function cuadro(cont) {
    let mes = U.mesActual();
    const [lista, negocio, equipo] = await Promise.all([Datos.listarAlumnos(), Datos.negocio(), Datos.listarEquipo()]);

    async function pintar() {
      const [pagos, asistencias, pagosProfes] = await Promise.all([Datos.pagosDelMes(mes), Datos.asistenciasDelMes(mes), Datos.listarPagosProfes()]);
      const filas = Cuentas.cuadro({ mes, alumnos: lista, pagos, asistencias, pagosProfes, negocio, equipo });
      const suma = (c) => filas.reduce((t, f) => t + f[c], 0);
      const delMes = pagosProfes.filter((p) => p.periodo === mes).sort((a, b) => b.fecha.localeCompare(a.fecha));

      cont.innerHTML = `${cabecera({ titulo: 'Cuadro de actividades', acciones: `<div class="campo"><label>Mes</label><input class="input t-num" type="month" id="mes" value="${mes}" max="${U.mesActual()}" style="width:170px"></div>` })}
        <section class="resumen">
          ${dato({ titulo: 'Cobrado', icono: 'plata', numero: U.plata(suma('recaudado')) })}
          ${dato({ titulo: 'A profes', icono: 'profes', numero: U.plata(suma('aPagar')) })}
          ${dato({ titulo: 'Queda', icono: 'tendencia', numero: U.plata(suma('recaudado') - suma('aPagar')), color: 'c-verde' })}
        </section>
        <section class="panel tabla-caja"><table class="tabla">
          <thead><tr><th>Actividad</th><th>Alumnos</th><th>Vinieron</th><th>Asist.</th><th>Cobrado</th></tr></thead>
          <tbody>${filas.map((f) => `<tr><td>${esc(f.nombre)}</td><td class="t-num">${f.inscriptos}</td><td class="t-num">${f.vinieron}</td><td class="t-num">${f.asistencias}</td><td class="t-num">${U.plata(f.recaudado)}</td></tr>`).join('')}</tbody>
        </table></section>
        <h2 class="t-titulo" style="font-size:18px">Pago a profes · ${esc(U.nombreMes(mes))}</h2>
        <div class="grilla-auto">${filas.map((f) => `<article class="panel col" style="padding:18px;gap:12px" data-act="${f.id}">
          <div class="fila" style="justify-content:space-between"><strong>${esc(f.nombre)}</strong><span class="t-tenue" style="font-size:12px">${esc(f.profes.map((p) => p.nombre).join(', ')) || 'Sin profe'}</span></div>
          <div class="fila" style="justify-content:space-between"><span class="t-suave">Porcentaje del profe</span><span class="fila" style="gap:6px"><input class="input t-num" style="width:76px;height:36px" type="number" min="0" max="100" inputmode="numeric" data-pct value="${f.porcentaje}"> %</span></div>
          <div class="dos-columnas" style="font-size:13px">
            <div><span class="etq">Corresponde</span><div class="t-num">${U.plata(f.aPagar)}</div></div>
            <div><span class="etq">Pagado</span><div class="t-num">${U.plata(f.pagado)}</div></div>
            <div><span class="etq">Falta</span><div class="t-num ${f.saldo > 0 ? 'c-rojo' : 'c-verde'}">${U.plata(f.saldo)}</div></div>
            <div><span class="etq">Último pago</span><div class="t-num">${f.ultimo ? U.fechaNum(f.ultimo) : 'Nunca'}</div></div>
          </div>
          <button class="btn btn-secundario btn-chico" data-pagar ${f.profes.length ? '' : 'disabled'}>Registrar pago</button>
        </article>`).join('')}</div>
        <section class="panel" style="overflow:hidden"><div class="panel-cab"><h2 class="t-titulo">Pagos registrados</h2></div>
          ${delMes.map((p) => `<div class="lista-fila" style="cursor:default"><div class="datos"><strong>${esc(p.profeNombre)}</strong><small>${esc(nombreActividad(p.actividad))} · ${U.fechaNum(p.fecha)}</small></div><strong class="t-num">${U.plata(p.monto)}</strong></div>`).join('') || panelVacio('No hay pagos a profes este mes.')}</section>`;

      $('#mes').addEventListener('change', (e) => { if (e.target.value) { mes = e.target.value; pintar(); } });
      $$('[data-pct]', cont).forEach((i) => i.addEventListener('change', async () => {
        const id = i.closest('[data-act]').dataset.act;
        negocio.porcentajes = { ...negocio.porcentajes, [id]: Math.min(100, Math.max(0, Number(i.value) || 0)) };
        try { await Datos.guardarNegocio(negocio); U.aviso('Porcentaje guardado'); await pintar(); }
        catch (e) { U.aviso(e.message, 'error', 5000); }
      }));
      $$('[data-pagar]', cont).forEach((b) => b.addEventListener('click', () => modalPagoProfe(filas.find((f) => f.id === b.closest('[data-act]').dataset.act))));
    }

    function modalPagoProfe(fila) {
      const d = U.modal(`<form class="modal-cuerpo">
        <h2 class="t-titulo">Pagar ${esc(fila.nombre)}</h2>
        ${campo('Profe', `<select class="input select" name="profe">${fila.profes.map((p) => `<option value="${esc(p.dni)}">${esc(p.nombre)}</option>`).join('')}</select>`)}
        <div class="dos-columnas">
          ${campo('Monto ($)', `<input class="input t-num" name="monto" inputmode="numeric" required value="${Math.max(0, fila.saldo) || ''}">`)}
          ${campo('Fecha de pago', `<input class="input t-num" name="fecha" type="date" required value="${U.hoy()}" max="${U.hoy()}">`)}
        </div>
        <div class="acciones"><button type="button" class="btn btn-fantasma" data-cerrar>Cancelar</button>
        <button class="btn btn-primario">Registrar</button></div></form>`);
      const f = $('form', d);
      f.addEventListener('submit', (e) => {
        e.preventDefault();
        const monto = Number(U.soloDigitos(f.monto.value)) || 0;
        if (!monto) return U.aviso('Poné el monto', 'error');
        const profe = fila.profes.find((p) => p.dni === f.profe.value);
        conCarga($('.btn-primario', f), async () => {
          await Datos.registrarPagoProfe({ profeDni: profe.dni, profeNombre: profe.nombre, actividad: fila.id, periodo: mes, monto, fecha: f.fecha.value });
          d.close();
          U.aviso('Pago registrado');
          await pintar();
        });
      });
    }

    await pintar();
  }

  // ---------------------------------------------------------------------
  // Profes
  // ---------------------------------------------------------------------
  async function profes(cont) {
    const equipo = await Datos.listarEquipo();

    function pintar() {
      cont.innerHTML = `${cabecera({ titulo: 'Profes', sub: 'Cada profe entra con su DNI y ve solo sus actividades.', acciones: `<button class="btn btn-primario" id="nuevo">${ic('mas')}Nuevo profe</button>` })}
        <section class="panel" style="overflow:hidden"><div class="panel-cab"><h2 class="t-titulo">Con acceso</h2><span class="chip chip-neutro t-num">${equipo.length + 1}</span></div>
          <div class="lista-fila" style="cursor:default">${avatar('Dueño Gimnasio')}<div class="datos"><strong>Dueño del gimnasio</strong><small>Entra con DNI y contraseña</small></div><span class="chip chip-acento">Todo</span></div>
          ${equipo.sort(porNombre).map((p) => `<div class="lista-fila" style="cursor:default" data-dni="${esc(p.dni)}">${avatar(p.nombre)}
            <div class="datos"><strong>${esc(p.nombre)}</strong><small class="t-num">DNI ${esc(p.dni)}</small><small>${esc(nombresActividades(p.actividades)) || 'Sin actividades'}</small></div>
            <button class="btn btn-fantasma btn-chico" data-editar>Editar</button></div>`).join('')}</section>`;
      $('#nuevo').addEventListener('click', () => modalProfe(null));
      $$('[data-editar]', cont).forEach((b) => b.addEventListener('click', () => modalProfe(equipo.find((p) => p.dni === b.closest('[data-dni]').dataset.dni))));
    }

    function modalProfe(p) {
      const nuevo = !p;
      p = p || { dni: '', nombre: '', actividades: [] };
      const d = U.modal(`<form class="modal-cuerpo">
        <h2 class="t-titulo">${nuevo ? 'Nuevo profe' : 'Editar profe'}</h2>
        ${campo('Nombre y apellido', `<input class="input" name="nombre" required value="${esc(p.nombre)}">`)}
        ${campo('DNI', `<input class="input t-num" name="dni" required inputmode="numeric" value="${esc(p.dni)}" ${nuevo ? '' : 'disabled'}>`)}
        ${campo('Actividades que da', eleccionActividades('act', p.actividades))}
        <div class="acciones">
          ${nuevo ? '' : '<button type="button" class="btn btn-peligro" id="borrar">Quitar acceso</button>'}
          <button type="button" class="btn btn-fantasma" data-cerrar>Cancelar</button>
          <button class="btn btn-primario">Guardar</button></div></form>`);
      const f = $('form', d);
      f.addEventListener('submit', (e) => {
        e.preventDefault();
        const dni = nuevo ? U.soloDigitos(f.dni.value) : p.dni;
        const elegidas = leerEleccion(f, 'act');
        if (!dni) return U.aviso('El DNI es obligatorio', 'error');
        if (CONFIG.dnisDueno.includes(dni)) return U.aviso('Ese DNI es del dueño', 'error');
        if (nuevo && equipo.some((x) => x.dni === dni)) return U.aviso('Ya hay un profe con ese DNI', 'error');
        if (!elegidas.length) return U.aviso('Elegí al menos una actividad', 'error');
        const datos = { dni, nombre: f.nombre.value.trim(), actividades: elegidas };
        conCarga($('.btn-primario', f), async () => {
          await Datos.guardarProfe(datos, nuevo);
          if (nuevo) equipo.push(datos); else Object.assign(p, datos);
          d.close();
          U.aviso(nuevo ? 'Profe agregado' : 'Cambios guardados');
          pintar();
        });
      });
      const borrar = $('#borrar', d);
      if (borrar) borrar.addEventListener('click', async () => {
        if (!(await U.confirmar(`¿Quitarle el acceso a ${p.nombre}?`, 'Quitar'))) return;
        await conCarga(borrar, async () => {
          await Datos.borrarProfe(p.dni);
          equipo.splice(equipo.indexOf(p), 1);
          d.close();
          U.aviso('Profe quitado');
          pintar();
        });
      });
    }

    pintar();
  }

  return { mensajeWhatsapp, inicio, asistencia, actividades, alumnos, misAlumnos, precios, cuadro, profes };
})();
