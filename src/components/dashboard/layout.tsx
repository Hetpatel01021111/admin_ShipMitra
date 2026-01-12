"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Package,
    Users,
    Truck,
    BarChart3,
    Settings,
    LogOut,
    Menu,
    X,
    FileText,
    Building,
    Calculator,
    PieChart,
    CheckCircle,
    XCircle,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { NotificationBadge } from "@/components/dashboard/notifications";

const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Orders", href: "/orders", icon: Package, exact: true },
    { name: "Delivered", href: "/orders?status=delivered", icon: CheckCircle },
    { name: "Cancelled", href: "/orders?status=cancelled", icon: XCircle },
    { name: "Invoices", href: "/invoices", icon: FileText },
    { name: "Riders", href: "/riders", icon: Truck },
    { name: "Customers", href: "/customers", icon: Users },
    { name: "Banking", href: "/banking", icon: Building },
    { name: "Actual Charge", href: "/actual-charge", icon: Calculator },
    { name: "GST & Tax", href: "/gst", icon: Calculator },
    { name: "Reports", href: "/reports", icon: PieChart },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
    { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    // Build current URL for comparison
    const currentUrl = searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname;

    const isItemActive = (item: { href: string; exact?: boolean }) => {
        // For items with query params, do full URL match
        if (item.href.includes("?")) {
            return currentUrl === item.href;
        }
        // For exact match items (like Orders), only match exact path without query params
        if (item.exact) {
            return pathname === item.href && !searchParams.toString();
        }
        // For other items, match pathname
        return pathname === item.href;
    };

    return (
        <>
            {/* Mobile menu button */}
            <div className="lg:hidden fixed top-4 left-4 z-50">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsMobileOpen(!isMobileOpen)}
                    className="bg-white shadow-lg"
                >
                    {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
            </div>

            {/* Mobile overlay */}
            {isMobileOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-40"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out lg:translate-x-0",
                    isMobileOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center justify-center h-16 border-b border-slate-800">
                        <Link href="/" className="flex items-center gap-2">
                            <Package className="h-8 w-8 text-blue-500" />
                            <span className="text-xl font-bold">ShipMitra Admin</span>
                        </Link>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                        {navigation.map((item) => {
                            const isActive = isItemActive(item);
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setIsMobileOpen(false)}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                                        isActive
                                            ? "bg-blue-600 text-white"
                                            : "text-slate-300 hover:bg-slate-800 hover:text-white"
                                    )}
                                >
                                    <item.icon className="h-5 w-5" />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User section */}
                    <div className="p-4 border-t border-slate-800">
                        <div className="flex items-center gap-3 px-4 py-3">
                            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                                <span className="text-sm font-medium">HP</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">Het Patel</p>
                                <p className="text-xs text-slate-400 truncate">Admin</p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-slate-400 hover:text-white hover:bg-slate-800"
                            >
                                <LogOut className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}

export function Header() {
    return (
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 lg:px-8">
            <div className="flex items-center gap-4">
                <div className="lg:hidden w-10" /> {/* Spacer for mobile menu button */}
                <h1 className="text-lg font-semibold text-gray-900 hidden sm:block">
                    ShipMitra Admin Dashboard
                </h1>
            </div>

            <div className="flex items-center gap-4">
                <NotificationBadge />
                <div className="hidden sm:flex items-center gap-2 text-sm">
                    <span className="text-gray-500">Welcome,</span>
                    <span className="font-medium">Het</span>
                </div>
            </div>
        </header>
    );
}

