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

export function RecentOrders({ orders }: RecentOrdersProps) {
    const displayOrders = orders && orders.length > 0 ? orders : [];

    return (
        <Card>
            <div className="flex items-center justify-between p-6 border-b border-white/40 bg-white/30 rounded-t-xl">
                <h3 className="font-semibold text-blue-950">Recent Orders</h3>
                <Link href="/orders">
                    <Button variant="ghost" size="sm" className="gap-1 text-blue-800 hover:text-blue-950 hover:bg-white/60">
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
                                    <div className="w-10 h-10 rounded-xl bg-white/60 shadow-sm border border-white/40 flex items-center justify-center">
                                        <Package className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium font-mono text-blue-950">{order.id}</p>
                                        <p className="text-sm text-blue-800/80 font-medium">
                                            {order.pickup?.city || "—"} → {order.delivery?.city || "—"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right hidden sm:block">
                                        <p className="font-semibold font-mono text-blue-950">{formatCurrency(order.amount || 0)}</p>
                                        <p className="text-xs text-blue-800/80 font-medium">{order.courier}</p>
                                    </div>
                                    <Badge className={`${getStatusColor(order.status)} shadow-sm`}>
                                        {getStatusLabel(order.status)}
                                    </Badge>
                                    <Link href={`/orders/${order.id}`}>
                                        <Button variant="ghost" size="icon" className="text-blue-800 hover:text-blue-950 hover:bg-white/60">
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
