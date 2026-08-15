import React from "react";
import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const columns = [
    {
        title: "Product",
        links: [
            { name: "Job Search", url: createPageUrl("Jobs") },
            { name: "Resume Builder", url: "#" },
            { name: "AI Matching", url: "#" },
            { name: "Career Chat", url: "#" },
        ],
    },
    {
        title: "Features",
        links: [
            { name: "Salary Prediction", url: "#" },
            { name: "Skill Analysis", url: "#" },
            { name: "Interview Prep", url: "#" },
            { name: "Company Insights", url: "#" },
        ],
    },
    {
        title: "Resources",
        links: [
            { name: "Blog", url: "#" },
            { name: "Career Guide", url: "#" },
            { name: "API Docs", url: "#" },
            { name: "Help Center", url: "#" },
        ],
    },
    {
        title: "Legal",
        links: [
            { name: "Privacy Policy", url: "#" },
            { name: "Terms of Service", url: "#" },
            { name: "Cookie Policy", url: "#" },
            { name: "GDPR", url: "#" },
        ],
    },
];

export default function Footer() {
    return (
        <footer className="bg-white border-t border-gray-100 pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
                    <div className="col-span-2 lg:col-span-1">
                        <Link to={createPageUrl("Landing")} className="flex items-center gap-2 mb-4">
                            <div className="w-9 h-9 rounded-xl bg-[#6C63FF] flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold text-gray-900">CareerAI</span>
                        </Link>
                        <p className="text-sm text-gray-500 leading-relaxed">
                            AI-powered career intelligence platform for the modern job seeker.
                        </p>
                    </div>
                    {columns.map((col) => (
                        <div key={col.title}>
                            <h4 className="font-semibold text-gray-900 mb-4 text-sm">{col.title}</h4>
                            <ul className="space-y-3">
                                {col.links.map((link) => (
                                    <li key={link.name}>
                                        <Link
                                            to={link.url}
                                            className="text-sm text-gray-500 hover:text-[#6C63FF] transition-colors"
                                        >
                                            {link.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
                <div className="border-t border-gray-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-gray-400">© 2026 CareerAI. All rights reserved.</p>
                    <div className="flex items-center gap-6">
                        <a href="#" className="text-sm text-gray-400 hover:text-gray-600">Twitter</a>
                        <a href="#" className="text-sm text-gray-400 hover:text-gray-600">LinkedIn</a>
                        <a href="#" className="text-sm text-gray-400 hover:text-gray-600">GitHub</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}