'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { validatePdfFile, formatFileSize } from '@/lib/pdf-utils';
import { toast } from 'sonner';
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  X
} from 'lucide-react';

interface UploadProgress {
  phase: 'uploading' | 'parsing' | 'complete';
  percentage: number;
  message: string;
}

interface ResumeUploadState {
  isUploading: boolean;
  isParsing: boolean;
  isComplete: boolean;
  error?: string;
  resumeId?: string;
}

export const ResumeUpload: React.FC = () => {
  const [uploadState, setUploadState] = useState<ResumeUploadState>({
    isUploading: false,
    isParsing: false,
    isComplete: false,
    error: undefined,
    resumeId: undefined
  });
  
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    phase: 'uploading',
    percentage: 0,
    message: ''
  });

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  const updateProgress = (phase: UploadProgress['phase'], percentage: number, message: string) => {
    setUploadProgress({ phase, percentage, message });
  };

  const uploadResume = async (file: File) => {
    if (!user) {
      toast.error('Please sign in to upload your resume');
      return;
    }

    // Validate file
    const validation = validatePdfFile(file);
    if (!validation.isValid) {
      toast.error(validation.error);
      return;
    }

    setUploadState({
      isUploading: true,
      isParsing: false,
      isComplete: false,
      error: undefined,
      resumeId: undefined
    });

    setUploadedFile(file);

    try {
      // Phase 1: Upload file
      updateProgress('uploading', 10, 'Preparing file upload...');

      const formData = new FormData();
      formData.append('resume', file);
      formData.append('userId', user.uid); // Add user ID to form data

      updateProgress('uploading', 30, 'Uploading to secure storage...');

      const uploadResponse = await fetch('/api/resume/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadResult = await uploadResponse.json();

      if (!uploadResult.success) {
        throw new Error(uploadResult.message || 'Upload failed');
      }

      updateProgress('uploading', 60, 'Upload complete! Starting analysis...');

      // Phase 2: Parse the uploaded PDF
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        isParsing: true,
        resumeId: uploadResult.data.resumeId
      }));

      updateProgress('parsing', 70, 'Extracting text from PDF...');

      const parseResponse = await fetch('/api/resume/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeId: uploadResult.data.resumeId,
        }),
      });

      const parseResult = await parseResponse.json();

      if (!parseResult.success) {
        throw new Error(parseResult.message || 'Failed to parse resume');
      }

      updateProgress('parsing', 90, 'Analyzing resume structure...');

      // Simulate final processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Phase 3: Complete
      updateProgress('complete', 100, 'Resume processed successfully!');

      setUploadState({
        isUploading: false,
        isParsing: false,
        isComplete: true,
        error: undefined,
        resumeId: uploadResult.data.resumeId
      });

      // Save resumeId to localStorage for easy access
      localStorage.setItem('latestResumeId', uploadResult.data.resumeId);

      toast.success('Resume uploaded and processed successfully!');

      // Redirect to tailor page after a brief delay
      setTimeout(() => {
        router.push(`/tailor?resumeId=${uploadResult.data.resumeId}`);
      }, 2000);

    } catch (error: any) {
      console.error('Upload/parse error:', error);
      
      setUploadState({
        isUploading: false,
        isParsing: false,
        isComplete: false,
        error: error.message || 'An unexpected error occurred',
        resumeId: undefined
      });

      toast.error(error.message || 'Failed to process resume');
    }
  };

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      uploadResume(acceptedFiles[0]);
    }
  };

  const resetUpload = () => {
    setUploadState({
      isUploading: false,
      isParsing: false,
      isComplete: false,
      error: undefined,
      resumeId: undefined
    });
    setUploadedFile(null);
    setUploadProgress({
      phase: 'uploading',
      percentage: 0,
      message: ''
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: false,
    disabled: uploadState.isUploading || uploadState.isParsing || uploadState.isComplete
  });

  const isProcessing = uploadState.isUploading || uploadState.isParsing;
  const hasError = !!uploadState.error;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Upload Your Resume</CardTitle>
          <CardDescription>
            Upload your PDF resume to get started with AI-powered tailoring
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Upload Area */}
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
              ${isDragActive ? 'border-blue-500 bg-blue-50' : 
                hasError ? 'border-red-300 bg-red-50' :
                uploadState.isComplete ? 'border-green-300 bg-green-50' :
                'border-gray-300 hover:border-gray-400'}
              ${isProcessing || uploadState.isComplete ? 'pointer-events-none' : ''}
            `}
          >
            <input {...getInputProps()} />
            
            {/* Upload States */}
            {!isProcessing && !uploadState.isComplete && !hasError && (
              <div className="space-y-4">
                <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    {isDragActive ? 'Drop your resume here' : 'Upload your resume'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Drag & drop your PDF resume or click to browse
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    PDF only, max 5MB
                  </p>
                </div>
              </div>
            )}

            {/* Processing State */}
            {isProcessing && (
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                  {uploadProgress.phase === 'uploading' && <Upload className="w-8 h-8 text-blue-600" />}
                  {uploadProgress.phase === 'parsing' && <FileText className="w-8 h-8 text-blue-600" />}
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    {uploadProgress.phase === 'uploading' ? 'Uploading...' : 'Processing...'}
                  </p>
                  <p className="text-sm text-gray-600">{uploadProgress.message}</p>
                </div>
                <Progress value={uploadProgress.percentage} className="w-full max-w-xs mx-auto" />
              </div>
            )}

            {/* Success State */}
            {uploadState.isComplete && (
              <div className="space-y-4">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
                <div>
                  <p className="text-lg font-medium text-green-900">
                    Resume uploaded successfully!
                  </p>
                  <p className="text-sm text-green-600">
                    Redirecting to tailoring page...
                  </p>
                </div>
                {uploadedFile && (
                  <div className="bg-green-100 rounded-lg p-3 text-sm">
                    <p className="font-medium text-green-900">{uploadedFile.name}</p>
                    <p className="text-green-700">{formatFileSize(uploadedFile.size)}</p>
                  </div>
                )}
              </div>
            )}

            {/* Error State */}
            {hasError && (
              <div className="space-y-4">
                <AlertCircle className="w-12 h-12 text-red-600 mx-auto" />
                <div>
                  <p className="text-lg font-medium text-red-900">
                    Upload failed
                  </p>
                  <p className="text-sm text-red-600">
                    {uploadState.error}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {hasError && (
            <div className="flex justify-center">
              <Button onClick={resetUpload} variant="outline">
                <X className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          )}

          {uploadState.isComplete && (
            <div className="flex justify-center space-x-3">
              <Button 
                onClick={() => router.push(`/tailor?resumeId=${uploadState.resumeId}`)} 
                className="flex-1"
              >
                Continue to Tailoring
              </Button>
              <Button onClick={resetUpload} variant="outline">
                Upload Another
              </Button>
            </div>
          )}

          {/* Instructions */}
          {!isProcessing && !uploadState.isComplete && !hasError && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">Tips for best results:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Use a well-formatted PDF resume</li>
                <li>• Include clear section headers (Experience, Skills, etc.)</li>
                <li>• Ensure text is selectable (not just an image)</li>
                <li>• Keep file size under 5MB</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 