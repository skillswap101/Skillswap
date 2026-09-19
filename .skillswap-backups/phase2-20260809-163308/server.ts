import express, { Request, Response, NextFunction } from "express";
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
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import serviceAccount from "./serviceaccountkey.json";

dotenv.config();

// Initialize Firebase Admin SDK if not already initialized
const firebaseApp = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: cert(serviceAccount as ServiceAccount),
    });

const firebaseAuth = getAuth(firebaseApp);

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
    const decodedToken = await firebaseAuth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(403).json({ error: "Unauthorized: Invalid or expired token" });
  }
}

const app = express();
const PORT = Number(process.env.PORT || 5000);

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

// API Routes
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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

// Protected Escrow Route
app.post("/api/escrow/transfer", verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  const uid = req.user?.uid;
  const { amount, recipientId } = req.body;
  res.status(200).json({ success: true, message: `Transfer processed securely for user ${uid}`, amount, recipientId });
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

setupServer().catch((err) => {
  console.error('Failed to start server:', err);
});
