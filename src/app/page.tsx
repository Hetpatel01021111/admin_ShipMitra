"use client";

import { useEffect, useState } from "react";
import { Sidebar, Header } from "@/components/dashboard/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardMetrics, MetricCard } from "@/components/dashboard/metrics";
import { RecentOrders } from "@/components/dashboard/recent-orders";
import { ProtectedRoute, useAuth } from "@/lib/auth";
import {
  subscribeToDashboardMetrics,
  subscribeToOrders,
  getRevenueData,
  getOrderStatusCounts
} from "@/lib/data";
import { DashboardMetrics as DashboardMetricsType, Order } from "@/types";
import {
  LineChart,
  Line,
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
// Blue (In Transit), Green (Delivered), Orange (Pending), Purple (Cancelled)
const COLORS = ["#3B82F6", "#10B981", "#F97316", "#A855F7"];

function DashboardContent() {
  const { adminUser } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetricsType | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

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

    // Fetch chart data
    const fetchChartData = async () => {
      const [revenue, status] = await Promise.all([
        getRevenueData(7),
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
  }, []);

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

  // Fallback chart data
  const displayRevenueData = revenueData.length > 0 ? revenueData : [
    { date: "Jan 1", revenue: 45000 },
    { date: "Jan 2", revenue: 52000 },
    { date: "Jan 3", revenue: 68000 },
    { date: "Jan 4", revenue: 48000 },
    { date: "Jan 5", revenue: 75000 },
    { date: "Jan 6", revenue: 71000 },
    { date: "Jan 7", revenue: 95000 },
  ];

  // Order: In Transit, Delivered, Pending, Cancelled (matching COLORS array)
  const displayStatusData = statusData.length > 0 ? statusData.filter(s => s.value > 0) : [
    { name: "In Transit", value: 35 },
    { name: "Delivered", value: 142 },
    { name: "Pending", value: 18 },
    { name: "Cancelled", value: 5 },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar />

      <div className="lg:pl-64">
        <Header />

        <main className="p-6 lg:p-8">
          {/* Welcome header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
            <p className="text-gray-500 mt-1">
              Welcome back, {adminUser?.name || "Admin"}! Here&apos;s what&apos;s happening today.
            </p>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricCard
              title="Today's Orders"
              value={displayMetrics.todayOrders}
              change={ordersChange}
              icon={<Package className="h-6 w-6 text-blue-600" />}
              trend={ordersChange.startsWith("+") ? "up" : "down"}
            />
            <MetricCard
              title="Today's Revenue"
              value={formatCurrency(displayMetrics.todayRevenue)}
              change={revenueChange}
              icon={<IndianRupee className="h-6 w-6 text-green-600" />}
              trend={revenueChange.startsWith("+") ? "up" : "down"}
            />
            <MetricCard
              title="Active Riders"
              value={displayMetrics.activeRiders}
              change={ridersChange}
              icon={<Truck className="h-6 w-6 text-orange-600" />}
              trend="up"
            />
            <MetricCard
              title="Pending Orders"
              value={displayMetrics.pendingOrders}
              change={pendingChange}
              icon={<Clock className="h-6 w-6 text-red-600" />}
              trend={pendingChange.startsWith("-") ? "up" : "down"}
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Revenue Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Weekly Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={displayRevenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip
                        formatter={(value: number | undefined) => [formatCurrency(value ?? 0), "Revenue"]}
                        contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#10B981"
                        strokeWidth={3}
                        dot={{ fill: "#10B981", strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
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
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={displayStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={activeIndex !== null ? 75 : 70}
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
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {displayStatusData.slice(0, 4).map((status, index) => (
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
              </CardContent>
            </Card>
          </div>

          {/* Recent Orders */}
          <RecentOrders orders={recentOrders} />
        </main>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
