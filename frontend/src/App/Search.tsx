import { useState, useEffect } from "react";

type SearchProps = {
  isDark: boolean;
};

type Etablissement = {
  id: string;
  nom: string;
  categorie: string;
  age_min: number | null;
  age_max: number | null;
  tel: string;
  fax: string;
  cp_ville: string; // ex: "59490 SOMAIN"
  adresse_complete: string;
  google_maps?: string;
};

const TYPES_MEDICO_SOCIAUX = [
  { code: "CHRS", label: "Centre d'Hébergement et de Réinsertion Sociale" },
  { code: "EHPAD", label: "Établissement d’Hébergement pour Personnes Âgées Dépendantes" },
  { code: "IME", label: "Institut Médico-Éducatif" },
  { code: "ITEP", label: "Institut Thérapeutique, Éducatif et Pédagogique" },
  { code: "MAS", label: "Maison d’Accueil Spécialisée" },
  { code: "FAM", label: "Foyer d’Accueil Médicalisé" },
  { code: "SESSAD", label: "Service d'Éducation Spéciale et de Soins à Domicile" },
  { code: "SSIAD", label: "Service de Soins Infirmiers à Domicile" },
];

const CODES_POSTAUX = [
  { code: "59", label: "59 - NORD" },
  { code: "62", label: "62 - PAS-DE-CALAIS" },
];

function Search({ isDark }: SearchProps) {
  const [ville, setVille] = useState("");
  const [filteredVilles, setFilteredVilles] = useState<string[]>([]);
  const [allVilles, setAllVilles] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [typeEtab, setTypeEtab] = useState("");
  const [codePostal, setCodePostal] = useState("");
  const [motsCles, setMotsCles] = useState("");

  const [etablissements, setEtablissements] = useState<Etablissement[]>([]);
  const [justification, setJustification] = useState("");
  const [loading, setLoading] = useState(false);

  const hasResponse = !!justification || etablissements.length > 0;
  const isDisabled =
    loading ||
    (ville.trim() === "" &&
     typeEtab.trim() === "" &&
     codePostal.trim() === "" &&
     motsCles.trim() === "");

  // Charger le JSON et extraire les villes des départements 59 et 62
  useEffect(() => {
    const fetchEtablissements = async () => {
      try {
        const res = await fetch("/etabs.json"); // fichier dans /public
        const data: Etablissement[] = await res.json();

        const villes = new Set<string>();
        data.forEach((etab) => {
          if (etab.cp_ville) {
            const [cp, ...villePart] = etab.cp_ville.split(" ");
            if (cp.startsWith("59") || cp.startsWith("62")) {
              villes.add(villePart.join(" ").toUpperCase());
            }
          }
        });

        setAllVilles(Array.from(villes).sort());
      } catch (err) {
        console.error("Erreur JSON:", err);
      }
    };

    fetchEtablissements();
  }, []);

  // Filtrage dynamique des villes
  useEffect(() => {
    if (ville.trim().length > 0) {
      const filtered = allVilles.filter((v) =>
        v.toLowerCase().startsWith(ville.toLowerCase())
      );
      setFilteredVilles(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setFilteredVilles([]);
      setShowSuggestions(false);
    }
  }, [ville, allVilles]);

  const handleVilleSelect = (v: string) => {
    setVille(v);
    setShowSuggestions(false);
  };

  const handleSend = async () => {
    if (isDisabled) return;

    setLoading(true);
    setEtablissements([]);
    setJustification("");

    try {
      const res = await fetch("https://project-cwgk.onrender.com/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ville: ville.trim(),
          type: typeEtab.trim(),
          code_postal: codePostal.trim(),
          mots_cles: motsCles.trim(),
        }),
      });

      const data = await res.json();
      setEtablissements(data.resultats || []);
      setJustification(data.justification || "Aucune justification fournie.");
    } catch (error) {
      console.error(error);
      setJustification("Une erreur est survenue lors de la requête.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setVille("");
    setTypeEtab("");
    setCodePostal("");
    setMotsCles("");
    setEtablissements([]);
    setJustification("");
  };

  return (
    <div
      className={`font-[Outfit] w-full min-h-[calc(100vh-68px-68px)] flex flex-col items-center px-4 py-6 transition ${
        isDark ? "bg-white text-[#1d283a]" : "bg-[#040712] text-white"
      } sm:h-[calc(100vh-68px-68px)] sm:justify-center max-sm:pt-6 max-sm:pb-6`}
    >
      <div className="items-center w-full max-w-[990px] px-4">
        {!hasResponse && !loading && (
          <>
            <div className="text-center p-8">
              <h1 className="text-4xl sm:text-6xl font-bold mb-1">
                Rechercher des Établissements
              </h1>
              <h1 className="text-3xl sm:text-5xl font-bold mb-6 underline underline-offset-4 decoration-[#9ca3af]">
                Filtrage avancé ⚡️
              </h1>
            </div>

            {/* Filtres */}
            <div className="flex flex-col gap-4 max-w-[600px] mx-auto">
              {/* Ville avec autocomplétion */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ville (59 ou 62)"
                  value={ville}
                  onChange={(e) => setVille(e.target.value)}
                  onFocus={() => ville && setShowSuggestions(true)}
                  className={`rounded-full border px-4 py-2 outline-none text-base w-full ${
                    isDark
                      ? "bg-[#e5e7eb] text-[#1d283a] placeholder-gray-400 border-[#9ca3af]"
                      : "bg-[#e5e7eb] text-[#1d283a] placeholder-gray-600 border-transparent"
                  }`}
                />
                {showSuggestions && (
                  <ul
                    className={`absolute left-0 right-0 mt-1 max-h-40 overflow-auto rounded-lg shadow border z-10 ${
                      isDark
                        ? "bg-white text-[#1d283a] border-gray-300"
                        : "bg-gray-100 text-black border-gray-600"
                    }`}
                  >
                    {filteredVilles.map((v) => (
                      <li
                        key={v}
                        onClick={() => handleVilleSelect(v)}
                        className="px-3 py-2 cursor-pointer hover:bg-gray-200"
                      >
                        {v}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Type d'établissement */}
              <select
                value={typeEtab}
                onChange={(e) => setTypeEtab(e.target.value)}
                className={`rounded-full border px-4 py-2 outline-none text-base ${
                  isDark
                    ? "bg-[#e5e7eb] text-[#1d283a] border-[#9ca3af]"
                    : "bg-[#e5e7eb] text-[#1d283a] border-transparent"
                }`}
              >
                <option value="">Type d'établissement (optionnel)</option>
                {TYPES_MEDICO_SOCIAUX.map((t) => (
                  <option key={t.code} value={t.code}>
                    {t.code} - {t.label}
                  </option>
                ))}
              </select>

              {/* Code postal 59 / 62 */}
              <select
                value={codePostal}
                onChange={(e) => setCodePostal(e.target.value)}
                className={`rounded-full border px-4 py-2 outline-none text-base ${
                  isDark
                    ? "bg-[#e5e7eb] text-[#1d283a] border-[#9ca3af]"
                    : "bg-[#e5e7eb] text-[#1d283a] border-transparent"
                }`}
              >
                <option value="">Département (optionnel)</option>
                {CODES_POSTAUX.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>

              {/* Mots-clés */}
              <input
                type="text"
                placeholder="Mots-clés (max 50 caractères)"
                maxLength={50}
                value={motsCles}
                onChange={(e) => setMotsCles(e.target.value)}
                className={`rounded-full border px-4 py-2 outline-none text-base w-full ${
                  isDark
                    ? "bg-[#e5e7eb] text-[#1d283a] placeholder-gray-400 border-[#9ca3af]"
                    : "bg-[#e5e7eb] text-[#1d283a] placeholder-gray-600 border-transparent"
                }`}
              />

              {/* Bouton envoyer */}
              <button
                onClick={handleSend}
                disabled={isDisabled}
                className={`w-full rounded-full px-4 py-2 font-semibold transition ${
                  isDisabled
                    ? "bg-gray-400 cursor-not-allowed"
                    : isDark
                    ? "bg-[#1d283a] text-white hover:bg-[#1d283a99] cursor-pointer"
                    : "bg-[#c0c0c0] text-black hover:bg-[#9ca3af] cursor-pointer"
                }`}
              >
                Rechercher
              </button>
            </div>
          </>
        )}

        {/* Loading */}
        {loading && <p className="mt-6 text-center">Chargement...</p>}

        {/* Résultats */}
        {etablissements.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 mt-6">
            {etablissements.map((etab) => (
              <div
                key={etab.id}
                className={`p-4 rounded-lg border ${
                  isDark
                    ? "border-gray-300 bg-gray-100"
                    : "border-gray-600 bg-gray-800"
                } shadow`}
              >
                <h2 className="text-xl font-semibold mb-1">{etab.nom}</h2>
                <p>
                  <strong>Type:</strong> {etab.categorie}
                </p>
                <p>
                  <strong>Ville:</strong> {etab.cp_ville}
                </p>
                <p>
                  <strong>Âge:</strong> {etab.age_min ?? "-"} - {etab.age_max ?? "-"} ans
                </p>
                <p>
                  <strong>Tél:</strong> {etab.tel}
                </p>
                <p>
                  <strong>Adresse:</strong> {etab.adresse_complete}
                </p>
              </div>
            ))}
          </div>
        )}

        {!loading && justification && (
          <div
            className={`rounded-md border p-4 mb-6 ${
              isDark
                ? "border-gray-300 bg-gray-50 text-[#1d283a]"
                : "border-gray-600 bg-gray-900"
            }`}
          >
            <h3 className="font-semibold mb-2">Justification :</h3>
            <p>{justification}</p>
          </div>
        )}

        {hasResponse && !loading && (
          <div className="mt-6 text-center">
            <button
              onClick={handleReset}
              className={`px-6 py-2 rounded-full font-semibold transition ease-in-out duration-300 border ${
                isDark
                  ? "bg-[#1d283a] text-white hover:scale-105 cursor-pointer"
                  : "bg-white text-[#1d283a] hover:scale-105 cursor-pointer"
              }`}
            >
              Faire une nouvelle recherche
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Search;
