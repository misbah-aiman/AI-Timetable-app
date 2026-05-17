import { Layout } from '../components/layout/Layout';
import { TimeTracker } from '../components/tracker/TimeTracker';

// Dedicated tracker page (also embedded in dashboard)
export const TrackerPage = () => (
  <Layout>
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Time Tracker</h1>
      <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
        Track your study, sleep, and screen time in real-time
      </p>
    </div>
    <TimeTracker />
  </Layout>
);
