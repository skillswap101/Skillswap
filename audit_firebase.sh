#!/bin/bash
echo "# SKILLSWAP FIREBASE → SUPABASE AUDIT REPORT" > FIREBASE_AUDIT.md
echo "Generated: $(date)" >> FIREBASE_AUDIT.md
echo "" >> FIREBASE_AUDIT.md

echo "## 1. FILES THAT IMPORT FIREBASE" >> FIREBASE_AUDIT.md
grep -rn "from 'firebase" --include="*.ts" --include="*.tsx" --include="*.js" . >> FIREBASE_AUDIT.md
echo "" >> FIREBASE_AUDIT.md

echo "## 2. FILES THAT USE FIRESTORE DB" >> FIREBASE_AUDIT.md
grep -rn "firestore\|collection\|doc\|getDoc\|setDoc\|deleteDoc\|onSnapshot\|query\|where" --include="*.ts" --include="*.tsx" --include="*.js" . >> FIREBASE_AUDIT.md
echo "" >> FIREBASE_AUDIT.md

echo "## 3. FILES THAT USE FIREBASE AUTH" >> FIREBASE_AUDIT.md
grep -rn "getAuth\|onAuthStateChanged\|signInWith" --include="*.ts" --include="*.tsx" --include="*.js" . >> FIREBASE_AUDIT.md
echo "" >> FIREBASE_AUDIT.md

echo "## 4. FIREBASE ADMIN IN BACKEND" >> FIREBASE_AUDIT.md
grep -rn "firebase-admin\|firestore" server/ >> FIREBASE_AUDIT.md
echo "" >> FIREBASE_AUDIT.md

echo "## 5. MIGRATION PLAN FOR CLAUDE" >> FIREBASE_AUDIT.md
cat >> FIREBASE_AUDIT.md << 'EOM'

GOAL: Replace Firestore with Supabase. Keep Firebase Auth.

ACTIONS REQUIRED:
1. CREATE src/lib/supabase.ts with supabase client
2. UPDATE src/firebase.ts - REMOVE firestore, KEEP only auth
3. REPLACE src/hooks/useCloudStateBridge.ts - Convert all onSnapshot/setDoc/getDoc to supabase.from()
4. RUN SQL in Supabase for tables: users, skills, proposals, sessions, messages, reviews
5. CONFIGURE Supabase JWT to trust Firebase tokens
6. UPDATE server/ files to use supabase.from() instead of firestore

KEY COLLECTIONS FOUND:
- skills
- proposals 
- sessions
- messages
- reviews
- users

RLS RULE: auth.uid()::text must match user_id or participantIds[]

ENV TO ADD:
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

END OF AUDIT
EOM

echo "AUDIT COMPLETE. File created: FIREBASE_AUDIT.md"
