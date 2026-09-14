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
  formatDateToISO
} from '../../domain/services/agendaService';

interface AgendaViewProps {
  patients: Patient[];
  medicalAppointments: MedicalAppointment[];
  onAddMedicalAppointment: (appointment: Omit<MedicalAppointment, 'id'>) => void;
  groomingAppointments: GroomingAppointment[];
  groomingServices: GroomingService[];
  onAddGroomingAppointment: (appointment: Omit<GroomingAppointment, 'id'>) => void;
  onNavigateToBilling?: (patientId: string, serviceName: string, amount: number) => void;
  fixedMode?: 'medica' | 'peluqueria';
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
  groomingAppointments,
  groomingServices,
  onAddGroomingAppointment,
  onNavigateToBilling,
  fixedMode
}) => {
  const [agendaMode, setAgendaMode] = useState<'medica' | 'peluqueria'>(fixedMode || 'medica');
  const [showNewModal, setShowNewModal] = useState(false);
  const [refDate, setRefDate] = useState<Date>(() => new Date());

  const activeMode = fixedMode || agendaMode;
  const todayISO = useMemo(() => formatDateToISO(new Date()), []);
  const weekDays = useMemo(() => getWeekDays(refDate), [refDate]);
  const weekHeaderLabel = useMemo(() => formatWeekRangeHeader(refDate), [refDate]);

  // New Medical / Grooming Appointment form state
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id || '');
  const [vetName, setVetName] = useState('Dr. J. Silva');
  const [appDate, setAppDate] = useState(() => formatDateToISO(new Date()));
  const [appTime, setAppTime] = useState('10:00');
  const [appEndTime, setAppEndTime] = useState('11:00');
  const [reason, setReason] = useState('Consulta General');

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
                            <div key={app.id} className="bg-[#FAF5FF] border border-[#9A7DB8]/60 rounded-xl p-2 flex flex-col gap-0.5 shadow-sm text-xs">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-[#5C3C7B] truncate">{app.patientName}</span>
                                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-purple-100 text-[#5C3C7B] rounded-md font-mono flex items-center gap-0.5">
                                  <span className="material-symbols-outlined text-[10px]">schedule</span>
                                  {timeRangeText}
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-600 truncate font-medium">{app.species} ({app.breed})</span>
                              <span className="text-[10px] text-[#5C3C7B] font-semibold truncate">Dr. {app.vetName}</span>
                              {app.status === 'completed' ? (
                                <div className="mt-1 bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-1 rounded-lg text-[10px] font-bold flex items-center justify-center gap-0.5 shadow-2xs">
                                  <span className="material-symbols-outlined text-[12px] text-emerald-700">check_circle</span>
                                  <span>✓ Cobrado</span>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => onNavigateToBilling?.(app.patientId, 'Consulta Médica', 15000)}
                                  className="mt-1 bg-[#9A7DB8] text-white hover:bg-[#8362A5] px-2 py-1 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-0.5 shadow-xs transition-all cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-[12px]">point_of_sale</span>
                                  Cobrar turno
                                </button>
                              )}
                            </div>
                          );
                        } else {
                          // Continuation slot
                          return (
                            <div key={app.id} className="bg-[#FAF5FF]/70 border border-dashed border-[#9A7DB8]/40 rounded-xl p-1.5 flex items-center justify-between text-xs">
                              <div className="flex items-center gap-1 text-[#5C3C7B] font-medium truncate text-[11px]">
                                <span className="material-symbols-outlined text-[12px]">schedule</span>
                                <span className="font-semibold truncate">↳ {app.patientName}</span>
                              </div>
                              <span className="text-[9px] font-mono text-purple-700 bg-purple-100/60 px-1 py-0.5 rounded">
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
                            <div key={g.id} className="bg-[#FFF8E7] border border-amber-300 rounded-xl p-2 flex flex-col gap-0.5 shadow-sm text-xs">
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-semibold text-amber-900 truncate">{g.patientName}</span>
                                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-900 rounded-md font-mono flex items-center gap-0.5">
                                  <span className="material-symbols-outlined text-[10px]">schedule</span>
                                  {timeRangeText}
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-700 truncate font-semibold">{g.serviceName}</span>
                              <span className="text-[10px] text-slate-600 truncate font-medium">Propietario: {g.ownerName}</span>
                              {g.status === 'completed' ? (
                                <div className="mt-1 bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-1 rounded-lg text-[10px] font-bold flex items-center justify-center gap-0.5 shadow-2xs">
                                  <span className="material-symbols-outlined text-[12px] text-emerald-700">check_circle</span>
                                  <span>✓ Cobrado</span>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => onNavigateToBilling?.(g.patientId, g.serviceName, g.price || 12000)}
                                  className="mt-1 bg-amber-600 text-white hover:bg-amber-700 px-2 py-1 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-0.5 shadow-xs transition-all cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-[12px]">point_of_sale</span>
                                  Cobrar turno
                                </button>
                              )}
                            </div>
                          );
                        } else {
                          // Continuation slot
                          return (
                            <div key={g.id} className="bg-[#FFF8E7]/70 border border-dashed border-amber-300 rounded-xl p-1.5 flex items-center justify-between text-xs">
                              <div className="flex items-center gap-1 text-amber-900 font-medium truncate text-[11px]">
                                <span className="material-symbols-outlined text-[12px]">schedule</span>
                                <span className="font-semibold truncate">↳ {g.patientName}</span>
                              </div>
                              <span className="text-[9px] font-mono text-amber-800 bg-amber-100/60 px-1 py-0.5 rounded">
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
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-none text-slate-900 font-medium text-xs focus:border-[#9A7DB8] focus:ring-2 focus:ring-[#9A7DB8]/20 shadow-xs cursor-pointer"
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.species} - Dueño: {p.ownerName})
                    </option>
                  ))}
                </select>
              </div>

              {activeMode === 'medica' ? (
                <>
                  <div>
                    <label className="font-semibold text-xs text-slate-700 block mb-1">Motivo de consulta *</label>
                    <input
                      type="text"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Ej. Vacunación, Chequeo..."
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
    </div>
  );
};
