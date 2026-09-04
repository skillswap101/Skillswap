import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Star, CheckCircle2, Video, MapPin, ArrowRightLeft, Clock, Sparkles, ShieldCheck, Award, Bookmark, Tag, Eye, BarChart3, Calendar, Heart } from 'lucide-react';
import { Skill } from '../types';

interface SkillCardProps {
  skill: Skill;
  onViewDetail: (skill: Skill) => void;
  onProposeSwap: (skill: Skill) => void;
  onOpenPreview?: (skill: Skill) => void;
  isReciprocalMatch?: boolean;
  isBookmarked?: boolean;
  onToggleBookmark?: (skillId: string) => void;
  onSelectTag?: (tag: string) => void;
  onLikeSkill?: (skillId: string) => void;
}

export const SkillCard: React.FC<SkillCardProps> = ({
  skill,
  onViewDetail,
  onProposeSwap,
  onOpenPreview,
  isReciprocalMatch = false,
  isBookmarked = false,
  onToggleBookmark,
  onSelectTag,
  onLikeSkill,
}) => {
  const [likes, setLikes] = useState(skill.likesCount || 12);
  const [liked, setLiked] = useState(skill.isLiked || false);

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (liked) {
      setLikes(likes - 1);
      setLiked(false);
    } else {
      setLikes(likes + 1);
      setLiked(true);
    }
    if (onLikeSkill) onLikeSkill(skill.id);
  };
  const sessionsCount = skill.completedSessionsCount ?? skill.userReviewCount;
  const isVerifiedMentor = sessionsCount > 5;
  const progressVal = skill.progressPercent || 80;

  // Level color mapping for difficulty
  const getDifficultyBadge = (level: string) => {
    switch (level) {
      case 'Beginner':
        return 'text-emerald-300 bg-emerald-950/90 border-emerald-600/50';
      case 'Intermediate':
        return 'text-amber-300 bg-amber-950/90 border-amber-600/50';
      case 'Advanced':
        return 'text-rose-300 bg-rose-950/90 border-rose-600/50';
      default:
        return 'text-blue-300 bg-blue-950/90 border-blue-600/50';
    }
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.95 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="group relative bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 hover:border-indigo-500/50 rounded-2xl overflow-hidden shadow-md hover:shadow-xl hover:shadow-indigo-500/10 transition-colors flex flex-col h-full"
    >
      
      {/* Cover Image Header */}
      <div className="relative h-44 w-full overflow-hidden bg-slate-900">
        <img
          src={skill.image}
          alt={skill.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

        {/* Top Badges & Bookmark */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2 z-10">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="px-2.5 py-1 bg-slate-900/80 backdrop-blur-md text-xs font-semibold text-slate-200 rounded-lg border border-slate-700/60 shadow-sm">
              {skill.category}
            </span>
            <span className={`px-2 py-0.5 text-[11px] font-bold rounded-lg backdrop-blur-md border flex items-center gap-1 shadow-sm ${getDifficultyBadge(skill.level)}`}>
              <BarChart3 className="w-3 h-3" />
              <span>{skill.level}</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {isVerifiedMentor && (
              <span 
                className="px-2.5 py-1 bg-emerald-950/90 text-emerald-300 border border-emerald-500/60 rounded-lg shadow-sm text-xs font-bold flex items-center gap-1 backdrop-blur-md"
                title={`Verified Mentor (${sessionsCount} successful sessions completed)`}
              >
                <Award className="w-3.5 h-3.5 text-emerald-400" />
                Verified Mentor
              </span>
            )}

            {isReciprocalMatch && (
              <span className="px-2.5 py-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold rounded-lg shadow-md shadow-indigo-500/30 flex items-center gap-1 animate-pulse">
                <Sparkles className="w-3 h-3" />
                Mutual Match
              </span>
            )}

            <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg shadow-sm backdrop-blur-md border ${
              skill.swapType === 'Time Credits'
                ? 'bg-amber-950/80 text-amber-300 border-amber-600/40'
                : skill.swapType === 'Direct Swap'
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/40'
                : 'bg-indigo-950/80 text-indigo-300 border-indigo-600/40'
            }`}>
              {skill.swapType}
            </span>

            {skill.previewVideoUrl && onOpenPreview && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenPreview(skill);
                }}
                className="px-2 py-1 rounded-lg bg-indigo-600/90 hover:bg-indigo-500 text-white text-[11px] font-bold border border-indigo-400/60 backdrop-blur-md shadow-md flex items-center gap-1 transition-all animate-pulse"
                title="Watch Skill Video Demo"
              >
                <Video className="w-3.5 h-3.5 text-cyan-300" />
                <span>Video Demo</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleLikeClick}
              className={`px-2 py-1.5 rounded-lg backdrop-blur-md border transition-all shadow-md flex items-center gap-1 text-[11px] font-bold ${
                liked
                  ? 'bg-rose-500 text-white border-rose-400 scale-105'
                  : 'bg-slate-900/80 hover:bg-slate-900 text-slate-300 hover:text-rose-400 border-slate-700/70'
              }`}
              title={liked ? 'Unlike post' : 'Like post'}
            >
              <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-current' : ''}`} />
              <span>{likes}</span>
            </button>

            {onToggleBookmark && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleBookmark(skill.id);
                }}
                className={`p-1.5 rounded-lg backdrop-blur-md border transition-all shadow-md ${
                  isBookmarked
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold scale-105'
                    : 'bg-slate-900/80 hover:bg-slate-900 text-slate-300 hover:text-amber-400 border-slate-700/70'
                }`}
                title={isBookmarked ? 'Remove Bookmark' : 'Bookmark this Skill'}
              >
                <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
              </button>
            )}
          </div>
        </div>

        {/* Mentor Avatar Overlay */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5 bg-slate-900/90 backdrop-blur-md p-1.5 pr-3 rounded-full border border-slate-700/80 shadow-md">
            <div className="relative">
              <img
                src={skill.userAvatar}
                alt={skill.userName}
                className="w-8 h-8 rounded-full object-cover border border-indigo-400/50"
              />
              <span 
                className="w-2.5 h-2.5 rounded-full bg-emerald-400 border border-slate-900 absolute -top-0.5 -right-0.5 shadow-sm"
                title="Mentor currently online"
              />
              {skill.verified && (
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 bg-slate-900 rounded-full absolute -bottom-0.5 -right-0.5 fill-current" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-1">
                <p className="text-xs font-medium text-slate-200 line-clamp-1">{skill.userName}</p>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" title="Online" />
                {isVerifiedMentor && (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" title="5+ Sessions Completed" />
                )}
              </div>
              <div className="flex items-center gap-1 text-[11px] text-amber-400">
                <Star className="w-3 h-3 fill-current text-amber-400" />
                <span className="font-semibold text-slate-200">{skill.userRating.toFixed(1)}</span>
                <span className="text-slate-400">({skill.userReviewCount})</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 text-slate-300 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] border border-slate-700/60">
            {skill.delivery === 'Online' ? (
              <Video className="w-3 h-3 text-indigo-400" />
            ) : (
              <MapPin className="w-3 h-3 text-emerald-400" />
            )}
            <span>{skill.delivery}</span>
          </div>
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <h3 
            onClick={() => onViewDetail(skill)}
            className="text-base font-bold text-slate-100 hover:text-indigo-400 transition-colors line-clamp-1 cursor-pointer"
          >
            {skill.title}
          </h3>

          <p className="mt-1.5 text-xs text-slate-300 line-clamp-2 leading-relaxed">
            {skill.description}
          </p>

          {/* Availability & Progress Summary */}
          <div className="pt-2 space-y-2">
            {/* Availability Badge */}
            <div className="flex items-center justify-between text-[11px] bg-slate-950/60 p-2 rounded-lg border border-slate-800">
              <span className="flex items-center gap-1 text-emerald-400 font-semibold truncate">
                <Calendar className="w-3 h-3 shrink-0" />
                <span className="truncate">{skill.nextAvailableSlot || skill.availability[0] || 'Flexible Slots'}</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono shrink-0 pl-1">
                {skill.hoursOffered}h offered
              </span>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[10px] font-semibold text-slate-400">
                <span>Student Mastery Progress</span>
                <span className="text-amber-400 font-bold">{progressVal}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full"
                  style={{ width: `${progressVal}%` }}
                />
              </div>
            </div>
          </div>

          {/* Skill Tags */}
          {skill.tags && skill.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1.5">
              {skill.tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectTag?.(tag);
                  }}
                  className="px-2 py-0.5 bg-slate-800/90 hover:bg-indigo-950 hover:text-indigo-200 text-slate-300 border border-slate-700/60 hover:border-indigo-500/50 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1 group/tag cursor-pointer"
                  title={`Filter marketplace by #${tag}`}
                >
                  <Tag className="w-2.5 h-2.5 text-slate-400 group-hover/tag:text-indigo-400" />
                  <span>#{tag}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Desired Skills in Return */}
        <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/50 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1 font-semibold text-indigo-300">
              <ArrowRightLeft className="w-3 h-3" />
              Mentor Wants in Return:
            </span>
            <span className="text-slate-500 text-[10px]">{skill.level}</span>
          </div>

          <div className="flex flex-wrap gap-1">
            {skill.skillsDesiredInReturn.map((desired, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectTag?.(desired);
                }}
                className="px-2 py-0.5 bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-200 hover:text-indigo-100 border border-indigo-800/40 hover:border-indigo-500/60 rounded-md text-[11px] font-medium transition-colors text-left cursor-pointer"
                title={`Filter marketplace by ${desired}`}
              >
                {desired}
              </button>
            ))}
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-1 flex items-center justify-between gap-1.5 border-t border-slate-700/60">
          {onOpenPreview && (
            <button
              type="button"
              onClick={() => onOpenPreview(skill)}
              className="flex items-center gap-1 text-xs font-bold text-indigo-300 hover:text-white bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-700/50 px-2.5 py-2 rounded-xl transition-all shadow-sm"
              title="Interactive Skill Preview"
            >
              <Eye className="w-3.5 h-3.5 text-indigo-400" />
              <span>Preview</span>
            </button>
          )}

          <button
            onClick={() => onViewDetail(skill)}
            className="text-xs font-semibold text-slate-300 hover:text-white px-2.5 py-2 rounded-xl hover:bg-slate-700/50 transition-colors"
          >
            Details
          </button>

          <button
            onClick={() => onProposeSwap(skill)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all active:scale-95"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Swap</span>
          </button>
        </div>

      </div>
    </motion.div>
  );
};
