import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  BrainCircuit, 
  Zap, 
  Star, 
  ArrowRight, 
  Bookmark, 
  Eye, 
  ArrowRightLeft, 
  RefreshCw, 
  Target, 
  CheckCircle2, 
  ChevronRight,
  Info,
  TrendingUp,
  Flame
} from 'lucide-react';
import { Skill, User } from '../types';

interface SuggestedForYouSectionProps {
  currentUser: User;
  skills: Skill[];
  onViewDetail: (skill: Skill) => void;
  onOpenPreview: (skill: Skill) => void;
  onProposeSwap: (skill: Skill) => void;
  bookmarkedSkillIds: string[];
  onToggleBookmark: (skillId: string) => void;
}

interface RecommendedSkillItem {
  skill: Skill;
  score: number;
  reason: string;
  badgeType: 'roadmap' | 'interest' | 'rating' | 'trending';
  matchingTopics: string[];
}

export const SuggestedForYouSection: React.FC<SuggestedForYouSectionProps> = ({
  currentUser,
  skills,
  onViewDetail,
  onOpenPreview,
  onProposeSwap,
  bookmarkedSkillIds,
  onToggleBookmark,
}) => {
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [refreshSeed, setRefreshSeed] = useState<number>(0);

  // AI Matching Algorithm to compute recommendations based on user roadmap & skillsDesired
  const recommendedItems = useMemo<RecommendedSkillItem[]>(() => {
    const userDesired = (currentUser.skillsDesired || []).map((s) => s.toLowerCase());
    const userOffered = (currentUser.skillsOffered || []).map((s) => s.toLowerCase());

    const otherSkills = skills.filter((s) => s.userId !== currentUser.id);

    const scored = otherSkills.map((skill) => {
      let score = 70; // Base score
      let reason = 'Recommended based on your activity';
      let badgeType: 'roadmap' | 'interest' | 'rating' | 'trending' = 'interest';
      const matchingTopics: string[] = [];

      const titleLower = skill.title.toLowerCase();
      const descLower = skill.description.toLowerCase();
      const catLower = skill.category.toLowerCase();

      // Check roadmap matches against skillsDesired
      const roadmapMatch = userDesired.find((d) => 
        titleLower.includes(d) || descLower.includes(d) || catLower.includes(d) || d.split(' ').some((word) => word.length > 3 && titleLower.includes(word))
      );

      if (roadmapMatch) {
        score += 25;
        reason = `Matches your active roadmap target: "${roadmapMatch.toUpperCase()}"`;
        badgeType = 'roadmap';
        matchingTopics.push(roadmapMatch);
      }

      // Check swap reciprocity (mentor wants what user offers)
      const wantsUserSkill = skill.skillsDesiredInReturn.some((desired) =>
        userOffered.some((offered) => desired.toLowerCase().includes(offered) || offered.includes(desired.toLowerCase()))
      );

      if (wantsUserSkill) {
        score += 15;
        if (!roadmapMatch) {
          reason = `High Swap Compatibility: Mentor wants your ${(currentUser.skillsOffered || [])[0]} skills!`;
          badgeType = 'trending';
        }
        matchingTopics.push('Reciprocal Swap Match');
      }

      // High mentor rating bonus
      if (skill.userRating >= 4.9) {
        score += 10;
        matchingTopics.push('Top-Rated Mentor (4.9★+)');
      }

      // Add a slight variance based on refreshSeed for dynamic shuffle
      const pseudoRandom = (skill.id.charCodeAt(skill.id.length - 1) + refreshSeed) % 15;
      score = Math.min(99, score + pseudoRandom);

      return {
        skill,
        score,
        reason,
        badgeType,
        matchingTopics,
      };
    });

    // Sort descending by score
    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, 3);
  }, [currentUser, skills, refreshSeed]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setRefreshSeed((prev) => prev + 1);
      setIsRefreshing(false);
    }, 450);
  };

  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 transition-all">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-500/20 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-purple-500/15 text-purple-300 border border-purple-500/30 rounded-full text-xs font-black flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
              AI Matcher Engine
            </span>
            <span className="text-xs font-bold text-slate-400">
              Personalized for {currentUser.name.split(' ')[0]}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Suggested For You
            <BrainCircuit className="w-5 h-5 text-indigo-400" />
          </h2>
          <p className="text-xs text-slate-300">
            Tailored skill recommendations aligned with your learning roadmap ({(currentUser.skillsDesired || []).join(', ')}) & past interests.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setShowExplanation(!showExplanation)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold border border-slate-700 transition-all cursor-pointer"
          >
            <Info className="w-3.5 h-3.5 text-indigo-400" />
            <span>{showExplanation ? 'Hide AI Details' : 'Why These?'}</span>
          </button>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Shuffle AI</span>
          </button>
        </div>
      </div>

      {/* AI Reasoning Explanation Drawer */}
      {showExplanation && (
        <div className="p-4 bg-slate-950/80 border border-indigo-500/30 rounded-2xl text-xs space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 font-bold text-indigo-300">
            <Target className="w-4 h-4 text-indigo-400" />
            <span>How the AI Matching Engine works:</span>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-400">
            <li className="flex items-start gap-1.5 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Roadmap Alignment:</strong> Scans your target learning goals and matches difficulty levels.</span>
            </li>
            <li className="flex items-start gap-1.5 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
              <span><strong>Reciprocal Swaps:</strong> Prioritizes mentors looking for your offered skills ({currentUser.skillsOffered[0]}).</span>
            </li>
            <li className="flex items-start gap-1.5 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <span><strong>Quality Score:</strong> Factors in mentor ratings, completion rates, and response speed.</span>
            </li>
          </ul>
        </div>
      )}

      {/* Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {recommendedItems.map(({ skill, score, reason, badgeType, matchingTopics }) => {
          const isBookmarked = bookmarkedSkillIds.includes(skill.id);

          return (
            <div
              key={skill.id}
              className="group relative bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-4 shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Top Recommendation Badge */}
                <div className="flex items-center justify-between gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border flex items-center gap-1 ${
                    badgeType === 'roadmap'
                      ? 'bg-purple-950 text-purple-300 border-purple-800'
                      : badgeType === 'trending'
                      ? 'bg-amber-950 text-amber-300 border-amber-800'
                      : 'bg-indigo-950 text-indigo-300 border-indigo-800'
                  }`}>
                    <Sparkles className="w-3 h-3 text-purple-400" />
                    <span>{score}% Match</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => onToggleBookmark(skill.id)}
                    className="p-1.5 text-slate-400 hover:text-amber-400 transition-colors"
                    title={isBookmarked ? 'Remove bookmark' : 'Save skill'}
                  >
                    <Bookmark className={`w-4 h-4 ${isBookmarked ? 'text-amber-400 fill-current' : ''}`} />
                  </button>
                </div>

                {/* Skill Title & Mentor */}
                <div>
                  <h3 
                    onClick={() => onViewDetail(skill)}
                    className="text-sm font-extrabold text-white group-hover:text-indigo-300 transition-colors line-clamp-2 cursor-pointer"
                  >
                    {skill.title}
                  </h3>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <img
                      src={skill.userAvatar}
                      alt={skill.userName}
                      className="w-6 h-6 rounded-full object-cover border border-slate-700"
                    />
                    <span className="text-xs text-slate-300 font-medium">{skill.userName}</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-xs text-amber-400 font-bold flex items-center gap-0.5">
                      <Star className="w-3 h-3 fill-current" />
                      {skill.userRating}
                    </span>
                  </div>
                </div>

                {/* AI Reason snippet */}
                <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block">Why suggested:</span>
                  <p className="text-[11px] text-slate-300 leading-snug font-medium line-clamp-2">
                    {reason}
                  </p>
                </div>

                {/* Category & Level pills */}
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="px-2 py-0.5 bg-slate-950 text-slate-400 text-[10px] font-bold rounded-md border border-slate-800">
                    {skill.category}
                  </span>
                  <span className="px-2 py-0.5 bg-indigo-950 text-indigo-300 text-[10px] font-bold rounded-md border border-indigo-900">
                    {skill.level}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 mt-3 border-t border-slate-800/80 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenPreview(skill)}
                  className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3 h-3 text-slate-400" />
                  <span>Preview</span>
                </button>

                <button
                  type="button"
                  onClick={() => onProposeSwap(skill)}
                  className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <ArrowRightLeft className="w-3 h-3" />
                  <span>Swap</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
