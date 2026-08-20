import { queue, Worker } from 'bullmq';
import { getRedisClient } from '../cache/index.js';

const connection = () => getRedisClient();

export const notificationQueue = new queue('notifications', { connection });
export const reportQueue = new queue('reports', { connection });
export const searchIndexQueue = new queue('search-index', { connection });

export const notificationWorker = new Worker(
  'notifications',
  async (job) => {
    const { type, data } = job.data;
    if (type === 'send_bulk') {
      const { userIds, template } = data;
      for (const userId of userIds) {
        // Dispatch via notification service
      }
    } else if (type === 'send_individual') {
      const { notification } = data;
      // Dispatch individual notification
    }
  },
  { connection, concurrency: 5 }
);

export const reportWorker = new Worker(
  'reports',
  async (job) => {
    const { type, data } = job.data;
    if (type === 'student_progress_report' || type === 'school_results_report') {
      // Generate PDF reports
    }
  },
  { connection, concurrency: 2 }
);

export const searchIndexWorker = new Worker(
  'search-index',
  async (job) => {
    const { type, data } = job.data;
    if (type === 'index_course' || type === 'index_lesson' || type === 'rebuild_index') {
      // Re-index searchable content
    }
  },
  { connection, concurrency: 3 }
);

export const enqueueNotification = async (notification) => {
  await notificationQueue.add('send_individual', { type: 'send_individual', data: { notification } });
};

export const enqueueBulkNotifications = async (userIds, template) => {
  await notificationQueue.add('send_bulk', { type: 'send_bulk', data: { userIds, template } });
};

export const enqueueReportGeneration = async (type, data) => {
  await reportQueue.add(type, { type, data });
};

export const enqueueSearchIndexing = async (type, data) => {
  await searchIndexQueue.add(type, { type, data });
};
