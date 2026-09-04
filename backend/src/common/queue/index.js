import { queue, Worker } from 'bullmq';
import { getRedisClient } from '../cache/index.js';

const connection = () => getRedisClient();

let notificationQueue;
let reportQueue;
let searchIndexQueue;
let notificationWorker;
let reportWorker;
let searchIndexWorker;

try {
  notificationQueue = new queue('notifications', { connection });
  reportQueue = new queue('reports', { connection });
  searchIndexQueue = new queue('search-index', { connection });

  notificationWorker = new Worker(
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

  reportWorker = new Worker(
    'reports',
    async (job) => {
      const { type, data } = job.data;
      if (type === 'student_progress_report' || type === 'school_results_report') {
        // Generate PDF reports
      }
    },
    { connection, concurrency: 2 }
  );

  searchIndexWorker = new Worker(
    'search-index',
    async (job) => {
      const { type, data } = job.data;
      if (type === 'index_course' || type === 'index_lesson' || type === 'rebuild_index') {
        // Re-index searchable content
      }
    },
    { connection, concurrency: 3 }
  );
} catch (err) {
  console.warn('[Queue] BullMQ unavailable, queues disabled:', err.message);
}

const noop = async () => {};

export { notificationQueue, reportQueue, searchIndexQueue, notificationWorker, reportWorker, searchIndexWorker };

export const enqueueNotification = async (notification) => {
  if (!notificationQueue) { console.warn('[Queue] notificationQueue unavailable'); return; }
  await notificationQueue.add('send_individual', { type: 'send_individual', data: { notification } });
};

export const enqueueBulkNotifications = async (userIds, template) => {
  if (!notificationQueue) { console.warn('[Queue] notificationQueue unavailable'); return; }
  await notificationQueue.add('send_bulk', { type: 'send_bulk', data: { userIds, template } });
};

export const enqueueReportGeneration = async (type, data) => {
  if (!reportQueue) { console.warn('[Queue] reportQueue unavailable'); return; }
  await reportQueue.add(type, { type, data });
};

export const enqueueSearchIndexing = async (type, data) => {
  if (!searchIndexQueue) { console.warn('[Queue] searchIndexQueue unavailable'); return; }
  await searchIndexQueue.add(type, { type, data });
};
