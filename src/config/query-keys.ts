/**
 * src/config/query-keys.ts
 * Hệ thống khóa tập trung (Centralized Query Keys) cho React Query
 * Đảm bảo đồng nhất khi fetch, mutate, và invalidate.
 */
export const QUERY_KEYS = {
    USER: ['user', 'profile'],
    AUTH: ['auth', 'session'],
    NOTIFICATIONS: ['notifications'],
    NOTIFICATIONS_UNREAD: ['notifications', 'unread', 'count'],
    CHECKIN_TODAY: ['checkin', 'today'],
    BOOTSTRAP: ['system', 'bootstrap'],
};
