import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
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
  Package,
  AlertTriangle,
  TrendingDown,
  RefreshCw,
} from 'lucide-react';

const categoryColors = {
  vegetables: 'text-green-500 bg-green-500/10 border-green-500/20',
  meat: 'text-red-500 bg-red-500/10 border-red-500/20',
  dairy: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  spices: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
  beverages: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
  grains: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
  oils: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  other: 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20',
};

const Inventory = () => {
  const { api, user } = useAuth();
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showLowStock, setShowLowStock] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [restockDialogOpen, setRestockDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [restockItem, setRestockItem] = useState(null);
  const [restockQuantity, setRestockQuantity] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    category: 'other',
    quantity: '',
    unit: 'kg',
    minThreshold: '10',
    costPerUnit: '',
    supplier: '',
  });

  const isManager = ['admin', 'manager'].includes(user?.role);
  const categories = ['all', 'vegetables', 'meat', 'dairy', 'spices', 'beverages', 'grains', 'oils', 'other'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [itemsRes, statsRes] = await Promise.all([
        api.get('/inventory'),
        api.get('/inventory/stats'),
      ]);
      setItems(itemsRes.data.data || []);
      setStats(statsRes.data.data);
    } catch (error) {
      toast.error('Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        quantity: parseFloat(formData.quantity),
        minThreshold: parseFloat(formData.minThreshold),
        costPerUnit: parseFloat(formData.costPerUnit) || 0,
      };

      if (editingItem) {
        await api.put(`/inventory/${editingItem.id}`, data);
        toast.success('Item updated!');
      } else {
        await api.post('/inventory', data);
        toast.success('Item added!');
      }

      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleRestock = async () => {
    if (!restockItem || !restockQuantity) return;

    try {
      await api.put(`/inventory/${restockItem.id}/restock`, {
        quantity: parseFloat(restockQuantity),
      });
      toast.success(`Restocked ${restockItem.name}!`);
      setRestockDialogOpen(false);
      setRestockItem(null);
      setRestockQuantity('');
      fetchData();
    } catch (error) {
      toast.error('Restock failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    try {
      await api.delete(`/inventory/${id}`);
      toast.success('Item deleted!');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete item');
    }
  };

  const openEditDialog = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      quantity: item.quantity.toString(),
      unit: item.unit,
      minThreshold: item.minThreshold.toString(),
      costPerUnit: item.costPerUnit?.toString() || '',
      supplier: item.supplier || '',
    });
    setDialogOpen(true);
  };

  const openRestockDialog = (item) => {
    setRestockItem(item);
    setRestockQuantity('');
    setRestockDialogOpen(true);
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      category: 'other',
      quantity: '',
      unit: 'kg',
      minThreshold: '10',
      costPerUnit: '',
      supplier: '',
    });
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesLowStock = !showLowStock || item.isLowStock;
    return matchesSearch && matchesCategory && matchesLowStock;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64 bg-zinc-900" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 bg-zinc-900" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-32 bg-zinc-900" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="inventory-page">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
          <p className="text-zinc-500">{items.length} items tracked</p>
        </div>

        {isManager && (
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button data-testid="add-inventory-btn" className="bg-orange-500 hover:bg-orange-600 text-black">
                <Plus className="h-4 w-4 mr-2" /> Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-800">
              <DialogHeader>
                <DialogTitle>{editingItem ? 'Edit Item' : 'Add Inventory Item'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    data-testid="inventory-name-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-zinc-950 border-zinc-800"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full h-10 px-3 rounded-md bg-zinc-950 border border-zinc-800 text-white"
                    >
                      {categories.slice(1).map((cat) => (
                        <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Unit</Label>
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full h-10 px-3 rounded-md bg-zinc-950 border border-zinc-800 text-white"
                    >
                      <option value="kg">Kilograms (kg)</option>
                      <option value="g">Grams (g)</option>
                      <option value="l">Liters (l)</option>
                      <option value="ml">Milliliters (ml)</option>
                      <option value="pieces">Pieces</option>
                      <option value="packets">Packets</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input
                      data-testid="inventory-quantity-input"
                      type="number"
                      step="0.01"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      className="bg-zinc-950 border-zinc-800"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Min Threshold</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.minThreshold}
                      onChange={(e) => setFormData({ ...formData, minThreshold: e.target.value })}
                      className="bg-zinc-950 border-zinc-800"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cost Per Unit (₹)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.costPerUnit}
                      onChange={(e) => setFormData({ ...formData, costPerUnit: e.target.value })}
                      className="bg-zinc-950 border-zinc-800"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Supplier</Label>
                    <Input
                      value={formData.supplier}
                      onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                      className="bg-zinc-950 border-zinc-800"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-black">
                  {editingItem ? 'Update Item' : 'Add Item'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats?.totalItems || 0}</p>
                <p className="text-xs text-zinc-500">Total Items</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{stats?.lowStockCount || 0}</p>
                <p className="text-xs text-zinc-500">Low Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800 col-span-2">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingDown className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">₹{stats?.totalValue?.toFixed(2) || '0.00'}</p>
                <p className="text-xs text-zinc-500">Total Inventory Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            data-testid="inventory-search-input"
            placeholder="Search inventory..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-zinc-900 border-zinc-800"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={showLowStock ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowLowStock(!showLowStock)}
            className={showLowStock ? 'bg-yellow-500 text-black' : 'border-zinc-800'}
          >
            <AlertTriangle className="h-4 w-4 mr-1" /> Low Stock
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={categoryFilter === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCategoryFilter(cat)}
              className={categoryFilter === cat ? 'bg-orange-500 text-black' : 'border-zinc-800'}
            >
              {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Inventory Grid */}
      <AnimatePresence mode="popLayout">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item, index) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.03 }}
            >
              <Card className={`bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-all ${item.isLowStock && 'border-yellow-500/30'}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{item.name}</h3>
                      <Badge className={categoryColors[item.category] || categoryColors.other}>
                        {item.category}
                      </Badge>
                    </div>
                    {item.isLowStock && (
                      <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                        <AlertTriangle className="h-3 w-3 mr-1" /> Low
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-end justify-between mb-4">
                    <div>
                      <p className="text-3xl font-bold">
                        {item.quantity}
                        <span className="text-lg text-zinc-500 ml-1">{item.unit}</span>
                      </p>
                      <p className="text-xs text-zinc-500">Min: {item.minThreshold} {item.unit}</p>
                    </div>
                    {item.costPerUnit > 0 && (
                      <p className="text-sm text-zinc-400">₹{item.costPerUnit}/{item.unit}</p>
                    )}
                  </div>

                  {isManager && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-green-500/30 text-green-500 hover:bg-green-500/10"
                        onClick={() => openRestockDialog(item)}
                      >
                        <RefreshCw className="h-4 w-4 mr-1" /> Restock
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="border-zinc-700"
                        onClick={() => openEditDialog(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="border-red-500/30 text-red-500 hover:bg-red-500/10"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </AnimatePresence>

      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-zinc-700 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No inventory items found</h3>
          <p className="text-zinc-500">Add items or adjust filters</p>
        </div>
      )}

      {/* Restock Dialog */}
      <Dialog open={restockDialogOpen} onOpenChange={setRestockDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle>Restock {restockItem?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-zinc-400">
              Current stock: {restockItem?.quantity} {restockItem?.unit}
            </p>
            <div className="space-y-2">
              <Label>Quantity to Add</Label>
              <Input
                type="number"
                step="0.01"
                value={restockQuantity}
                onChange={(e) => setRestockQuantity(e.target.value)}
                className="bg-zinc-950 border-zinc-800"
                placeholder={`Enter quantity in ${restockItem?.unit}`}
              />
            </div>
            <Button
              className="w-full bg-green-500 hover:bg-green-600"
              onClick={handleRestock}
              disabled={!restockQuantity}
            >
              <RefreshCw className="h-4 w-4 mr-2" /> Confirm Restock
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Inventory;
