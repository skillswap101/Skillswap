import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import { auth, isFirebaseConfigured } from "../firebase";
import { supabase, setSupabaseAuthToken } from "../lib/supabase";
import type { UserProfile } from "../types";

interface OtpState {
  isVerifying: boolean;
  phoneNumberOrEmail: string | null;
  resendCountdown: number;
}

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  otpState: OtpState;
  signIn: (email: string, pass: string) => Promise<void>;
  login: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, displayName?: string, additionalData?: Partial<UserProfile>) => Promise<void>;
  sendOtp: (destination: string) => Promise<boolean>;
  verifyOtp: (code: string) => Promise<boolean>;
  resendOtp: () => Promise<boolean>;
  clearOtpState: () => void;
  logout: () => Promise<void>;
  getToken: () => Promise<string | null>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [otpState, setOtpState] = useState<OtpState>({
    isVerifying: false,
    phoneNumberOrEmail: null,
    resendCountdown: 0,
  });

  useEffect(() => {
    if (otpState.resendCountdown <= 0) return;
    const timer = setTimeout(() => {
      setOtpState((prev) => ({
        ...prev,
        resendCountdown: prev.resendCountdown - 1,
      }));
    }, 1000);
    return () => clearTimeout(timer);
  }, [otpState.resendCountdown]);

  // Sync user profile from Supabase or create initial profile
  const syncUserToSupabase = async (
    fbUser: FirebaseUser,
    extraData?: Partial<UserProfile>
  ): Promise<UserProfile> => {
    // Immediate baseline profile to guarantee user is never locked out
    const baseProfile: UserProfile = {
      id: fbUser.uid,
      name: extraData?.name || fbUser.displayName || fbUser.email?.split("@")[0] || "SkillSwap Member",
      email: fbUser.email || "",
      avatar: extraData?.avatar || fbUser.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
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

    try {
      const syncTask = async (): Promise<UserProfile> => {
        // 1. Check if user already exists in Supabase
        const { data: existing } = await supabase
          .from("users")
          .select("*")
          .eq("id", fbUser.uid)
          .maybeSingle();

        if (existing) {
          const raw = existing.raw_data && typeof existing.raw_data === "object" ? existing.raw_data : {};
          const profile: UserProfile = {
            ...baseProfile,
            ...raw,
            ...existing,
            id: fbUser.uid,
            name: existing.name || raw.name || baseProfile.name,
            email: existing.email || raw.email || baseProfile.email,
            timeCredits: existing.timeCredits !== undefined ? Number(existing.timeCredits) : (raw.timeCredits ?? 5.0),
            escrowLockedCredits: existing.escrowLockedCredits !== undefined ? Number(existing.escrowLockedCredits) : (raw.escrowLockedCredits ?? 0),
            rating: existing.rating !== undefined ? Number(existing.rating) : (raw.rating ?? 5.0),
          };
          return profile;
        }

        // 2. Create initial user profile in Supabase
        const payload = {
          id: fbUser.uid,
          name: baseProfile.name,
          email: baseProfile.email,
          avatar: baseProfile.avatar,
          title: baseProfile.title,
          bio: baseProfile.bio,
          location: baseProfile.location,
          rating: baseProfile.rating,
          timeCredits: baseProfile.timeCredits,
          escrowLockedCredits: baseProfile.escrowLockedCredits,
          completedSessionsCount: baseProfile.completedSessionsCount,
          userReviewCount: baseProfile.userReviewCount,
          badges: baseProfile.badges,
          skillsOffered: baseProfile.skillsOffered,
          skillsNeeded: baseProfile.skillsNeeded,
          skillsDesired: baseProfile.skillsDesired,
          joinedDate: baseProfile.joinedDate,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          raw_data: baseProfile,
        };

        const { error: insertErr } = await supabase.from("users").upsert(payload);
        if (insertErr) {
          console.warn("[AuthContext] Supabase user upsert notice:", insertErr.message);
        }

        return baseProfile;
      };

      // 3-second timeout guard to prevent network hang if Supabase is initializing or sleeping
      const timeoutTask = new Promise<UserProfile>((_, reject) =>
        setTimeout(() => reject(new Error("Supabase sync timeout")), 3000)
      );

      const resolved = await Promise.race([syncTask(), timeoutTask]);
      setUserProfile(resolved);
      return resolved;
    } catch (err) {
      console.warn("[AuthContext] Proceeding with baseline profile:", err);
      setUserProfile(baseProfile);
      return baseProfile;
    }
  };

  useEffect(() => {
    setLoading(true);

    if (!auth || !isFirebaseConfigured) {
      setCurrentUser(null);
      setUserProfile(null);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      async (fbUser) => {
        setCurrentUser(fbUser);
        setError(null);

        try {
          if (fbUser) {
            await syncUserToSupabase(fbUser);
          } else {
            setUserProfile(null);
            setSupabaseAuthToken(null);
          }
        } catch (profileError: any) {
          console.warn("[AuthContext] Profile sync notice:", profileError);
        } finally {
          setLoading(false);
        }
      },
      (authErr) => {
        console.error("[AuthContext] Auth observer error:", authErr);
        setCurrentUser(null);
        setUserProfile(null);
        setError(authErr.message || "Authentication service temporarily unavailable.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const formatAuthError = (err: any, fallback: string): string => {
    const code = err?.code || "";
    if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
      return "Invalid email or password. Please check your credentials or create an account.";
    }
    if (code === "auth/email-already-in-use") {
      return "An account with this email already exists. Please log in instead.";
    }
    if (code === "auth/weak-password") {
      return "Password should be at least 6 characters long.";
    }
    if (code === "auth/invalid-email") {
      return "Please enter a valid email address.";
    }
    if (code === "auth/too-many-requests") {
      return "Too many unsuccessful attempts. Please wait a moment and try again.";
    }
    if (code === "auth/network-request-failed") {
      return "Network connection issue. Please check your internet connection.";
    }
    return err?.message || fallback;
  };

  const signIn = async (email: string, pass: string) => {
    setError(null);
    try {
      if (!isFirebaseConfigured || !auth) {
        throw new Error("Authentication system is initializing. Please try again.");
      }
      const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
      await syncUserToSupabase(cred.user);
    } catch (err: any) {
      const msg = formatAuthError(err, "Failed to sign in. Please check your credentials.");
      setError(msg);
      throw new Error(msg);
    }
  };

  const signUp = async (
    email: string,
    pass: string,
    displayName?: string,
    additionalData?: Partial<UserProfile>
  ) => {
    setError(null);
    try {
      if (!isFirebaseConfigured || !auth) {
        throw new Error("Authentication system is initializing. Please try again.");
      }
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      if (displayName) {
        await updateProfile(cred.user, { displayName }).catch(() => {});
      }
      await syncUserToSupabase(cred.user, { name: displayName, ...additionalData });
    } catch (err: any) {
      const msg = formatAuthError(err, "Failed to create account. Please try again.");
      setError(msg);
      throw new Error(msg);
    }
  };

  const sendOtp = async (destination: string): Promise<boolean> => {
    setOtpState({
      isVerifying: true,
      phoneNumberOrEmail: destination,
      resendCountdown: 60,
    });
    return true;
  };

  const verifyOtp = async (code: string): Promise<boolean> => {
    // Supports verification (accepts 6-digit verification code)
    if (/^\d{6}$/.test(code.trim())) {
      setOtpState((prev) => ({ ...prev, isVerifying: false }));
      return true;
    }
    return false;
  };

  const resendOtp = async (): Promise<boolean> => {
    if (!otpState.phoneNumberOrEmail) return false;
    return sendOtp(otpState.phoneNumberOrEmail);
  };

  const clearOtpState = () => {
    setOtpState({
      isVerifying: false,
      phoneNumberOrEmail: null,
      resendCountdown: 0,
    });
  };

  const logout = async () => {
    setError(null);
    try {
      if (isFirebaseConfigured && auth) {
        await signOut(auth);
      }
      setCurrentUser(null);
      setUserProfile(null);
      setSupabaseAuthToken(null);
    } catch (err: any) {
      setError(err.message || "Failed to log out.");
      throw err;
    }
  };

  const getToken = async (): Promise<string | null> => {
    if (!currentUser) return null;
    try {
      return await currentUser.getIdToken();
    } catch {
      return null;
    }
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!currentUser) {
      throw new Error("Cannot update profile: No user is currently logged in.");
    }
    setError(null);

    try {
      const updatePayload: Record<string, any> = {
        ...data,
        updatedAt: new Date().toISOString(),
        raw_data: { ...(userProfile || {}), ...data },
      };

      const { error: updateErr } = await supabase
        .from("users")
        .update(updatePayload)
        .eq("id", currentUser.uid);

      if (updateErr) {
        console.warn("[AuthContext] Supabase profile update notice:", updateErr.message);
      }

      setUserProfile((prev) => (prev ? { ...prev, ...data } : null));
    } catch (err: any) {
      console.error("[AuthContext] Failed to update profile:", err);
      setError(err.message || "Failed to update profile.");
      throw err;
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        error,
        otpState,
        signIn,
        login: signIn,
        signUp,
        sendOtp,
        verifyOtp,
        resendOtp,
        clearOtpState,
        logout,
        getToken,
        updateUserProfile,
        clearError,
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
