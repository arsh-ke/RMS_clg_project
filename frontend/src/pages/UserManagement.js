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
import { Plus, Search, Edit, Trash2, Users, Shield, Mail, Phone } from 'lucide-react';

const roleColors = {
  admin: 'text-red-500 bg-red-500/10 border-red-500/20',
  manager: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  staff: 'text-green-500 bg-green-500/10 border-green-500/20',
  kitchen: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
};

const UserManagement = () => {
  const { api } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff',
    phone: '',
  });

  const roles = ['all', 'admin', 'manager', 'staff', 'kitchen'];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data.data || []);
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
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

      setDialogOpen(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      await api.delete(`/users/${id}`);
      toast.success('User deleted!');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const toggleUserStatus = async (user) => {
    try {
      await api.put(`/users/${user.id}`, { isActive: !user.isActive });
      fetchUsers();
      toast.success(`User ${!user.isActive ? 'activated' : 'deactivated'}`);
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  const openEditDialog = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      phone: user.phone || '',
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'staff',
      phone: '',
    });
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64 bg-zinc-900" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-40 bg-zinc-900" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="user-management-page">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-zinc-500">{users.length} staff members</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button data-testid="add-user-btn" className="bg-orange-500 hover:bg-orange-600 text-black">
              <Plus className="h-4 w-4 mr-2" /> Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 border-zinc-800">
            <DialogHeader>
              <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  data-testid="user-name-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-zinc-950 border-zinc-800"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  data-testid="user-email-input"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-zinc-950 border-zinc-800"
                  required
                />
              </div>
              {!editingUser && (
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input
                    data-testid="user-password-input"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="bg-zinc-950 border-zinc-800"
                    required={!editingUser}
                    minLength={6}
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Role</Label>
                  <select
                    data-testid="user-role-select"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full h-10 px-3 rounded-md bg-zinc-950 border border-zinc-800 text-white"
                  >
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="staff">Staff</option>
                    <option value="kitchen">Kitchen</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Phone (Optional)</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="bg-zinc-950 border-zinc-800"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-black">
                {editingUser ? 'Update User' : 'Create User'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            data-testid="user-search-input"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-zinc-900 border-zinc-800"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {roles.map((role) => (
            <Button
              key={role}
              variant={roleFilter === role ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRoleFilter(role)}
              className={roleFilter === role ? 'bg-orange-500 text-black' : 'border-zinc-800'}
            >
              {role === 'all' ? 'All' : role.charAt(0).toUpperCase() + role.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Users Grid */}
      <AnimatePresence mode="popLayout">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user, index) => (
            <motion.div
              key={user.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.03 }}
            >
              <Card className={`bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-all ${!user.isActive && 'opacity-60'}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500 font-bold text-lg">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold">{user.name}</h3>
                        <Badge className={roleColors[user.role]}>
                          <Shield className="h-3 w-3 mr-1" />
                          {user.role}
                        </Badge>
                      </div>
                    </div>
                    {!user.isActive && (
                      <Badge variant="outline" className="border-red-500/30 text-red-500">
                        Inactive
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{user.email}</span>
                    </div>
                    {user.phone && (
                      <div className="flex items-center gap-2 text-sm text-zinc-400">
                        <Phone className="h-4 w-4" />
                        <span>{user.phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-zinc-700"
                      onClick={() => toggleUserStatus(user)}
                    >
                      {user.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="border-zinc-700"
                      onClick={() => openEditDialog(user)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="border-red-500/30 text-red-500 hover:bg-red-500/10"
                      onClick={() => handleDelete(user.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </AnimatePresence>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-16 w-16 text-zinc-700 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No users found</h3>
          <p className="text-zinc-500">Add users or adjust filters</p>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
