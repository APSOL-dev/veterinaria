import React, { useState, useMemo } from 'react';
import { Product, ProductCategory, ServiceCatalogItem, SupplierBill, BillReceipt } from '../../domain/types';
import { formatDate } from '../../utils/dateUtils';

import { updateServicePrice, toggleServiceStatus, getPriceUpdateStatusInfo, applyBulkInflationToServices } from '../../domain/services/serviceCatalogService';
import { applyBulkInflationToProducts } from '../../domain/services/inventoryService';
import { AppConfirmModal } from '../Common/AppConfirmModal';
import { AutoResizeTextarea } from '../Common/AutoResizeTextarea';
import { NewInvoiceDrawer } from '../Suppliers/NewInvoiceDrawer';
import { Pagination } from '../Common/Pagination';

interface StockControlViewProps {
  products: Product[];
  servicesCatalog: ServiceCatalogItem[];
  receipts?: BillReceipt[];
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
  onBulkUpdateProducts?: (products: Product[]) => void;
}

export const StockControlView: React.FC<StockControlViewProps> = ({
  products,
  servicesCatalog,
  receipts = [],
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
  onAddBill,
  onBulkUpdateProducts
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'ok' | 'low_stock' | 'out_of_stock' | 'disabled'>('todos');
  const [showDisabledProducts, setShowDisabledProducts] = useState(false);
  const [showDisabledServices, setShowDisabledServices] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Sorting states
  const [productSortField, setProductSortField] = useState<'sku' | 'name' | 'category' | 'currentStock' | 'minStock' | 'price' | 'lastUpdated' | 'lastSale' | 'status'>('name');
  const [productSortDirection, setProductSortDirection] = useState<'asc' | 'desc'>('asc');

  const [serviceSortField, setServiceSortField] = useState<'name' | 'category' | 'price' | 'lastUpdated' | 'lastSale' | 'status' | 'updateFrequencyDays'>('name');
  const [serviceSortDirection, setServiceSortDirection] = useState<'asc' | 'desc'>('asc');

  const [searchQuery, setSearchQuery] = useState('');
  const [serviceSearchQuery, setServiceSearchQuery] = useState('');
  const [productPage, setProductPage] = useState<number>(1);
  const [productPageSize, setProductPageSize] = useState<number>(20);
  const [servicePage, setServicePage] = useState<number>(1);
  const [servicePageSize, setServicePageSize] = useState<number>(20);

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

  // Bulk inflation update state
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState<boolean>(false);
  const [showInflationModal, setShowInflationModal] = useState(false);
  const [inflationScope, setInflationScope] = useState<'selected' | 'category' | 'all'>('all');
  const [inflationCategory, setInflationCategory] = useState<string>('Medicamentos');
  const [inflationPercentage, setInflationPercentage] = useState<number>(10);
  const [inflationSuccessMsg, setInflationSuccessMsg] = useState<string | null>(null);

  const isProductSelectionActive = isSelectionMode || selectedProductIds.length > 0;
  const isServiceSelectionActive = isSelectionMode || selectedServiceIds.length > 0;

  const serviceCategories = useMemo(() => {
    const unique = Array.from(new Set(servicesCatalog.map(s => (s.category || '').trim()).filter(Boolean)));
    return ['Todos', ...unique];
  }, [servicesCatalog]);

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
  const [editUpdateFrequency, setEditUpdateFrequency] = useState<number>(30);

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
  const [newUpdateFrequency, setNewUpdateFrequency] = useState<number>(30);

  const handleOpenNewProduct = () => {
    setNewSku('');
    setNewName('');
    setNewBarcode('');
    setNewCategory('Medicamentos');
    setNewInitialStock(10);
    setNewMinStock(5);
    setNewPrice(15000);
    setNewUpdateFrequency(30);
    setShowNewProductModal(true);
  };

  const handleOpenEditProduct = (prod: Product) => {
    setSelectedProduct(prod);
    setEditSku(prod.sku || '');
    setEditName(prod.name);
    setEditCategory(prod.category);
    setEditPrice(prod.price);
    setEditMinStock(prod.minStock);
    setEditUpdateFrequency(prod.updateFrequencyDays || 30);
    setShowEditProductModal(true);
  };

  const handleEditProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !editName.trim()) return;
    const priceChanged = Number(editPrice) !== selectedProduct.price;
    const priceLastUpdated = priceChanged
      ? new Date().toISOString().substring(0, 10)
      : (selectedProduct.priceLastUpdated || new Date().toISOString().substring(0, 10));

    if (onUpdateProduct) {
      onUpdateProduct(selectedProduct.id, {
        sku: editSku,
        name: editName,
        category: editCategory,
        price: editPrice,
        minStock: editMinStock,
        priceLastUpdated,
        updateFrequencyDays: editUpdateFrequency
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

  const getLastSaleDate = useMemo(() => {
    return (id: string, name: string): string | null => {
      if (!receipts || receipts.length === 0) return null;
      let lastDate: string | null = null;
      const lowerName = name.toLowerCase();

      for (const rec of receipts) {
        if (!rec.items) continue;
        const match = rec.items.some(it =>
          (it.referenceId && it.referenceId === id) ||
          (it.description && it.description.toLowerCase() === lowerName)
        );
        if (match && rec.date) {
          if (!lastDate || new Date(rec.date).getTime() > new Date(lastDate).getTime()) {
            lastDate = rec.date;
          }
        }
      }
      return lastDate;
    };
  }, [receipts]);

  const disabledProductsCount = useMemo(() => {
    return products.filter(p => p.isActive === false).length;
  }, [products]);

  const disabledServicesCount = useMemo(() => {
    return servicesCatalog.filter(s => s.isActive === false).length;
  }, [servicesCatalog]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const isProductDisabled = p.isActive === false;
      if (statusFilter === 'disabled') {
        if (!isProductDisabled) return false;
      } else if (!showDisabledProducts && isProductDisabled) {
        return false;
      }

      if (statusFilter === 'ok') {
        if (p.currentStock <= p.minStock || isProductDisabled) return false;
      } else if (statusFilter === 'low_stock') {
        if (p.currentStock <= 0 || p.currentStock > p.minStock || isProductDisabled) return false;
      } else if (statusFilter === 'out_of_stock') {
        if (p.currentStock !== 0 || isProductDisabled) return false;
      }

      const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery = !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.includes(q));

      return matchesCategory && matchesQuery;
    });
  }, [products, selectedCategory, searchQuery, statusFilter, showDisabledProducts]);

  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    list.sort((a, b) => {
      let valA: any = '';
      let valB: any = '';

      if (productSortField === 'sku') {
        valA = (a.sku || '').toLowerCase();
        valB = (b.sku || '').toLowerCase();
      } else if (productSortField === 'name') {
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
      } else if (productSortField === 'category') {
        valA = a.category.toLowerCase();
        valB = b.category.toLowerCase();
      } else if (productSortField === 'currentStock') {
        valA = a.currentStock;
        valB = b.currentStock;
      } else if (productSortField === 'minStock') {
        valA = a.minStock;
        valB = b.minStock;
      } else if (productSortField === 'price') {
        valA = a.price;
        valB = b.price;
      } else if (productSortField === 'lastUpdated') {
        valA = a.priceLastUpdated || '';
        valB = b.priceLastUpdated || '';
      } else if (productSortField === 'lastSale') {
        valA = getLastSaleDate(a.id, a.name) || '';
        valB = getLastSaleDate(b.id, b.name) || '';
      } else if (productSortField === 'status') {
        valA = a.isActive === false ? 'deshabilitado' : a.currentStock === 0 ? 'sin_stock' : a.currentStock <= a.minStock ? 'stock_bajo' : 'ok';
        valB = b.isActive === false ? 'deshabilitado' : b.currentStock === 0 ? 'sin_stock' : b.currentStock <= b.minStock ? 'stock_bajo' : 'ok';
      }

      if (valA < valB) return productSortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return productSortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [filteredProducts, productSortField, productSortDirection, getLastSaleDate]);

  const paginatedProducts = useMemo(() => {
    const start = (productPage - 1) * productPageSize;
    return sortedProducts.slice(start, start + productPageSize);
  }, [sortedProducts, productPage, productPageSize]);

  const filteredServices = useMemo(() => {
    return servicesCatalog.filter(s => {
      const isServiceDisabled = s.isActive === false;
      if (statusFilter === 'disabled') {
        if (!isServiceDisabled) return false;
      } else if (!showDisabledServices && isServiceDisabled) {
        return false;
      }

      const matchesCategory = selectedCategory === 'Todos' || s.category === selectedCategory;
      const q = serviceSearchQuery.toLowerCase().trim();
      const matchesQuery = !q ||
        s.name.toLowerCase().includes(q) ||
        (s.category || '').toLowerCase().includes(q) ||
        (s.description || '').toLowerCase().includes(q);

      return matchesCategory && matchesQuery;
    });
  }, [servicesCatalog, selectedCategory, serviceSearchQuery, statusFilter, showDisabledServices]);

  const sortedServices = useMemo(() => {
    const list = [...filteredServices];
    list.sort((a, b) => {
      let valA: any = '';
      let valB: any = '';

      if (serviceSortField === 'name') {
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
      } else if (serviceSortField === 'category') {
        valA = (a.category || '').toLowerCase();
        valB = (b.category || '').toLowerCase();
      } else if (serviceSortField === 'price') {
        valA = a.price;
        valB = b.price;
      } else if (serviceSortField === 'lastUpdated') {
        valA = a.priceLastUpdated || '';
        valB = b.priceLastUpdated || '';
      } else if (serviceSortField === 'lastSale') {
        valA = getLastSaleDate(a.id, a.name) || '';
        valB = getLastSaleDate(b.id, b.name) || '';
      } else if (serviceSortField === 'updateFrequencyDays') {
        valA = a.updateFrequencyDays || 30;
        valB = b.updateFrequencyDays || 30;
      } else if (serviceSortField === 'status') {
        valA = a.isActive === false ? 'deshabilitado' : 'activo';
        valB = b.isActive === false ? 'deshabilitado' : 'activo';
      }

      if (valA < valB) return serviceSortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return serviceSortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [filteredServices, serviceSortField, serviceSortDirection, getLastSaleDate]);

  const paginatedServices = useMemo(() => {
    const start = (servicePage - 1) * servicePageSize;
    return sortedServices.slice(start, start + servicePageSize);
  }, [sortedServices, servicePage, servicePageSize]);

  const isAllServicesOnPageSelected = useMemo(() => {
    if (paginatedServices.length === 0) return false;
    return paginatedServices.every(s => selectedServiceIds.includes(s.id));
  }, [paginatedServices, selectedServiceIds]);

  const handleToggleSelectAllServices = () => {
    if (isAllServicesOnPageSelected) {
      const pageIds = new Set(paginatedServices.map(s => s.id));
      setSelectedServiceIds(prev => prev.filter(id => !pageIds.has(id)));
    } else {
      const newIds = new Set([...selectedServiceIds, ...paginatedServices.map(s => s.id)]);
      setSelectedServiceIds(Array.from(newIds));
    }
  };

  const handleToggleServiceSelect = (id: string) => {
    setSelectedServiceIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };


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
      barcode: newBarcode || undefined,
      priceLastUpdated: new Date().toISOString().substring(0, 10),
      updateFrequencyDays: Number(newUpdateFrequency) || 30
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

  const handleApplyInflation = (e: React.FormEvent) => {
    e.preventDefault();
    const pct = Number(inflationPercentage);
    if (isNaN(pct) || pct === 0) return;

    if (activeSubmodule === 'servicios-catalogo') {
      let filter: { serviceIds?: string[]; category?: string } | undefined;
      if (inflationScope === 'selected') {
        if (selectedServiceIds.length === 0) return;
        filter = { serviceIds: selectedServiceIds };
      } else if (inflationScope === 'category') {
        filter = { category: inflationCategory };
      }

      const result = applyBulkInflationToServices(servicesCatalog, pct, filter);
      if (result.updatedCount > 0) {
        onUpdateServicesCatalog(result.updatedServices);
        setInflationSuccessMsg(`¡Precios actualizados exitosamente en ${result.updatedCount} servicio(s) (${pct > 0 ? '+' : ''}${pct}%)!`);
        setSelectedServiceIds([]);
        setIsSelectionMode(false);
        setTimeout(() => {
          setShowInflationModal(false);
          setInflationSuccessMsg(null);
        }, 1500);
      }
      return;
    }

    let filter: { productIds?: string[]; category?: string } | undefined;
    if (inflationScope === 'selected') {
      if (selectedProductIds.length === 0) return;
      filter = { productIds: selectedProductIds };
    } else if (inflationScope === 'category') {
      filter = { category: inflationCategory };
    }

    const result = applyBulkInflationToProducts(products, pct, filter);
    if (result.updatedCount > 0) {
      if (onBulkUpdateProducts) {
        onBulkUpdateProducts(result.updatedProducts);
      } else if (onUpdateProduct) {
        result.updatedProducts.forEach(p => {
          const orig = products.find(o => o.id === p.id);
          if (orig && orig.price !== p.price) {
            onUpdateProduct(p.id, { price: p.price, priceLastUpdated: p.priceLastUpdated });
          }
        });
      }
      setInflationSuccessMsg(`¡Precios actualizados exitosamente en ${result.updatedCount} producto(s) (${pct > 0 ? '+' : ''}${pct}%)!`);
      setSelectedProductIds([]);
      setIsSelectionMode(false);
      setTimeout(() => {
        setShowInflationModal(false);
        setInflationSuccessMsg(null);
      }, 1500);
    }
  };

  return (
    <div className="flex flex-col w-full gap-md flex-1 font-body-md text-slate-800 h-full overflow-y-auto p-md lg:p-0 lg:pr-1">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-sm mb-md shrink-0">
        <div className="flex flex-col">
          <h1 className="font-display-lg text-lg lg:text-[22px] text-slate-900 leading-tight font-semibold">
            {activeSubmodule === 'productos-fisicos' ? 'Inventario — Productos Físicos' : 'Inventario — Catálogo de Servicios'}
          </h1>
          <p className="font-body-md text-xs text-slate-600 font-medium mt-0.5">
            {activeSubmodule === 'productos-fisicos'
              ? 'Gestión de stock, insumos clínicos y reposición de mercadería'
              : 'Gestión de prestaciones médicas y servicios de peluquería (Precios y Estado)'}
          </p>
        </div>
        {activeSubmodule === 'productos-fisicos' ? (
          <div className="flex items-center flex-wrap gap-sm">
            <button
              onClick={() => {
                if (selectedProductIds.length > 0) {
                  setInflationScope('selected');
                } else if (selectedCategory !== 'Todos') {
                  setInflationScope('category');
                  setInflationCategory(selectedCategory);
                } else {
                  setInflationScope('all');
                }
                setShowInflationModal(true);
              }}
              className="bg-[#27AE60] hover:bg-[#219653] text-white border border-[#219653] transition-colors px-4 py-2.5 rounded-xl font-label-md text-xs flex items-center gap-1.5 shadow-sm font-semibold cursor-pointer"
              title="Aumentar o ajustar precios por inflación masivamente"
            >
              <span className="material-symbols-outlined text-[16px]">trending_up</span>
              <span>Actualizar por inflación {selectedProductIds.length > 0 ? `(${selectedProductIds.length})` : ''}</span>
            </button>
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
              onClick={handleOpenNewProduct}
              className="bg-primary text-on-primary hover:bg-primary-container transition-all px-4 py-2.5 rounded-xl font-label-md text-xs flex items-center gap-1.5 shadow-sm font-semibold cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Nuevo producto</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center flex-wrap gap-sm">
            <button
              onClick={() => {
                if (selectedServiceIds.length > 0) {
                  setInflationScope('selected');
                } else if (selectedCategory !== 'Todos') {
                  setInflationScope('category');
                  setInflationCategory(selectedCategory);
                } else {
                  setInflationScope('all');
                }
                setShowInflationModal(true);
              }}
              className="bg-[#27AE60] hover:bg-[#219653] text-white border border-[#219653] transition-colors px-4 py-2.5 rounded-xl font-label-md text-xs flex items-center gap-1.5 shadow-sm font-semibold cursor-pointer"
              title="Aumentar o ajustar precios de servicios por inflación masivamente"
            >
              <span className="material-symbols-outlined text-[16px]">trending_up</span>
              <span>Actualizar por inflación {selectedServiceIds.length > 0 ? `(${selectedServiceIds.length})` : ''}</span>
            </button>
            <button
              onClick={handleOpenNewService}
              className="bg-primary text-on-primary hover:bg-primary-container transition-all px-4 py-2.5 rounded-xl font-label-md text-xs flex items-center gap-1.5 shadow-sm font-semibold cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Nuevo servicio / prestación</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Container */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 p-md flex flex-col gap-md mb-8">
        {activeSubmodule === 'productos-fisicos' ? (
          <div className="flex flex-col gap-md">

            {/* Search & Categories Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-sm">
              <div className="bg-surface-container rounded-xl p-xs flex items-center w-full sm:w-80 border border-outline-variant/30">
                <span className="material-symbols-outlined text-on-surface-variant ml-sm mr-xs text-[18px]">search</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setProductPage(1);
                  }}
                  placeholder="Buscar por nombre, SKU o código..."
                  className="bg-transparent text-xs text-on-surface outline-none w-full font-medium"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => { setSearchQuery(''); setProductPage(1); }}
                    className="text-slate-400 hover:text-slate-600 mr-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-xs w-full sm:w-auto">
                {categories.map((cat) => {
                  const isSelected = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => {
                        setSelectedCategory(cat);
                        setProductPage(1);
                      }}
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

            {/* Status filters & View Disabled Toggle Bar */}
            <div className="flex flex-wrap items-center justify-between gap-sm border-t border-slate-200/80 pt-2">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => { setStatusFilter('todos'); setProductPage(1); }}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    statusFilter === 'todos' ? 'bg-[#7B5EA7] text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Todos ({products.filter(p => showDisabledProducts || p.isActive !== false).length})
                </button>
                <button
                  type="button"
                  onClick={() => { setStatusFilter('ok'); setProductPage(1); }}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                    statusFilter === 'ok' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Normal (OK)
                </button>
                <button
                  type="button"
                  onClick={() => { setStatusFilter('low_stock'); setProductPage(1); }}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                    statusFilter === 'low_stock' ? 'bg-amber-600 text-white shadow-xs' : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  Stock bajo
                </button>
                <button
                  type="button"
                  onClick={() => { setStatusFilter('out_of_stock'); setProductPage(1); }}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                    statusFilter === 'out_of_stock' ? 'bg-red-600 text-white shadow-xs' : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                  Sin stock
                </button>
                {disabledProductsCount > 0 && (
                  <button
                    type="button"
                    onClick={() => { setStatusFilter('disabled'); setProductPage(1); }}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                      statusFilter === 'disabled' ? 'bg-slate-700 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-300'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">visibility_off</span>
                    Deshabilitados ({disabledProductsCount})
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowDisabledProducts(prev => !prev)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                    showDisabledProducts
                      ? 'bg-purple-100 text-[#5C3C7B] border-purple-300 shadow-2xs font-bold'
                      : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                  }`}
                  title="Mostrar u ocultar productos deshabilitados"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {showDisabledProducts ? 'visibility' : 'visibility_off'}
                  </span>
                  <span>{showDisabledProducts ? 'Ocultar deshabilitados' : `Ver deshabilitados (${disabledProductsCount})`}</span>
                </button>
              </div>
            </div>

            {/* Selection Banner */}
            {isProductSelectionActive && (
              <div className="bg-purple-50/90 border border-purple-200 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs animate-fade-in shadow-xs">
                <div className="flex items-center gap-2 text-[#5C3C7B] font-semibold">
                  <span className="material-symbols-outlined text-[20px] text-[#5C3C7B]" aria-hidden="true">checklist</span>
                  <span>
                    {selectedProductIds.length === 0
                      ? 'Modo Selección: Marque los productos que desea actualizar en la lista'
                      : `${selectedProductIds.length} ${selectedProductIds.length === 1 ? 'producto seleccionado' : 'productos seleccionados'} para actualizar`}
                  </span>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    disabled={selectedProductIds.length === 0}
                    onClick={() => {
                      setInflationScope('selected');
                      setShowInflationModal(true);
                    }}
                    className={`px-3.5 py-2 min-h-[38px] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer ${
                      selectedProductIds.length > 0
                        ? 'bg-[#27AE60] hover:bg-[#219653] text-white'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]" aria-hidden="true">trending_up</span>
                    <span>Actualizar por inflación ({selectedProductIds.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSelectionMode(false);
                      setSelectedProductIds([]);
                    }}
                    className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-3.5 py-2 min-h-[38px] rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* MOBILE ONLY VIEW: Responsive Product Cards */}
            <div className="md:hidden flex flex-col gap-3">
              {paginatedProducts.map((p) => {
                const isOutOfStock = p.currentStock === 0;
                const isLowStock = p.currentStock > 0 && p.currentStock <= p.minStock;
                const priceUpdateInfo = getPriceUpdateStatusInfo(
                  p.priceLastUpdated || new Date().toISOString().substring(0, 10),
                  p.updateFrequencyDays || 30
                );
                const isSelected = selectedProductIds.includes(p.id);
                const isProductDisabled = p.isActive === false;
                const lastSaleDate = getLastSaleDate(p.id, p.name);

                return (
                  <div
                    key={p.id}
                    className={`p-4 rounded-2xl border transition-all shadow-sm flex flex-col gap-3 ${
                      isSelected ? 'bg-purple-50/80 border-[#9A7DB8] ring-1 ring-[#9A7DB8]/30' : isProductDisabled ? 'bg-slate-50/80 border-slate-300 opacity-75' : 'bg-white border-slate-300 hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        {isProductSelectionActive && (
                          <label className="min-w-[44px] min-h-[44px] -ml-2 -mt-2 flex items-center justify-center cursor-pointer shrink-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedProductIds(prev => [...prev, p.id]);
                                } else {
                                  setSelectedProductIds(prev => prev.filter(id => id !== p.id));
                                }
                              }}
                              className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer accent-[#5C3C7B]"
                              aria-label={`Seleccionar ${p.name}`}
                            />
                          </label>
                        )}
                        <div className="min-w-0">
                          <h3 className="font-bold text-sm text-slate-900 leading-snug break-words">{p.name}</h3>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md text-[11px] font-semibold border border-slate-200">
                              {p.category}
                            </span>
                            {isProductDisabled ? (
                              <span className="px-2 py-0.5 bg-slate-200 text-slate-700 border border-slate-300 rounded-full text-[10px] font-semibold">
                                Deshabilitado
                              </span>
                            ) : priceUpdateInfo.isExpired ? (
                              <span className="px-2 py-0.5 bg-[#FDEDEC] text-[#C0392B] border border-red-200 rounded-full text-[10px] font-semibold">
                                Precio vencido
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-base font-bold text-emerald-800 font-mono block">
                          ${p.price.toLocaleString('es-AR')}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {p.priceLastUpdated || 'Sin fecha'}
                        </span>
                      </div>
                    </div>

                    {/* Stock & Status Bar */}
                    <div className="flex items-center justify-between bg-slate-50/90 p-2.5 px-3 rounded-xl border border-slate-200 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-600 font-medium">Stock:</span>
                        <span className={`font-bold text-sm ${
                          isOutOfStock ? 'text-red-600' : isLowStock ? 'text-amber-600' : 'text-slate-900'
                        }`}>
                          {p.currentStock}
                        </span>
                        <span className="text-slate-400 text-[11px]">(Mín: {p.minStock})</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {lastSaleDate && (
                          <span className="text-[10px] text-slate-500 font-medium hidden sm:inline">
                            Últ. venta: {formatDate(lastSaleDate)}
                          </span>
                        )}
                        <div>
                          {isProductDisabled ? (
                            <span className="inline-flex px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-300 rounded-full text-[11px] font-bold">
                              Inactivo
                            </span>
                          ) : !isLowStock && !isOutOfStock ? (
                            <span className="inline-flex px-2.5 py-1 bg-[#E8F5E9] text-[#1B5E20] border border-emerald-200 rounded-full text-[11px] font-bold">
                              OK
                            </span>
                          ) : isLowStock ? (
                            <span className="inline-flex px-2.5 py-1 bg-[#FFF3E0] text-[#E65100] border border-amber-200 rounded-full text-[11px] font-bold">
                              Stock bajo
                            </span>
                          ) : (
                            <span className="inline-flex px-2.5 py-1 bg-red-100 text-red-700 border border-red-200 rounded-full text-[11px] font-bold">
                              Sin stock
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick Touch Actions with 44px min-height */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => { setSelectedProduct(p); setAdjustNewStock(p.currentStock); setShowAdjustModal(true); }}
                        className="flex-1 min-h-[44px] bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                      >
                        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">tune</span>
                        <span>Ajustar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEditProduct(p)}
                        className="flex-1 min-h-[44px] bg-purple-50/70 hover:bg-purple-100 text-[#5C3C7B] border border-purple-200 px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                      >
                        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">edit</span>
                        <span>Editar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (onUpdateProduct) {
                            onUpdateProduct(p.id, { isActive: isProductDisabled ? true : false });
                          }
                        }}
                        className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs ${
                          isProductDisabled
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
                            : 'bg-amber-50 text-amber-700 border border-amber-300 hover:bg-amber-100'
                        }`}
                        title={isProductDisabled ? 'Habilitar producto' : 'Deshabilitar producto'}
                      >
                        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                          {isProductDisabled ? 'check_circle' : 'visibility_off'}
                        </span>
                        <span>{isProductDisabled ? 'Habilitar' : 'Deshabilitar'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Products Table with Internal Scroll to prevent page overflow */}
            <div className="hidden md:block overflow-x-auto overflow-y-auto max-h-[580px] border border-slate-200 rounded-xl relative">
              <table className="w-full text-left border-collapse font-body-md text-xs">
                <thead>
                  <tr className="sticky top-0 bg-slate-100 text-slate-700 font-label-sm text-[11px] font-semibold border-b border-slate-200 z-10 shadow-2xs">
                    {isProductSelectionActive && (
                      <th className="p-sm px-2 text-center w-10">
                        <input
                          type="checkbox"
                          checked={paginatedProducts.length > 0 && paginatedProducts.every(p => selectedProductIds.includes(p.id))}
                          onChange={(e) => {
                            if (e.target.checked) {
                              const newSelected = Array.from(new Set([...selectedProductIds, ...paginatedProducts.map(p => p.id)]));
                              setSelectedProductIds(newSelected);
                            } else {
                              const pageIds = new Set(paginatedProducts.map(p => p.id));
                              setSelectedProductIds(selectedProductIds.filter(id => !pageIds.has(id)));
                            }
                          }}
                          className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer accent-[#5C3C7B]"
                          title="Seleccionar / Deseleccionar visibles de la página"
                          aria-label="Seleccionar todos los productos visibles"
                        />
                      </th>
                    )}
                    <th
                      className="p-sm px-md cursor-pointer hover:bg-slate-200 transition-colors select-none"
                      onClick={() => {
                        if (productSortField === 'name') {
                          setProductSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                        } else {
                          setProductSortField('name');
                          setProductSortDirection('asc');
                        }
                      }}
                    >
                      <div className="flex items-center gap-1">
                        <span>Producto</span>
                        {productSortField === 'name' && (
                          <span className="material-symbols-outlined text-[14px] text-[#7B5EA7]">
                            {productSortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      className="p-sm px-md cursor-pointer hover:bg-slate-200 transition-colors select-none"
                      onClick={() => {
                        if (productSortField === 'category') {
                          setProductSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                        } else {
                          setProductSortField('category');
                          setProductSortDirection('asc');
                        }
                      }}
                    >
                      <div className="flex items-center gap-1">
                        <span>Categoría</span>
                        {productSortField === 'category' && (
                          <span className="material-symbols-outlined text-[14px] text-[#7B5EA7]">
                            {productSortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      className="p-sm px-md text-right cursor-pointer hover:bg-slate-200 transition-colors select-none"
                      onClick={() => {
                        if (productSortField === 'currentStock') {
                          setProductSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                        } else {
                          setProductSortField('currentStock');
                          setProductSortDirection('desc');
                        }
                      }}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Stock actual</span>
                        {productSortField === 'currentStock' && (
                          <span className="material-symbols-outlined text-[14px] text-[#7B5EA7]">
                            {productSortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="p-sm px-md text-right">Min.</th>
                    <th
                      className="p-sm px-md text-right cursor-pointer hover:bg-slate-200 transition-colors select-none"
                      onClick={() => {
                        if (productSortField === 'price') {
                          setProductSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                        } else {
                          setProductSortField('price');
                          setProductSortDirection('desc');
                        }
                      }}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Precio</span>
                        {productSortField === 'price' && (
                          <span className="material-symbols-outlined text-[14px] text-[#7B5EA7]">
                            {productSortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      className="p-sm px-md text-center cursor-pointer hover:bg-slate-200 transition-colors select-none"
                      onClick={() => {
                        if (productSortField === 'lastUpdated') {
                          setProductSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                        } else {
                          setProductSortField('lastUpdated');
                          setProductSortDirection('desc');
                        }
                      }}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Última actualización</span>
                        {productSortField === 'lastUpdated' && (
                          <span className="material-symbols-outlined text-[14px] text-[#7B5EA7]">
                            {productSortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="p-sm px-md text-center">Frecuencia / Vencimiento</th>
                    <th
                      className="p-sm px-md text-center cursor-pointer hover:bg-slate-200 transition-colors select-none"
                      onClick={() => {
                        if (productSortField === 'lastSale') {
                          setProductSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                        } else {
                          setProductSortField('lastSale');
                          setProductSortDirection('desc');
                        }
                      }}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Última venta</span>
                        {productSortField === 'lastSale' && (
                          <span className="material-symbols-outlined text-[14px] text-[#7B5EA7]">
                            {productSortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      className="p-sm px-md text-center cursor-pointer hover:bg-slate-200 transition-colors select-none"
                      onClick={() => {
                        if (productSortField === 'status') {
                          setProductSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                        } else {
                          setProductSortField('status');
                          setProductSortDirection('asc');
                        }
                      }}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Estado</span>
                        {productSortField === 'status' && (
                          <span className="material-symbols-outlined text-[14px] text-[#7B5EA7]">
                            {productSortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="p-sm px-md text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="text-on-surface">
                  {paginatedProducts.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-500 text-xs font-medium">
                        No se encontraron productos con los filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    paginatedProducts.map((p) => {
                      const isOutOfStock = p.currentStock === 0;
                      const isLowStock = p.currentStock > 0 && p.currentStock <= p.minStock;
                      const isProductDisabled = p.isActive === false;
                      const lastSaleDate = getLastSaleDate(p.id, p.name);
                      const priceUpdateInfo = getPriceUpdateStatusInfo(
                        p.priceLastUpdated || new Date().toISOString().substring(0, 10),
                        p.updateFrequencyDays || 30
                      );

                      return (
                        <tr key={p.id} className={`hover:bg-slate-50 transition-colors group border-b border-slate-200 ${
                          selectedProductIds.includes(p.id) ? 'bg-purple-50/60' : isProductDisabled ? 'bg-slate-50/60 text-slate-400' : 'bg-white'
                        }`}>
                          {isProductSelectionActive && (
                            <td className="p-sm px-2 text-center">
                              <input
                                type="checkbox"
                                checked={selectedProductIds.includes(p.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedProductIds(prev => [...prev, p.id]);
                                  } else {
                                    setSelectedProductIds(prev => prev.filter(id => id !== p.id));
                                  }
                                }}
                                className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer accent-[#5C3C7B]"
                                aria-label={`Seleccionar ${p.name}`}
                              />
                            </td>
                          )}
                          <td className={`p-sm px-md font-semibold ${isProductDisabled ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                            {p.name}
                          </td>
                          <td className="p-sm px-md">
                            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium border border-slate-200">
                              {p.category}
                            </span>
                          </td>
                          <td className={`p-sm px-md text-right font-semibold ${
                            isOutOfStock ? 'text-red-600' : isLowStock ? 'text-[#E65100]' : 'text-slate-900'
                          }`}>
                            {p.currentStock}
                          </td>
                          <td className="p-sm px-md text-right text-slate-500">{p.minStock}</td>
                          <td className="p-sm px-md text-right font-semibold text-slate-900">${p.price.toLocaleString('es-AR')}</td>
                          <td className="p-sm px-md text-center text-slate-600">{p.priceLastUpdated || 'Sin registro'}</td>
                          <td className="p-sm px-md text-center">
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="text-[10px] text-slate-500 font-medium">
                                Cada {p.updateFrequencyDays || 30} días
                              </span>
                              {priceUpdateInfo.isExpired ? (
                                <span className="inline-flex px-2 py-0.5 bg-[#FDEDEC] text-[#C0392B] border border-red-200 rounded-full text-[10px] font-semibold" title={`Vencido (hoy > última actualización + ${p.updateFrequencyDays || 30} días)`}>
                                  Vencido ({priceUpdateInfo.daysDifference}d)
                                </span>
                              ) : (
                                <span className="inline-flex px-2 py-0.5 bg-[#E8F5E9] text-[#27AE60] border border-green-200 rounded-full text-[10px] font-semibold" title="Precio actualizado dentro de la frecuencia recomendada">
                                  Vigente
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-sm px-md text-center text-slate-700 font-medium">
                            {lastSaleDate ? (
                              <span className="text-slate-900 font-semibold">{formatDate(lastSaleDate)}</span>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">Sin ventas</span>
                            )}
                          </td>
                          <td className="p-sm px-md text-center">
                            {isProductDisabled ? (
                              <span className="inline-flex px-2.5 py-0.5 bg-slate-100 text-slate-600 border border-slate-300 rounded-full text-[10px] font-semibold">
                                Deshabilitado
                              </span>
                            ) : !isLowStock && !isOutOfStock ? (
                              <span className="inline-flex px-2.5 py-0.5 bg-[#E8F5E9] text-[#1B5E20] border border-emerald-200 rounded-full text-[10px] font-semibold">
                                OK
                              </span>
                            ) : isLowStock ? (
                              <span className="inline-flex px-2.5 py-0.5 bg-[#FFF3E0] text-[#E65100] border border-amber-200 rounded-full text-[10px] font-semibold">
                                Stock bajo
                              </span>
                            ) : (
                              <span className="inline-flex px-2.5 py-0.5 bg-red-100 text-red-700 border border-red-200 rounded-full text-[10px] font-semibold">
                                Sin stock
                              </span>
                            )}
                          </td>
                          <td className="p-sm px-md text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => { setSelectedProduct(p); setAdjustNewStock(p.currentStock); setShowAdjustModal(true); }}
                                className="min-h-[38px] min-w-[38px] flex items-center justify-center p-2 text-slate-600 hover:text-[#5C3C7B] hover:bg-purple-50 rounded-xl transition-colors cursor-pointer border border-slate-200"
                                title="Ajustar Stock"
                                aria-label={`Ajustar stock de ${p.name}`}
                              >
                                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">tune</span>
                              </button>
                              <button
                                onClick={() => handleOpenEditProduct(p)}
                                className="min-h-[38px] min-w-[38px] flex items-center justify-center p-2 text-slate-600 hover:text-[#5C3C7B] hover:bg-purple-50 rounded-xl transition-colors cursor-pointer border border-slate-200"
                                title="Editar Producto"
                                aria-label={`Editar ${p.name}`}
                              >
                                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">edit</span>
                              </button>
                              <button
                                onClick={() => {
                                  if (onUpdateProduct) {
                                    onUpdateProduct(p.id, { isActive: isProductDisabled ? true : false });
                                  }
                                }}
                                className={`min-h-[38px] px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer border shadow-2xs ${
                                  isProductDisabled
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                                    : 'bg-slate-50 text-slate-600 border-slate-300 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300'
                                }`}
                                title={isProductDisabled ? 'Habilitar producto' : 'Deshabilitar producto (no se borrará)'}
                                aria-label={isProductDisabled ? `Habilitar ${p.name}` : `Deshabilitar ${p.name}`}
                              >
                                <span className="material-symbols-outlined text-[16px]">
                                  {isProductDisabled ? 'check_circle' : 'visibility_off'}
                                </span>
                                <span>{isProductDisabled ? 'Habilitar' : 'Deshabilitar'}</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={productPage}
              totalItems={filteredProducts.length}
              pageSize={productPageSize}
              pageSizeOptions={[10, 20, 50, 100]}
              onPageChange={setProductPage}
              onPageSizeChange={setProductPageSize}
              itemLabel="productos"
            />
          </div>
        ) : (
          /* Services Catalog Table */
          <div className="flex flex-col gap-md">
            {/* Search Bar & Category/Disabled Filters for Services */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-sm">
              <div className="bg-surface-container rounded-xl p-xs flex items-center w-full sm:w-80 border border-outline-variant/30">
                <span className="material-symbols-outlined text-on-surface-variant ml-sm mr-xs text-[18px]">search</span>
                <input
                  type="text"
                  value={serviceSearchQuery}
                  onChange={(e) => {
                    setServiceSearchQuery(e.target.value);
                    setServicePage(1);
                  }}
                  placeholder="Buscar servicio por nombre o categoría..."
                  className="bg-transparent text-xs text-on-surface outline-none w-full font-medium"
                />
                {serviceSearchQuery && (
                  <button
                    type="button"
                    onClick={() => { setServiceSearchQuery(''); setServicePage(1); }}
                    className="text-slate-400 hover:text-slate-600 mr-1 shrink-0"
                    title="Limpiar búsqueda"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-xs w-full sm:w-auto">
                {serviceCategories.map((cat) => {
                  const isSelected = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => {
                        setSelectedCategory(cat);
                        setServicePage(1);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer capitalize ${
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

            {/* Status filters & View Disabled Toggle Bar for Services */}
            <div className="flex flex-wrap items-center justify-between gap-sm border-t border-slate-200/80 pt-2">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => { setStatusFilter('todos'); setServicePage(1); }}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    statusFilter === 'todos' ? 'bg-[#7B5EA7] text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Todos ({servicesCatalog.filter(s => showDisabledServices || s.isActive !== false).length})
                </button>
                <button
                  type="button"
                  onClick={() => { setStatusFilter('ok'); setServicePage(1); }}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                    statusFilter === 'ok' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Activos
                </button>
                {disabledServicesCount > 0 && (
                  <button
                    type="button"
                    onClick={() => { setStatusFilter('disabled'); setServicePage(1); }}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                      statusFilter === 'disabled' ? 'bg-slate-700 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-300'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">visibility_off</span>
                    Deshabilitados ({disabledServicesCount})
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowDisabledServices(prev => !prev)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                    showDisabledServices
                      ? 'bg-purple-100 text-[#5C3C7B] border-purple-300 shadow-2xs font-bold'
                      : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                  }`}
                  title="Mostrar u ocultar servicios deshabilitados"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {showDisabledServices ? 'visibility' : 'visibility_off'}
                  </span>
                  <span>{showDisabledServices ? 'Ocultar deshabilitados' : `Ver deshabilitados (${disabledServicesCount})`}</span>
                </button>
              </div>
            </div>

            {/* Selection Banner for Services */}
            {isServiceSelectionActive && (
              <div className="bg-purple-50/90 border border-purple-200 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs animate-fade-in shadow-xs">
                <div className="flex items-center gap-2 text-[#5C3C7B] font-semibold">
                  <span className="material-symbols-outlined text-[20px] text-[#5C3C7B]" aria-hidden="true">checklist</span>
                  <span>
                    {selectedServiceIds.length === 0
                      ? 'Modo Selección: Marque los servicios que desea actualizar en la lista'
                      : `${selectedServiceIds.length} ${selectedServiceIds.length === 1 ? 'servicio seleccionado' : 'servicios seleccionados'} para actualizar`}
                  </span>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    disabled={selectedServiceIds.length === 0}
                    onClick={() => {
                      setInflationScope('selected');
                      setShowInflationModal(true);
                    }}
                    className={`px-3.5 py-2 min-h-[38px] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer ${
                      selectedServiceIds.length > 0
                        ? 'bg-[#27AE60] hover:bg-[#219653] text-white'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]" aria-hidden="true">trending_up</span>
                    <span>Actualizar por inflación ({selectedServiceIds.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSelectionMode(false);
                      setSelectedServiceIds([]);
                    }}
                    className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-3.5 py-2 min-h-[38px] rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* MOBILE ONLY VIEW: Responsive Services Cards */}
            <div className="md:hidden flex flex-col gap-3">
              {paginatedServices.map((srv) => {
                const statusInfo = getPriceUpdateStatusInfo(srv.priceLastUpdated, srv.updateFrequencyDays || 30);
                const isSelected = selectedServiceIds.includes(srv.id);
                const isServiceDisabled = srv.isActive === false;
                const lastSaleDate = getLastSaleDate(srv.id, srv.name);

                return (
                  <div
                    key={srv.id}
                    className={`p-4 rounded-2xl border transition-all shadow-sm flex flex-col gap-3 ${
                      isSelected ? 'bg-purple-50/80 border-[#9A7DB8] ring-1 ring-[#9A7DB8]/30' : isServiceDisabled ? 'bg-slate-50/80 border-slate-300 opacity-75' : 'bg-white border-slate-300 hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        {isServiceSelectionActive && (
                          <label className="min-w-[44px] min-h-[44px] -ml-2 -mt-2 flex items-center justify-center cursor-pointer shrink-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleServiceSelect(srv.id)}
                              className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer accent-[#5C3C7B]"
                              aria-label={`Seleccionar ${srv.name}`}
                            />
                          </label>
                        )}
                        <div className="min-w-0">
                          <h3 className="font-bold text-sm text-slate-900 leading-snug break-words">{srv.name}</h3>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md text-[11px] font-semibold capitalize border border-slate-200">
                              {srv.category}
                            </span>
                            {isServiceDisabled ? (
                              <span className="px-2 py-0.5 bg-slate-200 text-slate-700 border border-slate-300 rounded-full text-[10px] font-semibold">
                                Deshabilitado
                              </span>
                            ) : statusInfo.isExpired ? (
                              <span className="px-2 py-0.5 bg-[#FDEDEC] text-[#C0392B] border border-red-200 rounded-full text-[10px] font-semibold">
                                Vencido ({statusInfo.daysDifference}d)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-[#E8F5E9] text-[#27AE60] border border-green-200 rounded-full text-[10px] font-semibold">
                                Vigente
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-base font-bold text-[#5C3C7B] font-mono block">
                          ${srv.price.toLocaleString('es-AR')}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {srv.priceLastUpdated || 'Sin fecha'}
                        </span>
                      </div>
                    </div>

                    {srv.description && (
                      <p className="text-xs text-slate-700 leading-relaxed font-normal bg-slate-50/90 p-2.5 px-3 rounded-xl border border-slate-200">
                        {srv.description}
                      </p>
                    )}

                    {/* Status & Last Sale Row */}
                    <div className="flex items-center justify-between bg-slate-50/90 p-2 px-3 rounded-xl border border-slate-200 text-xs">
                      <span className="text-slate-600 font-medium">
                        {lastSaleDate ? `Última venta: ${formatDate(lastSaleDate)}` : 'Sin ventas'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleService(srv)}
                        className={`px-3 py-1 min-h-[36px] rounded-full text-xs font-bold cursor-pointer transition-all border ${
                          srv.isActive !== false
                            ? 'bg-[#E8F5E9] text-[#1B5E20] border-emerald-300 hover:bg-emerald-200' 
                            : 'bg-[#FDEDEC] text-[#C0392B] border-red-300 hover:bg-red-200'
                        }`}
                        title="Tocar para cambiar estado Activo/Deshabilitado"
                      >
                        {srv.isActive !== false ? '✓ Activo' : '✕ Deshabilitado'}
                      </button>
                    </div>

                    {/* Quick Touch Actions with 44px min-height */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => handleOpenEditService(srv)}
                        className="flex-1 min-h-[44px] bg-purple-50/70 hover:bg-purple-100 text-[#5C3C7B] border border-purple-200 px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                      >
                        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">edit</span>
                        <span>Editar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleService(srv)}
                        className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs ${
                          srv.isActive === false
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
                            : 'bg-amber-50 text-amber-700 border border-amber-300 hover:bg-amber-100'
                        }`}
                        title={srv.isActive === false ? 'Habilitar servicio' : 'Deshabilitar servicio (no se borrará)'}
                      >
                        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                          {srv.isActive === false ? 'check_circle' : 'visibility_off'}
                        </span>
                        <span>{srv.isActive === false ? 'Habilitar' : 'Deshabilitar'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Services Table with Internal Scroll to prevent page overflow */}
            <div className="hidden md:block overflow-x-auto overflow-y-auto max-h-[580px] border border-slate-200 rounded-xl relative">
              <table className="w-full text-left border-collapse font-body-md text-xs">
                <thead>
                  <tr className="sticky top-0 bg-slate-100 text-slate-700 font-label-sm text-[11px] font-semibold border-b border-slate-200 z-10 shadow-2xs">
                    {isServiceSelectionActive && (
                      <th className="p-sm px-md w-10 text-center">
                        <input
                          type="checkbox"
                          checked={isAllServicesOnPageSelected}
                          onChange={handleToggleSelectAllServices}
                          className="rounded border-slate-300 text-[#5C3C7B] focus:ring-[#5C3C7B] cursor-pointer"
                          title="Seleccionar todos los servicios de la página"
                          aria-label="Seleccionar todos los servicios visibles"
                        />
                      </th>
                    )}
                    <th
                      className="p-sm px-md cursor-pointer hover:bg-slate-200 transition-colors select-none"
                      onClick={() => {
                        if (serviceSortField === 'category') {
                          setServiceSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                        } else {
                          setServiceSortField('category');
                          setServiceSortDirection('asc');
                        }
                      }}
                    >
                      <div className="flex items-center gap-1">
                        <span>Categoría</span>
                        {serviceSortField === 'category' && (
                          <span className="material-symbols-outlined text-[14px] text-[#7B5EA7]">
                            {serviceSortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      className="p-sm px-md cursor-pointer hover:bg-slate-200 transition-colors select-none"
                      onClick={() => {
                        if (serviceSortField === 'name') {
                          setServiceSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                        } else {
                          setServiceSortField('name');
                          setServiceSortDirection('asc');
                        }
                      }}
                    >
                      <div className="flex items-center gap-1">
                        <span>Servicio</span>
                        {serviceSortField === 'name' && (
                          <span className="material-symbols-outlined text-[14px] text-[#7B5EA7]">
                            {serviceSortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="p-sm px-md">Descripción</th>
                    <th className="p-sm px-md text-center">Cantidad</th>
                    <th
                      className="p-sm px-md text-center cursor-pointer hover:bg-slate-200 transition-colors select-none"
                      onClick={() => {
                        if (serviceSortField === 'status') {
                          setServiceSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                        } else {
                          setServiceSortField('status');
                          setServiceSortDirection('asc');
                        }
                      }}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Estado</span>
                        {serviceSortField === 'status' && (
                          <span className="material-symbols-outlined text-[14px] text-[#7B5EA7]">
                            {serviceSortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      className="p-sm px-md text-right cursor-pointer hover:bg-slate-200 transition-colors select-none"
                      onClick={() => {
                        if (serviceSortField === 'price') {
                          setServiceSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                        } else {
                          setServiceSortField('price');
                          setServiceSortDirection('desc');
                        }
                      }}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Precio actual</span>
                        {serviceSortField === 'price' && (
                          <span className="material-symbols-outlined text-[14px] text-[#7B5EA7]">
                            {serviceSortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      className="p-sm px-md text-center cursor-pointer hover:bg-slate-200 transition-colors select-none"
                      onClick={() => {
                        if (serviceSortField === 'lastUpdated') {
                          setServiceSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                        } else {
                          setServiceSortField('lastUpdated');
                          setServiceSortDirection('desc');
                        }
                      }}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Última actualización</span>
                        {serviceSortField === 'lastUpdated' && (
                          <span className="material-symbols-outlined text-[14px] text-[#7B5EA7]">
                            {serviceSortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      className="p-sm px-md text-center cursor-pointer hover:bg-slate-200 transition-colors select-none"
                      onClick={() => {
                        if (serviceSortField === 'updateFrequencyDays') {
                          setServiceSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                        } else {
                          setServiceSortField('updateFrequencyDays');
                          setServiceSortDirection('desc');
                        }
                      }}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Frecuencia / Vencimiento</span>
                        {serviceSortField === 'updateFrequencyDays' && (
                          <span className="material-symbols-outlined text-[14px] text-[#7B5EA7]">
                            {serviceSortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      className="p-sm px-md text-center cursor-pointer hover:bg-slate-200 transition-colors select-none"
                      onClick={() => {
                        if (serviceSortField === 'lastSale') {
                          setServiceSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                        } else {
                          setServiceSortField('lastSale');
                          setServiceSortDirection('desc');
                        }
                      }}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Última venta</span>
                        {serviceSortField === 'lastSale' && (
                          <span className="material-symbols-outlined text-[14px] text-[#7B5EA7]">
                            {serviceSortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="p-sm px-md text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="text-on-surface">
                  {paginatedServices.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-slate-500 text-xs font-medium">
                        No se encontraron servicios con los filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    paginatedServices.map((srv) => {
                      const statusInfo = getPriceUpdateStatusInfo(srv.priceLastUpdated, srv.updateFrequencyDays || 30);
                      const isSelected = selectedServiceIds.includes(srv.id);
                      const isServiceDisabled = srv.isActive === false;
                      const lastSaleDate = getLastSaleDate(srv.id, srv.name);

                      return (
                        <tr key={srv.id} className={`transition-colors group border-b border-slate-200 ${
                          isSelected ? 'bg-purple-50/70' : isServiceDisabled ? 'bg-slate-50/60 text-slate-400' : 'bg-white hover:bg-slate-50'
                        }`}>
                          {isServiceSelectionActive && (
                            <td className="p-sm px-md text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleServiceSelect(srv.id)}
                                className="rounded border-slate-300 text-[#5C3C7B] focus:ring-[#5C3C7B] cursor-pointer"
                                aria-label={`Seleccionar ${srv.name}`}
                              />
                            </td>
                          )}
                          <td className="p-sm px-md font-medium text-slate-700 capitalize">{srv.category}</td>
                          <td className={`p-sm px-md font-semibold ${isServiceDisabled ? 'text-slate-500 line-through' : 'text-slate-900'}`}>{srv.name}</td>
                          <td className="p-sm px-md text-slate-500 max-w-xs truncate">{srv.description || '-'}</td>
                          <td className="p-sm px-md text-center font-medium text-slate-700">{srv.quantity}</td>
                          <td className="p-sm px-md text-center">
                            <button
                              onClick={() => handleToggleService(srv)}
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold cursor-pointer transition-all border ${
                                srv.isActive !== false
                                  ? 'bg-[#E8F5E9] text-[#1B5E20] border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                              }`}
                              title="Clic para habilitar/deshabilitar servicio"
                            >
                              {srv.isActive !== false ? 'Activo' : 'Deshabilitado'}
                            </button>
                          </td>
                          <td className="p-sm px-md text-right font-semibold text-slate-900">${srv.price.toLocaleString('es-AR')}</td>
                          <td className="p-sm px-md text-center text-slate-600">{srv.priceLastUpdated || 'Sin fecha'}</td>
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
                          <td className="p-sm px-md text-center text-slate-700 font-medium">
                            {lastSaleDate ? (
                              <span className="text-slate-900 font-semibold">{formatDate(lastSaleDate)}</span>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">Sin ventas</span>
                            )}
                          </td>
                          <td className="p-sm px-md text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEditService(srv)}
                                className="min-h-[38px] px-3 py-1.5 bg-slate-50 hover:bg-purple-50 text-slate-700 hover:text-[#5C3C7B] border border-slate-200 rounded-xl text-xs font-semibold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                                title="Editar servicio / precio"
                                aria-label={`Editar ${srv.name}`}
                              >
                                <span className="material-symbols-outlined text-[16px]">edit</span>
                                <span>Editar</span>
                              </button>
                              <button
                                onClick={() => handleToggleService(srv)}
                                className={`min-h-[38px] px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer border shadow-2xs ${
                                  isServiceDisabled
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                                    : 'bg-slate-50 text-slate-600 border-slate-300 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300'
                                }`}
                                title={isServiceDisabled ? 'Habilitar servicio' : 'Deshabilitar servicio (no se borrará)'}
                                aria-label={isServiceDisabled ? `Habilitar ${srv.name}` : `Deshabilitar ${srv.name}`}
                              >
                                <span className="material-symbols-outlined text-[16px]">
                                  {isServiceDisabled ? 'check_circle' : 'visibility_off'}
                                </span>
                                <span>{isServiceDisabled ? 'Habilitar' : 'Deshabilitar'}</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={servicePage}
              totalItems={filteredServices.length}
              pageSize={servicePageSize}
              pageSizeOptions={[10, 20, 50, 100]}
              onPageChange={setServicePage}
              onPageSizeChange={setServicePageSize}
              itemLabel="servicios"
            />
          </div>
        )}
      </div>

      {/* Modals */}
      {showEntryModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-[70] flex items-start sm:items-center justify-center p-3 sm:p-md pt-6 sm:pt-10 animate-fade-in overflow-y-auto">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-4 sm:p-lg shadow-xl flex flex-col gap-md my-4 sm:my-auto">
            <div className="flex justify-between items-center border-b pb-sm">
              <h3 className="font-headline-sm text-primary text-base font-semibold">Registrar entrada de mercadería</h3>
              <button onClick={() => setShowEntryModal(false)} className="text-on-surface-variant hover:text-error cursor-pointer p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-surface-container" title="Cerrar">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleStockEntrySubmit} className="flex flex-col gap-xs text-xs">
              <label className="font-semibold text-xs text-slate-700 block">Seleccionar producto</label>
              <select
                value={entryProductId}
                onChange={(e) => setEntryProductId(e.target.value)}
                className="bg-surface-container border-none rounded-xl py-2.5 px-3 min-h-[44px] outline-none text-on-surface text-base sm:text-xs focus:ring-2 focus:ring-secondary cursor-pointer font-medium"
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
                inputMode="numeric"
                pattern="[0-9]*"
                value={entryQty}
                onChange={(e) => setEntryQty(Number(e.target.value))}
                min={1}
                required
                className="bg-surface-container border-none rounded-xl py-2.5 px-3 min-h-[44px] outline-none text-on-surface text-base sm:text-xs focus:ring-2 focus:ring-secondary font-medium"
              />

              <button type="submit" className="bg-primary text-on-primary py-2.5 min-h-[44px] rounded-xl font-semibold text-xs mt-md hover:bg-primary-container cursor-pointer shadow-sm">
                Confirmar ingreso
              </button>
            </form>
          </div>
        </div>
      )}

      {showAdjustModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-[70] flex items-start sm:items-center justify-center p-3 sm:p-md pt-6 sm:pt-10 animate-fade-in overflow-y-auto">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-4 sm:p-lg shadow-xl flex flex-col gap-md my-4 sm:my-auto">
            <div className="flex justify-between items-center border-b pb-sm">
              <h3 className="font-headline-sm text-primary text-base font-semibold">Ajuste manual de stock</h3>
              <button onClick={() => setShowAdjustModal(false)} className="text-on-surface-variant hover:text-error cursor-pointer p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-surface-container" title="Cerrar">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="flex flex-col gap-xs text-xs">
              <p className="font-body-md text-on-surface font-semibold text-sm">{selectedProduct.name}</p>

              <label className="font-semibold text-xs text-slate-700 block mt-xs">Nuevo stock</label>
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                value={adjustNewStock}
                onChange={(e) => setAdjustNewStock(Number(e.target.value))}
                min={0}
                required
                className="bg-surface-container border-none rounded-xl py-2.5 px-3 min-h-[44px] outline-none text-on-surface text-base sm:text-xs focus:ring-2 focus:ring-secondary font-medium"
              />

              <button type="submit" className="bg-secondary text-on-secondary py-2.5 min-h-[44px] rounded-xl font-semibold text-xs mt-md hover:bg-primary cursor-pointer shadow-sm">
                Guardar ajuste
              </button>
            </form>
          </div>
        </div>
      )}

      {showPriceModal && selectedService && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-[70] flex items-start sm:items-center justify-center p-3 sm:p-md pt-6 sm:pt-10 animate-fade-in overflow-y-auto">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-4 sm:p-lg shadow-xl flex flex-col gap-md my-4 sm:my-auto">
            <div className="flex justify-between items-center border-b pb-sm">
              <h3 className="font-headline-sm text-primary text-base font-semibold">Actualizar precio de servicio</h3>
              <button onClick={() => setShowPriceModal(false)} className="text-on-surface-variant hover:text-error cursor-pointer p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-surface-container" title="Cerrar">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleUpdatePriceSubmit} className="flex flex-col gap-xs text-xs">
              <p className="font-body-md text-on-surface font-semibold text-sm">{selectedService.name}</p>
              <p className="font-body-md text-on-surface-variant text-xs font-medium">{selectedService.description}</p>

              <label className="font-semibold text-xs text-slate-700 block mt-xs">Nuevo precio ($)</label>
              <input
                type="number"
                inputMode="decimal"
                value={newServicePrice}
                onChange={(e) => setNewServicePrice(Number(e.target.value))}
                min={1}
                required
                className="bg-surface-container border-none rounded-xl py-2.5 px-3 min-h-[44px] outline-none text-on-surface text-base sm:text-xs focus:ring-2 focus:ring-secondary font-semibold"
              />

              <button type="submit" className="bg-primary text-on-primary py-2.5 min-h-[44px] rounded-xl font-semibold text-xs mt-md hover:bg-primary-container shadow-sm cursor-pointer">
                Guardar precio y actualizar fecha
              </button>
            </form>
          </div>
        </div>
      )}

      {/* New Product Modal */}
      {showNewProductModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-[70] flex items-start sm:items-center justify-center p-3 sm:p-md pt-6 sm:pt-10 animate-fade-in overflow-y-auto">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-4 sm:p-lg shadow-xl flex flex-col gap-md my-4 sm:my-auto">
            <div className="flex justify-between items-center border-b pb-sm">
              <h3 className="font-headline-sm text-primary text-base font-semibold">Nuevo producto del inventario</h3>
              <button onClick={() => setShowNewProductModal(false)} className="text-on-surface-variant hover:text-error cursor-pointer p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-surface-container" title="Cerrar">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleNewProductSubmit} className="flex flex-col gap-xs text-xs">
              <label className="font-semibold text-xs text-slate-700 block">Nombre del producto *</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder=""
                required
                className="bg-surface-container border-none rounded-xl p-sm outline-none text-on-surface text-xs focus:ring-2 focus:ring-secondary font-medium"
              />

              <label className="font-semibold text-xs text-slate-700 block mt-xs">Categoría *</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as ProductCategory)}
                className="bg-surface-container border-none rounded-xl p-sm outline-none text-on-surface text-xs focus:ring-2 focus:ring-secondary cursor-pointer font-medium"
              >
                <option value="Medicamentos">Medicamentos</option>
                <option value="Alimentación">Alimentación</option>
                <option value="Accesorios">Accesorios</option>
                <option value="Insumos Clínicos">Insumos Clínicos</option>
              </select>

              <div className="grid grid-cols-2 gap-xs mt-xs">
                <div>
                  <label className="font-semibold text-xs text-slate-700 block">Stock inicial *</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={newInitialStock}
                    onChange={(e) => setNewInitialStock(Number(e.target.value))}
                    min={0}
                    required
                    className="bg-surface-container border-none rounded-xl p-sm outline-none text-on-surface text-xs focus:ring-2 focus:ring-secondary font-medium w-full"
                  />
                </div>
                <div>
                  <label className="font-semibold text-xs text-slate-700 block">Stock mínimo (Alerta) *</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={newMinStock}
                    onChange={(e) => setNewMinStock(Number(e.target.value))}
                    min={0}
                    required
                    className="bg-surface-container border-none rounded-xl p-sm outline-none text-on-surface text-xs focus:ring-2 focus:ring-secondary font-medium w-full"
                  />
                </div>
              </div>

              <label className="font-semibold text-xs text-slate-700 block mt-xs">Precio de venta ($) *</label>
              <input
                type="number"
                inputMode="decimal"
                value={newPrice}
                onChange={(e) => setNewPrice(Number(e.target.value))}
                min={0}
                required
                className="bg-surface-container border-none rounded-xl p-sm outline-none text-on-surface text-xs focus:ring-2 focus:ring-secondary font-semibold text-base"
              />

              <label className="font-semibold text-xs text-slate-700 block mt-xs">Frecuencia de actualización / vencimiento del precio (días) *</label>
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                min={1}
                value={newUpdateFrequency}
                onChange={(e) => setNewUpdateFrequency(Number(e.target.value))}
                placeholder="Ej: 30"
                required
                className="bg-surface-container border-none rounded-xl p-sm outline-none text-on-surface text-xs focus:ring-2 focus:ring-secondary font-medium"
              />

              <button type="submit" className="bg-primary text-on-primary py-2.5 rounded-xl font-semibold text-xs mt-md hover:bg-primary-container shadow-sm cursor-pointer">
                Crear producto
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditProductModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-[70] flex items-start sm:items-center justify-center p-3 sm:p-md pt-6 sm:pt-10 animate-fade-in overflow-y-auto">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-4 sm:p-lg shadow-xl flex flex-col gap-md my-4 sm:my-auto">
            <div className="flex justify-between items-center border-b pb-sm">
              <h3 className="font-headline-sm text-primary text-base font-semibold">Editar producto del inventario</h3>
              <button onClick={() => setShowEditProductModal(false)} className="text-on-surface-variant hover:text-error cursor-pointer p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-surface-container" title="Cerrar">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleEditProductSubmit} className="flex flex-col gap-xs text-xs">
              <label className="font-semibold text-xs text-slate-700 block">Nombre del producto *</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                className="bg-surface-container border-none rounded-xl py-2.5 px-3 min-h-[44px] outline-none text-on-surface text-base sm:text-xs focus:ring-2 focus:ring-secondary font-medium"
              />

              <label className="font-semibold text-xs text-slate-700 block mt-xs">Categoría *</label>
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value as ProductCategory)}
                className="bg-surface-container border-none rounded-xl py-2.5 px-3 min-h-[44px] outline-none text-on-surface text-base sm:text-xs focus:ring-2 focus:ring-secondary cursor-pointer font-medium"
              >
                <option value="Medicamentos">Medicamentos</option>
                <option value="Alimentación">Alimentación</option>
                <option value="Accesorios">Accesorios</option>
                <option value="Insumos Clínicos">Insumos Clínicos</option>
              </select>

              <label className="font-semibold text-xs text-slate-700 block mt-xs">Precio de venta ($) *</label>
              <input
                type="number"
                inputMode="decimal"
                value={editPrice}
                onChange={(e) => setEditPrice(Number(e.target.value))}
                min={0}
                required
                className="bg-surface-container border-none rounded-xl py-2.5 px-3 min-h-[44px] outline-none text-on-surface text-base sm:text-xs focus:ring-2 focus:ring-secondary font-medium"
              />

              <label className="font-semibold text-xs text-slate-700 block mt-xs">Stock mínimo (Alerta)</label>
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                value={editMinStock}
                onChange={(e) => setEditMinStock(Number(e.target.value))}
                min={0}
                required
                className="bg-surface-container border-none rounded-xl py-2.5 px-3 min-h-[44px] outline-none text-on-surface text-base sm:text-xs focus:ring-2 focus:ring-secondary font-medium"
              />

              <label className="font-semibold text-xs text-slate-700 block mt-xs">Frecuencia de actualización / vencimiento del precio (días) *</label>
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                min={1}
                value={editUpdateFrequency}
                onChange={(e) => setEditUpdateFrequency(Number(e.target.value))}
                placeholder="Ej: 30"
                required
                className="bg-surface-container border-none rounded-xl py-2.5 px-3 min-h-[44px] outline-none text-on-surface text-base sm:text-xs focus:ring-2 focus:ring-secondary font-medium"
              />

              <button type="submit" className="bg-primary text-on-primary py-2.5 min-h-[44px] rounded-xl font-semibold text-xs mt-md hover:bg-primary-container shadow-sm cursor-pointer">
                Guardar cambios del producto
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Service Catalog Add/Edit Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-[70] flex items-start sm:items-center justify-center p-3 sm:p-md pt-6 sm:pt-10 animate-fade-in overflow-y-auto">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-4 sm:p-lg shadow-xl flex flex-col gap-md my-4 sm:my-auto">
            <div className="flex justify-between items-center border-b pb-sm">
              <h3 className="font-headline-sm text-primary text-base font-semibold">
                {selectedService ? 'Editar servicio / prestación' : 'Nuevo servicio / prestación'}
              </h3>
              <button onClick={() => setShowServiceModal(false)} className="text-on-surface-variant hover:text-error cursor-pointer p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-surface-container" title="Cerrar">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleServiceFormSubmit} className="flex flex-col gap-xs text-xs">
              <label className="font-semibold text-xs text-slate-700 block">Nombre del servicio *</label>
              <input
                type="text"
                value={serviceFormName}
                onChange={(e) => setServiceFormName(e.target.value)}
                placeholder=""
                required
                className="bg-surface-container border-none rounded-xl py-2.5 px-3 min-h-[44px] outline-none text-on-surface text-base sm:text-xs focus:ring-2 focus:ring-secondary font-medium"
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
              <AutoResizeTextarea
                value={serviceFormDesc}
                onChange={(e) => setServiceFormDesc(e.target.value)}
                minRows={2}
                placeholder="Detalle o requisitos de la prestación..."
                className="bg-surface-container border-none rounded-xl p-sm outline-none text-on-surface text-xs focus:ring-2 focus:ring-secondary font-medium"
              />

              <label className="font-semibold text-xs text-slate-700 block mt-xs">Precio ($) *</label>
              <input
                type="number"
                inputMode="decimal"
                value={serviceFormPrice}
                onChange={(e) => setServiceFormPrice(Number(e.target.value))}
                min={0}
                required
                className="bg-surface-container border-none rounded-xl p-sm outline-none text-on-surface text-xs focus:ring-2 focus:ring-secondary font-semibold text-base"
              />

              <label className="font-semibold text-xs text-slate-700 block mt-xs">Frecuencia de actualización / vencimiento del precio (días) *</label>
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                min={1}
                value={serviceFormFrequency}
                onChange={(e) => setServiceFormFrequency(Number(e.target.value))}
                placeholder="Ej: 30"
                required
                className="bg-surface-container border-none rounded-xl p-sm outline-none text-on-surface text-xs focus:ring-2 focus:ring-secondary font-medium"
              />

              <button type="submit" className="bg-primary text-on-primary py-2.5 rounded-xl font-label-md text-xs mt-md hover:bg-primary-container font-medium shadow-sm cursor-pointer">
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

      {/* Modal: Actualización masiva de precios por inflación */}
      {showInflationModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-[70] flex items-start sm:items-center justify-center p-3 sm:p-md pt-6 sm:pt-10 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-lg shadow-2xl flex flex-col gap-md border border-slate-200 my-4 sm:my-auto">
            <div className="flex justify-between items-start border-b border-slate-200 pb-sm">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">trending_up</span>
                </div>
                <div>
                  <h3 className="font-display-lg text-base text-slate-900 font-semibold">
                    {activeSubmodule === 'servicios-catalogo' ? 'Actualización de precios de servicios por inflación' : 'Actualización de precios por inflación'}
                  </h3>
                  <p className="font-body-md text-xs text-slate-600">
                    {activeSubmodule === 'servicios-catalogo'
                      ? 'Aplica un ajuste porcentual masivo sobre el catálogo de prestaciones y servicios'
                      : 'Aplica un ajuste porcentual masivo sobre el catálogo de productos'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => { setShowInflationModal(false); setInflationSuccessMsg(null); }}
                className="text-slate-400 hover:text-slate-700 transition-colors p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-slate-100 cursor-pointer"
                title="Cerrar"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {inflationSuccessMsg ? (
              <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-md text-center text-emerald-900 font-semibold text-xs animate-fade-in flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-[28px]">check_circle</span>
                <span>{inflationSuccessMsg}</span>
              </div>
            ) : (
              <form onSubmit={handleApplyInflation} className="flex flex-col gap-md text-xs">
                {/* Scope Selection */}
                <div>
                  <label className="font-semibold text-xs text-slate-800 block mb-1.5">
                    {activeSubmodule === 'servicios-catalogo' ? '¿A qué servicios desea aplicar el ajuste?' : '¿A qué productos desea aplicar el ajuste?'}
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const count = activeSubmodule === 'servicios-catalogo' ? selectedServiceIds.length : selectedProductIds.length;
                        if (count === 0) {
                          setIsSelectionMode(true);
                          setShowInflationModal(false);
                        } else {
                          setInflationScope('selected');
                        }
                      }}
                      className={`p-2 min-h-[44px] rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                        inflationScope === 'selected'
                          ? 'bg-[#5C3C7B] text-white border-[#5C3C7B] shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                      title={
                        (activeSubmodule === 'servicios-catalogo' ? selectedServiceIds.length : selectedProductIds.length) === 0
                          ? 'Clic para elegir productos o servicios específicos de la lista'
                          : 'Aplicar a los ítems seleccionados'
                      }
                    >
                      <span className="text-[11px] font-bold">Seleccionados</span>
                      <span className="text-[10px] opacity-80 font-medium">
                        {(activeSubmodule === 'servicios-catalogo' ? selectedServiceIds.length : selectedProductIds.length) > 0
                          ? `(${activeSubmodule === 'servicios-catalogo' ? selectedServiceIds.length : selectedProductIds.length} items)`
                          : '(Elegir en lista)'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setInflationScope('category')}
                      className={`p-2 min-h-[44px] rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                        inflationScope === 'category'
                          ? 'bg-[#5C3C7B] text-white border-[#5C3C7B] shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-[11px] font-bold">Por categoría</span>
                      <span className="text-[10px] opacity-80 font-medium truncate max-w-[100px]">({inflationCategory})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setInflationScope('all')}
                      className={`p-2 min-h-[44px] rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                        inflationScope === 'all'
                          ? 'bg-[#5C3C7B] text-white border-[#5C3C7B] shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-[11px] font-bold">Todos</span>
                      <span className="text-[10px] opacity-80 font-medium">
                        ({activeSubmodule === 'servicios-catalogo' ? servicesCatalog.length + ' servicios' : products.length + ' productos'})
                      </span>
                    </button>
                  </div>
                </div>

                {/* Si está en 'selected' y hay ítems seleccionados, botón para modificar selección */}
                {inflationScope === 'selected' && (activeSubmodule === 'servicios-catalogo' ? selectedServiceIds.length : selectedProductIds.length) > 0 && (
                  <div className="flex items-center justify-between bg-purple-50/80 p-2.5 px-3 rounded-xl border border-purple-200 text-xs animate-fade-in">
                    <span className="font-semibold text-[#5C3C7B]">
                      {activeSubmodule === 'servicios-catalogo' ? selectedServiceIds.length : selectedProductIds.length} {activeSubmodule === 'servicios-catalogo' ? 'servicio(s)' : 'producto(s)'} listos para ajustar
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsSelectionMode(true);
                        setShowInflationModal(false);
                      }}
                      className="text-xs font-bold text-[#5C3C7B] hover:underline cursor-pointer flex items-center gap-1 min-h-[36px]"
                    >
                      <span className="material-symbols-outlined text-[15px]" aria-hidden="true">edit</span>
                      <span>Modificar en la lista</span>
                    </button>
                  </div>
                )}

                {/* Category Dropdown if Scope is Category */}
                {inflationScope === 'category' && (
                  <div className="animate-fade-in">
                    <label className="font-semibold text-xs text-slate-800 block mb-1">
                      Seleccionar categoría a actualizar *
                    </label>
                    <select
                      value={inflationCategory}
                      onChange={(e) => setInflationCategory(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2.5 px-3 min-h-[44px] text-base sm:text-xs text-slate-900 font-semibold outline-none focus:border-[#5C3C7B] focus:ring-2 focus:ring-[#5C3C7B]/20 cursor-pointer"
                    >
                      {activeSubmodule === 'servicios-catalogo'
                        ? serviceCategories.filter(c => c !== 'Todos').map(c => (
                            <option key={c} value={c}>
                              {c} ({servicesCatalog.filter(s => s.category.toLowerCase() === c.toLowerCase()).length} servicios)
                            </option>
                          ))
                        : categories.filter(c => c !== 'Todos').map(c => (
                            <option key={c} value={c}>
                              {c} ({products.filter(p => p.category === c).length} productos)
                            </option>
                          ))
                      }
                    </select>
                  </div>
                )}

                {/* Percentage Input & Quick Preset Buttons */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-xs text-slate-800">
                      Porcentaje de variación (%) *
                    </label>
                    <span className="text-[11px] font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      {inflationPercentage > 0 ? `+${inflationPercentage}% Aumento` : `${inflationPercentage}% Descuento`}
                    </span>
                  </div>

                  <div className="relative flex items-center">
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.1"
                      value={inflationPercentage}
                      onChange={(e) => setInflationPercentage(Number(e.target.value))}
                      placeholder="Ej: 15"
                      required
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2.5 px-3 pr-10 text-base sm:text-xs text-slate-900 font-bold outline-none focus:border-[#5C3C7B] focus:ring-2 focus:ring-[#5C3C7B]/20"
                    />
                    <span className="absolute right-3 font-bold text-slate-500">%</span>
                  </div>

                  {/* Preset Pills */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {[5, 10, 15, 20, 25, 30].map(pct => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setInflationPercentage(pct)}
                        className={`px-3 py-2 min-h-[38px] rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          inflationPercentage === pct
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        +{pct}%
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setInflationPercentage(-5)}
                      className={`px-3 py-2 min-h-[38px] rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        inflationPercentage === -5
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                      }`}
                    >
                      -5%
                    </button>
                  </div>
                </div>

                {/* Live Preview List */}
                <div>
                  <label className="font-semibold text-xs text-slate-800 block mb-1">
                    Vista previa de cálculo ({activeSubmodule === 'servicios-catalogo' ? 'Primeros servicios afectados' : 'Primeros productos afectados'}):
                  </label>
                  <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl bg-slate-50/70 p-1.5 flex flex-col gap-1">
                    {(() => {
                      if (activeSubmodule === 'servicios-catalogo') {
                        const targets = servicesCatalog.filter(s => {
                          if (inflationScope === 'selected') return selectedServiceIds.includes(s.id);
                          if (inflationScope === 'category') return s.category.toLowerCase() === inflationCategory.toLowerCase();
                          return true;
                        });

                        if (targets.length === 0) {
                          return (
                            <div className="text-center py-3 text-slate-400 text-xs">
                              No hay servicios que coincidan con la selección.
                            </div>
                          );
                        }

                        return targets.slice(0, 5).map(s => {
                          const newPrice = Math.round(s.price * (1 + inflationPercentage / 100) * 100) / 100;
                          const diff = newPrice - s.price;
                          return (
                            <div key={s.id} className="flex items-center justify-between text-[11px] bg-white p-1.5 px-2 rounded-lg border border-slate-200">
                              <span className="font-semibold text-slate-800 truncate max-w-[160px]">{s.name}</span>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-slate-500 line-through">${s.price.toLocaleString('es-AR')}</span>
                                <span className="material-symbols-outlined text-[12px] text-slate-400">arrow_forward</span>
                                <span className="font-bold text-[#5C3C7B]">${newPrice.toLocaleString('es-AR')}</span>
                                <span className={`text-[10px] font-semibold px-1 rounded ${
                                  diff >= 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                                }`}>
                                  {diff >= 0 ? `+$${diff.toLocaleString('es-AR')}` : `-$${Math.abs(diff).toLocaleString('es-AR')}`}
                                </span>
                              </div>
                            </div>
                          );
                        });
                      }

                      const targets = products.filter(p => {
                        if (inflationScope === 'selected') return selectedProductIds.includes(p.id);
                        if (inflationScope === 'category') return p.category === inflationCategory;
                        return true;
                      });

                      if (targets.length === 0) {
                        return (
                          <div className="text-center py-3 text-slate-400 text-xs">
                            No hay productos que coincidan con la selección.
                          </div>
                        );
                      }

                      return targets.slice(0, 5).map(p => {
                        const newPrice = Math.round(p.price * (1 + inflationPercentage / 100) * 100) / 100;
                        const diff = newPrice - p.price;
                        return (
                          <div key={p.id} className="flex items-center justify-between text-[11px] bg-white p-1.5 px-2 rounded-lg border border-slate-200">
                            <span className="font-semibold text-slate-800 truncate max-w-[160px]">{p.name}</span>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-slate-500 line-through">${p.price.toLocaleString('es-AR')}</span>
                              <span className="material-symbols-outlined text-[12px] text-slate-400">arrow_forward</span>
                              <span className="font-bold text-[#5C3C7B]">${newPrice.toLocaleString('es-AR')}</span>
                              <span className={`text-[10px] font-semibold px-1 rounded ${
                                diff >= 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                              }`}>
                                {diff >= 0 ? `+$${diff.toLocaleString('es-AR')}` : `-$${Math.abs(diff).toLocaleString('es-AR')}`}
                              </span>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-sm pt-sm border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => { setShowInflationModal(false); setInflationSuccessMsg(null); }}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-[#27AE60] hover:bg-[#219653] text-white px-5 py-2.5 rounded-xl font-label-md text-xs font-semibold shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">check</span>
                    <span>Aplicar {inflationPercentage > 0 ? `aumento (+${inflationPercentage}%)` : `ajuste (${inflationPercentage}%)`}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
