import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
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
  Plus, Search, Clock, DollarSign, ChefHat,
  CheckCircle2, XCircle, CreditCard, Minus,
  Trash2, UtensilsCrossed, Zap, ShoppingBag,
  Wallet, Smartphone, Banknote, MoreHorizontal,
  ArrowRight, X, Receipt, Flame,
} from 'lucide-react';

/* ─── Status config ─── */
const statusConfig = {
  pending:   { color: '#f97316', bg: 'rgba(249,115,22,0.10)', border: 'rgba(249,115,22,0.30)', label: 'Pending',   icon: Clock        },
  preparing: { color: '#60a5fa', bg: 'rgba(96,165,250,0.10)', border: 'rgba(96,165,250,0.30)', label: 'Preparing', icon: ChefHat      },
  ready:     { color: '#34d399', bg: 'rgba(52,211,153,0.10)', border: 'rgba(52,211,153,0.30)', label: 'Ready',     icon: CheckCircle2 },
  served:    { color: '#a78bfa', bg: 'rgba(167,139,250,0.10)',border: 'rgba(167,139,250,0.30)',label: 'Served',    icon: UtensilsCrossed},
  completed: { color: '#71717a', bg: 'rgba(113,113,122,0.10)',border: 'rgba(113,113,122,0.25)',label: 'Completed', icon: CheckCircle2 },
  cancelled: { color: '#ef4444', bg: 'rgba(239,68,68,0.10)',  border: 'rgba(239,68,68,0.25)',  label: 'Cancelled', icon: XCircle      },
};

const statusFlow = {
  pending:   { next: 'preparing', label: 'Start Preparing', icon: Flame,         btnColor: 'linear-gradient(135deg,#3b82f6,#2563eb)', shadow: 'rgba(96,165,250,0.4)' },
  preparing: { next: 'ready',     label: 'Mark Ready',      icon: CheckCircle2,  btnColor: 'linear-gradient(135deg,#10b981,#059669)', shadow: 'rgba(52,211,153,0.4)' },
  ready:     { next: 'served',    label: 'Mark Served',     icon: UtensilsCrossed,btnColor:'linear-gradient(135deg,#8b5cf6,#7c3aed)', shadow: 'rgba(167,139,250,0.4)' },
};

const statusFilters = ['all', 'pending', 'preparing', 'ready', 'served', 'completed'];

const paymentMethods = [
  { key: 'cash', label: 'Cash',   icon: Banknote   },
  { key: 'card', label: 'Card',   icon: CreditCard },
  { key: 'upi',  label: 'UPI',    icon: Smartphone },
  { key: 'online', label: 'Online', icon: DollarSign },
  { key: 'other',label: 'Other',  icon: Wallet     },
];

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
const StyledSelect = ({ className = '', children, ...props }) => (
  <select
    className={`w-full h-10 px-3 rounded-xl bg-zinc-900 border border-zinc-700/80 text-white text-sm focus:outline-none focus:border-orange-500 transition-all duration-200 ${className}`}
    {...props}
  >{children}</select>
);

/* ─── Status pill ─── */
const StatusPill = ({ status }) => {
  const cfg = statusConfig[status] || statusConfig.pending;
  const Icon = cfg.icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border"
      style={{ background: cfg.bg, borderColor: cfg.border, color: cfg.color }}
    >
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
};

/* ─── Order card ─── */
const OrderCard = ({ order, index, onStatusChange, onPayment }) => {
  const cfg = statusConfig[order.status] || statusConfig.pending;
  const flow = statusFlow[order.status];
  const FlowIcon = flow?.icon;
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, y: -10 }}
      transition={{ delay: index * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="relative rounded-2xl border overflow-hidden"
      style={{
        background: 'linear-gradient(145deg, #111116 0%, #0d0d11 100%)',
        borderColor: hovered ? cfg.color : `${cfg.color}30`,
        boxShadow: hovered ? `0 0 24px ${cfg.bg}` : 'none',
        transition: 'border-color 0.25s, box-shadow 0.25s',
      }}
    >
      {/* Color strip */}
      <div className="h-0.5" style={{ background: `linear-gradient(90deg, ${cfg.color}, transparent)` }} />

      {/* Hover glow */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 50% 0%, ${cfg.color}12 0%, transparent 65%)` }}
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />

      <div className="p-4 relative z-10">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-base font-black font-mono text-zinc-100">#{order.orderNumber}</span>
              {order.tableNumber
                ? <span className="text-xs font-bold px-2 py-0.5 rounded-md" style={{ background: `${cfg.color}15`, color: cfg.color }}>Table {order.tableNumber}</span>
                : <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-400">Takeaway</span>
              }
            </div>
            <StatusPill status={order.status} />
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xl font-black" style={{ color: cfg.color }}>₹{order.total?.toFixed(2)}</p>
            {order.paymentStatus === 'paid' && (
              <span className="text-[10px] text-emerald-400 font-bold">✓ PAID</span>
            )}
          </div>
        </div>

        {/* Items */}
        <div className="space-y-1.5 mb-3">
          {order.items?.slice(0, 3).map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm px-2.5 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <span className="text-zinc-400">
                <span className="font-bold text-zinc-300 mr-1.5">{item.quantity}×</span>
                {item.name}
              </span>
              <span className="text-zinc-500 text-xs">₹{(item.price * item.quantity).toFixed(0)}</span>
            </div>
          ))}
          {order.items?.length > 3 && (
            <p className="text-xs text-zinc-600 pl-2 flex items-center gap-1">
              <MoreHorizontal className="w-3 h-3" />
              {order.items.length - 3} more items
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-3 border-t" style={{ borderColor: `${cfg.color}15` }}>
          {flow && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onStatusChange(order.id, flow.next)}
              className="flex-1 h-9 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold text-white"
              style={{ background: flow.btnColor, boxShadow: `0 3px 12px ${flow.shadow}` }}
            >
              <FlowIcon className="w-3.5 h-3.5" />
              {flow.label}
              <ArrowRight className="w-3 h-3 ml-auto opacity-60" />
            </motion.button>
          )}

          {order.status === 'served' && order.paymentStatus !== 'paid' && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onPayment(order)}
              className="flex-1 h-9 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold text-white"
              style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)', boxShadow: '0 3px 12px rgba(249,115,22,0.4)' }}
            >
              <CreditCard className="w-3.5 h-3.5" /> Pay Now
            </motion.button>
          )}

          {['pending', 'preparing'].includes(order.status) && (
            <button
              onClick={() => onStatusChange(order.id, 'cancelled')}
              className="w-9 h-9 rounded-xl flex items-center justify-center border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════ */
const OrderManagement = () => {
  const { api } = useAuth();
  const { socket } = useSocket();
  const [orders, setOrders]         = useState([]);
  const [tables, setTables]         = useState([]);
  const [menuItems, setMenuItems]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [menuSearch, setMenuSearch] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [newOrder, setNewOrder] = useState({
    tableId: '', orderType: 'dine-in', items: [],
    customerName: '', customerPhone: '', notes: '',
  });
  const [paymentData, setPaymentData] = useState({ paymentMethod: 'cash', discount: 0 });
  const [upiQRData, setUpiQRData] = useState(null);
  const [showUPIQR, setShowUPIQR] = useState(false);

  const loadRazorpayScript = () => {
    return new Promise((resolve, reject) => {
      if (window.Razorpay) {
        return resolve(true);
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error('Failed to load Razorpay script'));
      document.body.appendChild(script);
    });
  };

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

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!socket) return;
    socket.on('new_order', fetchData);
    socket.on('order_update', fetchData);
    return () => { socket.off('new_order'); socket.off('order_update'); };
  }, [socket, fetchData]);

  const addItem = (item) => {
    const idx = newOrder.items.findIndex(i => i.menuItemId === item.id);
    if (idx >= 0) {
      const updated = [...newOrder.items];
      updated[idx].quantity += 1;
      setNewOrder({ ...newOrder, items: updated });
    } else {
      setNewOrder({ ...newOrder, items: [...newOrder.items, { menuItemId: item.id, name: item.name, price: item.price, quantity: 1 }] });
    }
  };

  const removeItem = (id) => setNewOrder({ ...newOrder, items: newOrder.items.filter(i => i.menuItemId !== id) });
  const updateQty  = (id, delta) => {
    const updated = newOrder.items.map(i => i.menuItemId === id ? { ...i, quantity: i.quantity + delta } : i).filter(i => i.quantity > 0);
    setNewOrder({ ...newOrder, items: updated });
  };

  const calcTotals = () => {
    const subtotal = newOrder.items.reduce((s, i) => s + i.price * i.quantity, 0);
    const tax = subtotal * 0.05;
    return { subtotal, tax, total: subtotal + tax };
  };

  const handleCreateOrder = async () => {
    if (!newOrder.items.length) { toast.error('Add at least one item'); return; }
    try {
      await api.post('/orders', {
        tableId: newOrder.tableId || null,
        items: newOrder.items.map(i => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
        orderType: newOrder.orderType,
        customerName: newOrder.customerName,
        customerPhone: newOrder.customerPhone,
        notes: newOrder.notes,
      });
      toast.success('Order created!');
      setCreateDialogOpen(false);
      setNewOrder({ tableId: '', orderType: 'dine-in', items: [], customerName: '', customerPhone: '', notes: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create order');
    }
  };

  const updateOrderStatus = async (id, status) => {
    try {
      await api.put(`/orders/${id}/status`, { status });
      toast.success(`Order ${status}`);
      fetchData();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const openPayment = (order) => {
    setSelectedOrder(order);
    setPaymentData({ paymentMethod: 'cash', discount: 0 });
    setPaymentDialogOpen(true);
  };

  const handlePayment = async () => {
    if (!selectedOrder) return;

    const totalAmount = (selectedOrder.total || 0) - paymentData.discount;

    if (totalAmount <= 0) {
      toast.error('Invalid payment amount');
      return;
    }

    // Online payment path
    if (paymentData.paymentMethod === 'online') {
      try {
        await loadRazorpayScript();

        // Create Razorpay order (backend)
        const response = await api.post('/payment/create-order', {
          orderId: selectedOrder.id,
          amount: totalAmount
        });

        const { data } = response.data;

        if (!data || !data.razorpay_order_id) {
          throw new Error('Failed to create Razorpay order');
        }

        const options = {
          key: data.key,
          amount: data.amount,
          currency: data.currency,
          order_id: data.razorpay_order_id,
          name: 'NEXA EATS Restaurant',
          description: `Order #${selectedOrder.orderNumber}`,
          handler: async function (response) {
            try {
              await api.post('/payment/verify', {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              });

              toast.success('Payment successful!');
              setPaymentDialogOpen(false);
              setSelectedOrder(null);
              fetchData();
            } catch (error) {
              console.error('Verification failed', error);
              toast.error('Payment verification failed');
            }
          },
          prefill: {
            name: selectedOrder.customerName || '',
            email: '',
            contact: selectedOrder.customerPhone || ''
          },
          theme: {
            color: '#f97316'
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } catch (error) {
        console.error('Online payment initiation failed', error);
        toast.error(error?.response?.data?.message || 'Failed to initiate online payment');
      }

      return;
    }

    // Local (cash/card/upi/other) payment path
    if (paymentData.paymentMethod === 'upi') {
      try {
        // Generate UPI QR code
        const response = await api.get(`/payment/upi-qr/${selectedOrder.id}`, {
          params: { discount: paymentData.discount }
        });

        setUpiQRData(response.data.data);
        setShowUPIQR(true);
        toast.success('UPI QR code generated! Scan to pay');
        return;
      } catch (error) {
        console.error('UPI QR generation failed', error);
        toast.error(error?.response?.data?.message || 'Failed to generate UPI QR code');
        return;
      }
    }

    try {
      await api.put(`/orders/${selectedOrder.id}/payment`, {
        paymentStatus: 'paid',
        paymentMethod: paymentData.paymentMethod,
        discount: paymentData.discount
      });
      toast.success('Payment complete!');
      setPaymentDialogOpen(false);
      setSelectedOrder(null);
      fetchData();
    } catch (error) {
      toast.error('Payment failed');
    }
  };

  const completeUPIPayment = async () => {
    try {
      await api.put(`/orders/${selectedOrder.id}/payment`, {
        paymentStatus: 'paid',
        paymentMethod: 'upi',
        discount: paymentData.discount
      });
      toast.success('UPI Payment confirmed!');
      setPaymentDialogOpen(false);
      setSelectedOrder(null);
      setUpiQRData(null);
      setShowUPIQR(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to confirm UPI payment');
    }
  };

  const cancelUPIPayment = () => {
    setUpiQRData(null);
    setShowUPIQR(false);
  };

  const filteredOrders = orders.filter(o => {
    const s = o.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) || o.tableNumber?.toString().includes(searchTerm);
    const f = statusFilter === 'all' || o.status === statusFilter;
    return s && f;
  });

  const freeTables = tables.filter(t => t.status === 'free');
  const { subtotal, tax, total } = calcTotals();

  // Status counts for filter pills
  const counts = statusFilters.reduce((a, s) => {
    a[s] = s === 'all' ? orders.length : orders.filter(o => o.status === s).length;
    return a;
  }, {});

  const filteredMenu = menuItems.filter(i => i.name.toLowerCase().includes(menuSearch.toLowerCase()));

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between">
          <Skeleton className="h-10 w-56 rounded-xl bg-zinc-900" />
          <Skeleton className="h-10 w-32 rounded-xl bg-zinc-900" />
        </div>
        <div className="flex gap-2">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-8 w-24 rounded-xl bg-zinc-900" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-52 rounded-2xl bg-zinc-900" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5" data-testid="order-management-page">

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-orange-400" />
            </span>
            Order Management
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            <span className="text-orange-400 font-bold">{orders.length}</span> orders today
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          data-testid="create-order-btn"
          onClick={() => setCreateDialogOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white shadow-[0_4px_20px_rgba(249,115,22,0.4)]"
          style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}
        >
          <Plus className="w-4 h-4" /> New Order
        </motion.button>
      </motion.div>

      {/* ── Filters ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        {/* Search */}
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            data-testid="order-search-input"
            placeholder="Search orders…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-zinc-900/80 border border-zinc-800 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-orange-500/60 transition-all"
          />
        </div>

        {/* Status pills */}
        <div className="flex gap-2 flex-wrap">
          {statusFilters.map(s => {
            const cfg = statusConfig[s];
            const active = statusFilter === s;
            return (
              <motion.button
                key={s}
                whileTap={{ scale: 0.95 }}
                onClick={() => setStatusFilter(s)}
                className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200"
                style={active
                  ? s === 'all'
                    ? { background: 'rgba(249,115,22,0.15)', borderColor: 'rgba(249,115,22,0.5)', color: '#f97316' }
                    : { background: cfg.bg, borderColor: cfg.border, color: cfg.color }
                  : { background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(63,63,70,0.7)', color: '#71717a' }
                }
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
                {counts[s] > 0 && (
                  <span
                    className="ml-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black"
                    style={active
                      ? { background: s === 'all' ? '#f97316' : cfg.color, color: '#000' }
                      : { background: 'rgba(255,255,255,0.08)', color: '#71717a' }
                    }
                  >
                    {counts[s]}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* ── Orders grid ── */}
      <AnimatePresence mode="popLayout">
        {filteredOrders.length > 0 ? (
          <motion.div layout className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredOrders.map((order, i) => (
              <OrderCard
                key={order.id}
                order={order}
                index={i}
                onStatusChange={updateOrderStatus}
                onPayment={openPayment}
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
              <Clock className="w-10 h-10 text-zinc-700" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-zinc-300 mb-1">No orders found</h3>
              <p className="text-zinc-600 text-sm">Create a new order to get started</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════ CREATE ORDER DIALOG ════ */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent
          className="border-zinc-800 max-w-4xl max-h-[90vh] overflow-hidden p-0"
          style={{ background: 'linear-gradient(135deg,#111116,#0c0c10)' }}
        >
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-zinc-800">
            <DialogTitle className="text-lg font-black flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              Create New Order
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 h-[calc(90vh-130px)] overflow-hidden">

            {/* Left — Menu */}
            <div className="flex flex-col border-r border-zinc-800 overflow-hidden">
              <div className="p-4 border-b border-zinc-800 space-y-3">
                {/* Order type + Table */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FormLabel>Order Type</FormLabel>
                    <StyledSelect value={newOrder.orderType} onChange={e => setNewOrder({ ...newOrder, orderType: e.target.value, tableId: '' })}>
                      <option value="dine-in">🍽 Dine-in</option>
                      <option value="takeaway">🥡 Takeaway</option>
                    </StyledSelect>
                  </div>
                  {newOrder.orderType === 'dine-in' && (
                    <div>
                      <FormLabel>Table</FormLabel>
                      <StyledSelect value={newOrder.tableId} onChange={e => setNewOrder({ ...newOrder, tableId: e.target.value })}>
                        <option value="">Select table</option>
                        {freeTables.map(t => <option key={t.id} value={t.id}>Table {t.tableNumber} ({t.capacity} seats)</option>)}
                      </StyledSelect>
                    </div>
                  )}
                </div>
                {/* Menu search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                  <input
                    placeholder="Search menu items…"
                    value={menuSearch}
                    onChange={e => setMenuSearch(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-orange-500 transition-all"
                  />
                </div>
              </div>

              <ScrollArea className="flex-1 p-3">
                <div className="space-y-1.5">
                  {filteredMenu.map(item => {
                    const inCart = newOrder.items.find(i => i.menuItemId === item.id);
                    return (
                      <motion.div
                        key={item.id}
                        whileHover={{ x: 2 }}
                        onClick={() => addItem(item)}
                        className="flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-150 group"
                        style={{
                          background: inCart ? 'rgba(249,115,22,0.08)' : 'rgba(255,255,255,0.02)',
                          border: `1px solid ${inCart ? 'rgba(249,115,22,0.25)' : 'rgba(63,63,70,0.5)'}`,
                        }}
                      >
                        <div>
                          <p className="text-sm font-semibold text-zinc-200">{item.name}</p>
                          <p className="text-[11px] text-zinc-500 capitalize mt-0.5">{item.category?.replace('-', ' ')}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-orange-400">₹{item.price}</span>
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                            style={{ background: inCart ? 'rgba(249,115,22,0.2)' : 'rgba(255,255,255,0.05)' }}
                          >
                            {inCart
                              ? <span className="text-xs font-black text-orange-400">{inCart.quantity}</span>
                              : <Plus className="w-3.5 h-3.5 text-zinc-500 group-hover:text-orange-400 transition-colors" />
                            }
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>

            {/* Right — Order Summary */}
            <div className="flex flex-col overflow-hidden">
              <div className="p-4 border-b border-zinc-800">
                <FormLabel>Customer Name (Optional)</FormLabel>
                <StyledInput
                  value={newOrder.customerName}
                  onChange={e => setNewOrder({ ...newOrder, customerName: e.target.value })}
                  placeholder="Walk-in customer"
                />
              </div>

              <div className="flex-1 overflow-hidden flex flex-col">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest px-4 pt-3 pb-2">
                  Order Items ({newOrder.items.length})
                </p>
                <ScrollArea className="flex-1 px-3">
                  {newOrder.items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                      <ShoppingBag className="w-10 h-10 text-zinc-700" />
                      <p className="text-sm text-zinc-600">No items yet — click menu items to add</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {newOrder.items.map(item => (
                        <div
                          key={item.menuItemId}
                          className="flex items-center gap-3 p-3 rounded-xl"
                          style={{ background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.15)' }}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-zinc-200 truncate">{item.name}</p>
                            <p className="text-xs text-zinc-500">₹{(item.price * item.quantity).toFixed(0)}</p>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button onClick={() => updateQty(item.menuItemId, -1)} className="w-6 h-6 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 hover:bg-zinc-700 transition-colors">
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-6 text-center text-sm font-bold text-zinc-100">{item.quantity}</span>
                            <button onClick={() => updateQty(item.menuItemId, 1)} className="w-6 h-6 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 hover:bg-zinc-700 transition-colors">
                              <Plus className="w-3 h-3" />
                            </button>
                            <button onClick={() => removeItem(item.menuItemId)} className="w-6 h-6 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-500/15 transition-colors ml-1">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>

              {/* Totals + submit */}
              <div className="p-4 border-t border-zinc-800 space-y-3">
                <div className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(63,63,70,0.5)' }}>
                  <div className="flex justify-between text-sm text-zinc-500">
                    <span>Subtotal</span><span className="text-zinc-300">₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-zinc-500">
                    <span>Tax (5%)</span><span className="text-zinc-300">₹{tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-black pt-2 border-t border-zinc-700">
                    <span className="text-zinc-100">Total</span>
                    <span className="text-orange-400 text-lg">₹{total.toFixed(2)}</span>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCreateOrder}
                  disabled={!newOrder.items.length}
                  className="w-full h-11 rounded-xl font-bold text-white text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)', boxShadow: newOrder.items.length ? '0 4px 16px rgba(249,115,22,0.4)' : 'none' }}
                >
                  Place Order →
                </motion.button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ════ PAYMENT DIALOG ════ */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent
          className="border-zinc-800 max-w-sm"
          style={{ background: 'linear-gradient(135deg,#111116,#0c0c10)' }}
        >
          <DialogHeader className="pb-4 border-b border-zinc-800">
            <DialogTitle className="text-lg font-black flex items-center gap-2">
              <Receipt className="w-5 h-5 text-orange-500" />
              Process Payment
            </DialogTitle>
            <p className="text-xs text-zinc-500 font-mono">#{selectedOrder?.orderNumber}</p>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Bill breakdown */}
            <div className="rounded-xl p-4 space-y-2.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(63,63,70,0.5)' }}>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Subtotal</span>
                <span className="text-zinc-300">₹{selectedOrder?.subtotal?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Tax</span>
                <span className="text-zinc-300">₹{selectedOrder?.tax?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-zinc-500">Discount (₹)</span>
                <input
                  type="number"
                  value={paymentData.discount}
                  onChange={e => setPaymentData({ ...paymentData, discount: parseFloat(e.target.value) || 0 })}
                  className="w-24 h-8 px-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-sm text-right focus:outline-none focus:border-orange-500 transition-all"
                />
              </div>
              <div className="flex justify-between font-black pt-2 border-t border-zinc-700">
                <span className="text-zinc-100">Total Due</span>
                <span className="text-orange-400 text-xl">₹{((selectedOrder?.total || 0) - paymentData.discount).toFixed(2)}</span>
              </div>
            </div>

            {/* Payment method */}
            <div>
              <FormLabel>Payment Method</FormLabel>
              <div className="grid grid-cols-2 gap-2">
                {paymentMethods.map(({ key, label, icon: Icon }) => {
                  const active = paymentData.paymentMethod === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setPaymentData({ ...paymentData, paymentMethod: key })}
                      className="flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-semibold transition-all duration-150"
                      style={active
                        ? { background: 'rgba(249,115,22,0.15)', borderColor: 'rgba(249,115,22,0.5)', color: '#f97316', boxShadow: '0 0 12px rgba(249,115,22,0.2)' }
                        : { background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(63,63,70,0.7)', color: '#71717a' }
                      }
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* UPI QR Code Display */}
            {showUPIQR && upiQRData ? (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-bold text-white mb-2">Scan QR Code to Pay</h3>
                  <div className="bg-white p-4 rounded-xl inline-block">
                    <img
                      src={upiQRData.qrCode}
                      alt="UPI QR Code"
                      className="w-48 h-48"
                    />
                  </div>
                  <div className="mt-4 text-sm text-zinc-300">
                    <p><strong>Amount:</strong> ₹{upiQRData.amount.toFixed(2)}</p>
                    <p><strong>Order:</strong> #{upiQRData.orderNumber}</p>
                    <p><strong>UPI ID:</strong> {upiQRData.upiId}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={completeUPIPayment}
                    className="flex-1 h-11 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 4px 16px rgba(16,185,129,0.4)' }}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Payment Done
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={cancelUPIPayment}
                    className="flex-1 h-11 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', boxShadow: '0 4px 16px rgba(239,68,68,0.4)' }}
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </motion.button>
                </div>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handlePayment}
                className="w-full h-11 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2"
                style={{ background: paymentData.paymentMethod === 'online' ? 'linear-gradient(135deg,#f97316,#ea580c)' : 'linear-gradient(135deg,#10b981,#059669)', boxShadow: paymentData.paymentMethod === 'online' ? '0 4px 16px rgba(249,115,22,0.4)' : '0 4px 16px rgba(16,185,129,0.4)' }}
              >
                {paymentData.paymentMethod === 'online' ? (
                  <>
                    <DollarSign className="w-4 h-4" />
                    Pay Online
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Complete Payment
                  </>
                )}
              </motion.button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderManagement;  