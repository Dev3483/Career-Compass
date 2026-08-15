import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Login from '@/Pages/Login';
import Register from '@/Pages/Register';
import RoleBasedRoute from '@/components/RoleBasedRoute';

const { Pages, Layout, mainPage, categories } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : null;

// URL to Page mapping - matches your createPageUrl function
const URL_TO_PAGE = {
  '/': 'Landing',
  '/login': 'Login',
  '/register': 'Register',
  '/dashboard': 'Dashboard',
  '/company/dashboard': 'CompanyDashboard',
  '/admin/dashboard': 'AdminDashboard',
  '/admin/users': 'AdminUsers',
  '/admin/companies': 'AdminCompanies',
  '/admin/ai': 'AdminAI',
  '/admin/system': 'AdminSystem',
  '/jobs': 'Jobs',
  '/dashboard/recommendations': 'JobRecommendations',
  '/company/candidates': 'Candidates',
  '/company/post-job': 'PostJob',
  '/company/my-jobs': 'MyJobs',
  '/company/analytics': 'CompanyAnalytics',
  '/dashboard/resume': 'ResumeIntelligence',
  '/dashboard/salary': 'SalaryIntelligence',
  '/dashboard/interview': 'InterviewPrep',
  '/dashboard/chat': 'CareerChat',
  '/dashboard/settings': 'DashboardSettings',  // ✅ Fixed: This is correct
  '/profile': 'Profile',
  '/notifications': 'Notifications',
  '/applications': 'MyApplications',
  '/savedjobs': 'SavedJobs',
  '/career-insights': 'CareerInsights'
};

// Reverse mapping for route generation
const PAGE_TO_URL = Object.fromEntries(
  Object.entries(URL_TO_PAGE).map(([url, page]) => [page, url])
);

// Helper function to generate URL (should match your createPageUrl)
const generatePageUrl = (pageName) => {
  return PAGE_TO_URL[pageName] || `/${pageName.toLowerCase()}`;
};

const LayoutWrapper = ({ children, currentPageName }) => {
  if (!children) return null;

  return Layout ? (
    <Layout currentPageName={currentPageName}>{children}</Layout>
  ) : (
    <>{children}</>
  );
};

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, user } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  // Helper function to render page component safely
  const renderPage = (pageName) => {
    const PageComponent = Pages[pageName];
    if (!PageComponent) {
      console.error(`Page component not found for: ${pageName}`);
      return <PageNotFound />;
    }
    return <PageComponent />;
  };

  return (
    <Routes>
      {/* Home Route */}
      <Route
        path="/"
        element={
          <LayoutWrapper currentPageName={URL_TO_PAGE['/']}>
            {MainPage && <MainPage />}
          </LayoutWrapper>
        }
      />

      {/* Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Job Seeker Routes */}
      <Route
        path="/dashboard"
        element={
          <RoleBasedRoute allowedRoles={['job_seeker', 'admin']}>
            <LayoutWrapper currentPageName="Dashboard">
              {renderPage("Dashboard")}
            </LayoutWrapper>
          </RoleBasedRoute>
        }
      />
      <Route
        path="/dashboard/resume"
        element={
          <RoleBasedRoute allowedRoles={['job_seeker', 'admin']}>
            <LayoutWrapper currentPageName="ResumeIntelligence">
              {renderPage("ResumeIntelligence")}
            </LayoutWrapper>
          </RoleBasedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <RoleBasedRoute allowedRoles={['job_seeker', 'company', 'admin']}>
            <LayoutWrapper currentPageName="Profile">
              {renderPage("Profile")}
            </LayoutWrapper>
          </RoleBasedRoute>
        }
      />

      <Route
        path="/career-insights"
        element={
          <RoleBasedRoute allowedRoles={['job_seeker', 'admin']}>
            <LayoutWrapper currentPageName="CareerInsights">
              {renderPage("CareerInsights")}
            </LayoutWrapper>
          </RoleBasedRoute>
        }
      />
      <Route
        path="/applications"
        element={
          <RoleBasedRoute allowedRoles={['job_seeker', 'admin']}>
            <LayoutWrapper currentPageName="MyApplications">
              {renderPage("MyApplications")}
            </LayoutWrapper>
          </RoleBasedRoute>
        }
      />
      <Route
        path="/savedjobs"
        element={
          <RoleBasedRoute allowedRoles={['job_seeker', 'admin']}>
            <LayoutWrapper currentPageName="SavedJobs">
              {renderPage("SavedJobs")}
            </LayoutWrapper>
          </RoleBasedRoute>
        }
      />

      <Route
        path="/dashboard/recommendations"
        element={
          <RoleBasedRoute allowedRoles={['job_seeker', 'admin']}>
            <LayoutWrapper currentPageName="JobRecommendations">
              {renderPage("JobRecommendations")}
            </LayoutWrapper>
          </RoleBasedRoute>
        }
      />
      <Route
        path="/dashboard/chat"
        element={
          <RoleBasedRoute allowedRoles={['job_seeker', 'admin']}>
            <LayoutWrapper currentPageName="CareerChat">
              {renderPage("CareerChat")}
            </LayoutWrapper>
          </RoleBasedRoute>
        }
      />
      <Route
        path="/dashboard/salary"
        element={
          <RoleBasedRoute allowedRoles={['job_seeker', 'admin']}>
            <LayoutWrapper currentPageName="SalaryIntelligence">
              {renderPage("SalaryIntelligence")}
            </LayoutWrapper>
          </RoleBasedRoute>
        }
      />
      <Route
        path="/dashboard/interview"
        element={
          <RoleBasedRoute allowedRoles={['job_seeker', 'admin']}>
            <LayoutWrapper currentPageName="InterviewPrep">
              {renderPage("InterviewPrep")}
            </LayoutWrapper>
          </RoleBasedRoute>
        }
      />
      <Route
        path="/dashboard/settings"
        element={
          <RoleBasedRoute allowedRoles={['job_seeker', 'company', 'admin']}>
            <LayoutWrapper currentPageName="DashboardSettings">
              {renderPage("DashboardSettings")}
            </LayoutWrapper>
          </RoleBasedRoute>
        }
      />

      {/* Company Routes */}
      <Route
        path="/company/dashboard"
        element={
          <RoleBasedRoute allowedRoles={['company', 'admin']}>
            <LayoutWrapper currentPageName="CompanyDashboard">
              {renderPage("CompanyDashboard")}
            </LayoutWrapper>
          </RoleBasedRoute>
        }
      />
      <Route
        path="/company/post-job"
        element={
          <RoleBasedRoute allowedRoles={['company', 'admin']}>
            <LayoutWrapper currentPageName="PostJob">
              {renderPage("PostJob")}
            </LayoutWrapper>
          </RoleBasedRoute>
        }
      />
      <Route
        path="/company/candidates"
        element={
          <RoleBasedRoute allowedRoles={['company', 'admin']}>
            <LayoutWrapper currentPageName="Candidates">
              {renderPage("Candidates")}
            </LayoutWrapper>
          </RoleBasedRoute>
        }
      />
      <Route
        path="/company/my-jobs"
        element={
          <RoleBasedRoute allowedRoles={['company', 'admin']}>
            <LayoutWrapper currentPageName="MyJobs">
              {renderPage("MyJobs")}
            </LayoutWrapper>
          </RoleBasedRoute>
        }
      />
      <Route
        path="/company/analytics"
        element={
          <RoleBasedRoute allowedRoles={['company', 'admin']}>
            <LayoutWrapper currentPageName="CompanyAnalytics">
              {renderPage("CompanyAnalytics")}
            </LayoutWrapper>
          </RoleBasedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin/dashboard"
        element={
          <RoleBasedRoute allowedRoles={['admin']}>
            <LayoutWrapper currentPageName="AdminDashboard">
              {renderPage("AdminDashboard")}
            </LayoutWrapper>
          </RoleBasedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <RoleBasedRoute allowedRoles={['admin']}>
            <LayoutWrapper currentPageName="AdminUsers">
              {renderPage("AdminUsers")}
            </LayoutWrapper>
          </RoleBasedRoute>
        }
      />
      <Route
        path="/admin/companies"
        element={
          <RoleBasedRoute allowedRoles={['admin']}>
            <LayoutWrapper currentPageName="AdminCompanies">
              {renderPage("AdminCompanies")}
            </LayoutWrapper>
          </RoleBasedRoute>
        }
      />
      <Route
        path="/admin/ai"
        element={
          <RoleBasedRoute allowedRoles={['admin']}>
            <LayoutWrapper currentPageName="AdminAI">
              {renderPage("AdminAI")}
            </LayoutWrapper>
          </RoleBasedRoute>
        }
      />
      <Route
        path="/admin/system"
        element={
          <RoleBasedRoute allowedRoles={['admin']}>
            <LayoutWrapper currentPageName="AdminSystem">
              {renderPage("AdminSystem")}
            </LayoutWrapper>
          </RoleBasedRoute>
        }
      />

      {/* Public Routes */}
      <Route path="/jobs" element={<LayoutWrapper currentPageName="Jobs">{renderPage("Jobs")}</LayoutWrapper>} />
      <Route path="/job/:id" element={<LayoutWrapper currentPageName="JobDetails">{renderPage("JobDetails")}</LayoutWrapper>} />

      {/* 404 Route */}
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <AuthProvider>
          <AuthenticatedApp />
        </AuthProvider>
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;