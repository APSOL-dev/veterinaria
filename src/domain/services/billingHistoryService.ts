import { BillReceipt, DocumentType, PaymentMethod } from '../types';

export type BillingHistoryDatePreset = 'all' | 'today' | 'last_7_days' | 'this_month' | 'this_year';

export interface BillingHistoryFilterOptions {
  searchQuery?: string;
  documentType?: DocumentType | 'all';
  paymentMethod?: PaymentMethod | 'all';
  datePreset?: BillingHistoryDatePreset;
  sortBy?: 'receiptNumber' | 'date' | 'ownerName' | 'documentType' | 'paymentMethod' | 'total' | 'itemsCount';
  sortDirection?: 'asc' | 'desc';
}

export function filterAndSortReceipts(
  receipts: BillReceipt[],
  options: BillingHistoryFilterOptions = {}
): BillReceipt[] {
  const {
    searchQuery = '',
    documentType = 'all',
    paymentMethod = 'all',
    datePreset = 'all',
    sortBy = 'date',
    sortDirection = 'desc'
  } = options;

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const now = new Date();

  const filtered = receipts.filter(receipt => {
    // 1. Filter by Document Type
    if (documentType !== 'all' && receipt.documentType !== documentType) {
      return false;
    }

    // 2. Filter by Payment Method
    if (paymentMethod !== 'all' && receipt.paymentMethod !== paymentMethod) {
      return false;
    }

    // 3. Filter by Date Preset
    if (datePreset !== 'all' && receipt.date) {
      const receiptDate = new Date(receipt.date);
      if (!isNaN(receiptDate.getTime())) {
        if (datePreset === 'today') {
          const isToday =
            receiptDate.getFullYear() === now.getFullYear() &&
            receiptDate.getMonth() === now.getMonth() &&
            receiptDate.getDate() === now.getDate();
          if (!isToday) return false;
        } else if (datePreset === 'last_7_days') {
          const sevenDaysAgo = new Date(now);
          sevenDaysAgo.setDate(now.getDate() - 7);
          if (receiptDate < sevenDaysAgo) return false;
        } else if (datePreset === 'this_month') {
          const isThisMonth =
            receiptDate.getFullYear() === now.getFullYear() &&
            receiptDate.getMonth() === now.getMonth();
          if (!isThisMonth) return false;
        } else if (datePreset === 'this_year') {
          if (receiptDate.getFullYear() !== now.getFullYear()) return false;
        }
      }
    }

    // 4. Filter by General Search Query
    if (normalizedQuery) {
      const receiptNumber = (receipt.receiptNumber || '').toLowerCase();
      const ownerName = (receipt.ownerName || receipt.clientName || '').toLowerCase();
      const patientName = (receipt.patientName || '').toLowerCase();
      const docType = (receipt.documentType || '').toLowerCase();
      const payMethod = (receipt.paymentMethod || '').toLowerCase();
      const voucherName = (receipt.voucherName || '').toLowerCase();
      const afipCae = (receipt.afipCae || '').toLowerCase();

      const matchesItems = receipt.items && receipt.items.some(item => 
        (item.description || '').toLowerCase().includes(normalizedQuery) ||
        (item.category || '').toLowerCase().includes(normalizedQuery)
      );

      const matchesMain =
        receiptNumber.includes(normalizedQuery) ||
        ownerName.includes(normalizedQuery) ||
        patientName.includes(normalizedQuery) ||
        docType.includes(normalizedQuery) ||
        payMethod.includes(normalizedQuery) ||
        voucherName.includes(normalizedQuery) ||
        afipCae.includes(normalizedQuery);

      if (!matchesMain && !matchesItems) {
        return false;
      }
    }

    return true;
  });

  // 5. Sort Receipts
  return [...filtered].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'receiptNumber': {
        const numA = a.receiptNumber || '';
        const numB = b.receiptNumber || '';
        comparison = numA.localeCompare(numB, undefined, { numeric: true, sensitivity: 'base' });
        break;
      }
      case 'date': {
        const timeA = new Date(a.date).getTime() || 0;
        const timeB = new Date(b.date).getTime() || 0;
        comparison = timeA - timeB;
        break;
      }
      case 'ownerName': {
        const nameA = (a.ownerName || a.clientName || '').toLowerCase();
        const nameB = (b.ownerName || b.clientName || '').toLowerCase();
        comparison = nameA.localeCompare(nameB, 'es', { sensitivity: 'base' });
        break;
      }
      case 'documentType': {
        const docA = (a.documentType || '').toLowerCase();
        const docB = (b.documentType || '').toLowerCase();
        comparison = docA.localeCompare(docB);
        break;
      }
      case 'paymentMethod': {
        const payA = (a.paymentMethod || '').toLowerCase();
        const payB = (b.paymentMethod || '').toLowerCase();
        comparison = payA.localeCompare(payB);
        break;
      }
      case 'itemsCount': {
        const countA = (a.items && a.items.length) || 0;
        const countB = (b.items && b.items.length) || 0;
        comparison = countA - countB;
        break;
      }
      case 'total': {
        const totalA = a.totalAmount ?? a.total ?? 0;
        const totalB = b.totalAmount ?? b.total ?? 0;
        comparison = totalA - totalB;
        break;
      }
      default:
        comparison = 0;
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });
}
