import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  isDemo: boolean;
  signIn: (email: string, token?: string) => void;
  signUp: (email: string) => void;
  signInAsDemo: () => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDemo, setIsDemo] = useState<boolean>(false);

  useEffect(() => {
    // Check localStorage session
    const savedUser = localStorage.getItem('eventmate_user');
    const savedToken = localStorage.getItem('eventmate_token');
    const savedDemo = localStorage.getItem('eventmate_is_demo');

    if (savedDemo === 'true') {
      setIsDemo(true);
      api.setDemoMode(true);
      setUser({
        userId: 'demo-user-123',
        email: 'demo.organiser@awsbuilder.edu',
        name: 'Student Organiser (Demo)',
        isDemo: true,
      });
      setToken('demo-token-123');
      api.setToken('demo-token-123');
    } else if (savedUser && savedToken) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        setToken(savedToken);
        api.setToken(savedToken);
        api.setDemoMode(false);
      } catch {
        // invalid
      }
    }
    setIsLoading(false);
  }, []);

  const signIn = (email: string, customToken?: string) => {
    const fakeId = `usr_${Math.random().toString(36).substring(2, 9)}`;
    const actualToken = customToken || `demo-token-${fakeId}`;
    const userProfile: UserProfile = {
      userId: fakeId,
      email,
      name: email.split('@')[0],
      isDemo: false,
    };
    setUser(userProfile);
    setToken(actualToken);
    setIsDemo(false);
    api.setDemoMode(false);
    api.setToken(actualToken);

    localStorage.setItem('eventmate_user', JSON.stringify(userProfile));
    localStorage.setItem('eventmate_token', actualToken);
    localStorage.removeItem('eventmate_is_demo');
  };

  const signUp = (email: string) => {
    signIn(email);
  };

  const signInAsDemo = () => {
    const demoProfile: UserProfile = {
      userId: 'demo-user-123',
      email: 'demo.organiser@awsbuilder.edu',
      name: 'Student Organiser (Demo)',
      isDemo: true,
    };
    setUser(demoProfile);
    setToken('demo-token-123');
    setIsDemo(true);
    api.setDemoMode(true);
    api.setToken('demo-token-123');

    localStorage.setItem('eventmate_user', JSON.stringify(demoProfile));
    localStorage.setItem('eventmate_token', 'demo-token-123');
    localStorage.setItem('eventmate_is_demo', 'true');
  };

  const signOut = () => {
    setUser(null);
    setToken(null);
    setIsDemo(false);
    api.setToken(null);
    api.setDemoMode(false);
    localStorage.removeItem('eventmate_user');
    localStorage.removeItem('eventmate_token');
    localStorage.removeItem('eventmate_is_demo');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isDemo,
        signIn,
        signUp,
        signInAsDemo,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
