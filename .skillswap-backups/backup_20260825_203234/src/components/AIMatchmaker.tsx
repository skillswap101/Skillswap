import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowRightLeft, 
  CheckCircle2, 
  Star, 
  Loader2, 
  Zap, 
  Compass, 
  Lightbulb, 
  TrendingUp,
  UserCheck
} from 'lucide-react';
import { Skill, User } from '../types';

interface AIMatchmakerProps {
  currentUser: User;
  skills: Skill[];
  onProposeSwap: (skill: Skill) => void;
  onViewDetail: (skill: Skill) => void;
}

interface MatchSynergyResult {
  skillId: string;
  matchScore: number;
  synergyReason: string;
  recommendedTopics: string[];
}

export const AIMatchmaker: React.FC<AIMatchmakerProps> = ({
  currentUser,
  skills,
  onProposeSwap,
  onViewDetail,
}) => {
  const [analyzingSkillId, setAnalyzingSkillId] = useState<string | null>(null);
  const [synergyResults, setSynergyResults] = useState<Record<string, MatchSynergyResult>>({});

  // Calculate reciprocal match logic
  const reciprocalSkills = skills.map((skill) => {
    // Check if mentor teaches what current user wants
    const teachesWhatIWant = currentUser.skillsDesired.some(
      (desired) =>
        skill.title.toLowerCase().includes(desired.toLowerCase()) ||
        skill.category.toLowerCase().includes(desired.toLowerCase()) ||
        skill.tags.some((t) => t.toLowerCase().includes(desired.toLowerCase()))
    );

    // Check if mentor wants what current user teaches
    const wantsWhatITeach = skill.skillsDesiredInReturn.some((desired) =>
      currentUser.skillsOffered.some(
        (offered) =>
          offered.toLowerCase().includes(desired.toLowerCase()) ||
          desired.toLowerCase().includes(offered.toLowerCase())
      )
    );

    let baseScore = 70;
    if (teachesWhatIWant && wantsWhatITeach) baseScore = 98;
    else if (teachesWhatIWant) baseScore = 88;
    else if (wantsWhatITeach) baseScore = 80;

    return {
      skill,
      teachesWhatIWant,
      wantsWhatITeach,
      isPerfectMatch: teachesWhatIWant && wantsWhatITeach,
      baseScore,
    };
  }).sort((a, b) => b.baseScore - a.baseScore);

  const handleAnalyzeSynergy = async (skill: Skill) => {
    setAnalyzingSkillId(skill.id);
    try {
      const res = await fetch('/api/ai/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userOffered: currentUser.skillsOffered,
          userDesired: currentUser.skillsDesired,
          candidateOffered: [skill.title, ...skill.tags],
          candidateDesired: skill.skillsDesiredInReturn,
        }),
      });

      if (!res.ok) throw new Error('Failed to analyze match');
      const data = await res.json();

      setSynergyResults((prev) => ({
        ...prev,
        [skill.id]: {
          skillId: skill.id,
          matchScore: data.matchScore || 90,
          synergyReason: data.synergyReason || 'Great mutual alignment!',
          recommendedTopics: data.recommendedTopics || ['Intro', 'Practice', 'Review'],
        },
      }));
    } catch (err) {
      console.error(err);
      setSynergyResults((prev) => ({
        ...prev,
        [skill.id]: {
          skillId: skill.id,
          matchScore: 92,
          synergyReason: `Direct reciprocal match between ${skill.title} and your skills!`,
          recommendedTopics: ['Foundational concepts', 'Hands-on practice', 'Portfolio review'],
        },
      }));
    } finally {
      setAnalyzingSkillId(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-slate-900 to-purple-950 p-6 sm:p-8 border border-indigo-700/50 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Powered Skill Twin Engine</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Find Your Reciprocal Skill Exchange Twins
          </h1>

          <p className="text-sm text-indigo-200/90 leading-relaxed">
            SkillSwap analyzes your offered skills ({currentUser.skillsOffered.join(', ')}) and learning goals ({currentUser.skillsDesired.join(', ')}) against community mentors to discover instant mutual fits.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-300">
            <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
              <CheckCircle2 className="w-4 h-4" /> 100% Free Peer Swapping
            </div>
            <div className="flex items-center gap-1.5 font-semibold text-indigo-300">
              <Zap className="w-4 h-4" /> Instant Synergy Scoring
            </div>
          </div>
        </div>
      </div>

      {/* Reciprocal Matches Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            <span>Top Recommended Matches for You</span>
          </h2>
          <span className="text-xs text-slate-400">
            {reciprocalSkills.length} Community Mentors Ranked
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reciprocalSkills.map(({ skill, teachesWhatIWant, wantsWhatITeach, isPerfectMatch, baseScore }) => {
            const synergy = synergyResults[skill.id];
            const displayScore = synergy ? synergy.matchScore : baseScore;

            return (
              <div
                key={skill.id}
                className={`relative bg-slate-800/90 border rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all duration-300 ${
                  isPerfectMatch
                    ? 'border-indigo-500/80 ring-1 ring-indigo-500/30 shadow-indigo-500/10'
                    : 'border-slate-700/80 hover:border-slate-600'
                }`}
              >
                {/* Top Badge */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {isPerfectMatch ? (
                      <span className="px-3 py-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs rounded-full shadow-md shadow-emerald-500/20 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 fill-current" />
                        100% Mutual Fit
                      </span>
                    ) : teachesWhatIWant ? (
                      <span className="px-3 py-1 bg-indigo-950/80 text-indigo-300 border border-indigo-700/60 font-semibold text-xs rounded-full">
                        Teaches Goal Skill
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-slate-700 text-slate-300 font-medium text-xs rounded-full">
                        Potential Synergy
                      </span>
                    )}
                  </div>

                  {/* Match Score Gauge */}
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-900/90 rounded-xl border border-slate-700">
                    <span className="text-xs text-slate-400 font-medium">Match Score:</span>
                    <span className="text-sm font-extrabold text-indigo-400">{displayScore}%</span>
                  </div>
                </div>

                {/* Mentor Info */}
                <div className="flex items-start gap-4 mb-4">
                  <img
                    src={skill.userAvatar}
                    alt={skill.userName}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-indigo-500/40 shadow-md shrink-0"
                  />
                  <div>
                    <h3 className="text-base font-bold text-white hover:text-indigo-400 transition-colors cursor-pointer" onClick={() => onViewDetail(skill)}>
                      {skill.title}
                    </h3>
                    <p className="text-xs text-slate-300 font-medium mt-0.5">
                      by {skill.userName} • <span className="text-slate-400">{skill.userLocation}</span>
                    </p>
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-amber-400">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span className="font-bold text-slate-200">{skill.userRating.toFixed(1)}</span>
                      <span className="text-slate-400">({skill.userReviewCount} reviews)</span>
                    </div>
                  </div>
                </div>

                {/* Exchange Breakdown Box */}
                <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-700/60 space-y-2 mb-4 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="font-semibold text-indigo-300">You Receive:</span>
                    <span className="text-slate-200 font-bold">{skill.title}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300 border-t border-slate-800 pt-1.5">
                    <span className="font-semibold text-purple-300">They Want:</span>
                    <span className="text-slate-200 font-bold">
                      {skill.skillsDesiredInReturn.join(', ')}
                    </span>
                  </div>
                </div>

                {/* AI Synergy Insights if generated */}
                {synergy ? (
                  <div className="mb-4 p-3 bg-purple-950/40 border border-purple-800/50 rounded-xl space-y-2 animate-in fade-in">
                    <p className="text-xs font-bold text-purple-300 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> AI Synergy Breakdown:
                    </p>
                    <p className="text-xs text-slate-300 leading-relaxed italic">
                      "{synergy.synergyReason}"
                    </p>
                    <div className="pt-1">
                      <p className="text-[11px] font-semibold text-purple-200 mb-1">Recommended Session Agenda:</p>
                      <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-300">
                        {synergy.recommendedTopics.map((topic, idx) => (
                          <li key={idx}>{topic}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="mb-4">
                    <button
                      onClick={() => handleAnalyzeSynergy(skill)}
                      disabled={analyzingSkillId === skill.id}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-950 text-indigo-300 hover:text-indigo-200 border border-indigo-800/60 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                    >
                      {analyzingSkillId === skill.id ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Calculating Synergy...</span>
                        </>
                      ) : (
                        <>
                          <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                          <span>Analyze AI Match Synergy & Session Agenda</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-700/60">
                  <button
                    onClick={() => onViewDetail(skill)}
                    className="px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-colors"
                  >
                    Details
                  </button>

                  <button
                    onClick={() => onProposeSwap(skill)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 transition-all active:scale-95"
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                    <span>Propose Swap</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
