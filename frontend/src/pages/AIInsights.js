import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Skeleton } from '../components/ui/skeleton';
import { toast } from 'sonner';
import {
  Brain, TrendingUp, TrendingDown, Minus, Package,
  AlertTriangle, Sparkles, Send, UtensilsCrossed,
  Clock, Activity, Zap, ChevronRight, Bot,
  BarChart3, ShieldAlert, CheckCircle2, Flame,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell,
} from 'recharts';

/* ─── Tab config ─── */
const tabs = [
  { key: 'predictions',     label: 'Sales Forecast',   icon: Activity    },
  { key: 'inventory',       label: 'Inventory AI',     icon: Package     },
  { key: 'recommendations', label: 'Recommendations',  icon: Sparkles    },
  { key: 'assistant',       label: 'AI Assistant',     icon: Bot         },
];

/* ─── Quick prompts ─── */
const quickPrompts = [
  "Today's sales", "Low stock items", "Top selling items",
  "Active orders", "Free tables", "Monthly revenue",
];

/* ─── Chart tooltip ─── */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-4 py-3 shadow-2xl border" style={{ background: '#0f0f13', borderColor: '#27272a' }}>
      <p className="text-[11px] text-zinc-500 uppercase tracking-widest mb-2">{label}</p>
      {payload.map((e, i) => (
        <p key={i} className="text-sm font-bold" style={{ color: e.color || e.stroke }}>
          {e.name}: {typeof e.value === 'number' ? (e.name?.toLowerCase().includes('revenue') ? `₹${e.value.toFixed(0)}` : e.value) : e.value}
        </p>
      ))}
    </div>
  );
};

/* ─── Trend icon ─── */
const TrendIcon = ({ trend }) => {
  if (trend === 'up')   return <TrendingUp   className="w-4 h-4 text-emerald-400" />;
  if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-400" />;
  return <Minus className="w-4 h-4 text-zinc-500" />;
};

/* ─── Stat mini-card ─── */
const MiniStat = ({ label, value, trend, sub, color = '#f97316', delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    className="relative rounded-2xl border overflow-hidden p-5"
    style={{ background: 'linear-gradient(145deg,#111116,#0c0c10)', borderColor: 'rgba(39,39,42,0.8)' }}
  >
    <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(circle at 0% 0%,${color}12,transparent 65%)` }} />
    <motion.div className="absolute bottom-0 left-0 h-0.5" style={{ background: `linear-gradient(90deg,${color},transparent)` }} initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ delay: delay + 0.3, duration: 0.8 }} />
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">{label}</span>
        {trend && <TrendIcon trend={trend} />}
      </div>
      <p className="text-3xl font-black font-mono" style={{ color }}>{value}</p>
      {sub && <p className="text-xs text-zinc-600 mt-1">{sub}</p>}
    </div>
  </motion.div>
);

/* ─── Section wrapper ─── */
const Section = ({ title, icon: Icon, iconColor = '#f97316', children, delay = 0, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    className={`rounded-2xl border overflow-hidden ${className}`}
    style={{ background: 'linear-gradient(145deg,#111116,#0c0c10)', borderColor: 'rgba(39,39,42,0.8)' }}
  >
    {title && (
      <div className="flex items-center gap-2.5 px-6 pt-5 pb-4 border-b" style={{ borderColor: 'rgba(39,39,42,0.8)' }}>
        {Icon && (
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${iconColor}15` }}>
            <Icon className="w-4 h-4" style={{ color: iconColor }} />
          </div>
        )}
        <h3 className="text-sm font-black text-zinc-100 uppercase tracking-wider">{title}</h3>
      </div>
    )}
    <div className="p-6">{children}</div>
  </motion.div>
);

/* ─── Inventory stat card ─── */
const InvStat = ({ icon: Icon, value, label, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="flex items-center gap-3 p-4 rounded-2xl border"
    style={{ background: `${color}08`, borderColor: `${color}25` }}
  >
    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}15` }}>
      <Icon className="w-5 h-5" style={{ color }} />
    </div>
    <div>
      <p className="text-2xl font-black" style={{ color }}>{value}</p>
      <p className="text-xs text-zinc-600 uppercase tracking-widest">{label}</p>
    </div>
  </motion.div>
);

/* ─── Rank chip ─── */
const RankChip = ({ rank, color }) => (
  <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0" style={{ background: `${color}20`, color }}>
    {rank}
  </span>
);

const CHART_COLORS = ['#f97316', '#60a5fa', '#34d399', '#fbbf24', '#f472b6', '#a78bfa'];

/* ═══════════════════════════════════════════ */
const AIInsights = () => {
  const { api } = useAuth();
  const [loading, setLoading]                       = useState(true);
  const [salesPrediction, setSalesPrediction]       = useState(null);
  const [inventoryForecast, setInventoryForecast]   = useState(null);
  const [recommendations, setRecommendations]       = useState(null);
  const [assistantQuery, setAssistantQuery]         = useState('');
  const [assistantResponse, setAssistantResponse]   = useState(null);
  const [assistantLoading, setAssistantLoading]     = useState(false);
  const [chatHistory, setChatHistory]               = useState([]);
  const [activeTab, setActiveTab]                   = useState('predictions');

  useEffect(() => {
    const fetchAIData = async () => {
      try {
        const [salesRes, inventoryRes, recsRes] = await Promise.all([
          api.get('/ai/sales-prediction?days=30'),
          api.get('/ai/inventory-forecast?days=7'),
          api.post('/ai/food-recommendations', { orderItems: [] }),
        ]);
        setSalesPrediction(salesRes.data.data);
        setInventoryForecast(inventoryRes.data.data);
        setRecommendations(recsRes.data.data);
      } catch (e) { console.error('AI data fetch error:', e); }
      finally { setLoading(false); }
    };
    fetchAIData();
  }, [api]);

  const handleQuery = async () => {
    if (!assistantQuery.trim()) return;
    const q = assistantQuery;
    setAssistantQuery('');
    setChatHistory(h => [...h, { role: 'user', text: q }]);
    setAssistantLoading(true);
    try {
      const response = await api.post('/ai/assistant', { question: q });
      const answer = response.data.data?.answer || 'No answer available.';
      setChatHistory(h => [...h, { role: 'ai', text: answer }]);
      setAssistantResponse(response.data.data);
    } catch { toast.error('Failed to get response'); }
    finally { setAssistantLoading(false); }
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-10 w-64 rounded-xl bg-zinc-900" />
        <Skeleton className="h-12 w-full rounded-xl bg-zinc-900" />
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-28 rounded-2xl bg-zinc-900" />)}
        </div>
        <Skeleton className="h-72 rounded-2xl bg-zinc-900" />
      </div>
    );
  }

  return (
    <div className="space-y-5" data-testid="ai-insights-page">

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 relative" style={{ background: 'linear-gradient(135deg,rgba(249,115,22,0.2),rgba(234,88,12,0.1))', border: '1px solid rgba(249,115,22,0.35)' }}>
          <Brain className="w-6 h-6 text-orange-400" />
          <motion.div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-orange-500" animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }} transition={{ duration: 2, repeat: Infinity }} />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">AI Insights</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <motion.div className="w-1.5 h-1.5 rounded-full bg-emerald-500" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
            <span className="text-xs text-zinc-500">Smart analytics powered by rule-based AI</span>
          </div>
        </div>
      </motion.div>

      {/* ── Tab Bar ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
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
              className="relative flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-colors duration-200"
              style={{ color: active ? '#fff' : '#71717a' }}
            >
              {active && (
                <motion.div
                  layoutId="aiTab"
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

      {/* ── Content ── */}
      <AnimatePresence mode="wait">

        {/* ────────── SALES PREDICTIONS ────────── */}
        {activeTab === 'predictions' && (
          <motion.div key="pred" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MiniStat
                label="Avg Daily Orders"
                value={salesPrediction?.historicalAverage?.dailyOrders || 0}
                trend={salesPrediction?.trend?.direction}
                sub="Based on 30-day analysis"
                color="#60a5fa"
                delay={0.05}
              />
              <MiniStat
                label="Avg Daily Revenue"
                value={`₹${salesPrediction?.historicalAverage?.dailyRevenue || 0}`}
                trend={salesPrediction?.trend?.direction}
                sub={`Trend: ${salesPrediction?.trend?.percentage || 0}%`}
                color="#f97316"
                delay={0.10}
              />
              <MiniStat
                label="Monthly Prediction"
                value={`₹${salesPrediction?.monthlyPrediction?.predictedRevenue || 0}`}
                sub={`~${salesPrediction?.monthlyPrediction?.predictedOrders || 0} orders · ${salesPrediction?.monthlyPrediction?.confidence || 0}% confidence`}
                color="#34d399"
                delay={0.15}
              />
            </div>

            {/* Forecast chart */}
            <Section title="7-Day Sales Forecast" icon={Sparkles} iconColor="#f97316" delay={0.2}>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesPrediction?.dailyPredictions || []} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                    <defs>
                      <filter id="lineglow">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                      </filter>
                    </defs>
                    <CartesianGrid strokeDasharray="2 6" stroke="#1c1c22" vertical={false} />
                    <XAxis dataKey="dayOfWeek" tick={{ fill: '#52525b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#52525b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#f97316', strokeWidth: 1, strokeDasharray: '4 4' }} />
                    <Line type="monotone" dataKey="predictedRevenue" name="Predicted Revenue" stroke="#f97316" strokeWidth={2.5} dot={{ fill: '#f97316', r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: '#f97316', stroke: '#fff', strokeWidth: 2 }} isAnimationActive animationDuration={1200} />
                    <Line type="monotone" dataKey="predictedOrders"  name="Predicted Orders"  stroke="#60a5fa" strokeWidth={2.5} strokeDasharray="5 3" dot={{ fill: '#60a5fa', r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: '#60a5fa', stroke: '#fff', strokeWidth: 2 }} isAnimationActive animationDuration={1400} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              {/* Legend */}
              <div className="flex gap-5 mt-4 pt-4 border-t border-zinc-800">
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <span className="w-6 h-0.5 bg-orange-500 rounded" />
                  Predicted Revenue
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <span className="w-6 border-t-2 border-dashed border-blue-400" />
                  Predicted Orders
                </div>
              </div>
            </Section>
          </motion.div>
        )}

        {/* ────────── INVENTORY FORECAST ────────── */}
        {activeTab === 'inventory' && (
          <motion.div key="inv" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }} className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <InvStat icon={Package}       value={inventoryForecast?.summary?.totalItems    || 0} label="Total Items"  color="#60a5fa" delay={0.05} />
              <InvStat icon={AlertTriangle} value={inventoryForecast?.summary?.criticalCount  || 0} label="Critical"    color="#ef4444" delay={0.10} />
              <InvStat icon={ShieldAlert}   value={inventoryForecast?.summary?.warningCount   || 0} label="Warning"     color="#fbbf24" delay={0.15} />
              <InvStat icon={CheckCircle2}  value={inventoryForecast?.summary?.healthyCount   || 0} label="Healthy"     color="#34d399" delay={0.20} />
            </div>

            {/* Critical alerts */}
            {inventoryForecast?.criticalAlerts?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl border overflow-hidden"
                style={{ background: 'rgba(239,68,68,0.05)', borderColor: 'rgba(239,68,68,0.25)' }}
              >
                <div className="flex items-center gap-2.5 px-6 pt-5 pb-4 border-b" style={{ borderColor: 'rgba(239,68,68,0.2)' }}>
                  <div className="w-7 h-7 rounded-lg bg-red-500/15 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  </div>
                  <h3 className="text-sm font-black text-red-400 uppercase tracking-wider">Critical Alerts — Immediate Action Required</h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {inventoryForecast.criticalAlerts.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.25 + i * 0.06 }}
                      className="p-4 rounded-xl border"
                      style={{ background: 'rgba(239,68,68,0.06)', borderColor: 'rgba(239,68,68,0.2)' }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-bold text-zinc-100">{item.name}</span>
                        <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400">
                          {item.daysUntilEmpty}d left
                        </span>
                      </div>
                      <div className="space-y-1 text-xs text-zinc-500">
                        <p>Current: <span className="text-zinc-300 font-semibold">{item.currentStock} {item.unit}</span></p>
                        <p>Daily usage: <span className="text-zinc-300 font-semibold">{item.dailyUsage} {item.unit}</span></p>
                        <p className="text-orange-400 font-bold mt-2">↑ Restock: +{item.recommendedRestockQuantity} {item.unit}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Stock bar chart */}
            <Section title="Stock Level Forecast" icon={BarChart3} iconColor="#60a5fa" delay={0.3}>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={inventoryForecast?.forecasts?.slice(0, 10) || []} layout="vertical" margin={{ top: 0, right: 8, left: 8, bottom: 0 }}>
                    <defs>
                      {(inventoryForecast?.forecasts || []).slice(0, 10).map((_, i) => (
                        <linearGradient key={i} id={`invGrad${i}`} x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.9} />
                          <stop offset="100%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.5} />
                        </linearGradient>
                      ))}
                    </defs>
                    <XAxis type="number" tick={{ fill: '#52525b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" width={90} tick={{ fill: '#a1a1aa', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                    <Bar dataKey="currentStock" name="Current Stock" radius={[0, 6, 6, 0]} isAnimationActive animationDuration={1200}>
                      {(inventoryForecast?.forecasts || []).slice(0, 10).map((_, i) => (
                        <Cell key={i} fill={`url(#invGrad${i})`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Section>
          </motion.div>
        )}

        {/* ────────── RECOMMENDATIONS ────────── */}
        {activeTab === 'recommendations' && (
          <motion.div key="recs" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }} className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Trending */}
              <Section title="Trending This Week" icon={TrendingUp} iconColor="#34d399" delay={0.05}>
                <div className="space-y-2.5">
                  {recommendations?.trending?.length ? recommendations.trending.map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.05 }}
                      className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ background: i === 0 ? 'rgba(249,115,22,0.08)' : 'rgba(255,255,255,0.02)', border: `1px solid ${i === 0 ? 'rgba(249,115,22,0.2)' : 'rgba(63,63,70,0.5)'}` }}
                    >
                      <RankChip rank={i + 1} color={i === 0 ? '#f97316' : i === 1 ? '#60a5fa' : '#71717a'} />
                      <span className="flex-1 text-sm font-semibold text-zinc-200 truncate">{item.name}</span>
                      {i === 0 && <Flame className="w-4 h-4 text-orange-500 flex-shrink-0" />}
                      <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ background: 'rgba(34,197,94,0.1)', color: '#34d399', border: '1px solid rgba(34,197,94,0.25)' }}>
                        {item.count} orders
                      </span>
                    </motion.div>
                  )) : (
                    <p className="text-center text-zinc-600 py-8 text-sm">No trending data available</p>
                  )}
                </div>
              </Section>

              {/* Time-based */}
              <Section title="Time-Based Suggestions" icon={Clock} iconColor="#60a5fa" delay={0.1}>
                {recommendations?.timeBasedSuggestions && (
                  <div className="mb-4 p-3.5 rounded-xl" style={{ background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.25)' }}>
                    <p className="text-sm text-blue-300 font-semibold capitalize">
                      Category: <span className="text-white">{recommendations.timeBasedSuggestions.category}</span>
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">{recommendations.timeBasedSuggestions.reason}</p>
                  </div>
                )}
                <div className="space-y-2">
                  {recommendations?.timeBasedSuggestions?.items?.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 + i * 0.05 }}
                      className="flex items-center justify-between p-3 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(63,63,70,0.5)' }}
                    >
                      <span className="text-sm font-semibold text-zinc-200">{item.name}</span>
                      <span className="text-sm font-black text-orange-400">₹{item.price}</span>
                    </motion.div>
                  ))}
                </div>
              </Section>
            </div>

            {/* Popular by category */}
            <Section title="Popular by Category" icon={UtensilsCrossed} iconColor="#f97316" delay={0.15}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {recommendations?.popularByCategory?.map((cat, ci) => {
                  const color = CHART_COLORS[ci % CHART_COLORS.length];
                  return (
                    <motion.div
                      key={cat.category}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + ci * 0.06 }}
                      className="p-4 rounded-xl border"
                      style={{ background: `${color}06`, borderColor: `${color}20` }}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <span className="w-2 h-4 rounded-full flex-shrink-0" style={{ background: color }} />
                        <h4 className="text-xs font-black uppercase tracking-wider capitalize" style={{ color }}>{cat.category || 'Other'}</h4>
                      </div>
                      <div className="space-y-2">
                        {cat.topItems?.slice(0, 3).map((item, idx) => (
                          <div key={item.id || idx} className="flex items-center justify-between text-xs">
                            <span className="text-zinc-400 truncate pr-2">{item.name}</span>
                            <span className="font-bold flex-shrink-0" style={{ color }}>₹{item.price}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </Section>
          </motion.div>
        )}

        {/* ────────── AI ASSISTANT ────────── */}
        {activeTab === 'assistant' && (
          <motion.div key="asst" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
            <div className="rounded-2xl border overflow-hidden" style={{ background: 'linear-gradient(145deg,#111116,#0c0c10)', borderColor: 'rgba(39,39,42,0.8)' }}>
              {/* Header */}
              <div className="flex items-center gap-3 px-6 pt-5 pb-4 border-b" style={{ borderColor: 'rgba(39,39,42,0.8)' }}>
                <div className="w-9 h-9 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-zinc-100 uppercase tracking-wider">AI Assistant</h3>
                  <p className="text-xs text-zinc-600">Ask anything about your restaurant</p>
                </div>
                <motion.div className="ml-auto flex items-center gap-1.5 text-xs text-emerald-400" animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Online
                </motion.div>
              </div>

              {/* Chat area */}
              <div className="p-6 space-y-4 min-h-[240px] max-h-[360px] overflow-y-auto">
                {chatHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                      <Brain className="w-7 h-7 text-orange-400/60" />
                    </div>
                    <p className="text-zinc-600 text-sm">Ask me anything about your restaurant data</p>
                  </div>
                ) : (
                  chatHistory.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.role === 'ai' && (
                        <div className="w-7 h-7 rounded-lg bg-orange-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Bot className="w-4 h-4 text-orange-400" />
                        </div>
                      )}
                      <div
                        className="max-w-xs px-4 py-2.5 rounded-2xl text-sm"
                        style={msg.role === 'user'
                          ? { background: 'linear-gradient(135deg,#f97316,#ea580c)', color: '#fff', borderRadius: '16px 16px 4px 16px' }
                          : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(63,63,70,0.5)', color: '#e4e4e7', borderRadius: '16px 16px 16px 4px' }
                        }
                      >
                        {msg.text}
                      </div>
                    </motion.div>
                  ))
                )}
                {assistantLoading && (
                  <div className="flex gap-3">
                    <div className="w-7 h-7 rounded-lg bg-orange-500/15 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-orange-400" />
                    </div>
                    <div className="px-4 py-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(63,63,70,0.5)', borderRadius: '16px 16px 16px 4px' }}>
                      <div className="flex gap-1.5">
                        {[0,1,2].map(i => (
                          <motion.span key={i} className="w-1.5 h-1.5 rounded-full bg-orange-500" animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick prompts */}
              <div className="px-6 pb-4">
                <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-2 font-semibold">Quick prompts</p>
                <div className="flex flex-wrap gap-1.5">
                  {quickPrompts.map(q => (
                    <button
                      key={q}
                      onClick={() => setAssistantQuery(q)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-150 hover:border-orange-500/50 hover:text-orange-400 hover:bg-orange-500/5"
                      style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(63,63,70,0.6)', color: '#71717a' }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input */}
              <div className="px-6 pb-6">
                <div className="flex gap-2 p-2 rounded-2xl border" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(63,63,70,0.7)' }}>
                  <input
                    value={assistantQuery}
                    onChange={e => setAssistantQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleQuery()}
                    placeholder="Ask me anything about your restaurant…"
                    className="flex-1 bg-transparent text-sm text-white placeholder-zinc-600 focus:outline-none px-2"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleQuery}
                    disabled={assistantLoading || !assistantQuery.trim()}
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)', boxShadow: assistantQuery.trim() ? '0 0 16px rgba(249,115,22,0.4)' : 'none' }}
                  >
                    {assistantLoading
                      ? <motion.div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />
                      : <Send className="w-4 h-4 text-white" />
                    }
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIInsights;