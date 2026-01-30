import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import {
  DollarSign,
  ShoppingBag,
  Clock,
  TrendingUp,
  UtensilsCrossed,
  Users,
  Package,
  AlertTriangle,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Dashboard = () => {
  const { api, user } = useAuth();
  const [stats, setStats] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [tableStats, setTableStats] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, salesRes, topItemsRes, tableRes, inventoryRes] = await Promise.all([
          api.get('/analytics/dashboard'),
          api.get('/analytics/sales?groupBy=day'),
          api.get('/analytics/top-items?limit=5'),
          api.get('/tables/stats'),
          api.get('/inventory/low-stock'),
        ]);

        setStats(statsRes.data.data);
        setSalesData(salesRes.data.data || []);
        setTopItems(topItemsRes.data.data || []);
        setTableStats(tableRes.data.data);
        setLowStock(inventoryRes.data.data || []);
      } catch (error) {
        console.error('Dashboard fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [api]);

  const StatCard = ({ title, value, icon: Icon, trend, color = 'orange' }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500 uppercase tracking-wider">{title}</p>
              <p className="text-3xl font-bold mt-1">{value}</p>
              {trend !== undefined && (
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className={`h-4 w-4 ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                  <span className={`text-sm ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
            <div className={`h-14 w-14 rounded-lg bg-${color}-500/10 flex items-center justify-center`}>
              <Icon className={`h-7 w-7 text-${color}-500`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const pieColors = ['#f97316', '#ea580c', '#fb923c', '#fdba74', '#52525b'];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 bg-zinc-900" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80 lg:col-span-2 bg-zinc-900" />
          <Skeleton className="h-80 bg-zinc-900" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-zinc-500">Welcome back, {user?.name}</p>
        </div>
        <Badge variant="outline" className="border-orange-500/30 text-orange-500">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Today's Revenue"
          value={`₹${stats?.today?.revenue?.toFixed(2) || '0.00'}`}
          icon={DollarSign}
        />
        <StatCard
          title="Today's Orders"
          value={stats?.today?.orders || 0}
          icon={ShoppingBag}
          color="blue"
        />
        <StatCard
          title="Active Orders"
          value={stats?.today?.activeOrders || 0}
          icon={Clock}
          color="yellow"
        />
        <StatCard
          title="Monthly Revenue"
          value={`₹${stats?.month?.revenue?.toFixed(2) || '0.00'}`}
          icon={TrendingUp}
          color="green"
        />
      </div>

      {/* Charts & Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg">Sales Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesData.slice(-14)}>
                    <defs>
                      <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis 
                      dataKey="_id" 
                      tick={{ fill: '#71717a', fontSize: 12 }}
                      tickFormatter={(value) => value?.slice(5) || ''}
                    />
                    <YAxis tick={{ fill: '#71717a', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        background: '#18181b',
                        border: '1px solid #27272a',
                        borderRadius: '8px',
                      }}
                      labelStyle={{ color: '#fafafa' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#f97316"
                      strokeWidth={2}
                      fill="url(#salesGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-zinc-900/50 border-zinc-800 h-full">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <UtensilsCrossed className="h-5 w-5 text-orange-500" />
                Top Selling Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topItems.length === 0 ? (
                  <p className="text-zinc-500 text-sm text-center py-4">No data available</p>
                ) : (
                  topItems.map((item, index) => (
                    <div key={item._id || index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="h-8 w-8 rounded-md bg-orange-500/10 flex items-center justify-center text-orange-500 font-bold text-sm">
                          {index + 1}
                        </span>
                        <span className="text-sm font-medium truncate max-w-[120px]">{item.name}</span>
                      </div>
                      <Badge variant="outline" className="border-zinc-700">
                        {item.totalQuantity} sold
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                Table Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Free', value: tableStats?.free || 0 },
                        { name: 'Occupied', value: tableStats?.occupied || 0 },
                        { name: 'Reserved', value: tableStats?.reserved || 0 },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                      labelLine={false}
                    >
                      {['#22c55e', '#f97316', '#3b82f6'].map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: '#18181b',
                        border: '1px solid #27272a',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-2">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                  <span className="text-xs text-zinc-400">Free</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-orange-500" />
                  <span className="text-xs text-zinc-400">Occupied</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-blue-500" />
                  <span className="text-xs text-zinc-400">Reserved</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Low Stock Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2"
        >
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Low Stock Alerts
                {lowStock.length > 0 && (
                  <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                    {lowStock.length}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lowStock.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-500">All inventory levels are healthy</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {lowStock.slice(0, 6).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-zinc-500">{item.category}</p>
                      </div>
                      <Badge variant="destructive" className="bg-red-500/10 text-red-500 border-red-500/20">
                        {item.quantity} {item.unit}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
