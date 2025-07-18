import express from "express";
import axios from "axios";
import cors from "cors";
import fs from "fs";
import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(cors({ origin: "https://project-virid-alpha.vercel.app" }));
app.use(express.json());

// ✅ Ping toutes les 5 minutes pour Render (inutile en local)
setInterval(() => {
  fetch("https://project-cwgk.onrender.com")
    .then(() => console.log("✅ Ping sent to keep alive"))
    .catch(() => console.log("❌ Ping failed"));
}, 5 * 60 * 1000);

// ✅ Chargement des établissements (101 000 en mémoire)
const fullData = JSON.parse(fs.readFileSync("./etab.json", "utf-8"));
const etablissements = fullData.map(e => ({
  id: String(e.id || "Inconnu"),
  nom: e.nom || "Nom inconnu",
  categorie: e.type || "Catégorie inconnue",
  age_min: e.age_min != null ? e.age_min : 0,
  age_max: e.age_max != null ? e.age_max : 21,
  tel: e.tel || "Inconnu",
  fax: e.fax || "Inconnu",
  cp_ville: e.cp_ville || `${e.code_postal || "00000"} ${e.ville || "Ville inconnue"}`,
  adresse_complete:
    e.adresse_complete ||
    `${e.numero_voie || ""} ${e.rue || ""}, ${e.code_postal || ""} ${e.ville || ""}`.trim() ||
    "Adresse inconnue",
  google_maps: e.google_maps || ""
}));

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * ✅ Filtrage local AVANT d'envoyer à Groq (très important pour réduire le temps)
 */
function filtrerEtablissementsAvantGroq(situation) {
  const ageMatch = situation.match(/(\d{1,2})\s*ans/);
  const age = ageMatch ? parseInt(ageMatch[1], 10) : null;
  const villeMatch = situation.match(/à\s+([A-Za-zÀ-ÿ-]+)/i);
  const ville = villeMatch ? villeMatch[1] : null;

  const result = etablissements.filter(e => {
    const ageOk = !age || (e.age_min <= age && e.age_max >= age);
    const villeOk = !ville || e.cp_ville.toLowerCase().includes(ville.toLowerCase());
    return ageOk && villeOk;
  });

  console.log(`✅ ${result.length} établissements filtrés sur 101000`);
  return result.slice(0, 200); // Limite à 200 max pour Groq (≈5 chunks)
}

/**
 * ✅ Analyse par morceaux (Groq)
 */
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

Si la demande n'a aucun rapport avec un placement, un jeune, ou les établissements ci-dessous, tu DOIS renvoyer un objet JSON avec uniquement une clé "justification", sans remplir "resultats".

Réponds STRICTEMENT avec ce format :

{
  "resultats": [
    {
      "id": "string",
      "nom": "string",
      "categorie": "string",
      "age_min": number,
      "age_max": number,
      "tel": "string",
      "fax": "string",
      "cp_ville": "string",
      "adresse_complete": "string",
      "google_maps": "string"
    }
  ],
  "justification": "Texte explicatif enrichi avec des informations utiles en ligne sur les établissements proposés"
}

Si aucun établissement ne correspond, renvoie uniquement :
{
  "justification": "Explication sur pourquoi aucun établissement ne correspond à cette demande."
}

Ne mets aucun texte AVANT ou APRÈS ce JSON. Juste le JSON pur.
Remplace les valeurs manquantes par "Inconnu".
`;

    try {
      const completion = await groq.chat.completions.create({
        model: "llama3-70b-8192",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 1100
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
    justification: justificationGlobal.trim() || "Analyse effectuée par morceaux."
  };
}

/**
 * ✅ Route analyse
 */
app.post("/analyse", async (req, res) => {
  try {
    const userRequest = req.body.text;
    if (!userRequest) return res.status(400).json({ error: "texte manquante" });

    const etabsFiltres = filtrerEtablissementsAvantGroq(userRequest);

    if (etabsFiltres.length === 0) {
      return res.json({
        resultats: [],
        justification: "Aucun établissement ne correspond à cette demande."
      });
    }

    const resultatFinal = await analyserParMorceaux(userRequest, etabsFiltres);
    res.json(resultatFinal);

  } catch (err) {
    console.error("❌ Erreur serveur (/analyse) :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/**
 * ✅ Route conseil (inchangée)
 */
app.post("/conseil", async (req, res) => {
  try {
    const situation = req.body.text;
    if (!situation) return res.status(400).json({ error: "situation manquante" });

    const prompt = `Tu es un éducateur spécialisé expérimenté qui échange avec un collègue éducateur spécialisé. 
Dans le cadre de ton métier, analyse la situation suivante : "${situation}".
Fournis un conseil professionnel, clair, structuré et orienté solution, destiné à un éducateur spécialisé.
Le conseil doit comporter entre 10 et 20 lignes, être pragmatique, éviter les généralités, et inclure des pistes d'intervention concrètes, ainsi que des points d'attention spécifiques à cette situation. 
Tu peux évoquer les démarches à envisager, les acteurs à mobiliser, et les risques à surveiller, toujours dans une optique de soutien efficace au jeune.`;

    const completion = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama3-70b-8192",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 700
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`
        }
      }
    );

    const responseText = completion.data.choices[0].message.content.trim();
    res.json({ reponse: responseText });

  } catch (err) {
    console.error("❌ Erreur serveur (conseil) :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ✅ Route catch-all pour éviter les plantages
app.use((req, res) => {
  console.warn(`⚠️ Requête inconnue interceptée : ${req.method} ${req.url}`);
  res.status(404).json({ error: "Route inconnue" });
});

// ✅ Port dynamique pour Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur Express lancé sur le port ${PORT}`);
});
