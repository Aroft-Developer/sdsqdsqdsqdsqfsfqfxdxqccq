import express from "express";
import axios from "axios";
import cors from "cors";
import fs from "fs";
import Groq from "groq-sdk";

const app = express();
app.use(cors({ origin: "https://project-virid-alpha.vercel.app" }));
app.use(express.json());

// Chargement des établissements (JSON local)
const fullData = JSON.parse(fs.readFileSync("./etabs.json", "utf-8"));
const etablissements = fullData.map((e) => ({
  id: String(e.id || "Inconnu"),
  nom: e.nom || "Nom inconnu",
  categorie: e.type || "Catégorie inconnue",
  age_min: e.age_min != null ? e.age_min : 0,
  age_max: e.age_max != null ? e.age_max : 21,
  tel: e.tel || "Inconnu",
  fax: e.fax || "Inconnu",
  cp_ville:
    e.cp_ville ||
    `${e.code_postal || "00000"} ${e.ville || "Ville inconnue"}`,
  adresse_complete:
    e.adresse_complete ||
    `${e.numero_voie || ""} ${e.rue || ""}, ${e.code_postal || ""} ${
      e.ville || ""
    }`.trim() ||
    "Adresse inconnue",
  google_maps: e.google_maps || "",
}));

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function analyserParMorceaux(situation, etabs, mots_cles) {
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

Mots-clés fournis par l'utilisateur : "${mots_cles}"

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
      "tel": string,
      "fax": string,
      "cp_ville": "string",
      "adresse_complete": string,
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
        max_tokens: 1100,
      });

      const raw = completion.choices[0].message.content.trim();
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) {
        console.warn("Aucun JSON détecté dans la réponse Groq pour un chunk.");
        continue;
      }

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

function filtrerEtablissements({ ville, type, code_postal, mots_cles }) {
  return etablissements.filter((etab) => {
    // Ville : comparer en insensible à la casse et en normalisant les espaces
    if (ville) {
      const villeEtab = etab.cp_ville
        .split(" ")
        .slice(1)
        .join(" ")
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "");
      const villeNorm = ville.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
      if (!villeEtab.includes(villeNorm)) return false;
    }
    // Type : insensible à la casse
    if (type && type !== "") {
      if (!etab.categorie.toLowerCase().includes(type.toLowerCase())) return false;
    }
    // Code postal : vérifier uniquement les 2 premiers chiffres
    if (code_postal && code_postal !== "") {
      if (!etab.cp_ville.startsWith(code_postal)) return false;
    }
    // Mots-clés : chaque mot doit être contenu dans nom, catégorie ou adresse
    if (mots_cles && mots_cles !== "") {
      const mots = mots_cles.toLowerCase().split(" ");
      const haystack = (
        etab.nom +
        " " +
        etab.categorie +
        " " +
        etab.adresse_complete
      )
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "");
      if (!mots.every((mot) => haystack.includes(mot))) return false;
    }

    return true;
  });
}

app.post("/analyse", async (req, res) => {
  try {
    const { ville, type, code_postal, mots_cles } = req.body;

    if (
      (!ville || ville.trim() === "") &&
      (!type || type.trim() === "") &&
      (!code_postal || code_postal.trim() === "") &&
      (!mots_cles || mots_cles.trim() === "")
    ) {
      return res.status(400).json({
        error: "Au moins un critère de recherche doit être renseigné.",
      });
    }

    // Logs pour debug
    console.log("[Recherche] critères reçus :", { ville, type, code_postal, mots_cles });

    // Filtrage local des établissements
    const filteredEtabs = filtrerEtablissements({ ville, type, code_postal, mots_cles });

    console.log("[Recherche] établissements filtrés :", filteredEtabs.length);

    if (filteredEtabs.length === 0) {
      return res.json({
        resultats: [],
        justification: "Aucun établissement ne correspond aux critères de recherche.",
      });
    }

    // Appeler Groq avec situation + établissements + mots clés
    const resultatFinal = await analyserParMorceaux(ville || "Recherche", filteredEtabs, mots_cles || "");

    res.json(resultatFinal);
  } catch (err) {
    console.error("❌ Erreur serveur (/analyse) :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Tu peux garder ta route /conseil telle quelle

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur Express lancé sur le port ${PORT}`);
});
