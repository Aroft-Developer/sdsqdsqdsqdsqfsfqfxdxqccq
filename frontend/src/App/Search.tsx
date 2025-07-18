import { useState } from "react";

type SearchProps = {
  isDark: boolean;
};

type Etablissement = {
  id: string;
  nom: string;
  categorie: string;
  age_min: number;
  age_max: number;
  tel: string;
  fax: string;
  cp_ville: string;
  adresse_complete: string;
  google_maps: string;
};

function Search({ isDark }: SearchProps) {
  const [search, setSearch] = useState("");
  const [etablissements, setEtablissements] = useState<Etablissement[]>([]);
  const [justification, setJustification] = useState("");
  const [loading, setLoading] = useState(false);

  const isDisabled = search.trim().length === 0 || loading;
  const hasResponse = !!justification || etablissements.length > 0;

  const handleSend = async () => {
    if (search.trim() === "") return;

    setLoading(true);
    setEtablissements([]);
    setJustification("");

    try {
      const res = await fetch("https://project-cwgk.onrender.com/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: search }),
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
    setSearch("");
    setEtablissements([]);
    setJustification("");
  };

  return (
    <div
      className={`font-[Outfit] w-full min-h-[calc(100vh-68px-68px)] flex flex-col items-center px-4 py-6 transition ${
        isDark ? "bg-white text-[#1d283a]" : "bg-[#040712] text-white"
      }
      sm:h-[calc(100vh-68px-68px)] sm:justify-center
    max-sm:pt-6 max-sm:pb-6`}
    >
      <div className="items-center w-full max-w-[990px] px-4">
        {!hasResponse && !loading && (
          <>
            <div className="text-center p-8">
              <h1 className="text-4xl sm:text-6xl font-bold mb-1">
                Rechercher des Établissements
              </h1>
              <h1 className="text-3xl sm:text-5xl font-bold mb-6 underline underline-offset-4 decoration-[#9ca3af]">
                Plus simplement ⚡️
              </h1>
            </div>

            <div className="flex justify-center mt-2 mb-6 px-4">
              <div
                className={`relative w-full max-w-[600px] sm:max-w-[500px] max-[420px]:max-w-[90%]`}
              >
                <input
                  type="text"
                  maxLength={100}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Votre recherche..."
                  className={`w-full pr-12 rounded-full border px-4 py-2 outline-none text-base ${
                    isDark
                      ? "bg-[#e5e7eb] text-[#1d283a] placeholder-gray-400 border-[#9ca3af]"
                      : "bg-[#e5e7eb] text-[#1d283a] placeholder-gray-600 border-transparent"
                  }`}
                  disabled={loading}
                />
                <button
                  onClick={handleSend}
                  disabled={isDisabled}
                  className={`absolute top-1/2 right-2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full transition
                    ${
                      isDisabled
                        ? "bg-gray-400 cursor-not-allowed"
                        : isDark
                        ? "bg-[#1d283a] hover:bg-[#1d283a99] cursor-pointer"
                        : "bg-[#c0c0c0] hover:bg-[#9ca3af] cursor-pointer"
                    }
                  `}
                >
                  <span className={`text-lg ${isDark ? "text-white" : "text-black"}`}>
                    ↑
                  </span>
                </button>
              </div>
            </div>
          </>
        )}

        {loading && (
          <div className="flex flex-col items-center mb-6 text-lg font-semibold gap-2">
            <div className="flex items-center gap-2">
              Chargement...
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`animate-spin w-6 h-6 ${
                  isDark ? "text-[#1d283a]" : "text-white"
                }`}
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M19.07 4.93a9.9 9.9 0 0 0-3.18-2.14 10.12 10.12 0 0 0-7.79 0c-1.19.5-2.26 1.23-3.18 2.14S3.28 6.92 2.78 8.11A9.95 9.95 0 0 0 1.99 12h2c0-1.08.21-2.13.63-3.11.4-.95.98-1.81 1.72-2.54.73-.74 1.59-1.31 2.54-1.71 1.97-.83 4.26-.83 6.23 0 .95.4 1.81.98 2.54 1.72.17.17.33.34.48.52L16 9.01h6V3l-2.45 2.45c-.15-.18-.31-.36-.48-.52M19.37 15.11c-.4.95-.98 1.81-1.72 2.54-.73.74-1.59 1.31-2.54 1.71-1.97.83-4.26.83-6.23 0-.95-.4-1.81-.98-2.54-1.72-.17-.17-.33-.34-.48-.52l2.13-2.13H2v6l2.45-2.45c.15.18.31.36.48.52.92.92 1.99 1.64 3.18 2.14 1.23.52 2.54.79 3.89.79s2.66-.26 3.89-.79c1.19-.5 2.26-1.23 3.18-2.14s1.64-1.99 2.14-3.18c.52-1.23.79-2.54.79-3.89h-2c0 1.08-.21 2.13-.63 3.11Z" />
              </svg>
            </div>
            <p className={`mt-1 text-sm ${isDark ? "text-[#1d283a]" : "text-white"}`}>
              Cette opération prend en général moins de 10 secondes.
            </p>
          </div>
        )}

        {etablissements.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
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
                  <strong>Âge:</strong> {etab.age_min} - {etab.age_max} ans
                </p>
                <p>
                  <strong>Tél:</strong> {etab.tel}
                </p>
                <p>
                  <strong>Adresse:</strong> {etab.adresse_complete}
                </p>
                {etab.google_maps && (
                  <p>
                    <a
                      href={etab.google_maps}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline text-green-600"
                    >
                      Google Maps
                    </a>
                  </p>
                )}
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
