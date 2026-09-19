import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  Wifi, 
  WifiOff, 
  MessageSquare, 
  ArrowRightLeft, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Radio, 
  Zap,
  RefreshCw,
  Send
} from 'lucide-react';
import { SwapProposal, ChatMessage, User } from '../types';
import { networkNotifier } from '../utils/networkNotifier';

export interface NotificationItem {
  id: string;
  type: 'proposal' | 'chat' | 'network' | 'system';
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  actionTab?: string;
  data?: any;
}

interface GlobalNotificationListenerProps {
  currentUser: User;
  proposals: SwapProposal[];
  messages: ChatMessage[];
  onNewProposalSimulated?: (proposal: SwapProposal) => void;
  onNewMessageSimulated?: (msg: ChatMessage) => void;
  showToast: (msg: string) => void;
  setActiveTab: (tab: string) => void;
}

export const GlobalNotificationListener: React.FC<GlobalNotificationListenerProps> = ({
  currentUser,
  proposals,
  messages,
  onNewProposalSimulated,
  onNewMessageSimulated,
  showToast,
  setActiveTab,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(networkNotifier.isOnline);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem('skillswap_global_notifications');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load notifications', e);
    }
    return [
      {
        id: 'notif-1',
        type: 'network',
        title: 'Network Synchronized',
        body: 'Real-time peer notification engine active and monitoring incoming proposal requests.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: false,
      },
      {
        id: 'notif-2',
        type: 'proposal',
        title: 'New Swap Proposal Received',
        body: 'Elena Rostova proposed: Front-End UI Design in exchange for Spanish Conversation.',
        timestamp: new Date(Date.now() - 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: true,
        actionTab: 'swaps',
      },
    ];
  });

  const prevProposalsLengthRef = useRef<number>(proposals.length);
  const prevMessagesLengthRef = useRef<number>(messages.length);
  const isFirstRenderRef = useRef<boolean>(true);

  // Save notifications to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('skillswap_global_notifications', JSON.stringify(notifications));
    } catch (e) {
      console.error('Failed to save notifications', e);
    }
  }, [notifications]);

  // Listen to network status changes
  useEffect(() => {
    return networkNotifier.subscribe((online) => {
      setIsOnline(online);
      
      const newNotif: NotificationItem = {
        id: `net-${Date.now()}`,
        type: 'network',
        title: online ? 'Network Connection Restored' : 'Offline Mode Active',
        body: online 
          ? 'Reconnected to SkillSwap cloud network. Incoming swap proposals synced.'
          : 'Device is offline. Local cache activated; actions will queue until reconnected.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: false,
      };

      setNotifications((prev) => [newNotif, ...prev.slice(0, 25)]);

      if (online) {
        showToast('🟢 Back Online! Real-time swap listener reconnected.');
      } else {
        showToast('🔴 You are Offline. Working in cached mode.');
      }

      triggerBrowserNotification(newNotif.title, newNotif.body);
    });
  }, [showToast]);

  // Monitor Incoming Proposals
  useEffect(() => {
    if (isFirstRenderRef.current) {
      prevProposalsLengthRef.current = proposals.length;
    } else if (proposals.length > prevProposalsLengthRef.current) {
      const newestProposal = proposals[proposals.length - 1];
      if (newestProposal) {
        const title = 'New Swap Proposal Alert!';
        const body = `Proposal from ${newestProposal.offeredSkillTitle || 'Peer'} to exchange for "${newestProposal.requestedSkillTitle || 'Skill'}"`;
        
        const notif: NotificationItem = {
          id: `prop-${Date.now()}`,
          type: 'proposal',
          title,
          body,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          read: false,
          actionTab: 'swaps',
        };

        setNotifications((prev) => [notif, ...prev.slice(0, 25)]);
        showToast(`🔔 ${title}: ${body}`);
        triggerBrowserNotification(title, body);
        playChime();
      }
      prevProposalsLengthRef.current = proposals.length;
    }
  }, [proposals, showToast]);

  // Monitor Incoming Chat Messages
  useEffect(() => {
    if (isFirstRenderRef.current) {
      prevMessagesLengthRef.current = messages.length;
      isFirstRenderRef.current = false;
    } else if (messages.length > prevMessagesLengthRef.current) {
      const newestMessage = messages[messages.length - 1];
      if (newestMessage && newestMessage.senderId !== currentUser.id) {
        const title = `Message from ${newestMessage.senderName || 'Peer'}`;
        const body = newestMessage.message;

        const notif: NotificationItem = {
          id: `msg-${Date.now()}`,
          type: 'chat',
          title,
          body,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          read: false,
          actionTab: 'chat',
        };

        setNotifications((prev) => [notif, ...prev.slice(0, 25)]);
        showToast(`💬 ${title}: "${body}"`);
        triggerBrowserNotification(title, body);
        playChime();
      }
      prevMessagesLengthRef.current = messages.length;
    }
  }, [messages, currentUser.id, showToast]);

  // Trigger Native Web Browser Push Notification
  const triggerBrowserNotification = (title: string, body: string) => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
        });
      } catch (e) {
        console.warn('Native notification suppressed by browser context', e);
      }
    }
  };

  // Play audio chime
  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      // Audio context may be restricted
    }
  };

  // Request Desktop Notification Permission
  const requestBrowserPermission = async () => {
    if (typeof Notification === 'undefined') {
      showToast('Browser notifications are not supported in this browser.');
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      setBrowserPermission(perm);
      if (perm === 'granted') {
        showToast('✅ Desktop Push Notifications enabled successfully!');
        new Notification('SkillSwap Alerts Active', {
          body: 'You will now receive desktop notifications for incoming swap proposals and messages.',
        });
      } else {
        showToast('⚠️ Desktop notifications permission was declined or dismissed.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Simulate Incoming Proposal Trigger
  const simulateIncomingProposal = () => {
    const mockProposal: SwapProposal = {
      id: `prop-sim-${Date.now()}`,
      senderId: 'user-2',
      senderName: 'Elena Rostova',
      senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      recipientId: currentUser.id,
      recipientName: currentUser.name,
      recipientAvatar: currentUser.avatar,
      offeredSkillTitle: 'UX Wireframing & Prototyping',
      requestedSkillTitle: 'Conversational Spanish Practice',
      status: 'pending',
      proposedDate: 'Tomorrow',
      proposedTime: '4:00 PM EST',
      durationMinutes: 60,
      pitchMessage: 'Hey! I saw your Spanish skill offer and would love to exchange 1-on-1 wireframing guidance!',
      useTimeCredits: false,
      timeCreditsAmount: 0,
      createdAt: new Date().toISOString(),
    };

    if (onNewProposalSimulated) {
      onNewProposalSimulated(mockProposal);
    }
  };

  // Simulate Incoming Chat Message Trigger
  const simulateIncomingMessage = () => {
    const mockMsg: ChatMessage = {
      id: `msg-sim-${Date.now()}`,
      swapProposalId: 'prop-1',
      senderId: 'user-3',
      senderName: 'Marcus Vance',
      senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      message: 'Hey there! Are you ready for our photography portfolio review session today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    if (onNewMessageSimulated) {
      onNewMessageSimulated(mockMsg);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    showToast('Marked all notifications as read.');
  };

  const clearNotifications = () => {
    setNotifications([]);
    showToast('Notification log cleared.');
  };

  return (
    <div className="relative">
      
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-xl transition-all cursor-pointer flex items-center justify-center"
        title="Global Notification Center & Live Swap Listener"
      >
        <Bell className="w-4 h-4 text-indigo-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 px-1.5 py-0.2 bg-rose-500 text-white font-extrabold text-[9px] rounded-full animate-pulse border border-slate-900">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Popover Drawer / Dropdown */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs" 
            onClick={() => setIsOpen(false)} 
          />

          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
            
            {/* Header */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-xl">
                  <Radio className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white flex items-center gap-1.5">
                    <span>Live Notification Engine</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  </h3>
                  <p className="text-[10px] text-slate-400">Real-time proposal & message listener</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                  title={soundEnabled ? 'Mute Chime Sound' : 'Enable Chime Sound'}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
                </button>

                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Listener Status Bar */}
            <div className="p-3 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between text-[11px] px-4">
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <span className="flex items-center gap-1 text-emerald-400 font-bold">
                    <Wifi className="w-3.5 h-3.5" />
                    <span>Connected</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-400 font-bold">
                    <WifiOff className="w-3.5 h-3.5 animate-pulse" />
                    <span>Offline Mode</span>
                  </span>
                )}
              </div>

              {/* Browser Push Notification Permission Status */}
              <div>
                {browserPermission === 'granted' ? (
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold rounded-full">
                    Desktop Push Active
                  </span>
                ) : (
                  <button
                    onClick={requestBrowserPermission}
                    className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] font-extrabold rounded-full transition-all cursor-pointer"
                  >
                    Enable Browser Push
                  </button>
                )}
              </div>
            </div>

            {/* Simulation Quick Testing Buttons */}
            <div className="p-3 bg-indigo-950/40 border-b border-slate-800 space-y-1.5">
              <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">
                Test Real-Time Event Listener
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={simulateIncomingProposal}
                  className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <ArrowRightLeft className="w-3 h-3 text-cyan-300" />
                  <span>Simulate Proposal</span>
                </button>

                <button
                  type="button"
                  onClick={simulateIncomingMessage}
                  className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Send className="w-3 h-3 text-amber-300" />
                  <span>Simulate Message</span>
                </button>
              </div>
            </div>

            {/* Notification Items List */}
            <div className="max-h-64 overflow-y-auto divide-y divide-slate-800/60 p-2">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs">
                  No notifications yet. Send or simulate a swap proposal to test alerts!
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      setNotifications((prev) => prev.map((item) => item.id === n.id ? { ...item, read: true } : item));
                      if (n.actionTab) {
                        setActiveTab(n.actionTab);
                        setIsOpen(false);
                      }
                    }}
                    className={`p-3 rounded-2xl transition-all cursor-pointer space-y-1 my-1 ${
                      n.read
                        ? 'bg-transparent opacity-75 hover:bg-slate-800/40'
                        : 'bg-slate-800/90 border border-indigo-500/30 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="flex items-center gap-1.5 text-white">
                        {n.type === 'proposal' && <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-400" />}
                        {n.type === 'chat' && <MessageSquare className="w-3.5 h-3.5 text-amber-400" />}
                        {n.type === 'network' && <Wifi className="w-3.5 h-3.5 text-emerald-400" />}
                        <span>{n.title}</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{n.timestamp}</span>
                    </div>

                    <p className="text-[11px] text-slate-300 leading-snug">{n.body}</p>

                    {n.actionTab && (
                      <span className="inline-block text-[10px] font-bold text-indigo-400 hover:underline pt-0.5">
                        Click to view in {n.actionTab === 'swaps' ? 'My Swaps' : 'Chat'} →
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px]">
              <button
                onClick={markAllRead}
                className="text-slate-400 hover:text-white transition-colors"
              >
                Mark all read
              </button>

              <button
                onClick={clearNotifications}
                className="text-rose-400 hover:text-rose-300 transition-colors"
              >
                Clear log
              </button>
            </div>

          </div>
        </>
      )}

    </div>
  );
};
