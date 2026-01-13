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

// Create invoice endpoint - matches /api/invoices-create
export async function POST(request: NextRequest) {
    try {
        // Verify API Key (optional for internal calls)
        const apiKey = request.headers.get('X-API-Key') || request.headers.get('Authorization')?.replace('Bearer ', '');

        // Allow internal calls without API key, but external calls need it
        const isInternal = request.headers.get('origin')?.includes('localhost') || !request.headers.get('origin');

        if (!isInternal && apiKey !== API_KEY) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized: Invalid API key' },
                { status: 401, headers: corsHeaders }
            );
        }

        // Parse request body
        const body = await request.json();

        // Validate required fields
        if (!body.originName && !body.senderDetails?.name && !body.customerName) {
            return NextResponse.json(
                { success: false, error: 'Missing required field: originName or senderDetails.name' },
                { status: 400, headers: corsHeaders }
            );
        }

        const year = new Date().getFullYear();
        const invoiceNumber = `SM/${year}/${randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()}`;

        // Handle different data formats from main website
        const senderDetails = body.senderDetails || {};
        const receiverDetails = body.receiverDetails || {};

        // Prepare invoice data
        const invoiceData = {
            invoiceNumber,
            invoiceDate: new Date().toISOString(),
            awbNumber: body.awbNumber || body.trackingNumber || '',
            courierPartner: body.courierPartner || body.courier || '',

            // Origin - support both formats
            originName: body.originName || senderDetails.name || body.customerName || '',
            originAddress: body.originAddress || senderDetails.address || '',
            originCity: body.originCity || senderDetails.city || '',
            originState: body.originState || senderDetails.state || '',
            originPincode: body.originPincode || senderDetails.pincode || '',
            originPhone: body.originPhone || senderDetails.phone || body.customerPhone || '',
            originGstin: body.originGstin || '',

            // Destination - support both formats
            destinationName: body.destinationName || receiverDetails.name || '',
            destinationAddress: body.destinationAddress || receiverDetails.address || '',
            destinationCity: body.destinationCity || receiverDetails.city || '',
            destinationState: body.destinationState || receiverDetails.state || '',
            destinationPincode: body.destinationPincode || receiverDetails.pincode || '',
            destinationPhone: body.destinationPhone || receiverDetails.phone || '',
            destinationGstin: body.destinationGstin || '',

            // Packages
            packages: body.packages || [],
            declaredValue: body.declaredValue || body.packageValue || 0,

            // Weight
            weight: body.weight || 0,

            // Payment
            paymentMode: body.paymentMode || body.paymentType || 'prepaid',
            codAmount: body.codAmount || 0,

            // Charges - support nested or flat structure
            charges: {
                freight: body.freight || body.charges?.freight || body.amount || body.shippingCost || 0,
                fuelSurcharge: body.fuelSurcharge || body.charges?.fuelSurcharge || 0,
                awbFee: body.awbFee || body.charges?.awbFee || 0,
                odaCharge: body.odaCharge || body.charges?.odaCharge || 0,
                codCharge: body.codCharge || body.charges?.codCharge || 0,
                handlingCharge: body.handlingCharge || body.charges?.handlingCharge || 0,
                insuranceCharge: body.insuranceCharge || body.charges?.insuranceCharge || 0,
                otherCharges: body.otherCharges || body.charges?.otherCharges || 0,
            },

            // Calculate totals
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

            // Booking reference
            bookingId: body.bookingId || body.orderId || '',

            // Status and timestamps
            status: body.status || 'sent',
            source: 'website', // Mark as created via website
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        // Calculate totals
        const charges = invoiceData.charges;
        invoiceData.subtotal =
            charges.freight +
            charges.fuelSurcharge +
            charges.awbFee +
            charges.odaCharge +
            charges.codCharge +
            charges.handlingCharge +
            charges.insuranceCharge +
            charges.otherCharges;

        invoiceData.cgst = invoiceData.subtotal * 0.09;
        invoiceData.sgst = invoiceData.subtotal * 0.09;
        invoiceData.grandTotal = Math.round(invoiceData.subtotal + invoiceData.cgst + invoiceData.sgst);

        // Save to Firestore
        const docRef = await addDoc(collection(db, 'invoices'), invoiceData);

        // Also create a booking record so it appears in Orders
        const bookingData = {
            // Basic info
            awbNumber: invoiceData.awbNumber,
            courierPartner: invoiceData.courierPartner,

            // Sender (pickup) info
            senderName: invoiceData.originName,
            senderPhone: invoiceData.originPhone,
            senderAddress: invoiceData.originAddress,
            senderCity: invoiceData.originCity,
            senderState: invoiceData.originState,
            senderPincode: invoiceData.originPincode,

            // Receiver (delivery) info
            receiverName: invoiceData.destinationName,
            receiverPhone: invoiceData.destinationPhone,
            receiverAddress: invoiceData.destinationAddress,
            receiverCity: invoiceData.destinationCity,
            receiverState: invoiceData.destinationState,
            receiverPincode: invoiceData.destinationPincode,

            // Package info
            weight: invoiceData.weight,
            packages: invoiceData.packages,
            declaredValue: invoiceData.declaredValue,

            // Payment
            paymentMode: invoiceData.paymentMode,
            codAmount: invoiceData.codAmount,
            amount: invoiceData.grandTotal,

            // Status
            status: 'pending', // New bookings start as pending

            // References
            invoiceId: docRef.id,
            invoiceNumber: invoiceNumber,

            // Metadata
            source: 'website',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        // Create booking
        await addDoc(collection(db, 'bookings'), bookingData);

        // Update invoice with booking reference
        // (We can't update here easily without doc reference, but bookingId is in invoice now)

        // Return success response with invoice details
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://shipmitra-admin.vercel.app';
        const invoiceUrl = `${baseUrl}/invoice/${docRef.id}`;

        // Send Email if customer email is provided
        const customerEmail = body.customerEmail || body.email || body.destinationEmail || body.receiverDetails?.email;
        if (customerEmail) {
            await sendInvoiceEmail(customerEmail, invoiceUrl, invoiceNumber);
        }

        return NextResponse.json({
            success: true,
            message: 'Invoice created successfully',
            data: {
                id: docRef.id,
                invoiceNumber,
                grandTotal: invoiceData.grandTotal,
                invoiceUrl: `${baseUrl}/invoice/${docRef.id}`,
                downloadUrl: `${baseUrl}/invoice/${docRef.id}`,
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
