import React, { useEffect } from 'react';

export interface AppNotificationModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  type?: 'success' | 'info' | 'warning' | 'error';
  autoDismissMs?: number;
  onClose: () => void;
}

export const AppNotificationModal: React.FC<AppNotificationModalProps> = ({
  isOpen,
  title = 'Aviso de VetSoft',
  message,
  type = 'success',
  autoDismissMs = 3500,
  onClose
}) => {
  useEffect(() => {
    if (isOpen && autoDismissMs > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, autoDismissMs);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoDismissMs, onClose]);

  if (!isOpen) return null;

  const iconName = type === 'success' ? 'check_circle' : type === 'error' ? 'error' : type === 'warning' ? 'warning' : 'info';
  const iconColor = type === 'success' ? 'text-emerald-400' : type === 'error' ? 'text-rose-400' : type === 'warning' ? 'text-amber-400' : 'text-[#CBB5E2]';

  return (
    <div className="fixed top-6 right-6 z-[99999] pointer-events-auto animate-slide-in-right">
      <div className="bg-[#191122] border border-[#9A7DB8]/60 rounded-2xl p-3 px-4 shadow-2xl flex items-center gap-3 max-w-md w-full sm:w-[420px]">
        {/* Left Icon Badge */}
        <div className={`w-10 h-10 rounded-xl bg-[#9A7DB8]/20 border border-[#9A7DB8]/40 ${iconColor} flex items-center justify-center shrink-0 shadow-inner`}>
          <span className="material-symbols-outlined text-[22px]">{iconName}</span>
        </div>

        {/* Text Area (Title + Message) */}
        <div className="flex flex-col flex-1 min-w-0 pr-1">
          <h4 className="font-bold text-xs text-white leading-tight truncate">{title}</h4>
          <p className="text-[11px] text-slate-300 leading-snug truncate mt-0.5" title={message}>{message}</p>
        </div>

        {/* Dismiss X Button */}
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10 shrink-0 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
      </div>
    </div>
  );
};
