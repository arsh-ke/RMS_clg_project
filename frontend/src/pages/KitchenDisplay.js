import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { toast } from 'sonner';
import { Clock, ChefHat, CheckCircle, Bell, Timer } from 'lucide-react';

const KitchenDisplay = () => {
  const { api } = useAuth();
  const { socket } = useSocket();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      const response = await api.get('/orders/kitchen');
      setOrders(response.data.data || []);
    } catch (error) {
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  useEffect(() => {
    if (socket) {
      socket.on('new_order', () => {
        fetchOrders();
        new Audio('/notification.mp3').play().catch(() => {});
      });
      socket.on('order_update', fetchOrders);
      return () => {
        socket.off('new_order');
        socket.off('order_update');
      };
    }
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

  const getElapsedTime = (createdAt) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffMs = now - created;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins}m`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
  };

  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const preparingOrders = orders.filter((o) => o.status === 'preparing');
  const readyOrders = orders.filter((o) => o.status === 'ready');

  const KanbanColumn = ({ title, orders, status, color, icon: Icon, nextStatus, nextLabel }) => (
    <div className="flex-1 min-w-[300px]">
      <div className={`flex items-center gap-3 mb-4 p-4 bg-${color}-500/10 border border-${color}-500/20 rounded-lg`}>
        <Icon className={`h-6 w-6 text-${color}-500`} />
        <h2 className="text-xl font-bold">{title}</h2>
        <Badge className={`bg-${color}-500/20 text-${color}-500 border-${color}-500/30`}>
          {orders.length}
        </Badge>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {orders.map((order, index) => (
            <motion.div
              key={order.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className={`bg-zinc-900 border-${color}-500/30 hover:border-${color}-500/50 transition-all`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-mono">{order.orderNumber}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Timer className="h-4 w-4 text-zinc-500" />
                      <span className="text-sm font-mono text-zinc-400">
                        {getElapsedTime(order.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {order.tableNumber ? (
                      <Badge variant="outline" className="border-zinc-700 font-bold">
                        Table {order.tableNumber}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-blue-500/30 text-blue-500">
                        Takeaway
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    {order.items?.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 bg-zinc-950 rounded"
                      >
                        <span className="font-medium">
                          <span className="text-orange-500 font-bold mr-2">{item.quantity}x</span>
                          {item.name}
                        </span>
                        {item.notes && (
                          <span className="text-xs text-yellow-500 ml-2">📝 {item.notes}</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {order.notes && (
                    <div className="mb-4 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-sm text-yellow-500">
                      Note: {order.notes}
                    </div>
                  )}

                  {nextStatus && (
                    <Button
                      className={`w-full bg-${color}-500 hover:bg-${color}-600 text-black font-bold`}
                      onClick={() => updateStatus(order.id, nextStatus)}
                    >
                      {nextLabel}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {orders.length === 0 && (
          <div className="text-center py-8 text-zinc-600">
            <p>No orders</p>
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64 bg-zinc-900" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 bg-zinc-900" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="kitchen-display-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kitchen Display System</h1>
          <p className="text-zinc-500">
            {orders.length} active orders | Auto-refresh every 30s
          </p>
        </div>
        <Button onClick={fetchOrders} variant="outline" className="border-zinc-700">
          <Bell className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-6 overflow-x-auto pb-4">
        <KanbanColumn
          title="PENDING"
          orders={pendingOrders}
          status="pending"
          color="orange"
          icon={Clock}
          nextStatus="preparing"
          nextLabel="Start Cooking"
        />
        <KanbanColumn
          title="PREPARING"
          orders={preparingOrders}
          status="preparing"
          color="blue"
          icon={ChefHat}
          nextStatus="ready"
          nextLabel="Mark Ready"
        />
        <KanbanColumn
          title="READY"
          orders={readyOrders}
          status="ready"
          color="green"
          icon={CheckCircle}
          nextStatus="served"
          nextLabel="Mark Served"
        />
      </div>
    </div>
  );
};

export default KitchenDisplay;
