import { getInvoiceEmailHtml } from "@/lib/email";

export default function EmailPreviewPage() {
  const html = getInvoiceEmailHtml("INV-TEST-123", "https://shipmitra-admin.vercel.app/invoice/preview-id");

  return (
    <div className="w-full min-h-screen bg-gray-100 p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Email Template Preview</h1>
            <p className="text-gray-600 mt-2">Preview of the invoice email sent to customers</p>
          </div>
          <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg text-sm font-medium">
            Live Preview
          </div>
        </div>
        
        <div className="bg-white shadow-2xl rounded-xl overflow-hidden border border-gray-200">
          <div className="bg-gray-50 border-b border-gray-200 p-4 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
            <div className="ml-4 flex-1 bg-white border border-gray-300 rounded px-3 py-1 text-xs text-gray-500 font-mono">
              Subject: Invoice INV-TEST-123 from ShipMitra
            </div>
          </div>
          <iframe
            srcDoc={html}
            className="w-full h-[800px] border-0 bg-white"
            title="Email Preview"
          />
        </div>
      </div>
    </div>
  );
}
