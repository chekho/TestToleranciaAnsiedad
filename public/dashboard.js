let preguntasGlobal = [];

async function cargarDatos() {
  // Primero cargo preguntas y las guardo en memoria
  const pregRes = await fetch("/preguntas");
  preguntasGlobal = await pregRes.json();

  const res = await fetch("/respuestas");
  const tests = await res.json();
  generarTabla(tests);
  mostrarListaTests(tests);
}

function generarTabla(tests) {
  const tabla = document.getElementById("tabla-general");
  const total = tests.length;

  let categorias = {
    Tolerante: [],
    Rendido: [],
    Fallo: [],
  };

  tests.forEach((user) => {
    const tieneFallo = user.secciones.some((sec) =>
      sec.rendiciones.some((r) => r.tipo === "fallo" || r.tipo === "timeout")
    );

    const tieneRendicion = user.secciones.some((sec) =>
      sec.rendiciones.some((r) => r.tipo === "rendicion")
    );

    if (tieneFallo) categorias.Fallo.push(user);
    else if (tieneRendicion) categorias.Rendido.push(user);
    else categorias.Tolerante.push(user);
  });

  function calcularSubniveles(usuarios, tipo) {
    let tcl = 0,
      tc = 0,
      te = 0;
    usuarios.forEach((user) => {
      let fases = { TCL: false, TC: false, TE: false };

      user.secciones.forEach((sec) => {
        sec.rendiciones.forEach((r) => {
          if (
            (tipo === "Fallo" &&
              (r.tipo === "fallo" || r.tipo === "timeout")) ||
            (tipo === "Rendido" && r.tipo === "rendicion")
          ) {
            const fase = secFase(sec.seccion);
            if (fase === 1 || fase === 2) fases.TCL = true;
            if (fase === 3 || fase === 4) fases.TC = true;
            if (fase === 5 || fase === 6) fases.TE = true;
          }
        });
      });

      if (fases.TCL) tcl++;
      if (fases.TC) tc++;
      if (fases.TE) te++;
    });

    return { TCL: tcl, TC: tc, TE: te };
  }

  function secFase(sec) {
    const n = parseInt(sec.match(/\d+/)[0], 10);
    return n;
  }

  const renSub = calcularSubniveles(categorias.Rendido, "Rendido");
  const falSub = calcularSubniveles(categorias.Fallo, "Fallo");

  function mostrarPorcentaje(cantidad) {
    return total === 0 ? "0%" : `${((cantidad / total) * 100).toFixed(1)}%`;
  }

  tabla.innerHTML = `
      <tr><th colspan="2">Grupo General: ${total} participantes</th></tr>
      <tr><td class="subnivel">Tolerantes</td><td>${mostrarPorcentaje(
        categorias.Tolerante.length
      )} (${categorias.Tolerante.length})</td></tr>

      <tr><td class="subnivel">Rendidos</td><td>${mostrarPorcentaje(
        categorias.Rendido.length
      )} (${categorias.Rendido.length})</td></tr>
      <tr><td class="subsubnivel">TCL</td><td>${mostrarPorcentaje(
        renSub.TCL
      )} (${renSub.TCL})</td></tr>
      <tr><td class="subsubnivel">TC</td><td>${mostrarPorcentaje(renSub.TC)} (${
    renSub.TC
  })</td></tr>
      <tr><td class="subsubnivel">TE</td><td>${mostrarPorcentaje(renSub.TE)} (${
    renSub.TE
  })</td></tr>

      <tr><td class="subnivel">Falla</td><td>${mostrarPorcentaje(
        categorias.Fallo.length
      )} (${categorias.Fallo.length})</td></tr>
      <tr><td class="subsubnivel">TCL</td><td>${mostrarPorcentaje(
        falSub.TCL
      )} (${falSub.TCL})</td></tr>
      <tr><td class="subsubnivel">TC</td><td>${mostrarPorcentaje(falSub.TC)} (${
    falSub.TC
  })</td></tr>
      <tr><td class="subsubnivel">TE</td><td>${mostrarPorcentaje(falSub.TE)} (${
    falSub.TE
  })</td></tr>
    `;
}

function mostrarListaTests(tests) {
  const container = document.getElementById("tests");
  container.innerHTML = "";

  tests.forEach((test, index) => {
    const item = document.createElement("div");
    item.classList.add("test-item");
    item.innerHTML = `#${index + 1} - ${new Date(test.fecha).toLocaleString()}`;

    const detalle = document.createElement("div");
    detalle.classList.add("detalle");

    test.secciones.forEach((seccion) => {
      const secDiv = document.createElement("div");
      secDiv.innerHTML = `<strong>${seccion.seccion}</strong>`;

      seccion.respuestas.forEach((r) => {
        // ahora usamos indexPregunta para sacar el texto real
        const preguntaObj = preguntasGlobal[r.indexPregunta];
        const textoPregunta = preguntaObj
          ? preguntaObj.Pregunta
          : "Pregunta desconocida";

        const acierto = Array.isArray(r.opcion)
          ? r.opcion.every((o) => r.correctas.includes(o))
          : r.correctas.includes(r.opcion);

        const p = document.createElement("p");
        p.innerHTML = `${textoPregunta} <br> Respuesta: ${
          Array.isArray(r.opcion) ? r.opcion.join(", ") : r.opcion
        } - <span class="${acierto ? "acierto" : "fallo"}">${
          acierto ? "Correcto" : "Incorrecto"
        }</span>`;
        secDiv.appendChild(p);
      });

      seccion.rendiciones.forEach((r) => {
        const p = document.createElement("p");
        const pregunta = r.pregunta ? r.pregunta : "Sin pregunta";
        p.innerHTML = `<em>${pregunta} [${r.tipo}]</em>`;
        secDiv.appendChild(p);
      });

      detalle.appendChild(secDiv);
    });

    item.appendChild(detalle);
    item.addEventListener("click", () => {
      detalle.style.display =
        detalle.style.display === "none" ? "block" : "none";
    });

    container.appendChild(item);
  });
}

cargarDatos();
