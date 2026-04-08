import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
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
  Plus,
  Search,
  Edit,
  Trash2,
  UtensilsCrossed,
  Leaf,
  Drumstick,
  Coffee,
  IceCream,
  Soup,
  Utensils,
  Clock,
  ChefHat,
  Flame,
  X,
  CheckCircle2,
  XCircle,
  Filter,
} from 'lucide-react';

/* ─── Category config ─── */
const categoryConfig = {
  'veg':         { icon: Leaf,     label: 'Vegetarian',   color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.25)',  pill: 'bg-green-500/10 text-green-400 border-green-500/25' },
  'non-veg':     { icon: Drumstick,label: 'Non-Veg',      color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)',  pill: 'bg-red-500/10 text-red-400 border-red-500/25' },
  'drinks':      { icon: Coffee,   label: 'Drinks',        color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.25)', pill: 'bg-blue-500/10 text-blue-400 border-blue-500/25' },
  'desserts':    { icon: IceCream, label: 'Desserts',      color: '#f472b6', bg: 'rgba(244,114,182,0.1)', border: 'rgba(244,114,182,0.25)',pill: 'bg-pink-500/10 text-pink-400 border-pink-500/25' },
  'starters':    { icon: Soup,     label: 'Starters',      color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.25)', pill: 'bg-amber-500/10 text-amber-400 border-amber-500/25' },
  'main-course': { icon: Utensils, label: 'Main Course',   color: '#f97316', bg: 'rgba(249,115,22,0.1)',  border: 'rgba(249,115,22,0.25)', pill: 'bg-orange-500/10 text-orange-400 border-orange-500/25' },
};

const categories = ['all', 'veg', 'non-veg', 'drinks', 'desserts', 'starters', 'main-course'];

/* ─── Glow dot ─── */
const GlowDot = ({ color }) => (
  <span
    className="inline-block w-2 h-2 rounded-full flex-shrink-0"
    style={{ background: color, boxShadow: `0 0 6px ${color}` }}
  />
);

/* ─── Category filter pill ─── */
const CatPill = ({ cat, active, onClick }) => {
  const cfg = categoryConfig[cat];
  const Icon = cfg?.icon;
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200 ${
        active
          ? 'text-white border-orange-500/60 shadow-[0_0_12px_rgba(249,115,22,0.3)]'
          : 'text-zinc-500 border-zinc-800 hover:border-zinc-600 hover:text-zinc-300'
      }`}
      style={active && cat !== 'all' ? { background: cfg?.bg, borderColor: cfg?.border, color: cfg?.color } : active ? { background: 'rgba(249,115,22,0.15)', borderColor: 'rgba(249,115,22,0.5)', color: '#f97316' } : { background: 'rgba(255,255,255,0.02)' }}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {cat === 'all' ? 'All Items' : cfg?.label}
    </motion.button>
  );
};

/* ─── Styled label for form ─── */
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

/* ─── Menu card ─── */
const MenuCard = ({ item, isManager, onEdit, onDelete, onToggle, index }) => {
  const cfg = categoryConfig[item.category] || categoryConfig['main-course'];
  const Icon = cfg.icon;
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      animate={{ opacity: item.isAvailable ? 1 : 0.55, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
      transition={{ delay: index * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="relative rounded-2xl border overflow-hidden group cursor-default"
      style={{
        background: 'linear-gradient(135deg, #111116 0%, #0c0c10 100%)',
        borderColor: hovered ? cfg.border : 'rgba(39,39,42,0.8)',
        transition: 'border-color 0.25s',
      }}
    >
      {/* Top glow on hover */}
      <motion.div
        className="absolute inset-0 pointer-events-none rounded-2xl"
        style={{ background: `radial-gradient(ellipse at 50% -10%, ${cfg.color}18 0%, transparent 65%)` }}
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />

      {/* Image or icon hero */}
      <div
        className="relative h-36 flex items-center justify-center overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${cfg.color}12, ${cfg.color}05)` }}
      >
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
          />
        ) : (
          <motion.div
            animate={{ rotate: hovered ? [0, -5, 5, 0] : 0 }}
            transition={{ duration: 0.4 }}
          >
            <Icon className="w-14 h-14 opacity-25" style={{ color: cfg.color }} />
          </motion.div>
        )}

        {/* Overlay badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border backdrop-blur-sm"
            style={{ background: `${cfg.bg}cc`, borderColor: cfg.border, color: cfg.color }}
          >
            <Icon className="w-3 h-3" />
            {cfg.label}
          </span>
          {!item.isAvailable && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold bg-red-500/20 border border-red-500/30 text-red-400 backdrop-blur-sm">
              <XCircle className="w-3 h-3" /> Off
            </span>
          )}
        </div>

        {/* Bottom price strip */}
        <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-[#0c0c10] to-transparent" />
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-base font-bold text-zinc-100 leading-tight">{item.name}</h3>
          <span className="text-xl font-black flex-shrink-0" style={{ color: cfg.color }}>
            ₹{item.price}
          </span>
        </div>

        {item.description && (
          <p className="text-xs text-zinc-500 line-clamp-2 mb-3 leading-relaxed">{item.description}</p>
        )}

        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-1 text-xs text-zinc-600">
            <Clock className="w-3 h-3" />
            <span>{item.preparationTime || 15} min</span>
          </div>
          {item.recipe?.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-zinc-600">
              <ChefHat className="w-3 h-3" />
              <span>{item.recipe.length} ingredients</span>
            </div>
          )}
          <div className="ml-auto flex items-center gap-1.5 text-xs">
            {item.isAvailable
              ? <><CheckCircle2 className="w-3 h-3 text-emerald-500" /><span className="text-emerald-500">Available</span></>
              : <><XCircle className="w-3 h-3 text-red-500" /><span className="text-red-500">Unavailable</span></>
            }
          </div>
        </div>

        {isManager && (
          <div className="flex gap-2 pt-3 border-t border-zinc-800/80">
            <button
              onClick={() => onToggle(item)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 ${
                item.isAvailable
                  ? 'border-zinc-700 text-zinc-400 hover:border-red-500/50 hover:text-red-400 hover:bg-red-500/5'
                  : 'border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10'
              }`}
            >
              {item.isAvailable ? 'Set Unavailable' : 'Set Available'}
            </button>
            <button
              onClick={() => onEdit(item)}
              className="w-8 h-8 rounded-lg border border-zinc-700 flex items-center justify-center text-zinc-400 hover:border-orange-500/60 hover:text-orange-400 hover:bg-orange-500/10 transition-all duration-150"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(item.id)}
              className="w-8 h-8 rounded-lg border border-zinc-700 flex items-center justify-center text-zinc-400 hover:border-red-500/60 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150"
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
const MenuManagement = () => {
  const { api, user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [inventoryOptions, setInventoryOptions] = useState([]);
  const [formData, setFormData] = useState({
    name: '', description: '', price: '', category: 'main-course',
    image: '', isAvailable: true, preparationTime: 15, recipe: [],
  });

  const isManager = ['admin', 'manager'].includes(user?.role);

  useEffect(() => {
    fetchMenuItems();
    fetchInventory();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const response = await api.get('/menu');
      setItems(response.data.data || []);
    } catch (error) {
      toast.error('Failed to fetch menu items');
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async () => {
    try {
      const res = await api.get('/inventory');
      setInventoryOptions(res.data.data || []);
    } catch (err) {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...formData, price: parseFloat(formData.price), preparationTime: parseInt(formData.preparationTime) };
      if (editingItem) {
        await api.put(`/menu/${editingItem.id}`, data);
        toast.success('Menu item updated!');
      } else {
        await api.post('/menu', data);
        toast.success('Menu item added!');
      }
      setDialogOpen(false);
      resetForm();
      fetchMenuItems();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this menu item?')) return;
    try {
      await api.delete(`/menu/${id}`);
      toast.success('Item deleted');
      fetchMenuItems();
    } catch (error) {
      toast.error('Failed to delete item');
    }
  };

  const toggleAvailability = async (item) => {
    try {
      await api.put(`/menu/${item.id}`, { isAvailable: !item.isAvailable });
      fetchMenuItems();
      toast.success(`${item.name} marked ${!item.isAvailable ? 'available' : 'unavailable'}`);
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  const openEditDialog = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name, description: item.description || '',
      price: item.price.toString(), category: item.category,
      image: item.image || '', isAvailable: item.isAvailable,
      preparationTime: item.preparationTime || 15, recipe: item.recipe || [],
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({ name: '', description: '', price: '', category: 'main-course', image: '', isAvailable: true, preparationTime: 15, recipe: [] });
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Count per category
  const counts = categories.reduce((acc, cat) => {
    acc[cat] = cat === 'all' ? items.length : items.filter(i => i.category === cat).length;
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between">
          <Skeleton className="h-10 w-48 rounded-xl bg-zinc-900" />
          <Skeleton className="h-10 w-32 rounded-xl bg-zinc-900" />
        </div>
        <div className="flex gap-2">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-8 w-24 rounded-xl bg-zinc-900" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-64 rounded-2xl bg-zinc-900" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="menu-management-page">

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5 text-orange-400" />
            </span>
            Menu Management
          </h1>
          <p className="text-zinc-500 text-sm mt-1 ml-13">
            <span className="text-orange-400 font-bold">{items.length}</span> items across{' '}
            <span className="text-orange-400 font-bold">{Object.values(categoryConfig).filter((_,i) => items.some(it => it.category === Object.keys(categoryConfig)[i])).length}</span> categories
          </p>
        </div>

        {isManager && (
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                data-testid="add-menu-item-btn"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white shadow-[0_4px_20px_rgba(249,115,22,0.4)] transition-all duration-200"
                style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}
              >
                <Plus className="w-4 h-4" />
                Add Menu Item
              </motion.button>
            </DialogTrigger>

            {/* ── Dialog ── */}
            <DialogContent className="border-zinc-800 max-w-lg max-h-[90vh] overflow-y-auto" style={{ background: 'linear-gradient(135deg, #111116, #0c0c10)' }}>
              <DialogHeader className="pb-4 border-b border-zinc-800">
                <DialogTitle className="text-lg font-black flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-500" />
                  {editingItem ? 'Edit Menu Item' : 'Add New Item'}
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                <div>
                  <FormLabel>Item Name *</FormLabel>
                  <StyledInput
                    data-testid="menu-item-name-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Butter Chicken"
                    required
                  />
                </div>

                <div>
                  <FormLabel>Description</FormLabel>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    placeholder="Brief description of the dish..."
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700/80 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 transition-all duration-200 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FormLabel>Price (₹) *</FormLabel>
                    <StyledInput
                      data-testid="menu-item-price-input"
                      type="number" step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div>
                    <FormLabel>Prep Time (min)</FormLabel>
                    <StyledInput
                      type="number"
                      value={formData.preparationTime}
                      onChange={(e) => setFormData({ ...formData, preparationTime: e.target.value })}
                      placeholder="15"
                    />
                  </div>
                </div>

                {/* Category visual selector */}
                <div>
                  <FormLabel>Category *</FormLabel>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(categoryConfig).map(([key, cfg]) => {
                      const Icon = cfg.icon;
                      const active = formData.category === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setFormData({ ...formData, category: key })}
                          className="flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-semibold transition-all duration-150"
                          style={active
                            ? { background: cfg.bg, borderColor: cfg.border, color: cfg.color, boxShadow: `0 0 12px ${cfg.color}30` }
                            : { background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(63,63,70,0.8)', color: '#71717a' }
                          }
                        >
                          <Icon className="w-4 h-4" />
                          {cfg.label.split(' ')[0]}
                        </button>
                      );
                    })}
                  </div>
                  <input type="hidden" data-testid="menu-item-category-select" value={formData.category} />
                </div>

                <div>
                  <FormLabel>Image URL</FormLabel>
                  <StyledInput
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder="https://..."
                  />
                </div>

                {/* Recipe ingredients */}
                {isManager && (
                  <div>
                    <FormLabel>Recipe Ingredients</FormLabel>
                    <div className="space-y-2">
                      {formData.recipe.map((ing, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <select
                            className="flex-1 h-9 px-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none focus:border-orange-500"
                            value={ing.inventoryItem || ''}
                            onChange={(e) => {
                              const r = [...formData.recipe]; r[idx].inventoryItem = e.target.value;
                              setFormData({ ...formData, recipe: r });
                            }}
                          >
                            <option value="">Select ingredient</option>
                            {inventoryOptions.map((inv) => (
                              <option key={inv.id} value={inv.id}>{inv.name}</option>
                            ))}
                          </select>
                          <input
                            type="number" step="0.01" placeholder="Qty"
                            className="w-20 h-9 px-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none focus:border-orange-500"
                            value={ing.quantity || ''}
                            onChange={(e) => {
                              const r = [...formData.recipe]; r[idx].quantity = parseFloat(e.target.value);
                              setFormData({ ...formData, recipe: r });
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, recipe: formData.recipe.filter((_, i) => i !== idx) })}
                            className="w-9 h-9 rounded-lg border border-red-500/30 flex items-center justify-center text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, recipe: [...formData.recipe, { inventoryItem: '', quantity: 0 }] })}
                        className="flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 font-semibold px-2 py-1.5 rounded-lg border border-dashed border-orange-500/30 hover:border-orange-500/60 transition-all w-full justify-center"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Ingredient
                      </button>
                    </div>
                  </div>
                )}

                {/* Availability toggle */}
                <div
                  onClick={() => setFormData({ ...formData, isAvailable: !formData.isAvailable })}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                    formData.isAvailable
                      ? 'border-emerald-500/30 bg-emerald-500/5'
                      : 'border-zinc-700 bg-zinc-900/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {formData.isAvailable
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      : <XCircle className="w-4 h-4 text-zinc-500" />
                    }
                    <span className={`text-sm font-semibold ${formData.isAvailable ? 'text-emerald-400' : 'text-zinc-500'}`}>
                      {formData.isAvailable ? 'Available on menu' : 'Hidden from menu'}
                    </span>
                  </div>
                  <div className={`w-10 h-5 rounded-full relative transition-colors duration-200 ${formData.isAvailable ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${formData.isAvailable ? 'left-5' : 'left-0.5'}`} />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full h-11 rounded-xl font-bold text-white text-sm shadow-[0_4px_16px_rgba(249,115,22,0.35)] transition-all duration-200 hover:shadow-[0_4px_24px_rgba(249,115,22,0.5)] active:scale-98"
                  style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' }}
                >
                  {editingItem ? '✓ Update Item' : '+ Add to Menu'}
                </button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </motion.div>

      {/* ── Search + Filters ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-3"
      >
        {/* Search bar */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            data-testid="menu-search-input"
            type="text"
            placeholder="Search menu items…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-zinc-900/80 border border-zinc-800 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-orange-500/60 transition-all duration-200"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category pills */}
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <div key={cat} className="relative">
              <CatPill
                cat={cat}
                active={selectedCategory === cat}
                onClick={() => setSelectedCategory(cat)}
              />
              {counts[cat] > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-zinc-800 border border-zinc-700 text-[10px] text-zinc-400 flex items-center justify-center font-bold">
                  {counts[cat]}
                </span>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Results count ── */}
      {(searchTerm || selectedCategory !== 'all') && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-zinc-600"
        >
          Showing <span className="text-zinc-300 font-semibold">{filteredItems.length}</span> of {items.length} items
        </motion.p>
      )}

      {/* ── Grid ── */}
      <AnimatePresence mode="popLayout">
        {filteredItems.length > 0 ? (
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {filteredItems.map((item, index) => (
              <MenuCard
                key={item.id}
                item={item}
                index={index}
                isManager={isManager}
                onEdit={openEditDialog}
                onDelete={handleDelete}
                onToggle={toggleAvailability}
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
              <UtensilsCrossed className="w-10 h-10 text-zinc-700" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-zinc-300 mb-1">No items found</h3>
              <p className="text-zinc-600 text-sm">
                {searchTerm || selectedCategory !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Add your first menu item to get started'}
              </p>
            </div>
            {isManager && !searchTerm && selectedCategory === 'all' && (
              <button
                onClick={() => setDialogOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-orange-400 border border-orange-500/30 hover:bg-orange-500/10 transition-all"
              >
                <Plus className="w-4 h-4" /> Add First Item
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MenuManagement;