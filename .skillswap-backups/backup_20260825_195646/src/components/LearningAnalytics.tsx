import React, { useState } from 'react';
import { 
  TrendingUp, 
  Clock, 
  Award, 
  Calendar, 
  Sparkles, 
  BarChart2, 
  ArrowUpRight,
  CheckCircle2
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

interface AnalyticsPoint {
  date: string;
  hoursTaught: number;
  creditsEarned: number;
  hoursLearned: number;
}

const LAST_30_DAYS_DATA: AnalyticsPoint[] = [
  { date: 'Jul 6', hoursTaught: 2, creditsEarned: 2, hoursLearned: 1 },
  { date: 'Jul 9', hoursTaught: 5, creditsEarned: 4, hoursLearned: 3 },
  { date: 'Jul 12', hoursTaught: 9, creditsEarned: 8, hoursLearned: 5 },
  { date: 'Jul 15', hoursTaught: 14, creditsEarned: 13, hoursLearned: 8 },
  { date: 'Jul 18', hoursTaught: 19, creditsEarned: 17, hoursLearned: 11 },
  { date: 'Jul 21', hoursTaught: 24, creditsEarned: 21, hoursLearned: 13 },
  { date: 'Jul 24', hoursTaught: 29, creditsEarned: 26, hoursLearned: 16 },
  { date: 'Jul 27', hoursTaught: 34, creditsEarned: 30, hoursLearned: 18 },
  { date: 'Jul 30', hoursTaught: 39, creditsEarned: 35, hoursLearned: 21 },
  { date: 'Aug 2', hoursTaught: 43, creditsEarned: 39, hoursLearned: 23 },
  { date: 'Aug 4', hoursTaught: 48, creditsEarned: 44, hoursLearned: 25 },
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-950/95 border border-slate-700/80 p-3.5 rounded-2xl shadow-2xl space-y-2 backdrop-blur-md">
        <p className="text-xs font-bold text-slate-300 flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
          <Calendar className="w-3.5 h-3.5 text-indigo-400" />
          <span>{label} (30-Day Checkpoint)</span>
        </p>
        <div className="space-y-1.5 text-xs font-semibold">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-5">
              <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name}:
              </span>
              <span className="font-extrabold text-slate-100 font-mono">
                {entry.value} {entry.name.includes('Hours') ? 'hrs' : 'credits'}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export const LearningAnalytics: React.FC = () => {
  const [activeMetric, setActiveMetric] = useState<'all' | 'hours' | 'credits'>('all');

  const latestData = LAST_30_DAYS_DATA[LAST_30_DAYS_DATA.length - 1];
  const initialData = LAST_30_DAYS_DATA[0];

  const hoursGained = latestData.hoursTaught - initialData.hoursTaught;
  const creditsGained = latestData.creditsEarned - initialData.creditsEarned;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
              Learning & Teaching Analytics
            </h2>
            <span className="px-2.5 py-0.5 bg-indigo-950 text-indigo-300 text-[10px] font-extrabold rounded-full border border-indigo-800">
              Last 30 Days
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Track your cumulative hours taught and time credits earned through successful skill swaps.
          </p>
        </div>

        {/* Metric View Controls */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveMetric('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeMetric === 'all'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Metrics
          </button>
          <button
            type="button"
            onClick={() => setActiveMetric('hours')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeMetric === 'hours'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Hours Taught
          </button>
          <button
            type="button"
            onClick={() => setActiveMetric('credits')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeMetric === 'credits'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Credits Earned
          </button>
        </div>
      </div>

      {/* Metric Cards Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Hours Taught Card */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-400" />
              Hours Taught
            </span>
            <span className="flex items-center gap-0.5 text-[11px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-800/60">
              <ArrowUpRight className="w-3 h-3" />
              +{hoursGained}h this month
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-indigo-400 font-mono">{latestData.hoursTaught}h</span>
            <span className="text-xs text-slate-400">total lifetime</span>
          </div>
        </div>

        {/* Time Credits Earned Card */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              Credits Earned
            </span>
            <span className="flex items-center gap-0.5 text-[11px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-800/60">
              <ArrowUpRight className="w-3 h-3" />
              +{creditsGained} credits
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-amber-400 font-mono">{latestData.creditsEarned}</span>
            <span className="text-xs text-slate-400">time credits</span>
          </div>
        </div>

        {/* Swap Success Rate */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Swap Completion
            </span>
            <span className="text-[11px] font-bold text-indigo-300 bg-indigo-950 px-2 py-0.5 rounded-md border border-indigo-800">
              Top 5% Mentor
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-emerald-400 font-mono">98.4%</span>
            <span className="text-xs text-slate-400">puality score</span>
          </div>
        </div>
      </div>

      {/* Recharts Line Graph Container */}
      <div className="bg-slate-950 border border-slate-800/90 rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
          <span className="flex items-center gap-1.5">
            <BarChart2 className="w-4 h-4 text-indigo-400" />
            Progress Trendline (30 Days)
          </span>
          <span className="text-[11px] text-slate-400">Hover data points to inspect detailed values</span>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={LAST_30_DAYS_DATA}
              margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '16px', fontSize: '12px' }}
                iconType="circle"
              />
              {(activeMetric === 'all' || activeMetric === 'hours') && (
                <Line
                  type="monotone"
                  dataKey="hoursTaught"
                  name="Hours Taught"
                  stroke="#6366f1"
                  strokeWidth={3}
                  activeDot={{ r: 7, stroke: '#818cf8', strokeWidth: 2, fill: '#1e1b4b' }}
                  dot={{ r: 3, fill: '#6366f1' }}
                />
              )}
              {(activeMetric === 'all' || activeMetric === 'credits') && (
                <Line
                  type="monotone"
                  dataKey="creditsEarned"
                  name="Time Credits Earned"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  activeDot={{ r: 7, stroke: '#fbbf24', strokeWidth: 2, fill: '#451a03' }}
                  dot={{ r: 3, fill: '#f59e0b' }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
