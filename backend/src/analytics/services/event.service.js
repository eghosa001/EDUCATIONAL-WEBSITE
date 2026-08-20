import { query } from '../../common/database/index.js';
import { HTTP_STATUS, ERROR_CODES, AppError } from '../../common/errors/index.js';

export const trackEvent = async (data) => {
  const { type, eventName, screenName, parameters = {}, userId } = data;
  await query(
    `INSERT INTO analytics_events (user_id, type, event_name, screen_name, parameters, created_at)
     VALUES ($1, $2, $3, $4, $5, NOW())`,
    [userId || null, type || 'event', eventName || null, screenName || null, JSON.stringify(parameters)]
  );
};

export const updateUserProperties = async (userId, properties) => {
  await query(
    `INSERT INTO analytics_user_properties (user_id, properties, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (user_id) DO UPDATE SET properties = excluded.properties, updated_at = NOW()`,
    [userId, JSON.stringify(properties)]
  );
};
