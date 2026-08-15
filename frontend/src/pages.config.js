/**
 * pages.config.js - Page routing configuration
 */

// ==================== IMPORTS ====================
import Landing from './Pages/Landing';
import Dashboard from './Pages/Dashboard';
import ResumeIntelligence from './Pages/ResumeIntelligence';
import JobRecommendations from './Pages/JobRecommendations';
import CareerChat from './Pages/CareerChat';
import SalaryIntelligence from './Pages/SalaryIntelligence';
import InterviewPrep from './Pages/InterviewPrep';
import Jobs from './Pages/Jobs';
import CompanyDashboard from './Pages/CompanyDashboard';
import PostJob from './Pages/PostJob';
import Candidates from './Pages/Candidates';
import CompanyAnalytics from './Pages/CompanyAnalytics';
import AdminDashboard from './Pages/AdminDashboard';
import AdminUsers from './Pages/AdminUsers';
import AdminCompanies from './Pages/AdminCompanies';
import AdminAI from './Pages/AdminAI';
import AdminSystem from './Pages/AdminSystem';
import DashboardSettings from './Pages/DashboardSettings';
import Login from './Pages/Login';
import Register from './Pages/Register';
import Profile from './Pages/Profile';
import MyApplications from './Pages/MyApplications';
import SavedJobs from './Pages/SavedJobs';
import CareerInsights from './Pages/CareerInsights';
import MyJobs from './Pages/MyJobs';
import JobDetails from './Pages/JobDetails';

// ==================== PAGE CATEGORIES ====================

export const PAGE_CATEGORIES = {
    // Public pages (accessible to everyone)
    public: [
        "Landing",
        "Jobs",
        "JobDetails",
        "Login",
        "Register"
    ],

    // Job seeker pages
    jobSeeker: [
        "Dashboard",
        "ResumeIntelligence",
        "JobRecommendations",
        "CareerChat",
        "SalaryIntelligence",
        "InterviewPrep",
        "DashboardSettings",
        "Profile",
        "MyApplications",
        "SavedJobs",
        "CareerInsights"
    ],

    // Company pages
    company: [
        "CompanyDashboard",
        "PostJob",
        "Candidates",
        "MyJobs",
        "CompanyAnalytics",
        "DashboardSettings",
        "Profile"
    ],

    // Admin pages
    admin: [
        "AdminDashboard",
        "AdminUsers",
        "AdminCompanies",
        "AdminAI",
        "AdminSystem",
        "DashboardSettings"
    ]
};

// ==================== PAGES OBJECT ====================

export const PAGES = {
    "Landing": Landing,
    "Login": Login,
    "Register": Register,
    "Dashboard": Dashboard,
    "ResumeIntelligence": ResumeIntelligence,
    "JobRecommendations": JobRecommendations,
    "CareerChat": CareerChat,
    "SalaryIntelligence": SalaryIntelligence,
    "InterviewPrep": InterviewPrep,
    "Jobs": Jobs,
    "CompanyDashboard": CompanyDashboard,
    "PostJob": PostJob,
    "Candidates": Candidates,
    "MyJobs": MyJobs,
    "CompanyAnalytics": CompanyAnalytics,
    "AdminDashboard": AdminDashboard,
    "AdminUsers": AdminUsers,
    "AdminCompanies": AdminCompanies,
    "AdminAI": AdminAI,
    "AdminSystem": AdminSystem,
    "DashboardSettings": DashboardSettings,
    "Profile": Profile,
    "MyApplications": MyApplications,
    "SavedJobs": SavedJobs,
    "JobDetails": JobDetails,
    "CareerInsights": CareerInsights
};

// ==================== MAIN CONFIG ====================

export const pagesConfig = {
    mainPage: "Landing",
    Pages: PAGES,
    categories: PAGE_CATEGORIES
};