import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
  Package,
  AlertTriangle,
  Sparkles,
  Send,
  UtensilsCrossed,
  Clock,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

const AIInsights = () => {
  const { api } = useAuth();
  const [loading, setLoading] = useState(true);
  const [salesPrediction, setSalesPrediction] = useState(null);
  const [inventoryForecast, setInventoryForecast] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [assistantQuery, setAssistantQuery] = useState('');
  const [assistantResponse, setAssistantResponse] = useState(null);
  const [assistantLoading, setAssistantLoading] = useState(false);

  useEffect(() => {
    const fetchAIData = async () => {
      try {
        const [salesRes, inventoryRes, recsRes] = await Promise.all([
          api.get('/ai/sales-prediction?days=30'),
          api.get('/ai/inventory-forecast?days=7'),
          api.post('/ai/food-recommendations', { orderItems: [] }),
        ]);

        setSalesPrediction(salesRes.data.data);
        setInventoryForecast(inventoryRes.data.data);
        setRecommendations(recsRes.data.data);
      } catch (error) {
        console.error('AI data fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAIData();
  }, [api]);

  const handleAssistantQuery = async () => {
    if (!assistantQuery.trim()) return;

    setAssistantLoading(true);
    try {
      const response = await api.post('/ai/assistant', { question: assistantQuery });
      setAssistantResponse(response.data.data);
    } catch (error) {
      toast.error('Failed to get response');
    } finally {
      setAssistantLoading(false);
    }
  };

  const TrendIcon = ({ trend }) => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-zinc-500" />;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64 bg-zinc-900" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 bg-zinc-900" />
          ))}
        </div>
        <Skeleton className="h-80 bg-zinc-900" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="ai-insights-page">
      <div className="flex items-center gap-3">
        <Brain className="h-8 w-8 text-orange-500" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Insights</h1>
          <p className="text-zinc-500">Smart analytics powered by rule-based AI</p>
        </div>
      </div>

      <Tabs defaultValue="predictions" className="space-y-6">
        <TabsList className="bg-zinc-900 border border-zinc-800">
          <TabsTrigger value="predictions" className="data-[state=active]:bg-orange-500 data-[state=active]:text-black">
            Sales Prediction
          </TabsTrigger>
          <TabsTrigger value="inventory" className="data-[state=active]:bg-orange-500 data-[state=active]:text-black">
            Inventory Forecast
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="data-[state=active]:bg-orange-500 data-[state=active]:text-black">
            Recommendations
          </TabsTrigger>
          <TabsTrigger value="assistant" className="data-[state=active]:bg-orange-500 data-[state=active]:text-black">
            AI Assistant
          </TabsTrigger>
        </TabsList>

        {/* Sales Predictions */}
        <TabsContent value="predictions">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-zinc-500 text-sm">Avg Daily Orders</span>
                    <TrendIcon trend={salesPrediction?.trend?.direction} />
                  </div>
                  <p className="text-3xl font-bold font-mono">{salesPrediction?.historicalAverage?.dailyOrders || 0}</p>
                  <p className="text-xs text-zinc-500 mt-1">Based on 30-day analysis</p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-zinc-500 text-sm">Avg Daily Revenue</span>
                    <TrendIcon trend={salesPrediction?.trend?.direction} />
                  </div>
                  <p className="text-3xl font-bold font-mono text-orange-500">
                    ₹{salesPrediction?.historicalAverage?.dailyRevenue || 0}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Trend: {salesPrediction?.trend?.percentage || 0}%
                  </p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-zinc-500 text-sm">Monthly Prediction</span>
                    <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                      {salesPrediction?.monthlyPrediction?.confidence || 0}% confidence
                    </Badge>
                  </div>
                  <p className="text-3xl font-bold font-mono text-green-500">
                    ₹{salesPrediction?.monthlyPrediction?.predictedRevenue || 0}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    ~{salesPrediction?.monthlyPrediction?.predictedOrders || 0} orders
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-orange-500" />
                7-Day Sales Forecast
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesPrediction?.dailyPredictions || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="dayOfWeek" tick={{ fill: '#71717a', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#71717a', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        background: '#18181b',
                        border: '1px solid #27272a',
                        borderRadius: '8px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="predictedRevenue"
                      name="Predicted Revenue"
                      stroke="#f97316"
                      strokeWidth={2}
                      dot={{ fill: '#f97316', strokeWidth: 2 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="predictedOrders"
                      name="Predicted Orders"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory Forecast */}
        <TabsContent value="inventory">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardContent className="p-4 flex items-center gap-3">
                <Package className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{inventoryForecast?.summary?.totalItems || 0}</p>
                  <p className="text-xs text-zinc-500">Total Items</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900/50 border-red-500/30">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-red-500" />
                <div>
                  <p className="text-2xl font-bold text-red-500">{inventoryForecast?.summary?.criticalCount || 0}</p>
                  <p className="text-xs text-zinc-500">Critical</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900/50 border-yellow-500/30">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold text-yellow-500">{inventoryForecast?.summary?.warningCount || 0}</p>
                  <p className="text-xs text-zinc-500">Warning</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900/50 border-green-500/30">
              <CardContent className="p-4 flex items-center gap-3">
                <Package className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-green-500">{inventoryForecast?.summary?.healthyCount || 0}</p>
                  <p className="text-xs text-zinc-500">Healthy</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {inventoryForecast?.criticalAlerts?.length > 0 && (
            <Card className="bg-red-500/5 border-red-500/20 mb-6">
              <CardHeader>
                <CardTitle className="text-red-500 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Critical Alerts - Immediate Action Required
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {inventoryForecast.criticalAlerts.map((item) => (
                    <div key={item.id} className="p-4 bg-zinc-900 rounded-lg border border-red-500/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">{item.name}</span>
                        <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
                          {item.daysUntilEmpty} days left
                        </Badge>
                      </div>
                      <div className="text-sm text-zinc-400 space-y-1">
                        <p>Current: {item.currentStock} {item.unit}</p>
                        <p>Daily usage: {item.dailyUsage} {item.unit}</p>
                        <p className="text-orange-500">Restock: +{item.recommendedRestockQuantity} {item.unit}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle>Stock Levels Forecast</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={inventoryForecast?.forecasts?.slice(0, 10) || []} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis type="number" tick={{ fill: '#71717a', fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fill: '#71717a', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        background: '#18181b',
                        border: '1px solid #27272a',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="currentStock" name="Current Stock" fill="#f97316" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Food Recommendations */}
        <TabsContent value="recommendations">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Trending This Week
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recommendations?.trending?.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-zinc-950 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="h-8 w-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500 font-bold">
                          {index + 1}
                        </span>
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <Badge variant="outline" className="border-green-500/30 text-green-500">
                        {item.count} orders
                      </Badge>
                    </div>
                  ))}
                  {(!recommendations?.trending || recommendations.trending.length === 0) && (
                    <p className="text-center text-zinc-500 py-4">No trending data available</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  Time-Based Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-sm text-blue-400">
                    Category: <span className="font-semibold capitalize">{recommendations?.timeBasedSuggestions?.category}</span>
                  </p>
                  <p className="text-xs text-zinc-500">{recommendations?.timeBasedSuggestions?.reason}</p>
                </div>
                <div className="space-y-2">
                  {recommendations?.timeBasedSuggestions?.items?.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-zinc-950 rounded-lg">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-orange-500 font-semibold">₹{item.price}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/50 border-zinc-800 lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UtensilsCrossed className="h-5 w-5 text-orange-500" />
                  Popular by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {recommendations?.popularByCategory?.map((cat) => (
                    <div key={cat.category} className="p-4 bg-zinc-950 rounded-lg">
                      <h4 className="font-semibold capitalize mb-3">{cat.category || 'Other'}</h4>
                      <div className="space-y-2">
                        {cat.topItems?.slice(0, 3).map((item, idx) => (
                          <div key={item.id || idx} className="flex items-center justify-between text-sm">
                            <span className="text-zinc-400">{item.name}</span>
                            <span className="text-orange-500">₹{item.price}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AI Assistant */}
        <TabsContent value="assistant">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-orange-500" />
                AI Assistant
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-zinc-950 rounded-lg border border-zinc-800">
                  <p className="text-sm text-zinc-400 mb-3">Try asking:</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Today's sales",
                      "Low stock items",
                      "Top selling items",
                      "Active orders",
                      "Free tables",
                      "Monthly revenue"
                    ].map((q) => (
                      <Button
                        key={q}
                        size="sm"
                        variant="outline"
                        className="border-zinc-700 text-xs"
                        onClick={() => setAssistantQuery(q)}
                      >
                        {q}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Input
                    value={assistantQuery}
                    onChange={(e) => setAssistantQuery(e.target.value)}
                    placeholder="Ask me anything about your restaurant..."
                    className="bg-zinc-950 border-zinc-800"
                    onKeyPress={(e) => e.key === 'Enter' && handleAssistantQuery()}
                  />
                  <Button
                    onClick={handleAssistantQuery}
                    disabled={assistantLoading || !assistantQuery.trim()}
                    className="bg-orange-500 hover:bg-orange-600 text-black"
                  >
                    {assistantLoading ? (
                      <div className="h-4 w-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {assistantResponse && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-zinc-950 rounded-lg border border-orange-500/20"
                  >
                    <p className="text-sm text-zinc-500 mb-2">Q: {assistantResponse.question}</p>
                    <p className="font-medium text-lg">{assistantResponse.answer}</p>
                  </motion.div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIInsights;
