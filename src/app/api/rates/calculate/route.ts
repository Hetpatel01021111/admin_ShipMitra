import { NextResponse } from 'next/server';
import { getAllRates, RateRequest } from '@/lib/couriers';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { origin, destination, packages, paymentType, declaredValue } = body;

        // Basic validation
        if (!origin?.pincode || !destination?.pincode || !packages?.length) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Calculate total weight and dimensions
        // Using "Actual Weight" logic as requested
        const totalWeight = packages.reduce((sum: number, p: any) => sum + (Number(p.weight) || 0), 0);

        // For dimensions, we'll take the first package's dimensions as a baseline or 10x10x10 if missing
        // since the API needs *some* dimensions.
        const firstPkg = packages[0];

        const req: RateRequest = {
            originPincode: origin.pincode,
            destinationPincode: destination.pincode,
            weight: totalWeight,
            length: Number(firstPkg.length) || 10,
            width: Number(firstPkg.width) || 10,
            height: Number(firstPkg.height) || 10,
            paymentType: paymentType || 'Prepaid',
            declaredValue: declaredValue || 1000
        };

        const rates = await getAllRates(req);

        if (rates.length === 0) {
            return NextResponse.json({ error: 'No rates found from any courier' }, { status: 404 });
        }

        return NextResponse.json({
            rates
        });

    } catch (error: any) {
        console.error('Rate Calculation Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to calculate rates' }, { status: 500 });
    }
}
