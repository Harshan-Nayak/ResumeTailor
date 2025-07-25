import { ResumeContent, PdfGenerationOptions } from '@/types';

/**
 * Validate PDF file type and size
 */
export function validatePdfFile(file: File): { isValid: boolean; error?: string } {
  // Check file type
  if (file.type !== 'application/pdf') {
    return {
      isValid: false,
      error: 'Please upload a PDF file'
    };
  }

  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'File size must be less than 5MB'
    };
  }

  return { isValid: true };
}

/**
 * Extract structured resume data from raw text
 * This is a basic implementation - you can enhance with more sophisticated parsing
 */
export function extractResumeData(rawText: string): Partial<ResumeContent> {
  const lines = rawText.split('\n').filter(line => line.trim());
  
  // Basic extraction patterns
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
  const phoneRegex = /\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/;
  
  // Extract email and phone
  const email = rawText.match(emailRegex)?.[0] || '';
  const phone = rawText.match(phoneRegex)?.[0] || '';
  
  // Extract name (usually the first non-empty line)
  const name = lines[0] || '';
  
  // Basic skill extraction (you can enhance this)
  const skillKeywords = [
    'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'C++', 'HTML', 'CSS',
    'SQL', 'MongoDB', 'PostgreSQL', 'AWS', 'Azure', 'Git', 'Docker', 'Kubernetes'
  ];
  
  const extractedSkills = skillKeywords.filter(skill => 
    rawText.toLowerCase().includes(skill.toLowerCase())
  );

  return {
    personalInfo: {
      name,
      email,
      phone,
      location: '', // You can add location extraction logic
      linkedin: '', // You can add LinkedIn URL extraction
      website: ''   // You can add website URL extraction
    },
    skills: {
      technical: extractedSkills,
      soft: [], // You can add soft skills extraction
      languages: [], // You can add language extraction
      frameworks: [], // You can add framework extraction
      tools: [], // You can add tools extraction
      databases: [] // You can add database extraction
    },
    summary: '', // You can add summary extraction logic
    experience: [], // You can add experience extraction logic
    education: [], // You can add education extraction logic
    projects: [], // You can add project extraction logic
    certifications: [] // You can add certification extraction logic
  };
}

/**
 * Generate unique filename for uploaded resume
 */
export function generateResumeFilename(userId: string, originalName: string): string {
  const timestamp = Date.now();
  const extension = originalName.split('.').pop();
  return `${userId}_resume_${timestamp}.${extension}`;
}

/**
 * Generate filename for tailored resume download
 */
export function generateTailoredFilename(jobTitle: string, company: string): string {
  const sanitize = (str: string) => str.replace(/[^a-zA-Z0-9]/g, '_');
  const timestamp = Date.now();
  return `resume_${sanitize(company)}_${sanitize(jobTitle)}_${timestamp}.pdf`;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Default PDF generation options
 */
export const defaultPdfOptions: PdfGenerationOptions = {
  template: 'modern',
  fontSize: 'medium',
  colorScheme: 'black',
  includePhoto: false,
}; 