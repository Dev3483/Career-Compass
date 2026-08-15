import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { motion, AnimatePresence } from "framer-motion";
import { getJobDetails, applyForJob, saveJob, unsaveJob, getSavedJobs, analyzeSkillGap } from "@/utils/api";
import { toast } from "react-hot-toast";
import { MapPin, DollarSign, Clock, Building2, Bookmark, BookmarkCheck, Shield, TrendingUp, Brain, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import SkillGap from "@/components/SkillGap";

export default function JobDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, isAuthenticated, isLoadingAuth } = useAuth();
    
    const [selectedJob, setSelectedJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [savedJobs, setSavedJobs] = useState(new Set());
    
    // Skill Gap Analysis State
    const [analysis, setAnalysis] = useState(null);
    const [showAnalysis, setShowAnalysis] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);

    useEffect(() => {
        if (id && isAuthenticated) {
            fetchJobDetails();
            fetchSavedJobs();
        } else if (!isLoadingAuth && !isAuthenticated) {
            // Wait for auth to resolve before bouncing if not logged in
        }
    }, [id, isAuthenticated, isLoadingAuth]);

    const fetchJobDetails = async () => {
        setLoading(true);
        try {
            const response = await getJobDetails(id);
            if (response.success && response.job) {
                setSelectedJob(response.job);
            } else {
                toast.error(response.error || "Failed to load job details");
            }
        } catch (error) {
            console.error("Fetch job error:", error);
            toast.error(error?.error || "Failed to load job details");
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
    
    if (isLoadingAuth || loading) {
        return (
            <DashboardShell user={user} title="Job Details">
                <div className="min-h-[50vh] flex flex-col items-center justify-center">
                    <div className="flex gap-1 mb-4">
                        <div className="w-3 h-3 rounded-full bg-[#6C63FF] animate-bounce" />
                        <div className="w-3 h-3 rounded-full bg-[#6C63FF] animate-bounce" style={{ animationDelay: "0.2s" }} />
                        <div className="w-3 h-3 rounded-full bg-[#6C63FF] animate-bounce" style={{ animationDelay: "0.4s" }} />
                    </div>
                </div>
            </DashboardShell>
        );
    }
    
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
                <div className="text-center bg-white p-10 rounded-2xl border border-gray-100 shadow-sm max-w-md w-full">
                    <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Login Required</h2>
                    <p className="text-gray-500 mb-6">Please log in to view job details and apply.</p>
                    <Button onClick={() => navigate('/login')} className="bg-[#6C63FF] hover:bg-[#5A52D5] text-white w-full rounded-xl">
                        Log In Now
                    </Button>
                </div>
            </div>
        );
    }

    if (!selectedJob) {
        return (
             <DashboardShell user={user} title="Job Details">
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 mt-6">
                    <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">Job not found or has been removed.</p>
                    <Button 
                        onClick={() => window.close()} 
                        className="mt-4 bg-[#6C63FF] hover:bg-[#5A52D5] text-white rounded-xl"
                    >
                        Close Current Tab
                    </Button>
                </div>
             </DashboardShell>
        );
    }

    return (
        <DashboardShell user={user} title="Job Details" currentPage="JobDetails">
            <div className="max-w-4xl mx-auto pb-12">
                <Button 
                    variant="ghost" 
                    className="mb-4 text-gray-500 hover:text-gray-900 rounded-xl"
                    onClick={() => {
                        if (window.history.length > 1) {
                            navigate(-1);
                        } else {
                            window.close();
                        }
                    }}
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                </Button>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8"
                >
                    <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-[#6C63FF] flex items-center justify-center text-white font-bold text-2xl shadow-inner">
                                {selectedJob.company?.[0] || "C"}
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight">{selectedJob.title || "Untitled Position"}</h1>
                                <p className="text-lg text-gray-600 mt-1">{selectedJob.company || "Unknown Company"}</p>
                                {selectedJob.source && selectedJob.source !== 'company_posted' && (
                                    <p className="text-sm text-gray-400 mt-1 capitalize">Source: {selectedJob.source_display || selectedJob.source}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3 mb-8">
                        <Badge variant="secondary" className="rounded-lg py-1.5 px-3 bg-gray-50 text-gray-700 text-sm border border-gray-200 font-medium">
                            <MapPin className="w-4 h-4 mr-2 text-gray-400" /> {selectedJob.location || "Remote"}
                        </Badge>
                        {selectedJob.salary_min && (
                            <Badge variant="secondary" className="rounded-lg py-1.5 px-3 bg-green-50 text-green-700 text-sm border border-green-200 font-medium">
                                <DollarSign className="w-4 h-4 mr-0.5" /> 
                                {(selectedJob.salary_min / 1000).toFixed(0)}K–{(selectedJob.salary_max / 1000).toFixed(0)}K
                            </Badge>
                        )}
                        <Badge variant="secondary" className="rounded-lg py-1.5 px-3 bg-blue-50 text-blue-700 text-sm border border-blue-200 font-medium capitalize">
                            <Clock className="w-4 h-4 mr-2" /> {selectedJob.job_type?.replace("_", " ") || "Full-time"}
                        </Badge>
                        {selectedJob.experience_level && (
                            <Badge variant="secondary" className="rounded-lg py-1.5 px-3 bg-purple-50 text-purple-700 text-sm border border-purple-200 font-medium capitalize">
                                {selectedJob.experience_level} Level
                            </Badge>
                        )}
                        {getAuthenticityBadge(selectedJob.authenticity_score, selectedJob.is_verified, selectedJob.source)}
                    </div>

                    {selectedJob.skills && selectedJob.skills.length > 0 && (
                        <div className="mb-8 p-6 bg-[#F8FAFC] rounded-2xl border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Brain className="w-5 h-5 text-[#6C63FF]" /> Required Skills
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {selectedJob.skills.map((skill, idx) => (
                                    <Badge key={idx} className="bg-white text-gray-700 border border-gray-200 px-3 py-1 shadow-sm rounded-lg hover:bg-[#6C63FF]/5 hover:text-[#6C63FF] hover:border-[#6C63FF]/20 transition-colors">
                                        {skill}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mb-8">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Job Description</h3>
                        <div className="text-gray-600 space-y-4 leading-relaxed whitespace-pre-wrap text-base">
                            {selectedJob.description || "No description provided."}
                        </div>
                    </div>

                    {selectedJob.requirements && (
                        <div className="mb-8">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Requirements</h3>
                            <div className="text-gray-600 space-y-4 leading-relaxed whitespace-pre-wrap text-base">
                                {selectedJob.requirements}
                            </div>
                        </div>
                    )}

                    {/* Action Bar */}
                    <div className="sticky bottom-6 bg-white/80 backdrop-blur-xl p-4 rounded-2xl border border-gray-200 shadow-xl flex flex-wrap sm:flex-nowrap gap-3 mt-10">
                        <Button
                            onClick={() => handleApplyForJob(selectedJob.job_id)}
                            className="flex-1 bg-[#6C63FF] text-white rounded-xl hover:bg-[#5A52D5] shadow-md shadow-[#6C63FF]/20 text-lg py-6"
                        >
                            {selectedJob.source === 'company_posted' ? "Apply Now" : "Apply on Website"}
                        </Button>
                        <Button
                            onClick={() => toggleSave(selectedJob.job_id)}
                            variant="outline"
                            className={`rounded-xl py-6 px-6 ${savedJobs.has(selectedJob.job_id) ? 'bg-[#6C63FF]/5 text-[#6C63FF] border-[#6C63FF]/30' : 'text-gray-600 border-gray-200'}`}
                        >
                            {savedJobs.has(selectedJob.job_id) ? (
                                <>
                                    <BookmarkCheck className="w-5 h-5 mr-2" />
                                    Saved
                                </>
                            ) : (
                                <>
                                    <Bookmark className="w-5 h-5 mr-2" />
                                    Save for Later
                                </>
                            )}
                        </Button>
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
                            className="rounded-xl py-6 px-6 bg-[#F8FAFC] text-gray-700 border-gray-200 hover:bg-gray-100"
                        >
                            <Brain className="w-5 h-5 mr-2 text-[#6C63FF]" />
                            {analyzing ? "Analyzing..." : "Analyze Match"}
                        </Button>
                    </div>
                </motion.div>
            </div>

            {/* Skill Gap Modal */}
            <AnimatePresence>
                {showAnalysis && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setShowAnalysis(false)}
                    >
                        <div 
                            className="max-w-4xl w-full max-h-[90vh] overflow-y-auto bg-transparent border-none shadow-none"
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
