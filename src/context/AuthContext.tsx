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
import { auth, db, isFirebaseConfigured } from "../firebase";
import type { UserProfile } from "../types";

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
      if (!isFirebaseConfigured || !db) {
        throw new Error("Firestore not configured");
      }
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
        name: extraData?.name || fbUser.displayName || fbUser.email?.split("@")[0] || "SkillSwap Member",
        email: fbUser.email || "",
        avatar: extraData?.avatar || fbUser.photoURL || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
        title: extraData?.title || "SkillSwap Community Member",
        bio: extraData?.bio || "Passionate about peer-to-peer knowledge exchange and collaborative learning.",
        location: extraData?.location || "Nairobi, KE & Global",
        skillsOffered: extraData?.skillsOffered || ["Peer Mentoring"],
        skillsNeeded: extraData?.skillsNeeded || ["UI Design", "Python"],
        skillsDesired: extraData?.skillsDesired || extraData?.skillsNeeded || ["UI Design", "Python"],
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
      });

      setUserProfile(newProfile);
      return newProfile;
    } catch (err) {
      console.error("[AuthContext] Firestore profile sync failed:", err);
      throw err;
    }
  };

  useEffect(() => {
    setLoading(true);

    if (!auth || !isFirebaseConfigured) {
      setCurrentUser(null);
      setUserProfile(null);
      setLoading(false);
      setError("Firebase Authentication is not configured.");
      return;
    }

    let unsubscribe = () => {};
    try {
      unsubscribe = onAuthStateChanged(
        auth,
        async (fbUser) => {
          setCurrentUser(fbUser);
          setError(null);

          try {
            if (fbUser) {
              await syncUserToFirestore(fbUser);
            } else {
              setUserProfile(null);
            }
          } catch (profileError: any) {
            console.error("[AuthContext] User profile synchronization failed:", profileError);
            setUserProfile(null);
            setError(
              profileError?.message ||
              "Unable to synchronize your SkillSwap profile."
            );
          } finally {
            setLoading(false);
          }
        },
        (authErr) => {
          console.error("[AuthContext] Auth observer error:", authErr);
          setCurrentUser(null);
          setUserProfile(null);
          setError(authErr.message || "Authentication observer failed.");
          setLoading(false);
        }
      );
    } catch (e) {
      console.warn("[AuthContext] Error setting onAuthStateChanged observer:", e);
      setCurrentUser(null);
      setUserProfile(null);
      setLoading(false);
    }

    return () => {
      try {
        unsubscribe();
      } catch {}
    };
  }, []);

  const login = async (email: string, pass: string) => {
    setError(null);
    try {
      if (isFirebaseConfigured && auth) {
        const cred = await signInWithEmailAndPassword(auth, email, pass);
        await syncUserToFirestore(cred.user);
      } else {
        throw new Error("Firebase Authentication is not configured.");
      }
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
      if (isFirebaseConfigured && auth) {
        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        if (displayName) {
          await updateProfile(cred.user, { displayName });
        }
        await syncUserToFirestore(cred.user, { name: displayName, ...additionalData });
      } else {
        throw new Error("Firebase Authentication is not configured.");
      }
    } catch (err: any) {
      const msg = err.message || "Failed to create account. Please try again.";
      setError(msg);
      throw err;
    }
  };

  const sendOtp = async (destination: string): Promise<boolean> => {
    const message =
      "Phone OTP verification is not configured yet. Please use email/password authentication.";

    setOtpState((prev) => ({
      ...prev,
      isSent: false,
      phoneNumberOrEmail: destination,
      resendCountdown: 0,
      error: message,
    }));
    setError(message);
    return false;
  };

  const resendOtp = async (): Promise<boolean> => {
    if (!otpState.phoneNumberOrEmail) {
      return false;
    }
    return sendOtp(otpState.phoneNumberOrEmail);
  };

  const verifyOtp = async (code: string): Promise<boolean> => {
    const message =
      "Phone OTP verification is not configured yet. No OTP code can be verified.";

    setOtpState((prev) => ({
      ...prev,
      isSent: false,
      error: message,
    }));
    setError(message);
    return false;
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
    try {
      if (isFirebaseConfigured && auth) {
        await signOut(auth);
      }
    } catch (err) {
      console.warn("[AuthContext] Logout warning:", err);
    } finally {
      setCurrentUser(null);
      setUserProfile(null);
      clearOtpState();
    }
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!currentUser || !isFirebaseConfigured || !db) {
      throw new Error("Authenticated Firebase user required for profile updates.");
    }

    try {
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        ...data,
        id: currentUser.uid,
        updatedAt: new Date().toISOString(),
      });
      setUserProfile((prev) => (prev ? { ...prev, ...data, id: currentUser.uid } : null));
    } catch (err: any) {
      console.error("[AuthContext] Profile update failed:", err);
      throw err;
    }
  };

  const getToken = async () => {
    if (!currentUser) return null;
    try {
      return await currentUser.getIdToken();
    } catch {
      return null;
    }
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
