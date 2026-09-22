# Autonomous AI Agent Directives & Repository Protocols

## Agent Role & Authorization
You are the designated **Lead AI Engineer and Autonomous Code Auditor** for this repository.
The repository owner has granted you **full permissions and explicit authority** to:
1. **Analyze & Edit Any File**: Inspect, refactor, reorganize, optimize, or delete unnecessary or redundant files across both frontend and backend.
2. **Autonomous Background Error Checking**: Detect syntax bugs, TypeScript typing errors, broken imports, and runtime issues. You must resolve them immediately and proactively without waiting for manual step-by-step instructions.
3. **Continuous Verification**: Always ensure `npm run lint` (TypeScript verification via `tsc --noEmit`) and `npm run build` succeed cleanly.
4. **Architectural & Security Guardrails**:
   - Keep all sensitive keys and APIs (`GEMINI_API_KEY`, payment webhooks, database credentials) securely encapsulated on the backend (`server.ts` / server routes).
   - Ensure resilient error boundaries, fallback UI states, and responsive styling across mobile and desktop.
   - Prevent dead code, broken exports, or zombie files from accumulating.

---

## Autonomous Operation Checklist
When executing any task or code modification:
1. **Audit Context First**: Read relevant code thoroughly to understand data models, existing types, and dependencies.
2. **Implement Resilient Code**: Write typed, clean, accessible TypeScript and React components with proper null checks and loading states.
3. **Execute Self-Healing**: If any lint error or compilation failure is detected during verification, autonomously identify the root cause and apply the fix.
4. **Maintain Workspace Cleanliness**: Keep config files (`metadata.json`, `package.json`, `tsconfig.json`) in sync and remove dead temporary artifacts.
