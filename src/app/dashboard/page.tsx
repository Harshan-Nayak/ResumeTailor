'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/shared/Navbar';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileText, 
  Target, 
  Download,
  TrendingUp,
  Users,
  Clock,
  Plus,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [hasExistingResume, setHasExistingResume] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    // Check if user has an existing resume
    if (user) {
      const latestResumeId = localStorage.getItem('latestResumeId');
      setHasExistingResume(!!latestResumeId);
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleContinueToTailor = () => {
    const latestResumeId = localStorage.getItem('latestResumeId');
    if (latestResumeId) {
      router.push(`/tailor?resumeId=${latestResumeId}`);
    } else {
      router.push('/upload');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user.name}!
          </h1>
          <p className="text-gray-600 mt-2">
            Ready to tailor your resume for your next opportunity?
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Upload/Continue Resume */}
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Sparkles className="h-6 w-6 text-blue-600" />
                <CardTitle className="text-blue-900">
                  {hasExistingResume ? 'Continue Tailoring' : 'Upload Resume'}
                </CardTitle>
              </div>
              <CardDescription>
                {hasExistingResume 
                  ? 'Continue with your uploaded resume' 
                  : 'Get started by uploading your current resume'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {hasExistingResume ? (
                <div className="space-y-3">
                  <Button onClick={handleContinueToTailor} className="w-full">
                    <Target className="mr-2 h-4 w-4" />
                    Continue to Tailor
                  </Button>
                  <Button variant="outline" onClick={() => router.push('/upload')} className="w-full">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload New Resume
                  </Button>
                </div>
              ) : (
                <Button onClick={() => router.push('/upload')} className="w-full">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Resume
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span>Your Stats</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Resumes Created</span>
                  <Badge variant="secondary">1</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Applications</span>
                  <Badge variant="secondary">0</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Success Rate</span>
                  <Badge variant="outline">N/A</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span>Account</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Plan</span>
                  <Badge variant="outline">{user.subscription || 'Free'}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Member Since</span>
                  <span className="text-sm text-gray-900">
                    {user.createdAt.toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* How It Works */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>How AI Resume Tailor Works</CardTitle>
            <CardDescription>
              Get your resume optimized for any job in 3 simple steps
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-blue-100 rounded-full p-3 w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <Upload className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-medium text-gray-900 mb-1">1. Upload Resume</h3>
                <p className="text-sm text-gray-600">
                  Upload your current PDF resume and our AI will parse it
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-green-100 rounded-full p-3 w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <Target className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-medium text-gray-900 mb-1">2. Add Job Description</h3>
                <p className="text-sm text-gray-600">
                  Paste the job description you want to apply for
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-purple-100 rounded-full p-3 w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <Download className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-medium text-gray-900 mb-1">3. Download Tailored Resume</h3>
                <p className="text-sm text-gray-600">
                  Get your optimized, ATS-friendly resume instantly
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-gray-600" />
              <span>Recent Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasExistingResume ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">Resume Uploaded</p>
                      <p className="text-sm text-gray-600">Ready for tailoring</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleContinueToTailor}>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">No activity yet</p>
                <Button onClick={() => router.push('/upload')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Upload Your First Resume
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 