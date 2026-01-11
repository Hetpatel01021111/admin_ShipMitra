"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { addRider, updateRider } from "@/lib/data";
import { Rider } from "@/types";
import { Loader2 } from "lucide-react";

interface RiderModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onRiderSaved: () => void;
    editRider?: Rider | null;
}

const vehicleTypes = ["Bike", "Scooter", "Auto", "Van", "Truck"];

export function RiderModal({ open, onOpenChange, onRiderSaved, editRider }: RiderModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        vehicleType: "Bike",
        vehicleNumber: "",
        licenseNumber: "",
        address: "",
        isActive: true,
    });

    // Reset form when modal opens or editRider changes
    useEffect(() => {
        if (editRider) {
            setFormData({
                name: editRider.name || "",
                phone: editRider.phone || "",
                vehicleType: editRider.vehicleType || "Bike",
                vehicleNumber: (editRider as any).vehicleNumber || "",
                licenseNumber: (editRider as any).licenseNumber || "",
                address: (editRider as any).address || "",
                isActive: editRider.isActive ?? true,
            });
        } else {
            setFormData({
                name: "",
                phone: "",
                vehicleType: "Bike",
                vehicleNumber: "",
                licenseNumber: "",
                address: "",
                isActive: true,
            });
        }
    }, [editRider, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (editRider) {
                // Update existing rider
                const success = await updateRider(editRider.id, formData as any);
                if (success) {
                    onRiderSaved();
                    onOpenChange(false);
                }
            } else {
                // Add new rider
                const riderId = await addRider({
                    name: formData.name,
                    phone: formData.phone,
                    vehicleType: formData.vehicleType,
                    isActive: formData.isActive,
                    assignedOrders: [],
                    completedPickups: 0,
                    earnings: 0,
                    payoutDue: 0,
                    rating: 5.0,
                    createdAt: new Date(),
                    // Additional fields
                    vehicleNumber: formData.vehicleNumber,
                    licenseNumber: formData.licenseNumber,
                    address: formData.address,
                } as any);

                if (riderId) {
                    onRiderSaved();
                    onOpenChange(false);
                }
            }
        } catch (error) {
            console.error("Error saving rider:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {editRider ? "Edit Rider" : "Add New Rider"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Enter rider name"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number *</Label>
                            <Input
                                id="phone"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="9876543210"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="vehicleType">Vehicle Type *</Label>
                            <Select
                                value={formData.vehicleType}
                                onValueChange={(value) => setFormData({ ...formData, vehicleType: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select vehicle" />
                                </SelectTrigger>
                                <SelectContent>
                                    {vehicleTypes.map((type) => (
                                        <SelectItem key={type} value={type}>
                                            {type}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="vehicleNumber">Vehicle Number</Label>
                            <Input
                                id="vehicleNumber"
                                value={formData.vehicleNumber}
                                onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                                placeholder="GJ 01 XX 1234"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="licenseNumber">License Number</Label>
                            <Input
                                id="licenseNumber"
                                value={formData.licenseNumber}
                                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                                placeholder="DL1234567890"
                            />
                        </div>

                        <div className="space-y-2 flex items-end">
                            <div className="flex items-center space-x-2 pb-2">
                                <Switch
                                    id="isActive"
                                    checked={formData.isActive}
                                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                                />
                                <Label htmlFor="isActive">Active Status</Label>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Input
                            id="address"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            placeholder="Enter rider address"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {editRider ? "Update Rider" : "Add Rider"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
