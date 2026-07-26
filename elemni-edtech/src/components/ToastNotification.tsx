import React, { useEffect, useState } from 'react';
import { Sparkles, CheckCircle, Bell } from 'lucide-react';

interface ToastProps {
  message: string | null;
  onClear: () => void;
}

export const ToastNotification: React.FC<ToastProps> = ({ message, onClear }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onClear, 300);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [message, onClear]);

  if (!message && !visible) return null;

  return (
    <div
      className={`fixed top-20 right-6 z-50 transition-all duration-300 transform ${
        visible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
      }`}
    >
      <div className="bg-[#0F172A] text-white text-xs sm:text-sm font-bold px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 dir-rtl max-w-sm">
        <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center shrink-0">
          <Bell className="w-4 h-4 animate-bounce" />
        </div>
        <p className="flex-1 text-right leading-snug">{message}</p>
        <button
          onClick={() => {
            setVisible(false);
            setTimeout(onClear, 300);
          }}
          className="text-slate-400 hover:text-white mr-1"
        >
          ✕
        </button>
      </div>
    </div>
  );
};
