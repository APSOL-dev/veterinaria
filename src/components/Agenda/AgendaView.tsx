import React, { useState } from 'react';
import { 
  MedicalAppointment, 
  GroomingAppointment, 
  GroomingService, 
  Patient 
} from '../../domain/types';

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

  const activeMode = fixedMode || agendaMode;

  // New Medical Appointment state
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id || '');
  const [vetName, setVetName] = useState('Dr. J. Silva');
  const [appDate, setAppDate] = useState('2026-08-26');
  const [appTime, setAppTime] = useState('10:00');
  const [reason, setReason] = useState('Consulta General');

  // New Grooming Appointment state
  const [selectedGroomServiceId, setSelectedGroomServiceId] = useState(groomingServices[0]?.id || '');

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
        durationMinutes: srv.durationMinutes,
        price: srv.price,
        status: 'confirmed'
      });
    }

    setShowNewModal(false);
  };

  const daysOfWeek = ['Lun 24', 'Mar 25', 'Mié 26', 'Jue 27', 'Vie 28', 'Sáb 29'];
  const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

  return (
    <div className="flex flex-col w-full h-full gap-md font-body-md text-slate-800">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-md bg-white p-sm px-md rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-sm">
          <div className="flex items-center gap-xs bg-purple-50/80 p-1 rounded-xl border border-purple-100">
            <button className="p-xs text-slate-600 hover:bg-purple-100 rounded-lg transition-colors flex items-center justify-center cursor-pointer">
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <button className="px-sm py-0.5 text-slate-800 hover:bg-purple-100 rounded-lg transition-colors font-label-md text-xs font-bold cursor-pointer">Hoy</button>
            <button className="p-xs text-slate-600 hover:bg-purple-100 rounded-lg transition-colors flex items-center justify-center cursor-pointer">
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>

          <span className="font-headline-sm text-sm text-slate-900 font-bold ml-xs">Semana del 24 al 29 de Agosto</span>
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
            Nuevo Turno
          </button>
        </div>
      </div>

      {/* Main Weekly Calendar Grid */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-300 flex-1 overflow-hidden flex flex-col">
        {/* Days Header Row */}
        <div className="grid grid-cols-7 border-b-2 border-purple-200/90 text-center bg-[#F9F6FC] font-label-md text-xs uppercase py-2">
          <div className="text-slate-700 font-bold border-r border-purple-200 flex items-center justify-center">Hora</div>
          {daysOfWeek.map((day, idx) => (
            <div key={idx} className={`font-bold border-r border-purple-200 flex items-center justify-center ${idx === 2 ? 'text-[#5C3C7B]' : 'text-slate-800'}`}>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Time Slots Grid */}
        <div className="flex-1 overflow-y-auto">
          {timeSlots.map((slot) => (
            <div key={slot} className="grid grid-cols-7 border-b border-dashed border-purple-300/60 min-h-[72px]">
              {/* Time Label Column */}
              <div className="p-xs text-center font-mono text-xs font-bold text-slate-700 border-r border-purple-200 bg-[#FAF8FC]/50 flex items-center justify-center">
                {slot}
              </div>

              {/* Days Columns */}
              {daysOfWeek.map((_, dayIdx) => {
                const isWednesday = dayIdx === 2; // Demo data for Wed 26th

                if (activeMode === 'medica') {
                  const matchingApp = isWednesday ? medicalAppointments.find(a => a.time === slot) : undefined;

                  return (
                    <div key={dayIdx} className="p-xs border-r border-purple-200 hover:bg-purple-50/40 transition-colors relative">
                      {matchingApp && (
                        <div className="bg-[#FAF5FF] border border-[#9A7DB8]/60 rounded-xl p-2 flex flex-col gap-0.5 shadow-sm text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#5C3C7B] truncate">{matchingApp.patientName}</span>
                            <span className="font-mono text-[10px] bg-[#9A7DB8] text-white px-1.5 py-0.2 rounded font-bold">{matchingApp.time}</span>
                          </div>
                          <span className="text-[11px] text-slate-600 truncate font-medium">{matchingApp.species} ({matchingApp.breed})</span>
                          <span className="text-[10px] text-[#5C3C7B] font-semibold truncate">Dr. {matchingApp.vetName}</span>
                          <button
                            type="button"
                            onClick={() => onNavigateToBilling?.(matchingApp.patientId, 'Consulta Médica', 15000)}
                            className="mt-1 bg-[#9A7DB8] text-white hover:bg-[#8362A5] px-2 py-1 rounded-lg text-[10px] font-bold flex items-center justify-center gap-0.5 shadow-xs transition-all cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[12px]">point_of_sale</span>
                            Cobrar Turno
                          </button>
                        </div>
                      )}
                    </div>
                  );
                } else {
                  const matchingGroom = isWednesday ? groomingAppointments.find(g => g.time === slot) : undefined;

                  return (
                    <div key={dayIdx} className="p-xs border-r border-purple-200 hover:bg-purple-50/40 transition-colors relative">
                      {matchingGroom && (
                        <div className="bg-[#F4EBFC] border border-[#D2B3EA] rounded-xl p-2 flex flex-col gap-0.5 shadow-sm text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#5C3C7B] truncate">{matchingGroom.patientName}</span>
                            <span className="font-mono text-[10px] bg-[#8362A5] text-white px-1.5 py-0.2 rounded font-bold">{matchingGroom.time}</span>
                          </div>
                          <span className="text-[11px] text-slate-700 truncate font-semibold">{matchingGroom.serviceName}</span>
                          <span className="text-[10px] text-slate-600 truncate font-medium">Propietario: {matchingGroom.ownerName}</span>
                          <button
                            type="button"
                            onClick={() => onNavigateToBilling?.(matchingGroom.patientId, matchingGroom.serviceName, matchingGroom.price || 12000)}
                            className="mt-1 bg-[#8362A5] text-white hover:bg-[#6C4B8E] px-2 py-1 rounded-lg text-[10px] font-bold flex items-center justify-center gap-0.5 shadow-xs transition-all cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[12px]">point_of_sale</span>
                            Cobrar Turno
                          </button>
                        </div>
                      )}
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
              <h3 className="font-headline-sm text-slate-900 text-base font-bold">
                Agendar Turno ({activeMode === 'medica' ? 'Consulta Médica' : 'Peluquería'})
              </h3>
              <button onClick={() => setShowNewModal(false)} className="text-slate-400 hover:text-slate-700 transition-colors p-1 cursor-pointer">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleAddAppointment} className="flex flex-col gap-md text-xs">
              <div>
                <label className="font-label-md text-slate-700 uppercase text-[10px] font-bold block mb-1">Paciente *</label>
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
                    <label className="font-label-md text-slate-700 uppercase text-[10px] font-bold block mb-1">Motivo de Consulta *</label>
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
                    <label className="font-label-md text-slate-700 uppercase text-[10px] font-bold block mb-1">Veterinario Asignado *</label>
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
                    <label className="font-label-md text-slate-700 uppercase text-[10px] font-bold block mb-1">Servicio de Estética *</label>
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

              <div className="grid grid-cols-2 gap-md">
                <div>
                  <label className="font-label-md text-slate-700 uppercase text-[10px] font-bold block mb-1">Fecha *</label>
                  <input
                    type="date"
                    value={appDate}
                    onChange={(e) => setAppDate(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-none text-slate-900 font-medium text-xs focus:border-[#9A7DB8] focus:ring-2 focus:ring-[#9A7DB8]/20 shadow-xs cursor-pointer"
                  />
                </div>
                <div>
                  <label className="font-label-md text-slate-700 uppercase text-[10px] font-bold block mb-1">Hora *</label>
                  <select
                    value={appTime}
                    onChange={(e) => setAppTime(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-none text-slate-900 font-medium text-xs focus:border-[#9A7DB8] focus:ring-2 focus:ring-[#9A7DB8]/20 shadow-xs cursor-pointer"
                  >
                    {timeSlots.map(slot => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-sm pt-sm mt-xs border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-md py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#9A7DB8] hover:bg-[#8362A5] text-white px-lg py-2.5 rounded-xl font-label-md text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-xs"
                >
                  <span className="material-symbols-outlined text-[18px]">calendar_add_on</span>
                  Confirmar Turno
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
