import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Menu, X, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const { isAuthenticated, navigateToLogin } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const links = [
        { label: "Job Vacancy", href: createPageUrl("Jobs") },
        { label: "Features", href: "#features" },
        { label: "Pricing", href: "#pricing" },
        { label: "About Us", href: "#about" },
    ];

    const handleLogin = () => {
        navigateToLogin();
    };

    const handleDashboard = () => {
        navigate(createPageUrl("Dashboard"));
    };

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
                    ? "bg-white/90 backdrop-blur-xl shadow-sm border-b border-gray-100"
                    : "bg-transparent"
                }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 lg:h-20">
                    <Link to={createPageUrl("Landing")} className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-[#6C63FF] flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-gray-900">CareerCompass</span>
                    </Link>

                    <div className="hidden lg:flex items-center gap-8">
                        {links.map((link) => (
                            <a
                                key={link.label}
                                href={link.href}
                                className="text-sm font-medium text-gray-600 hover:text-[#6C63FF] transition-colors"
                            >
                                {link.label}
                            </a>
                        ))}
                    </div>

                    <div className="hidden lg:flex items-center gap-3">
                        {isAuthenticated ? (
                            <Button
                                onClick={handleDashboard}
                                className="bg-[#6C63FF] text-white rounded-xl px-6 hover:bg-[#5A52D5] transition-opacity"
                            >
                                Dashboard
                            </Button>
                        ) : (
                            <>
                                <Button
                                    variant="ghost"
                                    onClick={handleLogin}
                                    className="text-gray-600 rounded-xl"
                                >
                                    Login
                                </Button>
                                <Button
                                    onClick={handleLogin}
                                    className="bg-[#6C63FF] text-white rounded-xl px-6 hover:bg-[#5A52D5] transition-opacity"
                                >
                                    Sign Up
                                </Button>
                            </>
                        )}
                    </div>

                    <button
                        className="lg:hidden p-2"
                        onClick={() => setMobileOpen(!mobileOpen)}
                    >
                        {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="lg:hidden bg-white border-t"
                    >
                        <div className="px-4 py-4 space-y-3">
                            {links.map((link) => (
                                <a
                                    key={link.label}
                                    href={link.href}
                                    className="block py-2 text-gray-600 font-medium"
                                    onClick={() => setMobileOpen(false)}
                                >
                                    {link.label}
                                </a>
                            ))}
                            <div className="pt-3 border-t space-y-2">
                                {isAuthenticated ? (
                                    <Button
                                        onClick={handleDashboard}
                                        className="w-full bg-[#6C63FF] text-white rounded-xl"
                                    >
                                        Dashboard
                                    </Button>
                                ) : (
                                    <>
                                        <Button
                                            variant="outline"
                                            onClick={handleLogin}
                                            className="w-full rounded-xl"
                                        >
                                            Login
                                        </Button>
                                        <Button
                                            onClick={handleLogin}
                                            className="w-full bg-[#6C63FF] text-white rounded-xl"
                                        >
                                            Sign Up
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    );
}