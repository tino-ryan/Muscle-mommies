// pages/ThriftFinderHome.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// --- NAVBAR COMPONENT ---
function NavBar() {
  const navigate = useNavigate();
  return (
    <nav className="bg-white shadow-md px-6 py-4 flex justify-between items-center sticky top-0 z-50">
      <div
        className="text-xl font-bold text-gray-800 cursor-pointer"
        onClick={() => navigate('/')}
      >
        ThriftFinder
      </div>
      <div className="flex space-x-4">
        <button
          onClick={() => navigate('/')}
          className="px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition"
        >
          Home
        </button>
        <button
          onClick={() => navigate('/Search')}
          className="px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition"
        >
          Search
        </button>
        <button
          onClick={() => navigate('/profile')}
          className="px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition"
        >
          Profile
        </button>
      </div>
    </nav>
  );
}

// --- LEAFLET ICON CONFIG ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

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

// --- FIT BOUNDS COMPONENT ---
const FitBounds = ({ userLocation, stores }) => {
  const map = useMap();
  useEffect(() => {
    const points = [];
    if (userLocation) points.push([userLocation.lat, userLocation.lng]);
    stores.forEach((s) => points.push([s.location.lat, s.location.lng]));
    if (points.length > 0) map.fitBounds(points, { padding: [50, 50] });
  }, [userLocation, stores, map]);
  return null;
};

// --- MAIN PAGE COMPONENT ---
export default function ThriftFinderHome() {
  const [stores, setStores] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [maxDistance, setMaxDistance] = useState(10);
  const [loadingLocation, setLoadingLocation] = useState(false);

  const navigate = useNavigate();

  // Fetch stores
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/stores');
        const data = await res.json();

        const formatted = data
          .filter(
            (s) =>
              (s.lat !== undefined && s.lng !== undefined) ||
              (s.location && s.location.lat && s.location.lng)
          )
          .map((s) => ({
            id: s.storeId || s.id,
            name: s.storeName || 'Unnamed Store',
            address: s.address || 'No address',
            location: s.location
              ? {
                  lat: parseFloat(s.location.lat),
                  lng: parseFloat(s.location.lng),
                }
              : { lat: parseFloat(s.lat), lng: parseFloat(s.lng) },
            profileImageURL:
              s.profileImageURL ||
              'https://via.placeholder.com/150?text=Thrift+Store',
            description: s.description || 'No description available',
            contactInfo: s.contactInfo || 'No contact info',
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
        setUserLocation({ lat: -26.2041, lng: 28.0473 }); // fallback Joburg CBD
        setLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  useEffect(() => getUserLocation(), []);

  const storesWithDistance = stores.map((s) => ({
    ...s,
    distance: userLocation ? calculateDistance(userLocation, s.location) : null,
  }));

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

  return (
    <div className="bg-gray-50 min-h-screen">
      <NavBar />

      <div className="max-w-6xl mx-auto p-4">
        {/* HEADER */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            Find Nearby Thrift Stores
          </h1>
        </div>

        {/* CONTROLS */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                loadingLocation
                  ? 'bg-yellow-100 text-yellow-800'
                  : userLocation
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
              }`}
            >
              {loadingLocation
                ? 'Getting your location...'
                : userLocation
                  ? 'Location detected'
                  : 'Location unavailable'}
            </span>
            <button
              onClick={getUserLocation}
              className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 transition"
            >
              Refresh
            </button>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">
              Max Distance:
            </label>
            <select
              value={maxDistance}
              onChange={(e) => setMaxDistance(Number(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={10}>10 km</option>
              <option value={20}>20 km</option>
              <option value={30}>30 km</option>
              <option value={40}>40 km</option>
              <option value={50}>50 km</option>
            </select>
          </div>
        </div>

        {/* MAIN CONTENT */}
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
                  key={store.id}
                  position={[store.location.lat, store.location.lng]}
                >
                  <Popup>
                    <strong>{store.name}</strong>
                    <br />
                    {store.address}
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
                key={store.id}
                style={{
                  marginBottom: '1rem',
                  padding: '0.75rem',
                  border: '1px solid #ccc',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                }}
                onClick={() => navigate(`/Store/${store.id}`)}
              >
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <img
                    src={store.profileImageURL}
                    alt={store.name}
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
                      {store.name}
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
                      {store.address}
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
                      {store.description}
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
    </div>
  );
}
