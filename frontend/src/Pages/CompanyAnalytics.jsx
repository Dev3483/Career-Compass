import React, { useState, useEffect } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Users, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from "recharts";

// Mock user data
const mockUser = {
    id: "company-1",
    full_name: "John Smith",
    email: "john@techcorp.com",
    role: "company",
    company_name: "TechCorp Inc."
};

const COLORS = ["#6C63FF", "#8B7CFF", "#10B981", "#F59E0B", "#EF4444", "#3B82F6"];

const funnelData = [
    { stage: "Applied", count: 245 },
    { stage: "Screened", count: 180 },
    { stage: "Interview", count: 85 },
    { stage: "Offered", count: 32 },
    { stage: "Hired", count: 18 },
];

const skillDemand = [
    { skill: "React", demand: 85 },
    { skill: "Python", demand: 78 },
    { skill: "TypeScript", demand: 72 },
    { skill: "AWS", demand: 65 },
    { skill: "Node.js", demand: 60 },
    { skill: "Docker", demand: 55 },
];

const monthlyHires = [
    { month: "Jan", hires: 3 },
    { month: "Feb", hires: 5 },
    { month: "Mar", hires: 4 },
    { month: "Apr", hires: 7 },
    { month: "May", hires: 6 },
    { month: "Jun", hires: 8 },
];

export default function CompanyAnalytics() {
    const [user, setUser] = useState(null);

    useEffect(() => {
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
        <DashboardShell user={user} title="Analytics" currentPage="CompanyAnalytics">
            <div className="grid lg:grid-cols-2 gap-6 mb-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl border border-gray-100 p-6"
                >
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-[#6C63FF]" /> Hiring Funnel
                    </h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={funnelData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                            <XAxis dataKey="stage" tick={{ fontSize: 12, fill: "#9CA3AF" }} />
                            <YAxis tick={{ fontSize: 12, fill: "#9CA3AF" }} />
                            <Tooltip />
                            <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                                {funnelData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-2xl border border-gray-100 p-6"
                >
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-[#6C63FF]" /> Skill Demand
                    </h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={skillDemand} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                            <XAxis type="number" tick={{ fontSize: 12, fill: "#9CA3AF" }} />
                            <YAxis dataKey="skill" type="category" tick={{ fontSize: 12, fill: "#9CA3AF" }} width={80} />
                            <Tooltip />
                            <Bar dataKey="demand" fill="#6C63FF" radius={[0, 8, 8, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl border border-gray-100 p-6 mb-6"
            >
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#6C63FF]" /> Monthly Hires
                </h3>
                <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={monthlyHires}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                        <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#9CA3AF" }} />
                        <YAxis tick={{ fontSize: 12, fill: "#9CA3AF" }} />
                        <Tooltip />
                        <Area type="monotone" dataKey="hires" stroke="#6C63FF" fill="#6C63FF" fillOpacity={0.1} strokeWidth={2} />
                    </AreaChart>
                </ResponsiveContainer>
            </motion.div>

            <div className="grid sm:grid-cols-3 gap-5">
                {[
                    { label: "Avg. Time to Hire", value: "14 days", icon: Clock, color: "text-blue-500" },
                    { label: "Offer Acceptance Rate", value: "78%", icon: TrendingUp, color: "text-green-500" },
                    { label: "AI Accuracy", value: "94%", icon: BarChart3, color: "text-purple-500" },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                        className="bg-white rounded-2xl border border-gray-100 p-6 text-center"
                    >
                        <stat.icon className={`w-8 h-8 mx-auto mb-2 ${stat.color}`} />
                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                        <p className="text-sm text-gray-500">{stat.label}</p>
                    </motion.div>
                ))}
            </div>
        </DashboardShell>
    );
}