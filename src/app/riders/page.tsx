"use client";

import { useEffect, useState } from "react";
import { Sidebar, Header } from "@/components/dashboard/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProtectedRoute } from "@/lib/auth";
import { getRiders, deleteRider, updateRider } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";
import { Rider } from "@/types";
import { RiderModal } from "@/components/riders";
import {
    Search,
    Plus,
    Phone,
    Star,
    Package,
    IndianRupee,
    RefreshCw,
    MoreVertical,
    Pencil,
    Trash2,
    UserCheck,
    UserX,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function RidersContent() {
    const [riders, setRiders] = useState<Rider[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editRider, setEditRider] = useState<Rider | null>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [riderToDelete, setRiderToDelete] = useState<Rider | null>(null);

    useEffect(() => {
        loadRiders();
    }, []);

    const loadRiders = async () => {
        setLoading(true);
        try {
            const data = await getRiders();
            setRiders(data);
        } catch (error) {
            console.error("Error loading riders:", error);
        } finally {
            setLoading(false);
        }
    };

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

    const handleAddRider = () => {
        setEditRider(null);
        setIsModalOpen(true);
    };

    const handleEditRider = (rider: Rider) => {
        setEditRider(rider);
        setIsModalOpen(true);
    };

    const handleDeleteClick = (rider: Rider) => {
        setRiderToDelete(rider);
        setDeleteConfirmOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (riderToDelete) {
            const success = await deleteRider(riderToDelete.id);
            if (success) {
                await loadRiders();
            }
        }
        setDeleteConfirmOpen(false);
        setRiderToDelete(null);
    };

    const handleToggleActive = async (rider: Rider) => {
        const success = await updateRider(rider.id, { isActive: !rider.isActive });
        if (success) {
            await loadRiders();
        }
    };

    const handleModalClose = (open: boolean) => {
        setIsModalOpen(open);
        if (!open) {
            setEditRider(null);
        }
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
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={loadRiders}>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Refresh
                            </Button>
                            <Button className="gap-2" onClick={handleAddRider}>
                                <Plus className="h-4 w-4" />
                                Add Rider
                            </Button>
                        </div>
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
                    ) : filteredRiders.length === 0 ? (
                        <Card>
                            <CardContent className="p-12 text-center">
                                <div className="text-gray-400 mb-4">
                                    <Package className="h-12 w-12 mx-auto" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">No riders found</h3>
                                <p className="text-gray-500 mb-4">
                                    {searchQuery ? "Try a different search term" : "Get started by adding your first rider"}
                                </p>
                                {!searchQuery && (
                                    <Button onClick={handleAddRider}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Rider
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
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
                                            <div className="flex items-center gap-2">
                                                <Badge variant={rider.isActive ? "success" : "secondary"}>
                                                    {rider.isActive ? "Active" : "Offline"}
                                                </Badge>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleEditRider(rider)}>
                                                            <Pencil className="h-4 w-4 mr-2" />
                                                            Edit Rider
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleToggleActive(rider)}>
                                                            {rider.isActive ? (
                                                                <>
                                                                    <UserX className="h-4 w-4 mr-2" />
                                                                    Set Offline
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <UserCheck className="h-4 w-4 mr-2" />
                                                                    Set Active
                                                                </>
                                                            )}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => handleDeleteClick(rider)}
                                                            className="text-red-600"
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Delete Rider
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                                            <Phone className="h-4 w-4" />
                                            {rider.phone}
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 mb-4">
                                            <div className="text-center p-2 bg-gray-50 rounded">
                                                <Package className="h-4 w-4 mx-auto text-blue-600" />
                                                <p className="text-lg font-bold">{rider.completedPickups || 0}</p>
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
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1"
                                                onClick={() => handleEditRider(rider)}
                                            >
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

                {/* Add/Edit Rider Modal */}
                <RiderModal
                    open={isModalOpen}
                    onOpenChange={handleModalClose}
                    onRiderSaved={loadRiders}
                    editRider={editRider}
                />

                {/* Delete Confirmation Dialog */}
                <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete Rider</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to delete {riderToDelete?.name}? This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
}

export default function RidersPage() {
    return (
        <ProtectedRoute>
            <RidersContent />
        </ProtectedRoute>
    );
}
