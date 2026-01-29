import mongoose from 'mongoose';

const SessionSchema = new mongoose.Schema(
  {
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
    householdId: { type: mongoose.Schema.Types.ObjectId, ref: 'Household', required: true },
    token: { type: String, required: true },
    deviceInfo: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

SessionSchema.index({ token: 1 }, { unique: true });

export default mongoose.models.Session || mongoose.model('Session', SessionSchema);
