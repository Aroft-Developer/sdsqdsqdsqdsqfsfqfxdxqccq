type ContentProps = {
    isDark: boolean;
};
  
function Content({ isDark }: ContentProps) {
  return (
    <div className={`font-[Outfit] w-full h-[calc(100vh-68px-68px)] flex items-center justify-center transition ${isDark ? "bg-white text-[#1d283a]" : "bg-[#040712] text-white"}`}>
      <div className="items-center">
        <div className="text-center p-8">
          <h1 className="text-4xl sm:text-6xl font-bold mb-1">Faite Vos Recherches</h1>
          <h1 className="text-3xl sm:text-5xl font-bold mb-6 underline underline-offset-4 decoration-[#9ca3af]">Plus Simplement et Rapidement 🪄</h1>
        </div>

        <div className="flex gap-4 justify-center mt-2 mb-6 flex-nowrap overflow-x-auto">
          <a 
            href="/chatbot" 
            className={`text-base sm:text-lg px-6 sm:px-10 py-2 sm:py-3 border rounded-lg transition duration-300 ease-in-out cursor-pointer whitespace-nowrap
              ${isDark 
                ? "border-gray-300 hover:bg-gray-300 text-[#1d283a]" 
                : "border-[#1d283a] hover:bg-[#1d283a] text-white"}`}
          >
            ChatBot 💬
          </a>

          <a 
            href="/search" 
            className={`text-base sm:text-lg px-6 sm:px-10 py-2 sm:py-3 border rounded-lg transition duration-300 ease-in-out cursor-pointer whitespace-nowrap
              ${isDark 
                ? "border-gray-300 hover:bg-gray-300 text-black" 
                : "border-[#1d283a] hover:bg-[#1d283a] text-white"}`}
          >
            Recherche 🔎
          </a>
        </div>
      </div>
    </div>
  );
}
  
export default Content;
  