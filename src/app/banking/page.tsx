"use client";

import { useEffect, useState } from "react";
import { Sidebar, Header } from "@/components/dashboard/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProtectedRoute } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/utils";
import { collection, getDocs, query, orderBy, limit, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
    Wallet,
    ArrowUpRight,
    ArrowDownRight,
    CreditCard,
    Building2,
    TrendingUp,
    Search,
    Download,
    RefreshCw,
    IndianRupee,
    Calendar,
} from "lucide-react";

interface Transaction {
    id: string;
    type: "credit" | "debit" | "payout" | "refund";
    amount: number;
    description: string;
    status: "completed" | "pending" | "failed";
    orderId?: string;
    customerName?: string;
    paymentMethod?: string;
    createdAt: Date;
}

function BankingContent() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");

    useEffect(() => {
        loadTransactions();
    }, []);

    const loadTransactions = async () => {
        setLoading(true);
        try {
            // Load from bookings collection to calculate transactions
            const bookingsSnap = await getDocs(
                query(collection(db, "bookings"), orderBy("createdAt", "desc"), limit(100))
            );

            const txns: Transaction[] = bookingsSnap.docs.map((doc) => {
                const data = doc.data();
                return {
                    id: doc.id,
                    type: data.paymentStatus === "paid" ? "credit" : "pending" as any,
                    amount: data.amount || 0,
                    description: `Order ${data.orderId || doc.id.slice(0, 8)}`,
                    status: data.paymentStatus === "paid" ? "completed" : "pending",
                    orderId: data.orderId || doc.id,
                    customerName: data.senderDetails?.name || data.customerName || "Customer",
                    paymentMethod: data.paymentMethod || "Online",
                    createdAt: data.createdAt?.toDate?.() || new Date(),
                };
            });

            setTransactions(txns);
        } catch (error) {
            console.error("Error loading transactions:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredTransactions = transactions.filter((txn) => {
        const matchesSearch =
            txn.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            txn.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            txn.orderId?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = typeFilter === "all" || txn.type === typeFilter;
        return matchesSearch && matchesType;
    });

    const stats = {
        totalRevenue: transactions
            .filter((t) => t.status === "completed")
            .reduce((sum, t) => sum + t.amount, 0),
        pendingPayments: transactions
            .filter((t) => t.status === "pending")
            .reduce((sum, t) => sum + t.amount, 0),
        totalTransactions: transactions.length,
        todayRevenue: transactions
            .filter((t) => {
                const today = new Date();
                const txnDate = new Date(t.createdAt);
                return (
                    t.status === "completed" &&
                    txnDate.toDateString() === today.toDateString()
                );
            })
            .reduce((sum, t) => sum + t.amount, 0),
    };

    const getTransactionIcon = (type: string) => {
        switch (type) {
            case "credit":
                return <ArrowDownRight className="h-4 w-4 text-green-500" />;
            case "debit":
            case "payout":
                return <ArrowUpRight className="h-4 w-4 text-red-500" />;
            case "refund":
                return <ArrowUpRight className="h-4 w-4 text-orange-500" />;
            default:
                return <CreditCard className="h-4 w-4 text-gray-500" />;
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            completed: "bg-green-100 text-green-700",
            pending: "bg-yellow-100 text-yellow-700",
            failed: "bg-red-100 text-red-700",
        };
        return styles[status] || "bg-gray-100";
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
                            <h1 className="text-2xl font-bold text-gray-900">Banking</h1>
                            <p className="text-sm text-gray-500">Manage payments and transactions</p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={loadTransactions}>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Refresh
                            </Button>
                            <Button variant="outline">
                                <Download className="h-4 w-4 mr-2" />
                                Export
                            </Button>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-green-100 text-sm">Total Revenue</p>
                                        <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
                                    </div>
                                    <Wallet className="h-8 w-8 text-green-200" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-blue-100 text-sm">Today&apos;s Revenue</p>
                                        <p className="text-2xl font-bold">{formatCurrency(stats.todayRevenue)}</p>
                                    </div>
                                    <TrendingUp className="h-8 w-8 text-blue-200" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-yellow-100 text-sm">Pending</p>
                                        <p className="text-2xl font-bold">{formatCurrency(stats.pendingPayments)}</p>
                                    </div>
                                    <Clock className="h-8 w-8 text-yellow-200" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-purple-100 text-sm">Transactions</p>
                                        <p className="text-2xl font-bold">{stats.totalTransactions}</p>
                                    </div>
                                    <CreditCard className="h-8 w-8 text-purple-200" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Bank Account Card */}
                    <Card className="mb-6">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                        <Building2 className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold">Razorpay Account</p>
                                        <p className="text-sm text-gray-500">Connected • Auto-payout enabled</p>
                                    </div>
                                </div>
                                <Badge className="bg-green-100 text-green-700">Active</Badge>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Filters */}
                    <Card className="mb-6">
                        <CardContent className="p-4">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Search transactions..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    {["all", "credit", "debit", "payout", "refund"].map((type) => (
                                        <Button
                                            key={type}
                                            variant={typeFilter === type ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setTypeFilter(type)}
                                            className="capitalize"
                                        >
                                            {type}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Transactions Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Transactions</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {loading ? (
                                <div className="flex items-center justify-center h-64">
                                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : filteredTransactions.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                                    <CreditCard className="h-12 w-12 mb-3 text-gray-300" />
                                    <p>No transactions found</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b">
                                            <tr>
                                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase">
                                                    Transaction
                                                </th>
                                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase">
                                                    Customer
                                                </th>
                                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase">
                                                    Amount
                                                </th>
                                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase">
                                                    Status
                                                </th>
                                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase">
                                                    Date
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {filteredTransactions.slice(0, 20).map((txn) => (
                                                <tr key={txn.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                                                {getTransactionIcon(txn.type)}
                                                            </div>
                                                            <div>
                                                                <div className="font-medium">{txn.description}</div>
                                                                <div className="text-xs text-gray-500 capitalize">{txn.type}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-600">{txn.customerName}</td>
                                                    <td className="px-6 py-4">
                                                        <span
                                                            className={`font-semibold ${txn.type === "credit" ? "text-green-600" : "text-gray-900"
                                                                }`}
                                                        >
                                                            {txn.type === "credit" ? "+" : "-"}
                                                            {formatCurrency(txn.amount)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Badge className={getStatusBadge(txn.status)}>{txn.status}</Badge>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">
                                                        {formatDate(txn.createdAt)}
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

// Import Clock icon that was missing
import { Clock } from "lucide-react";

export default function BankingPage() {
    return (
        <ProtectedRoute>
            <BankingContent />
        </ProtectedRoute>
    );
}
