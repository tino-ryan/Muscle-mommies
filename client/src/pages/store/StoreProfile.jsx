import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import StoreSidebar from '../../components/StoreSidebar';
import StarRating from '../../components/StarRating';
import ReviewsModal from '../../components/ReviewsModal';
import { API_URL } from '../../api';
import './StoreProfile.css';

const days = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];
const dayShortNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const defaultHours = Object.fromEntries(
  days.map((day) => [day, { open: false, start: '09:00', end: '17:00' }])
);

// Function to group days with identical hours
const groupHours = (hours) => {
  const grouped = [];
  const daysChecked = new Set();

  days.forEach((day, index) => {
    if (daysChecked.has(day)) return;

    const currentHours = hours[day];
    if (!currentHours) return;

    const sameHoursDays = [dayShortNames[index]];
    daysChecked.add(day);

    for (let i = index + 1; i < days.length; i++) {
      const otherDay = days[i];
      if (daysChecked.has(otherDay)) continue;

      const otherHours = hours[otherDay];
      if (
        otherHours &&
        otherHours.open === currentHours.open &&
        (!currentHours.open ||
          (otherHours.start === currentHours.start &&
            otherHours.end === currentHours.end))
      ) {
        sameHoursDays.push(dayShortNames[i]);
        daysChecked.add(otherDay);
      }
    }

    if (sameHoursDays.length > 1) {
      grouped.push({
        days:
          sameHoursDays.join('–') === 'Mon–Tue–Wed–Thu–Fri'
            ? 'Mon–Fri'
            : sameHoursDays.join(', '),
        hours: currentHours.open
          ? `${currentHours.start}–${currentHours.end}`
          : 'Closed',
      });
    } else {
      grouped.push({
        days: sameHoursDays[0],
        hours: currentHours.open
          ? `${currentHours.start}–${currentHours.end}`
          : 'Closed',
      });
    }
  });

  return grouped;
};

function HoursModal({ isOpen, onClose, hours, onSave }) {
  const [tempHours, setTempHours] = useState(defaultHours);

  useEffect(() => {
    setTempHours({ ...defaultHours, ...hours });
  }, [hours]);

  const handleToggle = (day) => {
    setTempHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], open: !prev[day].open },
    }));
  };

  const handleTimeChange = (day, field, value) => {
    setTempHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const save = () => {
    onSave(tempHours);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal">
      <div className="modal-content">
        <span className="close" onClick={onClose}>
          &times;
        </span>
        <h3>Set Operating Hours</h3>
        <div className="hours-grid">
          {days.map((day) => (
            <div key={day} className="hours-row">
              <label>{dayShortNames[days.indexOf(day)]}</label>
              <input
                type="checkbox"
                checked={tempHours[day]?.open || false}
                onChange={() => handleToggle(day)}
              />
              {tempHours[day]?.open && (
                <div className="time-inputs">
                  <input
                    type="time"
                    value={tempHours[day].start}
                    onChange={(e) =>
                      handleTimeChange(day, 'start', e.target.value)
                    }
                  />
                  <span>to</span>
                  <input
                    type="time"
                    value={tempHours[day].end}
                    onChange={(e) =>
                      handleTimeChange(day, 'end', e.target.value)
                    }
                  />
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="modal-actions">
          <button onClick={save}>Save Hours</button>
          <button className="cancel-button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StoreProfile() {
  const [store, setStore] = useState({
    storeName: '',
    description: '',
    theme: 'theme-default',
    address: '',
    location: { lat: '', lng: '' },
    profileImageURL: '',
    averageRating: 0,
    reviewCount: 0,
    hours: defaultHours,
  });
  const [contacts, setContacts] = useState({
    email: '',
    phone: '',
    instagram: '',
    facebook: '',
  });
  const [contactInfos, setContactInfos] = useState([]);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [storeId, setStoreId] = useState(null);
  const [addressSearch, setAddressSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [addressOptions, setAddressOptions] = useState([]);
  const [profileImage, setProfileImage] = useState(null);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [showHoursModal, setShowHoursModal] = useState(false);
  const auth = getAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          setLoading(true);
          const token = await user.getIdToken();
          const storeResponse = await axios.get(`${API_URL}/api/my-store`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (storeResponse.data.storeId) {
            setStoreId(storeResponse.data.storeId);
            setStore({
              storeName: storeResponse.data.storeName || '',
              description: storeResponse.data.description || '',
              theme: storeResponse.data.theme || 'theme-default',
              address: storeResponse.data.address || '',
              location: storeResponse.data.location || { lat: '', lng: '' },
              profileImageURL: storeResponse.data.profileImageURL || '',
              averageRating: storeResponse.data.averageRating || 0,
              reviewCount: storeResponse.data.reviewCount || 0,
              hours: storeResponse.data.hours || defaultHours,
            });
            setEditing(false);
            setError('');
            try {
              const contactResponse = await axios.get(
                `${API_URL}/api/stores/contact-infos`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              const contactData = contactResponse.data || [];
              setContactInfos(contactData);
              setContacts(
                contactData.reduce((acc, c) => {
                  acc[c.type] = c.value;
                  return acc;
                }, {})
              );
            } catch (contactError) {
              console.error('Fetch contact infos error:', contactError.message);
              setContactInfos([]);
              setContacts({
                email: '',
                phone: '',
                instagram: '',
                facebook: '',
              });
            }
          } else {
            setEditing(true);
            setError('No store found. Please create your store profile.');
          }
        } catch (error) {
          console.error(
            'Fetch store error:',
            error.response?.data || error.message
          );
          if (
            error.response?.status === 400 &&
            error.response?.data?.error === 'Store not found'
          ) {
            setEditing(true);
            setError('No store found. Please create your store profile.');
          } else {
            setError(
              'Failed to fetch store: ' +
                (error.response?.data?.error || error.message)
            );
          }
        } finally {
          setLoading(false);
        }
      } else {
        setError('Please log in to view your store.');
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [auth, navigate]);

  const handleStoreChange = (e) => {
    const { name, value } = e.target;
    setStore((prev) => ({ ...prev, [name]: value }));
  };

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
    setStore((prev) => ({
      ...prev,
      address: option.display,
      location: { lat: option.lat, lng: option.lng },
    }));
    setAddressOptions([]);
    setAddressSearch('');
  };

  const handleProfileImageChange = (e) => {
    setProfileImage(e.target.files[0]);
  };

  const handleContactChange = (e) => {
    const { name, value } = e.target;
    setContacts((prev) => ({ ...prev, [name]: value }));
  };

  const deleteContact = async (contactId) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      await axios.delete(`${API_URL}/api/stores/contact-infos/${contactId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      console.error(
        'Failed to delete contact: ' +
          (error.response?.data?.error || error.message)
      );
    }
  };

  const openContact = (type, value) => {
    let url;
    switch (type) {
      case 'email':
        url = `mailto:${value}`;
        break;
      case 'phone':
        url = `tel:${value}`;
        break;
      case 'instagram':
        url = `https://instagram.com/${value.replace('@', '')}`;
        break;
      case 'facebook':
        url = `https://facebook.com/${value.replace('@', '')}`;
        break;
      default:
        return;
    }
    window.open(url, '_blank');
  };

  const handleViewReviews = () => {
    setShowReviewsModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!store.storeName.trim()) {
      setError('Store name is required.');
      return;
    }

    const contactValues = Object.values(contacts);
    if (contactValues.every((v) => !v.trim())) {
      setError('At least one contact info is required.');
      return;
    }

    if (!store.location.lat || !store.location.lng) {
      setError('Please search and select an address to set location.');
      return;
    }

    try {
      setLoading(true);
      const token = await auth.currentUser?.getIdToken();
      let profileImageURL = store.profileImageURL;

      if (profileImage) {
        const formData = new FormData();
        formData.append('profileImage', profileImage);
        const uploadResponse = await axios.post(
          `${API_URL}/api/stores/upload-image`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        profileImageURL = uploadResponse.data.imageURL;
      }

      const storeData = {
        storeName: store.storeName,
        description: store.description || '',
        theme: store.theme || 'theme-default',
        address: store.address || '',
        location: JSON.stringify(store.location),
        profileImageURL: profileImageURL || '',
        hours: JSON.stringify(store.hours),
      };

      const storeResponse = await axios.post(
        `${API_URL}/api/stores`,
        storeData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setStoreId(storeResponse.data.storeId);
      setStore({
        storeName: storeResponse.data.storeName,
        description: storeResponse.data.description,
        theme: storeResponse.data.theme || 'theme-default',
        address: storeResponse.data.address,
        location: storeResponse.data.location,
        profileImageURL: storeResponse.data.profileImageURL,
        averageRating: storeResponse.data.averageRating || 0,
        reviewCount: storeResponse.data.reviewCount || 0,
        hours: storeResponse.data.hours || defaultHours,
      });

      // Update contacts
      for (const contact of contactInfos) {
        await deleteContact(contact.id);
      }

      for (const [type, value] of Object.entries(contacts)) {
        if (value.trim()) {
          await axios.post(
            `${API_URL}/api/stores/contact-infos`,
            { type, value },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }
      }

      // Refetch contacts
      const contactResponse = await axios.get(
        `${API_URL}/api/stores/contact-infos`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const contactData = contactResponse.data || [];
      setContactInfos(contactData);
      setContacts(
        contactData.reduce((acc, c) => {
          acc[c.type] = c.value;
          return acc;
        }, {})
      );

      setEditing(false);
      setProfileImage(null);
      setError('');
      alert('Store profile saved successfully!');
    } catch (error) {
      console.error('Submit error:', error.response?.data || error.message);
      setError(
        'Failed to save store profile: ' +
          (error.response?.data?.error || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSaveHours = async (newHours) => {
    try {
      setLoading(true);
      const token = await auth.currentUser?.getIdToken();
      const storeData = {
        storeName: store.storeName,
        description: store.description || '',
        theme: store.theme || 'theme-default',
        address: store.address || '',
        location: JSON.stringify(store.location),
        profileImageURL: store.profileImageURL || '',
        hours: JSON.stringify(newHours),
      };

      const storeResponse = await axios.post(
        `${API_URL}/api/stores`,
        storeData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setStore((prev) => ({
        ...prev,
        hours: storeResponse.data.hours || defaultHours,
      }));
      setError('');
      alert('Operating hours saved successfully!');
    } catch (error) {
      console.error(
        'Error saving hours:',
        error.response?.data || error.message
      );
      setError(
        'Failed to save hours: ' +
          (error.response?.data?.error || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setError('');
    setAddressSearch('');
    setAddressOptions([]);
    setProfileImage(null);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      setError('Failed to log out: ' + error.message);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="store-profile">
      <div className="layout-container">
        <StoreSidebar currentPage="Store Profile" onLogout={handleLogout} />
        <div className="content">
          {error && (
            <div className="error-box">
              <i className="fas fa-exclamation-circle"></i>
              <p>{error}</p>
            </div>
          )}
          {editing ? (
            <form onSubmit={handleSubmit} className="store-form">
              <h1 className="page-title">Edit Store Profile</h1>
              <div className="form-content-grid">
                <div className="details-pane">
                  <div className="form-card">
                    <h3>Store Details</h3>
                    <div className="form-grid-2-col">
                      <div className="form-group">
                        <label htmlFor="storeName">
                          Store Name <span className="required">*</span>
                        </label>
                        <input
                          type="text"
                          id="storeName"
                          name="storeName"
                          value={store.storeName}
                          onChange={handleStoreChange}
                          placeholder="Enter your store name"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="theme">Theme</label>
                        <select
                          id="theme"
                          name="theme"
                          value={store.theme || 'theme-default'}
                          onChange={handleStoreChange}
                        >
                          <option value="theme-default">Default</option>
                          <option value="theme-fashion">Fashion</option>
                          <option value="theme-vintage">Vintage</option>
                          <option value="theme-streetwear">Streetwear</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-group">
                      <label htmlFor="description">Description</label>
                      <textarea
                        id="description"
                        name="description"
                        value={store.description}
                        onChange={handleStoreChange}
                        placeholder="Describe your store (e.g., products, mission)"
                      />
                    </div>
                  </div>
                  <div className="form-card">
                    <h3>Location</h3>
                    <div className="form-group">
                      <label htmlFor="addressSearch">
                        Search Address <span className="required">*</span>
                      </label>
                      <div className="address-search">
                        <input
                          type="text"
                          id="addressSearch"
                          value={addressSearch}
                          onChange={handleAddressSearchChange}
                          placeholder="Enter house number, street, suburb, city"
                        />
                        <button
                          type="button"
                          onClick={handleAddressSearch}
                          disabled={isSearching}
                        >
                          {isSearching ? 'Searching...' : 'Search'}
                        </button>
                      </div>
                      {addressOptions.length > 0 && (
                        <div className="address-options">
                          <select
                            onChange={(e) =>
                              handleAddressSelect(
                                addressOptions[e.target.value]
                              )
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
                      <input
                        type="text"
                        name="address"
                        value={store.address}
                        readOnly
                        placeholder="Selected address will appear here"
                      />
                    </div>
                  </div>
                  <div className="form-card">
                    <h3>Operating Hours</h3>
                    <button
                      type="button"
                      onClick={() => setShowHoursModal(true)}
                    >
                      Edit Operating Hours
                    </button>
                  </div>
                  <div className="form-card">
                    <h3>
                      Contact Information <span className="required">*</span>
                    </h3>
                    <div className="form-grid-2-col">
                      {['email', 'phone', 'instagram', 'facebook'].map(
                        (type) => (
                          <div key={type} className="form-group">
                            <label>
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </label>
                            <div className="contact-input">
                              <i className={`fab fa-${type} contact-icon`}></i>
                              <input
                                name={type}
                                value={contacts[type] || ''}
                                onChange={handleContactChange}
                                placeholder={`Enter ${
                                  type === 'phone'
                                    ? 'phone number'
                                    : type === 'email'
                                      ? 'email'
                                      : '@handle'
                                }`}
                              />
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
                <div className="image-pane">
                  <div className="form-card image-card">
                    <h3>Profile Image</h3>
                    <div className="profile-image-container">
                      {store.profileImageURL ? (
                        <img
                          src={store.profileImageURL}
                          alt={store.storeName}
                          className="store-profile-image"
                        />
                      ) : (
                        <div className="no-image">No Image</div>
                      )}
                    </div>
                    <div className="form-group">
                      <label htmlFor="profileImage">Upload New Image</label>
                      <input
                        type="file"
                        id="profileImage"
                        accept="image/*"
                        onChange={handleProfileImageChange}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="form-actions">
                <button type="submit">Save Profile</button>
                <button
                  type="button"
                  className="cancel-button"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="store-display-v2">
              {/* Header Section: Profile Image as Background + Overlaid Info */}
              <div
                className="profile-header-background"
                style={{
                  backgroundImage: `url(${store.profileImageURL || 'https://via.placeholder.com/1200x300?text=Profile+Image'})`,
                }}
              >
                <div className="overlay-info-block">
                  <div className="tag-rating-line">
                    <span className="theme-tag">
                      <i className="fas fa-tag"></i>{' '}
                      {(store.theme || 'theme-default').replace('theme-', '')}
                    </span>
                    <StarRating rating={store.averageRating} />
                    {store.reviewCount > 0 && (
                      <button
                        className="view-reviews-link"
                        onClick={handleViewReviews}
                      >
                        ({store.reviewCount} reviews)
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Main Content: Description and Cards */}
              <div className="profile-main-content">
                <h1 className="store-name">
                  {store.storeName || 'Your Store Name'}
                </h1>
                {/* Description */}
                <div className="description-card">
                  <h2 className="section-title">About Us</h2>
                  <p className="store-description">
                    {store.description ||
                      'No description provided. Tell your customers what makes your thrift store unique!'}
                  </p>
                </div>

                {/* Info Cards Grid */}
                <div className="info-cards-grid">
                  {/* Location & Hours Card */}
                  <div className="info-card location-hours-card">
                    <h2 className="card-title">
                      <i className="fas fa-map-marker-alt"></i> Location & Hours
                    </h2>
                    <p className="store-address">
                      {store.address || 'No physical address set.'}
                    </p>
                    <div className="hours-list">
                      {groupHours(store.hours).map((group, index) => (
                        <div key={index} className="hour-item">
                          <strong>{group.days}:</strong>{' '}
                          <span>{group.hours}</span>
                        </div>
                      ))}
                    </div>
                    <button
                      className="btn-map"
                      onClick={() =>
                        window.open(
                          `https://www.google.com/maps/search/?api=1&query=${store.location.lat},${store.location.lng}`,
                          '_blank'
                        )
                      }
                      disabled={!store.location.lat}
                    >
                      Get Directions
                    </button>
                  </div>

                  {/* Contact Info Card */}
                  <div className="info-card contact-info-card">
                    <h2 className="card-title">
                      <i className="fas fa-phone"></i> Contact Info
                    </h2>
                    {contactInfos.length > 0 ? (
                      <div className="contact-list">
                        {contactInfos.map((contact) => (
                          <p
                            key={contact.id}
                            onClick={() =>
                              openContact(contact.type, contact.value)
                            }
                            className="contact-link"
                          >
                            <i
                              className={`fab fa-${contact.type} contact-icon`}
                            ></i>
                            {contact.value}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p className="no-contact">No contact info provided.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="edit-button-container">
                <button
                  className="edit-profile-btn"
                  onClick={() => setEditing(true)}
                >
                  Edit Profile
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {showReviewsModal && storeId && (
        <ReviewsModal
          storeId={storeId}
          storeName={store.storeName}
          isOpen={showReviewsModal}
          onClose={() => setShowReviewsModal(false)}
        />
      )}
      <HoursModal
        isOpen={showHoursModal}
        onClose={() => setShowHoursModal(false)}
        hours={store.hours}
        onSave={handleSaveHours}
      />
    </div>
  );
}
