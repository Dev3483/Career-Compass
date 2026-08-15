// Register.jsx - Fixed version
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Sparkles, Mail, Lock, User, Briefcase, Building2, MapPin, 
    FileText, ChevronRight, ChevronLeft, Check, Eye, EyeOff, 
    AlertCircle, CheckCircle, XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { registerUser } from '@/utils/api';
import { createPageUrl } from '@/utils';

export default function Register() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [role, setRole] = useState('job_seeker');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    // Track which fields have been touched (user interacted with)
    const [touched, setTouched] = useState({
        email: false,
        password: false,
        confirmPassword: false,
        full_name: false,
        title: false,
        location: false,
        skills: false,
        company_name: false,
        industry: false
    });
    
    // Real-time validation errors
    const [errors, setErrors] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        full_name: '',
        title: '',
        location: '',
        skills: '',
        company_name: '',
        industry: ''
    });

    const [formData, setFormData] = useState({
        // Common fields
        email: '',
        password: '',
        confirmPassword: '',
        full_name: '',

        // Job seeker fields
        title: '',
        location: '',
        skills: '',
        experience_years: '',
        bio: '',

        // Company fields
        company_name: '',
        company_size: '',
        industry: '',
        website: '',
        description: '',
        company_location: '',
    });

    // Mark field as touched when user interacts
    const handleBlur = (fieldName) => {
        setTouched(prev => ({ ...prev, [fieldName]: true }));
        validateField(fieldName, formData[fieldName]);
    };

    // Real-time validations - Only validate if field has been touched
    useEffect(() => {
        if (touched.email) {
            validateField('email', formData.email);
        }
    }, [formData.email]);

    useEffect(() => {
        if (touched.password) {
            validateField('password', formData.password);
        }
        if (touched.confirmPassword && formData.confirmPassword) {
            validateField('confirmPassword', formData.confirmPassword);
        }
    }, [formData.password, formData.confirmPassword]);

    useEffect(() => {
        if (step === 2) {
            if (role === 'job_seeker') {
                if (touched.title) validateField('title', formData.title);
                if (touched.location) validateField('location', formData.location);
                if (touched.skills) validateField('skills', formData.skills);
            } else {
                if (touched.company_name) validateField('company_name', formData.company_name);
                if (touched.industry) validateField('industry', formData.industry);
                if (touched.location) validateField('location', formData.company_location);
            }
        }
    }, [formData.title, formData.location, formData.skills, formData.company_name, formData.industry, formData.company_location, step, role]);

    const validateField = (field, value) => {
        let newErrors = { ...errors };
        
        switch (field) {
            case 'email':
                if (!value) {
                    newErrors.email = 'Email is required';
                } else if (!/\S+@\S+\.\S+/.test(value)) {
                    newErrors.email = 'Please enter a valid email address';
                } else {
                    newErrors.email = '';
                }
                break;
            case 'password':
                if (!value) {
                    newErrors.password = '';
                } else if (value.length < 8) {
                    newErrors.password = 'Password must be at least 8 characters';
                } else if (!/(?=.*[A-Z])/.test(value)) {
                    newErrors.password = 'Password must contain at least one uppercase letter';
                } else if (!/(?=.*[a-z])/.test(value)) {
                    newErrors.password = 'Password must contain at least one lowercase letter';
                } else if (!/(?=.*[0-9])/.test(value)) {
                    newErrors.password = 'Password must contain at least one number';
                } else {
                    newErrors.password = '';
                }
                break;
            case 'confirmPassword':
                if (!value) {
                    newErrors.confirmPassword = '';
                } else if (value !== formData.password) {
                    newErrors.confirmPassword = 'Passwords do not match';
                } else {
                    newErrors.confirmPassword = '';
                }
                break;
            case 'full_name':
                if (!value) {
                    newErrors.full_name = 'Full name is required';
                } else if (value.length < 2) {
                    newErrors.full_name = 'Name must be at least 2 characters';
                } else {
                    newErrors.full_name = '';
                }
                break;
            case 'title':
                if (!value) {
                    newErrors.title = 'Job title is required';
                } else {
                    newErrors.title = '';
                }
                break;
            case 'location':
                if (!value) {
                    newErrors.location = 'Location is required';
                } else {
                    newErrors.location = '';
                }
                break;
            case 'skills':
                if (!value) {
                    newErrors.skills = 'Skills are required';
                } else {
                    newErrors.skills = '';
                }
                break;
            case 'company_name':
                if (!value) {
                    newErrors.company_name = 'Company name is required';
                } else {
                    newErrors.company_name = '';
                }
                break;
            case 'industry':
                if (!value) {
                    newErrors.industry = 'Industry is required';
                } else {
                    newErrors.industry = '';
                }
                break;
            default:
                break;
        }
        
        setErrors(newErrors);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        let processedValue = value;
        
        // Auto-convert email to lowercase
        if (name === 'email') {
            processedValue = value.toLowerCase();
        }
        
        // Capitalize first letter of full name
        if (name === 'full_name') {
            processedValue = value.replace(/\b\w/g, l => l.toUpperCase());
        }
        
        setFormData({
            ...formData,
            [name]: processedValue
        });
    };

    const handleSelectChange = (name, value) => {
        setFormData({
            ...formData,
            [name]: value
        });
        // Mark as touched for select fields
        setTouched(prev => ({ ...prev, [name]: true }));
        validateField(name, value);
    };

    const isStep1Valid = () => {
        // Only validate fields that have been touched, but for submission we check all
        const emailValid = formData.email && !errors.email;
        const fullNameValid = formData.full_name && !errors.full_name;
        const passwordValid = formData.password && !errors.password;
        const confirmPasswordValid = formData.confirmPassword && !errors.confirmPassword;
        
        return emailValid && fullNameValid && passwordValid && confirmPasswordValid;
    };

    const isStep2Valid = () => {
        if (role === 'job_seeker') {
            const titleValid = formData.title && !errors.title;
            const locationValid = formData.location && !errors.location;
            const skillsValid = formData.skills && !errors.skills;
            return titleValid && locationValid && skillsValid;
        } else {
            const companyNameValid = formData.company_name && !errors.company_name;
            const industryValid = formData.industry && !errors.industry;
            const locationValid = formData.company_location && !errors.location;
            return companyNameValid && industryValid && locationValid;
        }
    };

    const handleNext = () => {
        // Mark all step 1 fields as touched before validation
        if (step === 1) {
            setTouched(prev => ({
                ...prev,
                email: true,
                full_name: true,
                password: true,
                confirmPassword: true
            }));
            
            // Validate all step 1 fields
            validateField('email', formData.email);
            validateField('full_name', formData.full_name);
            validateField('password', formData.password);
            validateField('confirmPassword', formData.confirmPassword);
            
            if (isStep1Valid()) {
                setStep(2);
            }
        } else if (step === 2 && isStep2Valid()) {
            handleSubmit();
        }
    };

    const handleBack = () => {
        setError('');
        setStep(1);
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError('');

        try {
            const userData = {
                email: formData.email,
                password: formData.password,
                full_name: formData.full_name,
                role: role,
            };

            if (role === 'job_seeker') {
                userData.title = formData.title;
                userData.location = formData.location;
                userData.skills = formData.skills.split(',').map(s => s.trim()).filter(Boolean);
                userData.experience_years = parseInt(formData.experience_years) || 0;
                userData.bio = formData.bio;
            } else {
                userData.company_name = formData.company_name;
                userData.company_size = formData.company_size;
                userData.industry = formData.industry;
                userData.website = formData.website;
                userData.description = formData.description;
                userData.location = formData.company_location;
            }

            const response = await registerUser(userData);

            if (response.success) {
                if (role === 'company') {
                    navigate(createPageUrl('CompanyDashboard'));
                } else {
                    navigate(createPageUrl('Dashboard'));
                }
            }
        } catch (err) {
            setError(err.error || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Password strength indicator
    const getPasswordStrength = () => {
        const password = formData.password;
        if (!password) return null;
        
        let strength = 0;
        if (password.length >= 8) strength++;
        if (/(?=.*[A-Z])/.test(password)) strength++;
        if (/(?=.*[a-z])/.test(password)) strength++;
        if (/(?=.*[0-9])/.test(password)) strength++;
        
        if (strength <= 2) return { text: 'Weak', color: 'text-red-500', bg: 'bg-red-100' };
        if (strength === 3) return { text: 'Medium', color: 'text-yellow-500', bg: 'bg-yellow-100' };
        return { text: 'Strong', color: 'text-green-500', bg: 'bg-green-100' };
    };

    const passwordStrength = getPasswordStrength();

    // Helper to show error only if field has been touched
    const showError = (fieldName) => {
        return touched[fieldName] && errors[fieldName];
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center px-4 py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-2xl w-full"
            >
                <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-xl">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6C63FF] to-[#8B85FF] flex items-center justify-center mx-auto mb-4 shadow-lg"
                        >
                            <Sparkles className="w-8 h-8 text-white" />
                        </motion.div>
                        <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
                        <p className="text-gray-500 mt-1">Join CareerAI and start your journey</p>
                    </div>

                    {/* Progress Steps */}
                    <div className="flex items-center justify-center mb-8">
                        <div className="flex items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
                                step >= 1 ? 'bg-gradient-to-r from-[#6C63FF] to-[#8B85FF] text-white shadow-md' : 'bg-gray-200 text-gray-500'
                            }`}>
                                1
                            </div>
                            <div className={`w-20 h-1 mx-3 rounded-full transition-all duration-300 ${
                                step >= 2 ? 'bg-gradient-to-r from-[#6C63FF] to-[#8B85FF]' : 'bg-gray-200'
                            }`} />
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
                                step >= 2 ? 'bg-gradient-to-r from-[#6C63FF] to-[#8B85FF] text-white shadow-md' : 'bg-gray-200 text-gray-500'
                            }`}>
                                2
                            </div>
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-5"
                            >
                                {/* Role Selection */}
                                <div className="space-y-2">
                                    <Label className="text-gray-700">I am a</Label>
                                    <RadioGroup
                                        value={role}
                                        onValueChange={setRole}
                                        className="flex gap-6"
                                    >
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="job_seeker" id="job_seeker" />
                                            <Label htmlFor="job_seeker" className="flex items-center gap-2 cursor-pointer">
                                                <User className="w-4 h-4" /> Job Seeker
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="company" id="company" />
                                            <Label htmlFor="company" className="flex items-center gap-2 cursor-pointer">
                                                <Building2 className="w-4 h-4" /> Company
                                            </Label>
                                        </div>
                                    </RadioGroup>
                                </div>

                                {/* Email */}
                                <div>
                                    <Label htmlFor="email" className="text-gray-700">Email</Label>
                                    <div className="relative mt-1.5">
                                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            placeholder="you@example.com"
                                            value={formData.email}
                                            onChange={handleChange}
                                            onBlur={() => handleBlur('email')}
                                            className={`pl-10 rounded-xl ${showError('email') ? 'border-red-500 focus:ring-red-500' : ''}`}
                                        />
                                    </div>
                                    {showError('email') && (
                                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-red-500 mt-1">
                                            {errors.email}
                                        </motion.p>
                                    )}
                                </div>

                                {/* Full Name */}
                                <div>
                                    <Label htmlFor="full_name" className="text-gray-700">Full Name</Label>
                                    <div className="relative mt-1.5">
                                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <Input
                                            id="full_name"
                                            name="full_name"
                                            placeholder="John Doe"
                                            value={formData.full_name}
                                            onChange={handleChange}
                                            onBlur={() => handleBlur('full_name')}
                                            className={`pl-10 rounded-xl ${showError('full_name') ? 'border-red-500 focus:ring-red-500' : ''}`}
                                        />
                                    </div>
                                    {showError('full_name') && (
                                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-red-500 mt-1">
                                            {errors.full_name}
                                        </motion.p>
                                    )}
                                </div>

                                {/* Password */}
                                <div>
                                    <Label htmlFor="password" className="text-gray-700">Password</Label>
                                    <div className="relative mt-1.5">
                                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <Input
                                            id="password"
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Create a strong password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            onBlur={() => handleBlur('password')}
                                            className={`pl-10 pr-10 rounded-xl ${showError('password') ? 'border-red-500 focus:ring-red-500' : ''}`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    {showError('password') && (
                                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-red-500 mt-1">
                                            {errors.password}
                                        </motion.p>
                                    )}
                                    {touched.password && formData.password && !errors.password && (
                                        <div className="mt-2">
                                            <div className="flex items-center gap-2">
                                                <div className={`text-xs px-2 py-0.5 rounded ${passwordStrength?.bg} ${passwordStrength?.color}`}>
                                                    {passwordStrength?.text} password
                                                </div>
                                            </div>
                                            <ul className="text-xs text-gray-500 mt-1 space-y-0.5">
                                                <li className={formData.password.length >= 8 ? "text-green-500" : ""}>
                                                    ✓ At least 8 characters
                                                </li>
                                                <li className={/(?=.*[A-Z])/.test(formData.password) ? "text-green-500" : ""}>
                                                    ✓ At least one uppercase letter
                                                </li>
                                                <li className={/(?=.*[a-z])/.test(formData.password) ? "text-green-500" : ""}>
                                                    ✓ At least one lowercase letter
                                                </li>
                                                <li className={/(?=.*[0-9])/.test(formData.password) ? "text-green-500" : ""}>
                                                    ✓ At least one number
                                                </li>
                                            </ul>
                                        </div>
                                    )}
                                </div>

                                {/* Confirm Password */}
                                <div>
                                    <Label htmlFor="confirmPassword" className="text-gray-700">Confirm Password</Label>
                                    <div className="relative mt-1.5">
                                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <Input
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            type={showConfirmPassword ? "text" : "password"}
                                            placeholder="Confirm your password"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            onBlur={() => handleBlur('confirmPassword')}
                                            className={`pl-10 pr-10 rounded-xl ${showError('confirmPassword') ? 'border-red-500 focus:ring-red-500' : ''}`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    {showError('confirmPassword') && (
                                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-red-500 mt-1">
                                            {errors.confirmPassword}
                                        </motion.p>
                                    )}
                                    {touched.confirmPassword && formData.confirmPassword && !errors.confirmPassword && formData.password === formData.confirmPassword && (
                                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-green-500 mt-1 flex items-center gap-1">
                                            <CheckCircle className="w-3 h-3" /> Passwords match
                                        </motion.p>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-5"
                            >
                                {role === 'job_seeker' ? (
                                    // Job Seeker Fields
                                    <>
                                        <div>
                                            <Label htmlFor="title" className="text-gray-700">Current Job Title</Label>
                                            <div className="relative mt-1.5">
                                                <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <Input
                                                    id="title"
                                                    name="title"
                                                    placeholder="e.g., Frontend Developer"
                                                    value={formData.title}
                                                    onChange={handleChange}
                                                    onBlur={() => handleBlur('title')}
                                                    className={`pl-10 rounded-xl ${showError('title') ? 'border-red-500 focus:ring-red-500' : ''}`}
                                                />
                                            </div>
                                            {showError('title') && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
                                        </div>

                                        <div>
                                            <Label htmlFor="location" className="text-gray-700">Location</Label>
                                            <div className="relative mt-1.5">
                                                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <Input
                                                    id="location"
                                                    name="location"
                                                    placeholder="e.g., San Francisco, CA"
                                                    value={formData.location}
                                                    onChange={handleChange}
                                                    onBlur={() => handleBlur('location')}
                                                    className={`pl-10 rounded-xl ${showError('location') ? 'border-red-500 focus:ring-red-500' : ''}`}
                                                />
                                            </div>
                                            {showError('location') && <p className="text-xs text-red-500 mt-1">{errors.location}</p>}
                                        </div>

                                        <div>
                                            <Label htmlFor="skills" className="text-gray-700">Skills (comma separated)</Label>
                                            <div className="relative mt-1.5">
                                                <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <Input
                                                    id="skills"
                                                    name="skills"
                                                    placeholder="React, JavaScript, Python"
                                                    value={formData.skills}
                                                    onChange={handleChange}
                                                    onBlur={() => handleBlur('skills')}
                                                    className={`pl-10 rounded-xl ${showError('skills') ? 'border-red-500 focus:ring-red-500' : ''}`}
                                                />
                                            </div>
                                            {showError('skills') && <p className="text-xs text-red-500 mt-1">{errors.skills}</p>}
                                        </div>

                                        <div>
                                            <Label htmlFor="experience_years" className="text-gray-700">Years of Experience</Label>
                                            <Input
                                                id="experience_years"
                                                name="experience_years"
                                                type="number"
                                                min="0"
                                                step="1"
                                                placeholder="Years of experience"
                                                value={formData.experience_years}
                                                onChange={handleChange}
                                                className="rounded-xl mt-1.5"
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="bio" className="text-gray-700">Bio (Optional)</Label>
                                            <textarea
                                                id="bio"
                                                name="bio"
                                                rows="3"
                                                placeholder="Tell us about yourself..."
                                                value={formData.bio}
                                                onChange={handleChange}
                                                className="w-full rounded-xl border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] focus:border-transparent mt-1.5 resize-none"
                                            />
                                        </div>
                                    </>
                                ) : (
                                    // Company Fields
                                    <>
                                        <div>
                                            <Label htmlFor="company_name" className="text-gray-700">Company Name</Label>
                                            <div className="relative mt-1.5">
                                                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <Input
                                                    id="company_name"
                                                    name="company_name"
                                                    placeholder="e.g., TechCorp Inc."
                                                    value={formData.company_name}
                                                    onChange={handleChange}
                                                    onBlur={() => handleBlur('company_name')}
                                                    className={`pl-10 rounded-xl ${showError('company_name') ? 'border-red-500 focus:ring-red-500' : ''}`}
                                                />
                                            </div>
                                            {showError('company_name') && <p className="text-xs text-red-500 mt-1">{errors.company_name}</p>}
                                        </div>

                                        <div>
                                            <Label htmlFor="industry" className="text-gray-700">Industry</Label>
                                            <Select
                                                value={formData.industry}
                                                onValueChange={(value) => {
                                                    handleSelectChange('industry', value);
                                                    setTouched(prev => ({ ...prev, industry: true }));
                                                }}
                                            >
                                                <SelectTrigger className={`rounded-xl mt-1.5 ${showError('industry') ? 'border-red-500' : ''}`}>
                                                    <SelectValue placeholder="Select industry" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="technology">Technology</SelectItem>
                                                    <SelectItem value="healthcare">Healthcare</SelectItem>
                                                    <SelectItem value="finance">Finance</SelectItem>
                                                    <SelectItem value="education">Education</SelectItem>
                                                    <SelectItem value="retail">Retail</SelectItem>
                                                    <SelectItem value="manufacturing">Manufacturing</SelectItem>
                                                    <SelectItem value="other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {showError('industry') && <p className="text-xs text-red-500 mt-1">{errors.industry}</p>}
                                        </div>

                                        <div>
                                            <Label htmlFor="company_location" className="text-gray-700">Company Location</Label>
                                            <div className="relative mt-1.5">
                                                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <Input
                                                    id="company_location"
                                                    name="company_location"
                                                    placeholder="e.g., San Francisco, CA"
                                                    value={formData.company_location}
                                                    onChange={handleChange}
                                                    onBlur={() => handleBlur('location')}
                                                    className={`pl-10 rounded-xl ${showError('location') ? 'border-red-500 focus:ring-red-500' : ''}`}
                                                />
                                            </div>
                                            {showError('location') && <p className="text-xs text-red-500 mt-1">{errors.location}</p>}
                                        </div>

                                        <div>
                                            <Label htmlFor="company_size" className="text-gray-700">Company Size</Label>
                                            <Select
                                                value={formData.company_size}
                                                onValueChange={(value) => handleSelectChange('company_size', value)}
                                            >
                                                <SelectTrigger className="rounded-xl mt-1.5">
                                                    <SelectValue placeholder="Select company size" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="1-10">1-10 employees</SelectItem>
                                                    <SelectItem value="11-50">11-50 employees</SelectItem>
                                                    <SelectItem value="51-200">51-200 employees</SelectItem>
                                                    <SelectItem value="201-500">201-500 employees</SelectItem>
                                                    <SelectItem value="501-1000">501-1000 employees</SelectItem>
                                                    <SelectItem value="1000+">1000+ employees</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <Label htmlFor="website" className="text-gray-700">Website (Optional)</Label>
                                            <Input
                                                id="website"
                                                name="website"
                                                placeholder="https://www.example.com"
                                                value={formData.website}
                                                onChange={handleChange}
                                                className="rounded-xl mt-1.5"
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="description" className="text-gray-700">Company Description (Optional)</Label>
                                            <textarea
                                                id="description"
                                                name="description"
                                                rows="3"
                                                placeholder="Tell us about your company..."
                                                value={formData.description}
                                                onChange={handleChange}
                                                className="w-full rounded-xl border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] focus:border-transparent mt-1.5 resize-none"
                                            />
                                        </div>
                                    </>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Error Message */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm"
                        >
                            {error}
                        </motion.div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex gap-3 mt-6">
                        {step === 2 && (
                            <Button
                                type="button"
                                onClick={handleBack}
                                variant="outline"
                                className="flex-1 rounded-xl border-gray-300 hover:border-[#6C63FF] hover:text-[#6C63FF] transition-all duration-300"
                                disabled={loading}
                            >
                                <ChevronLeft className="w-4 h-4 mr-2" />
                                Back
                            </Button>
                        )}
                        <Button
                            type="button"
                            onClick={handleNext}
                            className="flex-1 bg-gradient-to-r from-[#6C63FF] to-[#8B85FF] text-white rounded-xl hover:shadow-lg transition-all duration-300"
                            disabled={loading || (step === 1 ? !isStep1Valid() : !isStep2Valid())}
                        >
                            {loading ? (
                                <div className="flex items-center justify-center">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                    Creating account...
                                </div>
                            ) : step === 2 ? (
                                <>
                                    Create Account
                                    <Check className="w-4 h-4 ml-2" />
                                </>
                            ) : (
                                <>
                                    Continue
                                    <ChevronRight className="w-4 h-4 ml-2" />
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Login Link */}
                    <p className="text-center text-sm text-gray-500 mt-6">
                        Already have an account?{' '}
                        <Link to={createPageUrl('Login')} className="text-[#6C63FF] font-medium hover:underline">
                            Sign in
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}