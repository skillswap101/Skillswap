import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  UserCheck, 
  CheckCircle2, 
  Plus, 
  Video, 
  MapPin, 
  ArrowRightLeft, 
  Sparkles,
  User,
  Filter
} from 'lucide-react';
import { Skill, Session } from '../types';

interface TimeSlot {
  id: string;
  day: string;
  dateStr: string;
  timeStr: string;
  mentorName: string;
  mentorAvatar: string;
  skillTitle: string;
  skillId: string;
  delivery: 'Online' | 'In-Person' | 'Hybrid';
  isBooked: boolean;
  bookedBy?: string;
}

const MOCK_TIME_SLOTS: TimeSlot[] = [
  {
    id: 'slot-1',
    day: 'Mon',
    dateStr: 'Aug 10',
    timeStr: '06:00 PM - 07:00 PM',
    mentorName: 'Sofia Rossi',
    mentorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    skillTitle: 'Conversational Spanish for Beginners',
    skillId: 'sk_1',
    delivery: 'Online',
    isBooked: false,
  },
  {
    id: 'slot-2',
    day: 'Mon',
    dateStr: 'Aug 10',
    timeStr: '07:30 PM - 08:30 PM',
    mentorName: 'Alex Chen',
    mentorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    skillTitle: 'Frontend Web Development with React',
    skillId: 'sk_2',
    delivery: 'Online',
    isBooked: true,
    bookedBy: 'Sarah Jenkins',
  },
  {
    id: 'slot-3',
    day: 'Tue',
    dateStr: 'Aug 11',
    timeStr: '05:00 PM - 06:00 PM',
    mentorName: 'Marcus Vance',
    mentorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    skillTitle: 'Portrait & Outdoor Photography Essentials',
    skillId: 'sk_3',
    delivery: 'In-Person',
    isBooked: false,
  },
  {
    id: 'slot-4',
    day: 'Wed',
    dateStr: 'Aug 12',
    timeStr: '06:30 PM - 07:30 PM',
    mentorName: 'Elena Rostova',
    mentorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    skillTitle: 'Acoustic Guitar for Beginners',
    skillId: 'sk_4',
    delivery: 'Online',
    isBooked: false,
  },
  {
    id: 'slot-5',
    day: 'Thu',
    dateStr: 'Aug 13',
    timeStr: '04:00 PM - 05:00 PM',
    mentorName: 'Sofia Rossi',
    mentorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    skillTitle: 'Conversational Spanish for Beginners',
    skillId: 'sk_1',
    delivery: 'Online',
    isBooked: false,
  },
  {
    id: 'slot-6',
    day: 'Fri',
    dateStr: 'Aug 14',
    timeStr: '07:00 PM - 08:00 PM',
    mentorName: 'Alex Chen',
    mentorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    skillTitle: 'Frontend Web Development with React',
    skillId: 'sk_2',
    delivery: 'Online',
    isBooked: false,
  },
  {
    id: 'slot-7',
    day: 'Sat',
    dateStr: 'Aug 15',
    timeStr: '10:00 AM - 11:30 AM',
    mentorName: 'Marcus Vance',
    mentorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    skillTitle: 'Portrait & Outdoor Photography Essentials',
    skillId: 'sk_3',
    delivery: 'In-Person',
    isBooked: false,
  },
];

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface AvailabilityCalendarProps {
  skills: Skill[];
  onProposeSwap: (skill: Skill) => void;
  showToast: (msg: string) => void;
}

export const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({
  skills,
  onProposeSwap,
  showToast,
}) => {
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('All');
  const [selectedDeliveryFilter, setSelectedDeliveryFilter] = useState<string>('All');
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(MOCK_TIME_SLOTS);
  const [bookingSlot, setBookingSlot] = useState<TimeSlot | null>(null);

  // New slot form state
  const [showAddSlotModal, setShowAddSlotModal] = useState<boolean>(false);
  const [newDay, setNewDay] = useState<string>('Mon');
  const [newTime, setNewTime] = useState<string>('06:00 PM - 07:00 PM');
  const [newDelivery, setNewDelivery] = useState<'Online' | 'In-Person'>('Online');
  const [newSkillTitle, setNewSkillTitle] = useState<string>('Conversational Spanish');

  const filteredSlots = timeSlots.filter((slot) => {
    const matchesDay = selectedDayFilter === 'All' || slot.day === selectedDayFilter;
    const matchesDelivery = selectedDeliveryFilter === 'All' || slot.delivery === selectedDeliveryFilter;
    return matchesDay && matchesDelivery;
  });

  const handleBookSlot = (slot: TimeSlot) => {
    setTimeSlots((prev) =>
      prev.map((s) =>
        s.id === slot.id ? { ...s, isBooked: true, bookedBy: 'You' } : s
      )
    );
    showToast(`Successfully booked swap slot with ${slot.mentorName} for ${slot.dateStr}!`);
    setBookingSlot(null);
  };

  const handleAddCustomSlot = (e: React.FormEvent) => {
    e.preventDefault();
    const newSlotItem: TimeSlot = {
      id: `custom-${Date.now()}`,
      day: newDay,
      dateStr: `${newDay} Next Week`,
      timeStr: newTime,
      mentorName: 'You (Host)',
      mentorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      skillTitle: newSkillTitle,
      skillId: 'my_skill',
      delivery: newDelivery,
      isBooked: false,
    };

    setTimeSlots([newSlotItem, ...timeSlots]);
    setShowAddSlotModal(false);
    showToast('Your availability slot has been published to the community calendar!');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950/60 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold">
            <CalendarIcon className="w-4 h-4 text-emerald-400" />
            <span>Interactive Scheduling & Availability</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Mentor Availability Calendar
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Browse open peer teaching slots or publish your own recurring availability. Book instant 1-on-1 swap sessions aligned with your weekly calendar!
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddSlotModal(true)}
          className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-extrabold text-xs rounded-2xl shadow-lg shadow-emerald-600/20 transition-all active:scale-95 shrink-0 self-start md:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Post My Teaching Slot</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Days of Week Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-indigo-400" /> Day:
          </span>
          {['All', ...DAYS_OF_WEEK].map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDayFilter(day)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedDayFilter === day
                  ? 'bg-emerald-600 text-slate-950 shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {day}
            </button>
          ))}
        </div>

        {/* Delivery Filter */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Type:</span>
          {['All', 'Online', 'In-Person'].map((del) => (
            <button
              key={del}
              onClick={() => setSelectedDeliveryFilter(del)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedDeliveryFilter === del
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {del}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar Slots Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSlots.map((slot) => {
          const matchingSkill = skills.find((s) => s.id === slot.skillId) || skills[0];

          return (
            <div
              key={slot.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                slot.isBooked
                  ? 'bg-slate-950/60 border-slate-800/80 opacity-75'
                  : 'bg-slate-900 border-slate-800 hover:border-emerald-500/50 shadow-md'
              }`}
            >
              {/* Top Tag & Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-slate-950 text-emerald-400 font-extrabold text-xs rounded-lg border border-slate-800">
                    {slot.day} • {slot.dateStr}
                  </span>
                  <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                    {slot.delivery === 'Online' ? <Video className="w-3.5 h-3.5 text-indigo-400" /> : <MapPin className="w-3.5 h-3.5 text-amber-400" />}
                    {slot.delivery}
                  </span>
                </div>

                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                  slot.isBooked
                    ? 'bg-slate-800 text-slate-400 border-slate-700'
                    : 'bg-emerald-950/90 text-emerald-300 border-emerald-800'
                }`}>
                  {slot.isBooked ? `Booked by ${slot.bookedBy}` : 'Open Slot'}
                </span>
              </div>

              {/* Time & Skill Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-extrabold text-slate-100">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span>{slot.timeStr}</span>
                </div>

                <h3 className="text-xs font-bold text-indigo-300 line-clamp-1">
                  {slot.skillTitle}
                </h3>
              </div>

              {/* Mentor Avatar Bar */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <img
                    src={slot.mentorAvatar}
                    alt={slot.mentorName}
                    className="w-8 h-8 rounded-full object-cover border border-emerald-500/40"
                  />
                  <span className="text-xs font-bold text-slate-200">{slot.mentorName}</span>
                </div>

                {!slot.isBooked ? (
                  <button
                    type="button"
                    onClick={() => setBookingSlot(slot)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95"
                  >
                    Reserve Slot
                  </button>
                ) : (
                  <span className="text-xs text-slate-500 font-semibold italic">Unavailable</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Booking Confirmation Dialog */}
      {bookingSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Confirm Time Slot Booking</h3>
              <p className="text-xs text-slate-400">
                Reserving this slot uses 1 Time Credit or initiates a direct skill swap proposal.
              </p>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <p className="text-xs font-bold text-indigo-300">{bookingSlot.skillTitle}</p>
              <p className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>{bookingSlot.dateStr} ({bookingSlot.day}) • {bookingSlot.timeStr}</span>
              </p>
              <p className="text-xs text-slate-400">Mentor: <span className="font-bold text-slate-200">{bookingSlot.mentorName}</span></p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setBookingSlot(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleBookSlot(bookingSlot)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-extrabold rounded-xl shadow-md"
              >
                Confirm & Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Slot Modal */}
      {showAddSlotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <form onSubmit={handleAddCustomSlot} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Post Your Weekly Availability</h3>
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">Skill Offered</label>
              <input
                type="text"
                value={newSkillTitle}
                onChange={(e) => setNewSkillTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Day of Week</label>
                <select
                  value={newDay}
                  onChange={(e) => setNewDay(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  {DAYS_OF_WEEK.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Delivery Format</label>
                <select
                  value={newDelivery}
                  onChange={(e) => setNewDelivery(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="Online">Online Video</option>
                  <option value="In-Person">In-Person</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">Time Window</label>
              <input
                type="text"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                placeholder="e.g. 06:00 PM - 07:00 PM"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddSlotModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-md"
              >
                Publish Slot
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
