import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    User, Briefcase, Target, Download, Filter, Clock,
    AlertCircle, CheckCircle, RefreshCw
} from 'lucide-react';
import {
    getUserJobs,
    analyzeSkillGap,
    getJobStatus,
    pollForJobs,
    getFilterOptions,
    filterExistingJobs
} from '../utils/api';
import toast from 'react-hot-toast';
import ResumeUpload from '../components/ResumeUpload';
import JobList from '../components/JobList';
import SkillGap from '../components/SkillGap';
import JobFilters from '../components/JobFilters';

const Dashboard = () => {
    const { userId } = useParams();
    const navigate = useNavigate();

    // State management
    const [userData, setUserData] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [filteredJobs, setFilteredJobs] = useState([]);
    const [skillGapAnalysis, setSkillGapAnalysis] = useState(null);
    const [activeTab, setActiveTab] = useState('jobs');
    const [loading, setLoading] = useState(true);
    const [processingStatus, setProcessingStatus] = useState(null);
    const [polling, setPolling] = useState(false);
    const [activeFilters, setActiveFilters] = useState({});
    const [filterOptions, setFilterOptions] = useState(null);
    const [showFilters, setShowFilters] = useState(true);
    const [filterLoading, setFilterLoading] = useState(false);

    // ✅ Load data on mount
    useEffect(() => {
        if (userId) {
            fetchUserAndJobs();
            loadFilterOptions();
        }
    }, [userId]);

    // ✅ Load filter options from backend
    const loadFilterOptions = async () => {
        try {
            console.log('📋 Loading filter options...');
            const response = await getFilterOptions();

            if (response.success && response.options) {
                setFilterOptions(response.options);
                console.log('✅ Filter options loaded');
            }
        } catch (error) {
            console.error('❌ Error loading filter options:', error);
            toast.error('Failed to load filter options');
        }
    };

    // ✅ Fetch user data and jobs
    const fetchUserAndJobs = async () => {
        try {
            setLoading(true);

            // Check processing status first
            const statusResponse = await getJobStatus(userId);
            setProcessingStatus(statusResponse.status);

            // If jobs are still processing, start polling
            if (statusResponse.status?.is_processing) {
                // ✅ FIXED: Use toast() instead of toast.info()
                toast('Jobs are being processed...', {
                    icon: '⏳',
                    duration: 3000,
                });
                startJobPolling();
            } else {
                // Jobs are ready, fetch them
                const jobsResponse = await getUserJobs(userId);

                if (jobsResponse.success) {
                    const fetchedJobs = jobsResponse.jobs || [];
                    setJobs(fetchedJobs);
                    setFilteredJobs(fetchedJobs);

                    console.log(`✅ Loaded ${fetchedJobs.length} jobs`);

                    if (fetchedJobs.length > 0) {
                        toast.success(`${fetchedJobs.length} jobs loaded!`);
                    }
                } else if (jobsResponse.status === 'processing') {
                    // Still processing
                    startJobPolling();
                } else {
                    // ✅ FIXED: Use toast() instead of toast.info()
                    toast('No jobs found yet. They may still be processing.', {
                        icon: 'ℹ️',
                        duration: 4000,
                    });
                }
            }

            // ✅ Set mock user data (replace with actual API call if available)
            setUserData({
                contact: {
                    name: 'John Doe',
                    email: 'john@example.com'
                },
                skills: ['Python', 'JavaScript', 'React', 'Node.js', 'MongoDB', 'AWS'],
                experience: [
                    { title: 'Full Stack Developer', company: 'Tech Corp', duration: '2 years' },
                    { title: 'Frontend Developer', company: 'Startup Inc', duration: '1 year' }
                ],
                education: [
                    { degree: 'BS Computer Science', institution: 'State University' }
                ]
            });

        } catch (error) {
            console.error('❌ Error fetching data:', error);
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    // ✅ Start polling for jobs
    const startJobPolling = async () => {
        if (polling) return; // Prevent multiple polling instances

        setPolling(true);
        // ✅ FIXED: Use toast() instead of toast.info()
        toast('Finding matching jobs... This may take 30-60 seconds', {
            icon: '🔍',
            duration: 4000,
        });

        try {
            const result = await pollForJobs(userId, 20, 5000); // 20 attempts, 5s interval

            if (result.success && result.jobs) {
                const fetchedJobs = result.jobs;
                setJobs(fetchedJobs);
                setFilteredJobs(fetchedJobs);
                setActiveFilters({}); // Clear filters on new data

                toast.success(`${fetchedJobs.length} jobs found!`);
            } else {
                toast('No jobs found. Try uploading a different resume.', {
                    icon: '⚠️',
                    duration: 4000,
                });
            }
        } catch (error) {
            console.error('❌ Polling error:', error);
            toast.error('Job matching timed out. Please refresh the page.');
        } finally {
            setPolling(false);
        }
    };

    // ✅ Handle skill gap analysis
    const handleSkillGapAnalysis = async (job) => {
        try {
            // ✅ Extract job ID safely
            const jobId = job.job_id || job.id || job.job_uuid ||
                `${job.title}_${job.company}`.replace(/\s+/g, '_');

            console.log(`🔍 Analyzing skill gap for job: ${jobId}`);

            const response = await analyzeSkillGap(userId, jobId);

            if (response.success) {
                setSkillGapAnalysis(response);
                setActiveTab('analysis');
                toast.success('Skill gap analyzed!');
            } else {
                throw new Error('Skill gap analysis failed');
            }
        } catch (error) {
            console.error('❌ Error analyzing skill gap:', error);

            // ✅ Fallback to client-side analysis
            const userSkills = userData?.skills || [];
            const jobSkills = job.skills || [];

            const userSkillsLower = userSkills.map(s => s.toLowerCase());
            const jobSkillsLower = jobSkills.map(s => s.toLowerCase());

            const matchingSkills = userSkills.filter(skill =>
                jobSkillsLower.includes(skill.toLowerCase())
            );

            const missingSkills = jobSkills.filter(skill =>
                !userSkillsLower.includes(skill.toLowerCase())
            );

            const matchPercentage = jobSkills.length > 0
                ? Math.round((matchingSkills.length / jobSkills.length) * 100)
                : 0;

            setSkillGapAnalysis({
                success: true,
                user_skills: userSkills,
                required_skills: jobSkills,
                missing_skills: missingSkills,
                matching_skills: matchingSkills,
                match_percentage: matchPercentage,
                recommendations: missingSkills.slice(0, 3).map(skill => ({
                    skill: skill,
                    resources: [
                        { name: 'Udemy', url: `https://www.udemy.com/courses/search/?q=${skill}` },
                        { name: 'Coursera', url: `https://www.coursera.org/search?query=${skill}` },
                        { name: 'YouTube', url: `https://www.youtube.com/results?search_query=${skill}+tutorial` }
                    ]
                }))
            });

            setActiveTab('analysis');
            toast.success('Skill gap analyzed (client-side)');
        }
    };

    // ✅ Check if filters are active
    const hasActiveFilters = (filters) => {
        if (!filters || typeof filters !== 'object') return false;

        return Object.entries(filters).some(([key, value]) => {
            if (key === 'job_type') return value && value !== 'any';
            if (key === 'date_posted_filter') return value && value !== 'any';
            if (key === 'min_match_percentage') return value > 0;
            if (key === 'salary_min') return value !== null && value > 0;
            if (key === 'location_filter') return value && value.trim() !== '';
            if (key === 'skills_filter') return Array.isArray(value) && value.length > 0;
            return false;
        });
    };

    // ✅ Handle filter changes
    const handleFilterChange = async (filters) => {
        console.log('🔧 Filter changed:', filters);
        setActiveFilters(filters);

        // If no active filters, show all jobs
        if (!hasActiveFilters(filters)) {
            console.log('ℹ️ No active filters, showing all jobs');
            setFilteredJobs(jobs);
            return;
        }

        try {
            setFilterLoading(true);

            // ✅ Call backend API to filter jobs
            const response = await filterExistingJobs(jobs, filters);

            if (response.success) {
                setFilteredJobs(response.jobs);
                console.log(`✅ Filtered from ${response.original_count} to ${response.filtered_count} jobs`);

                if (response.filtered_count === 0) {
                    // ✅ FIXED: Use toast() instead of toast.info()
                    toast('No jobs match your filters. Try adjusting them.', {
                        icon: 'ℹ️',
                        duration: 3000,
                    });
                } else {
                    toast.success(`Found ${response.filtered_count} matching jobs`);
                }
            }
        } catch (error) {
            console.error('❌ Error filtering jobs:', error);
            toast.error('Failed to apply filters');
            // Keep showing all jobs on error
            setFilteredJobs(jobs);
        } finally {
            setFilterLoading(false);
        }
    };

    // ✅ Refresh jobs
    const refreshJobs = async () => {
        try {
            setLoading(true);
            // ✅ FIXED: Use toast.loading() for better UX
            const loadingToast = toast.loading('Refreshing jobs...');

            const jobsResponse = await getUserJobs(userId);

            if (jobsResponse.success) {
                const fetchedJobs = jobsResponse.jobs || [];
                setJobs(fetchedJobs);
                setFilteredJobs(fetchedJobs);
                setActiveFilters({});

                toast.success(`Refreshed! ${fetchedJobs.length} jobs loaded`, {
                    id: loadingToast,
                });
            } else if (jobsResponse.status === 'processing') {
                toast('Jobs are still being processed...', {
                    id: loadingToast,
                    icon: '⏳',
                });
                startJobPolling();
            } else {
                toast('No jobs available', {
                    id: loadingToast,
                    icon: '⚠️',
                });
            }
        } catch (error) {
            console.error('❌ Refresh error:', error);
            toast.error('Failed to refresh jobs');
        } finally {
            setLoading(false);
        }
    };

    // ✅ Export filtered jobs
    const exportFilteredJobs = () => {
        try {
            const jobsToExport = filteredJobs.length > 0 ? filteredJobs : jobs;

            if (jobsToExport.length === 0) {
                toast('No jobs to export', {
                    icon: '⚠️',
                });
                return;
            }

            const dataStr = JSON.stringify(jobsToExport, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

            const exportFileName = `job_matches_${userId.slice(0, 8)}_${new Date().toISOString().split('T')[0]}.json`;

            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileName);
            document.body.appendChild(linkElement);
            linkElement.click();
            document.body.removeChild(linkElement);

            toast.success(`Exported ${jobsToExport.length} jobs!`);
        } catch (error) {
            console.error('❌ Export error:', error);
            toast.error('Failed to export jobs');
        }
    };

    // ✅ Handle upload success
    const handleUploadSuccess = (data) => {
        const newUserId = data.user_id;
        navigate(`/dashboard/${newUserId}`);
        toast.success('Resume uploaded! Finding job matches...');
    };

    // ✅ If no userId, show upload form
    if (!userId) {
        return (
            <div className="max-w-6xl mx-auto px-4 py-8">
                <ResumeUpload onUploadSuccess={handleUploadSuccess} />
            </div>
        );
    }

    // ✅ Calculate displayed jobs count
    const displayedJobs = filteredJobs.length > 0 ? filteredJobs : jobs;
    const isFiltered = hasActiveFilters(activeFilters);

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
                <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-900">Career Dashboard</h1>
                    <p className="text-gray-600 mt-2">
                        AI-powered career recommendations based on your resume
                    </p>



                    {/* Polling Status */}
                    {polling && (
                        <div className="mt-4 flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                            <div>
                                <p className="font-medium text-blue-800">Finding matching jobs...</p>
                                <p className="text-sm text-blue-700">
                                    Scanning job listings and calculating matches
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Filter Status */}
                    {isFiltered && (
                        <div className="mt-4 flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <Filter className="w-5 h-5 text-green-600" />
                            <div className="flex-1">
                                <p className="font-medium text-green-800">
                                    Showing {filteredJobs.length} of {jobs.length} jobs
                                </p>
                                <p className="text-sm text-green-700">
                                    {activeFilters.job_type && activeFilters.job_type !== 'any' &&
                                        `Type: ${activeFilters.job_type} • `}
                                    {activeFilters.min_match_percentage > 0 &&
                                        `Match: ${activeFilters.min_match_percentage}%+ • `}
                                    {activeFilters.date_posted_filter && activeFilters.date_posted_filter !== 'any' &&
                                        `Posted: ${activeFilters.date_posted_filter}`}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setActiveFilters({});
                                    setFilteredJobs(jobs);
                                }}
                                className="text-green-700 hover:text-green-900 text-sm font-medium"
                            >
                                Clear
                            </button>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 flex-wrap">
                    <button
                        onClick={exportFilteredJobs}
                        disabled={jobs.length === 0}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download className="w-4 h-4" />
                        Export ({displayedJobs.length})
                    </button>

                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                        <Filter className="w-4 h-4" />
                        {showFilters ? 'Hide Filters' : 'Show Filters'}
                    </button>

                    <button
                        onClick={refreshJobs}
                        disabled={loading || polling}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Filters Section */}
            {showFilters && filterOptions && (
                <div className="mb-8">
                    <JobFilters
                        onFilterChange={handleFilterChange}
                        initialFilters={activeFilters}
                        options={filterOptions}
                        availableJobs={jobs}
                    />
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Sidebar - User Profile */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-8">
                        {/* User Info */}
                        <div className="text-center mb-6">
                            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4">
                                {userData?.contact?.name?.charAt(0) || 'U'}
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">
                                {userData?.contact?.name || 'User'}
                            </h3>
                            <p className="text-gray-600 text-sm">{userData?.contact?.email || 'No email'}</p>
                            <div className="mt-2">
                                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                    ID: {userId.slice(0, 8)}
                                </span>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="space-y-4 mb-6">
                            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <Briefcase className="w-5 h-5 text-blue-600" />
                                    <span className="text-gray-700 text-sm">Total Jobs</span>
                                </div>
                                <span className="text-2xl font-bold text-gray-900">{jobs.length}</span>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <Target className="w-5 h-5 text-green-600" />
                                    <span className="text-gray-700 text-sm">Showing</span>
                                </div>
                                <span className="text-2xl font-bold text-gray-900">
                                    {displayedJobs.length}
                                </span>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <User className="w-5 h-5 text-purple-600" />
                                    <span className="text-gray-700 text-sm">Your Skills</span>
                                </div>
                                <span className="text-2xl font-bold text-gray-900">
                                    {userData?.skills?.length || 0}
                                </span>
                            </div>
                        </div>

                        {/* Skills */}
                        <div className="mb-6">
                            <h4 className="text-lg font-semibold text-gray-900 mb-3">Your Skills</h4>
                            <div className="flex flex-wrap gap-2">
                                {userData?.skills?.slice(0, 10).map((skill, index) => (
                                    <span
                                        key={index}
                                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                                    >
                                        {skill}
                                    </span>
                                ))}
                                {userData?.skills?.length > 10 && (
                                    <span className="px-3 py-1 bg-gray-200 text-gray-600 rounded-full text-sm">
                                        +{userData.skills.length - 10} more
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-6 border-t space-y-3">
                            <button
                                onClick={() => navigate('/')}
                                className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                            >
                                Upload New Resume
                            </button>
                            <button
                                onClick={refreshJobs}
                                disabled={loading || polling}
                                className="w-full py-3 bg-white border border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading || polling ? 'Loading...' : 'Refresh Jobs'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-2">
                    {/* Tabs */}
                    <div className="flex border-b border-gray-200 mb-6">
                        <button
                            onClick={() => setActiveTab('jobs')}
                            className={`px-4 py-3 font-medium text-lg border-b-2 transition-colors ${activeTab === 'jobs'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Recommended Jobs
                            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                {displayedJobs.length}
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('analysis')}
                            className={`px-4 py-3 font-medium text-lg border-b-2 transition-colors ${activeTab === 'analysis'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Skill Gap Analysis
                            {skillGapAnalysis && (
                                <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                    Ready
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="min-h-[600px]">
                        {activeTab === 'jobs' ? (
                            <>
                                {loading || polling ? (
                                    <div className="flex flex-col items-center justify-center h-64 space-y-4">
                                        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                                        <div className="text-center">
                                            <p className="text-gray-800 font-medium">
                                                {polling ? 'Finding your perfect job matches' : 'Loading results'}
                                            </p>
                                            <p className="text-gray-600 text-sm mt-2">
                                                {polling ? 'Scanning job listings...' : 'Please wait...'}
                                            </p>
                                            <div className="mt-4 flex items-center justify-center space-x-2">
                                                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                                                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse delay-100"></div>
                                                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse delay-200"></div>
                                            </div>
                                        </div>
                                    </div>
                                ) : jobs.length === 0 ? (
                                    <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                                        <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                            <AlertCircle className="w-8 h-8 text-gray-400" />
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900">No Jobs Found Yet</h3>
                                        <p className="text-gray-600 mt-2 mb-6">
                                            Job matching might still be processing, or no matches were found.
                                        </p>
                                        <button
                                            onClick={startJobPolling}
                                            disabled={polling}
                                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                        >
                                            {polling ? 'Checking...' : 'Check Again'}
                                        </button>
                                    </div>
                                ) : displayedJobs.length === 0 ? (
                                    <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                                        <div className="w-16 h-16 mx-auto bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                                            <Filter className="w-8 h-8 text-yellow-600" />
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900">No Jobs Match Your Filters</h3>
                                        <p className="text-gray-600 mt-2 mb-6">
                                            Try adjusting your filters to see more results.
                                        </p>
                                        <button
                                            onClick={() => {
                                                setActiveFilters({});
                                                setFilteredJobs(jobs);
                                                // ✅ FIXED: Use toast() instead of toast.info()
                                                toast('Filters cleared', { icon: 'ℹ️' });
                                            }}
                                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            Clear All Filters
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        {filterLoading && (
                                            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                                <span className="text-blue-800 text-sm">Applying filters...</span>
                                            </div>
                                        )}
                                        <JobList
                                            jobs={displayedJobs}
                                            onAnalyzeSkillGap={handleSkillGapAnalysis}
                                        />
                                    </>
                                )}
                            </>
                        ) : (
                            <SkillGap
                                analysis={skillGapAnalysis}
                                onBack={() => setActiveTab('jobs')}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

