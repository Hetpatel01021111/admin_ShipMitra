
// --- TYPES ---
export interface RateRequest {
    originPincode: string;
    destinationPincode: string;
    weight: number; // in KG
    length?: number; // in CM
    width?: number; // in CM
    height?: number; // in CM
    paymentType: 'Prepaid' | 'COD';
    declaredValue: number;
}

export interface CourierRate {
    courierName: string;
    serviceName: string;
    rate: number;
    currency: string;
    expectedDeliveryDate?: string;
    error?: string;
}

// --- FEDEX ---
async function getFedExToken() {
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', process.env.FEDEX_CLIENT_ID!);
    params.append('client_secret', process.env.FEDEX_CLIENT_SECRET!);

    const response = await fetch(process.env.FEDEX_OAUTH_URL!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params,
    });
    if (!response.ok) throw new Error('FedEx Token Failed');
    const data = await response.json();
    return data.access_token;
}

export async function getFedExRates(req: RateRequest): Promise<CourierRate[]> {
    try {
        const token = await getFedExToken();
        const payload = {
            accountNumber: { value: process.env.FEDEX_ACCOUNT_NUMBER },
            requestedShipment: {
                shipper: { address: { postalCode: req.originPincode, countryCode: 'IN' } },
                recipient: { address: { postalCode: req.destinationPincode, countryCode: 'IN' } },
                pickupType: 'USE_SCHEDULED_PICKUP',
                packagingType: 'YOUR_PACKAGING',
                rateRequestType: ['ACCOUNT'],
                requestedPackageLineItems: [{
                    weight: { units: 'KG', value: req.weight },
                    dimensions: { length: req.length || 10, width: req.width || 10, height: req.height || 10, units: 'CM' }
                }]
            }
        };

        const response = await fetch(process.env.FEDEX_API_URL!, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(JSON.stringify(data));

        const rates: CourierRate[] = [];
        data.output?.rateReplyDetails?.forEach((detail: any) => {
            const amount = detail.ratedShipmentDetails?.[0]?.totalNetCharge;
            if (amount) {
                rates.push({
                    courierName: 'FedEx',
                    serviceName: detail.serviceType,
                    rate: amount,
                    currency: detail.ratedShipmentDetails[0].currency
                });
            }
        });
        return rates;
    } catch (e: any) {
        console.error('FedEx Error:', e);
        return [{ courierName: 'FedEx', serviceName: 'Standard', rate: 0, currency: 'INR', error: e.message }];
    }
}

// --- DELHIVERY ---
export async function getDelhiveryRates(req: RateRequest): Promise<CourierRate[]> {
    try {
        const url = `https://track.delhivery.com/api/kkg/service/rate_calculator?origin=${req.originPincode}&destination=${req.destinationPincode}&weight=${req.weight * 1000}`; // Weight in grams
        const response = await fetch(url, {
            headers: {
                'Authorization': `Token ${process.env.DELHIVERY_API_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();

        // Delhivery structure check needed (assuming simple structure or array)
        // Usually returns { rate: 100, ... } or list
        const rate = data?.rate || data?.total_amount;

        if (rate) {
            return [{ courierName: 'Delhivery', serviceName: 'Express', rate: Number(rate), currency: 'INR' }];
        }
        return [];
    } catch (e: any) {
        console.error('Delhivery Error:', e);
        return [{ courierName: 'Delhivery', serviceName: 'Express', rate: 0, currency: 'INR', error: e.message }];
    }
}

// --- SHIPROCKET ---
export async function getShiprocketRates(req: RateRequest): Promise<CourierRate[]> {
    try {
        // 1. Serviceability API (returns rates too)
        const url = `https://apiv2.shiprocket.in/v1/external/courier/serviceability?pickup_postcode=${req.originPincode}&delivery_postcode=${req.destinationPincode}&weight=${req.weight}&cod=${req.paymentType === 'COD' ? 1 : 0}&declared_value=${req.declaredValue}`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${process.env.SHIPROCKET_AUTH_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();

        if (data.status === 200 && data.data?.available_courier_companies) {
            return data.data.available_courier_companies.map((c: any) => ({
                courierName: c.courier_name,
                serviceName: c.courier_name, // e.g. "DTDC", "Delhivery" via Shiprocket
                rate: c.rate,
                currency: 'INR',
                expectedDeliveryDate: c.etd
            }));
        }
        return [];
    } catch (e: any) {
        console.error('Shiprocket Error:', e);
        return [{ courierName: 'Shiprocket', serviceName: 'Standard', rate: 0, currency: 'INR', error: e.message }];
    }
}

// --- AGGREGATOR ---
export async function getAllRates(req: RateRequest): Promise<CourierRate[]> {
    const [fedex, delhivery, shiprocket] = await Promise.all([
        getFedExRates(req),
        getDelhiveryRates(req),
        getShiprocketRates(req)
    ]);
    return [...fedex, ...delhivery, ...shiprocket].filter(r => !r.error && r.rate > 0).sort((a, b) => a.rate - b.rate);
}
