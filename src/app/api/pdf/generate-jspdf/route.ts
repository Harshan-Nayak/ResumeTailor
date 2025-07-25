import { NextRequest, NextResponse } from 'next/server';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, STORAGE_PATHS } from '@/lib/firebase';
import { ResumeContent } from '@/types';
import jsPDF from 'jspdf';

export async function POST(request: NextRequest) {
  try {
    const { content, userId, jobTitle, company } = await request.json();
    
    console.log('jsPDF Generate API: Starting single-column PDF generation...');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    // Create jsPDF instance
    const doc = new jsPDF('portrait', 'pt', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    const maxWidth = pageWidth - (margin * 2);
    
    let yPosition = margin;

    // Professional colors
    const primaryColor = '#2c3e50';
    const secondaryColor = '#34495e';
    const lightGray = '#7f8c8d';
    const accentColor = '#3498db';

    // Helper functions
    const addSection = (title: string, spacing: number = 15) => {
      yPosition += spacing;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(primaryColor);
      doc.text(title.toUpperCase(), margin, yPosition);
      
      // Add underline
      const textWidth = doc.getTextWidth(title.toUpperCase());
      doc.setLineWidth(0.5);
      doc.setDrawColor(accentColor);
      doc.line(margin, yPosition + 2, margin + textWidth, yPosition + 2);
      
      yPosition += 12;
    };

    const addText = (text: string, fontSize: number = 8, fontStyle: string = 'normal', color: string = primaryColor, indent: number = 0) => {
      // Validate and sanitize text input
      if (!text || typeof text !== 'string') {
        console.warn('addText: Invalid text input:', text);
        return;
      }
      
      const sanitizedText = text.trim();
      if (sanitizedText === '') return;
      
      doc.setFont('helvetica', fontStyle);
      doc.setFontSize(fontSize);
      doc.setTextColor(color);
      
      const lines = doc.splitTextToSize(sanitizedText, maxWidth - indent);
      doc.text(lines, margin + indent, yPosition);
      yPosition += lines.length * (fontSize * 1.1) + 2;
    };

    const addBullet = (text: string, fontSize: number = 7, indent: number = 0) => {
      if (!text || typeof text !== 'string' || text.trim() === '') return;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(fontSize);
      doc.setTextColor(primaryColor);
      
      // Add bullet point
      doc.text('•', margin + indent, yPosition);
      
      // Add text with proper wrapping
      const textToWrap = text.startsWith('•') ? text.substring(1).trim() : text.trim();
      const lines = doc.splitTextToSize(textToWrap, maxWidth - indent - 12);
      doc.text(lines, margin + indent + 10, yPosition);
      
      // Move position down based on number of lines
      yPosition += lines.length * (fontSize * 1.1) + 1;
    };

    const addJobEntry = (title: string, company: string, duration: string, description: string[]) => {
      // Validate inputs
      const safeTitle = title && typeof title === 'string' ? title : 'Position';
      const safeCompany = company && typeof company === 'string' ? company : 'Company';
      const safeDuration = duration && typeof duration === 'string' ? duration : 'Duration';
      
      // Company and title on same line
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(primaryColor);
      const headerText = `${safeCompany.toUpperCase()} | ${safeTitle.toUpperCase()}`;
      doc.text(headerText, margin, yPosition);
      yPosition += 10;
      
      // Duration
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(secondaryColor);
      doc.text(safeDuration, margin, yPosition);
      yPosition += 10;
      
      // Description bullets (limit to 2 to save space)
      if (Array.isArray(description)) {
        description.slice(0, 2).forEach(desc => {
          addBullet(desc, 7);
        });
      }
      yPosition += 5;
    };

    const addProjectEntry = (name: string, type: string, duration: string, description: string, achievements: string[]) => {
      // Validate inputs
      const safeName = name && typeof name === 'string' ? name : 'Project';
      const safeDuration = duration && typeof duration === 'string' ? duration : 'Duration';
      
      // Project name and duration
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(primaryColor);
      
      const projectHeader = safeName.toUpperCase();
      const durationText = safeDuration;
      
      // Project name on left, duration on right
      doc.text(projectHeader, margin, yPosition);
      const durationWidth = doc.getTextWidth(durationText);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(secondaryColor);
      const durationX = pageWidth - margin - durationWidth;
      
      // Validate coordinates
      if (!isNaN(durationX) && !isNaN(yPosition)) {
        doc.text(durationText, durationX, yPosition);
      }
      
      yPosition += 10;
      
      // Description as bullet point
      if (description && typeof description === 'string' && description.trim()) {
        addBullet(description, 7);
      }
      
      // Achievements as bullet points (limit to 1 to save space)
      if (achievements && achievements.length > 0) {
        achievements.slice(0, 1).forEach(achievement => {
          if (achievement && typeof achievement === 'string' && achievement.trim()) {
            addBullet(achievement, 7);
          }
        });
      }
      
      yPosition += 3;
    };

    const checkPageSpace = (requiredSpace: number) => {
      // Always return true to ensure all sections are included
      // We'll use smaller fonts and tighter spacing if needed
      return true;
    };

    const adjustForSpace = () => {
      // Use smaller fonts throughout to fit everything
      return {
        fontSize: 7,
        spacing: 1,
        bulletSize: 6
      };
    };

    try {
      console.log('jsPDF Generate API: Content validation:', {
        hasContent: !!content,
        hasPersonalInfo: !!(content?.personalInfo),
        personalInfo: content?.personalInfo
      });
      
      if (!content || !content.personalInfo) {
        // Test content
        console.log('jsPDF Generate API: Creating test single-column PDF...');
        
        // Header
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(24);
        doc.setTextColor(primaryColor);
        const nameWidth = doc.getTextWidth('Measala Namrath');
        const nameX = (pageWidth - nameWidth) / 2;
        doc.text('Measala Namrath', nameX, yPosition);
        yPosition += 30;
        
        // Email (centered)
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(secondaryColor);
        const emailWidth = doc.getTextWidth('measalanamrath@gmail.com');
        const emailX = (pageWidth - emailWidth) / 2;
        doc.text('measalanamrath@gmail.com', emailX, yPosition);
        yPosition += 25;
        
        addSection('EDUCATION');
        addText('INDIAN INSTITUTE OF INFORMATION TECHNOLOGY VADODARA', 10, 'bold');
        addText('B.Tech in Computer Science and Engineering', 9);
        
      } else {
        console.log('jsPDF Generate API: Creating professional single-column PDF...');
        
        // HEADER - Name (centered)
        if (content.personalInfo?.name && typeof content.personalInfo.name === 'string') {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(18);
          doc.setTextColor(primaryColor);
          const nameText = content.personalInfo.name.toUpperCase();
          const nameWidth = doc.getTextWidth(nameText);
          const nameX = (pageWidth - nameWidth) / 2;
          
          // Validate coordinates
          if (!isNaN(nameX) && !isNaN(yPosition)) {
            doc.text(nameText, nameX, yPosition);
            yPosition += 22;
          }
        }
        
        // Email (centered)
        if (content.personalInfo?.email && typeof content.personalInfo.email === 'string') {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(secondaryColor);
          const emailText = content.personalInfo.email;
          const emailWidth = doc.getTextWidth(emailText);
          const emailX = (pageWidth - emailWidth) / 2;
          
          // Validate coordinates
          if (!isNaN(emailX) && !isNaN(yPosition)) {
            doc.text(emailText, emailX, yPosition);
            yPosition += 18;
          }
        }

        // EDUCATION - ALWAYS INCLUDE
        if (content.education?.length > 0) {
          addSection('EDUCATION');
          content.education.slice(0, 1).forEach(edu => {
            addText(edu.institution.toUpperCase(), 8, 'bold');
            addText(edu.degree, 7);
            if (edu.year) {
              addText(edu.year, 7, 'normal', secondaryColor);
            }
            yPosition += 2;
          });
        }

        // LINKS - ALWAYS INCLUDE
        addSection('LINKS');
        if (content.personalInfo.linkedin) {
          addText('LinkedIn: ' + content.personalInfo.linkedin.replace('https://linkedin.com/in/', ''), 7, 'normal', accentColor);
        }
        if (content.personalInfo.website) {
          addText('Portfolio: ' + content.personalInfo.website, 7, 'normal', accentColor);
        }
        addText('GitHub: ' + (content.personalInfo.name ? content.personalInfo.name.replace(' ', '-') : 'username'), 7, 'normal', accentColor);

        // COURSEWORK - ALWAYS INCLUDE
        addSection('COURSEWORK');
        addText('UNDERGRADUATE', 7, 'bold');
        const coursework = [
          'Data Structures and Algorithms',
          'Computer Networks',
          'Object Oriented Programming',
          'Database Management Systems'
        ];
        coursework.forEach(course => {
          addBullet(course, 6);
        });

        // SKILLS - ALWAYS INCLUDE
        if (content.skills) {
          addSection('SKILLS');
          
          // Programming
          addText('PROGRAMMING', 7, 'bold');
          if (content.skills?.technical) {
            const progLanguages = content.skills.technical.filter(skill => 
              ['Java', 'Python', 'JavaScript', 'C++', 'C', 'TypeScript', 'HTML', 'CSS'].some(lang => 
                skill.toLowerCase().includes(lang.toLowerCase())
              )
            ).slice(0, 6);
            addText(progLanguages.join(' • '), 7);
          }
          
          // Frameworks
          addText('Frameworks:', 7, 'bold');
          if (content.skills?.frameworks) {
            addText(content.skills.frameworks.slice(0, 4).join(' • '), 7);
          }
          
          // Databases
          addText('Databases:', 7, 'bold');
          if (content.skills?.databases) {
            addText(content.skills.databases.slice(0, 4).join(' • '), 7);
          }
          
          // Tools
          addText('Development Tools:', 7, 'bold');
          if (content.skills?.tools) {
            addText(content.skills.tools.slice(0, 4).join(' • '), 7);
          }
        }

        // PROJECTS - MOVE UP FOR HIGHER PRIORITY (MOST IMPORTANT - ENSURE THIS SHOWS)
        console.log(`PDF: Before Projects section - Y position: ${yPosition}`);
        
        if (content.projects?.length > 0) {
          addSection('PROJECTS');
          console.log('PDF: Processing projects:', content.projects.length);
          
          content.projects.slice(0, 2).forEach((project, index) => {
            console.log(`PDF: Project ${index + 1}:`, project.name, project.description);
            console.log(`PDF: Y position before project ${index + 1}: ${yPosition}`);
            
            // Use a default duration if not provided
            const projectDuration = project.duration || 
              (index === 0 ? 'Mar 2024 - Apr 2024' : 'Jan 2024 - Feb 2024');
            
            // Ensure we have description and achievements
            let projectDescription = project.description || 'Developed and implemented project solution with modern technologies';
            
            // Convert description to string if it's not already
            if (typeof projectDescription !== 'string') {
              if (Array.isArray(projectDescription)) {
                projectDescription = projectDescription.join(' ');
              } else {
                projectDescription = String(projectDescription);
              }
            }
            
            const projectAchievements = project.achievements && project.achievements.length > 0 ? 
              project.achievements : ['Successfully completed project objectives'];
            
            addProjectEntry(
              project.name,
              '', // Remove type from header
              projectDuration,
              projectDescription,
              projectAchievements
            );
            
            console.log(`PDF: Y position after project ${index + 1}: ${yPosition}`);
          });
        } else {
          // Fallback projects if none provided
          addSection('PROJECTS');
          addProjectEntry(
            'WEB APPLICATION PROJECT',
            '',
            'Mar 2024 - Apr 2024',
            'Developed a full-stack web application using modern technologies and frameworks',
            ['Built responsive user interface with React']
          );
        }
        
        console.log(`PDF: After Projects section - Y position: ${yPosition}`);

        // EXPERIENCE - ALWAYS INCLUDE (After projects to ensure projects show first)
        if (content.experience?.length > 0) {
          addSection('EXPERIENCE');
          content.experience.slice(0, 2).forEach(exp => {
            addJobEntry(exp.title, exp.company, exp.duration, exp.description || []);
          });
        }

        // CERTIFICATIONS - ALWAYS INCLUDE (Keep minimal to save space)
        if (content.certifications?.length > 0) {
          addSection('CERTIFICATIONS');
          content.certifications.slice(0, 2).forEach(cert => {
            const certName = cert?.name && typeof cert.name === 'string' ? cert.name : 'Certification';
            const certIssuer = cert?.issuer && typeof cert.issuer === 'string' ? cert.issuer : 'Issuer';
            addText(`${certName} | ${certIssuer}`, 7, 'bold');
          });
        } else {
          addSection('CERTIFICATIONS');
          addText('Data Analytics | Cisco', 7);
          addText('Data Visualization Intern | TATA GLOBAL', 7, 'normal', secondaryColor);
        }

        // Log final position to debug space usage
        console.log(`PDF: Final Y position: ${yPosition}, Page height: ${pageHeight}, Margin: ${margin}`);
        console.log(`PDF: Space used: ${yPosition - margin}px out of ${pageHeight - 2 * margin}px available`);
        
        if (yPosition > pageHeight - margin) {
          console.warn(`Content truncated! Exceeded page by ${yPosition - (pageHeight - margin)}px`);
        } else {
          console.log(`PDF: Content fits with ${(pageHeight - margin) - yPosition}px remaining`);
        }
      }

      // Generate PDF buffer
      console.log('jsPDF Generate API: Generating single-column PDF buffer...');
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
      
      console.log('jsPDF Generate API: Single-column PDF buffer created, size:', pdfBuffer.length);

      if (pdfBuffer.length === 0) {
        throw new Error('Generated PDF buffer is empty');
      }

      console.log('jsPDF Generate API: Single-column PDF generated successfully, uploading to storage...');

      // Create filename
      const timestamp = Date.now();
      const jobInfo = jobTitle ? `_${jobTitle.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
      const companyInfo = company ? `_${company.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
      const fileName = `resume_single_column${jobInfo}${companyInfo}_${timestamp}.pdf`;
      
      const filePath = `${STORAGE_PATHS.TAILORED_PDFS}/${userId}/${fileName}`;
      const storageRef = ref(storage, filePath);
      
      // Upload to Firebase Storage
      await uploadBytes(storageRef, pdfBuffer, {
        contentType: 'application/pdf',
        customMetadata: {
          'Cache-Control': 'no-cache',
          generator: 'jsPDF-SingleColumn'
        }
      });

      const downloadURL = await getDownloadURL(storageRef);

      console.log('jsPDF Generate API: Single-column PDF uploaded successfully:', downloadURL);

      return NextResponse.json({
        success: true,
        message: 'Single-column professional PDF generated successfully',
        data: {
          downloadURL,
          fileName,
          bufferSize: pdfBuffer.length,
          generator: 'jsPDF-SingleColumn',
          pdfBase64: pdfBuffer.toString('base64')
        },
      });

    } catch (pdfError: any) {
      console.error('jsPDF Single-Column Generation Error:', pdfError);
      return NextResponse.json({
        success: false,
        error: `Single-column PDF generation failed: ${pdfError.message}`
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('jsPDF Single-Column API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: `Single-column PDF generation failed: ${error.message}`
    }, { status: 500 });
  }
} 