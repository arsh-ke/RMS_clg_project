import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent } from '../components/ui/card';
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
import { Plus, Edit, Trash2, Users, MapPin } from 'lucide-react';

const statusColors = {
  free: 'bg-green-500',
  occupied: 'bg-orange-500',
  reserved: 'bg-blue-500',
};

const statusBadgeColors = {
  free: 'text-green-500 bg-green-500/10 border-green-500/20',
  occupied: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
  reserved: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
};

const TableManagement = () => {
  const { api, user } = useAuth();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [formData, setFormData] = useState({
    tableNumber: '',
    capacity: '',
    location: 'indoor',
  });

  const isManager = ['admin', 'manager'].includes(user?.role);

  useEffect(() => {
    fetchTables();
  }, []);

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
      const data = {
        ...formData,
        tableNumber: parseInt(formData.tableNumber),
        capacity: parseInt(formData.capacity),
      };

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
    if (!window.confirm('Are you sure you want to delete this table?')) return;

    try {
      await api.delete(`/tables/${id}`);
      toast.success('Table deleted!');
      fetchTables();
    } catch (error) {
      toast.error('Failed to delete table');
    }
  };

  const updateStatus = async (tableId, status) => {
    try {
      await api.put(`/tables/${tableId}/status`, { status });
      fetchTables();
      toast.success(`Table status updated to ${status}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const openEditDialog = (table) => {
    setEditingTable(table);
    setFormData({
      tableNumber: table.tableNumber.toString(),
      capacity: table.capacity.toString(),
      location: table.location,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingTable(null);
    setFormData({
      tableNumber: '',
      capacity: '',
      location: 'indoor',
    });
  };

  const groupedTables = tables.reduce((acc, table) => {
    const location = table.location || 'indoor';
    if (!acc[location]) acc[location] = [];
    acc[location].push(table);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64 bg-zinc-900" />
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="h-32 bg-zinc-900" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="table-management-page">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Table Management</h1>
          <p className="text-zinc-500">{tables.length} tables configured</p>
        </div>

        {isManager && (
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button data-testid="add-table-btn" className="bg-orange-500 hover:bg-orange-600 text-black">
                <Plus className="h-4 w-4 mr-2" /> Add Table
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-800">
              <DialogHeader>
                <DialogTitle>{editingTable ? 'Edit Table' : 'Add Table'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Table Number</Label>
                  <Input
                    data-testid="table-number-input"
                    type="number"
                    value={formData.tableNumber}
                    onChange={(e) => setFormData({ ...formData, tableNumber: e.target.value })}
                    className="bg-zinc-950 border-zinc-800"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Capacity</Label>
                  <Input
                    data-testid="table-capacity-input"
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    className="bg-zinc-950 border-zinc-800"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <select
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full h-10 px-3 rounded-md bg-zinc-950 border border-zinc-800 text-white"
                  >
                    <option value="indoor">Indoor</option>
                    <option value="outdoor">Outdoor</option>
                    <option value="balcony">Balcony</option>
                    <option value="vip">VIP Section</option>
                  </select>
                </div>
                <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-black">
                  {editingTable ? 'Update Table' : 'Add Table'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Legend */}
      <div className="flex gap-6 p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-full bg-green-500" />
          <span className="text-sm text-zinc-400">Free</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-full bg-orange-500" />
          <span className="text-sm text-zinc-400">Occupied</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-full bg-blue-500" />
          <span className="text-sm text-zinc-400">Reserved</span>
        </div>
      </div>

      {/* Tables by Location */}
      {Object.entries(groupedTables).map(([location, locationTables]) => (
        <div key={location} className="space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-orange-500" />
            <h2 className="text-xl font-semibold capitalize">{location}</h2>
            <Badge variant="outline" className="border-zinc-700">
              {locationTables.length} tables
            </Badge>
          </div>

          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {locationTables
                .sort((a, b) => a.tableNumber - b.tableNumber)
                .map((table, index) => (
                  <motion.div
                    key={table.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Card
                      className={`bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer group ${
                        table.status === 'occupied' && 'animate-pulse-glow'
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className={`h-3 w-3 rounded-full ${statusColors[table.status]}`} />
                          <Badge className={statusBadgeColors[table.status]}>
                            {table.status}
                          </Badge>
                        </div>

                        <div className="text-center mb-3">
                          <span className="text-3xl font-bold">{table.tableNumber}</span>
                          <div className="flex items-center justify-center gap-1 text-zinc-500 mt-1">
                            <Users className="h-4 w-4" />
                            <span className="text-sm">{table.capacity}</span>
                          </div>
                        </div>

                        {table.status !== 'occupied' && (
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 text-xs border-zinc-700 h-7"
                              onClick={() => updateStatus(table.id, table.status === 'free' ? 'reserved' : 'free')}
                            >
                              {table.status === 'free' ? 'Reserve' : 'Free'}
                            </Button>
                          </div>
                        )}

                        {isManager && (
                          <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="flex-1 h-7"
                              onClick={() => openEditDialog(table)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="flex-1 h-7 text-red-500 hover:text-red-400"
                              onClick={() => handleDelete(table.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
            </div>
          </AnimatePresence>
        </div>
      ))}

      {tables.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-16 w-16 text-zinc-700 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No tables configured</h3>
          <p className="text-zinc-500">Add your first table to get started</p>
        </div>
      )}
    </div>
  );
};

export default TableManagement;
