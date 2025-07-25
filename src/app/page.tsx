'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Navbar } from '@/components/shared/Navbar';
import { useAuth } from '@/components/auth/AuthProvider';
import {
  Sparkles,
  Upload,
  Download,
  Target,
  CheckCircle,
  ArrowRight,
  Zap,
  Shield,
  Clock,
  Chrome
} from 'lucide-react';

export default function HomePage() {
  const { user, signInWithGoogle } = useAuth();

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Sign in error:', error);
    }
  };

  const features = [
    {
      icon: Upload,
      title: 'Smart Resume Parsing',
      description: 'Upload your PDF resume and our AI extracts all information into structured, editable format.',
    },
    {
      icon: Target,
      title: 'Job-Specific Tailoring',
      description: 'Paste any job description and watch AI optimize your resume with relevant keywords and skills.',
    },
    {
      icon: Download,
      title: 'Professional PDF Output',
      description: 'Download beautifully formatted, ATS-friendly PDFs optimized for each application.',
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Get your tailored resume in seconds, not hours. Apply to more jobs efficiently.',
    },
    {
      icon: Shield,
      title: 'Privacy Secure',
      description: 'Your resume data is encrypted and secure. We never share your information.',
    },
    {
      icon: Clock,
      title: 'Version History',
      description: 'Keep track of all your tailored resumes and manage multiple job applications.',
    },
  ];

  const steps = [
    {
      step: '01',
      title: 'Upload Resume',
      description: 'Upload your current resume in PDF format',
    },
    {
      step: '02',
      title: 'Add Job Description',
      description: 'Paste the job description you want to apply for',
    },
    {
      step: '03',
      title: 'AI Optimization',
      description: 'Our AI analyzes and tailors your resume',
    },
    {
      step: '04',
      title: 'Download & Apply',
      description: 'Get your optimized resume and apply with confidence',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 bg-gray-50 sm:pb-16 md:pb-20 lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start mb-6">
                  <Sparkles className="h-12 w-12 text-blue-600" />
                  <span className="ml-3 text-4xl font-bold text-gray-900">
                    AI Resume Tailor
                  </span>
                </div>
                
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                  <span className="block">Tailor your resume</span>
                  <span className="block text-blue-600">for every job with AI</span>
                </h1>
                
                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  Stop sending the same resume to every job. Our AI analyzes job descriptions and 
                  optimizes your resume with relevant keywords, skills, and achievements to maximize 
                  your chances of getting interviews.
                </p>
                
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                  {user ? (
                    <Link href="/dashboard">
                      <Button size="lg" className="w-full sm:w-auto flex items-center justify-center">
                        Go to Dashboard
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                  ) : (
                    <Button onClick={handleGoogleSignIn} size="lg" className="w-full sm:w-auto flex items-center justify-center">
                      <Chrome className="mr-3 h-5 w-5" />
                      Sign in with Google to Get Started
                    </Button>
                  )}
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">
              How it works
            </h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Four simple steps to success
            </p>
          </div>

          <div className="mt-10">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, index) => (
                <div key={index} className="text-center">
                  <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-600 text-xl font-bold mx-auto">
                    {step.step}
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">
              Features
            </h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to land your dream job
            </p>
          </div>

          <div className="mt-10">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <feature.icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600">
        <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            <span className="block">Ready to optimize your resume?</span>
            <span className="block">Start tailoring today.</span>
          </h2>
          <p className="mt-4 text-lg leading-6 text-blue-200">
            Join thousands of job seekers who have improved their application success rate with AI-powered resume optimization.
          </p>
          {!user && (
            <Button onClick={handleGoogleSignIn} size="lg" variant="secondary" className="mt-8">
              <Chrome className="mr-3 h-5 w-5" />
              Sign in with Google
            </Button>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="border-t border-gray-200 pt-8">
            <p className="text-base text-gray-400 text-center">
              &copy; 2024 AI Resume Tailor. Built with Next.js, Firebase, and Google Gemini AI.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
