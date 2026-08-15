// utils/index.js
import { pagesConfig } from '@/pages.config';

// Define PAGE_TO_URL first (doesn't depend on pagesConfig)
const PAGE_TO_URL = {
    "Landing": "/",
    "Login": "/login",
    "Register": "/register",
    "Dashboard": "/dashboard",
    "ResumeIntelligence": "/dashboard/resume",
    "JobRecommendations": "/dashboard/recommendations",
    "CareerChat": "/dashboard/chat",
    "SalaryIntelligence": "/dashboard/salary",
    "InterviewPrep": "/dashboard/interview",
    "Jobs": "/jobs",
    "CompanyDashboard": "/company/dashboard",
    "PostJob": "/company/post-job",
    "Candidates": "/company/candidates",
    "MyJobs": "/company/my-jobs",
    "CompanyAnalytics": "/company/analytics",
    "AdminDashboard": "/admin/dashboard",
    "AdminUsers": "/admin/users",
    "AdminCompanies": "/admin/companies",
    "AdminAI": "/admin/ai",
    "AdminSystem": "/admin/system",
    "DashboardSettings": "/dashboard/settings",
    "Profile": "/profile",
    "Notifications": "/notifications",
    "MyApplications": "/applications",
    "CareerInsights": "/career-insights",
    "SavedJobs": "/savedjobs"
};

// Helper function to safely get categories (handles circular dependency)
const getCategories = () => {
    try {
        if (pagesConfig && pagesConfig.categories) {
            return pagesConfig.categories;
        }
    } catch (error) {
        console.warn('Could not load categories from pagesConfig:', error);
    }
    
    // Fallback categories in case pagesConfig is not available
    return {
        public: ["Landing", "Jobs", "Login", "Register"],
        jobSeeker: ["Dashboard", "ResumeIntelligence", "JobRecommendations", "CareerChat", "SalaryIntelligence", "InterviewPrep"],
        company: ["CompanyDashboard", "PostJob", "Candidates", "MyJobs", "CompanyAnalytics"],
        admin: ["AdminDashboard", "AdminUsers", "AdminCompanies", "AdminAI", "AdminSystem"]
    };
};

// Helper function to safely get mainPage
const getMainPageConfig = () => {
    try {
        if (pagesConfig && pagesConfig.mainPage) {
            return pagesConfig.mainPage;
        }
    } catch (error) {
        console.warn('Could not load mainPage from pagesConfig:', error);
    }
    return "Landing";
};

/**
 * Create URL from page name
 * @param {string} pageName - Name of the page
 * @returns {string} URL path
 */
export const createPageUrl = (pageName) => {
    const url = PAGE_TO_URL[pageName];
    if (!url) {
        console.warn(`No URL mapping found for page: ${pageName}, using fallback`);
        return `/${pageName.toLowerCase()}`;
    }
    return url;
};

/**
 * Get page name from URL
 * @param {string} url - URL path
 * @returns {string} Page name
 */
export const getPageFromUrl = (url) => {
    const entry = Object.entries(PAGE_TO_URL).find(([_, pageUrl]) => pageUrl === url);
    return entry ? entry[0] : null;
};

/**
 * Check if a page is public (accessible without authentication)
 * @param {string} pageName - Name of the page
 * @returns {boolean} - True if public page
 */
export const isPublicPage = (pageName) => {
    const categories = getCategories();
    return categories.public?.includes(pageName) || false;
};

/**
 * Get pages by user role
 * @param {string} role - User role (admin, company, job_seeker)
 * @returns {Array} - List of page names accessible to the role
 */
export const getPagesByRole = (role) => {
    const categories = getCategories();
    switch (role) {
        case 'admin':
            return categories.admin || [];
        case 'company':
            return categories.company || [];
        case 'job_seeker':
            return categories.jobSeeker || [];
        default:
            return [];
    }
};

/**
 * Get all pages
 * @returns {Object} - All pages object
 */
export const getAllPages = () => {
    try {
        if (pagesConfig && pagesConfig.Pages) {
            return pagesConfig.Pages;
        }
    } catch (error) {
        console.warn('Could not load Pages from pagesConfig:', error);
    }
    return {};
};

/**
 * Get main page
 * @returns {string} - Main page name
 */
export const getMainPage = () => {
    return getMainPageConfig();
};

/**
 * Format currency
 * @param {number} amount - The amount to format
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return '$0';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

/**
 * Format date
 * @param {string|Date} date - The date to format
 * @returns {string} - Formatted date string
 */
export const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        }).format(new Date(date));
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Invalid date';
    }
};

/**
 * Format relative time (e.g., "2 days ago")
 * @param {string|Date} date - The date to format
 * @returns {string} - Relative time string
 */
export const formatRelativeTime = (date) => {
    if (!date) return 'N/A';
    
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now - past) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
    
    return formatDate(date);
};

/**
 * Truncate text
 * @param {string} text - The text to truncate
 * @param {number} length - Maximum length
 * @returns {string} - Truncated text
 */
export const truncateText = (text, length = 100) => {
    if (!text) return '';
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
};

/**
 * Calculate match score between two sets of skills
 * @param {Array} userSkills - User's skills
 * @param {Array} jobSkills - Job required skills
 * @returns {number} - Match percentage
 */
export const calculateMatchScore = (userSkills = [], jobSkills = []) => {
    if (!jobSkills.length) return 0;
    if (!userSkills.length) return 0;

    const normalizedUserSkills = userSkills.map(s => s.toLowerCase().trim());
    const normalizedJobSkills = jobSkills.map(s => s.toLowerCase().trim());

    const matched = normalizedUserSkills.filter(userSkill =>
        normalizedJobSkills.some(jobSkill =>
            jobSkill.includes(userSkill) || userSkill.includes(jobSkill)
        )
    ).length;

    return Math.round((matched / normalizedJobSkills.length) * 100);
};

/**
 * Calculate authenticity score based on job data
 * @param {Object} job - Job object
 * @returns {number} - Authenticity score (0-100)
 */
export const calculateAuthenticityScore = (job) => {
    let score = 50;
    
    if (job.url) score += 20;
    if (job.company && job.company.length > 2) score += 10;
    if (job.description && job.description.length > 200) score += 10;
    if (job.salary) score += 5;
    if (job.location) score += 5;
    if (job.skills && job.skills.length > 0) score += 5;
    
    const trustedSources = ["RemoteOK", "Remotive", "LinkedIn", "Indeed"];
    if (trustedSources.includes(job.source)) score += 5;
    
    return Math.min(score, 100);
};

/**
 * Group jobs by date
 * @param {Array} jobs - List of jobs
 * @returns {Object} - Grouped jobs by date
 */
export const groupJobsByDate = (jobs) => {
    const groups = {
        today: [],
        yesterday: [],
        thisWeek: [],
        older: []
    };
    
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    jobs.forEach(job => {
        const jobDate = new Date(job.date_posted || job.scraped_at || job.created_at);
        
        if (jobDate.toDateString() === today.toDateString()) {
            groups.today.push(job);
        } else if (jobDate.toDateString() === yesterday.toDateString()) {
            groups.yesterday.push(job);
        } else if (jobDate > weekAgo) {
            groups.thisWeek.push(job);
        } else {
            groups.older.push(job);
        }
    });
    
    return groups;
};

/**
 * Get unique values from array
 * @param {Array} arr - Input array
 * @returns {Array} - Array with unique values
 */
export const getUniqueValues = (arr) => {
    return [...new Set(arr)];
};

/**
 * Sort jobs by specified criteria
 * @param {Array} jobs - List of jobs
 * @param {string} sortBy - Sort criteria (match, date, salary, authenticity)
 * @returns {Array} - Sorted jobs
 */
export const sortJobs = (jobs, sortBy = 'match') => {
    const sorted = [...jobs];
    
    switch (sortBy) {
        case 'match':
            return sorted.sort((a, b) => (b.match_score || 0) - (a.match_score || 0));
        case 'date':
            return sorted.sort((a, b) => new Date(b.date_posted || b.scraped_at) - new Date(a.date_posted || a.scraped_at));
        case 'salary':
            return sorted.sort((a, b) => (b.salary_max || 0) - (a.salary_max || 0));
        case 'authenticity':
            return sorted.sort((a, b) => (b.authenticity_score || 0) - (a.authenticity_score || 0));
        default:
            return sorted;
    }
};

/**
 * Filter jobs by criteria
 * @param {Array} jobs - List of jobs
 * @param {Object} filters - Filter criteria
 * @returns {Array} - Filtered jobs
 */
export const filterJobs = (jobs, filters = {}) => {
    let filtered = [...jobs];
    
    if (filters.job_type && filters.job_type !== 'all') {
        filtered = filtered.filter(job => job.job_type === filters.job_type);
    }
    
    if (filters.verification && filters.verification !== 'all') {
        filtered = filtered.filter(job => job.verification_status === filters.verification);
    }
    
    if (filters.min_match && filters.min_match > 0) {
        filtered = filtered.filter(job => (job.match_score || 0) >= filters.min_match);
    }
    
    if (filters.min_authenticity && filters.min_authenticity > 0) {
        filtered = filtered.filter(job => (job.authenticity_score || 0) >= filters.min_authenticity);
    }
    
    if (filters.location) {
        filtered = filtered.filter(job => 
            job.location?.toLowerCase().includes(filters.location.toLowerCase())
        );
    }
    
    if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filtered = filtered.filter(job =>
            job.title?.toLowerCase().includes(searchLower) ||
            job.company?.toLowerCase().includes(searchLower) ||
            job.skills?.some(skill => skill.toLowerCase().includes(searchLower))
        );
    }
    
    return filtered;
};

/**
 * Get color for match score
 * @param {number} score - Match score (0-100)
 * @returns {string} - Color class
 */
export const getMatchScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-blue-600 bg-blue-50';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-gray-600 bg-gray-50';
};

/**
 * Get color for authenticity score
 * @param {number} score - Authenticity score (0-100)
 * @returns {string} - Color class
 */
export const getAuthenticityColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-blue-600 bg-blue-50';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
};

/**
 * Debounce function for search inputs
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} - Debounced function
 */
export const debounce = (func, delay = 300) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), delay);
    };
};

/**
 * Local storage helper
 */
export const storage = {
    get: (key) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return null;
        }
    },
    set: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Error writing to localStorage:', error);
            return false;
        }
    },
    remove: (key) => {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Error removing from localStorage:', error);
            return false;
        }
    },
    clear: () => {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Error clearing localStorage:', error);
            return false;
        }
    }
};