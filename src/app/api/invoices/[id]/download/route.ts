import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

// Helper to format currency
function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount);
}

// Generate HTML invoice for download/print - matches InvoicePreview exactly
function generateInvoiceHTML(invoice: any): string {
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
            .no-print { display: none; }
        }
    </style>
</head>
<body class="bg-gray-100 p-4">
    <div class="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden text-xs border border-gray-300">
        <!-- Header - White background for print-friendly -->
        <div class="bg-white border-b-2 border-gray-200 p-4">
            <div class="flex justify-between items-start">
                <div class="flex items-center gap-3">
                    <div class="w-16 h-16 flex items-center justify-center">
                        <img src="http://localhost:3000/Shipmitra Logo from Photoroom.png" alt="Shipmitra" class="w-full h-full object-contain" />
                    </div>
                    <div>
                        <h1 class="text-lg font-bold text-gray-900">Shipmitra Tech Private Limited</h1>
                        <p class="text-[10px] text-gray-600">13- Janta Super Market, Rajmahel Road, Mahesana Bazar, Mahesana - 384001, Gujarat</p>
                        <p class="text-[10px] text-gray-600">GSTIN: 24AAFCS1234A1ZM | +91 9429541601</p>
                    </div>
                </div>
                <div class="text-right">
                    <h2 class="text-xl font-bold uppercase tracking-wide text-blue-600">Shipping Invoice</h2>
                    <p class="text-[10px] text-gray-500 mt-1">Invoice # <span class="font-medium text-gray-900">${invoice.invoiceNumber}</span></p>
                    <p class="text-[10px] text-gray-500">Date: <span class="font-medium text-gray-900">${new Date(invoice.invoiceDate || invoice.createdAt?.toDate?.() || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span></p>
                    ${invoice.awbNumber ? `<p class="text-[10px] text-blue-600 font-semibold mt-1">AWB: ${invoice.awbNumber}</p>` : ''}
                </div>
            </div>
        </div>

        <div class="p-4">
            <!-- Route & Summary Row -->
            <div class="grid grid-cols-4 gap-3 mb-4 p-3 bg-gray-50 rounded-lg border">
                <div>
                    <p class="text-[10px] text-gray-500 uppercase">Origin</p>
                    <p class="font-bold text-gray-900">${invoice.originCity || '---'}</p>
                </div>
                <div>
                    <p class="text-[10px] text-gray-500 uppercase">Destination</p>
                    <p class="font-bold text-gray-900">${invoice.destinationCity || '---'}</p>
                </div>
                <div>
                    <p class="text-[10px] text-gray-500 uppercase">No. of Pkgs</p>
                    <p class="font-bold text-gray-900">${totalBoxes || 0}</p>
                </div>
                <div>
                    <p class="text-[10px] text-gray-500 uppercase">Decl. Value (₹)</p>
                    <p class="font-bold text-gray-900">${invoice.declaredValue > 0 ? formatCurrency(invoice.declaredValue) : '---'}</p>
                </div>
            </div>

            <!-- Consignor & Consignee -->
            <div class="grid grid-cols-2 gap-4 mb-4">
                <!-- Consignor (From) -->
                <div class="border rounded-lg p-3">
                    <div class="flex items-center gap-2 mb-2 pb-2 border-b">
                        <span class="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-semibold">CONSIGNOR</span>
                        <span class="text-gray-500 text-[10px]">From / Shipper</span>
                    </div>
                    ${invoice.originName ? `<p class="font-bold text-gray-900">${invoice.originName}</p>` : ''}
                    ${invoice.originAddress ? `<p class="text-gray-600">${invoice.originAddress}</p>` : ''}
                    ${invoice.originCity || invoice.originPincode ? `<p class="text-gray-600">${invoice.originCity || ''}${invoice.originState ? `, ${invoice.originState}` : ''}${invoice.originPincode ? ` - ${invoice.originPincode}` : ''}</p>` : ''}
                    ${invoice.originPhone ? `<p class="text-gray-600">Phone: ${invoice.originPhone}</p>` : ''}
                    ${invoice.originGstin ? `<p class="text-gray-600">GSTIN: ${invoice.originGstin}</p>` : ''}
                </div>

                <!-- Consignee (To) -->
                <div class="border rounded-lg p-3">
                    <div class="flex items-center gap-2 mb-2 pb-2 border-b">
                        <span class="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-semibold">CONSIGNEE</span>
                        <span class="text-gray-500 text-[10px]">To / Receiver</span>
                    </div>
                    ${invoice.destinationName ? `<p class="font-bold text-gray-900">${invoice.destinationName}</p>` : ''}
                    ${invoice.destinationAddress ? `<p class="text-gray-600">${invoice.destinationAddress}</p>` : ''}
                    ${invoice.destinationCity || invoice.destinationPincode ? `<p class="text-gray-600">${invoice.destinationCity || ''}${invoice.destinationState ? `, ${invoice.destinationState}` : ''}${invoice.destinationPincode ? ` - ${invoice.destinationPincode}` : ''}</p>` : ''}
                    ${invoice.destinationPhone ? `<p class="text-gray-600">Phone: ${invoice.destinationPhone}</p>` : ''}
                    ${invoice.destinationGstin ? `<p class="text-gray-600">GSTIN: ${invoice.destinationGstin}</p>` : ''}
                </div>
            </div>

            <!-- Package Details Table -->
            <div class="mb-4">
                <p class="font-semibold text-gray-700 mb-2 text-[11px] uppercase">Package Details</p>
                <table class="w-full border text-[10px]">
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
            <div class="grid grid-cols-2 gap-4 mb-4">
                <!-- Courier Info -->
                <div class="border rounded-lg p-3">
                    <p class="font-semibold text-gray-700 mb-2 text-[11px] uppercase">Shipment Info</p>
                    <div class="space-y-1 text-[11px]">
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
                <div class="border rounded-lg p-3">
                    <p class="font-semibold text-gray-700 mb-2 text-[11px] uppercase">Charges Breakdown</p>
                    <div class="space-y-1 text-[11px]">
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
            <div class="text-center pt-3 border-t">
                <p class="text-[10px] text-gray-500">Thank you for shipping with Shipmitra!</p>
                <p class="text-[10px] text-gray-400">Track: www.shipmitra.net | Support: +91 9429541601</p>
            </div>
        </div>
    </div>
    
    <script>
        window.onload = function() {
            setTimeout(function() { window.print(); }, 500);
        }
    </script>
</body>
</html>`;
}


export async function OPTIONS() {
    return NextResponse.json({}, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
        }
    });
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'Invoice ID is required' },
                { status: 400 }
            );
        }

        // Fetch from Firestore
        const docRef = doc(db, 'invoices', id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            return NextResponse.json(
                { success: false, error: 'Invoice not found' },
                { status: 404 }
            );
        }

        const invoice = { id: docSnap.id, ...(docSnap.data() as Record<string, unknown>) };
        const html = generateInvoiceHTML(invoice);

        return new NextResponse(html, {
            headers: {
                'Content-Type': 'text/html',
                'Content-Disposition': `inline; filename="invoice-${String((invoice as any).invoiceNumber || id)}.html"`,
            },
        });

    } catch (error) {
        console.error('Error generating invoice download:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
