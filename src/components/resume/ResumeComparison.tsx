'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResumeContent, ResumeComparison as ResumeComparisonType } from '@/types';
import { 
  FileText, 
  Sparkles, 
  Download,
  Eye,
  ArrowRight,
  CheckCircle,
  Target,
  Award
} from 'lucide-react';

interface ResumeComparisonProps {
  comparison: ResumeComparisonType;
  atsScore?: number;
  onGeneratePdf: () => void;
  isGeneratingPdf: boolean;
}

export const ResumeComparison: React.FC<ResumeComparisonProps> = ({
  comparison,
  atsScore = 0,
  onGeneratePdf,
  isGeneratingPdf
}) => {
  const [selectedTab, setSelectedTab] = useState('comparison');

  const { original, tailored, changes } = comparison;

  // Helper function to handle description that might be string or array
  const renderDescriptions = (descriptions: any, limit: number = 2) => {
    if (!descriptions) return [];
    
    if (Array.isArray(descriptions)) {
      return descriptions.slice(0, limit).map((desc: string, index: number) => (
        <li key={index}>• {desc}</li>
      ));
    } else if (typeof descriptions === 'string') {
      return [<li key={0}>• {descriptions}</li>];
    }
    return [];
  };

  const getDescriptionLength = (descriptions: any) => {
    if (!descriptions) return 0;
    if (Array.isArray(descriptions)) return descriptions.length;
    if (typeof descriptions === 'string') return 1;
    return 0;
  };

  const renderSection = (title: string, originalContent: any, tailoredContent: any, sectionKey: string) => {
    const hasChanges = changes.some(change => change.section === sectionKey);
    
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {hasChanges && (
            <Badge variant="secondary" className="text-xs">
              <Sparkles className="w-3 h-3 mr-1" />
              Modified
            </Badge>
          )}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Original */}
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <FileText className="w-4 h-4 mr-1" />
                Original
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {renderSectionContent(originalContent, sectionKey)}
            </CardContent>
          </Card>
          
          {/* Tailored */}
          <Card className={`border-2 ${hasChanges ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200'}`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-600 flex items-center">
                <Sparkles className="w-4 h-4 mr-1" />
                AI-Tailored
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {renderSectionContent(tailoredContent, sectionKey)}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderSectionContent = (content: any, sectionKey: string) => {
    if (!content) return <p className="text-gray-500 text-sm">No content</p>;

    switch (sectionKey) {
      case 'professionalSummary':
        return <p className="text-sm text-gray-700 leading-relaxed">{content}</p>;
      
      case 'skills':
        return (
          <div className="space-y-3">
            {content.technical && Array.isArray(content.technical) && content.technical.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-2">Technical Skills</h4>
                <div className="flex flex-wrap gap-1">
                  {content.technical.slice(0, 10).map((skill: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {content.technical.length > 10 && (
                    <Badge variant="outline" className="text-xs">
                      +{content.technical.length - 10} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      
      case 'experience':
        return (
          <div className="space-y-3">
            {content.slice(0, 2).map((exp: any, index: number) => (
              <div key={index} className="border-l-2 border-gray-200 pl-3">
                <h4 className="text-sm font-medium text-gray-900">{exp.title}</h4>
                <p className="text-xs text-gray-600 mb-1">{exp.company} • {exp.duration}</p>
                <ul className="text-xs text-gray-700 space-y-1">
                  {renderDescriptions(exp.description, 2)}
                  {getDescriptionLength(exp.description) > 2 && (
                    <li className="text-gray-500">• +{getDescriptionLength(exp.description) - 2} more points</li>
                  )}
                </ul>
              </div>
            ))}
            {content.length > 2 && (
              <p className="text-xs text-gray-500">+{content.length - 2} more experiences</p>
            )}
          </div>
        );
      
      case 'projects':
        return (
          <div className="space-y-3">
            {content.slice(0, 2).map((project: any, index: number) => (
              <div key={index} className="border-l-2 border-gray-200 pl-3">
                <h4 className="text-sm font-medium text-gray-900">{project.name}</h4>
                <p className="text-xs text-gray-700 mb-1">{project.description}</p>
                {project.achievements && getDescriptionLength(project.achievements) > 0 && (
                  <ul className="text-xs text-gray-600">
                    {renderDescriptions(project.achievements, 2)}
                  </ul>
                )}
              </div>
            ))}
            {content.length > 2 && (
              <p className="text-xs text-gray-500">+{content.length - 2} more projects</p>
            )}
          </div>
        );
      
      default:
        return <p className="text-sm text-gray-700">{JSON.stringify(content)}</p>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with ATS Score */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Resume Tailoring Complete!
              </h2>
              <p className="text-gray-600">
                Your resume has been optimized for this specific job opportunity.
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* ATS Score */}
              <div className="text-center">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-2">
                  <span className="text-xl font-bold text-blue-600">{atsScore}</span>
                </div>
                <p className="text-xs text-gray-600">ATS Score</p>
              </div>
              
              {/* Download Button */}
              <Button onClick={onGeneratePdf} disabled={isGeneratingPdf} size="lg">
                {isGeneratingPdf ? (
                  <>
                    <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Changes Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>What Changed</span>
          </CardTitle>
          <CardDescription>
            Summary of AI optimizations made to your resume
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {changes.length > 0 ? (
              changes.map((change, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 capitalize">
                      {change.section.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </h4>
                    <p className="text-xs text-gray-600 mt-1">{change.description}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-4">
                <Award className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">No changes needed - your resume already looks great!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Comparison Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="comparison">Overview</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="experience">Experience</TabsTrigger>
        </TabsList>
        
        <TabsContent value="comparison" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Original Resume</CardTitle>
                <CardDescription>Your current resume content</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-gray-600">
                  <p><strong>Name:</strong> {original.personalInfo.name}</p>
                  <p><strong>Email:</strong> {original.personalInfo.email}</p>
                  <p><strong>Technical Skills:</strong> {original.skills?.technical?.length || 0} skills</p>
                  <p><strong>Experience:</strong> {original.experience?.length || 0} positions</p>
                  <p><strong>Projects:</strong> {original.projects?.length || 0} projects</p>
                </div>
                
                {/* DEBUG: Show actual sections in original resume */}
                <div className="p-3 bg-gray-50 border border-gray-200 rounded text-sm">
                  <p className="font-semibold text-gray-800 mb-1">📄 Original Resume Sections:</p>
                  <p className="text-gray-700">
                    {Object.keys(original).filter(key => key !== 'personalInfo').map(section => 
                      section.charAt(0).toUpperCase() + section.slice(1)
                    ).join(', ') || 'Only Personal Info'}
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-blue-200 bg-blue-50/30">
              <CardHeader>
                <CardTitle className="text-base text-blue-700">Tailored Resume</CardTitle>
                <CardDescription>AI-optimized for this job</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-gray-600">
                  <p><strong>Name:</strong> {tailored.personalInfo.name}</p>
                  <p><strong>Email:</strong> {tailored.personalInfo.email}</p>
                  <p><strong>Technical Skills:</strong> {tailored.skills?.technical?.length || 0} skills (reordered)</p>
                  <p><strong>Experience:</strong> {tailored.experience?.length || 0} positions (enhanced)</p>
                  <p><strong>Projects:</strong> {tailored.projects?.length || 0} projects (optimized)</p>
                </div>
                
                {/* DEBUG: Show actual sections in generated resume */}
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
                  <p className="font-semibold text-yellow-800 mb-1">🔍 Generated Resume Sections:</p>
                  <p className="text-yellow-700">
                    {Object.keys(tailored).filter(key => key !== 'personalInfo').map(section => 
                      section.charAt(0).toUpperCase() + section.slice(1)
                    ).join(', ') || 'Only Personal Info'}
                  </p>
                  <p className="text-xs text-yellow-600 mt-1">
                    This should match your original resume sections exactly
                  </p>
                </div>
                
                <div className="pt-3 border-t border-blue-200">
                  <Badge className="bg-blue-100 text-blue-700">
                    <Sparkles className="w-3 h-3 mr-1" />
                    AI-Optimized
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="summary" className="mt-6">
          {renderSection('Professional Summary', original.professionalSummary, tailored.professionalSummary, 'professionalSummary')}
        </TabsContent>
        
        <TabsContent value="skills" className="mt-6">
          {renderSection('Skills', original.skills, tailored.skills, 'skills')}
        </TabsContent>
        
        <TabsContent value="experience" className="mt-6">
          {renderSection('Experience', original.experience, tailored.experience, 'experience')}
        </TabsContent>
      </Tabs>
    </div>
  );
}; 