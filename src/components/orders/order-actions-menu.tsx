"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
    DropdownMenuPortal,
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
    Printer,
    MapPin,
    FileText,
    MessageSquare,
    RefreshCw,
    Clock,
    Truck,
    Package,
    CheckCircle,
    User,
    UserCheck,
    Bike,
    Receipt,
} from "lucide-react";
import { Order, Rider } from "@/types";
import { updateOrderStatus, getActiveRiders, assignRiderToOrder, updateOrderPurchaseDetails } from "@/lib/data";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

interface OrderActionsMenuProps {
    order: Order;
    onOrderUpdated?: () => void;
}

const orderStatuses = [
    { value: "pending", label: "Pending", icon: Clock, color: "text-yellow-600" },
    { value: "pickup_scheduled", label: "Pickup Scheduled", icon: Package, color: "text-blue-600" },
    { value: "picked_up", label: "Picked Up", icon: Package, color: "text-blue-600" },
    { value: "in_transit", label: "In Transit", icon: Truck, color: "text-purple-600" },
    { value: "delivered", label: "Delivered", icon: CheckCircle, color: "text-green-600" },
    { value: "cancelled", label: "Cancelled", icon: XCircle, color: "text-red-600" },
];

export function OrderActionsMenu({ order, onOrderUpdated }: OrderActionsMenuProps) {
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [riders, setRiders] = useState<Rider[]>([]);
    const [loadingRiders, setLoadingRiders] = useState(false);
    const [assigningRider, setAssigningRider] = useState(false);

    // Purchase Bill State
    const [billDialogOpen, setBillDialogOpen] = useState(false);
    const [linkingBill, setLinkingBill] = useState(false);
    const [billData, setBillData] = useState({
        billNumber: "",
        billDate: new Date().toISOString().split('T')[0],
        amount: "",
        gstAmount: "",
        courierName: "",
    });

    useEffect(() => {
        if (order.purchaseDetails) {
            setBillData({
                billNumber: order.purchaseDetails.billNumber,
                billDate: order.purchaseDetails.billDate,
                amount: order.purchaseDetails.amount.toString(),
                gstAmount: order.purchaseDetails.gstAmount.toString(),
                courierName: order.purchaseDetails.courierName,
            });
        } else {
            // Default values
            setBillData({
                billNumber: "",
                billDate: new Date().toISOString().split('T')[0],
                amount: "",
                gstAmount: "",
                courierName: order.courierPartner || order.courier || "",
            });
        }
    }, [order, billDialogOpen]);

    // Fetch riders when dropdown opens
    const handleRiderMenuOpen = async () => {
        if (riders.length === 0) {
            setLoadingRiders(true);
            try {
                const activeRiders = await getActiveRiders();
                setRiders(activeRiders);
            } catch (error) {
                console.error("Error fetching riders:", error);
            } finally {
                setLoadingRiders(false);
            }
        }
    };

    const handleCancelOrder = async () => {
        setCancelling(true);
        try {
            await updateOrderStatus(order.id, "cancelled");
            setCancelDialogOpen(false);
            onOrderUpdated?.();
        } catch (error) {
            console.error("Error cancelling order:", error);
        } finally {
            setCancelling(false);
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        if (newStatus === order.status) return;

        setUpdatingStatus(true);
        try {
            await updateOrderStatus(order.id, newStatus, "admin");
            onOrderUpdated?.();
        } catch (error) {
            console.error("Error updating order status:", error);
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleAssignRider = async (rider: Rider) => {
        setAssigningRider(true);
        try {
            const success = await assignRiderToOrder(order.id, rider.id, rider.name);
            if (success) {
                onOrderUpdated?.();
            }
        } catch (error) {
            console.error("Error assigning rider:", error);
        } finally {
            setAssigningRider(false);
        }
    };

    const handleSaveBill = async () => {
        setLinkingBill(true);
        try {
            const amount = parseFloat(billData.amount) || 0;
            const gstAmount = parseFloat(billData.gstAmount) || 0;
            const totalAmount = amount + gstAmount;

            await updateOrderPurchaseDetails(order.id, {
                billNumber: billData.billNumber,
                billDate: billData.billDate,
                amount,
                gstAmount,
                totalAmount,
                courierName: billData.courierName,
            });

            setBillDialogOpen(false);
            onOrderUpdated?.();
        } catch (error) {
            console.error("Error saving bill:", error);
        } finally {
            setLinkingBill(false);
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
            // Try by order id
            window.open(`/api/invoices/${order.id}/download`, "_blank");
        }
    };

    // Get assigned rider info
    const assignedRiderId = (order as any).assignedRider;
    const assignedRiderName = (order as any).riderName;

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" disabled={updatingStatus || assigningRider}>
                        {updatingStatus || assigningRider ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                            <MoreVertical className="h-4 w-4" />
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                    <Link href={`/orders/${order.id}`}>
                        <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Order
                        </DropdownMenuItem>
                    </Link>

                    {/* Change Status Submenu */}
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Change Status
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuSubContent className="w-44">
                                {orderStatuses.map((status) => {
                                    const Icon = status.icon;
                                    const isCurrentStatus = order.status === status.value;
                                    return (
                                        <DropdownMenuItem
                                            key={status.value}
                                            onClick={() => handleStatusChange(status.value)}
                                            disabled={isCurrentStatus}
                                            className={isCurrentStatus ? "bg-gray-100" : ""}
                                        >
                                            <Icon className={`h-4 w-4 mr-2 ${status.color}`} />
                                            {status.label}
                                            {isCurrentStatus && (
                                                <span className="ml-auto text-xs text-gray-400">Current</span>
                                            )}
                                        </DropdownMenuItem>
                                    );
                                })}
                            </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                    </DropdownMenuSub>

                    {/* Assign Rider Submenu */}
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger onPointerEnter={handleRiderMenuOpen}>
                            <Bike className="h-4 w-4 mr-2" />
                            Assign Rider
                            {assignedRiderName && (
                                <span className="ml-auto text-xs text-green-600">✓</span>
                            )}
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuSubContent className="w-48">
                                {assignedRiderName && (
                                    <>
                                        <div className="px-2 py-1.5 text-xs text-gray-500">
                                            Current: <span className="font-medium text-gray-700">{assignedRiderName}</span>
                                        </div>
                                        <DropdownMenuSeparator />
                                    </>
                                )}
                                {loadingRiders ? (
                                    <DropdownMenuItem disabled>
                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                        Loading riders...
                                    </DropdownMenuItem>
                                ) : riders.length === 0 ? (
                                    <DropdownMenuItem disabled>
                                        <User className="h-4 w-4 mr-2" />
                                        No active riders
                                    </DropdownMenuItem>
                                ) : (
                                    riders.map((rider) => {
                                        const isAssigned = assignedRiderId === rider.id;
                                        return (
                                            <DropdownMenuItem
                                                key={rider.id}
                                                onClick={() => handleAssignRider(rider)}
                                                disabled={isAssigned}
                                                className={isAssigned ? "bg-green-50" : ""}
                                            >
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2 ${isAssigned ? "bg-green-600" : "bg-gray-400"}`}>
                                                    {rider.name.charAt(0)}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-medium text-sm">{rider.name}</div>
                                                    <div className="text-xs text-gray-500">{rider.vehicleType}</div>
                                                </div>
                                                {isAssigned && <UserCheck className="h-4 w-4 text-green-600" />}
                                            </DropdownMenuItem>
                                        );
                                    })
                                )}
                            </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                    </DropdownMenuSub>

                    <DropdownMenuItem onClick={() => setBillDialogOpen(true)}>
                        <Receipt className="h-4 w-4 mr-2" />
                        Link Purchase Bill
                        {order.purchaseDetails && (
                            <span className="ml-auto text-xs text-green-600">✓</span>
                        )}
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuSeparator />

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

                    <DropdownMenuItem onClick={handleSendWhatsApp}>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Send WhatsApp
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

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

            {/* Purchase Bill Dialog */}
            <Dialog open={billDialogOpen} onOpenChange={setBillDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Link Purchase Bill</DialogTitle>
                        <DialogDescription>
                            Enter details of the courier invoice/bill for this shipment.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="billNumber">Bill Number</Label>
                                <Input
                                    id="billNumber"
                                    value={billData.billNumber}
                                    onChange={(e) => setBillData({ ...billData, billNumber: e.target.value })}
                                    placeholder="INV-123"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="billDate">Bill Date</Label>
                                <Input
                                    id="billDate"
                                    type="date"
                                    value={billData.billDate}
                                    onChange={(e) => setBillData({ ...billData, billDate: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="courierName">Courier Name</Label>
                            <Input
                                id="courierName"
                                value={billData.courierName}
                                onChange={(e) => setBillData({ ...billData, courierName: e.target.value })}
                                placeholder="e.g. Delhivery, BlueDart"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="amount">Base Amount (₹)</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    value={billData.amount}
                                    onChange={(e) => {
                                        const amt = parseFloat(e.target.value) || 0;
                                        // Auto-calculate GST (18%)
                                        const gst = (amt * 0.18).toFixed(2);
                                        setBillData({ ...billData, amount: e.target.value, gstAmount: gst });
                                    }}
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="gstAmount">GST Amount (₹)</Label>
                                <Input
                                    id="gstAmount"
                                    type="number"
                                    value={billData.gstAmount}
                                    onChange={(e) => setBillData({ ...billData, gstAmount: e.target.value })}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                            <span className="font-medium text-sm">Total Bill Amount:</span>
                            <span className="font-bold text-lg">
                                ₹{((parseFloat(billData.amount) || 0) + (parseFloat(billData.gstAmount) || 0)).toFixed(2)}
                            </span>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setBillDialogOpen(false)} disabled={linkingBill}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveBill} disabled={linkingBill}>
                            {linkingBill ? "Saving..." : "Save Bill Details"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
