"use client";

import { useEffect, useState } from "react";
import { Sidebar, Header } from "@/components/dashboard/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ProtectedRoute } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/utils";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
    FileText,
    Download,
    Calendar,
    RefreshCw,
    IndianRupee,
    Calculator,
    FileSpreadsheet,
    Building2,
    TrendingUp,
    Receipt,
} from "lucide-react";

interface GSTData {
    month: string;
    totalSales: number;
    cgst: number;
    sgst: number;
    igst: number;
    totalTax: number;
    invoiceCount: number;
}

function GSTContent() {
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState<any[]>([]);
    const [gstData, setGstData] = useState<GSTData[]>([]);
    const [selectedMonth, setSelectedMonth] = useState(
        new Date().toISOString().slice(0, 7) // YYYY-MM format
    );
    const [gstRate] = useState(18); // GST rate for shipping services

    useEffect(() => {
        loadOrders();
    }, []);

    useEffect(() => {
        if (orders.length > 0) {
            calculateGST();
        }
    }, [orders, selectedMonth]);

    const loadOrders = async () => {
        setLoading(true);
        try {
            const ordersSnap = await getDocs(
                query(collection(db, "bookings"), orderBy("createdAt", "desc"))
            );

            const ordersData = ordersSnap.docs.map((d) => ({
                id: d.id,
                ...d.data(),
                createdAt: d.data().createdAt?.toDate?.() || new Date(),
            }));

            setOrders(ordersData);
        } catch (error) {
            console.error("Error loading orders:", error);
        } finally {
            setLoading(false);
        }
    };

    const calculateGST = () => {
        // Group orders by month
        const byMonth: Record<string, { sales: number; count: number }> = {};

        orders.forEach((order) => {
            const date = new Date(order.createdAt);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

            if (!byMonth[monthKey]) {
                byMonth[monthKey] = { sales: 0, count: 0 };
            }
            byMonth[monthKey].sales += order.amount || 0;
            byMonth[monthKey].count++;
        });

        // Calculate GST for each month
        const gstResults: GSTData[] = Object.entries(byMonth)
            .map(([month, data]) => {
                const totalTax = (data.sales * gstRate) / 100;
                // For inter-state: IGST = 18%
                // For intra-state: CGST = 9%, SGST = 9%
                // Assuming 50% intra-state, 50% inter-state
                const igst = totalTax * 0.5;
                const cgst = (totalTax * 0.5) / 2;
                const sgst = (totalTax * 0.5) / 2;

                return {
                    month,
                    totalSales: data.sales,
                    cgst,
                    sgst,
                    igst,
                    totalTax,
                    invoiceCount: data.count,
                };
            })
            .sort((a, b) => b.month.localeCompare(a.month));

        setGstData(gstResults);
    };

    const currentMonthData = gstData.find((g) => g.month === selectedMonth) || {
        month: selectedMonth,
        totalSales: 0,
        cgst: 0,
        sgst: 0,
        igst: 0,
        totalTax: 0,
        invoiceCount: 0,
    };

    const totalStats = {
        totalSales: gstData.reduce((sum, g) => sum + g.totalSales, 0),
        totalTax: gstData.reduce((sum, g) => sum + g.totalTax, 0),
        totalInvoices: gstData.reduce((sum, g) => sum + g.invoiceCount, 0),
    };

    const downloadGSTR = () => {
        let csvContent = "Month,Total Sales,CGST (9%),SGST (9%),IGST (18%),Total Tax,Invoice Count\n";
        gstData.forEach((g) => {
            csvContent += `${g.month},${g.totalSales.toFixed(2)},${g.cgst.toFixed(2)},${g.sgst.toFixed(2)},${g.igst.toFixed(2)},${g.totalTax.toFixed(2)},${g.invoiceCount}\n`;
        });

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `gst_report_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const formatMonth = (monthStr: string) => {
        const [year, month] = monthStr.split("-");
        return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
        });
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
                            <h1 className="text-2xl font-bold text-gray-900">GST & Tax</h1>
                            <p className="text-sm text-gray-500">GST calculations and filing reports</p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={loadOrders}>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Refresh
                            </Button>
                            <Button onClick={downloadGSTR}>
                                <Download className="h-4 w-4 mr-2" />
                                Export GSTR
                            </Button>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                            <CardContent className="p-4">
                                <Building2 className="h-8 w-8 text-blue-200 mb-2" />
                                <p className="text-blue-100 text-sm">Total Sales</p>
                                <p className="text-2xl font-bold">{formatCurrency(totalStats.totalSales)}</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                            <CardContent className="p-4">
                                <Calculator className="h-8 w-8 text-green-200 mb-2" />
                                <p className="text-green-100 text-sm">Total GST</p>
                                <p className="text-2xl font-bold">{formatCurrency(totalStats.totalTax)}</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                            <CardContent className="p-4">
                                <Receipt className="h-8 w-8 text-purple-200 mb-2" />
                                <p className="text-purple-100 text-sm">Total Invoices</p>
                                <p className="text-2xl font-bold">{totalStats.totalInvoices}</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                            <CardContent className="p-4">
                                <TrendingUp className="h-8 w-8 text-orange-200 mb-2" />
                                <p className="text-orange-100 text-sm">GST Rate</p>
                                <p className="text-2xl font-bold">{gstRate}%</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Month Selector */}
                    <Card className="mb-6">
                        <CardContent className="p-4">
                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-gray-500" />
                                    <span className="text-sm font-medium">Select Month:</span>
                                </div>
                                <Input
                                    type="month"
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    className="w-48"
                                />
                                <Badge variant="outline" className="ml-auto">
                                    {currentMonthData.invoiceCount} invoices
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <>
                            {/* Current Month GST Breakdown */}
                            <Card className="mb-6">
                                <CardHeader>
                                    <CardTitle>GST Breakdown - {formatMonth(selectedMonth)}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                                            <p className="text-sm text-gray-500">Total Sales</p>
                                            <p className="text-xl font-bold text-blue-600">
                                                {formatCurrency(currentMonthData.totalSales)}
                                            </p>
                                        </div>
                                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                                            <p className="text-sm text-gray-500">CGST (9%)</p>
                                            <p className="text-xl font-bold text-green-600">
                                                {formatCurrency(currentMonthData.cgst)}
                                            </p>
                                        </div>
                                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                                            <p className="text-sm text-gray-500">SGST (9%)</p>
                                            <p className="text-xl font-bold text-green-600">
                                                {formatCurrency(currentMonthData.sgst)}
                                            </p>
                                        </div>
                                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                                            <p className="text-sm text-gray-500">IGST (18%)</p>
                                            <p className="text-xl font-bold text-orange-600">
                                                {formatCurrency(currentMonthData.igst)}
                                            </p>
                                        </div>
                                        <div className="text-center p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                                            <p className="text-sm text-blue-600 font-medium">Total Tax</p>
                                            <p className="text-xl font-bold text-blue-700">
                                                {formatCurrency(currentMonthData.totalTax)}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Monthly GST Table */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Monthly GST Summary</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 border-b">
                                                <tr>
                                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase">
                                                        Month
                                                    </th>
                                                    <th className="text-right px-6 py-4 text-xs font-semibold text-gray-600 uppercase">
                                                        Sales
                                                    </th>
                                                    <th className="text-right px-6 py-4 text-xs font-semibold text-gray-600 uppercase">
                                                        CGST
                                                    </th>
                                                    <th className="text-right px-6 py-4 text-xs font-semibold text-gray-600 uppercase">
                                                        SGST
                                                    </th>
                                                    <th className="text-right px-6 py-4 text-xs font-semibold text-gray-600 uppercase">
                                                        IGST
                                                    </th>
                                                    <th className="text-right px-6 py-4 text-xs font-semibold text-gray-600 uppercase">
                                                        Total Tax
                                                    </th>
                                                    <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase">
                                                        Invoices
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {gstData.slice(0, 12).map((g) => (
                                                    <tr
                                                        key={g.month}
                                                        className={`hover:bg-gray-50 ${g.month === selectedMonth ? "bg-blue-50" : ""
                                                            }`}
                                                    >
                                                        <td className="px-6 py-4 font-medium">{formatMonth(g.month)}</td>
                                                        <td className="px-6 py-4 text-right">
                                                            {formatCurrency(g.totalSales)}
                                                        </td>
                                                        <td className="px-6 py-4 text-right text-green-600">
                                                            {formatCurrency(g.cgst)}
                                                        </td>
                                                        <td className="px-6 py-4 text-right text-green-600">
                                                            {formatCurrency(g.sgst)}
                                                        </td>
                                                        <td className="px-6 py-4 text-right text-orange-600">
                                                            {formatCurrency(g.igst)}
                                                        </td>
                                                        <td className="px-6 py-4 text-right font-semibold text-blue-600">
                                                            {formatCurrency(g.totalTax)}
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <Badge variant="outline">{g.invoiceCount}</Badge>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}

export default function GSTPage() {
    return (
        <ProtectedRoute>
            <GSTContent />
        </ProtectedRoute>
    );
}
