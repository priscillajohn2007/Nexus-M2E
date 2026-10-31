import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, UserRole } from '../types/index.js';
import { api } from '../services/api.js';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  pendingVerificationEmail: string | null;
  resetTokenParam: string | null;
  setPendingVerificationEmail: (email: string | null) => void;
  setResetTokenParam: (token: string | null) => void;
  login: (email: string, password: string) => Promise<UserProfile>;
  register: (fullName: string, email: string, password: string) => Promise<{ verificationLink: string; email: string }>;
  verifyToken: (token: string) => Promise<UserProfile>;
  resendVerification: (email: string) => Promise<{ verificationLink: string; cooldownSeconds?: number }>;
  chooseRole: (role: UserRole) => Promise<UserProfile>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(api.getAuthToken());
  const [loading, setLoading] = useState(true);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(() => {
    try {
      return localStorage.getItem('nexus_pending_email');
    } catch {
      return null;
    }
  });
  const [resetTokenParam, setResetTokenParam] = useState<string | null>(null);

  // Keep pending email in sync with localStorage
  const updatePendingEmail = (email: string | null) => {
    setPendingVerificationEmail(email);
    try {
      if (email) {
        localStorage.setItem('nexus_pending_email', email);
      } else {
        localStorage.removeItem('nexus_pending_email');
      }
    } catch {
      // ignore
    }
  };

  // Check URL params on mount for email verification or password reset links
  useEffect(() => {
    const handleUrlTokens = async () => {
      try {
        const url = new URL(window.location.href);
        const urlVerifyToken = url.searchParams.get('token');
        const isReset = url.searchParams.get('reset') === 'true' || url.pathname.includes('/reset-password');

        if (urlVerifyToken && isReset) {
          setResetTokenParam(urlVerifyToken);
          // clean URL
          window.history.replaceState({}, document.title, window.location.pathname);
          setLoading(false);
          return;
        }

        if (urlVerifyToken && !isReset) {
          // Direct email verification link clicked!
          try {
            const res = await api.verifyEmail(urlVerifyToken);
            setUser(res.session.user);
            setToken(res.session.token);
            updatePendingEmail(null);
            // clean URL query
            window.history.replaceState({}, document.title, window.location.pathname);
            setLoading(false);
            return;
          } catch (err: any) {
            console.error('URL verification failed:', err);
          }
        }

        // Normal session restoration
        const existingToken = api.getAuthToken();
        if (existingToken) {
          try {
            const meRes = await api.getMe();
            setUser(meRes.user);
            setToken(existingToken);
          } catch {
            api.setAuthToken(null);
            setToken(null);
            setUser(null);
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    handleUrlTokens();
  }, []);

  const login = async (email: string, password: string): Promise<UserProfile> => {
    try {
      const res = await api.login(email, password);
      setUser(res.session.user);
      setToken(res.session.token);
      updatePendingEmail(null);
      return res.session.user;
    } catch (err: any) {
      // If error indicates unverified, save email to pendingVerificationEmail
      if (err.message && err.message.toLowerCase().includes('verify your email')) {
        updatePendingEmail(email);
      }
      throw err;
    }
  };

  const register = async (fullName: string, email: string, password: string) => {
    const res = await api.register(fullName, email, password);
    updatePendingEmail(email);
    return { verificationLink: res.verificationLink, email: res.email };
  };

  const verifyToken = async (verificationToken: string): Promise<UserProfile> => {
    const res = await api.verifyEmail(verificationToken);
    setUser(res.session.user);
    setToken(res.session.token);
    updatePendingEmail(null);
    return res.session.user;
  };

  const resendVerification = async (email: string) => {
    const res = await api.resendVerification(email);
    updatePendingEmail(email);
    return { verificationLink: res.verificationLink, cooldownSeconds: res.cooldownSeconds };
  };

  const chooseRole = async (role: UserRole): Promise<UserProfile> => {
    const res = await api.chooseRole(role);
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    api.setAuthToken(null);
    setToken(null);
    setUser(null);
    updatePendingEmail(null);
    setResetTokenParam(null);
  };

  const refreshUser = async () => {
    if (!api.getAuthToken()) return;
    try {
      const res = await api.getMe();
      setUser(res.user);
    } catch {
      logout();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        pendingVerificationEmail,
        resetTokenParam,
        setPendingVerificationEmail: updatePendingEmail,
        setResetTokenParam,
        login,
        register,
        verifyToken,
        resendVerification,
        chooseRole,
        logout,
        refreshUser
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
