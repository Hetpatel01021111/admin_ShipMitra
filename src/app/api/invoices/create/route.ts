import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { randomUUID } from 'crypto';
import { sendInvoiceEmail } from '@/lib/email';

// Secure API Key - matches the key used by shipmitra.net proxy
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

        // Build charges object from flat or nested body
        const charges = {
            freight: Number(body.freight || body.charges?.freight || 0),
            fuelSurcharge: Number(body.fuelSurcharge || body.charges?.fuelSurcharge || 0),
            awbFee: Number(body.awbFee || body.charges?.awbFee || 0),
            odaCharge: Number(body.odaCharge || body.charges?.odaCharge || 0),
            codCharge: Number(body.codCharge || body.charges?.codCharge || 0),
            handlingCharge: Number(body.handlingCharge || body.charges?.handlingCharge || 0),
            insuranceCharge: Number(body.insuranceCharge || body.charges?.insuranceCharge || 0),
            otherCharges: Number(body.otherCharges || body.charges?.otherCharges || 0),
        };

        // Calculate totals — include GST fields passed from client if available
        const subtotal =
            charges.freight +
            charges.fuelSurcharge +
            charges.awbFee +
            charges.odaCharge +
            charges.codCharge +
            charges.handlingCharge +
            charges.insuranceCharge +
            charges.otherCharges;

        // Use client-supplied GST if present (they already computed it), else compute
        const cgst = Number(body.cgst ?? (subtotal * 0.09));
        const sgst = Number(body.sgst ?? (subtotal * 0.09));
        const grandTotal = Math.round(subtotal + cgst + sgst);

        // Prepare invoice data for Firestore
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
            declaredValue: Number(body.declaredValue || 0),

            // Payment
            paymentMode: body.paymentMode || 'prepaid',
            codAmount: Number(body.codAmount || 0),

            // Charges (flat for easy querying)
            charges,

            // Totals
            subtotal,
            cgst,
            sgst,
            igst: 0,
            grandTotal,

            // Company info
            companyName: 'Shipmitra Tech Private Limited',
            companyAddress: '13- Janta Super Market, Rajmahel Road, Mahesana Bazar, Mahesana - 384001, Gujarat',
            companyGstin: 'Applied for GST',
            companyPhone: '+91 8469561212',

            // Status and timestamps
            status: body.status || 'sent',
            source: 'api', // Mark as created via API
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        };

        // Save to Firestore using Admin SDK (server-safe, no auth required)
        const docRef = await adminDb.collection('invoices').add(invoiceData);

        // Generate correct production URLs
        const baseUrl = process.env.NEXT_PUBLIC_ADMIN_URL || 'https://admin.shipmitra.net';
        const invoiceUrl = `${baseUrl}/invoice/${docRef.id}`;
        const downloadUrl = `${baseUrl}/api/invoices/${docRef.id}/download`;

        // Send Email if customer email is provided (non-fatal if fails)
        const customerEmail = body.customerEmail || body.email || body.destinationEmail;
        if (customerEmail) {
            try {
                await sendInvoiceEmail(customerEmail, invoiceUrl, invoiceNumber);
            } catch {
                // Email failure is non-fatal
                console.error('Invoice email failed, continuing...');
            }
        }

        // Return success response
        return NextResponse.json({
            success: true,
            message: 'Invoice created successfully',
            emailSent: !!customerEmail,
            data: {
                id: docRef.id,
                invoiceNumber,
                grandTotal: invoiceData.grandTotal,
                invoiceUrl,
                downloadUrl,
            },
        }, { status: 201, headers: corsHeaders });

    } catch (error) {
        console.error('Error creating invoice:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error', details: String(error) },
            { status: 500, headers: corsHeaders }
        );
    }
}
