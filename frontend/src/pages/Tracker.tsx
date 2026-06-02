import { Layout } from '../components/layout/Layout';
import { TimeTracker } from '../components/tracker/TimeTracker';
import { PageHeader } from '../components/ui/PageHeader';

export const TrackerPage = () => (
  <Layout>
    <PageHeader eyebrow="Today" title="Time Tracker" />
    <TimeTracker />
  </Layout>
);
