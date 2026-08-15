import React from "react";
import { motion } from "framer-motion";

export default function StatCard({ icon: Icon, title, value, change, color, delay = 0 }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="bg-white rounded-2xl border border-gray-100 p-6 card-hover"
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                    {change !== undefined && (
                        <p className={`text-xs font-medium mt-2 ${change > 0 ? "text-green-500" : "text-red-500"}`}>
                            {change > 0 ? "↑" : "↓"} {Math.abs(change)}% from last month
                        </p>
                    )}
                </div>
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color || "bg-purple-50"}`}>
                    <Icon className="w-5 h-5 text-[#6C63FF]" />
                </div>
            </div>
        </motion.div>
    );
}