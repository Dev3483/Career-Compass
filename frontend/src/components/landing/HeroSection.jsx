import React, { useState } from "react";
import { motion } from "framer-motion";
import {
    Search,
    MapPin,
    Briefcase,
    TrendingUp,
    Star,
    Zap,
    MousePointer2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const cursors = [
    {
        id: 1,
        name: "Alex C.",
        image: "https://i.pravatar.cc/150?u=1",
        color: "#F59E0B",
        delay: 0,
        duration: 18,
        pathX: ["-10%", "50%", "20%", "-10%"],
        pathY: ["10%", "50%", "80%", "10%"]
    },
    {
        id: 2,
        name: "Sarah M.",
        image: "https://i.pravatar.cc/150?u=2",
        color: "#10B981",
        delay: 2,
        duration: 22,
        pathX: ["110%", "60%", "90%", "110%"],
        pathY: ["80%", "30%", "60%", "80%"]
    },
    {
        id: 3,
        name: "James W.",
        image: "https://i.pravatar.cc/150?u=3",
        color: "#6C63FF",
        delay: 1,
        duration: 25,
        pathX: ["30%", "100%", "50%", "30%"],
        pathY: ["110%", "60%", "-10%", "110%"]
    },
];

export default function HeroSection() {
    const navigate = useNavigate();
    const [jobTitle, setJobTitle] = useState("");
    const [location, setLocation] = useState("");

    const handleSearch = () => {
        // Navigate to jobs page with search params
        navigate(`${createPageUrl("Jobs")}?search=${encodeURIComponent(jobTitle)}&location=${encodeURIComponent(location)}`);
    };

    return (
        <section className="relative pt-28 lg:pt-36 pb-20 overflow-hidden">
            {/* Background decorations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#6C63FF]/5 rounded-full blur-3xl" />
                <div className="absolute top-20 -left-20 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Left Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#6C63FF]/10 text-[#6C63FF] text-sm font-medium mb-6"
                        >
                            <Zap className="w-4 h-4" />
                            AI-Powered Career Intelligence
                        </motion.div>

                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight text-gray-900 mb-6">
                            The best place to build your{" "}
                            <span className="text-[#6C63FF]">AI-powered</span> career
                        </h1>

                        <p className="text-lg text-gray-500 mb-8 max-w-lg leading-relaxed">
                            Get personalized job recommendations, AI resume analysis, and career intelligence — all powered by advanced machine learning.
                        </p>

                        {/* Search Bar */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-2 flex flex-col sm:flex-row gap-2 mb-6">
                            <div className="flex items-center gap-2 flex-1 px-3">
                                <Briefcase className="w-5 h-5 text-gray-400" />
                                <Input
                                    placeholder="Job title or keyword"
                                    value={jobTitle}
                                    onChange={(e) => setJobTitle(e.target.value)}
                                    className="border-0 shadow-none focus-visible:ring-0 text-sm"
                                />
                            </div>
                            <div className="hidden sm:block w-px bg-gray-200" />
                            <div className="flex items-center gap-2 flex-1 px-3">
                                <MapPin className="w-5 h-5 text-gray-400" />
                                <Input
                                    placeholder="Location"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    className="border-0 shadow-none focus-visible:ring-0 text-sm"
                                />
                            </div>
                            <Button
                                onClick={handleSearch}
                                className="bg-[#6C63FF] text-white rounded-xl px-8 h-11 hover:bg-[#5A52D5]"
                            >
                                <Search className="w-4 h-4 mr-2" />
                                Search
                            </Button>
                        </div>

                        <div className="flex items-center gap-6 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                                <span className="w-2 h-2 bg-green-400 rounded-full" />
                                12,000+ Active Jobs
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-2 h-2 bg-blue-400 rounded-full" />
                                98% AI Accuracy
                            </span>
                        </div>
                    </motion.div>

                    {/* Right - Floating Dashboard Preview */}
                    <motion.div
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="relative hidden lg:block"
                    >
                        <div className="absolute inset-0 bg-[#6C63FF] rounded-3xl opacity-10 blur-3xl scale-90" />

                        {/* Animated Collaboration Cursors */}
                        {cursors.map((cursor) => (
                            <motion.div
                                key={cursor.id}
                                animate={{
                                    left: cursor.pathX,
                                    top: cursor.pathY,
                                }}
                                transition={{
                                    duration: cursor.duration,
                                    repeat: Infinity,
                                    ease: "linear",
                                    delay: cursor.delay
                                }}
                                className="absolute z-10 pointer-events-none flex flex-col items-start hidden sm:flex"
                            >
                                <MousePointer2
                                    className="w-5 h-5 -ml-2 -mt-2 drop-shadow-md"
                                    style={{ color: cursor.color, fill: cursor.color }}
                                />
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="ml-3 mt-1 flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full py-1 pr-3 pl-1 shadow-lg border border-gray-100"
                                    style={{ borderColor: `${cursor.color}40` }}
                                >
                                    <img
                                        src={cursor.image}
                                        alt={cursor.name}
                                        className="w-6 h-6 rounded-full object-cover border-[1.5px]"
                                        style={{ borderColor: cursor.color }}
                                    />
                                    <span className="text-[11px] font-semibold tracking-wide text-gray-700">
                                        {cursor.name}
                                    </span>
                                </motion.div>
                            </motion.div>
                        ))}

                        {/* Main Dashboard Card */}
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                            className="relative bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 ml-8"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-[#6C63FF] flex items-center justify-center">
                                    <TrendingUp className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">AI Match Dashboard</p>
                                    <p className="text-xs text-gray-500">Real-time recommendations</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {[
                                    { title: "Senior Frontend Developer", company: "Google", match: 95 },
                                    { title: "Product Designer", company: "Stripe", match: 88 },
                                    { title: "Data Scientist", company: "Meta", match: 82 },
                                ].map((job, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.8 + i * 0.2 }}
                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                                    >
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{job.title}</p>
                                            <p className="text-xs text-gray-500">{job.company}</p>
                                        </div>
                                        <div className={`px-3 py-1 rounded-lg text-xs font-bold ${job.match >= 90 ? "bg-green-100 text-green-700" :
                                            job.match >= 85 ? "bg-blue-100 text-blue-700" :
                                                "bg-purple-100 text-purple-700"
                                            }`}>
                                            {job.match}% Match
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Floating Profile Card */}
                        <motion.div
                            animate={{ y: [0, 12, 0] }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                            className="absolute -left-4 top-12 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 w-48"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400" />
                                <div>
                                    <p className="text-xs font-semibold">Sarah Chen</p>
                                    <p className="text-[10px] text-gray-500">UX Designer</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                ))}
                                <span className="text-[10px] text-gray-500 ml-1">4.9</span>
                            </div>
                        </motion.div>

                        {/* AI Score Badge */}
                        <motion.div
                            animate={{ y: [0, -8, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                            className="absolute -right-2 bottom-16 bg-white rounded-2xl shadow-xl border border-gray-100 p-4"
                        >
                            <div className="flex items-center gap-2">
                                <div className="w-12 h-12 rounded-full bg-[#6C63FF] flex items-center justify-center">
                                    <span className="text-white font-bold text-sm">AI</span>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Resume Score</p>
                                    <p className="text-lg font-bold text-gray-900">92<span className="text-sm text-green-500">/100</span></p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}