import { ExpenseRecord } from '../types';

export function createExpenseRecord(input: {
  date: string;
  responsible: string;
  category: string;
  allocation: string;
  paymentMethod: string;
  description: string;
  amount: number;
  note?: string;
}): ExpenseRecord {
  return {
    id: 'exp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    date: input.date,
    responsible: input.responsible,
    category: input.category,
    allocation: input.allocation,
    paymentMethod: input.paymentMethod,
    description: input.description,
    amount: input.amount,
    note: input.note
  };
}

export function filterExpenseRecords(
  expenses: ExpenseRecord[],
  filters: {
    responsible?: string;
    period?: string; // YYYY-MM
    category?: string;
    allocation?: string;
    paymentMethod?: string;
  }
): ExpenseRecord[] {
  return expenses.filter(exp => {
    if (filters.responsible && filters.responsible !== 'all') {
      if (exp.responsible.toLowerCase() !== filters.responsible.toLowerCase()) {
        return false;
      }
    }

    if (filters.period && filters.period !== 'all') {
      // period can be YYYY-MM
      if (!exp.date.startsWith(filters.period)) {
        return false;
      }
    }

    if (filters.category && filters.category !== 'all') {
      if (exp.category.toLowerCase() !== filters.category.toLowerCase()) {
        return false;
      }
    }

    if (filters.allocation && filters.allocation !== 'all') {
      if (exp.allocation.toLowerCase() !== filters.allocation.toLowerCase()) {
        return false;
      }
    }

    if (filters.paymentMethod && filters.paymentMethod !== 'all') {
      if (!exp.paymentMethod.toLowerCase().includes(filters.paymentMethod.toLowerCase())) {
        return false;
      }
    }

    return true;
  });
}

export function calculateExpenseTotals(expenses: ExpenseRecord[]): {
  totalAmount: number;
  count: number;
} {
  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  return {
    totalAmount,
    count: expenses.length
  };
}
