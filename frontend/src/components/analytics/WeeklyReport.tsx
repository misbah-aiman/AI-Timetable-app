import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
} from 'recharts';
import { WeeklyAnalytics } from '../../types';
import { Card } from '../ui/Card';

interface WeeklyReportProps {
  analytics: WeeklyAnalytics;
}

const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const WeeklyReport = ({ analytics }: WeeklyReportProps) => {
  const { dailyStats } = analytics;

  const barData = dailyStats.map((d, i) => ({
    day: DAY_SHORT[i] || d.date.slice(5),
    Study: +(d.studyMinutes / 60).toFixed(1),
    Sleep: +(d.sleepMinutes / 60).toFixed(1),
    Scroll: +(d.screenMinutes / 60).toFixed(1),
  }));

  const radarData = [
    { subject: 'Study', value: Math.min((analytics.totalStudyMinutes / (analytics.totalStudyMinutes + 60)) * 100, 100) },
    { subject: 'Sleep', value: Math.min((analytics.totalSleepMinutes / (56 * 60)) * 100, 100) },
    { subject: 'Exercise', value: Math.min((dailyStats.reduce((a, d) => a + d.exerciseMinutes, 0) / 420) * 100, 100) },
    { subject: 'Hobby', value: Math.min((dailyStats.reduce((a, d) => a + d.hobbyMinutes, 0) / 420) * 100, 100) },
    { subject: 'Screen', value: Math.min((analytics.totalScreenMinutes / (14 * 60)) * 100, 100) },
  ];

  return (
    <div className="space-y-6">
      {/* Charts — side by side on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Daily Hours Breakdown</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#FFD6D7" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} unit="h" />
              <Tooltip formatter={(v) => `${v}h`} />
              <Legend />
              <Bar dataKey="Study" fill="#750608" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Sleep" fill="#960B0D" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Scroll" fill="#e8a96a" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Activity Balance</h3>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
              <Radar dataKey="value" stroke="#750608" fill="#750608" fillOpacity={0.25} />
              <Tooltip formatter={(v) => `${Math.round(Number(v))}%`} />
            </RadarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
};
