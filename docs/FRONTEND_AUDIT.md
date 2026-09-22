# Frontend Architecture & UI Audit — SkillSwap 5.0

**Audit Date**: September 22, 2026  
**Auditor**: Lead AI Engineer & Autonomous Code Auditor  
**Scope**: Component hierarchy, React 19 compatibility, state synchronization, bundle footprint, responsiveness, and accessibility.

---

## 1. Frontend Technology Stack
- **Framework**: React 19 (`^19.0.1`), React DOM (`^19.0.1`)
- **Language**: TypeScript (`~5.8.2`) with strict type checking enabled (`strict: true`)
- **Build Tool**: Vite (`^6.2.3`)
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`, `^4.1.14`)
- **Icons**: Lucide React (`^0.546.0`)
- **Animations**: Motion (`motion/react`, `^12.23.24`)
- **Charts**: Recharts (`^3.10.1`)

---

## 2. Key Components & View Hierarchy

The central hub is `src/App.tsx`, which controls view switching, modal orchestration, and live data bridging:

```
src/App.tsx
├── Header.tsx (Global Nav, Quick Actions, Profile, Notification Bell, Theme Toggle)
├── AIAssistantDrawer.tsx (Slide-out AI Mentor Chat)
├── SuggestedForYouSection.tsx (AI Recommendations)
├── SkillMarketplace (Inline in App.tsx: Search, Category Filters, SkillCards)
├── RequestedSkillsView.tsx (Wanted skills)
├── MySwapsView.tsx (User's active/pending swaps)
├── SwapContractsView.tsx (Detailed contract management)
├── TimeCreditsView.tsx (Credit balance, history, purchase trigger)
├── NearbySkillMapView.tsx (Geographic skill discovery)
├── ProfileView.tsx (User profile, skills, badges, settings)
└── Modals / Overlays:
    ├── AuthModal.tsx (Sign-in / Sign-up)
    ├── PostSkillModal.tsx (Publish skill offer/request)
    ├── ProposalModal.tsx (Propose skill exchange)
    ├── SessionRoomModal.tsx (WebRTC video & collaborative whiteboard)
    ├── UnifiedCheckoutModal.tsx (Stripe, M-Pesa, PayPal payment checkout)
    ├── UserDirectoryModal.tsx (Community members search)
    ├── SettingsHubModal.tsx (Account configuration, project export)
    ├── SkillDetailModal.tsx (Skill deep-dive)
    └── AuditDashboardModal.tsx (System diagnostics)
```

---

## 3. Findings & Performance Deficiencies

### A. State Duplication Between Cloud Bridge and Auth Context
- `useCloudStateBridge.ts` maintains its own `currentUser` state while `AuthContext.tsx` maintains `userProfile`.
- During profile edits, synchronization lag between these two state holders can cause outdated values to display in the header or profile view.
- **Remediation**: Establish `AuthContext.tsx` as the single canonical source of user identity, feeding directly into UI components.

### B. Direct Browser-to-Database Mutations
- Components like `PostSkillModal.tsx` and `useCloudStateBridge.ts` issue raw insert/update calls to Supabase tables.
- If Supabase RLS is tightened, client-side writes will fail silently or throw unhandled exceptions.
- **Remediation**: Migrate all mutation actions to use `src/lib/api.ts` connecting to authoritative Express API endpoints.

### C. Client-Side Over-Fetching of Sensitive Records
- In `src/hooks/useCloudStateBridge.ts` (lines 423-450):
  ```ts
  const { data: proposalRows } = await supabase.from('proposals').select('*');
  const userProposals = proposalRows.filter(p => p.senderId === uid || p.recipientId === uid);
  ```
- The client fetches **every proposal in the entire database** and filters them in memory on the user's browser.
- **Privacy & Performance Violation**: Any malicious user inspecting network traffic can read all private swap proposals across all users.
- **Remediation**: Enforce server-side filtering via `.or(\`senderId.eq.${uid},recipientId.eq.${uid}\`)` or dedicated backend `/api/proposals` endpoints.

### D. Responsive UI & Layout Improvements
- The header refactor successfully stabilized the "Post Skill" CTA and notification button on narrow viewports.
- All modals implement backdrop-blur overlays, focus traps, and overflow scrolling for small screen compliance (320px+).
