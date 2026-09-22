#!/usr/bin/env node

/**
 * Enhanced Gemini AI Code Reviewer, Security Auditor & Release Inspector
 * Used in GitHub Actions CI to:
 * 1. Detect leaked secrets or credentials before merge.
 * 2. Audit git diffs for security, logic defects, and React lifecycle errors.
 * 3. Verify Render deployment compatibility (PORT, health checks, SPA fallbacks).
 * 4. Post structured audit verdicts to CI logs.
 */

import { execSync } from 'child_process';
import { GoogleGenAI } from '@google/genai';

// 1. Hardcoded Secret Pattern Scanner
function scanForSecrets(diffText) {
  const secretPatterns = [
    { name: 'Generic Private Key', regex: /-----BEGIN (RSA|EC|OPENSSH|PRIVATE) KEY-----/ },
    { name: 'GitHub Personal Access Token', regex: /ghp_[A-Za-z0-9_]{36}/ },
    { name: 'Stripe Secret Key', regex: /sk_live_[0-9a-zA-Z]{24}/ },
    { name: 'Firebase / Google API Key', regex: /AIza[0-9A-Za-z-_]{35}/ },
    { name: 'Supabase Service Role Key', regex: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/ }
  ];

  const leaks = [];
  for (const { name, regex } of secretPatterns) {
    if (regex.test(diffText)) {
      leaks.push(name);
    }
  }
  return leaks;
}

async function runReview() {
  console.log('🤖 [SkillSwap AI Agent] Initiating multi-stage repository audit...');

  // Extract recent git diff
  let diff = '';
  try {
    diff = execSync('git diff HEAD~1 HEAD -- "*.ts" "*.tsx" "*.js" "*.json" "*.yaml" | head -n 600', {
      encoding: 'utf-8',
    });
  } catch (err) {
    try {
      diff = execSync('git diff --staged | head -n 600', { encoding: 'utf-8' });
    } catch {
      diff = '';
    }
  }

  // Stage 1: Fast Regex Security Scan
  if (diff) {
    const detectedSecrets = scanForSecrets(diff);
    if (detectedSecrets.length > 0) {
      console.error('\n🚨 [SECURITY ALERT] Potential secret(s) detected in git diff:');
      detectedSecrets.forEach(s => console.error(`   ❌ Found pattern: ${s}`));
      console.error('Commit rejected. Please remove credentials and use environment variables.\n');
      process.exit(1);
    }
    console.log('✅ Secret leak scanner: Clean (no exposed keys detected).');
  }

  // Stage 2: AI Architectural & Quality Audit
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log('ℹ️ GEMINI_API_KEY not provided. Skipping deep AI reasoning review.');
    process.exit(0);
  }

  if (!diff.trim()) {
    console.log('ℹ️ No significant code changes in git diff to inspect.');
    process.exit(0);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `You are the Lead Autonomous AI Code Auditor for SkillSwap (full-stack React 19, TypeScript, Express, Supabase, Render deployment).
Audit this Git diff for:
1. Critical security vulnerabilities, auth bypasses, or secret leaks.
2. React bugs (React error 310 hook ordering, unhandled promises, memory leaks).
3. Render deployment compatibility (PORT dynamic binding, /api/health endpoint, SPA catch-all static serving).
4. Code quality, performance, and clean TypeScript types.

Git Diff:
\`\`\`diff
${diff}
\`\`\`

Format your report cleanly:
- 🛡️ **Security & Secrets**: Status & remarks
- 🚀 **Render & Deployment**: Compatibility remarks
- ⚛️ **React & TypeScript**: Code quality & bug alerts
- 🏁 **Final Verdict**: [APPROVED] or [NEEDS_ATTENTION] or [CRITICAL_FAIL]`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    console.log('\n==================================================');
    console.log('📋 SKILLSWAP AUTONOMOUS AI AUDIT REPORT');
    console.log('==================================================\n');
    console.log(response.text);
    console.log('\n==================================================\n');

    if (response.text.includes('[CRITICAL_FAIL]')) {
      console.error('❌ Build failed due to critical security or runtime defects detected by AI Auditor.');
      process.exit(1);
    }
  } catch (error) {
    console.warn('⚠️ Automated AI review note (non-blocking):', error?.message || error);
    process.exit(0);
  }
}

runReview();
