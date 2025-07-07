import { useState } from "react";

type ChatbotProps = {
  isDark: boolean;
};

function Chatbot({ isDark }: ChatbotProps) {
  const [situation, setSituation] = useState("");
  const [reponse, setReponse] = useState("");
  const [loading, setLoading] = useState(false);

  const isDisabled = situation.trim().length === 0 || loading;

  const handleSend = async () => {
    if (!situation.trim()) return;
    setLoading(true);
    setReponse("");

    try {
      const res = await fetch("http://localhost:3001/conseil", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: situation }),
      });

      const data = await res.json();
      setReponse(data.reponse || "Pas de réponse reçue.");
    } catch (error) {
      console.error(error);
      setReponse("Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSituation("");
    setReponse("");
  };

  return (
    <div
      className={`font-[Outfit] h-[calc(100vh-68px-68px)] w-full flex flex-col items-center justify-center px-4 ${
        isDark ? "bg-white text-[#1d283a]" : "bg-[#040712] text-white"
      }`}
    >
      <h1 className="text-3xl sm:text-4xl font-bold mb-6 text-center">
        Chatbot ✏️
      </h1>

      {/* Champ de saisie et bouton seulement si pas encore de réponse */}
      {!reponse && (
        <>
          <textarea
            value={situation}
            onChange={(e) => setSituation(e.target.value)}
            rows={4}
            placeholder="Explique ta situation ici..."
            className="focus:outline-none w-full max-w-xl rounded-md p-4 text-base border bg-[#e5e7eb] text-black mb-4"
          />

          <button
            onClick={handleSend}
            disabled={isDisabled}
            className={`mb-6 px-6 py-2 rounded-full font-semibold transition ease-in-out duration-300 border border-[#1d283a] ${
              isDisabled
                ? "bg-gray-400 cursor-not-allowed"
                : isDark
                ? "bg-[#1d283a] text-white hover:scale-110 cursor-pointer"
                : "bg-white text-[#1d283a] hover:scale-110 cursor-pointer"
            }`}
          >
            {loading ? (
              <span className="flex items-center">
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
              </span>
            ) : (
              "Envoyer"
            )}
          </button>
        </>
      )}

      {/* Affichage de la réponse */}
      {reponse && (
        <div className="flex flex-col items-center">
          <div
            className={`max-w-xl p-4 rounded-lg border mb-4 ${
              isDark ? "bg-gray-100 text-[#1d283a]" : "bg-gray-800 text-white"
            }`}
          >
            <h2 className="font-bold mb-2">Réponse :</h2>
            <p>{reponse}</p>
          </div>

          <button
            onClick={handleReset}
            className={`px-6 py-2 rounded-full font-semibold transition ease-in-out duration-300 border border-[#1d283a] ${
              isDark
                ? "bg-[#1d283a] text-white hover:scale-105 cursor-pointer"
                : "bg-white text-[#1d283a] hover:scale-105 cursor-pointer"
            }`}
          >
            Faire une nouvelle demande
          </button>
        </div>
      )}
    </div>
  );
}

export default Chatbot;
