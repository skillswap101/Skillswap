#!/bin/bash
set -e

echo "=== 1. Writing comprehensive README.md ==="
cat << 'README_EOF' > README.md
# SkillSwap 5.0 — Peer-to-Peer Knowledge Sharing

SkillSwap is a community-driven knowledge exchange platform that allows users to teach, learn, and swap skills using a time-banking credit system.

## 🚀 Key Features
- **Skill Marketplace**: Discover community skills with rich categories, difficulty levels, and search filters.
- **Time Banking & Escrow**: Request and approve swaps with built-in credit escrow released upon session completion.
- **Multi-Gateway Payments**: Buy credit bundles through **Stripe**, **PayPal**, or **M-Pesa STK Push**.
- **Real-Time Collaboration**: Interactive session rooms with WebRTC video calling, collaborative whiteboard, and code runner.
- **AI Skill Assistant**: Gemini-powered skill matching, personalized roadmaps, and pronunciation coaching.

## 🛠️ Tech Stack
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Framer Motion
- **Backend**: Express, Node.js (bundled via esbuild), WebSocket
- **Database & Auth**: Firebase Authentication, Cloud Firestore, Firebase Admin SDK
- **Payment APIs**: Stripe SDK, PayPal Checkout SDK, Safaricom M-Pesa Daraja API

## 💻 Getting Started

### 1. Clone & Install
\`\`\`bash
git clone https://github.com/skillswap101/Skillswap.git
cd Skillswap
npm install
\`\`\`

### 2. Configure Environment
Copy \`.env.example\` to \`.env\` and add your credentials:
\`\`\`bash
cp .env.example .env
\`\`\`

### 3. Run Development Server
\`\`\`bash
npm run dev
\`\`\`
The application will be accessible at \`http://localhost:3000\`.

### 4. Build for Production
\`\`\`bash
npm run build
npm run start
\`\`\`
README_EOF

echo "=== 2. Creating .env.example ==="
cat << 'ENV_EOF' > .env.example
PORT=3000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# AI Services
GEMINI_API_KEY=
OPENROUTER_API_KEY=

# Firebase Client Configuration (Vite)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Firebase Admin SDK (Server)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLOUD_MESSAGING_KEY=

# Payment Gateways
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_API=https://api-m.sandbox.paypal.com
MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
MPESA_SHORTCODE=
MPESA_PASSKEY=
MPESA_CALLBACK_URL=
ENV_EOF

echo "=== 3. Cleaning up temporary & 0-byte files ==="
git rm -f src/components/ChatView.tsx 2>/dev/null || rm -f src/components/ChatView.tsx
git rm -f inspect_isoffered.cjs inspect_isoffered.js inspect_isoffered.mjs 2>/dev/null || rm -f inspect_isoffered.*
git rm -f update_skillswap5.0.py sync_improvements.sh 2>/dev/null || rm -f update_skillswap5.0.py sync_improvements.sh

echo "=== 4. Moving phase reports to docs/ folder ==="
mkdir -p docs
for f in PHASE0_PHASE1_REPORT.md PHASE1_1_REPORT.md PHASE1_2_REPORT.md PHASE1_AUTH_ARCHITECTURE.md; do
  if [ -f "$f" ]; then
    git mv "$f" docs/ 2>/dev/null || mv "$f" docs/
  fi
done

echo "=== 5. Committing and Pushing to GitHub ==="
git add README.md .env.example docs/
git commit -m "docs: add comprehensive README, .env.example, and organize repository structure"
git push origin main || git push origin master

echo "Done! Your GitHub repository is now fully documented and clean."
