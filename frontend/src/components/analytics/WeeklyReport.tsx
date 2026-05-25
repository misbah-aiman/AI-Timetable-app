import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
} from 'recharts';
import { WeeklyAnalytics } from '../../types';
import { CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import { Card } from '../ui/Card';

interface WeeklyReportProps {
  analytics: WeeklyAnalytics;
}

const fmtHours = (mins: number) => `${(mins / 60).toFixed(1)}h`;

const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const WeeklyReport = ({ analytics }: WeeklyReportProps) => {
  const { dailyStats, goals, avgProductivityScore } = analytics;

  // Bar chart data
  const barData = dailyStats.map((d, i) => ({
    day: DAY_SHORT[i] || d.date.slice(5),
    Study: +(d.studyMinutes / 60).toFixed(1),
    Sleep: +(d.sleepMinutes / 60).toFixed(1),
    Scroll: +(d.screenMinutes / 60).toFixed(1),
  }));

  // Radar chart data
  const radarData = [
    { subject: 'Study', value: Math.min((analytics.totalStudyMinutes / (analytics.totalStudyMinutes + 60)) * 100, 100) },
    { subject: 'Sleep', value: Math.min((analytics.totalSleepMinutes / (56 * 60)) * 100, 100) },
    { subject: 'Exercise', value: Math.min((dailyStats.reduce((a, d) => a + d.exerciseMinutes, 0) / 420) * 100, 100) },
    { subject: 'Hobby', value: Math.min((dailyStats.reduce((a, d) => a + d.hobbyMinutes, 0) / 420) * 100, 100) },
    { subject: 'Balance', value: goals.screenLimitMet ? 80 : 40 },
  ];

  const scoreColor = avgProductivityScore >= 70 ? '#10b981' : avgProductivityScore >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div className="space-y-6">
      {/* Score card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-1 flex flex-col items-center justify-center text-center">
          <TrendingUp size={28} className="text-primary-500 mb-2" />
          <div className="text-5xl font-bold" style={{ color: scoreColor }}>{avgProductivityScore}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Productivity Score</div>
          <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 mt-3">
            <div className="h-2 rounded-full" style={{ width: `${avgProductivityScore}%`, backgroundColor: scoreColor }} />
          </div>
        </Card>

        {/* Goals */}
        <Card className="md:col-span-3">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Weekly Goals</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Study Goal', met: goals.studyGoalMet, detail: fmtHours(analytics.totalStudyMinutes) },
              { label: 'Sleep Goal', met: goals.sleepGoalMet, detail: fmtHours(analytics.totalSleepMinutes) },
              { label: 'Screen Limit', met: goals.screenLimitMet, detail: fmtHours(analytics.totalScreenMinutes) },
            ].map(g => (
              <div key={g.label} className={`flex items-center gap-3 p-4 rounded-2xl ${
                g.met ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'
              }`}>
                {g.met
                  ? <CheckCircle size={20} className="text-green-500 shrink-0" />
                  : <XCircle size={20} className="text-red-400 shrink-0" />}
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{g.label}</div>
                  <div className="text-xs text-gray-500">{g.detail} this week</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Charts — side by side on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Daily Hours Breakdown</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ede9fe" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} unit="h" />
              <Tooltip formatter={(v) => `${v}h`} />
              <Legend />
              <Bar dataKey="Study" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Sleep" fill="#6366f1" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Scroll" fill="#f97316" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Activity Balance</h3>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
              <Radar dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.25} />
              <Tooltip formatter={(v) => `${Math.round(Number(v))}%`} />
            </RadarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
};
