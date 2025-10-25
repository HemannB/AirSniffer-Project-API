const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');

const app = express();
app.use(bodyParser.json());

// Conexão com Neon PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Recebe dados do ESP32
app.post('/sensores', async (req, res) => {
  const { temperature, humidity, aqi, co2_ppm, tvoc_ppb, gases_ppm } = req.body;

  try {
    await pool.query(
      `INSERT INTO air_data (temperature, humidity, aqi, co2_ppm, tvoc_ppb, gases_ppm) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [temperature, humidity, aqi, co2_ppm, tvoc_ppb, gases_ppm]
    );
    res.status(200).send({ status: 'ok' });
  } catch (err) {
    console.error(err);
    res.status(500).send({ status: 'error', message: err.message });
  }
});

// Teste da API
app.get('/', (req, res) => res.send('API AirSniffer rodando!'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
