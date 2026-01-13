import { formatCurrency } from "@/lib/utils";

// Generate HTML invoice for download/print
export function generateInvoiceHTML(invoice: any): string {
    const charges = invoice.charges || {};
    const packages = invoice.packages || [];

    // Calculate totals
    const totalActualWeight = packages.reduce((sum: number, pkg: any) => sum + (pkg.actualWeight || 0), 0);
    const totalDimWeight = packages.reduce((sum: number, pkg: any) => sum + (pkg.dimWeight || 0), 0);
    const totalBoxes = packages.reduce((sum: number, pkg: any) => sum + (pkg.boxes || 1), 0);

    // Generate package rows
    const packageRows = packages.length === 0
        ? `<tr><td colspan="9" class="border px-2 py-3 text-center text-gray-400">No packages added</td></tr>`
        : packages.map((pkg: any, index: number) => `
            <tr>
                <td class="border px-2 py-1">${index + 1}</td>
                <td class="border px-2 py-1">${pkg.productName || 'Package'}</td>
                <td class="border px-2 py-1 text-center">${pkg.boxes || 1}</td>
                <td class="border px-2 py-1 text-center">${pkg.quantity || 1}</td>
                <td class="border px-2 py-1 text-center">${pkg.length || '-'}</td>
                <td class="border px-2 py-1 text-center">${pkg.width || '-'}</td>
                <td class="border px-2 py-1 text-center">${pkg.height || '-'}</td>
                <td class="border px-2 py-1 text-right">${pkg.dimWeight > 0 ? pkg.dimWeight.toFixed(2) : '-'}</td>
                <td class="border px-2 py-1 text-right">${pkg.actualWeight > 0 ? pkg.actualWeight.toFixed(2) : '-'}</td>
            </tr>
        `).join('');

    // Date formatting
    const invoiceDate = new Date(invoice.invoiceDate || invoice.createdAt?.toDate?.() || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Invoice ${invoice.invoiceNumber}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { font-family: 'Inter', system-ui, sans-serif; }
        @page { margin: 0.3in; size: A4; }
        @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .invoice-container { max-height: 50vh; overflow: hidden; page-break-inside: avoid; }
            .no-print { display: none; }
        }
    </style>
</head>
<body class="bg-gray-100 p-4">
    <div class="invoice-container max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden text-[10px] border border-gray-300">
        <!-- Header - White background for print-friendly -->
        <div class="bg-white border-b-2 border-gray-200 p-2">
            <div class="flex justify-between items-start">
                <div class="flex items-center gap-3">
                    <div class="w-16 h-16 flex items-center justify-center">
                        <img src="https://shipmitra-admin.vercel.app/logo.png" alt="Shipmitra" class="w-full h-full object-contain" />
                    </div>
                    <div>
                        <h1 class="text-base font-bold text-gray-900">Shipmitra Tech Private Limited</h1>
                        <p class="text-[9px] text-gray-600">13- Janta Super Market, Rajmahel Road, Mahesana Bazar, Mahesana - 384001, Gujarat</p>
                        <p class="text-[9px] text-gray-600">GSTIN: 24AAFCS1234A1ZM | +91 9429541601</p>
                    </div>
                </div>
                <div class="text-right">
                    <h2 class="text-lg font-bold uppercase tracking-wide text-blue-600">Shipping Invoice</h2>
                    <p class="text-[9px] text-gray-500 mt-1">Invoice # <span class="font-medium text-gray-900">${invoice.invoiceNumber || '(Auto-generated)'}</span></p>
                    <p class="text-[9px] text-gray-500">Date: <span class="font-medium text-gray-900">${invoiceDate}</span></p>
                    ${invoice.awbNumber ? `<p class="text-[9px] text-blue-600 font-semibold mt-1">AWB: ${invoice.awbNumber}</p>` : ''}
                </div>
            </div>
        </div>

        <div class="p-2">
            <!-- Route & Summary Row -->
            <div class="grid grid-cols-4 gap-2 mb-2 p-2 bg-gray-50 rounded-lg border">
                <div>
                    <p class="text-[9px] text-gray-500 uppercase">Origin</p>
                    <p class="font-bold text-gray-900">${invoice.originCity || '---'}</p>
                </div>
                <div>
                    <p class="text-[9px] text-gray-500 uppercase">Destination</p>
                    <p class="font-bold text-gray-900">${invoice.destinationCity || '---'}</p>
                </div>
                <div>
                    <p class="text-[9px] text-gray-500 uppercase">No. of Pkgs</p>
                    <p class="font-bold text-gray-900">${totalBoxes || 0}</p>
                </div>
                <div>
                    <p class="text-[9px] text-gray-500 uppercase">Decl. Value (₹)</p>
                    <p class="font-bold text-gray-900">${invoice.declaredValue > 0 ? formatCurrency(invoice.declaredValue) : '---'}</p>
                </div>
            </div>

            <!-- Consignor & Consignee -->
            <div class="grid grid-cols-2 gap-2 mb-2">
                <!-- Consignor (From) -->
                <div class="border rounded-lg p-2">
                    <div class="flex items-center gap-2 mb-1 pb-1 border-b">
                        <span class="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[9px] font-semibold">CONSIGNOR</span>
                        <span class="text-gray-500 text-[9px]">From / Shipper</span>
                    </div>
                    ${invoice.originName ? `<p class="font-bold text-gray-900">${invoice.originName}</p>` : ''}
                    ${invoice.originAddress ? `<p class="text-gray-600">${invoice.originAddress}</p>` : ''}
                    ${invoice.originCity || invoice.originPincode ? `<p class="text-gray-600">${invoice.originCity || ''}${invoice.originState ? `, ${invoice.originState}` : ''}${invoice.originPincode ? ` - ${invoice.originPincode}` : ''}</p>` : ''}
                    ${invoice.originPhone ? `<p class="text-gray-600">Phone: ${invoice.originPhone}</p>` : ''}
                    ${invoice.originGstin ? `<p class="text-gray-600">GSTIN: ${invoice.originGstin}</p>` : ''}
                </div>

                <!-- Consignee (To) -->
                <div class="border rounded-lg p-2">
                    <div class="flex items-center gap-2 mb-1 pb-1 border-b">
                        <span class="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[9px] font-semibold">CONSIGNEE</span>
                        <span class="text-gray-500 text-[9px]">To / Receiver</span>
                    </div>
                    ${invoice.destinationName ? `<p class="font-bold text-gray-900">${invoice.destinationName}</p>` : ''}
                    ${invoice.destinationAddress ? `<p class="text-gray-600">${invoice.destinationAddress}</p>` : ''}
                    ${invoice.destinationCity || invoice.destinationPincode ? `<p class="text-gray-600">${invoice.destinationCity || ''}${invoice.destinationState ? `, ${invoice.destinationState}` : ''}${invoice.destinationPincode ? ` - ${invoice.destinationPincode}` : ''}</p>` : ''}
                    ${invoice.destinationPhone ? `<p class="text-gray-600">Phone: ${invoice.destinationPhone}</p>` : ''}
                    ${invoice.destinationGstin ? `<p class="text-gray-600">GSTIN: ${invoice.destinationGstin}</p>` : ''}
                </div>
            </div>

            <!-- Package Details Table -->
            <div class="mb-2">
                <p class="font-semibold text-gray-700 mb-1 text-[10px] uppercase">Package Details</p>
                <table class="w-full border text-[9px]">
                    <thead class="bg-gray-100">
                        <tr>
                            <th class="border px-2 py-1 text-left">Sr.</th>
                            <th class="border px-2 py-1 text-left">Product/Description</th>
                            <th class="border px-2 py-1 text-center">Boxes</th>
                            <th class="border px-2 py-1 text-center">Qty</th>
                            <th class="border px-2 py-1 text-center">L(cm)</th>
                            <th class="border px-2 py-1 text-center">W(cm)</th>
                            <th class="border px-2 py-1 text-center">H(cm)</th>
                            <th class="border px-2 py-1 text-right">Dim.Wt</th>
                            <th class="border px-2 py-1 text-right">Act.Wt</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${packageRows}
                        <tr class="bg-gray-50 font-semibold">
                            <td colspan="7" class="border px-2 py-1 text-right">Total Weight (kg):</td>
                            <td class="border px-2 py-1 text-right">${totalDimWeight > 0 ? totalDimWeight.toFixed(2) : '-'}</td>
                            <td class="border px-2 py-1 text-right">${totalActualWeight > 0 ? totalActualWeight.toFixed(2) : '-'}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Charges & Courier Info -->
            <div class="grid grid-cols-2 gap-2 mb-2">
                <!-- Courier Info -->
                <div class="border rounded-lg p-2">
                    <p class="font-semibold text-gray-700 mb-1 text-[10px] uppercase">Shipment Info</p>
                    <div class="space-y-1 text-[9px]">
                        ${invoice.courierPartner ? `<div class="flex justify-between"><span class="text-gray-600">Courier Partner:</span><span class="font-medium">${invoice.courierPartner}</span></div>` : ''}
                        <div class="flex justify-between">
                            <span class="text-gray-600">Payment Mode:</span>
                            <span class="font-medium uppercase ${invoice.paymentMode === 'prepaid' ? 'text-green-600' : invoice.paymentMode === 'cod' ? 'text-orange-600' : 'text-blue-600'}">${invoice.paymentMode || 'Prepaid'}</span>
                        </div>
                        ${invoice.paymentMode === 'cod' && invoice.codAmount > 0 ? `<div class="flex justify-between"><span class="text-gray-600">COD Amount:</span><span class="font-bold text-orange-600">${formatCurrency(invoice.codAmount)}</span></div>` : ''}
                        ${(totalActualWeight > 0 || totalDimWeight > 0) ? `<div class="flex justify-between"><span class="text-gray-600">Chargeable Weight:</span><span class="font-medium">${Math.max(totalActualWeight, totalDimWeight).toFixed(2)} kg</span></div>` : ''}
                    </div>
                </div>

                <!-- Charges Breakdown -->
                <div class="border rounded-lg p-2">
                    <p class="font-semibold text-gray-700 mb-1 text-[10px] uppercase">Charges Breakdown</p>
                    <div class="space-y-1 text-[9px]">
                        ${charges.freight > 0 ? `<div class="flex justify-between"><span class="text-gray-600">Freight Charges</span><span>${formatCurrency(charges.freight)}</span></div>` : ''}
                        ${charges.fuelSurcharge > 0 ? `<div class="flex justify-between"><span class="text-gray-600">Fuel Surcharge</span><span>${formatCurrency(charges.fuelSurcharge)}</span></div>` : ''}
                        ${charges.awbFee > 0 ? `<div class="flex justify-between"><span class="text-gray-600">AWB/Docket Fee</span><span>${formatCurrency(charges.awbFee)}</span></div>` : ''}
                        ${charges.odaCharge > 0 ? `<div class="flex justify-between"><span class="text-gray-600">ODA Charge</span><span>${formatCurrency(charges.odaCharge)}</span></div>` : ''}
                        ${charges.codCharge > 0 ? `<div class="flex justify-between"><span class="text-gray-600">COD Handling</span><span>${formatCurrency(charges.codCharge)}</span></div>` : ''}
                        ${charges.handlingCharge > 0 ? `<div class="flex justify-between"><span class="text-gray-600">Handling Charge</span><span>${formatCurrency(charges.handlingCharge)}</span></div>` : ''}
                        ${charges.insuranceCharge > 0 ? `<div class="flex justify-between"><span class="text-gray-600">Insurance</span><span>${formatCurrency(charges.insuranceCharge)}</span></div>` : ''}
                        ${charges.otherCharges > 0 ? `<div class="flex justify-between"><span class="text-gray-600">Other Charges</span><span>${formatCurrency(charges.otherCharges)}</span></div>` : ''}
                        ${invoice.subtotal > 0 ? `
                            <div class="flex justify-between pt-1 border-t"><span class="text-gray-700 font-medium">Subtotal</span><span class="font-medium">${formatCurrency(invoice.subtotal)}</span></div>
                            <div class="flex justify-between"><span class="text-gray-600">CGST (9%)</span><span>${formatCurrency(invoice.cgst || 0)}</span></div>
                            <div class="flex justify-between"><span class="text-gray-600">SGST (9%)</span><span>${formatCurrency(invoice.sgst || 0)}</span></div>
                            <div class="flex justify-between pt-1 border-t-2 border-gray-900"><span class="font-bold text-gray-900">Grand Total</span><span class="font-bold text-gray-900">${formatCurrency(invoice.grandTotal || 0)}</span></div>
                        ` : `<div class="flex justify-between pt-1 border-t-2 border-gray-900"><span class="font-bold text-gray-900">Grand Total</span><span class="font-bold text-gray-900">${formatCurrency(invoice.grandTotal || 0)}</span></div>`}
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="text-center pt-2 border-t">
                <p class="text-[9px] text-gray-500">Thank you for shipping with Shipmitra!</p>
                <p class="text-[9px] text-gray-400">Track: www.shipmitra.net | Support: +91 9429541601</p>
            </div>
        </div>
    </div>
</body>
</html>`;
}
