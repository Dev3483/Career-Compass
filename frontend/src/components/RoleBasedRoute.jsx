import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { createPageUrl } from '@/utils';

const RoleBasedRoute = ({ children, allowedRoles }) => {
    const { user, isAuthenticated, isLoadingAuth } = useAuth();

    if (isLoadingAuth) {
        return (
            <div className="fixed inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to={createPageUrl('Login')} replace />;
    }

    if (!allowedRoles.includes(user?.role)) {
        // Redirect to appropriate dashboard based on role
        if (user?.role === 'admin') {
            return <Navigate to={createPageUrl('AdminDashboard')} replace />;
        } else if (user?.role === 'company') {
            return <Navigate to={createPageUrl('CompanyDashboard')} replace />;
        } else {
            return <Navigate to={createPageUrl('Dashboard')} replace />;
        }
    }

    return children;
};

export default RoleBasedRoute;