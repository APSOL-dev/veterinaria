import React from 'react';

export interface AppConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const AppConfirmModal: React.FC<AppConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Eliminar',
  cancelText = 'Cancelar',
  isDanger = true,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[99990] flex items-center justify-center p-md animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-lg shadow-2xl flex flex-col gap-md border border-slate-200">
        <div className="flex items-start gap-md">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
            isDanger ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-purple-50 text-[#5C3C7B] border border-purple-200'
          }`}>
            <span className="material-symbols-outlined text-[24px]">
              {isDanger ? 'warning' : 'help_outline'}
            </span>
          </div>
          <div className="flex-1">
            <h3 className="font-headline-sm text-slate-900 font-bold text-base leading-tight">
              {title}
            </h3>
            <p className="font-body-md text-slate-600 text-xs mt-1.5 leading-relaxed font-medium">
              {message}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-sm pt-md border-t border-slate-200/80">
          <button
            type="button"
            onClick={onCancel}
            className="px-md py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-label-md text-xs font-bold transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-md py-2 rounded-xl font-label-md text-xs font-bold text-white transition-colors shadow-xs cursor-pointer ${
              isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-[#9A7DB8] hover:bg-[#8362A5]'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
