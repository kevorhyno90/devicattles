// src/lib/finance.js
// Utility for recording milk cost and other consumptions in finance

const FINANCE_KEY = 'cattalytics:finance';

// Add a generic finance record (income or expense)
export function addFinanceRecord({ date, type, category, amount, description, ...rest }) {
  const record = {
    id: 'FIN-' + Date.now(),
    type, // 'income' or 'expense'
    category,
    amount: parseFloat(amount),
    date,
    description,
    ...rest,
    timestamp: new Date().toISOString(),
  };
  const raw = localStorage.getItem(FINANCE_KEY);
  const finance = raw ? JSON.parse(raw) : [];
  finance.push(record);
  localStorage.setItem(FINANCE_KEY, JSON.stringify(finance));
  return record;
}

// Backward compatible milk expense
export function addMilkExpense({ date, calfId, quantityKg, quantityLiters, pricePerKg, reason }) {
  const liters = quantityLiters || quantityKg;
  const amount = pricePerKg * quantityKg;
  return addFinanceRecord({
    date,
    type: 'expense',
    category: 'Milk',
    calfId,
    quantityKg,
    quantityLiters: liters,
    pricePerKg,
    amount,
    reason,
    amountFedToCalves: arguments[0].amountFedToCalves || 0,
    amountConsumed: arguments[0].amountConsumed || 0,
    amountLoss: arguments[0].amountLoss || 0
  });
}


export function getFinanceRecords(filter = {}) {
  const raw = localStorage.getItem(FINANCE_KEY);
  let finance = raw ? JSON.parse(raw) : [];
  Object.entries(filter).forEach(([k, v]) => {
    finance = finance.filter(r => r[k] === v);
  });
  return finance;
}

export function getMilkExpenses() {
  return getFinanceRecords({ category: 'Milk', type: 'expense' });
}


export function getProfitLossSummary() {
  const records = getFinanceRecords();
  let income = 0, expense = 0;
  records.forEach(r => {
    if (r.type === 'income') income += parseFloat(r.amount) || 0;
    if (r.type === 'expense') expense += parseFloat(r.amount) || 0;
  });
  return { income, expense, profit: income - expense };
}
