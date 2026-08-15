import React, { useState, useEffect, useCallback } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Users, Mail, FileText, Briefcase, 
    Loader2, RefreshCw, ChevronRight, 
    CheckCircle, XCircle, Clock, Star,
    TrendingUp, Brain, Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    Select, SelectContent, SelectItem, 
    SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";

// Import API functions from your existing api.js
import { 
    getCompanyJobs, 
    getJobApplications, 
    updateApplicationStatus,
    getRankedCandidates
} from "@/utils/api";

// Status color mapping
const statusColors = {
    pending: { bg: "bg-yellow-100", text: "text-yellow-700", icon: Clock },
    reviewed: { bg: "bg-blue-100", text: "text-blue-700", icon: CheckCircle },
    shortlisted: { bg: "bg-green-100", text: "text-green-700", icon: Star },
    interview: { bg: "bg-purple-100", text: "text-purple-700", icon: Users },
    offered: { bg: "bg-emerald-100", text: "text-emerald-700", icon: CheckCircle },
    rejected: { bg: "bg-red-100", text: "text-red-700", icon: XCircle },
    hired: { bg: "bg-teal-100", text: "text-teal-700", icon: CheckCircle }
};

// Status options for dropdown
const STATUS_OPTIONS = [
    { value: "pending", label: "Pending" },
    { value: "reviewed", label: "Reviewed" },
    { value: "shortlisted", label: "Shortlisted" },
    { value: "interview", label: "Interview" },
    { value: "offered", label: "Offered" },
    { value: "rejected", label: "Rejected" },
    { value: "hired", label: "Hired" }
];

export default function Candidates() {
    const [user, setUser] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [selectedJob, setSelectedJob] = useState(null);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingJobs, setLoadingJobs] = useState(true);
    const [statusFilter, setStatusFilter] = useState("all");
    const [updatingStatus, setUpdatingStatus] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    
    // AI Ranking states
    const [rankedCandidates, setRankedCandidates] = useState([]);
    const [rankingLoading, setRankingLoading] = useState(false);
    const [showRanking, setShowRanking] = useState(false);

    // Get user from localStorage with proper key
    useEffect(() => {
        const getUserFromStorage = () => {
            // Try multiple possible storage keys
            const storedUser = localStorage.getItem('careerai_user') || 
                              localStorage.getItem('user') ||
                              localStorage.getItem('careerai_user_data');
            
            if (storedUser) {
                try {
                    const userData = JSON.parse(storedUser);
                    // Normalize user object - ensure id field exists
                    const normalizedUser = {
                        ...userData,
                        id: userData.id || userData.user_id || userData._id,
                        role: userData.role || userData.user_role || 'company'
                    };
                    setUser(normalizedUser);
                    return normalizedUser;
                } catch (error) {
                    console.error('Error parsing user data:', error);
                }
            }
            return null;
        };

        getUserFromStorage();
        
        // Listen for storage changes (in case user logs in/out in another tab)
        const handleStorageChange = () => {
            getUserFromStorage();
        };
        
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // Fetch company jobs
    const fetchJobs = useCallback(async () => {
        if (!user?.id) {
            console.log('No user ID available, skipping jobs fetch');
            return;
        }

        setLoadingJobs(true);
        try {
            console.log('Fetching jobs for company:', user.id);
            const result = await getCompanyJobs(user.id);
            
            if (result.success) {
                const jobsData = result.jobs || [];
                setJobs(jobsData);
                
                // Auto-select first job if available and no job selected
                if (jobsData.length > 0 && !selectedJob) {
                    setSelectedJob(jobsData[0]);
                } else if (jobsData.length === 0) {
                    setSelectedJob(null);
                    setApplications([]);
                }
            } else {
                console.error('Failed to fetch jobs:', result.error);
                toast.error(result.error || "Failed to fetch jobs");
                setJobs([]);
            }
        } catch (error) {
            console.error('Error fetching jobs:', error);
            toast.error("Failed to load your jobs. Please try again.");
            setJobs([]);
        } finally {
            setLoadingJobs(false);
        }
    }, [user, selectedJob]);

    // Fetch applications for selected job
    const fetchApplications = useCallback(async () => {
        if (!selectedJob?.job_id || !user?.id) {
            console.log('No selected job or user, skipping applications fetch');
            return;
        }

        setLoading(true);
        try {
            console.log('Fetching applications for job:', selectedJob.job_id);
            const result = await getJobApplications(selectedJob.job_id, user.id);
            
            if (result.success) {
                setApplications(result.applications || []);
            } else {
                console.error('Failed to fetch applications:', result.error);
                toast.error(result.error || "Failed to fetch applications");
                setApplications([]);
            }
        } catch (error) {
            console.error('Error fetching applications:', error);
            toast.error("Failed to load applications. Please try again.");
            setApplications([]);
        } finally {
            setLoading(false);
        }
    }, [selectedJob, user]);

    // Fetch ranked candidates
    const fetchRankedCandidates = async (forceRefresh = false) => {
        if (!selectedJob) return;
        
        setRankingLoading(true);
        try {
            const result = await getRankedCandidates(selectedJob.job_id, forceRefresh);
            
            if (result.success) {
                setRankedCandidates(result.candidates);
                setShowRanking(true);
                toast.success(`Ranked ${result.total_candidates} candidates`);
            } else {
                toast.error(result.error || "Failed to rank candidates");
            }
        } catch (error) {
            console.error('Ranking error:', error);
            toast.error(error.error || "Failed to rank candidates");
        } finally {
            setRankingLoading(false);
        }
    };

    // Refresh all data
    const refreshData = async () => {
        setRefreshing(true);
        await fetchJobs();
        if (selectedJob) {
            await fetchApplications();
        }
        setRefreshing(false);
        toast.success("Data refreshed successfully");
    };

    // Initial fetch when user is available
    useEffect(() => {
        if (user?.id) {
            fetchJobs();
        }
    }, [user, fetchJobs]);

    // Fetch applications when selected job changes
    useEffect(() => {
        if (selectedJob && user?.id) {
            fetchApplications();
            // Reset ranking view when job changes
            setShowRanking(false);
            setRankedCandidates([]);
        }
    }, [selectedJob, user, fetchApplications]);

    // Handle status update
    const handleStatusUpdate = async (applicationId, newStatus) => {
        if (!user?.id) {
            toast.error("User not authenticated");
            return;
        }
        
        setUpdatingStatus(applicationId);
        try {
            const result = await updateApplicationStatus(applicationId, newStatus, user.id);
            
            if (result.success) {
                // Update local state
                setApplications(prevApps =>
                    prevApps.map(app =>
                        app.application_id === applicationId 
                            ? { ...app, status: newStatus } 
                            : app
                    )
                );
                toast.success(`Application status updated to ${newStatus}`);
            } else {
                toast.error(result.error || "Failed to update status");
            }
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error("Failed to update status. Please try again.");
        } finally {
            setUpdatingStatus(null);
        }
    };

    // Filter applications by status
    const filteredApplications = statusFilter === "all" 
        ? applications 
        : applications.filter(app => app.status === statusFilter);

    // Calculate statistics
    const stats = {
        total: applications.length,
        pending: applications.filter(a => a.status === 'pending').length,
        shortlisted: applications.filter(a => a.status === 'shortlisted').length,
        interview: applications.filter(a => a.status === 'interview').length,
        hired: applications.filter(a => a.status === 'hired').length,
        rejected: applications.filter(a => a.status === 'rejected').length
    };

    // Loading state
    if (!user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="flex gap-2 justify-center mb-4">
                        <div className="w-4 h-4 rounded-full bg-[#6C63FF] animate-bounce" />
                        <div className="w-4 h-4 rounded-full bg-[#6C63FF] animate-bounce delay-100" />
                        <div className="w-4 h-4 rounded-full bg-[#6C63FF] animate-bounce delay-200" />
                    </div>
                    <p className="text-gray-600">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    // Access denied state
    if (user.role !== "company") {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-8 bg-white rounded-2xl shadow-lg">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-10 h-10 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-600 mb-6">
                        This page is only accessible to company accounts. 
                        Please log in with a company account to view candidates.
                    </p>
                    <Button 
                        onClick={() => window.location.href = '/login'}
                        className="bg-[#6C63FF] hover:bg-[#5a52e0]"
                    >
                        Go to Login
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <DashboardShell user={user} title="Candidates" currentPage="Candidates">
            {/* Header with Refresh Button */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Candidates</h1>
                    <p className="text-gray-500 mt-1">Manage and review job applicants</p>
                </div>
                <Button
                    variant="outline"
                    onClick={refreshData}
                    disabled={refreshing}
                    className="gap-2"
                >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Job Selection Section */}
            <div className="mb-8">
                <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-[#6C63FF]" />
                    Your Jobs
                </h2>
                
                {loadingJobs ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-[#6C63FF]" />
                        <span className="ml-2 text-gray-500">Loading jobs...</span>
                    </div>
                ) : jobs.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
                        <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Jobs Posted Yet</h3>
                        <p className="text-gray-500 mb-6">Post your first job to start receiving applications.</p>
                        <Button 
                            onClick={() => window.location.href = '/post-job'}
                            className="bg-[#6C63FF] hover:bg-[#5a52e0]"
                        >
                            Post a Job
                        </Button>
                    </div>
                ) : (
                    <div className="flex gap-2 flex-wrap">
                        {jobs.map((job) => (
                            <button
                                key={job.job_id}
                                onClick={() => setSelectedJob(job)}
                                className={`group relative px-5 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                                    selectedJob?.job_id === job.job_id 
                                        ? "bg-[#6C63FF] text-white shadow-md shadow-[#6C63FF]/20" 
                                        : "bg-white text-gray-700 border border-gray-200 hover:border-[#6C63FF] hover:shadow-md"
                                }`}
                            >
                                <span className="text-sm">{job.title}</span>
                                {job.applications_count > 0 && (
                                    <span className={`absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                                        selectedJob?.job_id === job.job_id
                                            ? "bg-white text-[#6C63FF]"
                                            : "bg-[#6C63FF] text-white"
                                    }`}>
                                        {job.applications_count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Applications Section */}
            {selectedJob && (
                <>
                    {/* Job Header */}
                    <div className="bg-gradient-to-r from-[#6C63FF] to-[#8B85FF] rounded-2xl p-6 mb-6 text-white">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div>
                                <h2 className="text-xl font-bold mb-1">{selectedJob.title}</h2>
                                <p className="text-white/80 text-sm">
                                    Posted {selectedJob.created_at ? new Date(selectedJob.created_at).toLocaleDateString() : 'recently'}
                                </p>
                            </div>
                            <div className="flex gap-3">
                                {/* AI Rank Button */}
                                <Button
                                    onClick={() => fetchRankedCandidates()}
                                    disabled={rankingLoading || applications.length === 0}
                                    className="bg-white/20 hover:bg-white/30 text-white gap-2"
                                >
                                    {rankingLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Brain className="w-4 h-4" />
                                    )}
                                    AI Rank Candidates
                                </Button>
                                <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
                                    <div className="text-2xl font-bold">{stats.total}</div>
                                    <div className="text-xs text-white/80">Total</div>
                                </div>
                                <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
                                    <div className="text-2xl font-bold">{stats.pending}</div>
                                    <div className="text-xs text-white/80">Pending</div>
                                </div>
                                <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
                                    <div className="text-2xl font-bold">{stats.shortlisted}</div>
                                    <div className="text-xs text-white/80">Shortlisted</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters - Only show when not in ranking view */}
                    {!showRanking && (
                        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                            <div className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-gray-400" />
                                <span className="text-gray-600 font-medium">
                                    {filteredApplications.length} candidate{filteredApplications.length !== 1 ? 's' : ''}
                                </span>
                            </div>
                            
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-44 rounded-xl">
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    {STATUS_OPTIONS.map(option => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Applications List or Ranking View */}
                    <AnimatePresence mode="wait">
                        {showRanking ? (
                            <motion.div
                                key="ranking"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="space-y-3"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <Award className="w-5 h-5 text-[#6C63FF]" />
                                        <h3 className="font-semibold text-gray-900">AI-Ranked Candidates</h3>
                                        <Badge className="bg-purple-100 text-purple-700 rounded-lg">
                                            Hybrid Scoring
                                        </Badge>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setShowRanking(false);
                                            fetchApplications();
                                        }}
                                        className="text-gray-500"
                                    >
                                        Back to Applications
                                    </Button>
                                </div>
                                
                                {rankedCandidates.length === 0 ? (
                                    <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                                        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Candidates Yet</h3>
                                        <p className="text-gray-500">No applications received for this job yet.</p>
                                    </div>
                                ) : (
                                    rankedCandidates.map((candidate, idx) => (
                                        <motion.div
                                            key={candidate.application_id || idx}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg transition-all"
                                        >
                                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                                <div className="flex items-center gap-4 flex-1">
                                                    {/* Rank Badge */}
                                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
                                                        #{candidate.rank}
                                                    </div>
                                                    
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                                            <h3 className="font-bold text-gray-900 text-lg">
                                                                {candidate.applicant_name}
                                                            </h3>
                                                            {/* Score Badge */}
                                                            <Badge className={`rounded-full ${
                                                                candidate.score >= 80 ? "bg-green-100 text-green-700" :
                                                                candidate.score >= 60 ? "bg-blue-100 text-blue-700" :
                                                                "bg-yellow-100 text-yellow-700"
                                                            }`}>
                                                                <Star className="w-3 h-3 mr-1" />
                                                                {Math.round(candidate.score)}% Match
                                                            </Badge>
                                                        </div>
                                                        
                                                        <p className="text-sm text-gray-500 flex items-center gap-1">
                                                            <Mail className="w-3 h-3" /> {candidate.applicant_email}
                                                        </p>
                                                        
                                                        {/* Explanation */}
                                                        <p className="text-xs text-gray-500 mt-2">
                                                            {candidate.explanation}
                                                        </p>
                                                        
                                                        {/* Skills */}
                                                        {candidate.matching_skills?.length > 0 && (
                                                            <div className="flex gap-1 mt-2 flex-wrap">
                                                                {candidate.matching_skills.slice(0, 4).map((skill, idx) => (
                                                                    <span key={idx} className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                                                                        {skill}
                                                                    </span>
                                                                ))}
                                                                {candidate.missing_skills?.length > 0 && (
                                                                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded-full">
                                                                        +{candidate.missing_skills.length} missing
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-2">
                                                    {/* Score Breakdown */}
                                                    <div className="text-right mr-2">
                                                        <div className="text-xs text-gray-400">Base: {Math.round(candidate.match_percentage)}%</div>
                                                        <div className="text-xs text-gray-400">AI: {Math.round(candidate.ai_score)}%</div>
                                                    </div>
                                                    
                                                    {candidate.applicant_resume_url && (
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            className="rounded-xl gap-2"
                                                            onClick={() => window.open(candidate.applicant_resume_url, '_blank')}
                                                        >
                                                            <FileText className="w-4 h-4" />
                                                            Resume
                                                        </Button>
                                                    )}
                                                    
                                                    <Select 
                                                        value={candidate.current_status || "pending"} 
                                                        onValueChange={(v) => handleStatusUpdate(candidate.application_id, v)}
                                                        disabled={updatingStatus === candidate.application_id}
                                                    >
                                                        <SelectTrigger className="w-36 h-9 rounded-xl text-sm">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {STATUS_OPTIONS.map(option => (
                                                                <SelectItem key={option.value} value={option.value}>
                                                                    {option.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            
                                            {/* AI Insight */}
                                            {candidate.ai_reason && (
                                                <div className="mt-3 pt-3 border-t border-gray-100">
                                                    <div className="flex items-start gap-2">
                                                        <Brain className="w-4 h-4 text-purple-500 mt-0.5" />
                                                        <p className="text-xs text-gray-600">{candidate.ai_reason}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </motion.div>
                                    ))
                                )}
                            </motion.div>
                        ) : loading ? (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-center py-20 bg-white rounded-2xl border border-gray-100"
                            >
                                <Loader2 className="w-12 h-12 animate-spin text-[#6C63FF] mx-auto mb-4" />
                                <p className="text-gray-500 font-medium">Loading applications...</p>
                            </motion.div>
                        ) : filteredApplications.length === 0 ? (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="text-center py-20 bg-white rounded-2xl border border-gray-100"
                            >
                                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    {statusFilter === "all" 
                                        ? "No applicants yet" 
                                        : `No ${statusFilter} applicants`}
                                </h3>
                                <p className="text-gray-500">
                                    {statusFilter === "all" 
                                        ? "When candidates apply, they'll appear here" 
                                        : `No applications with "${statusFilter}" status`}
                                </p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="applications"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="space-y-3"
                            >
                                {filteredApplications.map((app, i) => {
                                    const StatusIcon = statusColors[app.status]?.icon || Clock;
                                    return (
                                        <motion.div
                                            key={app.application_id || i}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg transition-all duration-200 group"
                                        >
                                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                                <div className="flex items-center gap-4 flex-1">
                                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6C63FF] to-[#8B85FF] flex items-center justify-center text-white font-bold text-lg shadow-md">
                                                        {app.applicant_name?.[0]?.toUpperCase() || 
                                                         app.applicant_email?.[0]?.toUpperCase() || 
                                                         "A"}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                                            <h3 className="font-bold text-gray-900 text-lg">
                                                                {app.applicant_name || "Anonymous Applicant"}
                                                            </h3>
                                                            {app.ai_match_score && (
                                                                <span className="px-2 py-1 rounded-full bg-purple-50 text-[#6C63FF] text-xs font-bold">
                                                                    {Math.round(app.ai_match_score)}% Match
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-gray-500 flex items-center gap-1">
                                                            <Mail className="w-3 h-3" /> 
                                                            {app.applicant_email || "Email not provided"}
                                                        </p>
                                                        {app.applicant_skills && app.applicant_skills.length > 0 && (
                                                            <div className="flex gap-1 mt-2 flex-wrap">
                                                                {app.applicant_skills.slice(0, 4).map((skill, idx) => (
                                                                    <span key={idx} className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                                                                        {skill}
                                                                    </span>
                                                                ))}
                                                                {app.applicant_skills.length > 4 && (
                                                                    <span className="text-xs px-2 py-1 text-gray-500">
                                                                        +{app.applicant_skills.length - 4}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <Badge className={`rounded-xl px-3 py-1 ${statusColors[app.status]?.bg} ${statusColors[app.status]?.text} font-medium gap-1`}>
                                                        <StatusIcon className="w-3 h-3" />
                                                        {app.status?.toUpperCase() || "PENDING"}
                                                    </Badge>
                                                    
                                                    <Select 
                                                        value={app.status || "pending"} 
                                                        onValueChange={(v) => handleStatusUpdate(app.application_id, v)}
                                                        disabled={updatingStatus === app.application_id}
                                                    >
                                                        <SelectTrigger className="w-36 h-9 rounded-xl text-sm">
                                                            <SelectValue placeholder="Change status" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {STATUS_OPTIONS.map(option => (
                                                                <SelectItem key={option.value} value={option.value}>
                                                                    {option.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    
                                                    {app.applicant_resume_url && (
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            className="rounded-xl gap-2"
                                                            onClick={() => window.open(app.applicant_resume_url, '_blank')}
                                                        >
                                                            <FileText className="w-4 h-4" />
                                                            Resume
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            )}
        </DashboardShell>
    );
}