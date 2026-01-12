"use client";

import { useState } from "react";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2, Shield } from "lucide-react";

export default function SetupPage() {
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error" | "exists">("idle");
    const [message, setMessage] = useState("");

    const addAdminUser = async () => {
        setStatus("loading");
        setMessage("Adding admin user...");

        try {
            // Check if admin already exists
            const existingAdmin = await getDocs(
                query(collection(db, "admins"), where("email", "==", "het7660@gmail.com"))
            );

            if (!existingAdmin.empty) {
                setStatus("exists");
                setMessage("Admin user already exists in the database!");
                return;
            }

            // Add admin document
            await addDoc(collection(db, "admins"), {
                email: "het7660@gmail.com",
                name: "Het Patel",
                role: "super_admin",
                createdAt: new Date(),
                permissions: ["orders", "riders", "customers", "analytics", "settings", "reports", "banking", "gst"]
            });

            setStatus("success");
            setMessage("Admin user added successfully! You can now login.");
        } catch (error: any) {
            console.error("Error adding admin:", error);
            setStatus("error");
            setMessage(`Error: ${error.message}`);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <Shield className="h-6 w-6 text-blue-600" />
                    </div>
                    <CardTitle>Admin Setup</CardTitle>
                    <CardDescription>
                        Add the admin user to enable login for the admin panel
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-sm text-gray-700 mb-2">Admin Details:</h4>
                        <div className="space-y-1 text-sm">
                            <p><span className="text-gray-500">Email:</span> <span className="font-mono">het7660@gmail.com</span></p>
                            <p><span className="text-gray-500">Name:</span> Het Patel</p>
                            <p><span className="text-gray-500">Role:</span> super_admin</p>
                        </div>
                    </div>

                    {status === "idle" && (
                        <Button onClick={addAdminUser} className="w-full">
                            Add Admin to Database
                        </Button>
                    )}

                    {status === "loading" && (
                        <div className="flex items-center justify-center gap-2 text-blue-600">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>{message}</span>
                        </div>
                    )}

                    {status === "success" && (
                        <div className="flex items-center justify-center gap-2 text-green-600">
                            <CheckCircle className="h-5 w-5" />
                            <span>{message}</span>
                        </div>
                    )}

                    {status === "exists" && (
                        <div className="flex items-center justify-center gap-2 text-yellow-600">
                            <CheckCircle className="h-5 w-5" />
                            <span>{message}</span>
                        </div>
                    )}

                    {status === "error" && (
                        <div className="flex items-center justify-center gap-2 text-red-600">
                            <XCircle className="h-5 w-5" />
                            <span>{message}</span>
                        </div>
                    )}

                    {(status === "success" || status === "exists") && (
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => window.location.href = "/login"}
                        >
                            Go to Login
                        </Button>
                    )}

                    {status === "error" && (
                        <Button onClick={addAdminUser} variant="outline" className="w-full">
                            Try Again
                        </Button>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
