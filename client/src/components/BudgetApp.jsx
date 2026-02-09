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

const NumericKeypad = ({ value, onChange, onDigit, onClear, onBackspace, maxLength = 5 }) => {
  const handleDigit = (digit) => {
    if (onDigit) {
      onDigit(digit);
      return;
    }
    if (value === '0') {
      onChange(digit);
    } else if (value.length < maxLength) {
      onChange(value + digit);
    }
  };

  const handleBackspace = () => {
    if (onBackspace) {
      onBackspace();
      return;
    }
    if (value.length <= 1) {
      onChange('0');
    } else {
      onChange(value.slice(0, -1));
    }
  };

  const handleClear = () => {
    if (onClear) {
      onClear();
      return;
    }
    onChange('0');
  };

  const KeypadButton = ({ children, onClick, className = '' }) => (
    <button
      onClick={onClick}
      className={`h-12 sm:h-14 rounded-xl text-xl font-semibold transition-all active:scale-95 ${className}`}
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
      <KeypadButton onClick={handleClear} className="bg-slate-900 text-slate-400 hover:bg-slate-800 text-base">
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
        <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight">Dollar Drip</h1>
        <p className="text-slate-400 text-lg mb-10 leading-relaxed">
          Track spending together.<br />Stay on the same page.
        </p>

        <Button onClick={onGetStarted} className="w-full mb-4">Get Started</Button>
        <button onClick={onMagicLink} className="text-slate-500 hover:text-slate-400 transition-colors text-sm">
          Log in with an existing account
        </button>
      </div>
    </div>
  );
}

function OtpBoxes({ value }) {
  const digits = value.padEnd(6, ' ').slice(0, 6).split('');
  return (
    <div className="grid grid-cols-6 gap-2">
      {digits.map((digit, index) => (
        <div
          key={`${digit}-${index}`}
          className="h-12 rounded-xl bg-slate-900 border border-slate-800 text-white flex items-center justify-center text-lg font-semibold"
        >
          {digit === ' ' ? '' : digit}
        </div>
      ))}
    </div>
  );
}

function MagicLinkScreen({ email, setEmail, onRequest, onBack, status, isPwa, otpCode, setOtpCode, onVerify }) {
  const handleOtpDigit = (digit) => {
    if (otpCode.length >= 6) return;
    setOtpCode(`${otpCode}${digit}`);
  };

  const handleOtpClear = () => setOtpCode('');
  const handleOtpBackspace = () => setOtpCode(otpCode.slice(0, -1));

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col p-6">
      <div className="mb-8"><BackButton onClick={onBack} /></div>
      <div className="flex-1 flex flex-col">
        <h1 className="text-3xl font-bold text-white mb-2">Log in</h1>
        <p className="text-slate-400 mb-8">Enter the email you used for your budget.</p>
        <div className="space-y-4">
          <Input value={email} onChange={setEmail} placeholder="you@example.com" type="email" />
        </div>
        {status === 'sent' && !isPwa && (
          <div className="mt-6 text-sm text-slate-400">
            If you have an account, you should receive an email with a magic link shortly.
          </div>
        )}
        {status === 'sent' && isPwa && (
          <div className="mt-6 space-y-4">
            <div className="text-sm text-slate-400">We sent a one-time code.</div>
            <OtpBoxes value={otpCode} />
            <NumericKeypad
              value={otpCode}
              onDigit={handleOtpDigit}
              onClear={handleOtpClear}
              onBackspace={handleOtpBackspace}
              maxLength={6}
            />
            <button onClick={onRequest} className="text-sm text-slate-500 hover:text-slate-400">
              Resend code
            </button>
          </div>
        )}
        {status === 'error' && (
          <div className="mt-6 text-sm text-red-400">Something went wrong. Please try again.</div>
        )}
      </div>
      <div className="mt-auto pt-6 space-y-4">
        {!isPwa && (
          <Button onClick={onRequest} disabled={!validateEmail(email)} className="w-full">Send link</Button>
        )}
        {isPwa && status !== 'sent' && (
          <Button onClick={onRequest} disabled={!validateEmail(email)} className="w-full">Send code</Button>
        )}
        {status === 'sent' && isPwa && (
          <Button onClick={onVerify} disabled={otpCode.trim().length !== 6} className="w-full" variant="secondary">
            Verify code
          </Button>
        )}
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

function BudgetTracker({ household, currentUser, sessionToken, onOpenSettings, onLogout, onRefreshHousehold, canInstall, onInstall }) {
  const [transactions, setTransactions] = useState([]);
  const [amount, setAmount] = useState('0');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [note, setNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [justLogged, setJustLogged] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [serverWeekStart, setServerWeekStart] = useState(null);
  const [serverWeeklyBudget, setServerWeeklyBudget] = useState(null);
  const [showInstallHint, setShowInstallHint] = useState(false);
  const [installHintText, setInstallHintText] = useState('');

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
  const effectiveWeeklyBudget = serverWeeklyBudget ?? household.weeklyBudget;
  const remaining = effectiveWeeklyBudget - totalSpent;
  const percentRemaining = Math.max(0, Math.min(100, (remaining / effectiveWeeklyBudget) * 100));

  const favoriteIds = household.favoriteCategoryIds?.length ? household.favoriteCategoryIds : DEFAULT_FAVORITES;
  const favoriteCategories = ALL_CATEGORIES.filter((cat) => favoriteIds.includes(cat.id));

  const dailyTotals = useMemo(() => {
    const startDate = new Date(weekStart);
    const days = Array.from({ length: 7 }).map((_, i) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      return { date, total: 0 };
    });

    weeklyTransactions.forEach((tx) => {
      const txDate = new Date(tx.createdAt);
      const index = days.findIndex((d) => d.date.toDateString() === txDate.toDateString());
      if (index >= 0) days[index].total += tx.amount;
    });

    const max = Math.max(...days.map((d) => d.total), 1);
    return { days, max };
  }, [weeklyTransactions, weekStart]);

  useEffect(() => {
    const standalone =
      window.matchMedia?.('(display-mode: standalone)')?.matches ||
      window.navigator.standalone === true;
    if (standalone) {
      setShowInstallHint(false);
      return;
    }

    const ua = navigator.userAgent || '';
    const isiOS = /iphone|ipad|ipod/i.test(ua);
    const isAndroid = /android/i.test(ua);
    const hint = isiOS
          ? 'Install Dollar Drip: tap Share, then “Add to Home Screen.”'
      : isAndroid
      ? 'Install this app from your browser menu.'
      : 'Install this app from your browser menu.';

    const lastDismissed = Number(localStorage.getItem('budgetInstallHintDismissedAt') || '0');
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    if (!lastDismissed || Date.now() - lastDismissed > thirtyDays) {
      setInstallHintText(hint);
      setShowInstallHint(true);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await apiRequest(`/api/households/${household._id}/transactions`, {
          token: sessionToken,
        });
        setTransactions(res.transactions || []);
        if (res.weekStart) setServerWeekStart(res.weekStart);
        if (typeof res.weeklyBudget === 'number') setServerWeeklyBudget(res.weeklyBudget);
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
      if (typeof res.newBalance?.weeklyBudget === 'number') {
        setServerWeeklyBudget(res.newBalance.weeklyBudget);
      }
      setAmount('0');
      setSelectedCategory(null);
      setNote('');
      setShowNoteInput(false);
      setShowAddExpense(false);
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
      if (typeof res.newBalance?.weeklyBudget === 'number') {
        setServerWeeklyBudget(res.newBalance.weeklyBudget);
      }
      onRefreshHousehold(res.household);
    } catch (err) {
      setError(err.message || 'Unable to delete');
    }
  };

  const budgetColor = percentRemaining > 50 ? 'text-emerald-500' : percentRemaining > 25 ? 'text-yellow-500' : 'text-red-500';
  const barColor = percentRemaining > 50 ? 'bg-emerald-500' : percentRemaining > 25 ? 'bg-yellow-500' : 'bg-red-500';

  const handleDismissHint = () => {
    localStorage.setItem('budgetInstallHintDismissedAt', Date.now().toString());
    setShowInstallHint(false);
  };

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
        <div className="flex-1 px-5 py-4">
          <div className="grid grid-cols-3 grid-rows-7 gap-2 h-full">
            {ALL_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setShowAllCategories(false);
                }}
                className={`flex flex-col items-center justify-center rounded-2xl transition-all active:scale-95 ${
                  selectedCategory === cat.id ? 'bg-emerald-500/20 ring-2 ring-emerald-500' : 'bg-slate-900 hover:bg-slate-800'
                }`}
              >
                <span className="text-lg sm:text-xl mb-0.5">{cat.icon}</span>
                <span className="text-[9px] sm:text-[10px] font-medium text-slate-400">{cat.label}</span>
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
        <div className="relative">
          <button
            onClick={() => setShowMenu((prev) => !prev)}
            className="w-9 h-9 rounded-full bg-slate-900 text-sm font-semibold text-slate-200 flex items-center justify-center"
          >
            {(currentUser?.name || 'U').slice(0, 1).toUpperCase()}
          </button>
          {showMenu && (
            <div className="absolute right-0 mt-2 w-44 rounded-xl bg-slate-900 border border-slate-800 shadow-lg z-10">
              <button
                onClick={() => {
                  setShowMenu(false);
                  setShowHistory(true);
                }}
                className="w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-slate-800 rounded-t-xl"
              >
                History
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                  onOpenSettings();
                }}
                className="w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-slate-800"
              >
                Settings
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                  onLogout();
                }}
                className="w-full text-left px-4 py-3 text-sm text-red-300 hover:bg-slate-800 rounded-b-xl"
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </div>

      {showInstallHint && (
        <div className="mx-5 mt-4 rounded-2xl bg-slate-900 border border-slate-800 p-4 text-sm text-slate-300">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-white font-medium mb-1">Install Dollar Drip</div>
              <div className="text-slate-400">{installHintText}</div>
            </div>
            <button onClick={handleDismissHint} className="text-slate-500 hover:text-slate-300 text-lg leading-none">×</button>
          </div>
          {canInstall && (
            <button onClick={onInstall} className="mt-3 text-emerald-400 hover:text-emerald-300 text-sm font-semibold">
              Install now
            </button>
          )}
        </div>
      )}

      <div className="px-5 py-6 text-center">
        <div className="text-sm text-slate-500 mb-1">Remaining this week</div>
        <div className={`text-5xl font-extrabold mb-1 transition-all duration-300 ${budgetColor} ${justLogged ? 'scale-95' : 'scale-100'}`}>
          {formatCurrency(remaining)}
        </div>
        <div className="text-sm text-slate-500">of {formatCurrency(effectiveWeeklyBudget)} budget</div>
        <div className="mt-3 h-2 bg-slate-800 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ease-out ${barColor}`} style={{ width: `${percentRemaining}%` }} />
        </div>
      </div>

      <div className="px-5 pb-6 flex-1 flex flex-col">
        <div className="bg-slate-900 rounded-2xl p-4 mb-5">
          <div className="min-h-[48px]">
            <div className="text-sm text-slate-500">This week</div>
          </div>
          <div className="flex items-end gap-2 h-20">
            {dailyTotals.days.map((day) => {
              const height = Math.max(6, Math.round((day.total / dailyTotals.max) * 72));
              return (
                <div key={day.date.toISOString()} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full bg-emerald-500/60 rounded-lg mt-3" style={{ height }} />
                  <div className="text-[10px] text-slate-500">{day.date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                </div>
              );
            })}
          </div>
        </div>

        <Button onClick={() => setShowAddExpense(true)} className="w-full mt-auto">
          Add expense
        </Button>
      </div>

      {showAddExpense && (
        <div className="fixed inset-0 bg-slate-950 z-20 flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/50">
            <BackButton onClick={() => setShowAddExpense(false)} />
            <h1 className="font-semibold">Add expense</h1>
            <div className="w-12" />
          </div>
          <div className="flex-1 px-5 py-4 flex flex-col">
            <div className="text-center mb-3">
              <div className="text-4xl font-bold">
                <span className="text-slate-500">$</span>
                <span>{amount}</span>
              </div>
            </div>

            <div className="mb-3">
              <NumericKeypad value={amount} onChange={setAmount} />
            </div>

            {showNoteInput ? (
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note..."
                autoFocus
                className="w-full bg-slate-900 rounded-xl px-4 py-3 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 mb-3"
              />
            ) : (
              <button onClick={() => setShowNoteInput(true)} className="text-sm text-slate-500 hover:text-slate-400 mb-3">
                + Add a note
              </button>
            )}

            <div className="grid grid-cols-3 gap-2 mb-2">
              {favoriteCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex flex-col items-center justify-center p-2 rounded-2xl transition-all active:scale-95 ${
                    selectedCategory === cat.id ? 'bg-emerald-500/20 ring-2 ring-emerald-500' : 'bg-slate-900 hover:bg-slate-800'
                  }`}
                >
                  <span className="text-lg sm:text-xl mb-0.5">{cat.icon}</span>
                  <span className="text-[10px] sm:text-xs font-medium text-slate-400">{cat.label}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowAllCategories(true)}
              className="w-full text-center text-sm text-slate-500 hover:text-slate-400 transition-colors mb-3 py-1"
            >
              More categories →
            </button>

            <Button onClick={handleSubmit} disabled={parseInt(amount, 10) <= 0 || !selectedCategory} className="w-full mt-auto">
              {justLogged ? '✓ Logged!' : 'Add expense'}
            </Button>
          </div>
        </div>
      )}
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
            <span className="text-slate-400">Budget</span>
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
  const [otpCode, setOtpCode] = useState('');
  const [isStandalone, setIsStandalone] = useState(false);

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
    const standalone =
      window.matchMedia?.('(display-mode: standalone)')?.matches ||
      window.navigator.standalone === true;
    setIsStandalone(standalone);
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
    setServerWeeklyBudget(null);
    setMagicEmail('');
    setMagicStatus('idle');
    setOtpCode('');
    setScreen('welcome');
  };

  const handleMagicLinkRequest = async () => {
    setMagicStatus('idle');
    try {
      await apiRequest('/api/auth/magic-link', {
        method: 'POST',
        body: { email: magicEmail.trim(), mode: isStandalone ? 'pwa' : 'web' },
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

  const handleVerifyOtp = async () => {
    try {
      const res = await apiRequest('/api/auth/verify-otp', {
        method: 'POST',
        body: { email: magicEmail.trim(), code: otpCode.trim() },
      });
      if (!res.session?.token || !res.session?.member?.id || !res.session?.household?.id) {
        setMagicStatus('error');
        return;
      }

      localStorage.setItem('budgetSessionToken', res.session.token);
      localStorage.setItem('budgetCurrentUserId', res.session.member.id);
      localStorage.setItem('budgetHouseholdId', res.session.household.id);
      setSessionToken(res.session.token);

      const householdRes = await apiRequest(`/api/households/${res.session.household.id}`, {
        token: res.session.token,
      });
      setHousehold(householdRes.household);
      const member =
        householdRes.household.members.find((m) => m._id === res.session.member.id) ||
        householdRes.household.members[0];
      setCurrentUser(member);
      setScreen('tracker');
    } catch (err) {
      setMagicStatus('error');
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
          isPwa={isStandalone}
          otpCode={otpCode}
          setOtpCode={setOtpCode}
          onRequest={handleMagicLinkRequest}
          onVerify={handleVerifyOtp}
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
          onLogout={handleLogout}
          onRefreshHousehold={(updated) => setHousehold(updated || household)}
          canInstall={canInstall}
          onInstall={handleInstall}
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
