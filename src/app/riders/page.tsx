"use client";

import { useEffect, useState } from "react";
import { Sidebar, Header } from "@/components/dashboard/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProtectedRoute } from "@/lib/auth";
import { getRiders, addRider, updateRider } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";
import { Rider } from "@/types";
import {
    Search,
    Plus,
    Phone,
    MapPin,
    Star,
    Package,
    IndianRupee,
    Bike,
    Filter,
    MoreVertical,
} from "lucide-react";

function RidersContent() {
    const [riders, setRiders] = useState<Rider[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRiders = async () => {
            const data = await getRiders();
            setRiders(data.length > 0 ? data : mockRiders);
            setLoading(false);
        };
        fetchRiders();
    }, []);

    const filteredRiders = riders.filter((rider) => {
        const matchesSearch = rider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            rider.phone.includes(searchQuery);
        const matchesStatus = statusFilter === "all" ||
            (statusFilter === "active" && rider.isActive) ||
            (statusFilter === "inactive" && !rider.isActive);
        return matchesSearch && matchesStatus;
    });

    const stats = {
        total: riders.length,
        active: riders.filter((r) => r.isActive).length,
        totalEarnings: riders.reduce((sum, r) => sum + (r.earnings || 0), 0),
        totalPickups: riders.reduce((sum, r) => sum + (r.completedPickups || 0), 0),
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <Sidebar />

            <div className="lg:pl-64">
                <Header />

                <main className="p-6 lg:p-8">
                    {/* Page header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Riders Management</h1>
                            <p className="text-gray-500 mt-1">Manage pickup riders and payouts</p>
                        </div>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Add Rider
                        </Button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <Card>
                            <CardContent className="p-4">
                                <p className="text-sm text-gray-500">Total Riders</p>
                                <p className="text-2xl font-bold">{stats.total}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <p className="text-sm text-gray-500">Active Now</p>
                                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <p className="text-sm text-gray-500">Total Pickups</p>
                                <p className="text-2xl font-bold">{stats.totalPickups}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <p className="text-sm text-gray-500">Total Earnings</p>
                                <p className="text-2xl font-bold">{formatCurrency(stats.totalEarnings)}</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Filters */}
                    <Card className="mb-6">
                        <CardContent className="p-4">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Search riders..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    {(["all", "active", "inactive"] as const).map((status) => (
                                        <Button
                                            key={status}
                                            variant={statusFilter === status ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setStatusFilter(status)}
                                        >
                                            {status.charAt(0).toUpperCase() + status.slice(1)}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Riders Grid */}
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map((i) => (
                                <Card key={i} className="animate-pulse">
                                    <CardContent className="p-6">
                                        <div className="h-20 bg-gray-200 rounded"></div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredRiders.map((rider) => (
                                <Card key={rider.id} className="hover:shadow-lg transition-shadow">
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${rider.isActive ? "bg-green-600" : "bg-gray-400"
                                                    }`}>
                                                    {rider.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold">{rider.name}</h3>
                                                    <p className="text-sm text-gray-500">{rider.vehicleType}</p>
                                                </div>
                                            </div>
                                            <Badge variant={rider.isActive ? "success" : "secondary"}>
                                                {rider.isActive ? "Active" : "Offline"}
                                            </Badge>
                                        </div>

                                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                                            <Phone className="h-4 w-4" />
                                            {rider.phone}
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 mb-4">
                                            <div className="text-center p-2 bg-gray-50 rounded">
                                                <Package className="h-4 w-4 mx-auto text-blue-600" />
                                                <p className="text-lg font-bold">{rider.completedPickups}</p>
                                                <p className="text-xs text-gray-500">Pickups</p>
                                            </div>
                                            <div className="text-center p-2 bg-gray-50 rounded">
                                                <Star className="h-4 w-4 mx-auto text-yellow-500" />
                                                <p className="text-lg font-bold">{rider.rating?.toFixed(1) || "5.0"}</p>
                                                <p className="text-xs text-gray-500">Rating</p>
                                            </div>
                                            <div className="text-center p-2 bg-gray-50 rounded">
                                                <IndianRupee className="h-4 w-4 mx-auto text-green-600" />
                                                <p className="text-lg font-bold">{rider.payoutDue || 0}</p>
                                                <p className="text-xs text-gray-500">Due</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" className="flex-1">
                                                View Profile
                                            </Button>
                                            {(rider.payoutDue || 0) > 0 && (
                                                <Button size="sm" className="flex-1">
                                                    Pay {formatCurrency(rider.payoutDue || 0)}
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

// Mock data fallback
const mockRiders: Rider[] = [
    { id: "RIDER001", name: "Mahesh Kumar", phone: "9876543001", vehicleType: "Bike", isActive: true, assignedOrders: [], completedPickups: 145, rating: 4.8, earnings: 28500, payoutDue: 4200, createdAt: new Date() },
    { id: "RIDER002", name: "Suresh Patel", phone: "9876543002", vehicleType: "Bike", isActive: true, assignedOrders: [], completedPickups: 98, rating: 4.5, earnings: 18200, payoutDue: 2800, createdAt: new Date() },
    { id: "RIDER003", name: "Rajesh Shah", phone: "9876543003", vehicleType: "Auto", isActive: false, assignedOrders: [], completedPickups: 210, rating: 4.9, earnings: 42000, payoutDue: 0, createdAt: new Date() },
];

export default function RidersPage() {
    return (
        <ProtectedRoute>
            <RidersContent />
        </ProtectedRoute>
    );
}
