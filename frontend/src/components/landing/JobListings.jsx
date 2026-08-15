import React, { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, DollarSign, Clock, Heart, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const sampleJobs = [
    { id: 1, title: "Senior Frontend Developer", company: "Google", location: "San Francisco, CA", salary: "$150K–$200K", type: "Full-time", match: 95, logo: "G", color: "bg-blue-500" },
    { id: 2, title: "Product Designer", company: "Stripe", location: "Remote", salary: "$120K–$160K", type: "Remote", match: 88, logo: "S", color: "bg-purple-500" },
    { id: 3, title: "Data Scientist", company: "Meta", location: "New York, NY", salary: "$140K–$190K", type: "Full-time", match: 82, logo: "M", color: "bg-blue-600" },
    { id: 4, title: "DevOps Engineer", company: "Amazon", location: "Seattle, WA", salary: "$130K–$175K", type: "Full-time", match: 79, logo: "A", color: "bg-orange-500" },
    { id: 5, title: "ML Engineer", company: "OpenAI", location: "Remote", salary: "$180K–$250K", type: "Remote", match: 91, logo: "O", color: "bg-green-600" },
    { id: 6, title: "UX Researcher", company: "Apple", location: "Cupertino, CA", salary: "$130K–$170K", type: "Full-time", match: 76, logo: "A", color: "bg-gray-800" },
];

const tabs = ["Popular", "Latest", "Remote"];

export default function JobListings() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("Popular");
    const [saved, setSaved] = useState(new Set());

    const toggleSave = (id) => {
        setSaved(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const handleApplyClick = () => {
        navigate(createPageUrl("Login"));
    };

    const filtered = activeTab === "Remote"
        ? sampleJobs.filter(j => j.type === "Remote")
        : sampleJobs;

    return (
        <section className="py-20 lg:py-28">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12"
                >
                    <span className="inline-block px-4 py-1.5 rounded-full bg-[#6C63FF]/10 text-[#6C63FF] text-sm font-medium mb-4">
                        Opportunities
                    </span>
                    <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-4">
                        Featured Job Listings
                    </h2>
                    <p className="text-gray-500 max-w-2xl mx-auto text-lg">
                        Discover AI-matched opportunities from top companies worldwide.
                    </p>
                </motion.div>

                <div className="flex justify-center gap-2 mb-10">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === tab
                                    ? "bg-[#6C63FF] text-white shadow-md shadow-[#6C63FF]/20"
                                    : "bg-white text-gray-500 hover:text-gray-700 border border-gray-200"
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                    {filtered.map((job, i) => (
                        <motion.div
                            key={job.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.08 }}
                            className="group bg-white rounded-2xl border border-gray-100 p-6 card-hover"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-11 h-11 rounded-xl ${job.color} flex items-center justify-center text-white font-bold text-sm`}>
                                        {job.logo}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{job.title}</h3>
                                        <p className="text-sm text-gray-500 flex items-center gap-1">
                                            <Building2 className="w-3.5 h-3.5" />
                                            {job.company}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => toggleSave(job.id)}
                                    className="p-2 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <Heart className={`w-5 h-5 transition-colors ${saved.has(job.id) ? "fill-red-500 text-red-500" : "text-gray-300"
                                        }`} />
                                </button>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 mb-4">
                                <Badge variant="secondary" className="rounded-lg bg-gray-50 text-gray-600 font-normal">
                                    <MapPin className="w-3 h-3 mr-1" /> {job.location}
                                </Badge>
                                <Badge variant="secondary" className="rounded-lg bg-gray-50 text-gray-600 font-normal">
                                    <DollarSign className="w-3 h-3 mr-1" /> {job.salary}
                                </Badge>
                                <Badge variant="secondary" className="rounded-lg bg-gray-50 text-gray-600 font-normal">
                                    <Clock className="w-3 h-3 mr-1" /> {job.type}
                                </Badge>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className={`px-3 py-1.5 rounded-lg text-xs font-bold ${job.match >= 90 ? "bg-green-50 text-green-700" :
                                        job.match >= 80 ? "bg-blue-50 text-blue-700" :
                                            "bg-purple-50 text-purple-700"
                                    }`}>
                                    {job.match}% AI Match
                                </div>
                                <Button
                                    size="sm"
                                    onClick={handleApplyClick}
                                    className="bg-[#6C63FF] text-white rounded-xl text-xs px-5 hover:bg-[#5A52D5]"
                                >
                                    Apply Now
                                </Button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}