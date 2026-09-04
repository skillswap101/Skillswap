import React, { useState } from 'react';
import { X, Play, Pause, Clock, Calendar, CheckCircle2, Star, Sparkles, ArrowRightLeft, Bookmark, ShieldCheck, BarChart3, Volume2, Award, Eye, FileText } from 'lucide-react';
import { Skill } from '../types';

interface SkillPreviewModalProps {
  skill: Skill;
  isOpen: boolean;
  onClose: () => void;
  onProposeSwap: (skill: Skill) => void;
  isBookmarked: boolean;
  onToggleBookmark: (skillId: string) => void;
}

export const SkillPreviewModal: React.FC<SkillPreviewModalProps> = ({
  skill,
  isOpen,
  onClose,
  onProposeSwap,
  isBookmarked,
  onToggleBookmark,
}) => {
  const [isPlayingDemo, setIsPlayingDemo] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'curriculum' | 'availability'>('preview');

  if (!isOpen) return null;

  const progressVal = skill.progressPercent || 80;

  // Level color & difficulty configuration
  const getDifficultyBadge = (level: string) => {
    switch (level) {
      case 'Beginner':
        return { color: 'text-emerald-400 bg-emerald-950/80 border-emerald-500/50', label: 'Beginner (Entry Level)', bars: 1 };
      case 'Intermediate':
        return { color: 'text-amber-400 bg-amber-950/80 border-amber-500/50', label: 'Intermediate (Practical Experience)', bars: 2 };
      case 'Advanced':
        return { color: 'text-rose-400 bg-rose-950/80 border-rose-500/50', label: 'Advanced (Mastery & Deep Dive)', bars: 3 };
      default:
        return { color: 'text-blue-400 bg-blue-950/80 border-blue-500/50', label: 'All Levels (Tailored to You)', bars: 2 };
    }
  };

  const diffInfo = getDifficultyBadge(skill.level);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8">
        
        {/* Header / Banner */}
        <div className="relative h-44 sm:h-52 w-full overflow-hidden bg-slate-950">
          <img
            src={skill.image}
            alt={skill.title}
            className="w-full h-full object-cover opacity-40 blur-[1px] scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-slate-950/80 hover:bg-slate-900 text-slate-300 hover:text-white rounded-full border border-slate-700/70 backdrop-blur-md transition-all z-20"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Title overlay */}
          <div className="absolute bottom-4 left-6 right-6 space-y-2">
            <div className="flex items-center gap-2 flex-wrap text-xs font-semibold">
              <span className="px-3 py-1 bg-indigo-950/90 text-indigo-300 border border-indigo-700/60 rounded-lg backdrop-blur-md">
                {skill.category}
              </span>
              <span className={`px-3 py-1 rounded-lg border backdrop-blur-md font-bold flex items-center gap-1.5 ${diffInfo.color}`}>
                <BarChart3 className="w-3.5 h-3.5" />
                <span>{skill.level}</span>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-tight drop-shadow-sm">
              {skill.title}
            </h2>
          </div>
        </div>

        {/* Mentor Bar */}
        <div className="px-6 py-3.5 bg-slate-950/70 border-b border-slate-800/80 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <img
              src={skill.userAvatar}
              alt={skill.userName}
              className="w-10 h-10 rounded-full object-cover border-2 border-indigo-500/50 shadow-sm"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-slate-100">{skill.userName}</span>
                {skill.verified && <ShieldCheck className="w-4 h-4 text-emerald-400" />}
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <Star className="w-3 h-3 text-amber-400 fill-current" />
                <span className="font-bold text-amber-400">{skill.userRating.toFixed(1)}</span>
                <span>({skill.userReviewCount} reviews)</span>
                <span>•</span>
                <span>{skill.userLocation}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleBookmark(skill.id)}
              className={`p-2.5 rounded-xl border transition-all text-xs font-bold flex items-center gap-1.5 ${
                isBookmarked
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
              <span>{isBookmarked ? 'Saved' : 'Save Listing'}</span>
            </button>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 px-6 pt-3 gap-6">
          <button
            onClick={() => setActiveTab('preview')}
            className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'preview'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Interactive Preview</span>
          </button>
          <button
            onClick={() => setActiveTab('curriculum')}
            className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'curriculum'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Curriculum & Progress ({skill.curriculumMilestones?.length || skill.learningObjectives.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('availability')}
            className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'availability'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Availability Slots</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {activeTab === 'preview' && (
            <div className="space-y-6">
              {/* Media Preview Box */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 relative overflow-hidden space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Sample Session Teaser & Video Showcase</span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">VIDEO / AUDIO DEMO</span>
                </div>

                {skill.previewVideoUrl && (
                  <div className="rounded-xl overflow-hidden border border-slate-800 bg-black">
                    <video
                      src={skill.previewVideoUrl}
                      controls
                      playsInline
                      className="w-full h-56 sm:h-64 object-cover"
                    />
                  </div>
                )}

                <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl space-y-3">
                  <p className="text-xs text-slate-300 italic leading-relaxed">
                    "{skill.previewSnippet || skill.description}"
                  </p>

                  {/* Audio / Video Visualizer Control */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-center gap-3">
                    <button
                      onClick={() => setIsPlayingDemo(!isPlayingDemo)}
                      className={`p-3 rounded-full text-slate-950 font-bold transition-transform active:scale-90 ${
                        isPlayingDemo ? 'bg-amber-400' : 'bg-indigo-500 hover:bg-indigo-400'
                      }`}
                    >
                      {isPlayingDemo ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                    </button>

                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                        <span>{isPlayingDemo ? 'Playing Audio Lesson Teaser...' : 'Click to Listen to Lesson Preview'}</span>
                        <span>{isPlayingDemo ? '00:24 / 01:30' : '00:00'}</span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden relative">
                        <div
                          className={`h-full transition-all duration-300 ${isPlayingDemo ? 'w-2/5 bg-gradient-to-r from-indigo-500 to-amber-400' : 'w-0'}`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress & Difficulty Summary Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Skill Difficulty Metric Card */}
                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <BarChart3 className="w-4 h-4 text-indigo-400" />
                      Skill Difficulty
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${diffInfo.color}`}>
                      {skill.level}
                    </span>
                  </div>
                  
                  {/* Difficulty level bars */}
                  <div className="flex items-center gap-1.5 pt-1">
                    {[1, 2, 3].map((bar) => (
                      <div
                        key={bar}
                        className={`h-2.5 flex-1 rounded-full ${
                          bar <= diffInfo.bars
                            ? 'bg-indigo-500 shadow-sm shadow-indigo-500/50'
                            : 'bg-slate-800'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-slate-400">
                    {diffInfo.label}
                  </p>
                </div>

                {/* Student Progress Rate Card */}
                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-amber-400" />
                      Student Completion Rate
                    </span>
                    <span className="text-sm font-extrabold text-amber-400">{progressVal}%</span>
                  </div>

                  <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all duration-500"
                      style={{ width: `${progressVal}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400">
                    Average student mastery score based on {skill.completedSessionsCount || 10}+ swapped sessions.
                  </p>
                </div>
              </div>

              {/* What You Will Learn */}
              <div className="space-y-3 bg-slate-800/30 p-4 rounded-2xl border border-slate-800">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Core Learning Objectives
                </h4>
                <div className="space-y-2">
                  {skill.learningObjectives.map((obj, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{obj}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'curriculum' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-200">Session Breakdown & Milestones</h4>
                <span className="text-xs text-indigo-400 font-semibold">{progressVal}% Average Course Progress</span>
              </div>

              <div className="space-y-3">
                {(skill.curriculumMilestones || skill.learningObjectives.map((obj, idx) => ({ title: obj, duration: '45-60 mins', completed: idx === 0 }))).map((milestone, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
                      milestone.completed
                        ? 'bg-slate-950/80 border-emerald-500/40 text-slate-200'
                        : 'bg-slate-900 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                        milestone.completed ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {idx + 1}
                      </span>
                      <div>
                        <h5 className="text-xs font-bold text-slate-100">{milestone.title}</h5>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-500" /> {milestone.duration}
                        </p>
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                      milestone.completed ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {milestone.completed ? 'Completed Step' : 'Upcoming Session'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'availability' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-950/40 border border-emerald-800/60 rounded-2xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] uppercase font-bold text-emerald-400 tracking-wider block">Next Available Slot</span>
                    <span className="text-sm font-bold text-slate-100">{skill.nextAvailableSlot || 'This Weekend • Flexible Scheduling'}</span>
                  </div>
                </div>
                <span className="px-3 py-1 bg-emerald-500 text-slate-950 font-extrabold text-xs rounded-lg shadow-md">
                  Open Slot
                </span>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recurring Weekly Availability</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {skill.availability.map((avail, i) => (
                    <div key={i} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-2.5 text-xs text-slate-200">
                      <Clock className="w-4 h-4 text-indigo-400" />
                      <span className="font-semibold">{avail}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-5 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3 flex-wrap">
          <div className="text-xs text-slate-400">
            Swap Type: <span className="font-bold text-indigo-400">{skill.swapType}</span> • Delivery: <span className="font-bold text-slate-200">{skill.delivery}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold transition-all"
            >
              Close
            </button>

            <button
              onClick={() => {
                onClose();
                onProposeSwap(skill);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/25 transition-all active:scale-95"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>Propose Skill Swap</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
