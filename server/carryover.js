import Transaction from './models/Transaction.js';

export async function getCarryOverAmount(household, targetWeekStart) {
  const prevWeekStart = new Date(targetWeekStart);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);

  const prevWeekTransactions = await Transaction.find({
    householdId: household._id,
    weekStart: prevWeekStart,
    deletedAt: null,
  });

  if (prevWeekTransactions.length === 0) return 0;

  const prevTotal = prevWeekTransactions.reduce((sum, t) => sum + t.amount, 0);
  const prevRemaining = household.weeklyBudget - prevTotal;

  if (prevRemaining > 0 && household.carryOverSurplus) return prevRemaining;
  if (prevRemaining < 0 && household.carryOverDebt) return prevRemaining;
  return 0;
}
