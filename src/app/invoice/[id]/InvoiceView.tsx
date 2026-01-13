"use client";

import React from "react";
import { InvoicePreview } from "@/components/invoices/InvoicePreview";
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";

interface InvoiceViewProps {
    invoice: any;
}

export default function InvoiceView({ invoice }: InvoiceViewProps) {
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8 print:bg-white print:p-0">
            <div className="max-w-4xl mx-auto print:max-w-none">
                {/* Actions Bar - Hidden when printing */}
                <div className="mb-6 flex justify-between items-center print:hidden">
                    <h1 className="text-2xl font-bold text-gray-900">Invoice {invoice.invoiceNumber}</h1>
                    <div className="space-x-4">
                        <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700">
                            <Printer className="h-4 w-4 mr-2" />
                            Print / Save as PDF
                        </Button>
                    </div>
                </div>

                {/* Invoice Content */}
                <div className="bg-white shadow-lg rounded-lg overflow-hidden print:shadow-none print:rounded-none print:max-h-[50vh]">
                    <InvoicePreview
                        invoiceNumber={invoice.invoiceNumber}
                        invoiceDate={invoice.invoiceDate}
                        awbNumber={invoice.awbNumber}
                        courierPartner={invoice.courierPartner}
                        
                        originName={invoice.originName}
                        originAddress={invoice.originAddress}
                        originCity={invoice.originCity}
                        originState={invoice.originState}
                        originPincode={invoice.originPincode}
                        originPhone={invoice.originPhone}
                        originGstin={invoice.originGstin}
                        
                        destinationName={invoice.destinationName}
                        destinationAddress={invoice.destinationAddress}
                        destinationCity={invoice.destinationCity}
                        destinationState={invoice.destinationState}
                        destinationPincode={invoice.destinationPincode}
                        destinationPhone={invoice.destinationPhone}
                        destinationGstin={invoice.destinationGstin}
                        
                        packages={invoice.packages || []}
                        declaredValue={invoice.declaredValue || 0}
                        
                        charges={invoice.charges || {}}
                        
                        subtotal={invoice.subtotal || 0}
                        cgst={invoice.cgst || 0}
                        sgst={invoice.sgst || 0}
                        grandTotal={invoice.grandTotal || 0}
                        
                        paymentMode={invoice.paymentMode || 'prepaid'}
                        codAmount={invoice.codAmount}
                    />
                </div>
            </div>
            
            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    @page {
                        margin: 0.3in;
                        size: A4;
                    }
                    body {
                        background: white;
                    }
                    /* Ensure content fits half page */
                    .print\:max-h-\[50vh\] {
                        max-height: 50vh !important;
                        overflow: hidden !important;
                    }
                    /* Hide header/footer/sidebar from admin layout if they exist */
                    nav, header, aside, footer {
                        display: none !important;
                    }
                    /* Ensure main content is visible */
                    main {
                        margin: 0 !important;
                        padding: 0 !important;
                        width: 100% !important;
                    }
                }
            `}</style>
        </div>
    );
}
