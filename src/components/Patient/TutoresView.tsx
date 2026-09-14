import React, { useState, useMemo } from 'react';
import { Patient, BillReceipt, MedicalAppointment, GroomingAppointment } from '../../domain/types';
import { getUniqueTutores, updateTutorAndPetInfo, calculateTutorAccountMovements, getTutorAppointments, TutorAppointmentSummary, TutorPaymentRecord } from '../../domain/services/tutorService';
import { AppNotificationModal } from '../Common/AppNotificationModal';

interface TutoresViewProps {
  patients: Patient[];
  onUpdatePatients: (updatedPatients: Patient[]) => void;
  receipts?: BillReceipt[];
  medicalAppointments?: MedicalAppointment[];
  groomingAppointments?: GroomingAppointment[];
}

export const TutoresView: React.FC<TutoresViewProps> = ({
  patients,
  onUpdatePatients,
  receipts = [],
  medicalAppointments = [],
  groomingAppointments = []
}) => {
  const tutores = useMemo(() => getUniqueTutores(patients), [patients]);
  const [selectedTutorName, setSelectedTutorName] = useState<string>(tutores[0]?.ownerName || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);

  // Tutor Payments state
  const [tutorPayments, setTutorPayments] = useState<TutorPaymentRecord[]>([
    { id: 'tp-init-1', tutorName: 'Carlos Mendoza', date: '2026-08-15', amount: 5000, concept: 'Abono consulta clínica' }
  ]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payConcept, setPayConcept] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);

  const activeTutor = useMemo(() => {
    return tutores.find(t => t.ownerName.toLowerCase() === selectedTutorName.toLowerCase()) || tutores[0];
  }, [tutores, selectedTutorName]);

  const filteredTutores = useMemo(() => {
    return tutores.filter(t => 
      t.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.ownerPhone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.pets.some(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [tutores, searchQuery]);

  // Account movements for active tutor
  const accountMovements = useMemo(() => {
    if (!activeTutor) return [];
    return calculateTutorAccountMovements(activeTutor.ownerName, receipts, tutorPayments);
  }, [activeTutor, receipts, tutorPayments]);

  const currentTutorSaldo = useMemo(() => {
    if (accountMovements.length === 0) return 0;
    return accountMovements[accountMovements.length - 1].saldo;
  }, [accountMovements]);

  // Turnos del tutor (médicos y peluquería)
  const tutorAppointments = useMemo(() => {
    if (!activeTutor) return [];
    return getTutorAppointments(
      activeTutor.ownerName,
      activeTutor.pets.map(p => p.id),
      medicalAppointments,
      groomingAppointments
    );
  }, [activeTutor, medicalAppointments, groomingAppointments]);

  // Edit Modal Form State
  const [editOwnerName, setEditOwnerName] = useState('');
  const [editOwnerPhone, setEditOwnerPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editPetFields, setEditPetFields] = useState<Record<string, { name: string; species: any; breed: string; weightKg: number }>>({});

  const handleOpenEdit = () => {
    if (!activeTutor) return;
    setEditOwnerName(activeTutor.ownerName);
    setEditOwnerPhone(activeTutor.ownerPhone);
    setEditAddress(activeTutor.address || '');

    const initialPetState: Record<string, { name: string; species: any; breed: string; weightKg: number }> = {};
    activeTutor.pets.forEach(p => {
      initialPetState[p.id] = {
        name: p.name,
        species: p.species,
        breed: p.breed,
        weightKg: p.weightKg || 0
      };
    });
    setEditPetFields(initialPetState);
    setShowEditModal(true);
  };

  const [notifModal, setNotifModal] = useState<{ isOpen: boolean; message: string }>({ isOpen: false, message: '' });

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTutor || !editOwnerName.trim()) return;

    const updated = updateTutorAndPetInfo(patients, activeTutor.ownerName, {
      newOwnerName: editOwnerName.trim(),
      newOwnerPhone: editOwnerPhone.trim(),
      petUpdates: editPetFields
    });

    onUpdatePatients(updated);
    setSelectedTutorName(editOwnerName.trim());
    setShowEditModal(false);
    setNotifModal({
      isOpen: true,
      message: '¡Datos del tutor y sus mascotas actualizados correctamente!'
    });
  };

  const handleAddTutorPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTutor || payAmount <= 0) return;

    const newPayment: TutorPaymentRecord = {
      id: `tp-${Date.now()}`,
      tutorName: activeTutor.ownerName,
      date: payDate,
      amount: Number(payAmount),
      concept: payConcept.trim() || 'Abono / Pago a Cuenta Corriente'
    };

    setTutorPayments(prev => [newPayment, ...prev]);
    setShowPaymentModal(false);
    setPayAmount(0);
    setPayConcept('');
    setNotifModal({
      isOpen: true,
      message: `¡Pago de $${newPayment.amount.toLocaleString('es-AR')} registrado a favor de ${activeTutor.ownerName}!`
    });
  };

  const cleanPhone = (phone?: string) => {
    if (!phone) return '';
    return phone.replace(/[^0-9]/g, '');
  };

  if (!activeTutor) {
    return <div className="p-md text-on-surface-variant">No se encontraron tutores registrados.</div>;
  }

  return (
    <div className="flex flex-col md:flex-row gap-md w-full h-full flex-1 overflow-hidden font-body-md text-on-surface">
      {/* Left Column: Tutores Master List */}
      <aside className="flex flex-col w-full md:w-64 xl:w-72 gap-xs shrink-0 overflow-hidden">
        <div className="flex items-center justify-between px-xs">
          <h2 className="font-label-md text-xs text-on-surface-variant font-semibold truncate">
            Padrón de tutores ({filteredTutores.length})
          </h2>
        </div>

        {/* Quick Search */}
        <div className="bg-surface-container-lowest rounded-xl shadow-sm p-xs flex items-center relative border border-outline-variant/30">
          <span className="material-symbols-outlined text-on-surface-variant ml-sm mr-xs text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por dueño, teléfono..."
            className="w-full bg-transparent text-xs text-on-surface placeholder:text-on-surface-variant/70 outline-none font-medium pr-sm"
          />
        </div>

        {/* Scrollable Tutor Items */}
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-xs min-h-0">
          {filteredTutores.map((tutor) => {
            const isSelected = tutor.ownerName.toLowerCase() === activeTutor.ownerName.toLowerCase();
            return (
              <div
                key={tutor.ownerName}
                onClick={() => setSelectedTutorName(tutor.ownerName)}
                className={`p-md rounded-2xl cursor-pointer transition-all border flex flex-col gap-xs ${
                  isSelected
                    ? 'bg-[#5C3C7B] text-white border-[#5C3C7B] shadow-md scale-[0.99]'
                    : 'bg-surface-container-lowest hover:bg-surface-container text-on-surface border-outline-variant/30 shadow-xs'
                }`}
              >
                <div className="flex justify-between items-start">
                  <h3 className={`font-headline-sm text-sm font-semibold truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                    {tutor.ownerName}
                  </h3>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-surface-container-high text-primary'
                  }`}>
                    {tutor.pets.length} {tutor.pets.length === 1 ? 'mascota' : 'mascotas'}
                  </span>
                </div>

                <div className="flex items-center gap-xs text-xs font-medium">
                  <span className="material-symbols-outlined text-[14px]">call</span>
                  <span>{tutor.ownerPhone}</span>
                </div>

                <div className="flex flex-wrap gap-1 mt-xs">
                  {tutor.pets.map(p => (
                    <span
                      key={p.id}
                      className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-surface-container text-on-surface-variant'
                      }`}
                    >
                      {p.name}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* Right Main Panel: Tutor Info & Account Ledger */}
      <main className="flex-1 flex flex-col gap-md min-w-0 overflow-y-auto pr-1">
        {/* Tutor Profile Header Card */}
        <div className="bg-surface-container-lowest rounded-2xl p-lg shadow-md border border-outline-variant/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-md">
          <div className="flex items-center gap-md">
            <div className="w-14 h-14 rounded-2xl bg-[#1D1426] text-white flex items-center justify-center font-bold text-xl shadow-md shrink-0">
              {activeTutor.ownerName.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="font-display-lg text-xl text-slate-900 font-semibold leading-tight">
                {activeTutor.ownerName}
              </h1>
              <p className="font-body-md text-xs text-slate-600 font-medium flex flex-wrap items-center gap-md mt-1">
                <span className="flex items-center gap-xs">
                  <span className="material-symbols-outlined text-[15px]">call</span>
                  {activeTutor.ownerPhone}
                </span>
                <span className="flex items-center gap-xs">
                  <span className="material-symbols-outlined text-[15px]">location_on</span>
                  {activeTutor.address || 'San Juan 450'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-sm flex-wrap">
            {/* Saldo Badge */}
            <div className="bg-surface-container-low border border-outline-variant/40 rounded-xl px-4 py-2 flex items-center gap-xs">
              <span className="text-[10px] font-medium text-slate-500">Saldo cta. cte.:</span>
              <span className={`text-sm font-semibold font-mono ${currentTutorSaldo > 0 ? 'text-red-700' : 'text-[#27AE60]'}`}>
                $ {currentTutorSaldo.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <button
              onClick={() => setShowPaymentModal(true)}
              className="bg-[#5C3C7B] hover:bg-[#4A2F66] text-white px-4 py-2.5 rounded-xl font-label-md text-xs flex items-center gap-1.5 transition-colors shadow-sm font-semibold cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">payments</span>
              <span>Registrar pago</span>
            </button>

            {activeTutor.ownerPhone && (
              <a
                href={`https://wa.me/${cleanPhone(activeTutor.ownerPhone)}`}
                target="_blank"
                rel="noreferrer"
                className="bg-[#25D366] text-white hover:bg-[#1EBE5D] px-4 py-2.5 rounded-xl font-label-md text-xs flex items-center gap-1.5 transition-colors shadow-sm font-semibold"
              >
                <span className="material-symbols-outlined text-[16px]">chat</span>
                WhatsApp
              </a>
            )}

            <button
              onClick={handleOpenEdit}
              className="bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/40 px-4 py-2.5 rounded-xl font-label-md text-xs flex items-center gap-1.5 transition-colors shadow-xs font-semibold cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
              Editar datos
            </button>
          </div>
        </div>

        {/* Cuenta Corriente del Tutor (Debe, Haber, Saldo) */}
        <div className="bg-surface-container-lowest rounded-2xl p-md shadow-sm border border-outline-variant/30 flex flex-col gap-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-headline-sm text-sm font-semibold text-slate-900 flex items-center gap-xs">
              <span className="material-symbols-outlined text-[#9A7DB8] text-[18px]">account_balance</span>
              Cuenta corriente del tutor — Movimientos de saldo
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              Servicios cobrados (Debe) y abonos recibidos (Haber)
            </span>
          </div>

          <div className="overflow-x-auto border border-outline-variant/30 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#5C3C7B] text-white font-semibold text-xs border-b border-purple-900/20">
                  <th className="py-3 px-md text-center">Fecha</th>
                  <th className="py-3 px-md">Concepto / comprobante</th>
                  <th className="py-3 px-md text-right">Debe</th>
                  <th className="py-3 px-md text-right">Haber</th>
                  <th className="py-3 px-md text-right">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 font-medium">
                {accountMovements.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-md text-center text-slate-500 italic">
                      No hay movimientos registrados en la cuenta corriente de este tutor.
                    </td>
                  </tr>
                ) : (
                  accountMovements.map(m => (
                    <tr key={m.id} className="hover:bg-surface-container/20 transition-colors">
                      <td className="py-2.5 px-md text-center font-mono text-slate-600">
                        {m.date}
                      </td>
                      <td className="py-2.5 px-md font-medium text-slate-900">
                        {m.concept}
                      </td>
                      <td className="py-2.5 px-md text-right font-medium text-slate-900">
                        {m.debe > 0 ? (
                          `$ ${m.debe.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        ) : (
                          <span className="text-slate-400 font-normal">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-md text-right font-semibold text-[#27AE60]">
                        {m.haber > 0 ? (
                          `$ ${m.haber.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        ) : (
                          <span className="text-slate-400 font-normal">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-md text-right font-semibold text-slate-900 font-mono">
                        $ {m.saldo.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Turnos Programados del Tutor / Mascotas */}
        <div className="bg-surface-container-lowest rounded-2xl p-md shadow-sm border border-outline-variant/30 flex flex-col gap-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-headline-sm text-sm font-semibold text-slate-900 flex items-center gap-xs">
              <span className="material-symbols-outlined text-[#9A7DB8] text-[18px]">calendar_month</span>
              Turnos programados del tutor ({tutorAppointments.length})
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              Consultas médicas y peluquería
            </span>
          </div>

          {tutorAppointments.length === 0 ? (
            <p className="text-xs text-slate-500 italic p-xs">No hay turnos programados ni registrados para este tutor.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-sm">
              {tutorAppointments.map((app: TutorAppointmentSummary) => {
                const isPending = app.status === 'pending' || app.status === 'confirmed';
                return (
                  <div key={app.id} className={`p-sm rounded-xl border flex flex-col justify-between text-xs gap-xs ${
                    isPending ? 'bg-amber-50/60 border-amber-200' : 'bg-surface-container-low border-outline-variant/20'
                  }`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-slate-900">{app.patientName}</span>
                        <span className="text-slate-500 text-[11px] ml-1.5">({app.type})</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        app.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : isPending
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-slate-200 text-slate-700'
                      }`}>
                        {app.status === 'completed' ? '✓ Cobrado / Completado' : isPending ? 'Pendiente' : app.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-md text-[#5C3C7B] font-medium text-[11px]">
                      <span className="flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[13px]">event</span>
                        {app.date}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[13px]">schedule</span>
                        {app.time} hs
                      </span>
                    </div>
                    <div className="text-slate-600 text-[11px] truncate">
                      {app.detail}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Associated Pets Section */}
        <div className="bg-surface-container-lowest rounded-2xl p-md shadow-sm border border-outline-variant/30 flex-1">
          <h2 className="font-headline-sm text-sm font-bold text-on-surface mb-md flex items-center gap-xs">
            <span className="material-symbols-outlined text-[#9A7DB8] text-[18px]">pets</span>
            Mascotas Asociadas a {activeTutor.ownerName} ({activeTutor.pets.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-md">
            {activeTutor.pets.map((pet) => (
              <div key={pet.id} className="bg-surface-container-low rounded-2xl p-md border border-outline-variant/30 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
                <div className="flex items-center gap-md mb-sm">
                  <div className="w-12 h-12 rounded-xl bg-surface-container-high overflow-hidden shadow-xs flex items-center justify-center shrink-0">
                    {pet.photoUrl ? (
                      <img src={pet.photoUrl} alt={pet.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-[24px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>pets</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-headline-sm text-base text-primary font-bold truncate">{pet.name}</h3>
                    <p className="font-body-md text-xs text-on-surface-variant truncate">
                      {pet.species} • {pet.breed}
                    </p>
                    <p className="font-label-sm text-[11px] text-secondary font-bold">
                      {pet.sex} • {pet.weightKg} kg
                    </p>
                  </div>
                </div>

                <div className="border-t border-surface-container pt-xs flex justify-between items-center text-xs text-on-surface-variant">
                  <span>ID: {pet.id}</span>
                  <span className="bg-surface-container-highest px-2 py-0.5 rounded-full text-[10px] font-bold text-primary">
                    Paciente Activo
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Modal Registrar Pago / Abono a Tutor */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-md animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-lg shadow-2xl flex flex-col gap-md border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-200 pb-sm">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#5C3C7B] text-[22px]">payments</span>
                <h3 className="font-bold text-sm text-slate-900">Registrar pago</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleAddTutorPaymentSubmit} className="flex flex-col gap-md text-xs">
              <div>
                <label className="font-semibold text-xs text-slate-700 block mb-1">Tutor beneficiario</label>
                <input
                  type="text"
                  value={activeTutor.ownerName}
                  disabled
                  className="w-full bg-slate-100 border border-slate-300 rounded-xl p-2.5 text-slate-700 font-semibold text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-xs text-slate-700 block mb-1">Fecha del pago *</label>
                <input
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  required
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-none text-slate-900 font-medium text-xs focus:border-[#9A7DB8]"
                />
              </div>

              <div>
                <label className="font-semibold text-xs text-slate-700 block mb-1">Importe a abonar ($) *</label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  placeholder="Ej. 10000"
                  required
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-none text-slate-900 font-semibold text-sm focus:border-[#9A7DB8]"
                />
              </div>

              <div>
                <label className="font-semibold text-xs text-slate-700 block mb-1">Concepto / nota (Opcional)</label>
                <input
                  type="text"
                  value={payConcept}
                  onChange={(e) => setPayConcept(e.target.value)}
                  placeholder="Ej. Pago parcial de servicios de clínica"
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-none text-slate-900 font-medium text-xs focus:border-[#9A7DB8]"
                />
              </div>

              <div className="flex items-center justify-end gap-sm pt-xs border-t border-slate-200 mt-xs">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#5C3C7B] hover:bg-[#4A2F66] text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>Registrar abono</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Tutor & Pets Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-md">
          <div className="bg-surface-container-lowest rounded-2xl max-w-2xl w-full p-lg shadow-xl flex flex-col gap-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-sm">
              <h3 className="font-headline-sm text-primary font-semibold text-base flex items-center gap-xs">
                <span className="material-symbols-outlined text-[20px]">edit_note</span>
                Editar datos del tutor y sus mascotas
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-on-surface-variant hover:text-error">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="flex flex-col gap-md">
              {/* Tutor Section */}
              <div className="bg-surface-container-low p-md rounded-xl flex flex-col gap-sm border border-outline-variant/30">
                <h4 className="font-label-md text-xs text-primary font-semibold">
                  1. Datos del tutor (Propietario)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-sm text-xs">
                  <div>
                    <label className="font-label-md text-on-surface-variant block mb-1">Nombre completo</label>
                    <input
                      type="text"
                      value={editOwnerName}
                      onChange={(e) => setEditOwnerName(e.target.value)}
                      required
                      className="w-full bg-surface-container border border-outline-variant/80 rounded-lg p-2 text-on-surface font-semibold outline-none focus:ring-2 focus:ring-secondary"
                    />
                  </div>
                  <div>
                    <label className="font-label-md text-on-surface-variant block mb-1">Teléfono / WhatsApp</label>
                    <input
                      type="text"
                      value={editOwnerPhone}
                      onChange={(e) => setEditOwnerPhone(e.target.value)}
                      className="w-full bg-surface-container border border-outline-variant/80 rounded-lg p-2 text-on-surface font-semibold outline-none focus:ring-2 focus:ring-secondary"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-sm pt-xs border-t">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#9A7DB8] hover:bg-[#8362A5] text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>Guardar cambios</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AppNotificationModal
        isOpen={notifModal.isOpen}
        message={notifModal.message}
        type="success"
        onClose={() => setNotifModal({ isOpen: false, message: '' })}
      />
    </div>
  );
};
