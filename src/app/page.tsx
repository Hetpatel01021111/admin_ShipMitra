"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Sidebar, Header } from "@/components/dashboard/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardMetrics, MetricCard } from "@/components/dashboard/metrics";
import { RecentOrders } from "@/components/dashboard/recent-orders";
import { cn } from "@/lib/utils";
import { ProtectedRoute, useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  subscribeToDashboardMetrics,
  subscribeToOrders,
  getRevenueData,
  getOrderStatusCounts
} from "@/lib/data";
import { DashboardMetrics as DashboardMetricsType, Order } from "@/types";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Package, IndianRupee, Truck, Clock, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

// Chart colors - Match metric card colors
const COLORS = ["#3B82F6", "#10B981", "#F97316", "#A855F7", "#EF4444", "#06B6D4", "#EAB308"];

function DashboardContent() {
  const { adminUser } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetricsType | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // State for duration filtering
  const [dateRange, setDateRange] = useState<number | 'custom'>(7);
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);

  // Derive active date boundaries
  const activeStartDate = dateRange === 'custom' ? customStartDate : new Date(new Date().setDate(new Date().getDate() - (dateRange as number)));
  const activeEndDate = dateRange === 'custom' ? customEndDate : new Date();

  useEffect(() => {
    // Subscribe to real-time metrics
    const unsubscribeMetrics = subscribeToDashboardMetrics((data) => {
      setMetrics(data);
      setLoading(false);
    });

    // Subscribe to real-time orders
    const unsubscribeOrders = subscribeToOrders((orders) => {
      setRecentOrders(orders.slice(0, 5));
    }, { limitCount: 10 });

    // Fetch chart data based on selected range
    const fetchChartData = async () => {
      // Create dateRange duration in days for getRevenueData if not custom
      const rangeInDays = dateRange === 'custom'
        ? ((customEndDate?.getTime() || 0) - (customStartDate?.getTime() || 0)) / (1000 * 3600 * 24) || 7
        : (dateRange as number);

      const [revenue, status] = await Promise.all([
        getRevenueData(Math.max(1, Math.round(rangeInDays))), // Pass approximate days to getRevenueData
        getOrderStatusCounts(),
      ]);
      setRevenueData(revenue);
      setStatusData(status);
    };

    fetchChartData();

    return () => {
      unsubscribeMetrics();
      unsubscribeOrders();
    };
  }, [dateRange]);

  // Metric titles based on duration
  const periodLabel = dateRange === 7 ? "Week" : dateRange === 30 ? "Month" : dateRange === 90 ? "Quarter" : "Selected Period";
  const periodShortLabel = dateRange === 7 ? "Week's" : dateRange === 30 ? "Month's" : dateRange === 90 ? "Quarter's" : "Selected";

  // Fallback data if no real data
  const displayMetrics = metrics || {
    totalOrders: 0,
    todayOrders: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    todayRevenue: 0,
    totalRevenue: 0,
    activeRiders: 0,
    totalCustomers: 0,
    ordersChange: "0%",
    revenueChange: "0%",
    ridersChange: "0",
    pendingChange: "0%",
  };

  const ordersChange = displayMetrics.ordersChange ?? "0%";
  const revenueChange = displayMetrics.revenueChange ?? "0%";
  const ridersChange = displayMetrics.ridersChange ?? "0";
  const pendingChange = displayMetrics.pendingChange ?? "0%";

  const displayRevenueData = revenueData;
  const hasRevenueData = displayRevenueData.length > 0;

  // Order: In Transit, Delivered, Pending, Cancelled (matching COLORS array)
  const displayStatusData = statusData.filter((s) => s.value > 0);
  const hasStatusData = displayStatusData.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EFF6FF] via-[#E0E7FF] to-[#DBEAFE]">
      <Sidebar />

      <div className="lg:pl-64">
        <Header />

        <main className="p-6 lg:p-8">
          {/* Welcome header & Filters */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-blue-950">Dashboard Overview</h1>
              <p className="text-blue-800/80 mt-1 font-medium">
                Welcome back, {adminUser?.name || "Admin"}! Here&apos;s what&apos;s happening today.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex bg-white rounded-lg p-1 border border-gray-200 shadow-sm w-fit self-end">
                {[
                  { label: "7 Days", value: 7 },
                  { label: "30 Days", value: 30 },
                  { label: "90 Days", value: 90 },
                  { label: "Custom", value: 'custom' },
                ].map((range) => (
                  <Button
                    key={range.value}
                    variant={dateRange === range.value ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setDateRange(range.value as any)}
                    className={cn(
                      "rounded-lg font-medium transition-all duration-200",
                      dateRange === range.value
                        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20"
                        : "text-blue-800 hover:text-blue-950 hover:bg-blue-50"
                    )}
                  >
                    {range.label}
                  </Button>
                ))}
              </div>

              {dateRange === 'custom' && (
                <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200 shadow-sm self-end">
                  <input
                    type="date"
                    className="text-sm border-none outline-none bg-transparent"
                    value={customStartDate ? format(customStartDate, 'yyyy-MM-dd') : ''}
                    min="2026-01-08"
                    max={format(new Date(), 'yyyy-MM-dd')}
                    onChange={(e) => setCustomStartDate(e.target.value ? new Date(e.target.value) : undefined)}
                  />
                  <span className="text-gray-400">to</span>
                  <input
                    type="date"
                    className="text-sm border-none outline-none bg-transparent"
                    value={customEndDate ? format(customEndDate, 'yyyy-MM-dd') : ''}
                    min="2026-01-08"
                    max={format(new Date(), 'yyyy-MM-dd')}
                    onChange={(e) => setCustomEndDate(e.target.value ? new Date(e.target.value) : undefined)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricCard
              title={`${periodShortLabel} Orders`}
              value={displayMetrics.todayOrders}
              change={displayMetrics.ordersChange || ""}
              icon={<Package className="h-6 w-6 text-blue-600" />}
              trend={displayMetrics.ordersChange?.startsWith("+") || displayMetrics.ordersChange?.startsWith("0") ? "up" : "down"}
              loading={loading}
            />
            <MetricCard
              title={`${periodShortLabel} Revenue`}
              value={formatCurrency(displayMetrics.todayRevenue)}
              change={displayMetrics.revenueChange || ""}
              icon={<IndianRupee className="h-6 w-6 text-green-600" />}
              trend={displayMetrics.revenueChange?.startsWith("+") || displayMetrics.revenueChange?.startsWith("0") ? "up" : "down"}
              loading={loading}
            />
            <MetricCard
              title="Active Riders"
              value={displayMetrics.activeRiders}
              change={displayMetrics.ridersChange || ""}
              icon={<Truck className="h-6 w-6 text-orange-600" />}
              trend="up"
              loading={loading}
            />
            <MetricCard
              title="Pending Orders"
              value={displayMetrics.pendingOrders}
              change={displayMetrics.pendingChange || ""}
              icon={<Clock className="h-6 w-6 text-red-600" />}
              trend={displayMetrics.pendingChange?.startsWith("-") || displayMetrics.pendingChange?.startsWith("0") ? "up" : "down"}
              loading={loading}
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Revenue Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Revenue Analytics ({periodLabel})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  {loading ? (
                    <div className="flex items-center justify-center h-full text-gray-500 text-sm gap-2">
                      <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Loading revenue data...
                    </div>
                  ) : hasRevenueData ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={displayRevenueData}>
                        <defs>
                          <linearGradient id="colorRevenueGraph" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                        <XAxis dataKey="date" stroke="#6b7280" tickLine={false} axisLine={false} />
                        <YAxis stroke="#6b7280" tickLine={false} axisLine={false} />
                        <Tooltip
                          formatter={(value: number | undefined) => [formatCurrency(value ?? 0), "Revenue"]}
                          contentStyle={{ background: "#1f2937", border: "none", borderRadius: "12px", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)", color: "#fff" }}
                          itemStyle={{ color: "#fff" }}
                        />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke="#10B981"
                          strokeWidth={3}
                          fill="url(#colorRevenueGraph)"
                          activeDot={{ r: 6, fill: "#10B981", stroke: "#fff", strokeWidth: 2 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                      No revenue data available yet.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Status Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Order Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  {loading ? (
                    <div className="flex items-center justify-center h-full text-gray-500 text-sm gap-2">
                      <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Loading statuses...
                    </div>
                  ) : hasStatusData ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={displayStatusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={activeIndex !== null ? 80 : 75}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(((percent ?? 0) * 100)).toFixed(0)}%`}
                          labelLine={false}
                          onMouseEnter={(_, index) => setActiveIndex(index)}
                          onMouseLeave={() => setActiveIndex(null)}
                        >
                          {displayStatusData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                              style={{
                                filter: activeIndex === index ? 'brightness(1.2)' : 'brightness(1)',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                              }}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: "#1f2937",
                            border: "none",
                            borderRadius: "8px",
                            color: "#fff",
                            fontWeight: "600"
                          }}
                          itemStyle={{ color: "#fff" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                      No order status data available yet.
                    </div>
                  )}
                </div>
                {loading ? null : hasStatusData && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2">
                    {displayStatusData.map((status, index) => (
                      <div
                        key={status.name}
                        className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors"
                        onMouseEnter={() => setActiveIndex(index)}
                        onMouseLeave={() => setActiveIndex(null)}
                      >
                        <div
                          className="w-3 h-3 rounded-full transition-transform"
                          style={{
                            backgroundColor: COLORS[index],
                            transform: activeIndex === index ? 'scale(1.3)' : 'scale(1)'
                          }}
                        />
                        <span
                          className={`text-sm truncate transition-all font-medium ${activeIndex === index ? 'font-bold' : ''}`}
                          style={{
                            color: COLORS[index],
                            opacity: activeIndex === index ? 1 : 0.85
                          }}
                        >
                          {status.name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Orders */}
          <RecentOrders orders={recentOrders} />
        </main>
      </div >
    </div >
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
