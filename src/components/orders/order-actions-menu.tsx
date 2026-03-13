"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    MoreVertical,
    Edit,
    XCircle,
    CheckCircle,
    Truck,
    Clock,
    Printer,
    MapPin,
    FileText,
    MessageSquare,
    Trash2,
} from "lucide-react";
import { Order } from "@/types";
import { updateOrderStatus } from "@/lib/data";
import Link from "next/link";

interface OrderActionsMenuProps {
    order: Order;
}

export function OrderActionsMenu({ order }: OrderActionsMenuProps) {
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [cancelling, setCancelling] = useState(false);

    const handleCancelOrder = async () => {
        setCancelling(true);
        try {
            const result = await updateOrderStatus(order.id, "cancelled");
            setCancelDialogOpen(false);
            if (result.success) {
                // window.location.reload(); // Removed to allow onSnapshot to update seamlessly
            } else {
                alert(`Failed to cancel order: ${result.error || 'Check console for details.'}`);
            }
        } catch (error) {
            console.error("Error cancelling order:", error);
        } finally {
            setCancelling(false);
        }
    };

    const handleUpdateStatus = async (status: string) => {
        try {
            const result = await updateOrderStatus(order.id, status);
            if (result.success) {
                // Refresh to get new data
                // window.location.reload(); // Removed to allow onSnapshot to update seamlessly
            } else {
                alert(`Failed to update status: ${result.error || 'Check console for details.'}`);
            }
        } catch (error) {
            console.error("Error updating order status:", error);
            alert("Failed to update status");
        }
    };

    const handlePrintLabel = () => {
        if (order.labelUrl) {
            window.open(order.labelUrl, "_blank");
        } else {
            alert("Label not generated yet");
        }
    };

    const handleTrackShipment = () => {
        if (order.awbNumber) {
            // Open tracking page based on courier
            const courier = order.courierPartner || order.courier || "";
            const trackingUrls: Record<string, string> = {
                Delhivery: `https://www.delhivery.com/track/package/${order.awbNumber}`,
                BlueDart: `https://www.bluedart.com/tracking/${order.awbNumber}`,
                DTDC: `https://www.dtdc.in/tracking.asp?strTrackNo=${order.awbNumber}`,
                Shiprocket: `https://shiprocket.co/tracking/${order.awbNumber}`,
                Ecom: `https://ecomexpress.in/tracking/?awb=${order.awbNumber}`,
            };
            const url = trackingUrls[courier] || `https://www.google.com/search?q=track+${order.awbNumber}`;
            window.open(url, "_blank");
        } else {
            alert("AWB number not available");
        }
    };

    const handleSendWhatsApp = () => {
        const phone = (order.senderPhone || order.customerPhone)?.replace(/\D/g, "");
        const name = order.senderName || order.customerName || "Customer";
        if (phone) {
            const message = `Hi ${name}, your shipment ${order.awbNumber || order.id} is ${order.status}. Track your order at ShipMitra. Thank you for choosing us!`;
            window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(message)}`, "_blank");
        } else {
            alert("Phone number not available");
        }
    };

    const handleDownloadInvoice = () => {
        if (order.invoiceId) {
            window.open(`/api/invoices/${order.invoiceId}/download`, "_blank");
        } else {
            // Try to find by order ID or show alert
            alert("Invoice not linked. Please check the Invoices page.");
        }
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    <Link href={`/orders/${order.id}`}>
                        <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Order
                        </DropdownMenuItem>
                    </Link>

                    <DropdownMenuItem onClick={handlePrintLabel} disabled={!order.labelUrl}>
                        <Printer className="h-4 w-4 mr-2" />
                        Print Label
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={handleTrackShipment} disabled={!order.awbNumber}>
                        <MapPin className="h-4 w-4 mr-2" />
                        Track Shipment
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={handleDownloadInvoice}>
                        <FileText className="h-4 w-4 mr-2" />
                        Download Invoice
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />
                    <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">
                        Update Status
                    </div>

                    <DropdownMenuItem onClick={() => handleUpdateStatus('pending')} disabled={order.status === 'pending' || order.status === 'cancelled' || order.status === 'delivered'}>
                        <Clock className="h-4 w-4 mr-2" />
                        Pending
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => handleUpdateStatus('in_transit')} disabled={order.status === 'in_transit' || order.status === 'cancelled' || order.status === 'delivered'}>
                        <Truck className="h-4 w-4 mr-2 text-blue-600" />
                        In Transit
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => handleUpdateStatus('delivered')} disabled={order.status === 'delivered' || order.status === 'cancelled'} className="text-green-600">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Delivered
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={handleSendWhatsApp}>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Send WhatsApp
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        onClick={() => setCancelDialogOpen(true)}
                        className="text-red-600 focus:text-red-600"
                        disabled={order.status === "cancelled" || order.status === "delivered"}
                    >
                        <XCircle className="h-4 w-4 mr-2" />
                        Cancel Order
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Cancel Confirmation Dialog */}
            <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cancel Order</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to cancel order {order.id}? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCancelDialogOpen(false)} disabled={cancelling}>
                            No, Keep Order
                        </Button>
                        <Button variant="destructive" onClick={handleCancelOrder} disabled={cancelling}>
                            {cancelling ? "Cancelling..." : "Yes, Cancel Order"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
