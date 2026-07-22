"use client";

import { useState } from "react";
import { cn } from "@/src/lib/cn";

export default function WhatsAppButton() {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="fixed bottom-6 left-6 z-50 flex items-center gap-3 dir-rtl pointer-events-auto">
      <div className={cn(
        "bg-[#0F172A] text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xl transition-all duration-300 pointer-events-none hidden sm:flex items-center gap-2 border border-slate-700",
        showTooltip ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2"
      )}>
        <span className="w-2 h-2 rounded-full bg-[#25D366] animate-ping" />
        <span>تحدث معنا عبر الواتساب 24/7</span>
      </div>

      <a
        href="https://wa.me/201000000000?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%20%D9%85%D9%86%D8%B5%D8%A9%20%D8%B9%D9%84%D9%85%D9%86%D9%8A%D9%8F%D8%8C%20%D8%A3%D8%B1%D8%BA%D8%A8%20%D9%81%D9%8A%20%D8%A7%D9%84%D8%A7%D8%B3%D8%AA%D9%81%D8%B3%D8%A7%D8%B1%20%D8%B9%D9%86%20%D8%A7%D9%84%D8%AD%D8%B5%D8%B5%20%D9%88%D8%A7%D9%84%D8%A7%D8%B4%D8%AA%D8%B1%D8%A7%D9%83%D8%A7%D8%AA"
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="relative group w-14 h-14 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all cursor-pointer"
        aria-label="تواصل معنا عبر الواتساب"
      >
        <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-30 pointer-events-none" />
        <svg className="w-8 h-8 fill-current relative z-10" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.246 2.248 3.484 5.232 3.484 8.412-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.309 1.656zm6.29-4.171l.33.196c1.417.845 3.05 1.29 4.729 1.291 5.04 0 9.143-4.103 9.145-9.145.001-2.443-.951-4.74-2.68-6.469-1.729-1.729-4.026-2.681-6.47-2.682-5.041 0-9.145 4.104-9.147 9.145-.001 1.732.49 3.42 1.42 4.9l.214.339-1.004 3.67 3.763-.987zm9.837-5.378c-.286-.143-1.691-.835-1.953-.93-.262-.095-.453-.143-.644.143-.19.286-.738.93-.905 1.12-.167.19-.334.214-.62.071-.286-.143-1.208-.445-2.301-1.42-.85-.758-1.422-1.693-1.589-1.978-.167-.286-.018-.441.125-.583.128-.127.286-.334.429-.5.143-.167.19-.286.286-.476.095-.19.048-.357-.024-.5-.071-.143-.644-1.549-.882-2.12-.231-.553-.467-.478-.644-.487-.167-.008-.357-.01-.548-.01-.19 0-.5.071-.762.357-.262.286-1.001.977-1.001 2.382s1.025 2.763 1.167 2.953c.143.19 2.017 3.081 4.887 4.318.682.294 1.214.47 1.628.601.685.218 1.309.187 1.802.114.549-.081 1.691-.691 1.929-1.358.238-.667.238-1.238.167-1.358-.071-.119-.262-.19-.548-.333z" />
        </svg>
      </a>
    </div>
  );
}
