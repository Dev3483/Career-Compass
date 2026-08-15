import React, { useState, useEffect } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { motion } from "framer-motion";
import { Brain, Activity, CheckCircle, AlertTriangle, Zap, BarChart3 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";

// Mock user data
const mockUser = {
    id: "admin-1",
    full_name: "Admin User",
    email: "admin@careerai.com",
    role: "admin"
};

const accuracyHistory = [
    { week: "W1", accuracy: 88 }, { week: "W2", accuracy: 90 }, { week: "W3", accuracy: 91 },
    { week: "W4", accuracy: 89 }, { week: "W5", accuracy: 93 }, { week: "W6", accuracy: 94 },
];

const modelMetrics = [
    { subject: "Precision", A: 94 },
    { subject: "Recall", A: 91 },
    { subject: "F1 Score", A: 92 },
    { subject: "AUC-ROC", A: 96 },
    { subject: "Accuracy", A: 94 },
];

export default function AdminAI() {
    const [user, setUser] = useState(null);

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
        <DashboardShell user={user} title="AI Model Performance" currentPage="AdminAI">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                {[
                    { icon: Brain, label: "Job Matching", value: "94.2%", status: "healthy" },
                    { icon: Zap, label: "Resume Parser", value: "91.8%", status: "healthy" },
                    { icon: Activity, label: "Salary Model", value: "88.5%", status: "warning" },
                    { icon: BarChart3, label: "Interview AI", value: "92.1%", status: "healthy" },
                ].map((model, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white rounded-2xl border border-gray-100 p-6"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <model.icon className="w-5 h-5 text-[#6C63FF]" />
                            <div className={`w-2 h-2 rounded-full ${model.status === "healthy" ? "bg-green-400" : "bg-amber-400"}`} />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{model.value}</p>
                        <p className="text-sm text-gray-500">{model.label}</p>
                    </motion.div>
                ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6 mb-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-2xl border border-gray-100 p-6"
                >
                    <h3 className="font-bold text-gray-900 mb-4">Accuracy Over Time</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={accuracyHistory}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                            <XAxis dataKey="week" tick={{ fontSize: 12, fill: "#9CA3AF" }} />
                            <YAxis domain={[85, 100]} tick={{ fontSize: 12, fill: "#9CA3AF" }} />
                            <Tooltip />
                            <Line type="monotone" dataKey="accuracy" stroke="#6C63FF" strokeWidth={3} dot={{ fill: "#6C63FF", r: 5 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-2xl border border-gray-100 p-6"
                >
                    <h3 className="font-bold text-gray-900 mb-4">Model Evaluation Metrics</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <RadarChart data={modelMetrics}>
                            <PolarGrid stroke="#E5E7EB" />
                            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "#6B7280" }} />
                            <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                            <Radar name="Model" dataKey="A" stroke="#6C63FF" fill="#6C63FF" fillOpacity={0.15} strokeWidth={2} />
                        </RadarChart>
                    </ResponsiveContainer>
                </motion.div>
            </div>

            {/* Bias Detection */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-2xl border border-gray-100 p-6"
            >
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500" /> Bias Detection Report
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                        { label: "Gender Bias", score: 2.1, status: "low" },
                        { label: "Age Bias", score: 3.4, status: "low" },
                        { label: "Location Bias", score: 5.2, status: "moderate" },
                        { label: "Education Bias", score: 4.1, status: "low" },
                        { label: "Experience Bias", score: 6.8, status: "moderate" },
                        { label: "Name Bias", score: 1.2, status: "low" },
                    ].map((item, i) => (
                        <div key={i} className="p-4 rounded-xl bg-gray-50">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">{item.label}</span>
                                <Badge
                                    className={`rounded-lg text-xs ${item.status === "low"
                                            ? "bg-green-100 text-green-700"
                                            : "bg-amber-100 text-amber-700"
                                        }`}
                                >
                                    {item.status}
                                </Badge>
                            </div>
                            <Progress value={item.score * 10} className="h-2" />
                            <p className="text-xs text-gray-500 mt-1">Score: {item.score}/10</p>
                        </div>
                    ))}
                </div>
            </motion.div>
        </DashboardShell>
    );
}