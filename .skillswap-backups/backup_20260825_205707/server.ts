import './firebaseAdmin.js';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import {
  cert,
  getApps,
  initializeApp,
  type ServiceAccount,
} from "firebase-admin/app";
import {
  getAuth,
  type DecodedIdToken,
} from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import serviceAccount from "./serviceaccountkey.json" with { type: 'json' };
import mpesaCallbackRouter from './mpesaCallback.js';
import mpesaPayRouter from './mpesaPay.js';
import paypalRouter from './paypal.js';
import stripeRouter from './stripe.js';

dotenv.config();


let firebaseApp: any = null;
let firebaseAuth: any = null;
let firestore: any = null;

try {
  if (!getApps().length) {
    firebaseApp = initializeApp({
      credential: cert(serviceAccount as unknown as ServiceAccount),
    });
  } else {
    firebaseApp = getApps()[0];
  }
  firebaseAuth = getAuth(firebaseApp);
  firestore = getFirestore(firebaseApp);
} catch (e) {
  console.warn("Firebase Admin initialized in fallback/in-memory mode:", e);
}

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

  try {
    if (firebaseAuth) {
      const decodedToken = await firebaseAuth.verifyIdToken(token);
      req.user = decodedToken;
    } else {
      req.user = { uid: token, email: 'user@skillswap.local' } as unknown as DecodedIdToken;
    }
    next();
  } catch (error) {
    res.status(403).json({ error: "Unauthorized: Invalid or expired token" });
  }
}

const app = express();

// Custom inline CORS middleware for Termux compatibility
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});


const PORT = Number(process.env.PORT || 5000);

// Mount Stripe routes
app.use(stripeRouter);

app.use(express.json());

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

    if (collectionName === "users" && id !== uid)
      return res.status(403).json({ error: "User document ownership mismatch" });
    if (collectionName === "skills" && body.userId !== uid)
      return res.status(403).json({ error: "Skill ownership mismatch" });
    if (collectionName === "messages" && body.senderId !== uid)
      return res.status(403).json({ error: "Message sender mismatch" });

    await firestore.collection(collectionName).doc(id).set(
      { ...body, updatedAt: new Date().toISOString() }, { merge: true }
    );
    return res.json({ ok: true, id });
  } catch (error) {
    console.error("Cloud persistence error:", error);
    return res.status(500).json({ error: "Cloud persistence failed" });
  }
});

app.get("/api/cloud/:collection/:id", verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const allowed = new Set(["users","skills","proposals","sessions","messages","reviews"]);
    const collectionName = req.params.collection;
    const id = req.params.id;
    if (!allowed.has(collectionName) || !id)
      return res.status(400).json({ error: "Invalid collection or document id" });

    const snap = await firestore.collection(collectionName).doc(id).get();
    if (!snap.exists) return res.status(404).json({ error: "Not found" });
    return res.json({ id: snap.id, ...snap.data() });
  } catch (error) {
    console.error("Cloud read error:", error);
    return res.status(500).json({ error: "Cloud read failed" });
  }
});

// ===== AI routes referenced by the current frontend =====
app.post("/api/ai/assistant", async (req, res) => {
  try {
    const { query: userQuery, prompt, context } = req.body || {};
    const input = userQuery || prompt || "";
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

app.post("/api/ai/learning-roadmap", async (req, res) => {
  try {
    const { skill, goal, currentLevel, durationWeeks } = req.body || {};
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
      contents: `Create a practical ${durationWeeks || 4}-week roadmap for "${skill || goal || "the requested skill"}". Current level: ${currentLevel || "beginner"}. Include weekly goals, practice tasks and milestones.`,
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
    if (!roomId) return res.status(400).json({ error: "roomId required" });
    await firestore.collection("webrtcRooms").doc(roomId).set({
      ...req.body,
      updatedBy: req.user!.uid,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
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

app.get('/api/download-update-script', (_req, res) => {
  const scriptPath = path.join(process.cwd(), 'update_skillswap5.py');
  res.download(scriptPath, 'update_skillswap5.py');
});

// AI Proposal Generator Endpoint (Gemini with Native JSON Schema)
app.post('/api/ai/generate-proposal', async (req, res) => {
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
app.post('/api/ai/match', async (req, res) => {
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


// AI Assistant Endpoint
app.post('/api/ai/assistant', async (req, res) => {
  try {
    const { prompt, query, context, mode } = req.body ?? {};
    const userPrompt = String(prompt ?? query ?? '').trim();
    if (!userPrompt) return res.status(400).json({ error: 'A prompt is required' });
    const ai = getGenAIClient();
    if (!ai) {
      const fallback = 'AI fallback mode: configure GEMINI_API_KEY on the server for full assistance.';
      return res.json({ answer: fallback, response: fallback, mode: mode || 'assistant' });
    }
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: `You are the SkillSwap 5.0 assistant. Give concise, practical help.
Context: ${JSON.stringify(context ?? {})}
Mode: ${String(mode ?? 'assistant')}
User request: ${userPrompt}`,
    });
    const answer = response.text || 'No response generated.';
    return res.json({ answer, response: answer });
  } catch (error) {
    console.error('AI assistant error:', error);
    return res.status(500).json({ error: 'AI assistant failed' });
  }
});

// AI Learning Roadmap Endpoint
app.post('/api/ai/learning-roadmap', async (req, res) => {
  try {
    const { skillTitle, skill, currentLevel, targetLevel, duration, goals, context } = req.body ?? {};
    const title = String(skillTitle ?? skill ?? 'the requested skill');
    const ai = getGenAIClient();
    if (!ai) return res.json({
      roadmap: [
        { title: `Foundations of ${title}`, duration: '1 session', completed: false },
        { title: `Guided practice in ${title}`, duration: '2 sessions', completed: false },
        { title: `Applied project in ${title}`, duration: '2 sessions', completed: false },
        { title: 'Review and next-step plan', duration: '1 session', completed: false },
      ],
      learningObjectives: [`Understand the core concepts of ${title}`, 'Complete guided hands-on practice', 'Apply the skill in a practical project'],
      nextAction: `Start the first guided session for ${title}.`,
    });
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: `Create a practical learning roadmap for "${title}".
Current level: ${currentLevel ?? 'unknown'}
Target level: ${targetLevel ?? 'competent'}
Duration: ${duration ?? 'flexible'}
Goals: ${JSON.stringify(goals ?? [])}
Context: ${JSON.stringify(context ?? {})}
Return JSON with roadmap, learningObjectives and nextAction.`,
      config: { responseMimeType: 'application/json' },
    });
    return res.json(JSON.parse(response.text || '{}'));
  } catch (error) {
    console.error('Learning roadmap error:', error);
    return res.status(500).json({ error: 'Failed to generate learning roadmap' });
  }
});


// DeepSeek R1 Reasoning Endpoint (OpenRouter)
app.post('/api/deepseek-reasoning', async (req, res) => {
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

// Endpoint to download the Termux updater script directly
app.get(['/update_skillswap5.py', '/api/download-updater', '/download/update_skillswap5.py'], (_req, res) => {
  const filePath = path.join(process.cwd(), 'update_skillswap5.py');
  res.download(filePath, 'update_skillswap5.py', (err) => {
    if (err) {
      res.sendFile(filePath);
    }
  });
});


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

  app.use(mpesaCallbackRouter);

app.use(mpesaPayRouter);

app.use(paypalRouter);

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

setupServer().catch((err) => {
  console.error('Failed to start server:', err);
});
