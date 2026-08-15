import React, { useState, useEffect } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { motion } from "framer-motion";
import { PlusCircle, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-hot-toast";
import { postJob } from "@/utils/api";

export default function PostJob() {
    const navigate = useNavigate();
    const { user, isAuthenticated, isLoadingAuth } = useAuth();
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [form, setForm] = useState({
        title: "",
        company: "",
        location: "",
        salary_min: "",
        salary_max: "",
        type: "full_time",
        description: "",
        requirements: "",
        skills: "",
        experience_level: "mid",
        category: "", // Removed default "engineering"
    });

    useEffect(() => {
        if (user) {
            setForm(f => ({ 
                ...f, 
                company: user.company_name || user.full_name || ""
            }));
        }
    }, [user]);

    const validateForm = () => {
        const errors = {};

        // Job Title
        if (!form.title.trim()) {
            errors.title = "Job title is required";
        } else if (!/^[A-Za-z\s\-\/()]+$/.test(form.title)) {
            errors.title = "Job title contains invalid characters (no numbers allowed)";
        } else if (form.title.length < 3) {
            errors.title = "Job title too short (min 3 chars)";
        } else if (form.title.length > 80) {
            errors.title = "Job title too long (max 80 chars)";
        }

        // Location
        if (!form.location.trim()) {
            errors.location = "Location is required";
        } else if (!/^[A-Za-z\s,]+$/.test(form.location)) {
            errors.location = "Location contains invalid characters";
        }

        // Category
        if (!form.category) {
            errors.category = "Please select a category";
        }

        // Salary
        if (form.salary_min && form.salary_max) {
            if (Number(form.salary_min) > Number(form.salary_max)) {
                errors.salary = "Min salary cannot be greater than max salary";
            }
        }

        // Description
        if (!form.description.trim()) {
            errors.description = "Description is required";
        } else if (form.description.length < 50) {
            errors.description = "Description must be at least 50 characters";
        }

        // Skills
        if (form.skills) {
            const skillsArray = form.skills.split(",").filter(s => s.trim());
            if (skillsArray.length > 20) {
                errors.skills = "Too many skills (max 20)";
            }
        }

        // Requirements
        if (form.requirements && form.requirements.trim() && form.requirements.length < 20) {
            errors.requirements = "Requirements must be at least 20 characters";
        }

        return errors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const formErrors = validateForm();
        if (Object.keys(formErrors).length > 0) {
            setErrors(formErrors);
            Object.values(formErrors).forEach(err => toast.error(err));
            return;
        }

        setErrors({});
        setSaving(true);

        try {
            const response = await postJob(form);
            
            if (response.success) {
                toast.success('Job posted successfully!');
                navigate(createPageUrl("CompanyDashboard"));
            } else {
                toast.error(response.error || 'Failed to post job');
            }
        } catch (error) {
            console.error('Post job error:', error);
            toast.error(error?.error || 'Failed to post job');
        } finally {
            setSaving(false);
        }
    };

    const handleSkillsBlur = () => {
        if (!form.skills) return;
        
        const cleanedSkills = [...new Set(
            form.skills
                .split(",")
                .map(s => s.trim())
                .filter(Boolean)
        )].join(", ");
        
        setForm({ ...form, skills: cleanedSkills });
    };

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
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">Access Denied</h2>
                    <p className="text-gray-500">Please log in to post a job.</p>
                    <Button 
                        onClick={() => navigate(createPageUrl("Login"))} 
                        className="mt-4 bg-[#6C63FF] text-white rounded-xl"
                    >
                        Go to Login
                    </Button>
                </div>
            </div>
        );
    }

    if (user.role !== 'company') {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
                <div className="text-center">
                    <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">Company Access Only</h2>
                    <p className="text-gray-500">Only company accounts can post jobs.</p>
                    <Button 
                        onClick={() => navigate(createPageUrl("Dashboard"))} 
                        className="mt-4 bg-[#6C63FF] text-white rounded-xl"
                    >
                        Go to Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    // Check if form is valid at current state
    const formIsInvalid = Object.keys(validateForm()).length > 0;

    return (
        <DashboardShell user={user} title="Post a Job" currentPage="PostJob">
            <motion.form
                onSubmit={handleSubmit}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-3xl bg-white rounded-3xl border border-gray-100 p-8 shadow-sm"
            >
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6C63FF] to-[#3b82f6] flex items-center justify-center shadow-lg shadow-[#6C63FF]/20">
                        <Briefcase className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Post New Job</h2>
                        <p className="text-sm text-gray-500 font-medium">Create high-quality job postings for better matching</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-700 ml-1">Job Title *</Label>
                            <Input
                                value={form.title}
                                onChange={(e) => {
                                    setForm({ ...form, title: e.target.value });
                                    if (errors.title) setErrors({...errors, title: null});
                                }}
                                className={`rounded-xl h-12 border-gray-200 focus:ring-2 focus:ring-[#6C63FF]/20 transition-all ${errors.title ? 'border-red-500 ring-2 ring-red-500/10' : ''}`}
                                placeholder="Software Engineer"
                                required
                            />
                            {errors.title && <p className="text-red-500 text-[11px] font-bold mt-1 ml-1 uppercase tracking-wider">{errors.title}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-700 ml-1">Company Name *</Label>
                            <Input
                                value={form.company}
                                className="rounded-xl h-12 bg-gray-50 border-gray-200 text-gray-500 font-medium"
                                disabled
                            />
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-700 ml-1">Location *</Label>
                            <Input
                                value={form.location}
                                onChange={(e) => {
                                    setForm({ ...form, location: e.target.value });
                                    if (errors.location) setErrors({...errors, location: null});
                                }}
                                className={`rounded-xl h-12 border-gray-200 focus:ring-2 focus:ring-[#6C63FF]/20 transition-all ${errors.location ? 'border-red-500 ring-2 ring-red-500/10' : ''}`}
                                placeholder="e.g. Ahmedabad, Gujarat or Remote"
                                required
                            />
                            {errors.location && <p className="text-red-500 text-[11px] font-bold mt-1 ml-1 uppercase tracking-wider">{errors.location}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-700 ml-1">Job Type</Label>
                            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                                <SelectTrigger className="rounded-xl h-12 border-gray-200">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                                    <SelectItem value="full_time">Full-time</SelectItem>
                                    <SelectItem value="part_time">Part-time</SelectItem>
                                    <SelectItem value="contract">Contract</SelectItem>
                                    <SelectItem value="remote">Remote</SelectItem>
                                    <SelectItem value="internship">Internship</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-700 ml-1">Min Salary (₹)</Label>
                            <Input
                                type="number"
                                value={form.salary_min}
                                onChange={(e) => {
                                    setForm({ ...form, salary_min: e.target.value });
                                    if (errors.salary) setErrors({...errors, salary: null});
                                }}
                                className={`rounded-xl h-12 border-gray-200 focus:ring-2 focus:ring-[#6C63FF]/20 transition-all ${errors.salary ? 'border-red-500 ring-2 ring-red-500/10' : ''}`}
                                placeholder="5,00,000"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-700 ml-1">Max Salary (₹)</Label>
                            <Input
                                type="number"
                                value={form.salary_max}
                                onChange={(e) => {
                                    setForm({ ...form, salary_max: e.target.value });
                                    if (errors.salary) setErrors({...errors, salary: null});
                                }}
                                className={`rounded-xl h-12 border-gray-200 focus:ring-2 focus:ring-[#6C63FF]/20 transition-all ${errors.salary ? 'border-red-500 ring-2 ring-red-500/10' : ''}`}
                                placeholder="12,00,000"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-sm font-bold text-gray-700 ml-1">Exp. Level</Label>
                            <Select value={form.experience_level} onValueChange={(v) => setForm({ ...form, experience_level: v })}>
                                <SelectTrigger className="rounded-xl h-12 border-gray-200">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                                    <SelectItem value="entry">Entry</SelectItem>
                                    <SelectItem value="mid">Mid</SelectItem>
                                    <SelectItem value="senior">Senior</SelectItem>
                                    <SelectItem value="lead">Lead</SelectItem>
                                    <SelectItem value="executive">Executive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {errors.salary && <div className="md:col-span-3"><p className="text-red-500 text-[11px] font-bold mt-1 ml-1 uppercase tracking-wider">{errors.salary}</p></div>}
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-sm font-bold text-gray-700 ml-1">Category *</Label>
                        <Select value={form.category} onValueChange={(v) => {
                            setForm({ ...form, category: v });
                            if (errors.category) setErrors({...errors, category: null});
                        }}>
                            <SelectTrigger className={`rounded-xl h-12 border-gray-200 focus:ring-2 focus:ring-[#6C63FF]/20 transition-all ${errors.category ? 'border-red-500 ring-2 ring-red-500/10' : ''}`}>
                                <SelectValue placeholder="Select relevant category" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                                <SelectItem value="engineering">Engineering</SelectItem>
                                <SelectItem value="design">Design</SelectItem>
                                <SelectItem value="marketing">Marketing</SelectItem>
                                <SelectItem value="sales">Sales</SelectItem>
                                <SelectItem value="data_science">Data Science</SelectItem>
                                <SelectItem value="product">Product</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.category && <p className="text-red-500 text-[11px] font-bold mt-1 ml-1 uppercase tracking-wider">{errors.category}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-sm font-bold text-gray-700 ml-1">Required Skills (max 20) *</Label>
                        <Input
                            value={form.skills}
                            onChange={(e) => {
                                setForm({ ...form, skills: e.target.value });
                                if (errors.skills) setErrors({...errors, skills: null});
                            }}
                            onBlur={handleSkillsBlur}
                            className={`rounded-xl h-12 border-gray-200 focus:ring-2 focus:ring-[#6C63FF]/20 transition-all ${errors.skills ? 'border-red-500 ring-2 ring-red-500/10' : ''}`}
                            placeholder="React, TypeScript, Node.js (commas to separate)"
                        />
                        <p className="text-[10px] text-gray-400 font-bold ml-1 uppercase tracking-widest">Separated by commas • Formatting applied on blur</p>
                        {errors.skills && <p className="text-red-500 text-[11px] font-bold mt-1 ml-1 uppercase tracking-wider">{errors.skills}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-sm font-bold text-gray-700 ml-1">Full Description *</Label>
                        <Textarea
                            value={form.description}
                            onChange={(e) => {
                                setForm({ ...form, description: e.target.value });
                                if (errors.description) setErrors({...errors, description: null});
                            }}
                            className={`rounded-2xl border-gray-200 focus:ring-2 focus:ring-[#6C63FF]/20 transition-all min-h-[160px] ${errors.description ? 'border-red-500 ring-2 ring-red-500/10' : ''}`}
                            placeholder="Detail the role, culture, and what a typical day looks like..."
                            required
                        />
                        <div className="flex justify-between items-center px-1">
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Min 50 characters</p>
                            <p className={`text-[10px] font-bold ${form.description.length < 50 ? 'text-amber-500' : 'text-green-500'}`}>{form.description.length} chars</p>
                        </div>
                        {errors.description && <p className="text-red-500 text-[11px] font-bold mt-1 ml-1 uppercase tracking-wider">{errors.description}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-sm font-bold text-gray-700 ml-1">Additional Requirements</Label>
                        <Textarea
                            value={form.requirements}
                            onChange={(e) => {
                                setForm({ ...form, requirements: e.target.value });
                                if (errors.requirements) setErrors({...errors, requirements: null});
                            }}
                            className={`rounded-2xl border-gray-200 focus:ring-2 focus:ring-[#6C63FF]/20 transition-all min-h-[100px] ${errors.requirements ? 'border-red-500 ring-2 ring-red-500/10' : ''}`}
                            placeholder="Any specific certifications, tools, or background checks..."
                        />
                        {errors.requirements && <p className="text-red-500 text-[11px] font-bold mt-1 ml-1 uppercase tracking-wider">{errors.requirements}</p>}
                    </div>
                </div>

                <div className="mt-10 pt-6 border-t border-gray-50 flex items-center justify-between">
                    <p className="text-xs text-gray-400 font-medium">* Required fields must be completed for quality matching.</p>
                    <Button
                        type="submit"
                        disabled={saving || formIsInvalid}
                        className={`bg-gradient-to-r from-[#6C63FF] to-[#3b82f6] text-white rounded-xl h-12 px-10 font-bold shadow-lg shadow-[#6C63FF]/20 hover:shadow-xl hover:shadow-[#6C63FF]/30 transition-all group ${formIsInvalid ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                    >
                        {saving ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                <span>Publishing...</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <PlusCircle className="w-5 h-5 transition-transform group-hover:scale-110" />
                                <span>Publish New Job</span>
                            </div>
                        )}
                    </Button>
                </div>
            </motion.form>
        </DashboardShell>
    );
}