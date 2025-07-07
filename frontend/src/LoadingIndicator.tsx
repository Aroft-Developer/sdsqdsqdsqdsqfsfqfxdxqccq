import NProgress from "nprogress";
import "nprogress/nprogress.css";
import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

NProgress.configure({ showSpinner: false });

function LoadingIndicator() {
  const location = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    NProgress.start();

    const timeout = setTimeout(() => {
      NProgress.done();
    }, 300); // 300ms pour l'effet fluide

    return () => clearTimeout(timeout);
  }, [location, navigationType]);

  return null;
}

export default LoadingIndicator;
