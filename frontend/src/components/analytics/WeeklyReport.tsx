import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
} from 'recharts';
import { WeeklyAnalytics } from '../../types';
import { Card } from '../ui/Card';
import { useTheme } from '../../contexts/ThemeContext';

interface WeeklyReportProps {
  analytics: WeeklyAnalytics;
}

const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const WeeklyReport = ({ analytics }: WeeklyReportProps) => {
  const { dailyStats } = analytics;
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const tickColor   = isDark ? '#9ca3af' : '#6b7280';
  const gridColor   = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,128,128,0.12)';
  const tooltipBg   = isDark ? '#021a1a' : '#ffffff';
  const tooltipBorder = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';

  const barData = useMemo(() => dailyStats.map((d, i) => ({
    day: DAY_SHORT[i] || d.date.slice(5),
    Study:  +(d.studyMinutes  / 60).toFixed(1),
    Sleep:  +(d.sleepMinutes  / 60).toFixed(1),
    Scroll: +(d.screenMinutes / 60).toFixed(1),
  })), [dailyStats]);

  const radarData = useMemo(() => [
    { subject: 'Study',    value: Math.min((analytics.totalStudyMinutes  / (analytics.totalStudyMinutes + 60)) * 100, 100) },
    { subject: 'Sleep',    value: Math.min((analytics.totalSleepMinutes  / (56 * 60)) * 100, 100) },
    { subject: 'Exercise', value: Math.min((dailyStats.reduce((a, d) => a + d.exerciseMinutes, 0) / 420) * 100, 100) },
    { subject: 'Hobby',    value: Math.min((dailyStats.reduce((a, d) => a + d.hobbyMinutes,   0) / 420) * 100, 100) },
    { subject: 'Screen',   value: Math.min((analytics.totalScreenMinutes / (14 * 60)) * 100, 100) },
  ], [analytics, dailyStats]);

  const tooltipStyle = {
    backgroundColor: tooltipBg,
    border: `1px solid ${tooltipBorder}`,
    borderRadius: '12px',
    fontSize: '13px',
    color: isDark ? '#f3f4f6' : '#111827',
    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <h3 className="font-semibold text-[14px] text-gray-800 dark:text-white mb-4 tracking-tight">
            Daily Hours Breakdown
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: tickColor }}
                axisLine={{ stroke: gridColor }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: tickColor }}
                unit="h"
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(v) => [`${v}h`, undefined]}
                contentStyle={tooltipStyle}
                cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}
              />
              <Legend
                wrapperStyle={{ fontSize: '12px', color: tickColor, paddingTop: '8px' }}
              />
              <Bar dataKey="Study"  fill="#008080" radius={[4, 4, 0, 0]} maxBarSize={24} />
              <Bar dataKey="Sleep"  fill="#6366F1" radius={[4, 4, 0, 0]} maxBarSize={24} />
              <Bar dataKey="Scroll" fill="#F59E0B" radius={[4, 4, 0, 0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="font-semibold text-[14px] text-gray-800 dark:text-white mb-4 tracking-tight">
            Activity Balance
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke={gridColor} />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fontSize: 11, fill: tickColor }}
              />
              <Radar dataKey="value" stroke="#008080" fill="#008080" fillOpacity={0.22} strokeWidth={2} />
              <Tooltip
                formatter={(v) => [`${Math.round(Number(v))}%`, 'Score']}
                contentStyle={tooltipStyle}
              />
            </RadarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
};
