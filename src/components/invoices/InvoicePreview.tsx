"use client";

import React from "react";
import { formatCurrency } from "@/lib/utils";

interface PackageDetails {
    productName: string;
    boxes: number;
    quantity: number;
    length: number;
    width: number;
    height: number;
    dimWeight: number;
    actualWeight: number;
}

interface ShippingCharges {
    freight: number;
    fuelSurcharge: number;
    awbFee: number;
    odaCharge: number;
    codCharge: number;
    handlingCharge: number;
    insuranceCharge: number;
    otherCharges: number;
}

interface InvoicePreviewProps {
    invoiceNumber: string;
    invoiceDate: string;
    awbNumber?: string;

    // Origin (Consignor/Shipper)
    originName: string;
    originAddress: string;
    originCity: string;
    originState: string;
    originPincode: string;
    originPhone: string;
    originGstin?: string;

    // Destination (Consignee)
    destinationName: string;
    destinationAddress: string;
    destinationCity: string;
    destinationState: string;
    destinationPincode: string;
    destinationPhone: string;
    destinationGstin?: string;

    // Package Details
    packages: PackageDetails[];
    declaredValue: number;

    // Courier Info
    courierPartner?: string;

    // Charges
    charges: ShippingCharges;

    // Totals
    subtotal: number;
    cgst: number;
    sgst: number;
    grandTotal: number;

    // Payment
    paymentMode: "prepaid" | "cod" | "credit";
    codAmount?: number;
}

// Company constants
const COMPANY = {
    name: "Shipmitra Tech Private Limited",
    address: "13- Janta Super Market, Rajmahel Road, Mahesana Bazar, Mahesana - 384001, Gujarat",
    gstin:"" ,
    email: "ceo@shipmitra.net",
    phone: "+91 9429541601",
    website: "www.shipmitra.net",
};

export function InvoicePreview({
    invoiceNumber,
    invoiceDate,
    awbNumber,
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
    packages,
    declaredValue,
    courierPartner,
    charges,
    subtotal,
    cgst,
    sgst,
    grandTotal,
    paymentMode,
    codAmount,
}: InvoicePreviewProps) {

    // Calculate total weight
    const totalActualWeight = packages.reduce((sum, pkg) => sum + pkg.actualWeight, 0);
    const totalDimWeight = packages.reduce((sum, pkg) => sum + pkg.dimWeight, 0);
    const totalBoxes = packages.reduce((sum, pkg) => sum + pkg.boxes, 0);

    return (
        <div id="invoice-preview" className="bg-white rounded-lg shadow-lg overflow-hidden text-[10px] border border-gray-300">
            {/* Header - White background for print-friendly */}
            <div className="bg-white border-b-2 border-gray-200 p-2">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className="w-16 h-16 flex items-center justify-center">
                            <img
                                src="https://shipmitra-admin.vercel.app/logo.png"
                                alt="Shipmitra"
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <div>
                            <h1 className="text-base font-bold text-gray-900">{COMPANY.name}</h1>
                            <p className="text-[9px] text-gray-600">{COMPANY.address}</p>
                            <p className="text-[9px] text-gray-600">GSTIN: {COMPANY.gstin} | {COMPANY.phone}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-lg font-bold uppercase tracking-wide text-blue-600">Shipping Invoice</h2>
                        <p className="text-[9px] text-gray-500 mt-1">
                            Invoice # <span className="font-medium text-gray-900">{invoiceNumber || "(Auto-generated)"}</span>
                        </p>
                        <p className="text-[9px] text-gray-500">
                            Date: <span className="font-medium text-gray-900">{invoiceDate}</span>
                        </p>
                        {awbNumber && (
                            <p className="text-[9px] text-blue-600 font-semibold mt-1">
                                AWB: {awbNumber}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-2">
                {/* Route & Summary Row */}
                <div className="grid grid-cols-4 gap-2 mb-2 p-2 bg-gray-50 rounded-lg border">
                    <div>
                        <p className="text-[9px] text-gray-500 uppercase">Origin</p>
                        <p className="font-bold text-gray-900">{originCity || "---"}</p>
                    </div>
                    <div>
                        <p className="text-[9px] text-gray-500 uppercase">Destination</p>
                        <p className="font-bold text-gray-900">{destinationCity || "---"}</p>
                    </div>
                    <div>
                        <p className="text-[9px] text-gray-500 uppercase">No. of Pkgs</p>
                        <p className="font-bold text-gray-900">{totalBoxes || 0}</p>
                    </div>
                    <div>
                        <p className="text-[9px] text-gray-500 uppercase">Decl. Value (₹)</p>
                        <p className="font-bold text-gray-900">{declaredValue > 0 ? formatCurrency(declaredValue) : "---"}</p>
                    </div>
                </div>

                {/* Consignor & Consignee */}
                <div className="grid grid-cols-2 gap-2 mb-2">
                    {/* Consignor (From) */}
                    <div className="border rounded-lg p-2">
                        <div className="flex items-center gap-2 mb-1 pb-1 border-b">
                            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[9px] font-semibold">CONSIGNOR</span>
                            <span className="text-gray-500 text-[9px]">From / Shipper</span>
                        </div>
                        {originName && <p className="font-bold text-gray-900">{originName}</p>}
                        {originAddress && <p className="text-gray-600">{originAddress}</p>}
                        {(originCity || originPincode) && (
                            <p className="text-gray-600">
                                {originCity}{originState ? `, ${originState}` : ""}{originPincode ? ` - ${originPincode}` : ""}
                            </p>
                        )}
                        {originPhone && <p className="text-gray-600">Phone: {originPhone}</p>}
                        {originGstin && <p className="text-gray-600">GSTIN: {originGstin}</p>}
                    </div>

                    {/* Consignee (To) */}
                    <div className="border rounded-lg p-2">
                        <div className="flex items-center gap-2 mb-1 pb-1 border-b">
                            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[9px] font-semibold">CONSIGNEE</span>
                            <span className="text-gray-500 text-[9px]">To / Receiver</span>
                        </div>
                        {destinationName && <p className="font-bold text-gray-900">{destinationName}</p>}
                        {destinationAddress && <p className="text-gray-600">{destinationAddress}</p>}
                        {(destinationCity || destinationPincode) && (
                            <p className="text-gray-600">
                                {destinationCity}{destinationState ? `, ${destinationState}` : ""}{destinationPincode ? ` - ${destinationPincode}` : ""}
                            </p>
                        )}
                        {destinationPhone && <p className="text-gray-600">Phone: {destinationPhone}</p>}
                        {destinationGstin && <p className="text-gray-600">GSTIN: {destinationGstin}</p>}
                    </div>
                </div>

                {/* Package Details Table */}
                <div className="mb-2">
                    <p className="font-semibold text-gray-700 mb-1 text-[10px] uppercase">Package Details</p>
                    <table className="w-full border text-[9px]">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="border px-2 py-1 text-left">Sr.</th>
                                <th className="border px-2 py-1 text-left">Product/Description</th>
                                <th className="border px-2 py-1 text-center">Boxes</th>
                                <th className="border px-2 py-1 text-center">Qty</th>
                                <th className="border px-2 py-1 text-center">L(cm)</th>
                                <th className="border px-2 py-1 text-center">W(cm)</th>
                                <th className="border px-2 py-1 text-center">H(cm)</th>
                                <th className="border px-2 py-1 text-right">Dim.Wt</th>
                                <th className="border px-2 py-1 text-right">Act.Wt</th>
                            </tr>
                        </thead>
                        <tbody>
                            {packages.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="border px-2 py-3 text-center text-gray-400">
                                        No packages added
                                    </td>
                                </tr>
                            ) : (
                                packages.map((pkg, index) => (
                                    <tr key={index}>
                                        <td className="border px-2 py-1">{index + 1}</td>
                                        <td className="border px-2 py-1">{pkg.productName || "Package"}</td>
                                        <td className="border px-2 py-1 text-center">{pkg.boxes}</td>
                                        <td className="border px-2 py-1 text-center">{pkg.quantity}</td>
                                        <td className="border px-2 py-1 text-center">{pkg.length || "-"}</td>
                                        <td className="border px-2 py-1 text-center">{pkg.width || "-"}</td>
                                        <td className="border px-2 py-1 text-center">{pkg.height || "-"}</td>
                                        <td className="border px-2 py-1 text-right">{pkg.dimWeight > 0 ? pkg.dimWeight.toFixed(2) : "-"}</td>
                                        <td className="border px-2 py-1 text-right">{pkg.actualWeight > 0 ? pkg.actualWeight.toFixed(2) : "-"}</td>
                                    </tr>
                                ))
                            )}
                            <tr className="bg-gray-50 font-semibold">
                                <td colSpan={7} className="border px-2 py-1 text-right">Total Weight (kg):</td>
                                <td className="border px-2 py-1 text-right">{totalDimWeight > 0 ? totalDimWeight.toFixed(2) : "-"}</td>
                                <td className="border px-2 py-1 text-right">{totalActualWeight > 0 ? totalActualWeight.toFixed(2) : "-"}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Charges & Courier Info */}
                <div className="grid grid-cols-2 gap-2 mb-2">
                    {/* Courier Info */}
                    <div className="border rounded-lg p-2">
                        <p className="font-semibold text-gray-700 mb-1 text-[10px] uppercase">Shipment Info</p>
                        <div className="space-y-1 text-[9px]">
                            {courierPartner && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Courier Partner:</span>
                                    <span className="font-medium">{courierPartner}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-gray-600">Payment Mode:</span>
                                <span className={`font-medium uppercase ${paymentMode === 'prepaid' ? 'text-green-600' :
                                    paymentMode === 'cod' ? 'text-orange-600' : 'text-blue-600'
                                    }`}>{paymentMode}</span>
                            </div>
                            {paymentMode === 'cod' && codAmount && codAmount > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">COD Amount:</span>
                                    <span className="font-bold text-orange-600">{formatCurrency(codAmount)}</span>
                                </div>
                            )}
                            {(totalActualWeight > 0 || totalDimWeight > 0) && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Chargeable Weight:</span>
                                    <span className="font-medium">{Math.max(totalActualWeight, totalDimWeight).toFixed(2)} kg</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Charges Breakdown */}
                    <div className="border rounded-lg p-2">
                        <p className="font-semibold text-gray-700 mb-1 text-[10px] uppercase">Charges Breakdown</p>
                        <div className="space-y-1 text-[9px]">
                            {charges.freight > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Freight Charges</span>
                                    <span>{formatCurrency(charges.freight)}</span>
                                </div>
                            )}
                            {charges.fuelSurcharge > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Fuel Surcharge</span>
                                    <span>{formatCurrency(charges.fuelSurcharge)}</span>
                                </div>
                            )}
                            {charges.awbFee > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">AWB/Docket Fee</span>
                                    <span>{formatCurrency(charges.awbFee)}</span>
                                </div>
                            )}
                            {charges.odaCharge > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">ODA Charge</span>
                                    <span>{formatCurrency(charges.odaCharge)}</span>
                                </div>
                            )}
                            {charges.codCharge > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">COD Handling</span>
                                    <span>{formatCurrency(charges.codCharge)}</span>
                                </div>
                            )}
                            {charges.handlingCharge > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Handling Charge</span>
                                    <span>{formatCurrency(charges.handlingCharge)}</span>
                                </div>
                            )}
                            {charges.insuranceCharge > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Insurance</span>
                                    <span>{formatCurrency(charges.insuranceCharge)}</span>
                                </div>
                            )}
                            {charges.otherCharges > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Other Charges</span>
                                    <span>{formatCurrency(charges.otherCharges)}</span>
                                </div>
                            )}
                            {subtotal > 0 && (
                                <>
                                    <div className="flex justify-between pt-1 border-t">
                                        <span className="text-gray-700 font-medium">Subtotal</span>
                                        <span className="font-medium">{formatCurrency(subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">CGST (9%)</span>
                                        <span>{formatCurrency(cgst)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">SGST (9%)</span>
                                        <span>{formatCurrency(sgst)}</span>
                                    </div>
                                    <div className="flex justify-between pt-1 border-t-2 border-gray-900">
                                        <span className="font-bold text-gray-900">Grand Total</span>
                                        <span className="font-bold text-gray-900">{formatCurrency(grandTotal)}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center pt-2 border-t">
                    <p className="text-[9px] text-gray-500">Thank you for shipping with Shipmitra!</p>
                    <p className="text-[9px] text-gray-400">Track: {COMPANY.website} | Support: {COMPANY.phone}</p>
                </div>
            </div>
        </div>
    );
}

export default InvoicePreview;
