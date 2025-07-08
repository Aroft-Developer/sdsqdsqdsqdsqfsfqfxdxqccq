import express from "express";
import cors from "cors";
import fs from "fs";
import OpenAI from "openai";

const app = express();

// ✅ Autorise uniquement ton frontend Vercel
app.use(cors({
  origin: "https://project-virid-alpha.vercel.app"
}));

app.use(express.json());

// ✅ Ping toutes les 5 minutes pour garder Render réveillé
setInterval(() => {
  fetch("https://project-cwgk.onrender.com")
    .then(() => console.log("✅ Ping sent to keep alive"))
    .catch(() => console.log("❌ Ping failed"));
}, 5 * 60 * 1000);

// ✅ Chargement des établissements
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
  apiKey: process.env.OPENAI_API_KEY || "sk-proj-...", // ⚠️ à sécuriser !
});

// ✅ Endpoint /conseil
app.post("/conseil", async (req, res) => {
  try {
    const situation = req.body.text;
    if (!situation) return res.status(400).json({ error: "situation manquante" });

    const prompt = `Tu es un éducateur spécialisé. Donne un conseil court, concret et orienté solution à un jeune dans cette situation : "${situation}"`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 500,
    });

    const responseText = completion.choices[0].message.content.trim();
    res.json({ reponse: responseText });

  } catch (err) {
    console.error("❌ Erreur serveur (conseil) :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ✅ Endpoint /analyse
app.post("/analyse", async (req, res) => {
  try {
    const userRequest = req.body.text;
    if (!userRequest) return res.status(400).json({ error: "texte manquant" });

    const etabsLimites = etablissements.slice(0, 40); // limite pour éviter trop de tokens

    const prompt = `Tu es un assistant éducatif. À partir de cette situation : "${userRequest}", choisis les établissements les plus adaptés parmi la liste suivante (format JSON). Renvoie UNIQUEMENT un JSON avec un tableau "recommandations", chaque item doit contenir : id, nom, raison (courte) du choix.

Liste des établissements :\n\n${JSON.stringify(etabsLimites, null, 2)}\n\nRéponds avec uniquement un objet JSON bien formé.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 700,
    });

    const rawResponse = completion.choices[0].message.content.trim();
    console.log("🧾 Réponse GPT brute :", rawResponse);

    // ✅ Extraction JSON entre les accolades
    let maybeJson;
    try {
      const match = rawResponse.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("Aucun JSON détecté dans la réponse GPT");
      maybeJson = match[0];
    } catch (e) {
      console.error("❌ Erreur extraction JSON :", e);
      return res.status(500).json({ error: "Impossible d'extraire un JSON valide" });
    }

    // ✅ Parsing JSON
    let parsed;
    try {
      parsed = JSON.parse(maybeJson);
    } catch (e) {
      console.error("❌ Erreur parsing JSON GPT:", e);
      console.error("🔍 Contenu reçu :", maybeJson);
      return res.status(500).json({ error: "Erreur parsing réponse GPT" });
    }

    res.json(parsed);

  } catch (err) {
    console.error("❌ Erreur serveur (/analyse) :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ✅ Port dynamique pour Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur Express lancé sur le port ${PORT}`);
});
