/**
 * Geospatial Calculations & Haversine Distance Helper
 */

function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 === lat2 && lon1 === lon2) return 0;
  const radlat1 = (Math.PI * lat1) / 180;
  const radlat2 = (Math.PI * lat2) / 180;
  const theta = lon1 - lon2;
  const radtheta = (Math.PI * theta) / 180;
  let dist =
    Math.sin(radlat1) * Math.sin(radlat2) +
    Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
  if (dist > 1) dist = 1;
  dist = Math.acos(dist);
  dist = (dist * 180) / Math.PI;
  dist = dist * 60 * 1.1515;
  dist = dist * 1.609344; // to kilometers
  return parseFloat(dist.toFixed(2));
}

function formatDistance(distKm) {
  if (distKm < 1) {
    return `${Math.round(distKm * 1000)} m`;
  }
  return `${distKm.toFixed(1)} km`;
}

function findNearest(originLat, originLng, items, limit = 5) {
  return items
    .map(item => ({
      ...item,
      distanceKm: calculateDistanceKm(originLat, originLng, item.lat, item.lng),
      formattedDistance: formatDistance(calculateDistanceKm(originLat, originLng, item.lat, item.lng))
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
}

module.exports = {
  calculateDistanceKm,
  formatDistance,
  findNearest
};
