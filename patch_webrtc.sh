#!/bin/bash
echo "Patching WebRTCManager.ts..."
# 1. Make peerConnection and callId public
sed -i 's/private peerConnection: RTCPeerConnection/private public peerConnection: RTCPeerConnection/g' src/utils/WebRTCManager.ts
sed -i 's/private callId: string/private public callId: string/g' src/utils/WebRTCManager.ts

# 2. Add Firebase imports at top
sed -i '1i import { db } from '\''../firebase'\'';\nimport { collection, addDoc, doc, setDoc, getDoc, onSnapshot, deleteDoc } from '\''firebase/firestore'\'';' src/utils/WebRTCManager.ts

# 3. Replace onicecandidate
sed -i 's/this.peerConnection.onicecandidate = (event) => {/this.peerConnection.onicecandidate = async (event) => {\n        if (event.candidate \&\& this.callId) {\n          await addDoc(collection(db, `calls\/${this.callId}\/candidates`), event.candidate.toJSON());\n        }/g' src/utils/WebRTCManager.ts

echo "Patching LiveSessionRoom.tsx..."
# 4. Add imports
sed -i '1i import { db } from '\''../firebase'\'';\nimport { doc, getDoc, updateDoc } from '\''firebase/firestore'\'';\nimport { webRTCManager } from '\''../utils/WebRTCManager'\'';' src/components/LiveSessionRoom.tsx

# 5. Add state + functions before the return
sed -i '/export function LiveSessionRoom/a const [localVideoRef, setLocalVideoRef] = useState<HTMLVideoElement | null>(null);\nconst [remoteVideoRef, setRemoteVideoRef] = useState<HTMLVideoElement | null>(null);\n\nconst startCall = async (roomId: string) => {\n  webRTCManager.callId = roomId;\n  const { localStream, remoteStream } = await webRTCManager.startCall({video: true, audio: true, peerName: "Me", peerAvatar: "", skillTitle: roomId});\n  if(localVideoRef) localVideoRef.srcObject = localStream;\n  if(remoteVideoRef) remoteVideoRef.srcObject = remoteStream;\n}\n\nconst joinCall = async (roomId: string) => {\n  webRTCManager.callId = roomId;\n  const callDoc = doc(db, '\''calls'\'', roomId);\n  const callSnap = await getDoc(callDoc);\n  const offer = callSnap.data()?.offer;\n  if(!offer) return alert("Room not found");\n  const { localStream, remoteStream } = await webRTCManager.startCall({video: true, audio: true, peerName: "Me", peerAvatar: "", skillTitle: roomId});\n  if(localVideoRef) localVideoRef.srcObject = localStream;\n  if(remoteVideoRef) remoteVideoRef.srcObject = remoteStream;\n  await webRTCManager.peerConnection!.setRemoteDescription(new RTCSessionDescription(offer));\n  const answer = await webRTCManager.peerConnection!.createAnswer();\n  await webRTCManager.peerConnection!.setLocalDescription(answer);\n  await updateDoc(callDoc, { answer: { type: answer.type, sdp: answer.sdp } });\n}' src/components/LiveSessionRoom.tsx

echo "Done. Now add 2 video tags manually in JSX"
