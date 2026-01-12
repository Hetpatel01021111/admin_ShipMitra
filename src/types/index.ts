import { Timestamp } from 'firebase/firestore';

// Address Details
export interface AddressDetails {
    name: string;
    phone: string;
    email?: string;
    address: string;
    landmark?: string;
    city: string;
    state?: string;
    pincode: string;
}

// Package Details
export interface PackageDetails {
    weight: number;
    length: number;
    width: number;
    height: number;
    isFragile: boolean;
    declaredValue?: number;
    description?: string;
}

// Status Update
export interface StatusUpdate {
    status: string;
    timestamp: Date | Timestamp;
    updatedBy: string;
    note?: string;
}

// Order
export interface Order {
    id: string;
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
    // From website booking API
    senderName?: string;
    senderPhone?: string;
    senderAddress?: string;
    senderCity?: string;
    senderState?: string;
    senderPincode?: string;
    receiverName?: string;
    receiverPhone?: string;
    receiverAddress?: string;
    receiverCity?: string;
    receiverState?: string;
    receiverPincode?: string;
    courierPartner?: string;
    invoiceId?: string;
    invoiceNumber?: string;
    // Standard fields
    status: OrderStatus;
    pickup?: AddressDetails;
    delivery?: AddressDetails;
    package?: PackageDetails;
    courier?: string;
    awbNumber?: string;
    labelUrl?: string;
    assignedRider?: string;
    riderName?: string;
    amount?: number;
    paymentStatus?: 'pending' | 'paid' | 'refunded';
    paymentMode?: 'prepaid' | 'cod';
    paymentId?: string;
    createdAt?: Date | Timestamp;
    updatedAt?: Date | Timestamp;
    pickupDate?: string;
    pickupTime?: string;
    estimatedDelivery?: string;
    statusHistory?: StatusUpdate[];
    source?: string;
}

export type OrderStatus =
    | 'pending'
    | 'pickup_scheduled'
    | 'picked_up'
    | 'handed_to_courier'
    | 'in_transit'
    | 'out_for_delivery'
    | 'delivered'
    | 'cancelled';

// Rider
export interface Rider {
    id: string;
    name: string;
    phone: string;
    email?: string;
    vehicleType: 'Bike' | 'Auto' | 'Car';
    vehicleNumber?: string;
    isActive: boolean;
    currentLocation?: {
        lat: number;
        lng: number;
        updatedAt: Date | Timestamp;
    };
    assignedOrders: string[];
    completedPickups: number;
    rating: number;
    earnings: number;
    payoutDue: number;
    createdAt: Date | Timestamp;
}

// Customer
export interface Customer {
    id: string;
    uid?: string;
    phone: string;
    email?: string;
    name: string;
    savedAddresses?: SavedAddress[];
    walletBalance?: number;
    totalShipments?: number;
    totalOrders?: number;
    referralCode?: string;
    referredBy?: string;
    createdAt?: Date | Timestamp;
}

export interface SavedAddress extends AddressDetails {
    id: string;
    label: 'Home' | 'Office' | 'Other';
    isDefault: boolean;
}

// Dashboard Metrics
export interface DashboardMetrics {
    totalOrders: number;
    todayOrders: number;
    weekOrders?: number;
    monthOrders?: number;
    totalRevenue: number;
    todayRevenue: number;
    weekRevenue?: number;
    monthRevenue?: number;
    pendingOrders: number;
    inTransitOrders?: number;
    deliveredOrders: number;
    activeRiders: number;
    totalCustomers: number;
    // Change indicators
    ordersChange?: string;
    revenueChange?: string;
    ridersChange?: string;
    pendingChange?: string;
}

// Courier Rate
export interface CourierRate {
    courier: string;
    courierLogo?: string;
    price: number;
    deliveryDays: number;
    reliabilityScore: number;
    isRecommended?: boolean;
}

// Admin User
export interface AdminUser {
    id: string;
    email: string;
    name: string;
    role: 'super_admin' | 'admin' | 'operator';
    createdAt: Date | Timestamp;
    lastLogin?: Date | Timestamp;
}

// Invoice Line Item
export interface InvoiceLineItem {
    id: string;
    description: string;
    hsnSac?: string;
    quantity: number;
    rate: number;
    amount: number;
}

// Invoice
export interface Invoice {
    id: string;
    invoiceNumber: string;

    // Customer Details
    customerId?: string;
    customerName: string;
    customerEmail?: string;
    customerPhone?: string;
    customerGstin?: string;
    customerAddress?: string;
    customerState?: string;

    // Company Details (Shipmitra)
    companyName: string;
    companyAddress: string;
    companyGstin: string;
    companyEmail: string;
    companyPhone: string;

    // Line Items
    items: InvoiceLineItem[];

    // Amounts
    subtotal: number;
    cgst: number;      // 9% for intra-state
    sgst: number;      // 9% for intra-state
    igst: number;      // 18% for inter-state
    rounding: number;
    total: number;

    // Metadata
    status: InvoiceStatus;
    notes?: string;
    terms?: string;

    // Dates
    createdAt: Date | Timestamp;
    updatedAt?: Date | Timestamp;
    dueDate?: Date | Timestamp;
    paidAt?: Date | Timestamp;

    // Subscription period (optional)
    subscriptionStartDate?: Date | Timestamp;
    subscriptionEndDate?: Date | Timestamp;
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

// Invoice Form Data (for creating/editing)
export interface InvoiceFormData {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    customerGstin: string;
    customerAddress: string;
    customerState: string;
    items: Omit<InvoiceLineItem, 'id'>[];
    notes: string;
    dueDate: string;
    subscriptionStartDate?: string;
    subscriptionEndDate?: string;
}

