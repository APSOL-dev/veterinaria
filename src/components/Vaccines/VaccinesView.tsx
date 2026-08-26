import React, { useState } from 'react';
import { Patient, VaccineCatalogItem, VaccineDosis } from '../../domain/types';

interface VaccinesViewProps {
  patients?: Patient[];
  selectedPatient: Patient;
  onSelectPatient?: (patient: Patient) => void;
  vaccineCatalog: VaccineCatalogItem[];
  onAddVaccineToCatalog: (name: string, frequencyDays: number) => void;
  vaccineDoses: VaccineDosis[];
  onRegisterDosis: (dosis: { vaccineId: string; applicationDate: string; vetName: string; batch?: string }) => void;
  onScheduleAppointment: (patientId: string) => void;
  isGeneralCatalog?: boolean;
}

export const VaccinesView: React.FC<VaccinesViewProps> = ({
  patients,
  selectedPatient,
  onSelectPatient,
  vaccineCatalog,
  onAddVaccineToCatalog,
  vaccineDoses,
  onRegisterDosis,
  onScheduleAppointment,
  isGeneralCatalog = false
}) => {
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [editingItem, setEditingItem] = useState<VaccineCatalogItem | null>(null);
  const [patientSearch, setPatientSearch] = useState('');

  // New / edit catalog item state
  const [newVacName, setNewVacName] = useState('');
  const [newVacDays, setNewVacDays] = useState(365);

  // Register dosis state
  const [selectedVacId, setSelectedVacId] = useState(vaccineCatalog[0]?.id || '');
  const [appDate, setAppDate] = useState(new Date().toISOString().split('T')[0]);
  const [vetName, setVetName] = useState('Dr. J. Silva');
  const [batchNum, setBatchNum] = useState('');

  const activePatient = selectedPatient;
  const patientDoses = vaccineDoses.filter(d => d.patientId === activePatient.id);
  const dueOrExpiredDosis = patientDoses.find(d => d.status === 'expired' || d.status === 'due_soon');

  const filteredPatients = (patients || []).filter(p => 
    p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
    p.species.toLowerCase().includes(patientSearch.toLowerCase()) ||
    p.ownerName.toLowerCase().includes(patientSearch.toLowerCase())
  );

  const handleCatalogAddOrEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVacName.trim()) return;

    if (editingItem) {
      // Modify existing item parameters
      editingItem.name = newVacName.trim();
      editingItem.frequencyDays = Number(newVacDays);
      setEditingItem(null);
    } else {
      onAddVaccineToCatalog(newVacName.trim(), Number(newVacDays));
    }

    setNewVacName('');
    setNewVacDays(365);
    setShowCatalogModal(false);
  };

  const handleOpenEditModal = (item: VaccineCatalogItem) => {
    setEditingItem(item);
    setNewVacName(item.name);
    setNewVacDays(item.frequencyDays);
    setShowCatalogModal(true);
  };

  const handleRegisterDosis = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVacId) return;
    onRegisterDosis({
      vaccineId: selectedVacId,
      applicationDate: appDate,
      vetName,
      batch: batchNum || undefined
    });
    setBatchNum('');
    setShowRegisterModal(false);
  };

  // General Clinic Vaccine Catalog View (NO Patient Selector)
  if (isGeneralCatalog) {
    return (
      <div className="flex flex-col w-full gap-md font-body-md text-on-surface">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-md bg-surface-container-lowest p-md rounded-2xl shadow-sm border border-outline-variant/30">
          <div className="flex items-center gap-md">
            <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-[22px]">vaccines</span>
            </div>
            <div>
              <h1 className="font-display-lg text-[20px] text-primary font-bold leading-tight">
                Gestión y Catálogo de Vacunas (Clínica)
              </h1>
              <p className="font-body-md text-xs text-on-surface-variant">
                Configuración general de biológicos, definición de plazos de inmunización y parámetros institucionales
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setEditingItem(null);
              setNewVacName('');
              setNewVacDays(365);
              setShowCatalogModal(true);
            }}
            className="bg-primary text-on-primary hover:bg-primary-container px-md py-2 rounded-lg font-label-md text-xs flex items-center gap-xs transition-colors shadow-sm font-semibold"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            Agregar Vacuna al Catálogo
          </button>
        </div>

        {/* Catalog Table */}
        <div className="bg-surface-container-lowest rounded-2xl p-md shadow-sm border border-outline-variant/30 flex-1 overflow-hidden">
          <div className="flex items-center justify-between mb-md">
            <h2 className="font-headline-sm text-sm font-bold text-on-surface flex items-center gap-xs">
              <span className="material-symbols-outlined text-primary text-[18px]">list_alt</span>
              Vacunas Registradas en la Clínica ({vaccineCatalog.length})
            </h2>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full text-left font-body-md text-xs whitespace-nowrap">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant font-label-md uppercase text-[10px]">
                  <th className="p-sm px-md">Nombre de la Vacuna</th>
                  <th className="p-sm px-md">Frecuencia / Vigencia</th>
                  <th className="p-sm px-md">Equivalente Meses</th>
                  <th className="p-sm px-md text-center">Estado</th>
                  <th className="p-sm px-md text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-on-surface">
                {vaccineCatalog.map((item) => {
                  const months = Math.round(item.frequencyDays / 30);
                  return (
                    <tr key={item.id} className="border-b border-surface-container hover:bg-surface-container-low transition-colors">
                      <td className="p-sm px-md font-bold text-primary text-sm">{item.name}</td>
                      <td className="p-sm px-md font-medium">{item.frequencyDays} días</td>
                      <td className="p-sm px-md text-on-surface-variant">~ {months} {months === 1 ? 'mes' : 'meses'}</td>
                      <td className="p-sm px-md text-center">
                        <span className="bg-[#E8F5E9] text-[#27AE60] text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Activa
                        </span>
                      </td>
                      <td className="p-sm px-md text-right">
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="bg-surface-container-high text-primary hover:bg-primary hover:text-white px-2.5 py-1 rounded-lg font-label-md text-xs inline-flex items-center gap-xs transition-colors"
                        >
                          <span className="material-symbols-outlined text-[14px]">edit</span>
                          Modificar Plazo / Datos
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Catalog Add/Edit */}
        {showCatalogModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-md">
            <div className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-lg shadow-xl flex flex-col gap-md">
              <div className="flex justify-between items-center border-b pb-sm">
                <h3 className="font-headline-sm text-primary font-bold text-base">
                  {editingItem ? 'Modificar Vacuna del Catálogo' : 'Agregar Vacuna al Catálogo'}
                </h3>
                <button onClick={() => setShowCatalogModal(false)} className="text-on-surface-variant hover:text-error">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleCatalogAddOrEdit} className="flex flex-col gap-sm">
                <label className="font-label-md text-on-surface-variant uppercase text-xs">Nombre de la Vacuna</label>
                <input
                  type="text"
                  value={newVacName}
                  onChange={(e) => setNewVacName(e.target.value)}
                  placeholder="Ej. Séxtuple, Antirrábica..."
                  required
                  className="bg-surface-container border-none rounded-xl p-md outline-none text-on-surface text-sm focus:ring-2 focus:ring-secondary"
                />

                <label className="font-label-md text-on-surface-variant uppercase text-xs mt-xs">Frecuencia / Plazo de Vigencia (Días)</label>
                <input
                  type="number"
                  value={newVacDays}
                  onChange={(e) => setNewVacDays(Number(e.target.value))}
                  required
                  min={1}
                  className="bg-surface-container border-none rounded-xl p-md outline-none text-on-surface text-xs focus:ring-2 focus:ring-secondary"
                />

                <button type="submit" className="bg-primary text-on-primary py-md rounded-xl font-label-md text-xs mt-sm hover:bg-primary-container font-bold shadow-sm">
                  {editingItem ? 'Guardar Cambios' : 'Agregar al Catálogo'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Patients Module: Control de Vacunas (With Master Patient Selection)
  return (
    <div className="flex flex-col md:flex-row gap-md w-full h-full flex-1 overflow-hidden font-body-md text-on-surface">
      {/* Left Column: All Patients Master List */}
      {patients && patients.length > 0 && (
        <aside className="flex flex-col w-full md:w-64 xl:w-72 gap-xs shrink-0 overflow-hidden">
          <div className="flex items-center justify-between px-xs">
            <h2 className="font-label-md text-xs text-on-surface-variant uppercase tracking-wider font-bold">
              Pacientes Vacunatorio ({filteredPatients.length})
            </h2>
          </div>

          {/* Quick Search */}
          <div className="bg-surface-container-lowest rounded-xl shadow-sm p-xs flex items-center relative border border-outline-variant/30">
            <span className="material-symbols-outlined text-on-surface-variant ml-sm mr-xs text-[18px]">
              search
            </span>
            <input
              type="text"
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
              placeholder="Buscar paciente o dueño..."
              className="w-full bg-transparent outline-none p-xs font-body-md text-xs text-on-surface placeholder:text-on-surface-variant"
            />
          </div>

          {/* Patient List */}
          <div className="flex flex-col gap-xs overflow-y-auto flex-1 pr-1 mt-xs">
            {filteredPatients.map((p) => {
              const isSelected = p.id === activePatient.id;
              const pDoses = vaccineDoses.filter(d => d.patientId === p.id);
              const hasExpired = pDoses.some(d => d.status === 'expired');

              return (
                <button
                  key={p.id}
                  onClick={() => onSelectPatient && onSelectPatient(p)}
                  className={`p-xs px-sm rounded-xl shadow-sm flex items-center gap-sm text-left transition-all relative overflow-hidden group border ${
                    isSelected
                      ? 'bg-primary text-on-primary border-primary shadow-md'
                      : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container border-outline-variant/30'
                  }`}
                >
                  <div className="relative w-10 h-10 rounded-full overflow-hidden shadow-sm shrink-0 flex items-center justify-center bg-surface-container-highest">
                    {p.photoUrl ? (
                      <img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover relative z-10" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    ) : null}
                    <span className="material-symbols-outlined text-[22px] text-on-surface-variant absolute" style={{ fontVariationSettings: "'FILL' 1" }}>
                      pets
                    </span>
                  </div>

                  <div className="flex flex-col flex-1 min-w-0 z-10">
                    <div className="flex items-center justify-between">
                      <span className={`font-headline-sm text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-on-background'}`}>
                        {p.name}
                      </span>
                      {hasExpired ? (
                        <span className="bg-error text-on-error text-[9px] font-bold px-1.5 py-0.2 rounded-full">Vencida</span>
                      ) : (
                        <span className="bg-[#E8F5E9] text-[#27AE60] text-[9px] font-bold px-1.5 py-0.2 rounded-full">Al día</span>
                      )}
                    </div>
                    <span className={`font-body-md text-[11px] truncate ${isSelected ? 'text-primary-fixed-dim' : 'text-on-surface-variant'}`}>
                      {p.species} • {p.breed}
                    </span>
                    <span className={`font-label-sm text-[10px] truncate ${isSelected ? 'text-primary-fixed-dim' : 'text-on-surface-variant'}`}>
                      Dueño: {p.ownerName}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>
      )}

      {/* Right Main Column: Active Patient Vaccine Detail */}
      <main className="flex flex-col flex-1 gap-md min-w-0 overflow-y-auto">
        {/* Header Hero */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-md bg-surface-container-lowest p-md rounded-2xl shadow-sm border border-outline-variant/30 shrink-0">
          <div className="flex items-center gap-md">
            <div className="w-12 h-12 rounded-full bg-surface-container-high overflow-hidden shadow-sm flex items-center justify-center shrink-0">
              {activePatient.photoUrl ? (
                <img src={activePatient.photoUrl} alt={activePatient.name} className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-[24px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>pets</span>
              )}
            </div>
            <div>
              <h1 className="font-display-lg text-[22px] text-on-surface leading-tight font-bold">{activePatient.name}</h1>
              <p className="font-body-md text-xs text-on-surface-variant flex items-center gap-xs">
                <span className="material-symbols-outlined text-[14px]">pets</span>
                {activePatient.species}, {activePatient.breed} • {activePatient.sex} • Dueño: <strong className="text-primary">{activePatient.ownerName}</strong>
              </p>
            </div>
          </div>

          <div className="flex gap-sm">
            <button
              onClick={() => setShowRegisterModal(true)}
              className="bg-primary text-on-primary hover:bg-primary-container px-md py-2 rounded-lg font-label-md text-xs flex items-center gap-xs transition-colors shadow-sm font-semibold"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              Registrar Aplicación
            </button>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-md flex-1">
          <div className="xl:col-span-2 flex flex-col gap-md">
            {/* Historial Table */}
            <div className="bg-surface-container-lowest rounded-2xl p-md shadow-sm border border-outline-variant/30">
              <h2 className="font-headline-sm text-sm font-bold text-on-surface mb-md flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary text-[18px]">vaccines</span>
                Historial de Vacunación — {activePatient.name}
              </h2>

              <div className="w-full overflow-x-auto">
                <table className="w-full text-left font-body-md text-xs whitespace-nowrap">
                  <thead>
                    <tr className="text-on-surface-variant border-b border-surface-container font-label-md uppercase text-[11px]">
                      <th className="pb-xs pr-md">Vacuna</th>
                      <th className="pb-xs px-md">Fecha Aplicación</th>
                      <th className="pb-xs px-md">Profesional</th>
                      <th className="pb-xs px-md">Fecha Límite</th>
                      <th className="pb-xs px-md">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="text-on-surface">
                    {patientDoses.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-md text-center text-on-surface-variant text-xs">
                          No hay dosis aplicadas registradas para {activePatient.name}.
                        </td>
                      </tr>
                    ) : (
                      patientDoses.map((dose) => {
                        return (
                          <tr key={dose.id} className="border-t border-surface-container hover:bg-surface-container-low transition-colors">
                            <td className="py-sm pr-md font-label-md text-primary font-semibold">{dose.vaccineName}</td>
                            <td className="py-sm px-md">{dose.applicationDate}</td>
                            <td className="py-sm px-md flex items-center gap-xs">
                              <div className="w-5 h-5 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-label-sm text-[10px]">
                                {dose.vetName.slice(0, 2).toUpperCase()}
                              </div>
                              {dose.vetName}
                            </td>
                            <td className={`py-sm px-md font-label-md ${
                              dose.status === 'expired' ? 'text-error font-bold' : dose.status === 'due_soon' ? 'text-[#E67E22] font-bold' : 'text-on-surface'
                            }`}>
                              {dose.expirationDate}
                            </td>
                            <td className="py-sm px-md">
                              {dose.status === 'ok' && (
                                <span className="inline-flex items-center gap-xs px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-[10px]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                                  Al día
                                </span>
                              )}
                              {dose.status === 'due_soon' && (
                                <span className="inline-flex items-center gap-xs px-2 py-0.5 rounded-full bg-[#FEF3E2] text-[#E67E22] font-label-sm text-[10px]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#E67E22]"></span>
                                  Próxima
                                </span>
                              )}
                              {dose.status === 'expired' && (
                                <span className="inline-flex items-center gap-xs px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm text-[10px]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
                                  Vencida
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
              {/* Próxima Aplicación Card */}
              <div className="bg-primary text-on-primary rounded-2xl p-md shadow-sm relative overflow-hidden flex flex-col justify-between">
                <div>
                  <h3 className="font-label-md text-primary-fixed-dim uppercase text-[10px] mb-xs">Próxima Aplicación</h3>
                  <p className="font-display-lg text-lg mb-xs">
                    {dueOrExpiredDosis ? dueOrExpiredDosis.vaccineName : 'Antirrábica'}
                  </p>
                  <p className="font-body-md text-primary-fixed text-xs flex items-center gap-xs mb-md">
                    <span className="material-symbols-outlined text-[14px]">warning</span>
                    {dueOrExpiredDosis 
                      ? `${dueOrExpiredDosis.status === 'expired' ? 'Vencida desde el' : 'Próxima a vencer el'} ${dueOrExpiredDosis.expirationDate}`
                      : 'Sin vacunas vencidas pendientes'}
                  </p>
                </div>
                <button
                  onClick={() => onScheduleAppointment(activePatient.id)}
                  className="w-full bg-on-primary text-primary hover:bg-primary-fixed py-1.5 rounded-lg font-label-md text-xs transition-colors"
                >
                  Agendar Turno
                </button>
              </div>

              {/* Cobertura Actual Card */}
              <div className="bg-surface-container-lowest rounded-2xl p-md shadow-sm border border-outline-variant/30 flex flex-col justify-between">
                <div>
                  <h3 className="font-label-md text-on-surface-variant uppercase text-[10px] mb-xs">Cobertura Actual</h3>
                  <div className="flex items-end gap-sm mb-sm">
                    <span className="font-display-lg text-2xl text-on-surface">
                      {patientDoses.length > 0 
                        ? Math.round((patientDoses.filter(d => d.status === 'ok').length / patientDoses.length) * 100)
                        : 0}%
                    </span>
                    <span className="font-body-md text-xs text-on-surface-variant pb-0.5">
                      {patientDoses.filter(d => d.status === 'ok').length} de {patientDoses.length} al día
                    </span>
                  </div>
                </div>
                <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-secondary h-full rounded-full transition-all duration-500" 
                    style={{ 
                      width: `${patientDoses.length > 0 
                        ? (patientDoses.filter(d => d.status === 'ok').length / patientDoses.length) * 100 
                        : 0}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Recordatorios Panel */}
          <div className="flex flex-col gap-md">
            <div className="bg-surface-container-lowest rounded-2xl p-md shadow-sm border border-outline-variant/30 h-full">
              <div className="flex items-center justify-between mb-md">
                <h2 className="font-headline-sm text-sm font-bold text-on-surface flex items-center gap-xs">
                  <span className="material-symbols-outlined text-secondary text-[18px]">campaign</span>
                  Recordatorios de Vacunas
                </h2>
              </div>

              <div className="flex flex-col gap-sm relative">
                <div className="relative z-10 flex gap-sm">
                  <div className="w-7 h-7 rounded-full bg-surface-container-lowest shadow-sm flex items-center justify-center border border-surface-container shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[14px] text-secondary">sms</span>
                  </div>
                  <div className="flex-1 bg-surface-container-low rounded-xl p-sm">
                    <div className="flex justify-between items-start mb-0.5">
                      <span className="font-label-md text-xs text-on-surface font-semibold">Antirrábica</span>
                      <span className="font-label-sm text-[10px] text-on-surface-variant">Hoy, 09:00</span>
                    </div>
                    <p className="font-body-md text-on-surface-variant text-[11px] mb-1">
                      "Hola {activePatient.ownerName}, te recordamos que la vacuna Antirrábica de {activePatient.name} está vencida..."
                    </p>
                    <div className="flex items-center gap-xs">
                      <span className="material-symbols-outlined text-[13px] text-secondary">done_all</span>
                      <span className="font-label-sm text-[10px] text-secondary">Entregado</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Register Dosis Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-md">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-lg shadow-xl flex flex-col gap-md">
            <div className="flex justify-between items-center border-b pb-sm">
              <h3 className="font-headline-sm text-primary text-base font-bold">
                Registrar Aplicación de Vacuna ({activePatient.name})
              </h3>
              <button onClick={() => setShowRegisterModal(false)} className="text-on-surface-variant hover:text-error">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleRegisterDosis} className="flex flex-col gap-xs text-xs">
              <label className="font-label-md text-on-surface-variant uppercase text-[11px]">Seleccionar Vacuna</label>
              <select
                value={selectedVacId}
                onChange={(e) => setSelectedVacId(e.target.value)}
                className="bg-surface-container border-none rounded-xl p-sm outline-none text-on-surface text-xs focus:ring-2 focus:ring-secondary"
              >
                {vaccineCatalog.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.frequencyDays} días)
                  </option>
                ))}
              </select>

              <label className="font-label-md text-on-surface-variant uppercase text-[11px] mt-xs">Fecha de Aplicación</label>
              <input
                type="date"
                value={appDate}
                onChange={(e) => setAppDate(e.target.value)}
                required
                className="bg-surface-container border-none rounded-xl p-sm outline-none text-on-surface text-xs focus:ring-2 focus:ring-secondary"
              />

              <label className="font-label-md text-on-surface-variant uppercase text-[11px] mt-xs">Veterinario Actuante</label>
              <input
                type="text"
                value={vetName}
                onChange={(e) => setVetName(e.target.value)}
                required
                className="bg-surface-container border-none rounded-xl p-sm outline-none text-on-surface text-xs focus:ring-2 focus:ring-secondary"
              />

              <button type="submit" className="bg-secondary text-on-secondary py-2 rounded-xl font-label-md text-xs mt-md hover:bg-primary font-bold shadow-sm">
                Guardar Dosis
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
