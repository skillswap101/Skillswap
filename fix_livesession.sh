#!/bin/bash
echo "Force patching LiveSessionRoom.tsx..."

# 1. Add imports if missing
if ! grep -q "from '../firebase'" src/components/LiveSessionRoom.tsx; then
sed -i '1i import { db } from '\''../firebase'\'';\nimport { doc, getDoc, updateDoc } from '\''firebase/firestore'\'';\nimport { webRTCManager } from '\''../utils/WebRTCManager'\'';\nimport { useState } from '\''react'\'';' src/components/LiveSessionRoom.tsx
echo "✅ Added imports"
fi

# 2. Add state + functions right after "export function LiveSessionRoom"
sed -i '/export function LiveSessionRoom/a \
  const [localVideoRef, setLocalVideoRef] = useState<HTMLVideoElement | null>(null);\
  const [remoteVideoRef, setRemoteVideoRef] = useState<HTMLVideoElement | null>(null);\
  const startCall = async (roomId: string) => {\
    webRTCManager.callId = roomId;\
    const { localStream, remoteStream } = await webRTCManager.startCall({video: true, audio: true, peerName: "Me", peerAvatar: "", skillTitle: roomId});\
    if(localVideoRef) localVideoRef.srcObject = localStream;\
    if(remoteVideoRef) remoteVideoRef.srcObject = remoteStream;\
  }\
  const joinCall = async (roomId: string) => {\
    webRTCManager.callId = roomId;\
    const callDoc = doc(db, '\''calls'\'', roomId);\
    const callSnap = await getDoc(callDoc);\
    const offer = callSnap.data()?.offer;\
    if(!offer) return alert("Room not found");\
    const { localStream, remoteStream } = await webRTCManager.startCall({video: true, audio: true, peerName: "Me", peerAvatar: "", skillTitle: roomId});\
    if(localVideoRef) localVideoRef.srcObject = localStream;\
    if(remoteVideoRef) remoteVideoRef.srcObject = remoteStream;\
    await webRTCManager.peerConnection!.setRemoteDescription(new RTCSessionDescription(offer));\
    const answer = await webRTCManager.peerConnection!.createAnswer();\
    await webRTCManager.peerConnection!.setLocalDescription(answer);\
    await updateDoc(callDoc, { answer: { type: answer.type, sdp: answer.sdp } });\
  }' src/components/LiveSessionRoom.tsx
echo "✅ Added functions"

# 3. Inject UI right after first "return ("
sed -i '0,/return (/s//return (\n    <>\n    <div className="flex gap-2 p-4">\n      <div className="w-1\/2">\n        <p className="text-xs text-center text-white">You<\/p>\n        <video ref={setLocalVideoRef} autoPlay muted playsInline className="w-full bg-black rounded-lg h-64" \/><\/div>\n      <div className="w-1\/2">\n        <p className="text-xs text-center text-white">Peer<\/p>\n        <video ref={setRemoteVideoRef} autoPlay playsInline className="w-full bg-black rounded-lg h-64" \/><\/div>\n    <\/div>\n    <div className="flex gap-2 justify-center p-4">\n      <button onClick={() => startCall("test-room-123")} className="bg-green-500 text-white px-4 py-2 rounded">Start Call<\/button>\n      <button onClick={() => joinCall("test-room-123")} className="bg-blue-500 text-white px-4 py-2 rounded">Join Call<\/button>\n    <\/div>/' src/components/LiveSessionRoom.tsx
echo "✅ Added UI"

echo "Done. Run ./test_patches.sh again"
