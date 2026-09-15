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
