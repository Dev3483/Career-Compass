import React, { useState, useEffect, useCallback } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { motion, AnimatePresence } from "framer-motion";
import {
    Briefcase, MapPin, DollarSign, Clock, Users,
    MoreVertical, Edit2, Trash2, Copy, Eye,
    Search, Filter, Plus, Loader2, RefreshCw,
    CheckCircle, XCircle, AlertCircle, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
    getCompanyJobsList,
    updateCompanyJob,
    deleteCompanyJob,
    duplicateCompanyJob,
    getCompanyJobsStats
} from "@/utils/api";

const JOB_TYPES = [
    { value: "full_time", label: "Full Time" },
    { value: "part_time", label: "Part Time" },
    { value: "contract", label: "Contract" },
    { value: "internship", label: "Internship" },
    { value: "remote", label: "Remote" }
];

const EXPERIENCE_LEVELS = [
    { value: "entry", label: "Entry Level" },
    { value: "junior", label: "Junior" },
    { value: "mid", label: "Mid Level" },
    { value: "senior", label: "Senior" },
    { value: "lead", label: "Lead" },
    { value: "expert", label: "Expert" }
];

const CATEGORIES = [
    { value: "engineering", label: "Engineering" },
    { value: "design", label: "Design" },
    { value: "marketing", label: "Marketing" },
    { value: "sales", label: "Sales" },
    { value: "product", label: "Product" },
    { value: "hr", label: "Human Resources" },
    { value: "finance", label: "Finance" },
    { value: "other", label: "Other" }
];

export default function MyJobs() {
    const [user, setUser] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [stats, setStats] = useState(null);
    const [editingJob, setEditingJob] = useState(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deletingJob, setDeletingJob] = useState(null);
    const [updating, setUpdating] = useState(false);

    // Get user from localStorage - Run first
    useEffect(() => {
        const storedUser = localStorage.getItem('careerai_user');
        console.log('Stored user:', storedUser);
        if (storedUser) {
            try {
                const userData = JSON.parse(storedUser);
                const normalizedUser = {
                    ...userData,
                    id: userData.id || userData.user_id || userData._id,
                    role: userData.role || userData.user_role
                };
                setUser(normalizedUser);
                console.log('Normalized user:', normalizedUser);
            } catch (error) {
                console.error('Error parsing user data:', error);
            }
        }
    }, []);

    // Fetch jobs - Define BEFORE using in useEffect
    const fetchJobs = useCallback(async () => {
        setLoading(true);
        try {
            console.log('Fetching jobs...');
            const result = await getCompanyJobsList();
            console.log('Fetch jobs result:', result);
            if (result.success) {
                setJobs(result.jobs || []);
            } else {
                toast.error(result.error || "Failed to fetch jobs");
            }
        } catch (error) {
            console.error('Fetch jobs error:', error);
            toast.error(error.error || "Failed to fetch jobs");
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch stats - Define BEFORE using in useEffect
    const fetchStats = useCallback(async () => {
        try {
            console.log('Fetching stats...');
            const result = await getCompanyJobsStats();
            console.log('Fetch stats result:', result);
            if (result.success) {
                setStats(result.stats);
            }
        } catch (error) {
            console.error('Fetch stats error:', error);
        }
    }, []);

    // Now use fetchJobs and fetchStats in useEffect - AFTER they are defined
    useEffect(() => {
        // Only fetch if user exists and has company role
        if (user && user.role === 'company') {
            console.log('User authenticated, fetching data...');
            fetchJobs();
            fetchStats();
        } else if (user && user.role !== 'company') {
            console.log('User is not a company, skipping fetch');
        }
    }, [user, fetchJobs, fetchStats]); // Add proper dependencies

    // Handle job update
    const handleUpdateJob = async (jobId, formData) => {
        setUpdating(true);
        try {
            const result = await updateCompanyJob(jobId, formData);
            if (result.success) {
                toast.success("Job updated successfully");
                setIsEditDialogOpen(false);
                setEditingJob(null);
                fetchJobs();
                fetchStats();
            } else {
                toast.error(result.error || "Failed to update job");
            }
        } catch (error) {
            console.error('Update error:', error);
            toast.error(error.error || "Failed to update job");
        } finally {
            setUpdating(false);
        }
    };

    // Handle job delete
    const handleDeleteJob = async () => {
        if (!deletingJob) return;
        
        setUpdating(true);
        try {
            const result = await deleteCompanyJob(deletingJob.job_id);
            if (result.success) {
                toast.success("Job deleted successfully");
                setIsDeleteDialogOpen(false);
                setDeletingJob(null);
                fetchJobs();
                fetchStats();
            } else {
                toast.error(result.error || "Failed to delete job");
            }
        } catch (error) {
            console.error('Delete error:', error);
            toast.error(error.error || "Failed to delete job");
        } finally {
            setUpdating(false);
        }
    };

    // Handle job duplicate
    const handleDuplicateJob = async (job) => {
        try {
            const result = await duplicateCompanyJob(job.job_id);
            if (result.success) {
                toast.success("Job duplicated successfully");
                fetchJobs();
                fetchStats();
            } else {
                toast.error(result.error || "Failed to duplicate job");
            }
        } catch (error) {
            console.error('Duplicate error:', error);
            toast.error(error.error || "Failed to duplicate job");
        }
    };

    // Filter jobs
    const filteredJobs = jobs.filter(job => {
        const matchesSearch = searchTerm === "" ||
            job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.location?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === "all" || job.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });

    // Get status badge
    const getStatusBadge = (status) => {
        if (status === 'active') {
            return <Badge className="bg-green-100 text-green-700 rounded-lg">Active</Badge>;
        }
        return <Badge className="bg-gray-100 text-gray-600 rounded-lg">Inactive</Badge>;
    };

    // Format salary
    const formatSalary = (min, max) => {
        if (min && max) {
            return `$${(min / 1000).toFixed(0)}K - $${(max / 1000).toFixed(0)}K`;
        }
        if (min) return `$${(min / 1000).toFixed(0)}K+`;
        if (max) return `Up to $${(max / 1000).toFixed(0)}K`;
        return "Not specified";
    };

    // Loading state
    if (!user) {
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

    // Access denied state
    if (user.role !== "company") {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-8 bg-white rounded-2xl shadow-lg">
                    <Briefcase className="w-16 h-16 text-red-300 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-600">
                        This page is only accessible to company accounts.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <DashboardShell user={user} title="My Jobs" currentPage="MyJobs">
            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                    <div className="bg-white rounded-2xl border border-gray-100 p-4">
                        <p className="text-2xl font-bold text-gray-900">{stats.total_jobs}</p>
                        <p className="text-sm text-gray-500">Total Jobs</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 p-4">
                        <p className="text-2xl font-bold text-green-600">{stats.active_jobs}</p>
                        <p className="text-sm text-gray-500">Active Jobs</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 p-4">
                        <p className="text-2xl font-bold text-purple-600">{stats.total_applications}</p>
                        <p className="text-sm text-gray-500">Total Applications</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 p-4">
                        <p className="text-2xl font-bold text-yellow-600">{stats.pending_applications}</p>
                        <p className="text-sm text-gray-500">Pending Review</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 p-4">
                        <p className="text-2xl font-bold text-green-600">{stats.hired_applications}</p>
                        <p className="text-sm text-gray-500">Hired</p>
                    </div>
                </div>
            )}

            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-80">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Search jobs..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 rounded-xl"
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-36 rounded-xl">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => { fetchJobs(); fetchStats(); }}
                        className="rounded-xl gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </Button>
                    <Button
                        onClick={() => window.location.href = '/company/post-job'}
                        className="bg-[#6C63FF] hover:bg-[#5a52e0] rounded-xl gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Post New Job
                    </Button>
                </div>
            </div>

            {/* Jobs List */}
            {loading ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                    <Loader2 className="w-12 h-12 animate-spin text-[#6C63FF] mx-auto mb-4" />
                    <p className="text-gray-500">Loading your jobs...</p>
                </div>
            ) : filteredJobs.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                    <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Jobs Found</h3>
                    <p className="text-gray-500 mb-6">
                        {searchTerm || statusFilter !== "all" 
                            ? "Try adjusting your filters" 
                            : "Post your first job to start receiving applications"}
                    </p>
                    {!searchTerm && statusFilter === "all" && (
                        <Button 
                            onClick={() => window.location.href = '/company/post-job'}
                            className="bg-[#6C63FF] hover:bg-[#5a52e0]"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Post a Job
                        </Button>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredJobs.map((job, index) => (
                        <motion.div
                            key={job.job_id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-all"
                        >
                            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                                {/* Job Info */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 flex-wrap mb-3">
                                        <h3 className="text-xl font-bold text-gray-900">{job.title}</h3>
                                        {getStatusBadge(job.status)}
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-4 mb-4">
                                        <div className="flex items-center gap-1 text-gray-500 text-sm">
                                            <MapPin className="w-4 h-4" />
                                            {job.location || "Remote"}
                                        </div>
                                        <div className="flex items-center gap-1 text-gray-500 text-sm">
                                            <DollarSign className="w-4 h-4" />
                                            {formatSalary(job.salary_min, job.salary_max)}
                                        </div>
                                        <div className="flex items-center gap-1 text-gray-500 text-sm">
                                            <Clock className="w-4 h-4" />
                                            {JOB_TYPES.find(t => t.value === job.job_type)?.label || job.job_type || "Full Time"}
                                        </div>
                                        <div className="flex items-center gap-1 text-gray-500 text-sm">
                                            <Users className="w-4 h-4" />
                                            {job.applications_count || 0} applicants
                                        </div>
                                    </div>
                                    
                                    {/* Skills */}
                                    {job.skills && job.skills.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {job.skills.slice(0, 5).map((skill, idx) => (
                                                <Badge key={idx} className="bg-purple-50 text-purple-700 rounded-lg">
                                                    {skill}
                                                </Badge>
                                            ))}
                                            {job.skills.length > 5 && (
                                                <Badge className="bg-gray-50 text-gray-600 rounded-lg">
                                                    +{job.skills.length - 5} more
                                                </Badge>
                                            )}
                                        </div>
                                    )}
                                    
                                    {/* Application Stats */}
                                    <div className="flex gap-4 text-sm">
                                        <span className="text-yellow-600">
                                            Pending: {job.pending_count || 0}
                                        </span>
                                        <span className="text-blue-600">
                                            Shortlisted: {job.shortlisted_count || 0}
                                        </span>
                                        <span className="text-green-600">
                                            Hired: {job.hired_count || 0}
                                        </span>
                                    </div>
                                </div>
                                
                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.location.href = `/company/candidates?job=${job.job_id}`}
                                        className="rounded-xl gap-2"
                                    >
                                        <Users className="w-4 h-4" />
                                        View Applicants
                                    </Button>
                                    
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="rounded-xl">
                                                <MoreVertical className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="rounded-xl">
                                            <DropdownMenuItem onClick={() => {
                                                setEditingJob(job);
                                                setIsEditDialogOpen(true);
                                            }}>
                                                <Edit2 className="w-4 h-4 mr-2" />
                                                Edit Job
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleDuplicateJob(job)}>
                                                <Copy className="w-4 h-4 mr-2" />
                                                Duplicate
                                            </DropdownMenuItem>
                                            <DropdownMenuItem 
                                                onClick={() => {
                                                    setDeletingJob(job);
                                                    setIsDeleteDialogOpen(true);
                                                }}
                                                className="text-red-600"
                                            >
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Edit Job Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit Job</DialogTitle>
                        <DialogDescription>
                            Update your job posting details
                        </DialogDescription>
                    </DialogHeader>
                    
                    {editingJob && (
                        <EditJobForm
                            job={editingJob}
                            onSubmit={(data) => handleUpdateJob(editingJob.job_id, data)}
                            onCancel={() => {
                                setIsEditDialogOpen(false);
                                setEditingJob(null);
                            }}
                            loading={updating}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>Delete Job</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{deletingJob?.title}"? 
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsDeleteDialogOpen(false);
                                setDeletingJob(null);
                            }}
                            className="rounded-xl"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleDeleteJob}
                            disabled={updating}
                            className="bg-red-500 hover:bg-red-600 rounded-xl"
                        >
                            {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardShell>
    );
}

// Edit Job Form Component
function EditJobForm({ job, onSubmit, onCancel, loading }) {
    const [formData, setFormData] = useState({
        title: job.title || "",
        location: job.location || "",
        job_type: job.job_type || "full_time",
        experience_level: job.experience_level || "mid",
        category: job.category || "other",
        salary_min: job.salary_min || "",
        salary_max: job.salary_max || "",
        description: job.description || "",
        requirements: job.requirements || "",
        skills: job.skills?.join(", ") || "",
        status: job.status || "active"
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const skillsArray = formData.skills
            .split(",")
            .map(s => s.trim())
            .filter(s => s);
        
        onSubmit({
            ...formData,
            skills: skillsArray,
            salary_min: formData.salary_min ? parseInt(formData.salary_min) : null,
            salary_max: formData.salary_max ? parseInt(formData.salary_max) : null
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <Label>Job Title *</Label>
                <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="rounded-xl mt-1"
                />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label>Location</Label>
                    <Input
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="Remote or City"
                        className="rounded-xl mt-1"
                    />
                </div>
                <div>
                    <Label>Job Type</Label>
                    <Select value={formData.job_type} onValueChange={(v) => setFormData({ ...formData, job_type: v })}>
                        <SelectTrigger className="rounded-xl mt-1">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {JOB_TYPES.map(type => (
                                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label>Min Salary (USD)</Label>
                    <Input
                        type="number"
                        value={formData.salary_min}
                        onChange={(e) => setFormData({ ...formData, salary_min: e.target.value })}
                        placeholder="50000"
                        className="rounded-xl mt-1"
                    />
                </div>
                <div>
                    <Label>Max Salary (USD)</Label>
                    <Input
                        type="number"
                        value={formData.salary_max}
                        onChange={(e) => setFormData({ ...formData, salary_max: e.target.value })}
                        placeholder="80000"
                        className="rounded-xl mt-1"
                    />
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label>Experience Level</Label>
                    <Select value={formData.experience_level} onValueChange={(v) => setFormData({ ...formData, experience_level: v })}>
                        <SelectTrigger className="rounded-xl mt-1">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {EXPERIENCE_LEVELS.map(level => (
                                <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label>Category</Label>
                    <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                        <SelectTrigger className="rounded-xl mt-1">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {CATEGORIES.map(cat => (
                                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            
            <div>
                <Label>Skills (comma separated)</Label>
                <Input
                    value={formData.skills}
                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                    placeholder="React, Python, AWS, ..."
                    className="rounded-xl mt-1"
                />
            </div>
            
            <div>
                <Label>Description</Label>
                <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="rounded-xl mt-1"
                />
            </div>
            
            <div>
                <Label>Requirements</Label>
                <Textarea
                    value={formData.requirements}
                    onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                    rows={3}
                    className="rounded-xl mt-1"
                />
            </div>
            
            <div>
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger className="rounded-xl mt-1">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            
            <DialogFooter className="gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onCancel} className="rounded-xl">
                    Cancel
                </Button>
                <Button type="submit" disabled={loading} className="bg-[#6C63FF] hover:bg-[#5a52e0] rounded-xl">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                </Button>
            </DialogFooter>
        </form>
    );
}