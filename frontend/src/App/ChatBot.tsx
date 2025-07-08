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
      const res = await fetch("https://project-cwgk.onrender.com/conseil", {
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
    className={`font-[Outfit] w-full min-h-screen flex flex-col items-center justify-between px-4 py-6 ${
      isDark ? "bg-white text-[#1d283a]" : "bg-[#040712] text-white"
    }`}
  >
    <h1 className="text-3xl sm:text-4xl font-bold text-center">
      Chatbot ✏️
    </h1>

    {/* Champ de saisie et bouton seulement si pas encore de réponse */}
    {!reponse && (
      <div className="flex flex-col items-center w-full max-w-xl">
        <textarea
          value={situation}
          onChange={(e) => setSituation(e.target.value)}
          rows={4}
          placeholder="Explique ta situation ici..."
          className="focus:outline-none w-full rounded-md p-4 text-base border bg-[#e5e7eb] text-black mt-6"
        />

        <button
          onClick={handleSend}
          disabled={isDisabled}
          className={`mt-4 px-6 py-2 rounded-full font-semibold transition ease-in-out duration-300 border border-[#1d283a] ${
            isDisabled
              ? "bg-gray-400 cursor-not-allowed"
              : isDark
              ? "bg-[#1d283a] text-white hover:scale-110 cursor-pointer"
              : "bg-white text-[#1d283a] hover:scale-110 cursor-pointer"
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              Chargement...
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`animate-spin w-6 h-6 ml-2 ${
                  isDark ? "text-[#1d283a]" : "text-white"
                }`}
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M19.07 4.93a9.9 9.9 0 0 0-3.18-2.14..." />
              </svg>
            </span>
          ) : (
            "Envoyer"
          )}
        </button>
      </div>
    )}

    {/* Affichage de la réponse */}
    {reponse && (
      <div className="flex flex-col items-center max-w-xl w-full">
        <div
          className={`w-full p-4 rounded-lg border mt-6 ${
            isDark ? "bg-gray-100 text-[#1d283a]" : "bg-gray-800 text-white"
          }`}
        >
          <h2 className="font-bold mb-2">Réponse :</h2>
          <p>{reponse}</p>
        </div>

        <button
          onClick={handleReset}
          className={`mt-4 px-6 py-2 rounded-full font-semibold transition ease-in-out duration-300 border border-[#1d283a] ${
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
