import React, { useState, useEffect, useMemo } from 'react';
import { 
  MedicalAppointment, 
  GroomingAppointment, 
  GroomingService, 
  Patient 
} from '../../domain/types';
import { 
  calculateEndTime, 
  formatTimeRange, 
  isSlotOccupiedByAppointment,
  getWeekDays,
  formatWeekRangeHeader,
  shiftWeek,
  formatDateToISO,
  filterAppointmentsWithNotes
} from '../../domain/services/agendaService';
import { SearchablePatientSelect } from '../Common/SearchablePatientSelect';

interface AgendaViewProps {
  patients: Patient[];
  medicalAppointments: MedicalAppointment[];
  onAddMedicalAppointment: (appointment: Omit<MedicalAppointment, 'id'>) => void;
  onUpdateMedicalAppointment?: (id: string, updates: Partial<MedicalAppointment>) => void;
  onDeleteMedicalAppointment?: (id: string) => void;
  groomingAppointments: GroomingAppointment[];
  groomingServices: GroomingService[];
  onAddGroomingAppointment: (appointment: Omit<GroomingAppointment, 'id'>) => void;
  onUpdateGroomingAppointment?: (id: string, updates: Partial<GroomingAppointment>) => void;
  onDeleteGroomingAppointment?: (id: string) => void;
  onNavigateToBilling?: (patientId: string, serviceName: string, amount: number) => void;
  fixedMode?: 'medica' | 'peluqueria';
  initialPatientId?: string;
  initialReason?: string;
  autoOpenNewModal?: boolean;
  currentVetName?: string;
}

const extendedTimeSlots = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00'
];

export const AgendaView: React.FC<AgendaViewProps> = ({
  patients,
  medicalAppointments,
  onAddMedicalAppointment,
  onUpdateMedicalAppointment,
  onDeleteMedicalAppointment,
  groomingAppointments,
  groomingServices,
  onAddGroomingAppointment,
  onUpdateGroomingAppointment,
  onDeleteGroomingAppointment,
  onNavigateToBilling,
  fixedMode,
  initialPatientId,
  initialReason,
  autoOpenNewModal,
  currentVetName = 'Dr. J. Silva'
}) => {
  const [agendaMode, setAgendaMode] = useState<'medica' | 'peluqueria'>(fixedMode || 'medica');
  const [showNewModal, setShowNewModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [refDate, setRefDate] = useState<Date>(() => new Date());

  // Appointment Detail / Action Modal state
  const [detailModal, setDetailModal] = useState<{
    isOpen: boolean;
    appointment: MedicalAppointment | GroomingAppointment;
    mode: 'medica' | 'peluqueria';
  } | null>(null);

  const [modalTab, setModalTab] = useState<'anotaciones' | 'cambiar-turno' | 'cancelar'>('anotaciones');
  const [editNotes, setEditNotes] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('10:00');

  const activeMode = fixedMode || agendaMode;
  const todayISO = useMemo(() => formatDateToISO(new Date()), []);
  const weekDays = useMemo(() => getWeekDays(refDate), [refDate]);
  const weekHeaderLabel = useMemo(() => formatWeekRangeHeader(refDate), [refDate]);

  const notesHistoryList = useMemo(() => {
    if (activeMode === 'medica') {
      return filterAppointmentsWithNotes(medicalAppointments, historySearchQuery);
    } else {
      return filterAppointmentsWithNotes(groomingAppointments, historySearchQuery);
    }
  }, [activeMode, medicalAppointments, groomingAppointments, historySearchQuery]);

  // New Medical / Grooming Appointment form state
  const [selectedPatientId, setSelectedPatientId] = useState(initialPatientId || patients[0]?.id || '');
  const [vetName, setVetName] = useState(currentVetName || 'Dr. J. Silva');
  const [appDate, setAppDate] = useState(() => formatDateToISO(new Date()));
  const [appTime, setAppTime] = useState('10:00');
  const [appEndTime, setAppEndTime] = useState('11:00');
  const [reason, setReason] = useState(initialReason || 'Consulta General');

  // Sync initial prefilled props when passed dynamically
  useEffect(() => {
    if (initialPatientId) {
      setSelectedPatientId(initialPatientId);
    }
    if (initialReason) {
      setReason(initialReason);
    }
    if (autoOpenNewModal) {
      setShowNewModal(true);
    }
  }, [initialPatientId, initialReason, autoOpenNewModal]);

  // New Grooming Appointment state
  const [selectedGroomServiceId, setSelectedGroomServiceId] = useState(groomingServices[0]?.id || '');

  // Auto update endTime when appTime or service changes
  useEffect(() => {
    if (activeMode === 'peluqueria') {
      const srv = groomingServices.find(s => s.id === selectedGroomServiceId);
      const duration = srv ? srv.durationMinutes : 60;
      setAppEndTime(calculateEndTime(appTime, duration));
    } else {
      setAppEndTime(calculateEndTime(appTime, 60));
    }
  }, [appTime, selectedGroomServiceId, activeMode, groomingServices]);

  const handleAddAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    const patient = patients.find(p => p.id === selectedPatientId);
    if (!patient) return;

    if (activeMode === 'medica') {
      onAddMedicalAppointment({
        patientId: patient.id,
        patientName: patient.name,
        species: patient.species,
        breed: patient.breed,
        ownerName: patient.ownerName,
        vetName,
        date: appDate,
        time: appTime,
        endTime: appEndTime,
        reason,
        status: 'confirmed'
      });
    } else {
      const srv = groomingServices.find(s => s.id === selectedGroomServiceId);
      if (!srv) return;
      onAddGroomingAppointment({
        patientId: patient.id,
        patientName: patient.name,
        species: patient.species,
        breed: patient.breed,
        ownerName: patient.ownerName,
        serviceId: srv.id,
        serviceName: srv.name,
        date: appDate,
        time: appTime,
        endTime: appEndTime,
        durationMinutes: srv.durationMinutes,
        price: srv.price,
        status: 'confirmed'
      });
    }

    setReason('Consulta General');
    setShowNewModal(false);
  };

  const handleOpenDetailModal = (appt: MedicalAppointment | GroomingAppointment, mode: 'medica' | 'peluqueria') => {
    setDetailModal({
      isOpen: true,
      appointment: appt,
      mode
    });
    setModalTab('anotaciones');
    setEditNotes(appt.notes || '');
    setEditDate(appt.date);
    setEditTime(appt.time);
  };

  const handleSaveNotes = (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailModal) return;
    const { appointment, mode } = detailModal;
    const notesStr = editNotes.trim();

    if (mode === 'medica' && onUpdateMedicalAppointment) {
      onUpdateMedicalAppointment(appointment.id, { notes: notesStr });
    } else if (mode === 'peluqueria' && onUpdateGroomingAppointment) {
      onUpdateGroomingAppointment(appointment.id, { notes: notesStr });
    }
    setDetailModal(null);
  };

  const handleSaveReschedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailModal) return;
    const { appointment, mode } = detailModal;

    if (mode === 'medica' && onUpdateMedicalAppointment) {
      onUpdateMedicalAppointment(appointment.id, {
        date: editDate,
        time: editTime,
        endTime: calculateEndTime(editTime, 60)
      });
    } else if (mode === 'peluqueria' && onUpdateGroomingAppointment) {
      const duration = (appointment as GroomingAppointment).durationMinutes || 45;
      onUpdateGroomingAppointment(appointment.id, {
        date: editDate,
        time: editTime,
        endTime: calculateEndTime(editTime, duration)
      });
    }
    setDetailModal(null);
  };

  const handleConfirmCancel = () => {
    if (!detailModal) return;
    const { appointment, mode } = detailModal;

    if (mode === 'medica') {
      if (onDeleteMedicalAppointment) {
        onDeleteMedicalAppointment(appointment.id);
      } else if (onUpdateMedicalAppointment) {
        onUpdateMedicalAppointment(appointment.id, { status: 'cancelled' });
      }
    } else if (mode === 'peluqueria') {
      if (onDeleteGroomingAppointment) {
        onDeleteGroomingAppointment(appointment.id);
      } else if (onUpdateGroomingAppointment) {
        onUpdateGroomingAppointment(appointment.id, { status: 'cancelled' });
      }
    }
    setDetailModal(null);
  };

  const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];

  return (
    <div className="flex flex-col w-full h-full gap-md font-body-md text-slate-800">
      {/* Module Title Header */}
      <div className="flex items-center justify-between mb-md">
        <div>
          <h1 className="font-display-lg text-[22px] text-slate-900 leading-tight font-bold">
            {activeMode === 'medica' ? 'Clínica — Agenda Médica' : 'Peluquería — Agenda de Estética'}
          </h1>
          <p className="font-body-md text-xs text-slate-600 font-medium mt-0.5">
            {activeMode === 'medica'
              ? 'Gestión de turnos médicos en consultorio, cobranza directa e historia clínica'
              : 'Gestión de turnos de peluquería, baño y estética canina/felina'}
          </p>
        </div>
      </div>

      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-md bg-white p-sm px-md rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-sm">
          <div className="flex items-center gap-xs bg-purple-50/80 p-1 rounded-xl border border-purple-100">
            <button 
              onClick={() => setRefDate(prev => shiftWeek(prev, -1))}
              title="Semana anterior"
              className="p-xs text-slate-600 hover:bg-purple-100 rounded-lg transition-colors flex items-center justify-center cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <button 
              onClick={() => setRefDate(new Date())}
              title="Ir a la semana actual"
              className="px-sm py-0.5 text-slate-800 hover:bg-purple-100 rounded-lg transition-colors font-label-md text-xs font-bold cursor-pointer"
            >
              Hoy
            </button>
            <button 
              onClick={() => setRefDate(prev => shiftWeek(prev, 1))}
              title="Semana siguiente"
              className="p-xs text-slate-600 hover:bg-purple-100 rounded-lg transition-colors flex items-center justify-center cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>

          <span className="font-headline-sm text-sm text-slate-900 font-bold ml-xs">{weekHeaderLabel}</span>
        </div>

        <div className="flex items-center gap-md">
          {/* Mode Title or Switcher */}
          {!fixedMode ? (
            <div className="flex bg-purple-50/80 p-1 rounded-full border border-purple-100">
              <button
                onClick={() => setAgendaMode('medica')}
                className={`px-md py-1.5 rounded-full font-label-md text-xs transition-all flex items-center gap-1 cursor-pointer ${
                  agendaMode === 'medica'
                    ? 'bg-[#9A7DB8] text-white shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900 font-medium'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">stethoscope</span>
                Área Médica
              </button>
              <button
                onClick={() => setAgendaMode('peluqueria')}
                className={`px-md py-1.5 rounded-full font-label-md text-xs transition-all flex items-center gap-1 cursor-pointer ${
                  agendaMode === 'peluqueria'
                    ? 'bg-[#8362A5] text-white shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900 font-medium'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">content_cut</span>
                Peluquería
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-purple-50 border border-purple-200 rounded-full text-xs font-bold text-[#5C3C7B]">
              <span className="material-symbols-outlined text-[16px]">
                {fixedMode === 'medica' ? 'stethoscope' : 'content_cut'}
              </span>
              <span>{fixedMode === 'medica' ? 'Calendario Área Médica' : 'Calendario Peluquería'}</span>
            </div>
          )}

          <button
            onClick={() => setShowHistoryModal(true)}
            className="flex items-center gap-xs bg-purple-100 hover:bg-purple-200 text-[#5C3C7B] px-md py-1.5 rounded-full font-label-md text-xs transition-all shadow-xs font-bold cursor-pointer border border-purple-200"
            title="Ver historial de anotaciones del paciente"
          >
            <span className="material-symbols-outlined text-[16px]">history_edu</span>
            Historial
          </button>

          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-xs bg-[#9A7DB8] hover:bg-[#8362A5] text-white px-md py-1.5 rounded-full font-label-md text-xs transition-all shadow-sm font-bold cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            Nuevo turno
          </button>
        </div>
      </div>

      {/* Main Weekly Calendar Grid */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-300 flex-1 overflow-hidden flex flex-col">
        {/* Days Header Row */}
        <div className="grid grid-cols-7 border-b-2 border-purple-200/90 text-center bg-[#F9F6FC] font-label-md text-xs py-2 font-semibold">
          <div className="text-slate-700 font-semibold border-r border-purple-200 flex items-center justify-center">Hora</div>
          {weekDays.map((dayObj) => {
            const isToday = dayObj.dateStr === todayISO;
            return (
              <div 
                key={dayObj.dateStr} 
                className={`font-semibold border-r border-purple-200 flex items-center justify-center gap-1.5 ${
                  isToday ? 'text-[#5C3C7B] font-bold bg-purple-100/60 py-0.5 rounded-md' : 'text-slate-800'
                }`}
              >
                <span>{dayObj.fullLabel}</span>
                {isToday && <span className="w-2 h-2 rounded-full bg-[#8362A5] inline-block" title="Hoy"></span>}
              </div>
            );
          })}
        </div>

        {/* Calendar Time Slots Grid */}
        <div className="flex-1 overflow-y-auto">
          {timeSlots.map((slot) => (
            <div key={slot} className="grid grid-cols-7 border-b border-dashed border-purple-300/60 min-h-[72px]">
              {/* Time Label Column */}
              <div className="p-xs text-center font-mono text-xs font-semibold text-slate-700 border-r border-purple-200 bg-[#FAF8FC]/50 flex items-center justify-center">
                {slot}
              </div>

              {/* Days Columns */}
              {weekDays.map((dayObj) => {
                if (activeMode === 'medica') {
                  const dayApps = medicalAppointments.filter(app => app.date === dayObj.dateStr);
                  
                  // Check if any app occupies this slot
                  const matchingOccupations = dayApps.map(app => ({
                    app,
                    ...isSlotOccupiedByAppointment(slot, app.time, app.endTime, 60)
                  })).filter(res => res.isOccupied);

                  return (
                    <div key={dayObj.dateStr} className="p-xs border-r border-purple-200 hover:bg-purple-50/40 transition-colors relative flex flex-col gap-1">
                      {matchingOccupations.map(({ app, isStart }) => {
                        const timeRangeText = formatTimeRange(app.time, app.endTime, 60);

                        if (isStart) {
                          return (
                            <div 
                              key={app.id} 
                              onClick={() => handleOpenDetailModal(app, 'medica')}
                              className="bg-[#F0FDF4] border border-emerald-300 rounded-xl p-2 flex flex-col gap-0.5 shadow-sm text-xs cursor-pointer hover:border-emerald-500 hover:shadow-md transition-all"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-emerald-950 truncate">{app.patientName}</span>
                                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-900 rounded-md font-mono flex items-center gap-0.5">
                                  <span className="material-symbols-outlined text-[10px]">schedule</span>
                                  {timeRangeText}
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-700 truncate font-medium">{app.species} ({app.breed})</span>
                              <span className="text-[10px] text-emerald-800 font-semibold truncate">Dr. {app.vetName}</span>
                              {app.status === 'completed' ? (
                                <div className="mt-1 bg-emerald-700 text-white px-2 py-1 rounded-lg text-[10px] font-semibold flex items-center justify-center shadow-xs">
                                  Completado
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onNavigateToBilling?.(app.patientId, 'Consulta Médica', 15000);
                                  }}
                                  className="mt-1 bg-emerald-600 text-white hover:bg-emerald-700 px-2 py-1 rounded-lg text-[10px] font-semibold flex items-center justify-center shadow-xs transition-all cursor-pointer"
                                >
                                  Cobrar turno
                                </button>
                              )}
                            </div>
                          );
                        } else {
                          // Continuation slot
                          return (
                            <div 
                              key={app.id} 
                              onClick={() => handleOpenDetailModal(app, 'medica')}
                              className="bg-[#F0FDF4]/70 border border-dashed border-emerald-300 rounded-xl p-1.5 flex items-center justify-between text-xs cursor-pointer hover:border-emerald-400"
                            >
                              <div className="flex items-center gap-1 text-emerald-950 font-medium truncate text-[11px]">
                                <span className="material-symbols-outlined text-[12px]">schedule</span>
                                <span className="font-semibold truncate">↳ {app.patientName}</span>
                              </div>
                              <span className="text-[9px] font-mono text-emerald-800 bg-emerald-100/70 px-1 py-0.5 rounded">
                                hasta {app.endTime || 'fin'}
                              </span>
                            </div>
                          );
                        }
                      })}
                    </div>
                  );
                } else {
                  const dayGrooms = groomingAppointments.filter(g => g.date === dayObj.dateStr);

                  const matchingOccupations = dayGrooms.map(g => ({
                    g,
                    ...isSlotOccupiedByAppointment(slot, g.time, g.endTime, g.durationMinutes)
                  })).filter(res => res.isOccupied);

                  return (
                    <div key={dayObj.dateStr} className="p-xs border-r border-purple-200 hover:bg-purple-50/40 transition-colors relative flex flex-col gap-1">
                      {matchingOccupations.map(({ g, isStart }) => {
                        const timeRangeText = formatTimeRange(g.time, g.endTime, g.durationMinutes);

                        if (isStart) {
                          return (
                            <div 
                              key={g.id} 
                              onClick={() => handleOpenDetailModal(g, 'peluqueria')}
                              className="bg-[#F0FDF4] border border-emerald-300 rounded-xl p-2 flex flex-col gap-0.5 shadow-sm text-xs cursor-pointer hover:border-emerald-500 hover:shadow-md transition-all"
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-semibold text-emerald-950 truncate">{g.patientName}</span>
                                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-900 rounded-md font-mono flex items-center gap-0.5">
                                  <span className="material-symbols-outlined text-[10px]">schedule</span>
                                  {timeRangeText}
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-700 truncate font-semibold">{g.serviceName}</span>
                              <span className="text-[10px] text-emerald-800 truncate font-medium">Propietario: {g.ownerName}</span>
                              {g.status === 'completed' ? (
                                <div className="mt-1 bg-emerald-700 text-white px-2 py-1 rounded-lg text-[10px] font-semibold flex items-center justify-center shadow-xs">
                                  Completado
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onNavigateToBilling?.(g.patientId, g.serviceName, g.price || 12000);
                                  }}
                                  className="mt-1 bg-emerald-600 text-white hover:bg-emerald-700 px-2 py-1 rounded-lg text-[10px] font-semibold flex items-center justify-center shadow-xs transition-all cursor-pointer"
                                >
                                  Cobrar turno
                                </button>
                              )}
                            </div>
                          );
                        } else {
                          // Continuation slot
                          return (
                            <div 
                              key={g.id} 
                              onClick={() => handleOpenDetailModal(g, 'peluqueria')}
                              className="bg-[#F0FDF4]/70 border border-dashed border-emerald-300 rounded-xl p-1.5 flex items-center justify-between text-xs cursor-pointer hover:border-emerald-400"
                            >
                              <div className="flex items-center gap-1 text-emerald-950 font-medium truncate text-[11px]">
                                <span className="material-symbols-outlined text-[12px]">schedule</span>
                                <span className="font-semibold truncate">↳ {g.patientName}</span>
                              </div>
                              <span className="text-[9px] font-mono text-emerald-800 bg-emerald-100/70 px-1 py-0.5 rounded">
                                hasta {g.endTime || 'fin'}
                              </span>
                            </div>
                          );
                        }
                      })}
                    </div>
                  );
                }
              })}
            </div>
          ))}
        </div>
      </div>

      {/* New Appointment Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-md animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-lg shadow-2xl flex flex-col gap-md border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-200 pb-sm">
              <h3 className="font-headline-sm text-slate-900 text-base font-semibold">
                Agendar turno ({activeMode === 'medica' ? 'Consulta médica' : 'Peluquería'})
              </h3>
              <button onClick={() => setShowNewModal(false)} className="text-slate-400 hover:text-slate-700 transition-colors p-1 cursor-pointer">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleAddAppointment} className="flex flex-col gap-md text-xs">
              <div>
                <label className="font-semibold text-xs text-slate-700 block mb-1">Paciente *</label>
                <SearchablePatientSelect
                  patients={patients}
                  selectedPatientId={selectedPatientId}
                  onSelectPatient={setSelectedPatientId}
                  variant="agenda"
                />
              </div>

              {activeMode === 'medica' ? (
                <>
                  <div>
                    <label className="font-semibold text-xs text-slate-700 block mb-1">Motivo de consulta *</label>
                    <input
                      type="text"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder=""
                      required
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-none text-slate-900 font-medium text-xs focus:border-[#9A7DB8] focus:ring-2 focus:ring-[#9A7DB8]/20 placeholder:text-slate-400 shadow-xs"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-xs text-slate-700 block mb-1">Veterinario asignado *</label>
                    <input
                      type="text"
                      value={vetName}
                      onChange={(e) => setVetName(e.target.value)}
                      required
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-none text-slate-900 font-medium text-xs focus:border-[#9A7DB8] focus:ring-2 focus:ring-[#9A7DB8]/20 shadow-xs"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="font-semibold text-xs text-slate-700 block mb-1">Servicio de estética *</label>
                    <select
                      value={selectedGroomServiceId}
                      onChange={(e) => setSelectedGroomServiceId(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-none text-slate-900 font-medium text-xs focus:border-[#9A7DB8] focus:ring-2 focus:ring-[#9A7DB8]/20 shadow-xs cursor-pointer"
                    >
                      {groomingServices.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.durationMinutes} min - ${s.price})
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="font-semibold text-xs text-slate-700 block mb-1">Fecha *</label>
                <input
                  type="date"
                  value={appDate}
                  onChange={(e) => setAppDate(e.target.value)}
                  required
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-none text-slate-900 font-medium text-xs focus:border-[#9A7DB8] focus:ring-2 focus:ring-[#9A7DB8]/20 shadow-xs cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-md">
                <div>
                  <label className="font-semibold text-xs text-slate-700 block mb-1">Hora inicio *</label>
                  <select
                    value={appTime}
                    onChange={(e) => setAppTime(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-none text-slate-900 font-medium text-xs focus:border-[#9A7DB8] focus:ring-2 focus:ring-[#9A7DB8]/20 shadow-xs cursor-pointer"
                  >
                    {extendedTimeSlots.map(slot => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-xs text-slate-700 block mb-1">Hora fin *</label>
                  <select
                    value={appEndTime}
                    onChange={(e) => setAppEndTime(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-none text-slate-900 font-medium text-xs focus:border-[#9A7DB8] focus:ring-2 focus:ring-[#9A7DB8]/20 shadow-xs cursor-pointer"
                  >
                    {extendedTimeSlots.map(slot => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-sm pt-sm mt-xs border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#9A7DB8] hover:bg-[#8362A5] text-white px-4 py-2.5 rounded-xl font-label-md text-xs font-semibold shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[18px]">calendar_add_on</span>
                  <span>Confirmar turno</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Appointment Action / Detail Modal */}
      {detailModal?.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-md animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-lg shadow-2xl flex flex-col gap-md border border-slate-200">
            {/* Header with info */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-md">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-display-lg text-lg text-slate-900 font-bold">
                    Turno: {detailModal.appointment.patientName}
                  </h3>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    detailModal.appointment.status === 'cancelled'
                      ? 'bg-rose-100 text-rose-700'
                      : detailModal.appointment.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-purple-100 text-[#5C3C7B]'
                  }`}>
                    {detailModal.appointment.status === 'cancelled'
                      ? 'Cancelado'
                      : detailModal.appointment.status === 'completed'
                      ? 'Completado'
                      : 'Confirmado'}
                  </span>
                </div>
                <p className="font-body-md text-xs text-slate-600">
                  <span className="font-semibold text-slate-800">Tutor:</span> {detailModal.appointment.ownerName} &bull;{' '}
                  <span className="font-semibold text-slate-800">Especie/Raza:</span> {detailModal.appointment.species} ({detailModal.appointment.breed})
                </p>
                <p className="font-body-md text-xs text-purple-900 font-medium mt-0.5 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">event</span>
                  {detailModal.appointment.date} de {detailModal.appointment.time} a {detailModal.appointment.endTime}
                </p>
              </div>
              <button 
                onClick={() => setDetailModal(null)} 
                className="text-slate-400 hover:text-slate-700 transition-colors p-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Action Tabs Header */}
            <div className="flex bg-slate-100 p-1 rounded-xl gap-1 border border-slate-200">
              <button
                type="button"
                onClick={() => setModalTab('anotaciones')}
                className={`flex-1 py-2 px-3 rounded-lg font-label-md text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  modalTab === 'anotaciones'
                    ? 'bg-white text-[#5C3C7B] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">edit_note</span>
                Registrar anotaciones
              </button>

              <button
                type="button"
                onClick={() => setModalTab('cambiar-turno')}
                className={`flex-1 py-2 px-3 rounded-lg font-label-md text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  modalTab === 'cambiar-turno'
                    ? 'bg-white text-[#5C3C7B] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">edit_calendar</span>
                Cambiar turno
              </button>

              <button
                type="button"
                onClick={() => setModalTab('cancelar')}
                className={`flex-1 py-2 px-3 rounded-lg font-label-md text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  modalTab === 'cancelar'
                    ? 'bg-white text-rose-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">cancel</span>
                Cancelar turno
              </button>
            </div>

            {/* Tab 1 Content: Registrar anotaciones */}
            {modalTab === 'anotaciones' && (
              <form onSubmit={handleSaveNotes} className="flex flex-col gap-md text-xs">
                <div>
                  <label className="font-semibold text-xs text-slate-700 block mb-1">
                    Anotaciones u observaciones del turno
                  </label>
                  <textarea
                    rows={4}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Escriba aquí las notas, indicaciones o registro médico del turno..."
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 outline-none text-slate-900 font-medium text-xs focus:border-[#9A7DB8] focus:ring-2 focus:ring-[#9A7DB8]/20 placeholder:text-slate-400 shadow-xs resize-none"
                  />
                </div>
                <div className="flex items-center justify-end gap-sm border-t border-slate-200 pt-sm">
                  <button
                    type="button"
                    onClick={() => setDetailModal(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                  >
                    Cerrar
                  </button>
                  <button
                    type="submit"
                    className="bg-[#9A7DB8] hover:bg-[#8362A5] text-white px-4 py-2 rounded-xl font-label-md text-xs font-semibold shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">save</span>
                    Guardar anotaciones
                  </button>
                </div>
              </form>
            )}

            {/* Tab 2 Content: Cambiar turno */}
            {modalTab === 'cambiar-turno' && (
              <form onSubmit={handleSaveReschedule} className="flex flex-col gap-md text-xs">
                <div>
                  <label className="font-semibold text-xs text-slate-700 block mb-1">Nueva Fecha *</label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-none text-slate-900 font-medium text-xs focus:border-[#9A7DB8] focus:ring-2 focus:ring-[#9A7DB8]/20 shadow-xs cursor-pointer"
                  />
                </div>
                <div>
                  <label className="font-semibold text-xs text-slate-700 block mb-1">Nueva Hora de Inicio *</label>
                  <select
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-none text-slate-900 font-medium text-xs focus:border-[#9A7DB8] focus:ring-2 focus:ring-[#9A7DB8]/20 shadow-xs cursor-pointer"
                  >
                    {extendedTimeSlots.map(slot => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center justify-end gap-sm border-t border-slate-200 pt-sm">
                  <button
                    type="button"
                    onClick={() => setDetailModal(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-[#9A7DB8] hover:bg-[#8362A5] text-white px-4 py-2 rounded-xl font-label-md text-xs font-semibold shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit_calendar</span>
                    Guardar nuevo horario
                  </button>
                </div>
              </form>
            )}

            {/* Tab 3 Content: Cancelar turno */}
            {modalTab === 'cancelar' && (
              <div className="flex flex-col gap-md text-xs">
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-md flex items-start gap-3">
                  <span className="material-symbols-outlined text-rose-600 text-[24px]">warning</span>
                  <div>
                    <h4 className="font-bold text-rose-900 text-xs mb-1">¿Desea cancelar este turno?</h4>
                    <p className="text-rose-700 text-[11px] leading-relaxed">
                      Esta acción marcará el turno de {detailModal.appointment.patientName} como cancelado en la agenda.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-sm border-t border-slate-200 pt-sm">
                  <button
                    type="button"
                    onClick={() => setDetailModal(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                  >
                    Volver
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmCancel}
                    className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl font-label-md text-xs font-semibold shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">cancel</span>
                    Confirmar cancelación de turno
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* History Modal Overlay */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-md animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] p-lg shadow-2xl flex flex-col gap-md border border-slate-200">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-md">
              <div>
                <h3 className="font-display-lg text-lg text-slate-900 font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#5C3C7B] text-[22px]">auto_stories</span>
                  Historial de Anotaciones — {activeMode === 'medica' ? 'Clínica Médica' : 'Peluquería'}
                </h3>
                <p className="font-body-md text-xs text-slate-600 mt-0.5">
                  Registro cronológico de observaciones de pacientes con sus respectivas fechas.
                </p>
              </div>
              <button 
                onClick={() => {
                  setShowHistoryModal(false);
                  setHistorySearchQuery('');
                }} 
                className="text-slate-400 hover:text-slate-700 transition-colors p-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Search filter bar */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[18px]">search</span>
              <input
                type="text"
                value={historySearchQuery}
                onChange={(e) => setHistorySearchQuery(e.target.value)}
                placeholder="Buscar por paciente, tutor o contenido de la anotación..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-[#9A7DB8] focus:ring-2 focus:ring-[#9A7DB8]/20 transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Notes List Container */}
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-sm max-h-[50vh]">
              {notesHistoryList.length === 0 ? (
                <div className="py-xl text-center flex flex-col items-center justify-center text-slate-500 gap-2">
                  <span className="material-symbols-outlined text-4xl text-slate-300">event_note</span>
                  <p className="text-xs font-medium">No se encontraron anotaciones registradas para este módulo.</p>
                </div>
              ) : (
                notesHistoryList.map((item) => {
                  const isMedical = 'vetName' in item;
                  return (
                    <div 
                      key={item.id} 
                      className="bg-purple-50/40 border border-purple-100 rounded-xl p-md flex flex-col gap-xs transition-all hover:border-purple-200 hover:bg-purple-50/70"
                    >
                      <div className="flex items-center justify-between border-b border-purple-100/60 pb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs">{item.patientName}</span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            ({item.species} {item.breed ? `- ${item.breed}` : ''})
                          </span>
                          <span className="text-[10px] text-purple-800 bg-purple-100 px-2 py-0.5 rounded-full font-semibold">
                            Tutor: {item.ownerName}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-600 font-semibold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px] text-purple-700">calendar_today</span>
                          {item.date} {item.time ? `(${item.time} hs)` : ''}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-600 font-medium">
                        {isMedical ? (
                          <span><strong className="text-slate-800">Veterinario:</strong> Dr. {(item as MedicalAppointment).vetName} &bull; Motivo: {(item as MedicalAppointment).reason}</span>
                        ) : (
                          <span><strong className="text-slate-800">Servicio:</strong> {(item as GroomingAppointment).serviceName}</span>
                        )}
                      </div>

                      <div className="mt-1 bg-white border border-purple-200/80 rounded-lg p-2.5 text-xs text-slate-800 shadow-2xs leading-relaxed flex items-start gap-2">
                        <span className="material-symbols-outlined text-purple-400 text-[18px] shrink-0 mt-0.5">format_quote</span>
                        <p className="whitespace-pre-wrap">{item.notes}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-slate-200 pt-sm">
              <span className="text-[11px] text-slate-500 font-medium">
                Total de anotaciones: <strong>{notesHistoryList.length}</strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowHistoryModal(false);
                  setHistorySearchQuery('');
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

