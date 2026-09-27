"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const InteractiveWhiteboard3D = dynamic(() => import("./interactive-whiteboard-3d"), { ssr: false });

export default function DesktopWhiteboard() {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(min-width: 768px)");
    const update = () => setDesktop(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return desktop ? <InteractiveWhiteboard3D /> : null;
}
