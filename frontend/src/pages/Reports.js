import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { Calendar, TrendingUp, DollarSign, ShoppingBag, BarChart3 } from 'lucide-react';

const Reports = () => {
  const { api } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [categoryRevenue, setCategoryRevenue] = useState([]);
  const [orderStats, setOrderStats] = useState(null);

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        const [statsRes, salesRes, topRes, categoryRes, orderRes] = await Promise.all([
          api.get('/analytics/dashboard'),
          api.get('/analytics/sales?groupBy=day'),
          api.get('/analytics/top-items?limit=10'),
          api.get('/analytics/category-revenue'),
          api.get('/analytics/orders'),
        ]);

        setDashboardStats(statsRes.data.data);
        setSalesData(salesRes.data.data || []);
        setTopItems(topRes.data.data || []);
        setCategoryRevenue(categoryRes.data.data || []);
        setOrderStats(orderRes.data.data);
      } catch (error) {
        console.error('Failed to fetch report data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [api]);

  const pieColors = ['#f97316', '#3b82f6', '#22c55e', '#eab308', '#ec4899', '#8b5cf6'];

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload) return null;
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 shadow-lg">
        <p className="text-sm text-zinc-400 mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm font-semibold" style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number' ? `₹${entry.value.toFixed(2)}` : entry.value}
          </p>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64 bg-zinc-900" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 bg-zinc-900" />
          ))}
        </div>
        <Skeleton className="h-80 bg-zinc-900" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="reports-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-zinc-500">Business insights and performance metrics</p>
        </div>
        <Badge variant="outline" className="border-orange-500/30 text-orange-500">
          <Calendar className="h-3 w-3 mr-1" />
          Last 30 days
        </Badge>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <DollarSign className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">₹{dashboardStats?.allTime?.totalRevenue?.toFixed(2) || '0'}</p>
                  <p className="text-xs text-zinc-500">Total Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <ShoppingBag className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{dashboardStats?.allTime?.totalOrders || 0}</p>
                  <p className="text-xs text-zinc-500">Total Orders</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">₹{dashboardStats?.allTime?.avgOrderValue?.toFixed(2) || '0'}</p>
                  <p className="text-xs text-zinc-500">Avg Order Value</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">₹{dashboardStats?.month?.revenue?.toFixed(2) || '0'}</p>
                  <p className="text-xs text-zinc-500">This Month</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Tabs defaultValue="sales" className="space-y-6">
        <TabsList className="bg-zinc-900 border border-zinc-800">
          <TabsTrigger value="sales" className="data-[state=active]:bg-orange-500 data-[state=active]:text-black">
            Sales Trend
          </TabsTrigger>
          <TabsTrigger value="items" className="data-[state=active]:bg-orange-500 data-[state=active]:text-black">
            Top Items
          </TabsTrigger>
          <TabsTrigger value="categories" className="data-[state=active]:bg-orange-500 data-[state=active]:text-black">
            Categories
          </TabsTrigger>
          <TabsTrigger value="orders" className="data-[state=active]:bg-orange-500 data-[state=active]:text-black">
            Order Stats
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sales">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle>Daily Sales Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesData.slice(-30)}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis
                      dataKey="_id"
                      tick={{ fill: '#71717a', fontSize: 11 }}
                      tickFormatter={(v) => v?.slice(5) || ''}
                    />
                    <YAxis tick={{ fill: '#71717a', fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue"
                      stroke="#f97316"
                      strokeWidth={2}
                      fill="url(#revenueGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="items">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle>Top Selling Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topItems} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis type="number" tick={{ fill: '#71717a', fontSize: 11 }} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={120}
                      tick={{ fill: '#71717a', fontSize: 11 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="totalQuantity" name="Quantity" fill="#f97316" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle>Revenue by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryRevenue}
                        dataKey="totalRevenue"
                        nameKey="_id"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {categoryRevenue.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle>Category Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryRevenue.map((cat, index) => (
                    <div key={cat._id} className="flex items-center justify-between p-3 bg-zinc-950 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-4 w-4 rounded-full"
                          style={{ backgroundColor: pieColors[index % pieColors.length] }}
                        />
                        <span className="font-medium capitalize">{cat._id || 'Other'}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-orange-500">₹{cat.totalRevenue?.toFixed(2)}</p>
                        <p className="text-xs text-zinc-500">{cat.totalQuantity} items</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="orders">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle>Orders by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {orderStats?.byStatus?.map((stat) => (
                    <div key={stat._id} className="flex items-center justify-between p-3 bg-zinc-950 rounded-lg">
                      <Badge
                        className={`capitalize ${
                          stat._id === 'completed'
                            ? 'status-completed'
                            : stat._id === 'cancelled'
                            ? 'status-cancelled'
                            : 'status-pending'
                        }`}
                      >
                        {stat._id}
                      </Badge>
                      <span className="font-bold">{stat.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={orderStats?.byPayment || []}
                        dataKey="count"
                        nameKey="_id"
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        label
                      >
                        {(orderStats?.byPayment || []).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 mt-2">
                  {(orderStats?.byPayment || []).map((method, index) => (
                    <div key={method._id} className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: pieColors[index % pieColors.length] }}
                      />
                      <span className="text-xs text-zinc-400 uppercase">{method._id}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
