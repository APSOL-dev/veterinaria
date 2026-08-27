import React, { useState, useCallback, useMemo } from 'react';
import { Header } from './components/Navigation/Header';
import { ActiveModule, Sidebar } from './components/Navigation/Sidebar';
import { PatientProfileView } from './components/Patient/PatientProfileView';
import { NewConsultationView } from './components/Patient/NewConsultationView';
import { VaccinesView } from './components/Vaccines/VaccinesView';
import { AgendaView } from './components/Agenda/AgendaView';
import { StockControlView } from './components/Inventory/StockControlView';
import { StoreBillingView } from './components/Billing/StoreBillingView';
import { SuppliersView } from './components/Suppliers/SuppliersView';
import { TutoresView } from './components/Patient/TutoresView';
import { CobrosView } from './components/Billing/CobrosView';
import { LoginPage } from './components/Auth/LoginPage';
import { UserSession } from './domain/services/authService';
import { resolveShortcutNavigationTarget } from './domain/services/navigationService';

import { 
  initialPatients, 
  initialClinicalNotes, 
  initialVaccineCatalog, 
  initialVaccineDoses, 
  initialMedicalAppointments, 
  initialGroomingServices, 
  initialGroomingAppointments, 
  initialProducts, 
  initialReceipts,
  initialSupplierBills,
  initialSupplierQuotes,
  initialServicesCatalog,
  initialMonthlyBudgets,
  initialExpenses
} from './data/mockData';

import { 
  Patient, 
  ClinicalNote, 
  VaccineCatalogItem, 
  VaccineDosis, 
  MedicalAppointment, 
  GroomingAppointment, 
  Product, 
  BillReceipt, 
  DocumentType, 
  PaymentMethod, 
  BillItem,
  SupplierBill,
  SupplierQuote,
  ServiceCatalogItem,
  ExpenseRecord
} from './domain/types';

import { createDosisRecord } from './domain/services/vaccineService';
import { getLowStockAlerts, recordStockEntry, recordStockAdjustment } from './domain/services/inventoryService';
import { processCheckout } from './domain/services/billingService';
import { createNewPatientRecord } from './domain/services/patientService';
import { createSupplierBillRecord, createSupplierQuoteRecord } from './domain/services/supplierService';
import { createExpenseRecord } from './domain/services/expenseService';
import { resolveNavigationState } from './domain/services/navigationService';
import { canAccessModule, getDefaultModuleForRole } from './domain/services/rbacService';

import { AppNotificationModal } from './components/Common/AppNotificationModal';
import { LowStockAlertModal } from './components/Inventory/LowStockAlertModal';

export const App: React.FC = () => {
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [showLowStockModal, setShowLowStockModal] = useState<boolean>(false);
  const [activeModule, setActiveModuleState] = useState<ActiveModule>('pacientes');
  const [activeSubmodule, setActiveSubmodule] = useState<string>('ficha-pacientes');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerWidth < 1280 : false;
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Domain state
  const [patients, setPatients] = useState<Patient[]>(initialPatients);
  const [selectedPatient, setSelectedPatient] = useState<Patient>(initialPatients[0]);

  const [clinicalNotes, setClinicalNotes] = useState<ClinicalNote[]>(initialClinicalNotes);
  const [vaccineCatalog, setVaccineCatalog] = useState<VaccineCatalogItem[]>(initialVaccineCatalog);
  const [vaccineDoses, setVaccineDoses] = useState<VaccineDosis[]>(initialVaccineDoses);
  
  const [medicalAppointments, setMedicalAppointments] = useState<MedicalAppointment[]>(initialMedicalAppointments);
  const [groomingServices] = useState(initialGroomingServices);
  const [groomingAppointments, setGroomingAppointments] = useState<GroomingAppointment[]>(initialGroomingAppointments);
  
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [servicesCatalog, setServicesCatalog] = useState<ServiceCatalogItem[]>(initialServicesCatalog);
  const [supplierBills, setSupplierBills] = useState<SupplierBill[]>(initialSupplierBills);
  const [supplierQuotes, setSupplierQuotes] = useState<SupplierQuote[]>(initialSupplierQuotes);
  const [monthlyBudgets, setMonthlyBudgets] = useState<Record<string, number>>(initialMonthlyBudgets);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(initialExpenses);

  React.useEffect(() => {
    const preventDefaultDrop = (e: DragEvent) => {
      e.preventDefault();
    };
    window.addEventListener('dragover', preventDefaultDrop);
    window.addEventListener('drop', preventDefaultDrop);
    return () => {
      window.removeEventListener('dragover', preventDefaultDrop);
      window.removeEventListener('drop', preventDefaultDrop);
    };
  }, []);
  const [receipts, setReceipts] = useState<BillReceipt[]>(initialReceipts);

  const handleLoginSuccess = useCallback((session: UserSession) => {
    setUserSession(session);
    const defaultMod = getDefaultModuleForRole(session.role);
    const nav = resolveNavigationState(defaultMod);
    setActiveModuleState(nav.module);
    setActiveSubmodule(nav.submodule);

    const lowStock = getLowStockAlerts(products);
    if (lowStock.length > 0) {
      setShowLowStockModal(true);
    }
  }, [products]);

  const handleGoToInventoryFromAlert = () => {
    setShowLowStockModal(false);
    if (userSession && canAccessModule(userSession.role, 'inventario')) {
      setActiveModuleState('inventario');
      setActiveSubmodule('productos-fisicos');
    }
  };

  const [rbacNotif, setRbacNotif] = useState<{ isOpen: boolean; message: string }>({ isOpen: false, message: '' });

  const handleSetActiveModule = useCallback((mod: ActiveModule) => {
    if (userSession && !canAccessModule(userSession.role, mod)) {
      setRbacNotif({ isOpen: true, message: `Su rol (${userSession.roleLabel}) no tiene permisos para acceder a este módulo.` });
      return;
    }
    const nav = resolveNavigationState(mod);
    setActiveModuleState(nav.module);
    setActiveSubmodule(nav.submodule);
  }, [userSession]);

  const handleToggleSidebar = useCallback(() => {
    setIsSidebarCollapsed(prev => !prev);
  }, []);

  // Handlers
  const handleAddClinicalNote = (data: { notes: string; prescription?: string }) => {
    const newNote: ClinicalNote = {
      id: 'note-' + Date.now(),
      patientId: selectedPatient.id,
      date: new Date().toISOString(),
      vetName: 'Dr. J. Silva',
      notes: data.notes,
      prescription: data.prescription
    };
    setClinicalNotes([newNote, ...clinicalNotes]);
  };

  const handleSaveFullConsultation = (data: {
    patientId: string;
    vetName: string;
    notes: string;
    prescription?: string;
    attachments?: string[];
  }) => {
    const newNote: ClinicalNote = {
      id: 'note-' + Date.now(),
      patientId: data.patientId,
      date: new Date().toISOString(),
      vetName: data.vetName,
      notes: data.notes,
      prescription: data.prescription,
      attachments: data.attachments
    };
    setClinicalNotes([newNote, ...clinicalNotes]);
    setActiveModuleState('clinica');
    setActiveSubmodule('fichas-medicas');
  };

  const handleAddVaccineToCatalog = (name: string, frequencyDays: number) => {
    const newItem: VaccineCatalogItem = {
      id: 'vac-' + Date.now(),
      name,
      frequencyDays
    };
    setVaccineCatalog([...vaccineCatalog, newItem]);
  };

  const handleRegisterDosis = (data: { vaccineId: string; applicationDate: string; vetName: string; batch?: string }) => {
    const vac = vaccineCatalog.find(v => v.id === data.vaccineId);
    if (!vac) return;

    const newDosis = createDosisRecord(selectedPatient.id, vac, data.applicationDate, data.vetName, undefined, data.batch);
    setVaccineDoses([newDosis, ...vaccineDoses]);
  };

  const handleAddMedicalAppointment = (app: Omit<MedicalAppointment, 'id'>) => {
    const newApp: MedicalAppointment = {
      ...app,
      id: 'app-' + Date.now()
    };
    setMedicalAppointments([...medicalAppointments, newApp]);
  };

  const handleAddGroomingAppointment = (app: Omit<GroomingAppointment, 'id'>) => {
    const newApp: GroomingAppointment = {
      ...app,
      id: 'groom-' + Date.now()
    };
    setGroomingAppointments([...groomingAppointments, newApp]);
  };

  const handleAddStockEntry = (productId: string, quantity: number, provider?: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const { updatedProduct } = recordStockEntry(product, quantity, provider);
    setProducts(products.map(p => p.id === productId ? updatedProduct : p));
  };

  const handleAddProduct = (newProduct: Omit<Product, 'id'>) => {
    const product: Product = {
      ...newProduct,
      id: 'prod-' + Date.now()
    };
    setProducts([...products, product]);
  };

  const handleAdjustStock = (productId: string, newStock: number, reason: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const { updatedProduct } = recordStockAdjustment(product, newStock, reason);
    setProducts(products.map(p => p.id === productId ? updatedProduct : p));
  };

  const handleAddPatient = (patientData: {
    name: string;
    species: any;
    breed: string;
    sex: any;
    birthDate: string;
    ownerName: string;
    ownerPhone?: string;
    weightKg?: number;
    alerts?: string[];
  }) => {
    const newPat = createNewPatientRecord(patientData);
    setPatients([newPat, ...patients]);
    setSelectedPatient(newPat);
  };

  const handleAddSupplierBill = (billData: Omit<SupplierBill, 'id'>) => {
    const bill = createSupplierBillRecord(billData);
    setSupplierBills([bill, ...supplierBills]);
  };

  const handleAddSupplierQuote = (quoteData: Omit<SupplierQuote, 'id'>) => {
    const quote = createSupplierQuoteRecord(quoteData);
    setSupplierQuotes([quote, ...supplierQuotes]);
  };

  const handleUpdateMonthlyBudget = (monthKey: string, budgetAmount: number) => {
    setMonthlyBudgets(prev => ({
      ...prev,
      [monthKey]: budgetAmount
    }));
  };

  const handleAddExpense = (expenseData: Omit<ExpenseRecord, 'id'>) => {
    const newExp = createExpenseRecord(expenseData);
    setExpenses([newExp, ...expenses]);
  };

  const handleUpdateExpense = (id: string, updatedData: Omit<ExpenseRecord, 'id'>) => {
    setExpenses(prev => prev.map(e => e.id === id ? { ...updatedData, id } : e));
  };

  const handleNavigateToBillingFromAppointment = useCallback((patientId: string, _serviceName: string, _amount: number) => {
    const pat = patients.find(p => p.id === patientId);
    if (pat) {
      setSelectedPatient(pat);
    }
    setActiveModuleState('cobros');
    setActiveSubmodule('nueva-facturacion');
  }, [patients]);

  const handleDeleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const handleDuplicateExpense = (id: string) => {
    const target = expenses.find(e => e.id === id);
    if (!target) return;
    const duplicated = createExpenseRecord({
      date: target.date,
      responsible: target.responsible,
      category: target.category,
      allocation: target.allocation,
      paymentMethod: target.paymentMethod,
      description: `${target.description} (Copia)`,
      amount: target.amount,
      note: target.note
    });
    setExpenses([duplicated, ...expenses]);
  };

  const handleCheckout = (data: {
    patientId?: string;
    patientName?: string;
    ownerName?: string;
    documentType: DocumentType;
    paymentMethod: PaymentMethod;
    isAfip: boolean;
    items: BillItem[];
  }) => {
    const pat = patients.find(p => p.id === data.patientId) || selectedPatient;
    const result = processCheckout({
      patientId: pat.id,
      patientName: pat.name,
      ownerName: pat.ownerName,
      documentType: data.documentType,
      emitAfip: data.isAfip,
      paymentMethod: data.paymentMethod,
      items: data.items,
      productsCatalog: products
    });
    setReceipts([result.receipt, ...receipts]);
    setProducts(result.updatedProducts);
    setRbacNotif({
      isOpen: true,
      message: `¡Cobro emitido exitosamente! Comprobante N° ${result.receipt.receiptNumber} ${result.receipt.afipCae ? ' (CAE AFIP: ' + result.receipt.afipCae + ')' : ''}`
    });
  };

  const handleNavigateFromShortcut = (target: string) => {
    const nav = resolveShortcutNavigationTarget(target);
    setActiveModuleState(nav.module);
    setActiveSubmodule(nav.submodule);
  };

  if (!userSession) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-surface-container-low text-on-surface flex flex-col font-body-md antialiased overflow-hidden">
      {/* Fixed Header with Top Submodules */}
      <Header
        activeModule={activeModule}
        activeSubmodule={activeSubmodule}
        setActiveSubmodule={setActiveSubmodule}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isSidebarCollapsed={isSidebarCollapsed}
        lowStockCount={getLowStockAlerts(products).length}
        onToggleAlerts={() => setShowLowStockModal(prev => !prev)}
      />

      {/* Fixed Left Sidebar with Main Modules */}
      <Sidebar
        activeModule={activeModule}
        setActiveModule={handleSetActiveModule}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
        userName={userSession.name}
        userRole={userSession.roleLabel}
        userRoleType={userSession.role}
        onLogout={() => setUserSession(null)}
      />

      {/* Main Layout Area (Pegado directamente a la barra lateral) */}
      <div className={`pt-16 h-screen w-full overflow-hidden flex flex-col transition-all duration-300 ${
        isSidebarCollapsed ? 'pl-16' : 'pl-64'
      }`}>
        {/* Dynamic Main Workspace Container */}
        <main className="flex-1 h-full overflow-hidden flex flex-col p-md bg-surface-container-low">
          {/* Module: Proveedores */}
          {activeModule === 'proveedores' && (
            <SuppliersView
              bills={supplierBills}
              quotes={supplierQuotes}
              expenses={expenses}
              monthlyBudgets={monthlyBudgets}
              activeSubModule={activeSubmodule === 'presupuestos' ? 'presupuestos' : 'facturas'}
              onAddBill={handleAddSupplierBill}
              onAddQuote={handleAddSupplierQuote}
              onUpdateMonthlyBudget={handleUpdateMonthlyBudget}
              onAddExpense={handleAddExpense}
              onUpdateExpense={handleUpdateExpense}
              onDeleteExpense={handleDeleteExpense}
              onDuplicateExpense={handleDuplicateExpense}
            />
          )}

          {/* Module: Clínica */}
          {activeModule === 'clinica' && (
            <>
              {activeSubmodule === 'fichas-medicas' && (
                <NewConsultationView
                  patients={patients}
                  selectedPatient={selectedPatient}
                  onSaveConsultation={handleSaveFullConsultation}
                  onCancel={() => handleSetActiveModule('clinica')}
                />
              )}

              {activeSubmodule === 'vacunas' && (
                <VaccinesView
                  isGeneralCatalog={true}
                  selectedPatient={selectedPatient}
                  vaccineCatalog={vaccineCatalog}
                  onAddVaccineToCatalog={handleAddVaccineToCatalog}
                  vaccineDoses={vaccineDoses}
                  onRegisterDosis={handleRegisterDosis}
                  onScheduleAppointment={() => {
                    setActiveModuleState('clinica');
                    setActiveSubmodule('calendario-clinica');
                  }}
                />
              )}

              {activeSubmodule === 'calendario-clinica' && (
                <AgendaView
                  patients={patients}
                  medicalAppointments={medicalAppointments}
                  onAddMedicalAppointment={handleAddMedicalAppointment}
                  groomingAppointments={groomingAppointments}
                  groomingServices={groomingServices}
                  onAddGroomingAppointment={handleAddGroomingAppointment}
                  onNavigateToBilling={handleNavigateToBillingFromAppointment}
                  fixedMode="medica"
                />
              )}
            </>
          )}

          {/* Module: Peluquería */}
          {activeModule === 'peluqueria' && (
            <AgendaView
              patients={patients}
              medicalAppointments={medicalAppointments}
              onAddMedicalAppointment={handleAddMedicalAppointment}
              groomingAppointments={groomingAppointments}
              groomingServices={groomingServices}
              onAddGroomingAppointment={handleAddGroomingAppointment}
              onNavigateToBilling={handleNavigateToBillingFromAppointment}
              fixedMode="peluqueria"
            />
          )}

          {/* Module: Pacientes */}
          {activeModule === 'pacientes' && (
            <>
              {activeSubmodule === 'control-vacunas' && (
                <VaccinesView
                  isGeneralCatalog={false}
                  patients={patients}
                  selectedPatient={selectedPatient}
                  onSelectPatient={setSelectedPatient}
                  vaccineCatalog={vaccineCatalog}
                  onAddVaccineToCatalog={handleAddVaccineToCatalog}
                  vaccineDoses={vaccineDoses}
                  onRegisterDosis={handleRegisterDosis}
                  onScheduleAppointment={() => {
                    setActiveModuleState('clinica');
                    setActiveSubmodule('calendario-clinica');
                  }}
                />
              )}

              {activeSubmodule === 'tutores' && (
                <TutoresView
                  patients={patients}
                  onUpdatePatients={setPatients}
                />
              )}

              {activeSubmodule === 'ficha-pacientes' && (
                <PatientProfileView
                  patients={patients}
                  selectedPatient={selectedPatient}
                  onSelectPatient={setSelectedPatient}
                  clinicalNotes={clinicalNotes}
                  onAddClinicalNote={handleAddClinicalNote}
                  vaccineDoses={vaccineDoses}
                  onNavigateToTab={handleNavigateFromShortcut}
                  onAddPatient={handleAddPatient}
                />
              )}
            </>
          )}

          {/* Module: Inventario */}
          {activeModule === 'inventario' && (
            <StockControlView
              products={products}
              servicesCatalog={servicesCatalog}
              activeSubmodule={activeSubmodule === 'servicios-catalogo' ? 'servicios-catalogo' : 'productos-fisicos'}
              onAddStockEntry={handleAddStockEntry}
              onAddProduct={handleAddProduct}
              onAdjustStock={handleAdjustStock}
              onUpdateServicesCatalog={setServicesCatalog}
            />
          )}

          {/* Module: Cobros */}
          {activeModule === 'cobros' && (
            <CobrosView
              patients={patients}
              selectedPatient={selectedPatient}
              receipts={receipts}
              activeSubmodule={activeSubmodule}
              onCheckout={handleCheckout}
              onNavigateToHistorial={() => setActiveSubmodule('historial-cobros')}
            />
          )}
        </main>
      </div>

      {/* Low Stock Automatic Alert Modal on Entry */}
      {showLowStockModal && (
        <LowStockAlertModal
          lowStockProducts={getLowStockAlerts(products)}
          onClose={() => setShowLowStockModal(false)}
          onGoToInventory={handleGoToInventoryFromAlert}
        />
      )}

      <AppNotificationModal
        isOpen={rbacNotif.isOpen}
        message={rbacNotif.message}
        type="warning"
        title="Acceso Restringido"
        onClose={() => setRbacNotif({ isOpen: false, message: '' })}
      />
    </div>
  );
};
