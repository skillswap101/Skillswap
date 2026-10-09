import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Search, 
  Users, 
  MapPin, 
  Star, 
  Clock, 
  Award, 
  Sparkles, 
  RefreshCw, 
  ArrowRight,
  BookOpen,
  MessageSquare,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { User, Skill } from '../types';
import { supabase } from '../lib/supabase';
import { usePresence } from '../context/PresenceContext';

interface UserDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  skills: Skill[];
  onSelectUserForSkillFilter: (userName: string) => void;
  onOpenProposeModal?: (skill: Skill) => void;
  onStartChatWithUser?: (user: User) => void;
  showToast: (msg: string) => void;
}

export const UserDirectoryModal: React.FC<UserDirectoryModalProps> = ({
  isOpen,
  onClose,
  skills,
  onSelectUserForSkillFilter,
  onOpenProposeModal,
  onStartChatWithUser,
  showToast,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterTag, setFilterTag] = useState<string>('all');
  const { isUserOnline, getUserPresenceLabel } = usePresence();

  // Fetch users from Supabase or derive from active community skills
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.warn('[UserDirectory] Supabase fetch notice:', error.message);
      }

      let userRows = data;
      if (!userRows || userRows.length === 0) {
        try {
          const apiRes = await fetch('/api/users');
          if (apiRes.ok) {
            userRows = await apiRes.json();
          }
        } catch {}
      }

      if (userRows && userRows.length > 0) {
        const dbUsers: User[] = userRows.map((row: any) => ({
          id: row.id,
          name: row.name || 'Anonymous Member',
          email: row.email,
          title: row.title || 'SkillSwap Community Member',
          avatar: row.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${row.id}`,
          bio: row.bio || (row.raw_data && row.raw_data.bio) || 'Dedicated peer learner and mentor passionate about knowledge exchange.',
          location: row.location || 'Remote',
          rating: Number(row.rating) || 5.0,
          reviewCount: row.userReviewCount || 0,
          timeCredits: Number(row.timeCredits) || 0,
          completedSessionsCount: row.completedSessionsCount || 0,
          skillsOffered: Array.isArray(row.skillsOffered) ? row.skillsOffered : (row.raw_data?.skillsOffered || []),
          skillsDesired: Array.isArray(row.skillsDesired) ? row.skillsDesired : (row.raw_data?.skillsDesired || []),
          badges: Array.isArray(row.badges) ? row.badges : (row.raw_data?.badges || ['Community Member']),
        }));
        setUsers(dbUsers);
      } else {
        // Derive community users from current marketplace skills if users table is empty
        const skillUsersMap = new Map<string, User>();
        for (const s of skills) {
          if (s.userId && !skillUsersMap.has(s.userId)) {
            skillUsersMap.set(s.userId, {
              id: s.userId,
              name: s.userName || 'Community Member',
              email: `${s.userId}@skillswap.local`,
              title: `${s.title} Mentor`,
              avatar: s.userAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${s.userId}`,
              bio: s.description || 'Active peer teacher on SkillSwap.',
              location: s.userLocation || 'Global Remote',
              rating: s.userRating || 5.0,
              reviewCount: s.userReviewCount || 0,
              timeCredits: 5,
              completedSessionsCount: 0,
              skillsOffered: [s.title],
              skillsDesired: [],
              badges: ['Skill Creator'],
            });
          }
        }
        setUsers(Array.from(skillUsersMap.values()));
      }
    } catch (err: any) {
      console.warn('[UserDirectory] Notice loading users:', err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  // Filter users by search query
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;

      const matchName = user.name.toLowerCase().includes(q);
      const matchBio = user.bio ? user.bio.toLowerCase().includes(q) : false;
      const matchTitle = user.title ? user.title.toLowerCase().includes(q) : false;
      const matchLocation = user.location ? user.location.toLowerCase().includes(q) : false;
      const matchOffered = user.skillsOffered?.some(s => s.toLowerCase().includes(q));
      const matchDesired = user.skillsDesired?.some(s => s.toLowerCase().includes(q));

      return matchName || matchBio || matchTitle || matchLocation || matchOffered || matchDesired;
    });
  }, [users, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl max-h-[90dvh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Community Members Directory
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {users.length} Members
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Browse fellow members, read their bios, and discover skills to swap.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchUsers}
              disabled={loading}
              title="Refresh member list from database"
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="px-6 py-3 border-b border-slate-800/80 bg-slate-900/50 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search members by name, bio keywords, or skill offerings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Members Cards Scrollable List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading && users.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="w-8 h-8 mx-auto text-indigo-400 animate-spin" />
              <p className="text-sm text-slate-400">Loading community members from Supabase...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <Users className="w-10 h-10 mx-auto text-slate-600" />
              <p className="text-base font-semibold text-slate-300">No members match "{searchQuery}"</p>
              <p className="text-xs text-slate-500">Try searching for a different name, skill, or keyword.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredUsers.map((member) => {
                // Find all public skills posted by this member
                const memberSkills = skills.filter(
                  s => s.userId === member.id || s.userName.toLowerCase() === member.name.toLowerCase()
                );

                return (
                  <div
                    key={member.id}
                    className="flex flex-col justify-between bg-slate-800/60 border border-slate-700/70 hover:border-slate-600 rounded-xl p-4 transition-all hover:shadow-lg hover:shadow-indigo-500/5 group"
                  >
                    <div className="space-y-3">
                      {/* Member Header: Avatar, Name, Title, Location */}
                      <div className="flex items-start gap-3">
                        <div className="relative flex-shrink-0">
                          <img
                            src={member.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${member.id}`}
                            alt={member.name}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${member.name}`;
                            }}
                            className="w-12 h-12 rounded-xl object-cover ring-2 ring-indigo-500/20"
                          />
                          <span
                            className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-800 ${
                              isUserOnline(member.id) ? 'bg-emerald-400' : 'bg-slate-500'
                            }`}
                            title={getUserPresenceLabel(member.id)}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="font-bold text-slate-100 text-sm truncate">
                              {member.name}
                            </h3>
                            <span title="Verified Member">
                              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                            </span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full border ${
                              isUserOnline(member.id) 
                                ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300' 
                                : 'bg-slate-900 border-slate-700 text-slate-400'
                            }`}>
                              {getUserPresenceLabel(member.id)}
                            </span>
                          </div>
                          
                          {member.title && (
                            <p className="text-xs text-indigo-300 font-medium truncate">
                              {member.title}
                            </p>
                          )}

                          {member.location && (
                            <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                              <MapPin className="w-3 h-3 text-slate-500 flex-shrink-0" />
                              {member.location}
                            </p>
                          )}
                        </div>

                        {/* Rating Badge */}
                        <div className="flex items-center gap-1 px-2 py-1 bg-slate-900/80 border border-slate-700/60 rounded-lg text-xs font-semibold text-amber-300 flex-shrink-0">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>{member.rating ? member.rating.toFixed(1) : '5.0'}</span>
                        </div>
                      </div>

                      {/* Prominent Member Bio Block */}
                      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 leading-relaxed relative">
                        <span className="text-slate-500 font-serif text-lg leading-none absolute -top-1 left-2 select-none opacity-40">“</span>
                        <p className="pl-2 line-clamp-3">
                          {member.bio || 'Passionate peer learner and mentor ready to exchange skills and collaborate.'}
                        </p>
                      </div>

                      {/* Skills Offered Pills */}
                      {member.skillsOffered && member.skillsOffered.length > 0 && (
                        <div>
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                            Skills Offered
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {member.skillsOffered.slice(0, 3).map((skillName, idx) => (
                              <span
                                key={idx}
                                className="text-[11px] px-2 py-0.5 bg-indigo-950/60 text-indigo-300 border border-indigo-800/40 rounded-md font-medium"
                              >
                                {skillName}
                              </span>
                            ))}
                            {member.skillsOffered.length > 3 && (
                              <span className="text-[10px] text-slate-400 px-1 py-0.5">
                                +{member.skillsOffered.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>{member.timeCredits ?? 0} hrs balance</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {onStartChatWithUser && (
                          <button
                            type="button"
                            onClick={() => {
                              onStartChatWithUser(member);
                              onClose();
                            }}
                            className="px-3 py-1.5 bg-purple-950/80 hover:bg-purple-900 text-purple-200 border border-purple-500/40 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                            title={`Direct Message ${member.name}`}
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                            <span>Message</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            onSelectUserForSkillFilter(member.name);
                            onClose();
                            showToast(`🔍 Showing skills offered by ${member.name}`);
                          }}
                          className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                          <span>View Skills</span>
                        </button>

                        {memberSkills.length > 0 && onOpenProposeModal && (
                          <button
                            onClick={() => {
                              onOpenProposeModal(memberSkills[0]);
                              onClose();
                            }}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 shadow-sm cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Swap</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs text-slate-400">
          <span>Connected to Supabase Realtime Directory</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
