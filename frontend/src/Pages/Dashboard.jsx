import React, { useState, useEffect } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import StatCard from "@/components/dashboard/StatCard";
import { Briefcase, FileText, Target, TrendingUp, Star, ArrowRight, Brain, Sparkles, Award } from "lucide-react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getUserDashboardStats } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-hot-toast";

export default function Dashboard() {
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    ats_score: 0,
    profile_complete: 75,
    total_applications: 0,
    saved_jobs_count: 0,
    recommended_jobs: [],
    domain_scores: {}
  });

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const result = await getUserDashboardStats();
        if (result.success) {
          setStats(result.stats);
        }
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        toast.error("Failed to load dashboard data. Check backend connection.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Handle role-based redirection safely
  useEffect(() => {
    if (!loading && authUser?.role === "company") {
        navigate(createPageUrl("CompanyDashboard"));
    }
  }, [authUser, loading, navigate]);

  if (loading && !stats.recommended_jobs.length) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex gap-2 flex-col items-center">
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-full bg-[#6C63FF] pulse-dot" />
            <div className="w-3 h-3 rounded-full bg-[#6C63FF] pulse-dot" style={{ animationDelay: "0.2s" }} />
            <div className="w-3 h-3 rounded-full bg-[#6C63FF] pulse-dot" style={{ animationDelay: "0.4s" }} />
          </div>
          <p className="text-sm text-gray-400 font-medium">Preparing your workspace...</p>
        </div>
      </div>
    );
  }

  // Formula: (ats_score + profile_complete) / 2
  const atsScore = Math.round(stats.ats_score || 0);
  const profileComplete = Math.round(stats.profile_complete || 0);
  const jobReadiness = Math.round((atsScore + profileComplete) / 2);

  // Convert domain_scores object to sorted array for display
  const topSkillAreas = Object.entries(stats.domain_scores || {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <DashboardShell user={authUser} title="Overview" currentPage="Dashboard">
      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={Award}
          title="Job Readiness"
          value={`${jobReadiness}%`}
          change={jobReadiness > 70 ? 15 : 0}
          color="bg-purple-50"
          delay={0}
        />
        <StatCard
          icon={Briefcase}
          title="Applications"
          value={stats.total_applications}
          change={stats.total_applications > 0 ? 8 : 0}
          color="bg-blue-50"
          delay={0.1}
        />
        <StatCard
          icon={Star}
          title="Saved Jobs"
          value={stats.saved_jobs_count}
          color="bg-amber-50"
          delay={0.2}
        />
        <StatCard
          icon={FileText}
          title="ATS Score"
          value={`${atsScore}/100`}
          change={atsScore > 60 ? 5 : 0}
          color="bg-green-50"
          delay={0.3}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recommended Jobs (Left 2/3) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#6C63FF]" />
                <h3 className="font-bold text-gray-900 text-lg">Top Matches for You</h3>
            </div>
            <Link
              to={createPageUrl("JobRecommendations")}
              className="text-sm text-[#6C63FF] font-semibold hover:underline flex items-center gap-1 group"
            >
              Explore All <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          
          <div className="space-y-4">
            {stats.recommended_jobs.length > 0 ? (
              stats.recommended_jobs.map((job, i) => (
                <motion.div
                  key={job.job_id || i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex items-center justify-between p-5 rounded-2xl bg-gray-50/50 border border-transparent hover:border-[#6C63FF]/20 hover:bg-white hover:shadow-sm transition-all cursor-pointer group"
                  onClick={() => navigate(`/job/${job.job_id}`)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6C63FF] to-[#3b82f6] flex items-center justify-center text-white text-sm font-bold shadow-sm">
                      {job.company?.[0] || "C"}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-base group-hover:text-[#6C63FF] transition-colors">
                        {job.title}
                      </p>
                      <p className="text-sm text-gray-500 font-medium tracking-tight">
                        {job.company} · {job.salary_min || job.salary || "Competitive"}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge className={`rounded-lg px-3 py-1 text-sm font-bold border ${
                        (job.match_score || job.confidence_score * 100) >= 90
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-[#6C63FF]/5 text-[#6C63FF] border-[#6C63FF]/20"
                    }`}>
                        {Math.round(job.match_score || job.confidence_score * 100)}% Match
                    </Badge>
                  </div>
                </motion.div>
              ))
            ) : (
                <div className="text-center py-12 bg-gray-50/30 rounded-2xl border border-dashed border-gray-200">
                    <div className="mb-3 flex justify-center">
                        <Star className="w-8 h-8 text-gray-200" />
                    </div>
                    <p className="text-gray-500 text-sm font-medium">No recommendations available yet.</p>
                    <p className="text-xs text-gray-400 mt-1">Upload your resume to see AI-powered matches!</p>
                </div>
            )}
          </div>
        </motion.div>

        {/* Dynamic Skill Analysis (Right 1/3) */}
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm"
            >
                <div className="flex items-center gap-2 mb-6">
                    <Brain className="w-5 h-5 text-[#6C63FF]" />
                    <h3 className="font-bold text-gray-900">Top Skill Areas</h3>
                </div>
                <div className="space-y-5">
                    {topSkillAreas.length > 0 ? (
                        topSkillAreas.map(([domain, score], i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold text-gray-700">{domain}</span>
                                    <span className="text-xs font-bold text-[#6C63FF]">{Math.round(score)}%</span>
                                </div>
                                <Progress value={score} className="h-2 rounded-full" />
                            </div>
                        ))
                    ) : (
                        ["Innovation", "Adaptability", "Collaboration"].map((skill, i) => (
                            <div key={i} className="space-y-2 opacity-50">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold text-gray-700">{skill}</span>
                                    <span className="text-xs font-bold text-gray-400">Loading...</span>
                                </div>
                                <Progress value={0} className="h-2 rounded-full" />
                            </div>
                        ))
                    )}
                    {!topSkillAreas.length && (
                         <div className="pt-2">
                            <p className="text-[10px] text-center text-gray-400 uppercase tracking-widest font-bold">Analysis Pending</p>
                         </div>
                    )}
                </div>
            </motion.div>

            {/* Quick Insights/Activity */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-gradient-to-br from-[#6C63FF] to-[#3b82f6] rounded-2xl p-6 text-white shadow-lg shadow-[#6C63FF]/30 relative overflow-hidden"
            >
                <div className="relative z-10">
                    <h4 className="font-bold mb-2 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" /> Career Tip
                    </h4>
                    <p className="text-sm text-purple-50 opacity-90 leading-relaxed font-medium">
                        Increasing your "Job Readiness" above 85% by completing your profile and improving your ATS score can triple your interview callbacks.
                    </p>
                </div>
                <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
            </motion.div>
        </div>
      </div>
    </DashboardShell>
  );
}