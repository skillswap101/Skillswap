#!/bin/bash
echo "Injecting Video UI into LiveSessionRoom.tsx..."

# Find the first "return (" and insert our UI right after it
sed -i '0,/return (/s//return (\n    <>\n    {/* AUTO-INJECTED WEBRTC UI */}\n    <div className="flex gap-2 p-4">\n      <div className="w-1\/2">\n        <p className="text-xs text-center text-white">You<\/p>\n        <video ref={setLocalVideoRef} autoPlay muted playsInline className="w-full bg-black rounded-lg h-64" \/><\/div>\n      <div className="w-1\/2">\n        <p className="text-xs text-center text-white">Peer<\/p>\n        <video ref={setRemoteVideoRef} autoPlay playsInline className="w-full bg-black rounded-lg h-64" \/><\/div>\n    <\/div>\n    <div className="flex gap-2 justify-center p-4">\n      <button onClick={() => startCall("test-room-123")} className="bg-green-500 text-white px-4 py-2 rounded">Start Call<\/button>\n      <button onClick={() => joinCall("test-room-123")} className="bg-blue-500 text-white px-4 py-2 rounded">Join Call<\/button>\n    <\/div>\n    {/* END AUTO-INJECTED */}/' src/components/LiveSessionRoom.tsx

echo "Done! UI injected."
