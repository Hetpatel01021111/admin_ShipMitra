"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { Order } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";

interface ExportDialogProps {
    orders: Order[];
    filteredOrders: Order[];
}

export function ExportDialog({ orders, filteredOrders }: ExportDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [exportType, setExportType] = useState<"csv" | "excel">("csv");

    const exportToCSV = (data: Order[]) => {
        const headers = [
            "Order ID",
            "Customer Name",
            "Phone",
            "Pickup City",
            "Delivery City",
            "Courier",
            "Amount",
            "Status",
            "Payment Status",
            "Date",
            "AWB Number",
        ];

        const rows = data.map((order) => [
            order.id,
            order.customerName || "",
            order.customerPhone || "",
            order.pickup?.city || "",
            order.delivery?.city || "",
            order.courier || "",
            order.amount || 0,
            order.status,
            order.paymentStatus || "",
            order.createdAt ? formatDate(order.createdAt as Date) : "",
            order.awbNumber || "",
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `orders_export_${new Date().toISOString().split("T")[0]}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExport = () => {
        if (exportType === "csv") {
            exportToCSV(filteredOrders);
        }
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    Export
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Export Orders</DialogTitle>
                    <DialogDescription>
                        Export {filteredOrders.length} filtered orders to CSV or Excel format
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Export Format</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setExportType("csv")}
                                className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-colors ${exportType === "csv"
                                        ? "border-blue-600 bg-blue-50"
                                        : "border-gray-200 hover:border-gray-300"
                                    }`}
                            >
                                <FileText className="h-8 w-8 text-blue-600" />
                                <span className="font-medium">CSV</span>
                                <span className="text-xs text-gray-500">Excel compatible</span>
                            </button>
                            <button
                                onClick={() => setExportType("excel")}
                                className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-colors ${exportType === "excel"
                                        ? "border-green-600 bg-green-50"
                                        : "border-gray-200 hover:border-gray-300"
                                    }`}
                                disabled
                            >
                                <FileSpreadsheet className="h-8 w-8 text-green-600" />
                                <span className="font-medium">Excel</span>
                                <span className="text-xs text-gray-500">Coming soon</span>
                            </button>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Total orders to export:</span>
                            <span className="font-semibold">{filteredOrders.length}</span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setIsOpen(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleExport} className="gap-2">
                        <Download className="h-4 w-4" />
                        Export {exportType.toUpperCase()}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
