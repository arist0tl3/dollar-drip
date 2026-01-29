import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema(
  {
    householdId: { type: mongoose.Schema.Types.ObjectId, ref: 'Household', required: true },
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
    memberName: String,
    amount: { type: Number, required: true },
    category: { type: String, required: true },
    note: String,
    weekStart: { type: Date, required: true },
    deletedAt: Date,
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

TransactionSchema.index({ householdId: 1, weekStart: 1, deletedAt: 1 });

export default mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
