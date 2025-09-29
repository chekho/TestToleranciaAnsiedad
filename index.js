const express = require("express");
const fs = require("fs");
const cors = require("cors");
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const RESPUESTAS_FILE = "./respuestas.json";

// Guardar respuestas
app.post("/guardar", (req, res) => {
  try {
    let data = [];
    if (fs.existsSync(RESPUESTAS_FILE)) {
      const raw = fs.readFileSync(RESPUESTAS_FILE, "utf8");
      if (raw.trim() !== "") data = JSON.parse(raw);
    }
    data.push(req.body);
    fs.writeFileSync(RESPUESTAS_FILE, JSON.stringify(data, null, 2));
    res.json({ ok: true });
  } catch (e) {
    console.error("Error guardando respuestas:", e);
    res.status(500).json({ error: "No se pudo guardar" });
  }
});

// Obtener todas las respuestas
app.get("/respuestas", (req, res) => {
  try {
    if (fs.existsSync(RESPUESTAS_FILE)) {
      const raw = fs.readFileSync(RESPUESTAS_FILE, "utf8");
      if (raw.trim() === "") return res.json([]);
      const data = JSON.parse(raw);
      res.json(data);
    } else res.json([]);
  } catch (e) {
    console.error("Error leyendo respuestas:", e);
    res.status(500).json({ error: "No se pudo leer" });
  }
});

// Servir preguntas
app.get("/preguntas", (req, res) => {
  const preguntas = JSON.parse(fs.readFileSync("./preguntas.json"));
  res.json(preguntas);
});

// Redirigir /dashboard
app.get("/dashboard", (req, res) => {
  res.sendFile(__dirname + "/public/dashboard.html");
});

app.listen(3000, () => console.log("Servidor corriendo en puerto 3000"));
