import express from "express";
import cors from "cors";
import fs from "fs";
import axios from "axios";

const app = express();

// ✅ Autorise uniquement ton frontend Vercel
app.use(
  cors({ origin: "https://project-virid-alpha.vercel.app" })
);
app.use(express.json());

// ✅ Ping toutes les 5 minutes pour garder Render réveillé
setInterval(() => {
  fetch("https://project-cwgk.onrender.com")
    .then(() => console.log("✅ Ping sent to keep alive"))
    .catch(() => console.log("❌ Ping failed"));
}, 5 * 60 * 1000);

// ✅ Chargement des établissements
const fullData = JSON.parse(fs.readFileSync("./resultats_ime.json", "utf-8"));
const etablissements = fullData.map((e) => ({
  id: String(e.id),
  nom: e.nom || "Nom inconnu",
  type: e.type || "Type inconnu",
  age_min: e.age_min || 0,
  age_max: e.age_max || 21,
  ville: e.ville || "Ville inconnue",
  site_web: e.url_source || "",
  google_maps: e.google_maps || "",
}));

// 🔁 Endpoint /conseil via GROQ API
app.post("/conseil", async (req, res) => {
  try {
    const situation = req.body.text;
    if (!situation) return res.status(400).json({ error: "situation manquante" });

    const prompt = `Tu es un éducateur spécialisé expérimenté qui échange avec un collègue éducateur spécialisé. \nDans le cadre de ton métier, analyse la situation suivante : "${situation}".\nFournis un conseil professionnel, clair, structuré et orienté solution, destiné à un éducateur spécialisé.\nLe conseil doit comporter entre 10 et 20 lignes, être pragmatique, éviter les généralités, et inclure des pistes d'intervention concrètes, ainsi que des points d'attention spécifiques à cette situation.\nTu peux évoquer les démarches à envisager, les acteurs à mobiliser, et les risques à surveiller.`;

    const completion = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "mixtral-8x7b-32768",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 700,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const responseText = completion.data.choices[0].message.content.trim();
    res.json({ reponse: responseText });
  } catch (err) {
    console.error("❌ Erreur serveur (conseil) :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// 🔁 Endpoint /analyse via GROQ API
app.post("/analyse", async (req, res) => {
  try {
    const userRequest = req.body.text;
    if (!userRequest) return res.status(400).json({ error: "texte manquante" });

    const etabsLimites = etablissements.slice(0, 40);

    const prompt = `
Tu es un assistant éducatif spécialisé.

À partir de cette situation :

"${userRequest}"

Tu dois sélectionner au maximum 6 établissements parmi cette liste, en tenant compte du profil, de l'âge, du type de besoin et des ressources en ligne disponibles.

⚠️ Si la demande n'a aucun rapport avec un placement, un jeune, ou les établissements ci-dessous, tu DOIS renvoyer un objet JSON avec uniquement une clé "justification", sans remplir "resultats".

Liste des établissements :
${JSON.stringify(etabsLimites, null, 2)}

Réponds STRICTEMENT avec ce format :

{
  "resultats": [
    {
      "id": "string",
      "nom": "string",
      "type": "string",
      "age_min": number,
      "age_max": number,
      "ville": "string",
      "site_web": "string",
      "google_maps": "string"
    }
  ],
  "justification": "Texte explicatif enrichi avec des informations utiles en ligne sur les établissements proposés"
}

⚠️ Si aucun établissement ne correspond, renvoie uniquement :
{
  "justification": "Explication sur pourquoi aucun établissement ne correspond à cette demande."
}

⚠️ Ne mets aucun texte AVANT ou APRÈS ce JSON. Juste le JSON pur.
Remplace les valeurs manquantes par "Inconnu".
`;

    const completion = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "mixtral-8x7b-32768",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 1100,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const rawResponse = completion.data.choices[0].message.content.trim();
    const match = rawResponse.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Aucun JSON détecté dans la réponse");

    const maybeJson = match[0];
    const parsed = JSON.parse(maybeJson);

    if (!parsed.resultats || !Array.isArray(parsed.resultats) || parsed.resultats.length === 0) {
      return res.json({
        resultats: [],
        justification: parsed.justification || "Aucun établissement ne correspond à cette demande.",
      });
    }

    return res.json(parsed);
  } catch (err) {
    console.error("❌ Erreur serveur (/analyse) :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur Express lancé sur le port ${PORT}`);
});
