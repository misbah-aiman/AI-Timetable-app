import { Layout } from '../components/layout/Layout';
import { TimeTracker } from '../components/tracker/TimeTracker';

export const TrackerPage = () => (
  <Layout>
    {/* Inline header matching dashboard style */}
    <div className="mb-6 animate-slide-up">
      <p className="text-[11px] font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-[0.10em] mb-1">
        Today
      </p>
      <h1 className="text-[28px] md:text-[32px] font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight">
        Time Tracker
      </h1>
    </div>
    <TimeTracker />
  </Layout>
);
