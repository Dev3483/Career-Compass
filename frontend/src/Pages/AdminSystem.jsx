import React, { useState, useEffect } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { motion } from "framer-motion";
import { Shield, Activity, Server, Database, Clock } from "lucide-react";
import { Switch } from "@/components/ui/switch";

// Mock user data
const mockUser = {
    id: "admin-1",
    full_name: "Admin User",
    email: "admin@careerai.com",
    role: "admin"
};

const features = [
    { id: "ai_matching", label: "AI Job Matching", desc: "Enable AI-powered job matching algorithm", enabled: true },
    { id: "resume_parse", label: "Resume Parser", desc: "Auto-parse uploaded resumes with AI", enabled: true },
    { id: "salary_predict", label: "Salary Prediction", desc: "ML-powered salary estimation", enabled: true },
    { id: "interview_ai", label: "Interview AI Coach", desc: "AI mock interview system", enabled: true },
    { id: "chatbot", label: "Career Chatbot", desc: "AI career advice chatbot", enabled: true },
    { id: "bias_detect", label: "Bias Detection", desc: "Run bias detection on AI outputs", enabled: false },
];

const logs = [
    { time: "2 min ago", type: "info", message: "Job matching model updated to v2.4" },
    { time: "15 min ago", type: "success", message: "Resume parser batch completed (42 resumes)" },
    { time: "1 hour ago", type: "warning", message: "Salary model response time above threshold" },
    { time: "3 hours ago", type: "info", message: "System backup completed successfully" },
    { time: "5 hours ago", type: "success", message: "AI model retrained with new dataset" },
];

const typeColors = {
    info: "bg-blue-100 text-blue-700",
    success: "bg-green-100 text-green-700",
    warning: "bg-amber-100 text-amber-700",
    error: "bg-red-100 text-red-700",
};

export default function AdminSystem() {
    const [user, setUser] = useState(null);
    const [featureStates, setFeatureStates] = useState(
        Object.fromEntries(features.map(f => [f.id, f.enabled]))
    );

    useEffect(() => {
        // Simulate API call
        setTimeout(() => setUser(mockUser), 500);
    }, []);

    const toggleFeature = (id) => {
        setFeatureStates(prev => ({ ...prev, [id]: !prev[id] }));
    };

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
        <DashboardShell user={user} title="System Settings" currentPage="AdminSystem">
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Feature Toggles */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl border border-gray-100 p-6"
                >
                    <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-[#6C63FF]" /> Feature Toggles
                    </h3>
                    <div className="space-y-4">
                        {features.map((feature) => (
                            <div key={feature.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{feature.label}</p>
                                    <p className="text-xs text-gray-500">{feature.desc}</p>
                                </div>
                                <Switch
                                    checked={featureStates[feature.id]}
                                    onCheckedChange={() => toggleFeature(feature.id)}
                                />
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* System Logs */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-2xl border border-gray-100 p-6"
                >
                    <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-[#6C63FF]" /> System Logs
                    </h3>
                    <div className="space-y-3">
                        {logs.map((log, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 + i * 0.1 }}
                                className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                            >
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${typeColors[log.type]}`}>
                                    {log.type}
                                </span>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-700">{log.message}</p>
                                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                        <Clock className="w-3 h-3" /> {log.time}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Infrastructure */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-6 bg-white rounded-2xl border border-gray-100 p-6"
            >
                <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
                    <Server className="w-5 h-5 text-[#6C63FF]" /> Infrastructure
                </h3>
                <div className="grid sm:grid-cols-3 gap-4">
                    {[
                        { icon: Server, label: "API Server", status: "Running", uptime: "99.99%" },
                        { icon: Database, label: "Database", status: "Healthy", uptime: "99.97%" },
                        { icon: Activity, label: "AI Workers", status: "Active (3/3)", uptime: "99.95%" },
                    ].map((item, i) => (
                        <div key={i} className="p-4 rounded-xl bg-gray-50 text-center">
                            <item.icon className="w-8 h-8 text-[#6C63FF] mx-auto mb-2" />
                            <p className="font-bold text-gray-900 text-sm">{item.label}</p>
                            <div className="flex items-center justify-center gap-1.5 mt-1">
                                <div className="w-2 h-2 rounded-full bg-green-400" />
                                <span className="text-xs text-gray-500">{item.status}</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">Uptime: {item.uptime}</p>
                        </div>
                    ))}
                </div>
            </motion.div>
        </DashboardShell>
    );
}