"use client";

import { useState } from "react";
import { Sidebar, Header } from "@/components/dashboard/layout";
import { ProtectedRoute } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, Truck, Package, MapPin, IndianRupee } from "lucide-react";

function ActualChargeContent() {
    const [loading, setLoading] = useState(false);
    const [originPincode, setOriginPincode] = useState("");
    const [destinationPincode, setDestinationPincode] = useState("");
    const [weight, setWeight] = useState("");
    const [length, setLength] = useState("10");
    const [width, setWidth] = useState("10");
    const [height, setHeight] = useState("10");
    const [paymentMode, setPaymentMode] = useState("Prepaid");
    const [rates, setRates] = useState<any[]>([]);

    const handleCalculateRate = async () => {
        if (!originPincode || !destinationPincode || !weight) {
            alert("Please fill in Origin, Destination, and Weight.");
            return;
        }

        setLoading(true);
        setRates([]);

        try {
            const response = await fetch("/api/rates/calculate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    origin: { pincode: originPincode },
                    destination: { pincode: destinationPincode },
                    packages: [
                        {
                            weight: parseFloat(weight),
                            length: parseFloat(length),
                            width: parseFloat(width),
                            height: parseFloat(height),
                        },
                    ],
                    paymentType: paymentMode,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to fetch rates");
            }

            if (data.rates && data.rates.length > 0) {
                setRates(data.rates);
            } else {
                alert("No rates found for this route.");
            }
        } catch (error: any) {
            console.error("Rate calculation error:", error);
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <Sidebar />
            <div className="lg:pl-64">
                <Header />
                <main className="p-6 lg:p-8">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-900">Actual Charge Calculator</h1>
                        <p className="text-gray-500 mt-1">
                            Calculate shipping rates across multiple courier partners based on actual weight.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Input Form */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Shipment Details</CardTitle>
                                <CardDescription>Enter details to get accurate rates.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="origin">Origin Pincode</Label>
                                        <div className="relative">
                                            <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                            <Input
                                                id="origin"
                                                placeholder="384001"
                                                className="pl-9"
                                                value={originPincode}
                                                onChange={(e) => setOriginPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="destination">Destination Pincode</Label>
                                        <div className="relative">
                                            <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                            <Input
                                                id="destination"
                                                placeholder="380015"
                                                className="pl-9"
                                                value={destinationPincode}
                                                onChange={(e) => setDestinationPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="weight">Actual Weight (kg)</Label>
                                    <div className="relative">
                                        <Package className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                        <Input
                                            id="weight"
                                            type="number"
                                            step="0.1"
                                            placeholder="0.5"
                                            className="pl-9"
                                            value={weight}
                                            onChange={(e) => setWeight(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Dimensions (cm) - Optional</Label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <Input placeholder="L" type="number" value={length} onChange={(e) => setLength(e.target.value)} />
                                        <Input placeholder="W" type="number" value={width} onChange={(e) => setWidth(e.target.value)} />
                                        <Input placeholder="H" type="number" value={height} onChange={(e) => setHeight(e.target.value)} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Payment Mode</Label>
                                    <Select value={paymentMode} onValueChange={setPaymentMode}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Prepaid">Prepaid</SelectItem>
                                            <SelectItem value="COD">COD (Cash on Delivery)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleCalculateRate} disabled={loading}>
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Calculating...
                                        </>
                                    ) : (
                                        <>
                                            <Truck className="mr-2 h-4 w-4" /> Get Rates
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Results */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Available Rates</CardTitle>
                                <CardDescription>
                                    {rates.length > 0
                                        ? `Found ${rates.length} courier services for this route.`
                                        : "Enter details and click 'Get Rates' to see options."}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {rates.length > 0 ? (
                                    <div className="space-y-4">
                                        {rates.map((rate, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between p-4 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors bg-white shadow-sm"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                                                        <Truck className="h-5 w-5 text-gray-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900">{rate.courierName}</p>
                                                        <p className="text-sm text-gray-500">{rate.serviceName}</p>
                                                        {rate.expectedDeliveryDate && (
                                                            <p className="text-xs text-green-600 mt-1">ETD: {rate.expectedDeliveryDate}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xl font-bold text-blue-600 flex items-center justify-end">
                                                        <IndianRupee className="h-4 w-4" />
                                                        {rate.rate.toFixed(2)}
                                                    </p>
                                                    <p className="text-xs text-gray-400">Total Charge</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-48 text-gray-400 border-2 border-dashed rounded-lg">
                                        <Truck className="h-12 w-12 mb-2 opacity-20" />
                                        <p>No rates calculated yet</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default function ActualChargePage() {
    return (
        <ProtectedRoute>
            <ActualChargeContent />
        </ProtectedRoute>
    );
}
