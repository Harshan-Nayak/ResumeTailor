import { GoogleGenerativeAI } from '@google/generative-ai';
import { ResumeContent } from '@/types';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '');

// AI model configuration
const MODEL_NAME = 'gemini-1.5-flash';
const generationConfig = {
  temperature: 0.3,
  topP: 0.8,
  topK: 40,
  maxOutputTokens: 8192,
};

/**
 * Convert PDF buffer to base64 for Gemini
 */
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Parse PDF resume and tailor it for a specific job in one step
 */
export async function parseAndTailorResume(
  pdfBuffer: ArrayBuffer,
  jobDescription: string,
  jobTitle?: string,
  company?: string
): Promise<ResumeContent> {
  const model = genAI.getGenerativeModel({ model: MODEL_NAME, generationConfig });

  const base64Data = bufferToBase64(pdfBuffer);

  // First, extract the original resume structure
  const extractStructurePrompt = `
Analyze this PDF resume and return ONLY a JSON object listing all the sections present.

Return format:
{
  "sections": ["personalInfo", "education", "experience", "projects", "skills", "achievements"]
}

Only include sections that actually exist in the PDF. Be very careful - if a section doesn't exist, don't include it.

Examples of what to look for:
- Personal Info (name, contact) → "personalInfo"
- Education → "education" 
- Work Experience → "experience"
- Projects → "projects"
- Skills → "skills"
- Achievements/Awards → "achievements"
- Certifications → "certifications"
- Professional Summary/Objective → "professionalSummary"

Return ONLY the JSON with sections array.
  `;

  try {
    // Step 1: Extract original resume structure
    console.log('AI: Extracting original resume structure...');
    const structureResult = await model.generateContent([
      extractStructurePrompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: 'application/pdf'
        }
      }
    ]);

    const structureResponse = await structureResult.response;
    const structureText = structureResponse.text();
    
    console.log('AI: Structure response:', structureText);
    
    const structureMatch = structureText.match(/\{[\s\S]*\}/);
    if (!structureMatch) {
      throw new Error('Could not extract resume structure');
    }

    const originalStructure = JSON.parse(structureMatch[0]);
    const originalSections = originalStructure.sections || [];
    
    console.log('AI: Original resume sections:', originalSections);

  const prompt = `
You are an expert resume optimization specialist. Analyze the uploaded PDF resume and tailor it for the specific job described below.

JOB DETAILS:
${jobTitle ? `Position: ${jobTitle}` : ''}
${company ? `Company: ${company}` : ''}

JOB DESCRIPTION:
${jobDescription}

CRITICAL INSTRUCTIONS - DYNAMIC STRUCTURE PRESERVATION:
1. FIRST: Scan the original PDF and identify EVERY section present
2. SECOND: Create JSON with ONLY those exact sections found - NOTHING MORE, NOTHING LESS
3. THIRD: Only modify content in Experience, Projects, Skills (if they exist)
4. NEVER ADD any section that doesn't exist in original
5. NEVER ASSUME any section is "required" - be completely dynamic

ABSOLUTE RULES:
- Original has Personal Info only → Generated has Personal Info only
- Original has Personal Info + Skills → Generated has Personal Info + Skills only  
- Original has Personal Info + Education + Experience → Generated has those 3 only
- Original has Personal Info + Education + Experience + Projects + Achievements + Skills → Generated has all 6

NO ASSUMPTIONS - BE COMPLETELY DYNAMIC:
- Don't assume Education is required
- Don't assume Experience is required  
- Don't assume Projects is required
- Don't assume Skills is required
- Don't assume ANY section is required except Personal Info

MODIFICATION RULES (only if section exists in original):

IF EXPERIENCE EXISTS in original:
- Keep EXACT same job titles, companies, durations
- Enhance descriptions with job-relevant keywords
- Bold key technical terms (**bold**)

IF PROJECTS EXISTS in original:
- Keep EXACT same project names and durations
- Enhance descriptions with relevant technologies  
- Bold key technical terms (**bold**)

IF SKILLS EXISTS in original:
- Reorder to prioritize job-relevant skills first
- Group similar technologies together

ALL OTHER SECTIONS (Education, Achievements, Certifications, etc.):
- Keep EXACTLY as they were in original
- NO modifications to content

FORBIDDEN ACTIONS:
- Adding Links section (unless in original)
- Adding Coursework section (unless in original)  
- Adding Certifications section (unless in original)
- Adding Professional Summary (unless in original)
- Adding Education section (unless in original)
- Adding Experience section (unless in original)
- Adding Projects section (unless in original)
- Adding Skills section (unless in original)
- Adding ANY section not found in original

DYNAMIC OUTPUT FORMAT:
Step 1: List all sections found in original PDF
Step 2: Create JSON with ONLY those sections
Step 3: Apply modifications only to Experience/Projects/Skills if they exist

EXAMPLE SCENARIOS:

Scenario A - Original has: Personal Info, Skills
Generated JSON:
{
  "personalInfo": { ... },
  "skills": { ... } // modified for job relevance
}

Scenario B - Original has: Personal Info, Education, Experience, Projects, Skills  
Generated JSON:
{
  "personalInfo": { ... },
  "education": [ ... ], // unchanged
  "experience": [ ... ], // modified for job relevance
  "projects": [ ... ], // modified for job relevance  
  "skills": { ... } // modified for job relevance
}

Scenario C - Original has: Personal Info, Education, Achievements
Generated JSON:
{
  "personalInfo": { ... },
  "education": [ ... ], // unchanged
  "achievements": [ ... ] // unchanged
}

FINAL VALIDATION:
Before returning JSON, confirm it has EXACTLY the same sections as the original resume - no more, no less.

Return ONLY the JSON, no additional text or explanations.
  `;

    // Step 2: Generate tailored resume
    console.log('AI: Generating tailored resume...');
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: 'application/pdf'
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();
    
    console.log('AI Response (first 500 chars):', text.substring(0, 500));
    
    // Clean and parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No valid JSON found in AI response:', text);
      throw new Error('No valid JSON found in AI response');
    }

    const cleanedJson = jsonMatch[0];
    console.log('Extracted JSON (first 500 chars):', cleanedJson.substring(0, 500));
    
    let resumeContent;
    try {
      resumeContent = JSON.parse(cleanedJson);
    } catch (parseError) {
      console.error('JSON parsing failed:', parseError);
      console.error('Cleaned JSON:', cleanedJson);
      throw new Error(`JSON parsing failed: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`);
    }
    
    // Step 3: STRICT VALIDATION - Remove any sections not in original
    console.log('AI: Applying strict validation...');
    console.log('AI: Generated sections:', Object.keys(resumeContent));
    console.log('AI: Original sections:', originalSections);
    
    const validatedContent: any = {};
    
    // Only include sections that were in the original resume
    originalSections.forEach((section: string) => {
      if (resumeContent[section]) {
        validatedContent[section] = resumeContent[section];
        console.log(`AI: Keeping section: ${section}`);
      } else {
        console.warn(`AI: Original section ${section} missing in generated content`);
      }
    });
    
    // Remove any extra sections that weren't in original
    Object.keys(resumeContent).forEach((section: string) => {
      if (!originalSections.includes(section)) {
        console.warn(`AI: Removing unwanted section: ${section}`);
      }
    });
    
    // Validate required structure
    if (!validatedContent.personalInfo || !validatedContent.personalInfo.name) {
      console.error('Invalid resume structure. PersonalInfo:', validatedContent.personalInfo);
      throw new Error('Invalid resume structure returned by AI - missing personalInfo or name');
    }

    console.log('AI: Final validated sections:', Object.keys(validatedContent));
    console.log('Resume parsing and tailoring completed successfully');
    
    return validatedContent as ResumeContent;

  } catch (error) {
    console.error('AI parsing and tailoring error:', error);
    throw new Error(`Failed to parse and tailor resume: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Legacy function - keeping for backwards compatibility but using mock data
 */
export async function analyzeJobDescription(jobDescription: string) {
  return {
    requiredSkills: ['JavaScript', 'React', 'Node.js'],
    preferredSkills: ['TypeScript', 'AWS', 'Docker'],
    technologies: ['React', 'Node.js', 'MongoDB'],
    experienceLevel: 'mid',
    industryFocus: ['Technology', 'Software'],
    keyResponsibilities: ['Develop web applications', 'Collaborate with team'],
    keywords: ['frontend', 'backend', 'full-stack']
  };
}

/**
 * Legacy function - keeping for backwards compatibility but using mock data
 */
export async function generateTailoringSuggestions(masterResumeContent: any, jobAnalysis: any, jobDescription: string) {
  return {
    summaryEnhancements: 'Enhance summary to highlight full-stack development experience',
    skillsReordering: ['JavaScript', 'React', 'Node.js', 'TypeScript'],
    experienceOptimizations: ['Emphasize web application development', 'Highlight team collaboration'],
    keywordIntegration: ['full-stack', 'frontend', 'backend'],
    projectHighlights: ['Focus on React-based projects']
  };
}

/**
 * Legacy function - keeping for backwards compatibility
 */
export function applyTailoringSuggestions(masterResumeContent: any, suggestions: any) {
  return {
    ...masterResumeContent,
    summary: `${masterResumeContent.summary} Experienced in full-stack development with React and Node.js.`,
    skills: {
      ...masterResumeContent.skills,
      technical: ['JavaScript', 'React', 'Node.js', 'TypeScript', ...masterResumeContent.skills.technical.filter((skill: string) => !['JavaScript', 'React', 'Node.js', 'TypeScript'].includes(skill))]
    }
  };
}

/**
 * Calculate ATS optimization score for a resume
 */
export async function calculateAtsScore(
  resume: ResumeContent,
  jobKeywords: string[]
): Promise<number> {
  const model = genAI.getGenerativeModel({ model: MODEL_NAME, generationConfig });

  const prompt = `
    Analyze this resume for ATS (Applicant Tracking System) compatibility and calculate a score from 0-100.

    RESUME:
    ${JSON.stringify(resume, null, 2)}

    JOB KEYWORDS:
    ${jobKeywords.join(', ')}

    Evaluate based on:
    1. Keyword density and relevance (30%)
    2. Format compatibility (25%)
    3. Section organization (20%)
    4. Readability and structure (15%)
    5. Quantifiable achievements (10%)

    Return only a number between 0-100 representing the ATS score.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    const score = parseInt(text);
    return isNaN(score) ? 0 : Math.max(0, Math.min(100, score));
  } catch (error) {
    console.error('Error calculating ATS score:', error);
    return 0;
  }
}

/**
 * Generate improvement suggestions for better ATS compatibility
 */
export async function generateAtsImprovements(
  resume: ResumeContent,
  currentScore: number,
  jobKeywords: string[]
): Promise<string[]> {
  const model = genAI.getGenerativeModel({ model: MODEL_NAME, generationConfig });

  const prompt = `
    Provide specific, actionable suggestions to improve the ATS score of this resume.

    CURRENT RESUME:
    ${JSON.stringify(resume, null, 2)}

    CURRENT ATS SCORE: ${currentScore}/100

    TARGET JOB KEYWORDS:
    ${jobKeywords.join(', ')}

    Provide 5-7 specific, actionable suggestions to improve ATS compatibility.
    Focus on:
    - Missing keywords that could be naturally incorporated
    - Format improvements
    - Section optimization
    - Quantification opportunities

    Return suggestions as a JSON array of strings:
    ["suggestion 1", "suggestion 2", ...]

    Return ONLY the JSON array, no additional text.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    const suggestions = JSON.parse(text);
    return Array.isArray(suggestions) ? suggestions : [];
  } catch (error) {
    console.error('Error generating ATS improvements:', error);
    return [];
  }
}