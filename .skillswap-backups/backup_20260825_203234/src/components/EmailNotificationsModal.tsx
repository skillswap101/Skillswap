import React, { useState, useEffect } from 'react';
import {
  Mail,
  Inbox,
  CheckCheck,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Clock,
  Sparkles,
  RefreshCw,
  Send,
  AlertTriangle,
  Award,
  CreditCard,
  Lock,
  ChevronRight,
  Filter,
  Search,
  X,
} from 'lucide-react';
import { EmailNotification, UserProfile } from '../types';
import { api } from '../lib/api';

interface EmailNotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onNavigateToTab?: (tab: 'marketplace' | 'swaps' | 'live_room' | 'wallet' | 'audit') => void;
}

export const EmailNotificationsModal: React.FC<EmailNotificationsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onNavigateToTab,
}) => {
  const [notifications, setNotifications] = useState<EmailNotification[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailNotification | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'proposals' | 'escrow'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  const fetchEmails = async () => {
    setIsLoading(true);
    try {
      const data = await api.getNotifications(currentUser.id);
      setNotifications(data);
      if (data.length > 0 && !selectedEmail) {
        setSelectedEmail(data[0]);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchEmails();
    }
  }, [isOpen, currentUser.id]);

  const handleSelectEmail = async (email: EmailNotification) => {
    setSelectedEmail(email);
    if (!email.isRead) {
      try {
        await api.markNotificationRead(email.id);
        setNotifications(prev =>
          prev.map(n => (n.id === email.id ? { ...n, isRead: true } : n))
        );
      } catch (err) {
        console.error('Failed to mark read:', err);
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead(currentUser.id);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const handleDeleteEmail = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.deleteNotification(id);
      const remaining = notifications.filter(n => n.id !== id);
      setNotifications(remaining);
      if (selectedEmail?.id === id) {
        setSelectedEmail(remaining.length > 0 ? remaining[0] : null);
      }
    } catch (err) {
      console.error('Failed to delete email:', err);
    }
  };

  const handleSimulateCustom = async (type: 'proposal' | 'status_change' | 'payment') => {
    setIsSimulating(true);
    try {
      if (type === 'proposal') {
        await api.simulateTestEmail({
          recipientUserId: currentUser.id,
          category: 'proposal_received',
        });
      } else if (type === 'status_change') {
        await api.simulateTestEmail({
          recipientUserId: currentUser.id,
          category: 'session_scheduled',
          customSubject: '🔄 Contract Status Transition: Escrow Verified & Ready for Live Session',
        });
      } else {
        await api.simulateTestEmail({
          recipientUserId: currentUser.id,
          category: 'credits_purchased',
          customSubject: '💳 Wallet Top-Up Notice: +3.0 Hours Time Credit Deposit',
        });
      }
      await fetchEmails();
    } catch (err) {
      console.error('Simulation failed:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  if (!isOpen) return null;

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread' && n.isRead) return false;
    if (filter === 'proposals' && !['proposal_received', 'proposal_accepted'].includes(n.category)) return false;
    if (filter === 'escrow' && !['escrow_locked', 'session_settled', 'dispute_opened', 'dispute_resolved'].includes(n.category)) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        n.subject.toLowerCase().includes(q) ||
        n.senderName.toLowerCase().includes(q) ||
        n.previewText.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'proposal_received':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1"><Sparkles className="w-3 h-3" /> Proposal</span>;
      case 'escrow_locked':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1"><Lock className="w-3 h-3" /> Escrow Locked</span>;
      case 'session_settled':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1"><Award className="w-3 h-3" /> Settled</span>;
      case 'dispute_opened':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Dispute</span>;
      case 'credits_purchased':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1"><CreditCard className="w-3 h-3" /> Payment</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-700 text-slate-300">Contract Alert</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-6xl h-[88vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Top Header Bar */}
        <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">Email Notification Simulator</h2>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-bold bg-indigo-500 text-white rounded-full">
                    {unreadCount} New
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Connected Inbox: <span className="text-slate-200 font-mono font-medium">{currentUser.email || 'user@skillswap.dev'}</span>
              </p>
            </div>
          </div>

          {/* Quick Simulation Triggers */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700">
              <button
                onClick={() => handleSimulateCustom('proposal')}
                disabled={isSimulating}
                className="px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-700 rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-50"
                title="Simulate a peer submitting a new swap proposal"
              >
                <Send className="w-3.5 h-3.5 text-cyan-400" />
                + Proposal Alert
              </button>
              <button
                onClick={() => handleSimulateCustom('status_change')}
                disabled={isSimulating}
                className="px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-700 rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-50"
                title="Simulate an escrow / contract status change event"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isSimulating ? 'animate-spin' : ''}`} />
                + Status Change
              </button>
            </div>

            <button
              onClick={handleMarkAllRead}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all flex items-center gap-1.5"
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
              Mark All Read
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Split View Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel: Inbox List */}
          <div className="w-full md:w-5/12 lg:w-4/12 border-r border-slate-800 flex flex-col bg-slate-900/60">
            {/* Search and Filters */}
            <div className="p-3 border-b border-slate-800 space-y-2 bg-slate-900">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search emails, proposals, keywords..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div className="flex gap-1">
                {(['all', 'unread', 'proposals', 'escrow'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setFilter(tab)}
                    className={`flex-1 py-1 text-xs font-medium rounded-lg capitalize transition-colors ${
                      filter === tab
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Email List Items */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
              {isLoading && notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
                  <p className="text-xs">Fetching notification inbox...</p>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <Inbox className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                  <p className="text-sm font-medium text-slate-300">No emails found</p>
                  <p className="text-xs text-slate-500 mt-1">Try simulating a proposal above to see real-time alerts.</p>
                </div>
              ) : (
                filteredNotifications.map(email => (
                  <div
                    key={email.id}
                    onClick={() => handleSelectEmail(email)}
                    className={`p-3.5 cursor-pointer transition-all relative group flex flex-col gap-1.5 ${
                      selectedEmail?.id === email.id
                        ? 'bg-indigo-950/40 border-l-4 border-indigo-500 pl-3'
                        : 'hover:bg-slate-800/40'
                    } ${!email.isRead ? 'bg-slate-800/20' : 'opacity-85'}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {!email.isRead && (
                          <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0 animate-pulse" />
                        )}
                        <span className="text-xs font-bold text-slate-200 truncate">
                          {email.senderName}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                        {new Date(email.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-white line-clamp-1">
                      {email.subject}
                    </div>

                    <div className="text-xs text-slate-400 line-clamp-1 leading-relaxed">
                      {email.previewText}
                    </div>

                    <div className="flex items-center justify-between pt-1 mt-0.5">
                      {getCategoryBadge(email.category)}
                      <button
                        onClick={e => handleDeleteEmail(email.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-400 transition-opacity"
                        title="Delete email"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Panel: Email Detail Reader */}
          <div className="hidden md:flex flex-1 flex-col bg-slate-950/60 overflow-hidden">
            {selectedEmail ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Email Subject & Meta Header */}
                <div className="p-6 border-b border-slate-800 bg-slate-900/40 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h1 className="text-lg font-bold text-white leading-snug">
                        {selectedEmail.subject}
                      </h1>
                      <div className="flex items-center gap-2 mt-2">
                        {getCategoryBadge(selectedEmail.category)}
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(selectedEmail.createdAt).toLocaleString(undefined, {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </span>
                      </div>
                    </div>

                    {selectedEmail.actionUrl && onNavigateToTab && (
                      <button
                        onClick={() => {
                          const tab = selectedEmail.actionUrl as any;
                          if (['marketplace', 'swaps', 'live_room', 'wallet', 'audit'].includes(tab)) {
                            onNavigateToTab(tab);
                            onClose();
                          }
                        }}
                        className="px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-1.5 shrink-0"
                      >
                        <span>{selectedEmail.actionLabel || 'View in SkillSwap'}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Sender & Security Header */}
                  <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-slate-300">
                      <div>
                        <span className="text-slate-500 mr-1.5 font-medium">From:</span>
                        <span className="font-semibold text-white">{selectedEmail.senderName}</span>
                        <span className="text-slate-400 font-mono ml-1.5">&lt;{selectedEmail.senderEmail}&gt;</span>
                      </div>
                      <div className="flex items-center gap-1 text-emerald-400 text-[11px] font-medium bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Verified Protocol Dispatch
                      </div>
                    </div>
                    <div className="text-slate-300">
                      <span className="text-slate-500 mr-1.5 font-medium">To:</span>
                      <span className="font-semibold text-white">{selectedEmail.recipientName}</span>
                      <span className="text-slate-400 font-mono ml-1.5">&lt;{selectedEmail.recipientEmail}&gt;</span>
                    </div>
                  </div>
                </div>

                {/* Email HTML Rendered Body */}
                <div className="flex-1 p-6 overflow-y-auto bg-slate-950 flex items-start justify-center">
                  <div
                    className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl"
                    dangerouslySetInnerHTML={{ __html: selectedEmail.htmlBody }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <Mail className="w-12 h-12 text-slate-700 mb-3" />
                <h3 className="text-base font-semibold text-slate-200">No Email Selected</h3>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Select a message from the list or trigger a simulated proposal event to view the full HTML email template.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
