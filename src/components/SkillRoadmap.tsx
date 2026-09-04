import React, { useState } from 'react';
import { 
  Map, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Sparkles, 
  ArrowRight, 
  BookOpen, 
  Award, 
  ChevronRight, 
  UserCheck, 
  ArrowRightLeft,
  GraduationCap,
  Target
} from 'lucide-react';
import { Skill, SkillCategory } from '../types';

interface RoadmapStep {
  id: string;
  title: string;
  description: string;
  duration: string;
  recommendedLevel: string;
  completed?: boolean;
  recommendedSkills: string[];
}

interface RoadmapTrack {
  id: string;
  title: string;
  category: SkillCategory;
  icon: string;
  description: string;
  estimatedTotalHours: number;
  steps: RoadmapStep[];
}

const ROADMAP_TRACKS: RoadmapTrack[] = [
  {
    id: 'track-spanish',
    title: 'Spanish Conversational Fluency',
    category: 'Languages',
    icon: '🇲🇽',
    description: 'Master conversational Spanish from fundamental greetings to confident workplace dialogues.',
    estimatedTotalHours: 24,
    steps: [
      {
        id: 'sp-1',
        title: 'Phase 1: Pronunciation & Survival Phrases',
        description: 'Vowel sounds, basic greetings, ordering food, and polite everyday expressions.',
        duration: '4 Hours',
        recommendedLevel: 'Beginner',
        completed: true,
        recommendedSkills: ['Conversational Spanish for Beginners', 'Spanish Vocabulary Sprints'],
      },
      {
        id: 'sp-2',
        title: 'Phase 2: Present Tense & Daily Routines',
        description: 'Conjugating regular & irregular verbs, describing family, hobbies, and work.',
        duration: '6 Hours',
        recommendedLevel: 'Beginner',
        completed: true,
        recommendedSkills: ['Spanish Dialogue Practice'],
      },
      {
        id: 'sp-3',
        title: 'Phase 3: Past Tenses (Preterite vs Imperfect)',
        description: 'Storytelling in the past, sharing experiences, travel conversations.',
        duration: '8 Hours',
        recommendedLevel: 'Intermediate',
        completed: false,
        recommendedSkills: ['Advanced Conversational Spanish'],
      },
      {
        id: 'sp-4',
        title: 'Phase 4: Subjunctive Mood & Idiomatic Fluency',
        description: 'Expressing doubts, hopes, emotions, and native slang in real-time debates.',
        duration: '6 Hours',
        recommendedLevel: 'Advanced',
        completed: false,
        recommendedSkills: ['Spanish Immersion & Accent Reduction'],
      },
    ],
  },
  {
    id: 'track-webdev',
    title: 'Full-Stack Web Development',
    category: 'Tech & Dev',
    icon: '💻',
    description: 'Go from zero to building full-stack web apps with modern React, TypeScript, and Node.js.',
    estimatedTotalHours: 40,
    steps: [
      {
        id: 'dev-1',
        title: 'Phase 1: HTML, CSS & Modern Tailwind Styling',
        description: 'Semantic tags, responsive layouts, flexbox, grid, and Tailwind CSS utility classes.',
        duration: '8 Hours',
        recommendedLevel: 'Beginner',
        completed: true,
        recommendedSkills: ['Frontend Web Development with React'],
      },
      {
        id: 'dev-2',
        title: 'Phase 2: JavaScript ES6+ & React Fundamentals',
        description: 'Components, state, props, hooks (useState, useEffect), and async API calls.',
        duration: '12 Hours',
        recommendedLevel: 'Intermediate',
        completed: true,
        recommendedSkills: ['Frontend Web Development with React', 'TypeScript & React Mastery'],
      },
      {
        id: 'dev-3',
        title: 'Phase 3: Server APIs & Database Persistence',
        description: 'Express.js backend endpoints, JSON Web Tokens, and database queries.',
        duration: '10 Hours',
        recommendedLevel: 'Intermediate',
        completed: false,
        recommendedSkills: ['Full-Stack Node.js & Database Architecture'],
      },
      {
        id: 'dev-4',
        title: 'Phase 4: Deployment & Security Best Practices',
        description: 'Container deployment, CI/CD, environmental keys security, and production scaling.',
        duration: '10 Hours',
        recommendedLevel: 'Advanced',
        completed: false,
        recommendedSkills: ['Full-Stack Node.js & Database Architecture'],
      },
    ],
  },
  {
    id: 'track-photography',
    title: 'Portrait & Outdoor Photography',
    category: 'Design & Creative',
    icon: '📸',
    description: 'Master manual camera control, natural lighting composition, and Lightroom RAW editing.',
    estimatedTotalHours: 18,
    steps: [
      {
        id: 'photo-1',
        title: 'Phase 1: Exposure Triangle Essentials',
        description: 'Aperture depth of field, shutter speed motion blur, and clean ISO settings.',
        duration: '4 Hours',
        recommendedLevel: 'Beginner',
        completed: true,
        recommendedSkills: ['Portrait & Outdoor Photography Essentials'],
      },
      {
        id: 'photo-2',
        title: 'Phase 2: Composition & Natural Light Mastery',
        description: 'Rule of thirds, leading lines, golden hour portraits, and framing.',
        duration: '5 Hours',
        recommendedLevel: 'Intermediate',
        completed: false,
        recommendedSkills: ['Portrait & Outdoor Photography Essentials'],
      },
      {
        id: 'photo-3',
        title: 'Phase 3: RAW Processing in Adobe Lightroom',
        description: 'Color grading, tone curves, selective masking, and portrait retouching.',
        duration: '5 Hours',
        recommendedLevel: 'Intermediate',
        completed: false,
        recommendedSkills: ['Digital Photography & Photo Editing'],
      },
      {
        id: 'photo-4',
        title: 'Phase 4: Client Portfolio & Shoot Direction',
        description: 'Posing models, directing outdoor sessions, and exporting print-ready photos.',
        duration: '4 Hours',
        recommendedLevel: 'Advanced',
        completed: false,
        recommendedSkills: ['Digital Photography & Photo Editing'],
      },
    ],
  },
  {
    id: 'track-guitar',
    title: 'Acoustic & Electric Guitar',
    category: 'Music & Audio',
    icon: '🎸',
    description: 'Learn open chords, strumming rhythms, fingerpicking techniques, and favorite songs.',
    estimatedTotalHours: 20,
    steps: [
      {
        id: 'gtr-1',
        title: 'Phase 1: Open Chords & Finger Posture',
        description: 'Mastering C, G, D, Em chords and clean chord transitions.',
        duration: '4 Hours',
        recommendedLevel: 'Beginner',
        completed: true,
        recommendedSkills: ['Acoustic Guitar for Beginners'],
      },
      {
        id: 'gtr-2',
        title: 'Phase 2: Rhythm & Strumming Patterns',
        description: 'Metronome practice, 4/4 strumming dynamics, and syncopation.',
        duration: '5 Hours',
        recommendedLevel: 'Beginner',
        completed: false,
        recommendedSkills: ['Acoustic Guitar for Beginners'],
      },
      {
        id: 'gtr-3',
        title: 'Phase 3: Barre Chords & Fingerstyle',
        description: 'F major barre chord power, thumb-finger independence, and acoustic arpeggios.',
        duration: '6 Hours',
        recommendedLevel: 'Intermediate',
        completed: false,
        recommendedSkills: ['Advanced Guitar Fingerstyle'],
      },
      {
        id: 'gtr-4',
        title: 'Phase 4: Song Improvisation & Lead Scales',
        description: 'Pentatonic scale positions, blues bends, and jamming along with backing tracks.',
        duration: '5 Hours',
        recommendedLevel: 'Advanced',
        completed: false,
        recommendedSkills: ['Music Theory & Guitar Soloing'],
      },
    ],
  },
];

interface SkillRoadmapProps {
  skills: Skill[];
  onProposeSwap: (skill: Skill) => void;
  onViewDetail: (skill: Skill) => void;
}

export const SkillRoadmap: React.FC<SkillRoadmapProps> = ({
  skills,
  onProposeSwap,
  onViewDetail,
}) => {
  const [selectedTrackId, setSelectedTrackId] = useState<string>(ROADMAP_TRACKS[0].id);
  const [completedStepsMap, setCompletedStepsMap] = useState<Record<string, boolean>>({
    'sp-1': true,
    'sp-2': true,
    'dev-1': true,
    'dev-2': true,
    'photo-1': true,
    'gtr-1': true,
  });

  const activeTrack = ROADMAP_TRACKS.find((t) => t.id === selectedTrackId) || ROADMAP_TRACKS[0];

  const totalSteps = activeTrack.steps.length;
  const completedCount = activeTrack.steps.filter((s) => completedStepsMap[s.id]).length;
  const progressPercent = Math.round((completedCount / totalSteps) * 100);

  const toggleStepCompletion = (stepId: string) => {
    setCompletedStepsMap((prev) => ({
      ...prev,
      [stepId]: !prev[stepId],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-3 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 rounded-full text-xs font-bold">
            <GraduationCap className="w-4 h-4 text-indigo-400" />
            <span>Structured Peer Learning Paths</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Skill Roadmaps & Milestone Progression
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Follow expert-designed step-by-step learning roadmaps. Match with verified peer mentors for each specific phase and track your progress toward complete skill mastery!
          </p>
        </div>
      </div>

      {/* Track Selection Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {ROADMAP_TRACKS.map((track) => {
          const isSelected = track.id === selectedTrackId;
          const trackCompleted = track.steps.filter((s) => completedStepsMap[s.id]).length;
          const trackPercent = Math.round((trackCompleted / track.steps.length) * 100);

          return (
            <button
              key={track.id}
              onClick={() => setSelectedTrackId(track.id)}
              className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden ${
                isSelected
                  ? 'bg-slate-800/90 border-indigo-500 ring-2 ring-indigo-500/40 shadow-xl shadow-indigo-500/10'
                  : 'bg-slate-900/80 hover:bg-slate-800/80 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-2xl">{track.icon}</span>
                <span className="text-[11px] font-bold text-slate-400 font-mono">
                  {track.estimatedTotalHours}h total
                </span>
              </div>

              <h3 className="text-xs sm:text-sm font-bold text-white mb-1 line-clamp-1">
                {track.title}
              </h3>
              <p className="text-[11px] text-slate-400 line-clamp-2 mb-3">
                {track.description}
              </p>

              {/* Progress indicator */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold text-slate-400">
                  <span>Progress</span>
                  <span className={trackPercent === 100 ? 'text-emerald-400' : 'text-indigo-400'}>
                    {trackPercent}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      trackPercent === 100 ? 'bg-emerald-400' : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                    }`}
                    style={{ width: `${trackPercent}%` }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Roadmap Details */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
        {/* Track Title Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{activeTrack.icon}</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold text-white">
                  {activeTrack.title}
                </h2>
                <span className="px-2.5 py-0.5 bg-indigo-950 text-indigo-300 text-xs font-bold rounded-lg border border-indigo-800">
                  {activeTrack.category}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {activeTrack.description}
              </p>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 px-4 py-2.5 rounded-2xl flex items-center gap-4 shrink-0">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Completed</span>
              <span className="text-sm font-extrabold text-indigo-400">{completedCount} / {totalSteps} Phases</span>
            </div>
            <div className="w-12 h-12 rounded-full border-4 border-indigo-500/30 flex items-center justify-center font-bold text-xs text-white bg-indigo-950/60">
              {progressPercent}%
            </div>
          </div>
        </div>

        {/* Milestone Steps Timeline */}
        <div className="space-y-6 relative before:absolute before:left-5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
          {activeTrack.steps.map((step, index) => {
            const isDone = !!completedStepsMap[step.id];

            // Find matching mentors in skills list for this step
            const matchingMentors = skills.filter((s) =>
              step.recommendedSkills.some(
                (rec) =>
                  s.title.toLowerCase().includes(rec.toLowerCase()) ||
                  rec.toLowerCase().includes(s.title.toLowerCase())
              )
            );

            return (
              <div key={step.id} className="relative pl-12 space-y-3 group">
                {/* Timeline Node Checkbox */}
                <button
                  type="button"
                  onClick={() => toggleStepCompletion(step.id)}
                  className={`absolute left-2.5 top-1 -translate-x-1/2 p-1 rounded-full border transition-all cursor-pointer z-10 ${
                    isDone
                      ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-md shadow-emerald-500/30'
                      : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-indigo-500 hover:text-indigo-400'
                  }`}
                  title={isDone ? 'Mark as incomplete' : 'Mark as complete'}
                >
                  {isDone ? <CheckCircle2 className="w-5 h-5 fill-current" /> : <Circle className="w-5 h-5" />}
                </button>

                {/* Step Card */}
                <div className={`p-5 rounded-2xl border transition-all ${
                  isDone
                    ? 'bg-slate-950/70 border-emerald-900/50 text-slate-200'
                    : 'bg-slate-950/90 border-slate-800 text-slate-100 hover:border-slate-700'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                        Phase {index + 1}
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {step.duration}
                      </span>
                    </div>

                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-extrabold border bg-slate-900 text-slate-300 border-slate-700/80 self-start sm:self-auto">
                      {step.recommendedLevel} Level
                    </span>
                  </div>

                  <h3 className={`text-base font-bold ${isDone ? 'text-slate-300 line-through opacity-80' : 'text-white'}`}>
                    {step.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {step.description}
                  </p>

                  {/* Recommended Mentors for this Step */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                        Recommended Peer Mentors for this Phase ({matchingMentors.length || 1}):
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {(matchingMentors.length > 0 ? matchingMentors : [skills[index % skills.length]]).map((mentorSkill) => (
                        <div
                          key={mentorSkill.id}
                          className="flex items-center justify-between gap-3 p-2.5 bg-slate-900 border border-slate-800 rounded-xl hover:border-indigo-500/50 transition-all flex-1 min-w-[240px]"
                        >
                          <div className="flex items-center gap-2.5">
                            <img
                              src={mentorSkill.userAvatar}
                              alt={mentorSkill.userName}
                              className="w-8 h-8 rounded-full object-cover border border-indigo-500/40"
                            />
                            <div>
                              <span className="block text-xs font-bold text-slate-200 line-clamp-1">{mentorSkill.userName}</span>
                              <span className="block text-[10px] text-slate-400 line-clamp-1">{mentorSkill.title}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => onViewDetail(mentorSkill)}
                              className="px-2.5 py-1 text-[11px] font-bold text-slate-300 hover:text-white bg-slate-800 rounded-lg transition-colors"
                            >
                              Details
                            </button>
                            <button
                              type="button"
                              onClick={() => onProposeSwap(mentorSkill)}
                              className="px-2.5 py-1 text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                            >
                              <ArrowRightLeft className="w-3 h-3" />
                              <span>Swap</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
