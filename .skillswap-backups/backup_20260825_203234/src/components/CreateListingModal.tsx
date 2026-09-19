import React, { useState } from 'react';
import {
  X,
  Sparkles,
  BookOpen,
  Tag,
  Clock,
  Check,
  Loader2,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { UserProfile, SkillCategory, ListingType } from '../types';
import { api } from '../lib/api';

interface CreateListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onSuccess: () => void;
}

const CATEGORIES: SkillCategory[] = [
  'Coding & Tech',
  'Languages',
  'AI & Data Science',
  'Design & Creative',
  'Music & Audio',
  'Cooking & Culinary',
  'Business & Finance',
  'Health & Wellness',
];

export const CreateListingModal: React.FC<CreateListingModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSuccess,
}) => {
  const [type, setType] = useState<ListingType>('offer');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<SkillCategory>('Coding & Tech');
  const [description, setDescription] = useState('');
  const [hourlyRate, setHourlyRate] = useState(1);
  const [level, setLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'>('Intermediate');
  const [tagsInput, setTagsInput] = useState('');
  const [syllabusInput, setSyllabusInput] = useState('');

  const [aiEnhancing, setAiEnhancing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAiEnhance = async () => {
    if (!title.trim() && !description.trim()) {
      setErrorMsg('Please enter at least a rough title or description for the AI to enhance.');
      return;
    }
    setAiEnhancing(true);
    setErrorMsg(null);
    try {
      const res = await api.enhanceListing(title, category, description);
      if (res.enhancedTitle) setTitle(res.enhancedTitle);
      if (res.professionalDescription) setDescription(res.professionalDescription);
      if (res.syllabus && Array.isArray(res.syllabus)) {
        setSyllabusInput(res.syllabus.join('\n'));
      }
      if (res.recommendedTags && Array.isArray(res.recommendedTags)) {
        setTagsInput(res.recommendedTags.join(', '));
      }
    } catch (err: any) {
      console.warn('AI enhancement fallback:', err.message);
    } finally {
      setAiEnhancing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setErrorMsg('Please provide a title and description');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const tags = tagsInput
      .split(',')
      .map(t => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    const syllabus = syllabusInput
      .split('\n')
      .map(s => s.trim().replace(/^[-*•\d.]\s*/, ''))
      .filter(Boolean);

    try {
      await api.createListing({
        userId: currentUser.id,
        type,
        title,
        category,
        description,
        skillsExchanged: currentUser.skillsWanted,
        hourlyRateCredits: hourlyRate,
        experienceLevel: level,
        tags: tags.length > 0 ? tags : [category.replace(/[^a-zA-Z]/g, ''), 'SkillSwap'],
        syllabus: syllabus.length > 0 ? syllabus : ['1-on-1 walkthrough', 'Practical hands-on exercise'],
      });

      setSubmitting(false);
      onSuccess();
      onClose();
    } catch (err: any) {
      setSubmitting(false);
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base">Create New Skill Listing</h3>
              <p className="text-xs text-slate-400">Offer your expertise or request a 1-on-1 mentor</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Type Toggle: Offer vs Request */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Listing Objective
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('offer')}
                className={`py-2 px-3 rounded-xl border font-bold transition-all text-center ${
                  type === 'offer'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-600/30'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                🎓 I want to Offer & Teach a Skill
              </button>
              <button
                type="button"
                onClick={() => setType('request')}
                className={`py-2 px-3 rounded-xl border font-bold transition-all text-center ${
                  type === 'request'
                    ? 'border-amber-600 bg-amber-50 text-amber-800 ring-2 ring-amber-600/30'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                🙋 I am Seeking a Mentor to Learn From
              </button>
            </div>
          </div>

          {/* Title with AI Enhance Button */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-700 uppercase tracking-wider">Skill Title</label>
              <button
                type="button"
                onClick={handleAiEnhance}
                disabled={aiEnhancing}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-200 transition-colors"
              >
                {aiEnhancing ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Enhancing with Gemini...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    AI Auto-Enhance Listing
                  </>
                )}
              </button>
            </div>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Master React 19, TypeScript & Zustand State Architecture"
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Category & Experience Level */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as SkillCategory)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Experience Level
              </label>
              <select
                value={level}
                onChange={e => setLevel(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Beginner">Beginner Friendly</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="Expert">Expert / Master</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Description & Learning Outcomes
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe what you will cover, prerequisite knowledge, and format of the 1-on-1 swap session..."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Syllabus Milestones */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Suggested Syllabus / Milestones (1 per line)
            </label>
            <textarea
              rows={2}
              value={syllabusInput}
              onChange={e => setSyllabusInput(e.target.value)}
              placeholder="1. Assessment of current level&#10;2. Interactive live coding demo&#10;3. Hands-on practice and feedback"
              className="w-full px-3 py-2 font-mono text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Hourly Rate & Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Hourly Time Credits
              </label>
              <input
                type="number"
                min={0.5}
                max={5}
                step={0.5}
                value={hourlyRate}
                onChange={e => setHourlyRate(parseFloat(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={e => setTagsInput(e.target.value)}
                placeholder="React, TypeScript, Nextjs, Frontend"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-all"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Publish Listing
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
