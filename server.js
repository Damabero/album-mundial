const express = require("express");
const cors = require("cors");
const csc = require("country-state-city");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DIST_DIR = path.join(__dirname, "dist");
const STATIC_DIR = fs.existsSync(DIST_DIR) ? DIST_DIR : __dirname;

app.use(cors());
app.use(express.json());

app.get("/api/countries", (req, res) => {
  try {
    const countries = csc.Country.getAllCountries();
    const countryList = countries.map((country) => country.name).sort();
    res.json({ data: countryList, success: true });
  } catch (error) {
    console.error("Error en /api/countries:", error);
    res.status(500).json({ error: "Error al cargar paises", success: false });
  }
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    service: "album-mundial-api",
    timestamp: Date.now()
  });
});

app.get("/api/states/:country", (req, res) => {
  try {
    const country = decodeURIComponent(req.params.country);
    const countries = csc.Country.getAllCountries();
    const countryObj = countries.find((item) => item.name === country);

    if (!countryObj) {
      return res.status(404).json({ error: "Pais no encontrado", success: false });
    }

    const states = csc.State.getStatesOfCountry(countryObj.isoCode);
    const stateList = (states || [])
      .map((state) => ({
        nombre: state.name,
        nombreLimpio: state.name,
        isoCode: state.isoCode
      }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));

    return res.json({ data: stateList, success: true });
  } catch (error) {
    console.error("Error en /api/states:", error);
    return res.status(500).json({ error: "Error al cargar estados", success: false });
  }
});

app.get("/api/cities/:country/:state", (req, res) => {
  try {
    const country = decodeURIComponent(req.params.country);
    const state = decodeURIComponent(req.params.state);
    const countries = csc.Country.getAllCountries();
    const countryObj = countries.find((item) => item.name === country);

    if (!countryObj) {
      return res.status(404).json({ error: "Pais no encontrado", success: false });
    }

    const states = csc.State.getStatesOfCountry(countryObj.isoCode);
    const stateObj = states.find((item) => item.name === state || item.isoCode === state);

    if (!stateObj) {
      return res.status(404).json({ error: "Estado no encontrado", success: false });
    }

    const cities = csc.City.getCitiesOfState(countryObj.isoCode, stateObj.isoCode);
    const cityList = (cities || []).map((city) => city.name).sort();

    return res.json({ data: cityList, success: true });
  } catch (error) {
    console.error("Error en /api/cities:", error);
    return res.status(500).json({ error: "Error al cargar ciudades", success: false });
  }
});

app.use(express.static(STATIC_DIR));

app.get("/{*rest}", (req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return next();
  }

  const indexPath = path.join(STATIC_DIR, "index.html");
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }

  return res.status(404).send("No se encontro la aplicacion frontend.");
});

app.listen(PORT, () => {
  console.log(`Servidor ejecutandose en http://localhost:${PORT}`);
});
