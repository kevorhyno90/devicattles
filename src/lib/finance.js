// src/lib/finance.js
// Utility for recording milk cost and other consumptions in finance

const FINANCE_KEY = 'cattalytics:finance';

export function addMilkExpense({ date, calfId, quantityKg, quantityLiters, pricePerKg, reason }) {
  // Convert kg to liters (1 kg milk ≈ 0.97 liters, but use 1:1 for simplicity)
  const liters = quantityLiters || quantityKg;
  const amount = pricePerKg * quantityKg;
  // Support extra fields for calf milk, consumed, loss/spoiled
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
    amountFedToCalves: arguments[0].amountFedToCalves || 0,
    amountConsumed: arguments[0].amountConsumed || 0,
    amountLoss: arguments[0].amountLoss || 0,
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
    if (!totals[day]) totals[day] = {
      totalKg: 0, totalLiters: 0, totalAmount: 0,
      totalFedToCalves: 0, totalConsumed: 0, totalLoss: 0
    };
    totals[day].totalKg += parseFloat(e.quantityKg) || 0;
    totals[day].totalLiters += parseFloat(e.quantityLiters) || 0;
    totals[day].totalAmount += parseFloat(e.amount) || 0;
    totals[day].totalFedToCalves += parseFloat(e.amountFedToCalves) || 0;
    totals[day].totalConsumed += parseFloat(e.amountConsumed) || 0;
    totals[day].totalLoss += parseFloat(e.amountLoss) || 0;
  });
  // Monthly summary
  const monthly = {};
  expenses.forEach(e => {
    const month = e.date.slice(0,7);
    if (!monthly[month]) monthly[month] = {
      totalKg: 0, totalLiters: 0, totalAmount: 0,
      totalFedToCalves: 0, totalConsumed: 0, totalLoss: 0
    };
    monthly[month].totalKg += parseFloat(e.quantityKg) || 0;
    monthly[month].totalLiters += parseFloat(e.quantityLiters) || 0;
    monthly[month].totalAmount += parseFloat(e.amount) || 0;
    monthly[month].totalFedToCalves += parseFloat(e.amountFedToCalves) || 0;
    monthly[month].totalConsumed += parseFloat(e.amountConsumed) || 0;
    monthly[month].totalLoss += parseFloat(e.amountLoss) || 0;
  });
  return { daily: totals, monthly };
}
