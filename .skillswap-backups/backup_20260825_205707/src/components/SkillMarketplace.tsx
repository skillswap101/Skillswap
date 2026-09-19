import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Sparkles,
  Star,
  Clock,
  ArrowRight,
  PlusCircle,
  ShieldCheck,
  CheckCircle2,
  BookOpen,
  MapPin,
  Flame,
  Tag,
  Loader2,
  X,
  SlidersHorizontal,
  ArrowUpDown,
  Code2,
  Globe,
  Palette,
  Music,
  Utensils,
  Briefcase,
  HeartPulse,
  Zap,
  GraduationCap,
  LayoutGrid,
  List,
} from 'lucide-react';
import { SkillListing, SkillCategory, UserProfile } from '../types';
import { api } from '../lib/api';

interface SkillMarketplaceProps {
  listings: SkillListing[];
  currentUser: UserProfile;
  onProposeSwap: (listing: SkillListing) => void;
  onOpenCreateListing: () => void;
  onOpenCheckout: () => void;
}

interface CategoryConfig {
  name: 'All' | SkillCategory;
  icon: React.ElementType;
  color: string;
}

const CATEGORY_CONFIGS: CategoryConfig[] = [
  { name: 'All', icon: Sparkles, color: 'text-indigo-400' },
  { name: 'Coding & Tech', icon: Code2, color: 'text-blue-400' },
  { name: 'AI & Data Science', icon: Zap, color: 'text-purple-400' },
  { name: 'Languages', icon: Globe, color: 'text-emerald-400' },
  { name: 'Design & Creative', icon: Palette, color: 'text-pink-400' },
  { name: 'Music & Audio', icon: Music, color: 'text-amber-400' },
  { name: 'Cooking & Culinary', icon: Utensils, color: 'text-orange-400' },
  { name: 'Business & Finance', icon: Briefcase, color: 'text-cyan-400' },
  { name: 'Health & Wellness', icon: HeartPulse, color: 'text-rose-400' },
];

type SortOption = 'recommended' | 'rating' | 'swaps' | 'rate_asc' | 'rate_desc' | 'newest';

export const SkillMarketplace: React.FC<SkillMarketplaceProps> = ({
  listings,
  currentUser,
  onProposeSwap,
  onOpenCreateListing,
  onOpenCheckout,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'All' | SkillCategory>('All');
  const [filterType, setFilterType] = useState<'all' | 'offer' | 'request'>('all');
  const [experienceLevel, setExperienceLevel] = useState<'all' | 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recommended');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // AI Smart Matcher States
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiSearching, setAiSearching] = useState(false);
  const [aiMatches, setAiMatches] = useState<any[] | null>(null);

  const handleAiMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    setAiSearching(true);
    try {
      const res = await api.getAiMatches(aiPrompt, currentUser.id);
      setAiMatches(res.matches || []);
    } catch (err) {
      console.error('AI Match error:', err);
    } finally {
      setAiSearching(false);
    }
  };

  // Compute count of listings per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: listings.length };
    CATEGORY_CONFIGS.forEach(c => {
      if (c.name !== 'All') {
        counts[c.name] = listings.filter(l => l.category === c.name).length;
      }
    });
    return counts;
  }, [listings]);

  // Filter and sort listings
  const filteredListings = useMemo(() => {
    let result = listings.filter(item => {
      // Category filter
      if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
      
      // Type filter (offer / request)
      if (filterType !== 'all' && item.type !== filterType) return false;

      // Experience level filter
      if (experienceLevel !== 'all' && item.experienceLevel !== experienceLevel) return false;

      // Keyword Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = item.title?.toLowerCase().includes(q);
        const matchDesc = item.description?.toLowerCase().includes(q);
        const matchTags = item.tags?.some(t => t.toLowerCase().includes(q));
        const matchUser = item.user?.name?.toLowerCase().includes(q);
        const matchCategory = item.category?.toLowerCase().includes(q);
        const matchSyllabus = item.syllabus?.some(s => s.toLowerCase().includes(q));
        const matchLocation = item.user?.location?.toLowerCase().includes(q);
        const matchSkillsExchanged = item.skillsExchanged?.some(s => s.toLowerCase().includes(q));

        if (
          !matchTitle &&
          !matchDesc &&
          !matchTags &&
          !matchUser &&
          !matchCategory &&
          !matchSyllabus &&
          !matchLocation &&
          !matchSkillsExchanged
        ) {
          return false;
        }
      }
      return true;
    });

    // Sorting
    return result.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return (b.user.rating || 0) - (a.user.rating || 0);
        case 'swaps':
          return (b.user.completedSwaps || 0) - (a.user.completedSwaps || 0);
        case 'rate_asc':
          return a.hourlyRateCredits - b.hourlyRateCredits;
        case 'rate_desc':
          return b.hourlyRateCredits - a.hourlyRateCredits;
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'recommended':
        default:
          // Boost higher rated and active listings
          return (b.user.rating * 10 + b.user.completedSwaps) - (a.user.rating * 10 + a.user.completedSwaps);
      }
    });
  }, [listings, selectedCategory, filterType, experienceLevel, searchQuery, sortBy]);

  const hasActiveFilters = selectedCategory !== 'All' || filterType !== 'all' || experienceLevel !== 'all' || searchQuery.trim().length > 0 || sortBy !== 'recommended';

  const resetAllFilters = () => {
    setSelectedCategory('All');
    setFilterType('all');
    setExperienceLevel('all');
    setSearchQuery('');
    setSortBy('recommended');
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* Hero & AI Smart Matcher Banner */}
      <div className="relative rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative max-w-3xl z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Time-Banked P2P Knowledge Protocol</span>
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Exchange Knowledge 1-on-1 with Verified Escrow.
          </h1>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed max-w-2xl">
            Swap your technical, creative, and language skills hour-for-hour. Time credits are locked safely in escrow and only released when both peers sign off.
          </p>

          {/* AI Matcher Form */}
          <form onSubmit={handleAiMatch} className="mt-6 flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Sparkles className="w-4 h-4 text-indigo-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                placeholder="AI Smart Match: e.g. 'Teach me conversational Spanish in exchange for React or AI lessons'..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/90 text-white placeholder-slate-400 text-xs sm:text-sm rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <button
              type="submit"
              disabled={aiSearching}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center gap-2 shrink-0 transition-all"
            >
              {aiSearching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Matching...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  Find Best Swap Partner
                </>
              )}
            </button>
          </form>
        </div>

        {/* AI Recommendations Drawer */}
        {aiMatches && aiMatches.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-800 animate-in fade-in">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Top AI Recommended Swaps
              </h3>
              <button
                onClick={() => setAiMatches(null)}
                className="text-[11px] text-slate-400 hover:text-white"
              >
                Clear Matches
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {aiMatches.map((m, idx) => {
                const target = listings.find(l => l.id === m.listingId);
                if (!target) return null;
                return (
                  <div
                    key={idx}
                    className="bg-slate-800/90 border border-indigo-500/40 rounded-xl p-3.5 text-xs space-y-2 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800">
                          {m.matchScore}% Match
                        </span>
                        <span className="text-[10px] text-slate-400">{target.category}</span>
                      </div>
                      <h4 className="font-bold text-slate-100 mt-1 line-clamp-1">{target.title}</h4>
                      <p className="text-slate-300 text-[11px] line-clamp-2 mt-1">{m.reasoning}</p>
                    </div>
                    
                    <button
                      onClick={() => onProposeSwap(target)}
                      className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-[11px] transition-colors"
                    >
                      Propose Swap ({target.hourlyRateCredits}h)
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Main Search & Category Filtering Control Center */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-4 transition-colors">
        
        {/* Top Row: Search Input + Type Filter + Advanced Controls Toggle */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          {/* Primary Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              id="skill-search-input"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search skills by title, topic, mentor, tag, syllabus, or location..."
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filters: Offer vs Request Type Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterType === 'all'
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All ({listings.length})
            </button>
            <button
              onClick={() => setFilterType('offer')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterType === 'offer'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Offers ({listings.filter(l => l.type === 'offer').length})
            </button>
            <button
              onClick={() => setFilterType('request')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterType === 'request'
                  ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Requests ({listings.filter(l => l.type === 'request').length})
            </button>
          </div>

          {/* Sort & More Filters & View Toggle */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
            {/* Sort Dropdown */}
            <div className="relative flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 mr-1.5" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as SortOption)}
                className="bg-transparent text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer pr-1"
              >
                <option value="recommended" className="dark:bg-slate-800 text-slate-900 dark:text-white">Best Match</option>
                <option value="rating" className="dark:bg-slate-800 text-slate-900 dark:text-white">Highest Rated</option>
                <option value="swaps" className="dark:bg-slate-800 text-slate-900 dark:text-white">Most Swaps</option>
                <option value="rate_asc" className="dark:bg-slate-800 text-slate-900 dark:text-white">Rate: Low to High</option>
                <option value="rate_desc" className="dark:bg-slate-800 text-slate-900 dark:text-white">Rate: High to Low</option>
                <option value="newest" className="dark:bg-slate-800 text-slate-900 dark:text-white">Newest Listed</option>
              </select>
            </div>

            {/* Advanced Filters Button */}
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all ${
                showAdvancedFilters || experienceLevel !== 'all'
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
              title="Toggle Advanced Filters"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Filters</span>
              {experienceLevel !== 'all' && (
                <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
              )}
            </button>

            {/* Layout Grid / List View Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Grid View (Responsive Columns)"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="List View (Compact Row Cards)"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

        {/* Collapsible Advanced Level Filters */}
        {showAdvancedFilters && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2 animate-in fade-in duration-150">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-2">
              <GraduationCap className="w-3.5 h-3.5" /> Experience Level:
            </span>
            {(['all', 'Beginner', 'Intermediate', 'Advanced', 'Expert'] as const).map(lvl => (
              <button
                key={lvl}
                onClick={() => setExperienceLevel(lvl)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  experienceLevel === lvl
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {lvl === 'all' ? 'All Levels' : lvl}
              </button>
            ))}
          </div>
        )}

        {/* Category Filter Pills / Carousel */}
        <div className="pt-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <Filter className="w-3 h-3" /> Browse by Category
            </span>
            {selectedCategory !== 'All' && (
              <button
                onClick={() => setSelectedCategory('All')}
                className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
              >
                Show All Categories
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
            {CATEGORY_CONFIGS.map(cat => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.name;
              const count = categoryCounts[cat.name] || 0;

              return (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 shrink-0 ${
                    isSelected
                      ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-md shadow-slate-900/20 scale-[1.02]'
                      : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-cyan-300' : cat.color}`} />
                  <span>{cat.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-medium ${
                      isSelected
                        ? 'bg-slate-800 dark:bg-indigo-700 text-slate-300 dark:text-white'
                        : 'bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Filters Summary & Reset Bar */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2 flex-wrap text-slate-600 dark:text-slate-400">
            <span className="font-semibold text-slate-900 dark:text-white">
              {filteredListings.length} {filteredListings.length === 1 ? 'skill listing' : 'skill listings'} found
            </span>
            {selectedCategory !== 'All' && (
              <span className="inline-flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-md font-medium">
                Category: {selectedCategory}
                <button onClick={() => setSelectedCategory('All')} className="hover:text-indigo-900 dark:hover:text-indigo-100">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filterType !== 'all' && (
              <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md font-medium capitalize">
                Type: {filterType}
                <button onClick={() => setFilterType('all')} className="hover:text-slate-900 dark:hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {experienceLevel !== 'all' && (
              <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md font-medium">
                Level: {experienceLevel}
                <button onClick={() => setExperienceLevel('all')} className="hover:text-slate-900 dark:hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {searchQuery.trim() && (
              <span className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-md font-medium">
                Query: "{searchQuery}"
                <button onClick={() => setSearchQuery('')} className="hover:text-amber-950 dark:hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>

          {hasActiveFilters && (
            <button
              onClick={resetAllFilters}
              className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 underline flex items-center gap-1 ml-auto"
            >
              <X className="w-3 h-3" />
              Reset All Filters
            </button>
          )}
        </div>

      </div>

      {/* Skill Listings: Responsive Adaptive Viewport Grid / List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
          {filteredListings.map(listing => {
            const isOwn = listing.userId === currentUser.id;
            return (
              <div
                key={listing.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-4 sm:p-5 space-y-3">
                  
                  {/* Header Tag & Type */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        listing.type === 'offer'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80'
                          : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80'
                      }`}
                    >
                      {listing.type === 'offer' ? 'Offering Skill' : 'Seeking Mentor'}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        {listing.experienceLevel || 'All Levels'}
                      </span>
                      <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        {listing.category}
                      </span>
                    </div>
                  </div>

                  {/* Listing Title */}
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                    {listing.title}
                  </h3>

                  {/* Description */}
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
                    {listing.description}
                  </p>

                  {/* Syllabus / Highlights Preview */}
                  {listing.syllabus && listing.syllabus.length > 0 && (
                    <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2.5 border border-slate-100 dark:border-slate-800 space-y-1">
                      <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-indigo-500 dark:text-indigo-400" /> Syllabus Highlights
                      </div>
                      <ul className="text-[11px] text-slate-600 dark:text-slate-300 space-y-0.5 list-disc list-inside">
                        {listing.syllabus.slice(0, 2).map((s, idx) => (
                          <li key={idx} className="truncate">{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {listing.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                </div>

                {/* Card Footer: User Bio, Rate & Action */}
                <div className="p-3.5 sm:p-4 bg-slate-50/70 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                  
                  {/* User Info */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={listing.user.avatar}
                      alt={listing.user.name}
                      className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{listing.user.name}</div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                        <span>{listing.user.rating}</span>
                        <span>•</span>
                        <span className="truncate">{listing.user.completedSwaps} swaps</span>
                      </div>
                    </div>
                  </div>

                  {/* Rate & Propose Button */}
                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-white mb-1 whitespace-nowrap">
                      {listing.hourlyRateCredits} Credit{listing.hourlyRateCredits > 1 ? 's' : ''}/hr
                    </div>
                    
                    {isOwn ? (
                      <span className="text-[11px] font-semibold text-slate-400 bg-slate-200/70 dark:bg-slate-800 px-2.5 py-1 rounded-lg inline-block">
                        Your Listing
                      </span>
                    ) : (
                      <button
                        onClick={() => onProposeSwap(listing)}
                        className="min-h-[36px] px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center gap-1"
                      >
                        <span>Propose</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      ) : (
        /* List Mode: Dense & Scannable for Desktop & Mobile */
        <div className="flex flex-col gap-3.5">
          {filteredListings.map(listing => {
            const isOwn = listing.userId === currentUser.id;
            return (
              <div
                key={listing.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-all p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group"
              >
                {/* Left: User Avatar & Skill Details */}
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <img
                    src={listing.user.avatar}
                    alt={listing.user.name}
                    className="w-11 h-11 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0 mt-0.5"
                  />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          listing.type === 'offer'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80'
                            : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80'
                        }`}
                      >
                        {listing.type === 'offer' ? 'Offer' : 'Request'}
                      </span>
                      <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        {listing.category}
                      </span>
                      <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        {listing.experienceLevel || 'All Levels'}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{listing.user.name}</span>
                      <div className="flex items-center gap-1 text-[11px] text-amber-500 font-medium">
                        <Star className="w-3 h-3 fill-amber-400" />
                        <span>{listing.user.rating}</span>
                        <span className="text-slate-400">({listing.user.completedSwaps} swaps)</span>
                      </div>
                    </div>

                    <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {listing.title}
                    </h3>

                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 max-w-3xl">
                      {listing.description}
                    </p>

                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      {listing.tags.slice(0, 4).map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                  </div>
                </div>

                {/* Right: Rate and Action Button */}
                <div className="flex md:flex-col items-center md:items-end justify-between w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800 shrink-0 gap-3">
                  <div className="text-left md:text-right">
                    <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                      {listing.hourlyRateCredits} Time Credit{listing.hourlyRateCredits > 1 ? 's' : ''}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">per hour</span>
                  </div>

                  {isOwn ? (
                    <span className="text-[11px] font-semibold text-slate-400 bg-slate-200/70 dark:bg-slate-800 px-3 py-1.5 rounded-xl">
                      Your Listing
                    </span>
                  ) : (
                    <button
                      onClick={() => onProposeSwap(listing)}
                      className="min-h-[40px] px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 shrink-0"
                    >
                      <span>Propose Swap</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* No Results Empty State */}
      {filteredListings.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center mx-auto mb-4 text-indigo-600 dark:text-indigo-400">
            <Search className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-lg">No skill listings found</h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-md mx-auto leading-relaxed">
            We couldn't find any skills matching your search criteria. Try adjusting your search keywords, switching categories, or resetting active filters.
          </p>

          <div className="flex items-center justify-center gap-3 mt-5 flex-wrap">
            {hasActiveFilters && (
              <button
                onClick={resetAllFilters}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors"
              >
                Clear All Filters
              </button>
            )}
            <button
              onClick={onOpenCreateListing}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              Post a Skill Listing
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

