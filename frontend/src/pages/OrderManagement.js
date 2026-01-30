import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { ScrollArea } from '../components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Clock,
  DollarSign,
  ChefHat,
  CheckCircle,
  XCircle,
  CreditCard,
  Minus,
  Trash2,
} from 'lucide-react';

const statusConfig = {
  pending: { color: 'status-pending', label: 'Pending', icon: Clock },
  preparing: { color: 'status-preparing', label: 'Preparing', icon: ChefHat },
  ready: { color: 'status-ready', label: 'Ready', icon: CheckCircle },
  served: { color: 'status-served', label: 'Served', icon: CheckCircle },
  completed: { color: 'status-completed', label: 'Completed', icon: CheckCircle },
  cancelled: { color: 'status-cancelled', label: 'Cancelled', icon: XCircle },
};

const OrderManagement = () => {
  const { api, user } = useAuth();
  const { socket } = useSocket();
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [newOrder, setNewOrder] = useState({
    tableId: '',
    orderType: 'dine-in',
    items: [],
    customerName: '',
    customerPhone: '',
    notes: '',
  });

  const [paymentData, setPaymentData] = useState({
    paymentMethod: 'cash',
    discount: 0,
  });

  const fetchData = useCallback(async () => {
    try {
      const [ordersRes, tablesRes, menuRes] = await Promise.all([
        api.get('/orders/today'),
        api.get('/tables'),
        api.get('/menu?isAvailable=true'),
      ]);

      setOrders(ordersRes.data.data || []);
      setTables(tablesRes.data.data || []);
      setMenuItems(menuRes.data.data || []);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (socket) {
      socket.on('new_order', () => fetchData());
      socket.on('order_update', () => fetchData());
      return () => {
        socket.off('new_order');
        socket.off('order_update');
      };
    }
  }, [socket, fetchData]);

  const addItemToOrder = (menuItem) => {
    const existingIndex = newOrder.items.findIndex((i) => i.menuItemId === menuItem.id);
    if (existingIndex >= 0) {
      const updated = [...newOrder.items];
      updated[existingIndex].quantity += 1;
      setNewOrder({ ...newOrder, items: updated });
    } else {
      setNewOrder({
        ...newOrder,
        items: [
          ...newOrder.items,
          { menuItemId: menuItem.id, name: menuItem.name, price: menuItem.price, quantity: 1 },
        ],
      });
    }
  };

  const removeItemFromOrder = (menuItemId) => {
    setNewOrder({
      ...newOrder,
      items: newOrder.items.filter((i) => i.menuItemId !== menuItemId),
    });
  };

  const updateItemQuantity = (menuItemId, delta) => {
    const updated = newOrder.items.map((item) => {
      if (item.menuItemId === menuItemId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean);
    setNewOrder({ ...newOrder, items: updated });
  };

  const calculateOrderTotal = () => {
    const subtotal = newOrder.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = subtotal * 0.05;
    return { subtotal, tax, total: subtotal + tax };
  };

  const handleCreateOrder = async () => {
    if (newOrder.items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    try {
      await api.post('/orders', {
        tableId: newOrder.tableId || null,
        items: newOrder.items.map((i) => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
        orderType: newOrder.orderType,
        customerName: newOrder.customerName,
        customerPhone: newOrder.customerPhone,
        notes: newOrder.notes,
      });

      toast.success('Order created successfully!');
      setCreateDialogOpen(false);
      setNewOrder({
        tableId: '',
        orderType: 'dine-in',
        items: [],
        customerName: '',
        customerPhone: '',
        notes: '',
      });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create order');
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status });
      toast.success(`Order ${status}`);
      fetchData();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handlePayment = async () => {
    if (!selectedOrder) return;

    try {
      await api.put(`/orders/${selectedOrder.id}/payment`, {
        paymentStatus: 'paid',
        paymentMethod: paymentData.paymentMethod,
        discount: paymentData.discount,
      });

      await api.put(`/orders/${selectedOrder.id}/status`, { status: 'completed' });

      toast.success('Payment processed successfully!');
      setPaymentDialogOpen(false);
      setSelectedOrder(null);
      fetchData();
    } catch (error) {
      toast.error('Payment failed');
    }
  };

  const openPaymentDialog = (order) => {
    setSelectedOrder(order);
    setPaymentData({ paymentMethod: 'cash', discount: 0 });
    setPaymentDialogOpen(true);
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.tableNumber?.toString().includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const { subtotal, tax, total } = calculateOrderTotal();
  const freeTables = tables.filter((t) => t.status === 'free');

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64 bg-zinc-900" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48 bg-zinc-900" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="order-management-page">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Order Management</h1>
          <p className="text-zinc-500">{filteredOrders.length} orders today</p>
        </div>

        <Button
          data-testid="create-order-btn"
          className="bg-orange-500 hover:bg-orange-600 text-black"
          onClick={() => setCreateDialogOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" /> New Order
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            data-testid="order-search-input"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-zinc-900 border-zinc-800"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'pending', 'preparing', 'ready', 'served', 'completed'].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className={statusFilter === status ? 'bg-orange-500 text-black' : 'border-zinc-800'}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Orders Grid */}
      <AnimatePresence mode="popLayout">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredOrders.map((order, index) => {
            const config = statusConfig[order.status] || statusConfig.pending;
            const StatusIcon = config.icon;

            return (
              <motion.div
                key={order.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-all">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-lg">{order.orderNumber}</CardTitle>
                        {order.tableNumber && (
                          <Badge variant="outline" className="border-zinc-700">
                            Table {order.tableNumber}
                          </Badge>
                        )}
                        {order.orderType === 'takeaway' && (
                          <Badge variant="outline" className="border-blue-500/30 text-blue-500">
                            Takeaway
                          </Badge>
                        )}
                      </div>
                      <Badge className={`${config.color} border`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {config.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Items */}
                      <div className="space-y-1">
                        {order.items?.slice(0, 3).map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-zinc-400">
                              {item.quantity}x {item.name}
                            </span>
                            <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                        {order.items?.length > 3 && (
                          <span className="text-xs text-zinc-500">
                            +{order.items.length - 3} more items
                          </span>
                        )}
                      </div>

                      {/* Total */}
                      <div className="flex justify-between pt-2 border-t border-zinc-800">
                        <span className="font-semibold">Total</span>
                        <span className="font-bold text-orange-500">₹{order.total?.toFixed(2)}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        {order.status === 'pending' && (
                          <Button
                            size="sm"
                            className="flex-1 bg-blue-500 hover:bg-blue-600"
                            onClick={() => updateOrderStatus(order.id, 'preparing')}
                          >
                            Start Preparing
                          </Button>
                        )}
                        {order.status === 'preparing' && (
                          <Button
                            size="sm"
                            className="flex-1 bg-green-500 hover:bg-green-600"
                            onClick={() => updateOrderStatus(order.id, 'ready')}
                          >
                            Mark Ready
                          </Button>
                        )}
                        {order.status === 'ready' && (
                          <Button
                            size="sm"
                            className="flex-1 bg-purple-500 hover:bg-purple-600"
                            onClick={() => updateOrderStatus(order.id, 'served')}
                          >
                            Mark Served
                          </Button>
                        )}
                        {order.status === 'served' && order.paymentStatus !== 'paid' && (
                          <Button
                            size="sm"
                            className="flex-1 bg-orange-500 hover:bg-orange-600 text-black"
                            onClick={() => openPaymentDialog(order)}
                          >
                            <CreditCard className="h-4 w-4 mr-1" /> Process Payment
                          </Button>
                        )}
                        {['pending', 'preparing'].includes(order.status) && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-500/30 text-red-500 hover:bg-red-500/10"
                            onClick={() => updateOrderStatus(order.id, 'cancelled')}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </AnimatePresence>

      {filteredOrders.length === 0 && (
        <div className="text-center py-12">
          <Clock className="h-16 w-16 text-zinc-700 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No orders found</h3>
          <p className="text-zinc-500">Create a new order to get started</p>
        </div>
      )}

      {/* Create Order Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Create New Order</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Menu Items */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>Order Type</Label>
                  <select
                    value={newOrder.orderType}
                    onChange={(e) => setNewOrder({ ...newOrder, orderType: e.target.value })}
                    className="w-full h-10 px-3 rounded-md bg-zinc-950 border border-zinc-800 text-white"
                  >
                    <option value="dine-in">Dine-in</option>
                    <option value="takeaway">Takeaway</option>
                  </select>
                </div>
                {newOrder.orderType === 'dine-in' && (
                  <div className="space-y-2">
                    <Label>Table</Label>
                    <select
                      value={newOrder.tableId}
                      onChange={(e) => setNewOrder({ ...newOrder, tableId: e.target.value })}
                      className="w-full h-10 px-3 rounded-md bg-zinc-950 border border-zinc-800 text-white"
                    >
                      <option value="">Select Table</option>
                      {freeTables.map((table) => (
                        <option key={table.id} value={table.id}>
                          Table {table.tableNumber} ({table.capacity} seats)
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <Label className="mb-2 block">Menu Items</Label>
                <ScrollArea className="h-64 border border-zinc-800 rounded-md p-2">
                  <div className="space-y-2">
                    {menuItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 bg-zinc-950 rounded-md hover:bg-zinc-900 cursor-pointer"
                        onClick={() => addItemToOrder(item)}
                      >
                        <div>
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-zinc-500">{item.category}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-orange-500 font-medium">₹{item.price}</span>
                          <Plus className="h-4 w-4 text-zinc-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>

            {/* Right: Order Summary */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Customer Name (Optional)</Label>
                <Input
                  value={newOrder.customerName}
                  onChange={(e) => setNewOrder({ ...newOrder, customerName: e.target.value })}
                  className="bg-zinc-950 border-zinc-800"
                />
              </div>

              <div>
                <Label className="mb-2 block">Order Items</Label>
                <ScrollArea className="h-48 border border-zinc-800 rounded-md p-2">
                  {newOrder.items.length === 0 ? (
                    <p className="text-center text-zinc-500 py-8 text-sm">No items added</p>
                  ) : (
                    <div className="space-y-2">
                      {newOrder.items.map((item) => (
                        <div key={item.menuItemId} className="flex items-center justify-between p-2 bg-zinc-950 rounded-md">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.name}</p>
                            <p className="text-xs text-zinc-500">₹{item.price} each</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-6 w-6 border-zinc-700"
                              onClick={() => updateItemQuantity(item.menuItemId, -1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-6 text-center">{item.quantity}</span>
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-6 w-6 border-zinc-700"
                              onClick={() => updateItemQuantity(item.menuItemId, 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-red-500"
                              onClick={() => removeItemFromOrder(item.menuItemId)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>

              {/* Totals */}
              <div className="border border-zinc-800 rounded-md p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Tax (5%)</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold pt-2 border-t border-zinc-800">
                  <span>Total</span>
                  <span className="text-orange-500">₹{total.toFixed(2)}</span>
                </div>
              </div>

              <Button
                className="w-full bg-orange-500 hover:bg-orange-600 text-black"
                onClick={handleCreateOrder}
                disabled={newOrder.items.length === 0}
              >
                Create Order
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle>Process Payment - {selectedOrder?.orderNumber}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-zinc-950 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-400">Subtotal</span>
                <span>₹{selectedOrder?.subtotal?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Tax</span>
                <span>₹{selectedOrder?.tax?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Discount</span>
                <Input
                  type="number"
                  value={paymentData.discount}
                  onChange={(e) => setPaymentData({ ...paymentData, discount: parseFloat(e.target.value) || 0 })}
                  className="w-24 h-8 bg-zinc-900 border-zinc-800 text-right"
                />
              </div>
              <div className="flex justify-between font-bold pt-2 border-t border-zinc-800">
                <span>Total</span>
                <span className="text-orange-500">
                  ₹{((selectedOrder?.total || 0) - paymentData.discount).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Payment Method</Label>
              <div className="grid grid-cols-4 gap-2">
                {['cash', 'card', 'upi', 'other'].map((method) => (
                  <Button
                    key={method}
                    variant={paymentData.paymentMethod === method ? 'default' : 'outline'}
                    className={paymentData.paymentMethod === method ? 'bg-orange-500 text-black' : 'border-zinc-800'}
                    onClick={() => setPaymentData({ ...paymentData, paymentMethod: method })}
                  >
                    {method.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>

            <Button
              className="w-full bg-green-500 hover:bg-green-600"
              onClick={handlePayment}
            >
              <DollarSign className="h-4 w-4 mr-2" /> Complete Payment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderManagement;
