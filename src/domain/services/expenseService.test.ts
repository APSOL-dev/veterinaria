import { describe, it, expect } from 'vitest';
import { ExpenseRecord } from '../types';
import { 
  createExpenseRecord, 
  filterExpenseRecords, 
  calculateExpenseTotals,
  prepareExpenseForCopy,
  addCustomCategory,
  removeCustomCategory,
  addCustomAllocation,
  removeCustomAllocation,
  addCustomResponsible,
  removeCustomResponsible
} from './expenseService';

describe('expenseService', () => {
  it('createExpenseRecord should create a valid ExpenseRecord', () => {
    const expense = createExpenseRecord({
      date: '2026-08-25',
      responsible: 'alberto',
      category: 'Combustible',
      allocation: 'Local Chaco mayorista',
      paymentMethod: 'Caja administración, Mercado Pago',
      description: 'CARGO JOAQUIN CON...',
      amount: 78000,
      note: 'LA TRANSF HZ...'
    });

    expect(expense.id).toBeDefined();
    expect(expense.responsible).toBe('alberto');
    expect(expense.amount).toBe(78000);
    expect(expense.category).toBe('Combustible');
  });

  it('filterExpenseRecords should filter expenses by multiple criteria', () => {
    const expenses: ExpenseRecord[] = [
      {
        id: 'e1',
        date: '2026-08-25',
        responsible: 'alberto',
        category: 'Gastos varios',
        allocation: 'Local Chaco minorista',
        paymentMethod: 'Efectivo, Caja chica',
        description: 'REJILLA GRANDE',
        amount: 3000
      },
      {
        id: 'e2',
        date: '2026-08-25',
        responsible: 'alberto',
        category: 'Combustible',
        allocation: 'Local Chaco mayorista',
        paymentMethod: 'Caja administración, Mercado Pago',
        description: 'CARGO JOAQUIN',
        amount: 78000
      },
      {
        id: 'e3',
        date: '2026-08-21',
        responsible: 'sele',
        category: 'Viáticos',
        allocation: 'Local Santa Fe mayorista',
        paymentMethod: 'Caja administración',
        description: 'viaje la paz - goya',
        amount: 10.71
      }
    ];

    // Filter by responsible
    const byResp = filterExpenseRecords(expenses, { responsible: 'alberto' });
    expect(byResp.length).toBe(2);

    // Filter by category
    const byCat = filterExpenseRecords(expenses, { category: 'Combustible' });
    expect(byCat.length).toBe(1);
    expect(byCat[0].id).toBe('e2');

    // Filter by period (2026-08)
    const byPeriod = filterExpenseRecords(expenses, { period: '2026-08' });
    expect(byPeriod.length).toBe(3);

    // Filter by allocation
    const byAlloc = filterExpenseRecords(expenses, { allocation: 'Local Chaco minorista' });
    expect(byAlloc.length).toBe(1);

    // Filter by payment method
    const byPay = filterExpenseRecords(expenses, { paymentMethod: 'Caja administración' });
    expect(byPay.length).toBe(2); // e2 and e3 contain 'Caja administración'
  });

  it('calculateExpenseTotals should compute total amount and record count', () => {
    const expenses: ExpenseRecord[] = [
      { id: '1', date: '2026-08-25', responsible: 'A', category: 'C1', allocation: 'A1', paymentMethod: 'P1', description: 'D1', amount: 3000 },
      { id: '2', date: '2026-08-25', responsible: 'B', category: 'C2', allocation: 'A2', paymentMethod: 'P2', description: 'D2', amount: 78000 }
    ];

    const totals = calculateExpenseTotals(expenses);
    expect(totals.totalAmount).toBe(81000);
    expect(totals.count).toBe(2);
  });

  it('prepareExpenseForCopy should return expense data without id for pre-filling form modal', () => {
    const original: ExpenseRecord = {
      id: 'exp-123',
      date: '2026-08-28',
      responsible: 'Administración',
      category: 'Gastos varios',
      allocation: 'Operativo',
      paymentMethod: 'Efectivo',
      description: 'Supermercado',
      amount: 1000,
      note: 'Compra insumos'
    };

    const copiedData = prepareExpenseForCopy(original);

    expect(copiedData).toEqual({
      date: '2026-08-28',
      responsible: 'Administración',
      category: 'Gastos varios',
      allocation: 'Operativo',
      paymentMethod: 'Efectivo',
      description: 'Supermercado',
      amount: 1000,
      note: 'Compra insumos'
    });
  });

  it('addCustomCategory and removeCustomCategory should manage categories correctly', () => {
    const initial: string[] = ['Marketing'];
    const added = addCustomCategory(initial, 'Publicidad');
    expect(added).toEqual(['Marketing', 'Publicidad']);

    const duplicate = addCustomCategory(added, 'Publicidad');
    expect(duplicate).toEqual(['Marketing', 'Publicidad']);

    const removed = removeCustomCategory(added, 'Marketing');
    expect(removed).toEqual(['Publicidad']);
  });

  it('addCustomAllocation and removeCustomAllocation should manage allocations correctly', () => {
    const initial: string[] = ['Sucursal Norte'];
    const added = addCustomAllocation(initial, 'Sucursal Centro');
    expect(added).toEqual(['Sucursal Norte', 'Sucursal Centro']);

    const removed = removeCustomAllocation(added, 'Sucursal Norte');
    expect(removed).toEqual(['Sucursal Centro']);
  });

  it('addCustomResponsible and removeCustomResponsible should manage responsibles correctly', () => {
    const initial: string[] = ['Recepción'];
    const added = addCustomResponsible(initial, 'Dr. Gómez');
    expect(added).toEqual(['Recepción', 'Dr. Gómez']);

    const removed = removeCustomResponsible(added, 'Recepción');
    expect(removed).toEqual(['Dr. Gómez']);
  });
});
