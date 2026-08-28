import React, { useEffect } from 'react';
import { Product } from '../../domain/types';

interface LowStockAlertModalProps {
  lowStockProducts: Product[];
  onClose: () => void;
  onGoToInventory: () => void;
  autoHideDurationMs?: number;
}

export const LowStockAlertModal: React.FC<LowStockAlertModalProps> = ({
  lowStockProducts,
  onClose,
  onGoToInventory,
  autoHideDurationMs = 3000
}) => {
  useEffect(() => {
    if (lowStockProducts.length === 0) return;

    const timer = setTimeout(() => {
      onClose();
    }, autoHideDurationMs);

    return () => clearTimeout(timer);
  }, [lowStockProducts, onClose, autoHideDurationMs]);

  if (lowStockProducts.length === 0) return null;

  return (
    <div className="fixed top-20 right-6 z-50 max-w-sm sm:max-w-md w-full pointer-events-none font-body-md animate-slide-in-right">
      <div className="bg-surface-container-lowest text-on-surface rounded-2xl p-md shadow-2xl border-2 border-error/30 flex flex-col gap-sm pointer-events-auto transition-all">
        {/* Header Banner */}
        <div className="flex items-center justify-between border-b border-outline-variant/30 pb-xs">
          <div className="flex items-center gap-xs">
            <div className="w-8 h-8 rounded-xl bg-error-container text-on-error-container flex items-center justify-center shrink-0 shadow-xs">
              <span className="material-symbols-outlined text-[20px]">warning</span>
            </div>
            <div className="flex flex-col">
              <h2 className="font-headline-sm text-xs font-bold text-error leading-tight">
                ¡Alerta de Stock Crítico!
              </h2>
              <span className="text-[10px] text-on-surface-variant">
                {lowStockProducts.length} {lowStockProducts.length === 1 ? 'producto requiere atención' : 'productos requieren atención'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer"
            title="Cerrar notificación"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Low Stock List */}
        <div className="max-h-48 overflow-y-auto flex flex-col gap-xs pr-1">
          {lowStockProducts.map((p) => {
            const isOutOfStock = p.currentStock === 0;
            return (
              <div
                key={p.id}
                className="bg-surface-container-low p-2 rounded-xl border border-outline-variant/40 flex items-center justify-between gap-xs hover:bg-surface-container transition-colors"
              >
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-xs text-primary truncate">{p.name}</span>
                  <span className="text-[10px] text-on-surface-variant font-mono">
                    SKU: {p.sku}
                  </span>
                </div>

                <div className="flex items-center gap-xs shrink-0">
                  <span className="font-extrabold text-[11px] text-error font-mono">
                    {p.currentStock} / {p.minStock} u.
                  </span>

                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                      isOutOfStock
                        ? 'bg-error text-on-error'
                        : 'bg-error-container text-on-error-container'
                    }`}
                  >
                    {isOutOfStock ? 'Agotado' : 'Reponer'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-xs pt-xs border-t border-outline-variant/30">
          <button
            onClick={onClose}
            className="px-sm py-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors font-label-md text-[11px] font-semibold cursor-pointer"
          >
            Descartar
          </button>

          <button
            onClick={onGoToInventory}
            className="px-md py-1.5 rounded-xl bg-primary text-on-primary hover:bg-primary-container transition-all font-label-md text-xs font-bold shadow-sm flex items-center justify-center gap-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">inventory_2</span>
            <span>Ir a Inventario</span>
          </button>
        </div>
      </div>
    </div>
  );
};
