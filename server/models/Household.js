import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema({
  id: String,
  label: String,
  icon: String,
  color: String,
});

const HouseholdSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    weeklyBudget: { type: Number, required: true },
    resetDay: { type: String, default: 'monday' },
    timezone: { type: String, default: 'UTC' },
    categories: { type: [CategorySchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.models.Household || mongoose.model('Household', HouseholdSchema);
