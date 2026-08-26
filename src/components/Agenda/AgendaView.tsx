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
  fixedMode?: 'medica' | 'peluqueria';
}

export const AgendaView: React.FC<AgendaViewProps> = ({
  patients,
  medicalAppointments,
  onAddMedicalAppointment,
  groomingAppointments,
  groomingServices,
  onAddGroomingAppointment,
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
    <div className="flex flex-col w-full h-full gap-md font-body-md text-on-surface">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-md bg-surface-container-lowest p-sm px-md rounded-2xl shadow-sm border border-outline-variant/30">
        <div className="flex items-center gap-sm">
          <div className="flex items-center gap-xs bg-surface-container p-1 rounded-xl">
            <button className="p-xs text-on-surface-variant hover:bg-surface-container-high rounded-md transition-colors flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <button className="px-sm py-0.5 text-on-surface hover:bg-surface-container-high rounded-md transition-colors font-label-md text-xs">Hoy</button>
            <button className="p-xs text-on-surface-variant hover:bg-surface-container-high rounded-md transition-colors flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>

          <span className="font-headline-sm text-sm text-on-surface font-semibold ml-xs">Semana del 24 al 29 de Agosto</span>
        </div>

        <div className="flex items-center gap-md">
          {/* Mode Title or Switcher */}
          {!fixedMode ? (
            <div className="flex bg-surface-container p-1 rounded-full">
              <button
                onClick={() => setAgendaMode('medica')}
                className={`px-md py-1.5 rounded-full font-label-md text-xs transition-all flex items-center gap-1 ${
                  agendaMode === 'medica'
                    ? 'bg-primary text-on-primary shadow-sm font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">stethoscope</span>
                Área Médica
              </button>
              <button
                onClick={() => setAgendaMode('peluqueria')}
                className={`px-md py-1.5 rounded-full font-label-md text-xs transition-all flex items-center gap-1 ${
                  agendaMode === 'peluqueria'
                    ? 'bg-secondary text-on-secondary shadow-sm font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">content_cut</span>
                Peluquería
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1 px-3 py-1 bg-surface-container rounded-full text-xs font-bold text-primary">
              <span className="material-symbols-outlined text-[16px]">
                {fixedMode === 'medica' ? 'stethoscope' : 'content_cut'}
              </span>
              <span>{fixedMode === 'medica' ? 'Calendario Área Médica' : 'Calendario Peluquería'}</span>
            </div>
          )}

          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-xs bg-primary text-on-primary px-md py-1.5 rounded-full font-label-md text-xs hover:bg-primary-container transition-colors shadow-sm font-bold"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            Nuevo Turno
          </button>
        </div>
      </div>

      {/* Main Weekly Calendar Grid */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 flex-1 overflow-hidden flex flex-col">
        {/* Days Header Row */}
        <div className="grid grid-cols-7 border-b border-surface-container text-center bg-surface-container-low font-label-md text-xs uppercase py-sm">
          <div className="text-on-surface-variant font-bold">Hora</div>
          {daysOfWeek.map((day, idx) => (
            <div key={idx} className={`font-bold ${idx === 2 ? 'text-primary' : 'text-on-surface'}`}>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Time Slots Grid */}
        <div className="flex-1 overflow-y-auto">
          {timeSlots.map((slot) => (
            <div key={slot} className="grid grid-cols-7 border-b border-surface-container-low min-h-[70px]">
              {/* Time Label */}
              <div className="p-xs text-center font-mono text-xs text-on-surface-variant border-r border-surface-container-low flex items-center justify-center">
                {slot}
              </div>

              {/* Days Columns */}
              {daysOfWeek.map((_, dayIdx) => {
                // Find matching appointment for this day & time slot
                const isWednesday = dayIdx === 2; // Demo data for Wed 26th

                if (activeMode === 'medica') {
                  const matchingApp = isWednesday ? medicalAppointments.find(a => a.time === slot) : undefined;

                  return (
                    <div key={dayIdx} className="p-xs border-r border-surface-container-low hover:bg-surface-container/40 transition-colors relative">
                      {matchingApp && (
                        <div className="bg-primary-container/30 border border-primary/40 rounded-xl p-xs flex flex-col gap-0.5 shadow-sm text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-primary truncate">{matchingApp.patientName}</span>
                            <span className="font-mono text-[10px] bg-primary text-on-primary px-1 rounded font-bold">{matchingApp.time}</span>
                          </div>
                          <span className="text-[11px] text-on-surface-variant truncate">{matchingApp.species} ({matchingApp.breed})</span>
                          <span className="text-[10px] text-primary font-medium truncate">Dr. {matchingApp.vetName}</span>
                        </div>
                      )}
                    </div>
                  );
                } else {
                  const matchingGroom = isWednesday ? groomingAppointments.find(g => g.time === slot) : undefined;

                  return (
                    <div key={dayIdx} className="p-xs border-r border-surface-container-low hover:bg-surface-container/40 transition-colors relative">
                      {matchingGroom && (
                        <div className="bg-secondary-container/40 border border-secondary/40 rounded-xl p-xs flex flex-col gap-0.5 shadow-sm text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-secondary truncate">{matchingGroom.patientName}</span>
                            <span className="font-mono text-[10px] bg-secondary text-on-secondary px-1 rounded font-bold">{matchingGroom.time}</span>
                          </div>
                          <span className="text-[11px] text-on-surface-variant truncate">{matchingGroom.serviceName}</span>
                          <span className="text-[10px] text-on-surface-variant truncate">Propietario: {matchingGroom.ownerName}</span>
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-md">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-lg shadow-xl flex flex-col gap-md">
            <div className="flex justify-between items-center border-b pb-sm">
              <h3 className="font-headline-sm text-primary text-base font-bold">
                Agendar Turno ({activeMode === 'medica' ? 'Consulta Médica' : 'Peluquería'})
              </h3>
              <button onClick={() => setShowNewModal(false)} className="text-on-surface-variant hover:text-error">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddAppointment} className="flex flex-col gap-xs text-xs">
              <label className="font-label-md text-on-surface-variant uppercase text-[11px]">Paciente *</label>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="bg-surface-container border-none rounded-xl p-sm outline-none text-on-surface text-xs focus:ring-2 focus:ring-secondary"
              >
                {patients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.species} - Dueño: {p.ownerName})
                  </option>
                ))}
              </select>

              {activeMode === 'medica' ? (
                <>
                  <label className="font-label-md text-on-surface-variant uppercase text-[11px] mt-xs">Motivo de Consulta</label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Ej. Vacunación, Chequeo..."
                    required
                    className="bg-surface-container border-none rounded-xl p-sm outline-none text-on-surface text-xs focus:ring-2 focus:ring-secondary"
                  />

                  <label className="font-label-md text-on-surface-variant uppercase text-[11px] mt-xs">Veterinario Asignado</label>
                  <input
                    type="text"
                    value={vetName}
                    onChange={(e) => setVetName(e.target.value)}
                    required
                    className="bg-surface-container border-none rounded-xl p-sm outline-none text-on-surface text-xs focus:ring-2 focus:ring-secondary"
                  />
                </>
              ) : (
                <>
                  <label className="font-label-md text-on-surface-variant uppercase text-[11px] mt-xs">Servicio de Estética</label>
                  <select
                    value={selectedGroomServiceId}
                    onChange={(e) => setSelectedGroomServiceId(e.target.value)}
                    className="bg-surface-container border-none rounded-xl p-sm outline-none text-on-surface text-xs focus:ring-2 focus:ring-secondary"
                  >
                    {groomingServices.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.durationMinutes} min - ${s.price})
                      </option>
                    ))}
                  </select>
                </>
              )}

              <div className="grid grid-cols-2 gap-sm mt-xs">
                <div>
                  <label className="font-label-md text-on-surface-variant uppercase text-[11px] block mb-1">Fecha</label>
                  <input
                    type="date"
                    value={appDate}
                    onChange={(e) => setAppDate(e.target.value)}
                    required
                    className="w-full bg-surface-container border-none rounded-xl p-sm outline-none text-on-surface text-xs focus:ring-2 focus:ring-secondary"
                  />
                </div>
                <div>
                  <label className="font-label-md text-on-surface-variant uppercase text-[11px] block mb-1">Hora</label>
                  <select
                    value={appTime}
                    onChange={(e) => setAppTime(e.target.value)}
                    className="w-full bg-surface-container border-none rounded-xl p-sm outline-none text-on-surface text-xs focus:ring-2 focus:ring-secondary"
                  >
                    {timeSlots.map(slot => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button type="submit" className="bg-primary text-on-primary py-2 rounded-xl font-label-md text-xs mt-md hover:bg-primary-container font-bold shadow-sm">
                Confirmar Turno
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
