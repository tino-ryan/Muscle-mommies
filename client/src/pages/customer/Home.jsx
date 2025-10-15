import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import CustomerSidebar from '../../components/CustomerSidebar';
import './home.css';
import axios from 'axios';

import { API_URL } from '../../api';

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
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Fetch stores
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/stores`);
        const data = response.data;
        const formatted = data
          .filter(
            (s) =>
              (s.location && s.location.lat && s.location.lng) ||
              (s.lat !== undefined && s.lng !== undefined)
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
        setError(
          'Failed to load stores: ' + (err.response?.data?.error || err.message)
        );
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

  // Live location tracking
  useEffect(() => {
    if (!navigator.geolocation) {
      setUserLocation({ lat: -26.2041, lng: 28.0473 }); // Fallback to Johannesburg CBD
      setLoadingLocation(false);
      return;
    }

    setLoadingLocation(true);
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setLoadingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setUserLocation({ lat: -26.2041, lng: 28.0473 }); // Fallback to Johannesburg CBD
        setLoadingLocation(false);
        setError('Unable to access location');
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

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
    <div className="customer-home">
      <CustomerSidebar activePage="home" />
      <div className="layout-container">
        <div className="content">
          <div
            className="header"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
            }}
          >
            <h1>Find Nearby Thrift Stores</h1>
            <div className="nav-buttons">
              <button className="button pink">
                <a onClick={() => navigate('/customer/closet')}>Closet</a>
              </button>
              <button className="button green">
                <a onClick={() => navigate('/badges')}>Badges</a>
              </button>
            </div>
          </div>

          {error && <div className="error">{error}</div>}
          <div className="controls">
            <div className="location-status">
              <span
                className={`status-indicator ${
                  loadingLocation
                    ? 'loading'
                    : userLocation
                    ? 'success'
                    : 'error'
                }`}
              >
                {loadingLocation
                  ? 'Getting your location...'
                  : userLocation
                  ? 'Location detected'
                  : 'Location unavailable'}
              </span>
            </div>
            <div className="distance-selector">
              <label>Max Distance:</label>
              <select
                value={maxDistance}
                onChange={(e) => setMaxDistance(Number(e.target.value))}
              >
                <option value={10}>10 km</option>
                <option value={20}>20 km</option>
                <option value={30}>30 km</option>
                <option value={40}>40 km</option>
                <option value={50}>50 km</option>
              </select>
            </div>
          </div>
          <div className="main-layout">
            <div className="map-container">
              <MapContainer
                center={userLocation || [-26.2041, 28.0473]}
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
            <div className="store-list">
              {sortedStores.map((store) => (
                <div
                  key={store.id}
                  className="store-card"
                  onClick={() => navigate(`/store/${store.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') navigate(`/store/${store.id}`);
                  }}
                >
                  <div className="store-card-image-wrapper">
                    <img
                      src={store.profileImageURL}
                      alt={store.name}
                      className="store-image"
                    />
                  </div>
                  <div className="store-info">
                    <h3>{store.name}</h3>
                    <div className="address">
                      <i className="fas fa-map-marker-alt"></i> {store.address}
                    </div>
                    <p className="description">{store.description}</p>
                    <div className="distance">
                      <i className="fas fa-location-arrow"></i>{' '}
                      {store.distance === null
                        ? 'Distance: —'
                        : `${store.distance.toFixed(1)} km away`}
                    </div>
                  </div>
                </div>
              ))}
              {sortedStores.length === 0 && (
                <p className="no-stores">No stores match the current filter.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}