import React from 'react';
import { 
  X, 
  Star, 
  CheckCircle2, 
  MapPin, 
  Clock, 
  Calendar, 
  ArrowRightLeft, 
  Video, 
  Target, 
  Award, 
  MessageSquare, 
  UserCheck,
  Eye,
  BarChart3
} from 'lucide-react';
import { Skill, Review } from '../types';

interface SkillDetailModalProps {
  skill: Skill | null;
  reviews: Review[];
  onClose: () => void;
  onProposeSwap: (skill: Skill) => void;
  onOpenPreview?: (skill: Skill) => void;
}

export const SkillDetailModal: React.FC<SkillDetailModalProps> = ({
  skill,
  reviews,
  onClose,
  onProposeSwap,
  onOpenPreview,
}) => {
  if (!skill) return null;

  const filteredReviews = reviews.filter((r) => r.skillId === skill.id || r.skillTitle.toLowerCase().includes(skill.category.toLowerCase()));
  const progressVal = skill.progressPercent || 80;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-3xl overflow-hidden shadow-2xl my-8 text-slate-100 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-full border border-slate-700 backdrop-blur-md transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Header with Skill Image */}
        <div className="relative h-60 w-full overflow-hidden bg-slate-950">
          <img
            src={skill.image}
            alt={skill.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />

          {/* Hero Content */}
          <div className="absolute bottom-4 left-6 right-6 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-indigo-600/90 text-white text-xs font-bold rounded-lg backdrop-blur-md">
                {skill.category}
              </span>
              <span className="px-3 py-1 bg-slate-800/90 text-slate-200 text-xs font-medium rounded-lg border border-slate-700">
                {skill.level}
              </span>
              <span className="px-3 py-1 bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 text-xs font-semibold rounded-lg flex items-center gap-1">
                {skill.delivery === 'Online' ? <Video className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                {skill.delivery}
              </span>
            </div>

            <h2 className="text-2xl font-extrabold text-white leading-tight">
              {skill.title}
            </h2>
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          
          {/* Mentor Profile Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-slate-800/60 border border-slate-700/60 rounded-2xl">
            <div className="flex items-center gap-3.5">
              <img
                src={skill.userAvatar}
                alt={skill.userName}
                className="w-14 h-14 rounded-full object-cover border-2 border-indigo-500/50 shadow-md"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-100">{skill.userName}</h3>
                  {skill.verified && (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-[10px] font-semibold rounded-full border border-indigo-500/30">
                      <CheckCircle2 className="w-3 h-3 text-indigo-400" />
                      Verified Mentor
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {skill.userLocation}
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs">
                  <div className="flex items-center gap-1 text-amber-400 font-bold">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>{skill.userRating.toFixed(1)}</span>
                  </div>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-300 font-medium">{skill.hoursOffered} hrs taught</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {onOpenPreview && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenPreview(skill);
                  }}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/60 font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
                >
                  <Eye className="w-4 h-4 text-indigo-400" />
                  <span>⚡ Quick Preview</span>
                </button>
              )}

              <button
                onClick={() => {
                  onClose();
                  onProposeSwap(skill);
                }}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>Propose Skill Swap</span>
              </button>
            </div>
          </div>

          {/* Quick Stats Grid: Progress, Difficulty, Next Slot */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <BarChart3 className="w-3.5 h-3.5 text-indigo-400" /> Skill Difficulty
              </span>
              <p className="text-xs font-bold text-slate-200">{skill.level}</p>
            </div>

            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-amber-400" /> Student Progress
              </span>
              <div className="flex items-center gap-2">
                <div className="h-1.5 flex-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full" style={{ width: `${progressVal}%` }} />
                </div>
                <span className="text-xs font-bold text-amber-400">{progressVal}%</span>
              </div>
            </div>

            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Next Available Slot
              </span>
              <p className="text-xs font-bold text-emerald-400 truncate">{skill.nextAvailableSlot || skill.availability[0] || 'Flexible'}</p>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider text-xs">
              Skill Overview
            </h4>
            <p className="text-sm text-slate-300 leading-relaxed bg-slate-800/40 p-4 rounded-xl border border-slate-800">
              {skill.description}
            </p>
          </div>

          {/* Skill Demo Video Player (if present) */}
          {skill.previewVideoUrl && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Video className="w-4 h-4 text-indigo-400" />
                <span>Skill Demo Video Preview</span>
              </h4>
              <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-lg">
                <video
                  src={skill.previewVideoUrl}
                  controls
                  playsInline
                  className="w-full h-56 sm:h-64 object-cover"
                />
              </div>
            </div>
          )}

          {/* What Mentor Wants in Return */}
          <div className="p-4 bg-indigo-950/40 border border-indigo-800/50 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
              <ArrowRightLeft className="w-4 h-4" />
              <span>Skills {skill.userName} Wants to Learn in Return:</span>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {skill.skillsDesiredInReturn.map((desired, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-indigo-900/60 text-indigo-200 border border-indigo-700/50 rounded-lg text-xs font-semibold"
                >
                  {desired}
                </span>
              ))}
            </div>
            <p className="text-xs text-indigo-300/80 italic pt-1">
              *If you don't teach these exact skills, you can also propose a swap using <strong>Time Credits</strong>!
            </p>
          </div>

          {/* Learning Objectives */}
          {skill.learningObjectives && skill.learningObjectives.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-4 h-4 text-emerald-400" />
                <span>What You Will Learn / Achieve:</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {skill.learningObjectives.map((obj, idx) => (
                  <div key={idx} className="flex items-start gap-2 bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 text-xs text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{obj}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mentor Availability */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <span>General Availability:</span>
            </h4>
            <div className="flex flex-wrap gap-2">
              {skill.availability.map((time, idx) => (
                <span key={idx} className="px-3 py-1 bg-slate-800 text-slate-300 text-xs font-medium rounded-lg border border-slate-700">
                  {time}
                </span>
              ))}
            </div>
          </div>

          {/* Student Reviews */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <h4 className="text-sm font-bold text-slate-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-amber-400" />
                <span>Student Reviews ({filteredReviews.length})</span>
              </span>
            </h4>

            {filteredReviews.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No reviews written yet for this specific skill listing.</p>
            ) : (
              <div className="space-y-3">
                {filteredReviews.map((rev) => (
                  <div key={rev.id} className="bg-slate-800/50 p-3.5 rounded-xl border border-slate-700/50 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img src={rev.authorAvatar} alt={rev.authorName} className="w-6 h-6 rounded-full object-cover" />
                        <span className="text-xs font-bold text-slate-200">{rev.authorName}</span>
                      </div>
                      <div className="flex items-center gap-1 text-amber-400 text-xs font-semibold">
                        <Star className="w-3 h-3 fill-current" />
                        <span>{rev.rating}.0</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 italic">"{rev.comment}"</p>
                    <p className="text-[10px] text-slate-500">{rev.date}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Close
          </button>

          <button
            onClick={() => {
              onClose();
              onProposeSwap(skill);
            }}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Propose Swap Now</span>
          </button>
        </div>

      </div>
    </div>
  );
};
