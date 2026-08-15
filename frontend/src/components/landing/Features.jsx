import React from "react";
import { motion } from "framer-motion";
import { FileText, Target, BarChart3, MessageSquare, DollarSign, Mic } from "lucide-react";

const features = [
    {
        icon: FileText,
        title: "Resume Intelligence",
        description: "AI-powered resume analysis with ATS scoring, skill extraction, and personalized improvement suggestions.",
        color: "from-purple-500 to-indigo-500",
        bg: "bg-purple-50",
    },
    {
        icon: Target,
        title: "AI Job Matching",
        description: "Smart matching algorithm analyzes your skills and preferences to find your perfect career opportunities.",
        color: "from-blue-500 to-cyan-500",
        bg: "bg-blue-50",
    },
    {
        icon: BarChart3,
        title: "Skill Gap Analysis",
        description: "Identify missing skills for your dream role and get a personalized learning roadmap.",
        color: "from-green-500 to-emerald-500",
        bg: "bg-green-50",
    },
    {
        icon: MessageSquare,
        title: "Career AI Chatbot",
        description: "24/7 AI career advisor for resume tips, interview prep, and personalized career guidance.",
        color: "from-orange-500 to-amber-500",
        bg: "bg-orange-50",
    },
    {
        icon: DollarSign,
        title: "Salary Prediction",
        description: "ML-powered salary estimates based on your experience, skills, location, and market trends.",
        color: "from-pink-500 to-rose-500",
        bg: "bg-pink-50",
    },
    {
        icon: Mic,
        title: "Interview AI Coach",
        description: "Practice with AI mock interviews, get real-time feedback, and boost your confidence.",
        color: "from-violet-500 to-purple-500",
        bg: "bg-violet-50",
    },
];

export default function Features() {
    return (
        <section id="features" className="py-20 lg:py-28">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <span className="inline-block px-4 py-1.5 rounded-full bg-[#6C63FF]/10 text-[#6C63FF] text-sm font-medium mb-4">
                        Features
                    </span>
                    <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-4">
                        A New Way to Get a Job
                    </h2>
                    <p className="text-gray-500 max-w-2xl mx-auto text-lg">
                        Leverage AI to transform every step of your job search — from resume to offer.
                    </p>
                </motion.div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, i) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="group relative bg-white rounded-2xl p-7 border border-gray-100 card-hover cursor-pointer"
                        >
                            <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                                <feature.icon className="w-6 h-6 text-[#6C63FF]" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                            <p className="text-sm text-gray-500 leading-relaxed mb-4">{feature.description}</p>
                            <span className="text-sm font-medium text-[#6C63FF] group-hover:underline">
                                Learn more →
                            </span>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}