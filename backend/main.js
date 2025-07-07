import express from "express";
import cors from "cors";
import fs from "fs";
import OpenAI from "openai";

const app = express();
app.use(cors());
app.use(express.json());

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
  apiKey: process.env.OPENAI_API_KEY || "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",
});

app.post("/conseil", async (req, res) => {
  try {
    const situation = req.body.text;
    if (!situation) return res.status(400).json({ error: "situation manquante" });

    const prompt = `
Tu es un éducateur spécialisé expérimenté.

Tu t'adresses à un autre éducateur spécialisé qui te décrit une situation difficile (ex : alcoolisme parental, fugue, violence, déscolarisation, troubles psy...).

Ta mission est de lui donner des **conseils concrets et professionnels** qu’il pourra appliquer **dans le cadre de son travail**.

Réponds de manière :
- concise (max. 15 lignes),
- sans phrases d'empathie ou de consolation,
- structurée autour de solutions concrètes à mettre en œuvre :
  - démarches à suivre,
  - dispositifs à mobiliser,
  - structures à contacter,
  - signalisations éventuelles à faire,
  - outils de terrain.

Parle comme un professionnel du social qui conseille un collègue lors d’un briefing d’équipe, pas comme un thérapeute.

Situation : "${situation}"

Réponds directement, sans introduction ni conclusion, et sans texte autour.
`;


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

    const etabsLimités = etablissements.slice(0, 40);

    const prompt = `
Tu es un assistant pour éducateurs spécialisés.

Voici une base d’établissements :
${JSON.stringify(etabsLimités, null, 2)}

Requête de l'utilisateur : "${userRequest}"

Ta tâche :
1. Filtre les établissements pertinents selon l’âge et les mots-clés présents dans la demande.
2. Choisis 2 à 3 établissements les plus adaptés.
3. Pour chacun, ajoute une justification complète :
   - Pourquoi il est pertinent ?
   - Quelles informations supplémentaires peut-on trouver en ligne sur cet établissement (site officiel, âge pris en charge, services proposés, spécialisation, structure d’accueil, partenariats, etc.) ?
   - Si possible, intègre des **liens utiles** vers des sources fiables (site officiel, page Action Sociale, etc.).

Réponds uniquement avec un objet JSON strictement au format suivant :

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

⚠️ Ne mets aucun texte autour et si tu ne trouve pas une info mais juste Inconnu dans le json dans la ligne que tu ne peux pas remplir. Donne uniquement le JSON pur.
`;

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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Serveur Express démarré sur le port ${PORT}`);
});
