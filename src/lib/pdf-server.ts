import pdf from 'pdf-parse';
import { ResumeContent } from '@/types';

/**
 * Parse PDF buffer and extract text content (SERVER-SIDE ONLY)
 */
export async function parsePdfBuffer(buffer: ArrayBuffer): Promise<string> {
  try {
    const data = await pdf(Buffer.from(buffer));
    return data.text;
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error('Failed to parse PDF file');
  }
}

/**
 * Enhanced resume data extraction with better parsing logic
 */
export function extractResumeDataFromText(rawText: string): Partial<ResumeContent> {
  const lines = rawText.split('\n').filter(line => line.trim());
  
  // Initialize resume structure
  const resumeData: Partial<ResumeContent> = {
    personalInfo: {
      name: '',
      email: '',
      phone: '',
      location: '',
      linkedin: '',
      website: ''
    },
    professionalSummary: '',
    skills: {
      technical: [],
      soft: [],
      languages: [],
      frameworks: [],
      tools: [],
      databases: []
    },
    experience: [],
    projects: [],
    education: [],
    certifications: []
  };

  // Extract personal information
  extractPersonalInfo(rawText, resumeData);
  
  // Extract sections
  extractSections(lines, resumeData);
  
  // Extract skills
  extractSkills(rawText, resumeData);

  return resumeData;
}

/**
 * Extract personal information from resume text
 */
function extractPersonalInfo(text: string, resumeData: Partial<ResumeContent>) {
  const lines = text.split('\n').filter(line => line.trim()).slice(0, 10);
  
  // Extract email
  const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
  if (emailMatch) {
    resumeData.personalInfo!.email = emailMatch[0];
  }
  
  // Extract phone
  const phoneMatch = text.match(/\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/);
  if (phoneMatch) {
    resumeData.personalInfo!.phone = phoneMatch[0];
  }
  
  // Extract LinkedIn
  const linkedinMatch = text.match(/(?:linkedin\.com\/in\/|linkedin\.com\/pub\/)([a-zA-Z0-9\-]+)/i);
  if (linkedinMatch) {
    resumeData.personalInfo!.linkedin = `https://linkedin.com/in/${linkedinMatch[1]}`;
  }
  
  // Extract website/portfolio
  const websiteMatch = text.match(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9\-]+\.(?:com|net|org|io|dev|me))/i);
  if (websiteMatch && !websiteMatch[0].includes('linkedin') && !websiteMatch[0].includes('github')) {
    resumeData.personalInfo!.website = websiteMatch[0].startsWith('http') ? websiteMatch[0] : `https://${websiteMatch[0]}`;
  }
  
  // Extract name (usually the first line that's not contact info)
  for (const line of lines) {
    if (!line.includes('@') && 
        !line.match(/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/) &&
        line.length > 2 && 
        line.length < 50 &&
        !line.toLowerCase().includes('resume') &&
        !line.toLowerCase().includes('cv')) {
      resumeData.personalInfo!.name = line.trim();
      break;
    }
  }
}

/**
 * Extract different sections from resume
 */
function extractSections(lines: string[], resumeData: Partial<ResumeContent>) {
  const sectionHeaders = {
    summary: /(summary|objective|profile|about|overview)/i,
    experience: /(experience|employment|work\s+history|professional\s+experience|work\s+experience)/i,
    education: /(education|academic|qualifications|degrees?)/i,
    projects: /(projects?|portfolio|work\s+samples)/i,
    certifications: /(certifications?|certificates?|licenses?)/i,
    skills: /(skills|technical\s+skills|technologies|competencies|tools)/i
  };

  let currentSection = '';
  let currentContent: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check if this line is a section header
    let foundSection = '';
    for (const [section, regex] of Object.entries(sectionHeaders)) {
      if (regex.test(line) && line.length < 50) {
        foundSection = section;
        break;
      }
    }

    if (foundSection) {
      // Process previous section
      if (currentSection && currentContent.length > 0) {
        processSectionContent(resumeData, currentSection, currentContent);
      }
      
      currentSection = foundSection;
      currentContent = [];
    } else if (currentSection && line.length > 0) {
      currentContent.push(line);
    }
  }

  // Process the last section
  if (currentSection && currentContent.length > 0) {
    processSectionContent(resumeData, currentSection, currentContent);
  }
}

/**
 * Process section content and populate resume data
 */
function processSectionContent(resumeData: Partial<ResumeContent>, section: string, content: string[]) {
  const text = content.join('\n').trim();
  
  switch (section) {
    case 'summary':
      resumeData.professionalSummary = text;
      break;
      
    case 'experience':
      // Parse work experience entries
      const experienceEntries = parseExperienceEntries(content);
      resumeData.experience = experienceEntries;
      break;
      
    case 'education':
      // Parse education entries
      const educationEntries = parseEducationEntries(content);
      resumeData.education = educationEntries;
      break;
      
    case 'projects':
      // Parse project entries
      const projectEntries = parseProjectEntries(content);
      resumeData.projects = projectEntries;
      break;
      
    case 'certifications':
      // Parse certifications
      const certificationEntries = parseCertificationEntries(content);
      resumeData.certifications = certificationEntries;
      break;
  }
}

/**
 * Extract skills from the entire resume text
 */
function extractSkills(text: string, resumeData: Partial<ResumeContent>) {
  const skillKeywords = {
    technical: [
      'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Rust',
      'HTML', 'CSS', 'React', 'Vue', 'Angular', 'Node.js', 'Express', 'Django', 'Flask',
      'Spring', 'Laravel', 'jQuery', 'Bootstrap', 'Tailwind'
    ],
    databases: [
      'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'SQLite', 'Oracle', 'SQL Server', 'DynamoDB'
    ],
    tools: [
      'Git', 'Docker', 'Kubernetes', 'Jenkins', 'Jira', 'Confluence', 'Slack', 'Figma',
      'Adobe', 'Photoshop', 'Illustrator', 'Webpack', 'Babel', 'ESLint', 'Prettier'
    ],
    frameworks: [
      'React', 'Angular', 'Vue', 'Django', 'Flask', 'Spring', 'Laravel', 'Express',
      'Next.js', 'Nuxt.js', 'Gatsby', 'Svelte', 'FastAPI'
    ]
  };

  const lowerText = text.toLowerCase();

  for (const [category, keywords] of Object.entries(skillKeywords)) {
    const foundSkills = keywords.filter(skill => 
      lowerText.includes(skill.toLowerCase())
    );
    
    if (category === 'technical') {
      resumeData.skills!.technical = foundSkills;
    } else if (category === 'databases') {
      resumeData.skills!.databases = foundSkills;
    } else if (category === 'tools') {
      resumeData.skills!.tools = foundSkills;
    } else if (category === 'frameworks') {
      resumeData.skills!.frameworks = foundSkills;
    }
  }
}

/**
 * Parse work experience entries
 */
function parseExperienceEntries(content: string[]) {
  // This is a simplified implementation
  // You can enhance this with more sophisticated parsing
  const entries = [];
  let currentEntry: any = null;

  for (const line of content) {
    // Check if this looks like a job title/company line
    if (line.match(/\d{4}/) && (line.includes('-') || line.includes('to') || line.includes('present'))) {
      if (currentEntry) {
        entries.push(currentEntry);
      }
      
      currentEntry = {
        title: 'Software Developer', // You can extract this more intelligently
        company: 'Company Name',     // You can extract this more intelligently
        duration: line.trim(),
        description: [],
        technologies: []
      };
    } else if (currentEntry && line.trim()) {
      currentEntry.description.push(line.trim());
    }
  }

  if (currentEntry) {
    entries.push(currentEntry);
  }

  return entries;
}

/**
 * Parse education entries
 */
function parseEducationEntries(content: string[]) {
  return [{
    degree: content[0] || 'Bachelor\'s Degree',
    institution: content[1] || 'University Name',
    year: content.find(line => line.match(/\d{4}/))?.match(/\d{4}/)?.[0] || '2020'
  }];
}

/**
 * Parse project entries
 */
function parseProjectEntries(content: string[]) {
  const projects = [];
  let currentProject: any = null;

  for (const line of content) {
    if (line.length > 0 && !line.startsWith('-') && !line.startsWith('•')) {
      if (currentProject) {
        projects.push(currentProject);
      }
      
      currentProject = {
        name: line.trim(),
        description: '',
        technologies: [],
        achievements: []
      };
    } else if (currentProject && line.trim()) {
      if (currentProject.description) {
        currentProject.description += ' ' + line.trim();
      } else {
        currentProject.description = line.trim();
      }
    }
  }

  if (currentProject) {
    projects.push(currentProject);
  }

  return projects;
}

/**
 * Parse certification entries
 */
function parseCertificationEntries(content: string[]) {
  return content
    .filter(line => line.trim().length > 0)
    .map(line => ({
      name: line.trim(),
      issuer: 'Certification Authority',
      date: '',
      expiryDate: ''
    }));
} 