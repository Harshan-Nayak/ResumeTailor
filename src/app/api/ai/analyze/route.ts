import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, COLLECTIONS } from '@/lib/firebase';
import { 
  analyzeJobDescription, 
  generateTailoringSuggestions, 
  applyTailoringSuggestions 
} from '@/lib/ai-service';
import { TailoredResume, ResumeContent } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { 
      resumeId, 
      userId, 
      jobDescription, 
      jobTitle, 
      company 
    } = await request.json();

    console.log('AI Analyze API: Received request:', { resumeId, userId, jobTitle, company });

    // Validate inputs
    if (!resumeId || !userId || !jobDescription) {
      console.log('AI Analyze API: Missing required fields');
      return NextResponse.json(
        { success: false, error: 'Resume ID, User ID, and job description are required' },
        { status: 400 }
      );
    }

    // Get the master resume
    const resumeDoc = await getDoc(doc(db, COLLECTIONS.MASTER_RESUMES, resumeId));
    
    if (!resumeDoc.exists()) {
      console.log('AI Analyze API: Resume not found:', resumeId);
      return NextResponse.json(
        { success: false, error: 'Resume not found' },
        { status: 404 }
      );
    }

    const resumeData = resumeDoc.data();
    console.log('AI Analyze API: Resume data userId:', resumeData.userId, 'Request userId:', userId);
    
    // Verify ownership
    if (resumeData.userId !== userId) {
      console.log('AI Analyze API: Ownership verification failed');
      return NextResponse.json(
        { success: false, error: `Unauthorized access. Resume belongs to ${resumeData.userId}, request from ${userId}` },
        { status: 403 }
      );
    }

    // Check if resume has been parsed
    const masterResumeContent = resumeData.content; // Updated field name
    
    if (!masterResumeContent || !masterResumeContent.personalInfo) {
      console.log('AI Analyze API: Resume not parsed yet');
      return NextResponse.json(
        { success: false, error: 'Resume has not been parsed yet. Please wait for parsing to complete.' },
        { status: 400 }
      );
    }

    console.log('AI Analyze API: Starting AI analysis...');

    // For now, create mock responses to test the flow
    // TODO: Replace with actual AI service calls when API keys are configured
    
    const jobAnalysis = {
      requiredSkills: ['JavaScript', 'React', 'Node.js'],
      preferredSkills: ['TypeScript', 'AWS', 'Docker'],
      technologies: ['React', 'Node.js', 'MongoDB'],
      experienceLevel: 'mid',
      industryFocus: ['Technology', 'Software'],
      keyResponsibilities: ['Develop web applications', 'Collaborate with team'],
      keywords: ['frontend', 'backend', 'full-stack']
    };

    const tailoringSuggestions = {
      summaryEnhancements: 'Enhance summary to highlight full-stack development experience',
      skillsReordering: ['JavaScript', 'React', 'Node.js', 'TypeScript'],
      experienceOptimizations: ['Emphasize web application development', 'Highlight team collaboration'],
      keywordIntegration: ['full-stack', 'frontend', 'backend'],
      projectHighlights: ['Focus on React-based projects']
    };

    // Create a tailored version of the resume content
    const tailoredContent = {
      ...masterResumeContent,
      summary: `${masterResumeContent.summary} Experienced in full-stack development with React and Node.js.`,
      skills: {
        ...masterResumeContent.skills,
        technical: ['JavaScript', 'React', 'Node.js', 'TypeScript', ...masterResumeContent.skills.technical.filter((skill: string) => !['JavaScript', 'React', 'Node.js', 'TypeScript'].includes(skill))]
      }
    };

    /* 
    // Uncomment this section when AI API keys are configured
    
    // Step 1: Analyze the job description
    const jobAnalysis = await analyzeJobDescription(jobDescription);

    // Step 2: Generate tailoring suggestions
    const tailoringSuggestions = await generateTailoringSuggestions(
      masterResumeContent,
      jobAnalysis,
      jobDescription
    );

    // Step 3: Apply suggestions to create tailored resume
    const tailoredContent = applyTailoringSuggestions(
      masterResumeContent,
      tailoringSuggestions
    );
    */

    // Step 4: Save the tailored resume
    const tailoredResumeId = `${userId}_${Date.now()}_tailored`;
    const tailoredResume: TailoredResume = {
      id: tailoredResumeId,
      userId,
      masterResumeId: resumeId,
      jobDescription,
      tailoredContent,
      createdAt: new Date(),
      jobTitle: jobTitle || 'Position',
      company: company || 'Company',
      applicationStatus: 'draft',
    };

    console.log('AI Analyze API: Saving tailored resume:', tailoredResumeId);

    // Save to Firestore
    await setDoc(doc(db, COLLECTIONS.TAILORED_RESUMES, tailoredResumeId), {
      ...tailoredResume,
      createdAt: tailoredResume.createdAt.toISOString(),
    });

    console.log('AI Analyze API: Analysis completed successfully');

    return NextResponse.json({
      success: true,
      data: {
        tailoredResumeId,
        jobAnalysis,
        tailoringSuggestions,
        tailoredContent,
        comparison: {
          original: masterResumeContent,
          tailored: tailoredContent,
          changes: generateChangesSummary(masterResumeContent, tailoredContent),
        },
      },
      message: 'Resume tailored successfully',
    });

  } catch (error) {
    console.error('AI Analyze API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to analyze and tailor resume' 
      },
      { status: 500 }
    );
  }
}

/**
 * Generate a summary of changes between original and tailored resume
 */
function generateChangesSummary(original: ResumeContent, tailored: ResumeContent) {
  const changes = [];

  // Professional summary changes
  if (original.professionalSummary !== tailored.professionalSummary) {
    changes.push({
      section: 'professionalSummary' as keyof ResumeContent,
      type: 'modified' as const,
      description: 'Professional summary optimized for job requirements',
    });
  }

  // Skills reordering
  if (JSON.stringify(original.skills.technical) !== JSON.stringify(tailored.skills.technical)) {
    changes.push({
      section: 'skills' as keyof ResumeContent,
      type: 'reordered' as const,
      description: 'Technical skills reordered to prioritize job-relevant technologies',
    });
  }

  // Experience modifications
  for (let i = 0; i < Math.min(original.experience.length, tailored.experience.length); i++) {
    if (JSON.stringify(original.experience[i].description) !== JSON.stringify(tailored.experience[i].description)) {
      changes.push({
        section: 'experience' as keyof ResumeContent,
        type: 'modified' as const,
        description: `Experience entry ${i + 1} enhanced with relevant keywords and achievements`,
      });
    }
  }

  // Project modifications
  for (let i = 0; i < Math.min(original.projects.length, tailored.projects.length); i++) {
    if (original.projects[i].description !== tailored.projects[i].description ||
        JSON.stringify(original.projects[i].achievements) !== JSON.stringify(tailored.projects[i].achievements)) {
      changes.push({
        section: 'projects' as keyof ResumeContent,
        type: 'modified' as const,
        description: `Project ${i + 1} description and achievements optimized for job relevance`,
      });
    }
  }

  return changes;
}

export async function GET() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  );
} 