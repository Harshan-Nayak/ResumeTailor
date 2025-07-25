import { NextRequest, NextResponse } from 'next/server';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, STORAGE_PATHS } from '@/lib/firebase';
import React from 'react';
import { 
  Document, 
  Page, 
  Text, 
  View, 
  StyleSheet, 
  pdf
} from '@react-pdf/renderer';
import { ResumeContent } from '@/types';

// Professional styles for the resume
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    textAlign: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  contactInfo: {
    fontSize: 10,
    marginBottom: 3,
    color: '#555555',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
    textTransform: 'uppercase',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    paddingBottom: 2,
  },
  subsectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  text: {
    fontSize: 10,
    marginBottom: 4,
    lineHeight: 1.4,
  },
  bulletPoint: {
    fontSize: 10,
    marginBottom: 2,
    marginLeft: 10,
    lineHeight: 1.3,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 5,
  },
  skill: {
    fontSize: 9,
    marginRight: 8,
    marginBottom: 2,
  },
});

// Create resume PDF with comprehensive structure support
const createResumePdf = (content: ResumeContent) => {
  console.log('Creating PDF with sections:', Object.keys(content));
  
  // Validate and sanitize content before PDF generation
  const sanitizedContent = {
    ...content,
    personalInfo: {
      name: content.personalInfo?.name || 'Name',
      email: content.personalInfo?.email || 'email@example.com',
      phone: content.personalInfo?.phone || '',
      location: content.personalInfo?.location || '',
      linkedin: content.personalInfo?.linkedin || '',
      github: content.personalInfo?.github || ''
    }
  };
  
  // Debug data types to understand what we're receiving
  if (content.projects) {
    console.log('Projects data structure:', content.projects.map((project, index) => ({
      index,
      name: project.name,
      description: project.description ? 'has description' : 'no description',
      technologiesType: typeof project.technologies,
      technologiesIsArray: Array.isArray(project.technologies),
      achievementsType: typeof project.achievements,
      achievementsIsArray: Array.isArray(project.achievements)
    })));
  }
  
  return React.createElement(Document, {},
    React.createElement(Page, { size: 'A4', style: styles.page },
      // Header with personal info
      React.createElement(View, { style: styles.header },
        React.createElement(Text, { style: styles.name }, sanitizedContent.personalInfo.name),
        sanitizedContent.personalInfo.email && React.createElement(Text, { style: styles.contactInfo }, sanitizedContent.personalInfo.email),
        sanitizedContent.personalInfo.phone && React.createElement(Text, { style: styles.contactInfo }, sanitizedContent.personalInfo.phone),
        sanitizedContent.personalInfo.location && React.createElement(Text, { style: styles.contactInfo }, sanitizedContent.personalInfo.location),
        sanitizedContent.personalInfo.linkedin && React.createElement(Text, { style: styles.contactInfo }, `LinkedIn: ${sanitizedContent.personalInfo.linkedin}`),
        sanitizedContent.personalInfo.github && React.createElement(Text, { style: styles.contactInfo }, `GitHub: ${sanitizedContent.personalInfo.github}`)
      ),

      // Professional Summary (if exists)
      content.professionalSummary && React.createElement(View, {},
        React.createElement(Text, { style: styles.sectionTitle }, 'PROFESSIONAL SUMMARY'),
        React.createElement(Text, { style: styles.text }, content.professionalSummary)
      ),

      // Education (if exists)
      content.education && content.education.length > 0 && React.createElement(View, {},
        React.createElement(Text, { style: styles.sectionTitle }, 'EDUCATION'),
        ...content.education.map((edu, index) => 
          React.createElement(View, { key: `education-${index}` },
            React.createElement(View, { style: styles.row },
              React.createElement(Text, { style: styles.subsectionTitle }, `${edu.institution} - ${edu.degree}`),
              React.createElement(Text, { style: styles.text }, edu.year)
            ),
            edu.gpa && React.createElement(Text, { style: styles.text }, `GPA: ${edu.gpa}`),
            edu.relevantCourses && Array.isArray(edu.relevantCourses) && edu.relevantCourses.length > 0 && React.createElement(Text, { style: styles.text }, `Relevant Courses: ${edu.relevantCourses.join(', ')}`)
          )
        )
      ),

      // Experience (if exists)
      content.experience && content.experience.length > 0 && React.createElement(View, {},
        React.createElement(Text, { style: styles.sectionTitle }, 'EXPERIENCE'),
        ...content.experience.map((exp, index) => 
          React.createElement(View, { key: `experience-${index}`, style: { marginBottom: 10 } },
            React.createElement(View, { style: styles.row },
              React.createElement(Text, { style: styles.subsectionTitle }, `${exp.company || 'Company'} - ${exp.title || 'Position'}`),
              React.createElement(Text, { style: styles.text }, exp.duration || 'Duration')
            ),
            exp.description && Array.isArray(exp.description) && exp.description.map((desc, descIndex) =>
              React.createElement(Text, { key: `exp-desc-${index}-${descIndex}`, style: styles.bulletPoint }, `• ${desc}`)
            ),
            exp.technologies && Array.isArray(exp.technologies) && exp.technologies.length > 0 && React.createElement(Text, { style: styles.text }, `Technologies: ${exp.technologies.join(', ')}`)
          )
        )
      ),

      // Projects (if exists)
      content.projects && content.projects.length > 0 && React.createElement(View, {},
        React.createElement(Text, { style: styles.sectionTitle }, 'PROJECTS'),
        ...content.projects.map((project, index) => 
          React.createElement(View, { key: `project-${index}`, style: { marginBottom: 10 } },
            React.createElement(Text, { style: styles.subsectionTitle }, project.name || `Project ${index + 1}`),
            project.description && React.createElement(Text, { style: styles.text }, project.description),
            project.achievements && Array.isArray(project.achievements) && project.achievements.length > 0 && project.achievements.map((achievement, achIndex) =>
              React.createElement(Text, { key: `proj-ach-${index}-${achIndex}`, style: styles.bulletPoint }, `• ${achievement}`)
            ),
            project.technologies && Array.isArray(project.technologies) && project.technologies.length > 0 && React.createElement(Text, { style: styles.text }, `Technologies: ${project.technologies.join(', ')}`)
          )
        )
      ),

      // Skills (if exists)
      content.skills && React.createElement(View, {},
        React.createElement(Text, { style: styles.sectionTitle }, 'SKILLS'),
        content.skills.technical && Array.isArray(content.skills.technical) && content.skills.technical.length > 0 && React.createElement(View, {},
          React.createElement(Text, { style: styles.subsectionTitle }, 'Technical Skills'),
          React.createElement(View, { style: styles.skillsContainer },
            ...content.skills.technical.map((skill, index) =>
              React.createElement(Text, { key: `tech-skill-${index}`, style: styles.skill }, `${skill}${index < content.skills.technical.length - 1 ? ' •' : ''}`)
            )
          )
        ),
        content.skills.tools && Array.isArray(content.skills.tools) && content.skills.tools.length > 0 && React.createElement(View, {},
          React.createElement(Text, { style: styles.subsectionTitle }, 'Tools & Frameworks'),
          React.createElement(View, { style: styles.skillsContainer },
            ...content.skills.tools.map((tool, index) =>
              React.createElement(Text, { key: `tool-${index}`, style: styles.skill }, `${tool}${index < content.skills.tools.length - 1 ? ' •' : ''}`)
            )
          )
        ),
        content.skills.languages && Array.isArray(content.skills.languages) && content.skills.languages.length > 0 && React.createElement(View, {},
          React.createElement(Text, { style: styles.subsectionTitle }, 'Languages'),
          React.createElement(Text, { style: styles.text }, content.skills.languages.join(', '))
        )
      ),

      // Achievements (if exists)
      content.achievements && content.achievements.length > 0 && React.createElement(View, {},
        React.createElement(Text, { style: styles.sectionTitle }, 'ACHIEVEMENTS'),
        ...content.achievements.map((achievement, index) =>
          React.createElement(Text, { key: `achievement-${index}`, style: styles.bulletPoint }, `• ${achievement}`)
        )
      ),

      // Certifications (if exists)
      content.certifications && content.certifications.length > 0 && React.createElement(View, {},
        React.createElement(Text, { style: styles.sectionTitle }, 'CERTIFICATIONS'),
        ...content.certifications.map((cert, index) =>
          React.createElement(View, { key: `certification-${index}` },
            React.createElement(View, { style: styles.row },
              React.createElement(Text, { style: styles.subsectionTitle }, cert.name),
              React.createElement(Text, { style: styles.text }, cert.date)
            ),
            React.createElement(Text, { style: styles.text }, cert.issuer)
          )
        )
      )
    )
  );
};

// Create the simplest possible PDF for testing
const createTestPdf = () => {
  return React.createElement(Document, {},
    React.createElement(Page, { size: 'A4', style: styles.page },
      React.createElement(Text, { style: styles.name }, 'Test Resume'),
      React.createElement(Text, { style: styles.text }, 'This is a test PDF generated by @react-pdf/renderer'),
      React.createElement(Text, { style: styles.text }, 'Name: John Doe'),
      React.createElement(Text, { style: styles.text }, 'Email: john@example.com'),
      React.createElement(Text, { style: styles.text }, 'Skills: JavaScript, React, Node.js')
    )
  );
};

export async function POST(request: NextRequest) {
  try {
    const { content, userId, jobTitle, company } = await request.json();
    
    console.log('PDF Generate API: Starting @react-pdf/renderer generation...');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    console.log('PDF Generate API: Creating PDF document...');

    let MyDocument;
    
    try {
    // If no content provided, create test PDF
    if (!content || !content.personalInfo) {
      console.log('PDF Generate API: Creating test PDF...');
      MyDocument = createTestPdf();
    } else {
        console.log('PDF Generate API: Creating resume PDF with content sections:', Object.keys(content));
      MyDocument = createResumePdf(content);
      }
      
      console.log('PDF Generate API: Document created successfully');
      
      // Validate document structure
      if (!MyDocument || typeof MyDocument !== 'object') {
        throw new Error('Invalid document structure created');
      }
      
    } catch (docError) {
      console.error('PDF Generate API: Error creating document:', docError);
      console.error('PDF Generate API: Content that caused error:', JSON.stringify(content, null, 2));
      throw new Error(`Failed to create PDF document: ${docError instanceof Error ? docError.message : 'Unknown error'}`);
    }

    // Generate PDF buffer
    console.log('PDF Generate API: Generating PDF buffer...');
    
    let pdfBuffer;
    try {
      // For @react-pdf/renderer v3.4.4, we need to use different approach
      const pdfInstance = pdf(MyDocument);
      console.log('PDF Generate API: PDF instance created, type:', typeof pdfInstance);
      console.log('PDF Generate API: PDF instance constructor:', pdfInstance?.constructor?.name);
      
      // Try different methods based on version
      if (typeof pdfInstance.toBuffer === 'function') {
        console.log('PDF Generate API: Using toBuffer() method...');
        pdfBuffer = await pdfInstance.toBuffer();
      } else if (typeof pdfInstance.toBlob === 'function') {
        console.log('PDF Generate API: Using toBlob() method...');
        const blob = await pdfInstance.toBlob();
        pdfBuffer = Buffer.from(await blob.arrayBuffer());
      } else if (typeof pdfInstance.toString === 'function') {
        console.log('PDF Generate API: Using toString() method...');
        const pdfString = await pdfInstance.toString();
        pdfBuffer = Buffer.from(pdfString, 'binary');
      } else {
        console.log('PDF Generate API: Trying stream approach...');
        // Try streaming approach for older versions
        const chunks: Buffer[] = [];
        const stream = await new Promise((resolve, reject) => {
          const readable = pdfInstance.pipe ? pdfInstance : pdfInstance.toStream ? pdfInstance.toStream() : null;
          if (!readable) {
            reject(new Error('No readable stream available'));
            return;
          }
          
          readable.on('data', (chunk: any) => chunks.push(Buffer.from(chunk)));
          readable.on('end', () => resolve(Buffer.concat(chunks)));
          readable.on('error', reject);
        });
        pdfBuffer = stream as Buffer;
      }
      
      console.log('PDF Generate API: PDF buffer created, size:', pdfBuffer?.length);
      console.log('PDF Generate API: PDF buffer type:', typeof pdfBuffer);
      console.log('PDF Generate API: PDF buffer constructor:', pdfBuffer?.constructor?.name);
      console.log('PDF Generate API: Is Buffer?', Buffer.isBuffer(pdfBuffer));
      
    } catch (bufferError) {
      console.error('PDF Generate API: Error generating buffer:', bufferError);
      throw new Error(`Failed to generate PDF buffer: ${bufferError instanceof Error ? bufferError.message : 'Unknown buffer error'}`);
    }

    if (!pdfBuffer) {
      throw new Error('Generated PDF buffer is null or undefined');
    }

    // Ensure we have a proper Buffer
    if (!Buffer.isBuffer(pdfBuffer)) {
      console.log('PDF Generate API: Converting to Buffer...');
      try {
        if (pdfBuffer instanceof ArrayBuffer) {
          pdfBuffer = Buffer.from(pdfBuffer);
        } else if (typeof pdfBuffer === 'string') {
          pdfBuffer = Buffer.from(pdfBuffer, 'binary');
        } else if (pdfBuffer && typeof pdfBuffer === 'object' && pdfBuffer.data) {
          // Some versions might wrap buffer in an object
          pdfBuffer = Buffer.from(pdfBuffer.data);
        } else {
          throw new Error(`Unsupported buffer type: ${typeof pdfBuffer}, constructor: ${pdfBuffer?.constructor?.name}`);
        }
      } catch (conversionError) {
        console.error('PDF Generate API: Buffer conversion failed:', conversionError);
        throw new Error('Failed to convert PDF data to Buffer');
      }
    }

    if (pdfBuffer.length === 0) {
      throw new Error('Generated PDF buffer is empty');
    }

    // Check if buffer contains PDF header
    const bufferStart = pdfBuffer.slice(0, 4).toString();
    console.log('PDF Generate API: PDF buffer starts with:', bufferStart);
    
    if (!bufferStart.startsWith('%PDF')) {
      console.error('PDF Generate API: Generated buffer is not a valid PDF');
      throw new Error('Generated buffer is not a valid PDF');
    }

    console.log('PDF Generate API: PDF generated successfully, uploading to storage...');

    // Create filename
    const timestamp = Date.now();
    const fileName = `react_pdf_resume_${timestamp}.pdf`;
    const filePath = `${STORAGE_PATHS.TAILORED_PDFS}/${userId}/${fileName}`;
    const storageRef = ref(storage, filePath);
    
    // Upload with explicit content type
    await uploadBytes(storageRef, pdfBuffer, {
      contentType: 'application/pdf',
      customMetadata: {
        'Cache-Control': 'no-cache',
        'generator': 'react-pdf-renderer'
      }
    });

    const downloadURL = await getDownloadURL(storageRef);

    console.log('PDF Generate API: PDF uploaded successfully:', downloadURL);

    return NextResponse.json({
      success: true,
      message: 'PDF generated successfully using @react-pdf/renderer',
      data: {
        downloadURL,
        fileName,
        bufferSize: pdfBuffer.length,
        pdfStart: bufferStart,
        generator: 'react-pdf-renderer',
        sections: content ? Object.keys(content) : ['test'],
        pdfBase64: pdfBuffer.toString('base64')
      },
    });

  } catch (error: any) {
    console.error('PDF Generate API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: `@react-pdf/renderer generation failed: ${error.message}`,
      details: error.stack
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  );
} 