/**
 * vista-alumno.js — Lo que ve el alumno: su cuota y su rutina del día.
 * El alumno no tiene cuenta. Los pesos que anota quedan en su celular.
 */

const VistaAlumno = (() => {
  const { $, $$, esc, ic } = U;
  const { estado, nombresActividades, primerNombre, chipCuota, conCarga, logoGym, avatar } = UI;

  let raiz, alumno, rutina, visitas, catalogo, turnos, clases;
  let temporizador = null;

  const clavePesos = () => `fitness-salud-pesos-${alumno.dni}`;
  function leerPesos() {
    try { return JSON.parse(localStorage.getItem(clavePesos())) || {}; } catch { return {}; }
  }
  function guardarPeso(ejId, kg) {
    try { localStorage.setItem(clavePesos(), JSON.stringify({ ...leerPesos(), [ejId]: kg })); } catch { /* sin espacio: no pasa nada */ }
  }

  const hoyRegistrada = () => visitas.find((v) => v.fecha === U.hoy());
  // Toca el día siguiente al último que hizo.
  function diaQueToca() {
    const ultimo = [...visitas].sort((a, b) => b.fecha.localeCompare(a.fecha))[0];
    if (!ultimo?.dia) return 1;
    return (ultimo.dia % rutina.dias.length) + 1;
  }

  const marco = (contenido) => {
    raiz.innerHTML = `<div class="telefono"><header class="alumno-cab telefono-cab">${logoGym(40)}
        <div class="datos"><strong>${esc(estado.gym.nombre)}</strong><small>${esc(alumno.nombre)}</small></div>
        <button class="btn btn-fantasma btn-icono" id="salir" aria-label="Salir">${ic('salir')}</button></header>
      <main class="alumno-cuerpo entra">${contenido}</main></div>`;
    $('#salir').addEventListener('click', () => Datos.salir());
    window.scrollTo(0, 0);
  };

  function pintarInicio() {
    const est = U.estadoCuota(alumno.vence);
    const wa = U.linkWhatsapp(estado.gym.whatsapp, `Hola! Soy ${alumno.nombre}, te escribo por mi cuota.`);
    const mes = U.mesActual();
    const delMes = visitas.filter((v) => v.fecha.startsWith(mes)).length;
    const ultima = [...visitas].sort((a, b) => b.fecha.localeCompare(a.fecha))[0];
    const toca = rutina ? diaQueToca() : 0;

    marco(`<div><p class="t-suave">${esc(U.fechaLarga(U.hoy()))}</p><h1 class="t-titulo" style="font-size:26px">Hola, ${esc(primerNombre(alumno.nombre))}</h1></div>
      <section class="panel col" style="padding:18px;gap:10px">
        <div class="fila" style="justify-content:space-between"><h2 class="t-titulo">Tu cuota</h2>${chipCuota(est)}</div>
        <p class="t-suave">${esc(est.detalle)}</p>
        <div class="fila" style="justify-content:space-between"><span class="t-suave">${esc(nombresActividades(alumno.actividades)) || 'Sin actividad'}</span><strong class="t-num">${U.plata(alumno.monto)}</strong></div>
      </section>
      ${bloqueClases()}
      ${rutina ? `
        <p class="etq">TU RUTINA · ${esc(rutina.nombre.toUpperCase())}</p>
        ${hoyRegistrada() ? `<p class="chip chip-verde" style="height:auto;padding:8px 12px;white-space:normal;align-self:flex-start">${ic('check')}Ya registraste tu asistencia de hoy. ¡Bien ahí!</p>` : `<p class="t-suave">Hoy te toca el Día ${toca}.</p>`}
        <div class="col" style="gap:10px">${rutina.dias.map((d, i) => `<button type="button" class="tarjeta dia-boton ${i + 1 === toca && !hoyRegistrada() ? 'hoy' : ''}" data-dia="${i}">
          ${avatar(`${i + 1}`, 40).replace(/>[^<]*</, `>${i + 1}<`)}
          <div class="datos"><strong>Día ${i + 1}</strong><small>${d.ejercicios.length} ejercicios</small></div>
          ${i + 1 === toca && !hoyRegistrada() ? '<span class="chip chip-acento">Te toca hoy</span>' : ''}${ic('der')}</button>`).join('')}</div>
        <div class="dos-columnas">
          ${UI.dato({ titulo: 'Días este mes', icono: 'fuego', numero: delMes })}
          ${UI.dato({ titulo: 'Última vez', icono: 'reloj', numero: `<span style="font-size:18px">${ultima ? U.fechaNum(ultima.fecha, true) : '—'}</span>` })}
        </div>
        <button class="btn btn-secundario" id="completa">Ver rutina completa</button>
        <button class="btn btn-secundario" id="pdf">${ic('descargar')}Descargar rutina en PDF</button>` : (UI.usaRutinas(alumno.actividades) ? '<p class="t-suave">Todavía no tenés una rutina. Consultá con tu profe.</p>' : '')}
      ${wa ? `<a class="btn btn-primario" href="${esc(wa)}" target="_blank" rel="noopener">Escribirle al gimnasio</a>` : ''}
      <a class="btn btn-fantasma" href="#/instalar">${ic('celular')}Instalar la app</a>`);

    $$('[data-dia]', raiz).forEach((b) => b.addEventListener('click', () => pintarDia(Number(b.dataset.dia))));
    if (rutina) {
      $('#completa').addEventListener('click', pintarCompleta);
      $('#pdf').addEventListener('click', imprimir);
    }
  }

  // Para quien viene a clases: próxima clase, su semana y cuánto vino este mes.
  function proximaClase() {
    const ahora = U.horaAhora();
    const hoy = U.diaTurno(U.hoy());
    const espera = (t) => {
      const d = (t.dia - hoy + 7) % 7;
      return d === 0 && t.hora <= ahora ? 7 : d;
    };
    return [...turnos].sort((a, b) => espera(a) - espera(b) || a.hora.localeCompare(b.hora))[0];
  }

  function bloqueClases() {
    if (!turnos.length) return '';
    const proxima = proximaClase();
    const vino = clases.filter((c) => c.vino).length;
    const orden = [...turnos].sort((a, b) => a.dia - b.dia || a.hora.localeCompare(b.hora));
    return `<section class="panel col" style="padding:18px;gap:10px;border-color:var(--acento2)">
        <span class="etq">PRÓXIMA CLASE</span>
        <h2 class="t-titulo">${esc(UI.nombreActividad(proxima.actividad))}</h2>
        <p class="t-suave">${esc(UI.textoTurno(proxima))}${proxima.profe ? ` · ${esc(proxima.profe)}` : ''}</p></section>
      <section class="panel" style="overflow:hidden"><div class="panel-cab"><h2 class="t-titulo">Mis clases</h2></div>
        ${orden.map((t) => `<div class="lista-fila" style="cursor:default"><div class="datos"><strong>${esc(UI.nombreActividad(t.actividad))}</strong><small>${esc(t.profe) || 'Sin profe'}</small></div><span class="t-num t-suave">${esc(UI.textoTurno(t))}</span></div>`).join('')}</section>
      ${UI.dato({ titulo: 'Clases este mes', icono: 'fuego', numero: `${vino}<span class="t-tenue" style="font-size:18px"> de ${clases.length}</span>`, pie: vino ? '¡Seguí así!' : '' })}`;
  }

  function imagenDe(e) {
    const datos = catalogo.find((x) => x.id === e.ejId);
    return datos?.gif ? `<img src="${esc(datos.gif)}" alt="" loading="lazy">` : '';
  }

  function pintarDia(i) {
    const dia = rutina.dias[i];
    const pesos = leerPesos();
    marco(`<button class="link" id="volver" style="align-self:flex-start;padding-left:0">‹ Volver al inicio</button>
      <div><p class="etq">${esc(rutina.nombre.toUpperCase())}</p><h1 class="t-titulo" style="font-size:26px">Día ${i + 1}</h1></div>
      ${dia.ejercicios.map((e, n) => {
        const series = Math.max(1, parseInt(e.series, 10) || 1);
        return `<article class="tarjeta ej-card" data-ej="${n}">${imagenDe(e)}
          <div><strong>${esc(e.nombre)}</strong><span class="sub">${esc(e.series)} × ${esc(e.reps)}${e.desc ? ` · Descanso ${esc(e.desc)} s` : ''}</span></div>
          <div class="campo" style="max-width:130px"><label>Peso (kg)</label><input class="input t-num" inputmode="decimal" data-peso="${esc(e.ejId)}" value="${esc(pesos[e.ejId] || '')}"></div>
          <div><span class="etq">Series hechas</span><div class="series" style="margin-top:6px">${Array.from({ length: series }, (_, s) => `<button type="button" class="serie" data-desc="${esc(e.desc)}">${s + 1}</button>`).join('')}</div></div>
        </article>`;
      }).join('') || '<p class="t-suave">Este día no tiene ejercicios. Consultá con tu profe.</p>'}
      ${!(alumno.actividades || []).includes('musculacion') ? '<p class="t-tenue" style="font-size:12px;text-align:center">Tu profe te marca la asistencia en clase.</p>' : hoyRegistrada()
        ? `<p class="chip chip-verde" style="height:auto;padding:10px 14px;align-self:center">${ic('check')}Asistencia de hoy registrada</p>`
        : `<button class="btn btn-exito" id="registrar">${ic('check')}Registrar asistencia de hoy</button>
           <p class="t-tenue" style="font-size:12px;text-align:center">Si no terminaste, tu profe te marca la asistencia.</p>`}`);

    $('#volver').addEventListener('click', () => { pararDescanso(); pintarInicio(); });
    $$('[data-peso]', raiz).forEach((c) => c.addEventListener('change', () => guardarPeso(c.dataset.peso, c.value.trim())));
    $$('.serie', raiz).forEach((b) => b.addEventListener('click', () => {
      b.classList.toggle('hecha');
      if (b.classList.contains('hecha')) empezarDescanso(parseInt(b.dataset.desc, 10) || 0);
    }));
    const registrar = $('#registrar');
    if (registrar) registrar.addEventListener('click', () => conCarga(registrar, async () => {
      await Datos.registrarVisita(alumno.dni, i + 1);
      visitas.push({ dni: alumno.dni, fecha: U.hoy(), dia: i + 1, hora: U.horaAhora(), por: 'alumno' });
      U.aviso('¡Listo! Asistencia registrada');
      pararDescanso();
      pintarInicio();
    }));
  }

  function pararDescanso() {
    clearInterval(temporizador);
    temporizador = null;
    $('#descanso')?.remove();
  }

  function sonar() {
    try { navigator.vibrate?.([300, 120, 300]); } catch { /* sin vibración */ }
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      [0, 0.25, 0.5].forEach((t) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.frequency.value = 880;
        g.gain.value = 0.18;
        o.connect(g).connect(ctx.destination);
        o.start(ctx.currentTime + t);
        o.stop(ctx.currentTime + t + 0.15);
      });
    } catch { /* sin sonido */ }
  }

  function empezarDescanso(segundos) {
    pararDescanso();
    if (!segundos) return;
    let queda = segundos;
    const caja = document.createElement('div');
    caja.id = 'descanso';
    caja.className = 'descanso';
    caja.innerHTML = `<span>Descanso <strong class="t-num" id="queda">${queda} s</strong></span><button class="btn btn-fantasma btn-chico" id="saltar">Saltar</button>`;
    document.body.appendChild(caja);
    $('#saltar', caja).addEventListener('click', pararDescanso);
    temporizador = setInterval(() => {
      queda -= 1;
      $('#queda', caja).textContent = `${queda} s`;
      if (queda <= 0) { pararDescanso(); sonar(); U.aviso('¡Listo! A la próxima serie'); }
    }, 1000);
  }

  function pintarCompleta() {
    marco(`<button class="link" id="volver" style="align-self:flex-start;padding-left:0">‹ Volver al inicio</button>
      <h1 class="t-titulo" style="font-size:24px">${esc(rutina.nombre)}</h1>
      ${rutina.dias.map((d, i) => `<section class="panel" style="overflow:hidden"><div class="panel-cab"><h2 class="t-titulo">Día ${i + 1}</h2></div>
        ${d.ejercicios.map((e) => `<div class="lista-fila" style="cursor:default"><div class="datos"><strong>${esc(e.nombre)}</strong></div><span class="t-num t-suave">${esc(e.series)} × ${esc(e.reps)}</span></div>`).join('') || UI.panelVacio('Sin ejercicios.')}</section>`).join('')}`);
    $('#volver').addEventListener('click', pintarInicio);
  }

  // "Guardar como PDF" sale desde la ventana de imprimir del celular.
  function imprimir() {
    const caja = document.createElement('div');
    caja.className = 'solo-impresion';
    caja.innerHTML = `<h1>${esc(rutina.nombre)}</h1><p>${esc(alumno.nombre)} · ${esc(estado.gym.nombre)}</p>
      ${rutina.dias.map((d, i) => `<h2>Día ${i + 1}</h2><table><tr><th>Ejercicio</th><th>Series × reps</th><th>Descanso</th></tr>
        ${d.ejercicios.map((e) => `<tr><td>${esc(e.nombre)}</td><td>${esc(e.series)} × ${esc(e.reps)}</td><td>${esc(e.desc)} s</td></tr>`).join('')}</table>`).join('')}`;
    document.body.appendChild(caja);
    window.addEventListener('afterprint', () => caja.remove(), { once: true });
    window.print();
  }

  async function mostrar(contenedor, sesion) {
    raiz = contenedor;
    alumno = await Datos.obtenerAlumno(sesion.dni);
    const conRutina = alumno.rutinaId && UI.usaRutinas(alumno.actividades);
    const [r, v, c, t] = await Promise.all([conRutina ? Datos.obtenerRutina(alumno.rutinaId) : null,
      conRutina ? Datos.visitasDelAlumno(alumno.dni) : [], conRutina ? Datos.ejercicios() : [],
      Promise.all((alumno.turnos || []).map(Datos.obtenerTurno))]);
    rutina = r;
    visitas = v;
    catalogo = c;
    turnos = t.filter(Boolean);
    clases = await Datos.clasesDelMes(alumno.dni, turnos);
    pintarInicio();
  }

  return { mostrar };
})();
