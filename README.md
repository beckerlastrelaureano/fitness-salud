# Fitness Salud

Gym App adaptada a Fitness Salud. Mantiene el diseño (`css/gymapp.css` es el original) y las
secciones de Gym App, y suma actividades, precios, combos y pago a profes. A diferencia de la
demo de Gym App, los datos están en Firebase: dueño, profes y alumnos entran desde su celular.

## Quién entra y cómo

Hay una sola pantalla: se pone el DNI y la app sabe quién es.

| Quién | Entra con | Qué ve |
|---|---|---|
| **Dueño** | DNI + contraseña | Todo |
| **Profe** | DNI | Sus alumnos, sus turnos y su asistencia. Rutinas y ejercicios solo en Musculación y Funcional |
| **Alumno** | DNI | Su cuota, sus clases y su rutina del día |

Si un DNI es de dos cosas (por ejemplo, profe y alumno), la app pregunta cómo entrar.

## Qué tiene el dueño

- **Inicio**: alumnos activos, quién vino hoy, quién debe, cuotas por vencer y quién hace días que no viene.
- **Actividades**: Pilates, Yoga, Stretching, Spinning, Funcional y Musculación, con sus alumnos y su asistencia.
- **Alumnos**: DNI, celular, actividades y cuánto debe pagar. Ficha con cobros, calendario de asistencia y rutina.
- **Asistencia**: por turno en las clases, y lista simple en Musculación, como Gym App.
- **Rutinas**: por días, con ejercicios, series, repeticiones y descanso. Se asignan a cada alumno.
- **Ejercicios**: más de 1.000 con animación. Se pueden renombrar y crear propios.
- **Clases**: turnos semanales por actividad, con cupo. Dentro del turno se tildan los alumnos de esa actividad; el dueño carga el celular y les escribe por WhatsApp. Carga y descarga por Excel.
- **Precios**: valor de cada actividad y combos.
- **Cuadro**: por mes, alumnos, asistencia, lo cobrado, porcentaje de cada profe, lo pagado y cuándo.
- **Profes**: DNI y actividades de cada uno.
- **Ajustes del gimnasio**: logo, nombre, color, tema, clases, link y QR, WhatsApp y contraseña.

## Cómo se calculan las cuentas

- **Cobro**: se elige su cuota, una actividad o un combo. El monto se completa solo y se puede cambiar.
- **Cuota**: si las actividades coinciden justo con un combo, vale el combo. Si no, la suma de cada una.
  Al cambiar precios se actualiza sola, salvo en los alumnos con "Ponerle otro precio".
- **Cobrado por actividad**: cada cobro se reparte entre las actividades del alumno, según el
  precio suelto de cada una. Un cobro de varios meses cuenta entero en el mes en que se cobró.
- **A pagar al profe**: cobrado de la actividad en el mes × porcentaje. Si la actividad tiene
  más de un profe, el dueño elige a quién le registra cada pago.

## Modo demo

Mientras `js/config.js` tenga `apiKey: "COMPLETAR"`, todo queda en el navegador. En la compu,
`http://localhost:5195/?demo` abre la demo aunque la app ya esté conectada a Firebase.

- Dueño: `20111222` / `demo1234`
- Profe: `27333444`
- Alumno con rutina: `28999111`

## Pasar a modo real (Firebase, plan gratis)

1. En <https://console.firebase.google.com>, **Agregar proyecto** (por ejemplo `fitness-salud`).
2. **Authentication** > Comenzar > activá **Correo electrónico/contraseña**.
3. **Firestore Database** > Crear base de datos > modo producción > `southamerica-east1`.
4. En `firestore.rules`, cambiá `20111222` por el DNI real del dueño. Pegá todo en
   Firestore > **Reglas** y tocá **Publicar**.
5. ⚙️ Configuración del proyecto > Tus apps > ícono web `</>`. Copiá `firebaseConfig`
   dentro de `firebase:` en `js/config.js`.
6. En `js/config.js`, cambiá `dnisDueno` por el DNI real del dueño.
7. Authentication > Configuración > **Dominios autorizados**: agregá el dominio donde se publique.
8. Publicá, y que el dueño entre enseguida con su DNI y cree su contraseña. Hasta ese momento,
   cualquiera que ponga ese DNI podría crearla primero.

## Si el dueño se olvida la contraseña

1. En Firebase > Authentication, borrá el usuario `DNI@fitness-salud.app`.
2. En Firestore, borrá el documento `claves/DNI`.
3. El dueño entra con su DNI y crea otra.

## Publicar cambios

Cada vez que cambies un `.css` o `.js`, subí el número `?v=` en `index.html`.

## Archivos

```
index.html            pantalla única
catalogo.json         ejercicios de Gym App
css/gymapp.css        diseño original de Gym App (no editar)
css/estilos.css       agregados de diseño
js/config.js          Firebase, DNI del dueño, actividades
js/util.js            fechas, estado de cuota, avisos
js/cuentas.js         precios, reparto y cuadro
js/base-demo.js       base de la demo (navegador)
js/base-firebase.js   base real (Firebase)
js/datos.js           quién es quién y qué se guarda
js/ui.js              piezas comunes de pantalla
js/panel.js           Inicio, Actividades, Alumnos, Asistencia, Precios, Cuadro, Profes
js/rutinas.js         Rutinas y Ejercicios
js/clases.js          Clases
js/ajustes.js         Ajustes del gimnasio
js/vista-alumno.js    lo que ve el alumno
js/app.js             entrada por DNI y menú
firestore.rules       reglas de seguridad
```

## Límites conocidos

Entrar con DNI es simple pero no es secreto. Quien sepa el DNI de un profe puede pasar
asistencia de sus actividades y ver la lista de alumnos. Quien sepa el DNI de un alumno
puede ver su cuota y registrar su asistencia del día. Los teléfonos, precios y pagos solo
los ve el dueño. Los pesos que anota el alumno quedan en su celular.

Las animaciones de ejercicios se cargan desde gymapp-demo.vercel.app: no borrar ese proyecto.
Con la cuenta gratis de Firebase, el alumno usa unas 40 lecturas cada vez que abre la app.
