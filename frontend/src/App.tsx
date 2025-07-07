import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { useDarkMode } from "./App/hooks/useDarkMode";
import Navbar from "./App/Navbar";
import Content from "./App/Content";
import Footer from "./App/Footer";
import LoadingIndicator from "./LoadingIndicator";
import { useEffect, useState } from "react";
import Search from "./App/Search";
import Chatbot from "./App/ChatBot";


function AppWrapper() {
  const [isDark, setIsDark] = useDarkMode();
  const [loading, setLoading] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(timer);
  }, [location]);

  return (
    <div className={`${isDark ? "bg-white text-black" : "bg-[#040712] text-white"} min-h-screen relative`}>
      <LoadingIndicator />

      {loading && <div id="blur-overlay"></div>}

      <Navbar isDark={isDark} setIsDark={setIsDark} />
      <Routes>
        <Route path="/search" element={<Search isDark={isDark} />} />
        <Route path="/chatbot" element={<Chatbot isDark={isDark} />} />
        <Route path="/" element={<Content isDark={isDark} />} />
        <Route path="*" element={<Content isDark={isDark}/>} />
      </Routes>
      <Footer isDark={isDark} />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppWrapper />
    </Router>
  );
}