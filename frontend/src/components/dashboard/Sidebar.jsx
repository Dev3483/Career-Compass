import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import {
    LayoutDashboard, FileText, Briefcase, MessageSquare, DollarSign, Mic,
    Building2, Users, BarChart3, Settings, Sparkles, ChevronLeft, ChevronRight,
    Shield, PlusCircle, Target, Brain, LogOut, TrendingUp, Compass
} from "lucide-react";
import { PAGE_CATEGORIES } from '@/pages.config';
import { logoutUser } from "@/utils/api";
import { toast } from "react-hot-toast";

export default function Sidebar({ role, currentPage, collapsed, onToggle, onLogout }) {
    const navigate = useNavigate();
    
    // Define icons for each page (removed Profile and MyApplications)
    const pageIcons = {
        "Dashboard": LayoutDashboard,
        "ResumeIntelligence": FileText,
        "JobRecommendations": Briefcase,
        "CareerChat": MessageSquare,
        "SalaryIntelligence": DollarSign,
        "InterviewPrep": Mic,
        "CompanyDashboard": LayoutDashboard,
        "PostJob": PlusCircle,
        "Candidates": Users,
        "AICandidateRanking": Target,
        "CompanyAnalytics": BarChart3,
        "AdminDashboard": LayoutDashboard,
        "AdminUsers": Users,
        "AdminCompanies": Building2,
        "AdminAI": Brain,
        "AdminSystem": Shield,
        "DashboardSettings": Settings,
        "CareerInsights": TrendingUp,

    };

    // Get pages based on role (removed Profile and MyApplications from categories)
    const getPagesForRole = () => {
        let pages = [];
        switch (role) {
            case 'admin':
                pages = [...PAGE_CATEGORIES.admin];
                break;
            case 'company':
                pages = [...PAGE_CATEGORIES.company];
                break;
            case 'job_seeker':
                pages = [...PAGE_CATEGORIES.jobSeeker];
                break;
            default:
                return [];
        }
        // Filter out Profile, MyApplications, DashboardSettings, and SavedJobs from sidebar
        return pages.filter(page => !["Profile", "MyApplications", "DashboardSettings", "SavedJobs"].includes(page));
    };

    const pages = getPagesForRole();
    
    const handleLogout = async () => {
        try {
            await logoutUser();
            toast.success('Logged out successfully');
            if (onLogout) {
                onLogout();
            }
            navigate(createPageUrl("Login"));
        } catch (error) {
            console.error('Logout error:', error);
            toast.error('Failed to logout');
        }
    };

    return (
        <motion.aside
            animate={{ width: collapsed ? 72 : 260 }}
            className="fixed left-0 top-0 h-screen bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 z-40 flex flex-col"
        >
            <div className="flex items-center justify-between p-4 h-16 border-b border-gray-50 dark:border-gray-700">
                {!collapsed && (
                    <Link to={createPageUrl("Landing")} className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6C63FF] to-[#3b82f6] flex items-center justify-center shadow-md shadow-[#6C63FF]/30 flex-shrink-0">
                            <Compass className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
                            CareerCompass
                        </span>
                    </Link>
                )}
                {collapsed && (
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6C63FF] to-[#3b82f6] flex items-center justify-center mx-auto shadow-md shadow-[#6C63FF]/30 flex-shrink-0">
                        <Compass className="w-5 h-5 text-white" />
                    </div>
                )}
                <button
                    onClick={onToggle}
                    className="hidden lg:flex p-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-400"
                >
                    {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
            </div>

            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {pages.map((pageName) => {
                    const Icon = pageIcons[pageName] || LayoutDashboard;
                    const isActive = currentPage === pageName;

                    // Format the label for display
                    const label = pageName.replace(/([A-Z])/g, ' $1').trim();

                    // Generate URL - handle special cases
                    let url;
                    if (pageName === "DashboardSettings") {
                        url = "/dashboard/settings";
                    } else if (pageName === "Dashboard") {
                        url = "/dashboard";
                    } else if (pageName === "ResumeIntelligence") {
                        url = "/dashboard/resume";
                    } else if (pageName === "JobRecommendations") {
                        url = "/dashboard/recommendations";
                    } else if (pageName === "CareerChat") {
                        url = "/dashboard/chat";
                    } else if (pageName === "SalaryIntelligence") {
                        url = "/dashboard/salary";
                    } else if (pageName === "InterviewPrep") {
                        url = "/dashboard/interview";
                    } else if (pageName === "CompanyDashboard") {
                        url = "/company/dashboard";
                    } else if (pageName === "PostJob") {
                        url = "/company/post-job";
                    } else if (pageName === "Candidates") {
                        url = "/company/candidates";
                    } else if (pageName === "My Jobs") {
                        url = "/company/my-jobs";
                    } else if (pageName === "CompanyAnalytics") {
                        url = "/company/analytics";
                    } else if (pageName === "AdminDashboard") {
                        url = "/admin/dashboard";
                    } else if (pageName === "AdminUsers") {
                        url = "/admin/users";
                    } else if (pageName === "AdminCompanies") {
                        url = "/admin/companies";
                    } else if (pageName === "AdminAI") {
                        url = "/admin/ai";
                    } else if (pageName === "AdminSystem") {
                        url = "/admin/system";
                    }else if (pageName === "CareerInsights") {
                         url = "/career-insights";
                    }
                    
                    else {
                        url = createPageUrl(pageName);
                    }

                    return (
                        <Link
                            key={pageName}
                            to={url}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                                    ? "bg-[#6C63FF] text-white shadow-md shadow-[#6C63FF]/20"
                                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
                                }`}
                        >
                            <Icon className="w-5 h-5 flex-shrink-0" />
                            {!collapsed && <span>{label}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* Logout Button */}
            <div className="p-4 border-t border-gray-50 dark:border-gray-700">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                >
                    <LogOut className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span>Logout</span>}
                </button>
            </div>
        </motion.aside>
    );
}