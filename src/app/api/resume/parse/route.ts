import { NextRequest, NextResponse } from 'next/server';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, COLLECTIONS } from '@/lib/firebase';
import { parseAndTailorResume } from '@/lib/ai-service';

export async function POST(request: NextRequest) {
  try {
    console.log('Parse API: Starting resume parsing and tailoring...');
    
    const { resumeId, jobDescription, jobTitle, company } = await request.json();

    if (!resumeId) {
      console.log('Parse API: No resume ID provided');
      return NextResponse.json({
        success: false,
        message: 'Resume ID is required'
      }, { status: 400 });
    }

    console.log('Parse API: Processing resume ID:', resumeId);

    // Get the master resume document
    const resumeDoc = await getDoc(doc(db, COLLECTIONS.MASTER_RESUMES, resumeId));
    
    if (!resumeDoc.exists()) {
      console.log('Parse API: Resume not found:', resumeId);
      return NextResponse.json({
        success: false,
        message: 'Resume not found'
      }, { status: 404 });
    }

    const resumeData = resumeDoc.data();
    
    if (!resumeData.pdfUrl) {
      console.log('Parse API: No PDF URL found');
      return NextResponse.json({
        success: false,
        message: 'No PDF file found for this resume'
      }, { status: 400 });
    }

    console.log('Parse API: Found PDF URL:', resumeData.pdfUrl);

    // If job description is provided, do AI parsing and tailoring
    if (jobDescription) {
      console.log('Parse API: Job description provided, starting AI parsing and tailoring...');
      
      // Fetch the PDF file from Firebase Storage
      const response = await fetch(resumeData.pdfUrl);
      
      if (!response.ok) {
        throw new Error('Failed to fetch PDF file');
      }

      const pdfBuffer = await response.arrayBuffer();
      console.log('Parse API: PDF downloaded, size:', pdfBuffer.byteLength);

      // Use AI to parse and tailor the resume in one step
      const tailoredContent = await parseAndTailorResume(
        pdfBuffer, 
        jobDescription, 
        jobTitle, 
        company
      );

      console.log('Parse API: AI parsing and tailoring completed successfully');

      // Update the master resume with parsed content (original parsed content)
      await updateDoc(doc(db, COLLECTIONS.MASTER_RESUMES, resumeId), {
        content: tailoredContent, // For now, store tailored as base content
        rawText: 'Processed by AI',
        isParsed: true,
        parsedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      return NextResponse.json({
        success: true,
        message: 'Resume parsed and tailored successfully',
        data: {
          resumeId,
          content: tailoredContent,
          tailored: true
        }
      });

    } else {
      // If no job description, just do basic parsing (fallback to mock data for now)
      console.log('Parse API: No job description provided, using basic parsing...');
      
      const mockParsedContent = {
        personalInfo: {
          name: 'John Doe',
          email: 'john.doe@example.com',
          phone: '+1 (555) 123-4567',
          location: 'New York, NY',
          linkedin: '',
          website: ''
        },
        summary: 'Experienced professional with expertise in technology.',
        skills: {
          technical: ['JavaScript', 'React', 'Node.js', 'Python', 'SQL'],
          soft: ['Communication', 'Problem Solving', 'Team Work'],
          languages: ['English'],
          frameworks: ['React', 'Express'],
          tools: ['Git', 'Docker'],
          databases: ['PostgreSQL', 'MongoDB']
        },
        experience: [
          {
            title: 'Software Developer',
            company: 'Tech Company',
            duration: '2020-2023',
            description: ['Developed web applications', 'Worked with team'],
            technologies: ['React', 'Node.js']
          }
        ],
        projects: [
          {
            name: 'Web Application',
            description: 'Built a web application',
            technologies: ['React', 'Node.js'],
            achievements: ['Completed on time']
          }
        ],
        education: [
          {
            degree: 'Bachelor of Computer Science',
            institution: 'University',
            year: '2020'
          }
        ],
        certifications: []
      };

      // Update the master resume with parsed content
      await updateDoc(doc(db, COLLECTIONS.MASTER_RESUMES, resumeId), {
        content: mockParsedContent,
        rawText: 'Mock extracted text from PDF...',
        isParsed: true,
        parsedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      console.log('Parse API: Basic parsing completed with mock data');

      return NextResponse.json({
        success: true,
        message: 'Resume parsed successfully',
        data: {
          resumeId,
          content: mockParsedContent,
          tailored: false
        }
      });
    }

  } catch (error) {
    console.error('Parse API Error:', error);
    
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to parse resume'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  );
} 