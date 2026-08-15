import React, { useState, useEffect } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, DollarSign, Clock, Building2, Search, Briefcase, X, Sparkles, Bookmark, BookmarkCheck, Shield, TrendingUp, Calendar, Filter, ChevronDown, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-hot-toast";
import { getRecommendedJobs, getJobsForYou, getAllJobs, getSavedJobs, saveJob, unsaveJob, applyForJob, analyzeSkillGap } from "@/utils/api";
import SkillGap from "@/components/SkillGap";

export default function JobRecommendations() {
    const { user, isAuthenticated, isLoadingAuth } = useAuth();
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [verificationFilter, setVerificationFilter] = useState("all");
    const [sortBy, setSortBy] = useState("match");
    const [minMatch, setMinMatch] = useState(0);
    const [minAuthenticity, setMinAuthenticity] = useState(0);
    const [showFilters, setShowFilters] = useState(false);
    const [savedJobs, setSavedJobs] = useState(new Set());
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedJob, setSelectedJob] = useState(null);
    const [activeTab, setActiveTab] = useState("recommended");
    
    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const jobsPerPage = 10;

    const [analysis, setAnalysis] = useState(null);
    const [showAnalysis, setShowAnalysis] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);

    useEffect(() => {
        if (user && isAuthenticated) {
            setCurrentPage(1);
            fetchJobs();
            fetchSavedJobs();
        }
    }, [user, isAuthenticated, activeTab, sortBy, verificationFilter, minMatch, minAuthenticity, typeFilter]);

    const fetchJobs = async () => {
        setLoading(true);
        try {
            let response;
            if (activeTab === "recommended") {
                response = await getJobsForYou({
                    sort_by: sortBy,
                    verification: verificationFilter,
                    min_match: minMatch,
                    min_authenticity: minAuthenticity,
                    job_type: typeFilter 
                });
                console.log('Jobs for you response:', response);
            } else {
                response = await getAllJobs({
                    sort_by: sortBy,
                    verification: verificationFilter,
                    min_match: minMatch,
                    min_authenticity: minAuthenticity,
                    type: typeFilter !== "all" ? typeFilter : undefined
                });
                console.log('All jobs response:', response);
            }
            
            if (response.success) {
                setJobs(response.jobs || []);
            } else {
                toast.error(response.error || 'Failed to load jobs');
                setJobs([]);
            }
        } catch (error) {
            console.error('Fetch jobs error:', error);
            toast.error(error?.error || 'Failed to load jobs');
            setJobs([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchSavedJobs = async () => {
        try {
            const response = await getSavedJobs();
            if (response.success) {
                setSavedJobs(new Set(response.jobs?.map(job => job.job_id) || []));
            }
        } catch (error) {
            console.error('Fetch saved jobs error:', error);
        }
    };

    const toggleSave = async (jobId) => {
        try {
            if (savedJobs.has(jobId)) {
                await unsaveJob(jobId);
                setSavedJobs(prev => {
                    const n = new Set(prev);
                    n.delete(jobId);
                    return n;
                });
                toast.success('Job removed from saved');
            } else {
                await saveJob(jobId);
                setSavedJobs(prev => new Set(prev).add(jobId));
                toast.success('Job saved for later');
            }
        } catch (error) {
            console.error('Toggle save error:', error);
            toast.error(error?.error || 'Failed to save job');
        }
    };

    const handleApplyForJob = async (jobId) => {
        try {
            const response = await applyForJob(jobId);
            if (response.success) {
                if (response.is_scraped && response.redirect_url) {
                    toast.success("Redirecting to job application...");
                    window.open(response.redirect_url, "_blank");
                    return;
                }
                toast.success("Application submitted successfully!");
            } else {
                toast.error(response.error || 'Failed to apply');
            }
        } catch (error) {
            console.error('Apply error:', error);
            toast.error(error?.error || 'Failed to apply');
        }
    };

    const getAuthenticityBadge = (score, isVerified, source) => {
        if (isVerified || source === 'company_posted') {
            return (
                <Badge className="bg-green-50 text-green-700 border-green-200 rounded-lg">
                    <Shield className="w-3 h-3 mr-1" />
                    Verified Company
                </Badge>
            );
        }
        
        if (score >= 80) {
            return (
                <Badge className="bg-blue-50 text-blue-700 border-blue-200 rounded-lg">
                    <Shield className="w-3 h-3 mr-1" />
                    High Trust ({score}%)
                </Badge>
            );
        } else if (score >= 60) {
            return (
                <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200 rounded-lg">
                    <Shield className="w-3 h-3 mr-1" />
                    Medium Trust ({score}%)
                </Badge>
            );
        } else {
            return (
                <Badge className="bg-gray-50 text-gray-600 border-gray-200 rounded-lg">
                    <Shield className="w-3 h-3 mr-1" />
                    Low Trust ({score}%)
                </Badge>
            );
        }
    };

    const filteredJobs = jobs.filter(job => {
        const matchSearch = !search ||
            job.title?.toLowerCase().includes(search.toLowerCase()) ||
            job.company?.toLowerCase().includes(search.toLowerCase());
        return matchSearch;
    });

    const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);
    const currentJobs = filteredJobs.slice((currentPage - 1) * jobsPerPage, currentPage * jobsPerPage);

    // Show loading state
    if (isLoadingAuth) {
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

    if (!user || !isAuthenticated) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
                <div className="text-center">
                    <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">Not Authenticated</h2>
                    <p className="text-gray-500">Please log in to view job recommendations.</p>
                </div>
            </div>
        );
    }

    return (
        <DashboardShell user={user} title="Job Recommendations" currentPage="JobRecommendations">
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Left Panel - Job List */}
                <div className={`${selectedJob ? 'lg:w-1/2' : 'w-full'} transition-all duration-300`}>
                    {/* Tabs */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
                        <TabsList className="bg-white border border-gray-100 rounded-xl p-1">
                            <TabsTrigger 
                                value="recommended" 
                                className="rounded-lg data-[state=active]:bg-[#6C63FF] data-[state=active]:text-white"
                            >
                                <Sparkles className="w-4 h-4 mr-2" />
                                Jobs For You
                            </TabsTrigger>
                            <TabsTrigger 
                                value="all" 
                                className="rounded-lg data-[state=active]:bg-[#6C63FF] data-[state=active]:text-white"
                            >
                                <Briefcase className="w-4 h-4 mr-2" />
                                 All Jobs 
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    {/* Filters */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl border border-gray-100 p-4 mb-6"
                    >
                        {/* Search and Sort Row */}
                        <div className="flex flex-col sm:flex-row gap-3 mb-3">
                            <div className="flex items-center gap-2 flex-1 bg-gray-50 rounded-xl px-3">
                                <Search className="w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="Search jobs..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="border-0 bg-transparent shadow-none focus-visible:ring-0"
                                />
                            </div>
                            <Select value={sortBy} onValueChange={setSortBy}>
                                <SelectTrigger className="w-full sm:w-36 rounded-xl">
                                    <SelectValue placeholder="Sort by" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="match">
                                        <div className="flex items-center gap-2">
                                            <TrendingUp className="w-4 h-4" />
                                            Match Score
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="authenticity">
                                        <div className="flex items-center gap-2">
                                            <Shield className="w-4 h-4" />
                                            Trust Score
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="date">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            Date Posted
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="salary">
                                        <div className="flex items-center gap-2">
                                            <DollarSign className="w-4 h-4" />
                                            Salary
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <Button
                                variant="outline"
                                onClick={() => setShowFilters(!showFilters)}
                                className="rounded-xl"
                            >
                                <Filter className="w-4 h-4 mr-2" />
                                Filters
                                <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                            </Button>
                        </div>

                        {/* Advanced Filters */}
                        {showFilters && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="pt-3 mt-3 border-t border-gray-100"
                            >
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                    <div>
                                        <label className="text-xs text-gray-500 mb-1 block">Job Type</label>
                                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                                            <SelectTrigger className="rounded-xl">
                                                <SelectValue placeholder="Job Type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Types</SelectItem>
                                                <SelectItem value="full_time">Full-time</SelectItem>
                                                <SelectItem value="part_time">Part-time</SelectItem>
                                                <SelectItem value="contract">Contract</SelectItem>
                                                <SelectItem value="remote">Remote</SelectItem>
                                                <SelectItem value="internship">Internship</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 mb-1 block">Verification</label>
                                        <Select value={verificationFilter} onValueChange={setVerificationFilter}>
                                            <SelectTrigger className="rounded-xl">
                                                <SelectValue placeholder="Verification" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Jobs</SelectItem>
                                                <SelectItem value="verified">Verified Only</SelectItem>
                                                <SelectItem value="scraped">External Jobs</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 mb-1 block">Min Match Score</label>
                                        <Select value={minMatch.toString()} onValueChange={(v) => setMinMatch(parseInt(v))}>
                                            <SelectTrigger className="rounded-xl">
                                                <SelectValue placeholder="Min Match" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="0">Any</SelectItem>
                                                <SelectItem value="50">50%+</SelectItem>
                                                <SelectItem value="60">60%+</SelectItem>
                                                <SelectItem value="70">70%+</SelectItem>
                                                <SelectItem value="80">80%+</SelectItem>
                                                <SelectItem value="90">90%+</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 mb-1 block">Min Trust Score</label>
                                        <Select value={minAuthenticity.toString()} onValueChange={(v) => setMinAuthenticity(parseInt(v))}>
                                            <SelectTrigger className="rounded-xl">
                                                <SelectValue placeholder="Min Trust" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="0">Any</SelectItem>
                                                <SelectItem value="50">50%+</SelectItem>
                                                <SelectItem value="60">60%+</SelectItem>
                                                <SelectItem value="70">70%+</SelectItem>
                                                <SelectItem value="80">80%+</SelectItem>
                                                <SelectItem value="90">90%+</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>

                    {/* Job List */}
                    {loading ? (
                        <div className={`grid gap-4 ${selectedJob ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="bg-white rounded-2xl border-2 border-gray-100 p-6 space-y-3">
                                    <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                                    <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
                                    <div className="h-3 w-64 bg-gray-200 rounded animate-pulse" />
                                </div>
                            ))}
                        </div>
                    ) : filteredJobs.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                            <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 font-medium">No jobs found</p>
                            <p className="text-sm text-gray-400">
                                {activeTab === "recommended" 
                                    ? "Try adjusting your filters or adding more skills to your profile." 
                                    : "No company posted jobs match your filters."}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className={`grid gap-4 transition-all duration-300 ${selectedJob ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
                                {currentJobs.map((job, i) => (
                                    <motion.div
                                        key={job.job_id || i}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        onClick={() => setSelectedJob(job)}
                                        className={`bg-white rounded-2xl border-2 p-6 cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 overflow-hidden relative ${
                                            selectedJob?.job_id === job.job_id 
                                                ? 'border-[#6C63FF] shadow-lg ring-4 ring-[#6C63FF]/10' 
                                                : 'border-gray-200 hover:border-[#6C63FF]/40'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3 flex-1">
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6C63FF] to-[#5A52D5] flex items-center justify-center text-white font-bold text-lg shadow-inner">
                                                    {job.company?.[0] || "C"}
                                                </div>
                                                <div className="flex-1 w-full overflow-hidden">
                                                    <h3 className="font-bold text-gray-900 truncate" title={job.title}>{job.title || "Untitled Position"}</h3>
                                                    <p className="text-sm text-gray-500 flex items-center gap-1 truncate">
                                                        <Building2 className="w-3.5 h-3.5 flex-shrink-0" /> <span className="truncate">{job.company || "Unknown Company"}</span>
                                                    </p>
                                                    {job.source && job.source !== 'company_posted' && (
                                                        <span className="text-xs text-gray-400 capitalize mt-0.5 inline-block">
                                                            {job.source_display || job.source}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleSave(job.job_id);
                                                }}
                                                className="p-2 rounded-xl hover:bg-gray-100 transition-colors z-10 bg-white"
                                            >
                                                {savedJobs.has(job.job_id) ? (
                                                    <BookmarkCheck className="w-5 h-5 text-[#6C63FF]" />
                                                ) : (
                                                    <Bookmark className="w-5 h-5 text-gray-400" />
                                                )}
                                            </button>
                                        </div>

                                        <div className="flex flex-wrap gap-2 mb-4">
                                            <Badge variant="secondary" className="rounded-lg bg-gray-50 text-gray-600 font-medium border border-gray-200">
                                                <MapPin className="w-3 h-3 mr-1 text-gray-400" /> <span className="truncate max-w-[100px]">{job.location || "Remote"}</span>
                                            </Badge>
                                            {job.salary_min && (
                                                <Badge variant="secondary" className="rounded-lg bg-green-50 text-green-700 font-medium border border-green-200">
                                                    <DollarSign className="w-3 h-3 mr-0.5" /> 
                                                    {job.salary_max ? (
                                                       `${(job.salary_min / 1000).toFixed(0)}K–${(job.salary_max / 1000).toFixed(0)}K`
                                                    ) : (
                                                       `${(job.salary_min / 1000).toFixed(0)}K+`
                                                    )}
                                                </Badge>
                                            )}
                                            <Badge variant="secondary" className="rounded-lg bg-blue-50 text-blue-700 font-medium border border-blue-200 capitalize">
                                                <Clock className="w-3 h-3 mr-1" /> {job.job_type?.replace("_", " ") || "Full-time"}
                                            </Badge>
                                        </div>
                                        
                                        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                                          {getAuthenticityBadge(job.authenticity_score, job.is_verified, job.source)}
                                          {job.skill_match_percentage > 0 && (
                                              <span className="text-sm font-bold text-[#6C63FF] bg-[#6C63FF]/10 px-2 py-1 rounded-md flex items-center gap-1">
                                                  <TrendingUp className="w-3.5 h-3.5" />
                                                  {Math.round(job.skill_match_percentage)}% Match
                                              </span>
                                          )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                            
                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="flex justify-center items-center gap-4 py-4 mb-4">
                                    <Button
                                        variant="outline"
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        className="rounded-xl border-gray-200"
                                    >
                                        Previous
                                    </Button>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-gray-600">
                                            Page {currentPage} of {totalPages}
                                        </span>
                                    </div>
                                    <Button
                                        variant="outline"
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        className="rounded-xl border-gray-200"
                                    >
                                        Next
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Panel - Job Details */}
                <AnimatePresence>
                    {selectedJob && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="lg:w-1/2 bg-white rounded-2xl border border-gray-100 p-6 sticky top-6 h-fit max-h-[calc(100vh-120px)] overflow-y-auto"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-14 h-14 rounded-xl bg-[#6C63FF] flex items-center justify-center text-white font-bold text-lg">
                                        {selectedJob.company?.[0] || "C"}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">{selectedJob.title || "Untitled Position"}</h2>
                                        <p className="text-gray-600">{selectedJob.company || "Unknown Company"}</p>
                                        {selectedJob.source && selectedJob.source !== 'company_posted' && (
                                            <p className="text-xs text-gray-400 mt-1">Source: {selectedJob.source}</p>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedJob(null)}
                                    className="p-2 rounded-lg hover:bg-gray-100"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-3 mb-6">
                                <Badge variant="secondary" className="rounded-lg bg-gray-50 text-gray-600">
                                    <MapPin className="w-3 h-3 mr-1" /> {selectedJob.location || "Remote"}
                                </Badge>
                                {selectedJob.salary_min && (
                                    <Badge variant="secondary" className="rounded-lg bg-gray-50 text-gray-600">
                                        <DollarSign className="w-3 h-3 mr-1" /> 
                                        ${(selectedJob.salary_min / 1000).toFixed(0)}K–${(selectedJob.salary_max / 1000).toFixed(0)}K
                                    </Badge>
                                )}
                                <Badge variant="secondary" className="rounded-lg bg-gray-50 text-gray-600">
                                    <Clock className="w-3 h-3 mr-1" /> {selectedJob.job_type?.replace("_", " ") || "Full-time"}
                                </Badge>
                                {selectedJob.experience_level && (
                                    <Badge variant="secondary" className="rounded-lg bg-gray-50 text-gray-600">
                                        {selectedJob.experience_level} level
                                    </Badge>
                                )}
                                {getAuthenticityBadge(selectedJob.authenticity_score, selectedJob.is_verified, selectedJob.source)}
                            </div>

                            {selectedJob.skills && selectedJob.skills.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="font-semibold text-gray-900 mb-2">Required Skills</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedJob.skills.map((skill, idx) => (
                                            <Badge key={idx} className="bg-[#6C63FF]/10 text-[#6C63FF] rounded-lg">
                                                {skill}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="mb-6">
                                <h3 className="font-semibold text-gray-900 mb-2">Job Description</h3>
                                <p className="text-gray-600 whitespace-pre-wrap">{selectedJob.description || "No description provided."}</p>
                            </div>

                            {selectedJob.requirements && (
                                <div className="mb-6">
                                    <h3 className="font-semibold text-gray-900 mb-2">Requirements</h3>
                                    <p className="text-gray-600 whitespace-pre-wrap">{selectedJob.requirements}</p>
                                </div>
                            )}

                            <div className="flex gap-3 mt-6">
                                <Button
                                    onClick={() => handleApplyForJob(selectedJob.job_id)}
                                    className="flex-1 bg-[#6C63FF] text-white rounded-xl hover:bg-[#5A52D5]"
                                >
                                    {selectedJob.source === 'company_posted' ? "Apply Now" : "Apply on Website"}
                                </Button>
                                <Button
                                    onClick={() => toggleSave(selectedJob.job_id)}
                                    variant="outline"
                                    className="rounded-xl"
                                >
                                    {savedJobs.has(selectedJob.job_id) ? (
                                        <>
                                            <BookmarkCheck className="w-4 h-4 mr-2" />
                                            Saved
                                        </>
                                    ) : (
                                        <>
                                            <Bookmark className="w-4 h-4 mr-2" />
                                            Save
                                        </>
                                    )}
                                </Button>
                                {/* Analyze Skill Gap Button */}
                                <Button
                                    onClick={async () => {
                                        setAnalyzing(true);
                                        try {
                                            const result = await analyzeSkillGap(selectedJob.job_id);
                                            if (result.success) {
                                                setAnalysis(result);
                                                setShowAnalysis(true);
                                                toast.success('Skill gap analysis complete!');
                                            } else {
                                                toast.error(result.error || 'Failed to analyze skill gap');
                                            }
                                        } catch (error) {
                                            console.error('Analysis error:', error);
                                            toast.error(error.error || 'Failed to analyze skill gap');
                                        } finally {
                                            setAnalyzing(false);
                                        }
                                    }}
                                    disabled={analyzing}
                                    variant="outline"
                                    className="rounded-xl"
                                >
                                    <Brain className="w-4 h-4 mr-2" />
                                    {analyzing ? "Analyzing..." : "Analyze Skill Gap"}
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Skill Gap Modal */}
            <AnimatePresence>
                {showAnalysis && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        onClick={() => setShowAnalysis(false)}
                    >
                        <div 
                            className="max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <SkillGap 
                                analysis={analysis} 
                                onBack={() => setShowAnalysis(false)} 
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </DashboardShell>
    );
}