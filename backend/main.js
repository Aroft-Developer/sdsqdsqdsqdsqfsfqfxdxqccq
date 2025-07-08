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

    const prompt = `Tu es un éducateur spécialisé expérimenté qui échange avec un collègue éducateur spécialisé. 
Dans le cadre de ton métier, analyse la situation suivante : "${situation}".
Fournis un conseil professionnel, clair, structuré et orienté solution, destiné à un éducateur spécialisé.
Le conseil doit comporter entre 10 et 20 lignes, être pragmatique, éviter les généralités, et inclure des pistes d'intervention concrètes, ainsi que des points d'attention spécifiques à cette situation. 
Tu peux évoquer les démarches à envisager, les acteurs à mobiliser, et les risques à surveiller, toujours dans une optique de soutien efficace au jeune.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 700,
    });

    const responseText = completion.choices[0].message.content.trim();
    res.json({ reponse: responseText });

  } catch (err) {
    console.error("❌ Erreur serveur (conseil) :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ✅ Endpoint /analyse
// ✅ Endpoint /analyse
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

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1100,
    });

    const rawResponse = completion.choices[0].message.content.trim();

    let maybeJson;
    try {
      const match = rawResponse.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("Aucun JSON détecté dans la réponse GPT");
      maybeJson = match[0];
    } catch (e) {
      console.error("❌ Erreur extraction JSON :", e);
      return res.status(500).json({ error: "Impossible d'extraire un JSON valide" });
    }

    let parsed;
    try {
      parsed = JSON.parse(maybeJson);
    } catch (e) {
      console.error("❌ Erreur parsing JSON GPT:", e);
      console.error("🔍 Contenu reçu :", maybeJson);
      return res.status(500).json({ error: "Erreur parsing réponse GPT" });
    }

    // ✅ Si pas de resultats, renvoyer uniquement justification
    if (!parsed.resultats || !Array.isArray(parsed.resultats) || parsed.resultats.length === 0) {
      return res.json({
        resultats: [],
        justification: parsed.justification || "Aucun établissement ne correspond à cette demande.",
      });
    }

    // ✅ Sinon, renvoyer tout
    return res.json(parsed);

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
