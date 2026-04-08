import React, { useEffect, useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, animate } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import {
  DollarSign,
  ShoppingBag,
  Clock,
  TrendingUp,
  TrendingDown,
  UtensilsCrossed,
  Users,
  Package,
  AlertTriangle,
  Flame,
  Activity,
  ChevronRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

/* ─── Animated number counter ─── */
const AnimatedNumber = ({ value, prefix = '', suffix = '', decimals = 0 }) => {
  const ref = useRef(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const controls = animate(0, Number(value) || 0, {
      duration: 1.2,
      ease: [0.16, 1, 0.3, 1],
      onUpdate(v) {
        node.textContent = prefix + v.toFixed(decimals) + suffix;
      },
    });
    return () => controls.stop();
  }, [value, prefix, suffix, decimals]);
  return <span ref={ref}>{prefix}0{suffix}</span>;
};

/* ─── Micro sparkline bar ─── */
const SparkBar = ({ pct, color }) => (
  <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden mt-3">
    <motion.div
      className="h-full rounded-full"
      style={{ background: color }}
      initial={{ width: 0 }}
      animate={{ width: `${pct}%` }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
    />
  </div>
);

/* ─── Custom chart tooltip ─── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0f0f13] border border-zinc-700/80 rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-xs text-zinc-500 mb-1 uppercase tracking-widest">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-bold" style={{ color: p.color }}>
          ₹{Number(p.value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </p>
      ))}
    </div>
  );
};

/* ─── Stat card ─── */
const StatCard = ({ title, value, icon: Icon, trend, color, prefix = '', suffix = '', decimals = 0, pct = 60, delay = 0 }) => {
  const palette = {
    orange: { bg: 'rgba(249,115,22,0.08)', icon: '#f97316', glow: 'rgba(249,115,22,0.25)', bar: '#f97316' },
    blue:   { bg: 'rgba(59,130,246,0.08)',  icon: '#60a5fa', glow: 'rgba(96,165,250,0.2)',  bar: '#60a5fa' },
    emerald:{ bg: 'rgba(16,185,129,0.08)', icon: '#34d399', glow: 'rgba(52,211,153,0.2)',  bar: '#34d399' },
    amber:  { bg: 'rgba(245,158,11,0.08)',  icon: '#fbbf24', glow: 'rgba(251,191,36,0.2)',  bar: '#fbbf24' },
  };
  const p = palette[color] || palette.orange;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
    >
      <div
        className="relative rounded-2xl border border-zinc-800/80 p-5 overflow-hidden group cursor-default"
        style={{ background: 'linear-gradient(135deg, #111116 0%, #0c0c10 100%)' }}
      >
        {/* Hover glow backdrop */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
          style={{ background: `radial-gradient(circle at 50% 0%, ${p.glow} 0%, transparent 70%)` }}
        />

        {/* Top row */}
        <div className="flex items-start justify-between mb-4">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: p.bg, boxShadow: `0 0 20px ${p.glow}` }}
          >
            <Icon className="w-5 h-5" style={{ color: p.icon }} />
          </div>
          {trend !== undefined && (
            <div
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold"
              style={{
                background: trend >= 0 ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                color: trend >= 0 ? '#34d399' : '#f87171',
              }}
            >
              {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(trend).toFixed(1)}%
            </div>
          )}
        </div>

        {/* Value */}
        <p className="text-3xl font-black text-white tracking-tight">
          <AnimatedNumber value={value} prefix={prefix} suffix={suffix} decimals={decimals} />
        </p>
        <p className="text-xs text-zinc-500 uppercase tracking-widest mt-1">{title}</p>

        {/* Progress bar */}
        <SparkBar pct={pct} color={p.bar} />
      </div>
    </motion.div>
  );
};

/* ─── Rank badge ─── */
const RankBadge = ({ rank }) => {
  const colors = ['#f97316', '#fb923c', '#fdba74', '#a1a1aa', '#71717a'];
  return (
    <span
      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0"
      style={{ background: `${colors[rank]}22`, color: colors[rank] }}
    >
      {rank + 1}
    </span>
  );
};

/* ─── Section header ─── */
const SectionHeader = ({ icon: Icon, title, iconColor = '#f97316', badge }) => (
  <div className="flex items-center justify-between mb-5">
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${iconColor}15` }}>
        <Icon className="w-4 h-4" style={{ color: iconColor }} />
      </div>
      <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">{title}</h3>
    </div>
    {badge}
  </div>
);

/* ─── Custom pie label ─── */
const PieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value }) => {
  if (!value) return null;
  const RADIAN = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight="bold">
      {value}
    </text>
  );
};

/* ═══════════════════════════════════════ */
const Dashboard = () => {
  const { api, user } = useAuth();
  const [stats, setStats] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [tableStats, setTableStats] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, salesRes, topItemsRes, tableRes, inventoryRes] = await Promise.all([
          api.get('/analytics/dashboard'),
          api.get('/analytics/sales?groupBy=day'),
          api.get('/analytics/top-items?limit=5'),
          api.get('/tables/stats'),
          api.get('/inventory/low-stock'),
        ]);
        setStats(statsRes.data.data);
        setSalesData(salesRes.data.data || []);
        setTopItems(topItemsRes.data.data || []);
        setTableStats(tableRes.data.data);
        setLowStock(inventoryRes.data.data || []);
      } catch (error) {
        console.error('Dashboard fetch error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [api]);

  if (loading) {
    return (
      <div className="space-y-6 p-1">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-36 rounded-2xl bg-zinc-900/80" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Skeleton className="h-80 lg:col-span-2 rounded-2xl bg-zinc-900/80" />
          <Skeleton className="h-80 rounded-2xl bg-zinc-900/80" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Skeleton className="h-64 rounded-2xl bg-zinc-900/80" />
          <Skeleton className="h-64 lg:col-span-2 rounded-2xl bg-zinc-900/80" />
        </div>
      </div>
    );
  }

  const tableData = [
    { name: 'Free', value: tableStats?.free || 0 },
    { name: 'Occupied', value: tableStats?.occupied || 0 },
    { name: 'Reserved', value: tableStats?.reserved || 0 },
  ];
  const tableColors = ['#22c55e', '#f97316', '#60a5fa'];
  const totalTables = tableData.reduce((a, b) => a + b.value, 0) || 1;

  return (
    <div className="space-y-5 p-1" data-testid="dashboard-page">

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
            <span className="text-orange-500">{user?.name?.split(' ')[0]}</span> 👋
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Here's what's happening at your restaurant today.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
          />
          <Badge
            className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-orange-500/30 bg-orange-500/8 text-orange-400"
          >
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </Badge>
        </div>
      </motion.div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Revenue"
          value={stats?.today?.revenue?.toFixed(2) || '0.00'}
          icon={DollarSign}
          color="orange"
          prefix="₹"
          decimals={2}
          pct={72}
          delay={0.05}
        />
        <StatCard
          title="Today's Orders"
          value={stats?.today?.orders || 0}
          icon={ShoppingBag}
          color="blue"
          pct={58}
          delay={0.1}
        />
        <StatCard
          title="Active Orders"
          value={stats?.today?.activeOrders || 0}
          icon={Clock}
          color="amber"
          pct={40}
          delay={0.15}
        />
        <StatCard
          title="Monthly Revenue"
          value={stats?.month?.revenue?.toFixed(2) || '0.00'}
          icon={TrendingUp}
          color="emerald"
          prefix="₹"
          decimals={2}
          pct={85}
          delay={0.2}
        />
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Sales Area Chart */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
        >
          <div
            className="rounded-2xl border border-zinc-800/80 p-6 h-full"
            style={{ background: 'linear-gradient(135deg, #111116 0%, #0c0c10 100%)' }}
          >
            <SectionHeader
              icon={Activity}
              title="Sales Overview"
              iconColor="#f97316"
              badge={
                <span className="text-xs text-zinc-600">Last 14 days</span>
              }
            />
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={salesData.slice(-14)}
                  margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f97316" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="2 6" stroke="#1f1f27" vertical={false} />
                  <XAxis
                    dataKey="_id"
                    tick={{ fill: '#52525b', fontSize: 11, fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => v?.slice(5) || ''}
                  />
                  <YAxis
                    tick={{ fill: '#52525b', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#f97316', strokeWidth: 1, strokeDasharray: '4 4' }} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#f97316"
                    strokeWidth={2.5}
                    fill="url(#grad1)"
                    dot={false}
                    activeDot={{ r: 5, fill: '#f97316', stroke: '#fff', strokeWidth: 2, filter: 'url(#glow)' }}
                    isAnimationActive
                    animationDuration={1600}
                    animationEasing="ease-out"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

        {/* Top Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <div
            className="rounded-2xl border border-zinc-800/80 p-6 h-full"
            style={{ background: 'linear-gradient(135deg, #111116 0%, #0c0c10 100%)' }}
          >
            <SectionHeader icon={Flame} title="Top Sellers" iconColor="#f97316" />

            <div className="space-y-3">
              {topItems.length === 0 ? (
                <p className="text-zinc-600 text-sm text-center py-8">No data yet</p>
              ) : (
                topItems.map((item, i) => {
                  const maxQty = topItems[0]?.totalQuantity || 1;
                  const pct = ((item.totalQuantity / maxQty) * 100).toFixed(0);
                  return (
                    <motion.div
                      key={item._id || i}
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.35 + i * 0.06 }}
                    >
                      <div className="flex items-center gap-3 group">
                        <RankBadge rank={i} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-semibold text-zinc-200 truncate pr-2">
                              {item.name}
                            </span>
                            <span className="text-xs text-zinc-500 flex-shrink-0">{item.totalQuantity}</span>
                          </div>
                          <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full rounded-full"
                              style={{
                                background: i === 0
                                  ? 'linear-gradient(90deg, #f97316, #fb923c)'
                                  : 'linear-gradient(90deg, #52525b, #71717a)',
                              }}
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ delay: 0.4 + i * 0.06, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Bottom Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Table Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
        >
          <div
            className="rounded-2xl border border-zinc-800/80 p-6 h-full"
            style={{ background: 'linear-gradient(135deg, #111116 0%, #0c0c10 100%)' }}
          >
            <SectionHeader icon={Users} title="Table Status" iconColor="#60a5fa" />

            {/* Donut chart */}
            <div className="h-44 -mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    {tableColors.map((c, i) => (
                      <radialGradient key={i} id={`pg${i}`} cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor={c} stopOpacity={1} />
                        <stop offset="100%" stopColor={c} stopOpacity={0.7} />
                      </radialGradient>
                    ))}
                  </defs>
                  <Pie
                    data={tableData}
                    cx="50%"
                    cy="50%"
                    innerRadius={44}
                    outerRadius={68}
                    dataKey="value"
                    paddingAngle={3}
                    labelLine={false}
                    label={<PieLabel />}
                    isAnimationActive
                    animationDuration={1000}
                  >
                    {tableData.map((_, i) => (
                      <Cell key={i} fill={`url(#pg${i})`} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#0f0f13',
                      border: '1px solid #27272a',
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-3 gap-2 mt-1">
              {tableData.map((d, i) => (
                <div key={d.name} className="flex flex-col items-center gap-1">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: tableColors[i], boxShadow: `0 0 6px ${tableColors[i]}` }}
                  />
                  <span className="text-xs text-zinc-500">{d.name}</span>
                  <span className="text-sm font-bold text-zinc-200">{d.value}</span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between">
              <span className="text-xs text-zinc-600 uppercase tracking-widest">Total Tables</span>
              <span className="text-lg font-black text-zinc-100">{totalTables}</span>
            </div>
          </div>
        </motion.div>

        {/* Low Stock Alerts */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <div
            className="rounded-2xl border border-zinc-800/80 p-6 h-full"
            style={{ background: 'linear-gradient(135deg, #111116 0%, #0c0c10 100%)' }}
          >
            <SectionHeader
              icon={AlertTriangle}
              title="Low Stock Alerts"
              iconColor="#fbbf24"
              badge={
                lowStock.length > 0 ? (
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-500/15 text-red-400 text-xs font-bold border border-red-500/20">
                    {lowStock.length}
                  </span>
                ) : null
              }
            />

            {lowStock.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                  <Package className="w-7 h-7 text-emerald-500" />
                </div>
                <p className="text-zinc-500 text-sm font-medium">All inventory levels are healthy</p>
                <p className="text-zinc-700 text-xs">No restocking needed right now</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {lowStock.slice(0, 6).map((item, i) => {
                  const isVeryLow = item.quantity <= (item.minQuantity || 5) * 0.5;
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.45 + i * 0.05 }}
                      className="flex items-center justify-between p-3.5 rounded-xl border group hover:border-zinc-600 transition-all duration-200"
                      style={{
                        background: isVeryLow ? 'rgba(239,68,68,0.04)' : 'rgba(245,158,11,0.04)',
                        borderColor: isVeryLow ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.2)',
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{
                            background: isVeryLow ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)',
                          }}
                        >
                          <Package
                            className="w-4 h-4"
                            style={{ color: isVeryLow ? '#f87171' : '#fbbf24' }}
                          />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-zinc-200 leading-tight">{item.name}</p>
                          <p className="text-[11px] text-zinc-600 mt-0.5">{item.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className="text-sm font-black"
                          style={{ color: isVeryLow ? '#f87171' : '#fbbf24' }}
                        >
                          {item.quantity}
                        </span>
                        <p className="text-[11px] text-zinc-600">{item.unit}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;