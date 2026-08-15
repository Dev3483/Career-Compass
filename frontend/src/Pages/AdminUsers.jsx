import React, { useState, useEffect } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { motion } from "framer-motion";
import { Users, Search, Mail, Calendar, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

// Mock user data for the logged-in admin
const mockAdminUser = {
    id: "admin-1",
    full_name: "Admin User",
    email: "admin@careerai.com",
    role: "admin",
    created_date: new Date().toISOString(),
    approved: true
};

// Mock users data
const mockUsers = [
    {
        id: "user-1",
        full_name: "John Doe",
        email: "john.doe@example.com",
        role: "job_seeker",
        created_date: "2025-01-15T10:30:00Z",
        approved: true
    },
    {
        id: "user-2",
        full_name: "Jane Smith",
        email: "jane.smith@example.com",
        role: "job_seeker",
        created_date: "2025-01-20T14:45:00Z",
        approved: true
    },
    {
        id: "user-3",
        full_name: "Robert Johnson",
        email: "robert.j@company.com",
        role: "company",
        created_date: "2025-01-18T09:15:00Z",
        approved: true
    },
    {
        id: "user-4",
        full_name: "Emily Davis",
        email: "emily.davis@example.com",
        role: "job_seeker",
        created_date: "2025-01-22T11:20:00Z",
        approved: false
    },
    {
        id: "user-5",
        full_name: "Michael Chen",
        email: "michael.chen@tech.com",
        role: "company",
        created_date: "2025-01-10T16:30:00Z",
        approved: true
    },
    {
        id: "user-6",
        full_name: "Sarah Wilson",
        email: "sarah.wilson@example.com",
        role: "job_seeker",
        created_date: "2025-01-25T13:40:00Z",
        approved: true
    },
    {
        id: "user-7",
        full_name: "David Brown",
        email: "david.brown@admin.com",
        role: "admin",
        created_date: "2025-01-05T08:00:00Z",
        approved: true
    },
];

const roleBadge = {
    admin: "bg-red-100 text-red-700",
    job_seeker: "bg-blue-100 text-blue-700",
    company: "bg-purple-100 text-purple-700",
};

export default function AdminUsers() {
    const [user, setUser] = useState(null);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Simulate API calls
        const timer1 = setTimeout(() => {
            setUser(mockAdminUser);
        }, 500);

        const timer2 = setTimeout(() => {
            setUsers(mockUsers);
            setIsLoading(false);
        }, 800);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, []);

    const filtered = users.filter(u => {
        const matchSearch = !search ||
            u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
            u.email?.toLowerCase().includes(search.toLowerCase());
        const matchRole = roleFilter === "all" || u.role === roleFilter;
        return matchSearch && matchRole;
    });

    if (!user) return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
            <div className="flex gap-1">
                <div className="w-3 h-3 rounded-full bg-[#6C63FF] pulse-dot" />
                <div className="w-3 h-3 rounded-full bg-[#6C63FF] pulse-dot" style={{ animationDelay: "0.2s" }} />
                <div className="w-3 h-3 rounded-full bg-[#6C63FF] pulse-dot" style={{ animationDelay: "0.4s" }} />
            </div>
        </div>
    );

    return (
        <DashboardShell user={user} title="User Management" currentPage="AdminUsers">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row gap-3 mb-6"
            >
                <div className="flex items-center gap-2 flex-1 bg-white rounded-xl px-3 border border-gray-100">
                    <Search className="w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="border-0 bg-transparent shadow-none focus-visible:ring-0"
                    />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-full sm:w-40 rounded-xl bg-white">
                        <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="job_seeker">Job Seeker</SelectItem>
                        <SelectItem value="company">Company</SelectItem>
                    </SelectContent>
                </Select>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
            >
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50">
                            <TableHead>User</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.map((u, i) => (
                            <TableRow key={u.id} className="hover:bg-gray-50">
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-[#6C63FF] flex items-center justify-center text-white text-xs font-bold">
                                            {u.full_name?.[0] || u.email?.[0] || "U"}
                                        </div>
                                        <span className="font-medium text-gray-900">{u.full_name || "—"}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-sm text-gray-500">{u.email}</TableCell>
                                <TableCell>
                                    <Badge className={`rounded-lg text-xs ${roleBadge[u.role] || roleBadge.job_seeker}`}>
                                        {u.role || "job_seeker"}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-sm text-gray-500">
                                    {u.created_date ? format(new Date(u.created_date), "MMM d, yyyy") : "—"}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1.5">
                                        <div className={`w-2 h-2 rounded-full ${u.approved !== false ? "bg-green-400" : "bg-red-400"}`} />
                                        <span className="text-xs text-gray-500">{u.approved !== false ? "Active" : "Pending"}</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                {filtered.length === 0 && !isLoading && (
                    <div className="text-center py-12">
                        <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm">No users found</p>
                    </div>
                )}
                {isLoading && (
                    <div className="text-center py-12">
                        <div className="flex justify-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-gray-400 pulse-dot" />
                            <div className="w-2 h-2 rounded-full bg-gray-400 pulse-dot" style={{ animationDelay: "0.2s" }} />
                            <div className="w-2 h-2 rounded-full bg-gray-400 pulse-dot" style={{ animationDelay: "0.4s" }} />
                        </div>
                        <p className="text-gray-500 text-sm mt-2">Loading users...</p>
                    </div>
                )}
            </motion.div>
        </DashboardShell>
    );
}