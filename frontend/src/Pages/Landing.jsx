import React from "react";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import TrustedCompanies from "@/components/landing/TrustedCompanies";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";
import JobListings from "@/components/landing/JobListings";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";

export default function Landing() {
    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <Navbar />
            <HeroSection />
            <TrustedCompanies />
            <Features />
            <HowItWorks />
            <JobListings />
            <CTASection />
            <Footer />
        </div>
    );
}