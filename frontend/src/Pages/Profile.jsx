import React, { useState, useEffect } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { motion } from "framer-motion";
import {
    User, Mail, MapPin, Briefcase, Calendar, Award, Github, Linkedin,
    Twitter, Globe, Edit2, Save, X, Plus, Trash2, CheckCircle, AlertCircle,
    Upload, FileText, Star, Clock, Phone, Building2, Users, Factory, 
    FileCheck, Shield, DollarSign, TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/context/AuthContext";
import { getCurrentUser, updateUserProfile } from "@/utils/api";
import { toast } from "react-hot-toast";

export default function Profile() {
    const { user: authUser, updateUser } = useAuth();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    
    // Common form data for both roles
    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
        phone: "",
        location: "",
        bio: "",
        website: "",
        github: "",
        linkedin: "",
        twitter: ""
    });
    
    // Job seeker specific fields
    const [jobSeekerData, setJobSeekerData] = useState({
        title: "",
        experience_years: "",
        skills: [],
        education: "",
        current_company: "",
        resume_url: "",
        portfolio_url: ""
    });
    
    // Company specific fields
    const [companyData, setCompanyData] = useState({
        company_name: "",
        company_size: "",
        industry: "",
        founded_year: "",
        description: "",
        verification_status: "pending",
        is_verified: false,
        total_jobs_posted: 0,
        total_applications_received: 0
    });
    
    const [newSkill, setNewSkill] = useState("");
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        setLoading(true);
        try {
            const response = await getCurrentUser();
            if (response.success && response.user) {
                setUser(response.user);
                
                // Set common form data
                setFormData({
                    full_name: response.user.full_name || "",
                    email: response.user.email || "",
                    phone: response.user.phone || "",
                    location: response.user.location || "",
                    bio: response.user.bio || "",
                    website: response.user.website || "",
                    github: response.user.github || "",
                    linkedin: response.user.linkedin || "",
                    twitter: response.user.twitter || ""
                });
                
                // Set role-specific data
                if (response.user.role === 'job_seeker') {
                    setJobSeekerData({
                        title: response.user.title || "",
                        experience_years: response.user.experience_years || "",
                        skills: response.user.skills || [],
                        education: response.user.education || "",
                        current_company: response.user.current_company || "",
                        resume_url: response.user.resume_url || "",
                        portfolio_url: response.user.portfolio_url || ""
                    });
                } else if (response.user.role === 'company') {
                    setCompanyData({
                        company_name: response.user.company_name || response.user.full_name || "",
                        company_size: response.user.company_size || "",
                        industry: response.user.industry || "",
                        founded_year: response.user.founded_year || "",
                        description: response.user.description || "",
                        verification_status: response.user.verification_status || "pending",
                        is_verified: response.user.is_verified || false,
                        total_jobs_posted: response.user.total_jobs_posted || 0,
                        total_applications_received: response.user.total_applications_received || 0
                    });
                }
            } else {
                toast.error('Failed to load profile');
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            toast.error('Failed to load profile data');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            let updateData = {};
            
            // Add common fields
            Object.keys(formData).forEach(key => {
                if (formData[key] !== user[key]) {
                    updateData[key] = formData[key];
                }
            });
            
            // Add role-specific fields
            if (user?.role === 'job_seeker') {
                Object.keys(jobSeekerData).forEach(key => {
                    if (jobSeekerData[key] !== user[key]) {
                        updateData[key] = jobSeekerData[key];
                    }
                });
            } else if (user?.role === 'company') {
                Object.keys(companyData).forEach(key => {
                    if (companyData[key] !== user[key]) {
                        updateData[key] = companyData[key];
                    }
                });
            }
            
            if (Object.keys(updateData).length > 0) {
                const result = await updateUserProfile(updateData);
                if (result.success) {
                    setUser(result.user);
                    await updateUser(result.user);
                    toast.success('Profile updated successfully');
                    setEditing(false);
                } else {
                    toast.error(result.error || 'Failed to update profile');
                }
            } else {
                setEditing(false);
                toast.info('No changes to save');
            }
        } catch (error) {
            console.error('Error saving profile:', error);
            toast.error('Failed to save changes');
        } finally {
            setSaving(false);
        }
    };

    const addSkill = () => {
        if (newSkill.trim() && !jobSeekerData.skills.includes(newSkill.trim())) {
            setJobSeekerData({ 
                ...jobSeekerData, 
                skills: [...jobSeekerData.skills, newSkill.trim()] 
            });
            setNewSkill("");
        }
    };

    const removeSkill = (skill) => {
        setJobSeekerData({ 
            ...jobSeekerData, 
            skills: jobSeekerData.skills.filter(s => s !== skill) 
        });
    };

    const calculateProfileCompletion = () => {
        let completed = 0;
        const totalFields = user?.role === 'company' ? 8 : 10;
        
        if (formData.full_name) completed++;
        if (formData.location) completed++;
        if (formData.phone) completed++;
        if (formData.bio) completed++;
        
        if (user?.role === 'job_seeker') {
            if (jobSeekerData.title) completed++;
            if (jobSeekerData.experience_years) completed++;
            if (jobSeekerData.skills.length > 0) completed++;
            if (jobSeekerData.education) completed++;
        } else if (user?.role === 'company') {
            if (companyData.company_name) completed++;
            if (companyData.industry) completed++;
            if (companyData.company_size) completed++;
            if (companyData.description) completed++;
        }
        
        return Math.min(Math.round((completed / totalFields) * 100), 100);
    };

    const getVerificationBadge = () => {
        if (user?.role === 'company') {
            if (companyData.is_verified) {
                return (
                    <Badge className="bg-green-100 text-green-700 rounded-lg">
                        <Shield className="w-3 h-3 mr-1" />
                        Verified Company
                    </Badge>
                );
            } else if (companyData.verification_status === 'pending') {
                return (
                    <Badge className="bg-yellow-100 text-yellow-700 rounded-lg">
                        <Clock className="w-3 h-3 mr-1" />
                        Verification Pending
                    </Badge>
                );
            }
        }
        return null;
    };

    if (loading) {
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

    const completion = calculateProfileCompletion();
    const isCompany = user?.role === 'company';
    const isJobSeeker = user?.role === 'job_seeker';

    return (
        <DashboardShell user={user} title="Profile" currentPage="Profile">
            <div className="max-w-5xl mx-auto">
                {/* Profile Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl border border-gray-100 p-6 mb-6"
                >
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <Avatar className="w-20 h-20 rounded-xl">
                                <AvatarFallback className="bg-[#6C63FF] text-white text-2xl">
                                    {isCompany 
                                        ? (companyData.company_name?.[0] || user?.full_name?.[0] || "C")
                                        : (user?.full_name?.[0] || user?.email?.[0] || "U")
                                    }
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h1 className="text-2xl font-bold text-gray-900">
                                        {isCompany ? companyData.company_name : user?.full_name}
                                    </h1>
                                    {getVerificationBadge()}
                                </div>
                                <p className="text-gray-600">
                                    {isCompany ? companyData.industry || "Company" : jobSeekerData.title || "Professional"}
                                </p>
                                {formData.location && (
                                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                        <MapPin className="w-3 h-3" /> {formData.location}
                                    </p>
                                )}
                                {isCompany && companyData.total_jobs_posted > 0 && (
                                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                        <Briefcase className="w-3 h-3" /> {companyData.total_jobs_posted} jobs posted
                                    </p>
                                )}
                            </div>
                        </div>
                        {!editing ? (
                            <Button
                                onClick={() => setEditing(true)}
                                className="bg-[#6C63FF] text-white rounded-xl hover:bg-[#5A52D5]"
                            >
                                <Edit2 className="w-4 h-4 mr-2" />
                                Edit Profile
                            </Button>
                        ) : (
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setEditing(false)}
                                    className="rounded-xl"
                                >
                                    <X className="w-4 h-4 mr-2" />
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="bg-[#6C63FF] text-white rounded-xl hover:bg-[#5A52D5]"
                                >
                                    <Save className="w-4 h-4 mr-2" />
                                    {saving ? "Saving..." : "Save Changes"}
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Profile Completion */}
                    <div className="mt-6 pt-6 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Profile Completion</span>
                            <span className="text-sm font-medium text-[#6C63FF]">{completion}%</span>
                        </div>
                        <Progress value={completion} className="h-2" />
                    </div>
                </motion.div>

                {/* Main Content Tabs */}
                <Tabs defaultValue="about" className="w-full">
                    <TabsList className="bg-white border border-gray-100 rounded-xl p-1 mb-6">
                        <TabsTrigger value="about" className="rounded-lg">
                            <User className="w-4 h-4 mr-2" />
                            About
                        </TabsTrigger>
                        {isJobSeeker && (
                            <TabsTrigger value="skills" className="rounded-lg">
                                <Award className="w-4 h-4 mr-2" />
                                Skills
                            </TabsTrigger>
                        )}
                        {isCompany && (
                            <TabsTrigger value="company" className="rounded-lg">
                                <Building2 className="w-4 h-4 mr-2" />
                                Company Details
                            </TabsTrigger>
                        )}
                        <TabsTrigger value="social" className="rounded-lg">
                            <Globe className="w-4 h-4 mr-2" />
                            Social Links
                        </TabsTrigger>
                    </TabsList>

                    {/* About Tab - Common for both roles */}
                    <TabsContent value="about">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6"
                        >
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <Label className="text-gray-700">Full Name</Label>
                                    {editing ? (
                                        <Input
                                            value={formData.full_name}
                                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                            className="rounded-xl mt-1.5"
                                        />
                                    ) : (
                                        <p className="mt-1.5 text-gray-900">{formData.full_name || "Not specified"}</p>
                                    )}
                                </div>
                                <div>
                                    <Label className="text-gray-700">Email</Label>
                                    <p className="mt-1.5 text-gray-900">{formData.email}</p>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <Label className="text-gray-700">Phone</Label>
                                    {editing ? (
                                        <Input
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="rounded-xl mt-1.5"
                                            placeholder="+1 234 567 8900"
                                        />
                                    ) : (
                                        <p className="mt-1.5 text-gray-900">{formData.phone || "Not specified"}</p>
                                    )}
                                </div>
                                <div>
                                    <Label className="text-gray-700">Location</Label>
                                    {editing ? (
                                        <Input
                                            value={formData.location}
                                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                            className="rounded-xl mt-1.5"
                                            placeholder="City, Country"
                                        />
                                    ) : (
                                        <p className="mt-1.5 text-gray-900">{formData.location || "Not specified"}</p>
                                    )}
                                </div>
                            </div>

                            {/* Job Seeker Specific Fields */}
                            {isJobSeeker && (
                                <>
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div>
                                            <Label className="text-gray-700">Job Title</Label>
                                            {editing ? (
                                                <Input
                                                    value={jobSeekerData.title}
                                                    onChange={(e) => setJobSeekerData({ ...jobSeekerData, title: e.target.value })}
                                                    className="rounded-xl mt-1.5"
                                                    placeholder="e.g. Senior Software Engineer"
                                                />
                                            ) : (
                                                <p className="mt-1.5 text-gray-900">{jobSeekerData.title || "Not specified"}</p>
                                            )}
                                        </div>
                                        <div>
                                            <Label className="text-gray-700">Years of Experience</Label>
                                            {editing ? (
                                                <Input
                                                    type="number"
                                                    value={jobSeekerData.experience_years}
                                                    onChange={(e) => setJobSeekerData({ ...jobSeekerData, experience_years: e.target.value })}
                                                    className="rounded-xl mt-1.5"
                                                    placeholder="Years of experience"
                                                />
                                            ) : (
                                                <p className="mt-1.5 text-gray-900">{jobSeekerData.experience_years || "0"} years</p>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <Label className="text-gray-700">Education</Label>
                                        {editing ? (
                                            <Input
                                                value={jobSeekerData.education}
                                                onChange={(e) => setJobSeekerData({ ...jobSeekerData, education: e.target.value })}
                                                className="rounded-xl mt-1.5"
                                                placeholder="e.g. B.Sc. Computer Science, Stanford University"
                                            />
                                        ) : (
                                            <p className="mt-1.5 text-gray-900">{jobSeekerData.education || "Not specified"}</p>
                                        )}
                                    </div>

                                    <div>
                                        <Label className="text-gray-700">Current Company</Label>
                                        {editing ? (
                                            <Input
                                                value={jobSeekerData.current_company}
                                                onChange={(e) => setJobSeekerData({ ...jobSeekerData, current_company: e.target.value })}
                                                className="rounded-xl mt-1.5"
                                                placeholder="Current employer"
                                            />
                                        ) : (
                                            <p className="mt-1.5 text-gray-900">{jobSeekerData.current_company || "Not specified"}</p>
                                        )}
                                    </div>
                                </>
                            )}

                            {/* Company Specific Fields */}
                            {isCompany && (
                                <>
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div>
                                            <Label className="text-gray-700">Company Name</Label>
                                            {editing ? (
                                                <Input
                                                    value={companyData.company_name}
                                                    onChange={(e) => setCompanyData({ ...companyData, company_name: e.target.value })}
                                                    className="rounded-xl mt-1.5"
                                                />
                                            ) : (
                                                <p className="mt-1.5 text-gray-900">{companyData.company_name || "Not specified"}</p>
                                            )}
                                        </div>
                                        <div>
                                            <Label className="text-gray-700">Industry</Label>
                                            {editing ? (
                                                <Input
                                                    value={companyData.industry}
                                                    onChange={(e) => setCompanyData({ ...companyData, industry: e.target.value })}
                                                    className="rounded-xl mt-1.5"
                                                    placeholder="e.g. Technology, Healthcare, Finance"
                                                />
                                            ) : (
                                                <p className="mt-1.5 text-gray-900">{companyData.industry || "Not specified"}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div>
                                            <Label className="text-gray-700">Company Size</Label>
                                            {editing ? (
                                                <select
                                                    value={companyData.company_size}
                                                    onChange={(e) => setCompanyData({ ...companyData, company_size: e.target.value })}
                                                    className="w-full rounded-xl border border-gray-200 px-3 py-2 mt-1.5 focus:outline-none focus:ring-2 focus:ring-[#6C63FF]"
                                                >
                                                    <option value="">Select size</option>
                                                    <option value="1-10">1-10 employees</option>
                                                    <option value="11-50">11-50 employees</option>
                                                    <option value="51-200">51-200 employees</option>
                                                    <option value="201-500">201-500 employees</option>
                                                    <option value="501-1000">501-1000 employees</option>
                                                    <option value="1000+">1000+ employees</option>
                                                </select>
                                            ) : (
                                                <p className="mt-1.5 text-gray-900">{companyData.company_size || "Not specified"} employees</p>
                                            )}
                                        </div>
                                        <div>
                                            <Label className="text-gray-700">Founded Year</Label>
                                            {editing ? (
                                                <Input
                                                    type="number"
                                                    value={companyData.founded_year}
                                                    onChange={(e) => setCompanyData({ ...companyData, founded_year: e.target.value })}
                                                    className="rounded-xl mt-1.5"
                                                    placeholder="e.g. 2020"
                                                />
                                            ) : (
                                                <p className="mt-1.5 text-gray-900">{companyData.founded_year || "Not specified"}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Company Stats (Read-only) */}
                                    {!editing && (
                                        <div className="grid md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
                                            <div className="text-center">
                                                <p className="text-2xl font-bold text-[#6C63FF]">{companyData.total_jobs_posted}</p>
                                                <p className="text-sm text-gray-600">Jobs Posted</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-2xl font-bold text-[#6C63FF]">{companyData.total_applications_received}</p>
                                                <p className="text-sm text-gray-600">Applications Received</p>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Bio/Description */}
                            <div>
                                <Label className="text-gray-700">
                                    {isCompany ? "Company Description" : "Bio"}
                                </Label>
                                {editing ? (
                                    <Textarea
                                        value={isCompany ? companyData.description : formData.bio}
                                        onChange={(e) => {
                                            if (isCompany) {
                                                setCompanyData({ ...companyData, description: e.target.value });
                                            } else {
                                                setFormData({ ...formData, bio: e.target.value });
                                            }
                                        }}
                                        className="rounded-xl mt-1.5"
                                        rows={4}
                                        placeholder={isCompany ? "Tell us about your company..." : "Tell us about yourself..."}
                                    />
                                ) : (
                                    <p className="mt-1.5 text-gray-900">
                                        {isCompany ? (companyData.description || "No description provided") : (formData.bio || "No bio provided")}
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    </TabsContent>

                    {/* Skills Tab - Only for Job Seekers */}
                    {isJobSeeker && (
                        <TabsContent value="skills">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-2xl border border-gray-100 p-6"
                            >
                                <div className="mb-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Technical Skills</h3>
                                    <p className="text-sm text-gray-500">Add your key skills and competencies</p>
                                </div>

                                {editing ? (
                                    <>
                                        <div className="flex gap-2 mb-4">
                                            <Input
                                                value={newSkill}
                                                onChange={(e) => setNewSkill(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                                                placeholder="Type a skill and press Enter"
                                                className="rounded-xl"
                                            />
                                            <Button onClick={addSkill} className="rounded-xl bg-[#6C63FF] text-white">
                                                <Plus className="w-4 h-4" />
                                            </Button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {jobSeekerData.skills.map((skill, idx) => (
                                                <Badge
                                                    key={idx}
                                                    className="px-3 py-1.5 bg-[#6C63FF]/10 text-[#6C63FF] rounded-lg text-sm flex items-center gap-1"
                                                >
                                                    {skill}
                                                    <button
                                                        onClick={() => removeSkill(skill)}
                                                        className="hover:text-red-500 ml-1"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </Badge>
                                            ))}
                                        </div>
                                        {jobSeekerData.skills.length === 0 && (
                                            <p className="text-gray-500 text-sm mt-4">No skills added yet. Add your first skill above.</p>
                                        )}
                                    </>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {jobSeekerData.skills?.length > 0 ? (
                                            jobSeekerData.skills.map((skill, idx) => (
                                                <Badge key={idx} className="px-3 py-1.5 bg-[#6C63FF]/10 text-[#6C63FF] rounded-lg">
                                                    {skill}
                                                </Badge>
                                            ))
                                        ) : (
                                            <p className="text-gray-500 text-sm">No skills added yet</p>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        </TabsContent>
                    )}

                    {/* Company Details Tab - Only for Companies */}
                    {isCompany && (
                        <TabsContent value="company">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6"
                            >
                                {/* Verification Status */}
                                <div className="p-4 rounded-xl bg-gray-50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Shield className="w-5 h-5 text-[#6C63FF]" />
                                            <span className="font-medium text-gray-900">Verification Status</span>
                                        </div>
                                        {getVerificationBadge()}
                                    </div>
                                    {!companyData.is_verified && companyData.verification_status === 'pending' && (
                                        <p className="text-sm text-gray-500 mt-2">
                                            Your company verification is pending. This process helps build trust with job seekers.
                                        </p>
                                    )}
                                </div>

                                {/* Company URLs */}
                                <div>
                                    <Label className="text-gray-700">Company Website</Label>
                                    {editing ? (
                                        <Input
                                            value={formData.website}
                                            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                            className="rounded-xl mt-1.5"
                                            placeholder="https://yourcompany.com"
                                        />
                                    ) : (
                                        <a href={formData.website} target="_blank" rel="noopener noreferrer" className="mt-1.5 text-[#6C63FF] hover:underline block">
                                            {formData.website || "Not specified"}
                                        </a>
                                    )}
                                </div>
                            </motion.div>
                        </TabsContent>
                    )}

                    {/* Social Links Tab - Common for both */}
                    <TabsContent value="social">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4"
                        >
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-gray-700 flex items-center gap-2">
                                        <Globe className="w-4 h-4" /> Website
                                    </Label>
                                    {editing ? (
                                        <Input
                                            value={formData.website}
                                            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                            className="rounded-xl mt-1.5"
                                            placeholder="https://yourwebsite.com"
                                        />
                                    ) : (
                                        <a href={formData.website} target="_blank" rel="noopener noreferrer" className="mt-1.5 text-[#6C63FF] hover:underline block">
                                            {formData.website || "Not specified"}
                                        </a>
                                    )}
                                </div>
                                <div>
                                    <Label className="text-gray-700 flex items-center gap-2">
                                        <Github className="w-4 h-4" /> GitHub
                                    </Label>
                                    {editing ? (
                                        <Input
                                            value={formData.github}
                                            onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                                            className="rounded-xl mt-1.5"
                                            placeholder="https://github.com/username"
                                        />
                                    ) : (
                                        <a href={formData.github} target="_blank" rel="noopener noreferrer" className="mt-1.5 text-[#6C63FF] hover:underline block">
                                            {formData.github || "Not specified"}
                                        </a>
                                    )}
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-gray-700 flex items-center gap-2">
                                        <Linkedin className="w-4 h-4" /> LinkedIn
                                    </Label>
                                    {editing ? (
                                        <Input
                                            value={formData.linkedin}
                                            onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                                            className="rounded-xl mt-1.5"
                                            placeholder="https://linkedin.com/in/username"
                                        />
                                    ) : (
                                        <a href={formData.linkedin} target="_blank" rel="noopener noreferrer" className="mt-1.5 text-[#6C63FF] hover:underline block">
                                            {formData.linkedin || "Not specified"}
                                        </a>
                                    )}
                                </div>
                                <div>
                                    <Label className="text-gray-700 flex items-center gap-2">
                                        <Twitter className="w-4 h-4" /> Twitter/X
                                    </Label>
                                    {editing ? (
                                        <Input
                                            value={formData.twitter}
                                            onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                                            className="rounded-xl mt-1.5"
                                            placeholder="https://twitter.com/username"
                                        />
                                    ) : (
                                        <a href={formData.twitter} target="_blank" rel="noopener noreferrer" className="mt-1.5 text-[#6C63FF] hover:underline block">
                                            {formData.twitter || "Not specified"}
                                        </a>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardShell>
    );
}