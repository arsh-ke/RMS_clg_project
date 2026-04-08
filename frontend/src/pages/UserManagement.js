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
  Plus, Search, Edit, Trash2, Users, Shield,
  Mail, Phone, Crown, BarChart2, ChefHat,
  UtensilsCrossed, X, CheckCircle2, XCircle,
  UserPlus, Lock,
} from 'lucide-react';

/* ─── Role config ─── */
const roleConfig = {
  admin:   { color: '#ef4444', bg: 'rgba(239,68,68,0.10)',   border: 'rgba(239,68,68,0.28)',   icon: Crown,          label: 'Admin'   },
  manager: { color: '#60a5fa', bg: 'rgba(96,165,250,0.10)',  border: 'rgba(96,165,250,0.28)',  icon: BarChart2,      label: 'Manager' },
  staff:   { color: '#34d399', bg: 'rgba(52,211,153,0.10)',  border: 'rgba(52,211,153,0.28)',  icon: UtensilsCrossed,label: 'Staff'   },
  kitchen: { color: '#f97316', bg: 'rgba(249,115,22,0.10)',  border: 'rgba(249,115,22,0.28)',  icon: ChefHat,        label: 'Kitchen' },
};

const roleOrder = ['all', 'admin', 'manager', 'staff', 'kitchen'];

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

/* ─── Avatar with initials ─── */
const Avatar = ({ name, color, size = 'w-12 h-12' }) => {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div
      className={`${size} rounded-2xl flex items-center justify-center font-black text-sm flex-shrink-0 relative`}
      style={{ background: `${color}20`, border: `1.5px solid ${color}40`, color }}
    >
      {initials}
      <div className="absolute inset-0 rounded-2xl" style={{ background: `radial-gradient(circle at 30% 30%, ${color}30, transparent 70%)` }} />
    </div>
  );
};

/* ─── Role selector buttons ─── */
const RoleSelector = ({ value, onChange }) => (
  <div className="grid grid-cols-2 gap-2">
    {Object.entries(roleConfig).map(([key, cfg]) => {
      const Icon = cfg.icon;
      const active = value === key;
      return (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-150"
          style={active
            ? { background: cfg.bg, borderColor: cfg.border, color: cfg.color, boxShadow: `0 0 12px ${cfg.color}25` }
            : { background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(63,63,70,0.8)', color: '#71717a' }
          }
        >
          <Icon className="w-4 h-4 flex-shrink-0" />
          {cfg.label}
        </button>
      );
    })}
  </div>
);

/* ─── User card ─── */
const UserCard = ({ user, index, onEdit, onDelete, onToggle }) => {
  const cfg = roleConfig[user.role] || roleConfig.staff;
  const RoleIcon = cfg.icon;
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      animate={{ opacity: user.isActive ? 1 : 0.5, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.88 }}
      transition={{ delay: index * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="relative rounded-2xl border overflow-hidden"
      style={{
        background: 'linear-gradient(145deg,#111116,#0c0c10)',
        borderColor: hovered ? cfg.border : 'rgba(39,39,42,0.8)',
        boxShadow: hovered ? `0 0 24px ${cfg.bg}` : 'none',
        transition: 'border-color 0.25s, box-shadow 0.25s',
      }}
    >
      {/* Top accent */}
      <div className="h-0.5" style={{ background: `linear-gradient(90deg,${cfg.color},transparent)` }} />

      {/* Hover glow */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 50% 0%,${cfg.color}0e,transparent 65%)` }}
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />

      <div className="p-5 relative z-10">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar name={user.name} color={cfg.color} />
            <div className="min-w-0">
              <h3 className="font-bold text-zinc-100 leading-tight truncate">{user.name}</h3>
              <div className="flex items-center gap-1.5 mt-1">
                <div
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold border"
                  style={{ background: cfg.bg, borderColor: cfg.border, color: cfg.color }}
                >
                  <RoleIcon className="w-2.5 h-2.5" />
                  {cfg.label}
                </div>
              </div>
            </div>
          </div>

          {/* Active status */}
          <div className="flex-shrink-0">
            {user.isActive
              ? <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold"><span className="relative flex w-1.5 h-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" /><span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-emerald-500" /></span>Active</div>
              : <span className="text-[10px] text-red-400 font-bold">Inactive</span>
            }
          </div>
        </div>

        {/* Contact info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2.5 text-xs text-zinc-500">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <Mail className="w-3 h-3" />
            </div>
            <span className="truncate">{user.email}</span>
          </div>
          {user.phone && (
            <div className="flex items-center gap-2.5 text-xs text-zinc-500">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <Phone className="w-3 h-3" />
              </div>
              <span>{user.phone}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-1.5 pt-4 border-t border-zinc-800/80">
          <button
            onClick={() => onToggle(user)}
            className={`flex-1 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-150 ${
              user.isActive
                ? 'border-zinc-700 text-zinc-400 hover:border-red-500/40 hover:text-red-400 hover:bg-red-500/5'
                : 'border-emerald-500/35 text-emerald-400 hover:bg-emerald-500/8'
            }`}
          >
            {user.isActive ? 'Deactivate' : 'Activate'}
          </button>
          <button
            onClick={() => onEdit(user)}
            className="w-8 h-8 rounded-xl border border-zinc-700 flex items-center justify-center text-zinc-400 hover:border-orange-500/50 hover:text-orange-400 hover:bg-orange-500/8 transition-all duration-150"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(user.id)}
            className="w-8 h-8 rounded-xl border border-zinc-700 flex items-center justify-center text-zinc-400 hover:border-red-500/50 hover:text-red-400 hover:bg-red-500/8 transition-all duration-150"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════ */
const UserManagement = () => {
  const { api } = useAuth();
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'staff', phone: '',
  });

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data.data || []);
    } catch { toast.error('Failed to fetch users'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const { password, ...updateData } = formData;
        await api.put(`/users/${editingUser.id}`, updateData);
        toast.success('User updated!');
      } else {
        await api.post('/users', formData);
        toast.success('User created!');
      }
      setDialogOpen(false); resetForm(); fetchUsers();
    } catch (err) { toast.error(err.response?.data?.detail || 'Operation failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try { await api.delete(`/users/${id}`); toast.success('User deleted!'); fetchUsers(); }
    catch { toast.error('Failed to delete user'); }
  };

  const toggleUserStatus = async (user) => {
    try {
      await api.put(`/users/${user.id}`, { isActive: !user.isActive });
      fetchUsers();
      toast.success(`User ${!user.isActive ? 'activated' : 'deactivated'}`);
    } catch { toast.error('Failed to update status'); }
  };

  const openEditDialog = (user) => {
    setEditingUser(user);
    setFormData({ name: user.name, email: user.email, password: '', role: user.role, phone: user.phone || '' });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', password: '', role: 'staff', phone: '' });
  };

  const filteredUsers = users.filter(u => {
    const s = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const r = roleFilter === 'all' || u.role === roleFilter;
    return s && r;
  });

  // Counts per role
  const roleCounts = roleOrder.reduce((a, r) => {
    a[r] = r === 'all' ? users.length : users.filter(u => u.role === r).length;
    return a;
  }, {});

  const activeCount   = users.filter(u => u.isActive).length;
  const inactiveCount = users.length - activeCount;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between">
          <Skeleton className="h-10 w-52 rounded-xl bg-zinc-900" />
          <Skeleton className="h-10 w-28 rounded-xl bg-zinc-900" />
        </div>
        <div className="flex gap-3">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-16 w-32 rounded-2xl bg-zinc-900" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-44 rounded-2xl bg-zinc-900" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5" data-testid="user-management-page">

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center">
              <Users className="w-5 h-5 text-orange-400" />
            </span>
            User Management
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            <span className="text-orange-400 font-bold">{users.length}</span> staff members ·{' '}
            <span className="text-emerald-400 font-semibold">{activeCount} active</span>
            {inactiveCount > 0 && <> · <span className="text-red-400 font-semibold">{inactiveCount} inactive</span></>}
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={open => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              data-testid="add-user-btn"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white shadow-[0_4px_20px_rgba(249,115,22,0.4)]"
              style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}
            >
              <UserPlus className="w-4 h-4" /> Add User
            </motion.button>
          </DialogTrigger>

          {/* ── Dialog ── */}
          <DialogContent
            className="border-zinc-800 max-w-md"
            style={{ background: 'linear-gradient(135deg,#111116,#0c0c10)' }}
          >
            <DialogHeader className="pb-4 border-b border-zinc-800">
              <DialogTitle className="text-lg font-black flex items-center gap-2">
                <Shield className="w-5 h-5 text-orange-500" />
                {editingUser ? 'Edit User' : 'Add New User'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div>
                <FormLabel>Full Name *</FormLabel>
                <StyledInput
                  data-testid="user-name-input"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <FormLabel>Email Address *</FormLabel>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                  <StyledInput
                    data-testid="user-email-input"
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@nexa-eats.com"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {!editingUser && (
                <div>
                  <FormLabel>Password *</FormLabel>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                    <StyledInput
                      data-testid="user-password-input"
                      type="password"
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Min. 6 characters"
                      className="pl-10"
                      required={!editingUser}
                      minLength={6}
                    />
                  </div>
                </div>
              )}

              <div>
                <FormLabel>Phone (Optional)</FormLabel>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                  <StyledInput
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 XXXXX XXXXX"
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Role visual selector */}
              <div>
                <FormLabel>Role *</FormLabel>
                <RoleSelector
                  value={formData.role}
                  onChange={role => setFormData({ ...formData, role })}
                />
                <input type="hidden" data-testid="user-role-select" value={formData.role} />
              </div>

              <button
                type="submit"
                className="w-full h-11 rounded-xl font-bold text-white text-sm"
                style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)', boxShadow: '0 4px 16px rgba(249,115,22,0.35)' }}
              >
                {editingUser ? '✓ Update User' : '+ Create User'}
              </button>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* ── Role summary bar ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        {Object.entries(roleConfig).map(([key, cfg], i) => {
          const Icon = cfg.icon;
          const count = roleCounts[key] || 0;
          return (
            <motion.button
              key={key}
              whileTap={{ scale: 0.96 }}
              onClick={() => setRoleFilter(key)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="flex items-center gap-3 p-3.5 rounded-2xl border transition-all duration-200 text-left"
              style={roleFilter === key
                ? { background: cfg.bg, borderColor: cfg.border, boxShadow: `0 0 16px ${cfg.bg}` }
                : { background: 'linear-gradient(145deg,#111116,#0c0c10)', borderColor: 'rgba(39,39,42,0.8)' }
              }
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${cfg.color}15` }}>
                <Icon className="w-4.5 h-4.5" style={{ color: cfg.color, width: 18, height: 18 }} />
              </div>
              <div>
                <p className="text-lg font-black leading-none" style={{ color: roleFilter === key ? cfg.color : '#e4e4e7' }}>{count}</p>
                <p className="text-[11px] text-zinc-500 uppercase tracking-wider mt-0.5">{cfg.label}</p>
              </div>
            </motion.button>
          );
        })}
      </motion.div>

      {/* ── Search + Filter ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        {/* Search */}
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            data-testid="user-search-input"
            placeholder="Search users…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-10 pr-9 rounded-xl bg-zinc-900/80 border border-zinc-800 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-orange-500/60 transition-all"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Role filter pills */}
        <div className="flex gap-2 flex-wrap">
          {roleOrder.map(role => {
            const cfg = roleConfig[role];
            const active = roleFilter === role;
            return (
              <motion.button
                key={role}
                whileTap={{ scale: 0.95 }}
                onClick={() => setRoleFilter(role)}
                className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200"
                style={active
                  ? role === 'all'
                    ? { background: 'rgba(249,115,22,0.15)', borderColor: 'rgba(249,115,22,0.5)', color: '#f97316' }
                    : { background: cfg.bg, borderColor: cfg.border, color: cfg.color }
                  : { background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(63,63,70,0.7)', color: '#71717a' }
                }
              >
                {role === 'all' ? 'All' : cfg.label}
                <span
                  className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black"
                  style={active
                    ? { background: role === 'all' ? '#f97316' : cfg.color, color: '#000' }
                    : { background: 'rgba(255,255,255,0.08)', color: '#71717a' }
                  }
                >
                  {roleCounts[role] || 0}
                </span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Results count */}
      {(searchTerm || roleFilter !== 'all') && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-zinc-600">
          Showing <span className="text-zinc-300 font-semibold">{filteredUsers.length}</span> of {users.length} users
        </motion.p>
      )}

      {/* ── User Grid ── */}
      <AnimatePresence mode="popLayout">
        {filteredUsers.length > 0 ? (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((user, i) => (
              <UserCard
                key={user.id}
                user={user}
                index={i}
                onEdit={openEditDialog}
                onDelete={handleDelete}
                onToggle={toggleUserStatus}
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
              <Users className="w-10 h-10 text-zinc-700" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-zinc-300 mb-1">No users found</h3>
              <p className="text-zinc-600 text-sm">
                {searchTerm || roleFilter !== 'all' ? 'Try adjusting your search or filter' : 'Add your first team member'}
              </p>
            </div>
            {!searchTerm && roleFilter === 'all' && (
              <button
                onClick={() => setDialogOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-orange-400 border border-orange-500/30 hover:bg-orange-500/10 transition-all"
              >
                <Plus className="w-4 h-4" /> Add First User
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserManagement;