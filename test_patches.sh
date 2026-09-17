#!/bin/bash
echo "========================================"
echo "   SKILLSWAP WEBRTC PATCH TESTER"
echo "========================================"
PASS=0
FAIL=0

echo ""
echo "[1/5] Checking WebRTCManager.ts for Firebase imports..."
if grep -q "from 'firebase/firestore'" src/utils/WebRTCManager.ts; then
  echo "✅ PASS: Firebase imports found"
  ((PASS++))
else
  echo "❌ FAIL: Firebase imports missing"
  ((FAIL++))
fi

echo ""
echo "[2/5] Checking WebRTCManager.ts for public peerConnection..."
if grep -q "public peerConnection" src/utils/WebRTCManager.ts; then
  echo "✅ PASS: peerConnection is public"
  ((PASS++))
else
  echo "❌ FAIL: peerConnection is still private"
  ((FAIL++))
fi

echo ""
echo "[3/5] Checking WebRTCManager.ts for Firebase signaling..."
if grep -q "addDoc(collection(db, \`calls" src/utils/WebRTCManager.ts; then
  echo "✅ PASS: Firebase signaling code found"
  ((PASS++))
else
  echo "❌ FAIL: Firebase signaling code missing"
  ((FAIL++))
fi

echo ""
echo "[4/5] Checking LiveSessionRoom.tsx for startCall/joinCall functions..."
if grep -q "const startCall" src/components/LiveSessionRoom.tsx && grep -q "const joinCall" src/components/LiveSessionRoom.tsx; then
  echo "✅ PASS: startCall and joinCall functions found"
  ((PASS++))
else
  echo "❌ FAIL: startCall or joinCall missing"
  ((FAIL++))
fi

echo ""
echo "[5/5] Checking LiveSessionRoom.tsx for Video UI injection..."
if grep -q "setLocalVideoRef" src/components/LiveSessionRoom.tsx && grep -q "setRemoteVideoRef" src/components/LiveSessionRoom.tsx; then
  echo "✅ PASS: Video UI injected"
  ((PASS++))
else
  echo "❌ FAIL: Video UI not found"
  ((FAIL++))
fi

echo ""
echo "========================================"
echo "   RESULTS: $PASS PASSED, $FAIL FAILED"
echo "========================================"

if [ $FAIL -eq 0 ]; then
  echo "🎉 ALL GOOD SIR! Ready to push to Render"
else
  echo "⚠️  $FAIL tests failed. Run the patch scripts again"
fi
