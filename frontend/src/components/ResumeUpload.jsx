import React, { useState, useCallback } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, X, RefreshCw } from 'lucide-react';
import { uploadResume } from '../utils/api';
import toast from 'react-hot-toast';

const ResumeUpload = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);

  // ✅ Validate file
  const validateFile = (selectedFile) => {
    if (!selectedFile) {
      return { valid: false, error: 'No file selected' };
    }

    // Check file extension
    const validExtensions = ['.pdf', '.docx'];
    const fileName = selectedFile.name.toLowerCase();
    const fileExtension = fileName.slice(fileName.lastIndexOf('.'));
    
    if (!validExtensions.includes(fileExtension)) {
      return { valid: false, error: 'Please upload a PDF or DOCX file only' };
    }
    
    // Check file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      return { 
        valid: false, 
        error: `File size (${(selectedFile.size / 1024 / 1024).toFixed(2)}MB) exceeds 5MB limit` 
      };
    }

    // Check minimum file size (1KB)
    if (selectedFile.size < 1024) {
      return { valid: false, error: 'File is too small. Please upload a valid resume.' };
    }
    
    return { valid: true, error: null };
  };

  // ✅ Handle file selection
  const handleFileChange = useCallback((e) => {
    const selectedFile = e.target.files?.[0];
    
    if (!selectedFile) return;

    const validation = validateFile(selectedFile);
    
    if (!validation.valid) {
      setError(validation.error);
      setFile(null);
      toast.error(validation.error);
      return;
    }
    
    setFile(selectedFile);
    setError('');
    setUploadComplete(false);
    console.log('✅ File selected:', selectedFile.name);
  }, []);

  // ✅ Handle drag events
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (uploading) return;
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, [uploading]);

  // ✅ Handle drop
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (uploading) return;
    
    const droppedFile = e.dataTransfer?.files?.[0];
    
    if (!droppedFile) return;

    const validation = validateFile(droppedFile);
    
    if (!validation.valid) {
      setError(validation.error);
      setFile(null);
      toast.error(validation.error);
      return;
    }
    
    setFile(droppedFile);
    setError('');
    setUploadComplete(false);
    console.log('✅ File dropped:', droppedFile.name);
  }, [uploading]);

  // ✅ Clear file
  const clearFile = useCallback(() => {
    setFile(null);
    setError('');
    setUploadProgress(0);
    setUploadComplete(false);
    
    // Clear file input
    const input = document.getElementById('resume-upload');
    if (input) input.value = '';
  }, []);

  // ✅ Handle upload
  const handleUpload = async () => {
    if (!file) {
      const errorMsg = 'Please select a file first';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }
    
    // Double-check validation before upload
    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.error);
      toast.error(validation.error);
      return;
    }
    
    setUploading(true);
    setUploadProgress(0);
    setError('');
    
    const formData = new FormData();
    formData.append('resume', file);
    
    // Add metadata
    formData.append('filename', file.name);
    formData.append('filesize', file.size);
    
    let progressInterval;
    
    try {
      console.log('📤 Uploading resume:', file.name);
      
      // ✅ Simulate progress (more realistic)
      progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 85) {
            clearInterval(progressInterval);
            return prev;
          }
          // Slow down as we get closer
          const increment = prev < 50 ? 15 : prev < 70 ? 10 : 5;
          return Math.min(prev + increment, 85);
        });
      }, 400);
      
      // ✅ Upload using API
      const response = await uploadResume(formData);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (response.success) {
        console.log('✅ Upload successful:', response);
        setUploadComplete(true);
        toast.success('Resume uploaded successfully! Analyzing...');
        
        // ✅ Wait before redirecting
        setTimeout(() => {
          onUploadSuccess(response);
        }, 1500);
      } else {
        throw new Error(response.error || 'Upload failed');
      }
      
    } catch (err) {
      console.error('❌ Upload error:', err);
      
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      
      setUploadProgress(0);
      
      // ✅ Better error messages
      let errorMessage = 'Upload failed. Please try again.';
      
      if (err.error) {
        errorMessage = err.error;
      } else if (err.message) {
        if (err.message.includes('network') || err.message.includes('failed')) {
          errorMessage = 'Cannot connect to backend. Make sure the server is running on port 5000.';
        } else if (err.message.includes('timeout')) {
          errorMessage = 'Upload timed out. Please check your connection and try again.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      
    } finally {
      setUploading(false);
    }
  };

  // ✅ Get file size display
  const getFileSizeDisplay = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  // ✅ Get border color based on state
  const getBorderColor = () => {
    if (uploading) return 'border-blue-500 bg-blue-50';
    if (uploadComplete) return 'border-green-500 bg-green-50';
    if (error) return 'border-red-300 bg-red-50';
    if (file) return 'border-green-400 bg-green-50';
    if (dragActive) return 'border-blue-500 bg-blue-50';
    return 'border-gray-300 hover:border-blue-400 hover:bg-blue-50';
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4 shadow-lg">
            <Upload className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Upload Your Resume</h2>
          <p className="text-gray-600 mt-2">
            Get AI-powered job recommendations tailored to your skills
          </p>
        </div>

        <div className="space-y-6">
          {/* File Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer ${getBorderColor()}`}
            onClick={() => !uploading && !uploadComplete && document.getElementById('resume-upload').click()}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center">
              {uploading ? (
                <>
                  <Loader2 className="w-12 h-12 mb-4 text-blue-600 animate-spin" />
                  <p className="font-medium text-blue-700">Processing your resume...</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {uploadProgress}% complete
                  </p>
                </>
              ) : uploadComplete ? (
                <>
                  <CheckCircle className="w-12 h-12 mb-4 text-green-500" />
                  <p className="font-medium text-green-700">Upload Complete!</p>
                  <p className="text-sm text-gray-500 mt-1">Redirecting to dashboard...</p>
                </>
              ) : file ? (
                <>
                  <div className="relative">
                    <FileText className="w-12 h-12 mb-4 text-green-500" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        clearFile();
                      }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="font-medium text-green-700 break-all px-4">{file.name}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {getFileSizeDisplay(file.size)}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Click to select a different file
                  </p>
                </>
              ) : (
                <>
                  <FileText className="w-12 h-12 mb-4 text-gray-400" />
                  <p className="text-gray-600 mb-2">
                    <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-sm text-gray-500">
                    PDF or DOCX (Max 5MB)
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-6 text-xs text-gray-400">
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      <span>Secure</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      <span>Fast</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      <span>AI-Powered</span>
                    </div>
                  </div>
                </>
              )}
              
              <input
                type="file"
                id="resume-upload"
                className="hidden"
                accept=".pdf,.docx"
                onChange={handleFileChange}
                disabled={uploading || uploadComplete}
              />
            </div>
          </div>

          {/* Progress Bar */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading & Analyzing...
                </span>
                <span className="font-bold text-blue-600">{uploadProgress}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600 transition-all duration-300 animate-pulse"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 text-center">
                This may take 30-60 seconds
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && !uploading && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-700 font-medium">Upload Failed</p>
                <p className="text-red-600 text-sm mt-1">{error}</p>
                {error.includes('backend') || error.includes('server') && (
                  <p className="text-red-600 text-xs mt-2">
                    💡 Start backend: <code className="bg-red-100 px-2 py-0.5 rounded">cd backend && python app.py</code>
                  </p>
                )}
              </div>
              <button
                onClick={clearFile}
                className="text-red-500 hover:text-red-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Success Message */}
          {uploadComplete && !error && (
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg animate-fade-in">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-green-800">Upload Successful!</p>
                <p className="text-sm text-green-600 mt-1">
                  Your resume has been analyzed. Redirecting to dashboard...
                </p>
              </div>
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={!file || uploading || uploadComplete}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
              !file || uploading || uploadComplete
                ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg'
            }`}
          >
            {uploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing Resume...
              </>
            ) : uploadComplete ? (
              <>
                <CheckCircle className="w-5 h-5" />
                Success! Redirecting...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Analyze Resume & Find Jobs
              </>
            )}
          </button>

          {/* Retry Button (shown on error) */}
          {error && file && !uploading && (
            <button
              onClick={handleUpload}
              className="w-full py-2 px-4 border border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Retry Upload
            </button>
          )}

          {/* Tips */}
          <div className="pt-4 border-t space-y-2">
            <p className="text-sm font-medium text-gray-700 text-center">
              💡 Tips for Best Results
            </p>
            <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
              <li>Include detailed skills section (programming languages, frameworks, tools)</li>
              <li>List your work experience with specific achievements</li>
              <li>Add education and certifications</li>
              <li>Use standard resume format (PDF preferred)</li>
            </ul>
          </div>

          {/* Privacy Notice */}
          <div className="pt-4 border-t">
            <p className="text-xs text-gray-500 text-center">
              🔒 Your resume is processed securely and never shared with third parties
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeUpload;