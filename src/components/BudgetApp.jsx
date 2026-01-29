import React, { useEffect, useMemo, useState } from 'react';

const DEFAULT_CATEGORIES = [
  { id: 'groceries', label: 'Groceries', icon: '🛒', color: 'bg-green-500' },
  { id: 'dining', label: 'Dining', icon: '🍽️', color: 'bg-orange-500' },
  { id: 'drinks', label: 'Drinks', icon: '🍺', color: 'bg-amber-500' },
  { id: 'gas', label: 'Gas', icon: '⛽', color: 'bg-blue-500' },
  { id: 'other', label: 'Other', icon: '💳', color: 'bg-purple-500' },
];

const BUDGET_PRESETS = [500, 600, 750, 1000];
const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:3001';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount || 0);

const formatTime = (date) =>
  new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(date));

const getWeekStart = (timezone = 'UTC') => {
  const now = new Date();
  const local = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
  const day = local.getDay();
  const diff = local.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(local.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
};

const getDaysUntilReset = (timezone = 'UTC') => {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: timezone }));
  const day = now.getDay();
  if (day === 0) return 1;
  if (day === 1) return 7;
  return 8 - day;
};

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

async function apiRequest(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || 'Request failed');
  }
  return res.json();
}

function WelcomeScreen({ onGetStarted }) {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        <div className="text-6xl mb-6">💰</div>
        <h1 className="text-3xl font-bold text-white mb-3">Weekly Budget</h1>
        <p className="text-slate-400 mb-8">
          Track spending together. <br />
          Stay on the same page.
        </p>

        <button
          onClick={onGetStarted}
          className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-white font-semibold text-lg transition-colors mb-4"
        >
          Get Started
        </button>

        <button className="text-slate-400 hover:text-white transition-colors text-sm">
          I have a magic link
        </button>
      </div>
    </div>
  );
}

function HouseholdNameScreen({ onNext, householdName, setHouseholdName }) {
  const [error, setError] = useState('');

  const handleNext = () => {
    if (householdName.trim().length < 2) {
      setError('Please enter a name for your household');
      return;
    }
    onNext();
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col p-6">
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        <div className="mb-8">
          <div className="text-sm text-emerald-400 mb-2">Step 1 of 3</div>
          <h1 className="text-2xl font-bold text-white mb-2">Name your household</h1>
          <p className="text-slate-400">This is how you'll identify your shared budget.</p>
        </div>

        <div className="mb-6">
          <input
            type="text"
            value={householdName}
            onChange={(e) => {
              setHouseholdName(e.target.value);
              setError('');
            }}
            placeholder="e.g., Sean & Allison"
            className="w-full bg-slate-800 rounded-xl px-4 py-4 text-white text-lg outline-none placeholder-slate-500 focus:ring-2 focus:ring-emerald-500"
            autoFocus
          />
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        </div>

        <div className="text-sm text-slate-500 mb-6">
          <p>💡 Examples:</p>
          <ul className="mt-1 space-y-1 text-slate-600">
            <li>• "The Elliots"</li>
            <li>• "Home Budget"</li>
            <li>• "Sean & Allison"</li>
          </ul>
        </div>
      </div>

      <button
        onClick={handleNext}
        className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-white font-semibold text-lg transition-colors"
      >
        Continue
      </button>
    </div>
  );
}

function MembersScreen({ onNext, onBack, members, setMembers }) {
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [error, setError] = useState('');

  const handleAddMember = () => {
    if (!newName.trim()) {
      setError('Please enter a name');
      return;
    }
    if (!validateEmail(newEmail)) {
      setError('Please enter a valid email');
      return;
    }
    const normalizedNewEmail = (newEmail || '').toLowerCase();
    if (members.some((m) => (m.email || '').toLowerCase() === normalizedNewEmail)) {
      setError('This email is already added');
      return;
    }

    setMembers([
      ...members,
      {
        id: crypto.randomUUID(),
        name: newName.trim(),
        email: normalizedNewEmail,
        isOwner: members.length === 0,
      },
    ]);
    setNewName('');
    setNewEmail('');
    setError('');
  };

  const handleRemoveMember = (id) => {
    setMembers(members.filter((m) => m.id !== id));
  };

  const handleNext = () => {
    if (members.length < 1) {
      setError('Please add at least one person');
      return;
    }
    onNext();
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col p-6">
      <div className="flex-1 max-w-sm mx-auto w-full">
        <div className="mb-6">
          <button onClick={onBack} className="text-slate-400 hover:text-white mb-4">
            ← Back
          </button>
          <div className="text-sm text-emerald-400 mb-2">Step 2 of 3</div>
          <h1 className="text-2xl font-bold text-white mb-2">Who's in?</h1>
          <p className="text-slate-400">
            Add everyone who'll be tracking expenses. They'll each get a magic link to join.
          </p>
        </div>

        {members.length > 0 && (
          <div className="space-y-3 mb-4">
            {members.map((member) => (
              <div key={member.id} className="bg-slate-800 rounded-xl p-4 flex justify-between items-center">
                <div>
                  <div className="text-white font-medium">{member.name}</div>
                  <div className="text-slate-500 text-sm">{member.email}</div>
                  {member.isOwner && (
                    <div className="text-xs text-emerald-400 mt-1">Owner</div>
                  )}
                </div>
                <button
                  onClick={() => handleRemoveMember(member.id)}
                  className="text-slate-500 hover:text-red-400"
                  aria-label="Remove member"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="bg-slate-800 rounded-xl p-4 space-y-3">
          <div>
            <label className="text-sm text-slate-400">Name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Alex"
              className="mt-1 w-full bg-slate-700 rounded-lg px-3 py-2 text-white outline-none"
            />
          </div>
          <div>
            <label className="text-sm text-slate-400">Email</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="alex@example.com"
              className="mt-1 w-full bg-slate-700 rounded-lg px-3 py-2 text-white outline-none"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            onClick={handleAddMember}
            className="w-full py-3 bg-slate-600 hover:bg-slate-500 rounded-lg text-white font-semibold"
          >
            Add
          </button>
        </div>
      </div>

      <button
        onClick={handleNext}
        className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-white font-semibold text-lg transition-colors"
      >
        Continue
      </button>
    </div>
  );
}

function BudgetScreen({ weeklyBudget, setWeeklyBudget, onNext, onBack }) {
  const [error, setError] = useState('');

  const handlePreset = (value) => {
    setWeeklyBudget(value);
    setError('');
  };

  const handleContinue = () => {
    if (weeklyBudget < 50) {
      setError('Budget must be at least $50');
      return;
    }
    onNext();
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col p-6">
      <div className="flex-1 max-w-sm mx-auto w-full">
        <button onClick={onBack} className="text-slate-400 hover:text-white mb-4">
          ← Back
        </button>
        <div className="text-sm text-emerald-400 mb-2">Step 3 of 3</div>
        <h1 className="text-2xl font-bold text-white mb-2">Weekly budget</h1>
        <p className="text-slate-400 mb-6">How much can you spend together each week?</p>

        <div className="bg-slate-800 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-3xl text-slate-400">$</span>
            <input
              type="number"
              value={weeklyBudget}
              min={50}
              onChange={(e) => setWeeklyBudget(parseInt(e.target.value || '0', 10))}
              className="bg-transparent text-4xl font-bold outline-none w-full"
            />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {BUDGET_PRESETS.map((preset) => (
              <button
                key={preset}
                onClick={() => handlePreset(preset)}
                className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                  weeklyBudget === preset
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                ${preset}
              </button>
            ))}
          </div>
          {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
        </div>
      </div>

      <button
        onClick={handleContinue}
        className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-white font-semibold text-lg transition-colors"
      >
        Finish setup
      </button>
    </div>
  );
}

function SetupCompleteScreen({ household, onContinue }) {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-center p-6">
      <div className="text-6xl mb-4">🎉</div>
      <h1 className="text-3xl font-bold text-white mb-2">You're all set!</h1>
      <p className="text-slate-400 mb-6">{household?.name} is ready. Magic links were generated for your members.</p>
      <button
        onClick={onContinue}
        className="w-full max-w-sm py-4 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-white font-semibold text-lg transition-colors"
      >
        Go to tracker
      </button>
    </div>
  );
}

function BudgetTracker({ household, currentUser, sessionToken, onOpenSettings, onRefreshHousehold }) {
  const [transactions, setTransactions] = useState([]);
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [note, setNote] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [justLogged, setJustLogged] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const WEEKLY_BUDGET = household.weeklyBudget;
  const CATEGORIES = DEFAULT_CATEGORIES;

  const weekStart = getWeekStart(household.timezone || 'UTC').toISOString();

  const weeklyTransactions = useMemo(
    () => transactions.filter((t) => t.weekStart === weekStart && !t.deletedAt),
    [transactions, weekStart]
  );

  const totalSpent = weeklyTransactions.reduce((sum, t) => sum + t.amount, 0);
  const remaining = WEEKLY_BUDGET - totalSpent;
  const percentRemaining = (remaining / WEEKLY_BUDGET) * 100;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await apiRequest(`/api/households/${household._id}/transactions`, {
          token: sessionToken,
        });
        setTransactions(res.transactions || []);
      } catch (err) {
        setError(err.message || 'Could not load transactions');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [household._id, sessionToken]);

  const handleAmountChange = (e) => {
    const value = e.target.value;
    if (/^\d*\.?\d{0,2}$/.test(value)) {
      setAmount(value);
    }
  };

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0 || !selectedCategory) return;

    try {
      const payload = {
        amount: parseFloat(amount),
        category: selectedCategory,
        note: note.trim(),
      };
      const res = await apiRequest(`/api/households/${household._id}/transactions`, {
        method: 'POST',
        body: payload,
        token: sessionToken,
      });
      setTransactions([res.transaction, ...transactions]);
      setAmount('');
      setSelectedCategory(null);
      setNote('');
      setJustLogged(true);
      setTimeout(() => setJustLogged(false), 1500);
      onRefreshHousehold(res.household);
    } catch (err) {
      setError(err.message || 'Unable to log expense');
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await apiRequest(
        `/api/households/${household._id}/transactions/${id}`,
        { method: 'DELETE', token: sessionToken }
      );
      setTransactions(transactions.map((t) => (t._id === id ? { ...t, deletedAt: new Date().toISOString() } : t)));
      onRefreshHousehold(res.household);
    } catch (err) {
      setError(err.message || 'Unable to delete');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-4xl">💰</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {error && (
        <div className="bg-red-500/20 text-red-200 text-sm p-3 text-center">{error}</div>
      )}

      <div className="bg-slate-800 px-4 py-3 flex items-center justify-between">
        <button onClick={onOpenSettings} className="text-slate-400 hover:text-white transition-colors">
          <span className="text-sm">⚙️ {household.name}</span>
        </button>
        <div className="text-sm text-slate-400">
          Resets in {getDaysUntilReset(household.timezone)} day{getDaysUntilReset(household.timezone) !== 1 ? 's' : ''}
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="text-slate-400 hover:text-white transition-colors text-sm"
        >
          {showHistory ? '← Back' : 'History'}
        </button>
      </div>

      <div className="bg-slate-800/50 px-4 py-2 text-center text-sm text-slate-400">
        Logging as <span className="text-emerald-400 font-medium">{currentUser.name}</span>
      </div>

      {showHistory ? (
        <div className="p-4 space-y-4">
          <h2 className="text-lg font-semibold">All Transactions</h2>
          {transactions.filter((t) => !t.deletedAt).length === 0 ? (
            <div className="text-center text-slate-400 py-12">No transactions yet</div>
          ) : (
            <div className="space-y-2">
              {transactions
                .filter((t) => !t.deletedAt)
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .map((t) => {
                  const category = CATEGORIES.find((c) => c.id === t.category);
                  return (
                    <div key={t._id} className="bg-slate-800 rounded-xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${category?.color} flex items-center justify-center text-lg`}>
                          {category?.icon}
                        </div>
                        <div>
                          <div className="font-medium">
                            {formatCurrency(t.amount)}
                            {t.note && <span className="text-slate-400 text-sm ml-2">- {t.note}</span>}
                          </div>
                          <div className="text-sm text-slate-400">
                            {t.memberName || t.user} • {formatTime(t.createdAt)}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(t._id)}
                        className="text-slate-500 hover:text-red-400 transition-colors p-2"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      ) : (
        <div className="p-4">
          <div className="text-center py-6">
            <div className="text-sm text-slate-400 mb-1">Remaining this week</div>
            <div
              className={`text-5xl font-bold mb-2 ${
                remaining < WEEKLY_BUDGET * 0.15
                  ? 'text-red-400'
                  : remaining < WEEKLY_BUDGET * 0.3
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {formatCurrency(remaining)}
            </div>
            <div className="text-sm text-slate-500">of {formatCurrency(WEEKLY_BUDGET)} budget</div>
            <div className="mt-4 mx-auto max-w-xs">
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    percentRemaining < 15
                      ? 'bg-red-500'
                      : percentRemaining < 30
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.max(0, percentRemaining)}%` }}
                />
              </div>
            </div>
          </div>

          {justLogged && (
            <div className="bg-emerald-500/20 border border-emerald-500/50 rounded-xl p-3 mb-4 text-center text-emerald-400">
              ✓ Logged!
            </div>
          )}

          <div className="bg-slate-800 rounded-2xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl text-slate-400">$</span>
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={handleAmountChange}
                placeholder="0.00"
                className="flex-1 bg-transparent text-3xl font-semibold outline-none placeholder-slate-600"
              />
            </div>

            <div className="flex gap-2 mb-4">
              {[10, 25, 50, 100].map((quickAmount) => (
                <button
                  key={quickAmount}
                  onClick={() => setAmount(quickAmount.toString())}
                  className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors"
                >
                  ${quickAmount}
                </button>
              ))}
            </div>

            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note (optional)"
              className="w-full bg-slate-700 rounded-lg px-3 py-2 text-sm outline-none placeholder-slate-500 focus:ring-2 focus:ring-slate-600"
            />
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-4">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`py-3 rounded-xl flex flex-col items-center gap-1 transition-all ${
                  selectedCategory === cat.id
                    ? `${cat.color} text-white scale-105`
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                <span className="text-xl">{cat.icon}</span>
                <span className="text-xs">{cat.label}</span>
              </button>
            ))}
          </div>

          <button
            onClick={handleSubmit}
            disabled={!amount || parseFloat(amount) <= 0 || !selectedCategory}
            className={`w-full py-4 rounded-xl font-semibold text-lg transition-all ${
              amount && parseFloat(amount) > 0 && selectedCategory
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-600 cursor-not-allowed'
            }`}
          >
            Log Expense
          </button>

          {weeklyTransactions.length > 0 && (
            <div className="mt-6">
              <div className="text-sm text-slate-400 mb-2">Recent</div>
              <div className="space-y-2">
                {weeklyTransactions.slice(0, 3).map((t) => {
                  const category = CATEGORIES.find((c) => c.id === t.category);
                  return (
                    <div
                      key={t._id}
                      className="bg-slate-800/50 rounded-lg p-3 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span>{category?.icon}</span>
                        <span className="text-slate-300">{formatCurrency(t.amount)}</span>
                        {t.note && <span className="text-slate-500 text-sm">- {t.note}</span>}
                      </div>
                      <span className="text-xs text-slate-500">{t.memberName || t.user}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SettingsScreen({ household, currentUser, onBack, onUpdateHousehold, onSwitchUser, onLogout, sessionToken }) {
  const [editingBudget, setEditingBudget] = useState(false);
  const [newBudget, setNewBudget] = useState(household.weeklyBudget.toString());
  const [error, setError] = useState('');

  const handleSaveBudget = async () => {
    const budget = parseInt(newBudget, 10);
    if (Number.isNaN(budget) || budget < 50) {
      setError('Budget must be at least $50');
      return;
    }
    try {
      const res = await apiRequest(`/api/households/${household._id}`, {
        method: 'PATCH',
        token: sessionToken,
        body: { weeklyBudget: budget },
      });
      onUpdateHousehold(res.household);
      setEditingBudget(false);
      setError('');
    } catch (err) {
      setError(err.message || 'Unable to save budget');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-sm mx-auto">
        <button onClick={onBack} className="text-slate-400 hover:text-white mb-6">
          ← Back
        </button>

        <h1 className="text-2xl font-bold mb-6">{household.name}</h1>

        <div className="bg-slate-800 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400">Weekly Budget</span>
            {!editingBudget ? (
              <button onClick={() => setEditingBudget(true)} className="text-emerald-400 text-sm">
                Edit
              </button>
            ) : (
              <button onClick={handleSaveBudget} className="text-emerald-400 text-sm">
                Save
              </button>
            )}
          </div>
          {editingBudget ? (
            <div className="flex items-center gap-2">
              <span className="text-xl">$</span>
              <input
                type="text"
                inputMode="numeric"
                value={newBudget}
                onChange={(e) => /^\d*$/.test(e.target.value) && setNewBudget(e.target.value)}
                className="flex-1 bg-slate-700 rounded-lg px-3 py-2 text-xl font-bold outline-none"
                autoFocus
              />
            </div>
          ) : (
            <div className="text-2xl font-bold text-emerald-400">{formatCurrency(household.weeklyBudget)}</div>
          )}
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        </div>

        <div className="bg-slate-800 rounded-xl p-4 mb-4">
          <div className="text-slate-400 mb-3">Members</div>
          <div className="space-y-3">
            {household.members.map((member) => (
              <div key={member._id} className="flex items-center justify-between">
                <div>
                  <div className="text-white flex items-center gap-2">
                    {member.name}
                    {member._id === currentUser._id && (
                      <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                        You
                      </span>
                    )}
                    {member.role === 'owner' && (
                      <span className="text-xs bg-slate-700 text-slate-200 px-2 py-0.5 rounded-full">
                        Owner
                      </span>
                    )}
                  </div>
                  <div className="text-slate-500 text-sm">{member.email}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-4 mb-4">
          <div className="text-slate-400 mb-3">Switch User (Demo)</div>
          <div className="space-y-2">
            {household.members.map((member) => (
              <button
                key={member._id}
                onClick={() => onSwitchUser(member)}
                className={`w-full py-2 px-4 rounded-lg text-left transition-colors ${
                  member._id === currentUser._id
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {member.name}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full py-3 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors"
        >
          Log Out
        </button>
      </div>
    </div>
  );
}

export default function BudgetApp() {
  const [screen, setScreen] = useState('loading');
  const [household, setHousehold] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [sessionToken, setSessionToken] = useState(null);
  const [householdName, setHouseholdName] = useState('');
  const [members, setMembers] = useState([]);
  const [weeklyBudget, setWeeklyBudget] = useState(750);
  const [timezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');

  useEffect(() => {
    // Defensive shim to avoid third-party autofill scripts calling tagName on document fragments
    if (typeof DocumentFragment !== 'undefined' && !DocumentFragment.prototype.tagName) {
      Object.defineProperty(DocumentFragment.prototype, 'tagName', {
        get() {
          return '';
        },
      });
    }

    const savedHouseholdId = localStorage.getItem('budgetHouseholdId');
    const savedMemberId = localStorage.getItem('budgetCurrentUserId');
    const savedToken = localStorage.getItem('budgetSessionToken');

    if (savedHouseholdId && savedMemberId && savedToken) {
      apiRequest(`/api/households/${savedHouseholdId}`, { token: savedToken })
        .then((res) => {
          const member = res.household.members.find((m) => m._id === savedMemberId) || res.household.members[0];
          setHousehold(res.household);
          setCurrentUser(member);
          setSessionToken(savedToken);
          setScreen('tracker');
        })
        .catch(() => setScreen('welcome'));
    } else {
      setScreen('welcome');
    }
  }, []);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  const persistSession = (householdId, memberId, token) => {
    localStorage.setItem('budgetHouseholdId', householdId);
    localStorage.setItem('budgetCurrentUserId', memberId);
    localStorage.setItem('budgetSessionToken', token);
  };

  const handleCompleteSetup = async () => {
    const owner = members.find((m) => m.isOwner) || members[0];
    const invitees = members.filter((m) => m.id !== owner.id).map((m) => ({ name: m.name, email: m.email }));

    const payload = {
      name: householdName,
      weeklyBudget,
      timezone,
      owner: { name: owner.name, email: owner.email },
      members: invitees,
    };

    const res = await apiRequest('/api/households', { method: 'POST', body: payload });
    setHousehold(res.household);
    setCurrentUser(res.ownerSession.member);
    setSessionToken(res.ownerSession.token);
    persistSession(res.household._id, res.ownerSession.member._id, res.ownerSession.token);
    setScreen('setup-complete');
  };

  const handleLogout = async () => {
    try {
      if (sessionToken) {
        await apiRequest('/api/auth/logout', { method: 'POST', token: sessionToken });
      }
    } catch (err) {
      console.error(err);
    }
    localStorage.removeItem('budgetHouseholdId');
    localStorage.removeItem('budgetCurrentUserId');
    localStorage.removeItem('budgetSessionToken');
    setHousehold(null);
    setCurrentUser(null);
    setHouseholdName('');
    setMembers([]);
    setWeeklyBudget(750);
    setSessionToken(null);
    setScreen('welcome');
  };

  switch (screen) {
    case 'loading':
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <div className="text-4xl">💰</div>
        </div>
      );
    case 'welcome':
      return <WelcomeScreen onGetStarted={() => setScreen('household-name')} />;
    case 'household-name':
      return (
        <HouseholdNameScreen
          householdName={householdName}
          setHouseholdName={setHouseholdName}
          onNext={() => setScreen('members')}
        />
      );
    case 'members':
      return (
        <MembersScreen
          members={members}
          setMembers={setMembers}
          onNext={() => setScreen('budget')}
          onBack={() => setScreen('household-name')}
        />
      );
    case 'budget':
      return (
        <BudgetScreen
          weeklyBudget={weeklyBudget}
          setWeeklyBudget={setWeeklyBudget}
          onNext={handleCompleteSetup}
          onBack={() => setScreen('members')}
        />
      );
    case 'setup-complete':
      return <SetupCompleteScreen household={household} onContinue={() => setScreen('tracker')} />;
    case 'tracker':
      return (
        <BudgetTracker
          household={household}
          currentUser={currentUser}
          sessionToken={sessionToken}
          onOpenSettings={() => setScreen('settings')}
          onRefreshHousehold={(updated) => setHousehold(updated || household)}
        />
      );
    case 'settings':
      return (
        <SettingsScreen
          household={household}
          currentUser={currentUser}
          sessionToken={sessionToken}
          onBack={() => setScreen('tracker')}
          onUpdateHousehold={(h) => setHousehold(h)}
          onSwitchUser={(user) => {
            setCurrentUser(user);
            persistSession(household._id, user._id, sessionToken);
          }}
          onLogout={handleLogout}
        />
      );
    default:
      return null;
  }
}
