import React, { useState } from 'react';
import { 
  MapPin, 
  Navigation, 
  Compass, 
  Search, 
  Coffee, 
  User as UserIcon, 
  Star, 
  Clock, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  X,
  SlidersHorizontal
} from 'lucide-react';
import { Skill, User } from '../types';

interface NearbySkillMapViewProps {
  skills: Skill[];
  currentUser: User;
  onSelectSkill: (skill: Skill) => void;
  onProposeSwap: (skill: Skill) => void;
}

export const NearbySkillMapView: React.FC<NearbySkillMapViewProps> = ({
  skills,
  currentUser,
  onSelectSkill,
  onProposeSwap,
}) => {
  const [selectedRadius, setSelectedRadius] = useState<number>(10); // in km
  const [selectedVenueType, setSelectedVenueType] = useState<string>('All');
  const [searchLocation, setSearchLocation] = useState<string>('San Francisco, CA');
  const [activeSkillPin, setActiveSkillPin] = useState<Skill | null>(skills[0] || null);

  // Filter skills with mock coordinates / location tags
  const venueTypes = ['All', 'Coffee Shop', 'Public Library', 'Community Park', 'Co-working Space'];

  // Map mock markers relative positioning percentage on canvas
  const mapMarkers = skills.map((skill, idx) => {
    // Generate deterministic lat/long scatter for visual pins
    const topPct = 20 + ((idx * 17 + 13) % 60);
    const leftPct = 15 + ((idx * 23 + 29) % 70);
    const distanceKm = Number((1.2 + (idx * 1.8) % 12).toFixed(1));
    const venues = ['Starbucks Downtown', 'Central City Library', 'Mission Park Cafe', 'WeWork Hub'];
    const venue = venues[idx % venues.length];

    return {
      skill,
      topPct,
      leftPct,
      distanceKm,
      venue,
    };
  }).filter((m) => m.distanceKm <= selectedRadius);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Banner & Location Filter */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <MapPin className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-white">Local & Nearby Skill Swaps</h1>
            <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2.5 py-0.5 rounded-full border border-emerald-500/30 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Geolocation
            </span>
          </div>
          <p className="text-xs text-slate-300 max-w-xl">
            Discover verified mentors near <strong className="text-indigo-300">{searchLocation}</strong> for in-person practice sessions (language coffee meetups, guitar lessons in the park, coding pair sessions).
          </p>
        </div>

        {/* Location Search Bar */}
        <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 p-1.5 rounded-2xl w-full md:w-auto">
          <Navigation className="w-4 h-4 text-indigo-400 ml-2 shrink-0" />
          <input
            type="text"
            value={searchLocation}
            onChange={(e) => setSearchLocation(e.target.value)}
            className="bg-transparent text-xs text-slate-100 placeholder-slate-400 focus:outline-none px-2 py-1 w-full md:w-48"
            placeholder="Search location..."
          />
          <button 
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
            onClick={() => {}}
          >
            Locate
          </button>
        </div>
      </div>

      {/* Map Control Bar & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
            <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
            <span>Distance Radius:</span>
          </div>
          <div className="flex items-center gap-1.5">
            {[3, 5, 10, 25].map((r) => (
              <button
                key={r}
                onClick={() => setSelectedRadius(r)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  selectedRadius === r
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700/60'
                }`}
              >
                {r} km
              </button>
            ))}
          </div>
        </div>

        {/* Preferred Meeting Venue Filter */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
          <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Venue:</span>
          {venueTypes.map((v) => (
            <button
              key={v}
              onClick={() => setSelectedVenueType(v)}
              className={`px-3 py-1 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                selectedVenueType === v
                  ? 'bg-purple-950/80 text-purple-300 border border-purple-500/50 font-bold'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/60'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive Map & Sidebar Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Map Canvas Stage (2 Cols on lg) */}
        <div className="lg:col-span-2 relative h-[520px] bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between group">
          
          {/* Stylized Vector Dark Map Background Grid */}
          <div 
            className="absolute inset-0 bg-slate-950 opacity-90"
            style={{
              backgroundImage: `
                radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.08) 0%, transparent 60%),
                linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
              `,
              backgroundSize: '100% 100%, 32px 32px, 32px 32px'
            }}
          />

          {/* Map Overlay City Roads & Parks Simulation Graphics */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20 stroke-indigo-500/40" strokeWidth="2">
            <path d="M0,120 Q300,180 800,90" fill="none" strokeDasharray="6 6" />
            <path d="M200,0 Q240,300 300,520" fill="none" />
            <path d="M100,400 Q400,350 800,450" fill="none" />
            <circle cx="350" cy="240" r="140" fill="rgba(16, 185, 129, 0.05)" stroke="rgba(16, 185, 129, 0.3)" />
          </svg>

          {/* Map Controls Floating Badge */}
          <div className="absolute top-4 left-4 z-10 bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-800 text-xs text-slate-200 flex items-center gap-2 shadow-lg">
            <MapPin className="w-4 h-4 text-rose-500 animate-bounce" />
            <span>Showing <strong>{mapMarkers.length}</strong> mentors within {selectedRadius}km</span>
          </div>

          {/* Map Interactive Pins */}
          <div className="absolute inset-0 pointer-events-auto">
            {mapMarkers.map((m) => {
              const isSelected = activeSkillPin?.id === m.skill.id;

              return (
                <div
                  key={m.skill.id}
                  style={{ top: `${m.topPct}%`, left: `${m.leftPct}%` }}
                  onClick={() => setActiveSkillPin(m.skill)}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group/pin transition-all"
                >
                  <div className={`relative flex items-center justify-center transition-transform ${isSelected ? 'scale-125 z-30' : 'hover:scale-110'}`}>
                    {/* Pulsing radius highlight for selected marker */}
                    {isSelected && (
                      <span className="absolute w-12 h-12 rounded-full bg-indigo-500/30 animate-ping"></span>
                    )}
                    
                    <div className={`p-2.5 rounded-2xl border shadow-xl flex items-center gap-2 ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-400 text-white font-bold ring-4 ring-indigo-500/30'
                        : 'bg-slate-900 border-slate-700 text-slate-200 hover:border-indigo-500/60'
                    }`}>
                      <img src={m.skill.userAvatar} alt={m.skill.userName} className="w-6 h-6 rounded-full object-cover" />
                      <span className="text-[11px] font-semibold max-w-[100px] truncate">{m.skill.title}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800/80 text-amber-300 font-bold">
                        {m.distanceKm}km
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Floating Pin Preview Card */}
          {activeSkillPin && (
            <div className="absolute bottom-4 left-4 right-4 z-30 bg-slate-900/95 backdrop-blur-xl border border-indigo-500/40 p-4 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-bottom-3 duration-200">
              <div className="flex items-center gap-3">
                <img src={activeSkillPin.userAvatar} alt={activeSkillPin.userName} className="w-12 h-12 rounded-2xl object-cover border border-indigo-500/30 shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">{activeSkillPin.title}</h3>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full text-[10px] font-bold border border-emerald-500/30">
                      In-Person Ready
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Mentor: <strong className="text-indigo-300">{activeSkillPin.userName}</strong> • Rated <Star className="w-3 h-3 text-amber-400 inline fill-amber-400" /> {activeSkillPin.userRating}
                  </p>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
                    <Coffee className="w-3.5 h-3.5 text-amber-400" />
                    <span>Suggested Meeting Spot: <strong>Mission Park Cafe</strong> (1.8 km away)</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <button
                  onClick={() => onSelectSkill(activeSkillPin)}
                  className="flex-1 sm:flex-initial px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition-all"
                >
                  View Details
                </button>
                <button
                  onClick={() => onProposeSwap(activeSkillPin)}
                  className="flex-1 sm:flex-initial px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-extrabold transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center gap-1.5"
                >
                  <span>Propose In-Person Swap</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: Nearby Listings Cards List */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4 flex flex-col h-[520px]">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Compass className="w-4 h-4 text-indigo-400" />
              <span>Nearby Mentors ({mapMarkers.length})</span>
            </h2>
            <span className="text-[11px] text-slate-400 font-mono">Sorted by Distance</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {mapMarkers.map((m) => {
              const isSelected = activeSkillPin?.id === m.skill.id;

              return (
                <div
                  key={m.skill.id}
                  onClick={() => setActiveSkillPin(m.skill)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? 'bg-indigo-950/80 border-indigo-500/80 shadow-lg'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <img src={m.skill.userAvatar} alt={m.skill.userName} className="w-9 h-9 rounded-xl object-cover border border-slate-700" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-100 line-clamp-1">{m.skill.title}</h4>
                        <p className="text-[10px] text-slate-400">{m.skill.userName} • {m.skill.category}</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-md text-[10px] font-bold shrink-0">
                      {m.distanceKm} km
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300 line-clamp-2">{m.skill.description}</p>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="flex items-center gap-1 text-slate-300">
                      <Coffee className="w-3 h-3 text-amber-400" />
                      <span>{m.venue}</span>
                    </span>
                    <span className="text-indigo-400 font-semibold group-hover:underline flex items-center gap-0.5">
                      Select Pin &rarr;
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
