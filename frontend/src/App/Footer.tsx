type FooterProps = {
    isDark: boolean;
  };
  
  function Footer({ isDark }: FooterProps) {
    return (
      <div className={`w-full h-17 flex items-center justify-center font-[Outfit] font-semibold text-sm border-t ${isDark ? "bg-white text-[#040712] border-t-gray-300" : "bg-[#040712] text-[#e1e7ef] border-t-[#1d283a]"}`}>
        <div className="w-1/2 flex justify-start ml-5">
          <h1>
            Brought to you by{" "}
            <a
              href="#"
              className={`underline ${isDark ? "decoration-[#040712]" : "decoration-[#e1e7ef]"} decoration-2`}
            >
              Aroft
            </a>
          </h1>
        </div>
        <div className="w-1/2 flex justify-end mr-5">
          <h1 className="flex">
            <a
              href="#"
              className={`hover:underline ${isDark ? "decoration-[#040712]" : "decoration-[#e1e7ef]"}`}
            >
              Terms of Sale
            </a>
            <p className="ml-2 mr-2">•</p>
            <a
              href="#"
              className={`hover:underline ${isDark ? "decoration-[#040712]" : "decoration-[#e1e7ef]"}`}
            >
              Terms of Use
            </a>
          </h1>
        </div>
      </div>
    );
  }
  
  export default Footer;
  