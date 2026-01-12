"use client";

import { useEffect, useState } from "react";
import { Sidebar, Header } from "@/components/dashboard/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProtectedRoute, useAuth } from "@/lib/auth";
import { doc, getDoc, updateDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
    Settings as SettingsIcon,
    User,
    Bell,
    Shield,
    Truck,
    CreditCard,
    Mail,
    Phone,
    Building2,
    Save,
    RefreshCw,
    CheckCircle,
    Key,
    Eye,
    EyeOff,
} from "lucide-react";

interface CourierConfig {
    name: string;
    apiKey: string;
    enabled: boolean;
    connected: boolean;
}

function SettingsContent() {
    const { adminUser, signOut } = useAuth();
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);
    const [showApiKeys, setShowApiKeys] = useState(false);

    const [companyInfo, setCompanyInfo] = useState({
        name: "ShipMitra",
        email: "support@shipmitra.net",
        phone: "+91 98765 43210",
        address: "Mumbai, Maharashtra, India",
        gstin: "27XXXXX1234X1Z5",
    });

    const [notifications, setNotifications] = useState({
        emailOrders: true,
        emailPayments: true,
        pushOrders: true,
        smsAlerts: false,
        dailyDigest: true,
    });

    const [courierConfigs, setCourierConfigs] = useState<CourierConfig[]>([
        { name: "Delhivery", apiKey: "06454698a16397d06c34cbe86bf0adb2f3d6362a", enabled: true, connected: true },
        { name: "Shiprocket", apiKey: "eyJhbGciOiJIUzI...", enabled: true, connected: true },
        { name: "DTDC", apiKey: "", enabled: false, connected: false },
        { name: "FedEx", apiKey: "l7da648d02f9324d63812aaf3c3763983f", enabled: true, connected: true },
        { name: "BlueDart", apiKey: "", enabled: false, connected: false },
    ]);

    const handleSave = async () => {
        setLoading(true);
        try {
            // Simulate save
            await new Promise((resolve) => setTimeout(resolve, 1000));
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            console.error("Error saving settings:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleCourier = (index: number) => {
        const updated = [...courierConfigs];
        updated[index].enabled = !updated[index].enabled;
        setCourierConfigs(updated);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar />
            <div className="lg:pl-64">
                <Header />
                <main className="p-4 lg:p-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                            <p className="text-sm text-gray-500">Manage your admin panel preferences</p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={handleSave} disabled={loading}>
                                {loading ? (
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                ) : saved ? (
                                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                                ) : (
                                    <Save className="h-4 w-4 mr-2" />
                                )}
                                {saved ? "Saved!" : "Save Changes"}
                            </Button>
                        </div>
                    </div>

                    <div className="grid gap-6">
                        {/* Admin Profile */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <User className="h-5 w-5 text-blue-500" />
                                    <CardTitle>Admin Profile</CardTitle>
                                </div>
                                <CardDescription>Your admin account information</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label>Name</Label>
                                        <Input value={adminUser?.name || "Admin"} disabled className="bg-gray-50" />
                                    </div>
                                    <div>
                                        <Label>Email</Label>
                                        <Input value={adminUser?.email || ""} disabled className="bg-gray-50" />
                                    </div>
                                    <div>
                                        <Label>Role</Label>
                                        <div className="flex items-center gap-2 mt-2">
                                            <Badge className="bg-purple-100 text-purple-700 capitalize">
                                                {adminUser?.role || "admin"}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div>
                                        <Label>Status</Label>
                                        <div className="flex items-center gap-2 mt-2">
                                            <Badge className="bg-green-100 text-green-700">Active</Badge>
                                        </div>
                                    </div>
                                </div>
                                <Button variant="destructive" className="mt-4" onClick={signOut}>
                                    Sign Out
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Company Information */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Building2 className="h-5 w-5 text-green-500" />
                                    <CardTitle>Company Information</CardTitle>
                                </div>
                                <CardDescription>Business details for invoices and reports</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label>Company Name</Label>
                                        <Input
                                            value={companyInfo.name}
                                            onChange={(e) => setCompanyInfo({ ...companyInfo, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label>Email</Label>
                                        <Input
                                            value={companyInfo.email}
                                            onChange={(e) => setCompanyInfo({ ...companyInfo, email: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label>Phone</Label>
                                        <Input
                                            value={companyInfo.phone}
                                            onChange={(e) => setCompanyInfo({ ...companyInfo, phone: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label>GSTIN</Label>
                                        <Input
                                            value={companyInfo.gstin}
                                            onChange={(e) => setCompanyInfo({ ...companyInfo, gstin: e.target.value })}
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <Label>Address</Label>
                                        <Input
                                            value={companyInfo.address}
                                            onChange={(e) => setCompanyInfo({ ...companyInfo, address: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Courier Integrations */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Truck className="h-5 w-5 text-orange-500" />
                                        <CardTitle>Courier Integrations</CardTitle>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowApiKeys(!showApiKeys)}
                                    >
                                        {showApiKeys ? (
                                            <EyeOff className="h-4 w-4 mr-2" />
                                        ) : (
                                            <Eye className="h-4 w-4 mr-2" />
                                        )}
                                        {showApiKeys ? "Hide" : "Show"} Keys
                                    </Button>
                                </div>
                                <CardDescription>Configure courier API connections</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {courierConfigs.map((courier, index) => (
                                        <div
                                            key={courier.name}
                                            className="flex items-center justify-between p-4 border rounded-lg"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div
                                                    className={`w-10 h-10 rounded-full flex items-center justify-center ${courier.connected ? "bg-green-100" : "bg-gray-100"
                                                        }`}
                                                >
                                                    <Truck
                                                        className={`h-5 w-5 ${courier.connected ? "text-green-600" : "text-gray-400"
                                                            }`}
                                                    />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{courier.name}</p>
                                                    <p className="text-sm text-gray-500">
                                                        {showApiKeys && courier.apiKey
                                                            ? courier.apiKey.slice(0, 20) + "..."
                                                            : courier.connected
                                                                ? "API Connected"
                                                                : "Not configured"}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge
                                                    className={
                                                        courier.connected
                                                            ? "bg-green-100 text-green-700"
                                                            : "bg-gray-100 text-gray-500"
                                                    }
                                                >
                                                    {courier.connected ? "Connected" : "Disconnected"}
                                                </Badge>
                                                <Button
                                                    variant={courier.enabled ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => toggleCourier(index)}
                                                >
                                                    {courier.enabled ? "Enabled" : "Disabled"}
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Notifications */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Bell className="h-5 w-5 text-purple-500" />
                                    <CardTitle>Notifications</CardTitle>
                                </div>
                                <CardDescription>Configure how you receive alerts</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {[
                                        { key: "emailOrders", label: "Email notifications for new orders", icon: Mail },
                                        { key: "emailPayments", label: "Email notifications for payments", icon: CreditCard },
                                        { key: "pushOrders", label: "Push notifications for orders", icon: Bell },
                                        { key: "smsAlerts", label: "SMS alerts for critical updates", icon: Phone },
                                        { key: "dailyDigest", label: "Daily summary email", icon: Mail },
                                    ].map((item) => (
                                        <div
                                            key={item.key}
                                            className="flex items-center justify-between p-3 border rounded-lg"
                                        >
                                            <div className="flex items-center gap-3">
                                                <item.icon className="h-5 w-5 text-gray-400" />
                                                <span>{item.label}</span>
                                            </div>
                                            <Button
                                                variant={notifications[item.key as keyof typeof notifications] ? "default" : "outline"}
                                                size="sm"
                                                onClick={() =>
                                                    setNotifications({
                                                        ...notifications,
                                                        [item.key]: !notifications[item.key as keyof typeof notifications],
                                                    })
                                                }
                                            >
                                                {notifications[item.key as keyof typeof notifications] ? "On" : "Off"}
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Security */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Shield className="h-5 w-5 text-red-500" />
                                    <CardTitle>Security</CardTitle>
                                </div>
                                <CardDescription>Security and access settings</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <Key className="h-5 w-5 text-gray-400" />
                                            <div>
                                                <p className="font-medium">Change Password</p>
                                                <p className="text-sm text-gray-500">Update your admin password</p>
                                            </div>
                                        </div>
                                        <Button variant="outline" size="sm">
                                            Change
                                        </Button>
                                    </div>
                                    <div className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <Shield className="h-5 w-5 text-gray-400" />
                                            <div>
                                                <p className="font-medium">Two-Factor Authentication</p>
                                                <p className="text-sm text-gray-500">Add extra security to your account</p>
                                            </div>
                                        </div>
                                        <Button variant="outline" size="sm">
                                            Enable
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default function SettingsPage() {
    return (
        <ProtectedRoute>
            <SettingsContent />
        </ProtectedRoute>
    );
}
