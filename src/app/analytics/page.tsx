"use client";

import { useEffect, useState } from "react";
import { Sidebar, Header } from "@/components/dashboard/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProtectedRoute } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/utils";
import { collection, getDocs, query, orderBy, where, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    Package,
    Truck,
    Users,
    IndianRupee,
    Calendar,
    Download,
    RefreshCw,
    ArrowUpRight,
    ArrowDownRight,
} from "lucide-react";
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    Legend,
} from "recharts";

const COLORS = ["#3B82F6", "#10B981", "#F97316", "#A855F7", "#EF4444", "#06B6D4"];

function AnalyticsContent() {
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState("7d");
    const [revenueData, setRevenueData] = useState<any[]>([]);
    const [orderStats, setOrderStats] = useState({
        total: 0,
        delivered: 0,
        pending: 0,
        cancelled: 0,
    });
    const [courierData, setCourierData] = useState<any[]>([]);
    const [cityData, setCityData] = useState<any[]>([]);

    useEffect(() => {
        loadAnalytics();
    }, [dateRange]);

    const loadAnalytics = async () => {
        setLoading(true);
        try {
            const days = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90;
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            // Load all bookings
            const bookingsSnap = await getDocs(
                query(collection(db, "bookings"), orderBy("createdAt", "desc"))
            );

            const bookings = bookingsSnap.docs.map((doc) => ({
                ...doc.data(),
                id: doc.id,
                createdAt: doc.data().createdAt?.toDate?.() || new Date(),
            }));

            // Calculate order stats
            setOrderStats({
                total: bookings.length,
                delivered: bookings.filter((b: any) => b.status === "delivered").length,
                pending: bookings.filter((b: any) => b.status === "pending").length,
                cancelled: bookings.filter((b: any) => b.status === "cancelled").length,
            });

            // Revenue by date
            const revenueByDate: Record<string, { revenue: number; orders: number }> = {};
            bookings.forEach((b: any) => {
                const date = new Date(b.createdAt);
                if (date >= startDate) {
                    const key = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                    if (!revenueByDate[key]) {
                        revenueByDate[key] = { revenue: 0, orders: 0 };
                    }
                    revenueByDate[key].revenue += b.amount || 0;
                    revenueByDate[key].orders += 1;
                }
            });
            setRevenueData(
                Object.entries(revenueByDate).map(([date, data]) => ({
                    date,
                    revenue: data.revenue,
                    orders: data.orders,
                }))
            );

            // Courier breakdown
            const courierCount: Record<string, number> = {};
            bookings.forEach((b: any) => {
                const courier = b.selectedCourier || b.courier || "Unknown";
                courierCount[courier] = (courierCount[courier] || 0) + 1;
            });
            setCourierData(
                Object.entries(courierCount).map(([name, value]) => ({ name, value }))
            );

            // City breakdown
            const cityCount: Record<string, number> = {};
            bookings.forEach((b: any) => {
                const city = b.receiverDetails?.city || b.deliveryCity || "Unknown";
                cityCount[city] = (cityCount[city] || 0) + 1;
            });
            setCityData(
                Object.entries(cityCount)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 8)
                    .map(([name, value]) => ({ name, value }))
            );
        } catch (error) {
            console.error("Error loading analytics:", error);
        } finally {
            setLoading(false);
        }
    };

    const totalRevenue = revenueData.reduce((sum, d) => sum + d.revenue, 0);
    const totalOrders = revenueData.reduce((sum, d) => sum + d.orders, 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar />
            <div className="lg:pl-64">
                <Header />
                <main className="p-4 lg:p-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
                            <p className="text-sm text-gray-500">Performance insights and trends</p>
                        </div>
                        <div className="flex gap-2">
                            <div className="flex bg-gray-100 rounded-lg p-1">
                                {["7d", "30d", "90d"].map((range) => (
                                    <Button
                                        key={range}
                                        variant={dateRange === range ? "default" : "ghost"}
                                        size="sm"
                                        onClick={() => setDateRange(range)}
                                    >
                                        {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : "90 Days"}
                                    </Button>
                                ))}
                            </div>
                            <Button variant="outline" onClick={loadAnalytics}>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Refresh
                            </Button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center h-96">
                            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <>
                            {/* KPI Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <Card>
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-gray-500">Total Revenue</p>
                                                <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
                                                <p className="text-xs text-green-600 flex items-center mt-1">
                                                    <ArrowUpRight className="h-3 w-3" /> +12.5%
                                                </p>
                                            </div>
                                            <IndianRupee className="h-8 w-8 text-green-500" />
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-gray-500">Total Orders</p>
                                                <p className="text-2xl font-bold">{totalOrders}</p>
                                                <p className="text-xs text-green-600 flex items-center mt-1">
                                                    <ArrowUpRight className="h-3 w-3" /> +8.2%
                                                </p>
                                            </div>
                                            <Package className="h-8 w-8 text-blue-500" />
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-gray-500">Avg Order Value</p>
                                                <p className="text-2xl font-bold">{formatCurrency(avgOrderValue)}</p>
                                                <p className="text-xs text-green-600 flex items-center mt-1">
                                                    <ArrowUpRight className="h-3 w-3" /> +4.1%
                                                </p>
                                            </div>
                                            <TrendingUp className="h-8 w-8 text-purple-500" />
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-gray-500">Delivery Rate</p>
                                                <p className="text-2xl font-bold">
                                                    {orderStats.total > 0
                                                        ? ((orderStats.delivered / orderStats.total) * 100).toFixed(1)
                                                        : 0}
                                                    %
                                                </p>
                                                <p className="text-xs text-green-600 flex items-center mt-1">
                                                    <ArrowUpRight className="h-3 w-3" /> +2.3%
                                                </p>
                                            </div>
                                            <Truck className="h-8 w-8 text-orange-500" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Charts Row 1 */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                                {/* Revenue Chart */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Revenue Trend</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-72">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={revenueData}>
                                                    <defs>
                                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                                    <YAxis tick={{ fontSize: 12 }} />
                                                    <Tooltip
                                                        formatter={(value: number | undefined) => [formatCurrency(value ?? 0), "Revenue"]}
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="revenue"
                                                        stroke="#3B82F6"
                                                        fill="url(#colorRevenue)"
                                                        strokeWidth={2}
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Orders Chart */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Orders Trend</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-72">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={revenueData}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                                    <YAxis tick={{ fontSize: 12 }} />
                                                    <Tooltip />
                                                    <Bar dataKey="orders" fill="#10B981" radius={[4, 4, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Charts Row 2 */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Courier Breakdown */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Orders by Courier</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-72">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={courierData}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={60}
                                                        outerRadius={100}
                                                        dataKey="value"
                                                        label={({ name, percent }) =>
                                                            `${name} ${(((percent ?? 0) * 100)).toFixed(0)}%`
                                                        }
                                                    >
                                                        {courierData.map((_, index) => (
                                                            <Cell
                                                                key={`cell-${index}`}
                                                                fill={COLORS[index % COLORS.length]}
                                                            />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Top Cities */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Top Delivery Cities</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-72">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={cityData} layout="vertical">
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                    <XAxis type="number" tick={{ fontSize: 12 }} />
                                                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                                                    <Tooltip />
                                                    <Bar dataKey="value" fill="#F97316" radius={[0, 4, 4, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}

export default function AnalyticsPage() {
    return (
        <ProtectedRoute>
            <AnalyticsContent />
        </ProtectedRoute>
    );
}
