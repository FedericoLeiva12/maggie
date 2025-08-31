import { FirebaseAuthTypes, getAuth } from '@react-native-firebase/auth';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { createUserDocument } from '../lib/userService';

const auth = getAuth();

type User = FirebaseAuthTypes.User | null;

type AuthContextValue = {
  user: User;
  isLoading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<FirebaseAuthTypes.UserCredential>;
  registerWithEmail: (email: string, password: string) => Promise<FirebaseAuthTypes.UserCredential>;
  sendPasswordReset: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      setUser(u);
      setIsLoading(false);
    });
    return unsub;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      signInWithEmail: async (email: string, password: string) => {
        return await auth.signInWithEmailAndPassword(email.trim(), password);
      },
      registerWithEmail: async (email: string, password: string) => {
        const cred = await auth.createUserWithEmailAndPassword(email.trim(), password);
        await createUserDocument(cred.user.uid);
        return cred;
      },
      sendPasswordReset: async (email: string) => {
        await auth.sendPasswordResetEmail(email.trim());
      },
      signOut: async () => {
        await auth.signOut();
      },
    }),
    [user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
