import React, { useState } from 'react';
import {
  FolderGit2,
  ExternalLink,
  Github,
  Figma,
  Globe,
  Plus,
  Trash2,
  X,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { UserProfile } from '../types';

interface PortfolioModalProps {
  user: UserProfile;
  onClose: () => void;
}

interface PortfolioItem {
  id: string;
  title: string;
  category: string;
  url: string;
  type: 'github' | 'figma' | 'live' | 'article';
  description: string;
  verified: boolean;
}

export const PortfolioShowcaseModal: React.FC<PortfolioModalProps> = ({ user, onClose }) => {
  const [items, setItems] = useState<PortfolioItem[]>([
    {
      id: 'p1',
      title: 'Full-Stack Escrow Protocol & Real-time WebRTC Canvas',
      category: 'Coding & Tech',
      url: 'https://github.com/skillswap/escrow-webrtc-core',
      type: 'github',
      description: 'Zero-trust time banking contract engine with peer review verification.',
      verified: true,
    },
    {
      id: 'p2',
      title: 'Interactive Design System & Dark Mode UI Tokens',
      category: 'Design & Creative',
      url: 'https://figma.com/@skillswap/design-system-tokens',
      type: 'figma',
      description: 'Accessible WCAG AA component library with Tailwind CSS integration.',
      verified: true,
    },
    {
      id: 'p3',
      title: 'Conversational Swahili & French Language Tutor Guides',
      category: 'Languages',
      url: 'https://notion.so/skillswap-swahili-curriculum',
      type: 'live',
      description: 'Interactive audio flashcards and situational dialogue scenarios.',
      verified: false,
    },
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newCategory, setNewCategory] = useState('Coding & Tech');
  const [newType, setNewType] = useState<'github' | 'figma' | 'live' | 'article'>('github');
  const [newDesc, setNewDesc] = useState('');

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newUrl) return;

    const newItem: PortfolioItem = {
      id: 'p_' + Date.now(),
      title: newTitle,
      url: newUrl,
      category: newCategory,
      type: newType,
      description: newDesc || 'Verified student and mentor project demonstration.',
      verified: true,
    };

    setItems(prev => [newItem, ...prev]);
    setNewTitle('');
    setNewUrl('');
    setNewDesc('');
    setShowAddForm(false);
  };

  const handleDeleteItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'github':
        return <Github className="w-4 h-4 text-slate-200" />;
      case 'figma':
        return <Figma className="w-4 h-4 text-purple-400" />;
      default:
        return <Globe className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 text-slate-100 shadow-2xl relative my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-lg">
              <FolderGit2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Portfolio & Proof of Work</h3>
              <p className="text-xs text-slate-400">
                Verified work samples from <strong className="text-slate-200">{user.name}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-colors mr-8"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showAddForm ? 'Close Form' : 'Add Project'}</span>
          </button>
        </div>

        {/* Add Project Form */}
        {showAddForm && (
          <form onSubmit={handleAddItem} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-5 space-y-3">
            <div className="font-bold text-xs text-white">Add New Portfolio Project</div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                required
                placeholder="Project Title"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-xs text-white p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <input
                type="url"
                required
                placeholder="Repository or Demo URL"
                value={newUrl}
                onChange={e => setNewUrl(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-xs text-white p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                value={newType}
                onChange={e => setNewType(e.target.value as any)}
                className="bg-slate-900 border border-slate-800 text-xs text-white p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="github">GitHub Repository</option>
                <option value="figma">Figma Design File</option>
                <option value="live">Live Web Application</option>
                <option value="article">Curriculum / Article</option>
              </select>

              <input
                type="text"
                placeholder="Category (e.g. Coding & Tech)"
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-xs text-white p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <textarea
              rows={2}
              placeholder="Short description of what was built..."
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 text-xs text-white p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />

            <button
              type="submit"
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
            >
              Save Project to Showcase
            </button>
          </form>
        )}

        {/* Portfolio Items List */}
        <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
          {items.map(item => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all flex items-start justify-between gap-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                  {getIcon(item.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-xs text-white">{item.title}</h4>
                    {item.verified && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3" />
                        Verified Peer Proof
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{item.description}</p>
                  <div className="text-[10px] text-indigo-400 font-mono mt-1.5 flex items-center gap-2">
                    <span>{item.category}</span>
                    <span>•</span>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline flex items-center gap-1 text-slate-300 hover:text-white"
                    >
                      <span>{item.url.replace(/^https?:\/\//, '').slice(0, 32)}...</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </a>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleDeleteItem(item.id)}
                className="p-2 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-900 transition-colors"
                title="Remove Item"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-colors"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
