const SONIDO_URL = "sound.wav";
const ACUMULATIVO = true;
const cambiarordentimer = 3000;
const SECCIONES = [
  {
    nombre: "Sección 1",
    descripcion:
      "Instrucciones, en la siguiente primera fase, va haber un total de 17 preguntas, en cada pregunta va haber múltiples opciones, en las cuales hay respuestas correctas, de no querer seguir puedes apretar el botón de rendición que aparecerá en la parte derecha superior, dando así fin al test, este botón permanecerá en cada una de las fases, en caso de fallar una de las respuestas también se acabará el test.",
  },
  {
    nombre: "Sección 2",
    descripcion:
      "instrucciones: una vez ya completada la fase 1 sigue la fase 2, que tiene un poco más de complejidad, pero sigue siendo muy fácil, en esta sección va a ver un límite de tiempo de 5 minutos para responder las 17 preguntas",
  },
  {
    nombre: "Sección 3",
    descripcion:
      "Ya una vez acabada la fase 2, viene la 3, como regalo de haber llegado a más de un tercio del test, te pondremos el tiempo de manera visible para que puedas verlo, ahora de 5 minutos se reduce a 4 minutos.",
  },
  {
    nombre: "Sección 4",
    descripcion:
      "bien ya pasaste la fase 3, en la siguiente sección de preguntas es casi igual a la anterior con la única diferencia que con anterioridad tenías 4 minutos ahora tienes 3 minutos, además de que se van a escuchar unos sonidos, se le solicita que como mínimo suba el volumen la mayor posible, mínimo del 50% de preferencia en un rango del 75% al 100%.",
  },
  {
    nombre: "Sección 5",
    descripcion:
      "instrucciones: una vez pasado ya la fase 4, todo seguirá como antes, como verán durante las instrucciones se sigue oyendo el ruido, no se preocupen es parte del test, en cuanto a las preguntas y el tiempo, el tiempo ahora será de 2 minutos, mientras que en las preguntas antes de que den una respuesta a cada pregunta habrá señales de advertencia.",
    sound: true,
  },
  {
    nombre: "Sección 6",
    descripcion:
      "instrucciones: ya están en la etapa final, tendrán las mismas dificultades que las fases anteriores, la única ventaja es que serán menos preguntas siendo un total de 15 preguntas, el tiempo que tienen es de 1 minuto, cuidado cada 3 segundos se desorganizan las opciones.",
    sound: true,
  },
];

const reglasSeccion = {
  "Sección 1": { fallaAlEquivocarse: true },
  "Sección 2": { timer: 300, timervisible: false },
  "Sección 3": { timer: 240, timervisible: true },
  "Sección 4": { reproducirSonido: true, timer: 180 },
  "Sección 5": { confirmarRespuesta: true, timer: 120 },
  "Sección 6": { cambiarOrden: true, timer: 60 },
};

const RANGOS_PREGUNTAS = [
  { desde: 0, hasta: 16 },
  { desde: 17, hasta: 33 },
  { desde: 34, hasta: 50 },
  { desde: 51, hasta: 67 },
  { desde: 68, hasta: 84 },
  { desde: 85, hasta: 99 },
];

// const RANGOS_PREGUNTAS = [
//   { desde: 0, hasta: 2 },
//   { desde: 3, hasta: 5 },
//   { desde: 6, hasta: 8 },
//   { desde: 9, hasta: 11 },
//   { desde: 12, hasta: 17 },
//   { desde: 18, hasta: 23 },
// ];

let indiceSeccion = 0;
let preguntas = [];
let temporizador, sonido, intervalCambiarOrden;
let respuestasPorSeccion = [];
let testFinalizado = false;

if (localStorage.getItem("test_completado") === "true") {
  document.getElementById("seccion").innerHTML =
    "<h2>Ya completaste el test. No puedes repetirlo.</h2>";
  document.getElementById("panelDerecho").style.display = "none";
} else {
  cargarPreguntas();
}

async function cargarPreguntas() {
  const res = await fetch("/preguntas");
  preguntas = await res.json();
  mostrarDescripcion();
}

function obtenerReglasSeccion(nombreSeccion) {
  const reglas = {};
  for (let i = 0; i <= indiceSeccion; i++) {
    const sec = SECCIONES[i].nombre;
    const r = reglasSeccion[sec];
    if (!r) continue;
    if (ACUMULATIVO || i === indiceSeccion) {
      Object.assign(reglas, r);
    }
  }
  return reglas;
}

function mostrarDescripcion() {
  clearInterval(temporizador);
  clearInterval(intervalCambiarOrden);
  if (sonido) sonido.pause();
  const seccionData = SECCIONES[indiceSeccion];
  document.getElementById("seccion").innerHTML = `
        <div id="descripcion">
          <h2>${seccionData.nombre}</h2>
          <p>${seccionData.descripcion}</p>
          <button id="aceptar">Aceptar</button>
        </div>`;
  if (seccionData.sound === true) {
    sonido = new Audio(SONIDO_URL);
    sonido.loop = true;
    sonido.play();
  }
  document.getElementById("panelDerecho").style.display = "none";
  document.getElementById("aceptar").addEventListener("click", mostrarSeccion);
}

function mostrarSeccion() {
  const cont = document.getElementById("seccion");
  const seccionData = SECCIONES[indiceSeccion];
  const reglas = obtenerReglasSeccion(seccionData.nombre);

  cont.innerHTML = `<h2>${seccionData.nombre}</h2>`;
  document.getElementById("panelDerecho").style.display = "flex";
  clearInterval(temporizador);
  clearInterval(intervalCambiarOrden);
  if (sonido) sonido.pause();

  let rango = RANGOS_PREGUNTAS[indiceSeccion];
  let preguntasSeccion = preguntas.slice(rango.desde, rango.hasta + 1);
  respuestasPorSeccion[indiceSeccion] = {
    seccion: seccionData.nombre,
    respuestas: [],
    rendiciones: [],
  };

  preguntasSeccion.forEach((p, i) => {
    let div = document.createElement("div");
    div.classList.add("pregunta");
    div.innerHTML = `<p>${rango.desde + i + 1}- ${
      p.Pregunta
    }</p><div class="opciones">${Object.values(p.opciones)
      .map(
        (o) =>
          `<label><input type="radio" name="pregunta${i}" value="${o}" onclick="responder(event,${i},'${o}','${Object.values(
            p.respuestas
          )}')">${o}</label>`
      )
      .join("")}</div>`;
    cont.appendChild(div);
  });

  const timerEl = document.getElementById("timer");
  if (reglas.timer) {
    let tiempo = reglas.timer;
    timerEl.style.display = "block";
    timerEl.textContent = `Tiempo restante: ${tiempo}s`;
    temporizador = setInterval(() => {
      tiempo--;
      timerEl.textContent = `Tiempo restante: ${tiempo}s`;
      if (tiempo <= 0) {
        clearInterval(temporizador);
        marcarTimeout();
        finalizarTest();
      }
    }, 1000);
    if (reglas.timervisible === false) timerEl.style.display = "none";
  } else timerEl.style.display = "none";

  if (reglas.reproducirSonido) {
    sonido = new Audio(SONIDO_URL);
    sonido.loop = true;
    sonido.play();
  }

  if (reglas.cambiarOrden) {
    intervalCambiarOrden = setInterval(() => {
      document.querySelectorAll(".pregunta").forEach((div, i) => {
        const opcionesDiv = div.querySelector(".opciones");
        let opciones = Array.from(opcionesDiv.querySelectorAll("label"));
        const seleccionadas = opciones
          .filter((l) => l.querySelector("input").checked)
          .map((l) => l.querySelector("input").value);
        opciones.sort(() => Math.random() - 0.5);
        opcionesDiv.innerHTML = "";
        opciones.forEach((o) => opcionesDiv.appendChild(o));
        opcionesDiv.querySelectorAll("input").forEach((inp) => {
          if (seleccionadas.includes(inp.value)) inp.checked = true;
        });
      });
    }, cambiarordentimer);
  }
}

function responder(event, indexPregunta, opcion, correctas) {
  const seccionObj = respuestasPorSeccion[indiceSeccion];
  const correctasArr = Array.isArray(correctas)
    ? correctas
    : String(correctas)
        .split(",")
        .map((s) => s.trim());

  const index = seccionObj.respuestas.findIndex(
    (r) => r.indexPregunta === indexPregunta
  );
  if (index !== -1) seccionObj.respuestas[index].opcion = opcion;
  else
    seccionObj.respuestas.push({
      indexPregunta,
      opcion,
      correctas: correctasArr,
    });

  const reglas = obtenerReglasSeccion(SECCIONES[indiceSeccion].nombre);
  if (reglas.fallaAlEquivocarse && !correctasArr.includes(opcion)) {
    alert("¡Fallaste!");
    seccionObj.rendiciones.push({
      seccion: SECCIONES[indiceSeccion].nombre,
      indexPregunta,
      tipo: "fallo",
    });
    finalizarTest();
  }

  if (reglas.confirmarRespuesta) {
    if (!confirm("¿Seguro que quieres elegir esta respuesta?")) return;
  }
}

document.getElementById("pasar").addEventListener("click", () => {
  if (!todasContestadas()) {
    alert("Debes contestar todas las preguntas antes de pasar.");
    return;
  }
  indiceSeccion++;
  if (indiceSeccion >= SECCIONES.length) {
    finalizarTest();
    return;
  }
  mostrarDescripcion();
});

document.getElementById("rendirse").addEventListener("click", () => {
  const seccionObj = respuestasPorSeccion[indiceSeccion];
  let ultimaPregunta = null;
  document.querySelectorAll(".pregunta").forEach((div) => {
    div.querySelectorAll("input").forEach((inp) => {
      if (inp.checked) ultimaPregunta = div.querySelector("p").textContent;
    });
  });
  seccionObj.rendiciones.push({
    seccion: SECCIONES[indiceSeccion].nombre,
    pregunta: ultimaPregunta,
    tipo: "rendicion",
  });
  alert("Te rendiste. El test ha terminado.");
  finalizarTest();
});

function marcarTimeout() {
  respuestasPorSeccion[indiceSeccion] = {
    seccion: SECCIONES[indiceSeccion].nombre,
    respuestas: [],
    rendiciones: [
      {
        seccion: SECCIONES[indiceSeccion].nombre,
        pregunta: null,
        tipo: "timeout",
      },
    ],
  };
}

function todasContestadas() {
  const seccionObj = respuestasPorSeccion[indiceSeccion];
  if (!seccionObj) return false;
  const total = document.querySelectorAll(".pregunta").length;
  return (
    seccionObj.respuestas.length === total &&
    seccionObj.respuestas.every((r) => r.opcion && r.opcion.length > 0)
  );
}

async function finalizarTest() {
  if (testFinalizado) return;
  testFinalizado = true;

  const data = respuestasPorSeccion.map((s, i) => {
    if (!s) return { seccion: null, respuestas: [], rendiciones: [] };
    if (
      s.rendiciones.length &&
      s.rendiciones[0].tipo === "timeout" &&
      i === indiceSeccion
    ) {
      return { seccion: s.seccion, respuestas: [], rendiciones: s.rendiciones };
    }
    return s;
  });

  try {
    await fetch("/guardar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fecha: new Date().toISOString(),
        seccionesCompletadas: indiceSeccion,
        secciones: data,
      }),
    });
  } catch (e) {
    console.error("Error guardando respuestas:", e);
  }

  localStorage.setItem("test_completado", "false");
  alert(
    "Tus respuestas han sido guardadas. La pestaña se cerrará automáticamente."
  );
  try {
    window.close();
  } catch (e) {}
  location.reload();
}
