import React, { useState } from 'react';
import { 
  Quote, 
  Star, 
  ArrowRightLeft, 
  Award, 
  Clock, 
  Sparkles, 
  Heart, 
  Share2, 
  CheckCircle2, 
  Plus, 
  MessageSquare,
  TrendingUp,
  UserCheck
} from 'lucide-react';

interface SuccessStory {
  id: string;
  mentorA: {
    name: string;
    avatar: string;
    skillTaught: string;
    location: string;
  };
  mentorB: {
    name: string;
    avatar: string;
    skillTaught: string;
    location: string;
  };
  totalHoursSwapped: number;
  rating: number;
  title: string;
  testimonial: string;
  impactMilestones: string[];
  likesCount: number;
  category: string;
  featuredBadge?: string;
}

const SUCCESS_STORIES: SuccessStory[] = [
  {
    id: 'story-1',
    mentorA: {
      name: 'Sofia Rossi',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      skillTaught: 'Conversational Spanish',
      location: 'Barcelona, Spain',
    },
    mentorB: {
      name: 'Alex Chen',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      skillTaught: 'React & Web Architecture',
      location: 'San Francisco, CA',
    },
    totalHoursSwapped: 28,
    rating: 5.0,
    title: 'From Zero Spanish to Relocating to Madrid & Building a SaaS App',
    testimonial: 'We met on SkillSwap 4 months ago. I helped Alex prepare for his remote tech job transition in Spain through 1-on-1 speaking sessions, while he guided me step-by-step in building my portfolio website in React. No money exchanged—just true human connection and passion!',
    impactMilestones: [
      'Alex passed his Spanish B2 fluency interview in Madrid',
      'Sofia launched her photography portfolio web app',
      '28 hours of 1-on-1 reciprocal mentoring completed',
    ],
    likesCount: 142,
    category: 'Tech & Languages',
    featuredBadge: 'Story of the Month 🏆',
  },
  {
    id: 'story-2',
    mentorA: {
      name: 'Elena Rostova',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      skillTaught: 'Acoustic Guitar Fingerstyle',
      location: 'Austin, TX',
    },
    mentorB: {
      name: 'Marcus Vance',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      skillTaught: 'Portrait Photography Lightroom',
      location: 'Denver, CO',
    },
    totalHoursSwapped: 18,
    rating: 5.0,
    title: 'Exchanging Music Notes for Studio Lighting Expertise',
    testimonial: 'Marcus wanted to play acoustic guitar for his wedding anniversary. I wanted to learn professional portrait retouching in Lightroom. We met weekly on Zoom. Within 6 weeks, Marcus performed a song live, and I delivered my first paid photo shoot client gallery!',
    impactMilestones: [
      'Marcus performed acoustic solo live at anniversary',
      'Elena launched her commercial photography studio',
      '18 hours swapped using time credit balances',
    ],
    likesCount: 98,
    category: 'Music & Creative',
    featuredBadge: 'Top Rated Swap ⭐',
  },
  {
    id: 'story-3',
    mentorA: {
      name: 'David Kim',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
      skillTaught: 'Digital Marketing & SEO',
      location: 'Toronto, Canada',
    },
    mentorB: {
      name: 'Maya Lin',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      skillTaught: 'UI/UX Design in Figma',
      location: 'Seattle, WA',
    },
    totalHoursSwapped: 22,
    rating: 4.9,
    title: 'Scaling Local Business Traffic in Exchange for High-Converting Figma Designs',
    testimonial: 'Maya transformed my outdated agency website into an ultra-sleek Figma design system. In return, I audited her e-commerce store and grew her organic Google search traffic by 320%. SkillSwap made a $5,000 agency consultation possible for zero cash!',
    impactMilestones: [
      '320% surge in organic Google search traffic',
      'Complete custom Figma design design system delivered',
      '22 hours exchanged seamlessly',
    ],
    likesCount: 115,
    category: 'Business & Design',
  },
];

export const MentorSuccessStories: React.FC = () => {
  const [stories, setStories] = useState<SuccessStory[]>(SUCCESS_STORIES);
  const [likedStories, setLikedStories] = useState<Record<string, boolean>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Submit story modal
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newTestimonial, setNewTestimonial] = useState<string>('');
  const [newMySkill, setNewMySkill] = useState<string>('Spanish');
  const [newPeerSkill, setNewPeerSkill] = useState<string>('React');
  const [newHours, setNewHours] = useState<number>(12);

  const toggleLike = (storyId: string) => {
    const isLiked = !!likedStories[storyId];
    setLikedStories((prev) => ({ ...prev, [storyId]: !isLiked }));
    setStories((prev) =>
      prev.map((s) =>
        s.id === storyId
          ? { ...s, likesCount: isLiked ? s.likesCount - 1 : s.likesCount + 1 }
          : s
      )
    );
  };

  const handleSubmitStory = (e: React.FormEvent) => {
    e.preventDefault();
    const created: SuccessStory = {
      id: `story-${Date.now()}`,
      mentorA: {
        name: 'You (Author)',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        skillTaught: newMySkill,
        location: 'Community Member',
      },
      mentorB: {
        name: 'Peer Partner',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        skillTaught: newPeerSkill,
        location: 'SkillSwap Community',
      },
      totalHoursSwapped: newHours,
      rating: 5.0,
      title: newTitle || 'Incredible Skill Exchange Outcome',
      testimonial: newTestimonial,
      impactMilestones: [
        `Mastered ${newPeerSkill} through 1-on-1 sessions`,
        `Taught ${newMySkill} in reciprocal exchange`,
        `${newHours} hours of learning completed`,
      ],
      likesCount: 1,
      category: 'General',
      featuredBadge: 'New Story ✨',
    };

    setStories([created, ...stories]);
    setShowSubmitModal(false);
    setNewTitle('');
    setNewTestimonial('');
  };

  const filteredStories = stories.filter(
    (s) => selectedCategory === 'All' || s.category.includes(selectedCategory)
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950/70 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 text-purple-300 border border-purple-500/30 rounded-full text-xs font-bold">
            <Award className="w-4 h-4 text-purple-400" />
            <span>Community Impact & Testimonials</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Mentor Success Stories & Skill Swap Journeys
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Real stories from members who exchanged knowledge, leveled up their careers, and forged lifelong friendships without spending a dime.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowSubmitModal(true)}
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-purple-600/20 transition-all active:scale-95 shrink-0 self-start md:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Share Your Success Story</span>
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
        {['All', 'Tech & Languages', 'Music & Creative', 'Business & Design'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Stories Grid */}
      <div className="space-y-6">
        {filteredStories.map((story) => (
          <div
            key={story.id}
            className="bg-slate-900 border border-slate-800 hover:border-purple-500/40 rounded-3xl p-6 sm:p-7 shadow-xl space-y-5 transition-all"
          >
            {/* Header badges */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-2">
                {story.featuredBadge && (
                  <span className="px-3 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-extrabold rounded-full">
                    {story.featuredBadge}
                  </span>
                )}
                <span className="px-2.5 py-0.5 bg-purple-950/80 text-purple-300 border border-purple-800 text-xs font-bold rounded-lg">
                  {story.category}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs font-bold text-slate-300 font-mono">
                <span className="flex items-center gap-1 text-amber-400">
                  <Star className="w-4 h-4 fill-amber-400" />
                  {(story.rating ?? 0).toFixed(1)}
                </span>
                <span className="flex items-center gap-1 text-indigo-400">
                  <Clock className="w-4 h-4" />
                  {story.totalHoursSwapped} Hours Swapped
                </span>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-lg sm:text-xl font-extrabold text-white leading-snug">
              {story.title}
            </h2>

            {/* Duo Mentors Bar */}
            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Mentor A */}
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <img
                  src={story.mentorA.avatar}
                  alt={story.mentorA.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-indigo-500"
                />
                <div>
                  <span className="block text-sm font-bold text-white">{story.mentorA.name}</span>
                  <span className="block text-xs font-semibold text-indigo-400">Taught: {story.mentorA.skillTaught}</span>
                  <span className="block text-[10px] text-slate-400">{story.mentorA.location}</span>
                </div>
              </div>

              {/* Reciprocal Swap Icon */}
              <div className="p-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-purple-400 shrink-0">
                <ArrowRightLeft className="w-5 h-5" />
              </div>

              {/* Mentor B */}
              <div className="flex items-center gap-3 w-full sm:w-auto sm:text-right">
                <div className="order-2 sm:order-1">
                  <span className="block text-sm font-bold text-white">{story.mentorB.name}</span>
                  <span className="block text-xs font-semibold text-purple-400">Taught: {story.mentorB.skillTaught}</span>
                  <span className="block text-[10px] text-slate-400">{story.mentorB.location}</span>
                </div>
                <img
                  src={story.mentorB.avatar}
                  alt={story.mentorB.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-purple-500 order-1 sm:order-2"
                />
              </div>
            </div>

            {/* Testimonial Quote */}
            <div className="relative pl-6 border-l-2 border-purple-500/60 italic text-xs sm:text-sm text-slate-300 leading-relaxed space-y-2">
              <Quote className="w-5 h-5 text-purple-400/40 absolute -left-2.5 -top-2" />
              <p>"{story.testimonial}"</p>
            </div>

            {/* Key Outcomes */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Key Swap Achievements & Milestones:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {story.impactMilestones.map((m, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-2 text-xs font-semibold text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="line-clamp-2">{m}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Like & Share Action Bar */}
            <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
              <button
                type="button"
                onClick={() => toggleLike(story.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all border ${
                  likedStories[story.id]
                    ? 'bg-rose-950/80 border-rose-500 text-rose-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Heart className={`w-4 h-4 ${likedStories[story.id] ? 'fill-current text-rose-400' : ''}`} />
                <span>{story.likesCount} Inspiring</span>
              </button>

              <span className="text-[11px] text-slate-400">
                Verified Swap Transaction • 100% Peer Exchange
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Share Story Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <form onSubmit={handleSubmitStory} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Share Your Skill Swap Story</h3>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">Story Title</label>
              <input
                type="text"
                placeholder="e.g. How I Learned Spanish While Teaching Web Dev"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Skill You Taught</label>
                <input
                  type="text"
                  value={newMySkill}
                  onChange={(e) => setNewMySkill(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Skill You Learned</label>
                <input
                  type="text"
                  value={newPeerSkill}
                  onChange={(e) => setNewPeerSkill(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">Your Experience & Outcome</label>
              <textarea
                rows={4}
                placeholder="Describe your swap experience, how many sessions you held, and what you achieved together..."
                value={newTestimonial}
                onChange={(e) => setNewTestimonial(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-purple-600 text-white font-extrabold text-xs rounded-xl shadow-md"
              >
                Publish Story
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
