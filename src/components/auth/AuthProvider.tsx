'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider, COLLECTIONS } from '@/lib/firebase';
import { User } from '@/types';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          // Get or create user profile
          const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: userData.name || firebaseUser.displayName || '',
              createdAt: userData.createdAt ? new Date(userData.createdAt) : new Date(),
              subscription: userData.subscription || 'free',
            });
          } else {
            // Create new user profile
            const newUser: User = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || '',
              createdAt: new Date(),
              subscription: 'free',
            };
            
            await setDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid), {
              ...newUser,
              createdAt: newUser.createdAt.toISOString(),
            });
            
            setUser(newUser);
          }
        } catch (error) {
          console.error('Error handling user data:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // The onAuthStateChanged will handle the rest
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user profile
      const newUser: User = {
        uid: result.user.uid,
        email: email,
        name: name,
        createdAt: new Date(),
        subscription: 'free',
      };
      
      await setDoc(doc(db, COLLECTIONS.USERS, result.user.uid), {
        ...newUser,
        createdAt: newUser.createdAt.toISOString(),
      });
      
      // The onAuthStateChanged will handle setting the user state
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      
      // Check if user profile exists, create if not
      const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, result.user.uid));
      
      if (!userDoc.exists()) {
        const newUser: User = {
          uid: result.user.uid,
          email: result.user.email || '',
          name: result.user.displayName || '',
          createdAt: new Date(),
          subscription: 'free',
        };
        
        await setDoc(doc(db, COLLECTIONS.USERS, result.user.uid), {
          ...newUser,
          createdAt: newUser.createdAt.toISOString(),
        });
      }
      
      // The onAuthStateChanged will handle setting the user state
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setFirebaseUser(null);
    } catch (error) {
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    firebaseUser,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 