'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Sparkles, 
  Target,
  FileText,
  Building,
  MapPin,
  Link as LinkIcon
} from 'lucide-react';

interface JobDescriptionInputProps {
  onAnalyze: (jobData: {
    jobDescription: string;
    jobTitle?: string;
    company?: string;
    location?: string;
    jobUrl?: string;
  }) => void;
}

export const JobDescriptionInput: React.FC<JobDescriptionInputProps> = ({ onAnalyze }) => {
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (!jobDescription.trim()) {
      toast.error('Please enter a job description');
      return;
    }

    if (jobDescription.trim().length < 100) {
      toast.error('Job description seems too short. Please provide a more detailed description.');
      return;
    }

    setIsAnalyzing(true);
    
    try {
      await onAnalyze({
        jobDescription: jobDescription.trim(),
        jobTitle: jobTitle.trim() || undefined,
        company: company.trim() || undefined,
        location: location.trim() || undefined,
        jobUrl: jobUrl.trim() || undefined,
      });
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const characterCount = jobDescription.length;
  const maxCharacters = 10000;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Target className="h-8 w-8 text-blue-600" />
            <Sparkles className="h-6 w-6 text-yellow-500" />
          </div>
          <CardTitle className="text-2xl font-bold">AI Resume Tailoring</CardTitle>
          <CardDescription>
            Provide the job details below. Our AI will analyze your resume and the job requirements 
            to create a perfectly tailored, ATS-optimized resume in one step.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Job Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jobTitle" className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Job Title</span>
              </Label>
              <Input
                id="jobTitle"
                placeholder="e.g., Senior Software Engineer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                disabled={isAnalyzing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company" className="flex items-center space-x-2">
                <Building className="h-4 w-4" />
                <span>Company</span>
              </Label>
              <Input
                id="company"
                placeholder="e.g., Google, Microsoft"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                disabled={isAnalyzing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>Location</span>
              </Label>
              <Input
                id="location"
                placeholder="e.g., San Francisco, CA or Remote"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={isAnalyzing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jobUrl" className="flex items-center space-x-2">
                <LinkIcon className="h-4 w-4" />
                <span>Job URL (Optional)</span>
              </Label>
              <Input
                id="jobUrl"
                placeholder="https://company.com/careers/job-id"
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                disabled={isAnalyzing}
              />
            </div>
          </div>

          {/* Job Description */}
          <div className="space-y-2">
            <Label htmlFor="jobDescription" className="text-base font-semibold">
              Job Description *
            </Label>
            <Textarea
              id="jobDescription"
              placeholder="Paste the complete job description here...

Include:
• Required skills and qualifications
• Job responsibilities and duties  
• Preferred experience and background
• Technology stack and tools
• Company culture and values

The more detailed the description, the better the AI can tailor your resume!"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              disabled={isAnalyzing}
              className="min-h-[300px] resize-none"
              maxLength={maxCharacters}
            />
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center space-x-4">
                <span className={`${characterCount < 100 ? 'text-red-500' : characterCount > maxCharacters * 0.8 ? 'text-yellow-500' : 'text-green-600'}`}>
                  {characterCount} / {maxCharacters} characters
                </span>
                {characterCount < 100 && (
                  <Badge variant="destructive" className="text-xs">
                    Too short
                  </Badge>
                )}
                {characterCount >= 100 && characterCount <= 500 && (
                  <Badge variant="secondary" className="text-xs">
                    Good length
                  </Badge>
                )}
                {characterCount > 500 && (
                  <Badge variant="default" className="text-xs">
                    Detailed
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-center pt-4">
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !jobDescription.trim() || characterCount < 100}
              size="lg"
              className="px-8 py-3 text-lg"
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Tailoring Resume...
                </>
              ) : (
                <>
                  <Sparkles className="mr-3 h-5 w-5" />
                  Tailor Resume with AI
                </>
              )}
            </Button>
          </div>

          {/* Help Text */}
          <div className="bg-blue-50 rounded-lg p-4 text-sm">
            <h4 className="font-semibold text-blue-900 mb-2">💡 Pro Tips:</h4>
            <ul className="text-blue-800 space-y-1">
              <li>• Include the complete job posting for best results</li>
              <li>• Copy technical requirements, skills, and qualifications</li>
              <li>• Include company values and culture information</li>
              <li>• The AI will automatically optimize your resume for ATS systems</li>
              <li>• Your original resume content will never be fabricated or made up</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 