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
  UtensilsCrossed,
  Leaf,
  Drumstick,
  Coffee,
  IceCream,
  Soup,
  Utensils,
} from 'lucide-react';

const categoryIcons = {
  'veg': Leaf,
  'non-veg': Drumstick,
  'drinks': Coffee,
  'desserts': IceCream,
  'starters': Soup,
  'main-course': Utensils,
};

const categoryColors = {
  'veg': 'text-green-500 bg-green-500/10 border-green-500/20',
  'non-veg': 'text-red-500 bg-red-500/10 border-red-500/20',
  'drinks': 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  'desserts': 'text-pink-500 bg-pink-500/10 border-pink-500/20',
  'starters': 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
  'main-course': 'text-orange-500 bg-orange-500/10 border-orange-500/20',
};

const MenuManagement = () => {
  const { api, user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'main-course',
    image: '',
    isAvailable: true,
    preparationTime: 15,
  });

  const categories = ['all', 'veg', 'non-veg', 'drinks', 'desserts', 'starters', 'main-course'];
  const isManager = ['admin', 'manager'].includes(user?.role);

  useEffect(() => {
    fetchMenuItems();
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        price: parseFloat(formData.price),
        preparationTime: parseInt(formData.preparationTime),
      };

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
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    try {
      await api.delete(`/menu/${id}`);
      toast.success('Menu item deleted!');
      fetchMenuItems();
    } catch (error) {
      toast.error('Failed to delete item');
    }
  };

  const toggleAvailability = async (item) => {
    try {
      await api.put(`/menu/${item.id}`, { isAvailable: !item.isAvailable });
      fetchMenuItems();
      toast.success(`${item.name} is now ${!item.isAvailable ? 'available' : 'unavailable'}`);
    } catch (error) {
      toast.error('Failed to update availability');
    }
  };

  const openEditDialog = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      price: item.price.toString(),
      category: item.category,
      image: item.image || '',
      isAvailable: item.isAvailable,
      preparationTime: item.preparationTime || 15,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      category: 'main-course',
      image: '',
      isAvailable: true,
      preparationTime: 15,
    });
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64 bg-zinc-900" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48 bg-zinc-900" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="menu-management-page">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Menu Management</h1>
          <p className="text-zinc-500">{items.length} items in menu</p>
        </div>

        {isManager && (
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button data-testid="add-menu-item-btn" className="bg-orange-500 hover:bg-orange-600 text-black">
                <Plus className="h-4 w-4 mr-2" /> Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
              <DialogHeader>
                <DialogTitle>{editingItem ? 'Edit Menu Item' : 'Add Menu Item'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    data-testid="menu-item-name-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-zinc-950 border-zinc-800"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="bg-zinc-950 border-zinc-800"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Price (₹)</Label>
                    <Input
                      data-testid="menu-item-price-input"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="bg-zinc-950 border-zinc-800"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Prep Time (min)</Label>
                    <Input
                      type="number"
                      value={formData.preparationTime}
                      onChange={(e) => setFormData({ ...formData, preparationTime: e.target.value })}
                      className="bg-zinc-950 border-zinc-800"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <select
                    data-testid="menu-item-category-select"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full h-10 px-3 rounded-md bg-zinc-950 border border-zinc-800 text-white"
                  >
                    <option value="veg">Vegetarian</option>
                    <option value="non-veg">Non-Vegetarian</option>
                    <option value="drinks">Drinks</option>
                    <option value="desserts">Desserts</option>
                    <option value="starters">Starters</option>
                    <option value="main-course">Main Course</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Image URL (optional)</Label>
                  <Input
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="bg-zinc-950 border-zinc-800"
                    placeholder="https://..."
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isAvailable"
                    checked={formData.isAvailable}
                    onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                    className="rounded border-zinc-700"
                  />
                  <Label htmlFor="isAvailable">Available</Label>
                </div>
                <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-black">
                  {editingItem ? 'Update Item' : 'Add Item'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            data-testid="menu-search-input"
            placeholder="Search menu items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-zinc-900 border-zinc-800"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className={selectedCategory === cat ? 'bg-orange-500 text-black' : 'border-zinc-800'}
            >
              {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' ')}
            </Button>
          ))}
        </div>
      </div>

      {/* Menu Grid */}
      <AnimatePresence mode="popLayout">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item, index) => {
            const IconComponent = categoryIcons[item.category] || UtensilsCrossed;
            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-all ${!item.isAvailable && 'opacity-60'}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${categoryColors[item.category]}`}>
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={categoryColors[item.category]}>
                          {item.category.replace('-', ' ')}
                        </Badge>
                        {!item.isAvailable && (
                          <Badge variant="outline" className="border-red-500/30 text-red-500">
                            Unavailable
                          </Badge>
                        )}
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold mb-1">{item.name}</h3>
                    {item.description && (
                      <p className="text-sm text-zinc-500 mb-3 line-clamp-2">{item.description}</p>
                    )}

                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl font-bold text-orange-500">₹{item.price}</span>
                      <span className="text-sm text-zinc-500">{item.preparationTime} min</span>
                    </div>

                    {isManager && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 border-zinc-700"
                          onClick={() => toggleAvailability(item)}
                        >
                          {item.isAvailable ? 'Mark Unavailable' : 'Mark Available'}
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="border-zinc-700"
                          onClick={() => openEditDialog(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
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
            );
          })}
        </div>
      </AnimatePresence>

      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <UtensilsCrossed className="h-16 w-16 text-zinc-700 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No menu items found</h3>
          <p className="text-zinc-500">
            {searchTerm || selectedCategory !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Add your first menu item to get started'}
          </p>
        </div>
      )}
    </div>
  );
};

export default MenuManagement;
