import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    updateDoc,
    addDoc,
    deleteDoc,
    serverTimestamp,
    Timestamp,
    DocumentData,
    QueryConstraint,
    writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { Order, Rider, Customer, DashboardMetrics } from '@/types';

// ============ ORDERS ============
// Orders are stored in the 'invoices' collection - unified with invoices

// Helper to map invoice data to order display format
const mapInvoiceToOrder = (id: string, data: any): Order => {
    return {
        id,
        // Use invoice number as AWB if no specific AWB
        awbNumber: data.awbNumber || data.invoiceNumber || '',
        invoiceNumber: data.invoiceNumber || '',
        // Customer info from origin
        customerName: data.originName || data.customerName || '',
        customerPhone: data.originPhone || data.customerPhone || '',
        // Pickup/Sender details
        pickup: {
            name: data.originName || '',
            phone: data.originPhone || '',
            address: data.originAddress || '',
            city: data.originCity || '',
            state: data.originState || '',
            pincode: data.originPincode || '',
        },
        // Delivery/Receiver details  
        delivery: {
            name: data.destinationName || '',
            phone: data.destinationPhone || '',
            address: data.destinationAddress || '',
            city: data.destinationCity || '',
            state: data.destinationState || '',
            pincode: data.destinationPincode || '',
        },
        // Financial
        amount: data.grandTotal || data.amount || 0,
        // Status - use orderStatus for shipment tracking, default to 'pending' if not set
        // (invoice status like 'draft', 'sent', 'paid' is separate from order status)
        status: data.orderStatus || 'pending',
        // Courier
        courierPartner: data.courierPartner || 'Delivery',
        // Timestamps
        createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt),
        // Other data
        ...data,
    } as Order;
};

export const getOrders = async (filters?: {
    status?: string;
    limitCount?: number;
    startDate?: Date;
    endDate?: Date;
}): Promise<Order[]> => {
    try {
        const constraints: QueryConstraint[] = [
            orderBy('createdAt', 'desc'),
            limit(filters?.limitCount || 100)
        ];

        if (filters?.status && filters.status !== 'all') {
            constraints.unshift(where('orderStatus', '==', filters.status));
        }

        const q = query(collection(db, 'invoices'), ...constraints);
        const snapshot = await getDocs(q);

        return snapshot.docs.map((doc) => mapInvoiceToOrder(doc.id, doc.data()));
    } catch (error) {
        console.error('Error fetching orders:', error);
        return [];
    }
};

export const getOrderById = async (orderId: string): Promise<Order | null> => {
    try {
        const docRef = doc(db, 'invoices', orderId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return mapInvoiceToOrder(docSnap.id, docSnap.data());
        }
        return null;
    } catch (error) {
        console.error('Error fetching order:', error);
        return null;
    }
};

export const updateOrderStatus = async (
    orderId: string,
    status: string,
    updatedBy: string = 'admin',
    note?: string
): Promise<boolean> => {
    try {
        const docRef = doc(db, 'invoices', orderId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) return false;

        const currentData = docSnap.data();
        const statusHistory = currentData.statusHistory || [];

        await updateDoc(docRef, {
            orderStatus: status, // Use orderStatus to differentiate from invoice status
            updatedAt: serverTimestamp(),
            statusHistory: [
                ...statusHistory,
                {
                    status,
                    timestamp: new Date(),
                    updatedBy,
                    note: note || '',
                },
            ],
        });
        return true;
    } catch (error) {
        console.error('Error updating order status:', error);
        return false;
    }
};

export const assignRiderToOrder = async (
    orderId: string,
    riderId: string,
    riderName: string
): Promise<boolean> => {
    try {
        const docRef = doc(db, 'invoices', orderId);
        await updateDoc(docRef, {
            assignedRider: riderId,
            riderName,
            orderStatus: 'pickup_scheduled',
            updatedAt: serverTimestamp(),
        });
        return true;
    } catch (error) {
        console.error('Error assigning rider:', error);
        return false;
    }
};

export const updateOrderPurchaseDetails = async (
    orderId: string,
    purchaseDetails: {
        billNumber: string;
        billDate: string;
        amount: number;
        gstAmount: number;
        totalAmount: number;
        courierName: string;
        billUrl?: string;
    }
): Promise<boolean> => {
    try {
        const docRef = doc(db, 'invoices', orderId);
        await updateDoc(docRef, {
            purchaseDetails,
            updatedAt: serverTimestamp(),
        });
        return true;
    } catch (error) {
        console.error('Error updating purchase details:', error);
        return false;
    }
};

// Real-time orders listener
export const subscribeToOrders = (
    callback: (orders: Order[]) => void,
    filters?: { status?: string; limitCount?: number }
) => {
    const constraints: QueryConstraint[] = [
        orderBy('createdAt', 'desc'),
        limit(filters?.limitCount || 50)
    ];

    if (filters?.status && filters.status !== 'all') {
        constraints.unshift(where('orderStatus', '==', filters.status));
    }

    const q = query(collection(db, 'invoices'), ...constraints);

    return onSnapshot(q, (snapshot) => {
        const orders = snapshot.docs.map((doc) => mapInvoiceToOrder(doc.id, doc.data()));
        callback(orders);
    }, (error) => {
        console.error('Error subscribing to orders:', error);
        callback([]);
    });
};

// ============ RIDERS ============

export const getRiders = async (): Promise<Rider[]> => {
    try {
        const snapshot = await getDocs(
            query(collection(db, 'riders'), orderBy('createdAt', 'desc'))
        );
        return snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        })) as Rider[];
    } catch (error) {
        console.error('Error fetching riders:', error);
        return [];
    }
};

export const getActiveRiders = async (): Promise<Rider[]> => {
    try {
        const q = query(
            collection(db, 'riders'),
            where('isActive', '==', true)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as Rider[];
    } catch (error) {
        console.error('Error fetching active riders:', error);
        return [];
    }
};

export const addRider = async (rider: Omit<Rider, 'id'>): Promise<string | null> => {
    try {
        const docRef = await addDoc(collection(db, 'riders'), {
            ...rider,
            createdAt: serverTimestamp(),
            assignedOrders: [],
            completedPickups: 0,
            earnings: 0,
            payoutDue: 0,
            rating: 5.0,
        });
        return docRef.id;
    } catch (error) {
        console.error('Error adding rider:', error);
        return null;
    }
};

export const updateRider = async (riderId: string, data: Partial<Rider>): Promise<boolean> => {
    try {
        const docRef = doc(db, 'riders', riderId);
        await updateDoc(docRef, {
            ...data,
            updatedAt: serverTimestamp(),
        });
        return true;
    } catch (error) {
        console.error('Error updating rider:', error);
        return false;
    }
};

export const deleteRider = async (riderId: string): Promise<boolean> => {
    try {
        const docRef = doc(db, 'riders', riderId);
        await deleteDoc(docRef);
        return true;
    } catch (error) {
        console.error('Error deleting rider:', error);
        return false;
    }
};

export const getRiderById = async (riderId: string): Promise<Rider | null> => {
    try {
        const docRef = doc(db, 'riders', riderId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return {
                id: docSnap.id,
                ...docSnap.data(),
                createdAt: docSnap.data().createdAt?.toDate?.() || new Date(),
            } as Rider;
        }
        return null;
    } catch (error) {
        console.error('Error fetching rider:', error);
        return null;
    }
};

// ============ CUSTOMERS ============

export const getCustomers = async (): Promise<Customer[]> => {
    try {
        const snapshot = await getDocs(
            query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(200))
        );
        return snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        })) as Customer[];
    } catch (error) {
        console.error('Error fetching customers:', error);
        return [];
    }
};

export const getCustomerById = async (customerId: string): Promise<Customer | null> => {
    try {
        const docRef = doc(db, 'users', customerId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Customer;
        }
        return null;
    } catch (error) {
        console.error('Error fetching customer:', error);
        return null;
    }
};

export const updateCustomerWallet = async (customerId: string, amount: number): Promise<boolean> => {
    try {
        const docRef = doc(db, 'users', customerId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) return false;

        const currentBalance = docSnap.data().walletBalance || 0;
        await updateDoc(docRef, {
            walletBalance: currentBalance + amount,
        });
        return true;
    } catch (error) {
        console.error('Error updating wallet:', error);
        return false;
    }
};

// ============ DASHBOARD METRICS ============

export const getDashboardMetrics = async (): Promise<DashboardMetrics | null> => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get all orders
        const ordersSnapshot = await getDocs(collection(db, 'bookings'));
        const orders = ordersSnapshot.docs.map((doc) => {
            const data = doc.data();
            const createdAt = data.createdAt?.toDate?.() || (data.createdAt ? new Date(data.createdAt) : new Date());
            return {
                ...data,
                createdAt,
            };
        }) as unknown as Order[];

        // Calculate metrics
        const todayOrders = orders.filter((o) => {
            const createdAt = o.createdAt instanceof Date ? o.createdAt : new Date(o.createdAt as any);
            return createdAt >= today;
        });

        const pendingOrders = orders.filter((o) => o.status === 'pending');
        const deliveredOrders = orders.filter((o) => o.status === 'delivered');

        const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
        const totalRevenue = orders.reduce((sum, o) => sum + (o.amount || 0), 0);

        // Get active riders
        const ridersSnapshot = await getDocs(
            query(collection(db, 'riders'), where('isActive', '==', true))
        );

        // Get customers count
        const customersSnapshot = await getDocs(collection(db, 'users'));

        return {
            totalOrders: orders.length,
            todayOrders: todayOrders.length,
            pendingOrders: pendingOrders.length,
            deliveredOrders: deliveredOrders.length,
            todayRevenue,
            totalRevenue,
            activeRiders: ridersSnapshot.size,
            totalCustomers: customersSnapshot.size,
            ordersChange: '+12%',
            revenueChange: '+18.5%',
            ridersChange: '+2',
            pendingChange: '-5%',
        };
    } catch (error) {
        console.error('Error fetching dashboard metrics:', error);
        return null;
    }
};

// Real-time dashboard metrics
export const subscribeToDashboardMetrics = (callback: (metrics: DashboardMetrics | null) => void) => {
    // Subscribe to orders for real-time updates
    return onSnapshot(
        query(collection(db, 'bookings'), orderBy('createdAt', 'desc'), limit(500)),
        async () => {
            const metrics = await getDashboardMetrics();
            callback(metrics);
        },
        (error) => {
            console.error('Error subscribing to metrics:', error);
            callback(null);
        }
    );
};

// ============ INVOICES ============

export const getInvoices = async () => {
    try {
        const snapshot = await getDocs(
            query(collection(db, 'invoices'), orderBy('createdAt', 'desc'), limit(100))
        );
        return snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || new Date(),
            dueDate: doc.data().dueDate?.toDate?.() || new Date(),
        }));
    } catch (error) {
        console.error('Error fetching invoices:', error);
        return [];
    }
};

export const getInvoiceById = async (invoiceId: string) => {
    try {
        const docRef = doc(db, 'invoices', invoiceId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                ...data,
                createdAt: data.createdAt?.toDate?.() || new Date(),
                dueDate: data.dueDate?.toDate?.() || new Date(),
            };
        }
        return null;
    } catch (error) {
        console.error('Error fetching invoice:', error);
        return null;
    }
};

// Generate the next invoice number based on existing invoices in Firestore
export const getNextInvoiceNumber = async (): Promise<string> => {
    try {
        const year = new Date().getFullYear();
        const countSnapshot = await getDocs(collection(db, 'invoices'));
        const nextNumber = countSnapshot.size + 1;
        return `SM/${year}/${String(nextNumber).padStart(4, '0')}`;
    } catch (error) {
        console.error('Error generating invoice number:', error);
        const year = new Date().getFullYear();
        return `SM/${year}/0001`;
    }
};

export const createInvoice = async (invoiceData: any): Promise<string | null> => {
    try {
        // Use provided invoice number or generate one
        let invoiceNumber = invoiceData.invoiceNumber;
        if (!invoiceNumber || invoiceNumber.includes('Auto') || invoiceNumber.includes('Loading')) {
            const year = new Date().getFullYear();
            const countSnapshot = await getDocs(collection(db, 'invoices'));
            invoiceNumber = `SM/${year}/${String(countSnapshot.size + 1).padStart(4, '0')}`;
        }

        const docRef = await addDoc(collection(db, 'invoices'), {
            ...invoiceData,
            invoiceNumber,
            status: invoiceData.status || 'draft', // Invoice status (draft, sent, paid)
            orderStatus: 'pending', // Order/shipment status (pending, in_transit, delivered, cancelled)
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        return docRef.id;
    } catch (error) {
        console.error('Error creating invoice:', error);
        return null;
    }
};

export const updateInvoiceStatus = async (
    invoiceId: string,
    status: string
): Promise<boolean> => {
    try {
        const docRef = doc(db, 'invoices', invoiceId);
        await updateDoc(docRef, {
            status,
            updatedAt: serverTimestamp(),
            ...(status === 'paid' ? { paidAt: serverTimestamp() } : {}),
        });
        return true;
    } catch (error) {
        console.error('Error updating invoice status:', error);
        return false;
    }
};

export const updateInvoice = async (
    invoiceId: string,
    invoiceData: any
): Promise<boolean> => {
    try {
        const docRef = doc(db, 'invoices', invoiceId);
        // Remove fields that should not be updated
        const { id, createdAt, invoiceNumber, ...updateData } = invoiceData;

        await updateDoc(docRef, {
            ...updateData,
            updatedAt: serverTimestamp(),
        });
        return true;
    } catch (error) {
        console.error('Error updating invoice:', error);
        return false;
    }
};

// ============ ANALYTICS ============

export const getRevenueData = async (days: number = 7) => {
    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        startDate.setHours(0, 0, 0, 0);

        // Fetch from invoices collection for accurate revenue data
        const snapshot = await getDocs(
            query(
                collection(db, 'invoices'),
                where('createdAt', '>=', Timestamp.fromDate(startDate)),
                orderBy('createdAt', 'asc')
            )
        );

        // Group by date
        const revenueByDate: Record<string, number> = {};
        const invoicesByDate: Record<string, number> = {};

        snapshot.docs.forEach((doc) => {
            const data = doc.data();
            const date = data.createdAt?.toDate?.() || new Date(data.createdAt);
            const dateKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            // Use grandTotal from invoices for accurate revenue
            revenueByDate[dateKey] = (revenueByDate[dateKey] || 0) + (data.grandTotal || data.subtotal || 0);
            invoicesByDate[dateKey] = (invoicesByDate[dateKey] || 0) + 1;
        });

        // If no invoice data, generate empty data for last N days
        if (Object.keys(revenueByDate).length === 0) {
            for (let i = days - 1; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                revenueByDate[dateKey] = 0;
                invoicesByDate[dateKey] = 0;
            }
        }

        return Object.keys(revenueByDate).map((date) => ({
            date,
            revenue: revenueByDate[date],
            orders: invoicesByDate[date],
        }));
    } catch (error) {
        console.error('Error fetching revenue data:', error);
        return [];
    }
};

export const getOrderStatusCounts = async () => {
    try {
        const snapshot = await getDocs(collection(db, 'bookings'));

        const statusCounts: Record<string, number> = {
            pending: 0,
            pickup_scheduled: 0,
            picked_up: 0,
            in_transit: 0,
            delivered: 0,
            cancelled: 0,
        };

        snapshot.docs.forEach((doc) => {
            const status = doc.data().status || 'pending';
            if (statusCounts[status] !== undefined) {
                statusCounts[status]++;
            }
        });

        return Object.entries(statusCounts).map(([name, value]) => ({
            name: name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
            value,
        }));
    } catch (error) {
        console.error('Error fetching order status counts:', error);
        return [];
    }
};
