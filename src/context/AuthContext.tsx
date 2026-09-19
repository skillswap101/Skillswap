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
  signUp: (email: string, pass: string, displayName?: string, additionalData?: Partial<UserProfile>) => Promise<void>;
  sendOtp: (destination: string) => Promise<boolean>;
  verifyOtp: (code: string) => Promise<boolean>;
  resendOtp: () => Promise<boolean>;
  logout: () => Promise<void>;
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
    try {
      const token = await fbUser.getIdToken().catch(() => null);
      if (token) setSupabaseAuthToken(token);

      // 1. Check if user already exists in Supabase
      const { data: existing, error: fetchErr } = await supabase
        .from("users")
        .select("*")
        .eq("id", fbUser.uid)
        .maybeSingle();

      if (existing) {
        const raw = existing.raw_data && typeof existing.raw_data === "object" ? existing.raw_data : {};
        const profile: UserProfile = {
          ...raw,
          ...existing,
          id: fbUser.uid,
          name: existing.name || raw.name || fbUser.displayName || "SkillSwap Member",
          email: existing.email || raw.email || fbUser.email || "",
          timeCredits: existing.timeCredits !== undefined ? Number(existing.timeCredits) : (raw.timeCredits ?? 5.0),
          escrowLockedCredits: existing.escrowLockedCredits !== undefined ? Number(existing.escrowLockedCredits) : (raw.escrowLockedCredits ?? 0),
          rating: existing.rating !== undefined ? Number(existing.rating) : (raw.rating ?? 5.0),
        };
        setUserProfile(profile);
        return profile;
      }

      // 2. Create initial user profile
      const newProfile: UserProfile = {
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

      const payload = {
        id: fbUser.uid,
        name: newProfile.name,
        email: newProfile.email,
        avatar: newProfile.avatar,
        title: newProfile.title,
        bio: newProfile.bio,
        location: newProfile.location,
        rating: newProfile.rating,
        timeCredits: newProfile.timeCredits,
        escrowLockedCredits: newProfile.escrowLockedCredits,
        completedSessionsCount: newProfile.completedSessionsCount,
        userReviewCount: newProfile.userReviewCount,
        badges: newProfile.badges,
        skillsOffered: newProfile.skillsOffered,
        skillsNeeded: newProfile.skillsNeeded,
        skillsDesired: newProfile.skillsDesired,
        joinedDate: newProfile.joinedDate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        raw_data: newProfile,
      };

      const { error: insertErr } = await supabase.from("users").upsert(payload);
      if (insertErr) {
        console.warn("[AuthContext] Supabase user upsert notice:", insertErr.message);
      }

      setUserProfile(newProfile);
      return newProfile;
    } catch (err) {
      console.error("[AuthContext] Supabase profile sync failed:", err);
      // Fallback local profile so user is not blocked
      const fallbackProfile: UserProfile = {
        id: fbUser.uid,
        name: fbUser.displayName || fbUser.email?.split("@")[0] || "SkillSwap Member",
        email: fbUser.email || "",
        avatar: fbUser.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        rating: 5.0,
        timeCredits: 5.0,
        escrowLockedCredits: 0,
      };
      setUserProfile(fallbackProfile);
      return fallbackProfile;
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
          console.error("[AuthContext] User profile synchronization error:", profileError);
          setError(profileError?.message || "Unable to synchronize user profile.");
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

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, pass: string) => {
    setError(null);
    try {
      if (isFirebaseConfigured && auth) {
        const cred = await signInWithEmailAndPassword(auth, email, pass);
        await syncUserToSupabase(cred.user);
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
    displayName?: string,
    additionalData?: Partial<UserProfile>
  ) => {
    setError(null);
    try {
      if (isFirebaseConfigured && auth) {
        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        if (displayName) {
          await updateProfile(cred.user, { displayName });
        }
        await syncUserToSupabase(cred.user, { name: displayName, ...additionalData });
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
    const message = "Phone OTP verification is not configured yet. Please use email/password authentication.";
    setError(message);
    return false;
  };

  const verifyOtp = async (code: string): Promise<boolean> => {
    const message = "Phone OTP verification is not configured yet. Please use email/password authentication.";
    setError(message);
    return false;
  };

  const resendOtp = async (): Promise<boolean> => {
    if (!otpState.phoneNumberOrEmail) return false;
    return sendOtp(otpState.phoneNumberOrEmail);
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

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!currentUser) {
      throw new Error("Cannot update profile: No user is currently logged in.");
    }
    setError(null);

    try {
      const token = await currentUser.getIdToken().catch(() => null);
      if (token) setSupabaseAuthToken(token);

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
        console.warn("[AuthContext] Supabase profile update error:", updateErr.message);
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
        signUp,
        sendOtp,
        verifyOtp,
        resendOtp,
        logout,
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
