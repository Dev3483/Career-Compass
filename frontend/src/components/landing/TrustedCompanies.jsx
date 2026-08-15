import React from "react";
import { motion } from "framer-motion";

const companies = [
    { name: "HubSpot", color: "#FF7A59" },
    { name: "Asana", color: "#F06A6A" },
    { name: "Expedia", color: "#00355F" },
    { name: "Loom", color: "#625DF5" },
    { name: "Zenefits", color: "#FF6847" },
    { name: "Stripe", color: "#635BFF" },
];

export default function TrustedCompanies() {
    return (
        <section className="py-16 border-t border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="text-center text-sm font-medium text-gray-400 mb-10 uppercase tracking-wider"
                >
                    Trusted by leading companies worldwide
                </motion.p>
                <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-16">
                    {companies.map((company, i) => (
                        <motion.div
                            key={company.name}
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            whileHover={{ scale: 1.05 }}
                            className="group cursor-pointer"
                        >
                            <span
                                className="text-xl lg:text-2xl font-bold text-gray-300 group-hover:text-gray-700 transition-all duration-300"
                                style={{ '--hover-color': company.color }}
                            >
                                {company.name}
                            </span>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}