import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');

export const maxDuration = 60; // Allow up to 60 seconds for AI processing (Vercel Hobby/Pro limit)
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        // 1. Check for API Key
        if (!process.env.GOOGLE_GEMINI_API_KEY) {
            return NextResponse.json(
                { error: 'GOOGLE_GEMINI_API_KEY is not set in environment variables.' },
                { status: 500 }
            );
        }

        // 2. Parse FormData
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { error: 'No file uploaded.' },
                { status: 400 }
            );
        }

        // 3. Convert file to base64
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Image = buffer.toString('base64');
        const mimeType = file.type;

        // 4. Prepare Prompt
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        const prompt = `
      You are an expert data extraction assistant. extracting key shipping details from this invoice/bill image.
      Please extract the following information in strict JSON format:

      - Origin/Sender/Consignor: Name, Address, City, State, Pincode, Phone, GSTIN.
      - Destination/Receiver/Consignee: Name, Address, City, State, Pincode, Phone, GSTIN.
      - Packages: An array of objects each containing: description (product name), boxes, quantity, length, width, height, actualWeight. (If dimensions are missing, use 0).
      - Declared Value: The total declared value of the goods (Before tax/charges).
      - Invoice Number: If present.

      Ignore any shipping charges, freight charges, or tax breakdowns. Focus on the shipper, receiver, and item details.

      Return ONLY raw JSON, correctly formatted. Do not include markdown code block syntax (like \`\`\`json).
      JSON Structure:
      {
        "invoiceNumber": string,
        "origin": { "name": "", "address": "", "city": "", "state": "", "pincode": "", "phone": "", "gstin": "" },
        "destination": { "name": "", "address": "", "city": "", "state": "", "pincode": "", "phone": "", "gstin": "" },
        "packages": [ { "productName": "", "boxes": number, "quantity": number, "length": number, "width": number, "height": number, "actualWeight": number } ],
        "declaredValue": number
      }
    `;

        // 5. Generate Content
        // 5. Generate Content with Retry Logic
        let result;
        let retries = 3;
        while (retries > 0) {
            try {
                result = await model.generateContent([
                    prompt,
                    {
                        inlineData: {
                            data: base64Image,
                            mimeType: mimeType
                        }
                    }
                ]);
                break; // If successful, exit loop
            } catch (error: any) {
                if (error.message?.includes('503') || error.status === 503) {
                    console.log(`Gemini 503 error, retrying... (${retries} attempts left)`);
                    retries--;
                    if (retries === 0) throw error;
                    // Wait 2 seconds before retrying
                    await new Promise(resolve => setTimeout(resolve, 2000));
                } else {
                    throw error;
                }
            }
        }

        if (!result) {
            throw new Error("Failed to generate content after retries.");
        }

        const response = await result.response;
        const text = response.text();

        // 6. Parse JSON
        let data;
        try {
            // Clean up markdown code blocks if Gemini includes them
            const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            data = JSON.parse(cleanedText);
        } catch (e) {
            console.error('Failed to parse Gemini response:', text);
            return NextResponse.json(
                { error: 'Failed to parse AI response.', raw: text },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, data });

    } catch (error: any) {
        console.error('AI Extraction Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
