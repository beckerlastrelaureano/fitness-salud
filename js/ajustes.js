/**
 * ajustes.js — Ajustes del gimnasio: marca, apariencia, link, QR y contraseña.
 * Los cambios de marca se guardan solos.
 */

const Ajustes = (() => {
  const { $, esc, ic } = U;
  const { estado, cabecera, conCarga, campo, logoGym, aplicarMarca } = UI;
  const QR_URL = 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js';
  const CLAVE_MINIMA = 8;

  function problemaClave(clave, repetida, dni) {
    if (clave.length < CLAVE_MINIMA) return `Usá al menos ${CLAVE_MINIMA} caracteres.`;
    if (clave.includes(dni)) return 'La contraseña no puede incluir tu DNI.';
    if (clave !== repetida) return 'Las dos contraseñas no coinciden.';
    return '';
  }

  async function guardar(cambios) {
    const anterior = { ...estado.gym };
    Object.assign(estado.gym, cambios);
    aplicarMarca();
    try {
      await Datos.guardarPublico(estado.gym);
    } catch (e) {
      estado.gym = anterior;
      aplicarMarca();
      U.aviso(e.message, 'error', 5000);
      throw e;
    }
  }

  async function ajustes(cont) {
    const g = estado.gym;
    const enlace = location.href.split(/[?#]/)[0];
    cont.innerHTML = `${cabecera({ titulo: 'Ajustes del gimnasio', sub: 'Los cambios se guardan solos y tus alumnos los ven al instante.' })}
      <div class="grilla-auto"><div class="col" style="gap:18px">
        <section class="panel col" style="padding:22px;gap:16px"><h2 class="t-titulo">Marca</h2>
          <div class="fila" style="gap:16px;flex-wrap:wrap"><div id="logo-vista">${logoGym(64)}</div>
            <div class="datos" style="min-width:170px"><strong>Logo del gimnasio</strong><small>PNG o JPG cuadrado, hasta 300 KB. Se ve en la entrada y el panel.</small></div>
            <label class="btn btn-secundario" style="cursor:pointer">${ic('subir')}Subir logo<input id="logo" type="file" class="oculto" accept="image/png,image/jpeg"></label>
            ${g.logo ? '<button class="btn btn-fantasma" id="quitar-logo">Quitar</button>' : ''}</div>
          <form id="f-nombre" class="fila" style="align-items:flex-end;gap:10px"><div style="flex:1">${campo('Nombre del gimnasio', `<input class="input" name="nombre" required value="${esc(g.nombre)}">`)}</div><button class="btn btn-secundario">Guardar</button></form>
          <div class="campo"><label>COLOR DE ACENTO</label><div class="ajustes-color"><input type="color" id="acento" value="${esc(g.acento)}"><span class="t-num">${esc(g.acento.toUpperCase())}</span></div></div>
        </section>
        <section class="panel col" style="padding:22px;gap:16px"><h2 class="t-titulo">Apariencia y funciones</h2>
          <div class="fila" style="justify-content:space-between;flex-wrap:wrap"><div class="datos" style="min-width:170px"><strong>Tema</strong><small>Oscuro por defecto. El claro se lee mejor al sol.</small></div>
            <div class="segmentos" style="width:180px"><button type="button" class="segmento ${g.tema === 'oscuro' ? 'activo' : ''}" data-tema="oscuro">Oscuro</button><button type="button" class="segmento ${g.tema === 'claro' ? 'activo' : ''}" data-tema="claro">Claro</button></div></div>
          <label class="interruptor"><div class="datos"><strong>Clases grupales</strong><small>Agenda con cupo. Suma la sección “Clases” al panel.</small></div><input type="checkbox" id="clases" ${g.clasesActivas ? 'checked' : ''}></label>
        </section>
        <form class="panel col" id="f-wa" style="padding:22px;gap:14px"><h2 class="t-titulo">WhatsApp del gimnasio</h2>
          <p class="t-suave">Los alumnos lo usan para escribirte.</p>
          ${campo('Celular', `<input class="input" name="whatsapp" inputmode="tel" value="${esc(g.whatsapp)}">`)}
          <button class="btn btn-secundario">Guardar</button></form>
      </div><div class="col" style="gap:18px">
        <section class="panel col" style="padding:22px;gap:16px"><h2 class="t-titulo">Link y QR para tus alumnos</h2>
          <div class="fila" style="gap:20px;flex-wrap:wrap"><img class="qr" id="qr" alt="Código QR de la app">
            <div class="col" style="flex:1;min-width:190px;gap:10px"><span class="t-num" style="overflow-wrap:anywhere;font-size:13px">${esc(enlace)}</span>
              <button class="btn btn-secundario" id="copiar">${ic('copiar')}Copiar</button>
              <a class="btn btn-secundario" id="bajar-qr" download="qr-gimnasio.png">${ic('descargar')}Descargar QR</a>
              <a class="btn btn-fantasma" href="#/instalar">Ver página de instalación</a></div></div>
          <p class="t-tenue" style="font-size:12px">El alumno escanea, pone su DNI y entra.</p></section>
        <form class="panel col" id="f-pass" style="padding:22px;gap:14px"><h2 class="t-titulo">Mi contraseña</h2>
          ${campo('Contraseña actual', '<input class="input" name="actual" type="password" autocomplete="current-password" required>')}
          ${campo('Contraseña nueva', '<input class="input" name="clave" type="password" autocomplete="new-password" required>')}
          ${campo('Repetí la nueva', '<input class="input" name="repetida" type="password" autocomplete="new-password" required>')}
          <button class="btn btn-primario">Cambiar contraseña</button></form>
        ${Datos.modo === 'demo' ? `<section class="panel col" style="padding:22px;gap:12px"><h2 class="t-titulo">Datos de prueba</h2>
          <p class="t-suave">Esta versión guarda todo en este navegador.</p><button class="btn btn-secundario" id="reiniciar">Volver a los datos de ejemplo</button></section>` : ''}
      </div></div>`;

    const rehacer = () => { App.pintarMarca(); ajustes(cont); };
    $('#logo').addEventListener('change', async (e) => {
      if (!e.target.files[0]) return;
      try { await guardar({ logo: await U.leerImagen(e.target.files[0], 300) }); U.aviso('Logo guardado'); rehacer(); }
      catch (err) { U.aviso(err.message, 'error', 5000); }
    });
    const quitar = $('#quitar-logo');
    if (quitar) quitar.addEventListener('click', () => guardar({ logo: null }).then(rehacer).catch(() => {}));
    const fn = $('#f-nombre');
    fn.addEventListener('submit', (e) => {
      e.preventDefault();
      conCarga($('button', fn), async () => { await guardar({ nombre: fn.nombre.value.trim() }); U.aviso('Nombre guardado'); }).then(rehacer);
    });
    $('#acento').addEventListener('input', (e) => document.body.style.setProperty('--acento', e.target.value));
    $('#acento').addEventListener('change', (e) => guardar({ acento: e.target.value }).then(rehacer).catch(() => {}));
    cont.querySelectorAll('[data-tema]').forEach((b) => b.addEventListener('click', () => guardar({ tema: b.dataset.tema }).then(rehacer).catch(() => {})));
    $('#clases').addEventListener('change', (e) => guardar({ clasesActivas: e.target.checked }).then(rehacer).catch(() => {}));
    const fw = $('#f-wa');
    fw.addEventListener('submit', (e) => {
      e.preventDefault();
      conCarga($('button', fw), async () => { await guardar({ whatsapp: fw.whatsapp.value.trim() }); U.aviso('WhatsApp guardado'); });
    });
    const fp = $('#f-pass');
    fp.addEventListener('submit', (e) => {
      e.preventDefault();
      const problema = problemaClave(fp.clave.value, fp.repetida.value, estado.sesion.dni);
      if (problema) return U.aviso(problema, 'error');
      conCarga($('button', fp), async () => {
        await Datos.cambiarClave(estado.sesion.dni, fp.actual.value, fp.clave.value);
        fp.reset();
        U.aviso('Contraseña cambiada');
      });
    });
    $('#copiar').addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(enlace); U.aviso('Link copiado'); }
      catch { U.aviso(`Copiá este link: ${enlace}`, 'ok', 6000); }
    });
    const reiniciar = $('#reiniciar');
    if (reiniciar) reiniciar.addEventListener('click', () => Datos.reiniciarDemo());

    try {
      await U.cargarScript(QR_URL);
      const q = qrcode(0, 'M');
      q.addData(enlace);
      q.make();
      const url = q.createDataURL(6, 2);
      $('#qr').src = url;
      $('#bajar-qr').href = url;
    } catch (e) { console.error(e); }
  }

  return { ajustes, problemaClave, CLAVE_MINIMA };
})();
