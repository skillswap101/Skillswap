import os

server_path = "server.ts"

if not os.path.exists(server_path):
    print(f"Error: {server_path} not found.")
    exit(1)

with open(server_path, "r", encoding="utf-8") as f:
    content = f.read()

# Snippets to add
firebase_imports = """
import admin from "firebase-admin";
import { Request, Response, NextFunction } from "express";

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

// Extend Express Request type to include the verified Firebase decoded token
export interface AuthenticatedRequest extends Request {
  user?: admin.auth.DecodedIdToken;
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
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(403).json({ error: "Unauthorized: Invalid or expired token" });
  }
}
"""

protected_route = """
// Example protected escrow route
app.post("/api/escrow/transfer", verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
  const uid = req.user?.uid;
  const { amount, recipientId } = req.body;
  res.status(200).json({ success: true, message: `Transfer processed for user ${uid}`, amount, recipientId });
});
"""

# Perform injection safely near the top and bottom of server.ts
if "firebase-admin" not in content:
    # Insert imports and middleware near the top (after express import)
    if "import express" in content:
        content = content.replace("import express", "import express\n" + firebase_imports, 1)
    else:
        content = firebase_imports + "\n" + content

if "/api/escrow/transfer" not in content:
    # Append protected route before the server listen block or at the end
    content = content + "\n" + protected_route

with open(server_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Successfully patched server.ts with Firebase Admin SDK and verification middleware!")
