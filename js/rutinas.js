/**
 * rutinas.js — Rutinas y catálogo de ejercicios. Las usan el dueño y los profes.
 */

const Rutinas = (() => {
  const { $, $$, esc, ic } = U;
  const { estado, porNombre, avatar, cabecera, conCarga, campo } = UI;
  const POR_PAGINA = 60;

  const contar = (r) => ({ dias: r.dias.length, ejercicios: r.dias.reduce((t, d) => t + d.ejercicios.length, 0) });
  const autorActual = () => (estado.sesion.rol === 'dueno' ? 'Dueño del gimnasio' : estado.sesion.nombre);
  const imagen = (e, tam) => (e?.thumb
    ? `<img class="mini" src="${esc(e.thumb)}" alt="" loading="lazy" width="${tam}" height="${tam}">`
    : `<div class="mini ej-sin-img" style="width:${tam}px;height:${tam}px">${ic('pesa', 20)}</div>`);

  // ---------------------------------------------------------------------
  // Lista
  // ---------------------------------------------------------------------
  async function lista(cont) {
    const [rutinas, alumnos] = await Promise.all([Datos.listarRutinas(), Datos.listarAlumnos()]);
    const autores = [...new Set(rutinas.map((r) => r.autor || 'Sin autor'))].sort();
    const usan = (id) => alumnos.filter((a) => a.rutinaId === id);

    cont.innerHTML = `${cabecera({ titulo: 'Rutinas', sub: 'Las rutinas de tu gimnasio. Asignalas a cualquier alumno.',
        acciones: `<a class="btn btn-primario" href="#/rutinas/nueva">${ic('mas')}Nueva rutina</a>` })}
      ${autores.map((autor) => {
        const suyas = rutinas.filter((r) => (r.autor || 'Sin autor') === autor).sort(porNombre);
        return `<section class="panel" style="overflow:hidden"><div class="panel-cab"><div class="fila">${avatar(autor)}<h2 class="t-titulo">${esc(autor)}</h2></div><span class="chip chip-neutro t-num">${suyas.length}</span></div>
          ${suyas.map((r) => {
            const c = contar(r);
            const n = usan(r.id).length;
            return `<div class="lista-fila" style="cursor:default;flex-wrap:wrap" data-id="${esc(r.id)}">
              <div class="datos" style="min-width:170px"><strong>${esc(r.nombre)}</strong><small>${c.dias} día${c.dias === 1 ? '' : 's'} · ${c.ejercicios} ejercicios</small><small>La tienen ${n} alumno${n === 1 ? '' : 's'}</small></div>
              <div class="fila" style="gap:6px"><button class="btn btn-fantasma btn-chico" data-a="asignar">Asignar</button>
                <a class="btn btn-fantasma btn-chico" href="#/rutinas/${esc(r.id)}">Editar</a>
                <button class="btn btn-fantasma btn-chico" data-a="duplicar">Duplicar</button></div></div>`;
          }).join('')}</section>`;
      }).join('') || '<div class="vacio t-suave">Todavía no hay rutinas. Creá la primera con “Nueva rutina”.</div>'}`;

    cont.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-a]');
      if (!b) return;
      const r = rutinas.find((x) => x.id === b.closest('[data-id]').dataset.id);
      if (b.dataset.a === 'asignar') return modalAsignar(r, alumnos);
      await conCarga(b, async () => {
        const { id, ...datos } = JSON.parse(JSON.stringify(r));
        await Datos.guardarRutina(U.nuevoId(), { ...datos, nombre: `${r.nombre} (copia)`, autor: autorActual() });
        U.aviso('Rutina duplicada');
        App.enrutar();
      });
    }, { once: false });
  }

  function modalAsignar(rutina, alumnos) {
    const { sesion } = estado;
    const propios = sesion.rol === 'profe'
      ? alumnos.filter((a) => (a.actividades || []).some((x) => sesion.actividades.includes(x)))
      : alumnos;
    const d = U.modal(`<div class="modal-cuerpo"><h2 class="t-titulo">Asignar ${esc(rutina.nombre)}</h2>
      <div class="buscador">${ic('buscar', 16)}<input class="input" id="buscar" placeholder="Buscar alumno…"></div>
      <div class="picker-lista" id="lista"></div>
      <div class="acciones"><button class="btn btn-primario" data-cerrar>Listo</button></div></div>`);
    function pintar(texto = '') {
      $('#lista', d).innerHTML = propios.filter((a) => U.normalizar(a.nombre).includes(texto)).sort(porNombre).map((a) => `<label class="lista-fila">${avatar(a.nombre)}
        <div class="datos"><strong>${esc(a.nombre)}</strong></div>
        <input type="checkbox" value="${esc(a.dni)}" style="width:22px;height:22px;accent-color:var(--acento)" ${a.rutinaId === rutina.id ? 'checked' : ''}></label>`).join('')
        || '<p class="vacio-chico">No hay alumnos para mostrar.</p>';
    }
    pintar();
    $('#buscar', d).addEventListener('input', (e) => pintar(U.normalizar(e.target.value)));
    $('#lista', d).addEventListener('change', async (e) => {
      const a = alumnos.find((x) => x.dni === e.target.value);
      try {
        await Datos.asignarRutina(a.dni, e.target.checked ? rutina.id : null);
        a.rutinaId = e.target.checked ? rutina.id : null;
      } catch (err) { U.aviso(err.message, 'error', 5000); e.target.checked = !e.target.checked; }
    });
    d.addEventListener('close', () => App.enrutar());
  }

  // ---------------------------------------------------------------------
  // Elegir un ejercicio
  // ---------------------------------------------------------------------
  function elegirEjercicio(catalogo, alElegir) {
    const d = U.modal(`<div class="modal-cuerpo"><h2 class="t-titulo">Elegir ejercicio</h2>
      <div class="buscador">${ic('buscar', 16)}<input class="input" id="buscar" placeholder="Buscar: sillón, camilla, vuelos, jalón, press…" autofocus></div>
      <div class="picker-lista" id="lista"></div>
      <div class="acciones"><button class="btn btn-fantasma" data-cerrar>Cerrar</button></div></div>`);
    function pintar(texto = '') {
      const hallados = catalogo.filter((e) => U.normalizar(`${e.nombre} ${e.alias || ''} ${e.grupo}`).includes(texto)).slice(0, 40);
      $('#lista', d).innerHTML = hallados.map((e) => `<button type="button" class="lista-fila" data-id="${esc(e.id)}">${imagen(e, 44)}
        <div class="datos"><strong>${esc(e.nombre)}</strong><small>${esc(e.grupo)}</small></div></button>`).join('') || '<p class="vacio-chico">No hay ejercicios con ese nombre.</p>';
    }
    pintar();
    $('#buscar', d).addEventListener('input', (e) => pintar(U.normalizar(e.target.value)));
    $('#lista', d).addEventListener('click', (e) => {
      const b = e.target.closest('[data-id]');
      if (!b) return;
      alElegir(catalogo.find((x) => x.id === b.dataset.id));
      U.aviso('Ejercicio agregado', 'ok', 1500);
    });
  }

  // ---------------------------------------------------------------------
  // Editor
  // ---------------------------------------------------------------------
  async function editor(cont, id) {
    const esNueva = id === 'nueva';
    const [catalogo, guardada] = await Promise.all([Datos.ejercicios(), esNueva ? null : Datos.obtenerRutina(id)]);
    if (!esNueva && !guardada) { cont.innerHTML = cabecera({ titulo: 'No encontramos esa rutina' }); return; }
    const rutina = guardada || { nombre: '', autor: autorActual(), dias: [{ ejercicios: [] }] };
    const porId = new Map(catalogo.map((e) => [e.id, e]));
    let dia = 0;

    function leerFilas() {
      $$('[data-i]', cont).forEach((f) => {
        const e = rutina.dias[dia].ejercicios[Number(f.dataset.i)];
        e.series = $('[data-c=series]', f).value.trim();
        e.reps = $('[data-c=reps]', f).value.trim();
        e.desc = $('[data-c=desc]', f).value.trim();
      });
      rutina.nombre = $('#nombre', cont).value.trim();
    }

    function pintar() {
      const c = contar(rutina);
      const ejercicios = rutina.dias[dia].ejercicios;
      cont.innerHTML = `${cabecera({ titulo: rutina.nombre || 'Nueva rutina', migas: `<a href="#/rutinas">Rutinas</a>${ic('der', 14)}${esNueva ? 'Nueva' : 'Editar'}`, sub: `${c.dias} día${c.dias === 1 ? '' : 's'} · ${c.ejercicios} ejercicios` })}
        <div class="fila" style="flex-wrap:wrap;justify-content:space-between">
          <div class="segmentos" style="flex:1 1 300px;max-width:680px">${rutina.dias.map((d, i) => `<button type="button" class="segmento ${i === dia ? 'activo' : ''}" data-dia="${i}">Día ${i + 1} <span class="t-num" style="opacity:.7">· ${d.ejercicios.length}</span></button>`).join('')}</div>
          <div class="fila" style="gap:10px"><span class="etq">DÍAS POR SEMANA</span><div class="contador">
            <button type="button" id="dia-menos" aria-label="Un día menos">−</button><span class="t-num">${rutina.dias.length}</span>
            <button type="button" id="dia-mas" aria-label="Un día más">+</button></div></div>
        </div>
        <section class="panel" style="overflow:hidden">
          ${ejercicios.map((e, i) => `<div class="ej-fila" data-i="${i}"><span class="t-num t-tenue" style="text-align:center">${i + 1}</span>
            ${imagen(porId.get(e.ejId), 48)}
            <div class="ej-nombre">${esc(e.nombre)}</div>
            <div class="ej-medidas"><input class="input t-num" data-c="series" aria-label="Series" value="${esc(e.series)}"> × <input class="input t-num" data-c="reps" aria-label="Repeticiones" value="${esc(e.reps)}">
              <input class="input t-num" data-c="desc" aria-label="Descanso en segundos" value="${esc(e.desc)}"> s</div>
            <div class="ej-botones"><button type="button" class="btn btn-fantasma btn-icono" data-mover="-1" aria-label="Subir" ${i ? '' : 'disabled'}>${ic('arriba')}</button>
              <button type="button" class="btn btn-fantasma btn-icono" data-mover="1" aria-label="Bajar" ${i < ejercicios.length - 1 ? '' : 'disabled'}>${ic('abajo')}</button>
              <button type="button" class="btn btn-fantasma btn-icono" data-quitar aria-label="Quitar">${ic('borrar')}</button></div></div>`).join('') || '<p class="vacio-chico">Este día no tiene ejercicios.</p>'}
          <div style="padding:14px 16px;border-top:1px solid var(--borde2)"><button type="button" class="btn btn-secundario" id="agregar">${ic('mas')}Agregar del catálogo</button></div>
        </section>
        <section class="panel col" style="padding:18px;gap:14px">
          ${campo('Nombre de la rutina', `<input class="input" id="nombre" value="${esc(rutina.nombre)}" placeholder="Ej: Hipertrofia 3 días">`)}
          <div class="acciones" style="justify-content:space-between">
            ${esNueva ? '<span></span>' : `<button type="button" class="btn btn-peligro" id="borrar">${ic('borrar')}Eliminar</button>`}
            <button type="button" class="btn btn-primario" id="guardar">Guardar rutina</button></div>
        </section>`;
      enganchar();
    }

    function enganchar() {
      $$('[data-dia]', cont).forEach((b) => b.addEventListener('click', () => { leerFilas(); dia = Number(b.dataset.dia); pintar(); }));
      $('#dia-mas').addEventListener('click', () => { leerFilas(); if (rutina.dias.length < 7) { rutina.dias.push({ ejercicios: [] }); dia = rutina.dias.length - 1; pintar(); } });
      $('#dia-menos').addEventListener('click', () => {
        leerFilas();
        if (rutina.dias.length < 2) return;
        rutina.dias.pop();
        dia = Math.min(dia, rutina.dias.length - 1);
        pintar();
      });
      $('#agregar').addEventListener('click', () => {
        leerFilas();
        elegirEjercicio(catalogo, (e) => {
          rutina.dias[dia].ejercicios.push({ ejId: e.id, nombre: e.nombre, series: '3', reps: '12', desc: '60' });
          pintar();
        });
      });
      $$('[data-mover]', cont).forEach((b) => b.addEventListener('click', () => {
        leerFilas();
        const lista = rutina.dias[dia].ejercicios;
        const i = Number(b.closest('[data-i]').dataset.i);
        const j = i + Number(b.dataset.mover);
        [lista[i], lista[j]] = [lista[j], lista[i]];
        pintar();
      }));
      $$('[data-quitar]', cont).forEach((b) => b.addEventListener('click', () => {
        leerFilas();
        rutina.dias[dia].ejercicios.splice(Number(b.closest('[data-i]').dataset.i), 1);
        pintar();
      }));
      $('#guardar').addEventListener('click', (e) => {
        leerFilas();
        if (!rutina.nombre) return U.aviso('Ponele un nombre a la rutina', 'error');
        if (!contar(rutina).ejercicios) return U.aviso('Agregá al menos un ejercicio', 'error');
        const { id: _, ...datos } = rutina;
        conCarga(e.currentTarget, async () => {
          await Datos.guardarRutina(esNueva ? U.nuevoId() : id, datos);
          U.aviso('Rutina guardada');
          location.hash = '#/rutinas';
        });
      });
      const borrar = $('#borrar', cont);
      if (borrar) borrar.addEventListener('click', async () => {
        if (!(await U.confirmar(`¿Eliminar “${rutina.nombre}”? Los alumnos que la tienen se quedan sin rutina.`, 'Eliminar'))) return;
        conCarga(borrar, async () => {
          await Datos.borrarRutina(id);
          U.aviso('Rutina eliminada');
          location.hash = '#/rutinas';
        });
      });
    }

    pintar();
  }

  const rutinas = (cont, id) => (id ? editor(cont, id) : lista(cont));

  // ---------------------------------------------------------------------
  // Ejercicios
  // ---------------------------------------------------------------------
  async function ejercicios(cont) {
    const catalogo = await Datos.ejercicios();
    const grupos = [...new Set(catalogo.map((e) => e.grupo))].sort((a, b) => a.localeCompare(b, 'es'));
    let grupo = 'Todos';
    let texto = '';
    let tope = POR_PAGINA;

    cont.innerHTML = `${cabecera({ titulo: 'Ejercicios', sub: 'Más de 1.000 ejercicios con animación, con los nombres como se dicen en el gimnasio.',
        acciones: `<button class="btn btn-primario" id="crear">${ic('mas')}Crear ejercicio</button>` })}
      <div class="buscador">${ic('buscar', 16)}<input class="input" id="buscar" placeholder="Buscar: sillón, camilla, vuelos, jalón, press…"></div>
      <div class="filtros" id="grupos"></div>
      <p class="t-suave" id="total"></p>
      <div class="grilla-ej" id="grilla"></div>
      <button class="btn btn-secundario" id="mas" style="align-self:center">Ver más ejercicios</button>`;

    function pintar() {
      $('#grupos').innerHTML = ['Todos', ...grupos].map((g) => `<button type="button" class="filtro ${g === grupo ? 'activo' : ''}" data-g="${esc(g)}">${esc(g)}</button>`).join('');
      const hallados = catalogo.filter((e) => grupo === 'Todos' || e.grupo === grupo)
        .filter((e) => !texto || U.normalizar(`${e.nombre} ${e.alias || ''}`).includes(texto));
      $('#total').textContent = `${hallados.length.toLocaleString('es-AR')} ejercicios`;
      $('#grilla').innerHTML = hallados.slice(0, tope).map((e) => `<button type="button" class="tarjeta ej-tarjeta" data-id="${esc(e.id)}">
        ${e.thumb ? `<img src="${esc(e.thumb)}" alt="" loading="lazy">` : `<span class="ej-sin-img">${ic('pesa', 32)}</span>`}
        <strong>${esc(e.nombre)}</strong><span class="dato-pie">${esc(e.grupo)}${e.propio ? ' · propio' : ''}</span></button>`).join('');
      $('#mas').hidden = hallados.length <= tope;
    }

    $('#buscar').addEventListener('input', (e) => { texto = U.normalizar(e.target.value); tope = POR_PAGINA; pintar(); });
    $('#grupos').addEventListener('click', (e) => { const b = e.target.closest('[data-g]'); if (b) { grupo = b.dataset.g; tope = POR_PAGINA; pintar(); } });
    $('#mas').addEventListener('click', () => { tope += POR_PAGINA; pintar(); });
    $('#grilla').addEventListener('click', (e) => { const b = e.target.closest('[data-id]'); if (b) modalEjercicio(catalogo.find((x) => x.id === b.dataset.id)); });
    $('#crear').addEventListener('click', () => modalCrear(grupos));
    pintar();
  }

  function modalEjercicio(e) {
    const d = U.modal(`<form class="modal-cuerpo"><h2 class="t-titulo">${esc(e.nombre)}</h2>
      ${e.gif ? `<img src="${esc(e.gif)}" alt="" style="width:100%;max-height:320px;object-fit:contain;background:#fff;border-radius:10px">` : ''}
      <p class="t-suave">${esc(e.grupo)}</p>
      ${e.propio ? '' : campo('Nombre en tu gimnasio', `<input class="input" name="nombre" value="${esc(e.nombre)}">`)}
      <div class="acciones">
        ${e.propio ? '<button type="button" class="btn btn-peligro" id="borrar">Eliminar</button>' : ''}
        <button type="button" class="btn btn-fantasma" data-cerrar>Cerrar</button>
        ${e.propio ? '' : '<button class="btn btn-primario">Guardar nombre</button>'}</div></form>`);
    const f = $('form', d);
    f.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const nombre = f.nombre.value.trim();
      if (!nombre) return U.aviso('Poné un nombre', 'error');
      conCarga($('.btn-primario', f), async () => {
        await Datos.renombrarEjercicio(e.id, nombre);
        d.close();
        U.aviso('Nombre guardado');
        App.enrutar();
      });
    });
    const borrar = $('#borrar', d);
    if (borrar) borrar.addEventListener('click', () => conCarga(borrar, async () => {
      await Datos.borrarEjercicio(e.id);
      d.close();
      U.aviso('Ejercicio eliminado');
      App.enrutar();
    }));
  }

  function modalCrear(grupos) {
    let gif = null;
    const d = U.modal(`<form class="modal-cuerpo"><h2 class="t-titulo">Crear ejercicio</h2>
      ${campo('Nombre', '<input class="input" name="nombre" required>')}
      ${campo('Grupo muscular', `<select class="input select" name="grupo">${grupos.map((g) => `<option>${esc(g)}</option>`).join('')}</select>`)}
      ${campo('Imagen o GIF (opcional)', '<input class="input" name="imagen" type="file" accept="image/*" style="padding-top:10px">', 'Hasta 300 KB.')}
      <div class="acciones"><button type="button" class="btn btn-fantasma" data-cerrar>Cancelar</button>
      <button class="btn btn-primario">Crear</button></div></form>`);
    const f = $('form', d);
    f.imagen.addEventListener('change', async () => {
      try { gif = f.imagen.files[0] ? await U.leerImagen(f.imagen.files[0], 300) : null; }
      catch (e) { f.imagen.value = ''; gif = null; U.aviso(e.message, 'error', 5000); }
    });
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      conCarga($('.btn-primario', f), async () => {
        await Datos.guardarEjercicio({ nombre: f.nombre.value.trim(), grupo: f.grupo.value, gif });
        d.close();
        U.aviso('Ejercicio creado');
        App.enrutar();
      });
    });
  }

  return { rutinas, ejercicios };
})();
