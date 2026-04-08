import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { toast } from 'sonner';
import {
  Clock, ChefHat, CheckCircle2, Bell, Timer,
  Volume2, VolumeX, RefreshCw, Flame, Zap,
  UtensilsCrossed, ArrowRight, AlertCircle,
} from 'lucide-react';
import { NotificationHighlight, NotificationToast } from '../components/NotificationHighlight';
import { soundNotificationManager } from '../utils/soundNotificationManager';

/* ─── Column / status config ─── */
const columnConfig = {
  pending: {
    title: 'PENDING',
    icon: Clock,
    color: '#f97316',
    bg: 'rgba(249,115,22,0.08)',
    border: 'rgba(249,115,22,0.30)',
    glow: 'rgba(249,115,22,0.20)',
    headerBg: 'rgba(249,115,22,0.10)',
    nextStatus: 'preparing',
    nextLabel: 'Start Cooking',
    nextIcon: Flame,
    btnStyle: 'linear-gradient(135deg, #f97316, #ea580c)',
    btnShadow: 'rgba(249,115,22,0.40)',
  },
  preparing: {
    title: 'PREPARING',
    icon: ChefHat,
    color: '#60a5fa',
    bg: 'rgba(96,165,250,0.08)',
    border: 'rgba(96,165,250,0.30)',
    glow: 'rgba(96,165,250,0.20)',
    headerBg: 'rgba(96,165,250,0.10)',
    nextStatus: 'ready',
    nextLabel: 'Mark Ready',
    nextIcon: CheckCircle2,
    btnStyle: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    btnShadow: 'rgba(96,165,250,0.40)',
  },
  ready: {
    title: 'READY',
    icon: CheckCircle2,
    color: '#34d399',
    bg: 'rgba(52,211,153,0.08)',
    border: 'rgba(52,211,153,0.30)',
    glow: 'rgba(52,211,153,0.20)',
    headerBg: 'rgba(52,211,153,0.10)',
    nextStatus: 'served',
    nextLabel: 'Mark Served',
    nextIcon: UtensilsCrossed,
    btnStyle: 'linear-gradient(135deg, #10b981, #059669)',
    btnShadow: 'rgba(52,211,153,0.40)',
  },
};

/* ─── Elapsed time with urgency color ─── */
const getElapsedTime = (createdAt) => {
  const diffMs = Date.now() - new Date(createdAt);
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return { label: `${mins}m`, urgent: mins > 20, warning: mins > 10 };
  const h = Math.floor(mins / 60);
  return { label: `${h}h ${mins % 60}m`, urgent: true, warning: true };
};

/* ─── Pulsing dot ─── */
const PulseDot = ({ color, size = 'w-2.5 h-2.5' }) => (
  <span className={`relative flex flex-shrink-0 ${size}`}>
    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-50`} style={{ background: color }} />
    <span className={`relative inline-flex rounded-full w-full h-full`} style={{ background: color }} />
  </span>
);

/* ─── Timer badge ─── */
const TimerBadge = ({ createdAt }) => {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(id);
  }, []);
  const { label, urgent, warning } = getElapsedTime(createdAt);
  const color = urgent ? '#ef4444' : warning ? '#fbbf24' : '#71717a';
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
      <Timer className="w-3 h-3" style={{ color }} />
      <span className="text-xs font-bold font-mono" style={{ color }}>{label}</span>
      {urgent && <AlertCircle className="w-3 h-3" style={{ color }} />}
    </div>
  );
};

/* ─── Order card ─── */
const OrderCard = ({ order, cfg, isNew, onStatusChange, index }) => {
  const NextIcon = cfg.nextIcon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.88, y: -10 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="relative rounded-2xl border overflow-hidden"
      style={{
        background: 'linear-gradient(145deg, #111116 0%, #0d0d11 100%)',
        borderColor: isNew ? cfg.color : `${cfg.color}40`,
        boxShadow: isNew ? `0 0 20px ${cfg.glow}` : 'none',
      }}
    >
      {/* New order flash ring */}
      {isNew && (
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          animate={{ opacity: [0, 0.4, 0] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          style={{ border: `2px solid ${cfg.color}`, borderRadius: 16 }}
        />
      )}

      {/* Top accent line */}
      <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, ${cfg.color}, transparent)` }} />

      {/* Card header */}
      <div className="p-4 pb-3 border-b" style={{ borderColor: `${cfg.color}15` }}>
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-lg font-black font-mono text-zinc-100">
              #{order.orderNumber}
            </span>
            {isNew && (
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 0.6, repeat: Infinity }}
              >
                <Bell className="w-4 h-4 text-orange-400" />
              </motion.div>
            )}
          </div>
          <TimerBadge createdAt={order.createdAt} />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {order.tableNumber ? (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border"
              style={{ background: `${cfg.color}12`, borderColor: `${cfg.color}35`, color: cfg.color }}
            >
              <UtensilsCrossed className="w-3 h-3" />
              Table {order.tableNumber}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-500/10 border border-blue-500/30 text-blue-400">
              <Zap className="w-3 h-3" /> Takeaway
            </span>
          )}
          <span className="text-xs text-zinc-600">
            {order.items?.length} item{order.items?.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Items list */}
      <div className="p-4 space-y-2">
        {order.items?.map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.04 + idx * 0.03 }}
            className="flex items-start justify-between gap-2 p-2.5 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}
          >
            <div className="flex items-start gap-2.5 min-w-0">
              <span
                className="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-xs font-black"
                style={{ background: `${cfg.color}20`, color: cfg.color }}
              >
                {item.quantity}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-zinc-200 leading-tight truncate">{item.name}</p>
                {item.notes && (
                  <p className="text-[11px] text-amber-400 mt-0.5 flex items-center gap-1">
                    <span>📝</span> {item.notes}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        ))}

        {/* Order notes */}
        {order.notes && (
          <div className="mt-2 p-2.5 rounded-xl bg-amber-500/8 border border-amber-500/20 flex items-start gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-400 leading-snug">{order.notes}</p>
          </div>
        )}
      </div>

      {/* Action button */}
      {cfg.nextStatus && (
        <div className="px-4 pb-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onStatusChange(order.id, cfg.nextStatus)}
            className="w-full h-10 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-white transition-all duration-150"
            style={{
              background: cfg.btnStyle,
              boxShadow: `0 4px 14px ${cfg.btnShadow}`,
            }}
          >
            <NextIcon className="w-4 h-4" />
            {cfg.nextLabel}
            <ArrowRight className="w-3.5 h-3.5 ml-auto opacity-70" />
          </motion.button>
        </div>
      )}
    </motion.div>
  );
};

/* ─── Kanban column ─── */
const KanbanColumn = ({ statusKey, orders, newOrderIds, onStatusChange }) => {
  const cfg = columnConfig[statusKey];
  const Icon = cfg.icon;

  return (
    <div className="flex-1 min-w-[300px] max-w-[380px] flex flex-col">
      {/* Column header */}
      <div
        className="flex items-center gap-3 mb-4 p-4 rounded-2xl border sticky top-0 z-10 backdrop-blur-xl"
        style={{
          background: `${cfg.headerBg}`,
          borderColor: cfg.border,
          boxShadow: `0 8px 32px ${cfg.glow}`,
        }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
        >
          <Icon className="w-5 h-5" style={{ color: cfg.color }} />
        </div>
        <div>
          <h2 className="text-sm font-black tracking-widest uppercase" style={{ color: cfg.color }}>
            {cfg.title}
          </h2>
          <p className="text-xs text-zinc-600">{orders.length} order{orders.length !== 1 ? 's' : ''}</p>
        </div>
        <div
          className="ml-auto w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black"
          style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
        >
          {orders.length}
        </div>
      </div>

      {/* Cards */}
      <div className="space-y-3 flex-1">
        <AnimatePresence mode="popLayout">
          {orders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 gap-3"
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
              >
                <Icon className="w-7 h-7 opacity-40" style={{ color: cfg.color }} />
              </div>
              <p className="text-sm text-zinc-600 font-medium">No {cfg.title.toLowerCase()} orders</p>
            </motion.div>
          ) : (
            orders.map((order, index) => (
              <OrderCard
                key={order.id}
                order={order}
                cfg={cfg}
                isNew={newOrderIds.has(order.id)}
                onStatusChange={onStatusChange}
                index={index}
              />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════ */
const KitchenDisplay = () => {
  const { api } = useAuth();
  const { socket } = useSocket();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newOrderIds, setNewOrderIds] = useState(new Set());
  const [showNotificationToast, setShowNotificationToast] = useState(false);
  const [isSoundMuted, setIsSoundMuted] = useState(soundNotificationManager.getMuteState());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const newOrderTimerRef = useRef(null);

  const fetchOrders = useCallback(async (showSpin = false) => {
    if (showSpin) setIsRefreshing(true);
    try {
      const response = await api.get('/orders/kitchen');
      setOrders(response.data.data || []);
    } catch (error) {
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
      if (showSpin) setTimeout(() => setIsRefreshing(false), 600);
    }
  }, [api]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => fetchOrders(), 30000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  useEffect(() => {
    if (!socket) return;
    socket.on('new_order', (data) => {
      fetchOrders();
      setNewOrderIds((prev) => new Set([...prev, data.id]));
      setShowNotificationToast(true);
      if (newOrderTimerRef.current) clearTimeout(newOrderTimerRef.current);
      newOrderTimerRef.current = setTimeout(() => {
        setNewOrderIds((prev) => { const s = new Set(prev); s.delete(data.id); return s; });
      }, 3000);
    });
    socket.on('order_update', () => fetchOrders());
    return () => {
      socket.off('new_order');
      socket.off('order_update');
      if (newOrderTimerRef.current) clearTimeout(newOrderTimerRef.current);
    };
  }, [socket, fetchOrders]);

  const updateStatus = async (orderId, status) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status });
      toast.success(`Order marked as ${status}`);
      fetchOrders();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const toggleSound = () => {
    const muted = soundNotificationManager.toggleMute();
    setIsSoundMuted(muted);
    toast.success(muted ? 'Sound muted' : 'Sound enabled');
  };

  const pendingOrders   = orders.filter(o => o.status === 'pending');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const readyOrders     = orders.filter(o => o.status === 'ready');

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between">
          <Skeleton className="h-10 w-60 rounded-xl bg-zinc-900" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24 rounded-xl bg-zinc-900" />
            <Skeleton className="h-10 w-24 rounded-xl bg-zinc-900" />
          </div>
        </div>
        <div className="flex gap-5">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex-1 min-w-[300px] space-y-3">
              <Skeleton className="h-16 rounded-2xl bg-zinc-900" />
              {[1, 2].map(j => <Skeleton key={j} className="h-52 rounded-2xl bg-zinc-900" />)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5" data-testid="kitchen-display-page">
      {/* Notification toast */}
      <NotificationToast
        message="🔔 New Order Received!"
        show={showNotificationToast}
        duration={3000}
      />

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-orange-400" />
            </span>
            Kitchen Display
          </h1>
          <div className="flex items-center gap-3 mt-1 ml-[52px]">
            <div className="flex items-center gap-1.5">
              <PulseDot color="#22c55e" size="w-2 h-2" />
              <span className="text-xs text-zinc-500">Live</span>
            </div>
            <span className="text-zinc-700">·</span>
            <span className="text-sm text-zinc-500">
              <span className="text-orange-400 font-bold">{orders.length}</span> active orders
            </span>
            <span className="text-zinc-700">·</span>
            <span className="text-xs text-zinc-600">auto-refresh 30s</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Sound toggle */}
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={toggleSound}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-150"
            style={isSoundMuted
              ? { background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.35)', color: '#f87171' }
              : { background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(63,63,70,0.8)', color: '#a1a1aa' }
            }
          >
            {isSoundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            {isSoundMuted ? 'Unmute' : 'Mute'}
          </motion.button>

          {/* Refresh button */}
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => fetchOrders(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-zinc-700/80 text-zinc-400 hover:border-orange-500/50 hover:text-orange-400 hover:bg-orange-500/5 transition-all duration-150"
            style={{ background: 'rgba(255,255,255,0.02)' }}
          >
            <motion.div animate={{ rotate: isRefreshing ? 360 : 0 }} transition={{ duration: 0.6 }}>
              <RefreshCw className="w-4 h-4" />
            </motion.div>
            Refresh
          </motion.button>
        </div>
      </motion.div>

      {/* ── Summary bar ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-3"
      >
        {[
          { key: 'pending',   count: pendingOrders.length },
          { key: 'preparing', count: preparingOrders.length },
          { key: 'ready',     count: readyOrders.length },
        ].map(({ key, count }) => {
          const cfg = columnConfig[key];
          const Icon = cfg.icon;
          return (
            <div
              key={key}
              className="flex items-center gap-3 px-4 py-3 rounded-xl border"
              style={{ background: cfg.bg, borderColor: cfg.border }}
            >
              <Icon className="w-4 h-4 flex-shrink-0" style={{ color: cfg.color }} />
              <div>
                <p className="text-2xl font-black" style={{ color: cfg.color }}>{count}</p>
                <p className="text-[11px] text-zinc-500 uppercase tracking-widest font-semibold">{cfg.title}</p>
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* ── Kanban board ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex gap-5 overflow-x-auto pb-4"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#27272a transparent' }}
      >
        {['pending', 'preparing', 'ready'].map((statusKey) => (
          <KanbanColumn
            key={statusKey}
            statusKey={statusKey}
            orders={
              statusKey === 'pending'   ? pendingOrders   :
              statusKey === 'preparing' ? preparingOrders :
              readyOrders
            }
            newOrderIds={newOrderIds}
            onStatusChange={updateStatus}
          />
        ))}
      </motion.div>
    </div>
  );
};

export default KitchenDisplay;