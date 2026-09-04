import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  Mic,
  MicOff,
  VideoOff,
  ScreenShare,
  Clock,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Lock,
  Unlock,
  Send,
  Sparkles,
  FileCode,
  CheckSquare,
  MessageSquare,
  Star,
  Users,
  ShieldCheck,
  AlertCircle,
  PenTool,
  Code2,
  Award,
  Download,
  BrainCircuit,
  Calendar,
  Volume2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SwapContract, UserProfile } from '../types';
import { EscrowManager } from '../lib/escrowManager';
import { api } from '../lib/api';
import { CollaborativeWhiteboard } from './CollaborativeWhiteboard';
import { CodeSandboxRunner } from './CodeSandboxRunner';
import { SkillCertificateModal } from './SkillCertificateModal';
import { CalendarScheduleModal } from './CalendarScheduleModal';

interface LiveSessionRoomProps {
  swap: SwapContract;
  currentUser: UserProfile;
  onExit: () => void;
  onSessionSettled: () => void;
}

export const LiveSessionRoom: React.FC<LiveSessionRoomProps> = ({
  swap,
  currentUser,
  onExit,
  onSessionSettled,
}) => {
  // Timer State
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [timerRunning, setTimerRunning] = useState(true);

  // AV Simulator & WebRTC States
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [realWebRtcActive, setRealWebRtcActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Workspace Tabs: notes | checklist | whiteboard | sandbox | chat
  const [workspaceTab, setWorkspaceTab] = useState<'notes' | 'checklist' | 'whiteboard' | 'sandbox' | 'chat'>('notes');
  
  const [notesContent, setNotesContent] = useState<string>(
    `# 🚀 Live Swap Session: ${swap.skillTitle}\n\n` +
    `**Learner:** ${swap.requesterName}\n` +
    `**Mentor:** ${swap.providerName}\n` +
    `**Locked Escrow:** ${swap.totalCredits} Time Credits\n\n` +
    `## Key Takeaways & Action Items:\n- [x] Initial alignment on learning goals\n- [ ] Deep dive walkthrough\n- [ ] Practical live exercise\n`
  );

  // Milestone Checklists
  const [milestones, setMilestones] = useState<Array<{ id: number; text: string; done: boolean }>>(
    (swap.learningGoals && swap.learningGoals.length > 0
      ? swap.learningGoals
      : ['Review foundational concepts', 'Live practical coding/exercise', 'Q&A and follow-up guidance']
    ).map((text, i) => ({ id: i + 1, text, done: i === 0 }))
  );

  // Chat Log
  const [chatMessages, setChatMessages] = useState<Array<{ sender: string; text: string; time: string }>>([
    { sender: swap.providerName, text: 'Hello! Excited for our swap session today.', time: '10:00 AM' },
    { sender: swap.requesterName, text: 'Hi! Ready with my questions and dev environment.', time: '10:01 AM' },
  ]);
  const [chatInput, setChatInput] = useState('');

  // AI Summary State
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [aiSummaryResult, setAiSummaryResult] = useState<{
    executiveSummary: string;
    keyTakeaways: string[];
    practicalExercises: string[];
    followUpGoals: string[];
    certificateRecommendation: boolean;
  } | null>(null);

  // Modal States
  const [completing, setCompleting] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');

  // WebRTC Local Media Stream toggler
  useEffect(() => {
    async function initMedia() {
      if (camOn && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: micOn });
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          setRealWebRtcActive(true);
        } catch (err) {
          // Camera permission denied or not available - gracefully fallback to avatar mode
          setRealWebRtcActive(false);
        }
      } else {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        setRealWebRtcActive(false);
      }
    }
    initMedia();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [camOn, micOn]);

  // Timer Tick Effect
  useEffect(() => {
    let interval: any = null;
    if (timerRunning) {
      interval = setInterval(() => {
        setSecondsElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  const formatTimer = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const newMsg = {
      sender: currentUser.name,
      text: chatInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setChatMessages(prev => [...prev, newMsg]);
    setChatInput('');
  };

  const toggleMilestone = (id: number) => {
    setMilestones(prev =>
      prev.map(m => (m.id === id ? { ...m, done: !m.done } : m))
    );
  };

  const handleGenerateAiSummary = async () => {
    setIsSummarizing(true);
    try {
      const summary = await api.summarizeSession({
        skillTitle: swap.skillTitle,
        mentorName: swap.providerName,
        learnerName: swap.requesterName,
        notes: notesContent,
        milestones: milestones.map(m => ({ text: m.text, done: m.done })),
        durationMinutes: Math.max(15, Math.floor(secondsElapsed / 60)),
      });
      setAiSummaryResult(summary);
      
      // Append AI recap to notes
      setNotesContent(prev =>
        prev +
        `\n\n## 🤖 AI Session Summary & Action Items\n` +
        `**Summary:** ${summary.executiveSummary}\n\n` +
        `### Key Takeaways:\n` +
        summary.keyTakeaways.map((t: string) => `- ${t}`).join('\n') +
        `\n\n### Practical Practice Exercises:\n` +
        summary.practicalExercises.map((e: string) => `- ${e}`).join('\n') +
        `\n\n### Next Session Goals:\n` +
        summary.followUpGoals.map((g: string) => `- ${g}`).join('\n')
      );
    } catch (err: any) {
      console.warn('AI summary error:', err);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleSignOffAndRelease = async () => {
    setCompleting(true);
    try {
      await EscrowManager.completeAndRelease(swap.id, currentUser.id);
      try {
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
      } catch (e) {}
      setCompleting(false);
      setShowReviewModal(true);
    } catch (err: any) {
      setCompleting(false);
      alert(`Settlement failed: ${err.message}`);
    }
  };

  const handleSubmitReview = () => {
    setShowReviewModal(false);
    onSessionSettled();
    onExit();
  };

  return (
    <div className="bg-slate-900 text-slate-100 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden min-h-[780px] flex flex-col mb-12">
      
      {/* Studio Top Control Bar */}
      <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        
        {/* Session Meta */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-teal-500 flex items-center justify-center text-white font-bold shadow-md">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-white text-base truncate max-w-md">{swap.skillTitle}</h2>
              <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2.5 py-0.5 rounded-full font-bold border border-emerald-500/30 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Live Studio v5.0
              </span>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-3 mt-0.5">
              <span>Learner: <strong className="text-slate-200">{swap.requesterName}</strong></span>
              <span>•</span>
              <span>Mentor: <strong className="text-slate-200">{swap.providerName}</strong></span>
              <span>•</span>
              <span className="text-amber-300 font-semibold flex items-center gap-1">
                <Lock className="w-3 h-3 text-indigo-400" />
                {swap.totalCredits} Credits in Escrow
              </span>
            </div>
          </div>
        </div>

        {/* Real-time Session Clock & Schedule Button */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 bg-slate-900 px-4 py-2 rounded-2xl border border-slate-800">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span className="font-mono font-bold text-lg text-emerald-300 tracking-wider">
              {formatTimer(secondsElapsed)}
            </span>
            <div className="flex items-center gap-1 border-l border-slate-700 pl-2">
              <button
                onClick={() => setTimerRunning(!timerRunning)}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                title={timerRunning ? 'Pause Session Timer' : 'Resume Session Timer'}
              >
                {timerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setSecondsElapsed(0)}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                title="Reset Timer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <button
            onClick={() => setShowCalendarModal(true)}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-800 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            title="Schedule & Calendar Sync"
          >
            <Calendar className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">Calendar</span>
          </button>
        </div>

        {/* Top Actions: AI Summary & Settlement */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCertModal(true)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-xl border border-slate-700 shadow-md flex items-center gap-1.5 transition-colors"
          >
            <Award className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Certificate</span>
          </button>

          <button
            onClick={handleSignOffAndRelease}
            disabled={completing || swap.status === 'settled'}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-all"
          >
            <Unlock className="w-4 h-4" />
            {swap.status === 'settled' ? 'Escrow Settled ✓' : 'Bilateral Sign-Off & Release'}
          </button>

          <button
            onClick={onExit}
            className="px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            Leave
          </button>
        </div>

      </div>

      {/* Main Studio Split Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        
        {/* Left Col: Peer Video Stage Simulator & WebRTC (6 cols) */}
        <div className="lg:col-span-6 p-5 flex flex-col justify-between bg-slate-950/60 border-r border-slate-800 space-y-4">
          
          {/* Main Video Stream Container */}
          <div className="relative flex-1 min-h-[360px] bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-center shadow-inner">
            
            {camOn ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src={
                    currentUser.id === swap.requesterId
                      ? swap.providerAvatar
                      : swap.requesterAvatar
                  }
                  alt="Partner Stream"
                  className="w-full h-full object-cover opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/30" />
                
                {/* Partner Name Overlay */}
                <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/80 text-xs">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-semibold text-white">
                    {currentUser.id === swap.requesterId ? swap.providerName : swap.requesterName} (Peer)
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">1080p • 60fps WebRTC</span>
                </div>

                {/* Self View PIP with Real WebRTC / Fallback */}
                <div className="absolute top-4 right-4 w-40 h-32 bg-slate-800 rounded-xl border-2 border-indigo-500 shadow-2xl overflow-hidden">
                  {realWebRtcActive ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover mirror"
                    />
                  ) : (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute bottom-1 left-1.5 text-[9px] font-bold bg-slate-950/90 px-1.5 py-0.5 rounded text-white flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    You ({realWebRtcActive ? 'Webcam Live' : 'Host'})
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center p-8">
                <VideoOff className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-400">Camera Paused</p>
              </div>
            )}

            {/* Screen Share Overlay Indicator */}
            {screenSharing && (
              <div className="absolute top-4 left-4 bg-indigo-600 text-white text-[11px] font-bold px-3 py-1 rounded-lg flex items-center gap-1.5 shadow-md">
                <ScreenShare className="w-3.5 h-3.5" />
                Sharing Screen: Live Workspace & Code
              </div>
            )}

          </div>

          {/* AV Controls Bar */}
          <div className="bg-slate-900/90 rounded-2xl p-3 border border-slate-800 flex items-center justify-center gap-3">
            <button
              onClick={() => setMicOn(!micOn)}
              className={`p-3 rounded-xl font-semibold text-xs flex items-center gap-2 transition-all ${
                micOn
                  ? 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}
            >
              {micOn ? <Mic className="w-4 h-4 text-emerald-400" /> : <MicOff className="w-4 h-4 text-rose-400" />}
              <span>{micOn ? 'Mute' : 'Unmute'}</span>
            </button>

            <button
              onClick={() => setCamOn(!camOn)}
              className={`p-3 rounded-xl font-semibold text-xs flex items-center gap-2 transition-all ${
                camOn
                  ? 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}
            >
              {camOn ? <Video className="w-4 h-4 text-emerald-400" /> : <VideoOff className="w-4 h-4 text-rose-400" />}
              <span>{camOn ? 'Stop Video' : 'Start Video'}</span>
            </button>

            <button
              onClick={() => setScreenSharing(!screenSharing)}
              className={`p-3 rounded-xl font-semibold text-xs flex items-center gap-2 transition-all ${
                screenSharing
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
            >
              <ScreenShare className="w-4 h-4" />
              <span>{screenSharing ? 'Stop Share' : 'Share Screen'}</span>
            </button>
          </div>

        </div>

        {/* Right Col: Multi-Tab Interactive Workspace (6 cols) */}
        <div className="lg:col-span-6 flex flex-col bg-slate-900/40 border-slate-800 overflow-hidden">
          
          {/* Workspace Tabs Header */}
          <div className="flex items-center border-b border-slate-800 bg-slate-950/60 p-2 gap-1 overflow-x-auto">
            <button
              onClick={() => setWorkspaceTab('notes')}
              className={`px-3 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shrink-0 ${
                workspaceTab === 'notes'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              Notes
            </button>

            <button
              onClick={() => setWorkspaceTab('whiteboard')}
              className={`px-3 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shrink-0 ${
                workspaceTab === 'whiteboard'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <PenTool className="w-3.5 h-3.5 text-teal-400" />
              Whiteboard
            </button>

            <button
              onClick={() => setWorkspaceTab('sandbox')}
              className={`px-3 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shrink-0 ${
                workspaceTab === 'sandbox'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Code2 className="w-3.5 h-3.5 text-amber-400" />
              Code Sandbox
            </button>

            <button
              onClick={() => setWorkspaceTab('checklist')}
              className={`px-3 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shrink-0 ${
                workspaceTab === 'checklist'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              Milestones
            </button>

            <button
              onClick={() => setWorkspaceTab('chat')}
              className={`px-3 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shrink-0 ${
                workspaceTab === 'chat'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Chat
            </button>
          </div>

          {/* Workspace Tab Content */}
          <div className="flex-1 p-4 overflow-y-auto min-h-[440px]">
            
            {/* 1. NOTES TAB */}
            {workspaceTab === 'notes' && (
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between mb-2 text-xs text-slate-400">
                  <span>Markdown & Session Scratchpad</span>
                  <button
                    onClick={handleGenerateAiSummary}
                    disabled={isSummarizing}
                    className="px-2.5 py-1 bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white text-[11px] font-bold rounded-lg shadow flex items-center gap-1 transition-all disabled:opacity-50"
                  >
                    <BrainCircuit className="w-3 h-3 text-emerald-300" />
                    <span>{isSummarizing ? 'AI Analyzing...' : 'Generate AI Session Recap'}</span>
                  </button>
                </div>
                <textarea
                  value={notesContent}
                  onChange={e => setNotesContent(e.target.value)}
                  className="flex-1 w-full bg-slate-950 text-slate-200 font-mono text-xs p-4 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none leading-relaxed min-h-[360px]"
                />
              </div>
            )}

            {/* 2. WHITEBOARD TAB */}
            {workspaceTab === 'whiteboard' && (
              <div className="h-full min-h-[440px]">
                <CollaborativeWhiteboard />
              </div>
            )}

            {/* 3. CODE SANDBOX TAB */}
            {workspaceTab === 'sandbox' && (
              <div className="h-full min-h-[440px]">
                <CodeSandboxRunner />
              </div>
            )}

            {/* 4. CHECKLIST TAB */}
            {workspaceTab === 'checklist' && (
              <div className="space-y-3">
                <div className="text-xs text-slate-400 mb-2">
                  Check off learning goals as they are covered in this session:
                </div>
                <div className="space-y-2">
                  {milestones.map(m => (
                    <div
                      key={m.id}
                      onClick={() => toggleMilestone(m.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 text-xs ${
                        m.done
                          ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={m.done}
                        onChange={() => {}}
                        className="mt-0.5 rounded text-emerald-500 focus:ring-0 cursor-pointer"
                      />
                      <span className={m.done ? 'line-through text-slate-400' : 'font-medium'}>
                        {m.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. CHAT TAB */}
            {workspaceTab === 'chat' && (
              <div className="h-full flex flex-col justify-between">
                <div className="space-y-3 overflow-y-auto max-h-[340px] pr-1">
                  {chatMessages.map((msg, idx) => {
                    const isMe = msg.sender === currentUser.name;
                    return (
                      <div
                        key={idx}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <span className="text-[10px] text-slate-400 mb-0.5">{msg.sender} • {msg.time}</span>
                        <div
                          className={`px-3 py-2 rounded-xl text-xs max-w-[85%] ${
                            isMe
                              ? 'bg-indigo-600 text-white rounded-br-none'
                              : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <form onSubmit={handleSendMessage} className="mt-4 flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    placeholder="Type message or code snippet..."
                    className="flex-1 bg-slate-950 border border-slate-800 text-xs text-white rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

          </div>

          {/* Escrow Status Micro-Footer */}
          <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Escrow Protection Active
            </span>
            <span className="font-mono text-indigo-300 font-semibold">
              {swap.totalCredits} Time Credit{swap.totalCredits > 1 ? 's' : ''} Locked
            </span>
          </div>

        </div>

      </div>

      {/* Review & Rating Settlement Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 text-center text-slate-100 shadow-2xl">
            <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-lg text-white">Escrow Released Successfully!</h3>
            <p className="text-xs text-slate-400 mt-1">
              {swap.totalCredits} Time Credits have been transferred to{' '}
              <strong>{swap.providerName}</strong>. Rate your peer learning experience:
            </p>

            {/* 5-Star Selector */}
            <div className="flex justify-center gap-2 my-4">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
                    }`}
                  />
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              value={reviewText}
              onChange={e => setReviewText(e.target.value)}
              placeholder="Leave a short peer testimonial (e.g., 'Fantastic teacher! Clear, patient, and hands-on.')..."
              className="w-full bg-slate-950 border border-slate-800 text-xs text-white p-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 mb-4"
            />

            <div className="flex gap-2">
              <button
                onClick={() => setShowCertModal(true)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-1"
              >
                <Award className="w-4 h-4" />
                View Certificate
              </button>
              <button
                onClick={handleSubmitReview}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Certificate Modal */}
      {showCertModal && (
        <SkillCertificateModal
          swap={swap}
          currentUser={currentUser}
          onClose={() => setShowCertModal(false)}
        />
      )}

      {/* Calendar Reschedule Modal */}
      {showCalendarModal && (
        <CalendarScheduleModal
          swap={swap}
          currentUser={currentUser}
          onClose={() => setShowCalendarModal(false)}
        />
      )}

    </div>
  );
};
