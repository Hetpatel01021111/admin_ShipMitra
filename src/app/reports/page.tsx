"use client";

import { useEffect, useState } from "react";
import { Sidebar, Header } from "@/components/dashboard/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ProtectedRoute } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/utils";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
    FileText,
    Download,
    Calendar,
    RefreshCw,
    TrendingUp,
    Package,
    Truck,
    Users,
    BarChart3,
    FileSpreadsheet,
    Printer,
} from "lucide-react";

interface ReportData {
    orders: any[];
    riders: any[];
    customers: any[];
}

function ReportsContent() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<ReportData>({ orders: [], riders: [], customers: [] });
    const [dateFrom, setDateFrom] = useState(
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    );
    const [dateTo, setDateTo] = useState(new Date().toISOString().split("T")[0]);
    const [selectedReport, setSelectedReport] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [ordersSnap, ridersSnap, customersSnap] = await Promise.all([
                getDocs(query(collection(db, "bookings"), orderBy("createdAt", "desc"))),
                getDocs(collection(db, "riders")),
                getDocs(collection(db, "users")),
            ]);

            setData({
                orders: ordersSnap.docs.map((d) => ({
                    id: d.id,
                    ...d.data(),
                    createdAt: d.data().createdAt?.toDate?.() || new Date(),
                })),
                riders: ridersSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
                customers: customersSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
            });
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setLoading(false);
        }
    };

    const filterByDateRange = (items: any[]) => {
        const from = new Date(dateFrom);
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        return items.filter((item) => {
            const date = new Date(item.createdAt);
            return date >= from && date <= to;
        });
    };

    const filteredOrders = filterByDateRange(data.orders);

    const reportTypes = [
        {
            id: "orders",
            title: "Orders Report",
            description: "Complete list of all orders with details",
            icon: Package,
            color: "bg-blue-500",
            count: filteredOrders.length,
        },
        {
            id: "revenue",
            title: "Revenue Report",
            description: "Revenue and payment analysis",
            icon: TrendingUp,
            color: "bg-green-500",
            count: formatCurrency(filteredOrders.reduce((sum, o) => sum + (o.amount || 0), 0)),
        },
        {
            id: "delivery",
            title: "Delivery Performance",
            description: "Delivery status and performance metrics",
            icon: Truck,
            color: "bg-orange-500",
            count: `${filteredOrders.filter((o) => o.status === "delivered").length} Delivered`,
        },
        {
            id: "customers",
            title: "Customer Report",
            description: "Customer data and order history",
            icon: Users,
            color: "bg-purple-500",
            count: data.customers.length,
        },
        {
            id: "riders",
            title: "Riders Report",
            description: "Rider performance and earnings",
            icon: Truck,
            color: "bg-cyan-500",
            count: data.riders.length,
        },
        {
            id: "courier",
            title: "Courier Analysis",
            description: "Performance by courier partner",
            icon: BarChart3,
            color: "bg-pink-500",
            count: "All Couriers",
        },
    ];

    const downloadCSV = (reportId: string) => {
        let csvContent = "";
        let filename = "";

        if (reportId === "orders") {
            filename = `orders_report_${dateFrom}_to_${dateTo}.csv`;
            csvContent =
                "Order ID,Customer,Phone,Route,Courier,Amount,Status,Date\n";
            filteredOrders.forEach((o) => {
                csvContent += `${o.orderId || o.id},${o.senderDetails?.name || o.customerName || ""},${o.senderDetails?.phone || ""},${o.senderDetails?.city || ""} to ${o.receiverDetails?.city || ""},${o.selectedCourier || o.courier || ""},${o.amount || 0},${o.status || ""},${formatDate(o.createdAt)}\n`;
            });
        } else if (reportId === "revenue") {
            filename = `revenue_report_${dateFrom}_to_${dateTo}.csv`;
            csvContent = "Date,Orders,Revenue,Avg Order Value\n";
            const byDate: Record<string, { orders: number; revenue: number }> = {};
            filteredOrders.forEach((o) => {
                const date = formatDate(o.createdAt);
                if (!byDate[date]) byDate[date] = { orders: 0, revenue: 0 };
                byDate[date].orders++;
                byDate[date].revenue += o.amount || 0;
            });
            Object.entries(byDate).forEach(([date, d]) => {
                csvContent += `${date},${d.orders},${d.revenue},${(d.revenue / d.orders).toFixed(2)}\n`;
            });
        } else if (reportId === "customers") {
            filename = `customers_report.csv`;
            csvContent = "Name,Email,Phone,Total Orders,Created\n";
            data.customers.forEach((c: any) => {
                csvContent += `${c.name || ""},${c.email || ""},${c.phone || ""},${c.totalOrders || 0},${formatDate(c.createdAt)}\n`;
            });
        }

        if (csvContent) {
            const blob = new Blob([csvContent], { type: "text/csv" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            a.click();
            window.URL.revokeObjectURL(url);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar />
            <div className="lg:pl-64">
                <Header />
                <main className="p-4 lg:p-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
                            <p className="text-sm text-gray-500">Generate and download reports</p>
                        </div>
                        <Button variant="outline" onClick={loadData}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh Data
                        </Button>
                    </div>

                    {/* Date Range */}
                    <Card className="mb-6">
                        <CardContent className="p-4">
                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-gray-500" />
                                    <span className="text-sm font-medium">Date Range:</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="date"
                                        value={dateFrom}
                                        onChange={(e) => setDateFrom(e.target.value)}
                                        className="w-40"
                                    />
                                    <span className="text-gray-500">to</span>
                                    <Input
                                        type="date"
                                        value={dateTo}
                                        onChange={(e) => setDateTo(e.target.value)}
                                        className="w-40"
                                    />
                                </div>
                                <Badge variant="outline" className="ml-auto">
                                    {filteredOrders.length} orders in range
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {reportTypes.map((report) => (
                                <Card
                                    key={report.id}
                                    className="hover:shadow-lg transition-shadow cursor-pointer"
                                >
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div
                                                className={`w-12 h-12 ${report.color} rounded-lg flex items-center justify-center`}
                                            >
                                                <report.icon className="h-6 w-6 text-white" />
                                            </div>
                                            <Badge variant="outline">{report.count}</Badge>
                                        </div>
                                        <h3 className="font-semibold text-lg mb-1">{report.title}</h3>
                                        <p className="text-sm text-gray-500 mb-4">{report.description}</p>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => downloadCSV(report.id)}
                                                className="flex-1"
                                            >
                                                <Download className="h-4 w-4 mr-1" />
                                                CSV
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => window.print()}
                                                className="flex-1"
                                            >
                                                <Printer className="h-4 w-4 mr-1" />
                                                Print
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Quick Stats */}
                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle>Quick Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="text-center p-4 bg-gray-50 rounded-lg">
                                    <p className="text-2xl font-bold text-blue-600">{filteredOrders.length}</p>
                                    <p className="text-sm text-gray-500">Total Orders</p>
                                </div>
                                <div className="text-center p-4 bg-gray-50 rounded-lg">
                                    <p className="text-2xl font-bold text-green-600">
                                        {formatCurrency(filteredOrders.reduce((sum, o) => sum + (o.amount || 0), 0))}
                                    </p>
                                    <p className="text-sm text-gray-500">Total Revenue</p>
                                </div>
                                <div className="text-center p-4 bg-gray-50 rounded-lg">
                                    <p className="text-2xl font-bold text-orange-600">
                                        {filteredOrders.filter((o) => o.status === "delivered").length}
                                    </p>
                                    <p className="text-sm text-gray-500">Delivered</p>
                                </div>
                                <div className="text-center p-4 bg-gray-50 rounded-lg">
                                    <p className="text-2xl font-bold text-purple-600">
                                        {filteredOrders.filter((o) => o.status === "pending").length}
                                    </p>
                                    <p className="text-sm text-gray-500">Pending</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </main>
            </div>
        </div>
    );
}

export default function ReportsPage() {
    return (
        <ProtectedRoute>
            <ReportsContent />
        </ProtectedRoute>
    );
}
