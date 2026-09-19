import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Monitor, 
  PhoneOff, 
  ShieldCheck, 
  Clock, 
  Zap, 
  CheckCircle2, 
  Volume2, 
  Maximize2, 
  Sparkles,
  Settings,
  Lock,
  ArrowRightLeft,
  FileCode,
  Send,
  AlertCircle
} from 'lucide-react';
import { webRTCManager } from '../utils/WebRTCManager';
import { lockEscrowPoints, releaseEscrowPoints, disputeEscrowPoints, getEscrowForProposal } from '../utils/escrowManager';
import { EscrowTransaction, User, SessionNote } from '../types';

interface CallActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposalId?: string;
  peerName: string;
  peerAvatar: string;
  skillTitle: string;
  callType: 'video' | 'audio';
  currentUser: User;
  showToast: (msg: string) => void;
}

export const CallActionModal: React.FC<CallActionModalProps> = ({
  isOpen,
  onClose,
  proposalId = 'prop-1',
  peerName,
  peerAvatar,
  skillTitle,
  callType = 'video',
  currentUser,
  showToast,
}) => {
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isVideoOff, setIsVideoOff] = useState<boolean>(callType === 'audio');
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [escrowTx, setEscrowTx] = useState<EscrowTransaction | null>(null);
  const [isEscrowReleased, setIsEscrowReleased] = useState<boolean>(false);
  const [showNotesDrawer, setShowNotesDrawer] = useState<boolean>(false);
  const [sessionNotes, setSessionNotes] = useState<SessionNote[]>([
    {
      id: 'note-1',
      proposalId,
      authorName: peerName,
      authorAvatar: peerAvatar,
      content: 'Welcome to our live session! Feel free to paste code snippets or session goals here.',
      timestamp: 'Just now',
      type: 'note'
    }
  ]);
  const [newNoteText, setNewNoteText] = useState<string>('');

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Check or ensure Escrow points are locked for this session
    let tx = getEscrowForProposal(proposalId);
    if (!tx) {
      tx = lockEscrowPoints(
        proposalId,
        currentUser.id,
        currentUser.name,
        'usr_peer',
        peerName,
        skillTitle,
        1
      );
    }
    setEscrowTx(tx);
    setIsEscrowReleased(tx.status === 'RELEASED');

    // Start WebRTC connection
    webRTCManager.startCall({
      video: callType === 'video',
      audio: true,
      peerName,
      peerAvatar,
      skillTitle,
    }).then(({ localStream, remoteStream }) => {
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      }
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    });

    const unsubscribe = webRTCManager.subscribe((event, payload) => {
      if (event === 'quality-update') {
        setCallDuration(payload.duration);
      } else if (event === 'call-ended') {
        onClose();
      }
    });

    return () => {
      unsubscribe();
      webRTCManager.endCall();
    };
  }, [isOpen, proposalId, peerName, callType]);

  if (!isOpen) return null;

  const handleToggleMute = () => {
    const nextState = !isMuted;
    webRTCManager.toggleAudio(!nextState);
    setIsMuted(nextState);
  };

  const handleToggleVideo = () => {
    const nextState = !isVideoOff;
    webRTCManager.toggleVideo(!nextState);
    setIsVideoOff(nextState);
  };

  const handleToggleScreenShare = async () => {
    const active = await webRTCManager.toggleScreenShare();
    setIsScreenSharing(active);
    if (active) {
      showToast('Screen sharing started with mentor.');
    }
  };

  const handleReleaseEscrow = () => {
    if (!escrowTx) return;
    const updated = releaseEscrowPoints(escrowTx.id);
    if (updated) {
      setEscrowTx(updated);
      setIsEscrowReleased(true);
      showToast(`Escrow released! 1 Time Credit transferred to ${peerName}.`);
    }
  };

  const handleDisputeEscrow = () => {
    if (!escrowTx) return;
    const updated = disputeEscrowPoints(escrowTx.id);
    if (updated) {
      setEscrowTx(updated);
      showToast('Escrow marked under Dispute Protection. Support notified.');
    }
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    const note: SessionNote = {
      id: `sn-${Date.now()}`,
      proposalId,
      authorName: currentUser.name,
      authorAvatar: currentUser.avatar,
      content: newNoteText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: newNoteText.includes('function') || newNoteText.includes('const') ? 'code' : 'note',
      language: 'typescript'
    };
    setSessionNotes((prev) => [...prev, note]);
    setNewNoteText('');
  };

  const handleEndCall = () => {
    webRTCManager.endCall();
    showToast('Call session ended.');
    onClose();
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-5xl w-full overflow-hidden shadow-2xl flex flex-col h-[88vh] relative">
        
        {/* Call Header Bar */}
        <div className="flex items-center justify-between p-4 bg-slate-950/80 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <img
              src={peerAvatar}
              alt={peerName}
              className="w-10 h-10 rounded-full object-cover border-2 border-indigo-500/50"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-white">{peerName}</h3>
                <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 rounded-md text-[10px] font-bold">
                  {callType === 'video' ? 'HD Video Session' : 'Voice Session'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">{skillTitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Call Duration Counter */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono font-bold text-amber-300">
              <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>{formatTimer(callDuration)}</span>
            </div>

            {/* Escrow Status Pill */}
            {escrowTx && (
              <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${
                isEscrowReleased
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                  : escrowTx.status === 'DISPUTED'
                  ? 'bg-red-950 text-red-300 border-red-800'
                  : 'bg-indigo-950 text-indigo-300 border-indigo-800'
              }`}>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>
                  {isEscrowReleased
                    ? '1 Credit Released'
                    : escrowTx.status === 'DISPUTED'
                    ? 'In Dispute'
                    : '1 Credit in Escrow'}
                </span>
              </div>
            )}

            <button
              onClick={handleEndCall}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Stage + Optional Scratchpad Split View */}
        <div className="flex-1 bg-slate-950 relative overflow-hidden flex">
          
          {/* Main Remote Video Stream */}
          <div className="flex-1 relative flex items-center justify-center bg-slate-950">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />

            {/* Picture-in-Picture Local Video Stream */}
            <div className="absolute top-4 right-4 w-32 sm:w-44 h-24 sm:h-32 bg-slate-900 border-2 border-indigo-500/50 rounded-2xl overflow-hidden shadow-2xl z-10">
              {isVideoOff ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-500">
                  <VideoOff className="w-6 h-6" />
                  <span className="text-[10px] font-bold mt-1">Camera Off</span>
                </div>
              ) : (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />
              )}
              <div className="absolute bottom-1 left-1.5 px-1.5 py-0.5 bg-slate-950/80 rounded text-[9px] font-bold text-slate-300">
                You
              </div>
            </div>

            {/* Peer Overlay Badge */}
            <div className="absolute bottom-4 left-4 p-3 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl flex items-center gap-3 shadow-xl z-10">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
              <div>
                <span className="block text-xs font-bold text-white">{peerName}</span>
                <span className="block text-[10px] text-emerald-400 font-semibold">Live Peer Connection (STUN)</span>
              </div>
            </div>

            {/* Escrow Release / Dispute Quick Prompt Banner */}
            {escrowTx && !isEscrowReleased && escrowTx.status !== 'DISPUTED' && (
              <div className="absolute top-4 left-4 right-36 sm:right-52 z-10 bg-indigo-950/90 backdrop-blur-md border border-indigo-500/40 rounded-2xl p-3 shadow-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                  <p className="text-[11px] text-slate-200 font-medium hidden sm:block">
                    1 Time Credit held safely in Escrow for this session.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleReleaseEscrow}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Release Credit</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDisputeEscrow}
                    className="p-1.5 text-slate-400 hover:text-red-400 transition-colors"
                    title="Report Issue / Dispute"
                  >
                    <AlertCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Collaborative Code & Notes Scratchpad Drawer */}
          {showNotesDrawer && (
            <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col shrink-0 animate-in slide-in-from-right duration-200">
              <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <FileCode className="w-4 h-4 text-indigo-400" />
                  <span>Live Code & Session Notes</span>
                </div>
                <button
                  onClick={() => setShowNotesDrawer(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 p-3 overflow-y-auto space-y-3 custom-scrollbar">
                {sessionNotes.map((note) => (
                  <div key={note.id} className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-indigo-300">{note.authorName}</span>
                      <span className="text-[10px] text-slate-500">{note.timestamp}</span>
                    </div>
                    {note.type === 'code' ? (
                      <pre className="p-2 bg-slate-900 rounded border border-slate-800 font-mono text-[11px] text-emerald-400 overflow-x-auto whitespace-pre-wrap">
                        {note.content}
                      </pre>
                    ) : (
                      <p className="text-slate-300 leading-relaxed">{note.content}</p>
                    )}
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddNote} className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Paste code snippet or write note..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none"
                />
                <button
                  type="submit"
                  className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}

        </div>

        {/* Call Controls Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleMute}
              className={`p-3 rounded-2xl font-bold transition-all cursor-pointer ${
                isMuted
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
              title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <button
              type="button"
              onClick={handleToggleVideo}
              className={`p-3 rounded-2xl font-bold transition-all cursor-pointer ${
                isVideoOff
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
              title={isVideoOff ? 'Turn on video' : 'Turn off video'}
            >
              {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>

            <button
              type="button"
              onClick={handleToggleScreenShare}
              className={`p-3 rounded-2xl font-bold transition-all cursor-pointer ${
                isScreenSharing
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
              title="Share Screen"
            >
              <Monitor className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => setShowNotesDrawer(!showNotesDrawer)}
              className={`p-3 rounded-2xl font-bold transition-all cursor-pointer ${
                showNotesDrawer
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
              title="Toggle Live Notes Scratchpad"
            >
              <FileCode className="w-5 h-5" />
            </button>
          </div>

          {/* Leave/End Session button */}
          <button
            type="button"
            onClick={handleEndCall}
            className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-red-600/30 transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <PhoneOff className="w-4 h-4" />
            <span>End Call</span>
          </button>
        </div>

      </div>
    </div>
  );
};

