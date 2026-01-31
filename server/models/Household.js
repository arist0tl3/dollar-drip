import mongoose from 'mongoose';

const HouseholdSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    weeklyBudget: { type: Number, required: true },
    resetDay: { type: Number, default: 1 },
    timezone: { type: String, default: 'UTC' },
    favoriteCategoryIds: { type: [String], default: [] },
    carryOverSurplus: { type: Boolean, default: false },
    carryOverDebt: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Household || mongoose.model('Household', HouseholdSchema);
