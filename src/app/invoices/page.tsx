"use client";

import { useEffect, useState } from "react";
import { Sidebar, Header } from "@/components/dashboard/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProtectedRoute } from "@/lib/auth";
import { getInvoices } from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CreateInvoiceModal } from "@/components/invoices";
import {
    FileText,
    Download,
    Search,
    Plus,
    Eye,
    Pencil,
    Send,
    Printer,
    CheckCircle,
    Clock,
    XCircle,
    RefreshCw,
} from "lucide-react";

interface Invoice {
    id: string;
    invoiceNumber: string;
    // Customer info - from origin/destination
    originName?: string;
    destinationName?: string;
    originCity?: string;
    destinationCity?: string;
    originPhone?: string;
    awbNumber?: string;
    courierPartner?: string;
    // Amounts
    subtotal: number;
    grandTotal: number;
    cgst?: number;
    sgst?: number;
    // Status
    status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
    createdAt: Date | any;
    source?: string;
}

function InvoicesContent() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

    useEffect(() => {
        loadInvoices();
    }, []);

    const loadInvoices = async () => {
        setLoading(true);
        try {
            const data = await getInvoices();
            setInvoices(data as unknown as Invoice[]);
        } catch (error) {
            console.error("Error loading invoices:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredInvoices = invoices.filter((invoice) => {
        const matchesSearch =
            invoice.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            invoice.originName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            invoice.destinationName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            invoice.awbNumber?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const stats = {
        total: invoices.length,
        paid: invoices.filter((i) => i.status === "paid").length,
        pending: invoices.filter((i) => i.status === "sent" || i.status === "draft").length,
        overdue: invoices.filter((i) => i.status === "overdue").length,
        totalAmount: invoices.reduce((sum, i) => sum + (i.grandTotal || i.subtotal || 0), 0),
        paidAmount: invoices
            .filter((i) => i.status === "paid")
            .reduce((sum, i) => sum + (i.grandTotal || i.subtotal || 0), 0),
    };

    // Action handlers
    const handleView = (invoice: Invoice) => {
        window.open(`/invoice/${invoice.id}`, '_blank');
    };

    const handleEdit = (invoice: Invoice) => {
        setEditingInvoice(invoice);
        setIsCreateModalOpen(true);
    };

    const handleDownload = (invoice: Invoice) => {
        window.open(`/api/invoices/${invoice.id}/download`, '_blank');
    };

    const handlePrint = (invoice: Invoice) => {
        const printWindow = window.open(`/api/invoices/${invoice.id}/download`, '_blank');
        if (printWindow) {
            printWindow.onload = () => {
                printWindow.print();
            };
        }
    };

    const handleSend = (invoice: Invoice) => {
        // For now, just show a toast - email integration can be added later
        alert(`Send invoice ${invoice.invoiceNumber} - Email integration coming soon!`);
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            draft: "bg-gray-100 text-gray-700",
            sent: "bg-blue-100 text-blue-700",
            paid: "bg-green-100 text-green-700",
            overdue: "bg-red-100 text-red-700",
            cancelled: "bg-gray-100 text-gray-500",
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
                            <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
                            <p className="text-sm text-gray-500">Manage and track all invoices</p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={loadInvoices}>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Refresh
                            </Button>
                            <Button className="gap-2" onClick={() => setIsCreateModalOpen(true)}>
                                <Plus className="h-4 w-4" />
                                Create Invoice
                            </Button>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <FileText className="h-8 w-8 text-blue-500" />
                                    <div>
                                        <p className="text-sm text-gray-500">Total Invoices</p>
                                        <p className="text-2xl font-bold">{stats.total}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="h-8 w-8 text-green-500" />
                                    <div>
                                        <p className="text-sm text-gray-500">Paid</p>
                                        <p className="text-2xl font-bold">{stats.paid}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <Clock className="h-8 w-8 text-yellow-500" />
                                    <div>
                                        <p className="text-sm text-gray-500">Pending</p>
                                        <p className="text-2xl font-bold">{stats.pending}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <XCircle className="h-8 w-8 text-red-500" />
                                    <div>
                                        <p className="text-sm text-gray-500">Overdue</p>
                                        <p className="text-2xl font-bold">{stats.overdue}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Revenue Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                            <CardContent className="p-6">
                                <p className="text-green-100">Total Collected</p>
                                <p className="text-3xl font-bold">{formatCurrency(stats.paidAmount)}</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                            <CardContent className="p-6">
                                <p className="text-blue-100">Total Invoiced</p>
                                <p className="text-3xl font-bold">{formatCurrency(stats.totalAmount)}</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Filters */}
                    <Card className="mb-6">
                        <CardContent className="p-4">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Search by invoice number or customer..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    {["all", "draft", "sent", "paid", "overdue"].map((status) => (
                                        <Button
                                            key={status}
                                            variant={statusFilter === status ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setStatusFilter(status)}
                                            className="capitalize"
                                        >
                                            {status}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Invoices Table */}
                    <Card>
                        <CardContent className="p-0">
                            {loading ? (
                                <div className="flex items-center justify-center h-64">
                                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : filteredInvoices.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                                    <FileText className="h-12 w-12 mb-3 text-gray-300" />
                                    <p>No invoices found</p>
                                    <Button className="mt-4" variant="outline" onClick={() => setIsCreateModalOpen(true)}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Create First Invoice
                                    </Button>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b">
                                            <tr>
                                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase">
                                                    Invoice
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
                                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {filteredInvoices.map((invoice) => (
                                                <tr key={invoice.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4">
                                                        <div className="font-semibold text-blue-600">
                                                            {invoice.invoiceNumber}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-medium">{invoice.originName || invoice.destinationName || '—'}</div>
                                                        <div className="text-sm text-gray-500">
                                                            {invoice.originCity && invoice.destinationCity
                                                                ? `${invoice.originCity} → ${invoice.destinationCity}`
                                                                : invoice.courierPartner || '—'}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 font-semibold">
                                                        {formatCurrency(invoice.grandTotal || invoice.subtotal || 0)}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Badge className={getStatusBadge(invoice.status)}>
                                                            {invoice.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">
                                                        {formatDate(invoice.createdAt)}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-1">
                                                            <Button variant="ghost" size="icon" title="View" onClick={() => handleView(invoice)}>
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" title="Edit" onClick={() => handleEdit(invoice)}>
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" title="Download" onClick={() => handleDownload(invoice)}>
                                                                <Download className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" title="Send" onClick={() => handleSend(invoice)}>
                                                                <Send className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" title="Print" onClick={() => handlePrint(invoice)}>
                                                                <Printer className="h-4 w-4" />
                                                            </Button>
                                                        </div>
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

                {/* Create/Edit Invoice Modal */}
                <CreateInvoiceModal
                    open={isCreateModalOpen}
                    onOpenChange={(open) => {
                        setIsCreateModalOpen(open);
                        if (!open) setEditingInvoice(null);
                    }}
                    onInvoiceCreated={loadInvoices}
                    editInvoice={editingInvoice}
                />
            </div>
        </div>
    );
}

export default function InvoicesPage() {
    return (
        <ProtectedRoute>
            <InvoicesContent />
        </ProtectedRoute>
    );
}
