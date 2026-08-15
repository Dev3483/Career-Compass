import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Building2, MapPin, DollarSign, Clock, Star, ExternalLink, 
  TrendingUp, CheckCircle, XCircle, Briefcase, Loader2 
} from 'lucide-react';

const JobList = ({ jobs, onAnalyzeSkillGap }) => {
  const [visibleJobs, setVisibleJobs] = useState([]);
  const [displayCount, setDisplayCount] = useState(10); 
  const [loadingMore, setLoadingMore] = useState(false);
  const observerRef = useRef(null);
  const loadMoreRef = useRef(null);
  
  // Initialize visible jobs
  useEffect(() => {
    if (jobs && jobs.length > 0) {
      setVisibleJobs(jobs.slice(0, displayCount));
    } else {
      setVisibleJobs([]);
    }
  }, [jobs, displayCount]);

   //  Load more jobs function
  const loadMoreJobs = useCallback(() => {
    if (loadingMore || !jobs || displayCount >= jobs.length) return;
    
    setLoadingMore(true);
    
    // Simulate loading delay
    setTimeout(() => {
      const newCount = Math.min(displayCount + 10, jobs.length);
      setDisplayCount(newCount);
      setVisibleJobs(jobs.slice(0, newCount));
      setLoadingMore(false);
    }, 800);
  }, [displayCount, jobs, loadingMore]);

  // Infinite scroll setup
  useEffect(() => {
    if (!jobs || jobs.length <= displayCount) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore) {
          loadMoreJobs();
        }
      },
      { threshold: 0.5 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [jobs, displayCount, loadingMore]);

 

  // Load all jobs at once
  const loadAllJobs = () => {
    if (jobs && jobs.length > 0) {
      setDisplayCount(jobs.length);
      setVisibleJobs([...jobs]);
    }
  };

  //  Helper function to get match score
  const getMatchScore = (job) => {
    return job.match_score || job.score || job.combined_score || job.similarity_score || 0;
  };

  // Helper function to get job URL safely
  const getJobUrl = (job) => {
    if (job.url && job.url.startsWith('http')) {
      return job.url;
    }
    
    // Fallback URLs based on source
    if (job.source === 'RemoteOK') {
      return `https://remoteok.com/remote-jobs/${job.job_id}`;
    } else if (job.source === 'GitHub Jobs') {
      return `https://jobs.github.com/positions/${job.job_id}`;
    }
    
    // Generic fallback
    return `https://www.google.com/search?q=${encodeURIComponent(job.title + ' ' + job.company)}`;
  };

  // Empty state
  if (!jobs || jobs.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Briefcase className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900">No Jobs Found</h3>
        <p className="text-gray-600 mt-2">Upload a resume or check back later for matches</p>
      </div>
    );
  }

  //  Stats for header
  const showingText = visibleJobs.length === jobs.length 
    ? `Showing all ${jobs.length} jobs` 
    : `Showing ${visibleJobs.length} of ${jobs.length} jobs`;

  return (
    <div className="space-y-6">
      {/* Header with stats and controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Recommended Jobs</h2>
          <p className="text-gray-600">Based on your resume and skills</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <TrendingUp className="w-4 h-4" />
            <span>{showingText}</span>
          </div>
          
          {visibleJobs.length < jobs.length && (
            <button
              onClick={loadAllJobs}
              className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
            >
              Show All Jobs
            </button>
          )}
        </div>
      </div>

      {/* Job Cards */}
      <div className="grid gap-6">
        {visibleJobs.map((job, index) => {
          const matchScore = getMatchScore(job);
          const matchColor = matchScore >= 80 ? 'bg-green-100 text-green-800 border-green-200' : 
                           matchScore >= 60 ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : 
                           'bg-red-100 text-red-800 border-red-200';
          
          // ✅ Generate stable key
          const jobKey = job.job_id || `${job.title}-${job.company}-${index}`;
          
          return (
            <div
              key={jobKey}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:border-blue-300 hover:shadow-md transition-all duration-200"
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-4">
                    {/* Company Icon */}
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-6 h-6 text-blue-600" />
                    </div>
                    
                    <div className="flex-1">
                      {/* Job Title & Match Score */}
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{job.title}</h3>
                          <p className="text-lg text-gray-700">{job.company}</p>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                          {/* Match Score Badge */}
                          <div className={`inline-flex items-center gap-1 px-3 py-1.5 ${matchColor} rounded-full text-sm font-medium border`}>
                            <Star className="w-3 h-3" fill="currentColor" />
                            {matchScore}% Match
                          </div>
                          
                          {/* Apply Button */}
                          <a
                            href={getJobUrl(job)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                          >
                            Apply Now
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                      
                      {/* Job Details */}
                      <div className="flex flex-wrap items-center gap-4 mb-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span className="text-sm">{job.location || 'Remote'}</span>
                        </div>
                        
                        {job.salary && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <DollarSign className="w-4 h-4 flex-shrink-0" />
                            <span className="text-sm">{job.salary}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="w-4 h-4 flex-shrink-0" />
                          <span className="text-sm">{job.date_posted || job.posted_date || 'Recently'}</span>
                        </div>
                        
                        {job.source && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                            {job.source}
                          </span>
                        )}
                        
                        {job.job_type && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium capitalize">
                            {job.job_type}
                          </span>
                        )}
                      </div>
                      
                      {/* Skills */}
                      {job.skills && job.skills.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Required Skills</h4>
                          <div className="flex flex-wrap gap-2">
                            {job.skills.slice(0, 8).map((skill, idx) => (
                              <span
                                key={`${skill}-${idx}`}
                                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                              >
                                {skill}
                              </span>
                            ))}
                            {job.skills.length > 8 && (
                              <span className="px-3 py-1 bg-gray-200 text-gray-600 rounded-full text-sm font-medium">
                                +{job.skills.length - 8} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Description Preview */}
                      {job.description && (
                        <div className="mb-4">
                          <p className="text-gray-600 text-sm line-clamp-2">
                            {job.description.length > 200 
                              ? `${job.description.substring(0, 200)}...` 
                              : job.description}
                          </p>
                        </div>
                      )}
                      
                      {/* Skill Gap Analysis Button */}
                      <div className="pt-4 border-t">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-1">Skill Analysis</h4>
                            <div className="flex items-center gap-4 text-sm">
                              {job.skill_match_percentage !== undefined && (
                                <div className="flex items-center gap-1 text-green-600">
                                  <CheckCircle className="w-4 h-4" />
                                  <span>Skill match: {job.skill_match_percentage}%</span>
                                </div>
                              )}
                              {job.missing_skills && job.missing_skills.length > 0 && (
                                <div className="flex items-center gap-1 text-red-600">
                                  <XCircle className="w-4 h-4" />
                                  <span>Missing: {job.missing_skills.length} skills</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <button
                            onClick={() => onAnalyzeSkillGap(job)}
                            className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                          >
                            Analyze Skill Gap →
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Load More Section */}
      {visibleJobs.length < jobs.length && (
        <div className="text-center py-8" ref={loadMoreRef}>
          {loadingMore ? (
            <div className="flex items-center justify-center gap-2 text-blue-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading more jobs...</span>
            </div>
          ) : (
            <button
              onClick={loadMoreJobs}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Load More Jobs ({jobs.length - visibleJobs.length} remaining)
            </button>
          )}
          
          <p className="text-gray-500 text-sm mt-4">
            Scroll down or click to load more jobs automatically
          </p>
        </div>
      )}

      {/* Show when all jobs are loaded */}
      {visibleJobs.length === jobs.length && jobs.length > 10 && (
        <div className="text-center py-6 border-t">
          <p className="text-gray-600 font-medium">
            ✅ All {jobs.length} jobs loaded
          </p>
          <p className="text-gray-500 text-sm mt-1">
            You've reached the end of the job list
          </p>
        </div>
      )}
    </div>
  );
};

export default JobList;