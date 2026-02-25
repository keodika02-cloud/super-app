/**
 * Calculate distance between two coordinates in meters using Haversine formula
 * @param lat1 Latitude of point 1
 * @param lon1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lon2 Longitude of point 2
 * @returns Distance in meters
 */
export const haversine = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Bán kính trái đất (mét)
    const φ1 = (lat1 * Math.PI) / 180; // Đổi sang radians
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const d = R * c; // Khoảng cách theo mét
    return Math.round(d * 100) / 100; // Làm tròn 2 số thập phân
};
