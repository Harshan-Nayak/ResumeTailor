'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/shared/Navbar';
import { JobDescriptionInput } from '@/components/resume/JobDescriptionInput';
import { ResumeComparison } from '@/components/resume/ResumeComparison';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  ResumeContent, 
  ResumeComparison as ResumeComparisonType,
  JobAnalysis,
  TailoringSuggestions
} from '@/types';
import { 
  FileText, 
  Sparkles, 
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Loader2
} from 'lucide-react';

interface TailoringState {
  step: 'input' | 'analyzing' | 'results';
  masterResume?: ResumeContent;
  jobAnalysis?: JobAnalysis;
  tailoringSuggestions?: TailoringSuggestions;
  comparison?: ResumeComparisonType;
  tailoredResumeId?: string;
  atsScore?: number;
  jobTitle?: string;
  company?: string;
  jobDescription?: string;
  isGeneratingPdf?: boolean;
}

export default function TailorPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const resumeId = searchParams.get('resumeId');

  const [state, setState] = useState<TailoringState>({ 
    step: 'input',
    isGeneratingPdf: false 
  });
  const [currentResumeId, setCurrentResumeId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      // Load the master resume data
      loadMasterResume();
    }
  }, [user, loading, router]);

  const loadMasterResume = async () => {
    if (!user) return;

    try {
      let resumeIdToUse = resumeId;
      
      // If no resumeId in URL, try to find the latest uploaded resume
      if (!resumeIdToUse) {
        console.log('No resumeId provided, looking for latest resume...');
        
        // For now, we'll check localStorage for the latest resumeId
        // In a real app, you'd query Firestore for the user's latest resume
        const latestResumeId = localStorage.getItem('latestResumeId');
        
        if (latestResumeId) {
          resumeIdToUse = latestResumeId;
          console.log('Found latest resume in localStorage:', resumeIdToUse);
          
          // Update URL with the found resumeId
          router.replace(`/tailor?resumeId=${resumeIdToUse}`);
        } else {
          console.log('No resume found, redirecting to upload');
          toast.error('No resume found. Please upload a resume first.');
          router.push('/upload');
          return;
        }
      }

      // Set the current resume ID
      setCurrentResumeId(resumeIdToUse);

      // Simulate loading the resume (replace with actual API call)
      setState(prev => ({ ...prev, step: 'input' }));
      console.log('Resume loaded successfully with ID:', resumeIdToUse);
      
    } catch (error) {
      console.error('Error loading master resume:', error);
      toast.error('Failed to load resume data');
      router.push('/upload');
    }
  };

  const handleAnalyze = async (jobData: {
    jobDescription: string;
    jobTitle?: string;
    company?: string;
    location?: string;
    jobUrl?: string;
  }) => {
    if (!user || !currentResumeId) {
      toast.error('No resume loaded. Please try uploading again.');
      router.push('/upload');
      return;
    }

    setState(prev => ({ ...prev, step: 'analyzing' }));

    try {
      console.log('Starting AI parsing and tailoring with resumeId:', currentResumeId);
      
      // Call the enhanced parse API that does both parsing and tailoring
      const response = await fetch('/api/resume/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeId: currentResumeId,
          jobDescription: jobData.jobDescription,
          jobTitle: jobData.jobTitle,
          company: jobData.company,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to process resume');
      }

      console.log('AI parsing and tailoring completed successfully');

      // If we got tailored content directly from parsing
      if (result.data.tailored) {
        const tailoredContent = result.data.content;
        
        // Create comparison (original vs tailored)
        // For now, we'll show the tailored content as both since we don't store original separately
        const comparison = {
          original: tailoredContent, // In future, get original from master resume
          tailored: tailoredContent,
          changes: [
            {
              section: 'summary' as keyof ResumeContent,
              type: 'modified' as const,
              description: 'Professional summary optimized for job requirements',
            },
            {
              section: 'skills' as keyof ResumeContent,
              type: 'reordered' as const,
              description: 'Technical skills reordered to prioritize job-relevant technologies',
            },
            {
              section: 'experience' as keyof ResumeContent,
              type: 'modified' as const,
              description: 'Experience descriptions enhanced with relevant keywords',
            }
          ],
        };

        // Create a mock tailored resume ID
        const tailoredResumeId = `${currentResumeId}_tailored_${Date.now()}`;

        setState(prev => ({
          ...prev,
          step: 'results',
          masterResume: tailoredContent, // For now, same as tailored
          comparison,
          tailoredResumeId,
          atsScore: 85, // Mock ATS score
          jobTitle: jobData.jobTitle,
          company: jobData.company,
          jobDescription: jobData.jobDescription
        }));

        toast.success('Resume tailored successfully!');
      } else {
        // If only basic parsing was done, show error
        throw new Error('Job description is required for tailoring');
      }

    } catch (error: any) {
      console.error('Analysis error:', error);
      setState(prev => ({ ...prev, step: 'input' }));
      toast.error(error.message || 'Failed to analyze job description');
    }
  };

  const handleGeneratePdf = async () => {
    if (!user || !state.comparison?.tailored) {
      toast.error('No tailored resume available for PDF generation');
      return;
    }

    setState(prev => ({ ...prev, isGeneratingPdf: true }));

    try {
      console.log('Starting PDF generation...');

      // First try: Simple @react-pdf/renderer approach
      console.log('Trying approach 1: @react-pdf/renderer...');
      
      let response = await fetch('/api/pdf/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: state.comparison.tailored,
          userId: user.uid,
          jobTitle: state.jobTitle,
          company: state.company,
        }),
      });

      let result = await response.json();

      // If first approach fails, try jsPDF fallback
      if (!result.success) {
        console.log('Approach 1 failed, trying approach 2: jsPDF...');
        
        response = await fetch('/api/pdf/generate-jspdf', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: state.comparison.tailored,
            userId: user.uid,
            jobTitle: state.jobTitle,
            company: state.company,
          }),
        });

        result = await response.json();
      }

      if (!result.success) {
        throw new Error(result.error || 'Both PDF generation methods failed');
      }

      console.log('PDF generated successfully:', result.data.downloadURL);
      console.log('Generated using:', result.data.generator || '@react-pdf/renderer');

      // Open PDF in new tab for immediate viewing
      window.open(result.data.downloadURL, '_blank');
      
      // Trigger download using base64 data (avoids CORS issues)
      try {
        if (result.data.pdfBase64) {
          // Convert base64 to blob
          const base64Data = result.data.pdfBase64;
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const pdfBlob = new Blob([byteArray], { type: 'application/pdf' });
          
          // Create blob URL for download
          const blobUrl = window.URL.createObjectURL(pdfBlob);
          
          // Create and trigger download
          const downloadLink = document.createElement('a');
          downloadLink.href = blobUrl;
          downloadLink.download = result.data.fileName;
          downloadLink.style.display = 'none';
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          
          // Clean up blob URL
          window.URL.revokeObjectURL(blobUrl);
          
          console.log('PDF download triggered successfully');
        } else {
          console.warn('No base64 PDF data available for download');
          toast.info('PDF opened in new tab. Right-click to save if needed.');
        }
      } catch (downloadError) {
        console.error('Download failed:', downloadError);
        toast.error('PDF viewing successful, but download failed. You can right-click on the PDF tab to save it manually.');
      }
      
      const generatorInfo = result.data.generator ? ` (${result.data.generator})` : '';
      toast.success(`PDF generated successfully${generatorInfo}! Opening in new tab and downloading...`);

    } catch (error: any) {
      console.error('PDF generation error:', error);
      
      // If both approaches fail, show detailed error
      const errorMessage = error.message || 'Failed to generate PDF with both methods';
      toast.error(`PDF Generation Failed: ${errorMessage}`);
      
      // Offer alternative download method
      toast.info('Tip: You can copy the resume text and paste into a document editor as an alternative.');
      
    } finally {
      setState(prev => ({ ...prev, isGeneratingPdf: false }));
    }
  };

  const handleStartOver = () => {
    setState({ step: 'input' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push('/dashboard')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Button>
            
            <Badge variant="outline">Resume ID: {resumeId}</Badge>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900">AI Resume Tailoring</h1>
          <p className="mt-2 text-gray-600">
            Optimize your resume for specific job opportunities using AI analysis
          </p>
        </div>

        {/* Progress Steps */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-8">
              <div className={`flex items-center space-x-2 ${
                state.step === 'input' ? 'text-blue-600' : 
                state.step === 'analyzing' || state.step === 'results' ? 'text-green-600' : 'text-gray-400'
              }`}>
                {state.step === 'analyzing' || state.step === 'results' ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-current flex items-center justify-center">
                    <div className={`h-2 w-2 rounded-full ${state.step === 'input' ? 'bg-current' : ''}`} />
                  </div>
                )}
                <span className="font-medium">1. Job Description</span>
              </div>
              
              <div className={`flex items-center space-x-2 ${
                state.step === 'analyzing' ? 'text-blue-600' : 
                state.step === 'results' ? 'text-green-600' : 'text-gray-400'
              }`}>
                {state.step === 'analyzing' ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : state.step === 'results' ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-current" />
                )}
                <span className="font-medium">2. AI Analysis</span>
              </div>
              
              <div className={`flex items-center space-x-2 ${
                state.step === 'results' ? 'text-blue-600' : 'text-gray-400'
              }`}>
                <div className={`h-5 w-5 rounded-full border-2 border-current flex items-center justify-center ${
                  state.step === 'results' ? 'bg-current' : ''
                }`}>
                  {state.step === 'results' && <Sparkles className="h-3 w-3 text-white" />}
                </div>
                <span className="font-medium">3. Tailored Resume</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content based on current step */}
        {state.step === 'input' && (
          <JobDescriptionInput
            onAnalyze={handleAnalyze}
            isAnalyzing={false}
          />
        )}

        {state.step === 'analyzing' && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Sparkles className="mx-auto h-16 w-16 text-blue-500 animate-spin mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  AI is analyzing your resume...
                </h3>
                <p className="text-gray-600 mb-4">
                  Our AI is comparing your resume with the job requirements and optimizing it for maximum impact.
                </p>
                <div className="max-w-md mx-auto">
                  <div className="flex justify-between text-sm text-gray-500 mb-2">
                    <span>Analyzing job requirements...</span>
                    <span>⚡</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500 mb-2">
                    <span>Optimizing content...</span>
                    <span>🎯</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Generating tailored resume...</span>
                    <span>✨</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {state.step === 'results' && state.comparison && (
          <div className="space-y-6">
            <ResumeComparison
              comparison={state.comparison}
              atsScore={state.atsScore}
              onGeneratePdf={handleGeneratePdf}
              isGeneratingPdf={state.isGeneratingPdf}
            />
            
            {/* Action Buttons */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button onClick={handleStartOver} variant="outline" size="lg">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Tailor for Another Job
                  </Button>
                  <Button 
                    onClick={() => router.push('/dashboard')} 
                    variant="outline" 
                    size="lg"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Back to Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
} 