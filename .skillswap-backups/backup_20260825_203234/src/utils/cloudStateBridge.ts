import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  setDoc,
  getDoc,
  getDocs,
  writeBatch,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import {
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth";
import { useEffect, useRef, useState } from "react";

import { db, auth } from "../firebase";

import {
  CURRENT_USER,
  INITIAL_SKILLS,
  INITIAL_PROPOSALS,
  INITIAL_SESSIONS,
  INITIAL_MESSAGES,
  INITIAL_REVIEWS,
} from "../data/mockData";

import type {
  User,
  Skill,
  SwapProposal,
  Session,
  ChatMessage,
  Review,
} from "../types";

export interface CloudState {
  currentUser: User;
  skills: Skill[];
  proposals: SwapProposal[];
  sessions: Session[];
  messages: ChatMessage[];
  reviews: Review[];

  loading: boolean;
  authenticated: boolean;
  error: string | null;

  setCurrentUser: (user: User) => Promise<void>;
  setSkills: React.Dispatch<React.SetStateAction<Skill[]>>;
  setProposals: React.Dispatch<React.SetStateAction<SwapProposal[]>>;
  setSessions: React.Dispatch<React.SetStateAction<Session[]>>;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setReviews: React.Dispatch<React.SetStateAction<Review[]>>;
}

const DEV_SEED_ENABLED =
  import.meta.env.DEV &&
  import.meta.env.VITE_ENABLE_MOCK_SEED === "true";

function firebaseUserToDomainUser(
  firebaseUser: FirebaseUser,
  existing?: Partial<User>,
): User {
  return {
    ...CURRENT_USER,
    ...existing,
    id: firebaseUser.uid,
    name:
      existing?.name ||
      firebaseUser.displayName ||
      CURRENT_USER.name,
    avatar:
      existing?.avatar ||
      firebaseUser.photoURL ||
      CURRENT_USER.avatar,
    email:
      (firebaseUser.email || existing?.email || CURRENT_USER.email),
  } as User;
}

function cleanData<T>(snapshot: QueryDocumentSnapshot<DocumentData>): T {
  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as T;
}

async function ensureCurrentUserDocument(
  firebaseUser: FirebaseUser,
): Promise<User> {
  const userRef = doc(db, "users", firebaseUser.uid);
  const existing = await getDoc(userRef);

  if (existing.exists()) {
    return firebaseUserToDomainUser(
      firebaseUser,
      existing.data() as Partial<User>,
    );
  }

  const newUser = firebaseUserToDomainUser(firebaseUser);

  await setDoc(
    userRef,
    {
      ...newUser,
      id: firebaseUser.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );

  return newUser;
}

async function seedDevelopmentData() {
  if (!DEV_SEED_ENABLED) {
    return;
  }

  const seedCollections: Array<[string, unknown[]]> = [
    ["skills", INITIAL_SKILLS],
    ["proposals", INITIAL_PROPOSALS],
    ["sessions", INITIAL_SESSIONS],
    ["messages", INITIAL_MESSAGES],
    ["reviews", INITIAL_REVIEWS],
  ];

  for (const [collectionName, records] of seedCollections) {
    const collectionRef = collection(db, collectionName);
    const existing = await getDocs(query(collectionRef));

    if (!existing.empty) {
      continue;
    }

    const batch = writeBatch(db);

    for (const record of records as Array<{ id?: string }>) {
      if (!record.id) {
        continue;
      }

      batch.set(
        doc(db, collectionName, record.id),
        record,
        { merge: true },
      );
    }

    await batch.commit();
    console.info(
      `[SkillSwap CloudBridge] seeded ${collectionName}`,
    );
  }
}

export function useCloudStateBridge(): CloudState {
  const [currentUser, setCurrentUserState] =
    useState<User>(CURRENT_USER);

  const [skills, setSkills] =
    useState<Skill[]>([]);

  const [proposals, setProposals] =
    useState<SwapProposal[]>([]);

  const [sessions, setSessions] =
    useState<Session[]>([]);

  const [messages, setMessages] =
    useState<ChatMessage[]>([]);

  const [reviews, setReviews] =
    useState<Review[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [authenticated, setAuthenticated] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const uidRef = useRef<string | null>(null);

  useEffect(() => {
    let disposed = false;

    const unsubscribers: Unsubscribe[] = [];

    const stop = () => {
      for (const unsubscribe of unsubscribers) {
        try {
          unsubscribe();
        } catch {
          // Listener already stopped.
        }
      }
      unsubscribers.length = 0;
    };

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        stop();

        if (disposed) {
          return;
        }

        if (!firebaseUser) {
          uidRef.current = null;
          setAuthenticated(false);
          setLoading(false);
          setError(null);

          setSkills([]);
          setProposals([]);
          setSessions([]);
          setMessages([]);
          setReviews([]);
          return;
        }

        try {
          uidRef.current = firebaseUser.uid;
          setAuthenticated(true);
          setLoading(true);
          setError(null);

          const user = await ensureCurrentUserDocument(firebaseUser);

          if (disposed) {
            return;
          }

          setCurrentUserState(user);

          await seedDevelopmentData();

          if (disposed) {
            return;
          }

          const skillsQuery = query(
            collection(db, "skills"),
          );

          unsubscribers.push(
            onSnapshot(
              skillsQuery,
              (snapshot) => {
                if (disposed) return;
                setSkills(
                  snapshot.docs.map(
                    (doc) => cleanData<Skill>(doc),
                  ),
                );
              },
              (err) => {
                console.error(
                  "[CloudBridge] skills listener:",
                  err,
                );
                if (!disposed) {
                  setError(
                    "Unable to synchronize skills with Firestore.",
                  );
                }
              },
            ),
          );

          const proposalsQuery = query(
            collection(db, "proposals"),
            where("participantIds", "array-contains", firebaseUser.uid),
          );

          unsubscribers.push(
            onSnapshot(
              proposalsQuery,
              (snapshot) => {
                if (disposed) return;
                setProposals(
                  snapshot.docs.map(
                    (doc) => cleanData<SwapProposal>(doc),
                  ),
                );
              },
              (err) => {
                console.error(
                  "[CloudBridge] proposals listener:",
                  err,
                );
                if (!disposed) {
                  setError(
                    "Unable to synchronize swap proposals.",
                  );
                }
              },
            ),
          );

          const sessionsQuery = query(
            collection(db, "sessions"),
            where("participantIds", "array-contains", firebaseUser.uid),
          );

          unsubscribers.push(
            onSnapshot(
              sessionsQuery,
              (snapshot) => {
                if (disposed) return;
                setSessions(
                  snapshot.docs.map(
                    (doc) => cleanData<Session>(doc),
                  ),
                );
              },
              (err) => {
                console.error(
                  "[CloudBridge] sessions listener:",
                  err,
                );
              },
            ),
          );

          const messagesQuery = query(
            collection(db, "messages"),
            where("participantIds", "array-contains", firebaseUser.uid),
          );

          unsubscribers.push(
            onSnapshot(
              messagesQuery,
              (snapshot) => {
                if (disposed) return;
                setMessages(
                  snapshot.docs.map(
                    (doc) => cleanData<ChatMessage>(doc),
                  ),
                );
              },
              (err) => {
                console.error(
                  "[CloudBridge] messages listener:",
                  err,
                );
              },
            ),
          );

          const reviewsQuery = query(
            collection(db, "reviews"),
          );

          unsubscribers.push(
            onSnapshot(
              reviewsQuery,
              (snapshot) => {
                if (disposed) return;
                setReviews(
                  snapshot.docs.map(
                    (doc) => cleanData<Review>(doc),
                  ),
                );
              },
              (err) => {
                console.error(
                  "[CloudBridge] reviews listener:",
                  err,
                );
              },
            ),
          );

          if (!disposed) {
            setLoading(false);
          }
        } catch (err) {
          console.error(
            "[CloudBridge] initialization failed:",
            err,
          );
          if (!disposed) {
            setError(
              err instanceof Error
                ? err.message
                : "Cloud state initialization failed.",
            );
            setLoading(false);
          }
        }
      },
    );

    return () => {
      disposed = true;
      stop();
      unsubscribeAuth();
    };
  }, []);

  const setCurrentUser = async (user: User) => {
    const uid = uidRef.current;

    if (!uid) {
      throw new Error(
        "Cannot update user without an authenticated Firebase user.",
      );
    }

    const userRef = doc(db, "users", uid);

    await setDoc(
      userRef,
      {
        ...user,
        id: uid,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );

    setCurrentUserState({
      ...user,
      id: uid,
    });
  };

  return {
    currentUser,
    skills,
    proposals,
    sessions,
    messages,
    reviews,
    loading,
    authenticated,
    error,
    setCurrentUser,
    setSkills,
    setProposals,
    setSessions,
    setMessages,
    setReviews,
  };
}
