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
import { AlertTriangle, DollarSign, Loader2, MapPin, Package, Truck } from "lucide-react";

interface ShippingRate {
    courier_company_id: number;
    courier_name: string;
    total_amount: number;
    estimated_delivery_days: string;
    cod_charges?: number;
    freight_charge?: number;
    other_charges?: number;
    charge_AIR?: number;
    charge_AWB?: number;
    charge_CCOD?: number;
    charge_CNC?: number;
    charge_COD?: number;
    charge_COVID?: number;
    charge_CWH?: number;
    charge_DEMUR?: number;
    charge_DL?: number;
    charge_DOCUMENT?: number;
    charge_DPH?: number;
    charge_DTO?: number;
    charge_E2E?: number;
    charge_FOD?: number;
    charge_FOV?: number;
    charge_FS?: number;
    charge_FSC?: number;
    charge_INS?: number;
    charge_LABEL?: number;
    charge_LM?: number;
    charge_MPS?: number;
    charge_POD?: number;
    charge_QC?: number;
    charge_REATTEMPT?: number;
    charge_ROV?: number;
    charge_RTO?: number;
    charge_WOD?: number;
    charge_pickup?: number;
    charged_weight?: number;
    gross_amount?: number;
    status?: string;
    zone?: string;
    tax_data?: Record<string, number>;
    wt_rule_id?: string | null;
    zonal_cl?: string | null;
    adhoc_data?: Record<string, unknown>;
    _provider?: "delhivery" | "shiprocket";
}

const billingModes = [
    { label: "Express (E)", value: "E" },
    { label: "Surface (S)", value: "S" },
];

const statuses = [
    { label: "DTO", value: "DTO" },
    { label: "RTO", value: "RTO" },
    { label: "Delivered", value: "Delivered" },
];

const paymentModes = [
    { label: "Pre-paid", value: "Pre-paid" },
    { label: "COD", value: "COD" },
];

function ActualChargeContent() {
    const [loading, setLoading] = useState(false);
    const [pickupPostcode, setPickupPostcode] = useState("");
    const [deliveryPostcode, setDeliveryPostcode] = useState("");
    const [weight, setWeight] = useState("");
    const [noOfPieces, setNoOfPieces] = useState("");
    const [length, setLength] = useState("");
    const [width, setWidth] = useState("");
    const [breadth, setBreadth] = useState("");
    const [billingMode, setBillingMode] = useState<"E" | "S">("E");
    const [status, setStatus] = useState("");
    const [paymentMode, setPaymentMode] = useState<"Pre-paid" | "COD">("Pre-paid");
    const [rates, setRates] = useState<ShippingRate[]>([]);
    const [error, setError] = useState<string | null>(null);

    const handleCalculateRate = async () => {
        if (!pickupPostcode || !deliveryPostcode || !weight || !noOfPieces || !length || !width || !breadth || !status) {
            setError("Please fill in all shipment details.");
            return;
        }

        if (isNaN(Number(weight))) {
            setError("Weight must be a valid number.");
            return;
        }

        if (Number(weight) > 50) {
            setError("For shipments over 50kg, please contact support for specialized rates.");
            return;
        }

        setLoading(true);
        setRates([]);
        setError(null);

        try {
            const response = await fetch("/api/rates/calculate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    origin: { pincode: pickupPostcode },
                    destination: { pincode: deliveryPostcode },
                    packages: [
                        {
                            weight: parseFloat(weight),
                            length: parseFloat(length),
                            width: parseFloat(width),
                            height: parseFloat(breadth),
                        },
                    ],
                    paymentType: paymentMode,
                    pieces: Number(noOfPieces),
                    billingMode,
                    status,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to fetch rates");
            }

            const detailedRates: ShippingRate[] = Array.isArray(data.detailedRates) ? data.detailedRates : [];
            const filteredRates = detailedRates.filter((r) => String(r.courier_name || "").toLowerCase() !== "fedex");

            if (filteredRates.length > 0) {
                setRates(filteredRates);
            } else {
                setError("No shipping rates available for this route.");
            }
        } catch (error: any) {
            console.error("Rate calculation error:", error);
            setError(error.message || "Failed to calculate rates.");
        } finally {
            setLoading(false);
        }
    };

    const renderChargeDetails = (rate: ShippingRate) => {
        const chargeFields = [
            { label: "AIR", value: rate.charge_AIR },
            { label: "AWB", value: rate.charge_AWB },
            { label: "CCOD", value: rate.charge_CCOD },
            { label: "CNC", value: rate.charge_CNC },
            { label: "COD", value: rate.charge_COD },
            { label: "COVID", value: rate.charge_COVID },
            { label: "CWH", value: rate.charge_CWH },
            { label: "DEMUR", value: rate.charge_DEMUR },
            { label: "DL", value: rate.charge_DL },
            { label: "DOCUMENT", value: rate.charge_DOCUMENT },
            { label: "DPH", value: rate.charge_DPH },
            { label: "DTO", value: rate.charge_DTO },
            { label: "E2E", value: rate.charge_E2E },
            { label: "FOD", value: rate.charge_FOD },
            { label: "FOV", value: rate.charge_FOV },
            { label: "FS", value: rate.charge_FS },
            { label: "FSC", value: rate.charge_FSC },
            { label: "INS", value: rate.charge_INS },
            { label: "LABEL", value: rate.charge_LABEL },
            { label: "LM", value: rate.charge_LM },
            { label: "MPS", value: rate.charge_MPS },
            { label: "POD", value: rate.charge_POD },
            { label: "QC", value: rate.charge_QC },
            { label: "REATTEMPT", value: rate.charge_REATTEMPT },
            { label: "ROV", value: rate.charge_ROV },
            { label: "RTO", value: rate.charge_RTO },
            { label: "WOD", value: rate.charge_WOD },
            { label: "Pickup", value: rate.charge_pickup },
        ].filter((field) => field.value !== undefined && field.value !== null && Number(field.value) > 0);

        if (chargeFields.length === 0) return null;

        return (
            <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Charge Breakdown:</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {chargeFields.map((field) => (
                        <div key={field.label} className="text-xs bg-blue-50 p-2 rounded-lg">
                            <span className="font-medium">{field.label}:</span> ₹{field.value}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <Sidebar />
            <div className="lg:pl-64">
                <Header />
                <main className="p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto">
                        <h1 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <Truck className="h-8 w-8 text-blue-600" />
                            Shipping Rate Calculator
                        </h1>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-1 space-y-6">
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <div className="text-sm text-red-600 font-medium">
                                        * All fields are required for accurate rate calculation
                                    </div>
                                </div>

                                <Card className="border border-gray-200">
                                    <CardHeader>
                                        <CardTitle className="text-lg">Shipment Route</CardTitle>
                                        <CardDescription className="text-gray-600">
                                            Enter pickup and delivery locations
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="pickup-postcode">Pickup Postcode</Label>
                                            <div className="relative">
                                                <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                                <Input
                                                    id="pickup-postcode"
                                                    placeholder="e.g., 110001"
                                                    value={pickupPostcode}
                                                    onChange={(e) => setPickupPostcode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                                    className="bg-white pl-9"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="delivery-postcode">Delivery Postcode</Label>
                                            <div className="relative">
                                                <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                                <Input
                                                    id="delivery-postcode"
                                                    placeholder="e.g., 400001"
                                                    value={deliveryPostcode}
                                                    onChange={(e) => setDeliveryPostcode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                                    className="bg-white pl-9"
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border border-gray-200">
                                    <CardHeader>
                                        <CardTitle className="text-lg">Package Details</CardTitle>
                                        <CardDescription className="text-gray-600">
                                            Specify package dimensions and weight
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="weight">Weight (kg)</Label>
                                                <div className="relative">
                                                    <Package className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                                    <Input
                                                        id="weight"
                                                        placeholder="0.5"
                                                        value={weight}
                                                        onChange={(e) => setWeight(e.target.value)}
                                                        className="bg-white pl-9"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="pieces">Pieces</Label>
                                                <Input
                                                    id="pieces"
                                                    placeholder="1"
                                                    value={noOfPieces}
                                                    onChange={(e) => setNoOfPieces(e.target.value.replace(/\D/g, ""))}
                                                    className="bg-white"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="space-y-2">
                                                <Label htmlFor="length">Length (cm)</Label>
                                                <Input
                                                    id="length"
                                                    placeholder="10"
                                                    value={length}
                                                    onChange={(e) => setLength(e.target.value)}
                                                    className="bg-white"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="width">Width (cm)</Label>
                                                <Input
                                                    id="width"
                                                    placeholder="10"
                                                    value={width}
                                                    onChange={(e) => setWidth(e.target.value)}
                                                    className="bg-white"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="breadth">Breadth (cm)</Label>
                                                <Input
                                                    id="breadth"
                                                    placeholder="10"
                                                    value={breadth}
                                                    onChange={(e) => setBreadth(e.target.value)}
                                                    className="bg-white"
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border border-gray-200">
                                    <CardHeader>
                                        <CardTitle className="text-lg">Shipping Options</CardTitle>
                                        <CardDescription className="text-gray-600">
                                            Configure shipping preferences
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Billing Mode</Label>
                                            <Select value={billingMode} onValueChange={(v) => setBillingMode(v as "E" | "S")}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {billingModes.map((m) => (
                                                        <SelectItem key={m.value} value={m.value}>
                                                            {m.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Payment Mode</Label>
                                            <Select value={paymentMode} onValueChange={(v) => setPaymentMode(v as "Pre-paid" | "COD")}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {paymentModes.map((m) => (
                                                        <SelectItem key={m.value} value={m.value}>
                                                            {m.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Status</Label>
                                            <Select value={status} onValueChange={setStatus}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {statuses.map((s) => (
                                                        <SelectItem key={s.value} value={s.value}>
                                                            {s.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <Button
                                            onClick={handleCalculateRate}
                                            disabled={loading}
                                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Calculating...
                                                </>
                                            ) : (
                                                "Calculate Rates"
                                            )}
                                        </Button>
                                    </CardContent>
                                </Card>

                                {error && (
                                    <Card className="border border-red-200 bg-red-50">
                                        <CardHeader className="flex flex-row items-start space-x-3">
                                            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                                            <div>
                                                <CardTitle className="text-red-800">Error</CardTitle>
                                                <CardDescription className="text-red-600">
                                                    {error}
                                                </CardDescription>
                                            </div>
                                        </CardHeader>
                                    </Card>
                                )}
                            </div>

                            <div className="lg:col-span-2 space-y-6">
                                <Card className="border border-gray-200">
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <DollarSign className="h-5 w-5 text-green-600" />
                                            Shipping Rates
                                        </CardTitle>
                                        <CardDescription className="text-gray-600">
                                            Compare rates from different couriers
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {loading ? (
                                            <div className="flex flex-col items-center justify-center py-12">
                                                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                                                <p className="mt-4 text-gray-600">Calculating rates...</p>
                                            </div>
                                        ) : rates.length > 0 ? (
                                            <div className="space-y-4">
                                                {rates
                                                    .sort((a, b) => a.total_amount - b.total_amount)
                                                    .map((rate) => {
                                                        const providerLabel = rate._provider === "shiprocket" ? "Shiprocket" : "Delhivery";
                                                        const weightUnit = rate._provider === "shiprocket" ? "kg" : "g";

                                                        return (
                                                            <Card
                                                                key={`${rate.courier_company_id}-${rate.courier_name}`}
                                                                className="border border-gray-200"
                                                            >
                                                                <CardHeader className="pb-0">
                                                                    <div className="flex justify-between items-center">
                                                                        <div className="flex items-center gap-2">
                                                                            <Package className={`h-5 w-5 ${rate._provider === "shiprocket" ? "text-green-600" : "text-blue-600"}`} />
                                                                            <CardTitle>{rate.courier_name}</CardTitle>
                                                                        </div>
                                                                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                                                                            {providerLabel}
                                                                        </span>
                                                                    </div>
                                                                </CardHeader>
                                                                <CardContent className="pt-4">
                                                                    <div className="grid grid-cols-2 gap-4">
                                                                        <div className="bg-blue-50 p-3 rounded-lg">
                                                                            <p className="text-sm text-gray-500">Total Amount</p>
                                                                            <p className="text-xl font-bold text-blue-600">
                                                                                ₹{rate.total_amount}
                                                                            </p>
                                                                        </div>
                                                                        {weight && Number(weight) > 0 && (
                                                                            <div className="bg-green-50 p-3 rounded-lg">
                                                                                <p className="text-sm text-gray-500">Per Kg Rate</p>
                                                                                <p className="text-lg font-semibold text-green-600">
                                                                                    ₹{(rate.total_amount / Number(weight)).toFixed(2)}/kg
                                                                                </p>
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                                                                        <div>
                                                                            <p className="text-sm text-gray-500">Delivery Days</p>
                                                                            <p className="font-medium">{rate.estimated_delivery_days}</p>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-sm text-gray-500">Zone</p>
                                                                            <p className="font-medium">{rate.zone ?? "-"}</p>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-sm text-gray-500">Weight</p>
                                                                            <p className="font-medium">
                                                                                {rate.charged_weight ?? "-"}{rate.charged_weight ? weightUnit : ""}
                                                                            </p>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-sm text-gray-500">COD Charges</p>
                                                                            <p className="font-medium">₹{rate.cod_charges ?? 0}</p>
                                                                        </div>
                                                                    </div>

                                                                    {rate.tax_data && Object.values(rate.tax_data).some((v) => Number(v) > 0) && (
                                                                        <div className="mt-4">
                                                                            <h4 className="text-sm font-medium mb-2">Taxes</h4>
                                                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                                                {Object.entries(rate.tax_data)
                                                                                    .filter(([_, value]) => Number(value) > 0)
                                                                                    .map(([key, value]) => (
                                                                                        <div key={key} className="text-xs bg-gray-100 p-2 rounded">
                                                                                            <span className="font-medium">{key}:</span> ₹{Number(value)}
                                                                                        </div>
                                                                                    ))}
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {renderChargeDetails(rate)}
                                                                </CardContent>
                                                            </Card>
                                                        );
                                                    })}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                                <Package className="h-12 w-12 text-gray-400 mb-4" />
                                                <h3 className="text-lg font-medium text-gray-900 mb-1">
                                                    No rates calculated yet
                                                </h3>
                                                <p className="text-gray-500">
                                                    Enter your shipment details and click &quot;Calculate Rates&quot;
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
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
