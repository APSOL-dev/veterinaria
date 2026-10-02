import React, { useEffect, useState } from 'react';
import { TutorAccountMovement, BillReceipt } from '../../domain/types';
import { formatDate } from '../../utils/dateUtils';
import { getVoucherKind } from '../../utils/fileUtils';

interface ComprobanteDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  movement: TutorAccountMovement | null;
}

export const ComprobanteDetailModal: React.FC<ComprobanteDetailModalProps> = ({
  isOpen,
  onClose,
  movement
}) => {
  const [showVoucherPreview, setShowVoucherPreview] = useState(false);

  // Al cambiar de comprobante o cerrar, la vista previa vuelve a estar oculta
  useEffect(() => {
    setShowVoucherPreview(false);
  }, [movement?.id, isOpen]);

  if (!isOpen || !movement) return null;

  const isReceipt = movement.type === 'receipt' || (!movement.type && movement.debe > 0);
  const receipt: BillReceipt | undefined = movement.receipt;
  const payment = movement.payment;

  const handlePrint = () => {
    window.print();
  };

  const saveFromHref = (href: string, name: string) => {
    const link = document.createElement('a');
    link.href = href;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // El atributo "download" se ignora en archivos de otro dominio: se baja el archivo y se guarda desde el navegador
  const handleDownloadVoucher = async (url: string, name?: string) => {
    const fileName = name || `Comprobante_${movement.id}`;
    if (url.startsWith('data:')) {
      saveFromHref(url, fileName);
      return;
    }
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blobUrl = URL.createObjectURL(await response.blob());
      saveFromHref(blobUrl, fileName);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    } catch {
      window.open(url, '_blank', 'noopener');
    }
  };

  const formatDocType = (docType?: string) => {
    if (!docType) return 'Comprobante';
    return docType
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-start sm:items-center justify-center p-3 sm:p-md pt-6 sm:pt-10 bg-black/40 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div 
        className="bg-surface-container-lowest rounded-3xl shadow-2xl border border-outline-variant/40 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-on-surface my-4 sm:my-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#5C3C7B] text-white p-5 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-[22px]">
                {isReceipt ? 'receipt_long' : 'payments'}
              </span>
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">
                {isReceipt ? 'Detalle de Comprobante' : 'Detalle de Pago / Abono'}
              </h2>
              <p className="text-xs text-purple-200 font-medium">
                {isReceipt 
                  ? `${formatDocType(receipt?.documentType)} — ${receipt?.receiptNumber || movement.concept}`
                  : `Abono de Cuenta Corriente — ${movement.concept}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/10 rounded-full p-1.5 transition-colors cursor-pointer"
            title="Cerrar modal"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex flex-col gap-5 text-xs">
          {/* Metadata Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-surface-container-low p-4 rounded-2xl border border-outline-variant/30">
            <div>
              <span className="text-[10px] text-slate-500 font-semibold block uppercase tracking-wider">Fecha</span>
              <span className="font-semibold text-slate-900 text-xs font-mono">{formatDate(movement.date)}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-semibold block uppercase tracking-wider">Tutor / Titular</span>
              <span className="font-semibold text-slate-900 text-xs truncate block">{movement.tutorName}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-semibold block uppercase tracking-wider">Mascota</span>
              <span className="font-semibold text-slate-900 text-xs truncate block">
                {receipt?.patientName || 'No especificada'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-semibold block uppercase tracking-wider">Medio</span>
              <span className="font-semibold text-purple-800 bg-purple-100/80 px-2 py-0.5 rounded-md text-[11px] inline-block">
                Cuenta Corriente
              </span>
            </div>
          </div>

          {/* AFIP CAE Badge if exists */}
          {receipt?.afipCae && (
            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-2.5 rounded-xl text-xs font-medium">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-[18px]">verified</span>
                <span>Comprobante validado electrónicamente ante <strong>AFIP</strong></span>
              </div>
              <div className="font-mono text-[11px] text-emerald-800">
                CAE: <strong>{receipt.afipCae}</strong> {receipt.afipCaeExpiration ? `(Vto: ${receipt.afipCaeExpiration})` : ''}
              </div>
            </div>
          )}

          {/* Table of items / services (if Receipt) */}
          {isReceipt ? (
            <div className="flex flex-col gap-2">
              <h3 className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#9A7DB8] text-[16px]">list_alt</span>
                Ítems y conceptos facturados
              </h3>

              <div className="border border-outline-variant/30 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container text-slate-700 font-semibold text-[11px] border-b border-outline-variant/20">
                      <th className="py-2.5 px-3">Concepto / Prestación</th>
                      <th className="py-2.5 px-3 text-center">Cant.</th>
                      <th className="py-2.5 px-3 text-right">P. Unitario</th>
                      <th className="py-2.5 px-3 text-center">Desc.</th>
                      <th className="py-2.5 px-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/15 font-medium">
                    {receipt?.items && receipt.items.length > 0 ? (
                      receipt.items.map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-surface-container/20">
                          <td className="py-2 px-3 text-slate-900">
                            <div className="font-medium">{item.description}</div>
                            {item.type && (
                              <span className="text-[10px] text-slate-400 font-normal capitalize">
                                {item.type === 'service' ? 'Servicio Clínico' : 'Producto'}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-center text-slate-700 font-mono">{item.quantity}</td>
                          <td className="py-2 px-3 text-right font-mono text-slate-700">
                            $ {item.unitPrice.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2 px-3 text-center font-mono text-slate-500">
                            {item.discountPercent > 0 ? `${item.discountPercent}%` : '-'}
                          </td>
                          <td className="py-2 px-3 text-right font-semibold font-mono text-slate-900">
                            $ {(item.subtotal || (item.quantity * item.unitPrice * (1 - (item.discountPercent || 0) / 100))).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="py-2.5 px-3 text-slate-900 font-medium">
                          {movement.detail || movement.concept}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono">1</td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          $ {movement.debe.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-400 font-mono">-</td>
                        <td className="py-2.5 px-3 text-right font-semibold font-mono text-slate-900">
                          $ {movement.debe.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Totals Breakdown */}
              <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/30 flex flex-col gap-1 mt-1">
                {receipt && (
                  <>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Subtotal bruto</span>
                      <span className="font-mono">$ {(receipt.subtotal || movement.debe).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    {receipt.discountTotal > 0 && (
                      <div className="flex justify-between items-center text-red-600">
                        <span>Descuentos</span>
                        <span className="font-mono">-$ {receipt.discountTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    {receipt.taxAmount > 0 && (
                      <div className="flex justify-between items-center text-slate-600">
                        <span>IVA / Impuestos</span>
                        <span className="font-mono">$ {receipt.taxAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                  </>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-outline-variant/30 text-slate-900 font-bold text-sm">
                  <span>Total cargado a CC (Debe)</span>
                  <span className="font-mono text-red-700 text-base">
                    $ {movement.debe.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* Payment / Abono Detail */
            <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-5 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                <span className="material-symbols-outlined text-emerald-600">check_circle</span>
                Abono recibido y computado a favor de la cuenta corriente
              </div>
              <div className="text-xs text-emerald-800 space-y-1">
                <div><strong>Detalle:</strong> {payment?.concept || movement.concept}</div>
                <div><strong>Fecha de acreditación:</strong> {formatDate(movement.date)}</div>
                <div><strong>Titular:</strong> {movement.tutorName}</div>
              </div>
              <div className="pt-2 border-t border-emerald-200/60 flex justify-between items-center">
                <span className="font-bold text-emerald-950 text-sm">Importe abonado (Haber)</span>
                <span className="font-bold font-mono text-emerald-700 text-lg">
                  $ {movement.haber.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          )}

          {/* Archivo adjunto del comprobante (PDF o imagen) */}
          {isReceipt && (receipt?.voucherUrl ? (
            <div className="flex flex-col gap-2 p-3 bg-purple-50 border border-purple-200 rounded-xl">
              <div className="flex items-center gap-2 min-w-0">
                <span className="material-symbols-outlined text-[#5C3C7B]">attach_file</span>
                <span className="font-medium text-slate-800 text-xs truncate">
                  {receipt.voucherName || 'Comprobante adjunto'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setShowVoucherPreview(v => !v)}
                  aria-expanded={showVoucherPreview}
                  className="bg-[#5C3C7B] hover:bg-[#4A2F66] text-white px-3 py-2 min-h-[44px] sm:min-h-0 rounded-lg font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[15px]">{showVoucherPreview ? 'visibility_off' : 'visibility'}</span>
                  {showVoucherPreview ? 'Ocultar archivo' : 'Ver archivo'}
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadVoucher(receipt.voucherUrl!, receipt.voucherName)}
                  className="bg-white hover:bg-purple-100 text-[#5C3C7B] border border-purple-300 px-3 py-2 min-h-[44px] sm:min-h-0 rounded-lg font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[15px]">download</span>
                  Descargar
                </button>
              </div>
              {showVoucherPreview && (() => {
                const kind = getVoucherKind(receipt.voucherName, receipt.voucherUrl);
                if (kind === 'pdf') {
                  return (
                    <iframe
                      src={receipt.voucherUrl}
                      title={`Archivo adjunto ${receipt.voucherName || ''}`}
                      className="w-full h-[60vh] rounded-lg border border-purple-200 bg-white"
                    />
                  );
                }
                if (kind === 'image') {
                  return (
                    <img
                      src={receipt.voucherUrl}
                      alt={receipt.voucherName || 'Comprobante adjunto'}
                      className="w-full max-h-[60vh] object-contain rounded-lg border border-purple-200 bg-white"
                    />
                  );
                }
                return (
                  <p className="text-xs text-slate-600">
                    Este tipo de archivo no se puede mostrar aquí. Use "Descargar".
                  </p>
                );
              })()}
            </div>
          ) : (
            <p className="text-[11px] text-slate-500 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">attach_file_off</span>
              Este comprobante no tiene archivo adjunto.
            </p>
          ))}
        </div>

        {/* Footer */}
        <div className="bg-surface-container-low p-4 px-6 border-t border-outline-variant/30 flex justify-between items-center shrink-0">
          <button
            type="button"
            onClick={handlePrint}
            className="text-slate-700 hover:text-slate-900 hover:bg-surface-container font-semibold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-outline-variant/30"
          >
            <span className="material-symbols-outlined text-[16px]">print</span>
            Imprimir
          </button>

          <button
            type="button"
            onClick={onClose}
            className="bg-[#5C3C7B] hover:bg-[#4A2F66] text-white font-semibold px-5 py-2 rounded-xl text-xs transition-colors cursor-pointer shadow-sm"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
