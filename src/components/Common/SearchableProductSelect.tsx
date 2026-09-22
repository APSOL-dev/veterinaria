import React, { useState, useRef, useEffect } from 'react';
import { Product } from '../../domain/types';

interface SearchableProductSelectProps {
  products: Product[];
  selectedProductId?: string;
  selectedProductName?: string;
  onSelectProduct: (product: { productId?: string; productName: string; price?: number; category?: string }) => void;
  placeholder?: string;
  className?: string;
}

export const SearchableProductSelect: React.FC<SearchableProductSelectProps> = ({
  products,
  selectedProductId,
  selectedProductName = '',
  onSelectProduct,
  placeholder = '-- Buscar o seleccionar producto --',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(selectedProductName);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchTerm(selectedProductName);
  }, [selectedProductName]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredProducts = products.filter(p => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      p.name.toLowerCase().includes(term) ||
      (p.sku && p.sku.toLowerCase().includes(term)) ||
      (p.category && p.category.toLowerCase().includes(term))
    );
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    setIsOpen(true);
    onSelectProduct({
      productId: undefined,
      productName: val
    });
  };

  const handleSelect = (product: Product) => {
    setSearchTerm(product.name);
    setIsOpen(false);
    onSelectProduct({
      productId: product.id,
      productName: product.name,
      price: product.price,
      category: product.category
    });
  };

  const handleClear = () => {
    setSearchTerm('');
    setIsOpen(false);
    onSelectProduct({
      productId: undefined,
      productName: ''
    });
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div className="relative flex items-center">
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full bg-surface-container/60 border border-outline-variant/40 rounded-xl pr-8 pl-3 py-2 text-xs text-slate-900 outline-none focus:border-[#5C3C7B] focus:ring-2 focus:ring-[#5C3C7B]/20 font-medium truncate"
        />
        {searchTerm ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 text-slate-400 hover:text-slate-700 p-0.5"
            title="Limpiar producto"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        ) : (
          <span className="material-symbols-outlined absolute right-2.5 text-slate-500 pointer-events-none text-[18px]">
            search
          </span>
        )}
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-outline-variant/40 rounded-xl shadow-xl max-h-56 overflow-y-auto font-body-md text-xs">
          {filteredProducts.length === 0 ? (
            <div className="p-3 text-slate-500 text-[11px] text-center italic">
              No hay coincidencia. Se registrará como producto libre: "{searchTerm}"
            </div>
          ) : (
            <div className="py-1">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onSelectProduct({ productId: undefined, productName: searchTerm });
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-purple-50 text-slate-600 text-[11px] border-b border-outline-variant/20 font-medium cursor-pointer"
              >
                -- Ingreso libre / Usar texto "{searchTerm || 'libre'}" --
              </button>
              {filteredProducts.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelect(p)}
                  className={`w-full text-left px-3 py-2 hover:bg-purple-50 flex justify-between items-center transition-colors cursor-pointer ${
                    selectedProductId === p.id ? 'bg-purple-50 text-[#5C3C7B] font-bold' : 'text-slate-800'
                  }`}
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="truncate font-semibold text-xs">{p.name}</span>
                    <span className="text-[10px] text-slate-500">
                      {p.category || 'General'} {p.sku ? `• SKU: ${p.sku}` : ''}
                    </span>
                  </div>
                  <div className="text-right shrink-0 flex flex-col items-end">
                    <span className="font-semibold text-xs text-[#5C3C7B]">
                      $ {(p.price || 0).toLocaleString('es-AR')}
                    </span>
                    {selectedProductId === p.id && (
                      <span className="text-[10px] text-emerald-600 font-bold">Seleccionado</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
