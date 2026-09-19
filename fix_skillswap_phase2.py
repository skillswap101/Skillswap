#!/usr/bin/env python3
from __future__ import annotations
import json, re, shutil
from datetime import datetime
from pathlib import Path

ROOT = Path.cwd()
if not (ROOT / "package.json").exists():
    raise SystemExit("Run this from ~/skillswap5.0")

STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")
BACKUP = ROOT / ".skillswap-backups" / f"phase2-{STAMP}"

def backup(path):
    if path.exists():
        dst = BACKUP / path.relative_to(ROOT)
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(path, dst)

def write(path, text):
    backup(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")
    print("[WRITE]", path)

def patch(path, transform, label):
    old = path.read_text(encoding="utf-8")
    new = transform(old)
    if new == old:
        print("[SKIP]", label)
        return
    backup(path)
    path.write_text(new, encoding="utf-8")
    print("[PATCH]", label)

# 1) Typed client Firestore repository
write(ROOT/"src/utils/firestoreRepository.ts", r'''import {
  addDoc, collection, deleteDoc, doc, getDoc, onSnapshot,
  setDoc, updateDoc, query, type DocumentData,
  type QueryConstraint, type Unsubscribe,
} from "firebase/firestore";
import { db } from "../firebase";

export type CloudCollection =
  | "users" | "skills" | "proposals" | "sessions" | "messages" | "reviews";

export function cloudCollection(name: CloudCollection) {
  return collection(db, name);
}

export async function putDoc(
  collectionName: CloudCollection, id: string, data: DocumentData,
) {
  await setDoc(doc(db, collectionName, id), data, { merge: true });
}

export async function updateCloudDoc(
  collectionName: CloudCollection, id: string, data: DocumentData,
) {
  await updateDoc(doc(db, collectionName, id), data);
}

export async function addCloudDoc(
  collectionName: CloudCollection, data: DocumentData,
) {
  const ref = await addDoc(collection(db, collectionName), data);
  return ref.id;
}

export async function getCloudDoc(collectionName: CloudCollection, id: string) {
  const snap = await getDoc(doc(db, collectionName, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export function subscribeCollection<T extends DocumentData>(
  collectionName: CloudCollection,
  constraints: QueryConstraint[],
  onData: (rows: Array<T & { id: string }>) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const q = query(collection(db, collectionName), ...constraints);
  return onSnapshot(
    q,
    snap => onData(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Array<T & { id: string }>),
    error => onError?.(error),
  );
}

export async function removeCloudDoc(collectionName: CloudCollection, id: string) {
  await deleteDoc(doc(db, collectionName, id));
}
''')

# 2) Small mutation bridge for existing UI
write(ROOT/"src/utils/cloudStateBridge.ts", r'''import {
  collection, onSnapshot, query, where, type Unsubscribe,
} from "firebase/firestore";
import { db } from "../firebase";
import { addCloudDoc, putDoc, type CloudCollection } from "./firestoreRepository";

export function saveEntity(collectionName: CloudCollection, id: string, value: unknown) {
  return putDoc(collectionName, id, value as Record<string, unknown>);
}

export function createEntity(collectionName: CloudCollection, value: unknown) {
  return addCloudDoc(collectionName, value as Record<string, unknown>);
}

export function subscribeByUser<T>(
  collectionName: CloudCollection,
  field: string,
  uid: string,
  onRows: (rows: T[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const q = query(collection(db, collectionName), where(field, "==", uid));
  return onSnapshot(
    q,
    snap => onRows(snap.docs.map(d => ({ id: d.id, ...d.data() })) as T[]),
    err => onError?.(err),
  );
}
''')

# 3) Security rules
rules = ROOT/"firestore.rules"
if not rules.exists():
    write(rules, r'''rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() { return request.auth != null; }
    function owner(uid) { return signedIn() && request.auth.uid == uid; }

    match /users/{uid} {
      allow read: if signedIn();
      allow create, update: if owner(uid);
      allow delete: if false;
    }

    match /skills/{id} {
      allow read: if signedIn();
      allow create: if signedIn() && request.resource.data.userId == request.auth.uid;
      allow update, delete: if signedIn() && resource.data.userId == request.auth.uid;
    }

    match /proposals/{id} {
      allow read: if signedIn() &&
        (resource.data.senderId == request.auth.uid ||
         resource.data.recipientId == request.auth.uid);
      allow create: if signedIn() && request.resource.data.senderId == request.auth.uid;
      allow update: if signedIn() &&
        (resource.data.senderId == request.auth.uid ||
         resource.data.recipientId == request.auth.uid);
      allow delete: if false;
    }

    match /sessions/{id} {
      allow read, create, update: if signedIn() &&
        (resource.data.mentorId == request.auth.uid ||
         resource.data.learnerId == request.auth.uid ||
         request.resource.data.mentorId == request.auth.uid ||
         request.resource.data.learnerId == request.auth.uid);
      allow delete: if false;
    }

    match /messages/{id} {
      allow create: if signedIn() && request.resource.data.senderId == request.auth.uid;
      allow read, update: if signedIn() &&
        (resource.data.senderId == request.auth.uid ||
         resource.data.recipientId == request.auth.uid);
      allow delete: if false;
    }

    match /reviews/{id} {
      allow read: if signedIn();
      allow create: if signedIn() && request.resource.data.authorId == request.auth.uid;
      allow update, delete: if signedIn() && resource.data.authorId == request.auth.uid;
    }

    match /escrowTransactions/{id} {
      allow read: if signedIn() &&
        (resource.data.userId == request.auth.uid ||
         resource.data.recipientId == request.auth.uid);
      allow write: if false;
    }

    match /webrtcRooms/{id} {
      allow read, write: if signedIn();
    }
  }
}
''')

# 4) Server bridge
server = ROOT/"server.ts"
def server_patch(s):
    if 'from "firebase-admin/firestore"' not in s:
        s = s.replace(
            'import { getAuth,',
            'import { getFirestore } from "firebase-admin/firestore";\nimport { getAuth,',
            1,
        )
    if "const firestore = getFirestore(firebaseApp);" not in s:
        s = s.replace(
            "const firebaseAuth = getAuth(firebaseApp);",
            "const firebaseAuth = getAuth(firebaseApp);\nconst firestore = getFirestore(firebaseApp);",
            1,
        )

    marker = "// API Routes"
    if 'app.post("/api/cloud/:collection/:id"' not in s:
        routes = r'''
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

'''
        s = s.replace(marker, routes + marker, 1)

    # Remove old fake escrow handler if present.
    s = re.sub(
        r'\n// Protected Escrow Route\napp\.post\("/api/escrow/transfer", verifyFirebaseToken, async \(req: AuthenticatedRequest, res: Response\) => \{.*?\n\}\);\n',
        "\n", s, flags=re.S
    )
    return s

patch(server, server_patch, "server cloud persistence + missing AI + escrow + WebRTC")

# 5) Audit utility
write(ROOT/"bridge_audit.py", r'''#!/usr/bin/env python3
from pathlib import Path
import re
ROOT = Path(__file__).resolve().parent
src = "\n".join(p.read_text(encoding="utf-8", errors="ignore")
                for p in (ROOT/"src").rglob("*.ts*"))
server = (ROOT/"server.ts").read_text(encoding="utf-8", errors="ignore")

print("="*70)
print("SkillSwap 5.0 — bridge audit")
print("="*70)
routes = [
    "/api/ai/assistant",
    "/api/ai/generate-proposal",
    "/api/ai/learning-roadmap",
    "/api/ai/match",
    "/api/deepseek-reasoning",
    "/api/escrow/transfer",
]
for route in routes:
    print(f"{'OK' if route in src and route in server else 'FAIL':6} {route}")

for name in ["users","skills","proposals","sessions","messages","reviews"]:
    print(f"{'INFO':6} {name:12} references={len(re.findall(r'["\\']'+name+r'["\\']', src))}")

print()
print("mockData:", (ROOT/"src/data/mockData.ts").exists())
print("repository:", (ROOT/"src/utils/firestoreRepository.ts").exists())
print("rules:", (ROOT/"firestore.rules").exists())
print()
print("NOTE: mockData is still a seed. Full hydration/mutation wiring in App.tsx")
print("must be done against the exact current App state transitions; this pass")
print("does not falsely claim that localStorage has become Firestore.")
''')

# 6) npm scripts
pkg = ROOT/"package.json"
try:
    data = json.loads(pkg.read_text(encoding="utf-8"))
    data.setdefault("scripts", {}).setdefault("bridge:audit", "python3 bridge_audit.py")
    backup(pkg)
    pkg.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    print("[PATCH] package.json bridge:audit")
except Exception as e:
    print("[WARN] package.json unchanged:", e)

print("\n" + "="*70)
print("PHASE 2 COMPLETE")
print("="*70)
print("Backup:", BACKUP)
print("Run:")
print("  npm run lint")
print("  npm run build")
print("  python3 bridge_audit.py")
