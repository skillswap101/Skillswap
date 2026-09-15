import { firebaseAuth, firestore } from './firebaseAdmin.js';
import { FieldValue } from 'firebase-admin/firestore';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import type { DecodedIdToken } from "firebase-admin/auth";
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mpesaCallbackRouter from './mpesaCallback.js';
import mpesaPayRouter from './mpesaPay.js';
import paypalRouter from './paypal.js';
import stripeRouter from './stripe.js';
import {
  acceptProposal,
  declineProposal,
  completeSession,
  cancelSession,
  CreditsError,
} from './server/services/creditsService.js';

dotenv.config();

// Extend Express Request type to include the verified Firebase decoded token
export interface AuthenticatedRequest extends Request {
  user?: DecodedIdToken;
}

// Middleware to verify Firebase ID Token
export async function verifyFirebaseToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized: No token provided" });
    return;
  }

  const token = authHeader.split("Bearer ")[1];

  if (!firebaseAuth) {
    // Previously this silently accepted the raw token string as a fake uid
    // when Firebase Admin wasn't initialized - i.e. anyone could "log in"
    // as any uid just by sending it as a bearer token. That's gone: if the
    // Admin SDK isn't up, auth fails closed, not open.
    res.status(503).json({ error: "Authentication service unavailable" });
    return;
  }

  try {
    const decodedToken = await firebaseAuth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(403).json({ error: "Unauthorized: Invalid or expired token" });
  }
}

const app = express();

// Helmet's default CSP blocks Vite's inline dev-mode scripts (React Fast
// Refresh preamble) and its HMR WebSocket - both required in dev, neither
// needed in production. That's why the page was blank with no visible
// error: the mechanism that would show Vite's own error overlay was
// itself being blocked.
const isDev = process.env.NODE_ENV !== 'production';
app.use(
  helmet({
    contentSecurityPolicy: isDev
      ? {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            connectSrc: ["'self'", "ws:", "wss:", "https://*.googleapis.com", "https://*.google.com"],
            styleSrc: ["'self'", "https:", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
          },
        }
      : undefined,
  })
);

// Restrict CORS to known frontend origins instead of allowing '*'.
// Set ALLOWED_ORIGINS in .env as a comma-separated list for production,
// e.g. ALLOWED_ORIGINS=https://skillswap.example,https://www.skillswap.example
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Vary', 'Origin');
    }
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

const PORT = Number(process.env.PORT || 3000);

// General API rate limit - applies to everything under /api
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

// Tighter limit for AI + payment endpoints, which cost real money/quota
const expensiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests to this endpoint, please slow down.' },
});

// Mount API Routers
app.use(express.json({ limit: '1mb' }));
app.use('/api', apiLimiter);
app.use(stripeRouter);
app.use(mpesaCallbackRouter);
app.use(mpesaPayRouter);
app.use(paypalRouter);

// Lazy-initialized GenAI client (Gemini)
function getGenAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Lazy-initialized OpenRouter client (DeepSeek R1)
function getOpenRouterClient() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({
    apiKey,
    baseURL: 'https://openrouter.ai/api/v1',
  });
}


// ===== SkillSwap cloud persistence bridge =====
app.post("/api/cloud/:collection/:id", verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const allowed = new Set(["users","skills","proposals","sessions","messages","reviews"]);
    const collectionName = req.params.collection;
    const id = req.params.id;
    if (!allowed.has(collectionName) || !id) {
      return res.status(400).json({ error: "Invalid collection or document id" });
    }

    const body = { ...(req.body || {}) };
    const uid = req.user!.uid;

    // Ownership check on the incoming write. For updates we also need to
    // check the EXISTING document (a user shouldn't be able to overwrite
    // someone else's doc even if they cleverly craft the request body to
    // pass this check) - see existingDoc check below.
    if (collectionName === "users" && id !== uid)
      return res.status(403).json({ error: "User document ownership mismatch" });
    if (collectionName === "skills" && body.userId !== uid)
      return res.status(403).json({ error: "Skill ownership mismatch" });
    if (collectionName === "messages" && body.senderId !== uid)
      return res.status(403).json({ error: "Message sender mismatch" });
    if (collectionName === "proposals") {
      if (!body.senderId || !body.recipientId) {
        return res.status(400).json({ error: "Proposal participants are required" });
      }
      if (body.senderId !== uid && body.recipientId !== uid) {
        return res.status(403).json({ error: "Proposal ownership mismatch" });
      }
    }
    if (collectionName === "sessions") {
      if (!body.mentorId || !body.learnerId) {
        return res.status(400).json({ error: "Session participants are required" });
      }
      if (body.mentorId !== uid && body.learnerId !== uid) {
        return res.status(403).json({ error: "Session participant mismatch" });
      }
    }
    if (collectionName === "reviews") {
      if (!body.authorId) {
        return res.status(400).json({ error: "Review authorId is required" });
      }
      if (body.authorId !== uid) {
        return res.status(403).json({ error: "Review ownership mismatch" });
      }
    }

    // Also check any EXISTING document isn't owned by someone else, for
    // collections where ownership fields aren't always present in the body
    // (e.g. a partial update that only changes `status`).
    if (["proposals", "sessions", "reviews", "messages"].includes(collectionName)) {
      const existing = await firestore.collection(collectionName).doc(id).get();
      if (existing.exists) {
        const data = existing.data() as any;
        const isParticipant =
          data.senderId === uid || data.recipientId === uid ||
          data.mentorId === uid || data.learnerId === uid ||
          data.authorId === uid;
        if (!isParticipant) {
          return res.status(403).json({ error: "Not authorized to modify this document" });
        }
      }
    }

    await firestore.collection(collectionName).doc(id).set(
      { ...body, updatedAt: new Date().toISOString() }, { merge: true }
    );
    return res.json({ ok: true, id });
  } catch (error) {
    console.error("Cloud persistence error:", error);
    return res.status(500).json({ error: "Cloud persistence failed" });
  }
});


// Production hardening: test/diagnostic routes are disabled unless explicitly enabled.
const allowOperationalTestRoutes = process.env.ALLOW_OPERATIONAL_TEST_ROUTES === "true";

app.get("/api/cloud/:collection/:id", verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const allowed = new Set(["users","skills","proposals","sessions","messages","reviews"]);
    const collectionName = req.params.collection;
    const id = req.params.id;
    if (!allowed.has(collectionName) || !id)
      return res.status(400).json({ error: "Invalid collection or document id" });

    const uid = req.user!.uid;
    const snap = await firestore.collection(collectionName).doc(id).get();
    if (!snap.exists) return res.status(404).json({ error: "Not found" });
    const data = snap.data() as any;

    // Previously this returned ANY document to ANY authenticated user who
    // knew (or guessed) its id. Now enforce the same ownership rules as
    // the writes above.
    // Previously `users` was treated as publicly readable here too -
    // matching (and undermining) the same privacy leak just fixed in
    // firestore.rules. This route isn't even called by the current
    // frontend anymore (everything reads Firestore directly via the
    // scoped listeners in useCloudStateBridge), but it's still a live,
    // callable endpoint for anyone with a valid token, so it needed the
    // same fix independently of client usage.
    const publiclyReadable = collectionName === "skills";
    if (!publiclyReadable) {
      const isParticipant =
        (collectionName === "users" && id === uid) ||
        data.senderId === uid || data.recipientId === uid ||
        data.mentorId === uid || data.learnerId === uid ||
        data.authorId === uid;
      if (!isParticipant) {
        return res.status(403).json({ error: "Not authorized to view this document" });
      }
    }

    return res.json({ id: snap.id, ...data });
  } catch (error) {
    console.error("Cloud read error:", error);
    return res.status(500).json({ error: "Cloud read failed" });
  }
});

// ===== Credit / escrow endpoints =====
// These are the ONLY places time credits are ever allowed to move. The
// browser previously mutated `currentUser.timeCredits` directly in React
// state on session completion, and checkout modals (Stripe/M-Pesa/PayPal)
// called onAddCredits(amount) with a client-supplied number and no server
// verification - i.e. anyone could give themselves unlimited credits by
// editing state or replaying a request. That's gone for swap credits;
// see creditsService.ts for the transaction logic. (Purchased-credit
// verification via real payment webhooks is a separate, still-pending fix.)

function handleCreditsError(error: unknown, res: Response) {
  if (error instanceof CreditsError) {
    return res.status(error.status).json({ error: error.message });
  }
  console.error("Credits/escrow error:", error);
  return res.status(500).json({ error: "Operation failed" });
}

app.post("/api/proposals/:id/accept", verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await acceptProposal(req.params.id, req.user!.uid);
    return res.json({ ok: true, ...result });
  } catch (error) {
    return handleCreditsError(error, res);
  }
});

app.post("/api/proposals/:id/decline", verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await declineProposal(req.params.id, req.user!.uid);
    return res.json({ ok: true });
  } catch (error) {
    return handleCreditsError(error, res);
  }
});

app.post("/api/sessions/:id/complete", verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { rating, feedback } = req.body || {};
    await completeSession(
      req.params.id,
      req.user!.uid,
      typeof rating === "number" ? rating : undefined,
      typeof feedback === "string" ? feedback : undefined
    );
    return res.json({ ok: true });
  } catch (error) {
    return handleCreditsError(error, res);
  }
});

app.post("/api/sessions/:id/cancel", verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await cancelSession(req.params.id, req.user!.uid);
    return res.json({ ok: true });
  } catch (error) {
    return handleCreditsError(error, res);
  }
});


// ===== AI routes referenced by the current frontend =====
// These were previously unauthenticated - anyone on the internet could hit
// them and burn your Gemini/OpenRouter quota. Now require a valid Firebase
// token and are rate-limited.
app.post("/api/ai/assistant", verifyFirebaseToken, expensiveLimiter, async (req, res) => {
  try {
    const { query: userQuery, prompt, context } = req.body || {};
    const input = String(userQuery || prompt || "").slice(0, 4000); // cap input length
    const ai = getGenAIClient();

    if (!ai) {
      const answer = `I can help with SkillSwap. You asked: ${input}`;
      return res.json({ answer, response: answer });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `You are the SkillSwap assistant. Help with skill exchanges, proposals, sessions, learning plans and app usage. Context: ${JSON.stringify(context || {})}\nUser: ${input}`,
    });
    const answer = response.text || "I could not generate a response.";
    return res.json({ answer, response: answer });
  } catch (error) {
    console.error("Assistant error:", error);
    return res.status(500).json({ error: "Assistant request failed" });
  }
});

app.post("/api/ai/learning-roadmap", verifyFirebaseToken, expensiveLimiter, async (req, res) => {
  try {
    // NOTE: the frontend (SessionRoomModal.tsx) sends `skillName`, which
    // this handler never read before - the roadmap was always generated
    // for "the requested skill" instead of the actual skill. Now fixed.
    const { skill, skillName, skillTitle, goal, currentLevel, durationWeeks } = req.body || {};
    const resolvedSkill = skillName || skillTitle || skill;
    const ai = getGenAIClient();

    if (!ai) {
      return res.json({
        roadmap: [
          { week: 1, title: "Foundation", tasks: ["Learn core concepts", "Practice a small exercise"] },
          { week: 2, title: "Application", tasks: ["Build a practical project", "Review mistakes"] },
          { week: 3, title: "Fluency", tasks: ["Complete a guided challenge", "Teach back what you learned"] }
        ]
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `Create a practical ${durationWeeks || 4}-week roadmap for "${resolvedSkill || goal || "the requested skill"}". Current level: ${currentLevel || "beginner"}. Include weekly goals, practice tasks and milestones.`,
    });
    return res.json({ roadmap: response.text || "" });
  } catch (error) {
    console.error("Learning roadmap error:", error);
    return res.status(500).json({ error: "Learning roadmap failed" });
  }
});

// ===== Guarded escrow ledger creation =====
app.post("/api/escrow/transfer", verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const uid = req.user!.uid;
    const { amount, recipientId, proposalId, currency = "usd" } = req.body || {};
    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0)
      return res.status(400).json({ error: "Amount must be positive" });
    if (!recipientId || recipientId === uid)
      return res.status(400).json({ error: "Valid recipientId is required" });

    const ref = firestore.collection("escrowTransactions").doc();
    const transaction = {
      id: ref.id, userId: uid, recipientId,
      proposalId: proposalId || null,
      amount: numericAmount, currency,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    await ref.set(transaction);
    return res.status(201).json({ success: true, transaction });
  } catch (error) {
    console.error("Escrow error:", error);
    return res.status(500).json({ error: "Escrow transaction could not be created" });
  }
});

// ===== WebRTC signaling persistence =====
app.post("/api/webrtc/:roomId", verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const roomId = req.params.roomId;
    const uid = req.user!.uid;

    if (!roomId) {
      return res.status(400).json({ error: "roomId required" });
    }

    const body = req.body || {};
    const participantIds = Array.isArray(body.participantIds)
      ? body.participantIds.filter((value: unknown): value is string => typeof value === "string")
      : [];

    if (participantIds.length !== 2 || !participantIds.includes(uid)) {
      return res.status(403).json({
        error: "WebRTC room requires exactly two authenticated participants",
      });
    }

    const roomRef = firestore.collection("webrtcRooms").doc(roomId);
    const existing = await roomRef.get();

    if (existing.exists) {
      const existingData = existing.data() || {};
      const existingParticipants = Array.isArray(existingData.participantIds)
        ? existingData.participantIds
        : [];

      if (existingParticipants.length !== 2 || !existingParticipants.includes(uid)) {
        return res.status(403).json({
          error: "Not authorized to modify this WebRTC room",
        });
      }

      if (
        existingParticipants.some(
          (participant: unknown) => !participantIds.includes(participant as string)
        )
      ) {
        return res.status(403).json({
          error: "WebRTC participant list cannot be changed",
        });
      }
    }

    await roomRef.set(
      {
        ...body,
        participantIds,
        updatedBy: uid,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return res.json({ ok: true, roomId });
  } catch (error) {
    console.error("WebRTC signaling error:", error);
    return res.status(500).json({ error: "WebRTC signaling failed" });
  }
});

// API Routes
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ===== Notifications =====
// Previously these had NO backend implementation at all - the frontend
// (EmailNotificationsModal.tsx) called /api/notifications/* and every
// call 404'd, silently caught by its own try/catch. The bell icon just
// never worked. Also fixed: the old client code passed userId directly
// (readable/writable for ANY user id the caller chose) - now derived
// only from the verified token.
app.get('/api/notifications', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const snap = await firestore.collection('notifications')
      .where('recipientUserId', '==', req.user!.uid)
      .limit(100)
      .get();
    // Sorted here rather than via Firestore orderBy, which combined with
    // the where() above would require a composite index to be created in
    // the Firebase console before this query would work at all.
    const docs = snap.docs
      .map(d => ({ id: d.id, ...d.data() } as any))
      .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
    res.json(docs);
  } catch (error) {
    console.error('Notifications fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

app.patch('/api/notifications/:id/read', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ref = firestore.collection('notifications').doc(req.params.id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'Not found' });
    if (snap.data()!.recipientUserId !== req.user!.uid) {
      return res.status(403).json({ error: 'Not your notification' });
    }
    await ref.update({ read: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

app.post('/api/notifications/mark-all-read', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const snap = await firestore.collection('notifications')
      .where('recipientUserId', '==', req.user!.uid)
      .where('read', '==', false)
      .get();
    const batch = firestore.batch();
    snap.docs.forEach(d => batch.update(d.ref, { read: true }));
    await batch.commit();
    res.json({ success: true, count: snap.size });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

app.delete('/api/notifications/:id', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ref = firestore.collection('notifications').doc(req.params.id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'Not found' });
    if (snap.data()!.recipientUserId !== req.user!.uid) {
      return res.status(403).json({ error: 'Not your notification' });
    }
    await ref.delete();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// Lets a user generate a sample notification into their own inbox to
// preview the UI - can only ever target the caller's own account, never
// another user's (the old client code accepted an arbitrary
// recipientUserId with no server check at all).
app.post('/api/notifications/simulate-test-email', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  if (!allowOperationalTestRoutes && process.env.NODE_ENV === "production") return res.status(404).json({ error: "Not found" });
  try {
    const { category, customSubject } = req.body || {};
    const notification = {
      recipientUserId: req.user!.uid,
      category: category || 'general',
      subject: customSubject || `Test notification: ${category || 'general'}`,
      previewText: 'This is a simulated notification for UI preview purposes.',
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    };
    const ref = await firestore.collection('notifications').add(notification);
    res.json({ success: true, notification: { id: ref.id, ...notification } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to simulate test email' });
  }
});

// ===== Audit dashboard =====
// Also had zero backend before - the "Run Audit" button 404'd every time.
// This runs a small set of REAL checks (not fabricated pass/fail data).
app.get('/api/audit/run', verifyFirebaseToken, async (_req: AuthenticatedRequest, res: Response) => {
  if (!allowOperationalTestRoutes && process.env.NODE_ENV === "production") return res.status(404).json({ error: "Not found" });
  const results: Array<{ id: string; category: string; title: string; status: 'PASS' | 'WARN' | 'FAIL'; detail: string; latencyMs?: number }> = [];

  // Firestore connectivity
  try {
    const start = Date.now();
    await firestore.collection('users').limit(1).get();
    results.push({ id: 'firestore', category: 'FIREBASE', title: 'Firestore connectivity', status: 'PASS', detail: 'Read succeeded', latencyMs: Date.now() - start });
  } catch (e: any) {
    results.push({ id: 'firestore', category: 'FIREBASE', title: 'Firestore connectivity', status: 'FAIL', detail: e?.message || 'Read failed' });
  }

  // Firebase Auth Admin SDK
  results.push({
    id: 'firebase-auth',
    category: 'FIREBASE',
    title: 'Firebase Admin Auth initialized',
    status: firebaseAuth ? 'PASS' : 'FAIL',
    detail: firebaseAuth ? 'Admin SDK is initialized' : 'Admin SDK failed to initialize - check credentials',
  });

  // Payment gateway env vars present (doesn't validate they're correct, just that they exist)
  const stripeConfigured = !!process.env.STRIPE_SECRET_KEY;
  results.push({
    id: 'stripe-config',
    category: 'PAYMENTS',
    title: 'Stripe configuration',
    status: stripeConfigured ? 'PASS' : 'WARN',
    detail: stripeConfigured ? 'STRIPE_SECRET_KEY is set' : 'STRIPE_SECRET_KEY is not set - Stripe checkout will fail',
  });

  const mpesaConfigured = !!(process.env.MPESA_CONSUMER_KEY && process.env.MPESA_CONSUMER_SECRET);
  results.push({
    id: 'mpesa-config',
    category: 'PAYMENTS',
    title: 'M-Pesa Daraja configuration',
    status: mpesaConfigured ? 'PASS' : 'WARN',
    detail: mpesaConfigured ? 'Daraja credentials are set' : 'MPESA_CONSUMER_KEY/SECRET not set - STK push will fail',
  });

  const paypalConfigured = !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
  results.push({
    id: 'paypal-config',
    category: 'PAYMENTS',
    title: 'PayPal configuration',
    status: paypalConfigured ? 'PASS' : 'WARN',
    detail: paypalConfigured ? 'PayPal credentials are set' : 'PAYPAL_CLIENT_ID/SECRET not set - PayPal checkout will fail',
  });

  const failCount = results.filter(r => r.status === 'FAIL').length;
  const warnCount = results.filter(r => r.status === 'WARN').length;
  const overallStatus = failCount > 0 ? 'critical' : warnCount > 0 ? 'warnings' : 'healthy';
  const score = Math.round(((results.length - failCount - warnCount * 0.5) / results.length) * 100);

  res.json({
    timestamp: new Date().toISOString(),
    overallStatus,
    score,
    results,
    summary: `${results.length - failCount - warnCount} passing, ${warnCount} warning, ${failCount} failing`,
  });
});

// (Removed: /api/download-update-script publicly served an internal
// dev-tooling Python script to anyone with no auth. That script has no
// place being reachable from a production deployment at all.)

// AI Proposal Generator Endpoint (Gemini with Native JSON Schema)
app.post('/api/ai/generate-proposal', verifyFirebaseToken, expensiveLimiter, async (req, res) => {
  try {
    const { mySkill, targetSkill, targetUserName, tone, customMessage } = req.body;

    const ai = getGenAIClient();
    if (!ai) {
      return res.json({
        proposal: `Hi ${targetUserName || 'there'}! I saw you're offering to teach ${targetSkill || 'this skill'}, and I'd love to learn from you. In exchange, I can teach you ${mySkill || 'my skill'}. ${customMessage ? `\n\nNote: ${customMessage}` : ''}\n\nLooking forward to connecting and swapping skills!`,
        icebreakers: [
          `What sparked your interest in learning ${mySkill}?`,
          `How long have you been practicing ${targetSkill}?`,
          `What format works best for our first 1-on-1 swap session?`,
        ],
      });
    }

    const prompt = `Write a friendly, compelling, and respectful swap proposal message from a user who wants to learn "${targetSkill}" from ${targetUserName || 'a mentor'} in exchange for teaching "${mySkill}". Tone: ${tone || 'friendly and professional'}. Additional note: "${customMessage || 'None'}".`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            proposal: { type: Type.STRING, description: 'The complete pitch message (2-3 paragraphs).' },
            icebreakers: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Array of 3 conversation starter questions.'
            }
          },
          required: ['proposal', 'icebreakers']
        }
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error) {
    console.error('Error generating proposal:', error);
    return res.status(500).json({ error: 'Failed to generate proposal with AI' });
  }
});

// AI Skill Match & Synergy Analyzer Endpoint (Gemini)
app.post('/api/ai/match', verifyFirebaseToken, expensiveLimiter, async (req, res) => {
  try {
    const { userOffered, userDesired, candidateOffered, candidateDesired } = req.body;

    const ai = getGenAIClient();
    if (!ai) {
      const mutualDirect = userOffered.some((s: string) => candidateDesired.includes(s)) && candidateOffered.some((s: string) => userDesired.includes(s));
      return res.json({
        matchScore: mutualDirect ? 95 : 70,
        synergyReason: mutualDirect ? `Direct reciprocal match!` : `Great cross-disciplinary potential.`,
        recommendedTopics: [`Foundational techniques`, `Practical exercise`, `Review`],
      });
    }

    const prompt = `Analyze compatibility: User A teaches ${JSON.stringify(userOffered)}, wants ${JSON.stringify(userDesired)}. User B teaches ${JSON.stringify(candidateOffered)}, wants ${JSON.stringify(candidateDesired)}.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matchScore: { type: Type.NUMBER, description: 'Match score from 0 to 100' },
            synergyReason: { type: Type.STRING, description: '2-3 sentence explanation' },
            recommendedTopics: { type: Type.ARRAY, items: { type: Type.STRING }, description: '3 specific agenda items' }
          },
          required: ['matchScore', 'synergyReason', 'recommendedTopics']
        }
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error) {
    console.error('Error calculating AI match:', error);
    return res.status(500).json({ error: 'Failed to calculate match synergy' });
  }
});


// (Removed: duplicate, unreachable /api/ai/assistant and
// /api/ai/learning-roadmap handlers that were registered a second time
// further down in this file. Express only ever ran the first registration
// of each route since it returns a response without calling next(); these
// were 100% dead code.)


// DeepSeek R1 Reasoning Endpoint (OpenRouter)
app.post('/api/deepseek-reasoning', verifyFirebaseToken, expensiveLimiter, async (req, res) => {
  try {
    const { prompt } = req.body;
    const openrouter = getOpenRouterClient();

    if (!openrouter) {
      return res.status(400).json({ error: 'OpenRouter API key not configured' });
    }

    const completion = await openrouter.chat.completions.create({
      model: 'deepseek/deepseek-r1',
      messages: [{ role: 'user', content: prompt }],
    });

    res.json({
      result: completion.choices[0].message.content,
      reasoning: (completion.choices[0].message as any).reasoning || null,
    });
  } catch (error: any) {
    console.error('DeepSeek Error:', error);
    res.status(500).json({ error: error.message || 'DeepSeek processing failed' });
  }
});

// (Removed: three different public routes all serving up
// update_skillswap5.py with zero auth - a Termux dev convenience that
// should never have been reachable from the deployed server.)

// Global request abortion & parser error suppressor for Termux mobile instability
app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
  if (err.type === 'entity.parse.failed' || err.code === 'ECONNRESET' || err.message === 'request aborted') {
    console.warn('[Warning] Client connection reset or aborted safely.');
    if (!res.headersSent) {
      res.status(400).json({ error: 'Request aborted or malformed' });
    }
    return;
  }
  next(err);
});

// Vite middleware or static serving
async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

setupServer().catch((err) => {
  console.error('Failed to start server:', err);
});
