import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK (server-side only)
// This runs in Next.js API routes and server components
function getAdminApp(): App {
    if (getApps().length > 0) {
        return getApps()[0];
    }

    // Use service account JSON from environment variable if available,
    // otherwise fall back to application default credentials (works on Vercel
    // when GOOGLE_APPLICATION_CREDENTIALS or individual vars are set)
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    if (serviceAccountJson) {
        const serviceAccount = JSON.parse(serviceAccountJson);
        return initializeApp({
            credential: cert(serviceAccount),
            projectId: serviceAccount.project_id,
        });
    }

    // Fallback: use individual env vars (matching the client-side vars)
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'shipmitra-d250b';
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (clientEmail && privateKey) {
        return initializeApp({
            credential: cert({ projectId, clientEmail, privateKey }),
            projectId,
        });
    }

    // Last resort: application default credentials
    // (works with GOOGLE_APPLICATION_CREDENTIALS env var)
    return initializeApp({ projectId });
}

const adminApp = getAdminApp();
export const adminDb = getFirestore(adminApp);
