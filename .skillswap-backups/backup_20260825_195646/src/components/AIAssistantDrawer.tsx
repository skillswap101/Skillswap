import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Send, 
  Bot, 
  Lightbulb, 
  Map, 
  CheckCircle2, 
  Zap, 
  ArrowRight,
  HelpCircle
} from 'lucide-react';
import { Skill, User } from '../types';

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  skills: Skill[];
  onOpenRoadmap?: (skillTitle: string) => void;
  showToast: (msg: string) => void;
}

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({
  isOpen,
  onClose,
  currentUser,
  skills,
  onOpenRoadmap,
  showToast,
}) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'ai'; text: string; suggestions?: string[] }>>([
    {
      sender: 'ai',
      text: `Hello ${currentUser.name}! I am your AI SkillSwap Mentor Assistant powered by Gemini. Ask me for personalized swap advice, session icebreakers, or request a custom learning roadmap!`,
      suggestions: [
        'How do Escrow Time Credits work?',
        'Help me structure my 1-on-1 teaching session',
        'What skills match best with my background?'
      ]
    }
  ]);

  if (!isOpen) return null;

  const handleAsk = async (textToAsk?: string) => {
    const q = textToAsk || query;
    if (!q.trim() || loading) return;

    const userMsg = q;
    setQuery('');
    setChatHistory((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userQuery: userMsg, contextSkill: currentUser.offeredSkills[0] || 'General' }),
      });

      if (!res.ok) throw new Error('Network error');
      const data = await res.json();

      setChatHistory((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: data.answer || 'I am ready to help you swap skills!',
          suggestions: data.suggestions || ['Ask about Escrow', 'Create proposal pitch']
        }
      ]);
    } catch (err) {
      setChatHistory((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: `Here is a tip for your skill exchange: Lock your 1 Time Credit in Escrow before starting your call, prepare 3 clear goals, and exchange feedback after the session!`,
          suggestions: ['How to release Escrow points?', 'Best practices for mentors']
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                <span>AI Skill Mentor</span>
                <span className="px-1.5 py-0.2 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded text-[9px] font-mono">
                  Gemini
                </span>
              </h3>
              <p className="text-[10px] text-slate-400">Intelligent 1-on-1 swap guidance & roadmaps</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick AI Tools Chips */}
        <div className="p-3 bg-slate-950/60 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0 text-xs">
          <button
            onClick={() => handleAsk('Explain how Escrow protection works')}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Escrow Guide</span>
          </button>

          <button
            onClick={() => handleAsk('Give me a template for session goals and icebreakers')}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Lightbulb className="w-3 h-3 text-purple-400" />
            <span>Session Template</span>
          </button>
        </div>

        {/* Conversation Body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 custom-scrollbar">
          {chatHistory.map((msg, index) => (
            <div key={index} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[88%] p-3 rounded-2xl text-xs space-y-1.5 ${
                msg.sender === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-none shadow-md'
                  : 'bg-slate-800/90 text-slate-200 border border-slate-700/80 rounded-bl-none shadow'
              }`}>
                <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
              </div>

              {/* Suggestions chips */}
              {msg.suggestions && (
                <div className="mt-2 flex flex-wrap gap-1.5 max-w-[90%]">
                  {msg.suggestions.map((sug, i) => (
                    <button
                      key={i}
                      onClick={() => handleAsk(sug)}
                      className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 rounded-lg text-[10px] font-medium transition-colors text-left cursor-pointer flex items-center gap-1"
                    >
                      <span>{sug}</span>
                      <ArrowRight className="w-2.5 h-2.5 text-indigo-400 shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-medium p-2 bg-slate-800/50 rounded-xl border border-slate-700/50 w-fit animate-pulse">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              <span>Gemini is generating response...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={(e) => { e.preventDefault(); handleAsk(); }} className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2 shrink-0">
          <input
            type="text"
            placeholder="Ask AI for swap tips, icebreakers, goals..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};
