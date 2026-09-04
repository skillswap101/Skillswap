import React, { useState, useEffect } from 'react';
import { 
  X, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Monitor, 
  Play, 
  Pause, 
  CheckSquare, 
  FileText, 
  Sparkles, 
  Star, 
  Send, 
  Award, 
  Clock,
  Loader2,
  Wand2,
  CheckCircle2,
  Disc,
  Download
} from 'lucide-react';
import { Session, User } from '../types';

interface SessionRoomModalProps {
  session: Session | null;
  currentUser: User;
  onClose: () => void;
  onCompleteSession: (sessionId: string, rating: number, feedback: string) => void;
}

export const SessionRoomModal: React.FC<SessionRoomModalProps> = ({
  session,
  currentUser,
  onClose,
  onCompleteSession,
}) => {
  if (!session) return null;

  const [isVideoOn, setIsVideoOn] = useState<boolean>(true);
  const [isMicOn, setIsMicOn] = useState<boolean>(true);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedClipUrl, setRecordedClipUrl] = useState<string | null>(null);
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'agenda' | 'notes' | 'aiRoadmap' | 'codeEditor' | 'whiteboard'>('codeEditor');

  // Shared Code Editor State
  const [codeLanguage, setCodeLanguage] = useState<'typescript' | 'python' | 'javascript' | 'html'>('typescript');
  const [codeSnippet, setCodeSnippet] = useState<string>(
    `// Live Collaborative Workspace - ${session.title}\n// Edit code together during your WebRTC session\n\nfunction calculateSkillSwapCredits(hoursTaught: number): number {\n  const baseCreditRate = 1.0; // 1 Hour = 1 Credit\n  return hoursTaught * baseCreditRate;\n}\n\nconsole.log("Escrow Session Initialized for ${session.skillTitle}");\nconsole.log("Calculated Credits:", calculateSkillSwapCredits(1.5));`
  );
  const [codeOutput, setCodeOutput] = useState<string | null>(null);
  const [isRunningCode, setIsRunningCode] = useState<boolean>(false);

  // Whiteboard Canvas state
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [drawColor, setDrawColor] = useState<string>('#6366f1');
  const [isDrawing, setIsDrawing] = useState<boolean>(false);

  const handleRunCode = () => {
    setIsRunningCode(true);
    setTimeout(() => {
      setIsRunningCode(false);
      setCodeOutput(`[LOG] Escrow Session Initialized for ${session.skillTitle}\n[LOG] Calculated Credits: 1.5\n[SUCCESS] Code compiled with 0 errors.`);
    }, 800);
  };

  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  const [completedAgenda, setCompletedAgenda] = useState<Record<number, boolean>>({});
  const [sessionNotes, setSessionNotes] = useState<string>(
    `# Session Notes - ${session.title}\nDate: ${session.date}\n\n- Key takeaways:\n- Resources & links:\n- Next practice exercises:`
  );

  // AI Roadmap state
  const [roadmapData, setRoadmapData] = useState<any>(null);
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState<boolean>(false);

  // Completion Form Modal State
  const [showCompletionModal, setShowCompletionModal] = useState<boolean>(false);
  const [rating, setRating] = useState<number>(5);
  const [feedback, setFeedback] = useState<string>('');

  // Timer effect
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const handleGenerateRoadmap = async () => {
    setIsGeneratingRoadmap(true);
    try {
      const res = await fetch('/api/ai/learning-roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skillName: session.skillTitle,
          currentLevel: 'Intermediate',
          goal: 'Master core concepts and complete practical exercise',
        }),
      });

      if (!res.ok) throw new Error('Roadmap generation failed');
      const data = await res.json();
      setRoadmapData(data);
    } catch (err) {
      console.error(err);
      setRoadmapData({
        title: `4-Step Roadmap for ${session.skillTitle}`,
        steps: [
          { step: 1, title: 'Concept Overview', duration: '15 mins', description: 'Introduce core principles and real-world examples.' },
          { step: 2, title: 'Guided Exercise', duration: '20 mins', description: 'Live demonstration with real-time Q&A.' },
          { step: 3, title: 'Independent Practice', duration: '15 mins', description: 'Learner completes a mini task with mentor feedback.' },
          { step: 4, title: 'Session Recap & Homework', duration: '10 mins', description: 'Summarize key insights and agree on practice goals.' },
        ],
      });
    } finally {
      setIsGeneratingRoadmap(false);
    }
  };

  const handleFinishAndRate = (e: React.FormEvent) => {
    e.preventDefault();
    onCompleteSession(session.id, rating, feedback);
    setShowCompletionModal(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-lg overflow-y-auto">
      <div 
        className="relative w-full max-w-5xl h-[92vh] bg-slate-900 border border-slate-700/80 rounded-3xl overflow-hidden shadow-2xl text-slate-100 flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30 text-xs font-bold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Live Room
            </div>
            <div>
              <h2 className="text-base font-bold text-white line-clamp-1">{session.title}</h2>
              <p className="text-xs text-slate-400">
                Mentor: <strong className="text-indigo-300">{session.mentorName}</strong> | Learner: <strong className="text-purple-300">{session.learnerName}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Escrow Credit Settlement Ticker Pill */}
            <div className="hidden md:flex items-center gap-2 bg-indigo-950/80 border border-indigo-500/40 px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-indigo-300 shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>Escrow Settling:</span>
              <strong className="text-emerald-400">+{((secondsElapsed / 3600) * 1.0).toFixed(3)} Cr</strong>
            </div>

            {/* Timer */}
            <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono font-bold text-amber-300">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>{formatTime(secondsElapsed)}</span>
              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className="text-slate-400 hover:text-white ml-1"
                title={isTimerRunning ? 'Pause Session Timer' : 'Resume Session Timer'}
              >
                {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
            </div>

            <button
              onClick={() => setShowCompletionModal(true)}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all active:scale-95"
            >
              Finish & Rate
            </button>

            <button
              onClick={onClose}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Body Grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 overflow-hidden bg-slate-950">
          
          {/* Left / Top Stage: Video Call Area (2 Cols on lg) */}
          <div className="lg:col-span-2 p-4 flex flex-col justify-between space-y-4 bg-slate-950/80 border-r border-slate-800 overflow-y-auto">
            
            {/* Video Feed Containers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 min-h-[300px]">
              
              {/* Feed 1: Mentor Feed */}
              <div className="relative bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex items-center justify-center group shadow-md">
                {isVideoOn ? (
                  <img
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80"
                    alt="Mentor Feed"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center space-y-2 text-slate-500">
                    <VideoOff className="w-10 h-10" />
                    <span className="text-xs font-medium">Camera Off</span>
                  </div>
                )}
                <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-lg border border-slate-800 text-xs font-bold text-indigo-300">
                  {session.mentorName} (Mentor)
                </div>
              </div>

              {/* Feed 2: Learner / Me Feed */}
              <div className="relative bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex items-center justify-center group shadow-md">
                {isVideoOn ? (
                  <img
                    src={currentUser.avatar}
                    alt="Learner Feed"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center space-y-2 text-slate-500">
                    <VideoOff className="w-10 h-10" />
                    <span className="text-xs font-medium">Camera Off</span>
                  </div>
                )}
                <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-lg border border-slate-800 text-xs font-bold text-purple-300">
                  {currentUser.name} (You)
                </div>
              </div>

            </div>

            {/* Video Controls Dock */}
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex items-center justify-center gap-3 shrink-0 flex-wrap">
              <button
                onClick={() => setIsMicOn(!isMicOn)}
                className={`p-3 rounded-xl border transition-colors ${
                  isMicOn ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-rose-950/80 border-rose-800 text-rose-300'
                }`}
                title="Toggle Microphone"
              >
                {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>

              <button
                onClick={() => setIsVideoOn(!isVideoOn)}
                className={`p-3 rounded-xl border transition-colors ${
                  isVideoOn ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-rose-950/80 border-rose-800 text-rose-300'
                }`}
                title="Toggle Camera"
              >
                {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>

              <button
                onClick={() => setIsScreenSharing(!isScreenSharing)}
                className={`p-3 rounded-xl border transition-colors ${
                  isScreenSharing ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-200'
                }`}
                title="Share Screen"
              >
                <Monitor className="w-5 h-5" />
              </button>

              <button
                onClick={() => {
                  if (isRecording) {
                    setIsRecording(false);
                    setRecordedClipUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
                  } else {
                    setIsRecording(true);
                    setRecordedClipUrl(null);
                  }
                }}
                className={`px-3 py-2.5 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-bold ${
                  isRecording 
                    ? 'bg-rose-600 border-rose-400 text-white animate-pulse shadow-lg shadow-rose-600/30' 
                    : 'bg-slate-800 border-slate-700 text-slate-200 hover:border-rose-500/60'
                }`}
                title={isRecording ? 'Stop Screen Recording' : 'Record Session Clip'}
              >
                <Disc className={`w-4 h-4 ${isRecording ? 'animate-spin text-white' : 'text-rose-400'}`} />
                <span>{isRecording ? 'REC ON' : 'Record'}</span>
              </button>

              <button
                onClick={() => setShowCompletionModal(true)}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-extrabold shadow-md shadow-rose-600/20 transition-all"
              >
                End Session
              </button>
            </div>

            {/* Recorded Session Replay Banner */}
            {recordedClipUrl && (
              <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Session Recording Clip Saved</span>
                  </span>
                  <a
                    href={recordedClipUrl}
                    download="skillswap_session_recording.mp4"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:underline text-[11px] flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download MP4</span>
                  </a>
                </div>
                <video src={recordedClipUrl} controls className="w-full h-32 rounded-xl bg-black object-cover" />
              </div>
            )}

          </div>

          {/* Right Sidebar: Session Workspace */}
          <div className="p-4 flex flex-col justify-between space-y-4 bg-slate-900/60 overflow-y-auto">
            
            {/* Workspace Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-slate-400 overflow-x-auto">
              <button
                onClick={() => setActiveTab('codeEditor')}
                className={`px-3 py-1.5 rounded-lg text-center transition-colors whitespace-nowrap ${
                  activeTab === 'codeEditor' ? 'bg-indigo-600 text-white font-bold' : 'hover:text-slate-200'
                }`}
              >
                Code Editor
              </button>

              <button
                onClick={() => setActiveTab('whiteboard')}
                className={`px-3 py-1.5 rounded-lg text-center transition-colors whitespace-nowrap ${
                  activeTab === 'whiteboard' ? 'bg-indigo-600 text-white font-bold' : 'hover:text-slate-200'
                }`}
              >
                Whiteboard
              </button>

              <button
                onClick={() => setActiveTab('agenda')}
                className={`px-3 py-1.5 rounded-lg text-center transition-colors whitespace-nowrap ${
                  activeTab === 'agenda' ? 'bg-indigo-600 text-white font-bold' : 'hover:text-slate-200'
                }`}
              >
                Agenda
              </button>

              <button
                onClick={() => setActiveTab('notes')}
                className={`px-3 py-1.5 rounded-lg text-center transition-colors whitespace-nowrap ${
                  activeTab === 'notes' ? 'bg-indigo-600 text-white font-bold' : 'hover:text-slate-200'
                }`}
              >
                Notes
              </button>

              <button
                onClick={() => setActiveTab('aiRoadmap')}
                className={`px-3 py-1.5 rounded-lg text-center transition-colors whitespace-nowrap flex items-center justify-center gap-1 ${
                  activeTab === 'aiRoadmap' ? 'bg-purple-600 text-white font-bold' : 'hover:text-purple-300'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                <span>AI Roadmap</span>
              </button>
            </div>

            {/* Tab: Shared Live Code Editor */}
            {activeTab === 'codeEditor' && (
              <div className="space-y-3 flex-1 flex flex-col">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-300">Language:</span>
                    <select
                      value={codeLanguage}
                      onChange={(e: any) => setCodeLanguage(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-lg text-xs px-2 py-1 text-slate-200 focus:outline-none"
                    >
                      <option value="typescript">TypeScript</option>
                      <option value="javascript">JavaScript</option>
                      <option value="python">Python 3</option>
                      <option value="html">HTML / CSS</option>
                    </select>
                  </div>

                  <button
                    onClick={handleRunCode}
                    disabled={isRunningCode}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow transition-all flex items-center gap-1"
                  >
                    {isRunningCode ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                    <span>Run Code</span>
                  </button>
                </div>

                <div className="relative flex-1 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
                  <textarea
                    value={codeSnippet}
                    onChange={(e) => setCodeSnippet(e.target.value)}
                    className="w-full flex-1 p-3 bg-slate-950 text-xs font-mono text-emerald-400 focus:outline-none resize-none leading-relaxed"
                    spellCheck={false}
                  />
                  {codeOutput && (
                    <div className="border-t border-slate-800 p-3 bg-slate-900 text-[11px] font-mono text-slate-300 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-indigo-400">Execution Output:</span>
                      <pre className="whitespace-pre-wrap">{codeOutput}</pre>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab: Shared Whiteboard Canvas */}
            {activeTab === 'whiteboard' && (
              <div className="space-y-3 flex-1 flex flex-col">
                <div className="flex items-center justify-between bg-slate-950 p-2 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400">Color:</span>
                    {['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#ffffff'].map((c) => (
                      <button
                        key={c}
                        onClick={() => setDrawColor(c)}
                        style={{ backgroundColor: c }}
                        className={`w-5 h-5 rounded-full border border-slate-700 ${drawColor === c ? 'ring-2 ring-white scale-110' : ''}`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={handleClearCanvas}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold"
                  >
                    Clear Board
                  </button>
                </div>

                <div className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl relative overflow-hidden min-h-[200px]">
                  <canvas
                    ref={canvasRef}
                    width={450}
                    height={300}
                    className="w-full h-full cursor-crosshair bg-slate-950"
                    onMouseDown={(e) => {
                      setIsDrawing(true);
                      const ctx = canvasRef.current?.getContext('2d');
                      if (ctx) {
                        ctx.strokeStyle = drawColor;
                        ctx.lineWidth = 3;
                        ctx.beginPath();
                        ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
                      }
                    }}
                    onMouseMove={(e) => {
                      if (!isDrawing) return;
                      const ctx = canvasRef.current?.getContext('2d');
                      if (ctx) {
                        ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
                        ctx.stroke();
                      }
                    }}
                    onMouseUp={() => setIsDrawing(false)}
                  />
                </div>
              </div>
            )}

            {/* Tab 1: Interactive Agenda */}
            {activeTab === 'agenda' && (
              <div className="space-y-3 flex-1">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-emerald-400" /> Session Objectives Checklist
                </h3>

                <div className="space-y-2">
                  {session.agenda.map((item, idx) => (
                    <label
                      key={idx}
                      className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                        completedAgenda[idx]
                          ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200 line-through opacity-80'
                          : 'bg-slate-800/80 border-slate-700/60 text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={!!completedAgenda[idx]}
                        onChange={(e) => setCompletedAgenda({ ...completedAgenda, [idx]: e.target.checked })}
                        className="mt-0.5 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
                      />
                      <span className="text-xs font-medium leading-relaxed">{item}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 2: Shared Notepad */}
            {activeTab === 'notes' && (
              <div className="space-y-2 flex-1 flex flex-col">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-400" /> Collaborative Notepad
                </h3>

                <textarea
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  className="w-full flex-1 p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={12}
                />
              </div>
            )}

            {/* Tab 3: AI Roadmap Generator */}
            {activeTab === 'aiRoadmap' && (
              <div className="space-y-3 flex-1 overflow-y-auto">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-400" /> Custom Lesson Roadmap
                  </h3>

                  <button
                    onClick={handleGenerateRoadmap}
                    disabled={isGeneratingRoadmap}
                    className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold shadow-md shadow-purple-600/20"
                  >
                    {isGeneratingRoadmap ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>Generate Roadmap</span>
                      </>
                    )}
                  </button>
                </div>

                {!roadmapData ? (
                  <div className="p-6 bg-slate-950 border border-slate-800 rounded-xl text-center space-y-2">
                    <Sparkles className="w-8 h-8 text-purple-400 mx-auto" />
                    <p className="text-xs font-bold text-slate-300">Generate AI Guided Roadmap</p>
                    <p className="text-[11px] text-slate-500">
                      Click the button above to generate a tailored 4-step session lesson plan for {session.skillTitle}!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 animate-in fade-in">
                    <p className="text-xs font-bold text-indigo-300">{roadmapData.title}</p>
                    {roadmapData.steps?.map((st: any) => (
                      <div key={st.step} className="p-3 bg-slate-950 border border-purple-800/40 rounded-xl space-y-1">
                        <div className="flex items-center justify-between text-xs font-bold text-purple-300">
                          <span>Step {st.step}: {st.title}</span>
                          <span className="text-[10px] text-amber-400">{st.duration}</span>
                        </div>
                        <p className="text-[11px] text-slate-300">{st.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>

        </div>

        {/* Completion Rating Overlay Modal */}
        {showCompletionModal && (
          <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-md p-6 flex items-center justify-center">
            <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 space-y-4 text-center shadow-2xl">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
                <Award className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-bold text-white">Complete & Rate Swap Session</h3>
              <p className="text-xs text-slate-400">
                Rate your session with <strong className="text-indigo-300">{session.mentorName}</strong>. Completing this session will award 1 Time Credit!
              </p>

              {/* Star Rating selector */}
              <div className="flex items-center justify-center gap-2 py-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 text-amber-400 transition-transform hover:scale-125"
                  >
                    <Star className={`w-8 h-8 ${rating >= star ? 'fill-current text-amber-400' : 'text-slate-600'}`} />
                  </button>
                ))}
              </div>

              <textarea
                rows={3}
                placeholder="Write a brief thank you note or feedback for your mentor..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCompletionModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>

                <button
                  onClick={handleFinishAndRate}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30"
                >
                  Submit & Grant Credit
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
