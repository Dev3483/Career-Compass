import React from "react";
import { motion } from "framer-motion";
import { UserPlus, Upload, Brain, Briefcase } from "lucide-react";

const steps = [
    {
        num: "01",
        icon: UserPlus,
        title: "Register",
        desc: "Create your free account in seconds and set up your career profile.",
    },
    {
        num: "02",
        icon: Upload,
        title: "Upload Resume",
        desc: "Upload your resume and let AI extract your skills and experience.",
    },
    {
        num: "03",
        icon: Brain,
        title: "AI Analysis",
        desc: "Our AI analyzes your profile against thousands of job listings.",
    },
    {
        num: "04",
        icon: Briefcase,
        title: "Get Matched",
        desc: "Receive personalized job recommendations with match scores.",
    },
];

export default function HowItWorks() {
    return (
        <section className="py-20 lg:py-28 bg-gradient-to-b from-white to-[#F5F7FB]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <span className="inline-block px-4 py-1.5 rounded-full bg-[#6C63FF]/10 text-[#6C63FF] text-sm font-medium mb-4">
                        How It Works
                    </span>
                    <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-4">
                        Four Simple Steps
                    </h2>
                    <p className="text-gray-500 max-w-2xl mx-auto text-lg">
                        From registration to your dream job — powered by AI at every step.
                    </p>
                </motion.div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 relative">
                    {/* Connecting line (desktop) */}
                    <div className="hidden lg:block absolute top-16 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-[#6C63FF]/20 via-[#6C63FF]/40 to-[#6C63FF]/20" />

                    {steps.map((step, i) => (
                        <motion.div
                            key={step.num}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.15 }}
                            className="relative text-center"
                        >
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="relative z-10 w-16 h-16 mx-auto mb-6 rounded-2xl bg-[#6C63FF] flex items-center justify-center shadow-lg shadow-[#6C63FF]/20"
                            >
                                <step.icon className="w-7 h-7 text-white" />
                            </motion.div>
                            <span className="text-xs font-bold text-[#6C63FF] uppercase tracking-widest mb-2 block">
                                Step {step.num}
                            </span>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                            <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}