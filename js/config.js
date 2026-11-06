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

  actividades: [
    { id: "pilates", nombre: "Pilates" },
    { id: "yoga", nombre: "Yoga" },
    { id: "stretching", nombre: "Stretching" },
    { id: "musculacion", nombre: "Musculación" },
    { id: "spinning", nombre: "Spinning" }
  ]
};
