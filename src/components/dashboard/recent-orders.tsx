"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from "@/lib/utils";
import { Order } from "@/types";
import { Package, Eye, ArrowRight } from "lucide-react";
import Link from "next/link";

interface RecentOrdersProps {
    orders?: Order[];
}

// Mock data for fallback
const mockOrders: Order[] = [
    {
        id: "ORD-2026-001234",
        customerId: "CUST001",
        customerName: "Ramesh Patel",
        customerPhone: "9876543210",
        status: "in_transit",
        pickup: { name: "Sender", phone: "9429541601", address: "Mehsana, Gujarat", city: "Mehsana", state: "Gujarat", pincode: "384001" },
        delivery: { name: "Ramesh Patel", phone: "9876543210", address: "Mumbai, Maharashtra", city: "Mumbai", state: "Maharashtra", pincode: "400001" },
        package: { weight: 2.5, length: 25, width: 20, height: 15, isFragile: false },
        courier: "Delhivery",
        amount: 285,
        paymentStatus: "paid",
        createdAt: new Date(),
        statusHistory: [],
    },
    {
        id: "ORD-2026-001233",
        customerId: "CUST002",
        customerName: "Priya Shah",
        customerPhone: "9876543211",
        status: "pending",
        pickup: { name: "Sender", phone: "9429541601", address: "Ahmedabad, Gujarat", city: "Ahmedabad", state: "Gujarat", pincode: "380001" },
        delivery: { name: "Priya Shah", phone: "9876543211", address: "Surat, Gujarat", city: "Surat", state: "Gujarat", pincode: "395001" },
        package: { weight: 1.0, length: 20, width: 15, height: 10, isFragile: false },
        courier: "Shiprocket",
        amount: 195,
        paymentStatus: "paid",
        createdAt: new Date(Date.now() - 3600000),
        statusHistory: [],
    },
];

export function RecentOrders({ orders }: RecentOrdersProps) {
    const displayOrders = orders && orders.length > 0 ? orders : mockOrders;

    return (
        <Card>
            <div className="flex items-center justify-between p-6 border-b">
                <h3 className="font-semibold">Recent Orders</h3>
                <Link href="/orders">
                    <Button variant="ghost" size="sm" className="gap-1">
                        View All <ArrowRight className="h-4 w-4" />
                    </Button>
                </Link>
            </div>
            <CardContent className="p-0">
                {displayOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                        <Package className="h-12 w-12 mb-3 text-gray-300" />
                        <p>No recent orders</p>
                    </div>
                ) : (
                    <div className="divide-y">
                        {displayOrders.map((order) => (
                            <div
                                key={order.id}
                                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                        <Package className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium">{order.id}</p>
                                        <p className="text-sm text-gray-500">
                                            {order.pickup?.city || "—"} → {order.delivery?.city || "—"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right hidden sm:block">
                                        <p className="font-semibold">{formatCurrency(order.amount || 0)}</p>
                                        <p className="text-xs text-gray-500">{order.courier}</p>
                                    </div>
                                    <Badge className={getStatusColor(order.status)}>
                                        {getStatusLabel(order.status)}
                                    </Badge>
                                    <Link href={`/orders/${order.id}`}>
                                        <Button variant="ghost" size="icon">
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
