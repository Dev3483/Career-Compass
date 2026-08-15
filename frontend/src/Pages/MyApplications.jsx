import React, { useState, useEffect, useCallback } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { motion, AnimatePresence } from "framer-motion";
import {
    Briefcase, MapPin, Clock, Building2, CheckCircle, XCircle, AlertCircle,
    Eye, Calendar, TrendingUp, Download, Filter, Search, ChevronDown,
    ExternalLink, Award, Star, RefreshCw, Bell, BellOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { getUserApplications, getUserApplicationStats, getApplicationStatus } from "@/utils/api";
import { toast } from "react-hot-toast";

export default function MyApplications() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [applications, setApplications] = useState([]);
    const [filteredApps, setFilteredApps] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sortBy, setSortBy] = useState("date");
    const [stats, setStats] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [realtimeEnabled, setRealtimeEnabled] = useState(true);
    const [statusUpdates, setStatusUpdates] = useState({});

    // Fetch applications from backend
    const fetchApplications = useCallback(async () => {
        setLoading(true);
        try {
            const result = await getUserApplications();
            if (result.success) {
                setApplications(result.applications || []);
            } else {
                toast.error(result.error || "Failed to load applications");
            }
        } catch (error) {
            console.error('Error fetching applications:', error);
            toast.error('Failed to load applications');
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch statistics
    const fetchStats = useCallback(async () => {
        try {
            const result = await getUserApplicationStats();
            if (result.success) {
                setStats(result.stats);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    }, []);

    // Real-time status polling
    const pollStatusUpdates = useCallback(async () => {
        if (!realtimeEnabled) return;

        const pendingApps = applications.filter(app =>
            app.status === 'pending' || app.status === 'reviewing'
        );

        for (const app of pendingApps) {
            try {
                const result = await getApplicationStatus(app.application_id);
                if (result.success && result.status !== app.status) {
                    // Update local application status
                    setApplications(prevApps =>
                        prevApps.map(a =>
                            a.application_id === app.application_id
                                ? { ...a, status: result.status, updated_at: result.updated_at }
                                : a
                        )
                    );

                    // Show notification for status change
                    if (!statusUpdates[app.application_id]) {
                        setStatusUpdates(prev => ({ ...prev, [app.application_id]: result.status }));
                        toast.success(`${app.job_title} at ${app.company} is now ${result.status.toUpperCase()}!`, {
                            duration: 5000,
                            icon: '📢'
                        });
                    }
                }
            } catch (error) {
                console.error(`Error polling status for ${app.application_id}:`, error);
            }
        }
    }, [applications, realtimeEnabled, statusUpdates]);

    // Initial fetch
    useEffect(() => {
        fetchApplications();
        fetchStats();
    }, [fetchApplications, fetchStats]);

    // Real-time polling every 10 seconds
    useEffect(() => {
        if (!realtimeEnabled || applications.length === 0) return;

        const interval = setInterval(pollStatusUpdates, 10000);
        return () => clearInterval(interval);
    }, [pollStatusUpdates, realtimeEnabled, applications.length]);

    // Filter and sort applications
    useEffect(() => {
        let filtered = [...applications];

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(app =>
                app.job_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                app.company?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filter by status
        if (statusFilter !== "all") {
            filtered = filtered.filter(app => app.status === statusFilter);
        }

        // Sort
        filtered.sort((a, b) => {
            if (sortBy === "date") {
                return new Date(b.applied_at) - new Date(a.applied_at);
            } else if (sortBy === "match") {
                return (b.match_score || 0) - (a.match_score || 0);
            } else if (sortBy === "company") {
                return (a.company || "").localeCompare(b.company || "");
            }
            return 0;
        });

        setFilteredApps(filtered);
    }, [applications, searchTerm, statusFilter, sortBy]);

    // Refresh all data
    const refreshData = async () => {
        setRefreshing(true);
        await Promise.all([fetchApplications(), fetchStats()]);
        setRefreshing(false);
        toast.success("Applications refreshed");
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            pending: { bg: "bg-yellow-100", text: "text-yellow-700", icon: Clock, label: "Pending Review" },
            reviewed: { bg: "bg-blue-100", text: "text-blue-700", icon: Eye, label: "Reviewed" },
            shortlisted: { bg: "bg-purple-100", text: "text-purple-700", icon: Star, label: "Shortlisted" },
            interview: { bg: "bg-indigo-100", text: "text-indigo-700", icon: Calendar, label: "Interview Scheduled" },
            offered: { bg: "bg-emerald-100", text: "text-emerald-700", icon: Award, label: "Offer Received" },
            rejected: { bg: "bg-red-100", text: "text-red-700", icon: XCircle, label: "Not Selected" },
            hired: { bg: "bg-green-100", text: "text-green-700", icon: CheckCircle, label: "Hired" }
        };

        const config = statusConfig[status] || statusConfig.pending;
        const Icon = config.icon;

        return (
            <Badge className={`${config.bg} ${config.text} rounded-lg px-3 py-1`}>
                <Icon className="w-3 h-3 mr-1" />
                {config.label}
            </Badge>
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return "Unknown";
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return "Today";
        if (diffDays === 1) return "Yesterday";
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    if (loading && applications.length === 0) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
                <div className="flex gap-1">
                    <div className="w-3 h-3 rounded-full bg-[#6C63FF] pulse-dot" />
                    <div className="w-3 h-3 rounded-full bg-[#6C63FF] pulse-dot" style={{ animationDelay: "0.2s" }} />
                    <div className="w-3 h-3 rounded-full bg-[#6C63FF] pulse-dot" style={{ animationDelay: "0.4s" }} />
                </div>
            </div>
        );
    }

    return (
        <DashboardShell user={user} title="My Applications" currentPage="MyApplications">
            <div className="max-w-6xl mx-auto">
                {/* Real-time Status Bar */}
                {realtimeEnabled && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-3 mb-4 flex items-center justify-between"
                    >
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-sm text-gray-700">Live updates enabled</span>
                            <span className="text-xs text-gray-500">• Checking for status changes every 10s</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setRealtimeEnabled(false)}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <BellOff className="w-4 h-4 mr-1" />
                            Disable
                        </Button>
                    </motion.div>
                )}

                {!realtimeEnabled && (
                    <div className="bg-gray-50 rounded-xl p-3 mb-4 flex items-center justify-between">
                        <span className="text-sm text-gray-500">Real-time updates disabled</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setRealtimeEnabled(true)}
                            className="text-[#6C63FF]"
                        >
                            <Bell className="w-4 h-4 mr-1" />
                            Enable Live Updates
                        </Button>
                    </div>
                )}

                {/* Stats Cards */}
                {stats && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6"
                    >
                        <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
                            <p className="text-xl font-bold text-gray-900">{stats.total}</p>
                            <p className="text-xs text-gray-500">Total</p>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
                            <p className="text-xl font-bold text-yellow-600">{stats.pending || 0}</p>
                            <p className="text-xs text-gray-500">Pending</p>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
                            <p className="text-xl font-bold text-blue-600">{stats.reviewed || 0}</p>
                            <p className="text-xs text-gray-500">Reviewed</p>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
                            <p className="text-xl font-bold text-purple-600">{stats.shortlisted || 0}</p>
                            <p className="text-xs text-gray-500">Shortlisted</p>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
                            <p className="text-xl font-bold text-indigo-600">{stats.interview || 0}</p>
                            <p className="text-xs text-gray-500">Interviews</p>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
                            <p className="text-xl font-bold text-green-600">{stats.hired || 0}</p>
                            <p className="text-xs text-gray-500">Hired</p>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
                            <p className="text-xl font-bold text-red-600">{stats.rejected || 0}</p>
                            <p className="text-xs text-gray-500">Rejected</p>
                        </div>
                    </motion.div>
                )}

                {/* Filters */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-2xl border border-gray-100 p-4 mb-6"
                >
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex items-center gap-2 flex-1 bg-gray-50 rounded-xl px-3">
                            <Search className="w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Search by job title or company..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="border-0 bg-transparent shadow-none focus-visible:ring-0"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full sm:w-36 rounded-xl">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="reviewed">Reviewed</SelectItem>
                                <SelectItem value="shortlisted">Shortlisted</SelectItem>
                                <SelectItem value="interview">Interview</SelectItem>
                                <SelectItem value="offered">Offered</SelectItem>
                                <SelectItem value="hired">Hired</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="w-full sm:w-36 rounded-xl">
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="date">Latest First</SelectItem>
                                <SelectItem value="match">Match Score</SelectItem>
                                <SelectItem value="company">Company Name</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button
                            variant="outline"
                            onClick={refreshData}
                            disabled={refreshing}
                            className="rounded-xl gap-2"
                        >
                            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    </div>
                </motion.div>

                {/* Applications List */}
                {filteredApps.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-20 bg-white rounded-2xl border border-gray-100"
                    >
                        <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No applications found</h3>
                        <p className="text-gray-500 mb-4">
                            {searchTerm || statusFilter !== "all"
                                ? "Try adjusting your filters"
                                : "You haven't applied to any jobs yet"}
                        </p>
                        {!searchTerm && statusFilter === "all" && (
                            <Button
                                onClick={() => window.location.href = '/dashboard/recommendations'}
                                className="bg-[#6C63FF] text-white rounded-xl"
                            >
                                Browse Jobs
                            </Button>
                        )}
                    </motion.div>
                ) : (
                    <div className="space-y-4">
                        {filteredApps.map((app, index) => (
                            <motion.div
                                key={app.application_id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-white rounded-2xl border-1 border-gray-200 p-6 hover:shadow-lg transition-all"
                            >
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 ">
                                    <div className="flex-1">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-[#6C63FF]/10 flex items-center justify-center text-[#6C63FF] font-bold text-lg flex-shrink-0">
                                                {app.company_logo || app.company?.slice(0, 2).toUpperCase() || "C"}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                                    <h3 className="text-lg font-bold text-gray-900">{app.job_title}</h3>
                                                    {getStatusBadge(app.status)}
                                                </div>
                                                <p className="text-gray-600 flex items-center gap-1 mb-2">
                                                    <Building2 className="w-4 h-4" /> {app.company}
                                                </p>
                                                <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="w-3.5 h-3.5" /> {app.location || "Remote"}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3.5 h-3.5" /> Applied {formatDate(app.applied_at)}
                                                    </span>
                                                    {app.salary_range && (
                                                        <span className="flex items-center gap-1">
                                                            <TrendingUp className="w-3.5 h-3.5" /> {app.salary_range}
                                                        </span>
                                                    )}
                                                    {app.updated_at && app.updated_at !== app.applied_at && (
                                                        <span className="flex items-center gap-1 text-purple-600">
                                                            <RefreshCw className="w-3.5 h-3.5" />
                                                            Status updated {formatDate(app.updated_at)}
                                                        </span>
                                                    )}
                                                </div>
                                                {app.match_score > 0 && (
                                                    <div className="mt-3 flex items-center gap-2">
                                                        <div className={`px-2 py-1 rounded-lg text-xs font-bold ${app.match_score >= 80 ? "bg-green-50 text-green-700" :
                                                                app.match_score >= 60 ? "bg-blue-50 text-blue-700" : "bg-yellow-50 text-yellow-700"
                                                            }`}>
                                                            {app.match_score}% Match
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="rounded-xl"
                                            onClick={() => window.open(`/job/${app.job_id}`, '_blank')}
                                        >
                                            <Eye className="w-4 h-4 mr-2" />
                                            View Job
                                        </Button>
                                        {(app.status === "interview" || app.status === "offered") && (
                                            <Button
                                                size="sm"
                                                className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white"
                                                onClick={() => toast.info("Interview scheduling coming soon!")}
                                            >
                                                <Calendar className="w-4 h-4 mr-2" />
                                                Schedule {app.status === "interview" ? "Interview" : "Meeting"}
                                            </Button>
                                        )}
                                        {app.status === "offered" && (
                                            <Button
                                                size="sm"
                                                className="rounded-xl bg-green-600 hover:bg-green-700 text-white"
                                                onClick={() => toast.success("Check your email for offer details!")}
                                            >
                                                <Award className="w-4 h-4 mr-2" />
                                                View Offer
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardShell>
    );
}