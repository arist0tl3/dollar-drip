import mongoose from 'mongoose';

const MemberSchema = new mongoose.Schema(
  {
    householdId: { type: mongoose.Schema.Types.ObjectId, ref: 'Household', required: true },
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    role: { type: String, enum: ['owner', 'member'], default: 'member' },
    magicToken: String,
    magicTokenExpires: Date,
    lastActiveAt: Date,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

MemberSchema.index({ email: 1, householdId: 1 }, { unique: true });

export default mongoose.models.Member || mongoose.model('Member', MemberSchema);
