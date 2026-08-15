// frontend/src/utils/api.js - COMPLETE FIXED VERSION
import axios from 'axios';

// ✅ Create axios instance with proper configuration
const api = axios.create({
  baseURL: 'http://localhost:5000',  // Backend URL
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// Request interceptor - Add auth token to all requests
api.interceptors.request.use(
  (config) => {
    console.log(`🚀 ${config.method.toUpperCase()} ${config.url}`);

    // Add token to headers if available - FIXED: Use correct token key
    const token = localStorage.getItem('careerai_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor with better error handling
api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.config.method.toUpperCase()} ${response.config.url} - ${response.status}`);
    return response;
  },
  (error) => {
    if (error.code === 'ERR_NETWORK') {
      console.error('❌ Backend is not running!');
      console.log('💡 Start backend: cd backend && python app.py');
    } else if (error.response) {
      console.error(`⚠️ API Error ${error.response.status}:`, error.response.data);

      // Handle 401 Unauthorized - clear token
      if (error.response.status === 401) {
        localStorage.removeItem('careerai_access_token');
        localStorage.removeItem('careerai_user');
      }
    }
    return Promise.reject(error);
  }
);

// ==================== AUTHENTICATION METHODS ====================

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @returns {Promise}
 */
export const registerUser = async (userData) => {
  try {
    console.log('📝 Registering user:', { ...userData, password: '***' });
    const response = await api.post('/api/auth/register', userData);
    console.log('✅ Registration successful');

    // Store token and user data
    if (response.data.token) {
      localStorage.setItem('careerai_access_token', response.data.token);
      localStorage.setItem('careerai_user', JSON.stringify(response.data.user));
    }

    return response.data;
  } catch (error) {
    console.error('❌ Registration error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Registration failed' };
  }
};

/**
 * Login user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise}
 */
export const loginUser = async (email, password) => {
  try {
    console.log('🔐 Logging in user:', email);
    const response = await api.post('/api/auth/login', { email, password });
    console.log('✅ Login successful');

    // Store token and user data
    if (response.data.token) {
      localStorage.setItem('careerai_access_token', response.data.token);
      localStorage.setItem('careerai_user', JSON.stringify(response.data.user));
    }

    return response.data;
  } catch (error) {
    console.error('❌ Login error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Login failed' };
  }
};



export const logoutUser = async () => {
  try {
    const token = localStorage.getItem('careerai_access_token');
    if (token) {
      await api.post('/api/auth/logout');
    }
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Always clear local storage
    localStorage.removeItem('careerai_access_token');
    localStorage.removeItem('careerai_user');
  }
};
/**
 * Get current user
 * @returns {Promise}
 */
export const getCurrentUser = async () => {
  try {
    const token = localStorage.getItem('careerai_access_token');
    if (!token) {
      return { success: false, user: null };
    }

    const response = await api.get('/api/auth/me');

    // Update stored user data
    if (response.data.user) {
      localStorage.setItem('careerai_user', JSON.stringify(response.data.user));
    }

    return response.data;
  } catch (error) {
    console.error('❌ Get user error:', error.response?.data || error.message);

    // If token is invalid, clear storage
    if (error.response?.status === 401) {
      localStorage.removeItem('careerai_access_token');
      localStorage.removeItem('careerai_user');
    }

    return { success: false, user: null };
  }
};
/**
 * Analyze skill gap between user and job
 * @param {string} jobId - Job ID
 * @returns {Promise}
 */
export const analyzeSkillGap = async (jobId) => {
  try {
    const response = await api.get(`/api/skill-gap/${jobId}`);
    return response.data;
  } catch (error) {
    console.error('❌ Skill gap analysis error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to analyze skill gap' };
  }
};

/**
 * Update user profile
 * @param {Object} profileData - Profile data to update
 * @returns {Promise}
 */
export const updateUserProfile = async (profileData) => {
  try {
    const token = localStorage.getItem('careerai_access_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await api.put('/api/auth/update-profile', profileData);

    // Update stored user data
    if (response.data.user) {
      localStorage.setItem('careerai_user', JSON.stringify(response.data.user));
    }

    return response.data;
  } catch (error) {
    console.error('❌ Update profile error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Profile update failed' };
  }
};

/**
 * Change password
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise}
 */
export const changePassword = async (currentPassword, newPassword) => {
  try {
    const token = localStorage.getItem('careerai_access_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await api.post('/api/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword
    });

    return response.data;
  } catch (error) {
    console.error('❌ Change password error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Password change failed' };
  }
};

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem('careerai_access_token');
};

/**
 * Get stored user data
 * @returns {Object|null}
 */
export const getStoredUser = () => {
  const userStr = localStorage.getItem('careerai_user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (e) {
      return null;
    }
  }
  return null;
};

// ==================== JOB METHODS (FIXED) ====================

/**
 * Post a new job (Company only)
 * @param {Object} jobData - Job posting data
 * @returns {Promise}
 */
export const postJob = async (jobData) => {
  try {
    console.log('📝 Posting new job:', jobData.title);
    const response = await api.post('/api/jobs/post', jobData);
    console.log('✅ Job posted successfully');
    return response.data;
  } catch (error) {
    console.error('❌ Post job error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to post job' };
  }
};

/**
 * Get recommended jobs (scraped + matched) - FIXED: Now uses axios
 * @param {Object} filters - Filter parameters
 * @returns {Promise}
 */
export const getRecommendedJobs = async (filters = {}) => {
  try {
    // Build query string from filters
    const params = new URLSearchParams();
    if (filters.sort_by) params.append('sort_by', filters.sort_by);
    if (filters.verification) params.append('verification', filters.verification);
    if (filters.min_match) params.append('min_match', filters.min_match);
    if (filters.min_authenticity) params.append('min_authenticity', filters.min_authenticity);
    if (filters.job_type && filters.job_type !== 'all') params.append('job_type', filters.job_type);
    if (filters.location) params.append('location', filters.location);

    const queryString = params.toString();
    const url = `/api/jobs/recommended${queryString ? `?${queryString}` : ''}`;

    console.log('🔍 Fetching recommended jobs with filters:', filters);
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('❌ Get recommended jobs error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to fetch recommended jobs' };
  }
};

/**
 * Get strict Jobs For You (from recommend_jobs)
 * @param {Object} filters - Filter parameters
 * @returns {Promise}
 */
export const getJobsForYou = async (filters = {}) => {
  try {
    // Build query string from filters
    const params = new URLSearchParams();
    if (filters.sort_by) params.append('sort_by', filters.sort_by);
    if (filters.verification) params.append('verification', filters.verification);
    if (filters.min_match) params.append('min_match', filters.min_match);
    if (filters.min_authenticity) params.append('min_authenticity', filters.min_authenticity);
    if (filters.job_type && filters.job_type !== 'all') params.append('job_type', filters.job_type);
    if (filters.location) params.append('location', filters.location);

    const queryString = params.toString();
    const url = `/api/jobs/foryou${queryString ? `?${queryString}` : ''}`;

    console.log('🔍 Fetching jobs for you strictly:', filters);
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('❌ Get jobs for you error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to fetch jobs' };
  }
};

/**
 * Get all company-posted jobs - FIXED: Now uses axios
 * @param {Object} filters - Filter parameters
 * @returns {Promise}
 */
export const getAllJobs = async (filters = {}) => {
  try {
    // Build query string from filters
    const params = new URLSearchParams();
    if (filters.sort_by) params.append('sort_by', filters.sort_by);
    if (filters.verification) params.append('verification', filters.verification);
    if (filters.min_match) params.append('min_match', filters.min_match);
    if (filters.min_authenticity) params.append('min_authenticity', filters.min_authenticity);
    if (filters.type && filters.type !== 'all') params.append('type', filters.type);
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);

    const queryString = params.toString();
    const url = `/api/jobs/all${queryString ? `?${queryString}` : ''}`;

    console.log('🔍 Fetching all jobs with filters:', filters);
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('❌ Get all jobs error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to fetch jobs' };
  }
};

/**
 * Get job details by ID
 * @param {string} jobId - Job ID
 * @returns {Promise}
 */
export const getJobDetails = async (jobId) => {
  try {
    const response = await api.get(`/api/jobs/detail/${jobId}`);
    return response.data;
  } catch (error) {
    console.error('❌ Get job details error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to fetch job details' };
  }
};

// Add these methods to your existing api.js file

// ==================== COMPANY METHODS ====================

/**
 * Get all jobs posted by the company
 * @param {string} userId - Company user ID
 * @returns {Promise}
 */
export const getCompanyJobs = async (userId) => {
    try {
        const response = await api.get(`/api/company/jobs?user_id=${userId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching company jobs:', error);
        return { success: false, jobs: [] };
    }
};

/**
 * Get applications for a specific job
 * @param {string} jobId - Job ID
 * @param {string} userId - Company user ID
 * @returns {Promise}
 */
export const getJobApplications = async (jobId, userId) => {
    try {
        const response = await api.get(`/api/company/applications/${jobId}?user_id=${userId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching job applications:', error);
        return { success: false, applications: [] };
    }
};

/**
 * Update application status
 * @param {string} applicationId - Application ID
 * @param {string} newStatus - New status
 * @param {string} userId - Company user ID
 * @returns {Promise}
 */
export const updateApplicationStatus = async (applicationId, newStatus, userId) => {
    try {
        const response = await api.post('/api/company/applications/update-status', {
            application_id: applicationId,
            status: newStatus,
            user_id: userId
        });
        return response.data;
    } catch (error) {
        console.error('Error updating application status:', error);
        return { success: false };
    }
};

// ==================== CANDIDATE RANKING METHODS ====================

/**
 * Get ranked candidates for a job
 * @param {string} jobId - Job ID
 * @param {boolean} forceRefresh - Force refresh ranking
 * @returns {Promise}
 */
export const getRankedCandidates = async (jobId, forceRefresh = false) => {
    try {
        const token = localStorage.getItem('careerai_access_token');
        if (!token) {
            throw new Error('Not authenticated');
        }
        
        const url = forceRefresh 
            ? `/api/candidates/rank/${jobId}/refresh`
            : `/api/candidates/rank/${jobId}`;
        
        const method = forceRefresh ? 'POST' : 'GET';
        
        const response = await api({
            method: method,
            url: url
        });
        
        return response.data;
    } catch (error) {
        console.error('❌ Get ranked candidates error:', error.response?.data || error.message);
        throw error.response?.data || { error: 'Failed to get candidate rankings' };
    }
};

/**
 * Analyze a candidate's resume
 * @param {string} userId - Candidate user ID
 * @returns {Promise}
 */
export const analyzeCandidateResume = async (userId) => {
    try {
        const response = await api.get(`/api/candidates/analyze/${userId}`);
        return response.data;
    } catch (error) {
        console.error('❌ Analyze candidate error:', error.response?.data || error.message);
        throw error.response?.data || { error: 'Failed to analyze candidate' };
    }
};




// ==================== COMPANY JOB MANAGEMENT METHODS ====================

/**
 * Get all jobs posted by the company
 * @returns {Promise}
 */
// In api.js - Fix the getCompanyJobsList function
export const getCompanyJobsList = async () => {
    try {
        // Get user from localStorage
        const userStr = localStorage.getItem('careerai_user');
        if (!userStr) {
            throw new Error('User not found in localStorage');
        }
        
        const user = JSON.parse(userStr);
        const userId = user.id || user.user_id || user._id;
        
        if (!userId) {
            throw new Error('User ID not found');
        }
        
        console.log('🔑 Fetching jobs for user:', userId);
        
        // Add user_id as query parameter
        const response = await api.get(`/api/company/jobs?user_id=${userId}`);
        console.log('✅ Company jobs response:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Get company jobs error:', error.response?.data || error.message);
        throw error.response?.data || { error: 'Failed to fetch company jobs' };
    }
};




// ==================== USER APPLICATIONS METHODS ====================

/**
 * Get all applications for the logged-in user
 * @returns {Promise}
 */
export const getUserApplications = async () => {
    try {
        const response = await api.get('/api/user/applications');
        return response.data;
    } catch (error) {
        console.error('❌ Get user applications error:', error.response?.data || error.message);
        throw error.response?.data || { error: 'Failed to fetch applications' };
    }
};

/**
 * Get real-time status of a specific application
 * @param {string} applicationId - Application ID
 * @returns {Promise}
 */
export const getApplicationStatus = async (applicationId) => {
    try {
        const response = await api.get(`/api/user/applications/${applicationId}/status`);
        return response.data;
    } catch (error) {
        console.error('❌ Get application status error:', error.response?.data || error.message);
        throw error.response?.data || { error: 'Failed to get application status' };
    }
};

/**
 * Get application statistics for the user
 * @returns {Promise}
 */
export const getUserApplicationStats = async () => {
    try {
        const response = await api.get('/api/user/applications/stats');
        return response.data;
    } catch (error) {
        console.error('❌ Get application stats error:', error.response?.data || error.message);
        throw error.response?.data || { error: 'Failed to fetch application stats' };
    }
};

/**
 * Get unified dashboard statistics for the job seeker
 * @returns {Promise}
 */
export const getUserDashboardStats = async () => {
    try {
        const response = await api.get('/api/user/dashboard/stats');
        return response.data;
    } catch (error) {
        console.error('❌ Get dashboard stats error:', error.response?.data || error.message);
        throw error.response?.data || { error: 'Failed to fetch dashboard stats' };
    }
};


/**
 * Update a job posting
 * @param {string} jobId - Job ID
 * @param {Object} jobData - Updated job data
 * @returns {Promise}
 */
export const updateCompanyJob = async (jobId, jobData) => {
    try {
        const response = await api.put(`/api/company/jobs/${jobId}`, jobData);
        return response.data;
    } catch (error) {
        console.error('❌ Update job error:', error.response?.data || error.message);
        throw error.response?.data || { error: 'Failed to update job' };
    }
};

/**
 * Delete a job posting (soft delete)
 * @param {string} jobId - Job ID
 * @returns {Promise}
 */
export const deleteCompanyJob = async (jobId) => {
    try {
        const response = await api.delete(`/api/company/jobs/${jobId}`);
        return response.data;
    } catch (error) {
        console.error('❌ Delete job error:', error.response?.data || error.message);
        throw error.response?.data || { error: 'Failed to delete job' };
    }
};

/**
 * Duplicate a job posting
 * @param {string} jobId - Job ID
 * @returns {Promise}
 */
export const duplicateCompanyJob = async (jobId) => {
    try {
        const response = await api.post(`/api/company/jobs/${jobId}/duplicate`);
        return response.data;
    } catch (error) {
        console.error('❌ Duplicate job error:', error.response?.data || error.message);
        throw error.response?.data || { error: 'Failed to duplicate job' };
    }
};

/**
 * Get company jobs statistics
 * @returns {Promise}
 */
export const getCompanyJobsStats = async () => {
    try {
        const response = await api.get('/api/company/jobs/stats');
        return response.data;
    } catch (error) {
        console.error('❌ Get job stats error:', error.response?.data || error.message);
        throw error.response?.data || { error: 'Failed to fetch job statistics' };
    }
};




/**
 * Get all applications for all jobs of the company
 * @param {string} userId - Company user ID
 * @returns {Promise}
 */
export const getAllCompanyApplications = async (userId) => {
    try {
        const response = await api.get(`/api/company/all-applications?user_id=${userId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching all applications:', error);
        return { success: false, applications: [] };
    }
};








/**
 * Apply for a job
 * @param {string} jobId - Job ID
 * @returns {Promise}
 */
export const applyForJob = async (jobId) => {
  try {
    console.log(`📤 Applying for job: ${jobId}`);
    const response = await api.post(`/api/jobs/${jobId}/apply`);
    console.log('✅ Application submitted successfully');
    return response.data;
  } catch (error) {
    console.error('❌ Apply for job error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to apply for job' };
  }
};

/**
 * Save a job for later
 * @param {string} jobId - Job ID
 * @returns {Promise}
 */
export const saveJob = async (jobId) => {
  try {
    console.log(`💾 Saving job: ${jobId}`);
    const response = await api.post(`/api/jobs/${jobId}/save`);
    console.log('✅ Job saved successfully');
    return response.data;
  } catch (error) {
    console.error('❌ Save job error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to save job' };
  }
};

/**
 * Remove saved job
 * @param {string} jobId - Job ID
 * @returns {Promise}
 */
export const unsaveJob = async (jobId) => {
  try {
    console.log(`🗑️ Removing saved job: ${jobId}`);
    const response = await api.delete(`/api/jobs/${jobId}/unsave`);
    console.log('✅ Job removed from saved');
    return response.data;
  } catch (error) {
    console.error('❌ Unsave job error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to unsave job' };
  }
};

/**
 * Get saved jobs for current user
 * @returns {Promise}
 */
export const getSavedJobs = async () => {
  try {
    const response = await api.get('/api/jobs/saved');
    return response.data;
  } catch (error) {
    console.error('❌ Get saved jobs error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to fetch saved jobs' };
  }
};

/**
 * Get matched jobs for a user (legacy method)
 * @param {string} userId - User ID
 * @returns {Promise}
 */
export const getUserJobs = async (userId) => {
  try {
    const response = await api.get(`/api/jobs/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Get jobs error:', error);
    throw error.response?.data || { error: 'Failed to fetch jobs' };
  }
};

// ==================== RESUME METHODS ====================

/**
 * Upload resume for analysis
 * @param {File} file - Resume file
 * @param {string} userId - User ID
 * @returns {Promise}
 */
export const uploadResume = async (file, userId = null) => {
  try {
    const formData = new FormData();
    formData.append('resume', file);

    if (userId) {
      formData.append('user_id', userId);
    }

    console.log('📤 Uploading resume:', file.name);

    const response = await api.post('/api/upload-resume', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000,
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        console.log(`📤 Upload progress: ${percentCompleted}%`);
      }
    });

    console.log('✅ Resume analysis complete:', response.data);
    return response.data;

  } catch (error) {
    console.error('❌ Resume upload error:', error);

    if (error.code === 'ERR_NETWORK') {
      throw {
        success: false,
        error: 'Backend server not running. Please start the Flask server.'
      };
    }

    if (error.response?.status === 413) {
      throw {
        success: false,
        error: 'File too large. Maximum size is 10MB.'
      };
    }

    throw error.response?.data || {
      success: false,
      error: 'Failed to upload resume. Please try again.'
    };
  }
};

/**
 * Get resume upload status
 * @param {string} userId - User ID
 * @returns {Promise}
 */
export const getResumeUploadStatus = async (userId) => {
  try {
    const response = await api.get(`/api/upload-status?user_id=${userId}`);
    return response.data;
  } catch (error) {
    console.error('❌ Get upload status error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to get upload status' };
  }
};

/**
 * Delete resume
 * @param {string} userId - User ID
 * @returns {Promise}
 */
export const deleteResume = async (userId) => {
  try {
    console.log(`🗑️ Deleting resume for user: ${userId}`);
    const response = await api.delete('/api/delete-resume', {
      data: { user_id: userId }
    });
    console.log('✅ Resume deleted successfully');
    return response.data;
  } catch (error) {
    console.error('❌ Delete resume error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to delete resume' };
  }
};

/**
 * Get stored resume analysis from localStorage
 * @param {string} userId - User ID
 * @returns {Promise}
 */
export const getStoredResumeAnalysis = async (userId) => {
  try {
    // First try to get from localStorage
    const storedUser = getStoredUser();
    if (storedUser && storedUser.resume_url) {
      return {
        success: true,
        data: {
          ats_score: storedUser.ats_score || 0,
          extracted_skills: storedUser.skills || [],
          experience_years: storedUser.experience_years || 0,
          education: storedUser.education || 'Not specified',
          summary: storedUser.summary || '',
          strengths: storedUser.strengths || [],
          weaknesses: storedUser.weaknesses || [],
          skills_categorized: storedUser.skills_categorized || {},
          resume_url: storedUser.resume_url,
          resume_public_id: storedUser.resume_public_id
        }
      };
    }
    
    // If not in localStorage, fetch from API
    const user = await getCurrentUser();
    if (user.success && user.user) {
      return {
        success: true,
        data: {
          ats_score: user.user.ats_score || 0,
          extracted_skills: user.user.skills || [],
          experience_years: user.user.experience_years || 0,
          education: user.user.education || 'Not specified',
          summary: user.user.summary || '',
          strengths: user.user.strengths || [],
          weaknesses: user.user.weaknesses || [],
          skills_categorized: user.user.skills_categorized || {},
          resume_url: user.user.resume_url,
          resume_public_id: user.user.resume_public_id
        }
      };
    }
    
    return { success: false, data: null };
  } catch (error) {
    console.error('❌ Get stored resume error:', error);
    return { success: false, data: null };
  }
};

// ==================== UTILITY METHODS ====================

/**
 * Test backend connection
 * @returns {Promise}
 */
export const testConnection = async () => {
  try {
    const response = await api.get('/api/health');
    console.log('✅ Backend connection successful:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ Backend connection failed:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Get job processing status
 * @param {string} userId - User ID
 * @returns {Promise}
 */
export const getJobStatus = async (userId) => {
  try {
    const response = await api.get(`/api/status/${userId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to get status' };
  }
};

/**
 * Enhanced job search with filters
 * @param {Object} searchParams - Search parameters
 * @returns {Promise}
 */
export const searchJobsWithFilters = async (searchParams) => {
  try {
    console.log('🔍 Searching jobs with params:', searchParams);
    const response = await api.post('/api/search-jobs', searchParams);
    return response.data;
  } catch (error) {
    console.error('Search jobs error:', error);
    throw error.response?.data || { error: 'Failed to search jobs' };
  }
};

/**
 * Get filter options from backend
 * @returns {Promise}
 */
export const getFilterOptions = async () => {
  try {
    console.log('📋 Fetching filter options...');
    const response = await api.get('/api/filter-options');
    console.log('✅ Filter options loaded:', response.data);
    return response.data;
  } catch (error) {
    console.error('⚠️ Failed to load filter options, using defaults:', error);
    return {
      success: true,
      options: {
        job_types: ['all', 'remote', 'onsite', 'hybrid', 'full_time', 'part_time', 'contract', 'internship'],
        date_ranges: ['any', 'day', 'week', 'month'],
        min_match_percentages: [0, 50, 60, 70, 80, 90],
        min_authenticity_scores: [0, 50, 60, 70, 80, 90],
        order_by: ['match', 'date', 'salary', 'authenticity'],
        verification: ['all', 'verified', 'scraped'],
        salary_ranges: [
          { label: "Any", value: null },
          { label: "$50,000+", value: 50000 },
          { label: "$75,000+", value: 75000 },
          { label: "$100,000+", value: 100000 },
          { label: "$150,000+", value: 150000 }
        ]
      }
    };
  }
};

/**
 * Filter existing jobs (client-side fallback)
 * @param {Array} jobs - Jobs to filter
 * @param {Object} filters - Filter parameters
 * @returns {Promise}
 */
export const filterExistingJobs = async (jobs, filters) => {
  try {
    console.log(`🔧 Filtering ${jobs.length} jobs with:`, filters);

    const response = await api.post('/api/jobs/filter', {
      jobs: jobs,
      filters: filters
    });

    console.log(`✅ Filtered to ${response.data.filtered_count} jobs`);
    return response.data;

  } catch (error) {
    console.error('Filter jobs error - using client-side fallback:', error);
    const filteredJobs = applyClientSideFilters(jobs, filters);
    return {
      success: true,
      jobs: filteredJobs,
      original_count: jobs.length,
      filtered_count: filteredJobs.length,
      filters_applied: filters,
      note: 'Client-side filtering applied (backend unavailable)'
    };
  }
};

/**
 * Client-side filtering fallback
 * @param {Array} jobs - Jobs to filter
 * @param {Object} filters - Filter parameters
 * @returns {Array}
 */
const applyClientSideFilters = (jobs, filters) => {
  if (!jobs || !Array.isArray(jobs)) {
    console.warn('Invalid jobs array:', jobs);
    return [];
  }

  if (!filters || Object.keys(filters).length === 0) {
    return jobs;
  }

  return jobs.filter(job => {
    if (filters.job_type && filters.job_type !== 'any') {
      const jobType = (job.job_type || '').toLowerCase();
      if (jobType !== filters.job_type.toLowerCase()) return false;
    }

    if (filters.min_match_percentage > 0) {
      const matchScore = job.match_score || job.combined_score || job.similarity_score || 0;
      if (matchScore < filters.min_match_percentage) return false;
    }

    if (filters.location_filter && filters.location_filter.trim()) {
      const jobLocation = (job.location || '').toLowerCase();
      if (!jobLocation.includes(filters.location_filter.toLowerCase())) return false;
    }

    if (filters.skills_filter && filters.skills_filter.length > 0) {
      const jobSkills = (job.skills || []).map(s => s.toLowerCase());
      const requiredSkills = filters.skills_filter.map(s => s.toLowerCase());
      const matchedSkills = requiredSkills.filter(reqSkill =>
        jobSkills.some(jobSkill => jobSkill.includes(reqSkill) || reqSkill.includes(jobSkill))
      );
      if (matchedSkills.length < Math.ceil(requiredSkills.length / 2)) return false;
    }

    return true;
  });
};


/**
 * Get all users (admin only)
 * @returns {Promise}
 */
export const getAllUsers = async () => {
  try {
    const response = await api.get('/api/users');
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to fetch users' };
  }
};

/**
 * Test job matching
 * @param {Array} skills - Skills to match
 * @returns {Promise}
 */
export const testMatching = async (skills) => {
  try {
    const response = await api.post('/api/test-matching', { skills });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Test matching failed' };
  }
};

/**
 * Poll for job results
 * @param {string} userId - User ID
 * @param {number} maxAttempts - Maximum polling attempts
 * @param {number} interval - Polling interval in ms
 * @returns {Promise}
 */
export const pollForJobs = async (userId, maxAttempts = 20, interval = 5000) => {
  console.log(`⏳ Starting to poll for jobs (user: ${userId})`);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await getUserJobs(userId);

      if (response.success && response.jobs && response.jobs.length > 0) {
        console.log(`✅ Jobs found on attempt ${attempt}/${maxAttempts}`);
        return response;
      }

      if (response.status === 'processing') {
        console.log(`⏳ Jobs still processing (${attempt}/${maxAttempts})`);
      } else {
        console.log(`⏳ No jobs yet (${attempt}/${maxAttempts}), waiting...`);
      }

      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    } catch (error) {
      console.error(`Poll attempt ${attempt} failed:`, error.message);
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }
  }

  throw new Error('Job matching timed out after 100 seconds. Please refresh the page.');
};

/**
 * Analyze semantic match between resume and job
 * @param {string} resumeText - Resume text
 * @param {string} jobDescription - Job description
 * @returns {Promise}
 */
export const analyzeSemanticMatch = async (resumeText, jobDescription) => {
  try {
    console.log('🧠 Performing semantic analysis...');
    const response = await api.post('/api/semantic-match', {
      resume_text: resumeText,
      job_description: jobDescription
    });
    return response.data;
  } catch (error) {
    console.error('❌ Semantic analysis error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to analyze semantic match' };
  }
};



export const predictSalary = async (salaryData) => {
  try {
    const response = await api.post('/api/predict-salary', salaryData);
    return response.data;
  } catch (error) {
    console.error('❌ Salary prediction error:', error);
    throw error.response?.data || { error: 'Failed to predict salary' };
  }
};



export const evaluateInterviewAnswer = async (question, answer, role) => {
  try {
    console.log('🧠 Evaluating interview answer...');
    const response = await api.post('/api/evaluate-interview', { 
      question, 
      answer, 
      role 
    });
    return response.data;
  } catch (error) {
    console.error('❌ Interview evaluation error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to evaluate answer' };
  }
};


export const sendCareerChatMessage = async (message, userId, transcript = []) => {
  try {
    const response = await api.post('/api/career-chat', {
      message: message,
      user_id: userId,
      transcript: transcript
    });
    return response.data;
  } catch (error) {
    console.error("❌ Career Chat error:", error.response?.data || error.message);
    throw error.response?.data || { error: "Career chat failed" };
  }
};


export const getCareerChatHistory = async (userId) => {
  try {
    console.log(`📜 Fetching career chat history for user: ${userId}`);
    const response = await api.get(`/api/career-chat/history/${userId}`);
    return response.data;
  } catch (error) {
    console.error("❌ Get career chat history error:", error.response?.data || error.message);
    throw error.response?.data || { error: "Failed to fetch history" };
  }
};

/**
 * Analyze domains from resume
 * @param {string} resumeText - Resume text
 * @returns {Promise}
 */
export const analyzeDomains = async (resumeText) => {
  try {
    const response = await api.post('/api/domain-analysis', {
      resume_text: resumeText
    });
    return response.data;
  } catch (error) {
    console.error('❌ Domain analysis error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to analyze domains' };
  }
};

/**
 * Export jobs as JSON file
 * @param {Array} jobs - Jobs to export
 * @param {string} filename - Output filename
 * @returns {Object}
 */
export const exportJobsAsJSON = (jobs, filename = 'job_matches.json') => {
  try {
    const dataStr = JSON.stringify(jobs, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', filename);
    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);

    console.log(`✅ Exported ${jobs.length} jobs to ${filename}`);
    return { success: true, filename };
  } catch (error) {
    console.error('Export error:', error);
    return { success: false, error: error.message };
  }
};



export const getCareerInsights = async () => {
  try {
    console.log('📊 Fetching career insights...');
    const response = await api.get('/api/career-insights');
    return response.data;
  } catch (error) {
    console.error('❌ Career insights error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to fetch career insights' };
  }
};

/**
 * Get job statistics
 * @param {Array} jobs - Jobs to analyze
 * @returns {Object}
 */
export const getJobStatistics = (jobs) => {
  if (!jobs || !Array.isArray(jobs) || jobs.length === 0) {
    return {
      total: 0,
      byJobType: {},
      bySource: {},
      averageMatchScore: 0,
      salaryRange: { min: 0, max: 0, avg: 0, count: 0 }
    };
  }

  const byJobType = {};
  const bySource = {};
  let totalMatchScore = 0;
  let salarySum = 0;
  let salaryCount = 0;
  let minSalary = Infinity;
  let maxSalary = 0;

  const extractSalaryFromString = (salaryString) => {
    if (!salaryString) return null;
    try {
      const matches = salaryString.match(/\$?(\d{1,3}(?:,\d{3})*)(?:k|K)?/);
      if (matches && matches[1]) {
        let salary = parseInt(matches[1].replace(/,/g, ''));
        if (salaryString.toLowerCase().includes('k')) {
          salary *= 1000;
        }
        return salary;
      }
    } catch (e) {
      console.error('Error extracting salary:', e);
    }
    return null;
  };

  jobs.forEach(job => {
    const jobType = job.job_type || 'unknown';
    byJobType[jobType] = (byJobType[jobType] || 0) + 1;

    const source = job.source || 'unknown';
    bySource[source] = (bySource[source] || 0) + 1;

    const matchScore = job.match_score || job.combined_score || job.similarity_score || 0;
    totalMatchScore += matchScore;

    const salaryMin = job.salary_min || extractSalaryFromString(job.salary);
    if (salaryMin && salaryMin > 0) {
      salarySum += salaryMin;
      salaryCount++;
      minSalary = Math.min(minSalary, salaryMin);
      maxSalary = Math.max(maxSalary, salaryMin);
    }
  });

  return {
    total: jobs.length,
    byJobType,
    bySource,
    averageMatchScore: jobs.length > 0 ? Math.round(totalMatchScore / jobs.length) : 0,
    salaryRange: {
      min: minSalary === Infinity ? 0 : minSalary,
      max: maxSalary,
      avg: salaryCount > 0 ? Math.round(salarySum / salaryCount) : 0,
      count: salaryCount
    }
  };
};

// ==================== NOTIFICATION METHODS ====================

/**
 * Get notifications for current user
 * @param {number} limit - Number of notifications to fetch
 * @returns {Promise}
 */
export const getNotifications = async (limit = 50) => {
  try {
    const response = await api.get(`/api/notifications?limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('❌ Get notifications error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to fetch notifications' };
  }
};

/**
 * Mark a notification as read
 * @param {string} notificationId - Notification ID
 * @returns {Promise}
 */
export const markNotificationRead = async (notificationId) => {
  try {
    const response = await api.patch(`/api/notifications/${notificationId}/read`);
    return response.data;
  } catch (error) {
    console.error('❌ Mark read error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to mark notification as read' };
  }
};

/**
 * Delete a notification
 * @param {string} notificationId - Notification ID
 * @returns {Promise}
 */
export const deleteNotification = async (notificationId) => {
  try {
    const response = await api.delete(`/api/notifications/${notificationId}`);
    return response.data;
  } catch (error) {
    console.error('❌ Delete notification error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to delete notification' };
  }
};

/**
 * Clear all notifications
 * @returns {Promise}
 */
export const clearAllNotifications = async () => {
  try {
    const response = await api.delete('/api/notifications/clear-all');
    return response.data;
  } catch (error) {
    console.error('❌ Clear all error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to clear notifications' };
  }
};

/**
 * Update notification preferences
 * @param {Object} settings - Notification settings
 * @returns {Promise}
 */
export const updateNotificationSettings = async (settings) => {
  try {
    const response = await api.patch('/api/notifications/settings', settings);
    return response.data;
  } catch (error) {
    console.error('❌ Update settings error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to update preferences' };
  }
};

/**
 * Test email notification
 * @returns {Promise}
 */
export const testEmailNotification = async () => {
  try {
    const response = await api.post('/api/notifications/test-email');
    return response.data;
  } catch (error) {
    console.error('❌ Test email error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to send test email' };
  }
};

// Forgot Password Flow
export const forgotPassword = async (email) => {
    try {
        const response = await api.post('/auth/forgot-password', { email });
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Failed to send reset code' };
    }
};

export const verifyOTP = async (email, otp) => {
    try {
        const response = await api.post('/auth/verify-otp', { email, otp });
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Invalid or expired code' };
    }
};

export const resetPassword = async (email, new_password) => {
    try {
        const response = await api.post('/auth/reset-password', { email, new_password });
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Failed to reset password' };
    }
};

/**
 * Change authenticated user's password
 * @param {string} current_password 
 * @param {string} new_password 
 * @returns {Promise}
 */
export const changePasswordRequest = async (current_password, new_password) => {
    try {
        const response = await api.post('/auth/change-password', { 
            current_password, 
            new_password 
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Failed to change password' };
    }
};

export default api;