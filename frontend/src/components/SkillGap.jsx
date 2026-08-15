import React, { useState } from 'react';
import { 
  Target, CheckCircle, XCircle, TrendingUp, BookOpen, 
  ExternalLink, Award, Lightbulb, ArrowLeft, Download,
  X, Brain, BarChart3, PieChart as PieChartIcon
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts';

const SkillGap = ({ analysis, onBack }) => {
  const [showAllMissing, setShowAllMissing] = useState(false);
  const [showAllMatching, setShowAllMatching] = useState(false);

  // Empty state
  if (!analysis) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
        <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Brain className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Analysis Available</h3>
        <p className="text-gray-500 mb-6">
          Select a job and click "Analyze Skill Gap" to see detailed insights
        </p>
        <button
          onClick={onBack}
          className="px-6 py-2.5 bg-[#6C63FF] text-white rounded-xl hover:bg-[#5A52D5] transition-colors inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Close
        </button>
      </div>
    );
  }

  const { 
    user_skills = [], 
    required_skills = [], 
    missing_skills = [], 
    matching_skills = [],
    match_percentage = 0,
    recommendations = [],
    job_title = "Job Position",
    company = "Company"
  } = analysis;

  const totalSkills = required_skills.length || 1;
  const matchedCount = matching_skills.length;
  const missingCount = missing_skills.length;
  const matchPercent = Math.round((matchedCount / totalSkills) * 100);

  // Chart data
  const pieData = [
    { name: 'Matching', value: matchedCount, color: '#10B981' },
    { name: 'Missing', value: missingCount, color: '#EF4444' },
  ];

  const barData = [
    { name: 'Your Skills', value: user_skills.length, fill: '#3B82F6' },
    { name: 'Required', value: totalSkills, fill: '#8B5CF6' },
    { name: 'Matched', value: matchedCount, fill: '#10B981' },
    { name: 'Missing', value: missingCount, fill: '#EF4444' },
  ];

  const getMatchLevel = () => {
    if (matchPercent >= 80) return { text: 'Excellent Match', color: 'text-green-600', bg: 'bg-green-100', icon: '🎉' };
    if (matchPercent >= 60) return { text: 'Good Match', color: 'text-blue-600', bg: 'bg-blue-100', icon: '👍' };
    if (matchPercent >= 40) return { text: 'Fair Match', color: 'text-yellow-600', bg: 'bg-yellow-100', icon: '📈' };
    return { text: 'Needs Improvement', color: 'text-red-600', bg: 'bg-red-100', icon: '⚠️' };
  };

  const matchLevel = getMatchLevel();

  const exportReport = () => {
    const report = {
      job_title,
      company,
      analysis_date: new Date().toISOString(),
      match_percentage: matchPercent,
      user_skills,
      required_skills,
      matching_skills,
      missing_skills,
      recommendations
    };
    const dataStr = JSON.stringify(report, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `skill_gap_${job_title.replace(/\s/g, '_')}_${Date.now()}.json`);
    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);
  };

  const missingToShow = showAllMissing ? missing_skills : missing_skills.slice(0, 10);
  const matchingToShow = showAllMatching ? matching_skills : matching_skills.slice(0, 10);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-xl max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-100 p-6 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#6C63FF] to-purple-600 rounded-xl flex items-center justify-center shadow-md">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Skill Gap Analysis</h3>
              <p className="text-sm text-gray-500">{job_title} at {company}</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={exportReport}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Match Score */}
        <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Overall Match Score</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-5xl font-bold text-gray-900">{matchPercent}%</span>
                <span className={`px-3 py-1 ${matchLevel.bg} ${matchLevel.color} rounded-full text-sm font-medium flex items-center gap-1`}>
                  <span>{matchLevel.icon}</span> {matchLevel.text}
                </span>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-gray-600 mb-1">Skills Breakdown</div>
              <div className="flex gap-4 text-sm">
                <div>
                  <span className="text-green-600 font-bold text-lg">{matchedCount}</span>
                  <span className="text-gray-500"> matched</span>
                </div>
                <div>
                  <span className="text-red-600 font-bold text-lg">{missingCount}</span>
                  <span className="text-gray-500"> missing</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`absolute inset-y-0 left-0 transition-all duration-1000 ${
                matchPercent >= 70 ? 'bg-green-500' :
                matchPercent >= 40 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(matchPercent, 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-50 rounded-xl p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-[#6C63FF]" />
              Skill Distribution
            </h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#6C63FF]" />
              Skills Comparison
            </h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Matching Skills */}
        <div className="bg-gray-50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <h4 className="text-lg font-semibold text-gray-900">
                Matching Skills ({matchedCount})
              </h4>
            </div>
          </div>
          
          {matchedCount > 0 ? (
            <>
              <div className="flex flex-wrap gap-2">
                {matchingToShow.map((skill, index) => (
                  <span
                    key={`match-${index}`}
                    className="px-3 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium flex items-center gap-1"
                  >
                    <CheckCircle className="w-3 h-3" />
                    {skill}
                  </span>
                ))}
              </div>
              
              {matching_skills.length > 10 && (
                <button
                  onClick={() => setShowAllMatching(!showAllMatching)}
                  className="mt-3 text-sm text-[#6C63FF] hover:text-[#5A52D5] font-medium"
                >
                  {showAllMatching ? 'Show less' : `Show ${matching_skills.length - 10} more`}
                </button>
              )}
            </>
          ) : (
            <div className="text-center py-6">
              <XCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No matching skills found</p>
            </div>
          )}
        </div>

        {/* Missing Skills */}
        <div className="bg-gray-50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <h4 className="text-lg font-semibold text-gray-900">
                Skills to Develop ({missingCount})
              </h4>
            </div>
          </div>
          
          {missingCount > 0 ? (
            <>
              <div className="flex flex-wrap gap-2">
                {missingToShow.map((skill, index) => (
                  <span
                    key={`missing-${index}`}
                    className="px-3 py-2 bg-red-100 text-red-800 rounded-lg text-sm font-medium flex items-center gap-1"
                  >
                    <XCircle className="w-3 h-3" />
                    {skill}
                  </span>
                ))}
              </div>
              
              {missing_skills.length > 10 && (
                <button
                  onClick={() => setShowAllMissing(!showAllMissing)}
                  className="mt-3 text-sm text-[#6C63FF] hover:text-[#5A52D5] font-medium"
                >
                  {showAllMissing ? 'Show less' : `Show ${missing_skills.length - 10} more`}
                </button>
              )}
            </>
          ) : (
            <div className="text-center py-6">
              <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-2" />
              <p className="text-green-600 font-medium">🎉 Congratulations! All required skills matched!</p>
            </div>
          )}
        </div>

        {/* Learning Recommendations */}
        {(recommendations.length > 0 || missingCount > 0) && (
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-5 h-5 text-blue-600" />
              <h4 className="text-lg font-semibold text-gray-900">Learning Recommendations</h4>
            </div>
            
            <div className="space-y-3">
              {(recommendations.length > 0 ? recommendations : missing_skills.slice(0, 5).map(skill => ({ skill, resources: [] }))).map((rec, index) => (
                <div key={index} className="bg-white rounded-lg p-4 border border-blue-100">
                  <div className="flex items-start gap-3">
                    <BookOpen className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 mb-2">{typeof rec === 'string' ? rec : rec.skill}</p>
                      {(rec.resources && rec.resources.length > 0) ? (
                        <div className="flex flex-wrap gap-2">
                          {rec.resources.map((resource, idx) => (
                            <a
                              key={idx}
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors"
                            >
                              {resource.name}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ))}
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <a
                            href={`https://www.udemy.com/courses/search/?q=${encodeURIComponent(rec.skill)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors"
                          >
                            Udemy <ExternalLink className="w-3 h-3" />
                          </a>
                          <a
                            href={`https://www.coursera.org/search?query=${encodeURIComponent(rec.skill)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors"
                          >
                            Coursera <ExternalLink className="w-3 h-3" />
                          </a>
                          <a
                            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(rec.skill)}+tutorial`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors"
                          >
                            YouTube <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SkillGap;