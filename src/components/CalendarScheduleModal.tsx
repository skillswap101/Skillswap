import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Globe,
  Download,
  ExternalLink,
  CheckCircle2,
  X,
  AlertCircle,
} from 'lucide-react';
import { SwapContract, UserProfile } from '../types';
import { calendarExport } from '../lib/calendarExport';

interface CalendarScheduleModalProps {
  swap: SwapContract;
  currentUser: UserProfile;
  onClose: () => void;
  onUpdateSchedule?: (newIsoDate: string) => void;
}

const AVAILABLE_SLOTS = [
  '09:00 AM - 10:00 AM',
  '11:00 AM - 12:00 PM',
  '02:00 PM - 03:00 PM',
  '04:30 PM - 05:30 PM',
  '07:00 PM - 08:00 PM',
];

const TIMEZONES = [
  { label: 'Local (Auto-Detected)', value: Intl.DateTimeFormat().resolvedOptions().timeZone },
  { label: 'UTC / GMT (Universal Time)', value: 'UTC' },
  { label: 'US Eastern (New York, EDT/EST)', value: 'America/New_York' },
  { label: 'US Pacific (San Francisco, PDT/PST)', value: 'America/Los_Angeles' },
  { label: 'Europe (London, BST/GMT)', value: 'Europe/London' },
  { label: 'Africa (Nairobi, EAT, UTC+3)', value: 'Africa/Nairobi' },
  { label: 'Asia (Tokyo, JST, UTC+9)', value: 'Asia/Tokyo' },
];

export const CalendarScheduleModal: React.FC<CalendarScheduleModalProps> = ({
  swap,
  currentUser,
  onClose,
  onUpdateSchedule,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    swap.scheduledDate ? swap.scheduledDate.split('T')[0] : new Date().toISOString().split('T')[0]
  );
  const [selectedSlot, setSelectedSlot] = useState<string>(AVAILABLE_SLOTS[1]);
  const [selectedTimezone, setSelectedTimezone] = useState<string>(
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Parse meeting time
  const meetingDate = new Date(swap.scheduledDate);
  const formattedScheduled = meetingDate.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleSaveSchedule = () => {
    // Generate ISO string from selected date and slot
    const hourMap: Record<string, number> = {
      '09:00 AM - 10:00 AM': 9,
      '11:00 AM - 12:00 PM': 11,
      '02:00 PM - 03:00 PM': 14,
      '04:30 PM - 05:30 PM': 16,
      '07:00 PM - 08:00 PM': 19,
    };
    const hour = hourMap[selectedSlot] || 12;
    const targetDate = new Date(`${selectedDate}T${hour.toString().padStart(2, '0')}:00:00`);
    
    if (onUpdateSchedule) {
      onUpdateSchedule(targetDate.toISOString());
    }
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full p-6 text-slate-100 shadow-2xl overflow-hidden relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-teal-500 flex items-center justify-center text-white shadow-lg">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">Smart Calendar & Timezone Sync</h3>
            <p className="text-xs text-slate-400">
              Schedule your 1-on-1 swap for <strong className="text-slate-200">{swap.skillTitle}</strong>
            </p>
          </div>
        </div>

        {/* Current Scheduled Info */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-indigo-400" />
            <div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Currently Booked</div>
              <div className="text-sm font-bold text-emerald-300">{formattedScheduled}</div>
            </div>
          </div>
          <span className="text-xs bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full border border-indigo-500/30 font-medium">
            {swap.hours} Hour Session
          </span>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          
          {/* Timezone Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              Target Timezone
            </label>
            <select
              value={selectedTimezone}
              onChange={e => setSelectedTimezone(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {TIMEZONES.map(tz => (
                <option key={tz.value} value={tz.value}>
                  {tz.label} ({tz.value})
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Select Session Date
            </label>
            <input
              type="date"
              value={selectedDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={e => setSelectedDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Available Slots */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Available Mentor Time Slots
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {AVAILABLE_SLOTS.map(slot => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all ${
                    selectedSlot === slot
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Quick Sync & Download Actions */}
        <div className="mt-6 pt-5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center gap-2">
            {/* Google Calendar Link */}
            <a
              href={calendarExport.getGoogleCalendarUrl(swap)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
              Add to Google Calendar
            </a>

            {/* Apple/Outlook .ICS Download */}
            <button
              onClick={() => calendarExport.downloadIcs(swap)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              Download .ICS
            </button>
          </div>

          <button
            onClick={handleSaveSchedule}
            disabled={savedSuccess}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-all"
          >
            {savedSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                Schedule Confirmed!
              </>
            ) : (
              'Confirm Reschedule'
            )}
          </button>

        </div>

      </div>
    </div>
  );
};
