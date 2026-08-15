import React, { useState, useEffect } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import StatCard from "@/components/dashboard/StatCard";
import { Users, Building2, Briefcase, Brain, Activity, BarChart3, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

// Mock user data
const mockUser = {
    id: "admin-1",
    full_name: "Admin User",
    email: "admin@careerai.com",
    role: "admin"
};

// Mock data
const mockUsers = [
    { id: 1, role: "jobseeker" },
    { id: 2, role: "jobseeker" },
    { id: 3, role: "company" },
    { id: 4, role: "jobseeker" },
    { id: 5, role: "admin" },
    // ... more users
];

const mockJobs = [
    { id: 1, status: "active" },
    { id: 2, status: "active" },
    { id: 3, status: "closed" },
    { id: 4, status: "active" },
    { id: 5, status: "draft" },
];

const COLORS = ["#6C63FF", "#10B981", "#F59E0B", "#EF4444"];

const userGrowth = [
    { month: "Sep", users: 120 }, { month: "Oct", users: 250 }, { month: "Nov", users: 420 },
    { month: "Dec", users: 680 }, { month: "Jan", users: 950 }, { month: "Feb", users: 1240 },
];

const roleDistribution = [
    { name: "Job Seekers", value: 850 },
    { name: "Companies", value: 120 },
    { name: "Admins", value: 5 },
];

export default function AdminDashboard() {
    const [user, setUser] = useState(null);
    const [users] = useState(mockUsers);
    const [jobs] = useState(mockJobs);

    useEffect(() => {
        // Simulate API call
        setTimeout(() => setUser(mockUser), 500);
    }, []);

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
        <DashboardShell user={user} title="Admin Dashboard" currentPage="AdminDashboard">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                <StatCard icon={Users} title="Total Users" value={users.length} change={18} color="bg-purple-50" delay={0} />
                <StatCard icon={Building2} title="Companies" value={users.filter(u => u.role === "company").length} change={12} color="bg-blue-50" delay={0.1} />
                <StatCard icon={Briefcase} title="Active Jobs" value={jobs.filter(j => j.status === "active").length} change={25} color="bg-green-50" delay={0.2} />
                <StatCard icon={Brain} title="AI Accuracy" value="94.2%" change={3} color="bg-amber-50" delay={0.3} />
            </div>

            <div className="grid lg:grid-cols-3 gap-6 mb-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6"
                >
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-[#6C63FF]" /> User Growth
                    </h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={userGrowth}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#9CA3AF" }} />
                            <YAxis tick={{ fontSize: 12, fill: "#9CA3AF" }} />
                            <Tooltip />
                            <Area type="monotone" dataKey="users" stroke="#6C63FF" fill="#6C63FF" fillOpacity={0.1} strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-2xl border border-gray-100 p-6"
                >
                    <h3 className="font-bold text-gray-900 mb-4">User Roles</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie
                                data={roleDistribution}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={80}
                                paddingAngle={4}
                                dataKey="value"
                            >
                                {roleDistribution.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-3 justify-center mt-2">
                        {roleDistribution.map((item, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-xs">
                                <div className="w-3 h-3 rounded-sm" style={{ background: COLORS[i] }} />
                                <span className="text-gray-500">{item.name}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* System Health */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-2xl border border-gray-100 p-6"
            >
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-green-500" /> System Health
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: "API Response Time", value: "45ms", status: "healthy" },
                        { label: "AI Model Latency", value: "1.2s", status: "healthy" },
                        { label: "Database Load", value: "23%", status: "healthy" },
                        { label: "Error Rate", value: "0.02%", status: "healthy" },
                    ].map((item, i) => (
                        <div key={i} className="p-4 rounded-xl bg-gray-50">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 rounded-full bg-green-400" />
                                <span className="text-xs text-gray-500">{item.label}</span>
                            </div>
                            <p className="text-lg font-bold text-gray-900">{item.value}</p>
                        </div>
                    ))}
                </div>
            </motion.div>
        </DashboardShell>
    );
}