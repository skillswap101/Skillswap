#!/usr/bin/env node

/**
 * Automated Gemini AI Code Reviewer & Error Checker
 * Used in GitHub Actions CI to audit git diffs, detect subtle logic/syntax bugs,
 * and provide actionable automated fixes.
 */

import { execSync } from 'child_process';
import { GoogleGenAI } from '@google/genai';

async function runReview() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log('⚠️ GEMINI_API_KEY not detected in environment. Skipping AI analysis step.');
    process.exit(0);
  }

  console.log('🤖 Starting automated Gemini AI code audit...');

  // Extract recent git diff
  let diff = '';
  try {
    diff = execSync('git diff HEAD~1 HEAD -- "*.ts" "*.tsx" "*.js" "*.json" | head -n 400', {
      encoding: 'utf-8',
    });
  } catch (err) {
    try {
      diff = execSync('git diff --staged | head -n 400', { encoding: 'utf-8' });
    } catch {
      diff = '';
    }
  }

  if (!diff.trim()) {
    console.log('ℹ️ No significant code changes in git diff to inspect.');
    process.exit(0);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `You are a Principal Software Engineer and Automated CI Code Auditor.
Review the following Git diff for potential errors, runtime defects, security issues, and TypeScript inconsistencies.

Git Diff:
\`\`\`diff
${diff}
\`\`\`

Provide a concise, high-impact review:
1. Critical Issues / Breaking Bugs (if any)
2. TypeScript or React state edge cases (if any)
3. Direct recommended code fixes (if any)
4. Overall verdict: APPROVED or NEEDS_ATTENTION.

Keep the review brief and highly actionable.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    console.log('\n========================================');
    console.log('📋 GEMINI AUTOMATED CODE AUDIT REPORT:');
    console.log('========================================\n');
    console.log(response.text);
    console.log('\n========================================\n');

    if (response.text.includes('CRITICAL_FAIL')) {
      process.exit(1);
    }
  } catch (error) {
    console.warn('⚠️ Automated AI review encountered a non-blocking error:', error?.message || error);
    // Non-blocking so CI doesn't crash if quota or network flickers
    process.exit(0);
  }
}

runReview();
