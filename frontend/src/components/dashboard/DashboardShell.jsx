import React, { useState } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { useAuth } from "@/context/AuthContext";

export default function DashboardShell({ children, user, title, currentPage }) {
    const [collapsed, setCollapsed] = useState(false);
    const role = user?.role || "job_seeker";
    const { logout } = useAuth(); // Get logout function from auth context

    const handleToggle = () => {
        setCollapsed(!collapsed);
    };

    const handleLogout = async () => {
        await logout(); // Call the logout function from context
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <Sidebar
                role={role}
                currentPage={currentPage}
                collapsed={collapsed}
                onToggle={handleToggle}
                onLogout={handleLogout}
            />
            <div
                className="transition-all duration-300"
                style={{ marginLeft: collapsed ? 72 : 260 }}
            >
                <TopBar user={user} title={title} />
                <main className="p-6">{children}</main>
            </div>
        </div>
    );
}