import React, { useState, useMemo } from 'react';
import { MedicalAppointment, Patient, VaccineCatalogItem, VaccineDosis } from '../../domain/types';
import { 
  formatVaccineReminderMessage, 
  getEffectiveVaccineNextDueDate, 
  getPendingOrDueVaccine, 
  calculatePatientVaccineCoverage,
  getPatientVaccineGlobalStatus,
  findActiveVaccineAppointment
} from '../../domain/services/vaccineService';
import { getRecentOrFilteredPatients } from '../../domain/services/patientService';
import { AppConfirmModal } from '../Common/AppConfirmModal';
import { SearchableVaccineSelect } from '../Common/SearchableVaccineSelect';
import { formatDate } from '../../utils/dateUtils';

const getLocalDateString = (): string => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
};

interface VaccinesViewProps {
  patients?: Patient[];
  selectedPatient: Patient;
  onSelectPatient?: (patient: Patient) => void;
  onNavigateToPatient?: (patient: Patient) => void;
  vaccineCatalog: VaccineCatalogItem[];
  onAddVaccineToCatalog: (name: string, frequencyDays: number) => void;
  onUpdateVaccineInCatalog?: (id: string, name: string, frequencyDays: number) => void;
  onDeleteVaccineFromCatalog?: (id: string) => void;
  vaccineDoses: VaccineDosis[];
  onRegisterDosis: (dosis: { patientId?: string; vaccineId: string; applicationDate: string; vetName: string; batch?: string }) => void;
  onScheduleAppointment: (patientId: string, vaccineName?: string) => void;
  onDeleteDosis?: (dosisId: string) => void;
  onRemoveDosisByVaccine?: (patientId: string, vaccineName: string) => void;
  currentVetName?: string;
  isGeneralCatalog?: boolean;
  onUpdatePatients?: (updatedPatients: Patient[]) => void;
  medicalAppointments?: MedicalAppointment[];
}

export const VaccinesView: React.FC<VaccinesViewProps> = ({
  patients,
  selectedPatient,
  onSelectPatient,
  onNavigateToPatient,
  vaccineCatalog,
  onAddVaccineToCatalog,
  onUpdateVaccineInCatalog,
  onDeleteVaccineFromCatalog,
  vaccineDoses = [],
  onRegisterDosis,
  onScheduleAppointment,
  onDeleteDosis,
  onRemoveDosisByVaccine,
  currentVetName = 'Veterinaria',
  isGeneralCatalog = false,
  onUpdatePatients,
  medicalAppointments = []
}) => {
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [editingItem, setEditingItem] = useState<VaccineCatalogItem | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');

  const handleToggleVaccineAppliedInVaccinesView = (vacId: string) => {
    if (!patients || !onUpdatePatients) return;
    const currentReqs = selectedPatient.requiredVaccines || [];
    let toggledVacName = '';
    let isNowApplied = false;

    const updatedReqs = currentReqs.map(v => {
      if (v.id === vacId) {
        toggledVacName = v.vaccineName;
        isNowApplied = v.status === 'pendiente';
        return {
          ...v,
          status: (isNowApplied ? 'aplicada' : 'pendiente') as 'pendiente' | 'aplicada',
          appliedDate: isNowApplied ? new Date().toISOString().split('T')[0] : undefined
        };
      }
      return v;
    });

    const updatedPatient: Patient = {
      ...selectedPatient,
      requiredVaccines: updatedReqs
    };

    const updatedList = patients.map(p => p.id === selectedPatient.id ? updatedPatient : p);
    onUpdatePatients(updatedList);
    if (onSelectPatient) onSelectPatient(updatedPatient);

    // Agregar o Remover del Historial de Vacunación
    if (isNowApplied && onRegisterDosis) {
      const matchedCat = vaccineCatalog.find(c => c.name.toLowerCase() === toggledVacName.toLowerCase());
      onRegisterDosis({
        patientId: selectedPatient.id,
        vaccineId: matchedCat ? matchedCat.id : toggledVacName,
        applicationDate: new Date().toISOString().split('T')[0],
        vetName: currentVetName || 'Veterinaria'
      });
    } else if (!isNowApplied && onRemoveDosisByVaccine) {
      onRemoveDosisByVaccine(selectedPatient.id, toggledVacName);
    }
  };
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; vaccineId: string; vaccineName: string }>({
    isOpen: false,
    vaccineId: '',
    vaccineName: ''
  });
  const [patientSearch, setPatientSearch] = useState('');

  // New / edit catalog item state
  const [newVacName, setNewVacName] = useState('');
  const [newVacDays, setNewVacDays] = useState(365);

  // Register dosis state
  const [selectedVacId, setSelectedVacId] = useState(vaccineCatalog[0]?.id || '');
  const [appDate, setAppDate] = useState(getLocalDateString());
  const [appDateError, setAppDateError] = useState('');
  const [doseToDelete, setDoseToDelete] = useState<VaccineDosis | null>(null);
  const [vetName, setVetName] = useState(currentVetName || 'Veterinaria');
  const [batchNum, setBatchNum] = useState('');

  const activePatient = selectedPatient;
  const patientDoses = vaccineDoses.filter(d => d.patientId === activePatient.id);
  const dueOrExpiredDosis = patientDoses.find(d => d.status === 'expired' || d.status === 'due_soon');
  const todayStr = getLocalDateString();

  // History table filters & sorting
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'todas' | 'al_dia' | 'vencida' | 'pendiente'>('todas');
  const [historySortField, setHistorySortField] = useState<'vaccineName' | 'applicationDate' | 'vetName' | 'expirationDate' | 'status'>('applicationDate');
  const [historySortDirection, setHistorySortDirection] = useState<'asc' | 'desc'>('desc');

  // Catalog table filters & sorting
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('');
  const [catalogSortField, setCatalogSortField] = useState<'name' | 'frequencyDays'>('name');
  const [catalogSortDirection, setCatalogSortDirection] = useState<'asc' | 'desc'>('asc');

  const filteredCatalog = useMemo(() => {
    let list = [...vaccineCatalog];
    if (catalogSearchQuery.trim()) {
      const q = catalogSearchQuery.toLowerCase().trim();
      list = list.filter(item => item.name.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      if (catalogSortField === 'name') {
        return catalogSortDirection === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else {
        return catalogSortDirection === 'asc'
          ? a.frequencyDays - b.frequencyDays
          : b.frequencyDays - a.frequencyDays;
      }
    });
    return list;
  }, [vaccineCatalog, catalogSearchQuery, catalogSortField, catalogSortDirection]);

  const patientHistoryRows = useMemo(() => {
    const appliedReqsWithoutDose = (activePatient.requiredVaccines || []).filter(
      v => v.status === 'aplicada' && !patientDoses.some(d => d.vaccineName.toLowerCase() === v.vaccineName.toLowerCase())
    );

    const pendingReqs = (activePatient.requiredVaccines || []).filter(
      v => v.status === 'pendiente' && !patientDoses.some(d => d.vaccineName.toLowerCase() === v.vaccineName.toLowerCase())
    );

    const rows: Array<{
      id: string;
      vaccineName: string;
      applicationDate: string;
      vetName: string;
      expirationDate: string;
      status: 'al_dia' | 'vencida' | 'pendiente';
      isDose: boolean;
      doseObj?: VaccineDosis;
    }> = [];

    // 1. Dosis registradas
    patientDoses.forEach((dose) => {
      const isExpired = dose.status === 'expired' || dose.expirationDate < todayStr;
      rows.push({
        id: `dose-${dose.id}`,
        vaccineName: dose.vaccineName,
        applicationDate: dose.applicationDate,
        vetName: dose.vetName,
        expirationDate: dose.expirationDate,
        status: isExpired ? 'vencida' : 'al_dia',
        isDose: true,
        doseObj: dose
      });
    });

    // 2. Requeridas aplicadas
    appliedReqsWithoutDose.forEach((req) => {
      const cat = vaccineCatalog.find(c => c.name.toLowerCase() === req.vaccineName.toLowerCase());
      const freqDays = cat?.frequencyDays || 365;
      const appDate = req.appliedDate || req.suggestedDate || todayStr;
      const expDate = new Date(new Date(appDate).getTime() + freqDays * 24 * 60 * 1000 * 60 * 60).toISOString().split('T')[0];
      const isExpired = expDate < todayStr;
      rows.push({
        id: `req-app-${req.id}`,
        vaccineName: req.vaccineName,
        applicationDate: appDate,
        vetName: currentVetName || 'Veterinaria',
        expirationDate: expDate,
        status: isExpired ? 'vencida' : 'al_dia',
        isDose: false
      });
    });

    // 3. Requeridas pendientes
    pendingReqs.forEach((req) => {
      const isExpired = req.suggestedDate < todayStr;
      rows.push({
        id: `req-pen-${req.id}`,
        vaccineName: req.vaccineName,
        applicationDate: '',
        vetName: '-',
        expirationDate: req.suggestedDate,
        status: isExpired ? 'vencida' : 'pendiente',
        isDose: false
      });
    });

    // Filter
    let result = rows;
    if (historySearchQuery.trim()) {
      const q = historySearchQuery.toLowerCase().trim();
      result = result.filter(r =>
        r.vaccineName.toLowerCase().includes(q) ||
        r.vetName.toLowerCase().includes(q) ||
        r.applicationDate.includes(q) ||
        r.expirationDate.includes(q) ||
        r.status.toLowerCase().includes(q)
      );
    }

    if (historyStatusFilter !== 'todas') {
      result = result.filter(r => r.status === historyStatusFilter);
    }

    // Sort
    result.sort((a, b) => {
      let valA: string | number = a[historySortField] || '';
      let valB: string | number = b[historySortField] || '';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return historySortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return historySortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [activePatient.requiredVaccines, patientDoses, vaccineCatalog, todayStr, currentVetName, historySearchQuery, historyStatusFilter, historySortField, historySortDirection]);

  const filteredPatients = useMemo(() => {
    return getRecentOrFilteredPatients(patients || [], patientSearch, activePatient?.id, 15);
  }, [patients, patientSearch, activePatient?.id]);

  const handleCatalogAddOrEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVacName.trim()) return;

    if (editingItem) {
      if (onUpdateVaccineInCatalog) {
        onUpdateVaccineInCatalog(editingItem.id, newVacName.trim(), Number(newVacDays));
      } else {
        editingItem.name = newVacName.trim();
        editingItem.frequencyDays = Number(newVacDays);
      }
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
    if (appDate > getLocalDateString()) {
      setAppDateError('La fecha de aplicación no puede ser futura.');
      return;
    }
    onRegisterDosis({
      patientId: selectedPatient.id,
      vaccineId: selectedVacId,
      applicationDate: appDate,
      vetName,
      batch: batchNum || undefined
    });
    setBatchNum('');
    setAppDateError('');
    setShowRegisterModal(false);
  };

  // General Clinic Vaccine Catalog View (NO Patient Selector)
  if (isGeneralCatalog) {
    return (
      <div className="flex flex-col w-full flex-1 gap-md font-body-md text-slate-800 h-full overflow-y-auto p-md lg:p-0">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-md mb-md">
          <div>
            <h1 className="font-display-lg text-lg lg:text-[22px] text-slate-900 font-semibold leading-tight">
              Vacunas — Catálogo general (Clínica)
            </h1>
            <p className="font-body-md text-xs text-slate-600 font-medium mt-0.5">
              Configuración general de biológicos, definición de plazos de inmunización y parámetros institucionales
            </p>
          </div>

          <button
            onClick={() => {
              setEditingItem(null);
              setNewVacName('');
              setNewVacDays(365);
              setShowCatalogModal(true);
            }}
            className="bg-[#7B5EA7] hover:bg-[#654B8C] text-white px-4 py-2.5 rounded-xl font-label-md text-xs flex items-center gap-1.5 transition-colors shadow-sm font-semibold cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>Agregar vacuna al catálogo</span>
          </button>
        </div>

        {/* Catalog Table */}
        <div className="bg-white rounded-2xl p-md shadow-sm border border-slate-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-sm mb-md">
            <h2 className="font-headline-sm text-sm font-semibold text-slate-900 flex items-center gap-xs">
              <span className="material-symbols-outlined text-[#9A7DB8] text-[18px]">list_alt</span>
              Vacunas registradas en la clínica ({filteredCatalog.length} de {vaccineCatalog.length})
            </h2>

            <div className="w-full sm:w-72 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 flex items-center gap-2">
              <span className="material-symbols-outlined text-slate-400 text-[18px]">search</span>
              <input
                type="text"
                value={catalogSearchQuery}
                onChange={(e) => setCatalogSearchQuery(e.target.value)}
                placeholder="Buscar en el catálogo..."
                className="w-full bg-transparent outline-none text-xs text-slate-800 placeholder:text-slate-400 font-medium"
              />
              {catalogSearchQuery && (
                <button
                  type="button"
                  onClick={() => setCatalogSearchQuery('')}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>
          </div>

          <div className="w-full overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left font-body-md text-xs whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-semibold text-[11px] border-b border-slate-200">
                  <th
                    className="p-sm px-md cursor-pointer hover:bg-slate-100 transition-colors select-none"
                    onClick={() => {
                      if (catalogSortField === 'name') {
                        setCatalogSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                      } else {
                        setCatalogSortField('name');
                        setCatalogSortDirection('asc');
                      }
                    }}
                  >
                    <div className="flex items-center gap-1">
                      <span>Nombre de la vacuna</span>
                      {catalogSortField === 'name' && (
                        <span className="material-symbols-outlined text-[14px] text-[#7B5EA7]">
                          {catalogSortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    className="p-sm px-md cursor-pointer hover:bg-slate-100 transition-colors select-none"
                    onClick={() => {
                      if (catalogSortField === 'frequencyDays') {
                        setCatalogSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                      } else {
                        setCatalogSortField('frequencyDays');
                        setCatalogSortDirection('asc');
                      }
                    }}
                  >
                    <div className="flex items-center gap-1">
                      <span>Frecuencia / vigencia</span>
                      {catalogSortField === 'frequencyDays' && (
                        <span className="material-symbols-outlined text-[14px] text-[#7B5EA7]">
                          {catalogSortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th data-card-hide className="p-sm px-md">Equivalente meses</th>
                  <th className="p-sm px-md text-center">Estado</th>
                  <th className="p-sm px-md text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-slate-800">
                {filteredCatalog.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500 text-xs font-medium">
                      No se encontraron vacunas que coincidan con "{catalogSearchQuery}".
                    </td>
                  </tr>
                ) : (
                  filteredCatalog.map((item) => {
                    const months = Math.round(item.frequencyDays / 30);
                    return (
                      <tr key={item.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                        <td className="p-sm px-md font-medium text-slate-900 text-xs">{item.name}</td>
                        <td className="p-sm px-md font-medium text-slate-800">{item.frequencyDays} días</td>
                        <td className="p-sm px-md text-slate-600 font-medium">~ {months} {months === 1 ? 'mes' : 'meses'}</td>
                        <td className="p-sm px-md text-center">
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
                            Activa
                          </span>
                        </td>
                        <td className="p-sm px-md text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="bg-purple-50 hover:bg-purple-100 text-[#5C3C7B] border border-purple-200 px-3.5 py-2 min-h-[44px] rounded-lg font-label-md text-xs inline-flex items-center gap-1.5 transition-colors font-semibold cursor-pointer shadow-2xs"
                          >
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                            <span>Modificar</span>
                          </button>
                          {onDeleteVaccineFromCatalog && (
                            <button
                              onClick={() => setDeleteConfirm({ isOpen: true, vaccineId: item.id, vaccineName: item.name })}
                              className="bg-red-50 hover:bg-red-100 text-error border border-red-200 min-h-[44px] min-w-[44px] p-2 rounded-lg text-xs inline-flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                              title="Eliminar vacuna del catálogo"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                }))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Catalog Add/Edit */}
        {showCatalogModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-[70] flex items-start sm:items-center justify-center p-3 sm:p-md pt-6 sm:pt-10 animate-fade-in overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-lg w-full p-lg shadow-2xl flex flex-col gap-md border border-slate-200 my-4 sm:my-auto">
              <div className="flex justify-between items-center border-b border-slate-200 pb-sm">
                <h3 className="font-headline-sm text-slate-900 font-semibold text-base">
                  {editingItem ? 'Modificar vacuna del catálogo' : 'Agregar vacuna al catálogo'}
                </h3>
                <button onClick={() => setShowCatalogModal(false)} className="text-slate-400 hover:text-slate-700 transition-colors p-1 cursor-pointer">
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <form onSubmit={handleCatalogAddOrEdit} className="flex flex-col gap-md text-xs">
                <div>
                  <label className="font-semibold text-xs text-slate-700 block mb-1">Nombre de la vacuna *</label>
                  <input
                    type="text"
                    value={newVacName}
                    onChange={(e) => setNewVacName(e.target.value)}
                    placeholder=""
                    required
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-none text-slate-900 font-medium text-xs focus:border-[#9A7DB8] focus:ring-2 focus:ring-[#9A7DB8]/20 placeholder:text-slate-400 shadow-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-xs text-slate-700 block mb-1">Frecuencia / plazo de vigencia (días) *</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={newVacDays}
                    onChange={(e) => setNewVacDays(Number(e.target.value))}
                    required
                    min={1}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-none text-slate-900 font-medium text-xs focus:border-[#9A7DB8] focus:ring-2 focus:ring-[#9A7DB8]/20 shadow-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-sm pt-sm mt-xs border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowCatalogModal(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-[#7B5EA7] hover:bg-[#654B8C] text-white px-4 py-2.5 rounded-xl font-label-md text-xs font-semibold shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[18px]">save</span>
                    <span>{editingItem ? 'Guardar cambios' : 'Agregar al catálogo'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <AppConfirmModal
          isOpen={deleteConfirm.isOpen}
          title="Confirmar eliminación de vacuna"
          message={`¿Está seguro de que desea eliminar la vacuna "${deleteConfirm.vaccineName}" del catálogo general de la clínica?`}
          confirmText="Sí, eliminar"
          cancelText="Cancelar"
          isDanger={true}
          onConfirm={() => {
            if (onDeleteVaccineFromCatalog && deleteConfirm.vaccineId) {
              onDeleteVaccineFromCatalog(deleteConfirm.vaccineId);
            }
            setDeleteConfirm({ isOpen: false, vaccineId: '', vaccineName: '' });
          }}
          onCancel={() => setDeleteConfirm({ isOpen: false, vaccineId: '', vaccineName: '' })}
        />
      </div>
    );
  }

  // Patients Module: Control de Vacunas (With Master Patient Selection)
  return (
    <div className="flex flex-col md:flex-row gap-md w-full flex-1 font-body-md text-slate-800 h-full overflow-y-auto p-md lg:p-0">
      {/* Left Column: All Patients Master List */}
      {patients && patients.length > 0 && (
        <aside className={`${mobileView === 'list' ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-64 xl:w-72 gap-xs shrink-0 overflow-hidden h-full min-h-0`}>
          <div className="flex items-center justify-between px-xs shrink-0">
            <h2 className="font-label-md text-xs text-slate-700 font-semibold truncate">
              {!patientSearch.trim()
                ? `Últimos gestionados (${filteredPatients.length})`
                : `Resultados (${filteredPatients.length})`}
            </h2>
            <span className="text-[10px] text-slate-500 font-medium shrink-0">
              Total: {patients.length}
            </span>
          </div>

          {/* Quick Search */}
          <div className="bg-white rounded-xl shadow-sm p-xs flex items-center relative border border-slate-300 shrink-0">
            <span className="material-symbols-outlined text-slate-400 ml-sm mr-xs text-[18px] shrink-0" aria-hidden="true">
              search
            </span>
            <input
              type="text"
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
              placeholder="Buscar entre todos los pacientes..."
              className="w-full bg-transparent outline-none p-xs font-body-md text-xs text-slate-800 placeholder:text-slate-400 font-medium"
            />
            {patientSearch && (
              <button
                type="button"
                onClick={() => setPatientSearch('')}
                className="text-slate-400 hover:text-slate-600 mr-1 p-0.5 cursor-pointer shrink-0"
                title="Limpiar búsqueda"
              >
                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">close</span>
              </button>
            )}
          </div>

          {!patientSearch.trim() && patients.length > 15 && (
            <div className="text-[10px] text-slate-500 font-medium px-1 flex items-center justify-between shrink-0">
              <span>Mostrando los 15 más recientes</span>
              <span className="text-purple-700 font-semibold">Buscá para ver los {patients.length}</span>
            </div>
          )}

          {/* Patient List */}
          <div className="flex flex-col gap-2 flex-1 min-h-0 overflow-y-auto pr-1 mt-xs">
            {filteredPatients.length === 0 ? (
              <div className="p-4 text-center text-slate-500 text-xs font-medium bg-white rounded-xl border border-slate-200 shrink-0">
                No se encontraron pacientes para "{patientSearch}"
              </div>
            ) : (
              filteredPatients.map((p) => {
              const isSelected = p.id === activePatient.id;
              const patStatus = getPatientVaccineGlobalStatus(p, vaccineDoses, vaccineCatalog, todayStr);

              return (
                <button
                  key={p.id}
                  onClick={() => {
                    if (onSelectPatient) onSelectPatient(p);
                    setMobileView('detail');
                  }}
                  className={`p-2.5 px-3 rounded-xl shadow-xs flex items-center gap-3 text-left transition-all relative overflow-hidden group cursor-pointer border shrink-0 min-h-[62px] bg-white text-slate-800 hover:bg-purple-50/60 hover:border-purple-300 border-slate-200 ${
                    isSelected
                      ? 'md:border-l-4 md:border-l-[#9A7DB8] md:border-purple-300 md:shadow-md md:ring-1 md:ring-[#9A7DB8]/30'
                      : ''
                  }`}
                >
                  <div className={`relative w-10 h-10 rounded-full overflow-hidden shadow-xs shrink-0 flex items-center justify-center bg-slate-100 group-hover:bg-purple-50 transition-colors ${
                    isSelected ? 'md:bg-purple-50 md:border md:border-[#9A7DB8]/40' : ''
                  }`}>
                    {p.photoUrl ? (
                      <img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover relative z-10" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    ) : (
                      <span className={`material-symbols-outlined text-[22px] absolute text-slate-400 group-hover:text-[#9A7DB8] transition-colors ${isSelected ? 'md:text-[#9A7DB8]' : ''}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                        pets
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col flex-1 min-w-0 z-10">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-headline-sm text-xs font-bold truncate text-slate-800 group-hover:text-[#5C3C7B] transition-colors">
                        {p.name}
                      </span>
                      <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full shrink-0 border ${patStatus.badgeClass}`}>
                        {patStatus.label}
                      </span>
                    </div>
                    <span className="font-body-md text-[11px] truncate mt-0.5 text-slate-500">
                      {p.species} • {p.breed}
                    </span>
                    <span className="font-label-sm text-[10px] truncate mt-0.5 text-slate-500">
                      Dueño: <strong className="font-medium text-slate-700">{p.ownerName}</strong>
                    </span>
                  </div>
                </button>
              );
            }))}
          </div>
        </aside>
      )}

      {/* Right Main Column: Active Patient Vaccine Detail */}
      <main className={`${mobileView === 'detail' ? 'flex' : 'hidden'} md:flex flex-col gap-md min-w-0 lg:flex-1 lg:overflow-y-auto`}>
        {/* Mobile Back Button to return to patient list */}
        <div className="md:hidden flex items-center justify-between pb-1">
          <button
            type="button"
            onClick={() => setMobileView('list')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-100/80 hover:bg-purple-200 text-[#5C3C7B] font-semibold text-xs transition-colors cursor-pointer border border-purple-200 shadow-2xs"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_back</span>
            <span>Volver a la lista de pacientes</span>
          </button>
        </div>

        {/* Header Hero */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-md bg-white p-md rounded-2xl shadow-sm border border-slate-200 shrink-0">
          <div className="flex items-center gap-md">
            <div className="w-12 h-12 rounded-full bg-purple-50 border border-purple-200 overflow-hidden shadow-sm flex items-center justify-center shrink-0">
              {activePatient.photoUrl ? (
                <img src={activePatient.photoUrl} alt={activePatient.name} className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-[24px] text-[#9A7DB8]" style={{ fontVariationSettings: "'FILL' 1" }}>pets</span>
              )}
            </div>
            <div>
              <h1 className="font-display-lg text-lg lg:text-[22px] text-slate-900 leading-tight font-semibold">{activePatient.name}</h1>
              <p className="font-body-md text-xs text-slate-600 font-medium flex items-center gap-xs mt-0.5">
                <span>{activePatient.species}, {activePatient.breed} • {activePatient.sex} • Dueño: <strong className="text-slate-900 font-semibold">{activePatient.ownerName}</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-sm flex-wrap">
            {onNavigateToPatient && (
              <button
                type="button"
                onClick={() => onNavigateToPatient(activePatient)}
                className="bg-purple-50 hover:bg-purple-100 text-[#5C3C7B] border border-purple-200 px-3.5 py-2 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                title={`Ver ficha médica completa de ${activePatient.name}`}
              >
                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">description</span>
                <span>Ficha médica</span>
              </button>
            )}

            <button
              onClick={() => setShowRegisterModal(true)}
              className="bg-[#7B5EA7] hover:bg-[#654B8C] text-white px-4 py-2.5 rounded-xl font-label-md text-xs flex items-center gap-1.5 transition-colors shadow-sm font-semibold cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">add</span>
              <span>Registrar aplicación</span>
            </button>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-md flex-1">
          <div className="xl:col-span-2 flex flex-col gap-md">
            {/* Tarjeta Vacunas Necesarias del Paciente (Cargadas en Ficha) */}
            {activePatient.requiredVaccines && activePatient.requiredVaccines.length > 0 && (
              <div className="bg-emerald-50/50 rounded-2xl p-md shadow-sm border border-emerald-300 flex flex-col gap-xs w-full col-span-full">
                <div className="flex items-center justify-between">
                  <h2 className="font-headline-sm text-xs font-semibold text-emerald-950 flex items-center gap-xs">
                    <span className="material-symbols-outlined text-emerald-700 text-[18px]">vaccines</span>
                    Vacunas necesarias / requeridas ({activePatient.name})
                  </h2>
                  <span className="text-[11px] text-emerald-800 font-medium">Cargadas desde la ficha del paciente</span>
                </div>

                <div className="flex flex-col gap-xs mt-1 w-full">
                  {activePatient.requiredVaccines.map(vac => {
                    const isExpired = vac.status !== 'aplicada' && vac.suggestedDate < todayStr;
                    const activeApp = findActiveVaccineAppointment(activePatient.id, vac.vaccineName, medicalAppointments);
                    return (
                      <div
                        key={vac.id}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-sm text-xs w-full shadow-2xs ${
                          vac.status === 'aplicada'
                            ? 'border-emerald-200 bg-emerald-100/60 text-emerald-950'
                            : isExpired
                            ? 'border-red-200 bg-red-100/60 text-red-950'
                            : 'border-amber-200 bg-amber-100/60 text-amber-950'
                        }`}
                      >
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <div className="flex items-center gap-xs flex-wrap">
                            <span className="font-semibold text-xs truncate">{vac.vaccineName}</span>
                            {vac.status === 'aplicada' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] font-semibold">Aplicada</span>
                            ) : isExpired ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-600 text-white text-[9px] font-semibold">Vencida</span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-600 text-white text-[9px] font-semibold">Pendiente</span>
                            )}
                            {activeApp && vac.status !== 'aplicada' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-[#5C3C7B] border border-purple-200 text-[9px] font-bold">
                                <span className="material-symbols-outlined text-[12px]">event_available</span>
                                Turno agendado ({formatDate(activeApp.date)} {activeApp.time} hs)
                              </span>
                            )}
                          </div>
                          <span className={`text-[11px] font-medium ${
                            vac.status === 'aplicada' ? 'text-emerald-800' : isExpired ? 'text-red-800' : 'text-amber-800'
                          }`}>
                            {vac.status === 'aplicada' ? (
                              <>
                                {vac.appliedDate && <>Aplicada: <strong>{formatDate(vac.appliedDate)}</strong> • </>}
                                Próximo refuerzo: <strong>{formatDate(getEffectiveVaccineNextDueDate(activePatient.id, vac, vaccineDoses, vaccineCatalog))}</strong>
                              </>
                            ) : (
                              <>
                                Sugerida: <strong>{formatDate(vac.suggestedDate)}</strong>
                              </>
                            )}
                          </span>
                          {vac.notes && (
                            <span className={`text-[11px] italic truncate ${
                              vac.status === 'aplicada' ? 'text-emerald-700' : isExpired ? 'text-red-700' : 'text-amber-700'
                            }`}>{vac.notes}</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleToggleVaccineAppliedInVaccinesView(vac.id)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-medium shadow-2xs cursor-pointer whitespace-nowrap transition-all ${
                              vac.status === 'aplicada'
                                ? 'bg-emerald-800 text-white hover:bg-emerald-900'
                                : isExpired
                                ? 'bg-red-600 text-white hover:bg-red-700'
                                : 'bg-amber-600 text-white hover:bg-amber-700'
                            }`}
                          >
                            {vac.status === 'aplicada' ? '✓ Aplicada' : 'Marcar aplicada'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Historial Table */}
            <div className="bg-white rounded-2xl p-md shadow-sm border border-slate-200">
              <div className="flex flex-col gap-sm mb-md">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-sm">
                  <h2 className="font-headline-sm text-sm font-semibold text-slate-900 flex items-center gap-xs">
                    <span className="material-symbols-outlined text-[#9A7DB8] text-[18px]">vaccines</span>
                    Historial de vacunación — {activePatient.name} ({patientHistoryRows.length})
                  </h2>

                  {/* Search bar */}
                  <div className="w-full sm:w-64 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 flex items-center gap-2">
                    <span className="material-symbols-outlined text-slate-400 text-[18px]">search</span>
                    <input
                      type="text"
                      value={historySearchQuery}
                      onChange={(e) => setHistorySearchQuery(e.target.value)}
                      placeholder="Buscar en historial..."
                      className="w-full bg-transparent outline-none text-xs text-slate-800 placeholder:text-slate-400 font-medium"
                    />
                    {historySearchQuery && (
                      <button
                        type="button"
                        onClick={() => setHistorySearchQuery('')}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Status Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  <button
                    type="button"
                    onClick={() => setHistoryStatusFilter('todas')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      historyStatusFilter === 'todas'
                        ? 'bg-[#7B5EA7] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Todas
                  </button>
                  <button
                    type="button"
                    onClick={() => setHistoryStatusFilter('al_dia')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                      historyStatusFilter === 'al_dia'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Al día
                  </button>
                  <button
                    type="button"
                    onClick={() => setHistoryStatusFilter('vencida')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                      historyStatusFilter === 'vencida'
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                    Vencidas
                  </button>
                  <button
                    type="button"
                    onClick={() => setHistoryStatusFilter('pendiente')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                      historyStatusFilter === 'pendiente'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    Pendientes
                  </button>
                </div>
              </div>

              <div className="w-full overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left font-body-md text-xs whitespace-nowrap">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 text-[11px]">
                      <th
                        className="py-2.5 px-md cursor-pointer hover:bg-slate-100 transition-colors select-none"
                        onClick={() => {
                          if (historySortField === 'vaccineName') {
                            setHistorySortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                          } else {
                            setHistorySortField('vaccineName');
                            setHistorySortDirection('asc');
                          }
                        }}
                      >
                        <div className="flex items-center gap-1">
                          <span>Vacuna</span>
                          {historySortField === 'vaccineName' && (
                            <span className="material-symbols-outlined text-[14px] text-[#7B5EA7]">
                              {historySortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th
                        className="py-2.5 px-md cursor-pointer hover:bg-slate-100 transition-colors select-none"
                        onClick={() => {
                          if (historySortField === 'applicationDate') {
                            setHistorySortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                          } else {
                            setHistorySortField('applicationDate');
                            setHistorySortDirection('asc');
                          }
                        }}
                      >
                        <div className="flex items-center gap-1">
                          <span>Fecha aplicación</span>
                          {historySortField === 'applicationDate' && (
                            <span className="material-symbols-outlined text-[14px] text-[#7B5EA7]">
                              {historySortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th
                        className="py-2.5 px-md cursor-pointer hover:bg-slate-100 transition-colors select-none"
                        onClick={() => {
                          if (historySortField === 'vetName') {
                            setHistorySortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                          } else {
                            setHistorySortField('vetName');
                            setHistorySortDirection('asc');
                          }
                        }}
                      >
                        <div className="flex items-center gap-1">
                          <span>Profesional</span>
                          {historySortField === 'vetName' && (
                            <span className="material-symbols-outlined text-[14px] text-[#7B5EA7]">
                              {historySortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th
                        className="py-2.5 px-md cursor-pointer hover:bg-slate-100 transition-colors select-none"
                        onClick={() => {
                          if (historySortField === 'expirationDate') {
                            setHistorySortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                          } else {
                            setHistorySortField('expirationDate');
                            setHistorySortDirection('asc');
                          }
                        }}
                      >
                        <div className="flex items-center gap-1">
                          <span>Vencimiento / Refuerzo</span>
                          {historySortField === 'expirationDate' && (
                            <span className="material-symbols-outlined text-[14px] text-[#7B5EA7]">
                              {historySortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                            </span>
                          )}
                        </div>
                      </th>
                      <th
                        className="py-2.5 px-md cursor-pointer hover:bg-slate-100 transition-colors select-none"
                        onClick={() => {
                          if (historySortField === 'status') {
                            setHistorySortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                          } else {
                            setHistorySortField('status');
                            setHistorySortDirection('asc');
                          }
                        }}
                      >
                        <div className="flex items-center gap-1">
                          <span>Estado</span>
                          {historySortField === 'status' && (
                            <span className="material-symbols-outlined text-[14px] text-[#7B5EA7]">
                              {historySortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                            </span>
                          )}
                        </div>
                      </th>
                      {onDeleteDosis && <th className="py-2.5 px-md text-right">Acciones</th>}
                    </tr>
                  </thead>
                  <tbody className="text-slate-800">
                    {patientHistoryRows.length === 0 ? (
                      <tr>
                        <td colSpan={onDeleteDosis ? 6 : 5} className="py-8 text-center text-slate-500 text-xs font-medium">
                          {historySearchQuery || historyStatusFilter !== 'todas'
                            ? 'No se encontraron vacunas que coincidan con los filtros aplicados.'
                            : `No hay vacunas registradas para ${activePatient.name}.`}
                        </td>
                      </tr>
                    ) : (
                      patientHistoryRows.map((row) => {
                        const isExpired = row.status === 'vencida';
                        const isPending = row.status === 'pendiente';

                        return (
                          <tr key={row.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                            <td className="py-sm px-md font-medium text-slate-900 text-xs">{row.vaccineName}</td>
                            <td className="py-sm px-md font-medium text-slate-800">
                              {row.applicationDate ? formatDate(row.applicationDate) : '-'}
                            </td>
                            <td className="py-sm px-md flex items-center gap-xs font-medium text-slate-800">
                              {row.vetName !== '-' ? (
                                <>
                                  <div className="w-5 h-5 rounded-full bg-purple-100 text-[#5C3C7B] flex items-center justify-center font-semibold text-[10px]">
                                    {row.vetName.slice(0, 2).toUpperCase()}
                                  </div>
                                  {row.vetName}
                                </>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                            <td className={`py-sm px-md font-semibold ${
                              isExpired ? 'text-red-700' : 'text-slate-800'
                            }`}>
                              {formatDate(row.expirationDate)}
                            </td>
                            <td className="py-sm px-md">
                              {isExpired ? (
                                <span className="inline-flex items-center gap-xs px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 font-semibold text-[10px]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                                  Vencida
                                </span>
                              ) : isPending ? (
                                <span className="inline-flex items-center gap-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold text-[10px]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                                  Pendiente
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[10px]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                                  Al día
                                </span>
                              )}
                            </td>
                            {onDeleteDosis && (
                              <td className="py-sm px-md text-right">
                                {row.isDose && row.doseObj ? (
                                  <button
                                    type="button"
                                    onClick={() => setDoseToDelete(row.doseObj!)}
                                    aria-label={`Eliminar dosis de ${row.vaccineName} del ${formatDate(row.applicationDate)}`}
                                    title="Eliminar dosis"
                                    className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                  >
                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                  </button>
                                ) : (
                                  <span className="text-slate-400 text-xs">-</span>
                                )}
                              </td>
                            )}
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
              {(() => {
                const pendingVaccine = getPendingOrDueVaccine(activePatient, vaccineDoses, todayStr);
                const hasAnyVaccines = (activePatient.requiredVaccines && activePatient.requiredVaccines.length > 0) || patientDoses.length > 0;
                const activeVaccineApp = pendingVaccine 
                  ? findActiveVaccineAppointment(activePatient.id, pendingVaccine.vaccineName, medicalAppointments) 
                  : undefined;
                
                return (
                  <div className="bg-[#7B5EA7] text-white rounded-2xl p-md shadow-sm relative overflow-hidden flex flex-col justify-between">
                    <div>
                      <h3 className="font-label-md text-purple-100 text-[10px] mb-xs font-semibold">Próxima aplicación</h3>
                      <p className="font-display-lg text-lg mb-xs font-semibold">
                        {!hasAnyVaccines 
                          ? 'Sin vacunas registradas'
                          : pendingVaccine 
                          ? pendingVaccine.vaccineName 
                          : 'Todas las vacunas al día'}
                      </p>
                      <p className="font-body-md text-purple-100 text-xs flex items-center gap-xs mb-md font-medium">
                        <span className="material-symbols-outlined text-[14px]">
                          {activeVaccineApp ? 'event_available' : !hasAnyVaccines ? 'info' : pendingVaccine ? 'warning' : 'check_circle'}
                        </span>
                        {activeVaccineApp
                          ? `Turno agendado: ${formatDate(activeVaccineApp.date)} a las ${activeVaccineApp.time} hs`
                          : !hasAnyVaccines
                          ? 'Paciente sin esquema de vacunación cargado'
                          : pendingVaccine 
                          ? `${pendingVaccine.isExpired ? 'Vencida desde el' : 'Próxima a vencer el'} ${formatDate(pendingVaccine.expirationDate)}`
                          : 'Inmunizaciones vigentes según el esquema actual'}
                      </p>
                    </div>
                    <button
                      disabled={Boolean(activeVaccineApp)}
                      onClick={() => {
                        if (activeVaccineApp) return;
                        const vacName = pendingVaccine ? pendingVaccine.vaccineName : undefined;
                        onScheduleAppointment(activePatient.id, vacName);
                      }}
                      className={`w-full py-2.5 rounded-xl font-label-md text-xs transition-colors font-semibold shadow-xs flex items-center justify-center gap-1.5 ${
                        activeVaccineApp
                          ? 'bg-purple-300/30 text-purple-200 cursor-not-allowed border border-purple-300/30'
                          : 'bg-white text-[#5C3C7B] hover:bg-purple-50 cursor-pointer'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {activeVaccineApp ? 'event_available' : 'calendar_month'}
                      </span>
                      <span>
                        {activeVaccineApp 
                          ? 'Turno ya agendado' 
                          : !hasAnyVaccines 
                          ? 'Agendar primera dosis' 
                          : pendingVaccine 
                          ? 'Agendar turno' 
                          : 'Agendar control'}
                      </span>
                    </button>
                  </div>
                );
              })()}

              {/* Cobertura Actual Card */}
              {(() => {
                const coverage = calculatePatientVaccineCoverage(activePatient, vaccineDoses, vaccineCatalog, todayStr);
                return (
                  <div className="bg-white rounded-2xl p-md shadow-sm border border-slate-200 flex flex-col justify-between">
                    <div>
                      <h3 className="font-label-md text-slate-600 text-[10px] mb-xs font-semibold">Cobertura actual</h3>
                      <div className="flex items-end gap-sm mb-sm">
                        <span className={`font-display-lg text-2xl font-semibold ${
                          coverage.percentage === 100 ? 'text-emerald-700' : coverage.percentage === 0 ? 'text-red-700' : 'text-amber-700'
                        }`}>
                          {coverage.percentage}%
                        </span>
                        <span className="font-body-md text-xs text-slate-600 pb-0.5 font-medium">
                          {coverage.label}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          coverage.percentage === 100 ? 'bg-emerald-500' : coverage.percentage === 0 ? 'bg-red-500' : 'bg-[#7B5EA7]'
                        }`}
                        style={{ width: `${coverage.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Recordatorios Panel */}
          <div className="flex flex-col gap-md">
            <div className="bg-white rounded-2xl p-md shadow-sm border border-slate-200 h-full flex flex-col">
              <div className="flex items-center justify-between mb-md">
                <h2 className="font-headline-sm text-sm font-semibold text-slate-900 flex items-center gap-xs">
                  <span className="material-symbols-outlined text-[#9A7DB8] text-[18px]">campaign</span>
                  Recordatorios de vacunas
                </h2>
              </div>

              {(() => {
                const pendingVaccine = getPendingOrDueVaccine(activePatient, vaccineDoses, todayStr);
                
                if (!pendingVaccine) {
                  return (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 shadow-xs">
                        <span className="material-symbols-outlined text-[22px]">verified</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-800">Sin recordatorios pendientes</p>
                      <p className="text-[11px] text-slate-500 mt-1 max-w-[220px]">
                        {activePatient.name} no tiene vacunas pendientes ni vencidas para notificar.
                      </p>
                    </div>
                  );
                }

                const cleanPhone = (phone?: string) => phone ? phone.replace(/[^0-9]/g, '') : '';
                const reminderText = formatVaccineReminderMessage(
                  activePatient.ownerName,
                  pendingVaccine.vaccineName,
                  activePatient.name,
                  pendingVaccine.expirationDate
                );

                return (
                  <div className="flex flex-col gap-sm relative">
                    <div className="relative z-10 flex gap-sm">
                      <div className="w-7 h-7 rounded-full bg-purple-50 shadow-xs flex items-center justify-center border border-purple-200 shrink-0 mt-0.5">
                        <span className="material-symbols-outlined text-[14px] text-[#9A7DB8]">sms</span>
                      </div>
                      <div className="flex-1 bg-purple-50/60 border border-purple-100 rounded-xl p-sm">
                        <div className="flex justify-between items-start mb-0.5">
                          <span className="font-label-md text-xs text-slate-900 font-semibold">{pendingVaccine.vaccineName}</span>
                          <span className="font-label-sm text-[10px] text-slate-500 font-medium">Hoy, 09:00</span>
                        </div>
                        <p className="font-body-md text-slate-700 text-[11px] mb-1 font-normal leading-relaxed">
                          "{reminderText}"
                        </p>
                        <div className="flex items-center justify-between mt-1 pt-1 border-t border-purple-100/60">
                          <div className="flex items-center gap-xs">
                            <span className="material-symbols-outlined text-[13px] text-[#9A7DB8]">done_all</span>
                            <span className="font-label-sm text-[10px] text-[#5C3C7B] font-semibold">Entregado</span>
                          </div>
                          {activePatient.ownerPhone && (
                            <a
                              href={`https://wa.me/${cleanPhone(activePatient.ownerPhone)}?text=${encodeURIComponent(reminderText)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] font-bold text-[#25D366] hover:underline flex items-center gap-0.5"
                            >
                              <span className="material-symbols-outlined text-[12px]">chat</span>
                              Enviar por WhatsApp
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </main>

      {/* Register Dosis Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-[70] flex items-start sm:items-center justify-center p-3 sm:p-md pt-6 sm:pt-10 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-lg shadow-2xl flex flex-col gap-md border border-slate-200 my-4 sm:my-auto">
            <div className="flex justify-between items-center border-b border-slate-200 pb-sm">
              <h3 className="font-headline-sm text-slate-900 text-base font-semibold">
                Registrar aplicación de vacuna ({activePatient.name})
              </h3>
              <button onClick={() => setShowRegisterModal(false)} className="text-slate-400 hover:text-slate-700 transition-colors p-1 cursor-pointer">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleRegisterDosis} className="flex flex-col gap-md text-xs">
              <div>
                <label className="font-semibold text-xs text-slate-700 block mb-1">Seleccionar vacuna *</label>
                <SearchableVaccineSelect
                  catalog={vaccineCatalog}
                  selectedVaccineId={selectedVacId}
                  onSelectVaccine={(vac) => setSelectedVacId(vac.id)}
                  speciesFilter={activePatient.species}
                  placeholder="Escriba para buscar o elija del desplegable..."
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-xs text-slate-700 block mb-1">Fecha de aplicación *</label>
                <input
                  type="date"
                  value={appDate}
                  max={getLocalDateString()}
                  onChange={(e) => { setAppDate(e.target.value); setAppDateError(''); }}
                  required
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-none text-slate-900 font-medium text-xs focus:border-[#9A7DB8] focus:ring-2 focus:ring-[#9A7DB8]/20 shadow-xs cursor-pointer"
                />
                {appDateError && (
                  <p role="alert" className="text-[11px] text-red-600 font-medium mt-1">{appDateError}</p>
                )}
              </div>

              <div>
                <label className="font-semibold text-xs text-slate-700 block mb-1">Veterinario actuante *</label>
                <input
                  type="text"
                  value={vetName}
                  onChange={(e) => setVetName(e.target.value)}
                  required
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-none text-slate-900 font-medium text-xs focus:border-[#9A7DB8] focus:ring-2 focus:ring-[#9A7DB8]/20 shadow-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-sm pt-sm mt-xs border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#7B5EA7] hover:bg-[#654B8C] text-white px-4 py-2.5 rounded-xl font-label-md text-xs font-semibold shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  <span>Guardar dosis</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AppConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="Confirmar eliminación de vacuna"
        message={`¿Está seguro de que desea eliminar la vacuna "${deleteConfirm.vaccineName}" del catálogo general de la clínica?`}
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        isDanger={true}
        onConfirm={() => {
          if (onDeleteVaccineFromCatalog && deleteConfirm.vaccineId) {
            onDeleteVaccineFromCatalog(deleteConfirm.vaccineId);
          }
          setDeleteConfirm({ isOpen: false, vaccineId: '', vaccineName: '' });
        }}
        onCancel={() => setDeleteConfirm({ isOpen: false, vaccineId: '', vaccineName: '' })}
      />

      {/* Delete Dose Confirmation Modal */}
      <AppConfirmModal
        isOpen={!!doseToDelete}
        title="Confirmar eliminación de dosis"
        message={doseToDelete ? `¿Eliminar la dosis de "${doseToDelete.vaccineName}" aplicada el ${formatDate(doseToDelete.applicationDate)} a ${activePatient.name}?` : ''}
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        isDanger={true}
        onConfirm={() => {
          if (onDeleteDosis && doseToDelete) {
            onDeleteDosis(doseToDelete.id);
          }
          setDoseToDelete(null);
        }}
        onCancel={() => setDoseToDelete(null)}
      />
    </div>
  );
};
