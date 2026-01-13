
import { sendInvoiceEmail } from "../lib/email";

async function main() {
  console.log("🚀 Starting email test...");
  console.log("Target: het7660@gmail.com");
  
  try {
    // Using a sample invoice URL and ID for testing
    const success = await sendInvoiceEmail(
      "het7660@gmail.com",
      "https://shipmitra-admin.vercel.app/email-preview",
      "TEST-INV-" + Date.now().toString().slice(-4)
    );
    
    if (success) {
      console.log("✅ Test email sent successfully!");
    } else {
      console.error("❌ Failed to send test email. Check console for details.");
    }
  } catch (error) {
    console.error("❌ Error running test:", error);
  }
}

main();
