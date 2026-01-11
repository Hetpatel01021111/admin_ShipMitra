"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { ReactNode } from "react";

interface MetricCardProps {
    title: string;
    value: string | number;
    change: string;
    icon: ReactNode;
    trend?: "up" | "down";
}

export function MetricCard({ title, value, change, icon, trend }: MetricCardProps) {
    const isPositive = trend === "up" || change.startsWith("+");

    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500">{title}</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
                        <div className={`flex items-center gap-1 mt-2 text-sm ${isPositive ? "text-green-600" : "text-red-600"}`}>
                            {isPositive ? (
                                <TrendingUp className="h-4 w-4" />
                            ) : (
                                <TrendingDown className="h-4 w-4" />
                            )}
                            <span>{change} vs last week</span>
                        </div>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                        {icon}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

interface DashboardMetricsProps {
    metrics?: {
        todayOrders: number;
        todayRevenue: number;
        activeRiders: number;
        pendingOrders: number;
    };
}

export function DashboardMetrics({ metrics }: DashboardMetricsProps) {
    // This component is now deprecated, use MetricCard directly
    return null;
}
