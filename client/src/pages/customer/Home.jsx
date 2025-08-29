import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Red marker for user
const redUserIcon = new L.Icon({
  iconUrl:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  iconRetinaUrl:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const FitBounds = ({ userLocation, stores }) => {
  const map = useMap();
  useEffect(() => {
    const points = [];
    if (userLocation) points.push([userLocation.lat, userLocation.lng]);
    stores.forEach((s) => points.push([s.Location.lat, s.Location.lng]));
    if (points.length > 0) map.fitBounds(points, { padding: [50, 50] });
  }, [userLocation, stores, map]);
  return null;
};

export default function ThriftFinderHome() {
  const [stores, setStores] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [maxDistance, setMaxDistance] = useState(10);
  const [selectedStore, setSelectedStore] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);

  // Fetch stores from backend
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/stores');
        const data = await res.json();

        // Normalize Firestore data into frontend format
        const formatted = data.map((s) => ({
          StoreId: s.id,
          StoreName: s.name || 'Unnamed Store',
          Address: s.address || 'No address',
          Location: {
            lat: s.location?._latitude ?? s.location?.lat,
            lng: s.location?._longitude ?? s.location?.lng,
          },
          ProfileImageURL:
            s.profileImageURL ||
            'https://via.placeholder.com/150?text=Thrift+Store',
          Description: s.description || 'No description available',
        }));

        setStores(formatted);
      } catch (err) {
        console.error('Error fetching stores:', err);
      }
    };
    fetchStores();
  }, []);

  const calculateDistance = (loc1, loc2) => {
    if (!loc1 || !loc2) return Infinity;
    const toRad = (d) => (d * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(loc2.lat - loc1.lat);
    const dLon = toRad(loc2.lng - loc1.lng);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(loc1.lat)) *
        Math.cos(toRad(loc2.lat)) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const getUserLocation = () => {
    setLoadingLocation(true);
    if (!navigator.geolocation) {
      setUserLocation(null);
      setLoadingLocation(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setLoadingLocation(false);
      },
      () => {
        // fallback default (Joburg CBD)
        setUserLocation({ lat: -26.2041, lng: 28.0473 });
        setLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  useEffect(() => {
    getUserLocation();
  }, []);

  const storesWithDistance = stores.map((s) => {
    const distance = userLocation
      ? calculateDistance(userLocation, s.Location)
      : null;
    return { ...s, distance };
  });

  const filteredStores = userLocation
    ? storesWithDistance.filter(
        (s) => s.distance !== Infinity && s.distance <= maxDistance
      )
    : storesWithDistance;

  const sortedStores = [...filteredStores].sort((a, b) => {
    if (a.distance === null) return 1;
    if (b.distance === null) return -1;
    return a.distance - b.distance;
  });

  const navigate = useNavigate();

  return (
    <div className="max-w-6xl mx-auto p-4 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Find Nearby Thrift Stores
        </h1>
        <p className="text-gray-600">
          Discover unique finds at local thrift stores near you
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            {loadingLocation
              ? 'Getting your location...'
              : userLocation
                ? 'Location detected'
                : 'Location unavailable'}
          </span>
          <button
            onClick={getUserLocation}
            className="text-blue-600 text-sm hover:underline"
          >
            Refresh
          </button>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Max Distance:</label>
          <select
            value={maxDistance}
            onChange={(e) => setMaxDistance(Number(e.target.value))}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value={10}>10 km</option>
            <option value={20}>20 km</option>
            <option value={30}>30 km</option>
            <option value={40}>40 km</option>
            <option value={50}>50 km</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', height: '80vh' }}>
        {/* MAP */}
        <div style={{ flex: 1, minHeight: '100%' }}>
          <MapContainer
            center={[-26.2041, 28.0473]}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {userLocation && (
              <Marker
                position={[userLocation.lat, userLocation.lng]}
                icon={redUserIcon}
              >
                <Popup>You are here</Popup>
              </Marker>
            )}
            {filteredStores.map((store) => (
              <Marker
                key={store.StoreId}
                position={[store.Location.lat, store.Location.lng]}
              >
                <Popup>
                  <strong>{store.StoreName}</strong>
                  <br />
                  {store.Address}
                  <br />
                  {store.distance === null
                    ? 'Distance: —'
                    : `${store.distance.toFixed(1)} km away`}
                </Popup>
              </Marker>
            ))}
            <FitBounds userLocation={userLocation} stores={filteredStores} />
          </MapContainer>
        </div>

        {/* STORE LIST */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
          {sortedStores.map((store) => (
            <div
              key={store.StoreId}
              style={{
                marginBottom: '1rem',
                padding: '0.75rem',
                border: '1px solid #ccc',
                borderRadius: '0.5rem',
                cursor: 'pointer',
              }}
              onClick={() => navigate(`/stores/${store.StoreId}`)}
            >
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <img
                  src={store.ProfileImageURL}
                  alt={store.StoreName}
                  style={{
                    width: 80,
                    height: 80,
                    objectFit: 'cover',
                    borderRadius: 8,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3
                    style={{
                      fontWeight: 600,
                      color: '#1F2937',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {store.StoreName}
                  </h3>
                  <p
                    style={{
                      fontSize: '0.875rem',
                      color: '#4B5563',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {store.Address}
                  </p>
                  <p
                    style={{
                      fontSize: '0.75rem',
                      color: '#6B7280',
                      marginTop: 4,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {store.Description}
                  </p>
                  <div style={{ marginTop: 4 }}>
                    <span
                      style={{
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: '#2563EB',
                      }}
                    >
                      {store.distance === null
                        ? 'Distance: —'
                        : `${store.distance.toFixed(1)} km away`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {sortedStores.length === 0 && (
            <p style={{ color: '#6B7280' }}>
              No stores match the current filter.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
