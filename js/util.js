/**
 * util.js — Ayudas comunes: fechas, estado de cuota, HTML, avisos, imágenes.
 * Las fechas se guardan como texto "AAAA-MM-DD" (sin hora), en hora local.
 */

const U = (() => {

  // ---------------------------------------------------------------------
  // Fechas
  // ---------------------------------------------------------------------
  const dos = (n) => String(n).padStart(2, '0');
  const aISO = (d) => `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
  const deISO = (iso) => { const [a, m, d] = iso.split('-').map(Number); return new Date(a, m - 1, d); };

  function hoy() { return aISO(new Date()); }
  const mesActual = () => hoy().slice(0, 7);

  const NOMBRES_MES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  function nombreMes(mes) {
    const [a, m] = mes.split('-').map(Number);
    return `${NOMBRES_MES[m - 1]} ${a}`;
  }

  // Fecha larga: "Jueves 5 de noviembre".
  const NOMBRES_DIA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  function fechaLarga(iso) {
    const d = deISO(iso);
    const t = `${NOMBRES_DIA[d.getDay()]} ${d.getDate()} de ${NOMBRES_MES[d.getMonth()]}`;
    return t.charAt(0).toUpperCase() + t.slice(1);
  }
  const diaSemana = (iso) => NOMBRES_DIA[deISO(iso).getDay()].slice(0, 3);
  // Fecha con números: 05/11/2026 (o 05/11 si se pide corta).
  function fechaNum(iso, corta) {
    if (!iso) return '—';
    const [a, m, d] = iso.split('-');
    return corta ? `${d}/${m}` : `${d}/${m}/${a}`;
  }
  const horaAhora = () => { const d = new Date(); return `${dos(d.getHours())}:${dos(d.getMinutes())}`; };

  // Suma meses respetando fin de mes (31/01 + 1 mes = 28 o 29/02).
  function sumarMeses(iso, meses) {
    const d = deISO(iso);
    const dia = d.getDate();
    d.setDate(1);
    d.setMonth(d.getMonth() + meses);
    const ultimo = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(dia, ultimo));
    return aISO(d);
  }

  function sumarDias(iso, dias) {
    const d = deISO(iso);
    d.setDate(d.getDate() + dias);
    return aISO(d);
  }

  function diasHasta(iso) {
    return Math.round((deISO(iso) - deISO(hoy())) / 86400000);
  }

  const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  function fechaCorta(iso) {
    if (!iso) return '—';
    const d = deISO(iso);
    return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`;
  }

  // Nuevo vencimiento al registrar un pago: si la cuota sigue vigente se
  // suma desde el vencimiento; si ya venció (o nunca pagó), desde hoy.
  function nuevoVencimiento(venceActual, meses) {
    const base = venceActual && venceActual >= hoy() ? venceActual : hoy();
    return sumarMeses(base, meses);
  }

  // Estado de una cuota según su vencimiento.
  // clave: 'al-dia' | 'por-vencer' | 'vencida' | 'sin-pago'
  function estadoCuota(vence) {
    if (!vence) return { clave: 'sin-pago', texto: 'Sin pagos', detalle: 'Todavía no registró ningún pago' };
    const dias = diasHasta(vence);
    if (dias < 0) {
      return { clave: 'vencida', texto: 'Vencida', dias,
        detalle: `Venció el ${fechaCorta(vence)} (hace ${-dias} día${dias === -1 ? '' : 's'})` };
    }
    if (dias <= CONFIG.diasAviso) {
      const cuando = dias === 0 ? 'hoy' : dias === 1 ? 'mañana' : `en ${dias} días`;
      return { clave: 'por-vencer', texto: 'Vence pronto', dias, detalle: `Vence ${cuando} (${fechaCorta(vence)})` };
    }
    return { clave: 'al-dia', texto: 'Al día', dias, detalle: `Vence el ${fechaCorta(vence)}` };
  }

  // ---------------------------------------------------------------------
  // Texto, números y códigos
  // ---------------------------------------------------------------------
  function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  const plata = (n) => (n || n === 0) && n !== ''
    ? '$' + Number(n).toLocaleString('es-AR', { maximumFractionDigits: 0 }) : '—';

  // Para buscar sin importar tildes ni mayúsculas.
  const normalizar = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const nuevoId = () => Math.random().toString(36).slice(2, 11);
  const ic = (nombre, tam = 16) => `<span class="ic i-${nombre}" aria-hidden="true" style="width:${tam}px;height:${tam}px"></span>`;

  const soloDigitos = (s) => String(s || '').replace(/\D/g, '');

  // Link de WhatsApp. Acepta números argentinos escritos de cualquier forma.
  function linkWhatsapp(telefono, texto) {
    let n = soloDigitos(telefono);
    if (!n) return '';
    if (!n.startsWith('54')) n = '549' + n.replace(/^0/, '');
    return `https://wa.me/${n}${texto ? '?text=' + encodeURIComponent(texto) : ''}`;
  }

  // ---------------------------------------------------------------------
  // Pantalla
  // ---------------------------------------------------------------------
  const $ = (sel, raiz = document) => raiz.querySelector(sel);
  const $$ = (sel, raiz = document) => Array.from(raiz.querySelectorAll(sel));

  function aviso(texto, tipo = 'ok', ms = 3500) {
    const caja = $('#avisos');
    const el = document.createElement('div');
    el.className = `aviso aviso-${tipo}`;
    el.textContent = texto;
    caja.appendChild(el);
    setTimeout(() => { el.classList.add('saliendo'); setTimeout(() => el.remove(), 300); }, ms);
  }

  // Abre un <dialog> con el HTML dado. Devuelve el elemento para enganchar eventos.
  function modal(html) {
    const d = document.createElement('dialog');
    d.className = 'modal';
    d.innerHTML = html;
    document.body.appendChild(d);
    d.addEventListener('close', () => d.remove());
    d.addEventListener('click', (e) => { if (e.target === d) d.close(); });
    $$('[data-cerrar]', d).forEach((b) => b.addEventListener('click', () => d.close()));
    d.showModal();
    return d;
  }

  // Lee una imagen del celular. Devuelve su contenido como texto.
  function leerImagen(archivo, maxKb) {
    return new Promise((ok, mal) => {
      if (archivo.size > maxKb * 1024) return mal(new Error(`La imagen pesa ${Math.round(archivo.size / 1024)} KB. El máximo es ${maxKb} KB.`));
      const r = new FileReader();
      r.onload = () => ok(r.result);
      r.onerror = () => mal(new Error('No se pudo leer la imagen.'));
      r.readAsDataURL(archivo);
    });
  }

  // Carga una librería solo cuando hace falta.
  const scripts = {};
  function cargarScript(src) {
    scripts[src] ||= new Promise((ok, mal) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = ok;
      s.onerror = () => mal(new Error('No se pudo cargar. Revisá la conexión.'));
      document.head.appendChild(s);
    });
    return scripts[src];
  }

  function confirmar(texto, boton = 'Confirmar') {
    return new Promise((ok) => {
      const d = modal(`<div class="modal-cuerpo"><p>${esc(texto)}</p>
        <div class="acciones"><button class="btn btn-fantasma" data-cerrar>Cancelar</button>
        <button class="btn btn-peligro-lleno" id="si">${esc(boton)}</button></div></div>`);
      let respuesta = false;
      $('#si', d).addEventListener('click', () => { respuesta = true; d.close(); });
      d.addEventListener('close', () => ok(respuesta));
    });
  }

  return { hoy, mesActual, nombreMes, fechaLarga, diaSemana, fechaNum, horaAhora, sumarMeses, sumarDias, diasHasta,
    fechaCorta, nuevoVencimiento, estadoCuota, esc, plata, soloDigitos, normalizar, nuevoId, ic, linkWhatsapp,
    $, $$, aviso, modal, confirmar, leerImagen, cargarScript };
})();
