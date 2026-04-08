import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Skeleton } from '../components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { toast } from 'sonner';
import {
  Plus, Search, Edit, Trash2, Package,
  AlertTriangle, TrendingDown, RefreshCw,
  Leaf, Beef, Milk, Flame, Droplets,
  Wheat, FlaskConical, MoreHorizontal, X,
  ShieldAlert, DollarSign, CheckCircle2,
} from 'lucide-react';

/* ─── Category config ─── */
const categoryConfig = {
  vegetables: { icon: Leaf,         color: '#22c55e', bg: 'rgba(34,197,94,0.10)',   border: 'rgba(34,197,94,0.25)'   },
  meat:       { icon: Beef,         color: '#ef4444', bg: 'rgba(239,68,68,0.10)',   border: 'rgba(239,68,68,0.25)'   },
  dairy:      { icon: Milk,         color: '#60a5fa', bg: 'rgba(96,165,250,0.10)',  border: 'rgba(96,165,250,0.25)'  },
  spices:     { icon: Flame,        color: '#f97316', bg: 'rgba(249,115,22,0.10)',  border: 'rgba(249,115,22,0.25)'  },
  beverages:  { icon: Droplets,     color: '#22d3ee', bg: 'rgba(34,211,238,0.10)',  border: 'rgba(34,211,238,0.25)'  },
  grains:     { icon: Wheat,        color: '#fbbf24', bg: 'rgba(251,191,36,0.10)',  border: 'rgba(251,191,36,0.25)'  },
  oils:       { icon: FlaskConical, color: '#a78bfa', bg: 'rgba(167,139,250,0.10)', border: 'rgba(167,139,250,0.25)' },
  other:      { icon: Package,      color: '#71717a', bg: 'rgba(113,113,122,0.10)', border: 'rgba(113,113,122,0.25)' },
};

const categories = ['all', 'vegetables', 'meat', 'dairy', 'spices', 'beverages', 'grains', 'oils', 'other'];
const units = ['kg', 'g', 'l', 'ml', 'pieces', 'packets'];

/* ─── Helpers ─── */
const FormLabel = ({ children }) => (
  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1.5 block">{children}</label>
);
const StyledInput = ({ className = '', ...props }) => (
  <input
    className={`w-full h-10 px-3 rounded-xl bg-zinc-900 border border-zinc-700/80 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 transition-all duration-200 ${className}`}
    {...props}
  />
);
const StyledSelect = ({ children, ...props }) => (
  <select
    className="w-full h-10 px-3 rounded-xl bg-zinc-900 border border-zinc-700/80 text-white text-sm focus:outline-none focus:border-orange-500 transition-all duration-200"
    {...props}
  >{children}</select>
);

/* ─── Animated counter ─── */
const AnimCount = ({ value, prefix = '', decimals = 0 }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = Number(value) || 0;
    if (end === 0) return;
    const step = end / 40;
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setDisplay(end); clearInterval(timer); }
      else setDisplay(start);
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return <>{prefix}{display.toFixed(decimals)}</>;
};

/* ─── Stock level bar ─── */
const StockBar = ({ quantity, minThreshold, color }) => {
  const pct = Math.min((quantity / (minThreshold * 3)) * 100, 100);
  const isLow = quantity <= minThreshold;
  return (
    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden mt-2">
      <motion.div
        className="h-full rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        style={{
          background: isLow
            ? 'linear-gradient(90deg,#ef4444,#f97316)'
            : `linear-gradient(90deg,${color}99,${color})`,
        }}
      />
    </div>
  );
};

/* ─── Stat card ─── */
const StatCard = ({ icon: Icon, value, label, color, prefix = '', decimals = 0, delay = 0, span = '' }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    className={`rounded-2xl border p-5 relative overflow-hidden ${span}`}
    style={{ background: 'linear-gradient(145deg,#111116,#0c0c10)', borderColor: 'rgba(39,39,42,0.8)' }}
  >
    <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(circle at 0% 0%,${color}12,transparent 60%)` }} />
    <div className="flex items-center gap-4 relative z-10">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-black text-white">
          <AnimCount value={value} prefix={prefix} decimals={decimals} />
        </p>
        <p className="text-xs text-zinc-500 uppercase tracking-widest mt-0.5">{label}</p>
      </div>
    </div>
    <motion.div
      className="absolute bottom-0 left-0 h-0.5 w-full"
      style={{ background: `linear-gradient(90deg,${color},transparent)` }}
      initial={{ scaleX: 0, originX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ delay: delay + 0.3, duration: 0.8 }}
    />
  </motion.div>
);

/* ─── Inventory card ─── */
const InventoryCard = ({ item, index, isManager, onEdit, onDelete, onRestock }) => {
  const cfg = categoryConfig[item.category] || categoryConfig.other;
  const Icon = cfg.icon;
  const [hovered, setHovered] = useState(false);
  const isLow = item.isLowStock;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.035, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="relative rounded-2xl border overflow-hidden"
      style={{
        background: 'linear-gradient(145deg,#111116,#0c0c10)',
        borderColor: isLow ? 'rgba(245,158,11,0.4)' : hovered ? cfg.border : 'rgba(39,39,42,0.8)',
        boxShadow: isLow ? '0 0 16px rgba(245,158,11,0.12)' : hovered ? `0 0 20px ${cfg.bg}` : 'none',
        transition: 'border-color 0.25s,box-shadow 0.25s',
      }}
    >
      {/* Top accent */}
      <div className="h-0.5" style={{ background: isLow ? 'linear-gradient(90deg,#f59e0b,transparent)' : `linear-gradient(90deg,${cfg.color},transparent)` }} />

      {/* Hover glow */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 50% 0%,${cfg.color}10,transparent 65%)` }}
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />

      <div className="p-4 relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-3 gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
              <Icon className="w-5 h-5" style={{ color: cfg.color }} />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-zinc-100 leading-tight truncate">{item.name}</h3>
              <span className="text-[11px] font-semibold capitalize" style={{ color: cfg.color }}>
                {item.category}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {isLow && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-500/15 border border-amber-500/35 text-amber-400">
                <AlertTriangle className="w-2.5 h-2.5" /> Low
              </span>
            )}
          </div>
        </div>

        {/* Quantity */}
        <div className="flex items-end justify-between mb-1">
          <div>
            <span className="text-3xl font-black text-zinc-100">{item.quantity}</span>
            <span className="text-base text-zinc-500 ml-1.5">{item.unit}</span>
          </div>
          {item.costPerUnit > 0 && (
            <span className="text-xs text-zinc-500 font-medium">₹{item.costPerUnit}/{item.unit}</span>
          )}
        </div>

        {/* Stock bar */}
        <StockBar quantity={item.quantity} minThreshold={item.minThreshold} color={cfg.color} />

        <div className="flex justify-between items-center mt-1.5 mb-4">
          <span className="text-[11px] text-zinc-600">Min: {item.minThreshold} {item.unit}</span>
          <span className="text-[11px]" style={{ color: isLow ? '#f59e0b' : '#71717a' }}>
            {isLow ? `⚠ ${(item.quantity / item.minThreshold * 100).toFixed(0)}% of min` : `${(item.quantity / (item.minThreshold * 3) * 100).toFixed(0)}% full`}
          </span>
        </div>

        {/* Supplier */}
        {item.supplier && (
          <p className="text-[11px] text-zinc-600 mb-3 truncate">📦 {item.supplier}</p>
        )}

        {/* Actions */}
        {isManager && (
          <div className="flex gap-1.5 pt-3 border-t border-zinc-800/80">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onRestock(item)}
              className="flex-1 h-8 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold border transition-all duration-150"
              style={{ background: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)', color: '#22c55e' }}
            >
              <RefreshCw className="w-3 h-3" /> Restock
            </motion.button>
            <button
              onClick={() => onEdit(item)}
              className="w-8 h-8 rounded-xl border border-zinc-700 flex items-center justify-center text-zinc-400 hover:border-orange-500/50 hover:text-orange-400 hover:bg-orange-500/8 transition-all duration-150"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(item.id)}
              className="w-8 h-8 rounded-xl border border-zinc-700 flex items-center justify-center text-zinc-400 hover:border-red-500/50 hover:text-red-400 hover:bg-red-500/8 transition-all duration-150"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════ */
const Inventory = () => {
  const { api, user } = useAuth();
  const [items, setItems]               = useState([]);
  const [stats, setStats]               = useState(null);
  const [loading, setLoading]           = useState(true);
  const [searchTerm, setSearchTerm]     = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showLowStock, setShowLowStock] = useState(false);
  const [dialogOpen, setDialogOpen]     = useState(false);
  const [restockDialogOpen, setRestockDialogOpen] = useState(false);
  const [editingItem, setEditingItem]   = useState(null);
  const [restockItem, setRestockItem]   = useState(null);
  const [restockQty, setRestockQty]     = useState('');

  const [formData, setFormData] = useState({
    name: '', category: 'other', quantity: '', unit: 'kg',
    minThreshold: '10', costPerUnit: '', supplier: '',
  });

  const isManager = ['admin', 'manager'].includes(user?.role);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [itemsRes, statsRes] = await Promise.all([
        api.get('/inventory'),
        api.get('/inventory/stats'),
      ]);
      setItems(itemsRes.data.data || []);
      setStats(statsRes.data.data);
    } catch { toast.error('Failed to fetch inventory'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...formData, quantity: parseFloat(formData.quantity), minThreshold: parseFloat(formData.minThreshold), costPerUnit: parseFloat(formData.costPerUnit) || 0 };
      if (editingItem) { await api.put(`/inventory/${editingItem.id}`, data); toast.success('Item updated!'); }
      else              { await api.post('/inventory', data); toast.success('Item added!'); }
      setDialogOpen(false); resetForm(); fetchData();
    } catch (err) { toast.error(err.response?.data?.detail || 'Operation failed'); }
  };

  const handleRestock = async () => {
    if (!restockItem || !restockQty) return;
    try {
      await api.put(`/inventory/${restockItem.id}/restock`, { quantity: parseFloat(restockQty) });
      toast.success(`Restocked ${restockItem.name}!`);
      setRestockDialogOpen(false); setRestockItem(null); setRestockQty(''); fetchData();
    } catch { toast.error('Restock failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this inventory item?')) return;
    try { await api.delete(`/inventory/${id}`); toast.success('Item deleted!'); fetchData(); }
    catch { toast.error('Failed to delete'); }
  };

  const openEditDialog = (item) => {
    setEditingItem(item);
    setFormData({ name: item.name, category: item.category, quantity: item.quantity.toString(), unit: item.unit, minThreshold: item.minThreshold.toString(), costPerUnit: item.costPerUnit?.toString() || '', supplier: item.supplier || '' });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({ name: '', category: 'other', quantity: '', unit: 'kg', minThreshold: '10', costPerUnit: '', supplier: '' });
  };

  const filteredItems = items.filter(i => {
    const s = i.name.toLowerCase().includes(searchTerm.toLowerCase());
    const c = categoryFilter === 'all' || i.category === categoryFilter;
    const l = !showLowStock || i.isLowStock;
    return s && c && l;
  });

  const catCounts = categories.reduce((a, c) => {
    a[c] = c === 'all' ? items.length : items.filter(i => i.category === c).length;
    return a;
  }, {});

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between">
          <Skeleton className="h-10 w-56 rounded-xl bg-zinc-900" />
          <Skeleton className="h-10 w-32 rounded-xl bg-zinc-900" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-20 rounded-2xl bg-zinc-900" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-44 rounded-2xl bg-zinc-900" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5" data-testid="inventory-page">

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center">
              <Package className="w-5 h-5 text-orange-400" />
            </span>
            Inventory
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            <span className="text-orange-400 font-bold">{items.length}</span> items tracked ·{' '}
            {stats?.lowStockCount > 0 && <span className="text-amber-400 font-bold">{stats.lowStockCount} low stock</span>}
            {!stats?.lowStockCount && <span className="text-emerald-400 font-semibold">All levels healthy</span>}
          </p>
        </div>

        {isManager && (
          <Dialog open={dialogOpen} onOpenChange={open => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                data-testid="add-inventory-btn"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white shadow-[0_4px_20px_rgba(249,115,22,0.4)]"
                style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}
              >
                <Plus className="w-4 h-4" /> Add Item
              </motion.button>
            </DialogTrigger>

            {/* ── Add/Edit Dialog ── */}
            <DialogContent
              className="border-zinc-800 max-w-md"
              style={{ background: 'linear-gradient(135deg,#111116,#0c0c10)' }}
            >
              <DialogHeader className="pb-4 border-b border-zinc-800">
                <DialogTitle className="text-lg font-black flex items-center gap-2">
                  <Package className="w-5 h-5 text-orange-500" />
                  {editingItem ? 'Edit Item' : 'Add Inventory Item'}
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                <div>
                  <FormLabel>Item Name *</FormLabel>
                  <StyledInput
                    data-testid="inventory-name-input"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Basmati Rice"
                    required
                  />
                </div>

                {/* Category visual grid */}
                <div>
                  <FormLabel>Category *</FormLabel>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.entries(categoryConfig).map(([key, cfg]) => {
                      const Icon = cfg.icon;
                      const active = formData.category === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setFormData({ ...formData, category: key })}
                          className="flex flex-col items-center gap-1 py-2.5 rounded-xl border text-[10px] font-bold capitalize transition-all duration-150"
                          style={active
                            ? { background: cfg.bg, borderColor: cfg.border, color: cfg.color, boxShadow: `0 0 10px ${cfg.bg}` }
                            : { background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(63,63,70,0.7)', color: '#71717a' }
                          }
                        >
                          <Icon className="w-4 h-4" />
                          {key}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FormLabel>Quantity *</FormLabel>
                    <StyledInput
                      data-testid="inventory-quantity-input"
                      type="number" step="0.01"
                      value={formData.quantity}
                      onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                      placeholder="0"
                      required
                    />
                  </div>
                  <div>
                    <FormLabel>Unit</FormLabel>
                    <StyledSelect value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })}>
                      {units.map(u => <option key={u} value={u}>{u}</option>)}
                    </StyledSelect>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FormLabel>Min Threshold</FormLabel>
                    <StyledInput
                      type="number" step="0.01"
                      value={formData.minThreshold}
                      onChange={e => setFormData({ ...formData, minThreshold: e.target.value })}
                      placeholder="10"
                    />
                  </div>
                  <div>
                    <FormLabel>Cost / Unit (₹)</FormLabel>
                    <StyledInput
                      type="number" step="0.01"
                      value={formData.costPerUnit}
                      onChange={e => setFormData({ ...formData, costPerUnit: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <FormLabel>Supplier</FormLabel>
                  <StyledInput
                    value={formData.supplier}
                    onChange={e => setFormData({ ...formData, supplier: e.target.value })}
                    placeholder="Supplier name (optional)"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-11 rounded-xl font-bold text-white text-sm"
                  style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)', boxShadow: '0 4px 16px rgba(249,115,22,0.35)' }}
                >
                  {editingItem ? '✓ Update Item' : '+ Add Item'}
                </button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </motion.div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Package}      value={stats?.totalItems || 0}         label="Total Items"       color="#60a5fa" delay={0.05} />
        <StatCard icon={AlertTriangle} value={stats?.lowStockCount || 0}      label="Low Stock"         color="#f59e0b" delay={0.10} />
        <StatCard icon={CheckCircle2}  value={stats?.healthyCount || (items.length - (stats?.lowStockCount || 0))} label="Healthy"  color="#34d399" delay={0.15} />
        <StatCard icon={DollarSign}    value={stats?.totalValue || 0}         label="Total Value"       color="#f97316" prefix="₹" decimals={0} delay={0.20} />
      </div>

      {/* ── Filters ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="space-y-3"
      >
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              data-testid="inventory-search-input"
              placeholder="Search inventory…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-zinc-900/80 border border-zinc-800 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-orange-500/60 transition-all"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Low Stock toggle */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowLowStock(!showLowStock)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all duration-150"
            style={showLowStock
              ? { background: 'rgba(245,158,11,0.15)', borderColor: 'rgba(245,158,11,0.5)', color: '#f59e0b' }
              : { background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(63,63,70,0.7)', color: '#71717a' }
            }
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Low Stock Only
            {stats?.lowStockCount > 0 && (
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black" style={{ background: showLowStock ? '#f59e0b' : 'rgba(255,255,255,0.1)', color: showLowStock ? '#000' : '#71717a' }}>
                {stats.lowStockCount}
              </span>
            )}
          </motion.button>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 flex-wrap">
          {categories.map(cat => {
            const cfg = categoryConfig[cat];
            const Icon = cfg?.icon;
            const active = categoryFilter === cat;
            return (
              <div key={cat} className="relative">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCategoryFilter(cat)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200"
                  style={active
                    ? cat === 'all'
                      ? { background: 'rgba(249,115,22,0.15)', borderColor: 'rgba(249,115,22,0.5)', color: '#f97316' }
                      : { background: cfg.bg, borderColor: cfg.border, color: cfg.color }
                    : { background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(63,63,70,0.7)', color: '#71717a' }
                  }
                >
                  {Icon && <Icon className="w-3 h-3" />}
                  {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                </motion.button>
                {catCounts[cat] > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-zinc-800 border border-zinc-700 text-[10px] text-zinc-400 flex items-center justify-center font-bold">
                    {catCounts[cat]}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Results count */}
      {(searchTerm || categoryFilter !== 'all' || showLowStock) && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-zinc-600">
          Showing <span className="text-zinc-300 font-semibold">{filteredItems.length}</span> of {items.length} items
        </motion.p>
      )}

      {/* ── Inventory Grid ── */}
      <AnimatePresence mode="popLayout">
        {filteredItems.length > 0 ? (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item, i) => (
              <InventoryCard
                key={item.id}
                item={item}
                index={i}
                isManager={isManager}
                onEdit={openEditDialog}
                onDelete={handleDelete}
                onRestock={item => { setRestockItem(item); setRestockQty(''); setRestockDialogOpen(true); }}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 gap-4"
          >
            <div className="w-20 h-20 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <Package className="w-10 h-10 text-zinc-700" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-zinc-300 mb-1">No items found</h3>
              <p className="text-zinc-600 text-sm">
                {searchTerm || categoryFilter !== 'all' || showLowStock
                  ? 'Try adjusting your filters'
                  : 'Add your first inventory item to get started'}
              </p>
            </div>
            {isManager && !searchTerm && categoryFilter === 'all' && !showLowStock && (
              <button onClick={() => setDialogOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-orange-400 border border-orange-500/30 hover:bg-orange-500/10 transition-all">
                <Plus className="w-4 h-4" /> Add First Item
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Restock Dialog ── */}
      <Dialog open={restockDialogOpen} onOpenChange={setRestockDialogOpen}>
        <DialogContent
          className="border-zinc-800 max-w-sm"
          style={{ background: 'linear-gradient(135deg,#111116,#0c0c10)' }}
        >
          <DialogHeader className="pb-4 border-b border-zinc-800">
            <DialogTitle className="text-lg font-black flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-emerald-500" />
              Restock Item
            </DialogTitle>
            <p className="text-sm text-zinc-400 font-semibold mt-1">{restockItem?.name}</p>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Current stock display */}
            <div
              className="flex items-center justify-between p-4 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(63,63,70,0.5)' }}
            >
              <span className="text-sm text-zinc-500">Current Stock</span>
              <span className="text-xl font-black text-zinc-200">
                {restockItem?.quantity} <span className="text-zinc-500 text-sm font-normal">{restockItem?.unit}</span>
              </span>
            </div>

            <div>
              <FormLabel>Quantity to Add ({restockItem?.unit})</FormLabel>
              <StyledInput
                type="number"
                step="0.01"
                value={restockQty}
                onChange={e => setRestockQty(e.target.value)}
                placeholder={`Enter ${restockItem?.unit}…`}
                autoFocus
              />
            </div>

            {/* Preview total */}
            {restockQty && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)' }}
              >
                <span className="text-xs text-emerald-500 font-semibold">New Total</span>
                <span className="text-lg font-black text-emerald-400">
                  {((restockItem?.quantity || 0) + parseFloat(restockQty || 0)).toFixed(2)} {restockItem?.unit}
                </span>
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleRestock}
              disabled={!restockQty}
              className="w-full h-11 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: restockQty ? '0 4px 16px rgba(16,185,129,0.35)' : 'none' }}
            >
              <RefreshCw className="w-4 h-4" /> Confirm Restock
            </motion.button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Inventory;