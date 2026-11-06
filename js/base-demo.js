/**
 * base-demo.js — Base de MODO DEMO: todo queda en este navegador.
 * Tiene las mismas funciones que base-firebase.js. Las contraseñas de la
 * demo no son seguras: nunca uses este modo con datos reales.
 */

const BaseDemo = (() => {
  const CLAVE_DB = 'fitness-salud-demo';
  const CLAVE_SESION = 'fitness-salud-demo-sesion';
  let db;
  let avisar = () => {};

  const guardarDb = () => localStorage.setItem(CLAVE_DB, JSON.stringify(db));
  const copia = (o) => (o ? JSON.parse(JSON.stringify(o)) : null);
  const esperar = () => new Promise((r) => setTimeout(r, 100));
  const tabla = (col) => (db[col] ||= {});

  function semilla() {
    const h = U.hoy();
    const mes = U.mesActual();
    const dia = (n) => `${mes}-${String(n).padStart(2, '0')}`;
    const pasado = (n) => U.sumarDias(h, -n);
    const alumnos = [
      ['30111222', 'Martina López', '2302 41-2233', ['pilates', 'yoga'], 20, 30000],
      ['28999111', 'Juan Pérez', '2302 55-1020', ['musculacion'], 3, 20000],
      ['35444777', 'Sofía Gómez', '2302 60-8899', ['yoga'], -4, 18000],
      ['40123456', 'Tomás Díaz', '', ['spinning', 'musculacion'], 12, 32000],
      ['33222111', 'Lucía Fernández', '2302 33-4455', ['pilates'], -20, 22000],
      ['38555666', 'Nicolás Ruiz', '2302 47-1212', ['musculacion', 'spinning', 'stretching'], 25, 44000],
      ['36777888', 'Camila Sosa', '2302 51-9090', ['stretching', 'yoga'], 6, 28000],
      ['42111999', 'Bruno Castro', '', ['spinning'], null, 16000],
    ];
    const d = {
      alumnos: {}, contactos: {}, pagos: {}, asistencias: {}, pagosProfes: {},
      claves: { 20111222: { creada: true } },
      cuentas: { 20111222: 'demo1234' },
      config: {
        publico: { whatsapp: '2302 00-0000', clasesActivas: true },
        negocio: {
          precios: { pilates: 22000, yoga: 18000, stretching: 14000, musculacion: 20000, spinning: 16000 },
          combos: [
            { id: 'c1', nombre: 'Cuerpo y mente', actividades: ['pilates', 'yoga'], precio: 30000 },
            { id: 'c2', nombre: 'Sala y bici', actividades: ['musculacion', 'spinning'], precio: 32000 },
          ],
          porcentajes: { pilates: 40, yoga: 40, stretching: 35, musculacion: 30, spinning: 40 },
        },
      },
      equipo: {
        27333444: { dni: '27333444', nombre: 'Laura Méndez', rol: 'profe', actividades: ['pilates', 'yoga'] },
        28555666: { dni: '28555666', nombre: 'Diego Ríos', rol: 'profe', actividades: ['musculacion'] },
        29777888: { dni: '29777888', nombre: 'Vale Torres', rol: 'profe', actividades: ['spinning', 'stretching'] },
      },
    };
    for (const e of Object.values(d.equipo)) d.cuentas[e.dni] = `FS-${e.dni}-profe`;
    alumnos.forEach(([dni, nombre, telefono, actividades, dias, monto], i) => {
      d.alumnos[dni] = { dni, nombre, actividades, monto, montoManual: false, fechaAlta: h,
        vence: dias === null ? null : U.sumarDias(h, dias) };
      d.contactos[dni] = { telefono, notas: '' };
      if (dias !== null && dias > 0) {
        const reparto = Cuentas.reparto(monto, actividades, d.config.negocio);
        d.pagos[`p${i}`] = { dni, nombre, monto, meses: 1, fecha: h, reparto, venceNuevo: d.alumnos[dni].vence };
      }
    });
    for (const [act, dias] of [['pilates', [1, 3, 5]], ['yoga', [2, 4, 6]], ['stretching', [2, 5]], ['musculacion', [1, 2, 3]], ['spinning', [1, 4]]]) {
      for (const n of dias) {
        const fecha = pasado(n) >= dia(1) ? pasado(n) : dia(1);
        const presentes = Object.values(d.alumnos).filter((a) => a.actividades.includes(act)).map((a) => a.dni);
        d.asistencias[`${fecha}_${act}`] = { fecha, actividad: act, presentes };
      }
    }
    const ej = (ejId, nombre, series, reps, desc) => ({ ejId, nombre, series: String(series), reps: String(reps), desc: String(desc) });
    d.rutinas = {
      r1: { nombre: 'Hipertrofia 3 días', autor: 'Diego Ríos', dias: [
        { ejercicios: [ej('e0729', 'Sillón de cuádriceps', 4, 12, 60), ej('e0753', 'Camilla de femorales', 4, 10, 60), ej('e0738', 'Hip thrust con barra', 4, 10, 90)] },
        { ejercicios: [ej('e0384', 'Jalón al pecho', 4, 10, 60), ej('e1099', 'Remo bajo con triángulo', 4, 10, 60), ej('e0221', 'Vuelos laterales', 3, 12, 45)] },
        { ejercicios: [ej('e1152', 'Press plano con barra', 4, 10, 90), ej('e0379', 'Plancha frontal', 3, '30 s', 30)] },
      ] },
    };
    d.alumnos[28999111].rutinaId = 'r1';
    d.alumnos[38555666].rutinaId = 'r1';
    d.turnos = {
      t1: { dia: 0, hora: '08:00', clase: 'Pilates', profe: 'Laura Méndez', cupo: 6, anotados: ['Martina López', 'Lucía Fernández'] },
      t2: { dia: 0, hora: '19:00', clase: 'Spinning', profe: 'Vale Torres', cupo: 10, anotados: ['Tomás Díaz'] },
      t3: { dia: 2, hora: '09:00', clase: 'Yoga', profe: 'Laura Méndez', cupo: 2, anotados: ['Sofía Gómez', 'Camila Sosa'] },
      t4: { dia: 4, hora: '18:00', clase: 'Stretching', profe: 'Vale Torres', cupo: 8, anotados: [] },
    };
    d.visitas = { [`${h}_28999111`]: { dni: '28999111', fecha: h, dia: 1, hora: '09:30', por: 'alumno' } };
    d.pagosProfes.pp1 = { profeDni: '28555666', profeNombre: 'Diego Ríos', actividad: 'musculacion',
      periodo: mes, monto: 5000, fecha: h };
    return d;
  }

  function iniciar() {
    try { db = JSON.parse(localStorage.getItem(CLAVE_DB)); } catch { db = null; }
    if (!db) { db = semilla(); guardarDb(); }
  }

  async function obtener(col, id) { await esperar(); return copia(tabla(col)[id]); }

  async function listar(col, filtro) {
    await esperar();
    let lista = Object.entries(tabla(col)).map(([id, d]) => ({ id, ...copia(d) }));
    if (filtro) lista = lista.filter((d) => d[filtro.campo] >= filtro.desde && d[filtro.campo] <= filtro.hasta);
    return lista;
  }

  async function guardar(col, id, datos) { await esperar(); tabla(col)[id] = copia(datos); guardarDb(); }
  async function actualizar(col, id, campos) { await esperar(); Object.assign(tabla(col)[id], copia(campos)); guardarDb(); }
  async function agregar(col, datos) { const id = crypto.randomUUID(); await guardar(col, id, datos); return id; }
  async function borrar(col, id) { await esperar(); delete tabla(col)[id]; guardarDb(); }

  // Cuentas
  function onAuth(cb) { avisar = cb; cb(sessionStorage.getItem(CLAVE_SESION)); }
  function fijar(dni) {
    if (dni) sessionStorage.setItem(CLAVE_SESION, dni); else sessionStorage.removeItem(CLAVE_SESION);
    avisar(dni);
  }
  async function login(dni, clave) {
    await esperar();
    if (db.cuentas[dni] !== clave) throw new Error('DNI o contraseña incorrectos.');
    fijar(dni);
  }
  async function salirAuth() { fijar(null); }
  async function crearCuenta(dni, clave) { db.cuentas[dni] = clave; guardarDb(); fijar(dni); }
  async function crearCuentaAparte(dni, clave) { db.cuentas[dni] = clave; guardarDb(); }
  async function cambiarClave(dni, actual, nueva) {
    if (db.cuentas[dni] !== actual) throw new Error('La contraseña actual no es correcta.');
    db.cuentas[dni] = nueva;
    guardarDb();
  }

  function reiniciar() {
    localStorage.removeItem(CLAVE_DB);
    sessionStorage.clear();
    location.reload();
  }

  return { modo: 'demo', iniciar, obtener, listar, guardar, actualizar, agregar, borrar,
    onAuth, login, salirAuth, crearCuenta, crearCuentaAparte, cambiarClave, reiniciar };
})();
