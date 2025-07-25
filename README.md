# AI Resume Tailor

An intelligent resume tailoring application that uses AI (Google Gemini) to optimize your resume for specific job descriptions. Built with Next.js 14, Firebase, and Google Gemini AI.

## ✨ Features

- **Smart Resume Parsing**: Upload PDF resumes and extract structured information
- **AI-Powered Tailoring**: Analyze job descriptions and optimize resumes with relevant keywords
- **Google OAuth Authentication**: Secure login with Google accounts
- **ATS Optimization**: Generate ATS-friendly resumes with professional formatting
- **Side-by-Side Comparison**: View original vs. tailored resume differences
- **PDF Generation**: Download optimized resumes as professional PDFs
- **Real-time Processing**: Fast AI analysis and content optimization

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- Firebase project
- Google Gemini API key

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd resume-tailor
npm install
```

### 2. Environment Setup

Create a `.env.local` file in the root directory:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here

# Google OAuth (already configured)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=193499289955-q43tvngotqkv2b6rl3g2phftkls8p6ve.apps.googleusercontent.com

# AI API Keys
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here
```

### 3. Firebase Setup

1. **Create a Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Create a new project
   - Enable Google Analytics (optional)

2. **Enable Authentication**
   - Go to Authentication > Sign-in method
   - Enable Google provider
   - Add your domain to authorized domains

3. **Create Firestore Database**
   - Go to Firestore Database
   - Create database in production mode
   - Set up security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can read/write their own resumes
    match /masterResumes/{resumeId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    match /tailoredResumes/{resumeId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    match /applications/{applicationId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    match /userPreferences/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

4. **Enable Storage**
   - Go to Storage
   - Get started with default settings
   - Update storage rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /resumes/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /tailored-pdfs/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 4. Get Google Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the API key to your `.env.local` file

### 5. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📱 How to Use

1. **Sign In**: Click "Sign in with Google" to authenticate
2. **Upload Resume**: Upload your PDF resume on the upload page
3. **Add Job Description**: Paste the job description you're targeting
4. **AI Analysis**: Let the AI analyze and tailor your resume
5. **Review Changes**: Compare original vs. tailored resume
6. **Download PDF**: Get your optimized resume as a PDF

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Authentication**: Firebase Auth (Google OAuth)
- **Database**: Firestore
- **Storage**: Firebase Storage
- **AI**: Google Gemini (Gemini-1.5-Flash)
- **PDF**: @react-pdf/renderer, pdf-parse
- **Deployment**: Vercel (recommended)

## 📂 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard page
│   ├── upload/            # Resume upload page
│   └── tailor/            # Resume tailoring page
├── components/            # React components
│   ├── auth/              # Authentication components
│   ├── resume/            # Resume-related components
│   ├── shared/            # Shared UI components
│   └── ui/                # shadcn/ui components
├── lib/                   # Utility libraries
│   ├── firebase.ts        # Firebase configuration
│   ├── ai-service.ts      # Gemini AI integration
│   └── pdf-utils.ts       # PDF processing utilities
└── types/                 # TypeScript type definitions
```

## 🔒 Security Features

- Google OAuth authentication
- Firestore security rules
- Input validation and sanitization
- File type and size restrictions
- User data isolation

## 🚀 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repo to [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Environment Variables for Production

Make sure to update these in your production environment:
- `NEXT_PUBLIC_APP_URL`: Your production domain
- Firebase config: Use production Firebase project
- `NEXTAUTH_SECRET`: Generate a secure secret

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter issues:

1. Check environment variables are set correctly
2. Verify Firebase setup and permissions
3. Ensure Gemini API key is valid
4. Check browser console for errors

## 🔮 Future Enhancements

- [ ] Multiple resume templates
- [ ] Bulk job application tracking
- [ ] Resume analytics dashboard
- [ ] Integration with job boards
- [ ] Cover letter generation
- [ ] ATS score improvements
- [ ] Resume version history
- [ ] Team collaboration features

---

Built with ❤️ using Next.js, Firebase, and Google Gemini AI.
