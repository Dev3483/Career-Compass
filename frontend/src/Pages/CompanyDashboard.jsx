import React, { useState, useEffect } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import StatCard from "@/components/dashboard/StatCard";
import { Briefcase, Users, TrendingUp, Clock, ArrowRight, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

// Mock user data
const mockUser = {
    id: "company-1",
    full_name: "John Smith",
    email: "john@techcorp.com",
    role: "company",
    company_name: "TechCorp Inc."
};

// Mock jobs data
const mockJobs = [
    { id: "job-1", title: "Senior React Developer", status: "active", posted_by: "john@techcorp.com" },
    { id: "job-2", title: "Python Backend Engineer", status: "active", posted_by: "john@techcorp.com" },
    { id: "job-3", title: "DevOps Engineer", status: "active", posted_by: "john@techcorp.com" },
    { id: "job-4", title: "Product Manager", status: "draft", posted_by: "john@techcorp.com" },
];

// Mock applications data
const mockApplications = [
    { id: "app-1", job_id: "job-1", applicant_name: "Alice Johnson", applicant_email: "alice@example.com", status: "pending", ai_match_score: 92 },
    { id: "app-2", job_id: "job-1", applicant_name: "Bob Williams", applicant_email: "bob@example.com", status: "reviewed", ai_match_score: 87 },
    { id: "app-3", job_id: "job-2", applicant_name: "Carol Davis", applicant_email: "carol@example.com", status: "shortlisted", ai_match_score: 78 },
    { id: "app-4", job_id: "job-2", applicant_name: "David Miller", applicant_email: "david@example.com", status: "interview", ai_match_score: 88 },
    { id: "app-5", job_id: "job-3", applicant_name: "Eva Brown", applicant_email: "eva@example.com", status: "pending", ai_match_score: 91 },
    { id: "app-6", job_id: "job-3", applicant_name: "Frank Wilson", applicant_email: "frank@example.com", status: "reviewed", ai_match_score: 65 },
];

const COLORS = ["#6C63FF", "#8B7CFF", "#A5A0FF", "#C4C1FF", "#E0DEFF"];

export default function CompanyDashboard() {
    const [user, setUser] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [applications, setApplications] = useState([]);

    useEffect(() => {
        // Simulate API calls
        setTimeout(() => setUser(mockUser), 500);
        setTimeout(() => setJobs(mockJobs), 800);
        setTimeout(() => setApplications(mockApplications), 1000);
    }, []);

    const jobIds = new Set(jobs.map(j => j.id));
    const myApps = applications.filter(a => jobIds.has(a.job_id));

    const statusData = [
        { name: "Pending", value: myApps.filter(a => a.status === "pending").length || 2 },
        { name: "Reviewed", value: myApps.filter(a => a.status === "reviewed").length || 2 },
        { name: "Shortlisted", value: myApps.filter(a => a.status === "shortlisted").length || 1 },
        { name: "Interview", value: myApps.filter(a => a.status === "interview").length || 1 },
    ];

    const weeklyData = [
        { day: "Mon", apps: 12 }, { day: "Tue", apps: 19 }, { day: "Wed", apps: 15 },
        { day: "Thu", apps: 22 }, { day: "Fri", apps: 18 }, { day: "Sat", apps: 8 }, { day: "Sun", apps: 5 },
    ];

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
        <DashboardShell user={user} title="Company Dashboard" currentPage="CompanyDashboard">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                <StatCard
                    icon={Briefcase}
                    title="Active Jobs"
                    value={jobs.filter(j => j.status === "active").length}
                    change={15}
                    color="bg-purple-50"
                    delay={0}
                />
                <StatCard
                    icon={Users}
                    title="Total Applicants"
                    value={myApps.length}
                    change={23}
                    color="bg-blue-50"
                    delay={0.1}
                />
                <StatCard
                    icon={Eye}
                    title="Views This Week"
                    value="1.2K"
                    change={8}
                    color="bg-green-50"
                    delay={0.2}
                />
                <StatCard
                    icon={Clock}
                    title="Avg. Time to Hire"
                    value="14 days"
                    change={-5}
                    color="bg-amber-50"
                    delay={0.3}
                />
            </div>

            <div className="grid lg:grid-cols-2 gap-6 mb-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-2xl border border-gray-100 p-6"
                >
                    <h3 className="font-bold text-gray-900 mb-4">Application Pipeline</h3>
                    <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                            <Pie
                                data={statusData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={90}
                                paddingAngle={4}
                                dataKey="value"
                            >
                                {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-3 justify-center">
                        {statusData.map((item, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-xs">
                                <div className="w-3 h-3 rounded-sm" style={{ background: COLORS[i] }} />
                                <span className="text-gray-500">{item.name}: {item.value}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-2xl border border-gray-100 p-6"
                >
                    <h3 className="font-bold text-gray-900 mb-4">Weekly Applications</h3>
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={weeklyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                            <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#9CA3AF" }} />
                            <YAxis tick={{ fontSize: 12, fill: "#9CA3AF" }} />
                            <Tooltip />
                            <Bar dataKey="apps" fill="#6C63FF" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-2xl border border-gray-100 p-6"
            >
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900">Recent Applications</h3>
                    <Link
                        to={createPageUrl("Candidates")}
                        className="text-sm text-[#6C63FF] font-medium hover:underline flex items-center gap-1"
                    >
                        View All <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
                {myApps.length === 0 ? (
                    <p className="text-gray-400 text-sm py-8 text-center">
                        No applications yet. Post a job to start receiving applications.
                    </p>
                ) : (
                    <div className="space-y-3">
                        {myApps.slice(0, 5).map((app, i) => (
                            <div
                                key={app.id}
                                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-[#6C63FF] flex items-center justify-center text-white text-xs font-bold">
                                        {app.applicant_name?.[0] || app.applicant_email?.[0] || "A"}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            {app.applicant_name || app.applicant_email}
                                        </p>
                                        <p className="text-xs text-gray-500 capitalize">{app.status}</p>
                                    </div>
                                </div>
                                {app.ai_match_score && (
                                    <span className="px-2 py-1 rounded-lg bg-purple-50 text-[#6C63FF] text-xs font-bold">
                                        {app.ai_match_score}%
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </motion.div>
        </DashboardShell>
    );
}