import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { Eye, EyeOff, UtensilsCrossed, ChefHat, Flame, Star } from 'lucide-react';

/* ── Floating ember particle ── */
const Ember = ({ style }) => (
  <motion.div
    className="absolute rounded-full pointer-events-none"
    style={style}
    animate={{
      y: [0, -120, -200],
      x: [0, Math.random() * 40 - 20, Math.random() * 60 - 30],
      opacity: [0, 0.8, 0],
      scale: [0.5, 1.2, 0.3],
    }}
    transition={{
      duration: Math.random() * 3 + 2,
      repeat: Infinity,
      repeatDelay: Math.random() * 4,
      ease: 'easeOut',
    }}
  />
);

/* ── Animated background orb ── */
const Orb = ({ className }) => (
  <motion.div
    className={`absolute rounded-full blur-3xl pointer-events-none ${className}`}
    animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.65, 0.4] }}
    transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
  />
);

/* ── Stats badge on left panel ── */
const StatBadge = ({ value, label, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="flex flex-col items-center"
  >
    <span className="text-3xl font-black text-orange-400">{value}</span>
    <span className="text-xs text-zinc-400 uppercase tracking-widest mt-0.5">{label}</span>
  </motion.div>
);

/* ── Floating food icon chip ── */
const FoodChip = ({ emoji, style, delay }) => (
  <motion.div
    className="absolute flex items-center justify-center w-10 h-10 rounded-xl bg-zinc-900/70 border border-zinc-700/50 backdrop-blur-sm text-xl select-none pointer-events-none"
    style={style}
    initial={{ opacity: 0, scale: 0 }}
    animate={{
      opacity: [0.6, 1, 0.6],
      y: [0, -12, 0],
      rotate: [-4, 4, -4],
    }}
    transition={{ delay, duration: 4 + Math.random() * 2, repeat: Infinity, ease: 'easeInOut' }}
  >
    {emoji}
  </motion.div>
);

const embers = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  style: {
    width: Math.random() * 4 + 2,
    height: Math.random() * 4 + 2,
    bottom: `${Math.random() * 20}%`,
    left: `${10 + Math.random() * 80}%`,
    background: ['#f97316', '#fb923c', '#fbbf24', '#ef4444'][Math.floor(Math.random() * 4)],
    boxShadow: '0 0 6px 2px rgba(249,115,22,0.6)',
  },
}));

const foodChips = [
  { emoji: '🍔', style: { top: '12%', right: '8%' }, delay: 0.2 },
  { emoji: '🍕', style: { top: '30%', right: '4%' }, delay: 0.8 },
  { emoji: '🥩', style: { top: '55%', right: '9%' }, delay: 1.4 },
  { emoji: '🍜', style: { top: '72%', right: '5%' }, delay: 0.5 },
  { emoji: '🥗', style: { top: '20%', left: '6%' }, delay: 1.1 },
  { emoji: '🍷', style: { top: '65%', left: '4%' }, delay: 0.3 },
];

/* ── Role option card ── */
const RoleOption = ({ value, label, icon, selected, onSelect }) => (
  <motion.button
    type="button"
    whileTap={{ scale: 0.96 }}
    onClick={() => onSelect(value)}
    className={`flex flex-col items-center gap-1 py-2.5 px-3 rounded-xl border text-xs font-medium transition-all duration-200 cursor-pointer ${
      selected
        ? 'bg-orange-500/20 border-orange-500 text-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.3)]'
        : 'bg-zinc-900/60 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
    }`}
  >
    <span className="text-lg">{icon}</span>
    {label}
  </motion.button>
);

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('staff');
  const [focusedField, setFocusedField] = useState(null);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegister) {
        await register({ name, email, password, role });
        toast.success('Account created successfully!');
      } else {
        await login(email, password);
        toast.success('Welcome back!');
      }
      navigate('/dashboard');
    } catch (error) {
      console.error('[LOGIN] Error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Authentication failed';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { value: 'admin', label: 'Admin', icon: '👑' },
    { value: 'manager', label: 'Manager', icon: '📊' },
    { value: 'staff', label: 'Staff', icon: '🛎️' },
    { value: 'kitchen', label: 'Kitchen', icon: '👨‍🍳' },
  ];

  const inputClass = (field) =>
    `bg-zinc-900/80 border transition-all duration-300 text-white placeholder-zinc-600 focus:outline-none focus:ring-0 ${
      focusedField === field
        ? 'border-orange-500 shadow-[0_0_0_3px_rgba(249,115,22,0.15)]'
        : 'border-zinc-700 hover:border-zinc-500'
    }`;

  return (
    <div className="min-h-screen bg-[#08090d] flex relative overflow-hidden">
      {/* ── Background atmosphere ── */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz48L3N2Zz4=')] opacity-60" />
      <Orb className="w-96 h-96 bg-orange-600/20 -top-20 -left-20" />
      <Orb className="w-80 h-80 bg-orange-800/15 bottom-10 left-1/3" />
      <Orb className="w-64 h-64 bg-red-900/20 top-1/2 right-10" />

      {/* ── Left Panel ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center scale-105"
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1611309454921-16cef3438ee0?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTB8MHwxfHNlYXJjaHwyfHxnb3VybWV0JTIwYnVyZ2VyJTIwZGFyayUyMGJhY2tncm91bmR8ZW58MHx8fHwxNzY5NzUzNjEwfDA&ixlib=rb-4.1.0&q=85)',
          }}
        />
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#08090d] via-[#08090d]/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#08090d] via-transparent to-[#08090d]/40" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#08090d]/80" />

        {/* Floating food chips */}
        {foodChips.map((chip, i) => (
          <FoodChip key={i} {...chip} />
        ))}

        {/* Ember particles */}
        {embers.map((e) => (
          <Ember key={e.id} style={e.style} />
        ))}

        {/* Content */}
        <div className="relative z-10 p-14 flex flex-col justify-between h-full">
          {/* Logo top */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-3"
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center">
                <UtensilsCrossed className="w-5 h-5 text-orange-400" />
              </div>
              <motion.div
                className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-orange-500"
                animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <span className="text-sm font-semibold text-zinc-400 tracking-widest uppercase">
              Nexa Eats
            </span>
          </motion.div>

          {/* Main hero text */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {/* Flame badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 mb-6">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-xs text-orange-400 font-medium tracking-wide">Restaurant OS</span>
              </div>

              <h1 className="text-6xl font-black tracking-tight leading-none mb-2">
                <span className="text-white">NEXA</span>
                <br />
                <span
                  className="text-transparent"
                  style={{
                    WebkitTextStroke: '2px #f97316',
                  }}
                >
                  EATS
                </span>
              </h1>

              <p className="text-zinc-400 text-lg max-w-sm leading-relaxed mt-5">
                The complete restaurant management platform. Streamline orders, kitchen, and service in one place.
              </p>
            </motion.div>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="flex items-center gap-8 mt-10 pt-8 border-t border-zinc-800"
            >
              <StatBadge value="50k+" label="Orders" delay={0.6} />
              <div className="w-px h-10 bg-zinc-800" />
              <StatBadge value="99.9%" label="Uptime" delay={0.7} />
              <div className="w-px h-10 bg-zinc-800" />
              <StatBadge value="4.9★" label="Rated" delay={0.8} />
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── Right Panel - Form ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-10 relative">
        {/* Subtle right-side glow */}
        <div className="absolute inset-0 bg-gradient-to-l from-orange-950/10 to-transparent pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 18, delay: 0.1 }}
          className="w-full max-w-[420px] relative z-10"
        >
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-flex items-center gap-3 mb-2"
            >
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center">
                <UtensilsCrossed className="w-5 h-5 text-orange-400" />
              </div>
              <h1 className="text-3xl font-black">
                <span className="text-white">NEXA</span>
                <span className="text-orange-500"> EATS</span>
              </h1>
            </motion.div>
          </div>

          {/* Mode toggle tabs */}
          <div className="flex bg-zinc-900/80 border border-zinc-800 rounded-xl p-1 mb-6">
            {['Sign In', 'Register'].map((tab, i) => (
              <button
                key={tab}
                type="button"
                onClick={() => setIsRegister(i === 1)}
                className="relative flex-1 py-2 text-sm font-medium rounded-lg transition-colors duration-200 z-10"
                style={{ color: (i === 1) === isRegister ? '#fff' : '#71717a' }}
              >
                {(i === 1) === isRegister && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg shadow-[0_0_20px_rgba(249,115,22,0.4)]"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{tab}</span>
              </button>
            ))}
          </div>

          {/* Card */}
          <motion.div
            layout
            className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-7 backdrop-blur-xl shadow-[0_8px_60px_rgba(0,0,0,0.5)]"
            style={{
              background: 'linear-gradient(135deg, rgba(24,24,27,0.8) 0%, rgba(15,15,20,0.9) 100%)',
            }}
          >
            {/* Heading */}
            <AnimatePresence mode="wait">
              <motion.div
                key={isRegister ? 'reg' : 'login'}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
                className="mb-6"
              >
                <h2 className="text-2xl font-bold text-white">
                  {isRegister ? 'Create your account' : 'Good to see you back'}
                </h2>
                <p className="text-zinc-500 text-sm mt-1">
                  {isRegister
                    ? 'Fill in the details to get started'
                    : 'Enter your credentials to continue'}
                </p>
              </motion.div>
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence>
                {isRegister && (
                  <motion.div
                    key="name-field"
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-1.5">
                      <Label htmlFor="name" className="text-zinc-300 text-xs font-semibold uppercase tracking-wider">
                        Full Name
                      </Label>
                      <Input
                        id="name"
                        data-testid="register-name-input"
                        type="text"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onFocus={() => setFocusedField('name')}
                        onBlur={() => setFocusedField(null)}
                        className={inputClass('name')}
                        required={isRegister}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-zinc-300 text-xs font-semibold uppercase tracking-wider">
                  Email
                </Label>
                <Input
                  id="email"
                  data-testid="login-email-input"
                  type="email"
                  placeholder="admin@nexa-eats.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  className={inputClass('email')}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-zinc-300 text-xs font-semibold uppercase tracking-wider">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    data-testid="login-password-input"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    className={`${inputClass('password')} pr-10`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-orange-400 transition-colors duration-150"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Role selector */}
              <AnimatePresence>
                {isRegister && (
                  <motion.div
                    key="role-field"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, delay: 0.05 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-1.5">
                      <Label className="text-zinc-300 text-xs font-semibold uppercase tracking-wider">
                        Your Role
                      </Label>
                      <div className="grid grid-cols-4 gap-2">
                        {roles.map((r) => (
                          <RoleOption
                            key={r.value}
                            {...r}
                            selected={role === r.value}
                            onSelect={setRole}
                          />
                        ))}
                      </div>
                      <input
                        type="hidden"
                        data-testid="register-role-select"
                        value={role}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <motion.div whileTap={{ scale: 0.98 }} className="pt-1">
                <Button
                  type="submit"
                  data-testid="login-submit-btn"
                  disabled={loading}
                  className="w-full h-11 font-bold text-sm tracking-wide relative overflow-hidden group border-0 text-white rounded-xl"
                  style={{
                    background: loading
                      ? 'rgba(249,115,22,0.5)'
                      : 'linear-gradient(135deg, #f97316 0%, #ea580c 50%, #c2410c 100%)',
                    boxShadow: loading ? 'none' : '0 4px 24px rgba(249,115,22,0.45)',
                  }}
                >
                  {/* Shine sweep */}
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

                  {loading ? (
                    <div className="flex items-center justify-center gap-2.5">
                      <motion.div
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                      />
                      <span>{isRegister ? 'Creating Account…' : 'Signing In…'}</span>
                    </div>
                  ) : (
                    <span className="relative z-10">
                      {isRegister ? '🚀 Create Account' : '→ Sign In'}
                    </span>
                  )}
                </Button>
              </motion.div>
            </form>

            {/* Demo credentials */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-5 rounded-xl border border-dashed border-zinc-700/70 p-4 bg-zinc-950/40"
            >
              <div className="flex items-center gap-2 mb-2">
                <ChefHat className="w-3.5 h-3.5 text-orange-500" />
                <p className="text-xs text-zinc-500 font-medium">Demo Credentials</p>
              </div>
              <div className="space-y-1 font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-orange-400/80">admin@nexa-eats.com</span>
                  <span className="text-[11px] text-zinc-500">admin123</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-orange-400/80">manager@nexa-eats.com</span>
                  <span className="text-[11px] text-zinc-500">manager123</span>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Bottom toggle link */}
          <p className="text-center mt-5 text-sm text-zinc-600">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-orange-500 hover:text-orange-400 font-semibold transition-colors duration-150 underline underline-offset-2"
            >
              {isRegister ? 'Sign In' : 'Register free'}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;

// impletr m ment cal ss die u you for first ti9mee hf