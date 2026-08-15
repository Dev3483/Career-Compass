import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, DollarSign, Clock, Heart, Building2, Search, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

// Mock jobs data
const mockJobs = [
    {
        id: "job-1",
        title: "Senior React Developer",
        company: "Vercel",
        location: "San Francisco, CA",
        salary_min: 120000,
        salary_max: 180000,
        type: "full_time",
        status: "active"
    },
    {
        id: "job-2",
        title: "Full Stack Engineer",
        company: "Stripe",
        location: "Remote",
        salary_min: 130000,
        salary_max: 190000,
        type: "remote",
        status: "active"
    },
    {
        id: "job-3",
        title: "Frontend Lead",
        company: "Figma",
        location: "New York, NY",
        salary_min: 140000,
        salary_max: 200000,
        type: "full_time",
        status: "active"
    },
    {
        id: "job-4",
        title: "DevOps Engineer",
        company: "Netflix",
        location: "Los Angeles, CA",
        salary_min: 130000,
        salary_max: 190000,
        type: "full_time",
        status: "active"
    },
    {
        id: "job-5",
        title: "Data Scientist",
        company: "Airbnb",
        location: "Remote",
        salary_min: 125000,
        salary_max: 185000,
        type: "remote",
        status: "active"
    },
    {
        id: "job-6",
        title: "Product Manager",
        company: "Slack",
        location: "San Francisco, CA",
        salary_min: 135000,
        salary_max: 195000,
        type: "full_time",
        status: "active"
    },
    {
        id: "job-7",
        title: "Backend Engineer",
        company: "Dropbox",
        location: "Remote",
        salary_min: 125000,
        salary_max: 180000,
        type: "remote",
        status: "active"
    },
    {
        id: "job-8",
        title: "UX Designer",
        company: "Figma",
        location: "New York, NY",
        salary_min: 110000,
        salary_max: 160000,
        type: "full_time",
        status: "active"
    },
];

export default function Jobs() {
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [locationFilter, setLocationFilter] = useState("");
    const [jobs, setJobs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Simulate API call
        setTimeout(() => {
            setJobs(mockJobs);
            setIsLoading(false);
        }, 800);
    }, []);

    const filtered = jobs.filter(job => {
        const matchSearch = !search ||
            job.title?.toLowerCase().includes(search.toLowerCase()) ||
            job.company?.toLowerCase().includes(search.toLowerCase());
        const matchType = typeFilter === "all" || job.type === typeFilter;
        const matchLoc = !locationFilter ||
            job.location?.toLowerCase().includes(locationFilter.toLowerCase());
        return matchSearch && matchType && matchLoc;
    });

    const handleApplyClick = () => {
        navigate(createPageUrl("Login"));
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <Navbar />
            <div className="pt-24 pb-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-10"
                    >
                        <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-3">
                            Find Your Dream Job
                        </h1>
                        <p className="text-gray-500 text-lg">
                            Browse AI-matched opportunities from top companies
                        </p>
                    </motion.div>

                    {/* Filters */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-8 flex flex-col md:flex-row gap-3"
                    >
                        <div className="flex items-center gap-2 flex-1 bg-gray-50 rounded-xl px-3">
                            <Search className="w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Job title or keyword"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="border-0 bg-transparent shadow-none focus-visible:ring-0"
                            />
                        </div>
                        <div className="flex items-center gap-2 flex-1 bg-gray-50 rounded-xl px-3">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Location"
                                value={locationFilter}
                                onChange={(e) => setLocationFilter(e.target.value)}
                                className="border-0 bg-transparent shadow-none focus-visible:ring-0"
                            />
                        </div>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-full md:w-40 rounded-xl">
                                <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="full_time">Full-time</SelectItem>
                                <SelectItem value="remote">Remote</SelectItem>
                                <SelectItem value="contract">Contract</SelectItem>
                                <SelectItem value="part_time">Part-time</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button className="bg-[#6C63FF] text-white rounded-xl px-6 hover:bg-[#5A52D5]">
                            <Search className="w-4 h-4 mr-2" /> Search
                        </Button>
                    </motion.div>

                    {isLoading ? (
                        <div className="grid md:grid-cols-2 gap-5">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-3">
                                    <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                                    <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
                                    <div className="h-3 w-full bg-gray-200 rounded animate-pulse" />
                                </div>
                            ))}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-20">
                            <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 font-medium">No jobs found</p>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-5">
                            {filtered.map((job, i) => (
                                <motion.div
                                    key={job.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="bg-white rounded-2xl border border-gray-100 p-6 card-hover"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-11 h-11 rounded-xl bg-[#6C63FF] flex items-center justify-center text-white font-bold text-sm">
                                                {job.company?.[0] || "C"}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900">{job.title}</h3>
                                                <p className="text-sm text-gray-500 flex items-center gap-1">
                                                    <Building2 className="w-3.5 h-3.5" />{job.company}
                                                </p>
                                            </div>
                                        </div>
                                        <Heart className="w-5 h-5 text-gray-300 cursor-pointer hover:text-red-400 transition-colors" />
                                    </div>
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        <Badge variant="secondary" className="rounded-lg bg-gray-50 text-gray-600 font-normal text-xs">
                                            <MapPin className="w-3 h-3 mr-1" />{job.location}
                                        </Badge>
                                        {job.salary_min && (
                                            <Badge variant="secondary" className="rounded-lg bg-gray-50 text-gray-600 font-normal text-xs">
                                                <DollarSign className="w-3 h-3 mr-1" />${(job.salary_min / 1000).toFixed(0)}K–${(job.salary_max / 1000).toFixed(0)}K
                                            </Badge>
                                        )}
                                        <Badge variant="secondary" className="rounded-lg bg-gray-50 text-gray-600 font-normal text-xs">
                                            <Clock className="w-3 h-3 mr-1" />{job.type?.replace("_", " ")}
                                        </Badge>
                                    </div>
                                    <Button
                                        size="sm"
                                        className="bg-[#6C63FF] text-white rounded-xl text-xs px-5 hover:bg-[#5A52D5]"
                                        onClick={handleApplyClick}
                                    >
                                        Apply Now
                                    </Button>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </div>
    );
}