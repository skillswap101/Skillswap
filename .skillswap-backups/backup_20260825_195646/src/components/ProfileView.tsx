import React, { useState } from 'react';
import { 
  User as UserIcon, 
  Award, 
  Clock, 
  Star, 
  MapPin, 
  CheckCircle2, 
  Plus, 
  X, 
  Edit3, 
  Sparkles,
  BookOpen,
  ArrowRightLeft,
  Camera,
  Settings,
  ShieldCheck
} from 'lucide-react';
import { User, Skill, Review } from '../types';
import { LearningAnalytics } from './LearningAnalytics';
import { GamificationBadges } from './GamificationBadges';
import { PeerRatingsChart } from './PeerRatingsChart';
import { SkillCertificationsSection } from './SkillCertificationsSection';

interface ProfileViewProps {
  currentUser: User;
  onUpdateUser: (updated: User) => void;
  userSkills: Skill[];
  reviews: Review[];
  onOpenPostSkill: () => void;
  showToast?: (msg: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  onUpdateUser,
  userSkills,
  reviews,
  onOpenPostSkill,
  showToast = (msg) => console.log(msg),
}) => {
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState(currentUser.bio);
  const [newDesiredInput, setNewDesiredInput] = useState('');

  const handleSaveBio = () => {
    onUpdateUser({ ...currentUser, bio: bioInput });
    setIsEditingBio(false);
  };

  const handleAddDesiredSkill = () => {
    if (!newDesiredInput.trim()) return;
    onUpdateUser({
      ...currentUser,
      skillsDesired: [...currentUser.skillsDesired, newDesiredInput.trim()],
    });
    setNewDesiredInput('');
  };

  const handleRemoveDesiredSkill = (index: number) => {
    const updated = [...currentUser.skillsDesired];
    updated.splice(index, 1);
    onUpdateUser({ ...currentUser, skillsDesired: updated });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Profile Header Banner */}
      <div className="relative rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative group cursor-pointer">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-20 h-20 rounded-full object-cover border-4 border-indigo-500/50 shadow-xl group-hover:opacity-80 transition-opacity"
              />
              <label className="absolute inset-0 flex items-center justify-center bg-slate-950/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera className="w-6 h-6 text-indigo-300" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        if (typeof reader.result === 'string') {
                          onUpdateUser({ ...currentUser, avatar: reader.result });
                          showToast('Profile picture updated successfully!');
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="hidden"
                />
              </label>
              <span className="absolute bottom-0 right-0 w-5 h-5 bg-emerald-500 rounded-full border-2 border-slate-900 shadow-sm" title="Online" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white">{currentUser.name}</h1>
                <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold rounded-full">
                  Verified Member
                </span>
              </div>
              <p className="text-xs text-indigo-300 font-semibold">{currentUser.title}</p>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500" /> {currentUser.location} • Member since {currentUser.memberSince}
              </p>
            </div>
          </div>

          {/* Key Stat Counters */}
          <div className="grid grid-cols-3 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 shrink-0 w-full sm:w-auto">
            <div className="text-center px-2">
              <p className="text-lg font-extrabold text-indigo-400">{currentUser.hoursTaught}h</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Taught</p>
            </div>
            <div className="text-center px-2 border-x border-slate-800">
              <p className="text-lg font-extrabold text-purple-400">{currentUser.hoursLearned}h</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Learned</p>
            </div>
            <div className="text-center px-2">
              <p className="text-lg font-extrabold text-amber-400 flex items-center justify-center gap-0.5">
                <Star className="w-4 h-4 fill-current" /> {currentUser.rating.toFixed(1)}
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Rating</p>
            </div>
          </div>
        </div>

        {/* Reputation Badges */}
        <div className="flex flex-wrap items-center gap-2 pt-6 border-t border-slate-800/80 mt-6">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">Badges:</span>
          {currentUser.badges.map((badge, idx) => (
            <span
              key={idx}
              className="px-3 py-1 bg-indigo-950/80 text-indigo-200 border border-indigo-700/50 rounded-full text-xs font-bold shadow-sm flex items-center gap-1"
            >
              <Award className="w-3.5 h-3.5 text-amber-400" />
              {badge}
            </span>
          ))}
        </div>
      </div>

      {/* Bio Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">About Me</h2>
          <button
            onClick={() => setIsEditingBio(!isEditingBio)}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
          >
            <Edit3 className="w-3.5 h-3.5" />
            {isEditingBio ? 'Cancel' : 'Edit Bio'}
          </button>
        </div>

        {isEditingBio ? (
          <div className="space-y-3">
            <textarea
              rows={3}
              value={bioInput}
              onChange={(e) => setBioInput(e.target.value)}
              className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={handleSaveBio}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
            >
              Save Bio
            </button>
          </div>
        ) : (
          <p className="text-xs text-slate-300 leading-relaxed">{currentUser.bio}</p>
        )}
      </div>

      {/* 30-Day Learning & Teaching Analytics Section */}
      <LearningAnalytics />

      {/* Peer-to-Peer Quality & Ratings Chart Matrix */}
      <PeerRatingsChart reviews={reviews} />

      {/* Gamification Badges & Reputation Gallery */}
      <GamificationBadges />

      {/* Cryptographically Signed Skill Certificates */}
      <SkillCertificationsSection currentUser={currentUser} showToast={showToast} />

      {/* Skills Offered vs Desired Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Skills I Can Teach */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span>Skills I Can Teach ({currentUser.skillsOffered.length})</span>
            </h2>
            <button
              onClick={onOpenPostSkill}
              className="text-xs px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-colors flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Offer New
            </button>
          </div>

          <div className="space-y-2">
            {currentUser.skillsOffered.map((skill, idx) => (
              <div key={idx} className="p-3 bg-slate-800/80 border border-slate-700/60 rounded-xl flex items-center justify-between text-xs font-semibold text-slate-200">
                <span>{skill}</span>
                <span className="px-2 py-0.5 bg-indigo-950 text-indigo-300 text-[10px] rounded-md border border-indigo-800">
                  Active
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Skills I Want to Learn */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-purple-400" />
            <span>Skills I Want to Learn ({currentUser.skillsDesired.length})</span>
          </h2>

          <div className="space-y-2">
            {currentUser.skillsDesired.map((skill, idx) => (
              <div key={idx} className="p-3 bg-slate-800/80 border border-slate-700/60 rounded-xl flex items-center justify-between text-xs font-semibold text-purple-200">
                <span>{skill}</span>
                <button
                  onClick={() => handleRemoveDesiredSkill(idx)}
                  className="text-slate-500 hover:text-rose-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}

            {/* Add Desired Skill Bar */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="text"
                placeholder="Add goal skill (e.g. French, Woodworking)..."
                value={newDesiredInput}
                onChange={(e) => setNewDesiredInput(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={handleAddDesiredSkill}
                className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl"
              >
                Add Goal
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
