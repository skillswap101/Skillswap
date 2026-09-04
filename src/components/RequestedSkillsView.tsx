import React, { useState } from 'react';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Filter, 
  Sparkles, 
  Send, 
  MessageSquare, 
  Clock, 
  UserCheck, 
  CheckCircle2, 
  ArrowRightLeft, 
  Tag, 
  Calendar, 
  Award, 
  Video, 
  MapPin, 
  ThumbsUp,
  X,
  HelpCircle
} from 'lucide-react';
import { SkillCategory, SkillLevel, DeliveryMode, SkillRequest, Skill, User } from '../types';

const INITIAL_SKILL_REQUESTS: SkillRequest[] = [
  {
    id: 'req-1',
    userId: 'usr_sarah',
    userName: 'Sarah Jenkins',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    userLocation: 'Chicago, IL',
    category: 'Tech & Dev',
    title: 'Seeking Rust Programming Mentor for Async Web Backends',
    description: 'I have a strong background in TypeScript and Python, but I am struggling with Rust borrow checker mechanics and async Tokio framework. Looking for 3-4 sessions to review code and build a CLI tool.',
    targetLevel: 'Intermediate',
    delivery: 'Online',
    offeredSkillOrCredits: 'Offering: UI/UX Figma Design OR 2 Time Credits/hr',
    preferredSchedule: 'Tuesday & Thursday evenings PST',
    offersReceivedCount: 3,
    status: 'Open',
    createdAt: '2 days ago',
    tags: ['Rust', 'Backend', 'Tokio', 'Systems'],
  },
  {
    id: 'req-2',
    userId: 'usr_marcus',
    userName: 'Marcus Vance',
    userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    userLocation: 'Denver, CO',
    category: 'Languages',
    title: 'Looking for Native Japanese Speaker for Conversational Practice',
    description: 'Planning a trip to Kyoto in November. I know basic Hiragana/Katakana and N5 grammar, but need help building real-world conversational speed and natural pronunciation.',
    targetLevel: 'Beginner',
    delivery: 'Online',
    offeredSkillOrCredits: 'Offering: Portrait Photography Essentials or 1 Time Credit/hr',
    preferredSchedule: 'Weekend mornings (Sat/Sun 10 AM)',
    offersReceivedCount: 5,
    status: 'In Discussion',
    createdAt: '1 day ago',
    tags: ['Japanese', 'Conversation', 'Travel', 'Culture'],
  },
  {
    id: 'req-3',
    userId: 'usr_elena',
    userName: 'Elena Rostova',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    userLocation: 'Austin, TX',
    category: 'Crafts & Cooking',
    title: 'Need Artisan Sourdough Bread Baking Breakdown',
    description: 'Tried 3 times and my loaf keeps coming out dense. Want a live video walkthrough on starter maintenance, bulk fermentation timing, and Dutch oven scoring.',
    targetLevel: 'Beginner',
    delivery: 'Online',
    offeredSkillOrCredits: 'Offering: Acoustic Guitar Fingerstyle Lessons',
    preferredSchedule: 'Sunday afternoon baking session',
    offersReceivedCount: 2,
    status: 'Open',
    createdAt: '3 days ago',
    tags: ['Baking', 'Sourdough', 'Culinary', 'Artisan'],
  },
  {
    id: 'req-4',
    userId: 'usr_david',
    userName: 'David Kim',
    userAvatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    userLocation: 'Toronto, Canada',
    category: 'Fitness & Wellness',
    title: 'Looking for Kettlebell & Functional Strength Mobility Coach',
    description: 'Want to optimize my home kettlebell workout form (swings, clean & press) to avoid lower back strain. Looking for a certified or experienced peer lifter.',
    targetLevel: 'Intermediate',
    delivery: 'Hybrid',
    offeredSkillOrCredits: 'Offering: Digital Marketing & SEO Strategy or Time Credits',
    preferredSchedule: 'Mon/Wed 7:00 AM EST',
    offersReceivedCount: 4,
    status: 'Open',
    createdAt: '4 days ago',
    tags: ['Fitness', 'Kettlebell', 'Mobility', 'Strength'],
  },
];

interface RequestedSkillsViewProps {
  currentUser: User;
  skills: Skill[];
  onProposeSwap: (skill: Skill) => void;
  showToast: (msg: string) => void;
}

export const RequestedSkillsView: React.FC<RequestedSkillsViewProps> = ({
  currentUser,
  skills,
  onProposeSwap,
  showToast,
}) => {
  const [requests, setRequests] = useState<SkillRequest[]>(INITIAL_SKILL_REQUESTS);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<SkillCategory>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [upvotedMap, setUpvotedMap] = useState<Record<string, boolean>>({});

  // Offer to teach modal
  const [offerTargetRequest, setOfferTargetRequest] = useState<SkillRequest | null>(null);
  const [offerMessage, setOfferMessage] = useState<string>('');
  const [selectedOfferedSkill, setSelectedOfferedSkill] = useState<string>('Conversational Spanish for Beginners');

  // Create request modal
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newCategory, setNewCategory] = useState<SkillCategory>('Tech & Dev');
  const [newTargetLevel, setNewTargetLevel] = useState<SkillLevel>('Beginner');
  const [newDelivery, setNewDelivery] = useState<DeliveryMode>('Online');
  const [newDescription, setNewDescription] = useState<string>('');
  const [newOffered, setNewOffered] = useState<string>('Offering: Time Credits (1 credit/hr) or Conversational Spanish');
  const [newSchedule, setNewSchedule] = useState<string>('Flexible weekdays/weekends');
  const [newTagsStr, setNewTagsStr] = useState<string>('Learning, Skills');

  const CATEGORIES_LIST: SkillCategory[] = [
    'All',
    'Tech & Dev',
    'Languages',
    'Design & Creative',
    'Music & Audio',
    'Fitness & Wellness',
    'Business & Marketing',
    'Crafts & Cooking',
  ];

  const filteredRequests = requests.filter((req) => {
    const matchesSearch =
      !searchQuery ||
      req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'All' || req.category === selectedCategory;
    const matchesStatus = selectedStatus === 'All' || req.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleToggleUpvote = (id: string) => {
    setUpvotedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSendTeachOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerTargetRequest) return;

    setRequests((prev) =>
      prev.map((r) =>
        r.id === offerTargetRequest.id
          ? {
              ...r,
              offersReceivedCount: r.offersReceivedCount + 1,
              status: r.status === 'Open' ? 'In Discussion' : r.status,
            }
          : r
      )
    );

    showToast(`Your offer to teach "${offerTargetRequest.title}" was sent to ${offerTargetRequest.userName}!`);
    setOfferTargetRequest(null);
    setOfferMessage('');
  };

  const handleCreateRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const created: SkillRequest = {
      id: `req-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      userLocation: currentUser.location,
      category: newCategory,
      title: newTitle,
      description: newDescription,
      targetLevel: newTargetLevel,
      delivery: newDelivery,
      offeredSkillOrCredits: newOffered,
      preferredSchedule: newSchedule,
      offersReceivedCount: 0,
      status: 'Open',
      createdAt: 'Just now',
      tags: newTagsStr.split(',').map((s) => s.trim()).filter(Boolean),
    };

    setRequests([created, ...requests]);
    setShowCreateModal(false);
    showToast('Your skill learning request has been published to the community board!');
    // Reset form
    setNewTitle('');
    setNewDescription('');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 rounded-full text-xs font-bold">
            <HelpCircle className="w-4 h-4 text-indigo-400" />
            <span>Community Wishlist & Learning Requests</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Requested Skills & Mentorship Board
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Can't find a listed skill? Post what you want to learn! Experienced community mentors browse these requests daily to proactively offer 1-on-1 teaching sessions.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-indigo-600/20 transition-all active:scale-95 shrink-0 self-start md:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Post a Skill Request</span>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="space-y-3 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search requested skills, keywords, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">Status:</span>
            {['All', 'Open', 'In Discussion', 'Fulfilled'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedStatus === st
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Categories Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">Category:</span>
          {CATEGORIES_LIST.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/50'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Request Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRequests.map((req) => {
          const isUpvoted = !!upvotedMap[req.id];

          return (
            <div
              key={req.id}
              className="bg-slate-900 border border-slate-800 hover:border-indigo-500/40 rounded-3xl p-6 shadow-xl space-y-4 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header User Row */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={req.userAvatar}
                      alt={req.userName}
                      className="w-10 h-10 rounded-full object-cover border-2 border-indigo-500/40"
                    />
                    <div>
                      <span className="block text-xs font-bold text-white">{req.userName}</span>
                      <span className="block text-[10px] text-slate-400">{req.userLocation} • {req.createdAt}</span>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                    req.status === 'Open'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      : req.status === 'In Discussion'
                      ? 'bg-amber-950 text-amber-300 border-amber-800'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {req.status}
                  </span>
                </div>

                {/* Title & Category */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-indigo-950 text-indigo-300 text-[10px] font-extrabold rounded-md border border-indigo-800">
                      {req.category}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-[11px] font-bold text-slate-400">{req.targetLevel} Target</span>
                  </div>
                  <h3 className="text-base font-extrabold text-white leading-snug">
                    {req.title}
                  </h3>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                  {req.description}
                </p>

                {/* Exchange Details Box */}
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-indigo-300">
                    <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>{req.offeredSkillOrCredits}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>Preferred: {req.preferredSchedule} ({req.delivery})</span>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {req.tags.map((tag, i) => (
                    <span key={i} className="px-2 py-0.5 bg-slate-950 text-slate-400 text-[10px] font-semibold rounded-md border border-slate-800 flex items-center gap-1">
                      <Tag className="w-2.5 h-2.5 text-indigo-400" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleToggleUpvote(req.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      isUpvoted
                        ? 'bg-indigo-950 text-indigo-300 border border-indigo-500'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <ThumbsUp className={`w-3.5 h-3.5 ${isUpvoted ? 'fill-current text-indigo-400' : ''}`} />
                    <span>{isUpvoted ? 1 : 0} Upvoted</span>
                  </button>

                  <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                    {req.offersReceivedCount} Mentor Offers
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setOfferTargetRequest(req)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Offer to Teach</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Offer to Teach Modal */}
      {offerTargetRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <form onSubmit={handleSendTeachOffer} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">Offer Your Mentorship</h3>
                <p className="text-xs text-slate-400">Respond to {offerTargetRequest.userName}'s skill request</p>
              </div>
              <button
                type="button"
                onClick={() => setOfferTargetRequest(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Request:</span>
              <p className="text-xs font-bold text-indigo-300">{offerTargetRequest.title}</p>
              <p className="text-[11px] text-slate-400 line-clamp-2">{offerTargetRequest.description}</p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">Skill You Will Teach</label>
              <select
                value={selectedOfferedSkill}
                onChange={(e) => setSelectedOfferedSkill(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="Conversational Spanish for Beginners">Conversational Spanish for Beginners</option>
                <option value="Custom Teaching Offer">Custom Specialized Mentorship</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">Personal Pitch & Session Availability</label>
              <textarea
                rows={4}
                placeholder={`Hi ${offerTargetRequest.userName}, I saw your request and I'd love to help! I have 3+ years of experience with ${offerTargetRequest.title}...`}
                value={offerMessage}
                onChange={(e) => setOfferMessage(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setOfferTargetRequest(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Mentorship Offer</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Post a Skill Request Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <form onSubmit={handleCreateRequestSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">Post a Requested Skill</h3>
                <p className="text-xs text-slate-400">Let peer mentors know what you want to learn</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">Request Title</label>
              <input
                type="text"
                placeholder="e.g. Seeking Rust Programming Mentor for Async Backends"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  {CATEGORIES_LIST.filter((c) => c !== 'All').map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Target Level</label>
                <select
                  value={newTargetLevel}
                  onChange={(e) => setNewTargetLevel(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">What do you offer in exchange?</label>
              <input
                type="text"
                placeholder="e.g. Offering: UI/UX Figma Design or 1 Time Credit/hr"
                value={newOffered}
                onChange={(e) => setNewOffered(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">Detailed Description & Learning Goals</label>
              <textarea
                rows={4}
                placeholder="Explain what specific topics, projects, or goals you want to tackle during your sessions..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Preferred Schedule</label>
                <input
                  type="text"
                  placeholder="e.g. Weekday evenings"
                  value={newSchedule}
                  onChange={(e) => setNewSchedule(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Delivery Mode</label>
                <select
                  value={newDelivery}
                  onChange={(e) => setNewDelivery(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="Online">Online Video</option>
                  <option value="In-Person">In-Person</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">Tags (comma-separated)</label>
              <input
                type="text"
                placeholder="Rust, Tokio, Backend, Systems"
                value={newTagsStr}
                onChange={(e) => setNewTagsStr(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 text-white font-extrabold text-xs rounded-xl shadow-md"
              >
                Publish Request
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
