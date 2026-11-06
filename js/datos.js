/**
 * datos.js — Lo que la app le pide a la base, sea la demo o Firebase.
 * Acá se decide quién es quién: un mismo DNI puede ser dueño, profe o alumno.
 */

const Datos = (() => {
  // localhost:5195/?demo abre la demo aunque la app ya tenga datos reales.
  const forzarDemo = location.hostname === 'localhost' && new URLSearchParams(location.search).has('demo');
  const base = forzarDemo || CONFIG.firebase.apiKey === 'COMPLETAR' ? BaseDemo : BaseFirebase;
  const CLAVE_ALUMNO = 'fitness-salud-alumno';
  const NEGOCIO_VACIO = { precios: {}, combos: [], porcentajes: {} };
  let avisar = () => {};

  const claveProfe = (dni) => `FS-${dni}-profe`;
  const esDueno = (dni) => CONFIG.dnisDueno.includes(dni);

  function iniciar() { base.iniciar(); }

  async function sesionDeCuenta(dni) {
    if (esDueno(dni)) return { rol: 'dueno', dni, nombre: 'Dueño' };
    const e = await base.obtener('equipo', dni);
    return e ? { rol: 'profe', dni, nombre: e.nombre, actividades: e.actividades || [] } : null;
  }

  async function sesionDeAlumno() {
    const dni = sessionStorage.getItem(CLAVE_ALUMNO);
    if (!dni) return null;
    const a = await base.obtener('alumnos', dni);
    return a ? { rol: 'alumno', dni, nombre: a.nombre } : null;
  }

  function onSesion(cb) {
    avisar = cb;
    base.onAuth(async (dni) => {
      const s = dni ? await sesionDeCuenta(dni) : await sesionDeAlumno();
      if (dni && !s) { await base.salirAuth(); return; }
      cb(s);
    });
  }

  // Averigua todas las formas en que puede entrar un DNI.
  async function identificar(dni) {
    const [profe, alumno, clave] = await Promise.all([
      base.obtener('equipo', dni), base.obtener('alumnos', dni), base.obtener('claves', dni),
    ]);
    const opciones = [];
    if (esDueno(dni)) opciones.push('dueno');
    if (profe) opciones.push('profe');
    if (alumno) opciones.push('alumno');
    return { opciones, tieneClave: Boolean(clave) };
  }

  function entrarAlumno(dni, nombre) {
    sessionStorage.setItem(CLAVE_ALUMNO, dni);
    avisar({ rol: 'alumno', dni, nombre });
  }

  const entrarProfe = (dni) => base.login(dni, claveProfe(dni));
  const entrarDueno = (dni, clave) => base.login(dni, clave);

  async function crearClaveDueno(dni, clave) {
    await base.crearCuenta(dni, clave);
    await base.guardar('claves', dni, { creada: true });
  }

  async function salir() {
    sessionStorage.removeItem(CLAVE_ALUMNO);
    await base.salirAuth();
    avisar(null);
  }

  // Alumnos. El teléfono va aparte: la ficha se lee con el DNI solo.
  async function listarAlumnos({ conContacto = false } = {}) {
    const alumnos = await base.listar('alumnos');
    if (!conContacto) return alumnos;
    const contactos = await base.listar('contactos');
    return alumnos.map((a) => {
      const c = contactos.find((x) => x.id === a.dni);
      return { ...a, telefono: c?.telefono || '', notas: c?.notas || '' };
    });
  }

  async function guardarAlumno({ telefono, notas, id, estado, ...ficha }) {
    await base.guardar('alumnos', ficha.dni, ficha);
    await base.guardar('contactos', ficha.dni, { telefono, notas });
  }

  async function borrarAlumno(dni) {
    await base.borrar('alumnos', dni);
    await base.borrar('contactos', dni);
  }

  const obtenerAlumno = (dni) => base.obtener('alumnos', dni);
  const asignarRutina = (dni, rutinaId) => base.actualizar('alumnos', dni, { rutinaId: rutinaId || null });

  // Pone al día sin registrar cobro: solo corre el vencimiento.
  async function ponerAlDia(alumno) {
    const { telefono, notas, id, estado, ...ficha } = alumno;
    const vence = U.nuevoVencimiento(alumno.vence, 1);
    await base.guardar('alumnos', alumno.dni, { ...ficha, vence });
    return vence;
  }

  // Precios, combos y porcentajes.
  async function negocio() { return { ...NEGOCIO_VACIO, ...(await base.obtener('config', 'negocio')) }; }
  const guardarNegocio = (datos) => base.guardar('config', 'negocio', datos);

  // Si cambian los precios, se actualiza la cuota de quien no la tiene a mano.
  async function aplicarPrecios(datos) {
    await guardarNegocio(datos);
    const alumnos = await base.listar('alumnos');
    let cambiados = 0;
    for (const { id, ...a } of alumnos) {
      if (a.montoManual) continue;
      const { monto } = Cuentas.precioDe(a.actividades || [], datos);
      if (monto === a.monto) continue;
      await base.guardar('alumnos', a.dni, { ...a, monto });
      cambiados++;
    }
    return cambiados;
  }

  // Datos del gimnasio que ve todo el mundo, incluso antes de entrar.
  const GYM_INICIAL = { nombre: CONFIG.nombreGimnasio, acento: '#0F5D75', tema: 'oscuro', clasesActivas: true, logo: null, whatsapp: '' };
  async function publico() { return { ...GYM_INICIAL, ...(await base.obtener('config', 'publico')) }; }
  const guardarPublico = (datos) => base.guardar('config', 'publico', datos);

  // Equipo
  const listarEquipo = () => base.listar('equipo');

  async function guardarProfe(profe, nuevo) {
    if (nuevo) await base.crearCuentaAparte(profe.dni, claveProfe(profe.dni));
    await base.guardar('equipo', profe.dni, { ...profe, rol: 'profe' });
  }

  const borrarProfe = (dni) => base.borrar('equipo', dni);

  // Asistencia: una ficha por día y actividad. Lo que registra el alumno desde
  // su rutina se guarda en "visitas" y cuenta para Musculación.
  const ACT_RUTINAS = 'musculacion';
  const idVisita = (fecha, dni) => `${fecha}_${dni}`;
  const rangoDe = (mes) => ({ campo: 'fecha', desde: `${mes}-01`, hasta: `${mes}-31` });
  const visitasDe = (fecha) => base.listar('visitas', { campo: 'fecha', desde: fecha, hasta: fecha });

  // Lista de un turno. La marca aparte le deja al alumno ver sus propias clases.
  const idMarca = (fecha, turnoId, dni) => `${fecha}_${turnoId}_${dni}`;
  async function asistenciaTurno(fecha, turnoId) {
    return (await base.obtener('asistencias', `${fecha}_${turnoId}`))?.presentes || [];
  }

  async function guardarAsistenciaTurno(fecha, turno, presentes) {
    const anteriores = await asistenciaTurno(fecha, turno.id);
    await base.guardar('asistencias', `${fecha}_${turno.id}`, { fecha, actividad: turno.actividad, turnoId: turno.id, presentes });
    await Promise.all([
      ...presentes.filter((d) => !anteriores.includes(d)).map((dni) => base.guardar('marcas', idMarca(fecha, turno.id, dni), { fecha, turnoId: turno.id, dni })),
      ...anteriores.filter((d) => !presentes.includes(d)).map((dni) => base.borrar('marcas', idMarca(fecha, turno.id, dni))),
    ]);
  }

  // Clases del mes en curso a las que tenía que venir el alumno, y si vino.
  async function clasesDelMes(dni, turnos) {
    const hoy = U.hoy();
    const fechas = Array.from({ length: Number(hoy.slice(8)) }, (_, i) => `${U.mesActual()}-${String(i + 1).padStart(2, '0')}`);
    const previstas = turnos.flatMap((t) => fechas.filter((f) => U.diaTurno(f) === t.dia).map((fecha) => ({ fecha, turno: t })));
    const marcas = await Promise.all(previstas.map((p) => base.obtener('marcas', idMarca(p.fecha, p.turno.id, dni))));
    return previstas.map((p, i) => ({ ...p, vino: Boolean(marcas[i]) }));
  }

  async function asistencia(fecha, actividad) {
    const propia = (await base.obtener('asistencias', `${fecha}_${actividad}`))?.presentes || [];
    if (actividad !== ACT_RUTINAS) return propia;
    const visitas = await visitasDe(fecha);
    return [...new Set([...propia, ...visitas.map((v) => v.dni)])];
  }

  async function guardarAsistencia(fecha, actividad, presentes) {
    await base.guardar('asistencias', `${fecha}_${actividad}`, { fecha, actividad, presentes });
    if (actividad !== ACT_RUTINAS) return;
    const visitas = await visitasDe(fecha);
    await Promise.all(visitas.filter((v) => !presentes.includes(v.dni)).map((v) => base.borrar('visitas', v.id)));
  }

  // Suma las visitas de los alumnos a la ficha de Musculación de cada día.
  function juntarVisitas(asistencias, visitas) {
    const lista = asistencias.map((a) => ({ ...a }));
    for (const v of visitas) {
      let dia = lista.find((a) => a.fecha === v.fecha && a.actividad === ACT_RUTINAS);
      if (!dia) { dia = { fecha: v.fecha, actividad: ACT_RUTINAS, presentes: [] }; lista.push(dia); }
      if (!dia.presentes.includes(v.dni)) dia.presentes = [...dia.presentes, v.dni];
    }
    return lista;
  }

  async function asistenciasDelMes(mes) {
    const [asistencias, visitas] = await Promise.all([base.listar('asistencias', rangoDe(mes)), base.listar('visitas', rangoDe(mes))]);
    return juntarVisitas(asistencias, visitas);
  }

  // Quién vino: una fila por persona y día.
  async function presencias(desde, hasta) {
    const rango = { campo: 'fecha', desde, hasta };
    const [asistencias, visitas] = await Promise.all([base.listar('asistencias', rango), base.listar('visitas', rango)]);
    const filas = new Map();
    for (const a of asistencias) {
      for (const dni of a.presentes || []) {
        const clave = idVisita(a.fecha, dni);
        const fila = filas.get(clave) || { dni, fecha: a.fecha, actividades: [], por: 'profe' };
        fila.actividades.push(a.actividad);
        filas.set(clave, fila);
      }
    }
    for (const v of visitas) {
      const clave = idVisita(v.fecha, v.dni);
      filas.set(clave, { actividades: [], ...filas.get(clave), dni: v.dni, fecha: v.fecha, dia: v.dia, hora: v.hora, por: 'alumno' });
    }
    return [...filas.values()];
  }

  // El alumno no tiene cuenta: registra su día y solo lee sus propias visitas.
  async function registrarVisita(dni, dia) {
    const fecha = U.hoy();
    await base.guardar('visitas', idVisita(fecha, dni), { dni, fecha, dia, hora: U.horaAhora(), por: 'alumno' });
  }

  async function visitasDelAlumno(dni, dias = 40) {
    const fechas = Array.from({ length: dias }, (_, i) => U.sumarDias(U.hoy(), -i));
    const lista = await Promise.all(fechas.map((f) => base.obtener('visitas', idVisita(f, dni))));
    return lista.filter(Boolean);
  }

  // Rutinas y ejercicios
  const listarRutinas = () => base.listar('rutinas');
  const obtenerRutina = (id) => base.obtener('rutinas', id);
  const guardarRutina = (id, datos) => base.guardar('rutinas', id, datos);
  const borrarRutina = (id) => base.borrar('rutinas', id);

  let catalogo = null;
  async function ejercicios() {
    catalogo ||= fetch('catalogo.json').then((r) => r.json());
    const [lista, propios, config] = await Promise.all([catalogo, base.listar('ejercicios'), base.obtener('config', 'ejercicios')]);
    const renombres = config?.renombres || {};
    const WEB = 'https://gymapp-demo.vercel.app';
    return [
      ...propios.map((e) => ({ ...e, propio: true, thumb: e.gif })),
      ...lista.map((e) => ({ id: e.id, nombre: renombres[e.id] || e.n, alias: e.o, grupo: e.g,
        gif: `${WEB}/anim/${e.id}.webp`, thumb: `${WEB}/thumbs/${e.id}.webp` })),
    ];
  }
  const guardarEjercicio = (datos) => base.agregar('ejercicios', datos);
  const borrarEjercicio = (id) => base.borrar('ejercicios', id);
  async function renombrarEjercicio(id, nombre) {
    const config = (await base.obtener('config', 'ejercicios')) || { renombres: {} };
    await base.guardar('config', 'ejercicios', { renombres: { ...config.renombres, [id]: nombre } });
  }

  // Clases
  // Sin actividades trae todos los turnos (dueño). A un profe se le piden los
  // suyos: las reglas no le dejan listar los de otra actividad.
  async function listarTurnos(actividades) {
    if (!actividades) return base.listar('turnos');
    const listas = await Promise.all(actividades.map((a) => base.listar('turnos', { campo: 'actividad', igual: a })));
    return listas.flat();
  }
  const obtenerTurno = (id) => base.obtener('turnos', id);
  const guardarTurno = (id, datos) => base.guardar('turnos', id, datos);
  const borrarTurno = (id) => base.borrar('turnos', id);

  // Cobros y pagos a profes
  const pagosDelMes = (mes) => base.listar('pagos', rangoDe(mes));
  const pagosDeAlumno = (dni) => base.listar('pagos', { campo: 'dni', desde: dni, hasta: dni });

  async function registrarPago(alumno, { monto, meses }, negocioActual) {
    const venceNuevo = U.nuevoVencimiento(alumno.vence, meses);
    await base.agregar('pagos', { dni: alumno.dni, nombre: alumno.nombre, monto, meses, fecha: U.hoy(),
      reparto: Cuentas.reparto(monto, alumno.actividades || [], negocioActual), venceNuevo });
    const { telefono, notas, id, estado, ...ficha } = alumno;
    await base.guardar('alumnos', alumno.dni, { ...ficha, vence: venceNuevo });
    return venceNuevo;
  }

  const listarPagosProfes = () => base.listar('pagosProfes');
  const registrarPagoProfe = (pago) => base.agregar('pagosProfes', pago);

  return { get modo() { return base.modo; }, reiniciarDemo: () => base.reiniciar(), iniciar, onSesion, identificar,
    entrarAlumno, entrarProfe, entrarDueno, crearClaveDueno, salir,
    cambiarClave: (dni, actual, nueva) => base.cambiarClave(dni, actual, nueva),
    listarAlumnos, guardarAlumno, borrarAlumno, obtenerAlumno, asignarRutina, ponerAlDia, negocio, guardarNegocio, aplicarPrecios,
    publico, guardarPublico, listarEquipo, guardarProfe, borrarProfe,
    asistencia, guardarAsistencia, asistenciaTurno, guardarAsistenciaTurno, clasesDelMes, asistenciasDelMes, presencias, registrarVisita, visitasDelAlumno,
    listarRutinas, obtenerRutina, guardarRutina, borrarRutina, ejercicios, guardarEjercicio, borrarEjercicio, renombrarEjercicio,
    listarTurnos, obtenerTurno, guardarTurno, borrarTurno, pagosDelMes, pagosDeAlumno, registrarPago, listarPagosProfes, registrarPagoProfe };
})();
