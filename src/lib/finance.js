// src/lib/finance.js
// Utility for recording milk cost and other consumptions in finance

const FINANCE_KEY = 'cattalytics:finance';

export function addMilkExpense({ date, calfId, quantityKg, quantityLiters, pricePerKg, reason }) {
  // Convert kg to liters (1 kg milk ≈ 0.97 liters, but use 1:1 for simplicity)
  const liters = quantityLiters || quantityKg;
  const amount = pricePerKg * quantityKg;
  const record = {
    id: 'FIN-' + Date.now(),
    type: 'expense',
    category: 'Milk',
    calfId,
    date,
    quantityKg,
    quantityLiters: liters,
    pricePerKg,
    amount,
    reason,
    timestamp: new Date().toISOString(),
  };
  const raw = localStorage.getItem(FINANCE_KEY);
  const finance = raw ? JSON.parse(raw) : [];
  finance.push(record);
  localStorage.setItem(FINANCE_KEY, JSON.stringify(finance));
  return record;
}

export function getMilkExpenses() {
  const raw = localStorage.getItem(FINANCE_KEY);
  const finance = raw ? JSON.parse(raw) : [];
  return finance.filter(r => r.category === 'Milk');
}

export function getMilkTotals() {
  const expenses = getMilkExpenses();
  const totals = {};
  expenses.forEach(e => {
    const day = e.date;
    if (!totals[day]) totals[day] = { totalKg: 0, totalLiters: 0, totalAmount: 0 };
    totals[day].totalKg += parseFloat(e.quantityKg) || 0;
    totals[day].totalLiters += parseFloat(e.quantityLiters) || 0;
    totals[day].totalAmount += parseFloat(e.amount) || 0;
  });
  // Monthly summary
  const monthly = {};
  expenses.forEach(e => {
    const month = e.date.slice(0,7);
    if (!monthly[month]) monthly[month] = { totalKg: 0, totalLiters: 0, totalAmount: 0 };
    monthly[month].totalKg += parseFloat(e.quantityKg) || 0;
    monthly[month].totalLiters += parseFloat(e.quantityLiters) || 0;
    monthly[month].totalAmount += parseFloat(e.amount) || 0;
  });
  return { daily: totals, monthly };
}
