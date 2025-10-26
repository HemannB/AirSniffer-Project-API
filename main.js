// ============================================
// ==========   AirSniffer Mk1  ===============
// ============================================
// Author: Bruno Hemann
// Advisor: Prof. Me. Laurence Crestani Tasca
// ============================================

import express from "express";
import pg from "pg";
import "dotenv/config";

// ======================
// ===== CONSTANTS =====
// ======================
const { Pool } = pg;
const app = express();
const PORT = process.env.PORT || 3000;
const cors = require('cors');
app.use(cors());


// ======================
// === MIDDLEWARES =====
// ======================
app.use(express.json());

// ================================
// ==== DATABASE CONFIGURATION ====
// ================================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("neon.tech")
    ? { rejectUnauthorized: false }
    : false, 
});

(async () => {
  try {
    const client = await pool.connect();
    console.log("Connected to NeonDB successfully!");
    client.release();
  } catch (err) {
    console.error("Database connection failed:", err.message);
  }
})();

// ======================
// ====== ROUTES ========
// ======================

// Check route
app.get("/", (_, res) => {
  res.status(200).send({ status: "ok", message: "AirSniffer API running" });
});

// Main sensor data route
app.post("/sensores", async (req, res) => {
  const { temperature, humidity, aqi, co2_ppm, tvoc_ppb, gases_ppm } = req.body;

  if (
    [temperature, humidity, aqi, co2_ppm, tvoc_ppb, gases_ppm].some(
      (v) => v === undefined
    )
  ) {
    return res
      .status(400)
      .json({ status: "error", message: "Missing required sensor fields" });
  }

  try {
    const query = `
      INSERT INTO air_data 
      (temperature, humidity, aqi, co2_ppm, tvoc_ppb, gases_ppm)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
    const values = [temperature, humidity, aqi, co2_ppm, tvoc_ppb, gases_ppm];

    await pool.query(query, values);

    console.log(
      `Inserted: T=${temperature}°C | H=${humidity}% | AQI=${aqi}`
    );

    res.status(200).json({ status: "ok" });
  } catch (err) {
    console.error("Database insert error:", err.message);
    res.status(500).json({ status: "error", message: err.message });
  }
});

app.get("/sensores", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM air_data ORDER BY created_at DESC LIMIT 100`
    );

    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Erro ao buscar dados:", err.message);
    res.status(500).json({ status: "error", message: err.message });
  }
});

app.get("/historico", async (req, res) => {
  const { horas = 24 } = req.query;
  try {
    const result = await pool.query(
      `SELECT * FROM air_data WHERE created_at >= NOW() - INTERVAL '${horas} hours' ORDER BY created_at`
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Erro ao buscar histórico:", err.message);
    res.status(500).json({ status: "error", message: err.message });
  }
});



// ======================
// ====== SERVER ========
// ======================
app.listen(PORT, () =>
  console.log(`AirSniffer API running on http://localhost:${PORT}`)
);
