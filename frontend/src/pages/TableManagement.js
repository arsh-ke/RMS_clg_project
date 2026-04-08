import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/ui/badge';
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
  Plus, Edit, Trash2, Users, MapPin,
  Home, Sun, Wind, Crown, CheckCircle2,
  Coffee, Flame,
} from 'lucide-react';

/* ─── Status config ─── */
const statusConfig = {
  free:     { label: 'Free',     color: '#22c55e', bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.35)',  glow: 'rgba(34,197,94,0.25)',  dot: '#22c55e' },
  occupied: { label: 'Occupied', color: '#f97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.35)', glow: 'rgba(249,115,22,0.25)', dot: '#f97316' },
  reserved: { label: 'Reserved', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.35)', glow: 'rgba(96,165,250,0.25)', dot: '#60a5fa' },
};

/* ─── Location config ─── */
const locationConfig = {
  indoor:  { icon: Home,   label: 'Indoor',      color: '#f97316', bg: 'rgba(249,115,22,0.1)'  },
  outdoor: { icon: Sun,    label: 'Outdoor',     color: '#fbbf24', bg: 'rgba(251,191,36,0.1)'  },
  balcony: { icon: Wind,   label: 'Balcony',     color: '#34d399', bg: 'rgba(52,211,153,0.1)'  },
  vip:     { icon: Crown,  label: 'VIP Section', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
};

/* ─── Pulsing dot ─── */
const PulseDot = ({ color }) => (
  <span className="relative flex w-2.5 h-2.5 flex-shrink-0">
    <span
      className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
      style={{ background: color }}
    />
    <span className="relative inline-flex rounded-full w-2.5 h-2.5" style={{ background: color }} />
  </span>
);

/* ─── Stat pill ─── */
const StatPill = ({ status, count }) => {
  const cfg = statusConfig[status];
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold"
      style={{ background: cfg.bg, borderColor: cfg.border, color: cfg.color }}
    >
      <PulseDot color={cfg.dot} />
      {count} {cfg.label}
    </div>
  );
};

/* ─── Form label ─── */
const FormLabel = ({ children }) => (
  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1.5 block">
    {children}
  </label>
);

/* ─── Styled input ─── */
const StyledInput = ({ className = '', ...props }) => (
  <input
    className={`w-full h-10 px-3 rounded-xl bg-zinc-900 border border-zinc-700/80 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 transition-all duration-200 ${className}`}
    {...props}
  />
);

/* ─── Table Card ─── */
const TableCard = ({ table, index, isManager, onEdit, onDelete, onStatusChange }) => {
  const cfg = statusConfig[table.status] || statusConfig.free;
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.85, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ delay: index * 0.035, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="relative rounded-2xl border overflow-hidden cursor-default select-none"
      style={{
        background: 'linear-gradient(145deg, #111116 0%, #0c0c10 100%)',
        borderColor: hovered ? cfg.border : 'rgba(39,39,42,0.7)',
        transition: 'border-color 0.25s',
        boxShadow: hovered ? `0 0 24px ${cfg.glow}` : 'none',
      }}
    >
      {/* Status glow background */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(circle at 50% 0%, ${cfg.color}15 0%, transparent 70%)` }}
        animate={{ opacity: hovered ? 1 : 0.3 }}
        transition={{ duration: 0.3 }}
      />

      {/* Top strip — status color */}
      <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${cfg.color}80, ${cfg.color}20)` }} />

      <div className="p-4 relative z-10">
        {/* Status badge + dot */}
        <div className="flex items-center justify-between mb-4">
          <PulseDot color={cfg.dot} />
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider"
            style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
          >
            {cfg.label}
          </span>
        </div>

        {/* Table number */}
        <div className="text-center mb-3">
          <motion.span
            className="text-4xl font-black leading-none"
            style={{ color: hovered ? cfg.color : '#e4e4e7' }}
            transition={{ duration: 0.2 }}
          >
            {table.tableNumber}
          </motion.span>
          <div className="flex items-center justify-center gap-1 mt-2 text-zinc-500">
            <Users className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">{table.capacity} seats</span>
          </div>
        </div>

        {/* Status action button */}
        <AnimatePresence>
          {hovered && table.status !== 'occupied' && (
            <motion.button
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.15 }}
              onClick={() => onStatusChange(table.id, table.status === 'free' ? 'reserved' : 'free')}
              className="w-full py-1.5 rounded-xl text-xs font-semibold border transition-all duration-150 mb-2"
              style={{
                background: table.status === 'free' ? 'rgba(96,165,250,0.1)' : 'rgba(34,197,94,0.1)',
                borderColor: table.status === 'free' ? 'rgba(96,165,250,0.35)' : 'rgba(34,197,94,0.35)',
                color: table.status === 'free' ? '#60a5fa' : '#22c55e',
              }}
            >
              {table.status === 'free' ? '📋 Reserve' : '✓ Free Up'}
            </motion.button>
          )}
        </AnimatePresence>

        {/* Manager actions */}
        {isManager && (
          <AnimatePresence>
            {hovered && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.15 }}
                className="flex gap-1.5"
              >
                <button
                  onClick={() => onEdit(table)}
                  className="flex-1 flex items-center justify-center h-7 rounded-lg border border-zinc-700 text-zinc-400 hover:border-orange-500/50 hover:text-orange-400 hover:bg-orange-500/8 transition-all duration-150"
                >
                  <Edit className="w-3 h-3" />
                </button>
                <button
                  onClick={() => onDelete(table.id)}
                  className="flex-1 flex items-center justify-center h-7 rounded-lg border border-zinc-700 text-zinc-400 hover:border-red-500/50 hover:text-red-400 hover:bg-red-500/8 transition-all duration-150"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════ */
const TableManagement = () => {
  const { api, user } = useAuth();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [formData, setFormData] = useState({ tableNumber: '', capacity: '', location: 'indoor' });

  const isManager = ['admin', 'manager'].includes(user?.role);

  useEffect(() => { fetchTables(); }, []);

  const fetchTables = async () => {
    try {
      const response = await api.get('/tables');
      setTables(response.data.data || []);
    } catch (error) {
      toast.error('Failed to fetch tables');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...formData, tableNumber: parseInt(formData.tableNumber), capacity: parseInt(formData.capacity) };
      if (editingTable) {
        await api.put(`/tables/${editingTable.id}`, data);
        toast.success('Table updated!');
      } else {
        await api.post('/tables', data);
        toast.success('Table added!');
      }
      setDialogOpen(false);
      resetForm();
      fetchTables();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this table?')) return;
    try {
      await api.delete(`/tables/${id}`);
      toast.success('Table deleted');
      fetchTables();
    } catch (error) {
      toast.error('Failed to delete table');
    }
  };

  const updateStatus = async (tableId, status) => {
    try {
      await api.put(`/tables/${tableId}/status`, { status });
      fetchTables();
      toast.success(`Table ${status}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };
 
  const openEditDialog = (table) => {
    setEditingTable(table);
    setFormData({ tableNumber: table.tableNumber.toString(), capacity: table.capacity.toString(), location: table.location });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingTable(null);
    setFormData({ tableNumber: '', capacity: '', location: 'indoor' });
  };

  const groupedTables = tables.reduce((acc, table) => {
    const loc = table.location || 'indoor';
    if (!acc[loc]) acc[loc] = [];
    acc[loc].push(table);
    return acc;
  }, {});

  const statusCounts = {
    free:     tables.filter(t => t.status === 'free').length,
    occupied: tables.filter(t => t.status === 'occupied').length,
    reserved: tables.filter(t => t.status === 'reserved').length,
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between">
          <Skeleton className="h-10 w-52 rounded-xl bg-zinc-900" />
          <Skeleton className="h-10 w-32 rounded-xl bg-zinc-900" />
        </div>
        <div className="flex gap-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-32 rounded-xl bg-zinc-900" />)}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({length: 12}).map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl bg-zinc-900" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="table-management-page">

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center">
              <Coffee className="w-5 h-5 text-orange-400" />
            </span>
            Table Management
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            <span className="text-orange-400 font-bold">{tables.length}</span> tables across{' '}
            <span className="text-orange-400 font-bold">{Object.keys(groupedTables).length}</span> zones
          </p>
        </div>

        {isManager && (
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                data-testid="add-table-btn"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white shadow-[0_4px_20px_rgba(249,115,22,0.4)] transition-all"
                style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}
              >
                <Plus className="w-4 h-4" /> Add Table
              </motion.button>
            </DialogTrigger>

            {/* ── Dialog ── */}
            <DialogContent
              className="border-zinc-800 max-w-sm"
              style={{ background: 'linear-gradient(135deg, #111116, #0c0c10)' }}
            >
              <DialogHeader className="pb-4 border-b border-zinc-800">
                <DialogTitle className="text-lg font-black flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-500" />
                  {editingTable ? 'Edit Table' : 'Add New Table'}
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FormLabel>Table Number *</FormLabel>
                    <StyledInput
                      data-testid="table-number-input"
                      type="number"
                      value={formData.tableNumber}
                      onChange={(e) => setFormData({ ...formData, tableNumber: e.target.value })}
                      placeholder="e.g. 1"
                      required
                    />
                  </div>
                  <div>
                    <FormLabel>Capacity *</FormLabel>
                    <StyledInput
                      data-testid="table-capacity-input"
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                      placeholder="e.g. 4"
                      required
                    />
                  </div>
                </div>

                {/* Location visual selector */}
                <div>
                  <FormLabel>Zone / Location *</FormLabel>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(locationConfig).map(([key, cfg]) => {
                      const Icon = cfg.icon;
                      const active = formData.location === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setFormData({ ...formData, location: key })}
                          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-150"
                          style={active
                            ? { background: cfg.bg, borderColor: cfg.color, color: cfg.color, boxShadow: `0 0 12px ${cfg.color}25` }
                            : { background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(63,63,70,0.8)', color: '#71717a' }
                          }
                        >
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full h-11 rounded-xl font-bold text-white text-sm shadow-[0_4px_16px_rgba(249,115,22,0.35)] transition-all duration-200 hover:shadow-[0_4px_24px_rgba(249,115,22,0.5)] active:scale-98"
                  style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' }}
                >
                  {editingTable ? '✓ Update Table' : '+ Add Table'}
                </button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </motion.div>

      {/* ── Status overview bar ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap gap-3 p-4 rounded-2xl border border-zinc-800/80"
        style={{ background: 'linear-gradient(135deg, #111116, #0c0c10)' }}
      >
        <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-semibold uppercase tracking-widest mr-2">
          <CheckCircle2 className="w-3.5 h-3.5" /> Live Status
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(statusCounts).map(([status, count]) => (
            <StatPill key={status} status={status} count={count} />
          ))}
        </div>
        <div className="ml-auto text-xs text-zinc-600 self-center">
          {Math.round((statusCounts.free / (tables.length || 1)) * 100)}% availability
        </div>
      </motion.div>

      {/* ── Tables by Location ── */}
      {Object.entries(groupedTables).map(([location, locationTables], sectionIdx) => {
        const locCfg = locationConfig[location] || locationConfig.indoor;
        const LocIcon = locCfg.icon;
        const sectionFree = locationTables.filter(t => t.status === 'free').length;

        return (
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + sectionIdx * 0.08 }}
            className="space-y-4"
          >
            {/* Section header */}
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: locCfg.bg }}
              >
                <LocIcon className="w-4 h-4" style={{ color: locCfg.color }} />
              </div>
              <h2 className="text-base font-black text-zinc-100 capitalize">{locCfg.label}</h2>
              <div
                className="px-2.5 py-0.5 rounded-lg text-xs font-bold border"
                style={{ background: locCfg.bg, borderColor: `${locCfg.color}40`, color: locCfg.color }}
              >
                {locationTables.length} tables
              </div>
              <div className="text-xs text-zinc-600">
                {sectionFree} free
              </div>
              {/* Divider */}
              <div className="flex-1 h-px bg-zinc-800" />
            </div>

            {/* Cards grid */}
            <AnimatePresence mode="popLayout">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                {locationTables
                  .sort((a, b) => a.tableNumber - b.tableNumber)
                  .map((table, index) => (
                    <TableCard
                      key={table.id}
                      table={table}
                      index={index}
                      isManager={isManager}
                      onEdit={openEditDialog}
                      onDelete={handleDelete}
                      onStatusChange={updateStatus}
                    />
                  ))}
              </div>
            </AnimatePresence>
          </motion.div>
        );
      })}

      {/* ── Empty state ── */}
      {tables.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 gap-4"
        >
          <div className="w-20 h-20 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <Users className="w-10 h-10 text-zinc-700" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-bold text-zinc-300 mb-1">No tables configured</h3>
            <p className="text-zinc-600 text-sm">Add your first table to start managing the floor</p>
          </div>
          {isManager && (
            <button
              onClick={() => setDialogOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-orange-400 border border-orange-500/30 hover:bg-orange-500/10 transition-all"
            >
              <Plus className="w-4 h-4" /> Add First Table
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default TableManagement;