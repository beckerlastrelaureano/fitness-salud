/**
 * config.js — Configuración de la app de Fitness Salud
 * -----------------------------------------------------------------------
 * Mientras "apiKey" diga "COMPLETAR", la app funciona en MODO DEMO: todo se
 * guarda en el navegador y sirve solo para mostrarla.
 *
 * En la compu, http://localhost:5195/?demo abre la demo aunque haya datos reales.
 *
 * Para usarla de verdad, seguí el paso a paso de README.md.
 */

const CONFIG = {
  firebase: {
    apiKey: "AIzaSyCaCbJ-3OBR7DPvPLW_ioiCYCMNMx-2UaA",
    authDomain: "fitness-salud-79f3a.firebaseapp.com",
    projectId: "fitness-salud-79f3a",
    storageBucket: "fitness-salud-79f3a.firebasestorage.app",
    messagingSenderId: "1034377426902",
    appId: "1:1034377426902:web:b093ff3736fb96bc981677"
  },

  nombreGimnasio: "Fitness Salud",

  // DNI del dueño. Tiene que ser el mismo que figura en firestore.rules.
  dnisDueno: ["20111222"],

  // Cuántos días antes del vencimiento una cuota pasa a "vence pronto".
  diasAviso: 7,

  // tipo "clase": tiene turnos, y el profe pasa lista por turno.
  // tipo "sala": sin turnos, como Gym App: el alumno viene con su rutina.
  // rutinas: la actividad usa rutinas y ejercicios.
  actividades: [
    { id: "pilates", nombre: "Pilates", tipo: "clase" },
    { id: "yoga", nombre: "Yoga", tipo: "clase" },
    { id: "stretching", nombre: "Stretching", tipo: "clase" },
    { id: "spinning", nombre: "Spinning", tipo: "clase" },
    { id: "funcional", nombre: "Funcional", tipo: "clase", rutinas: true },
    { id: "musculacion", nombre: "Musculación", tipo: "sala", rutinas: true }
  ]
};
