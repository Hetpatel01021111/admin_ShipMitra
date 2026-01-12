import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

// Get invoice by ID
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'Invoice ID is required' },
                { status: 400, headers: corsHeaders }
            );
        }

        // Fetch from Firestore
        const docRef = doc(db, 'invoices', id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            return NextResponse.json(
                { success: false, error: 'Invoice not found' },
                { status: 404, headers: corsHeaders }
            );
        }

        const invoiceData = docSnap.data();

        return NextResponse.json({
            success: true,
            data: {
                id: docSnap.id,
                ...invoiceData,
                createdAt: invoiceData.createdAt?.toDate?.()?.toISOString() || null,
                updatedAt: invoiceData.updatedAt?.toDate?.()?.toISOString() || null,
            },
        }, { headers: corsHeaders });

    } catch (error) {
        console.error('Error fetching invoice:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500, headers: corsHeaders }
        );
    }
}
