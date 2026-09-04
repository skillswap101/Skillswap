import React, { useState } from 'react';
import { 
  X, 
  Calendar as CalendarIcon, 
  Clock, 
  Video, 
  Link2, 
  Copy, 
  Check, 
  Download, 
  ExternalLink, 
  Sparkles, 
  User as UserIcon, 
  CheckCircle2,
  Globe
} from 'lucide-react';
import { Session, User } from '../types';

interface CalendarSyncModalProps {
  session: Session | null;
  currentUser: User;
  onClose: () => void;
  onConfirmSchedule?: (updatedDate: string, updatedTime: string) => void;
}

export const CalendarSyncModal: React.FC<CalendarSyncModalProps> = ({
  session,
  currentUser,
  onClose,
  onConfirmSchedule,
}) => {
  if (!session) return null;

  const [date, setDate] = useState<string>(session.date || new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState<string>(session.time || '15:00');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  const meetingRoomUrl = `https://skillswap.app/room/${session.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(meetingRoomUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Generate Google Calendar URL
  const generateGoogleCalendarUrl = () => {
    const title = encodeURIComponent(`SkillSwap Session: ${session.title}`);
    const details = encodeURIComponent(
      `Mentor: ${session.mentorName}\nLearner: ${session.learnerName}\nSkill: ${session.skillTitle}\n\nJoin Live Room: ${meetingRoomUrl}`
    );
    const location = encodeURIComponent(meetingRoomUrl);
    
    // Format start & end date string YYYYMMDDTHHMMSSZ
    const startDateClean = date.replace(/-/g, '');
    const startTimeClean = time.replace(':', '');
    const startIso = `${startDateClean}T${startTimeClean}00Z`;
    // Add 1 hour for end time
    const hourNum = parseInt(time.split(':')[0], 10) || 15;
    const endHourStr = (hourNum + 1).toString().padStart(2, '0');
    const endIso = `${startDateClean}T${endHourStr}${time.split(':')[1] || '00'}00Z`;

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${startIso}/${endIso}`;
  };

  // Generate .ICS Calendar File Download
  const handleDownloadICS = () => {
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//SkillSwap Peer Exchange//EN
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
SUMMARY:SkillSwap Session: ${session.title}
DESCRIPTION:Mentor: ${session.mentorName}\\nLearner: ${session.learnerName}\\nSkill: ${session.skillTitle}\\nMeeting Link: ${meetingRoomUrl}
LOCATION:${meetingRoomUrl}
DTSTART:${date.replace(/-/g, '')}T${time.replace(':', '')}00Z
DTEND:${date.replace(/-/g, '')}T${(parseInt(time.split(':')[0], 10) + 1).toString().padStart(2, '0')}${time.split(':')[1]}00Z
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `skillswap_session_${session.id}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (onConfirmSchedule) {
      onConfirmSchedule(date, time);
    }
    setIsSaved(true);
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/90 backdrop-blur-xl overflow-y-auto">
      <div 
        className="relative w-full max-w-xl bg-slate-900 border border-emerald-500/30 rounded-3xl overflow-hidden shadow-2xl text-slate-100 flex flex-col my-auto animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-950 via-emerald-950 to-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Google Calendar Sync & Booking</h2>
              <p className="text-xs text-slate-400">One-click calendar sync with video room invite links.</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSaveSchedule} className="p-6 space-y-5 bg-slate-950/80">
          
          {/* Session Overview Box */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-full text-[10px] font-bold border border-indigo-500/30">
                {session.skillTitle}
              </span>
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>1 Credit Escrow Ready</span>
              </span>
            </div>
            <h3 className="text-sm font-bold text-white">{session.title}</h3>
            <p className="text-xs text-slate-400">
              Mentor: <strong className="text-indigo-300">{session.mentorName}</strong> | Learner: <strong className="text-purple-300">{session.learnerName}</strong>
            </p>
          </div>

          {/* Date & Time Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <CalendarIcon className="w-4 h-4 text-emerald-400" />
                <span>Session Date</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Time (UTC / Local)</span>
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          {/* Video Room Link Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Video className="w-4 h-4 text-indigo-400" />
              <span>WebRTC Video Room URL</span>
            </label>
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-xl">
              <input
                type="text"
                readOnly
                value={meetingRoomUrl}
                className="flex-1 bg-transparent px-2 text-xs text-indigo-300 font-mono focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{copiedLink ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Google Calendar & ICS Sync Bar */}
          <div className="pt-2 border-t border-slate-800 space-y-3">
            <span className="text-xs font-bold text-slate-300">1-Click External Calendar Sync:</span>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a
                href={generateGoogleCalendarUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-md transition-all"
              >
                <Globe className="w-4 h-4" />
                <span>Add to Google Calendar</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
              </a>

              <button
                type="button"
                onClick={handleDownloadICS}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Export .ICS File</span>
              </button>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-1.5"
            >
              {isSaved ? <CheckCircle2 className="w-4 h-4 text-white" /> : null}
              <span>{isSaved ? 'Schedule Confirmed!' : 'Save & Confirm Schedule'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
