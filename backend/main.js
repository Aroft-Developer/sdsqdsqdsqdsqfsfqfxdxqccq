// ✅ main.js
import express from "express";
import cors from "cors";
import fs from "fs";
import Groq from "groq-sdk";

const app = express();
app.use(cors({ origin: "https://project-virid-alpha.vercel.app" }));
app.use(express.json());

// ✅ Ping toutes les 5 minutes pour Render
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

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function analyserParMorceaux(situation, etabs) {
  const CHUNK_SIZE = 40;
  const resultats = [];
  let justificationGlobal = "";

  const chunks = [];
  for (let i = 0; i < etabs.length; i += CHUNK_SIZE) {
    chunks.push(etabs.slice(i, i + CHUNK_SIZE));
  }

  for (const chunk of chunks) {
    const prompt = `
Tu es un assistant éducatif spécialisé.

Voici une situation : "${situation}"

Voici une liste de ${chunk.length} établissements :
${JSON.stringify(chunk, null, 2)}

Analyse et sélectionne au maximum 6 établissements pertinents en fonction de la situation (âge, profil, besoin, etc.).

Si aucun ne correspond, réponds :
{"justification": "Aucun établissement pertinent dans ce groupe."}

Sinon, réponds :
{
  "resultats": [ ... ],
  "justification": "Pourquoi ces établissements sont les meilleurs dans ce groupe."
}

Ne retourne que le JSON. Aucun texte avant ou après.`;

    try {
      const completion = await groq.chat.completions.create({
        model: "mixtral-8x7b-32768",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 1100,
      });

      const raw = completion.choices[0].message.content.trim();
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) continue;

      const json = JSON.parse(match[0]);

      if (json.resultats && Array.isArray(json.resultats)) {
        resultats.push(...json.resultats);
      }
      if (json.justification) {
        justificationGlobal += "\n" + json.justification;
      }
    } catch (e) {
      console.error("❌ Erreur dans un chunk :", e.message);
    }
  }

  return {
    resultats: resultats.slice(0, 6),
    justification: justificationGlobal.trim() || "Analyse effectuée par morceaux.",
  };
}

app.post("/analyse", async (req, res) => {
  try {
    const userRequest = req.body.text;
    if (!userRequest) return res.status(400).json({ error: "texte manquante" });

    const resultatFinal = await analyserParMorceaux(userRequest, etablissements);
    res.json(resultatFinal);

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
