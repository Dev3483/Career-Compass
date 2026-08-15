import React from "react";
import { motion } from "framer-motion";
import { Bell, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function CTASection() {
    const navigate = useNavigate();

    const handleGetStarted = () => {
        navigate(createPageUrl("Register"));
    };

    return (
        <section className="py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="relative overflow-hidden rounded-3xl bg-[#6C63FF] p-10 lg:p-16 text-center"
                >
                    {/* Animated background shapes */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <motion.div
                            animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
                            transition={{ duration: 8, repeat: Infinity }}
                            className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"
                        />
                        <motion.div
                            animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
                            transition={{ duration: 10, repeat: Infinity }}
                            className="absolute bottom-10 right-10 w-48 h-48 bg-white/5 rounded-full blur-2xl"
                        />
                        <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 6, repeat: Infinity }}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-3xl"
                        />
                    </div>

                    <div className="relative z-10">
                        <motion.div
                            initial={{ scale: 0 }}
                            whileInView={{ scale: 1 }}
                            viewport={{ once: true }}
                            className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-6"
                        >
                            <Bell className="w-8 h-8 text-white" />
                        </motion.div>
                        <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-4">
                            Set Up Personalized Job Alerts
                        </h2>
                        <p className="text-white/80 text-lg max-w-xl mx-auto mb-8">
                            Never miss a perfect opportunity. Get AI-curated job alerts delivered to your inbox.
                        </p>
                        <Button
                            size="lg"
                            onClick={handleGetStarted}
                            className="bg-white text-[#6C63FF] font-semibold rounded-xl px-8 hover:bg-white/90 transition-colors"
                        >
                            Get Started Free
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}