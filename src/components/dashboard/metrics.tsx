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
    loading?: boolean;
}

export function MetricCard({ title, value, change, icon, trend, loading }: MetricCardProps) {
    const isPositive = trend === "up" || change.startsWith("+");

    return (
        <Card>
            <CardContent className="p-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-4 gap-2 text-gray-400">
                        <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-sm font-medium">Loading {title.toLowerCase()}...</span>
                    </div>
                ) : (
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-blue-800">{title}</p>
                            <p className="text-3xl font-bold text-blue-950 mt-1 font-mono tracking-tight">{value}</p>
                            <div className={`flex items-center gap-1 mt-2 text-sm font-medium ${isPositive ? "text-emerald-600" : "text-rose-600"}`}>
                                {isPositive ? (
                                    <TrendingUp className="h-4 w-4" />
                                ) : (
                                    <TrendingDown className="h-4 w-4" />
                                )}
                                <span>{change} vs last week</span>
                            </div>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-white/60 shadow-sm border border-white/40 flex items-center justify-center">
                            {icon}
                        </div>
                    </div>
                )}
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
