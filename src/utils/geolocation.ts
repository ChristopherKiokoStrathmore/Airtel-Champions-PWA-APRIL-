export interface GeoPosition {
  lat: number;
  lng: number;
  accuracy: number;
}

export function captureCurrentPosition(): Promise<GeoPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Location unavailable. Your browser does not support geolocation.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = pos.coords.accuracy;
        if (isNaN(lat) || isNaN(lng) || isNaN(accuracy)) {
          reject(new Error('Invalid GPS coordinates received. Please try again.'));
          return;
        }
        resolve({ lat, lng, accuracy });
      },
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            reject(new Error('Location permission denied. Please allow location access and try again.'));
            break;
          case err.POSITION_UNAVAILABLE:
            reject(new Error('Location unavailable. Please check your GPS signal.'));
            break;
          case err.TIMEOUT:
            reject(new Error('Location request timed out. Please try again.'));
            break;
          default:
            reject(new Error('Could not get location. Please try again.'));
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}
