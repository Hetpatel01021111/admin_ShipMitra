"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
    User,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc, getDocs, collection, query, where } from "firebase/firestore";
import { auth, db } from "./firebase";
import { useRouter, usePathname } from "next/navigation";

interface AdminUser {
    uid: string;
    email: string;
    name: string;
    role: "super_admin" | "admin" | "operator";
}

interface AuthContextType {
    user: User | null;
    adminUser: AdminUser | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);

                // Fetch admin user details from Firestore
                try {
                    const adminDoc = await getDoc(doc(db, "admins", firebaseUser.uid));
                    if (adminDoc.exists()) {
                        setAdminUser({
                            uid: firebaseUser.uid,
                            email: firebaseUser.email || "",
                            name: adminDoc.data().name || "Admin",
                            role: adminDoc.data().role || "operator",
                        });
                    } else {
                        // User exists in Firebase Auth but not in admins collection
                        // For demo, create a default admin user object
                        setAdminUser({
                            uid: firebaseUser.uid,
                            email: firebaseUser.email || "",
                            name: firebaseUser.displayName || "Admin User",
                            role: "admin",
                        });
                    }
                } catch (error) {
                    console.error("Error fetching admin user:", error);
                    setAdminUser({
                        uid: firebaseUser.uid,
                        email: firebaseUser.email || "",
                        name: "Admin",
                        role: "admin",
                    });
                }
            } else {
                setUser(null);
                setAdminUser(null);

                // Redirect to login if not on login page
                if (pathname !== "/login") {
                    router.push("/login");
                }
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [pathname, router]);

    const signIn = async (email: string, password: string) => {
        try {
            // Use Firebase Authentication
            const result = await signInWithEmailAndPassword(auth, email, password);

            // Check if user is an admin in Firestore
            const adminDoc = await getDoc(doc(db, "admins", result.user.uid));

            if (adminDoc.exists()) {
                // User is in admins collection
                setAdminUser({
                    uid: result.user.uid,
                    email: result.user.email || email,
                    name: adminDoc.data().name || result.user.displayName || "Admin",
                    role: adminDoc.data().role || "admin",
                });
            } else {
                // User authenticated but not in admins collection
                // Check by email as fallback
                const adminByEmailQuery = await getDocs(
                    query(collection(db, "admins"), where("email", "==", email))
                );

                if (!adminByEmailQuery.empty) {
                    const adminData = adminByEmailQuery.docs[0].data();
                    setAdminUser({
                        uid: result.user.uid,
                        email: result.user.email || email,
                        name: adminData.name || "Admin",
                        role: adminData.role || "admin",
                    });
                } else {
                    // Not an admin - sign out and return error
                    await firebaseSignOut(auth);
                    return {
                        success: false,
                        error: "You are not authorized as an admin. Access denied."
                    };
                }
            }

            router.push("/");
            return { success: true };
        } catch (error: any) {
            console.error("Sign in error:", error);
            return {
                success: false,
                error: error.code === "auth/invalid-credential"
                    ? "Invalid email or password"
                    : error.code === "auth/user-not-found"
                        ? "User not found"
                        : error.message
            };
        }
    };

    const signOut = async () => {
        try {
            await firebaseSignOut(auth);
            setUser(null);
            setAdminUser(null);
            router.push("/login");
        } catch (error) {
            console.error("Sign out error:", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, adminUser, loading, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

// Protected route wrapper component
export function ProtectedRoute({ children }: { children: ReactNode }) {
    const { user, adminUser, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading && !user && !adminUser && pathname !== "/login") {
            router.push("/login");
        }
    }, [user, adminUser, loading, pathname, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user && !adminUser && pathname !== "/login") {
        return null;
    }

    return <>{children}</>;
}
