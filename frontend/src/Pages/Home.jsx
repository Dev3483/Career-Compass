import React from 'react';
import { ArrowRight, Sparkles, Target, TrendingUp, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ResumeUpload from '../components/ResumeUpload';

const Home = () => {
  const navigate = useNavigate();

  const handleUploadSuccess = (data) => {
    navigate(`/dashboard/${data.user_id}`);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800">
        <div className="absolute inset-0 bg-grid-white/10 bg-grid-16" />
        
        <div className="relative max-w-7xl mx-auto px-4 py-24">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white mb-6">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">AI-Powered Career Platform</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Find Your Perfect
              <span className="block text-blue-200">Career Match</span>
            </h1>
            
            <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-10">
              Upload your resume and let our AI analyze your skills, match you with 
              ideal jobs, and show you exactly what you need to learn next.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 bg-white text-blue-700 rounded-xl font-semibold text-lg hover:bg-blue-50 transition-all duration-200 flex items-center justify-center gap-2"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </button>
              <button className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-xl font-semibold text-lg hover:bg-white/10 transition-all duration-200">
                Watch Demo
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our AI-powered platform analyzes your resume and matches you with 
              the perfect career opportunities in three simple steps.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-gradient-to-b from-blue-50 to-white rounded-2xl">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Upload Resume</h3>
              <p className="text-gray-600">
                Upload your PDF or DOCX resume. Our AI extracts skills, 
                experience, and education instantly.
              </p>
            </div>
            
            <div className="text-center p-8 bg-gradient-to-b from-purple-50 to-white rounded-2xl">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-purple-600">2</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">AI Analysis</h3>
              <p className="text-gray-600">
                Advanced NLP analyzes your profile and scans thousands of 
                job listings to find perfect matches.
              </p>
            </div>
            
            <div className="text-center p-8 bg-gradient-to-b from-green-50 to-white rounded-2xl">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-green-600">3</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Get Results</h3>
              <p className="text-gray-600">
                Receive personalized job recommendations with skill gap 
                analysis and learning resources.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-gray-900 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">10,000+</div>
              <div className="text-blue-300">Jobs Analyzed Daily</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">95%</div>
              <div className="text-blue-300">Accuracy Rate</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">50+</div>
              <div className="text-blue-300">Skills Categories</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">24/7</div>
              <div className="text-blue-300">Real-time Updates</div>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Section */}
      <div id="upload-section" className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <ResumeUpload onUploadSuccess={handleUploadSuccess} />
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">AI Career Recommendation System</h3>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Built with React, Flask, MongoDB, and advanced AI technologies 
              to help you find your perfect career path.
            </p>
            <div className="mt-8 text-gray-400">
              © 2024 Career AI. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;