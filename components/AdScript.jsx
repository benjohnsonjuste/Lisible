"use client";
import { useEffect } from "react";

export default function AdScript() {
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "//pl27639698.effectivegatecpm.com/bd/73/cf/bd73cff968386b2fc7d844b5273c6d75.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="my-6 flex justify-center">
      <p className="text-sm text-gray-500 italic">Publicité</p>
    </div>
  );
}