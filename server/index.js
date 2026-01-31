import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { connectDB } from './db.js';
import Household from './models/Household.js';
import Member from './models/Member.js';
import Transaction from './models/Transaction.js';
import Session from './models/Session.js';
import { getWeekStart, randomToken } from './utils.js';

dotenv.config();

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
  })
);

const DEFAULT_CATEGORIES = [
  { id: 'groceries', label: 'Groceries', icon: '🛒', color: 'bg-green-500' },
  { id: 'dining', label: 'Dining', icon: '🍽️', color: 'bg-orange-500' },
  { id: 'drinks', label: 'Drinks', icon: '🍺', color: 'bg-amber-500' },
  { id: 'gas', label: 'Gas', icon: '⛽', color: 'bg-blue-500' },
  { id: 'other', label: 'Other', icon: '💳', color: 'bg-purple-500' },
];

async function authMiddleware(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ success: false, error: 'Unauthorized' });
  const session = await Session.findOne({ token });
  if (!session) return res.status(401).json({ success: false, error: 'Invalid session' });
  const member = await Member.findById(session.memberId);
  if (!member) return res.status(401).json({ success: false, error: 'Invalid member' });
  req.session = session;
  req.member = member;
  next();
}

function sanitizeHousehold(household, members) {
  return {
    ...household.toObject(),
    id: household._id,
    members: members.map((m) => ({
      id: m._id,
      _id: m._id,
      name: m.name,
      email: m.email,
      role: m.role,
    })),
  };
}

app.get('/health', (req, res) => res.json({ ok: true }));

app.post('/api/households', async (req, res) => {
  try {
    const { name, weeklyBudget, timezone = 'UTC', owner, members = [] } = req.body;
    if (!name || !owner?.email || !owner?.name || !weeklyBudget) {
      return res.status(400).json({ success: false, error: 'Missing fields' });
    }
    const ownerEmail = (owner.email || '').toLowerCase();

    const household = await Household.create({
      name,
      weeklyBudget,
      timezone,
      categories: DEFAULT_CATEGORIES,
    });

    const ownerDoc = await Member.create({
      householdId: household._id,
      name: owner.name,
      email: ownerEmail,
      role: 'owner',
    });

    const createdMembers = [ownerDoc];

    for (const member of members) {
      const m = await Member.create({
        householdId: household._id,
        name: member.name,
        email: (member.email || '').toLowerCase(),
        role: 'member',
        magicToken: crypto.randomBytes(32).toString('hex'),
        magicTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });
      createdMembers.push(m);
    }

    const sessionToken = randomToken();
    const session = await Session.create({
      memberId: ownerDoc._id,
      householdId: household._id,
      token: sessionToken,
    });

    return res.json({
      success: true,
      household: sanitizeHousehold(household, createdMembers),
      ownerSession: {
        token: session.token,
        member: { id: ownerDoc._id, _id: ownerDoc._id, name: ownerDoc.name, email: ownerDoc.email, role: ownerDoc.role },
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Failed to create household' });
  }
});

app.get('/api/households/:id', authMiddleware, async (req, res) => {
  try {
    const household = await Household.findById(req.params.id);
    if (!household) return res.status(404).json({ success: false, error: 'Household not found' });
    if (!household._id.equals(req.session.householdId)) return res.status(403).json({ success: false, error: 'Forbidden' });
    const members = await Member.find({ householdId: household._id });
    return res.json({ household: sanitizeHousehold(household, members) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Failed to load household' });
  }
});

app.patch('/api/households/:id', authMiddleware, async (req, res) => {
  try {
    const { weeklyBudget, timezone } = req.body;
    const household = await Household.findById(req.params.id);
    if (!household) return res.status(404).json({ success: false, error: 'Household not found' });
    if (!household._id.equals(req.session.householdId)) return res.status(403).json({ success: false, error: 'Forbidden' });
    if (weeklyBudget) household.weeklyBudget = weeklyBudget;
    if (timezone) household.timezone = timezone;
    await household.save();
    const members = await Member.find({ householdId: household._id });
    return res.json({ success: true, household: sanitizeHousehold(household, members) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Failed to update household' });
  }
});

app.post('/api/households/:id/members', authMiddleware, async (req, res) => {
  try {
    const { name, email } = req.body;
    const household = await Household.findById(req.params.id);
    if (!household) return res.status(404).json({ success: false, error: 'Household not found' });
    if (!household._id.equals(req.session.householdId)) return res.status(403).json({ success: false, error: 'Forbidden' });

    const magicToken = crypto.randomBytes(32).toString('hex');
    const member = await Member.create({
      householdId: household._id,
      name,
      email: (email || '').toLowerCase(),
      role: 'member',
      magicToken,
      magicTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const inviteLink = `${process.env.APP_URL || 'http://localhost:3000'}/join?token=${magicToken}`;
    return res.json({ success: true, member, inviteLink });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Failed to add member' });
  }
});

app.post('/api/auth/magic-link', async (req, res) => {
  try {
    const { email } = req.body;
    const member = await Member.findOne({ email: (email || '').toLowerCase() });
    if (!member) return res.status(404).json({ success: false, error: 'User not found' });
    const token = crypto.randomBytes(32).toString('hex');
    member.magicToken = token;
    member.magicTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await member.save();
    return res.json({ success: true, message: 'Magic link generated', token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Failed to create magic link' });
  }
});

app.get('/api/auth/verify', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ success: false, error: 'Missing token' });
    const member = await Member.findOne({ magicToken: token, magicTokenExpires: { $gte: new Date() } });
    if (!member) return res.status(400).json({ success: false, error: 'Invalid or expired token' });
    const sessionToken = randomToken();
    const session = await Session.create({
      memberId: member._id,
      householdId: member.householdId,
      token: sessionToken,
    });
    const household = await Household.findById(member.householdId);
    return res.json({
      success: true,
      session: {
        token: session.token,
        member: { id: member._id, name: member.name, email: member.email },
        household: { id: household._id, name: household.name, weeklyBudget: household.weeklyBudget },
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Failed to verify token' });
  }
});

app.post('/api/auth/logout', authMiddleware, async (req, res) => {
  try {
    await Session.deleteOne({ token: req.session.token });
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Failed to logout' });
  }
});

app.get('/api/households/:id/transactions', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { weekStart } = req.query;
    if (req.session.householdId.toString() !== id) return res.status(403).json({ success: false, error: 'Forbidden' });
    const filter = { householdId: id, deletedAt: null };
    if (weekStart) {
      filter.weekStart = new Date(weekStart);
    }
    const transactions = await Transaction.find(filter).sort({ createdAt: -1 });
    const household = await Household.findById(id);
    const currentWeekStart = getWeekStart(household.timezone).toISOString();
    const weekly = transactions.filter((t) => t.weekStart.toISOString() === currentWeekStart);
    const totalSpent = weekly.reduce((sum, t) => sum + t.amount, 0);
    return res.json({
      weekStart: currentWeekStart,
      weeklyBudget: household.weeklyBudget,
      totalSpent,
      remaining: household.weeklyBudget - totalSpent,
      transactions,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Failed to load transactions' });
  }
});

app.post('/api/households/:id/transactions', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, category, note } = req.body;
    const household = await Household.findById(id);
    if (!household) return res.status(404).json({ success: false, error: 'Household not found' });
    if (!household._id.equals(req.session.householdId)) return res.status(403).json({ success: false, error: 'Forbidden' });
    if (!amount || amount <= 0) return res.status(400).json({ success: false, error: 'Invalid amount' });
    const weekStart = getWeekStart(household.timezone);

    const transaction = await Transaction.create({
      householdId: household._id,
      memberId: req.member._id,
      memberName: req.member.name,
      amount,
      category,
      note,
      weekStart,
      deletedAt: null,
    });

    const currentWeekStart = weekStart.toISOString();
    const weeklyTransactions = await Transaction.find({ householdId: household._id, weekStart, deletedAt: null });
    const totalSpent = weeklyTransactions.reduce((sum, t) => sum + t.amount, 0);

    return res.json({
      success: true,
      transaction,
      household,
      newBalance: { totalSpent, remaining: household.weeklyBudget - totalSpent },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Failed to create transaction' });
  }
});

app.delete('/api/households/:id/transactions/:transactionId', authMiddleware, async (req, res) => {
  try {
    const { id, transactionId } = req.params;
    const household = await Household.findById(id);
    if (!household) return res.status(404).json({ success: false, error: 'Household not found' });
    if (!household._id.equals(req.session.householdId)) return res.status(403).json({ success: false, error: 'Forbidden' });
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) return res.status(404).json({ success: false, error: 'Not found' });
    transaction.deletedAt = new Date();
    await transaction.save();
    const weekly = await Transaction.find({ householdId: id, weekStart: transaction.weekStart, deletedAt: null });
    const totalSpent = weekly.reduce((sum, t) => sum + t.amount, 0);
    return res.json({ success: true, newBalance: { totalSpent, remaining: household.weeklyBudget - totalSpent }, household });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Failed to delete transaction' });
  }
});

const port = process.env.PORT || 3001;

async function start() {
  await connectDB(process.env.MONGODB_URI);
  app.listen(port, () => {
    console.log(`API running on port ${port}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});
