"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import {
    Bell,
    Package,
    CreditCard,
    Truck,
    Users,
    CheckCircle,
    X,
    ChevronRight,
} from "lucide-react";

interface Notification {
    id: string;
    type: "order" | "payment" | "rider" | "customer" | "system";
    title: string;
    message: string;
    timestamp: Date;
    isRead: boolean;
    link?: string;
}

const mockNotifications: Notification[] = [
    {
        id: "1",
        type: "order",
        title: "New Order Received",
        message: "Order #ORD-2026-001250 from Ramesh Patel",
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        isRead: false,
        link: "/orders/ORD-2026-001250",
    },
    {
        id: "2",
        type: "payment",
        title: "Payment Confirmed",
        message: "₹285 received for order #ORD-2026-001249",
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        isRead: false,
        link: "/orders/ORD-2026-001249",
    },
    {
        id: "3",
        type: "rider",
        title: "Pickup Completed",
        message: "Mahesh Kumar picked up order #ORD-2026-001245",
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        isRead: true,
    },
    {
        id: "4",
        type: "customer",
        title: "New Customer Registered",
        message: "Priya Shah joined via referral",
        timestamp: new Date(Date.now() - 60 * 60 * 1000),
        isRead: true,
    },
    {
        id: "5",
        type: "system",
        title: "Daily Report Ready",
        message: "January 6, 2026 sales report is ready",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        isRead: true,
    },
];

const getNotificationIcon = (type: string) => {
    switch (type) {
        case "order":
            return <Package className="h-5 w-5 text-blue-500" />;
        case "payment":
            return <CreditCard className="h-5 w-5 text-green-500" />;
        case "rider":
            return <Truck className="h-5 w-5 text-orange-500" />;
        case "customer":
            return <Users className="h-5 w-5 text-purple-500" />;
        default:
            return <Bell className="h-5 w-5 text-gray-500" />;
    }
};

interface NotificationCenterProps {
    isOpen: boolean;
    onClose: () => void;
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
    const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    const markAsRead = (id: string) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
    };

    const markAllAsRead = () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    };

    const deleteNotification = (id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/20" onClick={onClose} />

            {/* Panel */}
            <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b">
                        <div className="flex items-center gap-2">
                            <Bell className="h-5 w-5" />
                            <h2 className="text-lg font-semibold">Notifications</h2>
                            {unreadCount > 0 && (
                                <Badge variant="destructive">{unreadCount}</Badge>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                                Mark all read
                            </Button>
                            <Button variant="ghost" size="icon" onClick={onClose}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>

                    {/* Notifications list */}
                    <div className="flex-1 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                <CheckCircle className="h-12 w-12 mb-3 text-green-500" />
                                <p>All caught up!</p>
                            </div>
                        ) : (
                            <div className="divide-y">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${!notification.isRead ? "bg-blue-50/50" : ""
                                            }`}
                                        onClick={() => markAsRead(notification.id)}
                                    >
                                        <div className="flex gap-3">
                                            <div className="flex-shrink-0 mt-0.5">
                                                {getNotificationIcon(notification.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className="font-medium text-sm">
                                                        {notification.title}
                                                        {!notification.isRead && (
                                                            <span className="ml-2 w-2 h-2 inline-block rounded-full bg-blue-500" />
                                                        )}
                                                    </p>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            deleteNotification(notification.id);
                                                        }}
                                                        className="text-gray-400 hover:text-gray-600"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                                <p className="text-sm text-gray-600 mt-0.5">
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {formatDateTime(notification.timestamp)}
                                                </p>
                                            </div>
                                            {notification.link && (
                                                <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Notification badge for header
export function NotificationBadge() {
    const [isOpen, setIsOpen] = useState(false);
    const unreadCount = 2; // Replace with real count

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => setIsOpen(true)}
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {unreadCount}
                    </span>
                )}
            </Button>
            <NotificationCenter isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
    );
}
