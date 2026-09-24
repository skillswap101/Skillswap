# SkillSwap — GitHub Agent Security Repair

## TASK

Fix the GitHub Actions security failure:

[SECURITY ALERT] Potential secret(s) detected in git diff:
Found pattern: Supabase Service Role Key
Commit rejected.

The workflow currently reports:

Run node scripts/ai-code-reviewer.js
🤖 [SkillSwap AI Agent] Initiating multi-stage repository audit...

🚨 [SECURITY ALERT] Potential secret(s) detected in git diff:
   ❌ Found pattern: Supabase Service Role Key
Commit rejected.

Error: Process completed with exit code 1.

DO NOT disable, weaken, bypass, remove, or modify the security scanner merely to make the workflow pass.

The objective is to fix the underlying security problem.

---

# 1. INVESTIGATE THE ENTIRE REPOSITORY

Search the complete repository, excluding node_modules and .git where appropriate, for:

- SUPABASE_SERVICE_ROLE_KEY
- SUPABASE_SERVICE_ROLE
- service_role
- service-role
- Supabase service role key
- Supabase service-role credentials
- hardcoded Supabase credentials
- JWT-like credentials beginning with eyJ
- credentials inside source files
- credentials inside configuration files
- credentials inside tests
- credentials inside scripts
- credentials inside backups
- credentials inside documentation
- credentials inside generated files
- credentials accidentally committed to Git

Do not print actual secret values.

Any discovered secret must be represented only as:

[REDACTED]

---

# 2. IDENTIFY THE EXACT ROOT CAUSE

Determine exactly:

1. Which file triggered the security scanner.
2. Which line/pattern triggered it.
3. Whether the problem is in the current working tree.
4. Whether the problem was introduced by the recent change:

"fix: provide safe placeholder fallback to prevent supabaseUrl runtime…"

5. Whether the problem is related to PR/issue #12.
6. Whether the scanner is correctly detecting a real credential or producing a false positive.

Do not assume it is a false positive without proving it.

---

# 3. REMOVE HARDCODED SECRETS

If an actual Supabase service-role key is present in source-controlled code:

REMOVE IT.

Do not replace it with another hardcoded key.

Use an environment variable instead.

For server-side code, use the appropriate server environment variable, for example:

process.env.SUPABASE_SERVICE_ROLE_KEY

Do NOT expose the service-role key through:

- VITE_* variables
- React components
- browser JavaScript
- client-side Firebase/Supabase configuration
- public API responses
- HTML
- frontend bundles

A Supabase service-role key is server-side sensitive material.

---

# 4. CHECK THE FRONTEND/BACKEND BOUNDARY

Inspect the SkillSwap architecture carefully.

The frontend must never receive a Supabase service-role key.

If Supabase is used from browser code, only use credentials that are explicitly intended for browser/client use.

If privileged Supabase operations are required, they must happen server-side.

Do not move a privileged key into VITE_* simply to make the application work.

---

# 5. CHECK ENVIRONMENT FILES

Inspect:

.env
.env.local
.env.*.local
.env.production
.env.development
.env.test

and other configuration files.

Ensure real credentials are not tracked by Git.

Check:

git ls-files

for tracked secret/config files.

Update .gitignore if necessary.

At minimum, evaluate whether these patterns need protection:

.env
.env.*
!.env.example

Do not blindly overwrite an existing .gitignore. Preserve its existing rules.

If the project already has an appropriate .env.example, update it only with SAFE PLACEHOLDER VALUES.

Example:

SUPABASE_SERVICE_ROLE_KEY=your-server-side-key-here

Never put a real credential into .env.example.

---

# 6. CHECK TRACKED FILES

If a secret-containing file is tracked:

Remove it from Git tracking without unnecessarily deleting the developer's local copy.

For example, where appropriate:

git rm --cached <file>

Then ensure the file is correctly ignored.

Do not delete important application files simply because they contain configuration.

Repair them safely.

---

# 7. CHECK GIT HISTORY

Investigate whether an actual Supabase service-role credential has ever been committed.

Inspect the relevant Git history and diffs.

Do NOT print the credential.

Use redacted reporting such as:

"Supabase service-role credential detected in historical commit abc1234 [REDACTED]"

If an actual service-role credential was previously committed, report clearly:

"Credential rotation/revocation is required."

Deleting the credential from the current working tree does NOT make a previously exposed credential safe.

Do not claim that history has been rewritten unless you actually perform and verify such a history rewrite.

Do not perform destructive history rewriting automatically unless explicitly authorized.

---

# 8. INSPECT THE RECENT CHANGE

Pay special attention to the change associated with:

"fix: provide safe placeholder fallback to prevent supabaseUrl runtime…"

and PR/issue:

#12

Determine whether the placeholder fallback itself contains a credential or whether another changed file introduced the security detection.

A safe fallback must not contain a real secret.

If the application requires a Supabase URL, use a safe non-secret placeholder only where appropriate, and ensure production requires the actual environment configuration.

Do not introduce fake credentials that could accidentally be treated as real credentials.

---

# 9. DO NOT BREAK SKILLSWAP

Preserve existing functionality.

Do not:

- remove Supabase integration
- disable authentication
- disable database functionality
- remove security middleware
- remove environment validation
- disable GitHub Actions
- disable the AI reviewer
- remove secret scanning
- weaken security regexes
- comment out failing tests
- modify CI merely to hide the finding

Only make changes necessary to securely fix the root cause.

---

# 10. VALIDATE THE REPAIR

After making the changes, run the repository's existing validation commands.

At minimum inspect package.json and run the appropriate:

- TypeScript check
- lint check if configured
- production build
- security audit
- AI code reviewer

Use the repository's existing scripts rather than inventing replacements.

Also inspect the final Git diff:

git status
git diff --check
git diff

Search the final working-tree changes again for:

- SUPABASE_SERVICE_ROLE_KEY
- service_role
- service-role
- Supabase service role
- JWT-like secrets beginning with eyJ

Do not expose actual secret values in output.

---

# 11. FINAL SECURITY TEST

The final repository must satisfy all of these:

[ ] No real Supabase service-role key exists in source code.

[ ] No real Supabase service-role key exists in frontend/client code.

[ ] No service-role key is exposed through VITE_*.

[ ] No real secret exists in .env.example.

[ ] Real local environment files are ignored by Git.

[ ] No secret-containing file is accidentally tracked.

[ ] Git diff contains no real Supabase service-role credential.

[ ] Security scanner remains enabled.

[ ] AI code reviewer remains enabled.

[ ] Production build succeeds.

[ ] TypeScript/lint validation succeeds where configured.

[ ] Existing SkillSwap functionality remains intact.

[ ] Historical exposure has been investigated.

[ ] If an actual credential was historically exposed, credential rotation/revocation is clearly reported.

---

# 12. DO NOT EXPOSE SECRETS IN THE REPORT

The final report MUST NOT contain:

- actual API keys
- service-role keys
- passwords
- private keys
- Firebase service-account private keys
- access tokens
- session tokens
- OAuth secrets

Always redact them as:

[REDACTED]

---

# 13. FINAL REPORT

After completing the repair, produce a concise but complete report with:

## Root Cause
What caused the security scanner to fail.

## Exact File(s)
Which files contained the problem.

## Changes Made
Every file changed and what was changed.

## Security Architecture
Explain how the secret is now supplied securely.

## Git History
State whether a real credential was found historically.

## Credential Rotation
State whether rotation/revocation is required.

## Validation
Report the actual results of:

- TypeScript/lint
- production build
- security scan
- AI code reviewer
- final secret search

## Remaining Actions
List only actions that genuinely require manual intervention.

Do not claim a check passed unless it was actually executed.

---

# IMPORTANT

The security scanner is failing for a reason.

DO NOT make the workflow green by hiding the detection.

Fix the credential exposure itself.

Do not expose or print any actual secret while investigating.

After the repair, leave the security protections stronger than they were before.
