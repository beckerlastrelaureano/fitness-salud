/**
 * ui.js — Piezas de pantalla que usan todas las secciones.
 */

const UI = (() => {
  const { $$, esc, ic } = U;

  // Datos del gimnasio (nombre, logo, color). Se cargan al abrir la app.
  const estado = { gym: null, sesion: null };

  const nombreActividad = (id) => CONFIG.actividades.find((a) => a.id === id)?.nombre || id;
  const nombresActividades = (ids) => (ids || []).map(nombreActividad).join(' + ');
  const iniciales = (nombre) => (nombre || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
  const porNombre = (a, b) => a.nombre.localeCompare(b.nombre, 'es');
  const primerNombre = (nombre) => (nombre || '').split(' ')[0];

  const CHIP_CUOTA = { 'al-dia': 'chip-verde', 'por-vencer': 'chip-amarillo', vencida: 'chip-rojo', 'sin-pago': 'chip-neutro' };
  const chipCuota = (est) => `<span class="chip ${CHIP_CUOTA[est.clave]}"><span class="punto"></span>${esc(est.texto)}</span>`;

  const avatar = (nombre, tam = 36) =>
    `<div class="avatar" style="width:${tam}px;height:${tam}px;font-size:${Math.round(tam * 0.36)}px">${esc(iniciales(nombre))}</div>`;

  function logoGym(tam = 42) {
    const g = estado.gym;
    const dentro = g.logo ? `<img src="${esc(g.logo)}" alt="">` : esc(iniciales(g.nombre));
    return `<div class="logo-gym" style="width:${tam}px;height:${tam}px;border-radius:${Math.round(tam * 0.28)}px;font-size:${Math.round(tam * 0.36)}px">${dentro}</div>`;
  }

  // Aplica el color y el tema a toda la app.
  function aplicarMarca() {
    const g = estado.gym;
    document.body.style.setProperty('--acento', g.acento);
    document.body.classList.toggle('claro', g.tema === 'claro');
    document.title = g.nombre;
  }

  // Encabezado de cada sección. "migas" es un texto o HTML ya seguro.
  function cabecera({ titulo, migas, sub, acciones = '' }) {
    return `<div class="cabecera"><div>
        <p class="migas">${migas || esc(estado.gym.nombre)}</p>
        <h1 class="t-titulo">${esc(titulo)}</h1>
        ${sub ? `<p class="t-suave" style="margin-top:6px">${esc(sub)}</p>` : ''}
      </div>${acciones ? `<div class="fila" style="flex-wrap:wrap;gap:10px">${acciones}</div>` : ''}</div>`;
  }

  // Deshabilita el botón mientras corre la acción y muestra el error si falla.
  async function conCarga(boton, accion) {
    const texto = boton.innerHTML;
    boton.disabled = true;
    boton.textContent = 'Un momento…';
    try { return await accion(); }
    catch (e) { console.error(e); U.aviso(e.message, 'error', 5000); }
    finally { boton.disabled = false; boton.innerHTML = texto; }
  }

  const campo = (etiqueta, control, ayuda = '') =>
    `<div class="campo"><label>${esc(etiqueta)}</label>${control}${ayuda ? `<small class="t-tenue">${esc(ayuda)}</small>` : ''}</div>`;

  // Elegir una o varias actividades.
  function eleccionActividades(nombre, elegidas = [], actividades = CONFIG.actividades) {
    return `<div class="eleccion">${actividades.map((a) => `<label>
      <input type="checkbox" name="${nombre}" value="${a.id}" ${elegidas.includes(a.id) ? 'checked' : ''}><span class="filtro">${esc(a.nombre)}</span></label>`).join('')}</div>`;
  }
  const leerEleccion = (raiz, nombre) => $$(`input[name="${nombre}"]:checked`, raiz).map((i) => i.value);

  const panelVacio = (texto) => `<p class="vacio-chico">${esc(texto)}</p>`;

  function dato({ titulo, icono, numero, pie, color = '', href }) {
    const dentro = `<span class="dato-titulo">${ic(icono)}${esc(titulo)}</span>
      <span class="dato-num ${color}">${numero}</span>${pie ? `<span class="dato-pie">${esc(pie)}</span>` : ''}`;
    return href ? `<a class="tarjeta dato" href="${href}">${dentro}</a>` : `<div class="tarjeta dato">${dentro}</div>`;
  }

  return { estado, nombreActividad, nombresActividades, iniciales, porNombre, primerNombre, chipCuota, avatar, logoGym,
    aplicarMarca, cabecera, conCarga, campo, eleccionActividades, leerEleccion, panelVacio, dato };
})();
