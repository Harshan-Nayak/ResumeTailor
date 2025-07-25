// User authentication and profile types
export interface User {
  uid: string;
  email: string;
  name: string;
  createdAt: Date;
  subscription?: 'free' | 'premium';
}

// Personal information structure
export interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  github?: string;
  website?: string;
}

// Skills categorization
export interface Skills {
  technical: string[];
  soft: string[];
  tools: string[];
  languages?: string[];
}

// Work experience structure
export interface Experience {
  title: string;
  company: string;
  duration: string;
  description: string[];
  technologies: string[];
  achievements?: string[];
}

// Project information
export interface Project {
  name: string;
  description: string;
  technologies: string[];
  achievements: string[];
  url?: string;
  github?: string;
}

// Education information
export interface Education {
  degree: string;
  institution: string;
  year: string;
  gpa?: string;
  relevantCourses?: string[];
}

// Certification information
export interface Certification {
  name: string;
  issuer: string;
  date: string;
  url?: string;
  expiryDate?: string;
}

// Complete resume content structure
export interface ResumeContent {
  personalInfo: PersonalInfo;
  professionalSummary?: string;
  skills: Skills;
  experience: Experience[];
  projects: Project[];
  education: Education[];
  achievements?: string[];
  certifications?: Certification[];
}

// Master resume document
export interface MasterResume {
  id: string;
  userId: string;
  originalPdfUrl: string;
  parsedContent: ResumeContent;
  createdAt: Date;
  updatedAt: Date;
  fileName: string;
}

// Tailored resume with job-specific modifications
export interface TailoredResume {
  id: string;
  userId: string;
  masterResumeId: string;
  jobDescription: string;
  tailoredContent: ResumeContent;
  pdfUrl?: string;
  createdAt: Date;
  jobTitle?: string;
  company?: string;
  applicationStatus?: 'draft' | 'applied' | 'interview' | 'rejected' | 'accepted';
}

// Job analysis results from AI
export interface JobAnalysis {
  requiredSkills: string[];
  preferredSkills: string[];
  technologies: string[];
  experienceLevel: 'entry' | 'mid' | 'senior' | 'lead';
  industryFocus: string[];
  keyResponsibilities: string[];
  keywords: string[];
}

// AI tailoring suggestions
export interface TailoringSuggestions {
  professionalSummary: string;
  skillsReordering: string[];
  experienceModifications: {
    originalIndex: number;
    modifiedDescription: string[];
    addedKeywords: string[];
  }[];
  projectModifications: {
    originalIndex: number;
    modifiedDescription: string;
    enhancedAchievements: string[];
  }[];
  addedKeywords: string[];
  atsScore: number;
}

// File upload states
export interface UploadState {
  isUploading: boolean;
  progress: number;
  error?: string;
  success?: boolean;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// PDF generation options
export interface PdfGenerationOptions {
  template: 'modern' | 'classic' | 'minimal';
  fontSize: 'small' | 'medium' | 'large';
  colorScheme: 'black' | 'blue' | 'gray';
  includePhoto: boolean;
}

// ATS optimization analysis
export interface AtsAnalysis {
  score: number;
  keywordDensity: { [keyword: string]: number };
  suggestions: string[];
  formatCompatibility: boolean;
  readabilityScore: number;
}

// Resume comparison for side-by-side view
export interface ResumeComparison {
  original: ResumeContent;
  tailored: ResumeContent;
  changes: {
    section: keyof ResumeContent;
    type: 'modified' | 'added' | 'reordered';
    description: string;
  }[];
}

// Application tracking
export interface Application {
  id: string;
  userId: string;
  tailoredResumeId: string;
  company: string;
  position: string;
  applicationDate: Date;
  status: 'applied' | 'interview' | 'rejected' | 'accepted';
  notes?: string;
  followUpDate?: Date;
}

// User preferences
export interface UserPreferences {
  defaultTemplate: string;
  autoSave: boolean;
  emailNotifications: boolean;
  defaultSkillsOrder: string[];
  preferredFileFormat: 'pdf' | 'docx';
}

// Form validation types
export interface FormErrors {
  [key: string]: string | undefined;
}

// Loading states for different operations
export interface LoadingStates {
  uploading: boolean;
  parsing: boolean;
  analyzing: boolean;
  tailoring: boolean;
  generating: boolean;
}

// Navigation and UI state
export interface NavigationState {
  currentStep: 'upload' | 'analyze' | 'tailor' | 'preview' | 'download';
  canProceed: boolean;
  hasUnsavedChanges: boolean;
}

// Export types for external use
export type ResumeSection = keyof ResumeContent;
export type ApplicationStatus = Application['status'];
export type SubscriptionTier = User['subscription'];
export type ExperienceLevel = JobAnalysis['experienceLevel']; 