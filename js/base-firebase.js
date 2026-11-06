/**
 * base-firebase.js — Base REAL (Firebase Auth + Firestore).
 * -----------------------------------------------------------------------
 * Mismas funciones que base-demo.js. El resto de la app nunca llama a
 * firebase.* directamente.
 *
 * Colecciones:
 *   alumnos/{dni}      { dni, nombre, actividades, monto, montoManual, vence, fechaAlta }
 *   contactos/{dni}    { telefono, notas }  (solo el dueño)
 *   equipo/{dni}       { dni, nombre, rol: 'profe', actividades }
 *   claves/{dni}       { creada }  (marca que el dueño ya creó su contraseña)
 *   config/publico     { whatsapp, nombre, acento, tema, clasesActivas, logo }
 *   config/negocio     { precios, combos, porcentajes }  (solo el dueño)
 *   asistencias/{fecha_actividad}  { fecha, actividad, presentes }
 *   pagos/{id}         { dni, nombre, monto, meses, fecha, reparto, venceNuevo }
 *   pagosProfes/{id}   { profeDni, profeNombre, actividad, periodo, monto, fecha }
 *   rutinas/{id}       { nombre, autor, dias: [{ ejercicios: [{ ejId, nombre, series, reps, desc }] }] }
 *   ejercicios/{id}    { nombre, grupo, gif }  (los que crea el gimnasio)
 *   config/ejercicios  { renombres }
 *   turnos/{id}        { dia, hora, clase, profe, cupo, anotados }
 *   visitas/{fecha_dni} { dni, fecha, dia, hora, por }  (asistencia que registra el alumno)
 *
 * Cada persona del equipo tiene una cuenta "DNI@fitness-salud.app". Los
 * alumnos no tienen cuenta.
 */

const BaseFirebase = (() => {
  const DOMINIO = 'fitness-salud.app';
  let auth, db, authAparte;

  const email = (dni) => `${dni}@${DOMINIO}`;

  function traducir(e) {
    const textos = {
      'auth/invalid-credential': 'DNI o contraseña incorrectos.',
      'auth/wrong-password': 'DNI o contraseña incorrectos.',
      'auth/user-not-found': 'DNI o contraseña incorrectos.',
      'auth/weak-password': 'La contraseña es muy corta.',
      'auth/email-already-in-use': 'Ese DNI ya tiene una contraseña.',
      'auth/too-many-requests': 'Demasiados intentos. Esperá unos minutos.',
      'auth/network-request-failed': 'Sin conexión a internet.',
      'permission-denied': 'No tenés permiso para hacer esto.',
      'unavailable': 'Sin conexión a internet.',
    };
    console.error(e);
    return new Error(textos[e?.code] || 'Algo salió mal. Probá de nuevo.');
  }

  const conError = (fn) => async (...a) => {
    try { return await fn(...a); } catch (e) { throw traducir(e); }
  };

  function iniciar() {
    firebase.initializeApp(CONFIG.firebase);
    auth = firebase.auth();
    db = firebase.firestore();
    // La sesión dura hasta cerrar la app.
    auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);
    authAparte = firebase.initializeApp(CONFIG.firebase, 'aparte').auth();
  }

  const obtener = conError(async (col, id) => {
    const s = await db.collection(col).doc(id).get();
    return s.exists ? s.data() : null;
  });

  const listar = conError(async (col, filtro) => {
    let q = db.collection(col);
    if (filtro) q = q.where(filtro.campo, '>=', filtro.desde).where(filtro.campo, '<=', filtro.hasta);
    const s = await q.get();
    return s.docs.map((d) => ({ id: d.id, ...d.data() }));
  });

  const guardar = conError((col, id, datos) => db.collection(col).doc(id).set(datos));
  const actualizar = conError((col, id, campos) => db.collection(col).doc(id).update(campos));
  const agregar = conError(async (col, datos) => (await db.collection(col).add(datos)).id);
  const borrar = conError((col, id) => db.collection(col).doc(id).delete());

  function onAuth(cb) {
    auth.onAuthStateChanged((u) => cb(u ? u.email.split('@')[0] : null));
  }

  const login = conError((dni, clave) => auth.signInWithEmailAndPassword(email(dni), clave));
  const salirAuth = conError(() => auth.signOut());
  const crearCuenta = conError((dni, clave) => auth.createUserWithEmailAndPassword(email(dni), clave));

  // Crea la cuenta de un profe sin cerrar la sesión del dueño.
  const crearCuentaAparte = conError(async (dni, clave) => {
    try {
      await authAparte.createUserWithEmailAndPassword(email(dni), clave);
      await authAparte.signOut();
    } catch (e) {
      if (e.code !== 'auth/email-already-in-use') throw e;
    }
  });

  const cambiarClave = conError(async (dni, actual, nueva) => {
    const credencial = firebase.auth.EmailAuthProvider.credential(email(dni), actual);
    await auth.currentUser.reauthenticateWithCredential(credencial);
    await auth.currentUser.updatePassword(nueva);
  });

  return { modo: 'real', iniciar, obtener, listar, guardar, actualizar, agregar, borrar,
    onAuth, login, salirAuth, crearCuenta, crearCuentaAparte, cambiarClave };
})();
