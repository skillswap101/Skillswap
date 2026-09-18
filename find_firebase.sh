#!/bin/bash
echo "===== FIREBASE WIRING AUDIT FOR SKILLSWAP ====="
echo "Project: $(pwd)"
echo ""

echo "1. FIREBASE CONFIG + INIT"
grep -rn "firebaseConfig\|initializeApp\|getFirestore\|getAuth" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.env*" --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist --exclude-dir=build . 
echo ""

echo "2. FIREBASE IMPORTS"
grep -rn "from 'firebase" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist --exclude-dir=build . 
echo ""

echo "3. FIRESTORE DB CALLS"
grep -rn "collection\|doc\|getDoc\|getDocs\|addDoc\|setDoc\|updateDoc\|deleteDoc\|onSnapshot\|query\|where" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist --exclude-dir=build . 
echo ""

echo "4. FIREBASE AUTH CALLS"
grep -rn "getAuth\|signIn\|signUp\|signOut\|onAuthStateChanged\|GoogleAuthProvider" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist --exclude-dir=build . 
echo ""

echo "5. PACKAGE.JSON FIREBASE VERSION"
grep firebase package.json
echo ""

echo "===== END OF AUDIT ====="
