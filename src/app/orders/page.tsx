"use client";

import { useEffect, useState, useMemo } from "react";
import { Sidebar, Header } from "@/components/dashboard/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProtectedRoute } from "@/lib/auth";
import { subscribeToOrders } from "@/lib/data";
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from "@/lib/utils";
import { Order } from "@/types";
import {
    Search,
    Eye,
    RefreshCw,
    Package,
    Clock,
    CheckCircle,
    Truck,
    XCircle,
    X,
    CircleDot,
} from "lucide-react";
import Link from "next/link";
import { ExportDialog } from "@/components/orders/export-dialog";
import { OrderActionsMenu } from "@/components/orders/order-actions-menu";

const statusFilters = [
    { value: "all", label: "All", icon: CircleDot, color: "text-gray-600" },
    { value: "pending", label: "Pending", icon: Clock, color: "text-yellow-600" },
    { value: "in_transit", label: "In Transit", icon: Truck, color: "text-blue-600" },
    { value: "delivered", label: "Delivered", icon: CheckCircle, color: "text-green-600" },
    { value: "cancelled", label: "Cancelled", icon: XCircle, color: "text-red-600" },
];

function OrdersContent() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    useEffect(() => {
        const unsubscribe = subscribeToOrders((data) => {
            setOrders(data);
            setLoading(false);
            setLastUpdated(new Date());
        });

        return () => unsubscribe();
    }, []);

    const handleRefresh = () => {
        setRefreshing(true);
        setTimeout(() => {
            setRefreshing(false);
            setLastUpdated(new Date());
        }, 1000);
    };

    const filteredOrders = useMemo(() => {
        return orders.filter((order) => {
            const matchesSearch =
                order.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                order.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                order.customerPhone?.includes(searchQuery) ||
                order.awbNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                order.delivery?.city?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === "all" || order.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [orders, searchQuery, statusFilter]);

    // Stats with counts for each status
    const stats = useMemo(() => ({
        all: orders.length,
        pending: orders.filter((o) => o.status === "pending").length,
        in_transit: orders.filter((o) => o.status === "in_transit" || o.status === "picked_up" || o.status === "pickup_scheduled").length,
        delivered: orders.filter((o) => o.status === "delivered").length,
        cancelled: orders.filter((o) => o.status === "cancelled").length,
    }), [orders]);

    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar />

            <div className="lg:pl-64">
                <Header />

                <main className="p-4 lg:p-6">
                    {/* Page header */}
                    <div className="mb-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
                                <p className="text-sm text-gray-500 mt-1">
                                    Manage and track all shipment orders
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <ExportDialog orders={orders} filteredOrders={filteredOrders} />
                                <Button
                                    variant="outline"
                                    className="gap-2"
                                    onClick={handleRefresh}
                                    disabled={refreshing}
                                >
                                    <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                                    Refresh
                                </Button>
                            </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                            Last updated: {lastUpdated.toLocaleTimeString()}
                        </p>
                    </div>

                    {/* Status Filter Tabs */}
                    <div className="mb-6">
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {statusFilters.map((filter) => {
                                const Icon = filter.icon;
                                const count = stats[filter.value as keyof typeof stats] || 0;
                                const isActive = statusFilter === filter.value;

                                return (
                                    <button
                                        key={filter.value}
                                        onClick={() => setStatusFilter(filter.value)}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-all whitespace-nowrap ${isActive
                                            ? "bg-blue-50 border-blue-600 text-blue-700"
                                            : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                                            }`}
                                    >
                                        <Icon className={`h-4 w-4 ${isActive ? "text-blue-600" : filter.color}`} />
                                        <span className="font-medium">{filter.label}</span>
                                        <Badge
                                            variant="secondary"
                                            className={`ml-1 ${isActive ? "bg-blue-600 text-white" : "bg-gray-100"}`}
                                        >
                                            {count}
                                        </Badge>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Search */}
                    <Card className="mb-6">
                        <CardContent className="p-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search by Order ID, Customer Name, or Phone..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 pr-10"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery("")}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Orders Table */}
                    <Card>
                        <CardContent className="p-0">
                            {loading ? (
                                <div className="flex items-center justify-center h-64">
                                    <div className="text-center">
                                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                        <p className="mt-2 text-gray-500">Loading orders...</p>
                                    </div>
                                </div>
                            ) : filteredOrders.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                                    <Package className="h-12 w-12 mb-3 text-gray-300" />
                                    <p className="font-medium">No orders found</p>
                                    <p className="text-sm">Try adjusting your search or filters</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b">
                                            <tr>
                                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                    Order ID
                                                </th>
                                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                    Customer
                                                </th>
                                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                    Route
                                                </th>
                                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                    Courier
                                                </th>
                                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                    Amount
                                                </th>
                                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                    Date
                                                </th>
                                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {filteredOrders.map((order) => (
                                                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="font-semibold text-blue-600 text-sm">{order.id}</div>
                                                        {order.awbNumber && (
                                                            <div className="text-xs text-gray-500 font-mono mt-0.5">
                                                                {order.awbNumber}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-medium text-sm text-gray-900">
                                                            {order.senderName || order.customerName || "—"}
                                                        </div>
                                                        <div className="text-xs text-gray-500">{order.senderPhone || order.customerPhone}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col text-sm">
                                                            <span className="text-gray-700">{order.senderCity || order.pickup?.city || "—"}</span>
                                                            <span className="text-gray-400 text-xs">↓</span>
                                                            <span className="text-gray-700">{order.receiverCity || order.delivery?.city || "—"}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Badge variant="outline" className="font-medium">
                                                            {order.courierPartner || order.courier || "—"}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-semibold text-sm">
                                                            {formatCurrency(order.amount || 0)}
                                                        </div>
                                                        {order.paymentStatus && (
                                                            <Badge
                                                                variant={order.paymentStatus === "paid" ? "success" : "warning"}
                                                                className="text-xs mt-1"
                                                            >
                                                                {order.paymentStatus}
                                                            </Badge>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Badge className={getStatusColor(order.status)}>
                                                            {getStatusLabel(order.status)}
                                                        </Badge>
                                                        {order.riderName && (
                                                            <div className="text-xs text-gray-500 mt-1">
                                                                Rider: {order.riderName}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">
                                                        {order.createdAt ? formatDate(order.createdAt as Date) : "—"}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-1">
                                                            <Link href={`/orders/${order.id}`}>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8"
                                                                    title="View Details"
                                                                >
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                            </Link>
                                                            <OrderActionsMenu order={order} />
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Results count */}
                    {!loading && filteredOrders.length > 0 && (
                        <div className="mt-4 text-sm text-gray-500 text-center">
                            Showing {filteredOrders.length} of {orders.length} orders
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

export default function OrdersPage() {
    return (
        <ProtectedRoute>
            <OrdersContent />
        </ProtectedRoute>
    );
}
