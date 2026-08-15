import React, { useState, useEffect } from 'react';
import { Filter, X, Check, ChevronDown } from 'lucide-react';
import { getFilterOptions } from '../utils/api';

const JobFilters = ({ onFilterChange, initialFilters = {}, availableJobs = [] }) => {
  const [filters, setFilters] = useState({
    job_type: initialFilters.job_type || 'any',
    min_match_percentage: initialFilters.min_match_percentage || 0,
    location_filter: initialFilters.location_filter || '',
    salary_min: initialFilters.salary_min || null,
    date_posted_filter: initialFilters.date_posted_filter || 'any',
    skills_filter: initialFilters.skills_filter || []
  });
  
  const [showFilters, setShowFilters] = useState(false);
  const [customSkills, setCustomSkills] = useState('');
  const [filterOptions, setFilterOptions] = useState(null);
  const [loading, setLoading] = useState(true);

  //  Load filter options from backend on mount
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        setLoading(true);
        const response = await getFilterOptions();
        
        if (response.success && response.options) {
          setFilterOptions(response.options);
          console.log('✅ Filter options loaded:', response.options);
        }
      } catch (error) {
        console.error('❌ Failed to load filter options:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFilterOptions();
  }, []);

  // Normalize job types from backend response
  const jobTypes = React.useMemo(() => {
    if (!filterOptions?.job_types) {
      return [
        { value: 'any', label: 'Any Type' },
        { value: 'remote', label: 'Remote' },
        { value: 'onsite', label: 'On-site' },
        { value: 'hybrid', label: 'Hybrid' },
        { value: 'internship', label: 'Internship' }
      ];
    }

    return filterOptions.job_types.map(type => {
      if (typeof type === 'string') {
        return {
          value: type.toLowerCase(),
          label: type.charAt(0).toUpperCase() + type.slice(1).replace('_', '-')
        };
      }
      return type;
    });
  }, [filterOptions]);

  //  Match percentages
  const matchPercentages = React.useMemo(() => {
    if (!filterOptions?.min_match_percentages) {
      return [
        { value: 0, label: 'Any Match' },
        { value: 50, label: '50%+' },
        { value: 60, label: '60%+' },
        { value: 70, label: '70%+' },
        { value: 80, label: '80%+' },
        { value: 90, label: '90%+' }
      ];
    }

    return filterOptions.min_match_percentages.map(perc => ({
      value: perc,
      label: perc === 0 ? 'Any Match' : `${perc}%+`
    }));
  }, [filterOptions]);

  //  Date ranges
  const dateRanges = React.useMemo(() => {
    if (!filterOptions?.date_ranges) {
      return [
        { value: 'any', label: 'Any Time' },
        { value: 'day', label: 'Last 24 Hours' },
        { value: 'week', label: 'Last Week' },
        { value: 'month', label: 'Last Month' }
      ];
    }

    return filterOptions.date_ranges.map(range => ({
      value: range,
      label: range === 'any' ? 'Any Time' :
             range === 'day' ? 'Last 24 Hours' :
             range === 'week' ? 'Last Week' : 'Last Month'
    }));
  }, [filterOptions]);

  //  Salary ranges
  const salaryRanges = React.useMemo(() => {
    return filterOptions?.salary_ranges || [
      { value: null, label: 'Any Salary' },
      { value: 50000, label: '$50,000+' },
      { value: 75000, label: '$75,000+' },
      { value: 100000, label: '$100,000+' },
      { value: 150000, label: '$150,000+' }
    ];
  }, [filterOptions]);

  //  Handle filter changes
  const handleFilterChange = (key, value) => {
    console.log(`🔧 Filter changed: ${key} =`, value);
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  //  Add skills
  const handleAddSkill = () => {
    if (customSkills.trim()) {
      const skills = customSkills.split(',').map(s => s.trim()).filter(s => s);
      const newSkills = [...new Set([...filters.skills_filter, ...skills])];
      
      console.log('➕ Added skills:', skills);
      const newFilters = { ...filters, skills_filter: newSkills };
      setFilters(newFilters);
      setCustomSkills('');
      onFilterChange(newFilters);
    }
  };

  //  Remove skill
  const handleRemoveSkill = (skill) => {
    console.log('➖ Removed skill:', skill);
    const newSkills = filters.skills_filter.filter(s => s !== skill);
    const newFilters = { ...filters, skills_filter: newSkills };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  //  Clear all filters
  const clearFilters = () => {
    console.log('🧹 Clearing all filters');
    const defaultFilters = {
      job_type: 'any',
      min_match_percentage: 0,
      location_filter: '',
      salary_min: null,
      date_posted_filter: 'any',
      skills_filter: []
    };
    setFilters(defaultFilters);
    setCustomSkills('');
    onFilterChange(defaultFilters);
  };

  // Check if filters are active
  const hasActiveFilters = React.useMemo(() => {
    return filters.job_type !== 'any' ||
           filters.min_match_percentage > 0 ||
           filters.location_filter.trim() !== '' ||
           filters.salary_min !== null ||
           filters.date_posted_filter !== 'any' ||
           filters.skills_filter.length > 0;
  }, [filters]);

  //  Count how many jobs will be shown after filtering (client-side preview)
  const estimatedCount = React.useMemo(() => {
    if (!availableJobs || availableJobs.length === 0) return 0;
    
    // Simple count estimation
    return availableJobs.filter(job => {
      if (filters.job_type !== 'any' && job.job_type !== filters.job_type) return false;
      if (filters.min_match_percentage > 0) {
        const score = job.match_score || job.combined_score || 0;
        if (score < filters.min_match_percentage) return false;
      }
      return true;
    }).length;
  }, [availableJobs, filters]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 mb-6 p-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400 animate-pulse" />
          <span className="text-gray-500">Loading filters...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 mb-6">
      {/* Filter Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setShowFilters(!showFilters)}
      >
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          {hasActiveFilters && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
              Active
            </span>
          )}
          {availableJobs.length > 0 && (
            <span className="text-sm text-gray-500">
              ({estimatedCount} of {availableJobs.length} jobs)
            </span>
          )}
        </div>
        <ChevronDown 
          className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} 
        />
      </div>

      {/* Filter Content */}
      {showFilters && (
        <div className="p-4 border-t">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Job Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Type
              </label>
              <div className="flex flex-wrap gap-2">
                {jobTypes.map(type => (
                  <button
                    key={type.value}
                    onClick={() => handleFilterChange('job_type', type.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      filters.job_type === type.value
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Match Percentage Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Match
              </label>
              <div className="flex flex-wrap gap-2">
                {matchPercentages.map(perc => (
                  <button
                    key={perc.value}
                    onClick={() => handleFilterChange('min_match_percentage', perc.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      filters.min_match_percentage === perc.value
                        ? 'bg-green-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {perc.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Salary Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Salary
              </label>
              <div className="flex flex-wrap gap-2">
                {salaryRanges.map(range => (
                  <button
                    key={range.label}
                    onClick={() => handleFilterChange('salary_min', range.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      filters.salary_min === range.value
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Posted Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Posted
              </label>
              <div className="flex flex-wrap gap-2">
                {dateRanges.map(range => (
                  <button
                    key={range.value}
                    onClick={() => handleFilterChange('date_posted_filter', range.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      filters.date_posted_filter === range.value
                        ? 'bg-yellow-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Location Filter */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location Filter
            </label>
            <input
              type="text"
              value={filters.location_filter}
              onChange={(e) => handleFilterChange('location_filter', e.target.value)}
              placeholder="e.g., Remote, San Francisco, New York"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Skills Filter */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Required Skills (filters jobs that have these skills)
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={customSkills}
                onChange={(e) => setCustomSkills(e.target.value)}
                placeholder="Add skills (comma-separated, e.g., Python, React, AWS)"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
              />
              <button
                onClick={handleAddSkill}
                disabled={!customSkills.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
            
            {/* Selected Skills */}
            {filters.skills_filter.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {filters.skills_filter.map(skill => (
                  <div
                    key={skill}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg"
                  >
                    <Check className="w-3 h-3" />
                    <span className="text-sm font-medium">{skill}</span>
                    <button
                      onClick={() => handleRemoveSkill(skill)}
                      className="ml-1 text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center mt-6 pt-4 border-t">
            <div className="text-sm text-gray-600">
              {hasActiveFilters ? (
                <span className="font-medium">
                  {availableJobs.length > 0 && `Showing ~${estimatedCount} jobs`}
                </span>
              ) : (
                <span>No filters applied</span>
              )}
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={clearFilters}
                disabled={!hasActiveFilters}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Clear All
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobFilters;