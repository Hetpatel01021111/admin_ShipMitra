"use client";

import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import InvoiceView from "./InvoiceView";
import { Loader2 } from "lucide-react";
import { useParams } from "next/navigation";

export default function InvoicePage() {
    const params = useParams();
    const id = params?.id as string;
    const [invoice, setInvoice] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchInvoice = async () => {
            if (!id) return;

            try {
                const docRef = doc(db, "invoices", id);
                const docSnap = await getDoc(docRef);

                if (!docSnap.exists()) {
                    setError("Invoice not found");
                    setLoading(false);
                    return;
                }

                const data = docSnap.data();
                setInvoice({
                    id: docSnap.id,
                    ...data,
                    // Handle timestamps safely
                    createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
                    invoiceDate: data.invoiceDate || new Date().toISOString(),
                });
            } catch (err: any) {
                console.error("Error fetching invoice:", err);
                // Check for permission error specifically
                if (err.code === 'permission-denied') {
                    setError("You do not have permission to view this invoice. Please contact support.");
                } else {
                    setError("Error loading invoice. Please try again.");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchInvoice();
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
                <h1 className="text-2xl font-bold text-red-600 mb-2">Access Error</h1>
                <p className="text-gray-600">{error}</p>
                <p className="text-sm text-gray-500 mt-4">ID: {id}</p>
            </div>
        );
    }

    if (!invoice) return null;

    return <InvoiceView invoice={invoice} />;
}
