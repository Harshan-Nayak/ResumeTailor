import { ResumeContent } from '@/types';

// Helper function to extract relevant keywords from job description dynamically
function extractJobKeywords(jobDescription: string): string[] {
  if (!jobDescription || jobDescription.trim().length === 0) return [];
  
  const keywords: string[] = [];
  const text = jobDescription.toLowerCase();
  
  // Common patterns that indicate skills/technologies/tools
  const skillPatterns = [
    // Direct skill mentions
    /(?:experience with|proficiency in|knowledge of|familiar with|skilled in|expertise in|working with)\s+([^.,\n]+)/gi,
    // Required/preferred skills
    /(?:required|preferred|must have|should have|need)\s+(?:skills?|experience|knowledge)?\s*:?\s*([^.,\n]+)/gi,
    // Technologies/tools lists
    /(?:technologies|tools|software|platforms|frameworks|languages|systems)\s*:?\s*([^.,\n]+)/gi,
    // Bullet point skills (common in job posts)
    /[•·-]\s*([^.,\n]+?(?:experience|skills?|knowledge|proficiency))/gi,
    // Skills in parentheses
    /\(([^)]+(?:experience|skills?|knowledge|API|framework|platform|software|tool))\)/gi
  ];
  
  // Extract using patterns
  skillPatterns.forEach(pattern => {
    let matches;
    while ((matches = pattern.exec(jobDescription)) !== null) {
      if (matches[1]) {
        const skillText = matches[1].trim();
        // Split by common delimiters and clean up
        const splitSkills = skillText.split(/[,;|&/]/).map(s => s.trim()).filter(s => s.length > 2);
        keywords.push(...splitSkills);
      }
    }
  });
  
  // Also look for standalone capitalized terms that look like technologies/skills
  // This catches things like "React", "Python", "Photoshop", "Excel", etc.
  const standalonePattern = /\b([A-Z][a-zA-Z]*(?:\.[a-zA-Z]+)*)\b/g;
  let matches;
  while ((matches = standalonePattern.exec(jobDescription)) !== null) {
    const term = matches[1];
    // Filter out common English words and very short terms
    if (term.length > 2 && !['The', 'And', 'For', 'You', 'We', 'Our', 'This', 'That', 'All', 'New', 'Will', 'Can', 'May'].includes(term)) {
      keywords.push(term);
    }
  }
  
  // Clean up and deduplicate
  const cleanedKeywords = keywords
    .map(k => k.replace(/[^\w\s.-]/g, '').trim()) // Remove special chars except common ones
    .filter(k => k.length > 2 && k.length < 50) // Reasonable length
    .filter(k => !k.match(/^\d+$/)) // No pure numbers
    .map(k => k.split(/\s+/).map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')) // Title case
    .filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates
  
  return cleanedKeywords.slice(0, 15); // Limit to prevent overwhelming
}

// Helper function to enhance skills with job requirements dynamically
function enhanceSkillsWithJobRequirements(originalSkills: any, jobKeywords: string[]): any {
  if (!originalSkills) {
    // If no original skills, create a simple structure with job keywords
    return jobKeywords.length > 0 ? { 'relevant': jobKeywords } : {};
  }
  
  const enhanced = { ...originalSkills };
  
  if (jobKeywords.length === 0) return enhanced;
  
  // Get existing skill categories
  const existingCategories = Object.keys(enhanced);
  
  // If user already has skill categories, try to intelligently add job keywords
  if (existingCategories.length > 0) {
    
    // First, check if any job keywords already exist in current skills to avoid duplicates
    const allExistingSkills = existingCategories.reduce((acc, category) => {
      const categorySkills = enhanced[category];
      if (Array.isArray(categorySkills)) {
        acc.push(...categorySkills.map(skill => skill.toLowerCase()));
      } else if (typeof categorySkills === 'string') {
        acc.push(categorySkills.toLowerCase());
      }
      return acc;
    }, [] as string[]);
    
    // Filter out keywords that already exist
    const newKeywords = jobKeywords.filter(keyword => 
      !allExistingSkills.some(existing => 
        existing.includes(keyword.toLowerCase()) || keyword.toLowerCase().includes(existing)
      )
    );
    
    if (newKeywords.length > 0) {
      // Try to find the most appropriate existing category or create "Job Relevant Skills"
      let targetCategory = 'job_relevant';
      
      // Look for categories that might be appropriate for additional skills
      const possibleCategories = existingCategories.filter(cat => 
        cat.toLowerCase().includes('skill') || 
        cat.toLowerCase().includes('technical') || 
        cat.toLowerCase().includes('tool') || 
        cat.toLowerCase().includes('software') ||
        cat.toLowerCase().includes('relevant')
      );
      
      if (possibleCategories.length > 0) {
        targetCategory = possibleCategories[0]; // Use the first matching category
      }
      
      // Add new keywords to the target category
      if (!enhanced[targetCategory]) {
        enhanced[targetCategory] = [];
      }
      
      if (Array.isArray(enhanced[targetCategory])) {
        enhanced[targetCategory].push(...newKeywords);
      } else {
        // If it's a string, convert to array
        enhanced[targetCategory] = [enhanced[targetCategory], ...newKeywords];
      }
    }
    
  } else {
    // If no existing categories, create a simple "skills" category
    enhanced.skills = jobKeywords;
  }
  
  return enhanced;
}

// Helper function to enhance project descriptions with job keywords
function enhanceProjectDescription(description: string, jobKeywords: string[]): string {
  if (!description || jobKeywords.length === 0) return description;
  
  let enhanced = description;
  
  // Add job-relevant keywords naturally to the description
  const relevantKeywords = jobKeywords.filter(keyword => 
    !description.toLowerCase().includes(keyword.toLowerCase())
  ).slice(0, 2); // Limit to 2 additional keywords to avoid over-stuffing
  
  if (relevantKeywords.length > 0) {
    // Add keywords naturally at the end
    const keywordPhrase = relevantKeywords.length === 1 
      ? `utilizing ${relevantKeywords[0]}`
      : `utilizing ${relevantKeywords.join(' and ')}`;
    
    enhanced = `${description.replace(/\.$/, '')} ${keywordPhrase}.`;
  }
  
  return enhanced;
}

export function generateResumeHTML(content: ResumeContent, jobDescription?: string): string {
  const personalInfo = content.personalInfo || {};
  
  // Extract job keywords for skills enhancement
  const jobKeywords = jobDescription ? extractJobKeywords(jobDescription) : [];
  
  // Merge skills with job-relevant additions
  const enhancedSkills = enhanceSkillsWithJobRequirements(content.skills, jobKeywords);
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Resume</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.2;
            color: #333;
            background: white;
            padding: 20px;
            font-size: 10px;
        }
        
        .resume-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
        }
        
        .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #2c3e50;
            padding-bottom: 15px;
        }
        
        .name {
            font-size: 20px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 6px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .contact-info {
            font-size: 9px;
            color: #555;
            margin-bottom: 2px;
        }
        
        .section {
            margin-bottom: 15px;
        }
        
        .section-title {
            font-size: 12px;
            font-weight: bold;
            color: #2c3e50;
            text-transform: uppercase;
            letter-spacing: 1px;
            border-bottom: 1px solid #bdc3c7;
            padding-bottom: 3px;
            margin-bottom: 8px;
        }
        
        .subsection {
            margin-bottom: 10px;
        }
        
        .subsection-title {
            font-size: 10px;
            font-weight: bold;
            color: #34495e;
            margin-bottom: 3px;
        }
        
        .job-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 3px;
        }
        
        .job-title {
            font-size: 10px;
            font-weight: bold;
            color: #2c3e50;
        }
        
        .job-duration {
            font-size: 9px;
            color: #7f8c8d;
            font-style: italic;
        }
        
        .job-company {
            font-size: 9px;
            color: #34495e;
            margin-bottom: 5px;
        }
        
        .description {
            margin-left: 0;
        }
        
        .bullet-point {
            margin-bottom: 2px;
            padding-left: 12px;
            position: relative;
            font-size: 9px;
            line-height: 1.2;
        }
        
        .bullet-point:before {
            content: "•";
            position: absolute;
            left: 0;
            color: #3498db;
            font-weight: bold;
        }
        
        .skills-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
        }
        
        .skill-category {
            margin-bottom: 6px;
        }
        
        .skill-category-title {
            font-size: 9px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 3px;
        }
        
        .skills-list {
            font-size: 8px;
            color: #555;
            line-height: 1.2;
        }
        
        .project-item {
            margin-bottom: 8px;
        }
        
        .project-name {
            font-size: 10px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 2px;
        }
        
        .project-description {
            font-size: 8px;
            color: #555;
            margin-bottom: 3px;
        }
        
        .technologies {
            font-size: 8px;
            color: #7f8c8d;
            font-style: italic;
        }
        
        .education-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 5px;
        }
        
        .degree {
            font-size: 10px;
            font-weight: bold;
            color: #2c3e50;
        }
        
        .institution {
            font-size: 9px;
            color: #555;
        }
        
        .year {
            font-size: 9px;
            color: #7f8c8d;
            font-style: italic;
        }
        
        @media print {
            body {
                padding: 15px;
                font-size: 9px;
            }
            
            .resume-container {
                max-width: none;
            }
            
            .section {
                break-inside: avoid;
                margin-bottom: 12px;
            }
            
            .subsection {
                break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="resume-container">
        <!-- Header -->
        <div class="header">
            <div class="name">${personalInfo.name || 'Name'}</div>
            ${personalInfo.email ? `<div class="contact-info">${personalInfo.email}</div>` : ''}
            ${personalInfo.phone ? `<div class="contact-info">${personalInfo.phone}</div>` : ''}
            ${personalInfo.location ? `<div class="contact-info">${personalInfo.location}</div>` : ''}
            ${personalInfo.linkedin ? `<div class="contact-info">LinkedIn: ${personalInfo.linkedin}</div>` : ''}
            ${personalInfo.github ? `<div class="contact-info">GitHub: ${personalInfo.github}</div>` : ''}
        </div>

        <!-- Professional Summary -->
        ${content.professionalSummary ? `
        <div class="section">
            <div class="section-title">Professional Summary</div>
            <div class="description">${content.professionalSummary}</div>
        </div>
        ` : ''}

        <!-- Skills -->
        ${enhancedSkills && Object.keys(enhancedSkills).length > 0 ? `
        <div class="section">
            <div class="section-title">Skills</div>
            <div class="skills-grid">
                ${Object.keys(enhancedSkills).map(categoryKey => {
                    const categorySkills = enhancedSkills[categoryKey];
                    if (!categorySkills || (Array.isArray(categorySkills) && categorySkills.length === 0)) {
                        return '';
                    }
                    
                    // Format category name for display
                    const displayName = categoryKey
                        .replace(/_/g, ' ')
                        .replace(/([A-Z])/g, ' $1')
                        .replace(/\b\w/g, l => l.toUpperCase())
                        .trim();
                    
                    // Handle both array and string values
                    const skillsText = Array.isArray(categorySkills) 
                        ? categorySkills.join(', ') 
                        : categorySkills;
                    
                    return `
                    <div class="skill-category">
                        <div class="skill-category-title">${displayName}</div>
                        <div class="skills-list">${skillsText}</div>
                    </div>
                    `;
                }).filter(Boolean).join('')}
            </div>
        </div>
        ` : ''}

        <!-- Experience -->
        ${content.experience && content.experience.length > 0 ? `
        <div class="section">
            <div class="section-title">Experience</div>
            ${content.experience.map(exp => `
            <div class="subsection">
                <div class="job-header">
                    <div class="job-title">${exp.title || 'Position'}</div>
                    <div class="job-duration">${exp.duration || 'Duration'}</div>
                </div>
                <div class="job-company">${exp.company || 'Company'}</div>
                ${exp.description && Array.isArray(exp.description) && exp.description.length > 0 ? `
                <div class="description">
                    ${exp.description.map(desc => `<div class="bullet-point">${desc}</div>`).join('')}
                </div>
                ` : exp.description && typeof exp.description === 'string' ? `
                <div class="description">
                    <div class="bullet-point">${exp.description}</div>
                </div>
                ` : ''}
                ${exp.technologies && Array.isArray(exp.technologies) && exp.technologies.length > 0 ? `
                <div class="technologies">Technologies: ${exp.technologies.join(', ')}</div>
                ` : ''}
            </div>
            `).join('')}
        </div>
        ` : ''}

        <!-- Projects -->
        ${content.projects && content.projects.length > 0 ? `
        <div class="section">
            <div class="section-title">Projects</div>
            ${content.projects.map(project => `
            <div class="project-item">
                <div class="project-name">${project.name || 'Project'}</div>
                ${project.description ? `<div class="project-description">${enhanceProjectDescription(project.description, jobKeywords)}</div>` : ''}
                ${project.achievements && Array.isArray(project.achievements) && project.achievements.length > 0 ? `
                <div class="description">
                    ${project.achievements.map(achievement => `<div class="bullet-point">${enhanceProjectDescription(achievement, jobKeywords)}</div>`).join('')}
                </div>
                ` : ''}
                ${project.technologies && Array.isArray(project.technologies) && project.technologies.length > 0 ? `
                <div class="technologies">Technologies: ${project.technologies.join(', ')}</div>
                ` : ''}
            </div>
            `).join('')}
        </div>
        ` : ''}

        <!-- Education -->
        ${content.education && content.education.length > 0 ? `
        <div class="section">
            <div class="section-title">Education</div>
            ${content.education.map(edu => {
                // Get all available fields from this education entry
                const availableFields = Object.keys(edu).filter(key => {
                    const value = (edu as any)[key];
                    return value && value !== '' && value !== 'undefined' && 
                           !(Array.isArray(value) && value.length === 0);
                });
                
                if (availableFields.length === 0) return ''; // Skip empty entries
                
                // Separate main info from secondary info
                const mainFields = availableFields.filter(key => 
                    ['degree', 'title', 'program', 'certification', 'course'].some(mainKey => 
                        key.toLowerCase().includes(mainKey)
                    )
                );
                const institutionFields = availableFields.filter(key => 
                    ['institution', 'school', 'university', 'college', 'academy', 'center'].some(instKey => 
                        key.toLowerCase().includes(instKey)
                    )
                );
                const timeFields = availableFields.filter(key => 
                    ['year', 'date', 'graduation', 'completed', 'duration'].some(timeKey => 
                        key.toLowerCase().includes(timeKey)
                    )
                );
                const otherFields = availableFields.filter(key => 
                    !mainFields.includes(key) && !institutionFields.includes(key) && !timeFields.includes(key)
                );
                
                return `
                <div class="education-item">
                    <div>
                        ${mainFields.map(field => {
                            const value = (edu as any)[field];
                            return `<div class="degree">${value}</div>`;
                        }).join('')}
                        ${institutionFields.map(field => {
                            const value = (edu as any)[field];
                            return `<div class="institution">${value}</div>`;
                        }).join('')}
                        ${otherFields.map(field => {
                            const value = (edu as any)[field];
                            const displayName = field.replace(/([A-Z])/g, ' $1')
                                                   .replace(/^./, str => str.toUpperCase())
                                                   .trim();
                            
                            if (Array.isArray(value) && value.length > 0) {
                                return `<div class="institution">${displayName}: ${value.join(', ')}</div>`;
                            } else if (typeof value === 'string') {
                                return `<div class="institution">${displayName}: ${value}</div>`;
                            }
                            return '';
                        }).filter(Boolean).join('')}
                    </div>
                    ${timeFields.length > 0 ? `
                    <div class="year">${(edu as any)[timeFields[0]]}</div>
                    ` : ''}
                </div>
                `;
            }).filter(Boolean).join('')}
        </div>
        ` : ''}

        <!-- Certifications -->
        ${content.certifications && content.certifications.length > 0 ? `
        <div class="section">
            <div class="section-title">Certifications</div>
            ${content.certifications.map(cert => {
                // Get all available fields from this certification entry
                const availableFields = Object.keys(cert).filter(key => {
                    const value = (cert as any)[key];
                    return value && value !== '' && value !== 'undefined' && 
                           !(Array.isArray(value) && value.length === 0);
                });
                
                if (availableFields.length === 0) return ''; // Skip empty entries
                
                // Separate main info from secondary info
                const nameFields = availableFields.filter(key => 
                    ['name', 'title', 'certification', 'certificate'].some(nameKey => 
                        key.toLowerCase().includes(nameKey)
                    )
                );
                const issuerFields = availableFields.filter(key => 
                    ['issuer', 'organization', 'provider', 'company', 'institution'].some(issKey => 
                        key.toLowerCase().includes(issKey)
                    )
                );
                const dateFields = availableFields.filter(key => 
                    ['date', 'year', 'issued', 'completed', 'expires', 'expiry'].some(dateKey => 
                        key.toLowerCase().includes(dateKey)
                    )
                );
                const otherFields = availableFields.filter(key => 
                    !nameFields.includes(key) && !issuerFields.includes(key) && !dateFields.includes(key)
                );
                
                return `
                <div class="subsection">
                    ${nameFields.map(field => {
                        const value = (cert as any)[field];
                        return `<div class="subsection-title">${value}</div>`;
                    }).join('')}
                    ${(issuerFields.length > 0 || dateFields.length > 0) ? `
                    <div class="job-company">
                        ${[
                            ...issuerFields.map(field => (cert as any)[field]),
                            ...dateFields.map(field => (cert as any)[field])
                        ].filter(Boolean).join(' - ')}
                    </div>
                    ` : ''}
                    ${otherFields.map(field => {
                        const value = (cert as any)[field];
                        const displayName = field.replace(/([A-Z])/g, ' $1')
                                               .replace(/^./, str => str.toUpperCase())
                                               .trim();
                        
                        if (Array.isArray(value) && value.length > 0) {
                            return `<div class="job-company">${displayName}: ${value.join(', ')}</div>`;
                        } else if (typeof value === 'string') {
                            return `<div class="job-company">${displayName}: ${value}</div>`;
                        }
                        return '';
                    }).filter(Boolean).join('')}
                </div>
                `;
            }).filter(Boolean).join('')}
        </div>
        ` : ''}
    </div>
</body>
</html>`;

  return html;
}

export function generateTestResumeHTML(): string {
  const testContent: ResumeContent = {
    personalInfo: {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1 (555) 123-4567',
      location: 'New York, NY',
      linkedin: 'linkedin.com/in/johndoe',
      github: 'github.com/johndoe'
    },
    skills: {
      technical: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python'],
      tools: ['Git', 'Docker', 'AWS', 'MongoDB'],
      languages: ['English', 'Spanish'],
      frameworks: ['React', 'Express', 'Next.js'],
      databases: ['PostgreSQL', 'MongoDB']
    } as any,
    experience: [
      {
        title: 'Senior Software Developer',
        company: 'Tech Solutions Inc.',
        duration: '2022 - Present',
        description: [
          'Led development of scalable web applications serving 100K+ users',
          'Implemented CI/CD pipelines reducing deployment time by 60%',
          'Mentored junior developers and conducted code reviews'
        ],
        technologies: ['React', 'Node.js', 'AWS', 'MongoDB']
      },
      {
        title: 'Software Developer',
        company: 'StartupCorp',
        duration: '2020 - 2022',
        description: [
          'Built responsive web applications using modern JavaScript frameworks',
          'Collaborated with cross-functional teams to deliver features on time'
        ],
        technologies: ['JavaScript', 'React', 'PostgreSQL']
      }
    ],
    projects: [
      {
        name: 'E-commerce Platform',
        description: 'Full-stack e-commerce application with payment integration',
        achievements: [
          'Implemented secure payment processing with Stripe',
          'Built admin dashboard for inventory management'
        ],
        technologies: ['React', 'Node.js', 'MongoDB', 'Stripe API']
      },
      {
        name: 'Task Management App',
        description: 'Real-time collaborative task management tool',
        achievements: [
          'Implemented real-time updates using WebSockets',
          'Achieved 99.9% uptime with proper error handling'
        ],
        technologies: ['Vue.js', 'Express', 'Socket.io', 'PostgreSQL']
      }
    ],
    education: [
      {
        degree: 'Bachelor of Computer Science',
        institution: 'University of Technology',
        year: '2020',
        gpa: '3.8'
      }
    ]
  };

  return generateResumeHTML(testContent);
} 

// Utility functions for file handling
export function validatePdfFile(file: File): { isValid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['application/pdf'];
  
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Only PDF files are allowed'
    };
  }

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'File size must be less than 10MB'
    };
  }

  return { isValid: true };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function generateResumeFilename(originalName: string, userId: string): string {
  const timestamp = Date.now();
  const cleanName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const nameWithoutExt = cleanName.replace(/\.[^/.]+$/, '');
  
  return `${nameWithoutExt}_${userId}_${timestamp}.pdf`;
} 