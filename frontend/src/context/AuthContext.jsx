// context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { getCurrentUser, logoutUser, isAuthenticated as checkIsAuthenticated, getStoredUser } from '@/utils/api';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(getStoredUser());
    const [isAuthenticated, setIsAuthenticated] = useState(checkIsAuthenticated());
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);
    const [authError, setAuthError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        verifyAuthStatus();
    }, []);

    const verifyAuthStatus = async () => {
        try {
            setIsLoadingAuth(true);
            setAuthError(null);

            const result = await getCurrentUser();

            if (result.success && result.user) {
                setUser(result.user);
                setIsAuthenticated(true);
            } else {
                // Clear invalid auth state
                setUser(null);
                setIsAuthenticated(false);
                localStorage.removeItem('careerai_access_token');
                localStorage.removeItem('careerai_user');
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            setUser(null);
            setIsAuthenticated(false);
            setAuthError({
                type: 'unknown',
                message: error.message || 'Authentication check failed'
            });
        } finally {
            setIsLoadingAuth(false);
        }
    };

    const login = async (email, password) => {
        setIsLoadingAuth(true);
        setAuthError(null);

        try {
            // Import dynamically to avoid circular dependency
            const { loginUser } = await import('@/utils/api');
            const result = await loginUser(email, password);

            if (result.success) {
                setUser(result.user);
                setIsAuthenticated(true);
                setIsLoadingAuth(false);
                return { success: true, user: result.user };
            } else {
                setAuthError({
                    type: 'invalid_credentials',
                    message: result.error || 'Invalid email or password'
                });
                setIsLoadingAuth(false);
                return { success: false, error: result.error };
            }
        } catch (error) {
            console.error('Login error:', error);
            setAuthError({
                type: 'unknown',
                message: error.error || 'Login failed. Please try again.'
            });
            setIsLoadingAuth(false);
            return { success: false, error: error.error || 'Login failed' };
        }
    };

    const register = async (userData) => {
        setIsLoadingAuth(true);
        setAuthError(null);

        try {
            const { registerUser } = await import('@/utils/api');
            const result = await registerUser(userData);

            if (result.success) {
                setUser(result.user);
                setIsAuthenticated(true);
                setIsLoadingAuth(false);
                return { success: true, user: result.user };
            } else {
                setAuthError({
                    type: 'registration_failed',
                    message: result.error || 'Registration failed'
                });
                setIsLoadingAuth(false);
                return { success: false, error: result.error };
            }
        } catch (error) {
            console.error('Registration error:', error);
            setAuthError({
                type: 'unknown',
                message: error.error || 'Registration failed. Please try again.'
            });
            setIsLoadingAuth(false);
            return { success: false, error: error.error || 'Registration failed' };
        }
    };

    const logout = async (shouldRedirect = true) => {
        try {
            // Call the API logout function
            await logoutUser();
        } catch (error) {
            console.error('Logout API error:', error);
        } finally {
            // Clear all auth state regardless of API success
            setUser(null);
            setIsAuthenticated(false);
            localStorage.removeItem('careerai_access_token');
            localStorage.removeItem('careerai_user');

            // Redirect to landing page if specified
            if (shouldRedirect) {
                navigate(createPageUrl('Landing'));
            }
        }
    };

    const navigateToLogin = () => {
        navigate(createPageUrl('Login'));
    };

    const navigateToRegister = () => {
        navigate(createPageUrl('Register'));
    };

    const updateUser = async (updatedData) => {
        try {
            const { updateUserProfile } = await import('@/utils/api');
            const result = await updateUserProfile(updatedData);

            if (result.success) {
                setUser(result.user);
                return { success: true, user: result.user };
            } else {
                return { success: false, error: result.error };
            }
        } catch (error) {
            console.error('Update user error:', error);
            return { success: false, error: error.error || 'Failed to update profile' };
        }
    };

    const checkAuthStatus = async () => {
        await verifyAuthStatus();
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated,
            isLoadingAuth,
            authError,
            login,
            register,
            logout,
            navigateToLogin,
            navigateToRegister,
            updateUser,
            checkAuthStatus
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};