"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar, Header } from "@/components/dashboard/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDateTime, getStatusColor, getStatusLabel } from "@/lib/utils";
import { Order, OrderStatus, Rider } from "@/types";
import { getOrderById, updateOrderStatus, getRiders, assignRiderToOrder } from "@/lib/data";
import {
    ArrowLeft,
    Package,
    MapPin,
    Phone,
    Mail,
    Calendar,
    Clock,
    Truck,
    User,
    FileText,
    Download,
    RefreshCw,
    Check,
    AlertCircle,
    Printer,
    Send,
    Loader2,
} from "lucide-react";
import Link from "next/link";

const statusFlow: OrderStatus[] = [
    "pending",
    "pickup_scheduled",
    "picked_up",
    "handed_to_courier",
    "in_transit",
    "out_for_delivery",
    "delivered",
];

export default function OrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const orderId = params.id as string;

    const [order, setOrder] = useState<Order | null>(null);
    const [riders, setRiders] = useState<Rider[]>([]);
    const [loading, setLoading] = useState(true);
    const [showRiderModal, setShowRiderModal] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    // Fetch order data from Firebase
    useEffect(() => {
        const loadOrder = async () => {
            setLoading(true);
            try {
                const orderData = await getOrderById(orderId);
                if (orderData) {
                    setOrder(orderData);
                }
                const ridersData = await getRiders();
                setRiders(ridersData);
            } catch (error) {
                console.error("Error loading order:", error);
            } finally {
                setLoading(false);
            }
        };

        if (orderId) {
            loadOrder();
        }
    }, [orderId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-lg font-semibold">Order not found</h2>
                    <Button onClick={() => router.push("/orders")} className="mt-4">
                        Back to Orders
                    </Button>
                </div>
            </div>
        );
    }

    const currentStatusIndex = statusFlow.indexOf(order.status as OrderStatus);

    const handleUpdateStatus = async (newStatus: OrderStatus) => {
        setIsUpdating(true);
        try {
            const success = await updateOrderStatus(order.id, newStatus, "admin");
            if (success) {
                // Refresh order data
                const updatedOrder = await getOrderById(orderId);
                if (updatedOrder) {
                    setOrder(updatedOrder);
                }
            }
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Failed to update status");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleAssignRider = async (rider: Rider) => {
        try {
            const success = await assignRiderToOrder(order.id, rider.id, rider.name);
            if (success) {
                const updatedOrder = await getOrderById(orderId);
                if (updatedOrder) {
                    setOrder(updatedOrder);
                }
            }
            setShowRiderModal(false);
        } catch (error) {
            console.error("Error assigning rider:", error);
        }
    };

    const handleDownloadInvoice = () => {
        if (order.invoiceId) {
            window.open(`/api/invoices/${order.invoiceId}/download`, "_blank");
        } else {
            alert("Invoice not linked to this order");
        }
    };

    // Helper to get pickup/delivery details - supports both formats
    const getPickup = () => order.pickup || {
        name: order.senderName || "",
        phone: order.senderPhone || "",
        address: order.senderAddress || "",
        city: order.senderCity || "",
        state: order.senderState || "",
        pincode: order.senderPincode || "",
    };

    const getDelivery = () => order.delivery || {
        name: order.receiverName || "",
        phone: order.receiverPhone || "",
        address: order.receiverAddress || "",
        city: order.receiverCity || "",
        state: order.receiverState || "",
        pincode: order.receiverPincode || "",
    };

    const pickup = getPickup();
    const delivery = getDelivery();

    return (
        <div className="min-h-screen bg-gray-100">
            <Sidebar />

            <div className="lg:pl-64">
                <Header />

                <main className="p-6 lg:p-8">
                    {/* Back button and title */}
                    <div className="flex items-center gap-4 mb-6">
                        <Button variant="ghost" size="icon" onClick={() => router.back()}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Order #{order.id}</h1>
                            <p className="text-gray-500">Created {formatDateTime(order.createdAt as Date)}</p>
                        </div>
                        <div className="ml-auto flex gap-2">
                            <Button variant="outline" className="gap-2">
                                <Printer className="h-4 w-4" />
                                Print Label
                            </Button>
                            <Button variant="outline" className="gap-2">
                                <Download className="h-4 w-4" />
                                Download
                            </Button>
                        </div>
                    </div>

                    {/* Status bar */}
                    <Card className="mb-6">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <Badge className={getStatusColor(order.status)} style={{ fontSize: "14px", padding: "6px 12px" }}>
                                        {getStatusLabel(order.status)}
                                    </Badge>
                                    {order.paymentStatus === "paid" && (
                                        <Badge variant="success" className="gap-1">
                                            <Check className="h-3 w-3" /> Paid
                                        </Badge>
                                    )}
                                </div>
                                <Button variant="outline" size="sm" className="gap-1">
                                    <RefreshCw className="h-4 w-4" />
                                    Sync Tracking
                                </Button>
                            </div>

                            {/* Status timeline */}
                            <div className="flex items-center justify-between">
                                {statusFlow.slice(0, -1).map((status, index) => {
                                    const isCompleted = index < currentStatusIndex;
                                    const isCurrent = index === currentStatusIndex;
                                    const isNext = index === currentStatusIndex + 1;

                                    return (
                                        <div key={status} className="flex items-center flex-1">
                                            <div className="flex flex-col items-center">
                                                <button
                                                    onClick={() => isNext && handleUpdateStatus(status)}
                                                    disabled={!isNext || isUpdating}
                                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${isCompleted
                                                        ? "bg-green-500 text-white"
                                                        : isCurrent
                                                            ? "bg-blue-500 text-white"
                                                            : isNext
                                                                ? "bg-blue-100 text-blue-600 hover:bg-blue-200 cursor-pointer"
                                                                : "bg-gray-200 text-gray-500"
                                                        }`}
                                                >
                                                    {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
                                                </button>
                                                <span className={`text-xs mt-1 text-center ${isCurrent ? "font-medium text-blue-600" : "text-gray-500"}`}>
                                                    {getStatusLabel(status)}
                                                </span>
                                            </div>
                                            {index < statusFlow.length - 2 && (
                                                <div className={`flex-1 h-1 mx-2 ${isCompleted ? "bg-green-500" : "bg-gray-200"}`} />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left column - Main info */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Pickup & Delivery */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <MapPin className="h-5 w-5 text-green-500" />
                                            Pickup Details
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="flex items-start gap-2">
                                            <User className="h-4 w-4 text-gray-400 mt-1" />
                                            <div>
                                                <p className="font-medium">{pickup.name || "—"}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <Phone className="h-4 w-4 text-gray-400 mt-1" />
                                            <p>{pickup.phone || "—"}</p>
                                        </div>
                                        {pickup.email && (
                                            <div className="flex items-start gap-2">
                                                <Mail className="h-4 w-4 text-gray-400 mt-1" />
                                                <p className="text-sm">{pickup.email}</p>
                                            </div>
                                        )}
                                        <div className="flex items-start gap-2">
                                            <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                                            <div>
                                                <p className="text-sm">{pickup.address || "—"}</p>
                                                {pickup.landmark && (
                                                    <p className="text-sm text-gray-500">{pickup.landmark}</p>
                                                )}
                                                <p className="text-sm font-medium">
                                                    {pickup.city || "—"}{pickup.pincode ? `, ${pickup.pincode}` : ""}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 pt-2 border-t">
                                            <div className="flex items-center gap-1 text-sm">
                                                <Calendar className="h-4 w-4 text-gray-400" />
                                                {order.pickupDate || "—"}
                                            </div>
                                            <div className="flex items-center gap-1 text-sm">
                                                <Clock className="h-4 w-4 text-gray-400" />
                                                {order.pickupTime || "—"}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <MapPin className="h-5 w-5 text-red-500" />
                                            Delivery Details
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="flex items-start gap-2">
                                            <User className="h-4 w-4 text-gray-400 mt-1" />
                                            <div>
                                                <p className="font-medium">{delivery.name || "—"}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <Phone className="h-4 w-4 text-gray-400 mt-1" />
                                            <p>{delivery.phone || "—"}</p>
                                        </div>
                                        {delivery.email && (
                                            <div className="flex items-start gap-2">
                                                <Mail className="h-4 w-4 text-gray-400 mt-1" />
                                                <p className="text-sm">{delivery.email}</p>
                                            </div>
                                        )}
                                        <div className="flex items-start gap-2">
                                            <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                                            <div>
                                                <p className="text-sm">{delivery.address || "—"}</p>
                                                {delivery.landmark && (
                                                    <p className="text-sm text-gray-500">{delivery.landmark}</p>
                                                )}
                                                <p className="text-sm font-medium">
                                                    {delivery.city || "—"}{delivery.pincode ? `, ${delivery.pincode}` : ""}
                                                </p>
                                            </div>
                                        </div>
                                        {order.estimatedDelivery && (
                                            <div className="flex items-center gap-1 pt-2 border-t text-sm">
                                                <Calendar className="h-4 w-4 text-gray-400" />
                                                Est. Delivery: {order.estimatedDelivery}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Package Details */}
                            {order.package && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Package className="h-5 w-5 text-blue-500" />
                                            Package Details
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                            <div className="p-3 bg-gray-50 rounded-lg">
                                                <p className="text-sm text-gray-500">Weight</p>
                                                <p className="text-lg font-semibold">{order.package.weight || 0} kg</p>
                                            </div>
                                            <div className="p-3 bg-gray-50 rounded-lg">
                                                <p className="text-sm text-gray-500">Dimensions</p>
                                                <p className="text-lg font-semibold">
                                                    {order.package.length || 0}×{order.package.width || 0}×{order.package.height || 0} cm
                                                </p>
                                            </div>
                                            <div className="p-3 bg-gray-50 rounded-lg">
                                                <p className="text-sm text-gray-500">Declared Value</p>
                                                <p className="text-lg font-semibold">{formatCurrency(order.package.declaredValue || 0)}</p>
                                            </div>
                                            <div className="p-3 bg-gray-50 rounded-lg">
                                                <p className="text-sm text-gray-500">Fragile</p>
                                                <p className="text-lg font-semibold">{order.package.isFragile ? "Yes" : "No"}</p>
                                            </div>
                                        </div>
                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <p className="text-sm text-gray-500">Description</p>
                                            <p className="font-medium">{order.package.description || "—"}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Status History */}
                            {order.statusHistory && order.statusHistory.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Status History</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {order.statusHistory.map((update, index) => (
                                                <div key={index} className="flex items-start gap-4">
                                                    <div className="w-2 h-2 mt-2 rounded-full bg-blue-500" />
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between">
                                                            <p className="font-medium">{getStatusLabel(update.status)}</p>
                                                            <p className="text-sm text-gray-500">
                                                                {formatDateTime(update.timestamp as Date)}
                                                            </p>
                                                        </div>
                                                        {update.note && (
                                                            <p className="text-sm text-gray-500">{update.note}</p>
                                                        )}
                                                        <p className="text-xs text-gray-400">by {update.updatedBy}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Right column - Actions & Info */}
                        <div className="space-y-6">
                            {/* Courier Info */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Truck className="h-5 w-5 text-orange-500" />
                                        Courier Info
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-500">Courier</span>
                                        <span className="font-semibold">{order.courier}</span>
                                    </div>
                                    {order.awbNumber && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-500">AWB Number</span>
                                            <span className="font-mono text-sm">{order.awbNumber}</span>
                                        </div>
                                    )}
                                    <Button className="w-full gap-2" variant="outline">
                                        <FileText className="h-4 w-4" />
                                        View Tracking
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Rider Assignment */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Assigned Rider</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {order.assignedRider ? (
                                        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                                            <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold">
                                                {order.riderName?.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-medium">{order.riderName}</p>
                                                <p className="text-sm text-gray-500">Rider ID: {order.assignedRider}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-4">
                                            <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                                            <p className="text-gray-500 mb-3">No rider assigned</p>
                                            <Button onClick={() => setShowRiderModal(true)} className="gap-2">
                                                <User className="h-4 w-4" />
                                                Assign Rider
                                            </Button>
                                        </div>
                                    )}
                                    {order.assignedRider && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full mt-3"
                                            onClick={() => setShowRiderModal(true)}
                                        >
                                            Change Rider
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Payment Info */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Payment</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-500">Amount</span>
                                        <span className="text-xl font-bold text-green-600">{formatCurrency(order.amount ?? 0)}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-500">Status</span>
                                        <Badge variant={order.paymentStatus === "paid" ? "success" : "warning"}>
                                            {order.paymentStatus}
                                        </Badge>
                                    </div>
                                    {order.paymentId && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-500">Payment ID</span>
                                            <span className="font-mono text-xs">{order.paymentId}</span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Quick Actions */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <Button variant="outline" className="w-full gap-2 justify-start">
                                        <Send className="h-4 w-4" />
                                        Send WhatsApp Update
                                    </Button>
                                    <Button variant="outline" className="w-full gap-2 justify-start">
                                        <Mail className="h-4 w-4" />
                                        Send Email Update
                                    </Button>
                                    <Button variant="outline" className="w-full gap-2 justify-start text-red-600 hover:text-red-700">
                                        <AlertCircle className="h-4 w-4" />
                                        Cancel Order
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Rider Assignment Modal */}
                    {showRiderModal && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                            <Card className="w-full max-w-md mx-4">
                                <CardHeader>
                                    <CardTitle>Assign Rider</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {riders.map((rider) => (
                                            <button
                                                key={rider.id}
                                                onClick={() => handleAssignRider(rider)}
                                                className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors text-left"
                                            >
                                                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                                                    {rider.name.charAt(0)}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium">{rider.name}</p>
                                                    <p className="text-sm text-gray-500">
                                                        {rider.vehicleType} • {rider.assignedOrders?.length || 0} orders
                                                    </p>
                                                </div>
                                                <Badge variant={rider.isActive ? "success" : "secondary"}>
                                                    {rider.isActive ? "Active" : "Offline"}
                                                </Badge>
                                            </button>
                                        ))}
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="w-full mt-4"
                                        onClick={() => setShowRiderModal(false)}
                                    >
                                        Cancel
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
