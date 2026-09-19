import React, { useState } from 'react';
import { 
  Settings, 
  User, 
  Camera, 
  Bell, 
  ShieldCheck, 
  Video, 
  Lock, 
  FileText, 
  Moon, 
  Sun, 
  X, 
  CheckCircle2, 
  Upload, 
  Clock, 
  Sparkles,
  Link as LinkIcon,
  LogOut
} from 'lucide-react';
import { User as UserType } from '../types';

interface SettingsHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserType;
  onUpdateUser: (updated: Partial<UserType>) => void;
  onOpenTermsPrivacy: () => void;
  onLogout: () => void;
  showToast: (msg: string) => void;
}

export const SettingsHubModal: React.FC<SettingsHubModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
  onOpenTermsPrivacy,
  onLogout,
  showToast,
}) => {
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatar || '');
  const [notifyProposals, setNotifyProposals] = useState(true);
  const [notifyEscrow, setNotifyEscrow] = useState(true);
  const [webrtcResolution, setWebrtcResolution] = useState<'720p' | '1080p'>('1080p');
  const [escrowPolicy, setEscrowPolicy] = useState<'24h' | '48h' | 'manual'>('24h');
  const [themePreference, setThemePreference] = useState<'dark' | 'contrast'>('dark');

  if (!isOpen) return null;

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({
      avatar: avatarUrl.trim() || currentUser.avatar,
    });
    showToast('⚙️ Settings & Profile preferences updated successfully!');
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setAvatarUrl(reader.result);
          showToast('Profile photo loaded! Click Save Settings to confirm.');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">SkillSwap Settings & Preferences</h2>
              <p className="text-[11px] text-slate-400">Manage account, video quality, notifications & privacy</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Settings Body */}
        <form onSubmit={handleSaveSettings} className="p-6 overflow-y-auto space-y-6 custom-scrollbar flex-1">
          
          {/* Profile Picture Change Section */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Profile Avatar & Identity
            </label>

            <div className="flex items-center gap-4">
              <img
                src={avatarUrl || currentUser.avatar}
                alt={currentUser.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-indigo-500 shadow-md shrink-0"
              />

              <div className="space-y-2 flex-1">
                <input
                  type="text"
                  placeholder="https://example.com/my-photo.jpg"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:ring-2 focus:ring-indigo-500"
                />

                <div className="flex items-center gap-2">
                  <label className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 border border-slate-700">
                    <Upload className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Upload Image File</span>
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                  <span className="text-[10px] text-slate-400">JPG, PNG or GIF</span>
                </div>
              </div>
            </div>
          </div>

          {/* Video & WebRTC Quality */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block flex items-center gap-1.5">
              <Video className="w-4 h-4 text-indigo-400" />
              <span>WebRTC Video Call Quality</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setWebrtcResolution('1080p')}
                className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${
                  webrtcResolution === '1080p'
                    ? 'bg-indigo-950/80 border-indigo-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                1080p HD Video
                <p className="text-[10px] font-normal text-slate-400 mt-0.5">High clarity for screen sharing</p>
              </button>
              <button
                type="button"
                onClick={() => setWebrtcResolution('720p')}
                className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${
                  webrtcResolution === '720p'
                    ? 'bg-indigo-950/80 border-indigo-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                720p Balanced
                <p className="text-[10px] font-normal text-slate-400 mt-0.5">Saves bandwidth on slow networks</p>
              </button>
            </div>
          </div>

          {/* Notifications Toggles */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-indigo-400" />
              <span>Notification Preferences</span>
            </label>

            <div className="space-y-2 bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-xs">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-bold text-white">Proposal & Swap Alerts</p>
                  <p className="text-[10px] text-slate-400">Receive instant alerts when a peer requests a session</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyProposals}
                  onChange={(e) => setNotifyProposals(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
              </label>

              <div className="border-t border-slate-800/80 pt-2" />

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-bold text-white">Escrow Settlement Alerts</p>
                  <p className="text-[10px] text-slate-400">Get notified when Time Credits are released to your vault</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyEscrow}
                  onChange={(e) => setNotifyEscrow(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
              </label>
            </div>
          </div>

          {/* Terms of Service & Privacy Policy Trigger */}
          <div className="p-4 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs font-extrabold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Governance & Legal Policies</span>
              </p>
              <p className="text-[10px] text-slate-300">View Terms of Service, Escrow rules, and Privacy Policy</p>
            </div>
            <button
              type="button"
              onClick={onOpenTermsPrivacy}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow"
            >
              Read Policies
            </button>
          </div>

          {/* Log Out */}
          <div className="p-4 bg-rose-950/30 border border-rose-500/30 rounded-2xl flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs font-extrabold text-white flex items-center gap-1.5">
                <LogOut className="w-4 h-4 text-rose-400" />
                <span>Log Out</span>
              </p>
              <p className="text-[10px] text-slate-300">Sign out of your SkillSwap account on this device</p>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow"
            >
              Log Out
            </button>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              Save Settings & Preferences
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
