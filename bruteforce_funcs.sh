#!/bin/bash
echo "Appending functions to end of LiveSessionRoom.tsx..."

cat >> src/components/LiveSessionRoom.tsx << 'EOFCODE'

// ===== AUTO-ADDED WEBRTC FUNCTIONS =====
const [localVideoRef, setLocalVideoRef] = useState<HTMLVideoElement | null>(null);
const [remoteVideoRef, setRemoteVideoRef] = useState<HTMLVideoElement | null>(null);

const startCall = async (roomId: string) => {
  webRTCManager.callId = roomId;
  const { localStream, remoteStream } = await webRTCManager.startCall({video: true, audio: true, peerName: "Me", peerAvatar: "", skillTitle: roomId});
  if(localVideoRef) localVideoRef.srcObject = localStream;
  if(remoteVideoRef) remoteVideoRef.srcObject = remoteStream;
}

const joinCall = async (roomId: string) => {
  webRTCManager.callId = roomId;
  const callDoc = doc(db, 'calls', roomId);
  const callSnap = await getDoc(callDoc);
  const offer = callSnap.data()?.offer;
  if(!offer) return alert("Room not found");
  const { localStream, remoteStream } = await webRTCManager.startCall({video: true, audio: true, peerName: "Me", peerAvatar: "", skillTitle: roomId});
  if(localVideoRef) localVideoRef.srcObject = localStream;
  if(remoteVideoRef) remoteVideoRef.srcObject = remoteStream;
  await webRTCManager.peerConnection!.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await webRTCManager.peerConnection!.createAnswer();
  await webRTCManager.peerConnection!.setLocalDescription(answer);
  await updateDoc(callDoc, { answer: { type: answer.type, sdp: answer.sdp } });
}
// ===== END AUTO-ADDED =====
EOFCODE

echo "Done. Functions appended."
