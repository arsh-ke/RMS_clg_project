import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Skeleton } from '../components/ui/skeleton';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts';
import {
  Calendar, TrendingUp, DollarSign, ShoppingBag,
  BarChart3, Activity, Award, CreditCard,
  Wallet, Smartphone, Banknote, Package,
  CheckCircle2, XCircle, Clock, ChefHat,
  UtensilsCrossed,
} from 'lucide-react';

/* ─── Chart color palette ─── */
const COLORS = ['#f97316', '#60a5fa', '#34d399', '#fbbf24', '#f472b6', '#a78bfa', '#22d3ee', '#fb923c'];

/* ─── Tab config ─── */
const tabs = [
  { key: 'sales',      label: 'Sales Trend',  icon: Activity   },
  { key: 'items',      label: 'Top Items',    icon: Award      },
  { key: 'categories', label: 'Categories',   icon: Package    },
  { key: 'orders',     label: 'Order Stats',  icon: BarChart3  },
];

/* ─── Stat card ─── */
const StatCard = ({ icon: Icon, value, label, color, prefix = '', delay = 0 }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const end = Number(String(value).replace(/[^0-9.]/g, '')) || 0;
    let frame = 0;
    const steps = 50;
    const timer = setInterval(() => {
      frame++;
      setDisplay(end * (frame / steps));
      if (frame >= steps) { setDisplay(end); clearInterval(timer); }
    }, 20);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="relative rounded-2xl border overflow-hidden p-5"
      style={{ background: 'linear-gradient(145deg,#111116,#0c0c10)', borderColor: 'rgba(39,39,42,0.8)' }}
    >
      {/* Glow */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(circle at 0% 0%,${color}15,transparent 65%)` }} />
      {/* Bottom strip */}
      <motion.div
        className="absolute bottom-0 left-0 h-0.5 w-full"
        style={{ background: `linear-gradient(90deg,${color},transparent)` }}
        initial={{ scaleX: 0, originX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: delay + 0.3, duration: 0.8 }}
      />
      <div className="relative z-10 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}15`, border: `1px solid ${color}30`, boxShadow: `0 0 20px ${color}20` }}>
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
        <div>
          <p className="text-2xl font-black text-white leading-none">
            {prefix}{typeof value === 'number' ? display.toFixed(value % 1 ? 2 : 0) : value}
          </p>
          <p className="text-xs text-zinc-500 uppercase tracking-widest mt-1">{label}</p>
        </div>
      </div>
    </motion.div>
  );
};

/* ─── Custom tooltip ─── */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-4 py-3 shadow-2xl border" style={{ background: '#0f0f13', borderColor: '#27272a' }}>
      <p className="text-[11px] text-zinc-500 uppercase tracking-widest mb-2">{label}</p>
      {payload.map((e, i) => (
        <p key={i} className="text-sm font-bold" style={{ color: e.color || e.fill }}>
          {e.name}: {typeof e.value === 'number' && e.name?.toLowerCase().includes('revenue') ? `₹${e.value.toFixed(2)}` : e.value}
        </p>
      ))}
    </div>
  );
};

/* ─── Section wrapper ─── */
const Section = ({ title, subtitle, children, delay = 0, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    className={`rounded-2xl border overflow-hidden ${className}`}
    style={{ background: 'linear-gradient(145deg,#111116,#0c0c10)', borderColor: 'rgba(39,39,42,0.8)' }}
  >
    {(title || subtitle) && (
      <div className="px-6 pt-5 pb-4 border-b" style={{ borderColor: 'rgba(39,39,42,0.8)' }}>
        {title && <h3 className="text-base font-black text-zinc-100">{title}</h3>}
        {subtitle && <p className="text-xs text-zinc-600 mt-0.5">{subtitle}</p>}
      </div>
    )}
    <div className="p-6">{children}</div>
  </motion.div>
);

/* ─── Order status config ─── */
const orderStatusConfig = {
  pending:   { color: '#f97316', icon: Clock          },
  preparing: { color: '#60a5fa', icon: ChefHat        },
  ready:     { color: '#34d399', icon: CheckCircle2   },
  served:    { color: '#a78bfa', icon: UtensilsCrossed },
  completed: { color: '#71717a', icon: CheckCircle2   },
  cancelled: { color: '#ef4444', icon: XCircle        },
};

const paymentIcons = { cash: Banknote, card: CreditCard, upi: Smartphone, other: Wallet };

/* ═══════════════════════════════════════════ */
const Reports = () => {
  const { api } = useAuth();
  const { socket } = useSocket();
  const [loading, setLoading]               = useState(true);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [salesData, setSalesData]           = useState([]);
  const [topItems, setTopItems]             = useState([]);
  const [categoryRevenue, setCategoryRevenue] = useState([]);
  const [orderStats, setOrderStats]         = useState(null);
  const [activeTab, setActiveTab]           = useState('sales');

  useEffect(() => {
    const fetch = async () => {
      try {
        const [statsRes, salesRes, topRes, catRes, orderRes] = await Promise.all([
          api.get('/analytics/dashboard'),
          api.get('/analytics/sales?groupBy=day'),
          api.get('/analytics/top-items?limit=10'),
          api.get('/analytics/category-revenue'),
          api.get('/analytics/orders'),
        ]);
        setDashboardStats(statsRes.data.data);
        setSalesData(salesRes.data.data || []);
        setTopItems(topRes.data.data || []);
        setCategoryRevenue(catRes.data.data || []);
        setOrderStats(orderRes.data.data);
      } catch (e) {
        console.error('Failed to fetch report data:', e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [api]);

  // Listen for payment updates
  useEffect(() => {
    if (!socket) return;

    const handlePaymentReceived = () => {
      // Refetch dashboard stats when payment is received
      const fetchStats = async () => {
        try {
          const statsRes = await api.get('/analytics/dashboard');
          setDashboardStats(statsRes.data.data);
        } catch (e) {
          console.error('Failed to update stats:', e);
        }
      };
      fetchStats();
    };

    socket.on('payment_received', handlePaymentReceived);

    return () => {
      socket.off('payment_received', handlePaymentReceived);
    };
  }, [socket, api]);

  /* Max for bar scaling */
  const maxQty = topItems[0]?.totalQuantity || 1;
  const totalCatRevenue = categoryRevenue.reduce((s, c) => s + (c.totalRevenue || 0), 0) || 1;

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="flex justify-between">
          <Skeleton className="h-10 w-56 rounded-xl bg-zinc-900" />
          <Skeleton className="h-8 w-32 rounded-xl bg-zinc-900" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-20 rounded-2xl bg-zinc-900" />)}
        </div>
        <Skeleton className="h-12 w-full rounded-xl bg-zinc-900" />
        <Skeleton className="h-80 rounded-2xl bg-zinc-900" />
      </div>
    );
  }

  return (
    <div className="space-y-5" data-testid="reports-page">

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-orange-400" />
            </span>
            Reports & Analytics
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Business insights and performance metrics</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-orange-500/25 bg-orange-500/8">
          <Calendar className="w-3.5 h-3.5 text-orange-400" />
          <span className="text-xs font-semibold text-orange-400">Last 30 days</span>
        </div>
      </motion.div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} value={dashboardStats?.allTime?.totalRevenue || 0}    label="Total Revenue"   color="#34d399" prefix="₹" delay={0.05} />
        <StatCard icon={ShoppingBag}value={dashboardStats?.allTime?.totalOrders || 0}     label="Total Orders"    color="#60a5fa" delay={0.10} />
        <StatCard icon={TrendingUp} value={dashboardStats?.allTime?.avgOrderValue || 0}   label="Avg Order Value" color="#f97316" prefix="₹" delay={0.15} />
        <StatCard icon={BarChart3}  value={dashboardStats?.month?.revenue || 0}           label="This Month"      color="#a78bfa" prefix="₹" delay={0.20} />
      </div>

      {/* ── Custom Tab Bar ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex gap-1.5 p-1.5 rounded-2xl border border-zinc-800/80"
        style={{ background: 'linear-gradient(145deg,#0e0e12,#0a0a0e)' }}
      >
        {tabs.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="relative flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-colors duration-200 z-10"
              style={{ color: active ? '#fff' : '#71717a' }}
            >
              {active && (
                <motion.div
                  layoutId="activeReportTab"
                  className="absolute inset-0 rounded-xl"
                  style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)', boxShadow: '0 0 20px rgba(249,115,22,0.35)' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </span>
            </button>
          );
        })}
      </motion.div>

      {/* ── Tab Content ── */}
      <AnimatePresence mode="wait">

        {/* ── SALES TAB ── */}
        {activeTab === 'sales' && (
          <motion.div
            key="sales"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
          >
            <Section title="Daily Sales Revenue" subtitle="Last 30 days of transactions">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesData.slice(-30)} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="#f97316" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#f97316" stopOpacity={0}   />
                      </linearGradient>
                      <filter id="glow2">
                        <feGaussianBlur stdDeviation="2.5" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                      </filter>
                    </defs>
                    <CartesianGrid strokeDasharray="2 6" stroke="#1c1c22" vertical={false} />
                    <XAxis dataKey="_id" tick={{ fill: '#52525b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => v?.slice(5) || ''} />
                    <YAxis tick={{ fill: '#52525b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                    <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#f97316', strokeWidth: 1, strokeDasharray: '4 4' }} />
                    <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#f97316" strokeWidth={2.5} fill="url(#salesGrad)" dot={false} activeDot={{ r: 5, fill: '#f97316', stroke: '#fff', strokeWidth: 2 }} isAnimationActive animationDuration={1400} animationEasing="ease-out" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Mini summary row */}
              {salesData.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-zinc-800">
                  {[
                    { label: 'Peak Day',    value: `₹${Math.max(...salesData.map(d => d.revenue || 0)).toFixed(0)}` },
                    { label: 'Avg / Day',   value: `₹${(salesData.reduce((s, d) => s + (d.revenue || 0), 0) / (salesData.length || 1)).toFixed(0)}` },
                    { label: 'Total Days',  value: salesData.length },
                  ].map(s => (
                    <div key={s.label} className="text-center">
                      <p className="text-lg font-black text-orange-400">{s.value}</p>
                      <p className="text-xs text-zinc-600 uppercase tracking-widest mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          </motion.div>
        )}

        {/* ── TOP ITEMS TAB ── */}
        {activeTab === 'items' && (
          <motion.div
            key="items"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-4"
          >
            {/* Horizontal bar chart */}
            <Section title="Top Selling Items" subtitle="By quantity ordered">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topItems} layout="vertical" margin={{ top: 0, right: 8, left: 8, bottom: 0 }}>
                    <defs>
                      {topItems.map((_, i) => (
                        <linearGradient key={i} id={`barGrad${i}`} x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.9} />
                          <stop offset="100%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.5} />
                        </linearGradient>
                      ))}
                    </defs>
                    <XAxis type="number" tick={{ fill: '#52525b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fill: '#a1a1aa', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                    <Bar dataKey="totalQuantity" name="Quantity" radius={[0, 6, 6, 0]} isAnimationActive animationDuration={1200}>
                      {topItems.map((_, i) => <Cell key={i} fill={`url(#barGrad${i})`} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Section>

            {/* Ranked list */}
            <Section title="Ranking" subtitle="Most ordered dishes">
              <div className="space-y-2.5">
                {topItems.slice(0, 8).map((item, i) => {
                  const pct = (item.totalQuantity / maxQty) * 100;
                  const color = COLORS[i % COLORS.length];
                  return (
                    <motion.div
                      key={item._id || i}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-3"
                    >
                      <span className="w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black flex-shrink-0" style={{ background: `${color}20`, color }}>
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between mb-1">
                          <span className="text-xs font-semibold text-zinc-300 truncate pr-2">{item.name}</span>
                          <span className="text-xs text-zinc-500 flex-shrink-0">{item.totalQuantity}</span>
                        </div>
                        <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ background: color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ delay: 0.1 + i * 0.05, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </Section>
          </motion.div>
        )}

        {/* ── CATEGORIES TAB ── */}
        {activeTab === 'categories' && (
          <motion.div
            key="categories"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-4"
          >
            {/* Donut */}
            <Section title="Revenue by Category" subtitle="Sales distribution across menu sections">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      {categoryRevenue.map((_, i) => (
                        <radialGradient key={i} id={`pieGrad${i}`} cx="50%" cy="50%" r="50%">
                          <stop offset="0%"   stopColor={COLORS[i % COLORS.length]} stopOpacity={1}   />
                          <stop offset="100%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.65} />
                        </radialGradient>
                      ))}
                    </defs>
                    <Pie
                      data={categoryRevenue}
                      dataKey="totalRevenue"
                      nameKey="_id"
                      cx="50%" cy="50%"
                      innerRadius={50} outerRadius={90}
                      paddingAngle={3}
                      isAnimationActive animationDuration={1000}
                    >
                      {categoryRevenue.map((_, i) => (
                        <Cell key={i} fill={`url(#pieGrad${i})`} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Legend dots */}
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {categoryRevenue.map((cat, i) => (
                  <div key={cat._id} className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length], boxShadow: `0 0 6px ${COLORS[i % COLORS.length]}` }} />
                    <span className="capitalize">{cat._id || 'Other'}</span>
                  </div>
                ))}
              </div>
            </Section>

            {/* Breakdown list */}
            <Section title="Category Breakdown" subtitle="Revenue and quantity per category">
              <div className="space-y-3">
                {categoryRevenue.map((cat, i) => {
                  const color = COLORS[i % COLORS.length];
                  const pct = ((cat.totalRevenue || 0) / totalCatRevenue * 100).toFixed(1);
                  return (
                    <motion.div
                      key={cat._id}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ background: `${color}08`, border: `1px solid ${color}20` }}
                    >
                      <div className="w-3 h-8 rounded-full flex-shrink-0" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-bold text-zinc-200 capitalize">{cat._id || 'Other'}</span>
                          <span className="text-[11px] text-zinc-500">{pct}%</span>
                        </div>
                        <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                          <motion.div className="h-full rounded-full" style={{ background: color }} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: 0.1 + i * 0.05, duration: 0.8 }} />
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-black" style={{ color }}>₹{cat.totalRevenue?.toFixed(0)}</p>
                        <p className="text-[11px] text-zinc-600">{cat.totalQuantity} sold</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </Section>
          </motion.div>
        )}

        {/* ── ORDERS TAB ── */}
        {activeTab === 'orders' && (
          <motion.div
            key="orders"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-4"
          >
            {/* Orders by status */}
            <Section title="Orders by Status" subtitle="All-time breakdown">
              <div className="space-y-2.5">
                {(orderStats?.byStatus || []).map((stat, i) => {
                  const cfg = orderStatusConfig[stat._id] || { color: '#71717a', icon: Package };
                  const Icon = cfg.icon;
                  const total = orderStats?.byStatus?.reduce((s, x) => s + x.count, 0) || 1;
                  const pct = ((stat.count / total) * 100).toFixed(1);
                  return (
                    <motion.div
                      key={stat._id}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ background: `${cfg.color}08`, border: `1px solid ${cfg.color}20` }}
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${cfg.color}15` }}>
                        <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-bold text-zinc-200 capitalize">{stat._id}</span>
                          <span className="text-[11px] text-zinc-500">{pct}%</span>
                        </div>
                        <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                          <motion.div className="h-full rounded-full" style={{ background: cfg.color }} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: 0.1 + i * 0.05, duration: 0.8 }} />
                        </div>
                      </div>
                      <span className="text-lg font-black flex-shrink-0" style={{ color: cfg.color }}>{stat.count}</span>
                    </motion.div>
                  );
                })}
              </div>
            </Section>

            {/* Payment methods */}
            <Section title="Payment Methods" subtitle="How customers prefer to pay">
              {/* Donut */}
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={orderStats?.byPayment || []}
                      dataKey="count"
                      nameKey="_id"
                      cx="50%" cy="50%"
                      innerRadius={42} outerRadius={72}
                      paddingAngle={3}
                      isAnimationActive animationDuration={1000}
                    >
                      {(orderStats?.byPayment || []).map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Payment list */}
              <div className="space-y-2 mt-2">
                {(orderStats?.byPayment || []).map((method, i) => {
                  const color = COLORS[i % COLORS.length];
                  const Icon = paymentIcons[method._id] || Wallet;
                  const total = orderStats?.byPayment?.reduce((s, x) => s + x.count, 0) || 1;
                  const pct = ((method.count / total) * 100).toFixed(0);
                  return (
                    <div key={method._id} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}20` }}>
                        <Icon className="w-3.5 h-3.5" style={{ color }} />
                      </div>
                      <span className="text-sm font-bold text-zinc-200 uppercase flex-1">{method._id}</span>
                      <span className="text-xs text-zinc-500">{method.count} orders</span>
                      <span className="text-sm font-black" style={{ color }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </Section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Reports;