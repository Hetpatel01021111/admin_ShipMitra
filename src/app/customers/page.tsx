"use client";

import { useEffect, useState } from "react";
import { Sidebar, Header } from "@/components/dashboard/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProtectedRoute } from "@/lib/auth";
import { getCustomers } from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Customer } from "@/types";
import {
    Search,
    Plus,
    Phone,
    Mail,
    Package,
    Wallet,
    Users,
    Download,
    Eye,
} from "lucide-react";

function CustomersContent() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCustomers = async () => {
            const data = await getCustomers();
            setCustomers(data.length > 0 ? data : mockCustomers);
            setLoading(false);
        };
        fetchCustomers();
    }, []);

    const filteredCustomers = customers.filter((customer) => {
        return (
            customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            customer.phone?.includes(searchQuery)
        );
    });

    const stats = {
        total: customers.length,
        totalOrders: customers.reduce((sum, c) => sum + (c.totalOrders || 0), 0),
        totalWallet: customers.reduce((sum, c) => sum + (c.walletBalance || 0), 0),
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <Sidebar />

            <div className="lg:pl-64">
                <Header />

                <main className="p-6 lg:p-8">
                    {/* Page header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
                            <p className="text-gray-500 mt-1">Manage customer accounts and wallet</p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" className="gap-2">
                                <Download className="h-4 w-4" />
                                Export
                            </Button>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <Card>
                            <CardContent className="p-4 flex items-center gap-3">
                                <Users className="h-8 w-8 text-blue-500" />
                                <div>
                                    <p className="text-sm text-gray-500">Total Customers</p>
                                    <p className="text-2xl font-bold">{stats.total}</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4 flex items-center gap-3">
                                <Package className="h-8 w-8 text-green-500" />
                                <div>
                                    <p className="text-sm text-gray-500">Total Orders</p>
                                    <p className="text-2xl font-bold">{stats.totalOrders}</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4 flex items-center gap-3">
                                <Wallet className="h-8 w-8 text-orange-500" />
                                <div>
                                    <p className="text-sm text-gray-500">Total Wallet Balance</p>
                                    <p className="text-2xl font-bold">{formatCurrency(stats.totalWallet)}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Search */}
                    <Card className="mb-6">
                        <CardContent className="p-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search by name, email, or phone..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Customers Table */}
                    <Card>
                        <CardContent className="p-0">
                            {loading ? (
                                <div className="flex items-center justify-center h-64">
                                    <div className="text-center">
                                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                        <p className="mt-2 text-gray-500">Loading customers...</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b">
                                            <tr>
                                                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Customer</th>
                                                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Contact</th>
                                                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Orders</th>
                                                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Wallet</th>
                                                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Joined</th>
                                                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {filteredCustomers.map((customer) => (
                                                <tr key={customer.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                                                                {customer.name?.charAt(0) || "?"}
                                                            </div>
                                                            <div>
                                                                <p className="font-medium">{customer.name || "—"}</p>
                                                                <p className="text-xs text-gray-500">{customer.id}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-1 text-sm">
                                                            <Phone className="h-3 w-3 text-gray-400" />
                                                            {customer.phone || "—"}
                                                        </div>
                                                        <div className="flex items-center gap-1 text-sm text-gray-500">
                                                            <Mail className="h-3 w-3 text-gray-400" />
                                                            {customer.email || "—"}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Badge variant="outline">{customer.totalOrders || 0} orders</Badge>
                                                    </td>
                                                    <td className="px-6 py-4 font-medium">
                                                        {formatCurrency(customer.walletBalance || 0)}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">
                                                        {customer.createdAt ? formatDate(customer.createdAt as Date) : "—"}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Button variant="ghost" size="sm" className="gap-1">
                                                            <Eye className="h-4 w-4" />
                                                            View
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </main>
            </div>
        </div>
    );
}

// Mock data fallback
const mockCustomers: Customer[] = [
    { id: "CUST001", name: "Ramesh Patel", email: "ramesh@gmail.com", phone: "9876543210", totalOrders: 12, walletBalance: 500, referralCode: "RAM123", createdAt: new Date() },
    { id: "CUST002", name: "Priya Shah", email: "priya@gmail.com", phone: "9876543211", totalOrders: 8, walletBalance: 250, referralCode: "PRI456", createdAt: new Date() },
    { id: "CUST003", name: "Amit Sharma", email: "amit@gmail.com", phone: "9876543212", totalOrders: 25, walletBalance: 1200, referralCode: "AMI789", createdAt: new Date() },
];

export default function CustomersPage() {
    return (
        <ProtectedRoute>
            <CustomersContent />
        </ProtectedRoute>
    );
}
