import { auth } from '@/config/firebase.config';
import LoadingScreen from '@/screens/loading.screen';
import { saveUserToFirestore } from '@/services/user.service';
import { AppUser } from '@/types';
import { getRole } from '@/utils/role';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { router } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import React, { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';

export type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface Session {
  user: AppUser | null;
  status: SessionStatus;
  error: string | null;
}

interface AuthContextType {
  session: Session;
  signOut: () => Promise<void>;
  setSession: React.Dispatch<React.SetStateAction<Session>>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session>({
    user: null,
    status: 'loading',
    error: null,
  });
  const [authInitialized, setAuthInitialized] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const authCheckCompletedRef = useRef(false);

  // Sign out function
  const signOut = async () => {
    try {
      await GoogleSignin.signOut();
      await auth.signOut();

      setSession({
        user: null,
        status: 'unauthenticated',
        error: null,
      });

      console.log('✅ User signed out successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign-out failed';
      console.log('❌ Sign-out error:', err);

      setSession({
        user: null,
        status: 'unauthenticated',
        error: errorMessage,
      });
    }
  };

  // Setup auth listener once on mount
  useEffect(() => {
    // Skip if already set up (prevents double setup in Strict Mode)
    if (unsubscribeRef.current) {
      console.log('⚠️ Auth listener already set up, skipping');
      return;
    }

    GoogleSignin.configure({
      webClientId: '29326093701-i1ck9cu2q57btndfpd1jrh9hkiblkdd2.apps.googleusercontent.com',
      profileImageSize: 150,
    });

    // Listen to Firebase auth state changes
    unsubscribeRef.current = onAuthStateChanged(auth, async (firebaseUser) => {
      // Skip if we've already processed auth once (prevents race conditions)
      if (authCheckCompletedRef.current && !firebaseUser) {
        console.log('ℹ️ Auth check already completed, skipping duplicate call');
        return;
      }

      try {
        console.log('🔐 Auth state changed:', firebaseUser?.email || 'No user');

        if (firebaseUser) {
          const role = getRole(firebaseUser.email!);

          if (!role) {
            throw new Error('Invalid role. Only CUET students or teachers are allowed.');
          }

          console.log('📥 Fetching user data from Firestore...');

          // Save user to Firestore
          const fetchedUserData = await saveUserToFirestore(firebaseUser);

          if (!fetchedUserData) {
            throw new Error('User data not found in Firestore');
          }

          setSession({
            user: fetchedUserData,
            status: 'authenticated',
            error: null,
          });

          console.log('✅ User authenticated:', fetchedUserData.role, '-', fetchedUserData.email);
        } else {
          setSession({
            user: null,
            status: 'unauthenticated',
            error: null,
          });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load user data';

        setSession({
          user: null,
          status: 'unauthenticated',
          error: errorMessage,
        });
      } finally {
        authCheckCompletedRef.current = true;
        setAuthInitialized(true);
      }
    });

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, []); // Empty dependency array - runs once on mount only

  // Handle navigation based on session state
  useEffect(() => {
    if (!authInitialized || session.status === 'loading') {
      return;
    }

    if (session.status === 'unauthenticated') {
      console.log('🔀 Redirecting to login...');
      router.replace('/(auth)/signin');
      return;
    }

    if (session.status === 'authenticated' && session.user) {
      if (session.user.role === 'teacher') {
        console.log('👨‍🏫 Redirecting to teacher home...');
        router.replace('/(teacher)/(tabs)/home');
      } else if (session.user.role === 'student') {
        console.log('👨‍🎓 Redirecting to student home...');
        router.replace('/(student)/(tabs)/home');
      } else {
        console.log('❌ Unknown user role');
        router.replace('/(auth)/signin');
      }
    }
  }, [authInitialized, session.status, session.user?.role]);

  // Show loading screen while initializing
  if (!authInitialized || session.status === 'loading') {
    return <LoadingScreen />;
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        signOut,
        setSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};