import React, { useState } from "react";
import { Bell, Search, LogOut, User, ChevronDown, Briefcase, Settings, Bookmark, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
    getNotifications, 
    markNotificationRead, 
    deleteNotification, 
    clearAllNotifications 
} from "@/utils/api";
import { formatDistanceToNow } from "date-fns";
import { X, Trash2, CheckCircle2, AlertCircle, Info, Star } from "lucide-react";
import { toast } from "react-hot-toast";

export default function TopBar({ user, title }) {
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const { logout } = useAuth();
    const navigate = useNavigate();

    // Fetch notifications
    const fetchNotifications = async (quiet = false) => {
        if (!quiet) setLoading(true);
        try {
            const response = await getNotifications();
            if (response.success) {
                setNotifications(response.notifications || []);
                setUnreadCount(response.unread_count || 0);
            }
        } catch (error) {
            console.error("Error fetching notifications:", error);
        } finally {
            if (!quiet) setLoading(false);
        }
    };

    // Polling for new notifications
    React.useEffect(() => {
        fetchNotifications();
        const interval = setInterval(() => fetchNotifications(true), 60000); // Every 60 seconds
        return () => clearInterval(interval);
    }, []);

    const handleMarkAsRead = async (id) => {
        try {
            const response = await markNotificationRead(id);
            if (response.success) {
                setNotifications(prev => 
                    prev.map(n => n.notification_id === id ? { ...n, is_read: true } : n)
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error("Error marking as read:", error);
        }
    };

    const handleDeleteNotification = async (e, id) => {
        e.stopPropagation(); // Don't trigger mark as read
        try {
            const response = await deleteNotification(id);
            if (response.success) {
                const deleted = notifications.find(n => n.notification_id === id);
                if (deleted && !deleted.is_read) {
                    setUnreadCount(prev => Math.max(0, prev - 1));
                }
                setNotifications(prev => prev.filter(n => n.notification_id !== id));
            }
        } catch (error) {
            console.error("Error deleting notification:", error);
        }
    };

    const handleClearAll = async () => {
        try {
            const response = await clearAllNotifications();
            if (response.success) {
                setNotifications([]);
                setUnreadCount(0);
                toast.success("All notifications cleared");
            }
        } catch (error) {
            toast.error("Failed to clear notifications");
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'success': return <CheckCircle2 className="w-4 h-4 text-white" />;
            case 'warning': return <AlertCircle className="w-4 h-4 text-white" />;
            case 'error': return <AlertCircle className="w-4 h-4 text-white" />;
            case 'job_match': return <Star className="w-4 h-4 text-white" />;
            case 'admin': return <User className="w-4 h-4 text-white" />;
            default: return <Info className="w-4 h-4 text-white" />;
        }
    };

    const getIconBg = (type) => {
        switch (type) {
            case 'success': return 'bg-green-500';
            case 'warning': return 'bg-amber-500';
            case 'error': return 'bg-red-500';
            case 'job_match': return 'bg-purple-500';
            case 'admin': return 'bg-blue-500';
            default: return 'bg-[#6C63FF]';
        }
    };

    const handleLogout = () => {
        logout(true);
    };

    const handleProfileClick = () => {
        navigate(createPageUrl("Profile"));
    };

    const handleApplicationsClick = () => {
        navigate(createPageUrl("MyApplications"));
    };

    const handleSettingsClick = () => {
        navigate(createPageUrl("DashboardSettings"));
    };

    // Get user initials for avatar
    const getUserInitials = () => {
        if (user?.full_name) {
            return user.full_name.charAt(0).toUpperCase();
        }
        if (user?.email) {
            return user.email.charAt(0).toUpperCase();
        }
        return "U";
    };

    // Get display name
    const getDisplayName = () => {
        if (user?.full_name && user.full_name !== "User") {
            return user.full_name;
        }
        if (user?.email) {
            // Extract name from email (before @)
            const emailName = user.email.split('@')[0];
            // Capitalize first letter and format
            return emailName.charAt(0).toUpperCase() + emailName.slice(1);
        }
        return "User";
    };

    // Get user email safely
    const getUserEmail = () => {
        return user?.email || "user@example.com";
    };

    // Get user role display
    const getUserRole = () => {
        const role = user?.role || "job_seeker";
        return role.replace('_', ' ');
    };

    return (
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-30">
            <div className="flex items-center gap-2 md:gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-xl w-9 h-9 text-gray-500 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-100"
                    onClick={() => navigate(-1)}
                    title="Go Back"
                >
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <h1 className="text-lg font-bold text-gray-900">{title}</h1>
            </div>

            <div className="flex items-center gap-3">
                <div className="hidden md:flex items-center bg-gray-50 rounded-xl px-3 py-2 w-64">
                    
                </div>

                <div className="relative">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-xl relative bg-white hover:bg-gray-50"
                        onClick={() => setShowNotifications(!showNotifications)}
                    >
                        <Bell className="w-5 h-5 text-gray-500" />
                        {unreadCount > 0 && (
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                        )}
                    </Button>
                    <AnimatePresence>
                        {showNotifications && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 z-50"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-bold text-sm">Notifications {unreadCount > 0 && `(${unreadCount})`}</h3>
                                    {notifications.length > 0 && (
                                        <button 
                                            onClick={handleClearAll}
                                            className="text-[10px] text-gray-400 hover:text-red-500 font-medium transition-colors"
                                        >
                                            Clear all
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                                    {notifications.length === 0 ? (
                                        <div className="py-8 text-center">
                                            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-2">
                                                <Bell className="w-6 h-6 text-gray-300" />
                                            </div>
                                            <p className="text-sm text-gray-500">No notifications yet</p>
                                        </div>
                                    ) : (
                                        notifications.map((n) => (
                                            <div 
                                                key={n.notification_id}
                                                onClick={() => !n.is_read && handleMarkAsRead(n.notification_id)}
                                                className={`group flex gap-3 p-3 rounded-xl transition-all cursor-pointer relative ${n.is_read ? 'bg-white hover:bg-gray-50 border border-transparent' : 'bg-indigo-50/50 border border-indigo-100 hover:bg-indigo-50'}`}
                                            >
                                                {!n.is_read && (
                                                    <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                                                )}
                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${getIconBg(n.type)}`}>
                                                    {getIcon(n.type)}
                                                </div>
                                                <div className="flex-1 min-w-0 pr-4">
                                                    <p className="text-sm font-bold text-gray-900 leading-tight mb-0.5 truncate">{n.title}</p>
                                                    <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{n.message}</p>
                                                    <p className="text-[10px] text-gray-400 mt-1">
                                                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                                                    </p>
                                                </div>
                                                <button 
                                                    onClick={(e) => handleDeleteNotification(e, n.notification_id)}
                                                    className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-50 hover:text-red-500 text-gray-300 transition-all font-bold"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                                {notifications.length > 5 && (
                                    <button 
                                        className="w-full mt-3 py-2 text-xs font-semibold text-[#6C63FF] hover:bg-indigo-50 rounded-lg transition-colors border border-dashed border-indigo-100"
                                        onClick={() => navigate(createPageUrl("DashboardSettings"))}
                                    >
                                        View all settings
                                    </button>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-50 transition-colors bg-white">
                            <div className="w-8 h-8 rounded-lg bg-[#6C63FF] flex items-center justify-center text-white text-xs font-bold">
                                {getUserInitials()}
                            </div>
                            <div className="hidden md:block text-left">
                                <p className="text-sm font-medium text-gray-900 leading-none">{getDisplayName()}</p>
                                <p className="text-xs text-gray-500 capitalize">{getUserRole()}</p>
                            </div>
                            <ChevronDown className="w-4 h-4 text-gray-400 hidden md:block" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 rounded-xl">
                        <DropdownMenuLabel className="text-xs text-gray-500 font-normal">
                            Signed in as
                        </DropdownMenuLabel>
                        <DropdownMenuLabel className="text-sm font-medium text-gray-900 pb-2 truncate">
                            {getUserEmail()}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        
                        {/* Profile Option */}
                        <DropdownMenuItem 
                            onClick={handleProfileClick} 
                            className="rounded-lg cursor-pointer"
                        >
                            <User className="w-4 h-4 mr-2" />
                            <span>My Profile</span>
                        </DropdownMenuItem>
                        
                        {/* Applications Option - Only for job seekers */}
                        {user?.role === 'job_seeker' && (
                            <>
                                <DropdownMenuItem 
                                    onClick={handleApplicationsClick} 
                                    className="rounded-lg cursor-pointer"
                                >
                                    <Briefcase className="w-4 h-4 mr-2" />
                                    <span>My Applications</span>
                                </DropdownMenuItem>
                                
                                <DropdownMenuItem 
                                    onClick={() => navigate(createPageUrl("SavedJobs"))} 
                                    className="rounded-lg cursor-pointer"
                                >
                                    <Bookmark className="w-4 h-4 mr-2" />
                                    <span>Saved Jobs</span>
                                </DropdownMenuItem>
                            </>
                        )}
                        
                        {/* Settings Option */}
                        <DropdownMenuItem 
                            onClick={handleSettingsClick} 
                            className="rounded-lg cursor-pointer"
                        >
                            <Settings className="w-4 h-4 mr-2" />
                            <span>Settings</span>
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator />
                        
                        {/* Logout Option */}
                        <DropdownMenuItem
                            className="rounded-lg text-red-500 cursor-pointer focus:text-red-500"
                            onClick={handleLogout}
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            <span>Logout</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}