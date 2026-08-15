import React, { useState, useEffect } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { motion } from "framer-motion";
import {
  TrendingUp, Award, Target, BookOpen, Brain, Sparkles,
  CheckCircle, XCircle, ExternalLink, Clock,
  BarChart3, PieChart as PieChartIcon, Zap, Rocket,
  Code, Cloud, Database, Shield, Smartphone, Layout,
  TrendingDown, TrendingUp as TrendUp, AlertCircle, Percent
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import { useAuth } from "@/context/AuthContext";
import { getCareerInsights } from "@/utils/api";
import { toast } from "react-hot-toast";

export default function CareerInsights() {
  const { user } = useAuth();
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getCareerInsights();
      console.log('Career Insights Response:', response);
      
      if (response.success) {
        setInsights(response);
      } else {
        setError(response.error || 'Failed to load insights');
        toast.error(response.error || 'Failed to load insights');
      }
    } catch (error) {
      console.error('Error fetching insights:', error);
      const errorMsg = error?.error || error?.message || 'Failed to load career insights';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Simple trend display - just show up/down/stable with icons
  const getTrendIcon = (trendScore, trendDirection) => {
    if (trendDirection === "up" || trendScore > 5) {
      return <TrendUp className="w-4 h-4 text-green-500" />;
    } else if (trendDirection === "down" || trendScore < -5) {
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    }
    return <TrendingUp className="w-4 h-4 text-gray-400" />;
  };

  const getTrendText = (trendScore, trendDirection) => {
    if (trendDirection === "up" || trendScore > 5) {
      return "Growing";
    } else if (trendDirection === "down" || trendScore < -5) {
      return "Declining";
    }
    return "Stable";
  };

  const getTrendColor = (trendScore, trendDirection) => {
    if (trendDirection === "up" || trendScore > 5) return "text-green-600";
    if (trendDirection === "down" || trendScore < -5) return "text-red-600";
    return "text-gray-500";
  };

  // Prepare chart data for bar chart
  const chartData = insights?.trending_skills?.slice(0, 10).map(skill => ({
    name: skill.skill.length > 12 ? skill.skill.substring(0, 10) + "..." : skill.skill,
    fullName: skill.skill,
    demand: skill.demand,
  })) || [];

  // Prepare data for pie chart (top 5 categories)
  const categoryData = insights?.categories ? 
    Object.entries(insights.categories)
      .slice(0, 5)
      .map(([name, skills]) => ({
        name: name.length > 15 ? name.substring(0, 12) + "..." : name,
        fullName: name,
        value: skills.length,
        skills: skills
      })) : [];

  const COLORS = ['#6C63FF', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-full bg-[#6C63FF] pulse-dot" />
          <div className="w-3 h-3 rounded-full bg-[#6C63FF] pulse-dot" style={{ animationDelay: "0.2s" }} />
          <div className="w-3 h-3 rounded-full bg-[#6C63FF] pulse-dot" style={{ animationDelay: "0.4s" }} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <DashboardShell user={user} title="Career Insights" currentPage="CareerInsights">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Insights</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchInsights} className="bg-[#6C63FF] text-white rounded-xl">
              Try Again
            </Button>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell user={user} title="Career Insights" currentPage="CareerInsights">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-[#6C63FF] to-purple-600 rounded-2xl p-8 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Career Market Insights</h1>
              <p className="text-purple-100 mb-4">
                Discover what skills are trending in today's job market
              </p>
              <div className="flex flex-wrap gap-3">
                <Badge className="bg-white/20 text-white border-0">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Live Market Data
                </Badge>
                <Badge className="bg-white/20 text-white border-0">
                  <BarChart3 className="w-3 h-3 mr-1" />
                  Skill Analytics
                </Badge>
              </div>
            </div>
            <Rocket className="w-20 h-20 text-white/20 hidden md:block" />
          </div>
        </motion.div>

        {/* Stats Cards - Simplified */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs text-gray-500 mb-1">Jobs Analyzed</p>
            <p className="text-2xl font-bold text-gray-900">{insights?.total_jobs_analyzed || 0}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs text-gray-500 mb-1">Total Skills Tracked</p>
            <p className="text-2xl font-bold text-gray-900">{insights?.trending_skills?.length || 0}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs text-gray-500 mb-1">Top Skill</p>
            <p className="text-sm font-semibold text-[#6C63FF] truncate">{insights?.trending_skills?.[0]?.skill || "N/A"}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs text-gray-500 mb-1">Market Activity</p>
            <p className="text-xl font-bold text-blue-600">{insights?.market_summary?.market_demand || "Active"}</p>
          </div>
        </motion.div>

        {/* Market Trends Section - Main Focus */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-gray-100 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-[#6C63FF]" />
              <h2 className="text-xl font-bold text-gray-900">Market Trends</h2>
            </div>
            <Badge className="bg-blue-50 text-blue-700">
              Top 10 Most Demanded Skills
            </Badge>
          </div>

          {/* Bar Chart */}
          <div className="h-96 mb-8">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={100} 
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  formatter={(value) => [`${value} job postings`, "Demand"]}
                  labelFormatter={(label) => {
                    const skill = chartData.find(s => s.name === label);
                    return skill ? skill.fullName : label;
                  }}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB' }}
                />
                <Bar 
                  dataKey="demand" 
                  fill="#6C63FF" 
                  radius={[0, 8, 8, 0]}
                  barSize={30}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Trending Skills List */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Trending Skills</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {insights?.trending_skills?.slice(0, 10).map((skill, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-purple-50 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-bold text-gray-400 w-8">#{idx + 1}</span>
                    <div>
                      <p className="font-semibold text-gray-900 group-hover:text-[#6C63FF] transition-colors">
                        {skill.skill}
                      </p>
                      <div className="flex items-center gap-3 text-sm mt-1">
                        <span className="text-gray-500 flex items-center gap-1">
                          <Briefcase className="w-3 h-3" />
                          {skill.demand} jobs
                        </span>
                        {/* <span className={`flex items-center gap-1 ${getTrendColor(skill.trend_score, skill.trend_direction)}`}>
                          {getTrendIcon(skill.trend_score, skill.trend_direction)}
                          {getTrendText(skill.trend_score, skill.trend_direction)}
                        </span> */}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`px-3 py-1 ${
                      skill.has_skill 
                        ? "bg-green-100 text-green-700" 
                        : "bg-orange-100 text-orange-700"
                    }`}>
                      {skill.has_skill ? "✓ In Your Skills" : "📚 Opportunity"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Skill Categories Section */}
        {categoryData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl border border-gray-100 p-6"
          >
            <div className="flex items-center gap-2 mb-6">
              <PieChartIcon className="w-6 h-6 text-[#6C63FF]" />
              <h2 className="text-xl font-bold text-gray-900">Skill Categories</h2>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pie Chart */}
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => percent > 0.05 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name, props) => [`${value} skills`, props.payload.fullName]}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Category Details */}
              <div className="overflow-y-auto max-h-[320px] space-y-4">
                {Object.entries(insights?.categories || {}).slice(0, 5).map(([category, skills]) => {
                  const Icon = getCategoryIcon(category);
                  return (
                    <div key={category} className="border-b border-gray-100 pb-3 last:border-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="w-4 h-4 text-[#6C63FF]" />
                        <h4 className="font-semibold text-gray-900">{category}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {skills.length} skills
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {skills.slice(0, 5).map((skill, idx) => (
                          <Badge key={idx} className="bg-gray-100 text-gray-700 hover:bg-purple-100 transition-colors">
                            {skill}
                          </Badge>
                        ))}
                        {skills.length > 5 && (
                          <Badge className="bg-gray-100 text-gray-500">
                            +{skills.length - 5} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </DashboardShell>
  );
}

// Helper function to get category icons
function getCategoryIcon(category) {
  const icons = {
    "Frontend Development": Layout,
    "Backend Development": Code,
    "Cloud & DevOps": Cloud,
    "Data Science & AI": Database,
    "Mobile Development": Smartphone,
    "Cybersecurity": Shield,
    "Database Technologies": Database,
    "Testing & QA": Code,
    "Version Control": Code,
    "Project Management": Layout
  };
  return icons[category] || Code;
}

// Import Briefcase for job count display
import { Briefcase } from "lucide-react";