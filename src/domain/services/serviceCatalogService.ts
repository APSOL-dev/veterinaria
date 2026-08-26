import { ServiceCatalogItem } from '../types';

export function updateServicePrice(
  service: ServiceCatalogItem,
  newPrice: number,
  updatedDate: string = new Date().toISOString().split('T')[0]
): ServiceCatalogItem {
  return {
    ...service,
    price: newPrice,
    priceLastUpdated: updatedDate
  };
}

export function toggleServiceStatus(service: ServiceCatalogItem): ServiceCatalogItem {
  return {
    ...service,
    isActive: !service.isActive
  };
}

export function recordServiceSale(
  service: ServiceCatalogItem,
  saleDate: string = new Date().toISOString().split('T')[0]
): ServiceCatalogItem {
  return {
    ...service,
    lastSoldAt: saleDate
  };
}
