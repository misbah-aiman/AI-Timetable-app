import { Layout } from '../components/layout/Layout';
import { TimeTracker } from '../components/tracker/TimeTracker';

export const TrackerPage = () => (
  <Layout>
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Time Tracker</h1>
    </div>
    <TimeTracker />
  </Layout>
);
