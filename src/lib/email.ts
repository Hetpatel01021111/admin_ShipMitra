import nodemailer from 'nodemailer';

// Create reusable transporter object using the default SMTP transport
export const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'het7660@gmail.com', // Using provided credentials
        pass: '01/02/2007Het' // Using provided credentials
    }
});

export const getInvoiceEmailHtml = (invoiceNumber: string, invoiceUrl: string) => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice Email</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f5f7fa;
            margin: 0;
            padding: 20px;
        }
        .preview-container {
            max-width: 650px;
            margin: 0 auto;
            background-color: white;
            border-radius: 16px;
            box-shadow: 0 8px 30px rgba(91, 79, 255, 0.12);
            overflow: hidden;
        }
        .email-content {
            background-color: #ffffff;
        }
        .trust-badge {
            background: linear-gradient(135deg, #5B4FFF 0%, #3D37B8 100%);
            padding: 8px 20px;
            text-align: center;
            font-size: 12px;
            color: rgba(255,255,255,0.95);
            letter-spacing: 0.5px;
            font-weight: 500;
        }
        .trust-icon {
            display: inline-block;
            width: 14px;
            height: 14px;
            background: rgba(255,255,255,0.3);
            border-radius: 50%;
            margin-right: 6px;
            vertical-align: middle;
        }
        .header {
            background: linear-gradient(180deg, #ffffff 0%, #f8f9ff 100%);
            padding: 45px 45px 35px;
            text-align: center;
            position: relative;
            border-bottom: 3px solid #5B4FFF;
        }
        .logo-section {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 25px;
        }
        .logo-img {
            max-width: 150px;
            height: auto;
            display: block;
            margin: 0 auto 20px;
        }
        .header h1 {
            margin: 0 0 10px 0;
            font-size: 28px;
            font-weight: 700;
            color: #2B3849;
            letter-spacing: -0.5px;
        }
        .header .subtitle {
            font-size: 16px;
            color: #5B4FFF;
            font-weight: 600;
            margin: 0;
        }
        .content {
            padding: 45px 45px;
            background-color: #ffffff;
        }
        .greeting {
            font-size: 20px;
            font-weight: 600;
            color: #2B3849;
            margin-bottom: 20px;
        }
        .message {
            color: #3E4956;
            line-height: 1.8;
            margin: 18px 0;
            font-size: 16px;
        }
        .thank-you-box {
            background: linear-gradient(135deg, rgba(142, 221, 219, 0.12) 0%, rgba(91, 79, 255, 0.08) 100%);
            border-radius: 12px;
            padding: 25px;
            margin: 30px 0;
            text-align: center;
            border: 2px solid rgba(142, 221, 219, 0.3);
        }
        .thank-you-box .icon {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #5B4FFF 0%, #3D37B8 100%);
            border-radius: 50%;
            margin: 0 auto 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
        }
        .thank-you-box .icon::before {
            content: '';
            width: 16px;
            height: 16px;
            border: 3px solid white;
            border-radius: 50%;
            position: absolute;
            left: 6px;
        }
        .thank-you-box .icon::after {
            content: '';
            width: 16px;
            height: 16px;
            border: 3px solid white;
            border-radius: 50%;
            position: absolute;
            right: 6px;
        }
        .thank-you-box p {
            margin: 8px 0;
            color: #2B3849;
            font-size: 15px;
            line-height: 1.6;
        }
        .thank-you-box .highlight {
            color: #5B4FFF;
            font-weight: 600;
        }
        .invoice-card {
            background: white;
            border: 2px solid #E8EBF0;
            border-radius: 12px;
            padding: 30px;
            margin: 35px 0;
            box-shadow: 0 2px 12px rgba(0,0,0,0.04);
        }
        .invoice-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 20px;
            border-bottom: 2px dashed #E8EBF0;
        }
        .invoice-label {
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #8EDDDB;
            font-weight: 600;
        }
        .invoice-number {
            font-size: 26px;
            font-weight: 700;
            color: #2B3849;
        }
        .invoice-status {
            background: linear-gradient(135deg, #8EDDDB 0%, #71C4BE 100%);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 600;
        }
        .button-container {
            text-align: center;
            margin: 35px 0;
        }
        .cta-button {
            display: inline-block;
            padding: 18px 45px;
            background: linear-gradient(135deg, #5B4FFF 0%, #3D37B8 100%);
            color: white;
            text-decoration: none;
            border-radius: 35px;
            font-weight: 600;
            font-size: 16px;
            transition: all 0.3s;
            box-shadow: 0 6px 25px rgba(91, 79, 255, 0.35);
        }
        .cta-button:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 30px rgba(91, 79, 255, 0.45);
        }
        .security-note {
            background: #F8F9FB;
            border-left: 4px solid #8EDDDB;
            padding: 20px;
            border-radius: 8px;
            margin: 30px 0;
        }
        .security-note p {
            margin: 8px 0;
            font-size: 14px;
            color: #3E4956;
            line-height: 1.6;
        }
        .security-note .icon {
            display: inline-block;
            width: 18px;
            height: 20px;
            background: #8EDDDB;
            border-radius: 3px 3px 0 0;
            position: relative;
            margin-right: 8px;
            vertical-align: middle;
        }
        .security-note .icon::before {
            content: '';
            width: 12px;
            height: 10px;
            border: 3px solid #8EDDDB;
            border-bottom: none;
            border-radius: 8px 8px 0 0;
            position: absolute;
            top: -10px;
            left: 0;
        }
        .link-section {
            background-color: #F8F9FB;
            padding: 25px;
            border-radius: 12px;
            margin: 25px 0;
            border: 1px solid #E8EBF0;
        }
        .link-label {
            font-size: 13px;
            color: #8EDDDB;
            font-weight: 600;
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .link-text {
            background-color: white;
            padding: 15px;
            border-radius: 8px;
            word-break: break-all;
            font-size: 14px;
            color: #5B4FFF;
            border: 1px solid #E8EBF0;
            font-family: 'Courier New', monospace;
        }
        .support-section {
            text-align: center;
            margin: 40px 0 20px;
            padding: 25px;
            background: linear-gradient(135deg, rgba(91, 79, 255, 0.05) 0%, rgba(142, 221, 219, 0.08) 100%);
            border-radius: 12px;
        }
        .support-section p {
            margin: 10px 0;
            color: #3E4956;
            font-size: 15px;
        }
        .support-section .contact {
            color: #5B4FFF;
            font-weight: 600;
            text-decoration: none;
        }
        .footer {
            background: linear-gradient(135deg, #2B3849 0%, #1a2332 100%);
            padding: 45px 45px 35px;
            text-align: center;
            color: rgba(255,255,255,0.8);
        }
        .footer-logo {
            font-size: 32px;
            font-weight: 700;
            color: white;
            margin-bottom: 15px;
            letter-spacing: -0.5px;
        }
        .footer-tagline {
            color: #8EDDDB;
            font-size: 14px;
            margin: 10px 0 20px;
            font-style: italic;
        }
        .footer p {
            margin: 8px 0;
            font-size: 14px;
            color: rgba(255,255,255,0.7);
            line-height: 1.6;
        }
        .doc-icon {
            display: inline-block;
            margin-right: 8px;
            vertical-align: middle;
        }
        .doc-icon::before {
            content: '';
            display: inline-block;
            width: 14px;
            height: 18px;
            background: white;
            border: 2px solid currentColor;
            border-radius: 2px;
            position: relative;
            top: 2px;
        }
    </style>
</head>
<body>
    <div class="preview-container">
        <div class="email-content">
            <div class="trust-badge">
                <span class="trust-icon"></span>Trusted by 10,000+ businesses across India
            </div>
            
            <div class="header">
                <img src="https://shipmitra-admin.vercel.app/logo.png" alt="ShipMitra Logo" class="logo-img">
                <h1>Invoice Ready!</h1>
                <p class="subtitle">Your trusted shipping partner</p>
            </div>
            
            <div class="content">
                <p class="greeting">Hello Valued Partner,</p>
                
                <p class="message">Thank you for choosing <strong style="color: #5B4FFF;">ShipMitra</strong> for your shipping needs. We're honored to serve you and your business.</p>
                
                <div class="thank-you-box">
                    <div class="icon"></div>
                    <p>Your trust means everything to us. We've successfully processed your shipment and your invoice is now ready.</p>
                    <p style="margin-top: 15px;"><span class="highlight">10,000+ businesses</span> trust us daily for their shipping needs.</p>
                </div>
                
                <div class="invoice-card">
                    <div class="invoice-header">
                        <div>
                            <div class="invoice-label">Invoice Number</div>
                            <div class="invoice-number">${invoiceNumber}</div>
                        </div>
                        <div class="invoice-status">Generated</div>
                    </div>
                    <p style="margin: 0; color: #3E4956; font-size: 14px;">Click below to securely view your invoice details</p>
                </div>
                
                <div class="button-container">
                    <a href="${invoiceUrl}" class="cta-button"><span class="doc-icon"></span>View Your Invoice</a>
                </div>
                
                <div class="security-note">
                    <p><span class="icon"></span><strong>Secure Access:</strong> Your invoice is protected and accessible only through this secure link.</p>
                </div>
                
                <div class="link-section">
                    <div class="link-label">Alternative Access Link</div>
                    <div class="link-text">${invoiceUrl}</div>
                </div>
                
                <div class="support-section">
                    <p><strong>Need Assistance?</strong></p>
                    <p>Our dedicated support team is here for you 24/7</p>
                    <p style="margin-top: 15px;">
                        <a href="mailto:support@shipmitra.com" class="contact">support@shipmitra.com</a> | 
                        <span style="color: #8EDDDB; font-weight: 600;">+91 8469561212</span>
                    </p>
                </div>
            </div>
            
            <div class="footer">
                <div class="footer-logo">ShipMitra</div>
                <div class="footer-tagline">"Because every shipment deserves a choice"</div>
                <p><strong>ShipMitra Tech Private Limited</strong></p>
                <p style="margin-top: 15px;">Delivering excellence with every shipment since 2020</p>
                <p>Trusted by businesses across India for reliable, fast, and secure shipping solutions</p>
                
                <p style="font-size: 12px; margin-top: 20px; opacity: 0.6;">
                    © ${new Date().getFullYear()} ShipMitra Tech Private Limited. All rights reserved.
                </p>
            </div>
        </div>
    </div>
</body>
</html>
    `;
};

export const sendInvoiceEmail = async (to: string, invoiceUrl: string, invoiceNumber: string) => {
    try {
        const info = await transporter.sendMail({
            from: '"ShipMitra Admin" <het7660@gmail.com>',
            to: to,
            subject: `Invoice ${invoiceNumber} from ShipMitra`,
            html: getInvoiceEmailHtml(invoiceNumber, invoiceUrl),
        });
        console.log("Message sent: %s", info.messageId);
        return true;
    } catch (error) {
        console.error("Error sending email:", error);
        return false;
    }
};
