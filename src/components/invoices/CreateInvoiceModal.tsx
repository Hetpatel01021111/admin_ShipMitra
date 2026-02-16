"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InvoicePreview } from "./InvoicePreview";
import { createInvoice, getNextInvoiceNumber, updateInvoice } from "@/lib/data";
import { generateInvoiceHTML } from "@/lib/invoice-generator";
import { Plus, Trash2, Download, Save, Loader2, Package, MapPin, Truck, Sparkles, Camera } from "lucide-react";

interface PackageDetails {
    id: string;
    productName: string;
    boxes: number;
    quantity: number;
    length: number;
    width: number;
    height: number;
    actualWeight: number;
}

interface CreateInvoiceModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onInvoiceCreated?: () => void;
    editInvoice?: any; // Invoice data to edit (if provided, modal is in edit mode)
}

// Company constants
const COMPANY = {
    name: "Shipmitra Tech Private Limited",
    address: "13- Janta Super Market, Rajmahel Road, Mahesana Bazar, Mahesana - 384001, Gujarat",
    gstin: "Applied for GST",
    email: "ceo@shipmitra.net",
    phone: "+91 8469561212",
};

const CGST_RATE = 0.09;
const SGST_RATE = 0.09;

// Pincode lookup function using India Post API
async function fetchPincodeDetails(pincode: string): Promise<{ city: string; state: string } | null> {
    if (pincode.length !== 6) return null;

    try {
        const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
        const data = await response.json();

        if (data[0]?.Status === "Success" && data[0]?.PostOffice?.length > 0) {
            const postOffice = data[0].PostOffice[0];
            return {
                city: postOffice.District || postOffice.Name,
                state: postOffice.State,
            };
        }
        return null;
    } catch (error) {
        console.error("Error fetching pincode details:", error);
        return null;
    }
}

export function CreateInvoiceModal({
    open,
    onOpenChange,
    onInvoiceCreated,
    editInvoice,
}: CreateInvoiceModalProps) {
    const isEditMode = !!editInvoice;
    const [loading, setLoading] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<"origin" | "destination" | "package" | "charges">("origin");

    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Invoice Number (auto-generated)
    const [invoiceNumber, setInvoiceNumber] = useState<string>("");

    // AWB Number
    const [awbNumber, setAwbNumber] = useState("");
    const [courierPartner, setCourierPartner] = useState("");

    // Origin (Consignor/Shipper)
    const [originName, setOriginName] = useState("");
    const [originAddress, setOriginAddress] = useState("");
    const [originPincode, setOriginPincode] = useState("");
    const [originCity, setOriginCity] = useState("");
    const [originState, setOriginState] = useState("");
    const [originPhone, setOriginPhone] = useState("");
    const [originGstin, setOriginGstin] = useState("");
    const [originPincodeLoading, setOriginPincodeLoading] = useState(false);

    // Destination (Consignee)
    const [destinationName, setDestinationName] = useState("");
    const [destinationAddress, setDestinationAddress] = useState("");
    const [destinationPincode, setDestinationPincode] = useState("");
    const [destinationCity, setDestinationCity] = useState("");
    const [destinationState, setDestinationState] = useState("");
    const [destinationPhone, setDestinationPhone] = useState("");
    const [destinationGstin, setDestinationGstin] = useState("");
    const [destinationPincodeLoading, setDestinationPincodeLoading] = useState(false);

    // Package Details
    const [packages, setPackages] = useState<PackageDetails[]>([
        { id: "1", productName: "", boxes: 1, quantity: 1, length: 0, width: 0, height: 0, actualWeight: 0 }
    ]);
    const [declaredValue, setDeclaredValue] = useState(0);

    // Payment Mode
    const [paymentMode, setPaymentMode] = useState<"prepaid" | "cod" | "credit">("prepaid");
    const [codAmount, setCodAmount] = useState(0);

    // Charges
    const [freight, setFreight] = useState(0);
    const [fuelSurcharge, setFuelSurcharge] = useState(0);
    const [awbFee, setAwbFee] = useState(0);
    const [odaCharge, setOdaCharge] = useState(0);
    const [codCharge, setCodCharge] = useState(0);
    const [handlingCharge, setHandlingCharge] = useState(0);
    const [insuranceCharge, setInsuranceCharge] = useState(0);
    const [otherCharges, setOtherCharges] = useState(0);

    // Fetch next invoice number when modal opens (only for create mode)
    useEffect(() => {
        if (open && !isEditMode) {
            getNextInvoiceNumber().then(num => setInvoiceNumber(num));
        }
    }, [open, isEditMode]);

    // Populate form when editing an existing invoice
    useEffect(() => {
        if (open && editInvoice) {
            setInvoiceNumber(editInvoice.invoiceNumber || "");
            setAwbNumber(editInvoice.awbNumber || "");
            setCourierPartner(editInvoice.courierPartner || "");
            // Origin
            setOriginName(editInvoice.originName || "");
            setOriginAddress(editInvoice.originAddress || "");
            setOriginPincode(editInvoice.originPincode || "");
            setOriginCity(editInvoice.originCity || "");
            setOriginState(editInvoice.originState || "");
            setOriginPhone(editInvoice.originPhone || "");
            setOriginGstin(editInvoice.originGstin || "");
            // Destination
            setDestinationName(editInvoice.destinationName || "");
            setDestinationAddress(editInvoice.destinationAddress || "");
            setDestinationPincode(editInvoice.destinationPincode || "");
            setDestinationCity(editInvoice.destinationCity || "");
            setDestinationState(editInvoice.destinationState || "");
            setDestinationPhone(editInvoice.destinationPhone || "");
            setDestinationGstin(editInvoice.destinationGstin || "");
            // Packages
            if (editInvoice.packages && editInvoice.packages.length > 0) {
                setPackages(editInvoice.packages.map((pkg: any, index: number) => ({
                    id: pkg.id || String(index + 1),
                    productName: pkg.productName || "",
                    boxes: pkg.boxes || 1,
                    quantity: pkg.quantity || 1,
                    length: pkg.length || 0,
                    width: pkg.width || 0,
                    height: pkg.height || 0,
                    actualWeight: pkg.actualWeight || 0,
                })));
            }
            setDeclaredValue(editInvoice.declaredValue || 0);
            setPaymentMode(editInvoice.paymentMode || "prepaid");
            setCodAmount(editInvoice.codAmount || 0);
            // Charges
            const charges = editInvoice.charges || {};
            setFreight(charges.freight || 0);
            setFuelSurcharge(charges.fuelSurcharge || 0);
            setAwbFee(charges.awbFee || 0);
            setOdaCharge(charges.odaCharge || 0);
            setCodCharge(charges.codCharge || 0);
            setHandlingCharge(charges.handlingCharge || 0);
            setInsuranceCharge(charges.insuranceCharge || 0);
            setOtherCharges(charges.otherCharges || 0);
        }
    }, [open, editInvoice]);

    // Origin pincode auto-fetch
    useEffect(() => {
        if (originPincode.length === 6) {
            setOriginPincodeLoading(true);
            fetchPincodeDetails(originPincode).then(result => {
                if (result) {
                    setOriginCity(result.city);
                    setOriginState(result.state);
                }
                setOriginPincodeLoading(false);
            });
        }
    }, [originPincode]);

    // Destination pincode auto-fetch
    useEffect(() => {
        if (destinationPincode.length === 6) {
            setDestinationPincodeLoading(true);
            fetchPincodeDetails(destinationPincode).then(result => {
                if (result) {
                    setDestinationCity(result.city);
                    setDestinationState(result.state);
                }
                setDestinationPincodeLoading(false);
            });
        }
    }, [destinationPincode]);

    // Calculate dimensional weight for each package
    const packagesWithDimWeight = useMemo(() => {
        return packages.map(pkg => ({
            ...pkg,
            dimWeight: (pkg.length * pkg.width * pkg.height) / 5000 // Standard volumetric divisor
        }));
    }, [packages]);

    // Calculate totals
    const calculations = useMemo(() => {
        const subtotal = freight + fuelSurcharge + awbFee + odaCharge + codCharge + handlingCharge + insuranceCharge + otherCharges;
        const cgst = subtotal * CGST_RATE;
        const sgst = subtotal * SGST_RATE;
        const grandTotal = Math.round(subtotal + cgst + sgst);

        return { subtotal, cgst, sgst, grandTotal };
    }, [freight, fuelSurcharge, awbFee, odaCharge, codCharge, handlingCharge, insuranceCharge, otherCharges]);

    // Charges object for preview
    const chargesObj = useMemo(() => ({
        freight,
        fuelSurcharge,
        awbFee,
        odaCharge,
        codCharge,
        handlingCharge,
        insuranceCharge,
        otherCharges,
    }), [freight, fuelSurcharge, awbFee, odaCharge, codCharge, handlingCharge, insuranceCharge, otherCharges]);

    // Get today's date
    const today = new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    // Add new package
    const addPackage = useCallback(() => {
        setPackages(prev => [...prev, {
            id: Date.now().toString(),
            productName: "",
            boxes: 1,
            quantity: 1,
            length: 0,
            width: 0,
            height: 0,
            actualWeight: 0,
        }]);
    }, []);

    // Remove package
    const removePackage = useCallback((id: string) => {
        setPackages(prev => prev.length > 1 ? prev.filter(pkg => pkg.id !== id) : prev);
    }, []);

    // Update package
    const updatePackage = useCallback((id: string, field: keyof PackageDetails, value: string | number) => {
        setPackages(prev => prev.map(pkg =>
            pkg.id === id ? { ...pkg, [field]: value } : pkg
        ));
    }, []);

    const [rateOptions, setRateOptions] = useState<any[]>([]);

    // Calculate FedEx Rate
    const handleCalculateRate = async () => {
        if (!originPincode || !destinationPincode || packages.length === 0) {
            alert("Please fill in Origin Pincode, Destination Pincode, and at least one Package.");
            return;
        }

        setLoading(true);
        setRateOptions([]); // Clear previous
        try {
            const response = await fetch('/api/rates/calculate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    origin: { pincode: originPincode },
                    destination: { pincode: destinationPincode },
                    packages: packages.map(p => ({
                        weight: p.actualWeight,
                        length: p.length,
                        width: p.width,
                        height: p.height
                    })),
                    paymentType: paymentMode === 'cod' ? 'COD' : 'Prepaid',
                    declaredValue: declaredValue
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch rate');
            }

            if (data.rates && data.rates.length > 0) {
                setRateOptions(data.rates);
            } else {
                alert("No rates available for this route.");
            }
        } catch (error: any) {
            console.error("Rate calculation error:", error);
            alert("Error fetching rate: " + error.message);
        } finally {
            setLoading(false);
        }
    };


    // AI Invoice Extraction Handler
    const handleAiExtraction = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Vercel Serverless Function Limit is 4.5MB. We restrict to 4MB to be safe.
        if (file.size > 4 * 1024 * 1024) {
            alert("File size too large. Please upload an image smaller than 4MB.");
            event.target.value = ""; // Reset input
            return;
        }

        setAiLoading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/ai/extract-invoice', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (!result.success || !result.data) {
                throw new Error(result.error || "Failed to extract data");
            }

            const data = result.data;

            // Auto-fill form fields
            if (data.invoiceNumber) setInvoiceNumber(data.invoiceNumber);

            // Origin
            if (data.origin) {
                if (data.origin.name) setOriginName(data.origin.name);
                if (data.origin.address) setOriginAddress(data.origin.address);
                if (data.origin.city) setOriginCity(data.origin.city);
                if (data.origin.state) setOriginState(data.origin.state);
                if (data.origin.pincode) setOriginPincode(data.origin.pincode);
                if (data.origin.phone) setOriginPhone(data.origin.phone);
                if (data.origin.gstin) setOriginGstin(data.origin.gstin);
            }

            // Destination
            if (data.destination) {
                if (data.destination.name) setDestinationName(data.destination.name);
                if (data.destination.address) setDestinationAddress(data.destination.address);
                if (data.destination.city) setDestinationCity(data.destination.city);
                if (data.destination.state) setDestinationState(data.destination.state);
                if (data.destination.pincode) setDestinationPincode(data.destination.pincode);
                if (data.destination.phone) setDestinationPhone(data.destination.phone);
                if (data.destination.gstin) setDestinationGstin(data.destination.gstin);
            }

            // Packages
            if (data.packages && Array.isArray(data.packages) && data.packages.length > 0) {
                setPackages(data.packages.map((pkg: any, index: number) => ({
                    id: Date.now().toString() + index,
                    productName: pkg.productName || pkg.description || "Package",
                    boxes: pkg.boxes || 1,
                    quantity: pkg.quantity || 1,
                    length: pkg.length || 0,
                    width: pkg.width || 0,
                    height: pkg.height || 0,
                    actualWeight: pkg.actualWeight || 0,
                })));
            }

            // Declared Value
            if (data.declaredValue) setDeclaredValue(Number(data.declaredValue));

            alert("Invoice details extracted successfully! Please review and edit if needed.");
        } catch (error: any) {
            console.error("AI Extraction Failed:", error);
            alert("Failed to extract invoice details using AI. Please try again manually.");
        } finally {
            setAiLoading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = ""; // Reset input
            }
        }
    };

    // Handle form submission
    const handleSubmit = async (saveAsDraft: boolean = false) => {
        setLoading(true);

        try {
            const invoiceData = {
                invoiceNumber,
                awbNumber,
                courierPartner,
                // Origin
                originName,
                originAddress,
                originCity,
                originState,
                originPincode,
                originPhone,
                originGstin,
                // Destination
                destinationName,
                destinationAddress,
                destinationCity,
                destinationState,
                destinationPincode,
                destinationPhone,
                destinationGstin,
                // Packages
                packages: packagesWithDimWeight,
                declaredValue,
                // Payment
                paymentMode,
                codAmount: paymentMode === 'cod' ? codAmount : 0,
                // Charges
                charges: chargesObj,
                subtotal: calculations.subtotal,
                cgst: calculations.cgst,
                sgst: calculations.sgst,
                igst: 0,
                grandTotal: calculations.grandTotal,
                // Company
                companyName: COMPANY.name,
                companyAddress: COMPANY.address,
                companyGstin: COMPANY.gstin,
                companyEmail: COMPANY.email,
                companyPhone: COMPANY.phone,
                status: saveAsDraft ? 'draft' : 'sent',
            };

            let success = false;
            if (isEditMode && editInvoice?.id) {
                // Update existing invoice
                success = await updateInvoice(editInvoice.id, invoiceData);
            } else {
                // Create new invoice
                const invoiceId = await createInvoice(invoiceData);
                success = !!invoiceId;
            }

            if (success) {
                if (!saveAsDraft && !isEditMode) {
                    handleDownloadPDF();
                }

                onInvoiceCreated?.();
                resetForm();
                onOpenChange(false);
            }
        } catch (error) {
            console.error(isEditMode ? "Error updating invoice:" : "Error creating invoice:", error);
        } finally {
            setLoading(false);
        }
    };

    // Download PDF using print
    const handleDownloadPDF = useCallback(() => {
        const invoiceData = {
            invoiceNumber,
            invoiceDate: new Date().toISOString(),
            awbNumber,
            courierPartner,
            originName,
            originAddress,
            originCity,
            originState,
            originPincode,
            originPhone,
            originGstin,
            destinationName,
            destinationAddress,
            destinationCity,
            destinationState,
            destinationPincode,
            destinationPhone,
            destinationGstin,
            packages: packagesWithDimWeight,
            declaredValue,
            paymentMode,
            codAmount: paymentMode === 'cod' ? codAmount : 0,
            charges: chargesObj,
            subtotal: calculations.subtotal,
            cgst: calculations.cgst,
            sgst: calculations.sgst,
            grandTotal: calculations.grandTotal,
        };

        const html = generateInvoiceHTML(invoiceData);

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        printWindow.document.write(html);
        printWindow.document.close();
    }, [
        invoiceNumber, awbNumber, courierPartner,
        originName, originAddress, originCity, originState, originPincode, originPhone, originGstin,
        destinationName, destinationAddress, destinationCity, destinationState, destinationPincode, destinationPhone, destinationGstin,
        packagesWithDimWeight, declaredValue, paymentMode, codAmount, chargesObj, calculations
    ]);

    // Reset form
    const resetForm = () => {
        setInvoiceNumber("");
        setAwbNumber("");
        setCourierPartner("");
        setOriginName("");
        setOriginAddress("");
        setOriginPincode("");
        setOriginCity("");
        setOriginState("");
        setOriginPhone("");
        setOriginGstin("");
        setDestinationName("");
        setDestinationAddress("");
        setDestinationPincode("");
        setDestinationCity("");
        setDestinationState("");
        setDestinationPhone("");
        setDestinationGstin("");
        setPackages([{ id: "1", productName: "", boxes: 1, quantity: 1, length: 0, width: 0, height: 0, actualWeight: 0 }]);
        setDeclaredValue(0);
        setPaymentMode("prepaid");
        setCodAmount(0);
        setFreight(0);
        setFuelSurcharge(0);
        setAwbFee(0);
        setOdaCharge(0);
        setCodCharge(0);
        setHandlingCharge(0);
        setInsuranceCharge(0);
        setOtherCharges(0);
        setActiveTab("origin");
    };

    const tabClass = (tab: string) =>
        `px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === tab
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden p-0">
                <div className="flex flex-col lg:flex-row h-[90vh]">
                    {/* Left Side - Form */}
                    <div className="lg:w-1/2 p-5 overflow-y-auto border-r border-gray-200">
                        <DialogHeader className="mb-4">
                            <DialogTitle className="text-xl font-bold">{isEditMode ? "Edit Shipping Invoice" : "Create Shipping Invoice"}</DialogTitle>
                            <p className="text-sm text-gray-500">
                                Invoice #: <span className="font-semibold text-blue-600">{invoiceNumber || "Loading..."}</span>
                            </p>
                        </DialogHeader>

                        {/* AI Extraction Button */}
                        <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100 rounded-xl">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="font-semibold text-purple-900 flex items-center gap-2">
                                        <Sparkles className="h-4 w-4 text-purple-600" />
                                        AI-Powered Auto-Fill
                                    </h3>
                                    <p className="text-xs text-purple-600 mt-1">
                                        Upload an invoice photo to automatically fill details using AI.
                                    </p>
                                </div>
                                <div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        capture="environment"
                                        onChange={handleAiExtraction}
                                    />
                                    <Button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={aiLoading}
                                        className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
                                    >
                                        {aiLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Analyzing...
                                            </>
                                        ) : (
                                            <>
                                                <Camera className="mr-2 h-4 w-4" />
                                                Ai Powered Invoice creation
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* AWB & Courier */}
                        <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-blue-50 rounded-lg">
                            <div>
                                <Label htmlFor="awbNumber" className="text-xs">AWB / Tracking Number</Label>
                                <Input
                                    id="awbNumber"
                                    value={awbNumber}
                                    onChange={(e) => setAwbNumber(e.target.value)}
                                    placeholder="900185051"
                                    className="mt-1 h-9"
                                />
                            </div>
                            <div>
                                <Label htmlFor="courierPartner" className="text-xs">Courier Partner</Label>
                                <Input
                                    id="courierPartner"
                                    value={courierPartner}
                                    onChange={(e) => setCourierPartner(e.target.value)}
                                    placeholder="Delhivery / BlueDart"
                                    className="mt-1 h-9"
                                />
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-2 mb-4">
                            <button onClick={() => setActiveTab("origin")} className={tabClass("origin")}>
                                <MapPin className="h-3 w-3 inline mr-1" /> Origin
                            </button>
                            <button onClick={() => setActiveTab("destination")} className={tabClass("destination")}>
                                <MapPin className="h-3 w-3 inline mr-1" /> Destination
                            </button>
                            <button onClick={() => setActiveTab("package")} className={tabClass("package")}>
                                <Package className="h-3 w-3 inline mr-1" /> Package
                            </button>
                            <button onClick={() => setActiveTab("charges")} className={tabClass("charges")}>
                                <Truck className="h-3 w-3 inline mr-1" /> Charges
                            </button>
                        </div>

                        {/* Origin Tab */}
                        {activeTab === "origin" && (
                            <div className="space-y-3 p-4 border rounded-lg">
                                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">CONSIGNOR</span>
                                    From / Shipper Details
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="col-span-2">
                                        <Label className="text-xs">Name *</Label>
                                        <Input value={originName} onChange={(e) => setOriginName(e.target.value)} placeholder="Shipper name" className="mt-1 h-9" />
                                    </div>
                                    <div className="col-span-2">
                                        <Label className="text-xs">Address</Label>
                                        <Input value={originAddress} onChange={(e) => setOriginAddress(e.target.value)} placeholder="Street address" className="mt-1 h-9" />
                                    </div>
                                    <div>
                                        <Label className="text-xs">Pincode * (auto-fetch city/state)</Label>
                                        <div className="relative">
                                            <Input
                                                value={originPincode}
                                                onChange={(e) => setOriginPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                placeholder="384001"
                                                className="mt-1 h-9"
                                            />
                                            {originPincodeLoading && (
                                                <Loader2 className="absolute right-2 top-3 h-4 w-4 animate-spin text-blue-500" />
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="text-xs">City</Label>
                                        <Input
                                            value={originCity}
                                            onChange={(e) => setOriginCity(e.target.value)}
                                            placeholder="Auto-filled from pincode"
                                            className="mt-1 h-9 bg-gray-50"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs">State</Label>
                                        <Input
                                            value={originState}
                                            onChange={(e) => setOriginState(e.target.value)}
                                            placeholder="Auto-filled from pincode"
                                            className="mt-1 h-9 bg-gray-50"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs">Phone *</Label>
                                        <Input value={originPhone} onChange={(e) => setOriginPhone(e.target.value)} placeholder="+91..." className="mt-1 h-9" />
                                    </div>
                                    <div className="col-span-2">
                                        <Label className="text-xs">GSTIN (Optional)</Label>
                                        <Input value={originGstin} onChange={(e) => setOriginGstin(e.target.value)} placeholder="24XXXXXXXXXX" className="mt-1 h-9" />
                                    </div>
                                </div>
                                <Button onClick={() => setActiveTab("destination")} className="w-full mt-2">
                                    Next: Destination →
                                </Button>
                            </div>
                        )}

                        {/* Destination Tab */}
                        {activeTab === "destination" && (
                            <div className="space-y-3 p-4 border rounded-lg">
                                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">CONSIGNEE</span>
                                    To / Receiver Details
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="col-span-2">
                                        <Label className="text-xs">Name *</Label>
                                        <Input value={destinationName} onChange={(e) => setDestinationName(e.target.value)} placeholder="Receiver name" className="mt-1 h-9" />
                                    </div>
                                    <div className="col-span-2">
                                        <Label className="text-xs">Address</Label>
                                        <Input value={destinationAddress} onChange={(e) => setDestinationAddress(e.target.value)} placeholder="Street address" className="mt-1 h-9" />
                                    </div>
                                    <div>
                                        <Label className="text-xs">Pincode * (auto-fetch city/state)</Label>
                                        <div className="relative">
                                            <Input
                                                value={destinationPincode}
                                                onChange={(e) => setDestinationPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                placeholder="380015"
                                                className="mt-1 h-9"
                                            />
                                            {destinationPincodeLoading && (
                                                <Loader2 className="absolute right-2 top-3 h-4 w-4 animate-spin text-blue-500" />
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="text-xs">City</Label>
                                        <Input
                                            value={destinationCity}
                                            onChange={(e) => setDestinationCity(e.target.value)}
                                            placeholder="Auto-filled from pincode"
                                            className="mt-1 h-9 bg-gray-50"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs">State</Label>
                                        <Input
                                            value={destinationState}
                                            onChange={(e) => setDestinationState(e.target.value)}
                                            placeholder="Auto-filled from pincode"
                                            className="mt-1 h-9 bg-gray-50"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs">Phone *</Label>
                                        <Input value={destinationPhone} onChange={(e) => setDestinationPhone(e.target.value)} placeholder="+91..." className="mt-1 h-9" />
                                    </div>
                                    <div className="col-span-2">
                                        <Label className="text-xs">GSTIN (Optional)</Label>
                                        <Input value={destinationGstin} onChange={(e) => setDestinationGstin(e.target.value)} placeholder="24XXXXXXXXXX" className="mt-1 h-9" />
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-2">
                                    <Button variant="outline" onClick={() => setActiveTab("origin")} className="flex-1">
                                        ← Origin
                                    </Button>
                                    <Button onClick={() => setActiveTab("package")} className="flex-1">
                                        Next: Package →
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Package Tab */}
                        {activeTab === "package" && (
                            <div className="space-y-3 p-4 border rounded-lg">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-semibold text-gray-900">Package Details</h3>
                                    <Button type="button" variant="outline" size="sm" onClick={addPackage}>
                                        <Plus className="h-3 w-3 mr-1" /> Add Package
                                    </Button>
                                </div>

                                {packages.map((pkg, index) => (
                                    <div key={pkg.id} className="p-3 bg-gray-50 rounded-lg border">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-medium text-gray-500">Package {index + 1}</span>
                                            {packages.length > 1 && (
                                                <Button variant="ghost" size="sm" onClick={() => removePackage(pkg.id)} className="h-6 w-6 p-0 text-red-500">
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-4 gap-2">
                                            <div className="col-span-2">
                                                <Label className="text-xs">Product/Description</Label>
                                                <Input value={pkg.productName} onChange={(e) => updatePackage(pkg.id, 'productName', e.target.value)} placeholder="Box, Parcel..." className="mt-1 h-8 text-xs" />
                                            </div>
                                            <div>
                                                <Label className="text-xs">Boxes</Label>
                                                <Input type="number" min="1" value={pkg.boxes} onChange={(e) => updatePackage(pkg.id, 'boxes', parseInt(e.target.value) || 1)} className="mt-1 h-8 text-xs" />
                                            </div>
                                            <div>
                                                <Label className="text-xs">Qty</Label>
                                                <Input type="number" min="1" value={pkg.quantity} onChange={(e) => updatePackage(pkg.id, 'quantity', parseInt(e.target.value) || 1)} className="mt-1 h-8 text-xs" />
                                            </div>
                                            <div>
                                                <Label className="text-xs">L (cm)</Label>
                                                <Input type="number" min="0" value={pkg.length || ""} onChange={(e) => updatePackage(pkg.id, 'length', parseFloat(e.target.value) || 0)} className="mt-1 h-8 text-xs" />
                                            </div>
                                            <div>
                                                <Label className="text-xs">W (cm)</Label>
                                                <Input type="number" min="0" value={pkg.width || ""} onChange={(e) => updatePackage(pkg.id, 'width', parseFloat(e.target.value) || 0)} className="mt-1 h-8 text-xs" />
                                            </div>
                                            <div>
                                                <Label className="text-xs">H (cm)</Label>
                                                <Input type="number" min="0" value={pkg.height || ""} onChange={(e) => updatePackage(pkg.id, 'height', parseFloat(e.target.value) || 0)} className="mt-1 h-8 text-xs" />
                                            </div>
                                            <div>
                                                <Label className="text-xs">Wt (kg)</Label>
                                                <Input type="number" min="0" step="0.1" value={pkg.actualWeight || ""} onChange={(e) => updatePackage(pkg.id, 'actualWeight', parseFloat(e.target.value) || 0)} className="mt-1 h-8 text-xs" />
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <div className="grid grid-cols-2 gap-3 mt-3">
                                    <div>
                                        <Label className="text-xs">Declared Value (₹)</Label>
                                        <Input type="number" min="0" value={declaredValue || ""} onChange={(e) => setDeclaredValue(parseFloat(e.target.value) || 0)} placeholder="0" className="mt-1 h-9" />
                                    </div>
                                    <div>
                                        <Label className="text-xs">Payment Mode</Label>
                                        <select
                                            value={paymentMode}
                                            onChange={(e) => setPaymentMode(e.target.value as "prepaid" | "cod" | "credit")}
                                            className="mt-1 h-9 w-full rounded-md border border-gray-300 px-3 text-sm"
                                        >
                                            <option value="prepaid">Prepaid</option>
                                            <option value="cod">COD (Cash on Delivery)</option>
                                            <option value="credit">Credit</option>
                                        </select>
                                    </div>
                                    {paymentMode === 'cod' && (
                                        <div className="col-span-2">
                                            <Label className="text-xs">COD Amount (₹)</Label>
                                            <Input type="number" min="0" value={codAmount || ""} onChange={(e) => setCodAmount(parseFloat(e.target.value) || 0)} placeholder="Amount to collect" className="mt-1 h-9" />
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2 mt-2">
                                    <Button variant="outline" onClick={() => setActiveTab("destination")} className="flex-1">
                                        ← Destination
                                    </Button>
                                    <Button onClick={() => setActiveTab("charges")} className="flex-1">
                                        Next: Charges →
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Charges Tab */}
                        {activeTab === "charges" && (
                            <div className="space-y-3 p-4 border rounded-lg">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-semibold text-gray-900">Shipping Charges</h3>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleCalculateRate}
                                        disabled={loading || !originPincode || !destinationPincode || packages.length === 0}
                                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                    >
                                        {loading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Truck className="h-3 w-3 mr-1" />}
                                        Get Actual Rates
                                    </Button>
                                </div>

                                {/* Rate Selection List */}
                                {rateOptions.length > 0 && (
                                    <div className="mb-3 border rounded-md overflow-hidden">
                                        <div className="bg-gray-50 px-3 py-2 border-b text-xs font-medium text-gray-500 flex justify-between">
                                            <span>Available Services</span>
                                            <span>Click to Apply</span>
                                        </div>
                                        <div className="max-h-40 overflow-y-auto">
                                            {rateOptions.map((rate, idx) => (
                                                <div
                                                    key={idx}
                                                    onClick={() => {
                                                        setFreight(rate.rate);
                                                        setCourierPartner(`${rate.courierName} ${rate.serviceName}`);
                                                        setRateOptions([]); // Hide list after selection
                                                    }}
                                                    className="px-3 py-2 border-b last:border-0 hover:bg-blue-50 cursor-pointer flex justify-between items-center text-sm"
                                                >
                                                    <div>
                                                        <span className="font-semibold text-gray-700">{rate.courierName}</span>
                                                        <span className="text-gray-500 text-xs ml-2">{rate.serviceName}</span>
                                                    </div>
                                                    <div className="font-bold text-blue-600">
                                                        ₹{rate.rate.toFixed(2)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label className="text-xs">Actual Rate (₹) *</Label>
                                        <Input type="number" min="0" value={freight || ""} onChange={(e) => setFreight(parseFloat(e.target.value) || 0)} className="mt-1 h-9" />
                                    </div>
                                    <div>
                                        <Label className="text-xs">Fuel Surcharge (₹)</Label>
                                        <Input type="number" min="0" value={fuelSurcharge || ""} onChange={(e) => setFuelSurcharge(parseFloat(e.target.value) || 0)} className="mt-1 h-9" />
                                    </div>
                                    <div>
                                        <Label className="text-xs">AWB/Docket Fee (₹)</Label>
                                        <Input type="number" min="0" value={awbFee || ""} onChange={(e) => setAwbFee(parseFloat(e.target.value) || 0)} className="mt-1 h-9" />
                                    </div>
                                    <div>
                                        <Label className="text-xs">ODA Charge (₹)</Label>
                                        <Input type="number" min="0" value={odaCharge || ""} onChange={(e) => setOdaCharge(parseFloat(e.target.value) || 0)} className="mt-1 h-9" />
                                    </div>
                                    <div>
                                        <Label className="text-xs">COD Handling (₹)</Label>
                                        <Input type="number" min="0" value={codCharge || ""} onChange={(e) => setCodCharge(parseFloat(e.target.value) || 0)} className="mt-1 h-9" />
                                    </div>
                                    <div>
                                        <Label className="text-xs">Handling Charge (₹)</Label>
                                        <Input type="number" min="0" value={handlingCharge || ""} onChange={(e) => setHandlingCharge(parseFloat(e.target.value) || 0)} className="mt-1 h-9" />
                                    </div>
                                    <div>
                                        <Label className="text-xs">Insurance (₹)</Label>
                                        <Input type="number" min="0" value={insuranceCharge || ""} onChange={(e) => setInsuranceCharge(parseFloat(e.target.value) || 0)} className="mt-1 h-9" />
                                    </div>
                                    <div>
                                        <Label className="text-xs">Other Charges (₹)</Label>
                                        <Input type="number" min="0" value={otherCharges || ""} onChange={(e) => setOtherCharges(parseFloat(e.target.value) || 0)} className="mt-1 h-9" />
                                    </div>
                                </div>

                                {/* Summary */}
                                <div className="bg-blue-50 p-3 rounded-lg mt-3">
                                    <div className="space-y-1 text-sm">
                                        <div className="flex justify-between">
                                            <span>Subtotal</span>
                                            <span className="font-medium">₹{calculations.subtotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-600">
                                            <span>CGST (9%)</span>
                                            <span>₹{calculations.cgst.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-600">
                                            <span>SGST (9%)</span>
                                            <span>₹{calculations.sgst.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between pt-2 border-t border-blue-200 text-lg font-bold">
                                            <span>Grand Total</span>
                                            <span>₹{calculations.grandTotal}</span>
                                        </div>
                                    </div>
                                </div>

                                <Button variant="outline" onClick={() => setActiveTab("package")} className="w-full mt-2">
                                    ← Package Details
                                </Button>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3 mt-4 pt-4 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleSubmit(true)}
                                disabled={loading || !originName}
                                className="flex-1"
                            >
                                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                {isEditMode ? "Update as Draft" : "Save Draft"}
                            </Button>
                            <Button
                                type="button"
                                onClick={() => handleSubmit(false)}
                                disabled={loading || !originName}
                                className="flex-1 bg-blue-600 hover:bg-blue-700"
                            >
                                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                                {isEditMode ? "Update Invoice" : "Create & Download"}
                            </Button>
                        </div>
                    </div>

                    {/* Right Side - Invoice Preview */}
                    <div className="lg:w-1/2 bg-gray-100 p-4 overflow-y-auto">
                        <div className="mb-3">
                            <h3 className="font-semibold text-gray-700">Live Preview</h3>
                            <p className="text-xs text-gray-500">This is how your shipping invoice will look</p>
                        </div>
                        <div className="transform scale-[0.75] origin-top-left">
                            <InvoicePreview
                                invoiceNumber={invoiceNumber}
                                invoiceDate={today}
                                awbNumber={awbNumber}
                                originName={originName}
                                originAddress={originAddress}
                                originCity={originCity}
                                originState={originState}
                                originPincode={originPincode}
                                originPhone={originPhone}
                                originGstin={originGstin}
                                destinationName={destinationName}
                                destinationAddress={destinationAddress}
                                destinationCity={destinationCity}
                                destinationState={destinationState}
                                destinationPincode={destinationPincode}
                                destinationPhone={destinationPhone}
                                destinationGstin={destinationGstin}
                                packages={packagesWithDimWeight}
                                declaredValue={declaredValue}
                                courierPartner={courierPartner}
                                charges={chargesObj}
                                subtotal={calculations.subtotal}
                                cgst={calculations.cgst}
                                sgst={calculations.sgst}
                                grandTotal={calculations.grandTotal}
                                paymentMode={paymentMode}
                                codAmount={codAmount}
                            />
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default CreateInvoiceModal;
