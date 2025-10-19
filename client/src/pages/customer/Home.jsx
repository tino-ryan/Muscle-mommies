import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import CustomerSidebar from '../../components/CustomerSidebar';
import './home.css';
import axios from 'axios';
import { auth } from '../../firebase'; // Import Firebase auth
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

// --- SKELETON LOADING COMPONENT ---
const StoreCardSkeleton = () => (
  <div className="store-card skeleton">
    <div className="store-card-image-wrapper skeleton-image"></div>
    <div className="store-info">
      <div className="skeleton-text skeleton-title"></div>
      <div className="skeleton-text skeleton-address"></div>
      <div className="skeleton-text skeleton-description"></div>
      <div className="skeleton-text skeleton-distance"></div>
    </div>
  </div>
);

// --- COOKIE HELPERS ---
const setCookie = (name, value, days = 365) => {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(JSON.stringify(value))}; expires=${expires}; path=/`;
};

const getCookie = (name) => {
  const value = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
  return value ? JSON.parse(decodeURIComponent(value.pop())) : null;
};

// --- MAIN PAGE COMPONENT ---
export default function ThriftFinderHome() {
  const [stores, setStores] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [maxDistance, setMaxDistance] = useState(10);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [loadingStores, setLoadingStores] = useState(true);
  const [error, setError] = useState('');
  const [addressSearch, setAddressSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [addressOptions, setAddressOptions] = useState([]);
  const [showAddressInput, setShowAddressInput] = useState(false);
  const [savedAddress, setSavedAddress] = useState('');
  const navigate = useNavigate();
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // Fetch stores
  useEffect(() => {
    const fetchStores = async () => {
      try {
        setLoadingStores(true);
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
      } finally {
        setLoadingStores(false);
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

  // Get user location (check cookie first, then GPS)
  useEffect(() => {
    // Check if there's a saved location in cookie
    const savedLocation = getCookie('userLocation');
    if (savedLocation && savedLocation.lat && savedLocation.lng) {
      setUserLocation(savedLocation);
      setSavedAddress(savedLocation.address || 'Saved location');
      setLoadingLocation(false);
      console.log('Using saved location from cookie:', savedLocation.address);
      return;
    }

    // No saved location, try GPS
    if (!navigator.geolocation) {
      setUserLocation({ lat: -26.2041, lng: 28.0473 });
      setLoadingLocation(false);
      return;
    }

    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setLoadingLocation(false);
        console.log(
          `Location acquired: ±${pos.coords.accuracy.toFixed(0)}m accuracy`
        );
      },
      (error) => {
        console.error('Geolocation error:', error);
        setUserLocation({ lat: -26.2041, lng: 28.0473 });
        setLoadingLocation(false);
        setError('Unable to access location');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  }, []);

  // Address search handlers (similar to StoreProfile)
  const handleAddressSearchChange = (e) => {
    setAddressSearch(e.target.value);
  };

  const handleAddressSearch = async () => {
    if (!addressSearch.trim()) {
      setError('Please enter house number, street name, suburb, and city.');
      return;
    }
    setIsSearching(true);
    setError('');
    setAddressOptions([]);
    try {
      const response = await axios.get(
        'https://nominatim.openstreetmap.org/search',
        {
          params: {
            q: `${addressSearch}, South Africa`,
            format: 'json',
            addressdetails: 1,
            limit: 5,
            countrycodes: 'ZA',
          },
          headers: { 'User-Agent': 'MuscleMommies/1.0 (contact@example.com)' },
        }
      );
      if (response.data.length > 0) {
        const options = response.data.map((result) => ({
          display: `${
            result.address.house_number ? result.address.house_number + ' ' : ''
          }${result.address.road || 'Unknown Street'}, ${
            result.address.suburb || 'Unknown Suburb'
          }, ${result.address.city || result.address.town || 'Unknown City'}`,
          fullAddress: result.display_name,
          lat: result.lat,
          lng: result.lon,
        }));
        setAddressOptions(options);
      } else {
        setError('No results found for the address. Please try again.');
      }
    } catch (error) {
      setError(
        'Failed to search address: ' +
          (error.response?.data?.error || error.message)
      );
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddressSelect = (option) => {
    const newLocation = {
      lat: parseFloat(option.lat),
      lng: parseFloat(option.lng),
      address: option.display,
    };
    setUserLocation(newLocation);
    setSavedAddress(option.display);
    // Save to cookie
    setCookie('userLocation', newLocation);
    setAddressOptions([]);
    setAddressSearch('');
    setShowAddressInput(false);
    console.log('Location saved to cookie:', option.display);
  };

  const handleClearSavedLocation = () => {
    // Clear cookie
    document.cookie =
      'userLocation=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    setSavedAddress('');
    setUserLocation(null);
    setLoadingLocation(true);

    // Re-trigger GPS location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          setLoadingLocation(false);
          console.log(
            `Location acquired: ±${pos.coords.accuracy.toFixed(0)}m accuracy`
          );
        },
        (error) => {
          console.error('Geolocation error:', error);
          setUserLocation({ lat: -26.2041, lng: 28.0473 });
          setLoadingLocation(false);
          setError('Unable to access location');
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    } else {
      setUserLocation({ lat: -26.2041, lng: 28.0473 });
      setLoadingLocation(false);
    }
  };

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
          <div className="header">
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
                  : savedAddress
                    ? `Using: ${savedAddress}`
                    : userLocation
                      ? 'Location detected'
                      : 'Location unavailable'}
              </span>
              {savedAddress && (
                <button
                  className="clear-location-btn"
                  onClick={handleClearSavedLocation}
                  title="Clear saved location and use GPS"
                >
                  ✕
                </button>
              )}
              <button
                className="set-address-btn"
                onClick={() => setShowAddressInput(!showAddressInput)}
              >
                {showAddressInput ? 'Cancel' : 'Set Address'}
              </button>
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
          {showAddressInput && (
            <div className="address-search-section">
              <div className="address-search-input">
                <input
                  type="text"
                  value={addressSearch}
                  onChange={handleAddressSearchChange}
                  placeholder="Enter house number, street, suburb, city"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleAddressSearch();
                  }}
                />
                <button onClick={handleAddressSearch} disabled={isSearching}>
                  {isSearching ? 'Searching...' : 'Search'}
                </button>
              </div>
              {addressOptions.length > 0 && (
                <div className="address-options">
                  <select
                    onChange={(e) =>
                      handleAddressSelect(addressOptions[e.target.value])
                    }
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Select an address
                    </option>
                    {addressOptions.map((option, index) => (
                      <option key={index} value={index}>
                        {option.display}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
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
                <FitBounds
                  userLocation={userLocation}
                  stores={filteredStores}
                />
              </MapContainer>
            </div>
            <div className="store-list">
              {loadingStores ? (
                // Show 3 skeleton cards while loading
                <>
                  <StoreCardSkeleton />
                  <StoreCardSkeleton />
                  <StoreCardSkeleton />
                </>
              ) : sortedStores.length === 0 ? (
                <p className="no-stores">No stores match the current filter.</p>
              ) : (
                sortedStores.map((store) => (
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
                        <i className="fas fa-map-marker-alt"></i>{' '}
                        {store.address}
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
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
