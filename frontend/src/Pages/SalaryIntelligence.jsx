import React, { useState, useEffect, useMemo } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { motion } from "framer-motion";
import { DollarSign, TrendingUp, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { predictSalary } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";

const roles = [
    { name: "Frontend Developer", min: 80, max: 180, avg: 120 },
    { name: "Backend Developer", min: 90, max: 190, avg: 130 },
    { name: "Full Stack", min: 85, max: 185, avg: 125 },
    { name: "Data Scientist", min: 100, max: 200, avg: 145 },
    { name: "Product Manager", min: 95, max: 195, avg: 140 },
    { name: "UX Designer", min: 75, max: 160, avg: 110 },
];

const locations = [
    { name: "Mumbai", multiplier: 1.3 },
    { name: "Bangalore", multiplier: 1.2 },
    { name: "Pune", multiplier: 1.0 },
    { name: "Remote", multiplier: 1.05 },
    { name: "Hyderabad", multiplier: 1.1 },
    { name: "Gandhidham", multiplier: 0.85 }, 
];

export default function SalaryIntelligence() {
    const { user, isAuthenticated, isLoadingAuth } = useAuth();
    
    // Memoize skills to prevent infinite API loops
    const prefilledSkills = useMemo(() => ["python", "react", "node.js", "aws"], []);

    const [selectedRole, setSelectedRole] = useState("Frontend Developer");
    const [selectedLocation, setSelectedLocation] = useState("Bangalore");
    const [experience, setExperience] = useState([2]);
    const [apiSalaryData, setApiSalaryData] = useState(null);
    const [isFetching, setIsFetching] = useState(false);

    useEffect(() => {
        if (!isAuthenticated || !user) return;

        const fetchPrediction = async () => {
            setIsFetching(true);
            try {
                const response = await predictSalary({
                    experience_years: experience[0],
                    role: selectedRole,
                    location: selectedLocation,
                    skills: prefilledSkills 
                });
                if (response.success) {
                    setApiSalaryData(response.salary_prediction);
                }
            } catch (err) {
                console.error("Error fetching salary:", err);
            } finally {
                setIsFetching(false);
            }
        };

        const timeoutId = setTimeout(fetchPrediction, 500);
        return () => clearTimeout(timeoutId);
    }, [selectedRole, selectedLocation, experience, prefilledSkills, isAuthenticated, user]);

    // UI Chart Calculations
    const role = roles.find(r => r.name === selectedRole) || roles[0];
    const location = locations.find(l => l.name === selectedLocation) || locations[0];
    const expMultiplier = 1 + (experience[0] - 1) * 0.06;

    const chartData = roles.map(r => ({
        name: r.name.split(" ").slice(0, 2).join(" "),
        salary: Math.round(r.avg * location.multiplier * expMultiplier),
        isSelected: r.name === selectedRole,
    }));

    const comparisonData = locations.map(l => ({
        name: l.name,
        salary: Math.round(role.avg * l.multiplier * expMultiplier),
        isSelected: l.name === selectedLocation,
    }));

    // Calculate percentage for the custom slider track fill
    const sliderPercentage = (experience[0] / 15) * 100;

    if (isLoadingAuth) return <div className="p-20 text-center">Loading Salary Module...</div>;

    return (
        <DashboardShell user={user} title="Salary Intelligence" currentPage="SalaryIntelligence">
            
            {/* Custom styles just for our native slider thumb */}
            <style dangerouslySetInnerHTML={{ __html: `
                .custom-range::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: white;
                    border: 2px solid #6C63FF;
                    cursor: pointer;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .custom-range::-moz-range-thumb {
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: white;
                    border: 2px solid #6C63FF;
                    cursor: pointer;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
            `}} />

            <div className="grid lg:grid-cols-3 gap-6 mb-6">
                {/* Configuration Card */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm relative z-20">
                    <h3 className="font-bold text-gray-900 mb-5">Configure Profile</h3>
                    <div className="space-y-6">
                        
                        <div className="relative z-50">
                            <label className="text-sm font-bold text-gray-700 mb-2 block">Target Role</label>
                            <Select value={selectedRole} onValueChange={setSelectedRole}>
                                <SelectTrigger className="w-full h-11 rounded-xl bg-white border-gray-200">
                                    <SelectValue placeholder="Select Role" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-gray-200 shadow-xl">
                                    {roles.map(r => (
                                        <SelectItem key={r.name} value={r.name} className="cursor-pointer">
                                            {r.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="relative z-40">
                            <label className="text-sm font-bold text-gray-700 mb-2 block">Location</label>
                            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                                <SelectTrigger className="w-full h-11 rounded-xl bg-white border-gray-200">
                                    <SelectValue placeholder="Select Location" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-gray-200 shadow-xl">
                                    {locations.map(l => (
                                        <SelectItem key={l.name} value={l.name} className="cursor-pointer">
                                            {l.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="pt-2">
                            <div className="flex justify-between items-center mb-5">
                                <label className="text-sm font-bold text-gray-700">Experience</label>
                                <span className="text-xs font-black text-[#6C63FF] bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
                                    {experience[0]} Years
                                </span>
                            </div>
                            
                            {/* NATIVE HTML5 SLIDER - GUARANTEED TO RENDER */}
                            <div className="px-1 py-3 w-full">
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="15" 
                                    step="1" 
                                    value={experience[0]} 
                                    onChange={(e) => setExperience([parseInt(e.target.value)])}
                                    className="custom-range w-full h-2 rounded-lg appearance-none cursor-pointer"
                                    style={{
                                        background: `linear-gradient(to right, #6C63FF ${sliderPercentage}%, #E2E8F0 ${sliderPercentage}%)`
                                    }}
                                />
                                <div className="flex justify-between text-xs text-gray-400 mt-2 font-medium">
                                    <span>0</span>
                                    <span>15+</span>
                                </div>
                            </div>

                        </div>
                    </div>
                </motion.div>

                {/* Prediction Results Card */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col items-center justify-center relative shadow-sm z-10">
                    {isFetching && <div className="absolute top-4 right-4"><Loader2 className="w-5 h-5 text-[#6C63FF] animate-spin" /></div>}
                    <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center mb-4">
                        <DollarSign className="w-7 h-7 text-[#6C63FF]" />
                    </div>
                    <p className="text-sm text-gray-500 mb-1 font-semibold">ML Prediction</p>
                    <p className="text-4xl font-black text-gray-900 mb-2 tracking-tighter">
                        {apiSalaryData ? apiSalaryData.average : "---"}
                    </p>
                    <div className="w-full mt-6 bg-indigo-50/40 rounded-2xl p-5 text-center border border-indigo-100/50">
                        <p className="text-[10px] uppercase tracking-widest font-bold text-indigo-400 mb-2">Expected Range</p>
                        <p className="text-xl font-black text-[#6C63FF]">{apiSalaryData ? apiSalaryData.estimated_range : "---"}</p>
                        <div className="flex items-center justify-center gap-1.5 mt-3">
                            <div className={`w-1.5 h-1.5 rounded-full ${apiSalaryData ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                            <p className="text-[10px] font-bold text-gray-400">
                                {apiSalaryData ? apiSalaryData.confidence : "Initializing model..."}
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Market Trends Card */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-[#6C63FF]" /> Market Trends
                    </h3>
                    <div className="space-y-4">
                        {[
                            { label: "YoY Growth", value: "+12.4%", color: "text-green-500" },
                            { label: "Hiring Demand", value: "High", color: "text-blue-500" },
                            { label: "Remote Options", value: "64%", color: "text-purple-500" }
                        ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                <span className="text-sm text-gray-500 font-medium">{item.label}</span>
                                <span className={`text-sm font-black ${item.color}`}>{item.value}</span>
                            </div>
                        ))}
                        <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                             <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Top Skill Premium</p>
                             <p className="text-xs font-bold text-gray-700">AWS + React + Node.js</p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Charts Row */}
            <div className="grid lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-6">Benchmarking Roles</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                            <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                            <YAxis tickFormatter={(v) => `₹${v}L`} tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                            <Tooltip cursor={{fill: '#F8FAFC'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                            <Bar dataKey="salary" radius={[5, 5, 0, 0]} barSize={45}>
                                {chartData.map((entry, i) => (
                                    <Cell key={i} fill={entry.isSelected ? "#6C63FF" : "#E2E8F0"} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-6">Location Comparison</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={comparisonData} layout="vertical">
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fontWeight: 700 }} width={80} axisLine={false} tickLine={false} />
                            <Tooltip cursor={{fill: '#F8FAFC'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                            <Bar dataKey="salary" radius={[0, 5, 5, 0]} barSize={25}>
                                {comparisonData.map((entry, i) => (
                                    <Cell key={i} fill={entry.isSelected ? "#6C63FF" : "#E2E8F0"} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </DashboardShell>
    );
}