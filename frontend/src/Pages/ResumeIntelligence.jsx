import React, { useState, useEffect } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { motion } from "framer-motion";
import { Upload, FileText, CheckCircle, AlertTriangle, Zap, RefreshCw, Eye, Download, X, Trash2, Replace } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { uploadResume, getCurrentUser, getStoredUser, getResumeUploadStatus, getStoredResumeAnalysis } from "@/utils/api";
import toast from "react-hot-toast";

export default function ResumeIntelligence() {
    const [user, setUser] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [resume, setResume] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [uploadStats, setUploadStats] = useState({ remaining: 3, used: 0, limit: 3 });
    
    // New states for premium upload flow
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [startAnalysis, setStartAnalysis] = useState(false);
    const [timer, setTimer] = useState(null);
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        const loadUserData = async () => {
            let currentUser = getStoredUser();
            
            if (!currentUser) {
                try {
                    const result = await getCurrentUser();
                    if (result.success && result.user) {
                        currentUser = result.user;
                        localStorage.setItem('careerai_user', JSON.stringify(currentUser));
                    }
                } catch (error) {
                    console.error("Failed to fetch user:", error);
                }
            }
            
            if (currentUser) {
                setUser(currentUser);
                
                // Check if user has a stored resume
                if (currentUser.resume_url || currentUser.ats_score) {
                    loadStoredResumeAnalysis(currentUser);
                }
                
                // Get upload status
                try {
                    const status = await getResumeUploadStatus(currentUser.user_id);
                    if (status.success) {
                        setUploadStats(status.rate_limit);
                    }
                } catch (error) {
                    console.error("Failed to get upload status:", error);
                }
            }
            
            setIsLoading(false);
        };
        
        loadUserData();
        
        // Cleanup timer on unmount
        return () => {
            if (timer) clearTimeout(timer);
        };
    }, []);

    // Countdown effect when file is selected
    useEffect(() => {
        if (!selectedFile || startAnalysis) return;

        let c = 5;
        setCountdown(5);
        
        const interval = setInterval(() => {
            c--;
            setCountdown(c);
            if (c === 0) clearInterval(interval);
        }, 1000);

        return () => clearInterval(interval);
    }, [selectedFile, startAnalysis]);

    const loadStoredResumeAnalysis = async (userData) => {
        try {
            const result = await getStoredResumeAnalysis(userData.user_id);
            if (result.success && result.data) {
                setResume({
                    id: userData.user_id,
                    user_email: userData.email || '',
                    file_url: result.data.resume_url,
                    ats_score: result.data.ats_score || 0,
                    experience_years: result.data.experience_years || 0,
                    education: result.data.education || 'Education information available',
                    summary: result.data.summary || 'Resume analysis complete.',
                    strengths: result.data.strengths || [],
                    weaknesses: result.data.weaknesses || [],
                    skills_categorized: result.data.skills_categorized || {}
                });
            }
        } catch (error) {
            console.error("Failed to load stored resume:", error);
        }
    };

    const uploadAndAnalyze = async (file) => {
        setUploading(true);
        setAnalyzing(true);
        setError(null);

        try {
            const userId = user?.user_id || null;
            console.log("📤 Uploading resume for user:", userId);
            
            const result = await uploadResume(file, userId);
            console.log("📥 Upload result:", result);

            if (result.success) {
                const resumeUrl = result.data.resume_url;
                const publicId = result.data.resume_public_id;
                
                console.log("✅ Resume URL:", resumeUrl);
                console.log("✅ Public ID:", publicId);
                
                setResume({
                    id: result.user_id || `res-${Date.now()}`,
                    user_email: user?.email || '',
                    file_url: resumeUrl,
                    ats_score: result.data.ats_score || 0,
                    experience_years: result.data.experience_years || 0,
                    education: result.data.education || 'Education information available',
                    summary: result.data.summary || 'Resume analysis complete.',
                    strengths: result.data.strengths || [],
                    weaknesses: result.data.weaknesses || [],
                    skills_categorized: result.data.skills_categorized || {}
                });
                
                // Update localStorage with new resume URL
                const storedUser = getStoredUser();
                if (storedUser) {
                    const updatedUser = {
                        ...storedUser,
                        ats_score: result.data.ats_score,
                        skills: result.data.extracted_skills,
                        resume_url: resumeUrl,
                        resume_public_id: publicId,
                        resume_analyzed_at: new Date().toISOString(),
                        experience_years: result.data.experience_years,
                        summary: result.data.summary,
                        strengths: result.data.strengths,
                        weaknesses: result.data.weaknesses,
                        skills_categorized: result.data.skills_categorized
                    };
                    localStorage.setItem('careerai_user', JSON.stringify(updatedUser));
                    setUser(updatedUser);
                }
                
                // Update upload stats
                if (result.rate_limit) {
                    setUploadStats(result.rate_limit);
                }
                
                toast.success('Resume analyzed successfully!');
            } else {
                throw new Error(result.error || 'Analysis failed');
            }
        } catch (error) {
            console.error('❌ Upload error:', error);
            const errorMsg = error.error || error.message || 'Failed to analyze resume. Please try again.';
            setError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setUploading(false);
            setAnalyzing(false);
            setStartAnalysis(false);
            setSelectedFile(null);
            setPreviewUrl(null);
            if (timer) clearTimeout(timer);
        }
    };

    const handleRemoveResume = () => {
        // Clear from localStorage
        const storedUser = getStoredUser();
        if (storedUser) {
            const updatedUser = { ...storedUser };
            delete updatedUser.resume_url;
            delete updatedUser.resume_public_id;
            delete updatedUser.resume_analyzed_at;
            delete updatedUser.ats_score;
            delete updatedUser.skills;
            delete updatedUser.experience_years;
            delete updatedUser.summary;
            delete updatedUser.strengths;
            delete updatedUser.weaknesses;
            delete updatedUser.skills_categorized;
            localStorage.setItem('careerai_user', JSON.stringify(updatedUser));
            setUser(updatedUser);
        }
        
        // Clear resume state
        setResume(null);
        toast.success('Resume removed successfully');
    };

    const handleUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (uploadStats.remaining <= 0) {
            toast.error(`You have reached the maximum of ${uploadStats.limit} uploads per day. Please try again tomorrow.`);
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            toast.error('File too large. Maximum size is 10MB.');
            return;
        }

        const allowedTypes = ['.pdf', '.docx', '.doc', '.txt'];
        const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        if (!allowedTypes.includes(fileExt)) {
            toast.error('Invalid file type. Please upload PDF, DOCX, DOC, or TXT files.');
            return;
        }

        // Set selected file and create preview
        setSelectedFile(file);
        setStartAnalysis(false);
        
        // Create preview URL
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);

        // Start 5 second timer
        const timeout = setTimeout(() => {
            setStartAnalysis(true);
            uploadAndAnalyze(file);
        }, 5000);

        setTimer(timeout);
    };

    const handleCancel = () => {
        if (timer) clearTimeout(timer);
        
        // Clean up preview URL
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        
        setSelectedFile(null);
        setPreviewUrl(null);
        setStartAnalysis(false);
        setCountdown(5);
    };

    const openResume = () => {
        if (resume?.file_url) {
            window.open(resume.file_url, '_blank');
        }
    };

    const downloadResume = () => {
        if (resume?.file_url) {
            window.open(resume.file_url, '_blank');
        }
    };

    if (isLoading) {
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
        <DashboardShell user={user} title="Resume Intelligence" currentPage="ResumeIntelligence">
            {/* Aesthetic Page Header */}
            {/* <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative mb-8 rounded-[2rem] bg-gradient-to-br from-[#6C63FF]/10 via-purple-500/5 to-transparent p-8 border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden backdrop-blur-xl"
            >
                <div className="absolute top-0 right-0 w-72 h-72 bg-purple-400/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>
                <div className="relative z-10">
                    <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-[#6C63FF] to-purple-600 mb-2 tracking-tight">AI Resume Intelligence</h1>
                    <p className="text-gray-600 font-medium max-w-2xl">Unlock deep insights into your professional profile. Our advanced AI acts as an expert recruiter, meticulously analyzing your skills and formatting to ensure you stand out.</p>
                </div>
            </motion.div> */}

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Upload Section - Premium Flow */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-6 relative overflow-hidden group hover:shadow-[0_8px_30px_rgb(108,99,255,0.1)] transition-all duration-500"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#6C63FF]/10 to-transparent rounded-bl-[100%] pointer-events-none"></div>
                    <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2 text-lg">
                        <Upload className="w-5 h-5 text-[#6C63FF]" />
                        Resume Manager
                    </h3>
                    
                    {/* Upload Stats */}
                    <div className="mb-5 p-4 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600 font-medium">Daily Uploads</span>
                            <span className={`font-bold px-3 py-1 rounded-full ${uploadStats.remaining === 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                {uploadStats.remaining} / {uploadStats.limit} left
                            </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5 mt-3 overflow-hidden">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${((uploadStats.limit - uploadStats.remaining) / uploadStats.limit) * 100}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className="bg-gradient-to-r from-[#6C63FF] to-purple-500 h-full rounded-full"
                            />
                        </div>
                    </div>
                    
                    {/* Premium Upload Flow - Priority: Selected File > Stored Resume > Upload UI */}
                    {selectedFile ? (
                        // 🔴 TEMPORARY UPLOAD PREVIEW
                        <div className="relative border-2 border-[#6C63FF]/50 rounded-2xl p-5 bg-gradient-to-br from-[#6C63FF]/5 to-purple-500/5 shadow-inner">
                            {/* Cancel Button */}
                            <button
                                onClick={handleCancel}
                                className="absolute top-3 right-3 bg-white hover:bg-red-50 text-red-500 shadow-sm rounded-full p-2 transition-all z-10 border border-red-100"
                                disabled={uploading || analyzing}
                            >
                                <X className="w-4 h-4" />
                            </button>

                            {/* File Preview */}
                            {selectedFile.type === "application/pdf" ? (
                                <div className="relative rounded-xl overflow-hidden shadow-sm border border-gray-200/50">
                                    <iframe
                                        src={previewUrl}
                                        className="w-full h-48 opacity-90"
                                        title="Resume Preview"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/20 pointer-events-none"></div>
                                </div>
                            ) : (
                                <div className="text-center py-10 bg-white/50 rounded-xl backdrop-blur-sm border border-white">
                                    <div className="relative w-16 h-16 mx-auto mb-4">
                                        <div className="absolute inset-0 bg-[#6C63FF]/20 rounded-full animate-ping"></div>
                                        <div className="relative flex items-center justify-center w-full h-full bg-white rounded-full shadow-sm border border-[#6C63FF]/20">
                                            <FileText className="w-8 h-8 text-[#6C63FF]" />
                                        </div>
                                    </div>
                                    <p className="text-sm font-bold text-gray-800">{selectedFile.name}</p>
                                    <p className="text-xs text-gray-500 mt-1 font-medium">
                                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                </div>
                            )}

                            {/* Timer / Analyzing Status */}
                            {uploading || analyzing ? (
                                <div className="mt-5 text-center space-y-3 p-4 bg-white/80 rounded-xl shadow-sm border border-white">
                                    <motion.div 
                                        animate={{ rotate: 360 }}
                                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                        className="inline-block"
                                    >
                                        <div className="w-8 h-8 border-4 border-[#6C63FF]/30 border-t-[#6C63FF] rounded-full"></div>
                                    </motion.div>
                                    <p className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#6C63FF] to-purple-600">
                                        {analyzing ? "AI is analyzing depth & semantics..." : "Securely uploading..."}
                                    </p>
                                </div>
                            ) : (
                                <div className="mt-5 text-center">
                                    <div className="flex items-center justify-center gap-3 mb-3">
                                        <div className="w-full bg-white rounded-full h-2 flex-1 shadow-inner border border-gray-100 overflow-hidden">
                                            <motion.div 
                                                className="bg-gradient-to-r from-[#6C63FF] to-purple-500 h-full rounded-full"
                                                animate={{ width: `${((5 - countdown) / 5) * 100}%` }}
                                                transition={{ duration: 1, ease: "linear" }}
                                            />
                                        </div>
                                        <span className="text-sm font-bold text-[#6C63FF] bg-white px-2 py-0.5 rounded-md shadow-sm border border-purple-100">{countdown}s</span>
                                    </div>
                                    <p className="text-xs font-medium text-gray-500 mb-3">
                                        Auto-analyzing in {countdown} second{countdown !== 1 ? 's' : ''}...
                                    </p>
                                    <button
                                        onClick={() => {
                                            if (timer) clearTimeout(timer);
                                            setStartAnalysis(true);
                                            uploadAndAnalyze(selectedFile);
                                        }}
                                        className="w-full py-2 bg-[#6C63FF] hover:bg-[#5b54e5] text-white rounded-xl text-sm font-bold shadow-md shadow-[#6C63FF]/20 transition-all active:scale-95"
                                    >
                                        Analyze Instantly
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : resume?.file_url ? (
                        // 🟢 DEFAULT STORED RESUME VIEW (PERSISTENT)
                        <div className="relative border border-green-200/50 rounded-2xl p-5 bg-gradient-to-br from-green-50/50 to-emerald-50/50 shadow-sm backdrop-blur-sm group/resume">
                            {/* Remove Button */}
                            <button
                                onClick={handleRemoveResume}
                                className="absolute -top-2 -right-2 bg-white hover:bg-red-50 text-red-500 shadow-md rounded-full p-2 transition-all opacity-0 group-hover/resume:opacity-100 border border-gray-100 z-10"
                                title="Remove Resume"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>

                            {/* PDF Preview */}
                            <div className="rounded-xl overflow-hidden shadow-md border border-gray-200/50 relative">
                                <iframe
                                    src={`${resume.file_url}?fl_attachment=false`}
                                    className="w-full h-[14rem]"
                                    title="Stored Resume Preview"
                                />
                                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-gray-900/10 to-transparent pointer-events-none"></div>
                            </div>
                            
                            {/* Replace Resume Button */}
                            <label className="block mt-4">
                                <div className="w-full py-2.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-xl text-sm font-bold shadow-sm transition-all text-center cursor-pointer flex items-center justify-center gap-2 group-hover/resume:border-[#6C63FF]/30 group-hover/resume:text-[#6C63FF]">
                                    <Replace className="w-4 h-4" />
                                    Replace Resume
                                </div>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept=".pdf,.docx,.doc,.txt"
                                    onChange={handleUpload}
                                    disabled={uploadStats.remaining === 0}
                                />
                            </label>
                        </div>
                    ) : (
                        // 🟡 UPLOAD UI (No resume exists)
                        <label className="block cursor-pointer h-[18rem]">
                            <div className={`h-full flex flex-col justify-center items-center border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
                                uploadStats.remaining === 0
                                    ? "border-gray-300 bg-gray-50 cursor-not-allowed opacity-50"
                                    : "border-[#6C63FF]/30 hover:border-[#6C63FF] bg-purple-50/30 hover:bg-purple-50/80 shadow-sm hover:shadow-md"
                            }`}>
                                <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                                    <FileText className="w-8 h-8 text-[#6C63FF]" />
                                </div>
                                <p className="text-base font-bold text-gray-800">Drag & drop your resume</p>
                                <p className="text-sm font-medium text-gray-500 mt-1">or click to browse files</p>
                                <p className="text-xs text-gray-400 mt-3 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">PDF, DOCX, TXT up to 10MB</p>
                            </div>
                            <input
                                type="file"
                                className="hidden"
                                accept=".pdf,.docx,.doc,.txt"
                                onChange={handleUpload}
                                disabled={uploadStats.remaining === 0}
                            />
                        </label>
                    )}
                    
                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-4 p-3 bg-red-50 text-sm font-medium text-red-600 rounded-xl border border-red-100 flex items-start gap-2"
                        >
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                            {error}
                        </motion.div>
                    )}
                </motion.div>

                {/* ATS Score */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-6 relative overflow-hidden flex flex-col items-center justify-center hover:shadow-[0_8px_30px_rgb(108,99,255,0.1)] transition-all duration-500"
                >
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-50/50 pointer-events-none"></div>
                    <h3 className="font-bold text-gray-900 mb-2 w-full text-left text-lg z-10">ATS Compatibility</h3>
                    <p className="text-sm text-gray-500 w-full text-left mb-6 z-10">How well your resume passes filtering systems</p>
                    
                    <div className="relative w-40 h-40 flex items-center justify-center z-10 group">
                        {/* Glow effect based on score */}
                        <div className={`absolute inset-0 rounded-full blur-2xl opacity-40 transition-all duration-700 group-hover:opacity-70 ${resume?.ats_score >= 80 ? 'bg-green-400' : resume?.ats_score >= 60 ? 'bg-amber-400' : resume?.ats_score ? 'bg-red-400' : 'bg-gray-200'}`}></div>
                        
                        <svg className="w-full h-full transform -rotate-90 relative z-10" viewBox="0 0 36 36">
                            <path
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="#F3F4F6"
                                strokeWidth="2.5"
                            />
                            <motion.path
                                initial={{ strokeDasharray: "0, 100" }}
                                animate={{ strokeDasharray: `${resume?.ats_score || 0}, 100` }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke={resume?.ats_score >= 80 ? "#10B981" : resume?.ats_score >= 60 ? "#F59E0B" : resume?.ats_score ? "#EF4444" : "#D1D5DB"}
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                className="drop-shadow-sm"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                            <span className="text-4xl font-black text-gray-900 tracking-tighter">
                                {resume?.ats_score || 0}
                            </span>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Score</span>
                        </div>
                    </div>
                    
                    <div className="mt-6 z-10 text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                            resume?.ats_score >= 80 ? "bg-green-100 text-green-700" :
                            resume?.ats_score >= 60 ? "bg-amber-100 text-amber-700" :
                            resume?.ats_score ? "bg-red-100 text-red-700" :
                            "bg-gray-100 text-gray-500"
                        }`}>
                            {resume?.ats_score >= 80 ? "Excellent Match" :
                             resume?.ats_score >= 60 ? "Needs Polish" :
                             resume?.ats_score ? "Major Improvements Needed" :
                             "Pending Analysis"}
                        </span>
                    </div>
                </motion.div>

                {/* Experience & Summary */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-6 relative overflow-hidden flex flex-col hover:shadow-[0_8px_30px_rgb(108,99,255,0.1)] transition-all duration-500"
                >
                    <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2 text-lg">
                        <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
                        Executive Brief
                    </h3>
                    
                    <div className="flex flex-col gap-3 flex-1">
                        {resume?.experience_years > 0 ? (
                            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-100 shadow-sm">
                                <span className="text-sm font-medium text-gray-500">Total Experience</span>
                                <span className="text-xl font-black text-[#6C63FF]">{resume.experience_years}+ <span className="text-sm font-bold text-gray-400">YRS</span></span>
                            </div>
                        ) : (
                            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                <span className="text-sm font-medium text-gray-500">Experience</span>
                                <span className="text-sm font-bold text-gray-400">Entry Level</span>
                            </div>
                        )}
                        
                        {resume?.education && (
                            <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Education</div>
                                <div className="text-sm font-bold text-gray-800 leading-snug">{resume.education}</div>
                            </div>
                        )}
                        
                        <div className="p-4 bg-gradient-to-br from-purple-50/50 to-blue-50/50 rounded-2xl border border-purple-100/50 shadow-sm flex-1 flex flex-col">
                            <div className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div> AI Summary
                            </div>
                            <div className="text-sm font-medium text-gray-700 leading-relaxed italic">
                                "{resume?.summary ? resume.summary.substring(0, 180) + (resume.summary.length > 180 ? "..." : "") : "Upload a resume to generate an AI professional summary."}"
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* In-depth Analysis Section (Only visible when resume exists) */}
            {resume && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                >
                    {/* Strengths & Weaknesses */}
                    <div className="grid md:grid-cols-2 gap-6 mt-6">
                        <motion.div
                            whileHover={{ y: -5 }}
                            className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-7 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-bl-[100%] pointer-events-none"></div>
                            <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2 text-xl relative z-10">
                                <div className="p-2 bg-green-100 rounded-xl">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                </div>
                                Notable Strengths
                            </h3>
                            <div className="space-y-3 relative z-10">
                                {resume.strengths?.length > 0 ? (
                                    resume.strengths.map((s, i) => (
                                        <motion.div 
                                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + (i * 0.1) }}
                                            key={i} className="flex items-start gap-3 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:border-green-200 transition-colors"
                                        >
                                            <div className="mt-0.5 bg-green-50 rounded-full p-1 border border-green-100">
                                                <CheckCircle className="w-3 h-3 text-green-600" />
                                            </div>
                                            <p className="text-sm font-medium text-gray-700 leading-relaxed">{s}</p>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="p-6 text-center border border-dashed rounded-2xl border-gray-200">
                                        <p className="text-sm font-medium text-gray-400">No specific strengths identified yet.</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        <motion.div
                            whileHover={{ y: -5 }}
                            className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-7 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-[100%] pointer-events-none"></div>
                            <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2 text-xl relative z-10">
                                <div className="p-2 bg-amber-100 rounded-xl">
                                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                                </div>
                                Areas for Improvement
                            </h3>
                            <div className="space-y-3 relative z-10">
                                {resume.weaknesses?.length > 0 ? (
                                    resume.weaknesses.map((w, i) => (
                                        <motion.div 
                                            initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + (i * 0.1) }}
                                            key={i} className="flex items-start gap-3 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:border-amber-200 transition-colors"
                                        >
                                            <div className="mt-0.5 bg-amber-50 rounded-full p-1 border border-amber-100">
                                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                            </div>
                                            <p className="text-sm font-medium text-gray-700 leading-relaxed">{w}</p>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="p-6 text-center border border-dashed rounded-2xl border-gray-200">
                                        <p className="text-sm font-medium text-gray-400">No major improvement areas identified.</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-6 mt-6">
                        {/* 100% Accurate AI Skill Extraction */}
                        {(resume?.skills_categorized?.technical_skills?.length > 0 || resume?.skills_categorized?.soft_skills?.length > 0) && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                                className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-8"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="font-bold text-gray-900 text-xl flex items-center gap-2">
                                        <div className="p-2 bg-blue-100 rounded-xl">
                                            <Zap className="w-5 h-5 text-blue-600" />
                                        </div>
                                        Extracted Expertise
                                    </h3>
                                    <span className="text-xs font-bold text-[#6C63FF] bg-[#6C63FF]/10 px-3 py-1 rounded-full border border-[#6C63FF]/20">100% AI Analyzed</span>
                                </div>
                                
                                <div className="space-y-6">
                                    {resume.skills_categorized.technical_skills?.length > 0 && (
                                        <div>
                                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                Technical Core <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-[10px]">{resume.skills_categorized.technical_skills.length}</span>
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {resume.skills_categorized.technical_skills.map((skill, i) => (
                                                    <motion.div 
                                                        whileHover={{ scale: 1.05, y: -2 }}
                                                        key={i} 
                                                        className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 text-gray-800 px-3.5 py-1.5 rounded-xl font-bold text-sm shadow-sm hover:shadow-md hover:border-[#6C63FF]/30 transition-all cursor-default"
                                                    >
                                                        {skill}
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {resume.skills_categorized.soft_skills?.length > 0 && (
                                        <div>
                                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2 mt-2">
                                                Soft Skills <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-[10px]">{resume.skills_categorized.soft_skills.length}</span>
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {resume.skills_categorized.soft_skills.map((skill, i) => (
                                                    <motion.div 
                                                        whileHover={{ scale: 1.05, y: -2 }}
                                                        key={i} 
                                                        className="bg-green-50/80 border border-green-200/60 text-green-700 px-3.5 py-1.5 rounded-xl font-bold text-sm shadow-sm transition-all cursor-default"
                                                    >
                                                        {skill}
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* Semantic Domain Intelligence */}
                        {resume?.skills_categorized?.domain_insights && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7 }}
                                className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-[2rem] border border-gray-700 shadow-2xl p-8 text-white relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-64 h-64 bg-[#6C63FF]/20 rounded-full blur-[80px] pointer-events-none"></div>
                                <div className="absolute bottom-0 left-0 w-64 h-64 bg-fuchsia-500/20 rounded-full blur-[80px] pointer-events-none"></div>
                                
                                <div className="relative z-10 flex flex-col h-full">
                                    <h3 className="font-extrabold text-white text-xl mb-6 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md border border-white/10">
                                                <Zap className="w-5 h-5 text-fuchsia-400 fill-fuchsia-400" />
                                            </div>
                                            Domain Intelligence
                                        </div>
                                    </h3>
                                    
                                    {/* Primary Domain Card */}
                                    <div className="p-5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 mb-6 relative overflow-hidden group">
                                        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-[#6C63FF] to-fuchsia-400"></div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Primary Specialization</p>
                                        <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">
                                            {resume.skills_categorized.domain_insights.primary_domain}
                                        </p>
                                        <div className="mt-4 flex items-center justify-between text-sm">
                                            <span className="font-medium text-gray-300 flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                                                Level: <span className="text-white font-bold">{resume.skills_categorized.domain_insights.strength_level}</span>
                                            </span>
                                            <span className="font-black text-fuchsia-400 text-lg">
                                                {resume.skills_categorized.domain_insights.primary_score}%
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {/* Top Domains List */}
                                    <div className="flex-1">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Semantic Competency Profile</p>
                                        <div className="space-y-4">
                                            {Object.entries(resume.skills_categorized.domain_insights.all_domains || {})
                                                .slice(0, 4)
                                                .map(([domain, score], index) => (
                                                    <div key={domain} className="group/item">
                                                        <div className="flex items-center justify-between mb-1.5">
                                                            <span className="text-sm font-semibold text-gray-200 group-hover/item:text-white transition-colors">{domain}</span>
                                                            <span className="text-xs font-bold text-gray-400 group-hover/item:text-fuchsia-300 transition-colors">{score}%</span>
                                                        </div>
                                                        <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                                                            <motion.div 
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${score}%` }}
                                                                transition={{ delay: 0.8 + (index * 0.2), duration: 1, ease: "easeOut" }}
                                                                className={`h-full rounded-full ${index === 0 ? 'bg-gradient-to-r from-[#6C63FF] to-fuchsia-400' : 'bg-gray-400 group-hover/item:bg-fuchsia-400 line-transition'}`}
                                                            />
                                                        </div>
                                                    </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            )}
        </DashboardShell>
    );
}