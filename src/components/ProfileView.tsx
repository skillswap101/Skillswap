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
  ShieldCheck,
  Globe,
  Languages,
  Eye,
  Check
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
  const [bioInput, setBioInput] = useState(currentUser.bio || '');
  const [titleInput, setTitleInput] = useState(currentUser.title || '');
  const [newDesiredInput, setNewDesiredInput] = useState('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isPolishing, setIsPolishing] = useState(false);
  
  // Social links state
  const [socialGithub, setSocialGithub] = useState(currentUser.socialLinks?.github || '');
  const [socialLinkedin, setSocialLinkedin] = useState(currentUser.socialLinks?.linkedin || '');
  const [socialWebsite, setSocialWebsite] = useState(currentUser.socialLinks?.website || '');

  // Languages state
  const [languagesList, setLanguagesList] = useState(currentUser.languages || [
    { language: 'English', fluency: 'Native' as const },
    { language: 'Spanish', fluency: 'Conversational' as const }
  ]);
  const [newLangName, setNewLangName] = useState('');
  const [newLangFluency, setNewLangFluency] = useState<'Native' | 'Fluent' | 'Conversational' | 'Learning'>('Fluent');

  const handleSaveBio = () => {
    onUpdateUser({ 
      ...currentUser, 
      bio: bioInput,
      title: titleInput || currentUser.title,
      languages: languagesList,
      socialLinks: {
        github: socialGithub.trim() || undefined,
        linkedin: socialLinkedin.trim() || undefined,
        website: socialWebsite.trim() || undefined
      }
    });
    setIsEditingBio(false);
    showToast('✨ Profile bio and credentials saved successfully!');
  };

  const handleAIPolishBio = () => {
    if (!bioInput.trim()) {
      showToast('⚠️ Please enter a few draft sentences first to polish.');
      return;
    }
    setIsPolishing(true);
    setTimeout(() => {
      const polished = `Passionate mentor with a focus on practical, hands-on learning. ${bioInput.trim().replace(/\.+$/, '')}. Dedicated to exchanging knowledge, breaking down complex topics into clear milestones, and collaborating on real-world projects.`;
      setBioInput(polished);
      setIsPolishing(false);
      showToast('🪄 Bio polished with active peer-learning voice!');
    }, 600);
  };

  const handleAddLanguage = () => {
    if (!newLangName.trim()) return;
    if (languagesList.some(l => l.language.toLowerCase() === newLangName.trim().toLowerCase())) {
      showToast('⚠️ Language already added.');
      return;
    }
    setLanguagesList([...languagesList, { language: newLangName.trim(), fluency: newLangFluency }]);
    setNewLangName('');
  };

  const handleRemoveLanguage = (index: number) => {
    setLanguagesList(languagesList.filter((_, idx) => idx !== index));
  };

  const handleAddDesiredSkill = () => {
    if (!newDesiredInput.trim()) return;
    onUpdateUser({
      ...currentUser,
      skillsDesired: [...(currentUser.skillsDesired || []), newDesiredInput.trim()],
    });
    setNewDesiredInput('');
  };

  const handleRemoveDesiredSkill = (index: number) => {
    const updated = [...(currentUser.skillsDesired || [])];
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
                <Star className="w-4 h-4 fill-current" /> {(currentUser.rating ?? 5.0).toFixed(1)}
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Rating</p>
            </div>
          </div>
        </div>

        {/* Reputation Badges */}
        <div className="flex flex-wrap items-center gap-2 pt-6 border-t border-slate-800/80 mt-6">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">Badges:</span>
          {(currentUser.badges || []).map((badge, idx) => (
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

      {/* Enhanced Bio & Credentials Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-indigo-400" />
              <span>About Me & Public Bio</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              This information is displayed to all community members in the Directory.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isEditingBio && (
              <button
                type="button"
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                className={`text-xs px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                  isPreviewMode
                    ? 'bg-indigo-600 border-indigo-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{isPreviewMode ? 'Back to Editor' : 'Directory Preview'}</span>
              </button>
            )}

            <button
              onClick={() => {
                setIsEditingBio(!isEditingBio);
                setIsPreviewMode(false);
              }}
              className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-indigo-300 hover:text-white font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              {isEditingBio ? 'Done / Close' : 'Edit Bio & Credentials'}
            </button>
          </div>
        </div>

        {isEditingBio ? (
          isPreviewMode ? (
            /* Live Member Directory Card Preview */
            <div className="p-4 bg-slate-950/80 border border-indigo-500/40 rounded-2xl space-y-3">
              <div className="flex items-center justify-between text-[11px] text-indigo-300 font-bold uppercase tracking-wider">
                <span>Directory Card Preview</span>
                <span className="px-2 py-0.5 bg-indigo-500/20 rounded-md">Live Preview</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-12 h-12 rounded-xl object-cover ring-2 ring-indigo-500/30"
                  />
                  <div>
                    <h3 className="font-bold text-slate-100 text-sm">{currentUser.name}</h3>
                    <p className="text-xs text-indigo-300 font-medium">{titleInput || currentUser.title}</p>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-500" /> {currentUser.location}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 leading-relaxed">
                  <p>“{bioInput || 'No bio provided yet.'}”</p>
                </div>

                {languagesList.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Languages:</span>
                    {languagesList.map((lang, idx) => (
                      <span key={idx} className="text-[11px] px-2 py-0.5 bg-slate-800 text-slate-300 rounded-md">
                        {lang.language} ({lang.fluency})
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Bio Editor Form */
            <div className="space-y-4 pt-2">
              {/* Headline / Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Professional Headline / Mentor Role
                </label>
                <input
                  type="text"
                  placeholder="e.g. Senior Frontend Architect & Language Coach"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Bio Description with AI Polish */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    Personal Bio & Exchange Goals
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 font-mono">
                      {bioInput.length} chars
                    </span>
                    <button
                      type="button"
                      onClick={handleAIPolishBio}
                      disabled={isPolishing}
                      className="text-[11px] px-2.5 py-1 bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-200 font-bold rounded-lg flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                      title="Refine bio with AI assistance"
                    >
                      <Sparkles className={`w-3 h-3 text-purple-400 ${isPolishing ? 'animate-spin' : ''}`} />
                      <span>{isPolishing ? 'Polishing...' : 'Polish with AI'}</span>
                    </button>
                  </div>
                </div>
                <textarea
                  rows={4}
                  value={bioInput}
                  onChange={(e) => setBioInput(e.target.value)}
                  placeholder="Describe your teaching philosophy, skills you offer, and what you are excited to learn in return..."
                  className="w-full p-3.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                />
              </div>

              {/* Spoken Languages Manager */}
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2.5">
                <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Languages className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Spoken Languages & Proficiency</span>
                </label>
                
                <div className="flex flex-wrap gap-2 mb-2">
                  {languagesList.map((lang, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 rounded-lg flex items-center gap-1.5"
                    >
                      <span>{lang.language}</span>
                      <span className="text-[10px] text-indigo-300 bg-indigo-950/80 px-1 rounded">
                        {lang.fluency}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveLanguage(idx)}
                        className="text-slate-400 hover:text-rose-400 ml-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <input
                    type="text"
                    placeholder="Language name (e.g. French, Japanese)..."
                    value={newLangName}
                    onChange={(e) => setNewLangName(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <select
                    value={newLangFluency}
                    onChange={(e) => setNewLangFluency(e.target.value as any)}
                    className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Native">Native</option>
                    <option value="Fluent">Fluent</option>
                    <option value="Conversational">Conversational</option>
                    <option value="Learning">Learning</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleAddLanguage}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Social & Portfolio Links */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    GitHub Profile
                  </label>
                  <input
                    type="text"
                    placeholder="https://github.com/username"
                    value={socialGithub}
                    onChange={(e) => setSocialGithub(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    LinkedIn URL
                  </label>
                  <input
                    type="text"
                    placeholder="https://linkedin.com/in/username"
                    value={socialLinkedin}
                    onChange={(e) => setSocialLinkedin(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Portfolio / Website
                  </label>
                  <input
                    type="text"
                    placeholder="https://myportfolio.dev"
                    value={socialWebsite}
                    onChange={(e) => setSocialWebsite(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Save & Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleSaveBio}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Profile & Bio</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingBio(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )
        ) : (
          /* View Mode */
          <div className="space-y-4">
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 text-xs text-slate-200 leading-relaxed relative">
              <span className="text-slate-600 font-serif text-2xl leading-none absolute -top-1 left-3 select-none opacity-40">“</span>
              <p className="pl-3">{currentUser.bio || 'No bio written yet. Click "Edit Bio & Credentials" to introduce yourself to the community!'}</p>
            </div>

            {/* Spoken Languages & Social Links Row */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
              {languagesList && languagesList.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Languages className="w-3.5 h-3.5 text-indigo-400" />
                    Languages:
                  </span>
                  {languagesList.map((lang, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-0.5 bg-indigo-950/50 text-indigo-300 border border-indigo-800/40 rounded-lg text-xs font-medium"
                    >
                      {lang.language} <span className="text-[10px] text-slate-400">({lang.fluency})</span>
                    </span>
                  ))}
                </div>
              )}

              {/* Social links badges */}
              {currentUser.socialLinks && (currentUser.socialLinks.github || currentUser.socialLinks.linkedin || currentUser.socialLinks.website) && (
                <div className="flex items-center gap-2">
                  {currentUser.socialLinks.github && (
                    <a
                      href={currentUser.socialLinks.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                    >
                      <span>GitHub</span>
                    </a>
                  )}
                  {currentUser.socialLinks.linkedin && (
                    <a
                      href={currentUser.socialLinks.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                    >
                      <span>LinkedIn</span>
                    </a>
                  )}
                  {currentUser.socialLinks.website && (
                    <a
                      href={currentUser.socialLinks.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                    >
                      <Globe className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Portfolio</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
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
              <span>Skills I Can Teach ({(currentUser.skillsOffered || []).length})</span>
            </h2>
            <button
              onClick={onOpenPostSkill}
              className="text-xs px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-colors flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Offer New
            </button>
          </div>

          <div className="space-y-2">
            {(currentUser.skillsOffered || []).map((skill, idx) => (
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
            <span>Skills I Want to Learn ({(currentUser.skillsDesired || []).length})</span>
          </h2>

          <div className="space-y-2">
            {(currentUser.skillsDesired || []).map((skill, idx) => (
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
