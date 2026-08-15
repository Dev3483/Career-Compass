import React, { useState, useEffect } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { motion } from "framer-motion";
import { Settings, User, Save, CheckCircle, Moon, Sun, Globe, Bell, Lock, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { 
    updateUserProfile, 
    getCurrentUser, 
    updateNotificationSettings, 
    testEmailNotification,
    changePasswordRequest 
} from "@/utils/api";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { toast } from "react-hot-toast";
import { Mail } from "lucide-react";

export default function DashboardSettings() {
    const { user: authUser, updateUser, logout } = useAuth();
    const [user, setUser] = useState(null);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(true);
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
    const [notifications, setNotifications] = useState({
        email_notifications: true,
        job_alerts: true,
        marketing_emails: false
    });

    // Security States
    const [showSecurityModal, setShowSecurityModal] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
    const [securityLoading, setSecurityLoading] = useState(false);

    useEffect(() => {
        fetchUserData();
        loadTheme();
    }, []);

    const fetchUserData = async () => {
        setLoading(true);
        try {
            // Get fresh user data from backend
            const response = await getCurrentUser();
            if (response.success && response.user) {
                setUser(response.user);
                
                // Load notifications settings from user object (backend)
                if (response.user.notification_settings) {
                    setNotifications(response.user.notification_settings);
                } else {
                    // Fallback to localStorage for migration or defaults
                    const savedNotifications = localStorage.getItem('notification_settings');
                    if (savedNotifications) {
                        setNotifications(JSON.parse(savedNotifications));
                    }
                }
            } else {
                toast.error('Failed to load user data');
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
            toast.error('Failed to load profile data');
        } finally {
            setLoading(false);
        }
    };

    const loadTheme = () => {
        const savedTheme = localStorage.getItem('theme') || 'light';
        setTheme(savedTheme);
        applyTheme(savedTheme);
    };

    const applyTheme = (themeMode) => {
        if (themeMode === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', themeMode);
    };

    const handleThemeToggle = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        applyTheme(newTheme);
        toast.success(`${newTheme === 'dark' ? 'Dark' : 'Light'} mode activated`);
    };

    const handleSaveNotifications = async () => {
        setSaving(true);
        try {
            // Save to backend
            const response = await updateNotificationSettings(notifications);
            
            if (response.data?.success || response.success) {
                // Also update local storage as backup
                localStorage.setItem('notification_settings', JSON.stringify(notifications));
                
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
                toast.success('Notification preferences saved to cloud');
            } else {
                toast.error(response.error || 'Failed to update preferences');
            }
        } catch (error) {
            console.error('Error saving notifications:', error);
            toast.error('Failed to save preferences to server');
        } finally {
            setSaving(false);
        }
    };

    const handleTestEmail = async () => {
        try {
            toast.promise(
                testEmailNotification(),
                {
                    loading: 'Sending test email...',
                    success: (data) => data.message || 'Test email sent!',
                    error: (err) => err.error || 'Failed to send test email'
                }
            );
        } catch (error) {
            console.error('Test email error:', error);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        
        if (newPassword !== confirmPassword) {
            toast.error("New passwords don't match");
            return;
        }

        if (newPassword.length < 8) {
            toast.error("Password must be at least 8 characters");
            return;
        }

        setSecurityLoading(true);
        try {
            const response = await changePasswordRequest(currentPassword, newPassword);
            if (response.success) {
                toast.success("Password updated successfully!");
                setShowSecurityModal(false);
                // Clear fields
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
            }
        } catch (error) {
            toast.error(error.error || "Failed to update password");
        } finally {
            setSecurityLoading(false);
        }
    };

    if (loading) {
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

    return (
        <DashboardShell user={user} title="Settings" currentPage="DashboardSettings">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto"
            >
                <Tabs defaultValue="appearance" className="w-full">
                    <TabsList className="bg-white border border-gray-100 rounded-xl p-1 mb-6">
                        <TabsTrigger value="appearance" className="rounded-lg">
                            <Settings className="w-4 h-4 mr-2" />
                            Appearance
                        </TabsTrigger>
                        <TabsTrigger value="notifications" className="rounded-lg">
                            <Bell className="w-4 h-4 mr-2" />
                            Notifications
                        </TabsTrigger>
                        <TabsTrigger value="security" className="rounded-lg">
                            <Lock className="w-4 h-4 mr-2" />
                            Security
                        </TabsTrigger>
                    </TabsList>

                    {/* Appearance Settings Tab */}
                    <TabsContent value="appearance">
                        <div className="bg-white rounded-2xl border border-gray-100 p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-[#6C63FF] flex items-center justify-center">
                                    <Settings className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Appearance</h2>
                                    <p className="text-sm text-gray-500">Customize how the app looks</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        {theme === 'light' ? (
                                            <Sun className="w-5 h-5 text-yellow-500" />
                                        ) : (
                                            <Moon className="w-5 h-5 text-indigo-500" />
                                        )}
                                        <div>
                                            <p className="font-medium text-gray-900">Dark Mode</p>
                                            <p className="text-sm text-gray-500">Switch between light and dark theme</p>
                                        </div>
                                    </div>
                                    <Switch
                                        checked={theme === 'dark'}
                                        onCheckedChange={handleThemeToggle}
                                        className="data-[state=checked]:bg-[#6C63FF]"
                                    />
                                </div>

                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <Globe className="w-5 h-5 text-gray-500" />
                                        <div>
                                            <p className="font-medium text-gray-900">Language</p>
                                            <p className="text-sm text-gray-500">Select your preferred language</p>
                                        </div>
                                    </div>
                                    <select className="px-3 py-2 border border-gray-200 rounded-lg bg-white">
                                        <option value="en">English</option>
                                        <option value="es">Spanish</option>
                                        <option value="fr">French</option>
                                        <option value="de">German</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Notifications Settings Tab */}
                    <TabsContent value="notifications">
                        <div className="bg-white rounded-2xl border border-gray-100 p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-[#6C63FF] flex items-center justify-center">
                                    <Bell className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
                                    <p className="text-sm text-gray-500">Manage your notification preferences</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                    <div>
                                        <p className="font-medium text-gray-900">Email Notifications</p>
                                        <p className="text-sm text-gray-500">Receive email updates about your account</p>
                                    </div>
                                    <Switch
                                        checked={notifications.email_notifications}
                                        onCheckedChange={(checked) => setNotifications({ ...notifications, email_notifications: checked })}
                                        className="data-[state=checked]:bg-[#6C63FF]"
                                    />
                                </div>

                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                    <div>
                                        <p className="font-medium text-gray-900">Job Alerts</p>
                                        <p className="text-sm text-gray-500">Get notified about new job matches</p>
                                    </div>
                                    <Switch
                                        checked={notifications.job_alerts}
                                        onCheckedChange={(checked) => setNotifications({ ...notifications, job_alerts: checked })}
                                        className="data-[state=checked]:bg-[#6C63FF]"
                                    />
                                </div>

                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                    <div>
                                        <p className="font-medium text-gray-900">Marketing Emails</p>
                                        <p className="text-sm text-gray-500">Receive tips, updates, and offers</p>
                                    </div>
                                    <Switch
                                        checked={notifications.marketing_emails}
                                        onCheckedChange={(checked) => setNotifications({ ...notifications, marketing_emails: checked })}
                                        className="data-[state=checked]:bg-[#6C63FF]"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <Button
                                    onClick={handleSaveNotifications}
                                    disabled={saving}
                                    className="mt-6 bg-[#6C63FF] text-white rounded-xl px-6 hover:bg-[#5A52D5]"
                                >
                                    {saved ? (
                                        <><CheckCircle className="w-4 h-4 mr-2" /> Saved!</>
                                    ) : (
                                        <><Save className="w-4 h-4 mr-2" /> {saving ? "Saving..." : "Save Preferences"}</>
                                    )}
                                </Button>
                                
                                <Button
                                    onClick={handleTestEmail}
                                    variant="outline"
                                    className="mt-6 rounded-xl border-gray-200"
                                >
                                    <Mail className="w-4 h-4 mr-2" />
                                    Test Email
                                </Button>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Security Settings Tab */}
                    <TabsContent value="security">
                        <div className="bg-white rounded-2xl border border-gray-100 p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-[#6C63FF] flex items-center justify-center">
                                    <Lock className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Security</h2>
                                    <p className="text-sm text-gray-500">Manage your account security</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Button
                                    variant="outline"
                                    className="w-full justify-start rounded-xl hover:bg-indigo-50 hover:text-indigo-600 border-gray-100"
                                    onClick={() => setShowSecurityModal(true)}
                                >
                                    <Lock className="w-4 h-4 mr-2" />
                                    Change Password
                                </Button>

                                <Button
                                    variant="outline"
                                    className="w-full justify-start rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 border-gray-100"
                                    onClick={async () => {
                                        if (window.confirm('Are you sure you want to logout?')) {
                                            await logout();
                                        }
                                    }}
                                >
                                    <LogOut className="w-4 h-4 mr-2" />
                                    Logout from all devices
                                </Button>
                            </div>
                        </div>

                        {/* Change Password Modal */}
                        <Dialog open={showSecurityModal} onOpenChange={setShowSecurityModal}>
                            <DialogContent className="sm:max-w-md rounded-2xl">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                                            <ShieldCheck className="w-5 h-5 text-[#6C63FF]" />
                                        </div>
                                        Change Password
                                    </DialogTitle>
                                    <DialogDescription>
                                        Update your account password to stay secure.
                                    </DialogDescription>
                                </DialogHeader>
                                
                                <form onSubmit={handleChangePassword} className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="current-p">Current Password</Label>
                                        <div className="relative">
                                            <Input
                                                id="current-p"
                                                type={showPasswords.current ? "text" : "password"}
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                                className="rounded-xl pr-10"
                                                required
                                            />
                                            <button 
                                                type="button"
                                                onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="new-p">New Password</Label>
                                        <div className="relative">
                                            <Input
                                                id="new-p"
                                                type={showPasswords.new ? "text" : "password"}
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="rounded-xl pr-10"
                                                required
                                            />
                                            <button 
                                                type="button"
                                                onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="confirm-p">Confirm New Password</Label>
                                        <div className="relative">
                                            <Input
                                                id="confirm-p"
                                                type={showPasswords.confirm ? "text" : "password"}
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="rounded-xl pr-10"
                                                required
                                            />
                                            <button 
                                                type="button"
                                                onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <DialogFooter className="pt-4 flex !justify-between gap-2">
                                        <Button 
                                            type="button" 
                                            variant="ghost" 
                                            onClick={() => setShowSecurityModal(false)}
                                            className="rounded-xl"
                                        >
                                            Cancel
                                        </Button>
                                        <Button 
                                            type="submit" 
                                            disabled={securityLoading}
                                            className="bg-[#6C63FF] text-white rounded-xl hover:bg-[#5A52D5]"
                                        >
                                            {securityLoading ? "Updating..." : "Update Password"}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </TabsContent>
                </Tabs>
            </motion.div>
        </DashboardShell>
    );
}