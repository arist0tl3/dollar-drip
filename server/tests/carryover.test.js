import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getCarryOverAmount } from '../carryover.js';
import Transaction from '../models/Transaction.js';

vi.mock('../models/Transaction.js', () => ({
  default: {
    find: vi.fn(),
  },
}));

describe('getCarryOverAmount', () => {
  const household = {
    _id: 'h1',
    weeklyBudget: 500,
    carryOverSurplus: true,
    carryOverDebt: true,
  };

  beforeEach(() => {
    Transaction.find.mockReset();
  });

  it('returns 0 when no previous transactions', async () => {
    Transaction.find.mockResolvedValue([]);
    const amount = await getCarryOverAmount(household, new Date('2026-02-03T00:00:00Z'));
    expect(amount).toBe(0);
  });

  it('returns surplus when enabled', async () => {
    Transaction.find.mockResolvedValue([{ amount: 200 }, { amount: 100 }]);
    const amount = await getCarryOverAmount(household, new Date('2026-02-03T00:00:00Z'));
    expect(amount).toBe(200);
  });

  it('returns 0 when surplus is disabled', async () => {
    Transaction.find.mockResolvedValue([{ amount: 100 }]);
    const amount = await getCarryOverAmount(
      { ...household, carryOverSurplus: false },
      new Date('2026-02-03T00:00:00Z')
    );
    expect(amount).toBe(0);
  });

  it('returns negative when debt is enabled', async () => {
    Transaction.find.mockResolvedValue([{ amount: 300 }, { amount: 400 }]);
    const amount = await getCarryOverAmount(household, new Date('2026-02-03T00:00:00Z'));
    expect(amount).toBe(-200);
  });

  it('returns 0 when debt is disabled', async () => {
    Transaction.find.mockResolvedValue([{ amount: 700 }]);
    const amount = await getCarryOverAmount(
      { ...household, carryOverDebt: false },
      new Date('2026-02-03T00:00:00Z')
    );
    expect(amount).toBe(0);
  });
});
