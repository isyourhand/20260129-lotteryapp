// src/hooks/useWindowSize.ts
// SSR 安全的窗口尺寸获取 Hook

import { useState, useEffect } from "react";

export const useWindowSize = () => {
  const [size, setSize] = useState({ width: 1920, height: 1080 });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateSize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  return size;
};
