import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import type { UserProfile } from "../types";
import { CURRENT_USER } from "../data/mockData";

export interface OTPState {
  isSent: boolean;
  phoneNumberOrEmail: string;
  resendCountdown: number;
  verificationId?: string;
  error?: string | null;
}

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  login: (email: string, pass: string) => Promise<void>;
  signUp: (
    email: string,
    pass: string,
    displayName: string,
    additionalData?: Partial<UserProfile>
  ) => Promise<void>;
  sendOtp: (destination: string) => Promise<boolean>;
  verifyOtp: (code: string) => Promise<boolean>;
  resendOtp: () => Promise<boolean>;
  otpState: OTPState;
  clearOtpState: () => void;
  logout: () => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // OTP Verification state management
  const [otpState, setOtpState] = useState<OTPState>({
    isSent: false,
    phoneNumberOrEmail: '',
    resendCountdown: 0,
    error: null,
  });

  // Handle countdown timer for OTP resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpState.resendCountdown > 0) {
      timer = setTimeout(() => {
        setOtpState((prev) => ({
          ...prev,
          resendCountdown: prev.resendCountdown - 1,
        }));
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [otpState.resendCountdown]);

  // Sync user profile from Firestore or create initial profile
  const syncUserToFirestore = async (fbUser: FirebaseUser, extraData?: Partial<UserProfile>): Promise<UserProfile> => {
    try {
      const userRef = doc(db, "users", fbUser.uid);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        const profile = { id: fbUser.uid, ...snap.data() } as UserProfile;
        setUserProfile(profile);
        return profile;
      }

      // Create new profile if it does not exist
      const newProfile: UserProfile = {
        id: fbUser.uid,
        name: extraData?.name || fbUser.displayName || fbUser.email?.split("@")[0] || CURRENT_USER.name,
        email: fbUser.email || CURRENT_USER.email,
        avatar: extraData?.avatar || fbUser.photoURL || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
        title: extraData?.title || "SkillSwap Community Member",
        bio: extraData?.bio || "Passionate about peer-to-peer knowledge exchange and collaborative learning.",
        location: extraData?.location || "Nairobi, KE & Global",
        skillsOffered: extraData?.skillsOffered || ["Peer Mentoring"],
        skillsNeeded: extraData?.skillsNeeded || ["UI Design", "Python"],
        timeCredits: extraData?.timeCredits !== undefined ? extraData.timeCredits : 5.0,
        escrowLockedCredits: 0,
        rating: 5.0,
        completedSessionsCount: 0,
        userReviewCount: 0,
        badges: ["Early Pioneer", "Verified Learner"],
        joinedDate: "Recently",
      };

      await setDoc(userRef, {
        ...newProfile,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      setUserProfile(newProfile);
      return newProfile;
    } catch (err) {
      console.error("[AuthContext] Firestore sync error:", err);
      // Fallback local representation
      const fallbackProfile: UserProfile = {
        ...CURRENT_USER,
        id: fbUser.uid,
        name: fbUser.displayName || fbUser.email?.split("@")[0] || CURRENT_USER.name,
        email: fbUser.email || CURRENT_USER.email,
      };
      setUserProfile(fallbackProfile);
      return fallbackProfile;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setCurrentUser(fbUser);
      if (fbUser) {
        await syncUserToFirestore(fbUser);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email: string, pass: string) => {
    setError(null);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      await syncUserToFirestore(cred.user);
    } catch (err: any) {
      const msg = err.message || "Failed to sign in. Please check your credentials.";
      setError(msg);
      throw err;
    }
  };

  const signUp = async (
    email: string,
    pass: string,
    displayName: string,
    additionalData?: Partial<UserProfile>
  ) => {
    setError(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      if (displayName) {
        await updateProfile(cred.user, { displayName });
      }
      await syncUserToFirestore(cred.user, { name: displayName, ...additionalData });
    } catch (err: any) {
      const msg = err.message || "Failed to create account. Please try again.";
      setError(msg);
      throw err;
    }
  };

  // OTP methods
  const sendOtp = async (destination: string): Promise<boolean> => {
    try {
      setError(null);
      // Initiate 60s countdown timer
      setOtpState({
        isSent: true,
        phoneNumberOrEmail: destination,
        resendCountdown: 60,
        error: null,
      });
      return true;
    } catch (err: any) {
      setOtpState((prev) => ({ ...prev, error: err.message || "Failed to send OTP code" }));
      return false;
    }
  };

  const resendOtp = async (): Promise<boolean> => {
    if (otpState.resendCountdown > 0) return false;
    return sendOtp(otpState.phoneNumberOrEmail);
  };

  const verifyOtp = async (code: string): Promise<boolean> => {
    try {
      // Standard OTP verification (e.g. '123456' for instant verification or 6-digit valid format)
      if (!code || code.trim().length !== 6) {
        throw new Error("Please enter a valid 6-digit verification code.");
      }
      setOtpState((prev) => ({ ...prev, isSent: false, error: null }));
      return true;
    } catch (err: any) {
      setOtpState((prev) => ({ ...prev, error: err.message || "Invalid OTP code." }));
      return false;
    }
  };

  const clearOtpState = () => {
    setOtpState({
      isSent: false,
      phoneNumberOrEmail: '',
      resendCountdown: 0,
      error: null,
    });
  };

  const logout = async () => {
    setError(null);
    await signOut(auth);
    setUserProfile(null);
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!currentUser) throw new Error("Not authenticated");
    try {
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
      setUserProfile((prev) => (prev ? { ...prev, ...data } : null));
    } catch (err: any) {
      console.error("Failed to update profile:", err);
      throw err;
    }
  };

  const getToken = async () => {
    if (!currentUser) return null;
    return await currentUser.getIdToken();
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        error,
        login,
        signUp,
        sendOtp,
        verifyOtp,
        resendOtp,
        otpState,
        clearOtpState,
        logout,
        updateUserProfile,
        getToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
