#!/usr/bin/env python3
from __future__ import annotations
import datetime as dt
import re
import shutil
import subprocess
from pathlib import Path

ROOT = Path.cwd()
SERVER = ROOT / "server.ts"
ESCROW = ROOT / "src/utils/firebaseEscrow.ts"
APP = ROOT / "src/App.tsx"
MOCK = ROOT / "src/data/mockData.ts"
BACKUP_DIR = ROOT / ".skillswap-backups" / dt.datetime.now().strftime("%Y%m%d-%H%M%S")

def stop(msg):
    print("[STOP]", msg)
    raise SystemExit(1)

def backup(path):
    if not path.exists(): return
    dst = BACKUP_DIR / path.relative_to(ROOT)
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(path, dst)
    print("[BACKUP]", path, "->", dst)

def write(path, text):
    backup(path)
    path.write_text(text, encoding="utf-8")
    print("[WRITE]", path)

def patch(path, old, new, label):
    text = path.read_text(encoding="utf-8")
    n = text.count(old)
    if n == 0: print("[SKIP]", label, "(old text not found)"); return False
    if n != 1: stop(f"{label}: found {n} matches; refusing ambiguous edit")
    backup(path)
    path.write_text(text.replace(old, new, 1), encoding='utf-8')
    print("[PATCH]", label)
    return True

def run(cmd):
    print("\n$", " ".join(cmd))
    p = subprocess.run(cmd, cwd=ROOT, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    print(p.stdout[-12000:])
    return p.returncode

print("=" * 70)
print("SkillSwap 5.0 — deterministic bridge repair")
print("=" * 70)
if not SERVER.exists(): stop("Run this from ~/skillswap5.0")

server = SERVER.read_text(encoding="utf-8")
server = server.replace("const PORT = 3000;", "const PORT = Number(process.env.PORT || 5000);", 1)
marker = "\n// DeepSeek R1 Reasoning Endpoint (OpenRouter)"
if marker not in server: stop("DeepSeek route marker not found")

if "app.post('/api/ai/assistant'" not in server:
    routes = r'''
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

'''
    server = server.replace(marker, '\n' + routes + marker, 1)

write(SERVER, server)

if ESCROW.exists():
    escrow = ESCROW.read_text(encoding='utf-8')
    old = "this.isFirebaseConfigured = typeof process !== 'undefined' && !!process.env?.FIREBASE_API_KEY;"
    new = "this.isFirebaseConfigured = !!import.meta.env?.VITE_FIREBASE_PROJECT_ID;"
    patch(ESCROW, old, new, 'Fix Vite Firebase escrow environment detection')

print("\n" + "=" * 70)
print("API BRIDGE AUDIT")
print("=" * 70)
calls = {}
for p in (ROOT / 'src').rglob('*.ts*'):
    if '.before-' in p.name: continue
    text = p.read_text(encoding='utf-8', errors='ignore')
    for m in re.finditer(r'''fetch\(\s*['"]([^'"]+)['"]''', text):
        calls.setdefault(m.group(1), []).append(str(p.relative_to(ROOT)))
server_now = SERVER.read_text(encoding='utf-8')
routes = set(re.findall(r'''app\.(?:get|post|put|patch|delete)\(\s*['"]([^'"]+)['"]''', server_now))
for endpoint, files in sorted(calls.items()):
    print(('OK' if endpoint in routes else 'MISSING SERVER ROUTE').ljust(22), endpoint, '<-', ', '.join(files))

print("\n" + "=" * 70)
print("MOCK DATA BRIDGE AUDIT")
print("=" * 70)
if MOCK.exists() and APP.exists():
    mock = MOCK.read_text(encoding='utf-8')
    app = APP.read_text(encoding='utf-8')
    exports = re.findall(r'export const ([A-Z0-9_]+)\s*:', mock)
    for name in exports:
        count = len(re.findall(rf'\b{re.escape(name)}\b', app))
        print(f'{name:24} App refs: {count}')
    print('RESULT: mockData is still a local seed/fallback layer.')
    print('Complete cloud bridge is NOT finished: Firestore writes/listeners are still needed for users, skills, proposals, sessions, messages and reviews.')

print("\nKNOWN STATUS")
print('Auth: client Firebase Auth + server ID-token verification present')
print('Firestore: partial')
print('AI: proposal/match + assistant/roadmap routes present')
print('Escrow: current Express escrow endpoint is only a stub')
print('Stripe: needs server PaymentIntent/webhook verification')
print('WebRTC: needs signaling/backend verification')

print("\n" + "=" * 70)
print("BUILD VERIFICATION")
print("=" * 70)
run(['npm', 'run', 'lint'])
run(['npm', 'run', 'build'])

print("\nREPAIR PASS FINISHED")
print('Backups:', BACKUP_DIR)
print('No secret values were printed.')
print('Next: complete Firestore repository bridge, security rules, escrow ledger/Stripe lifecycle, and WebRTC signaling.')
print('IMPORTANT: rotate any real API secrets that were exposed in chat/history.')
