import React, { useState } from 'react';
import { Product, ProductCategory, ServiceCatalogItem } from '../../domain/types';
import { updateServicePrice, toggleServiceStatus } from '../../domain/services/serviceCatalogService';

interface StockControlViewProps {
  products: Product[];
  servicesCatalog: ServiceCatalogItem[];
  activeSubmodule: 'productos-fisicos' | 'servicios-catalogo';
  onAddStockEntry: (productId: string, quantity: number, provider?: string) => void;
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onAdjustStock: (productId: string, newStock: number, reason: string) => void;
  onUpdateServicesCatalog: (services: ServiceCatalogItem[]) => void;
}

export const StockControlView: React.FC<StockControlViewProps> = ({
  products,
  servicesCatalog,
  activeSubmodule,
  onAddStockEntry,
  onAddProduct,
  onAdjustStock,
  onUpdateServicesCatalog
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceCatalogItem | null>(null);
  const [newServicePrice, setNewServicePrice] = useState(0);

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

  const handleStockEntrySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryProductId || entryQty <= 0) return;
    onAddStockEntry(entryProductId, Number(entryQty), entryProvider || undefined);
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
              onClick={() => setShowEntryModal(true)}
              className="bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors px-md py-2 rounded-lg font-label-md text-xs uppercase tracking-wider flex items-center gap-xs shadow-sm font-bold"
            >
              <span className="material-symbols-outlined text-[16px]">inventory_2</span>
              Entrada de Stock
            </button>
            <button
              onClick={() => setShowNewProductModal(true)}
              className="bg-primary text-on-primary hover:bg-primary-container transition-all px-md py-2 rounded-lg font-label-md text-xs uppercase tracking-wider flex items-center gap-xs shadow-sm font-bold"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              Nuevo Producto
            </button>
          </div>
        ) : null}
      </div>

      {/* Main Content Area */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm p-md flex flex-col gap-md border border-outline-variant/30">
        {activeSubmodule === 'productos-fisicos' ? (
          <>
            {/* Search & Categories */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-md">
              <div className="relative w-full max-w-md">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por nombre, SKU o código..."
                  className="w-full bg-surface-container-low text-on-surface placeholder:text-on-surface-variant font-body-md text-xs py-2 pl-9 pr-9 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-container transition-all"
                />
              </div>

              <div className="flex items-center gap-xs overflow-x-auto pb-1 scrollbar-hide w-full md:w-auto">
                {categories.map((cat) => {
                  const isSelected = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1 rounded-full font-label-md text-xs whitespace-nowrap transition-colors ${
                        isSelected
                          ? 'bg-primary text-on-primary shadow-sm font-semibold'
                          : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
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
                  <tr className="bg-surface-container-low text-on-surface-variant font-label-md uppercase text-[10px]">
                    <th className="p-sm px-md rounded-tl-lg">SKU / Código</th>
                    <th className="p-sm px-md">Producto</th>
                    <th className="p-sm px-md">Categoría</th>
                    <th className="p-sm px-md text-right">Stock Actual</th>
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
                          <span className="inline-flex items-center gap-1 bg-surface-container-high text-on-surface px-2 py-0.5 rounded text-[11px]">
                            {p.category}
                          </span>
                        </td>
                        <td className={`p-sm px-md text-right font-bold ${
                          isOutOfStock ? 'text-error' : isLowStock ? 'text-[#E65100]' : 'text-on-surface'
                        }`}>
                          {p.currentStock}
                        </td>
                        <td className="p-sm px-md text-right text-on-surface-variant">{p.minStock}</td>
                        <td className="p-sm px-md text-right">${p.price.toLocaleString('es-AR')}</td>
                        <td className="p-sm px-md text-center">
                          {!isLowStock && !isOutOfStock && (
                            <span className="inline-flex px-2 py-0.5 bg-[#E8F5E9] text-[#1B5E20] rounded-full text-[10px] font-bold uppercase">
                              OK
                            </span>
                          )}
                          {isLowStock && (
                            <span className="inline-flex px-2 py-0.5 bg-[#FFF3E0] text-[#E65100] rounded-full text-[10px] font-bold uppercase">
                              Stock Bajo
                            </span>
                          )}
                          {isOutOfStock && (
                            <span className="inline-flex px-2 py-0.5 bg-error-container text-on-error-container rounded-full text-[10px] font-bold uppercase">
                              Sin Stock
                            </span>
                          )}
                        </td>
                        <td className="p-sm px-md text-right">
                          <button
                            onClick={() => { setSelectedProduct(p); setAdjustNewStock(p.currentStock); setShowAdjustModal(true); }}
                            className="p-1 text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded-full transition-colors opacity-0 group-hover:opacity-100"
                            title="Ajustar Stock"
                          >
                            <span className="material-symbols-outlined text-[16px]">tune</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          /* Services Catalog Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-body-md text-xs">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant font-label-md uppercase text-[10px]">
                  <th className="p-sm px-md">Categoría</th>
                  <th className="p-sm px-md">Servicio</th>
                  <th className="p-sm px-md">Descripción</th>
                  <th className="p-sm px-md text-center">Cantidad</th>
                  <th className="p-sm px-md text-center">Estado</th>
                  <th className="p-sm px-md text-right">Precio Actual</th>
                  <th className="p-sm px-md text-center">Última Actualización</th>
                  <th className="p-sm px-md text-center">Última Venta</th>
                  <th className="p-sm px-md text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-on-surface">
                {servicesCatalog.map((srv) => (
                  <tr key={srv.id} className="bg-surface-container-lowest hover:bg-surface-container transition-colors group border-b border-surface-container-low">
                    <td className="p-sm px-md font-bold text-primary capitalize">{srv.category}</td>
                    <td className="p-sm px-md font-bold text-on-surface">{srv.name}</td>
                    <td className="p-sm px-md text-on-surface-variant max-w-xs truncate">{srv.description}</td>
                    <td className="p-sm px-md text-center font-bold">{srv.quantity}</td>
                    <td className="p-sm px-md text-center">
                      <button
                        onClick={() => handleToggleService(srv)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-all ${
                          srv.isActive ? 'bg-[#E8F5E9] text-[#27AE60]' : 'bg-[#FDEDEC] text-[#C0392B]'
                        }`}
                        title="Clic para cambiar estado Activo/Inactivo"
                      >
                        {srv.isActive ? 'ACTIVO' : 'INACTIVO'}
                      </button>
                    </td>
                    <td className="p-sm px-md text-right font-bold text-primary">${srv.price.toLocaleString('es-AR')}</td>
                    <td className="p-sm px-md text-center text-on-surface-variant">{srv.priceLastUpdated}</td>
                    <td className="p-sm px-md text-center text-on-surface-variant">{srv.lastSoldAt || 'Sin ventas'}</td>
                    <td className="p-sm px-md text-right">
                      <button
                        onClick={() => { setSelectedService(srv); setNewServicePrice(srv.price); setShowPriceModal(true); }}
                        className="px-2 py-1 bg-surface-container-high hover:bg-primary hover:text-white rounded-lg text-[11px] font-bold transition-all shadow-sm"
                      >
                        Actualizar Precio
                      </button>
                    </td>
                  </tr>
                ))}
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
              <h3 className="font-headline-sm text-primary text-base font-bold">Registrar Entrada de Mercadería</h3>
              <button onClick={() => setShowEntryModal(false)} className="text-on-surface-variant hover:text-error">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleStockEntrySubmit} className="flex flex-col gap-xs text-xs">
              <label className="font-label-md text-on-surface-variant uppercase text-[11px]">Seleccionar Producto</label>
              <select
                value={entryProductId}
                onChange={(e) => setEntryProductId(e.target.value)}
                className="bg-surface-container border-none rounded-xl p-sm outline-none text-on-surface text-xs focus:ring-2 focus:ring-secondary"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Stock actual: {p.currentStock})
                  </option>
                ))}
              </select>

              <label className="font-label-md text-on-surface-variant uppercase text-[11px] mt-xs">Cantidad Recibida</label>
              <input
                type="number"
                value={entryQty}
                onChange={(e) => setEntryQty(Number(e.target.value))}
                min={1}
                required
                className="bg-surface-container border-none rounded-xl p-sm outline-none text-on-surface text-xs focus:ring-2 focus:ring-secondary"
              />

              <button type="submit" className="bg-primary text-on-primary py-2 rounded-xl font-label-md text-xs mt-md hover:bg-primary-container">
                Confirmar Ingreso
              </button>
            </form>
          </div>
        </div>
      )}

      {showAdjustModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-md">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-lg shadow-xl flex flex-col gap-md">
            <div className="flex justify-between items-center border-b pb-sm">
              <h3 className="font-headline-sm text-primary text-base font-bold">Ajuste Manual de Stock</h3>
              <button onClick={() => setShowAdjustModal(false)} className="text-on-surface-variant hover:text-error">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="flex flex-col gap-xs text-xs">
              <p className="font-body-md text-on-surface font-bold text-sm">{selectedProduct.name}</p>

              <label className="font-label-md text-on-surface-variant uppercase text-[11px] mt-xs">Nuevo Stock</label>
              <input
                type="number"
                value={adjustNewStock}
                onChange={(e) => setAdjustNewStock(Number(e.target.value))}
                min={0}
                required
                className="bg-surface-container border-none rounded-xl p-sm outline-none text-on-surface text-xs focus:ring-2 focus:ring-secondary"
              />

              <button type="submit" className="bg-secondary text-on-secondary py-2 rounded-xl font-label-md text-xs mt-md hover:bg-primary">
                Guardar Ajuste
              </button>
            </form>
          </div>
        </div>
      )}

      {showPriceModal && selectedService && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-md">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-lg shadow-xl flex flex-col gap-md">
            <div className="flex justify-between items-center border-b pb-sm">
              <h3 className="font-headline-sm text-primary text-base font-bold">Actualizar Precio de Servicio</h3>
              <button onClick={() => setShowPriceModal(false)} className="text-on-surface-variant hover:text-error">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleUpdatePriceSubmit} className="flex flex-col gap-xs text-xs">
              <p className="font-body-md text-on-surface font-bold text-sm">{selectedService.name}</p>
              <p className="font-body-md text-on-surface-variant text-xs">{selectedService.description}</p>

              <label className="font-label-md text-on-surface-variant uppercase text-[11px] mt-xs">Nuevo Precio ($)</label>
              <input
                type="number"
                value={newServicePrice}
                onChange={(e) => setNewServicePrice(Number(e.target.value))}
                min={1}
                required
                className="bg-surface-container border-none rounded-xl p-sm outline-none text-on-surface text-xs focus:ring-2 focus:ring-secondary font-bold text-base"
              />

              <button type="submit" className="bg-primary text-on-primary py-2 rounded-xl font-label-md text-xs mt-md hover:bg-primary-container font-bold shadow-sm">
                Guardar Precio y Actualizar Fecha
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
