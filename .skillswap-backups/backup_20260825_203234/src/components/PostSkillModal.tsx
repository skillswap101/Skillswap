import React, { useState } from 'react';
import { X, PlusCircle, Sparkles, Check, Image as ImageIcon, Video, Upload, Film } from 'lucide-react';
import { Skill, SkillCategory, DeliveryMode, SkillLevel, SwapType, User } from '../types';

interface PostSkillModalProps {
  currentUser: User;
  onClose: () => void;
  onAddSkill: (newSkill: Skill) => void;
}

const PRESET_IMAGES = [
  'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
];

export const PostSkillModal: React.FC<PostSkillModalProps> = ({
  currentUser,
  onClose,
  onAddSkill,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<SkillCategory>('Tech & Dev');
  const [level, setLevel] = useState<SkillLevel>('All Levels');
  const [delivery, setDelivery] = useState<DeliveryMode>('Online');
  const [swapType, setSwapType] = useState<SwapType>('Flexible');
  const [description, setDescription] = useState('');
  const [skillsDesiredInput, setSkillsDesiredInput] = useState('');
  const [selectedImage, setSelectedImage] = useState(PRESET_IMAGES[0]);
  const [previewVideoUrl, setPreviewVideoUrl] = useState('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const desiredList = skillsDesiredInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const newSkillObj: Skill = {
      id: `sk_${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      userRating: 5.0,
      userReviewCount: 1,
      userLocation: currentUser.location,
      category,
      title,
      description,
      level,
      delivery,
      swapType,
      skillsDesiredInReturn: desiredList.length > 0 ? desiredList : ['Conversational Spanish', 'Photography'],
      tags: [category, level, delivery],
      image: selectedImage,
      previewVideoUrl: previewVideoUrl.trim() || undefined,
      featured: true,
      verified: true,
      hoursOffered: 10,
      availability: ['Flexible Hours', 'Weekends'],
      learningObjectives: ['Master fundamental principles', 'Hands-on project work'],
    };

    onAddSkill(newSkillObj);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl overflow-hidden shadow-2xl my-8 text-slate-100 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Offer / List a New Skill</h2>
              <p className="text-xs text-slate-400">Share your knowledge with the SkillSwap community</p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
              Skill Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Modern React & Web Development, Conversational Spanish..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as SkillCategory)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200"
              >
                <option value="Tech & Dev">Tech & Dev</option>
                <option value="Languages">Languages</option>
                <option value="Design & Creative">Design & Creative</option>
                <option value="Music & Audio">Music & Audio</option>
                <option value="Fitness & Wellness">Fitness & Wellness</option>
                <option value="Business & Marketing">Business & Marketing</option>
                <option value="Crafts & Cooking">Crafts & Cooking</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Proficiency Level
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as SkillLevel)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="All Levels">All Levels</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Delivery Mode
              </label>
              <select
                value={delivery}
                onChange={(e) => setDelivery(e.target.value as DeliveryMode)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200"
              >
                <option value="Online">Online Video Call</option>
                <option value="In-Person">In-Person</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Swap Type Preference
              </label>
              <select
                value={swapType}
                onChange={(e) => setSwapType(e.target.value as SwapType)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200"
              >
                <option value="Flexible">Flexible (Direct or Credits)</option>
                <option value="Direct Swap">Direct Swap Only</option>
                <option value="Time Credits">Time Credits Only</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
              Skills Desired in Return (Comma Separated)
            </label>
            <input
              type="text"
              placeholder="e.g. Conversational Spanish, Photography, Guitar"
              value={skillsDesiredInput}
              onChange={(e) => setSkillsDesiredInput(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
              Description & Syllabus
            </label>
            <textarea
              rows={3}
              required
              placeholder="Describe what you will teach, your experience level, and what a typical session looks like..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between mb-1">
              <span className="flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-indigo-400" />
                Skill Showcase Video URL or Upload
              </span>
              <span className="text-[10px] font-semibold text-indigo-300">Optional Video Preview</span>
            </label>
            
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="https://example.com/demo.mp4 or sample video link"
                  value={previewVideoUrl}
                  onChange={(e) => setPreviewVideoUrl(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:ring-2 focus:ring-indigo-500"
                />
                
                <label className="px-3 py-2 bg-indigo-950 hover:bg-indigo-900 border border-indigo-700 text-indigo-300 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1 shrink-0">
                  <Upload className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Choose Clip</span>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          if (typeof reader.result === 'string') {
                            setPreviewVideoUrl(reader.result);
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Drag and Drop Box */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file && file.type.startsWith('video/')) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      if (typeof reader.result === 'string') {
                        setPreviewVideoUrl(reader.result);
                      }
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="p-3 border-2 border-dashed border-slate-700 hover:border-indigo-500/60 rounded-xl bg-slate-950/40 text-center transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-center gap-2 text-slate-400 group-hover:text-indigo-300">
                  <Film className="w-4 h-4 text-indigo-400" />
                  <span className="text-[11px] font-semibold">Drag & Drop MP4 / WebM Video File Here</span>
                </div>
              </div>

              {previewVideoUrl && (
                <div className="rounded-xl overflow-hidden border border-slate-700 bg-black mt-2">
                  <div className="bg-slate-900 px-3 py-1 text-[10px] text-slate-400 font-bold flex justify-between items-center border-b border-slate-800">
                    <span className="text-emerald-400 font-mono">✓ Active Video Preview Loaded</span>
                    <button
                      type="button"
                      onClick={() => setPreviewVideoUrl('')}
                      className="text-rose-400 hover:underline"
                    >
                      Remove Video
                    </button>
                  </div>
                  <video
                    src={previewVideoUrl}
                    controls
                    className="w-full h-36 object-cover"
                  />
                </div>
              )}

              <p className="text-[10px] text-slate-400">
                Learners can watch your video demonstration directly on your skill details & interactive preview modal!
              </p>
            </div>
          </div>

          {/* Preset Image Chooser */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
              Choose Cover Image
            </label>
            <div className="grid grid-cols-5 gap-2">
              {PRESET_IMAGES.map((imgUrl, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedImage(imgUrl)}
                  className={`h-16 rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                    selectedImage === imgUrl ? 'border-indigo-500 scale-105' : 'border-slate-800 opacity-60'
                  }`}
                >
                  <img src={imgUrl} alt="Preset Cover" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white">
              Cancel
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30"
            >
              Publish Skill Listing
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
