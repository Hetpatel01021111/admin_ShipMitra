import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { randomUUID } from 'crypto';
import { sendInvoiceEmail } from '@/lib/email';

// Secure API Key - Store in environment variable in production
const API_KEY = process.env.SHIPMITRA_API_KEY || 'sm_live_sk_shipmitra2026_secure_key';

// CORS headers for external access
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, Authorization',
};

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

// Create invoice endpoint
export async function POST(request: NextRequest) {
    try {
        // Verify API Key
        const apiKey = request.headers.get('X-API-Key') || request.headers.get('Authorization')?.replace('Bearer ', '');

        if (!apiKey || apiKey !== API_KEY) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized: Invalid API key' },
                { status: 401, headers: corsHeaders }
            );
        }

        // Parse request body
        const body = await request.json();

        // Validate required fields
        if (!body.originName) {
            return NextResponse.json(
                { success: false, error: 'Missing required field: originName' },
                { status: 400, headers: corsHeaders }
            );
        }

        const year = new Date().getFullYear();
        const invoiceNumber = `SM/${year}/${randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()}`;

        // Prepare invoice data
        const invoiceData = {
            invoiceNumber,
            invoiceDate: new Date().toISOString(),
            awbNumber: body.awbNumber || '',
            courierPartner: body.courierPartner || '',

            // Origin
            originName: body.originName,
            originAddress: body.originAddress || '',
            originCity: body.originCity || '',
            originState: body.originState || '',
            originPincode: body.originPincode || '',
            originPhone: body.originPhone || '',
            originGstin: body.originGstin || '',

            // Destination
            destinationName: body.destinationName || '',
            destinationAddress: body.destinationAddress || '',
            destinationCity: body.destinationCity || '',
            destinationState: body.destinationState || '',
            destinationPincode: body.destinationPincode || '',
            destinationPhone: body.destinationPhone || '',
            destinationGstin: body.destinationGstin || '',

            // Packages
            packages: body.packages || [],
            declaredValue: body.declaredValue || 0,

            // Payment
            paymentMode: body.paymentMode || 'prepaid',
            codAmount: body.codAmount || 0,

            // Charges
            charges: {
                freight: body.freight || body.charges?.freight || 0,
                fuelSurcharge: body.fuelSurcharge || body.charges?.fuelSurcharge || 0,
                awbFee: body.awbFee || body.charges?.awbFee || 0,
                odaCharge: body.odaCharge || body.charges?.odaCharge || 0,
                codCharge: body.codCharge || body.charges?.codCharge || 0,
                handlingCharge: body.handlingCharge || body.charges?.handlingCharge || 0,
                insuranceCharge: body.insuranceCharge || body.charges?.insuranceCharge || 0,
                otherCharges: body.otherCharges || body.charges?.otherCharges || 0,
            },

            // Calculate totals (placeholders, will be updated below)
            subtotal: 0,
            cgst: 0,
            sgst: 0,
            igst: 0,
            grandTotal: 0,

            // Company info
            companyName: 'Shipmitra Tech Private Limited',
            companyAddress: '13- Janta Super Market, Rajmahel Road, Mahesana Bazar, Mahesana - 384001, Gujarat',
            companyGstin: '24AAFCS1234A1ZM',
            companyPhone: '+91 9429541601',

            // Status and timestamps
            status: body.status || 'sent',
            source: 'api', // Mark as created via API
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        // Calculate totals
        const charges = invoiceData.charges;
        invoiceData.subtotal =
            Number(charges.freight) +
            Number(charges.fuelSurcharge) +
            Number(charges.awbFee) +
            Number(charges.odaCharge) +
            Number(charges.codCharge) +
            Number(charges.handlingCharge) +
            Number(charges.insuranceCharge) +
            Number(charges.otherCharges);

        // Simple tax calculation (assuming intra-state 18% split for now, or use logic if state provided)
        // For simplicity, using 9% CGST + 9% SGST as in original code
        invoiceData.cgst = invoiceData.subtotal * 0.09;
        invoiceData.sgst = invoiceData.subtotal * 0.09;
        invoiceData.grandTotal = Math.round(invoiceData.subtotal + invoiceData.cgst + invoiceData.sgst);

        // Save to Firestore
        const docRef = await addDoc(collection(db, 'invoices'), invoiceData);

        // Send Email if customer email is provided
        const customerEmail = body.customerEmail || body.email || body.destinationEmail;
        const invoiceUrl = `https://shipmitra-admin.vercel.app/invoice/${docRef.id}`;
        
        if (customerEmail) {
            await sendInvoiceEmail(customerEmail, invoiceUrl, invoiceNumber);
        }

        // Return success response with invoice details
        return NextResponse.json({
            success: true,
            message: 'Invoice created successfully',
            emailSent: !!customerEmail,
            data: {
                id: docRef.id,
                invoiceNumber,
                grandTotal: invoiceData.grandTotal,
                invoiceUrl: invoiceUrl,
                downloadUrl: invoiceUrl,
            },
        }, { status: 201, headers: corsHeaders });

    } catch (error) {
        console.error('Error creating invoice:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500, headers: corsHeaders }
        );
    }
}
