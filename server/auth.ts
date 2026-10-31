import crypto from 'crypto';
import { db } from './db.js';
import { UserProfile, UserRole, UserRoleRecord } from '../src/types/index.js';

export interface AuthCredential {
  userId: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  isVerified: boolean;
  verificationToken: string | null;
  verificationExpiresAt: string | null;
  lastVerificationSentAt: string | null;
  resetToken: string | null;
  resetExpiresAt: string | null;
  createdAt: string;
}

export interface SessionRecord {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

// In-memory/DB-persisted auth tables
export interface AuthDatabaseSchema {
  profiles: UserProfile[];
  userRoles: UserRoleRecord[];
  credentials: AuthCredential[];
  sessions: SessionRecord[];
}

// Retrieve or initialize auth collections in database
export function getAuthData(): AuthDatabaseSchema {
  const current = db.getData() as any;
  if (!current.auth) {
    current.auth = {
      profiles: [],
      userRoles: [],
      credentials: [],
      sessions: []
    };
    db.commit();
  }
  return current.auth;
}

export function hashPassword(password: string): { salt: string; hash: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

export function verifyPassword(password: string, salt: string, hash: string): boolean {
  try {
    const computedHash = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(computedHash, 'hex'), Buffer.from(hash, 'hex'));
  } catch (err) {
    return false;
  }
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Register a new user.
 * Creates profile table entry automatically (simulating database trigger).
 * Requires email verification before any app access.
 */
export async function register(fullName: string, emailInput: string, password: string, appUrl: string): Promise<{
  user: UserProfile;
  verificationToken: string;
  verificationLink: string;
}> {
  const email = emailInput.trim().toLowerCase();
  
  // 1. Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email address format.');
  }

  // 2. Password strength validation (min 8 characters)
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters long.');
  }

  const authData = getAuthData();

  // 3. Email already registered check
  const existing = authData.credentials.find(c => c.email === email);
  if (existing) {
    throw new Error('An account with this email is already registered.');
  }

  const userId = `usr-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const { salt, hash } = hashPassword(password);
  const verificationToken = generateToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 3600 * 1000).toISOString(); // 24 hours

  // Database Trigger Simulation: create profile entry
  const profile: UserProfile = {
    id: userId,
    fullName: fullName.trim(),
    email,
    createdAt: now.toISOString(),
    role: null,
    isVerified: false,
    avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80`
  };

  const credential: AuthCredential = {
    userId,
    email,
    passwordHash: hash,
    passwordSalt: salt,
    isVerified: false,
    verificationToken,
    verificationExpiresAt: expiresAt,
    lastVerificationSentAt: now.toISOString(),
    resetToken: null,
    resetExpiresAt: null,
    createdAt: now.toISOString()
  };

  authData.profiles.push(profile);
  authData.credentials.push(credential);
  db.commit();

  const verificationLink = `${appUrl}/verify?token=${verificationToken}`;

  db.logAudit(
    fullName,
    'task_status_changed',
    `Registered new account for ${email} (Awaiting email verification)`,
    'meeting',
    userId
  );

  return {
    user: profile,
    verificationToken,
    verificationLink
  };
}

/**
 * Verify Email with Token
 */
export async function verifyEmailToken(token: string): Promise<{
  user: UserProfile;
  sessionToken: string;
}> {
  const authData = getAuthData();
  const credential = authData.credentials.find(c => c.verificationToken === token);

  if (!credential) {
    throw new Error('Invalid or expired verification link.');
  }

  if (credential.verificationExpiresAt && new Date(credential.verificationExpiresAt) < new Date()) {
    throw new Error('Verification link has expired. Please request a new one.');
  }

  credential.isVerified = true;
  credential.verificationToken = null;
  credential.verificationExpiresAt = null;

  const profile = authData.profiles.find(p => p.id === credential.userId);
  if (profile) {
    profile.isVerified = true;
  }

  // Create session
  const sessionToken = generateToken();
  authData.sessions.push({
    token: sessionToken,
    userId: credential.userId,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString() // 30 days
  });

  db.commit();

  return {
    user: profile || {
      id: credential.userId,
      fullName: credential.email.split('@')[0],
      email: credential.email,
      createdAt: credential.createdAt,
      isVerified: true,
      role: null
    },
    sessionToken
  };
}

/**
 * Resend Verification Email with 60s Rate Limiting Cooldown
 */
export async function resendVerification(emailInput: string, appUrl: string): Promise<{
  verificationToken: string;
  verificationLink: string;
  cooldownSecondsRemaining: number;
}> {
  const email = emailInput.trim().toLowerCase();
  const authData = getAuthData();
  const credential = authData.credentials.find(c => c.email === email);

  if (!credential) {
    throw new Error('No account found with that email address.');
  }

  if (credential.isVerified) {
    throw new Error('This account is already verified. Please sign in.');
  }

  const now = Date.now();
  if (credential.lastVerificationSentAt) {
    const elapsed = Math.floor((now - new Date(credential.lastVerificationSentAt).getTime()) / 1000);
    const cooldownSeconds = 60;
    if (elapsed < cooldownSeconds) {
      throw new Error(`Please wait ${cooldownSeconds - elapsed} seconds before requesting another verification email.`);
    }
  }

  const newToken = generateToken();
  credential.verificationToken = newToken;
  credential.verificationExpiresAt = new Date(now + 24 * 3600 * 1000).toISOString();
  credential.lastVerificationSentAt = new Date(now).toISOString();
  db.commit();

  const verificationLink = `${appUrl}/verify?token=${newToken}`;
  return {
    verificationToken: newToken,
    verificationLink,
    cooldownSecondsRemaining: 60
  };
}

/**
 * Login User
 */
export async function login(emailInput: string, password: string): Promise<{
  token?: string;
  user?: UserProfile;
  requiresVerification?: boolean;
  email?: string;
}> {
  const email = emailInput.trim().toLowerCase();
  const authData = getAuthData();
  const credential = authData.credentials.find(c => c.email === email);

  if (!credential) {
    throw new Error('Invalid email or password.');
  }

  const isValidPassword = verifyPassword(password, credential.passwordSalt, credential.passwordHash);
  if (!isValidPassword) {
    throw new Error('Invalid email or password.');
  }

  // Block unverified users
  if (!credential.isVerified) {
    return {
      requiresVerification: true,
      email: credential.email
    };
  }

  const profile = authData.profiles.find(p => p.id === credential.userId);
  const roleRecord = authData.userRoles.find(r => r.userId === credential.userId);

  const sessionToken = generateToken();
  authData.sessions.push({
    token: sessionToken,
    userId: credential.userId,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString()
  });

  db.commit();

  const userProfile: UserProfile = {
    id: credential.userId,
    fullName: profile?.fullName || email.split('@')[0],
    email: credential.email,
    createdAt: profile?.createdAt || credential.createdAt,
    role: roleRecord?.role || null,
    isVerified: true,
    avatar: profile?.avatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80`
  };

  return {
    token: sessionToken,
    user: userProfile
  };
}

/**
 * Request Password Reset Link
 */
export async function requestPasswordReset(emailInput: string, appUrl: string): Promise<{
  resetToken: string;
  resetLink: string;
}> {
  const email = emailInput.trim().toLowerCase();
  const authData = getAuthData();
  const credential = authData.credentials.find(c => c.email === email);

  if (!credential) {
    // Return dummy token to avoid email enumeration
    return {
      resetToken: 'dummy',
      resetLink: `${appUrl}/reset-password?token=dummy`
    };
  }

  const resetToken = generateToken();
  credential.resetToken = resetToken;
  credential.resetExpiresAt = new Date(Date.now() + 3600 * 1000).toISOString(); // 1 hour
  db.commit();

  return {
    resetToken,
    resetLink: `${appUrl}/reset-password?token=${resetToken}`
  };
}

/**
 * Reset Password with Token
 */
export async function resetPassword(token: string, newPassword: string): Promise<boolean> {
  if (!newPassword || newPassword.length < 8) {
    throw new Error('New password must be at least 8 characters long.');
  }

  const authData = getAuthData();
  const credential = authData.credentials.find(c => c.resetToken === token);

  if (!credential) {
    throw new Error('Invalid or expired password reset link.');
  }

  if (credential.resetExpiresAt && new Date(credential.resetExpiresAt) < new Date()) {
    throw new Error('Password reset link has expired. Please request a new one.');
  }

  const { salt, hash } = hashPassword(newPassword);
  credential.passwordHash = hash;
  credential.passwordSalt = salt;
  credential.resetToken = null;
  credential.resetExpiresAt = null;

  db.commit();
  return true;
}

/**
 * Assign Role (One-time during onboarding).
 * Users cannot change their own role after setting it (security policy).
 */
export async function assignUserRole(userId: string, role: UserRole): Promise<UserRoleRecord> {
  const authData = getAuthData();
  const existingRole = authData.userRoles.find(r => r.userId === userId);

  if (existingRole) {
    throw new Error('User role is already assigned and cannot be changed.');
  }

  const roleRecord: UserRoleRecord = {
    userId,
    role,
    assignedAt: new Date().toISOString()
  };

  authData.userRoles.push(roleRecord);

  // Also sync profile role
  const profile = authData.profiles.find(p => p.id === userId);
  if (profile) {
    profile.role = role;
  }

  db.commit();
  return roleRecord;
}

/**
 * Get User from Session Token
 */
export function getSessionUser(token: string): UserProfile | null {
  if (!token) return null;
  const authData = getAuthData();
  const session = authData.sessions.find(s => s.token === token);
  if (!session) return null;

  if (new Date(session.expiresAt) < new Date()) {
    return null;
  }

  const profile = authData.profiles.find(p => p.id === session.userId);
  const credential = authData.credentials.find(c => c.userId === session.userId);
  const roleRecord = authData.userRoles.find(r => r.userId === session.userId);

  if (!credential) return null;

  return {
    id: credential.userId,
    fullName: profile?.fullName || credential.email.split('@')[0],
    email: credential.email,
    createdAt: profile?.createdAt || credential.createdAt,
    role: roleRecord?.role || null,
    isVerified: credential.isVerified,
    avatar: profile?.avatar
  };
}

/**
 * Security-Definer Role Check Function: has_role()
 * Enforces role-based security policies without recursive escalation.
 */
export function hasRole(userId: string, requiredRole: UserRole): boolean {
  const authData = getAuthData();
  const record = authData.userRoles.find(r => r.userId === userId);
  return record?.role === requiredRole;
}
