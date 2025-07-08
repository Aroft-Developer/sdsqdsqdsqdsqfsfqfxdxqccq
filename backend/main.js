import express from "express";
import cors from "cors";
import fs from "fs";
import OpenAI from "openai";

const app = express();

// ✅ Autorise uniquement ton frontend Vercel
app.use(cors({
  origin: "https://project-virid-alpha.vercel.app" // Remplace par ton domaine Vercel si custom
}));

app.use(express.json());

setInterval(() => {
  fetch("https://project-cwgk.onrender.com")
    .then(() => console.log("Ping sent"))
    .catch(() => console.log("Ping failed"));
}, 5 * 60 * 1000); // Toutes les 5 min


// Charger les établissements
const fullData = JSON.parse(fs.readFileSync("./resultats_ime.json", "utf-8"));

const etablissements = fullData.map(e => ({
  id: String(e.id),
  nom: e.nom || "Nom inconnu",
  type: e.type || "Type inconnu",
  age_min: e.age_min || 0,
  age_max: e.age_max || 21,
  ville: e.ville || "Ville inconnue",
  site_web: e.url_source || "",
  google_maps: e.google_maps || ""
}));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "sk-proj-...", // ⚠️ Change ta clé en variable d'env pour la sécurité
});

app.post("/conseil", async (req, res) => {
  try {
    const situation = req.body.text;
    if (!situation) return res.status(400).json({ error: "situation manquante" });

    const prompt = `...`; // (Pas modifié ici pour raccourcir la réponse)

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 500,
    });

    const responseText = completion.choices[0].message.content.trim();
    res.json({ reponse: responseText });

  } catch (err) {
    console.error("Erreur serveur (conseil) :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.post("/analyse", async (req, res) => {
  try {
    const userRequest = req.body.text;
    if (!userRequest) return res.status(400).json({ error: "texte manquant" });

    const etabsLimites = etablissements.slice(0, 40);

    const prompt = `...`; // (Raccourci ici aussi)

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 700,
    });

    const rawResponse = completion.choices[0].message.content.trim();
    const jsonStart = rawResponse.indexOf("{");
    const jsonEnd = rawResponse.lastIndexOf("}");
    const maybeJson = rawResponse.slice(jsonStart, jsonEnd + 1);

    let parsed;
    try {
      parsed = JSON.parse(maybeJson);
    } catch (e) {
      console.error("Erreur parsing JSON GPT:", e);
      return res.status(500).json({ error: "Erreur parsing réponse GPT" });
    }

    res.json(parsed);
  } catch (err) {
    console.error("Erreur serveur :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ✅ Port dynamique pour Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur Express démarré sur le port ${PORT}`);
});
