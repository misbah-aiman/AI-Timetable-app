import { useEffect, useState } from 'react';
import { analyticsApi } from '../services/api';
import { WeeklyAnalytics } from '../types';
import { Layout } from '../components/layout/Layout';
import { WeeklyReport } from '../components/analytics/WeeklyReport';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export const Analytics = () => {
  const [analytics, setAnalytics] = useState<WeeklyAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    analyticsApi.getWeekly()
      .then(res => setAnalytics(res.data.analytics))
      .catch(() => setError('Could not load analytics.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
      </div>

      {loading && <LoadingSpinner message="Loading..." />}

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl text-sm">{error}</div>
      )}

      {analytics && !loading && <WeeklyReport analytics={analytics} />}
    </Layout>
  );
};
