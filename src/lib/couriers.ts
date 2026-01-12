
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

export interface DetailedRateRequest extends RateRequest {
    pieces?: number;
    billingMode?: 'E' | 'S';
    shipmentStatus?: string;
}

export interface ShippingRate {
    courier_company_id: number;
    courier_name: string;
    total_amount: number;
    estimated_delivery_days: string;
    cod_charges?: number;
    freight_charge?: number;
    other_charges?: number;
    charge_AIR?: number;
    charge_AWB?: number;
    charge_CCOD?: number;
    charge_CNC?: number;
    charge_COD?: number;
    charge_COVID?: number;
    charge_CWH?: number;
    charge_DEMUR?: number;
    charge_DL?: number;
    charge_DOCUMENT?: number;
    charge_DPH?: number;
    charge_DTO?: number;
    charge_E2E?: number;
    charge_FOD?: number;
    charge_FOV?: number;
    charge_FS?: number;
    charge_FSC?: number;
    charge_INS?: number;
    charge_LABEL?: number;
    charge_LM?: number;
    charge_MPS?: number;
    charge_POD?: number;
    charge_QC?: number;
    charge_REATTEMPT?: number;
    charge_ROV?: number;
    charge_RTO?: number;
    charge_WOD?: number;
    charge_pickup?: number;
    charged_weight?: number;
    gross_amount?: number;
    status?: string;
    zone?: string;
    tax_data?: Record<string, number>;
    wt_rule_id?: string | null;
    zonal_cl?: string | null;
    adhoc_data?: Record<string, unknown>;
    _provider?: 'delhivery' | 'shiprocket';
}

// --- FEDEX ---
async function getFedExToken() {
    try {
        const params = new URLSearchParams();
        params.append('grant_type', 'client_credentials');
        params.append('client_id', process.env.FEDEX_CLIENT_ID!);
        params.append('client_secret', process.env.FEDEX_CLIENT_SECRET!);

        const response = await fetch(process.env.FEDEX_OAUTH_URL!, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params,
        });
        if (!response.ok) {
            const errText = await response.text();
            console.error("FedEx Token Error:", errText);
            return null;
        }
        const data = await response.json();
        return data.access_token;
    } catch (e) {
        console.error("FedEx Token Exception:", e);
        return null;
    }
}

export async function getFedExRates(req: RateRequest): Promise<CourierRate[]> {
    try {
        const token = await getFedExToken();
        if (!token) return [];

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
        if (!response.ok) {
            console.error("FedEx API Error:", JSON.stringify(data));
            return [];
        }

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
        console.error('FedEx Exception:', e);
        return [];
    }
}

// --- DELHIVERY ---
export async function getDelhiveryRates(req: RateRequest): Promise<CourierRate[]> {
    try {
        // Delhivery KKG API usually requires origin/dest/weight/mode
        // Note: The KKG API documentation URL was 404, so this is a best-effort implementation
        // If the token is invalid, it will fail silently here.

        const url = `https://track.delhivery.com/api/kkg/service/rate_calculator?origin=${req.originPincode}&destination=${req.destinationPincode}&weight=${req.weight * 1000}`; // Weight in grams
        const response = await fetch(url, {
            headers: {
                'Authorization': `Token ${process.env.DELHIVERY_API_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.warn("Delhivery API Error Status:", response.status);
            return [];
        }

        const data = await response.json();

        // Check for common Delhivery error responses
        if (data.status === "False" || data.error) {
            console.warn("Delhivery API Error:", data.error || "Unknown Error");
            return [];
        }

        const rate = data?.rate || data?.total_amount;
        if (rate) {
            return [{ courierName: 'Delhivery', serviceName: 'Express', rate: Number(rate), currency: 'INR' }];
        }
        return [];
    } catch (e: any) {
        console.error('Delhivery Exception:', e);
        return [];
    }
}

// --- SHIPROCKET ---
async function getShiprocketToken() {
    try {
        console.log("Attempting Shiprocket Login...");
        const response = await fetch("https://apiv2.shiprocket.in/v1/external/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: process.env.SHIPROCKET_API_EMAIL,
                password: process.env.SHIPROCKET_API_PASSWORD
            })
        });
        const data = await response.json();
        if (data.token) {
            console.log("Shiprocket Login Success. Token generated.");
            return data.token;
        }
        console.error("Shiprocket Login Failed:", JSON.stringify(data));
        return null;
    } catch (e) {
        console.error("Shiprocket Login Exception:", e);
        return null;
    }
}

export async function getShiprocketRates(req: RateRequest): Promise<CourierRate[]> {
    try {
        let token = process.env.SHIPROCKET_AUTH_TOKEN;

        const url = `https://apiv2.shiprocket.in/v1/external/courier/serviceability?pickup_postcode=${req.originPincode}&delivery_postcode=${req.destinationPincode}&weight=${req.weight}&cod=${req.paymentType === 'COD' ? 1 : 0}&declared_value=${req.declaredValue}`;

        console.log(`Fetching Shiprocket Rates from: ${url}`);

        let response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        // If 401 Unauthorized, Token is likely expired. Try to login.
        if (response.status === 401) {
            console.log("Shiprocket Token Expired (401). Retrying with auto-login...");
            const newToken = await getShiprocketToken();
            if (newToken) {
                token = newToken; // Update local variable
                // Retry request
                response = await fetch(url, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
            } else {
                console.error("Could not refresh Shiprocket token. Aborting.");
                return [];
            }
        }

        const data = await response.json();

        if (data.status === 200 && data.data?.available_courier_companies) {
            return data.data.available_courier_companies.map((c: any) => ({
                courierName: c.courier_name,
                serviceName: "Standard",
                rate: c.rate,
                currency: 'INR',
                expectedDeliveryDate: c.etd
            }));
        }

        console.warn("Shiprocket Serviceability Response:", JSON.stringify(data));
        return [];

    } catch (e: any) {
        console.error('Shiprocket Exception:', e);
        return [];
    }
}

export async function getDelhiveryDetailedRates(req: DetailedRateRequest): Promise<ShippingRate[]> {
    try {
        const token = process.env.DELHIVERY_API_TOKEN;
        if (!token) return [];

        const billingMode = req.billingMode || 'E';
        const shipmentStatus = (req.shipmentStatus || '').trim();
        if (!shipmentStatus) return [];

        const params = new URLSearchParams();
        params.append('md', String(billingMode).trim());
        params.append('ss', shipmentStatus);
        params.append('d_pin', String(req.destinationPincode).trim());
        params.append('o_pin', String(req.originPincode).trim());
        params.append('cgm', String(Math.round(Number(req.weight) * 1000)));
        params.append('pt', req.paymentType === 'COD' ? 'COD' : 'Pre-paid');
        params.append('pieces', String(req.pieces ?? 1));
        params.append('length', String(req.length ?? 10));
        params.append('width', String(req.width ?? 10));
        params.append('breadth', String(req.height ?? 10));

        const url = `https://track.delhivery.com/api/kinko/v1/invoice/charges/.json?${params.toString()}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Token ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) return [];
        const data = await response.json().catch(() => null);
        if (!Array.isArray(data) || data.length === 0) return [];

        const delhivery = data[0] || {};
        return [{
            courier_company_id: delhivery.courier_company_id || 1,
            courier_name: 'Delhivery',
            total_amount: delhivery.total_amount ?? 0,
            estimated_delivery_days: delhivery.status ?? '',
            cod_charges: delhivery.charge_COD,
            freight_charge: delhivery.charge_AIR,
            other_charges: delhivery.charge_CWH,
            status: delhivery.status,
            zone: delhivery.zone,
            charged_weight: delhivery.charged_weight,
            gross_amount: delhivery.gross_amount,
            tax_data: delhivery.tax_data,
            wt_rule_id: delhivery.wt_rule_id,
            zonal_cl: delhivery.zonal_cl,
            adhoc_data: delhivery.adhoc_data,
            charge_AIR: delhivery.charge_AIR,
            charge_AWB: delhivery.charge_AWB,
            charge_CCOD: delhivery.charge_CCOD,
            charge_CNC: delhivery.charge_CNC,
            charge_COD: delhivery.charge_COD,
            charge_COVID: delhivery.charge_COVID,
            charge_CWH: delhivery.charge_CWH,
            charge_DEMUR: delhivery.charge_DEMUR,
            charge_DL: delhivery.charge_DL,
            charge_DOCUMENT: delhivery.charge_DOCUMENT,
            charge_DPH: delhivery.charge_DPH,
            charge_DTO: delhivery.charge_DTO,
            charge_E2E: delhivery.charge_E2E,
            charge_FOD: delhivery.charge_FOD,
            charge_FOV: delhivery.charge_FOV,
            charge_FS: delhivery.charge_FS,
            charge_FSC: delhivery.charge_FSC,
            charge_INS: delhivery.charge_INS,
            charge_LABEL: delhivery.charge_LABEL,
            charge_LM: delhivery.charge_LM,
            charge_MPS: delhivery.charge_MPS,
            charge_POD: delhivery.charge_POD,
            charge_QC: delhivery.charge_QC,
            charge_REATTEMPT: delhivery.charge_REATTEMPT,
            charge_ROV: delhivery.charge_ROV,
            charge_RTO: delhivery.charge_RTO,
            charge_WOD: delhivery.charge_WOD,
            charge_pickup: delhivery.charge_pickup,
            _provider: 'delhivery'
        }];
    } catch (e: any) {
        console.error('Delhivery Detailed Exception:', e);
        return [];
    }
}

export async function getShiprocketDetailedRates(req: DetailedRateRequest): Promise<ShippingRate[]> {
    try {
        let token = process.env.SHIPROCKET_AUTH_TOKEN;
        if (!token) return [];

        const params = new URLSearchParams();
        params.append('pickup_postcode', String(req.originPincode).trim());
        params.append('delivery_postcode', String(req.destinationPincode).trim());
        params.append('cod', req.paymentType === 'COD' ? '1' : '0');
        params.append('weight', String(req.weight));
        params.append('pieces', String(req.pieces ?? 1));
        params.append('length', String(req.length ?? 10));
        params.append('width', String(req.width ?? 10));
        params.append('breadth', String(req.height ?? 10));
        params.append('declared_value', String(req.declaredValue || 1000));

        const url = `https://apiv2.shiprocket.in/v1/external/courier/serviceability/?${params.toString()}`;
        let response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401) {
            const newToken = await getShiprocketToken();
            if (newToken) {
                token = newToken;
                response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
            } else {
                return [];
            }
        }

        const data = await response.json().catch(() => null);
        const companies = data?.data?.available_courier_companies;
        if (!Array.isArray(companies) || companies.length === 0) return [];

        return companies.map((company: any) => ({
            courier_company_id: company.courier_company_id,
            courier_name: company.courier_name,
            total_amount: company.rate,
            estimated_delivery_days: company.estimated_delivery_days ?? company.etd ?? '',
            cod_charges: company.cod_charges,
            freight_charge: company.freight_charge,
            other_charges: company.other_charges,
            status: company.delivery_type,
            zone: company.zone_type,
            charged_weight: company.chargeable_weight,
            gross_amount: company.rate,
            _provider: 'shiprocket'
        }));
    } catch (e: any) {
        console.error('Shiprocket Detailed Exception:', e);
        return [];
    }
}

export async function getDetailedRates(req: DetailedRateRequest): Promise<ShippingRate[]> {
    const results = await Promise.allSettled([
        getDelhiveryDetailedRates(req),
        getShiprocketDetailedRates(req)
    ]);

    const allRates: ShippingRate[] = [];
    results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value.length > 0) {
            allRates.push(...result.value);
        }
    });

    return allRates.sort((a, b) => a.total_amount - b.total_amount);
}

// --- AGGREGATOR ---
export async function getAllRates(req: RateRequest): Promise<CourierRate[]> {
    console.log("Starting Rate Calculation for:", JSON.stringify(req));

    // Run all in parallel
    const results = await Promise.allSettled([
        getFedExRates(req),
        getDelhiveryRates(req),
        getShiprocketRates(req)
    ]);

    const allRates: CourierRate[] = [];

    results.forEach((result, index) => {
        const courier = index === 0 ? "FedEx" : index === 1 ? "Delhivery" : "Shiprocket";
        if (result.status === 'fulfilled') {
            if (result.value.length > 0) {
                allRates.push(...result.value);
            } else {
                console.log(`${courier} returned no rates.`);
            }
        } else {
            console.error(`${courier} Failed:`, result.reason);
        }
    });

    console.log(`Total Rates Found: ${allRates.length}`);
    return allRates.sort((a, b) => a.rate - b.rate);
}
