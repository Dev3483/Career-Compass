import React, { useState, useEffect } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { motion } from "framer-motion";
import { Building2, CheckCircle, XCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

// Mock user data
const mockUser = {
    id: "admin-1",
    full_name: "Admin User",
    email: "admin@careerai.com",
    role: "admin"
};

// Mock companies data
const mockCompanies = [
    {
        id: "comp-1",
        full_name: "John Smith",
        company_name: "TechCorp Inc.",
        email: "john@techcorp.com",
        approved: true,
        role: "company"
    },
    {
        id: "comp-2",
        full_name: "Sarah Johnson",
        company_name: "InnovateLabs",
        email: "sarah@innovatelabs.com",
        approved: false,
        role: "company"
    },
    {
        id: "comp-3",
        full_name: "Mike Chen",
        company_name: "DataFlow Systems",
        email: "mike@dataflow.com",
        approved: true,
        role: "company"
    },
    {
        id: "comp-4",
        full_name: "Emily Brown",
        company_name: "CloudNine Solutions",
        email: "emily@cloudnine.com",
        approved: false,
        role: "company"
    },
    {
        id: "comp-5",
        full_name: "David Wilson",
        company_name: "AITech Global",
        email: "david@aitech.com",
        approved: true,
        role: "company"
    },
];

export default function AdminCompanies() {
    const [user, setUser] = useState(null);
    const [search, setSearch] = useState("");
    const [companies, setCompanies] = useState([]);

    useEffect(() => {
        // Simulate API calls
        setTimeout(() => setUser(mockUser), 500);
        setTimeout(() => setCompanies(mockCompanies), 800);
    }, []);

    const filtered = companies.filter(c =>
        !search ||
        c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        c.company_name?.toLowerCase().includes(search.toLowerCase())
    );

    const toggleApproval = (companyId) => {
        setCompanies(prevCompanies =>
            prevCompanies.map(company =>
                company.id === companyId
                    ? { ...company, approved: !company.approved }
                    : company
            )
        );
    };

    if (!user) return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
            <div className="flex gap-1">
                <div className="w-3 h-3 rounded-full bg-[#6C63FF] pulse-dot" />
                <div className="w-3 h-3 rounded-full bg-[#6C63FF] pulse-dot" style={{ animationDelay: "0.2s" }} />
                <div className="w-3 h-3 rounded-full bg-[#6C63FF] pulse-dot" style={{ animationDelay: "0.4s" }} />
            </div>
        </div>
    );

    return (
        <DashboardShell user={user} title="Company Management" currentPage="AdminCompanies">
            <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center gap-2 flex-1 bg-white rounded-xl px-3 border border-gray-100">
                    <Search className="w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="Search companies..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="border-0 bg-transparent shadow-none focus-visible:ring-0"
                    />
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                    <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">No companies found</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 gap-5">
                    {filtered.map((company, i) => (
                        <motion.div
                            key={company.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-white rounded-2xl border border-gray-100 p-6 card-hover"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-xl bg-[#6C63FF] flex items-center justify-center text-white font-bold text-sm">
                                        {company.company_name?.[0] || company.full_name?.[0] || "C"}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">{company.company_name || company.full_name}</p>
                                        <p className="text-xs text-gray-500">{company.email}</p>
                                    </div>
                                </div>
                                <Badge className={`rounded-lg text-xs ${company.approved !== false
                                        ? "bg-green-100 text-green-700"
                                        : "bg-amber-100 text-amber-700"
                                    }`}>
                                    {company.approved !== false ? "Approved" : "Pending"}
                                </Badge>
                            </div>
                            <div className="flex gap-2 mt-4">
                                <Button
                                    size="sm"
                                    variant={company.approved !== false ? "outline" : "default"}
                                    className={`rounded-xl text-xs ${company.approved === false ? "bg-[#6C63FF] text-white hover:bg-[#5A52D5]" : ""
                                        }`}
                                    onClick={() => toggleApproval(company.id)}
                                >
                                    {company.approved !== false ? (
                                        <><XCircle className="w-3 h-3 mr-1" /> Revoke</>
                                    ) : (
                                        <><CheckCircle className="w-3 h-3 mr-1" /> Approve</>
                                    )}
                                </Button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </DashboardShell>
    );
}