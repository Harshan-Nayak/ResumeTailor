import { NextRequest, NextResponse } from 'next/server';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';
import { storage, db, STORAGE_PATHS, COLLECTIONS } from '@/lib/firebase';
import { validatePdfFile, generateResumeFilename } from '@/lib/pdf-utils';

export async function POST(request: NextRequest) {
  try {
    console.log('Upload API: Starting file upload...');
    
    // Get the form data
    const formData = await request.formData();
    const file = formData.get('resume') as File;
    const userIdFromForm = formData.get('userId') as string; // Get userId from form

    console.log('Upload API: File received:', file?.name, file?.size);
    console.log('Upload API: User ID from form:', userIdFromForm);

    // Validate file
    if (!file) {
      console.log('Upload API: No file provided');
      return NextResponse.json({
        success: false,
        message: 'Resume file is required'
      }, { status: 400 });
    }

    // Validate PDF file
    const validation = validatePdfFile(file);
    if (!validation.isValid) {
      console.log('Upload API: File validation failed:', validation.error);
      return NextResponse.json({
        success: false,
        message: validation.error || 'Invalid file'
      }, { status: 400 });
    }

    // Use provided userId or fallback to timestamp-based ID
    const userId = userIdFromForm || `user_${Date.now()}`;
    console.log('Upload API: Using userId:', userId);

    // Generate unique filename
    const fileName = generateResumeFilename(userId, file.name);
    const filePath = `${STORAGE_PATHS.RESUMES}/${userId}/${fileName}`;
    
    console.log('Upload API: Generated file path:', filePath);

    // Upload file to Firebase Storage
    const storageRef = ref(storage, filePath);
    const uploadResult = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(uploadResult.ref);

    console.log('Upload API: File uploaded successfully, URL:', downloadURL);

    // Create master resume document
    const resumeId = `${userId}_${Date.now()}`;
    const masterResume = {
      id: resumeId,
      userId: userId,
      originalFileName: file.name,
      fileName: fileName,
      fileSize: file.size,
      pdfUrl: downloadURL,
      uploadedAt: new Date().toISOString(),
      isParsed: false,
      content: null,
      rawText: '',
      updatedAt: new Date().toISOString()
    };

    console.log('Upload API: Saving to Firestore with ID:', resumeId);

    // Save to Firestore
    await setDoc(doc(db, COLLECTIONS.MASTER_RESUMES, resumeId), masterResume);

    console.log('Upload API: Successfully saved to Firestore');

    return NextResponse.json({
      success: true,
      message: 'Resume uploaded successfully',
      data: {
        resumeId,
        fileName: file.name
      }
    });

  } catch (error) {
    console.error('Upload API Error:', error);
    
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to upload resume'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  );
} 