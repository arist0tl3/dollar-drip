import React, { useEffect, useMemo, useState } from 'react';

const ALL_CATEGORIES = [
  { id: 'groceries', label: 'Groceries', icon: '🛒' },
  { id: 'dining', label: 'Dining', icon: '🍽️' },
  { id: 'coffee', label: 'Coffee', icon: '☕' },
  { id: 'drinks', label: 'Drinks', icon: '🍺' },
  { id: 'gas', label: 'Gas', icon: '⛽' },
  { id: 'transit', label: 'Transit', icon: '🚇' },
  { id: 'rideshare', label: 'Rideshare', icon: '🚗' },
  { id: 'fun', label: 'Fun', icon: '🎬' },
  { id: 'shopping', label: 'Shopping', icon: '🛍️' },
  { id: 'health', label: 'Health', icon: '💊' },
  { id: 'fitness', label: 'Fitness', icon: '🏋️' },
  { id: 'pets', label: 'Pets', icon: '🐕' },
  { id: 'kids', label: 'Kids', icon: '🧒' },
  { id: 'gifts', label: 'Gifts', icon: '🎁' },
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'subs', label: 'Subs', icon: '📱' },
  { id: 'personal', label: 'Personal', icon: '✨' },
  { id: 'bills', label: 'Bills', icon: '📄' },
  { id: 'travel', label: 'Travel', icon: '✈️' },
  { id: 'other', label: 'Other', icon: '📦' },
];

const BUDGET_PRESETS = [300, 400, 500, 600, 750, 900];
const DEFAULT_FAVORITES = ['groceries', 'dining', 'coffee', 'gas'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:3001';
const TOTAL_STEPS = 7;

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount || 0);

const formatTime = (date) =>
  new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(date));

const getWeekStart = (timezone = 'UTC', resetDay = 1) => {
  const now = new Date();
  const local = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
  const day = local.getDay();
  const diff = local.getDate() - ((day - resetDay + 7) % 7);
  const start = new Date(local.setDate(diff));
  start.setHours(0, 0, 0, 0);
  return start;
};

const getDaysUntilReset = (timezone = 'UTC', resetDay = 1) => {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: timezone }));
  const day = now.getDay();
  if (day === resetDay) return 7;
  if (day < resetDay) return resetDay - day;
  return 7 - (day - resetDay);
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

const Button = ({ children, onClick, variant = 'primary', disabled = false, className = '' }) => {
  const base = 'font-semibold rounded-2xl transition-all duration-200 active:scale-95 px-6 py-4 text-lg';
  const variants = {
    primary: 'bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed',
    secondary: 'bg-slate-800 text-white hover:bg-slate-700',
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

const Input = ({ value, onChange, placeholder, type = 'text' }) => (
  <input
    type={type}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className="w-full bg-slate-900 border-2 border-slate-800 rounded-xl px-4 py-4 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none transition-colors"
  />
);

const ProgressDots = ({ current, total }) => (
  <div className="flex gap-2 justify-center">
    {Array.from({ length: total }).map((_, i) => (
      <div
        key={i}
        className={`h-1.5 rounded-full transition-all duration-300 ${
          i === current ? 'w-6 bg-emerald-500' : i < current ? 'w-1.5 bg-emerald-500' : 'w-1.5 bg-slate-700'
        }`}
      />
    ))}
  </div>
);

const BackButton = ({ onClick }) => (
  <button onClick={onClick} className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors text-sm">
    ← Back
  </button>
);

const NumericKeypad = ({ value, onChange }) => {
  const handleDigit = (digit) => {
    if (value === '0') {
      onChange(digit);
    } else if (value.length < 5) {
      onChange(value + digit);
    }
  };

  const handleBackspace = () => {
    if (value.length <= 1) {
      onChange('0');
    } else {
      onChange(value.slice(0, -1));
    }
  };

  const KeypadButton = ({ children, onClick, className = '' }) => (
    <button
      onClick={onClick}
      className={`h-14 rounded-xl text-xl font-semibold transition-all active:scale-95 ${className}`}
    >
      {children}
    </button>
  );

  return (
    <div className="grid grid-cols-3 gap-2">
      {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
        <KeypadButton key={digit} onClick={() => handleDigit(digit)} className="bg-slate-900 text-white hover:bg-slate-800">
          {digit}
        </KeypadButton>
      ))}
      <KeypadButton onClick={() => onChange('0')} className="bg-slate-900 text-slate-400 hover:bg-slate-800 text-base">
        Clear
      </KeypadButton>
      <KeypadButton onClick={() => handleDigit('0')} className="bg-slate-900 text-white hover:bg-slate-800">
        0
      </KeypadButton>
      <KeypadButton onClick={handleBackspace} className="bg-slate-900 text-slate-400 hover:bg-slate-800">
        ←
      </KeypadButton>
    </div>
  );
};

function WelcomeScreen({ onGetStarted, onMagicLink }) {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight">Weekly Budget</h1>
        <p className="text-slate-400 text-lg mb-10 leading-relaxed">
          Track spending together.<br />Stay on the same page.
        </p>

        <Button onClick={onGetStarted} className="w-full mb-4">Get Started</Button>
        <button onClick={onMagicLink} className="text-slate-500 hover:text-slate-400 transition-colors text-sm">
          Get a magic link
        </button>
      </div>
    </div>
  );
}

function MagicLinkScreen({ email, setEmail, onRequest, onBack, status }) {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col p-6">
      <div className="mb-8"><BackButton onClick={onBack} /></div>
      <div className="flex-1 flex flex-col">
        <h1 className="text-3xl font-bold text-white mb-2">Get a magic link</h1>
        <p className="text-slate-400 mb-8">Enter the email you used for your budget.</p>
        <div className="space-y-4">
          <Input value={email} onChange={setEmail} placeholder="you@example.com" type="email" />
        </div>
        {status === 'sent' && (
          <div className="mt-6 text-sm text-slate-400">
            If you have an account, you should receive an email with a magic link shortly.
          </div>
        )}
        {status === 'error' && (
          <div className="mt-6 text-sm text-red-400">Something went wrong. Please try again.</div>
        )}
      </div>
      <div className="mt-auto pt-6 space-y-4">
        <Button onClick={onRequest} disabled={!validateEmail(email)} className="w-full">Send link</Button>
      </div>
    </div>
  );
}

function HouseholdNameScreen({ onNext, onBack, householdName, setHouseholdName, step }) {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col p-6">
      <div className="mb-8"><BackButton onClick={onBack} /></div>
      <div className="flex-1 flex flex-col">
        <div className="text-emerald-500 text-sm font-semibold mb-2">Step {step} of {TOTAL_STEPS}</div>
        <h1 className="text-3xl font-bold text-white mb-2">Name your budget</h1>
        <p className="text-slate-400 mb-8">This is how you'll identify your shared budget.</p>
        <Input value={householdName} onChange={setHouseholdName} placeholder="e.g., The Elliots" />
        <div className="mt-4 text-slate-500 text-sm">
          Examples: "Home Budget", "Sean & Allison", "Roommates"
        </div>
      </div>

      <div className="mt-auto pt-6 space-y-4">
        <ProgressDots current={step - 1} total={TOTAL_STEPS} />
        <Button onClick={onNext} disabled={!householdName.trim()} className="w-full">Continue</Button>
      </div>
    </div>
  );
}

function YourselfScreen({ name, email, setName, setEmail, onNext, onBack, step }) {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col p-6">
      <div className="mb-8"><BackButton onClick={onBack} /></div>
      <div className="flex-1 flex flex-col">
        <div className="text-emerald-500 text-sm font-semibold mb-2">Step {step} of {TOTAL_STEPS}</div>
        <h1 className="text-3xl font-bold text-white mb-2">Add yourself</h1>
        <p className="text-slate-400 mb-8">We'll send you a magic link to access your budget.</p>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Your name</label>
            <Input value={name} onChange={setName} placeholder="Alex" />
          </div>
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Email</label>
            <Input value={email} onChange={setEmail} placeholder="alex@example.com" type="email" />
          </div>
        </div>
      </div>

      <div className="mt-auto pt-6 space-y-4">
        <ProgressDots current={step - 1} total={TOTAL_STEPS} />
        <Button onClick={onNext} disabled={!name.trim() || !validateEmail(email)} className="w-full">Continue</Button>
      </div>
    </div>
  );
}

function InviteScreen({ members, setMembers, onNext, onBack, step }) {
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [error, setError] = useState('');

  const handleAdd = () => {
    if (!newName.trim()) {
      setError('Enter a name');
      return;
    }
    if (!validateEmail(newEmail)) {
      setError('Enter a valid email');
      return;
    }
    if (members.some((m) => m.email === newEmail.trim().toLowerCase())) {
      setError('That email is already added');
      return;
    }
    setMembers([...members, { name: newName.trim(), email: newEmail.trim().toLowerCase() }]);
    setNewName('');
    setNewEmail('');
    setError('');
  };

  const handleRemove = (email) => {
    setMembers(members.filter((m) => m.email !== email));
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col p-6">
      <div className="mb-8"><BackButton onClick={onBack} /></div>
      <div className="flex-1 flex flex-col">
        <div className="text-emerald-500 text-sm font-semibold mb-2">Step {step} of {TOTAL_STEPS}</div>
        <h1 className="text-3xl font-bold text-white mb-2">Invite others</h1>
        <p className="text-slate-400 mb-6">Add anyone else who'll track expenses.</p>

        {members.length > 0 && (
          <div className="mb-6 space-y-2">
            {members.map((m) => (
              <div key={m.email} className="flex items-center justify-between bg-slate-900 rounded-xl px-4 py-3">
                <div>
                  <div className="font-medium text-white">{m.name}</div>
                  <div className="text-sm text-slate-500">{m.email}</div>
                </div>
                <button onClick={() => handleRemove(m.email)} className="text-slate-500 hover:text-red-400 text-xl">×</button>
              </div>
            ))}
          </div>
        )}

        <div className="bg-slate-900 rounded-2xl p-4 space-y-3">
          <Input value={newName} onChange={setNewName} placeholder="Name" />
          <Input value={newEmail} onChange={setNewEmail} placeholder="Email" type="email" />
          {error && <div className="text-sm text-red-400">{error}</div>}
          <Button onClick={handleAdd} variant="secondary" disabled={!newName.trim() || !newEmail.trim()} className="w-full !py-3 !text-base">
            Add
          </Button>
        </div>
      </div>

      <div className="mt-auto pt-6 space-y-4">
        <ProgressDots current={step - 1} total={TOTAL_STEPS} />
        <Button onClick={onNext} className="w-full">{members.length === 0 ? 'Skip for now' : 'Continue'}</Button>
      </div>
    </div>
  );
}

function BudgetScreen({ weeklyBudget, setWeeklyBudget, onNext, onBack, step }) {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col p-6">
      <div className="mb-8"><BackButton onClick={onBack} /></div>
      <div className="flex-1 flex flex-col">
        <div className="text-emerald-500 text-sm font-semibold mb-2">Step {step} of {TOTAL_STEPS}</div>
        <h1 className="text-3xl font-bold text-white mb-2">Weekly budget</h1>
        <p className="text-slate-400 mb-8">How much can you spend together each week?</p>

        <div className="bg-slate-900 rounded-2xl p-6">
          <div className="text-5xl font-bold text-center mb-6">
            <span className="text-slate-500">$</span>
            <input
              type="number"
              value={weeklyBudget}
              onChange={(e) => setWeeklyBudget(e.target.value)}
              className="bg-transparent w-32 text-center focus:outline-none text-white"
            />
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {BUDGET_PRESETS.map((preset) => (
              <button
                key={preset}
                onClick={() => setWeeklyBudget(preset.toString())}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  parseInt(weeklyBudget, 10) === preset
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                ${preset}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-auto pt-6 space-y-4">
        <ProgressDots current={step - 1} total={TOTAL_STEPS} />
        <Button onClick={onNext} disabled={!weeklyBudget || parseInt(weeklyBudget, 10) <= 0} className="w-full">Continue</Button>
      </div>
    </div>
  );
}

function CategoriesScreen({ favorites, setFavorites, onNext, onBack, step }) {
  const toggleCategory = (id) => {
    if (favorites.includes(id)) {
      setFavorites(favorites.filter((c) => c !== id));
      return;
    }
    if (favorites.length < 6) {
      setFavorites([...favorites, id]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col p-6">
      <div className="mb-4"><BackButton onClick={onBack} /></div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="text-emerald-500 text-sm font-semibold mb-2">Step {step} of {TOTAL_STEPS}</div>
        <h1 className="text-3xl font-bold text-white mb-2">Pick your categories</h1>
        <p className="text-slate-400 mb-4">
          Choose up to 6 you use most.
          <span className="text-emerald-500 ml-2 font-semibold">{favorites.length}/6</span>
        </p>

        <div className="grid grid-cols-4 gap-2 overflow-y-auto flex-1 p-2">
          {ALL_CATEGORIES.map((cat) => {
            const isSelected = favorites.includes(cat.id);
            const isDisabled = favorites.length >= 6 && !isSelected;
            return (
              <button
                key={cat.id}
                onClick={() => !isDisabled && toggleCategory(cat.id)}
                disabled={isDisabled}
                className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
                  isSelected
                    ? 'bg-emerald-500/20 ring-2 ring-emerald-500'
                    : isDisabled
                    ? 'bg-slate-900/50 opacity-40 cursor-not-allowed'
                    : 'bg-slate-900 hover:bg-slate-800'
                }`}
              >
                <span className="text-xl mb-0.5">{cat.icon}</span>
                <span className="text-[10px] font-medium text-white">{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="pt-4 space-y-4">
        <ProgressDots current={step - 1} total={TOTAL_STEPS} />
        <Button onClick={onNext} disabled={favorites.length === 0} className="w-full">Continue</Button>
      </div>
    </div>
  );
}

function ResetDayScreen({ resetDay, setResetDay, onNext, onBack, step }) {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col p-6">
      <div className="mb-8"><BackButton onClick={onBack} /></div>
      <div className="flex-1 flex flex-col">
        <div className="text-emerald-500 text-sm font-semibold mb-2">Step {step} of {TOTAL_STEPS}</div>
        <h1 className="text-3xl font-bold text-white mb-2">Reset day</h1>
        <p className="text-slate-400 mb-6">Your budget resets every week on:</p>

        <div className="bg-slate-900 rounded-2xl p-2">
          {DAYS.map((day, index) => (
            <button
              key={day}
              onClick={() => setResetDay(index)}
              className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                resetDay === index ? 'bg-emerald-500 text-white font-medium' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-auto pt-6 space-y-4">
        <ProgressDots current={step - 1} total={TOTAL_STEPS} />
        <Button onClick={onNext} className="w-full">Continue</Button>
      </div>
    </div>
  );
}

function CarryOverScreen({ carryOverSurplus, carryOverDebt, setCarryOverSurplus, setCarryOverDebt, onNext, onBack, step }) {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col p-6">
      <div className="mb-8"><BackButton onClick={onBack} /></div>
      <div className="flex-1 flex flex-col">
        <div className="text-emerald-500 text-sm font-semibold mb-2">Step {step} of {TOTAL_STEPS}</div>
        <h1 className="text-3xl font-bold text-white mb-2">Carry-over rules</h1>
        <p className="text-slate-400 mb-6">What happens at the end of each week?</p>

        <div className="space-y-4">
          <div className="bg-slate-900 rounded-2xl p-5">
            <div className="mb-4">
              <h3 className="font-semibold mb-1 text-white">Under budget?</h3>
              <p className="text-sm text-slate-500">If you have money left over...</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCarryOverSurplus(true)}
                className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                  carryOverSurplus ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                Roll it over
              </button>
              <button
                onClick={() => setCarryOverSurplus(false)}
                className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                  !carryOverSurplus ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                Start fresh
              </button>
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl p-5">
            <div className="mb-4">
              <h3 className="font-semibold mb-1 text-white">Over budget?</h3>
              <p className="text-sm text-slate-500">If you overspend...</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCarryOverDebt(true)}
                className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                  carryOverDebt ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                Subtract it
              </button>
              <button
                onClick={() => setCarryOverDebt(false)}
                className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                  !carryOverDebt ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                Start fresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-6 space-y-4">
        <ProgressDots current={step - 1} total={TOTAL_STEPS} />
        <Button onClick={onNext} className="w-full">Finish setup</Button>
      </div>
    </div>
  );
}

function SuccessScreen({ householdName, membersAdded, onContinue, onInstall, canInstall }) {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-center p-8">
      <div className="max-w-sm">
        <h1 className="text-4xl font-extrabold text-white mb-3">You're all set!</h1>
        <p className="text-slate-400 text-lg mb-10">
          <span className="text-white font-semibold">{householdName}</span> is ready.
          {membersAdded > 0 && ' Magic links sent to your members.'}
        </p>
        {canInstall && (
          <Button onClick={onInstall} variant="secondary" className="w-full mb-3">
            Install app
          </Button>
        )}
        <Button onClick={onContinue} className="w-full">Go to tracker</Button>
      </div>
    </div>
  );
}

function BudgetTracker({ household, currentUser, sessionToken, onOpenSettings, onRefreshHousehold }) {
  const [transactions, setTransactions] = useState([]);
  const [amount, setAmount] = useState('0');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [note, setNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [justLogged, setJustLogged] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [serverWeekStart, setServerWeekStart] = useState(null);

  const normalizedResetDay =
    Number.isInteger(household.resetDay) && household.resetDay >= 0 && household.resetDay <= 6
      ? household.resetDay
      : 1;
  const weekStart =
    serverWeekStart || getWeekStart(household.timezone || 'UTC', normalizedResetDay).toISOString();

  const weeklyTransactions = useMemo(
    () =>
      transactions.filter((t) => {
        const txWeek = t.weekStart ? new Date(t.weekStart).toISOString() : '';
        return txWeek === weekStart && !t.deletedAt;
      }),
    [transactions, weekStart]
  );

  const totalSpent = weeklyTransactions.reduce((sum, t) => sum + t.amount, 0);
  const remaining = household.weeklyBudget - totalSpent;
  const percentRemaining = Math.max(0, Math.min(100, (remaining / household.weeklyBudget) * 100));

  const favoriteIds = household.favoriteCategoryIds?.length ? household.favoriteCategoryIds : DEFAULT_FAVORITES;
  const favoriteCategories = ALL_CATEGORIES.filter((cat) => favoriteIds.includes(cat.id));

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await apiRequest(`/api/households/${household._id}/transactions`, {
          token: sessionToken,
        });
        setTransactions(res.transactions || []);
        if (res.weekStart) setServerWeekStart(res.weekStart);
      } catch (err) {
        setError(err.message || 'Could not load transactions');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    return undefined;
  }, [household._id, sessionToken]);

  const handleSubmit = async () => {
    const parsedAmount = parseInt(amount, 10);
    if (!parsedAmount || parsedAmount <= 0 || !selectedCategory) return;

    try {
      const payload = {
        amount: parsedAmount,
        category: selectedCategory,
        note: note.trim(),
      };
      const res = await apiRequest(`/api/households/${household._id}/transactions`, {
        method: 'POST',
        body: payload,
        token: sessionToken,
      });
      setTransactions([res.transaction, ...transactions]);
      setAmount('0');
      setSelectedCategory(null);
      setNote('');
      setShowNoteInput(false);
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

  const budgetColor = percentRemaining > 50 ? 'text-emerald-500' : percentRemaining > 25 ? 'text-yellow-500' : 'text-red-500';
  const barColor = percentRemaining > 50 ? 'bg-emerald-500' : percentRemaining > 25 ? 'bg-yellow-500' : 'bg-red-500';

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  if (showAllCategories) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/50">
          <BackButton onClick={() => setShowAllCategories(false)} />
          <h1 className="font-semibold">All Categories</h1>
          <div className="w-12" />
        </div>
        <div className="flex-1 px-5 py-4 overflow-y-auto">
          <div className="grid grid-cols-3 gap-2.5">
            {ALL_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setShowAllCategories(false);
                }}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl transition-all active:scale-95 ${
                  selectedCategory === cat.id ? 'bg-emerald-500/20 ring-2 ring-emerald-500' : 'bg-slate-900 hover:bg-slate-800'
                }`}
              >
                <span className="text-2xl mb-1">{cat.icon}</span>
                <span className="text-xs font-medium text-slate-400">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (showHistory) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/50">
          <BackButton onClick={() => setShowHistory(false)} />
          <h1 className="font-semibold">All Transactions</h1>
          <div className="w-12" />
        </div>
        <div className="flex-1 px-5 py-4 overflow-y-auto">
          {transactions.filter((t) => !t.deletedAt).length === 0 ? (
            <div className="text-center text-slate-500 py-16">No transactions yet</div>
          ) : (
            <div className="space-y-3">
              {transactions
                .filter((t) => !t.deletedAt)
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .map((t) => {
                  const category = ALL_CATEGORIES.find((c) => c.id === t.category);
                  return (
                    <div key={t._id} className="flex items-center gap-4 bg-slate-900 rounded-2xl p-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 bg-slate-800">
                        {category?.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold">{formatCurrency(t.amount)}</div>
                        <div className="text-sm text-slate-500 truncate">
                          {t.memberName || t.user} • {formatTime(t.createdAt)}
                        </div>
                        {t.note && <div className="text-sm text-slate-400 mt-0.5 truncate">{t.note}</div>}
                      </div>
                      <button onClick={() => handleDelete(t._id)} className="text-slate-500 hover:text-red-400 transition-colors text-xl p-2">×</button>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {error && (
        <div className="bg-red-500/20 text-red-200 text-sm p-3 text-center">{error}</div>
      )}

      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/50">
        <button onClick={onOpenSettings} className="text-slate-400 hover:text-white transition-colors text-sm font-medium">
          {household.name}
        </button>
        <div className="text-sm text-slate-500">
          Resets in {getDaysUntilReset(household.timezone, normalizedResetDay)}d
        </div>
        <button
          onClick={() => setShowHistory(true)}
          className="text-slate-400 hover:text-white transition-colors text-sm font-medium"
        >
          History
        </button>
      </div>

      <div className="px-5 py-4 text-center">
        <div className="text-sm text-slate-500 mb-1">Remaining this week</div>
        <div className={`text-5xl font-extrabold mb-1 transition-all duration-300 ${budgetColor} ${justLogged ? 'scale-95' : 'scale-100'}`}>
          {formatCurrency(remaining)}
        </div>
        <div className="text-sm text-slate-500">of {formatCurrency(household.weeklyBudget)} budget</div>
        <div className="mt-3 h-2 bg-slate-800 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ease-out ${barColor}`} style={{ width: `${percentRemaining}%` }} />
        </div>
      </div>

      <div className="flex-1 px-5 pb-6 flex flex-col">
        <div className="text-center mb-4">
          <div className="text-4xl font-bold">
            <span className="text-slate-500">$</span>
            <span>{amount}</span>
          </div>
        </div>

        <div className="mb-4">
          <NumericKeypad value={amount} onChange={setAmount} />
        </div>

        {showNoteInput ? (
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note..."
            autoFocus
            className="w-full bg-slate-900 rounded-xl px-4 py-3 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 mb-4"
          />
        ) : (
          <button onClick={() => setShowNoteInput(true)} className="text-sm text-slate-500 hover:text-slate-400 mb-4">
            + Add a note
          </button>
        )}

        <div className="grid grid-cols-3 gap-2 mb-3">
          {favoriteCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all active:scale-95 ${
                selectedCategory === cat.id ? 'bg-emerald-500/20 ring-2 ring-emerald-500' : 'bg-slate-900 hover:bg-slate-800'
              }`}
            >
              <span className="text-2xl mb-1">{cat.icon}</span>
              <span className="text-xs font-medium text-slate-400">{cat.label}</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowAllCategories(true)}
          className="w-full text-center text-sm text-slate-500 hover:text-slate-400 transition-colors mb-4 py-1"
        >
          More categories →
        </button>

        <Button onClick={handleSubmit} disabled={parseInt(amount, 10) <= 0 || !selectedCategory} className="w-full mt-auto">
          {justLogged ? '✓ Logged!' : 'Log Expense'}
        </Button>
      </div>
    </div>
  );
}

function SettingsScreen({ household, onBack, onLogout, sessionToken, onUpdateHousehold }) {
  const [editingBudget, setEditingBudget] = useState(false);
  const [newBudget, setNewBudget] = useState(household.weeklyBudget.toString());
  const [error, setError] = useState('');

  const handleSaveBudget = async () => {
    const budget = parseInt(newBudget, 10);
    if (Number.isNaN(budget) || budget < 1) {
      setError('Enter a valid budget');
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
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-sm mx-auto">
        <button onClick={onBack} className="text-slate-400 hover:text-white mb-6">
          ← Back
        </button>

        <h1 className="text-2xl font-bold mb-6">{household.name}</h1>

        <div className="bg-slate-900 rounded-2xl p-4 mb-4">
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
                className="flex-1 bg-slate-800 rounded-lg px-3 py-2 text-xl font-bold outline-none"
                autoFocus
              />
            </div>
          ) : (
            <div className="text-2xl font-bold text-emerald-400">{formatCurrency(household.weeklyBudget)}</div>
          )}
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        </div>

        <div className="bg-slate-900 rounded-2xl p-4 mb-4">
          <div className="text-slate-400 mb-3">Members</div>
          <div className="space-y-3">
            {household.members.map((member) => (
              <div key={member._id} className="flex items-center justify-between">
                <div>
                  <div className="text-white">{member.name}</div>
                  <div className="text-slate-500 text-sm">{member.email}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full py-3 bg-red-500/20 text-red-400 rounded-2xl hover:bg-red-500/30 transition-colors"
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
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [members, setMembers] = useState([]);
  const [weeklyBudget, setWeeklyBudget] = useState('500');
  const [favoriteCategories, setFavoriteCategories] = useState(DEFAULT_FAVORITES);
  const [resetDay, setResetDay] = useState(1);
  const [carryOverSurplus, setCarryOverSurplus] = useState(false);
  const [carryOverDebt, setCarryOverDebt] = useState(true);
  const [timezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
  const [installPrompt, setInstallPrompt] = useState(null);
  const [canInstall, setCanInstall] = useState(false);
  const [magicEmail, setMagicEmail] = useState('');
  const [magicStatus, setMagicStatus] = useState('idle');

  useEffect(() => {
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

  useEffect(() => {
    const handleBeforeInstall = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
      setCanInstall(true);
    };

    const handleInstalled = () => {
      setInstallPrompt(null);
      setCanInstall(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    try {
      await installPrompt.userChoice;
    } finally {
      setInstallPrompt(null);
      setCanInstall(false);
    }
  };

  const persistSession = (householdId, memberId, token) => {
    localStorage.setItem('budgetHouseholdId', householdId);
    localStorage.setItem('budgetCurrentUserId', memberId);
    localStorage.setItem('budgetSessionToken', token);
  };

  const handleCompleteSetup = async () => {
    const payload = {
      name: householdName,
      weeklyBudget: parseInt(weeklyBudget, 10),
      timezone,
      resetDay,
      favoriteCategoryIds: favoriteCategories,
      carryOverSurplus,
      carryOverDebt,
      owner: { name: ownerName, email: ownerEmail },
      members,
    };

    const res = await apiRequest('/api/households', { method: 'POST', body: payload });
    setHousehold(res.household);
    setCurrentUser(res.ownerSession.member);
    setSessionToken(res.ownerSession.token);
    persistSession(res.household._id, res.ownerSession.member._id, res.ownerSession.token);
    setScreen('success');
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
    setOwnerName('');
    setOwnerEmail('');
    setMembers([]);
    setWeeklyBudget('500');
    setFavoriteCategories(DEFAULT_FAVORITES);
    setResetDay(1);
    setCarryOverSurplus(false);
    setCarryOverDebt(true);
    setSessionToken(null);
    setMagicEmail('');
    setMagicStatus('idle');
    setScreen('welcome');
  };

  const handleMagicLinkRequest = async () => {
    setMagicStatus('idle');
    try {
      await apiRequest('/api/auth/magic-link', {
        method: 'POST',
        body: { email: magicEmail.trim() },
      });
      setMagicStatus('sent');
    } catch (err) {
      if (err.message?.includes('User not found')) {
        setMagicStatus('sent');
      } else {
        setMagicStatus('error');
      }
    }
  };

  switch (screen) {
    case 'loading':
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <div className="text-slate-400">Loading...</div>
        </div>
      );
    case 'welcome':
      return <WelcomeScreen onGetStarted={() => setScreen('household-name')} onMagicLink={() => setScreen('magic-link')} />;
    case 'magic-link':
      return (
        <MagicLinkScreen
          email={magicEmail}
          setEmail={setMagicEmail}
          status={magicStatus}
          onRequest={handleMagicLinkRequest}
          onBack={() => setScreen('welcome')}
        />
      );
    case 'household-name':
      return (
        <HouseholdNameScreen
          householdName={householdName}
          setHouseholdName={setHouseholdName}
          onNext={() => setScreen('yourself')}
          onBack={() => setScreen('welcome')}
          step={1}
        />
      );
    case 'yourself':
      return (
        <YourselfScreen
          name={ownerName}
          email={ownerEmail}
          setName={setOwnerName}
          setEmail={setOwnerEmail}
          onNext={() => setScreen('invite')}
          onBack={() => setScreen('household-name')}
          step={2}
        />
      );
    case 'invite':
      return (
        <InviteScreen
          members={members}
          setMembers={setMembers}
          onNext={() => setScreen('budget')}
          onBack={() => setScreen('yourself')}
          step={3}
        />
      );
    case 'budget':
      return (
        <BudgetScreen
          weeklyBudget={weeklyBudget}
          setWeeklyBudget={setWeeklyBudget}
          onNext={() => setScreen('categories')}
          onBack={() => setScreen('invite')}
          step={4}
        />
      );
    case 'categories':
      return (
        <CategoriesScreen
          favorites={favoriteCategories}
          setFavorites={setFavoriteCategories}
          onNext={() => setScreen('reset-day')}
          onBack={() => setScreen('budget')}
          step={5}
        />
      );
    case 'reset-day':
      return (
        <ResetDayScreen
          resetDay={resetDay}
          setResetDay={setResetDay}
          onNext={() => setScreen('carry-over')}
          onBack={() => setScreen('categories')}
          step={6}
        />
      );
    case 'carry-over':
      return (
        <CarryOverScreen
          carryOverSurplus={carryOverSurplus}
          carryOverDebt={carryOverDebt}
          setCarryOverSurplus={setCarryOverSurplus}
          setCarryOverDebt={setCarryOverDebt}
          onNext={handleCompleteSetup}
          onBack={() => setScreen('reset-day')}
          step={7}
        />
      );
    case 'success':
      return (
        <SuccessScreen
          householdName={household?.name || householdName || 'Your budget'}
          membersAdded={members.length}
          canInstall={canInstall}
          onInstall={handleInstall}
          onContinue={() => setScreen('tracker')}
        />
      );
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
          sessionToken={sessionToken}
          onBack={() => setScreen('tracker')}
          onUpdateHousehold={(h) => setHousehold(h)}
          onLogout={handleLogout}
        />
      );
    default:
      return null;
  }
}
