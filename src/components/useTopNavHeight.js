import { useEffect, useState } from "react";

export default function useTopNavHeight() {
  const [topHeight, setTopHeight] = useState(0);

  useEffect(() => {
    const topNav = document.querySelector("header"); // ahora sí lo encuentra
    if (topNav) {
      const updateHeight = () => {
        const height = topNav.offsetHeight;
        document.documentElement.style.setProperty('--topnav-height', `${height}px`);
        setTopHeight(height);
      };

      const resizeObserver = new ResizeObserver(updateHeight);
      resizeObserver.observe(topNav);
      updateHeight();

      return () => resizeObserver.disconnect();
    }
  }, []);

  return topHeight;
}
