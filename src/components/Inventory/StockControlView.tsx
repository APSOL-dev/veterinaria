import React, { useState } from 'react';
import { Product, ProductCategory, ServiceCatalogItem, SupplierBill } from '../../domain/types';
import { updateServicePrice, toggleServiceStatus, getPriceUpdateStatusInfo } from '../../domain/services/serviceCatalogService';
import { AppConfirmModal } from '../Common/AppConfirmModal';
import { NewInvoiceDrawer } from '../Suppliers/NewInvoiceDrawer';

interface StockControlViewProps {
  products: Product[];
  servicesCatalog: ServiceCatalogItem[];
  activeSubmodule: 'productos-fisicos' | 'servicios-catalogo';
  onAddStockEntry: (productId: string, quantity: number, provider?: string) => void;
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onUpdateProduct?: (id: string, product: Partial<Product>) => void;
  onDeleteProduct?: (id: string) => void;
  onAddServiceCatalogItem?: (item: Omit<ServiceCatalogItem, 'id'>) => void;
  onUpdateServiceCatalogItem?: (id: string, item: Partial<ServiceCatalogItem>) => void;
  onDeleteServiceCatalogItem?: (id: string) => void;
  onAdjustStock: (productId: string, newStock: number, reason: string) => void;
  onUpdateServicesCatalog: (services: ServiceCatalogItem[]) => void;
  onAddBill?: (bill: Omit<SupplierBill, 'id'>) => void;
}

export const StockControlView: React.FC<StockControlViewProps> = ({
  products,
  servicesCatalog,
  activeSubmodule,
  onAddStockEntry,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onAddServiceCatalogItem,
  onUpdateServiceCatalogItem,
  onDeleteServiceCatalogItem,
  onAdjustStock,
  onUpdateServicesCatalog,
  onAddBill
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [showInvoiceDrawer, setShowInvoiceDrawer] = useState(false);
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; type: 'product' | 'service'; id: string; name: string }>({
    isOpen: false,
    type: 'product',
    id: '',
    name: ''
  });
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceCatalogItem | null>(null);
  const [newServicePrice, setNewServicePrice] = useState(0);

  // Service form state
  const [serviceFormName, setServiceFormName] = useState('');
  const [serviceFormCategory, setServiceFormCategory] = useState('clinica');
  const [serviceFormDesc, setServiceFormDesc] = useState('');
  const [serviceFormPrice, setServiceFormPrice] = useState(10000);
  const [serviceFormFrequency, setServiceFormFrequency] = useState<number>(30);

  // Edit product form state
  const [editSku, setEditSku] = useState('');
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<ProductCategory>('Medicamentos');
  const [editPrice, setEditPrice] = useState(0);
  const [editMinStock, setEditMinStock] = useState(5);

  // Stock Entry form state
  const [entryProductId, setEntryProductId] = useState(products[0]?.id || '');
  const [entryQty, setEntryQty] = useState(10);
  const [entryProvider, setEntryProvider] = useState('');

  // Adjust stock form state
  const [adjustNewStock, setAdjustNewStock] = useState(0);
  const [adjustReason, setAdjustReason] = useState('Rotura / Insumo usado');

  // New product form state
  const [newSku, setNewSku] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<ProductCategory>('Medicamentos');
  const [newInitialStock, setNewInitialStock] = useState(10);
  const [newMinStock, setNewMinStock] = useState(5);
  const [newPrice, setNewPrice] = useState(15000);

  const handleOpenEditProduct = (prod: Product) => {
    setSelectedProduct(prod);
    setEditSku(prod.sku || '');
    setEditName(prod.name);
    setEditCategory(prod.category);
    setEditPrice(prod.price);
    setEditMinStock(prod.minStock);
    setShowEditProductModal(true);
  };

  const handleEditProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !editName.trim()) return;
    if (onUpdateProduct) {
      onUpdateProduct(selectedProduct.id, {
        sku: editSku,
        name: editName,
        category: editCategory,
        price: editPrice,
        minStock: editMinStock
      });
    }
    setShowEditProductModal(false);
  };

  const handleOpenNewService = () => {
    setSelectedService(null);
    setServiceFormName('');
    setServiceFormCategory('clinica');
    setServiceFormDesc('');
    setServiceFormPrice(10000);
    setServiceFormFrequency(30);
    setShowServiceModal(true);
  };

  const handleOpenEditService = (srv: ServiceCatalogItem) => {
    setSelectedService(srv);
    setServiceFormName(srv.name);
    setServiceFormCategory(srv.category);
    setServiceFormDesc(srv.description || '');
    setServiceFormPrice(srv.price);
    setServiceFormFrequency(srv.updateFrequencyDays || 30);
    setShowServiceModal(true);
  };

  const handleServiceFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceFormName.trim()) return;
    if (selectedService) {
      if (onUpdateServiceCatalogItem) {
        onUpdateServiceCatalogItem(selectedService.id, {
          name: serviceFormName,
          category: serviceFormCategory as any,
          description: serviceFormDesc,
          price: serviceFormPrice,
          updateFrequencyDays: serviceFormFrequency
        });
      }
    } else {
      if (onAddServiceCatalogItem) {
        onAddServiceCatalogItem({
          name: serviceFormName,
          category: serviceFormCategory as any,
          description: serviceFormDesc,
          quantity: 1,
          isActive: true,
          price: serviceFormPrice,
          updateFrequencyDays: serviceFormFrequency,
          priceLastUpdated: new Date().toISOString().substring(0, 10)
        });
      }
    }
    setShowServiceModal(false);
  };
  const [newBarcode, setNewBarcode] = useState('');

  const categories = ['Todos', 'Medicamentos', 'Alimentación', 'Accesorios', 'Insumos Clínicos'];

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
    const matchesQuery = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchQuery));
    return matchesCategory && matchesQuery;
  });

  const handleOpenEntryModal = () => {
    setEntryProductId(entryProductId || products[0]?.id || '');
    setEntryQty(10);
    setShowEntryModal(true);
  };

  const handleStockEntrySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = entryProductId || products[0]?.id;
    if (!targetId || entryQty <= 0) return;
    onAddStockEntry(targetId, Number(entryQty), entryProvider || undefined);
    setEntryProvider('');
    setShowEntryModal(false);
  };

  const handleNewProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onAddProduct({
      sku: newSku || `VET-PRD-${Math.floor(100 + Math.random() * 900)}`,
      name: newName,
      category: newCategory,
      currentStock: Number(newInitialStock),
      minStock: Number(newMinStock),
      price: Number(newPrice),
      barcode: newBarcode || undefined
    });
    setNewName('');
    setNewSku('');
    setNewBarcode('');
    setShowNewProductModal(false);
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    onAdjustStock(selectedProduct.id, Number(adjustNewStock), adjustReason);
    setShowAdjustModal(false);
  };

  const handleToggleService = (srv: ServiceCatalogItem) => {
    const updated = servicesCatalog.map(s => s.id === srv.id ? toggleServiceStatus(s) : s);
    onUpdateServicesCatalog(updated);
  };

  const handleUpdatePriceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || newServicePrice <= 0) return;
    const updated = servicesCatalog.map(s => s.id === selectedService.id ? updateServicePrice(s, Number(newServicePrice)) : s);
    onUpdateServicesCatalog(updated);
    setShowPriceModal(false);
  };

  return (
    <div className="flex flex-col w-full gap-md">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-md">
        <div className="flex flex-col">
          <h1 className="font-display-lg text-[22px] text-slate-900 leading-tight font-bold">
            {activeSubmodule === 'productos-fisicos' ? 'Inventario — Productos Físicos' : 'Inventario — Catálogo de Servicios'}
          </h1>
          <p className="font-body-md text-xs text-slate-600 font-medium mt-0.5">
            {activeSubmodule === 'productos-fisicos'
              ? 'Gestión de stock, insumos clínicos y reposición de mercadería'
              : 'Gestión de prestaciones médicas y servicios de peluquería (Precios y Estado)'}
          </p>
        </div>
        {activeSubmodule === 'productos-fisicos' ? (
          <div className="flex items-center gap-sm">
            <button
              onClick={handleOpenEntryModal}
              className="bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors px-4 py-2.5 rounded-xl font-label-md text-xs flex items-center gap-1.5 shadow-sm font-semibold cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">inventory_2</span>
              <span>Entrada manual</span>
            </button>
            <button
              onClick={() => setShowInvoiceDrawer(true)}
              className="bg-[#5C3C7B] text-white hover:bg-[#4A2F66] transition-colors px-4 py-2.5 rounded-xl font-label-md text-xs flex items-center gap-1.5 shadow-sm font-semibold cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">receipt_long</span>
              <span>Entrada con factura</span>
            </button>
            <button
              onClick={() => setShowNewProductModal(true)}
              className="bg-primary text-on-primary hover:bg-primary-container transition-all px-4 py-2.5 rounded-xl font-label-md text-xs flex items-center gap-1.5 shadow-sm font-semibold cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Nuevo producto</span>
            </button>
          </div>
        ) : (
          <button
            onClick={handleOpenNewService}
            className="bg-primary text-on-primary hover:bg-primary-container transition-all px-4 py-2.5 rounded-xl font-label-md text-xs flex items-center gap-1.5 shadow-sm font-semibold cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>Nuevo servicio / prestación</span>
          </button>
        )}
      </div>

      {/* Main Container */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 flex-1 overflow-hidden p-md">
        {activeSubmodule === 'productos-fisicos' ? (
          <div className="flex flex-col gap-md h-full">
            {/* Search & Categories Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-sm">
              <div className="bg-surface-container rounded-xl p-xs flex items-center w-full sm:w-80 border border-outline-variant/30">
                <span className="material-symbols-outlined text-on-surface-variant ml-sm mr-xs text-[18px]">search</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por nombre, SKU..."
                  className="bg-transparent text-xs text-on-surface outline-none w-full font-medium"
                />
              </div>

              <div className="flex items-center gap-xs overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                {categories.map((cat) => {
                  const isSelected = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-primary text-on-primary shadow-xs'
                          : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Products Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-body-md text-xs">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-[11px] font-semibold">
                    <th className="p-sm px-md rounded-tl-lg">SKU / código</th>
                    <th className="p-sm px-md">Producto</th>
                    <th className="p-sm px-md">Categoría</th>
                    <th className="p-sm px-md text-right">Stock actual</th>
                    <th className="p-sm px-md text-right">Min.</th>
                    <th className="p-sm px-md text-right">Precio</th>
                    <th className="p-sm px-md text-center">Estado</th>
                    <th className="p-sm px-md rounded-tr-lg text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="text-on-surface">
                  {filteredProducts.map((p) => {
                    const isOutOfStock = p.currentStock === 0;
                    const isLowStock = p.currentStock > 0 && p.currentStock <= p.minStock;

                    return (
                      <tr key={p.id} className="bg-surface-container-lowest hover:bg-surface-container transition-colors group border-b border-surface-container-low">
                        <td className="p-sm px-md font-mono text-[11px] text-on-surface-variant">{p.sku}</td>
                        <td className="p-sm px-md font-semibold text-primary">
                          {p.name}
                          {p.barcode && <div className="text-[10px] text-on-surface-variant font-mono">BC: {p.barcode}</div>}
                        </td>
                        <td className="p-sm px-md">
                          <span className="inline-flex items-center gap-1 bg-surface-container-high text-on-surface px-2 py-0.5 rounded text-[11px] font-medium">
                            {p.category}
                          </span>
                        </td>
                        <td className={`p-sm px-md text-right font-semibold ${
                          isOutOfStock ? 'text-error' : isLowStock ? 'text-[#E65100]' : 'text-on-surface'
                        }`}>
                          {p.currentStock}
                        </td>
                        <td className="p-sm px-md text-right text-on-surface-variant">{p.minStock}</td>
                        <td className="p-sm px-md text-right font-medium">${p.price.toLocaleString('es-AR')}</td>
                        <td className="p-sm px-md text-center">
                          {!isLowStock && !isOutOfStock && (
                            <span className="inline-flex px-2.5 py-0.5 bg-[#E8F5E9] text-[#1B5E20] rounded-full text-[10px] font-semibold">
                              OK
                            </span>
                          )}
                          {isLowStock && (
                            <span className="inline-flex px-2.5 py-0.5 bg-[#FFF3E0] text-[#E65100] rounded-full text-[10px] font-semibold">
                              Stock bajo
                            </span>
                          )}
                          {isOutOfStock && (
                            <span className="inline-flex px-2.5 py-0.5 bg-error-container text-on-error-container rounded-full text-[10px] font-semibold">
                              Sin stock
                            </span>
                          )}
                        </td>
                        <td className="p-sm px-md text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => { setSelectedProduct(p); setAdjustNewStock(p.currentStock); setShowAdjustModal(true); }}
                              className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded-lg transition-colors cursor-pointer"
                              title="Ajustar Stock"
                            >
                              <span className="material-symbols-outlined text-[16px]">tune</span>
                            </button>
                            <button
                              onClick={() => handleOpenEditProduct(p)}
                              className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded-lg transition-colors cursor-pointer"
                              title="Editar Producto"
                            >
                              <span className="material-symbols-outlined text-[16px]">edit</span>
                            </button>
                            {onDeleteProduct && (
                              <button
                                onClick={() => setDeleteConfirm({ isOpen: true, type: 'product', id: p.id, name: p.name })}
                                className="p-1.5 text-on-surface-variant hover:text-error hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="Eliminar Producto del Catálogo"
                              >
                                <span className="material-symbols-outlined text-[16px]">delete</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Services Catalog Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-body-md text-xs">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-[11px] font-semibold">
                  <th className="p-sm px-md">Categoría</th>
                  <th className="p-sm px-md">Servicio</th>
                  <th className="p-sm px-md">Descripción</th>
                  <th className="p-sm px-md text-center">Cantidad</th>
                  <th className="p-sm px-md text-center">Estado</th>
                  <th className="p-sm px-md text-right">Precio actual</th>
                  <th className="p-sm px-md text-center">Última actualización</th>
                  <th className="p-sm px-md text-center">Frecuencia / Vencimiento</th>
                  <th className="p-sm px-md text-center">Última venta</th>
                  <th className="p-sm px-md text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-on-surface">
                {servicesCatalog.map((srv) => {
                  const statusInfo = getPriceUpdateStatusInfo(srv.priceLastUpdated, srv.updateFrequencyDays || 30);
                  return (
                    <tr key={srv.id} className="bg-surface-container-lowest hover:bg-surface-container transition-colors group border-b border-surface-container-low">
                      <td className="p-sm px-md font-medium text-primary capitalize">{srv.category}</td>
                      <td className="p-sm px-md font-semibold text-on-surface">{srv.name}</td>
                      <td className="p-sm px-md text-on-surface-variant max-w-xs truncate">{srv.description}</td>
                      <td className="p-sm px-md text-center font-medium">{srv.quantity}</td>
                      <td className="p-sm px-md text-center">
                        <button
                          onClick={() => handleToggleService(srv)}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold cursor-pointer transition-all ${
                            srv.isActive ? 'bg-[#E8F5E9] text-[#27AE60]' : 'bg-[#FDEDEC] text-[#C0392B]'
                          }`}
                          title="Clic para cambiar estado Activo/Inactivo"
                        >
                          {srv.isActive ? 'Activo' : 'Inactivo'}
                        </button>
                      </td>
                      <td className="p-sm px-md text-right font-semibold text-primary">${srv.price.toLocaleString('es-AR')}</td>
                      <td className="p-sm px-md text-center text-on-surface-variant">{srv.priceLastUpdated}</td>
                      <td className="p-sm px-md text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-[10px] text-slate-500 font-medium">
                            Cada {srv.updateFrequencyDays || 30} días
                          </span>
                          {statusInfo.isExpired ? (
                            <span className="inline-flex px-2 py-0.5 bg-[#FDEDEC] text-[#C0392B] border border-red-200 rounded-full text-[10px] font-semibold" title={`Vencido (hoy > última actualización + ${srv.updateFrequencyDays || 30} días)`}>
                              Vencido ({statusInfo.daysDifference}d)
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-0.5 bg-[#E8F5E9] text-[#27AE60] border border-green-200 rounded-full text-[10px] font-semibold" title="Precio actualizado dentro de la frecuencia recomendada">
                              Vigente
                            </span>
                          )}
                        </div>
                      </td>
                    <td className="p-sm px-md text-center text-on-surface-variant">{srv.lastSoldAt || 'Sin ventas'}</td>
                    <td className="p-sm px-md text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEditService(srv)}
                          className="px-2.5 py-1.5 bg-surface-container-high hover:bg-primary hover:text-white rounded-lg text-[11px] font-semibold transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                          title="Editar servicio / precio"
                        >
                          <span className="material-symbols-outlined text-[14px]">edit</span>
                          <span>Editar</span>
                        </button>
                        {onDeleteServiceCatalogItem && (
                          <button
                            onClick={() => setDeleteConfirm({ isOpen: true, type: 'service', id: srv.id, name: srv.name })}
                            className="p-1.5 bg-red-50 text-error hover:bg-red-100 rounded-lg text-[11px] font-semibold transition-all shadow-2xs cursor-pointer"
                            title="Eliminar servicio del catálogo"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showEntryModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-md">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-lg shadow-xl flex flex-col gap-md">
            <div className="flex justify-between items-center border-b pb-sm">
              <h3 className="font-headline-sm text-primary text-base font-semibold">Registrar entrada de mercadería</h3>
              <button onClick={() => setShowEntryModal(false)} className="text-on-surface-variant hover:text-error cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleStockEntrySubmit} className="flex flex-col gap-xs text-xs">
              <label className="font-semibold text-xs text-slate-700 block">Seleccionar producto</label>
              <select
                value={entryProductId}
                onChange={(e) => setEntryProductId(e.target.value)}
                className="bg-surface-container border-none rounded-xl p-sm outline-none text-on-surface text-xs focus:ring-2 focus:ring-secondary cursor-pointer font-medium"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Stock actual: {p.currentStock})
                  </option>
                ))}
              </select>

              <label className="font-semibold text-xs text-slate-700 block mt-xs">Cantidad recibida</label>
              <input
                type="number"
                value={entryQty}
                onChange={(e) => setEntryQty(Number(e.target.value))}
                min={1}
                required
                className="bg-surface-container border-none rounded-xl p-sm outline-none text-on-surface text-xs focus:ring-2 focus:ring-secondary font-medium"
              />

              <button type="submit" className="bg-primary text-on-primary py-2.5 rounded-xl font-semibold text-xs mt-md hover:bg-primary-container cursor-pointer shadow-sm">
                Confirmar ingreso
              </button>
            </form>
          </div>
        </div>
      )}

      {showAdjustModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-md">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-lg shadow-xl flex flex-col gap-md">
            <div className="flex justify-between items-center border-b pb-sm">
              <h3 className="font-headline-sm text-primary text-base font-semibold">Ajuste manual de stock</h3>
              <button onClick={() => setShowAdjustModal(false)} className="text-on-surface-variant hover:text-error cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="flex flex-col gap-xs text-xs">
              <p className="font-body-md text-on-surface font-semibold text-sm">{selectedProduct.name}</p>

              <label className="font-semibold text-xs text-slate-700 block mt-xs">Nuevo stock</label>
              <input
                type="number"
                value={adjustNewStock}
                onChange={(e) => setAdjustNewStock(Number(e.target.value))}
                min={0}
                required
                className="bg-surface-container border-none rounded-xl p-sm outline-none text-on-surface text-xs focus:ring-2 focus:ring-secondary font-medium"
              />

              <button type="submit" className="bg-secondary text-on-secondary py-2.5 rounded-xl font-semibold text-xs mt-md hover:bg-primary cursor-pointer shadow-sm">
                Guardar ajuste
              </button>
            </form>
          </div>
        </div>
      )}

      {showPriceModal && selectedService && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-md">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-lg shadow-xl flex flex-col gap-md">
            <div className="flex justify-between items-center border-b pb-sm">
              <h3 className="font-headline-sm text-primary text-base font-semibold">Actualizar precio de servicio</h3>
              <button onClick={() => setShowPriceModal(false)} className="text-on-surface-variant hover:text-error cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleUpdatePriceSubmit} className="flex flex-col gap-xs text-xs">
              <p className="font-body-md text-on-surface font-semibold text-sm">{selectedService.name}</p>
              <p className="font-body-md text-on-surface-variant text-xs font-medium">{selectedService.description}</p>

              <label className="font-semibold text-xs text-slate-700 block mt-xs">Nuevo precio ($)</label>
              <input
                type="number"
                value={newServicePrice}
                onChange={(e) => setNewServicePrice(Number(e.target.value))}
                min={1}
                required
                className="bg-surface-container border-none rounded-xl p-sm outline-none text-on-surface text-xs focus:ring-2 focus:ring-secondary font-semibold text-base"
              />

              <button type="submit" className="bg-primary text-on-primary py-2.5 rounded-xl font-semibold text-xs mt-md hover:bg-primary-container shadow-sm cursor-pointer">
                Guardar precio y actualizar fecha
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditProductModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-md">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-lg shadow-xl flex flex-col gap-md">
            <div className="flex justify-between items-center border-b pb-sm">
              <h3 className="font-headline-sm text-primary text-base font-semibold">Editar producto del inventario</h3>
              <button onClick={() => setShowEditProductModal(false)} className="text-on-surface-variant hover:text-error cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleEditProductSubmit} className="flex flex-col gap-xs text-xs">
              <label className="font-semibold text-xs text-slate-700 block">Código SKU</label>
              <input
                type="text"
                value={editSku}
                onChange={(e) => setEditSku(e.target.value)}
                className="bg-surface-container border-none rounded-xl p-sm outline-none text-on-surface text-xs focus:ring-2 focus:ring-secondary font-medium"
              />

              <label className="font-semibold text-xs text-slate-700 block mt-xs">Nombre del producto *</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                className="bg-surface-container border-none rounded-xl p-sm outline-none text-on-surface text-xs focus:ring-2 focus:ring-secondary font-medium"
              />

              <label className="font-semibold text-xs text-slate-700 block mt-xs">Categoría *</label>
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value as ProductCategory)}
                className="bg-surface-container border-none rounded-xl p-sm outline-none text-on-surface text-xs focus:ring-2 focus:ring-secondary cursor-pointer font-medium"
              >
                <option value="Medicamentos">Medicamentos</option>
                <option value="Alimentación">Alimentación</option>
                <option value="Accesorios">Accesorios</option>
                <option value="Insumos Clínicos">Insumos Clínicos</option>
              </select>

              <label className="font-semibold text-xs text-slate-700 block mt-xs">Precio de venta ($) *</label>
              <input
                type="number"
                value={editPrice}
                onChange={(e) => setEditPrice(Number(e.target.value))}
                min={0}
                required
                className="bg-surface-container border-none rounded-xl p-sm outline-none text-on-surface text-xs focus:ring-2 focus:ring-secondary font-medium"
              />

              <label className="font-semibold text-xs text-slate-700 block mt-xs">Stock mínimo (Alerta)</label>
              <input
                type="number"
                value={editMinStock}
                onChange={(e) => setEditMinStock(Number(e.target.value))}
                min={0}
                required
                className="bg-surface-container border-none rounded-xl p-sm outline-none text-on-surface text-xs focus:ring-2 focus:ring-secondary font-medium"
              />

              <button type="submit" className="bg-primary text-on-primary py-2.5 rounded-xl font-semibold text-xs mt-md hover:bg-primary-container shadow-sm cursor-pointer">
                Guardar cambios del producto
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Service Catalog Add/Edit Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-md">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-lg shadow-xl flex flex-col gap-md">
            <div className="flex justify-between items-center border-b pb-sm">
              <h3 className="font-headline-sm text-primary text-base font-semibold">
                {selectedService ? 'Editar servicio / prestación' : 'Nuevo servicio / prestación'}
              </h3>
              <button onClick={() => setShowServiceModal(false)} className="text-on-surface-variant hover:text-error cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleServiceFormSubmit} className="flex flex-col gap-xs text-xs">
              <label className="font-semibold text-xs text-slate-700 block">Nombre del servicio *</label>
              <input
                type="text"
                value={serviceFormName}
                onChange={(e) => setServiceFormName(e.target.value)}
                placeholder="Ej. Consulta Especialista, Baño Perros Grandes..."
                required
                className="bg-surface-container border-none rounded-xl p-sm outline-none text-on-surface text-xs focus:ring-2 focus:ring-secondary font-medium"
              />

              <label className="font-semibold text-xs text-slate-700 block mt-xs">Categoría *</label>
              <select
                value={serviceFormCategory}
                onChange={(e) => setServiceFormCategory(e.target.value)}
                className="bg-surface-container border-none rounded-xl p-sm outline-none text-on-surface text-xs focus:ring-2 focus:ring-secondary cursor-pointer font-medium"
              >
                <option value="clinica">Clínica</option>
                <option value="cirugia">Cirugía</option>
                <option value="peluqueria">Peluquería</option>
                <option value="laboratorio">Laboratorio</option>
                <option value="ecografia">Ecografía / Rayos</option>
              </select>

              <label className="font-semibold text-xs text-slate-700 block mt-xs">Descripción</label>
              <textarea
                value={serviceFormDesc}
                onChange={(e) => setServiceFormDesc(e.target.value)}
                rows={2}
                placeholder="Detalle o requisitos de la prestación..."
                className="bg-surface-container border-none rounded-xl p-sm outline-none text-on-surface text-xs focus:ring-2 focus:ring-secondary font-medium"
              />

              <label className="font-semibold text-xs text-slate-700 block mt-xs">Precio ($) *</label>
              <input
                type="number"
                value={serviceFormPrice}
                onChange={(e) => setServiceFormPrice(Number(e.target.value))}
                min={0}
                required
                className="bg-surface-container border-none rounded-xl p-sm outline-none text-on-surface text-xs focus:ring-2 focus:ring-secondary font-semibold text-base"
              />

              <label className="font-semibold text-xs text-slate-700 block mt-xs">Frecuencia de actualización del precio *</label>
              <select
                value={serviceFormFrequency}
                onChange={(e) => setServiceFormFrequency(Number(e.target.value))}
                className="bg-surface-container border-none rounded-xl p-sm outline-none text-on-surface text-xs focus:ring-2 focus:ring-secondary cursor-pointer font-medium"
              >
                <option value={15}>Cada 15 días</option>
                <option value={30}>Cada 30 días (1 mes)</option>
                <option value={60}>Cada 60 días (2 meses)</option>
                <option value={90}>Cada 90 días (3 meses)</option>
                <option value={180}>Cada 180 días (6 meses)</option>
                <option value={365}>Cada 365 días (1 año)</option>
              </select>

              <button type="submit" className="bg-primary text-on-primary py-2.5 rounded-xl font-label-md text-xs mt-md hover:bg-primary-container font-bold shadow-sm cursor-pointer">
                {selectedService ? 'Guardar Cambios del Servicio' : 'Crear Servicio'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AppConfirmModal
        isOpen={deleteConfirm.isOpen}
        title={deleteConfirm.type === 'product' ? 'Confirmar eliminación de producto' : 'Confirmar eliminación de servicio'}
        message={
          deleteConfirm.type === 'product'
            ? `¿Está seguro de que desea eliminar el producto "${deleteConfirm.name}" del inventario?`
            : `¿Está seguro de que desea eliminar el servicio/prestación "${deleteConfirm.name}" del catálogo?`
        }
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        isDanger={true}
        onConfirm={() => {
          if (deleteConfirm.type === 'product' && onDeleteProduct && deleteConfirm.id) {
            onDeleteProduct(deleteConfirm.id);
          } else if (deleteConfirm.type === 'service' && onDeleteServiceCatalogItem && deleteConfirm.id) {
            onDeleteServiceCatalogItem(deleteConfirm.id);
          }
          setDeleteConfirm({ isOpen: false, type: 'product', id: '', name: '' });
        }}
        onCancel={() => setDeleteConfirm({ isOpen: false, type: 'product', id: '', name: '' })}
      />

      {/* Drawer de Entrada con Factura */}
      {showInvoiceDrawer && (
        <NewInvoiceDrawer
          isOpen={showInvoiceDrawer}
          onClose={() => setShowInvoiceDrawer(false)}
          onSaveBill={(billData) => {
            if (onAddBill) onAddBill(billData);
            setShowInvoiceDrawer(false);
          }}
          products={products}
        />
      )}
    </div>
  );
};
