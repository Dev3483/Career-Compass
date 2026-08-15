import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function PageNotFound() {
    return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center max-w-md"
            >
                <div className="w-20 h-20 rounded-2xl bg-[#6C63FF] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#6C63FF]/20">
                    <Sparkles className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-6xl font-extrabold text-[#6C63FF] mb-4">404</h1>
                <p className="text-xl font-bold text-gray-900 mb-2">Page Not Found</p>
                <p className="text-gray-500 mb-8">The page you're looking for doesn't exist or has been moved.</p>
                <div className="flex gap-3 justify-center">
                    <Link to={createPageUrl("Landing")}>
                        <Button variant="outline" className="rounded-xl">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
                        </Button>
                    </Link>
                    <Link to={createPageUrl("Landing")}>
                        <Button className="bg-[#6C63FF] text-white rounded-xl hover:bg-[#5A52D5]">
                            <Home className="w-4 h-4 mr-2" /> Home
                        </Button>
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}