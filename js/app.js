/**
 * app.js — Arranque, entrada por DNI y menú.
 * -----------------------------------------------------------------------
 * Hay una sola entrada: se pone el DNI y la app sabe quién es.
 *   Dueño   DNI + contraseña. Ve todo.
 *   Profe   DNI. Ve solo sus actividades, rutinas, ejercicios y clases.
 *   Alumno  DNI. Ve su cuota y su rutina del día.
 *
 * Las secciones van en el # de la dirección: #/alumnos, #/alumnos/30111222…
 */

const App = (() => {
  const { $, $$, esc, ic } = U;
  const { estado, conCarga, campo, logoGym, aplicarMarca, avatar } = UI;
  const raiz = () => $('#app');
  let pedidoInstalar = null;

  const SECCIONES = [
    { id: 'inicio', nombre: 'Inicio', icono: 'inicio', ver: Panel.inicio, solo: 'dueno' },
    { id: 'actividades', nombre: 'Actividades', icono: 'clases', ver: Panel.actividades, solo: 'dueno' },
    { id: 'alumnos', nombre: 'Alumnos', icono: 'alumnos', ver: Panel.alumnos, solo: 'dueno' },
    { id: 'asistencia', nombre: 'Asistencia', icono: 'calendario', ver: Panel.asistencia },
    { id: 'rutinas', nombre: 'Rutinas', icono: 'rutinas', ver: Rutinas.rutinas },
    { id: 'ejercicios', nombre: 'Ejercicios', icono: 'pesa', ver: Rutinas.ejercicios },
    { id: 'clases', nombre: 'Clases', icono: 'tabla', ver: Clases.clases, activa: () => estado.gym.clasesActivas },
    { id: 'precios', nombre: 'Precios', icono: 'plata', ver: Panel.precios, solo: 'dueno' },
    { id: 'cuadro', nombre: 'Cuadro', icono: 'tendencia', ver: Panel.cuadro, solo: 'dueno' },
    { id: 'profes', nombre: 'Profes', icono: 'profes', ver: Panel.profes, solo: 'dueno' },
    { id: 'ajustes', nombre: 'Ajustes del gimnasio', icono: 'ajustes', ver: Ajustes.ajustes, solo: 'dueno' },
  ];

  const seccionesDe = (rol) => SECCIONES.filter((s) => (!s.solo || s.solo === rol) && (!s.activa || s.activa()));

  async function iniciar() {
    window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); pedidoInstalar = e; });
    Datos.iniciar();
    try { estado.gym = await Datos.publico(); }
    catch (e) { console.error(e); return mostrarError(e); }
    aplicarMarca();
    window.addEventListener('hashchange', enrutar);
    Datos.onSesion((s) => { estado.sesion = s; enrutar(); });
  }

  function mostrarError(e) {
    raiz().innerHTML = `<main class="entrada"><div class="tarjeta col" style="padding:22px"><h2 class="t-titulo">Algo salió mal</h2>
      <p class="t-suave">${esc(e.message)}</p><button class="btn btn-primario" onclick="location.reload()">Reintentar</button></div></main>`;
  }

  async function enrutar() {
    document.querySelectorAll('dialog[open]').forEach((d) => d.close());
    const [seccion, param] = location.hash.slice(2).split('/');
    try {
      if (seccion === 'instalar') return vistaInstalar();
      const { sesion } = estado;
      if (!sesion) return vistaDni();
      if (sesion.rol === 'alumno') return await VistaAlumno.mostrar(raiz(), sesion);
      const lista = seccionesDe(sesion.rol);
      const activa = lista.find((s) => s.id === seccion) || lista[0];
      pintarMenu(lista, activa);
      const cont = $('#contenido');
      await activa.ver(cont, param);
    } catch (e) {
      console.error(e);
      mostrarError(e);
    }
  }

  // ---------------------------------------------------------------------
  // Menú
  // ---------------------------------------------------------------------
  function pintarMenu(lista, activa) {
    const { sesion } = estado;
    const persona = sesion.rol === 'dueno' ? 'Dueño del gimnasio' : sesion.nombre;
    raiz().innerHTML = `<div class="escritorio"><aside class="lateral">
        <div class="fila" style="gap:12px;padding:4px 6px"><span id="marca-logo">${logoGym(42)}</span>
          <div style="min-width:0"><div id="marca-nombre" style="font-weight:600;font-size:15px">${esc(estado.gym.nombre)}</div>
            <div class="t-tenue" style="font-size:12px">con <span class="marca-gymapp" style="font-size:12px">gym<b>App</b></span></div></div>
          <button class="btn btn-fantasma btn-icono salir-tel" data-salir aria-label="Cerrar sesión">${ic('salir')}</button></div>
        <nav class="col" style="gap:2px" aria-label="Secciones del panel">${lista.map((s) => `<a href="#/${s.id}" class="nav-item ${s === activa ? 'activo' : ''}">${ic(s.icono, 20)}<span style="flex:1">${esc(s.nombre)}</span></a>`).join('')}</nav>
        <div class="fila pie-lateral" style="margin-top:auto;gap:10px;padding:12px 8px 0;border-top:1px solid var(--borde2)">${avatar(persona)}
          <div style="flex:1;min-width:0"><div style="font-weight:600;font-size:13px">${esc(persona)}</div><div class="t-tenue" style="font-size:12px">${sesion.rol === 'dueno' ? 'Administrador' : 'Profe'}</div></div>
          <button class="btn btn-fantasma btn-icono" data-salir aria-label="Cerrar sesión">${ic('salir')}</button></div>
      </aside><main class="contenido entra" id="contenido"><p class="cargando">Cargando…</p></main></div>`;
    $$('[data-salir]').forEach((b) => b.addEventListener('click', () => Datos.salir().then(() => { location.hash = ''; })));
    $('.nav-item.activo')?.scrollIntoView({ block: 'nearest', inline: 'center' });
    window.scrollTo(0, 0);
  }

  // Actualiza logo y nombre del menú sin volver a pintar la sección.
  function pintarMarca() {
    const logo = $('#marca-logo');
    if (logo) logo.innerHTML = logoGym(42);
    const nombre = $('#marca-nombre');
    if (nombre) nombre.textContent = estado.gym.nombre;
    const clases = $$('.nav-item').some((a) => a.getAttribute('href') === '#/clases');
    if (clases !== Boolean(estado.gym.clasesActivas)) enrutar();
  }

  // ---------------------------------------------------------------------
  // Entrada única por DNI
  // ---------------------------------------------------------------------
  function marcoIngreso(contenido) {
    raiz().innerHTML = `<main class="entrada entra">
      <div class="entrada-marca">${logoGym(72)}<h1 class="t-titulo">${esc(estado.gym.nombre)}</h1>
        <span class="t-tenue" style="font-size:12px">con <span class="marca-gymapp">gym<b>App</b></span></span></div>
      ${contenido}
      ${Datos.modo === 'demo' ? `<p class="demo-nota"><strong>Modo demo</strong>. Dueño <code>20111222</code> (<code>demo1234</code>) · Profe <code>27333444</code> · Alumno <code>28999111</code><br><button class="link" id="reiniciar-demo">Reiniciar demo</button></p>` : ''}
    </main>`;
    const r = $('#reiniciar-demo');
    if (r) r.addEventListener('click', () => Datos.reiniciarDemo());
  }

  function vistaDni(error = '') {
    marcoIngreso(`<form class="col" id="f-dni">
      <p class="t-suave" style="text-align:center">Entrá con tu DNI</p>
      ${campo('DNI', '<input class="input t-num" name="dni" inputmode="numeric" autocomplete="off" required autofocus placeholder="Sin puntos ni espacios">')}
      ${error ? `<p class="error">${esc(error)}</p>` : ''}
      <button class="btn btn-primario btn-ancho">Entrar ${ic('der')}</button></form>
      <a class="btn btn-secundario" href="#/instalar" style="width:100%">${ic('celular')}Instalar la app</a>`);
    const f = $('#f-dni');
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const dni = U.soloDigitos(f.dni.value);
      if (!dni) return;
      conCarga($('button', f), async () => {
        const quien = await Datos.identificar(dni);
        if (!quien.opciones.length) return vistaDni('No encontramos ese DNI. Consultá en el gimnasio.');
        if (quien.opciones.length === 1) return entrarComo(quien.opciones[0], dni, quien);
        vistaElegir(dni, quien);
      });
    });
  }

  function vistaElegir(dni, quien) {
    const TEXTOS = { dueno: 'Panel del dueño', profe: 'Panel de profe', alumno: 'Mi rutina y cuota' };
    marcoIngreso(`<div class="col"><p class="t-suave" style="text-align:center">¿Cómo querés entrar?</p>
      ${quien.opciones.map((o) => `<button class="btn btn-secundario btn-ancho" data-o="${o}">${TEXTOS[o]}</button>`).join('')}
      <button class="link" id="volver">Volver</button></div>`);
    $$('[data-o]').forEach((b) => b.addEventListener('click', () => conCarga(b, () => entrarComo(b.dataset.o, dni, quien))));
    $('#volver').addEventListener('click', () => vistaDni());
  }

  async function entrarComo(opcion, dni, quien) {
    if (opcion === 'dueno') return quien.tieneClave ? vistaClave(dni) : vistaCrearClave(dni);
    if (opcion === 'profe') return Datos.entrarProfe(dni);
    const alumno = await Datos.obtenerAlumno(dni);
    Datos.entrarAlumno(dni, alumno.nombre);
  }

  function vistaClave(dni) {
    marcoIngreso(`<form class="col" id="f-clave">
      <p class="t-suave" style="text-align:center">DNI ${esc(dni)}</p>
      ${campo('Contraseña', '<input class="input" name="clave" type="password" autocomplete="current-password" required autofocus>')}
      <button class="btn btn-primario btn-ancho">Entrar al panel</button>
      <button type="button" class="link" id="volver">Volver</button></form>`);
    const f = $('#f-clave');
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      conCarga($('.btn-primario', f), () => Datos.entrarDueno(dni, f.clave.value));
    });
    $('#volver').addEventListener('click', () => vistaDni());
  }

  function vistaCrearClave(dni) {
    marcoIngreso(`<form class="col" id="f-crear">
      <p class="t-suave" style="text-align:center">Primera vez: creá tu contraseña de dueño.</p>
      ${campo('Contraseña nueva', '<input class="input" name="clave" type="password" autocomplete="new-password" required autofocus>', `Al menos ${Ajustes.CLAVE_MINIMA} caracteres.`)}
      ${campo('Repetí la contraseña', '<input class="input" name="repetida" type="password" autocomplete="new-password" required>')}
      <button class="btn btn-primario btn-ancho">Guardar y entrar</button>
      <button type="button" class="link" id="volver">Volver</button></form>`);
    const f = $('#f-crear');
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const problema = Ajustes.problemaClave(f.clave.value, f.repetida.value, dni);
      if (problema) return U.aviso(problema, 'error');
      conCarga($('.btn-primario', f), () => Datos.crearClaveDueno(dni, f.clave.value));
    });
    $('#volver').addEventListener('click', () => vistaDni());
  }

  // ---------------------------------------------------------------------
  // Instalar la app
  // ---------------------------------------------------------------------
  function vistaInstalar() {
    const volver = estado.sesion ? '#/' : '#';
    raiz().innerHTML = `<main class="entrada entra" style="justify-content:flex-start">
      <div class="entrada-marca">${logoGym(64)}<h1 class="t-titulo">Tené tu rutina siempre a mano</h1>
        <p class="t-suave">No ocupa lugar y se actualiza sola.</p></div>
      ${pedidoInstalar ? '<button class="btn btn-primario btn-ancho" id="instalar">Instalar la app ahora</button>' : ''}
      <section class="panel col" style="padding:18px;gap:8px;width:100%"><h2 class="t-titulo">Android</h2>
        <p class="t-suave">1. Abrí el link del gimnasio en Google Chrome.</p>
        <p class="t-suave">2. Tocá los tres puntitos de arriba.</p>
        <p class="t-suave">3. Tocá “Instalar app” o “Agregar a la pantalla principal”.</p></section>
      <section class="panel col" style="padding:18px;gap:8px;width:100%"><h2 class="t-titulo">iPhone</h2>
        <p class="t-suave">1. Abrí el link del gimnasio en Safari.</p>
        <p class="t-suave">2. Tocá Compartir.</p>
        <p class="t-suave">3. Bajá y tocá “Agregar a inicio”.</p></section>
      <a class="btn btn-secundario" href="${volver}" style="width:100%">Volver</a></main>`;
    const b = $('#instalar');
    if (b) b.addEventListener('click', async () => { pedidoInstalar.prompt(); await pedidoInstalar.userChoice; pedidoInstalar = null; vistaInstalar(); });
  }

  return { iniciar, enrutar, pintarMarca };
})();

App.iniciar();
