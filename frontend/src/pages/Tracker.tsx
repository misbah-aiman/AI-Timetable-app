import { Layout } from '../components/layout/Layout';
import { TimeTracker } from '../components/tracker/TimeTracker';

export const TrackerPage = () => (
  <Layout>
    <div className="mb-5">
      <p className="text-xs font-medium text-primary-400 uppercase tracking-widest mb-0.5">Today</p>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Time Tracker</h1>
    </div>
    <TimeTracker />
  </Layout>
);
