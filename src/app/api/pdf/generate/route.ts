import { NextRequest, NextResponse } from 'next/server';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, STORAGE_PATHS } from '@/lib/firebase';
import { ResumeContent } from '@/types';
import { generateResumeHTML, generateTestResumeHTML } from '@/lib/pdf-utils';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export async function POST(req: NextRequest) {
  let browser: any;
  let page;
  
  try {
    const { content, userId, jobTitle, company, jobDescription } = await req.json();
    
    console.log('PDF Generate API: Starting Puppeteer HTML-to-PDF generation...');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    console.log('PDF Generate API: Generating HTML content...');
    
    // Start with simple HTML for testing
    let htmlContent: string;
    if (!content || !content.personalInfo) {
      console.log('PDF Generate API: Creating simple test HTML...');
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Test Resume</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; }
            p { margin: 10px 0; }
          </style>
        </head>
        <body>
          <h1>Test Resume</h1>
          <p>Name: John Doe</p>
          <p>Email: john.doe@example.com</p>
          <p>Phone: +1 (555) 123-4567</p>
          <h2>Skills</h2>
          <p>JavaScript, React, Node.js, TypeScript</p>
          <h2>Experience</h2>
          <p>Software Developer at Tech Company</p>
          <p>Built web applications and worked with modern technologies</p>
        </body>
        </html>
      `;
    } else {
      console.log('PDF Generate API: Creating resume HTML with content sections:', Object.keys(content));
      
      // Debug skills data structure
      if (content.skills) {
        console.log('PDF Generate API: Skills data structure:');
        console.log('  - Skills keys:', Object.keys(content.skills));
        Object.keys(content.skills).forEach(key => {
          const value = (content.skills as any)[key];
          console.log(`  - ${key}:`, Array.isArray(value) ? `Array(${value.length})` : typeof value, Array.isArray(value) ? value : value);
        });
      } else {
        console.log('PDF Generate API: No skills data found');
      }
      
      // Log job description info for debugging
      console.log('PDF Generate API: Job description provided:', !!jobDescription);
      if (jobDescription) {
        console.log('PDF Generate API: Job description length:', jobDescription.length);
      }
      
      htmlContent = generateResumeHTML(content, jobDescription);
    }

    console.log('PDF Generate API: HTML generated, launching Puppeteer...');

    // Launch Puppeteer with minimal, stable settings
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });

    console.log('PDF Generate API: Browser launched, creating page...');
          
    page = await browser.newPage();
    
    console.log('PDF Generate API: Setting page content...');
    
    // Set content with minimal settings
    await page.setContent(htmlContent, { 
      waitUntil: 'load',
      timeout: 30000
    });

    console.log('PDF Generate API: Content set, waiting before PDF generation...');
    
    // Short wait
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('PDF Generate API: Generating PDF...');

    // Generate PDF with minimal settings
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true
    });

    console.log('PDF Generate API: PDF generated successfully, size:', pdfBuffer.length);

    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new Error('Generated PDF buffer is empty');
    }

    // Debug: Check what's actually in the buffer
    const buffer = Buffer.from(pdfBuffer);
    const bufferStart = buffer.slice(0, 10).toString();
    const bufferHex = buffer.slice(0, 10).toString('hex');
    console.log('PDF Generate API: Buffer starts with:', JSON.stringify(bufferStart));
    console.log('PDF Generate API: Buffer hex:', bufferHex);
    console.log('PDF Generate API: Buffer type:', typeof pdfBuffer);
    console.log('PDF Generate API: Is Buffer?', Buffer.isBuffer(pdfBuffer));

    // Check if it's actually a PDF
    if (!bufferStart.startsWith('%PDF')) {
      console.error('PDF Generate API: Buffer content (first 50 chars):', buffer.slice(0, 50).toString());
      throw new Error(`Generated buffer is not a valid PDF. Starts with: ${JSON.stringify(bufferStart)}`);
    }

    console.log('PDF Generate API: PDF validated, uploading to storage...');

    // Create filename
    const timestamp = Date.now();
    const jobInfo = jobTitle ? `_${jobTitle.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
    const companyInfo = company ? `_${company.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
    const fileName = `puppeteer_resume${jobInfo}${companyInfo}_${timestamp}.pdf`;
    const filePath = `${STORAGE_PATHS.TAILORED_PDFS}/${userId}/${fileName}`;
    const storageRef = ref(storage, filePath);
    
    // Upload with explicit content type
    await uploadBytes(storageRef, buffer, {
      contentType: 'application/pdf',
      customMetadata: {
        'Cache-Control': 'no-cache',
        'generator': 'puppeteer-html-to-pdf'
      }
    });

    const downloadURL = await getDownloadURL(storageRef);

    console.log('PDF Generate API: PDF uploaded successfully:', downloadURL);

    return NextResponse.json({
      success: true,
      message: 'PDF generated successfully using Puppeteer HTML-to-PDF',
      data: {
        downloadURL,
        fileName,
        bufferSize: buffer.length,
        pdfStart: bufferStart,
        generator: 'puppeteer-html-to-pdf',
        sections: content ? Object.keys(content) : ['test'],
        pdfBase64: buffer.toString('base64')
      },
    });

  } catch (error: any) {
    console.error('PDF Generate API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: `Puppeteer PDF generation failed: ${error.message}`,
      details: error.stack
    }, { status: 500 });
  } finally {
    // Ensure cleanup happens in all cases
    console.log('PDF Generate API: Starting cleanup...');
    if (page) {
      try {
        if (!page.isClosed()) {
          await page.close();
          console.log('PDF Generate API: Page closed successfully');
        }
      } catch (e) {
        console.warn('PDF Generate API: Failed to close page:', e);
      }
    }
    if (browser) {
      try {
        if (browser.isConnected()) {
          await browser.close();
          console.log('PDF Generate API: Browser closed successfully');
        }
      } catch (e) {
        console.warn('PDF Generate API: Failed to close browser:', e);
      }
    }
  }
}

export async function GET() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  );
} 