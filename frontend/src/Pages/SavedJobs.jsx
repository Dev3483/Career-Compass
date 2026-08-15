import React, { useState, useEffect, useCallback } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { motion, AnimatePresence } from "framer-motion";
import {
    Briefcase, MapPin, Clock, Building2, Eye, Calendar,
    BookmarkX, Search, DollarSign, Shield, TrendingUp, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { getSavedJobs, unsaveJob, saveJob } from "@/utils/api";
import { toast } from "react-hot-toast";

export default function SavedJobs() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [jobs, setJobs] = useState([]);
    const [filteredJobs, setFilteredJobs] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    
    // Fetch saved jobs from backend
    const fetchSavedJobs = useCallback(async () => {
        setLoading(true);
        try {
            const result = await getSavedJobs();
            if (result.success) {
                setJobs(result.jobs || []);
            } else {
                toast.error(result.error || "Failed to load saved jobs");
            }
        } catch (error) {
            console.error('Error fetching jobs:', error);
            toast.error('Failed to load saved jobs');
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchSavedJobs();
    }, [fetchSavedJobs]);

    // Filter jobs
    useEffect(() => {
        let filtered = [...jobs];

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(job =>
                job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                job.company?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredJobs(filtered);
    }, [jobs, searchTerm]);

    const handleUnsave = async (jobId) => {
        try {
            const result = await unsaveJob(jobId);
            if (result.success) {
                setJobs(prevJobs => prevJobs.filter(job => job.job_id !== jobId));
                toast.success('Job removed from saved list');
            } else {
                toast.error(result.error || 'Failed to remove job');
            }
        } catch (error) {
            console.error('Error unsaving job:', error);
            toast.error('Failed to remove job');
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "Unknown";
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const getAuthenticityBadge = (score, isVerified, source) => {
        if (isVerified || source === 'company_posted') {
            return (
                <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-md flex items-center border border-green-200">
                    <Shield className="w-3 h-3 mr-1" /> Verified
                </span>
            );
        }
        if (score >= 80) {
            return (
                <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded-md flex items-center border border-blue-200">
                    <Shield className="w-3 h-3 mr-1" /> High Trust ({Math.round(score)}%)
                </span>
            );
        }
        return null;
    };

    if (loading && jobs.length === 0) {
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
        <DashboardShell user={user} title="Saved Jobs" currentPage="SavedJobs">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {/* Header Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center gap-4 shadow-sm md:col-span-1"
                >
                    <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
                        <Briefcase className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-gray-900">{jobs.length}</p>
                        <p className="text-sm font-medium text-gray-500">Saved Jobs</p>
                    </div>
                </motion.div>
                
                {/* Search Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col justify-center shadow-sm md:col-span-3"
                >
                     <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <div className="relative w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Search saved jobs by title or company..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 bg-gray-50 border-transparent focus:bg-white focus:border-[#6C63FF] focus:ring-2 focus:ring-[#6C63FF]/20 rounded-xl w-full"
                            />
                        </div>
                     </div>
                </motion.div>
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[500px]">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-900">Your Bookmarks ({filteredJobs.length})</h2>
                </div>

                <div className="p-6">
                    {filteredJobs.length === 0 ? (
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            className="text-center py-20"
                        >
                            <Briefcase className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-900 mb-2">No jobs saved yet</h3>
                            <p className="text-gray-500 max-w-md mx-auto mb-6">
                                {searchTerm 
                                    ? "No saved jobs match your current search criteria. Try different keywords." 
                                    : "You haven't saved any jobs yet. Browse recommendations and click the bookmark icon to save jobs here."}
                            </p>
                        </motion.div>
                    ) : (
                        <div className="grid gap-4">
                            <AnimatePresence>
                                {filteredJobs.map((job, idx) => (
                                    <motion.div
                                        key={job.job_id || idx}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="p-6 border border-gray-200 rounded-xl hover:border-[#6C63FF]/40 hover:shadow-md transition-all group bg-white relative"
                                    >
                                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                            {/* Job Info */}
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6C63FF] to-[#5A52D5] flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-inner">
                                                    {job.company?.charAt(0) || "C"}
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#6C63FF] transition-colors">{job.title || "Unknown Title"}</h3>
                                                    <p className="text-gray-600 font-medium mb-3 flex items-center gap-2">
                                                        <Building2 className="w-4 h-4 text-gray-400" />
                                                        {job.company || "Unknown Company"}
                                                        {job.saved_at && (
                                                            <span className="text-xs text-gray-400 font-normal ml-2 hidden sm:inline-block">
                                                                • Saved {formatDate(job.saved_at)}
                                                            </span>
                                                        )}
                                                    </p>
                                                    <div className="flex flex-wrap gap-2 text-sm">
                                                        <Badge variant="secondary" className="bg-gray-50 text-gray-600 font-normal border border-gray-200 rounded-lg">
                                                            <MapPin className="w-3.5 h-3.5 mr-1 text-gray-400" /> 
                                                            {job.location || "Remote"}
                                                        </Badge>
                                                        
                                                        {job.salary_min && (
                                                            <Badge variant="secondary" className="bg-green-50 text-green-700 font-medium border border-green-200 rounded-lg">
                                                                <DollarSign className="w-3.5 h-3.5 mr-0.5" /> 
                                                                {(job.salary_min / 1000).toFixed(0)}K–{(job.salary_max / 1000).toFixed(0)}K
                                                            </Badge>
                                                        )}
                                                        
                                                        {job.job_type && (
                                                            <Badge variant="secondary" className="bg-blue-50 text-blue-700 font-normal border border-blue-200 rounded-lg capitalize">
                                                                <Clock className="w-3.5 h-3.5 mr-1" /> 
                                                                {job.job_type.replace('_', ' ')}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex flex-row md:flex-col gap-2 justify-between">
                                                 <div className="flex items-center gap-2 mb-2 md:justify-end shrink-0 text-right">
                                                   {getAuthenticityBadge(job.authenticity_score, job.is_verified, job.source)}
                                                 </div>
                                                <div className="flex items-center gap-2 ml-auto md:ml-0">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                                                        onClick={() => handleUnsave(job.job_id)}
                                                    >
                                                        <BookmarkX className="w-4 h-4 md:mr-2" />
                                                        <span className="hidden md:inline">Unsave</span>
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        className="bg-[#6C63FF] hover:bg-[#5A52D5] text-white rounded-xl shadow-sm"
                                                        onClick={() => window.open(`/job/${job.job_id}`, '_blank')}
                                                    >
                                                        <Eye className="w-4 h-4 md:mr-2" />
                                                        <span className="hidden md:inline">View Job</span>
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>
        </DashboardShell>
    );
}

