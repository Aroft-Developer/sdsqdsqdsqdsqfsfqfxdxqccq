interface NavbarProps { 
  isDark: boolean;
  setIsDark: React.Dispatch<React.SetStateAction<boolean>>;
}

function Navbar({ isDark, setIsDark }: NavbarProps) {
  return (
    <>
      <div className={`static flex w-full h-17 items-center font-[Outfit] font-semibold text-lg transition border-b border-solid ${
        isDark ? "bg-white text-[#1d283a] border-b-gray-300" : "bg-[#040712] text-white border-[#1d283a]"
      }`}>
        <div className="flex justify-start w-1/2 pl-10 items-center">
          <img 
            className="h-10 w-10 rounded-full mr-5" 
            src="https://loopbot.pro/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Flogo.c9382eab.jpg&w=128&q=75" 
            alt="Logo" 
          />
          <a href="/">Titre du site</a>
        </div>
        <div className="flex justify-end w-1/2 pl-10 items-center">
          <a 
            href="#"
            className={`cursor-pointer duration-300 transition ease-in-out  p-2.5 mr-5 rounded-xl border-solid ${
              isDark ? "hover:bg-gray-300" : "hover:bg-[#1d283a]"
            }`}>
              <svg  xmlns="http://www.w3.org/2000/svg" width="24" height="24"  fill="currentColor" viewBox="0 0 24 24" >
                <path d="M11 16h2v2h-2z"></path><path d="M16.71 2.29A1 1 0 0 0 16 2H8c-.27 0-.52.11-.71.29l-5 5A1 1 0 0 0 2 8v8c0 .27.11.52.29.71l5 5c.19.19.44.29.71.29h8c.27 0 .52-.11.71-.29l5-5A1 1 0 0 0 22 16V8c0-.27-.11-.52-.29-.71zM20 15.58l-4.41 4.41H8.42l-4.41-4.41V8.41L8.42 4h7.17L20 8.41z"></path><path d="M13.27 6.25c-2.08-.75-4.47.35-5.21 2.41l1.88.68c.18-.5.56-.9 1.07-1.13s1.08-.26 1.58-.08a2.01 2.01 0 0 1 1.32 1.86c0 1.04-1.66 1.86-2.24 2.07-.4.14-.67.52-.67.94v1h2v-.34c1.04-.51 2.91-1.69 2.91-3.68a4.015 4.015 0 0 0-2.64-3.73"></path>
              </svg>
          </a>
          <button 
            onClick={() => setIsDark(d => !d)} 
            className={`cursor-pointer duration-300 transition ease-in-out  p-2.5 mr-5 rounded-xl border-solid ${
              isDark ? "hover:bg-gray-300" : "hover:bg-[#1d283a]"
            }`}
          >
            {isDark ? (
              <svg className={`${isDark ? 'fill-[#1d283a]' : 'fill-white'}`} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M6.993 12c0 2.761 2.246 5.007 5.007 5.007s5.007-2.246 5.007-5.007S14.761 6.993 12 6.993 6.993 9.239 6.993 12zM12 8.993c1.658 0 3.007 1.349 3.007 3.007S13.658 15.007 12 15.007 8.993 13.658 8.993 12 10.342 8.993 12 8.993zM10.998 19h2v3h-2zm0-17h2v3h-2zm-9 9h3v2h-3zm17 0h3v2h-3zM4.219 18.363l2.12-2.122 1.415 1.414-2.12 2.122zM16.24 6.344l2.122-2.122 1.414 1.414-2.122 2.122zM6.342 7.759 4.22 5.637l1.415-1.414 2.12 2.122zm13.434 10.605-1.414 1.414-2.122-2.122 1.414-1.414z"></path></svg>
            ) : (
              <svg className={`${isDark ? 'fill-[#1d283a]' : 'fill-white'}`} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M20.742 13.045a8.088 8.088 0 0 1-2.077.271c-2.135 0-4.14-.83-5.646-2.336a8.025 8.025 0 0 1-2.064-7.723A1 1 0 0 0 9.73 2.034a10.014 10.014 0 0 0-4.489 2.582c-3.898 3.898-3.898 10.243 0 14.143a9.937 9.937 0 0 0 7.072 2.93 9.93 9.93 0 0 0 7.07-2.929 10.007 10.007 0 0 0 2.583-4.491 1.001 1.001 0 0 0-1.224-1.224zm-2.772 4.301a7.947 7.947 0 0 1-5.656 2.343 7.953 7.953 0 0 1-5.658-2.344c-3.118-3.119-3.118-8.195 0-11.314a7.923 7.923 0 0 1 2.06-1.483 10.027 10.027 0 0 0 2.89 7.848 9.972 9.972 0 0 0 7.848 2.891 8.036 8.036 0 0 1-1.484 2.059z"></path></svg>
            )}
        </button>
          </div>
      </div>
    </>
  );
}

export default Navbar;
