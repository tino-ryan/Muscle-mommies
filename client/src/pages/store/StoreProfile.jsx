import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import StarRating from '../../components/StarRating';
import ReviewsModal from '../../components/ReviewsModal';
import { API_URL } from '../../api';
import './StoreProfile.css';

export default function StoreProfile() {
  const [store, setStore] = useState({
    storeName: '',
    description: '',
    address: '',
    location: { lat: '', lng: '' },
    profileImageURL: '',
    averageRating: 0,
    reviewCount: 0,
  });
  const [contactInfos, setContactInfos] = useState([]);
  const [newContact, setNewContact] = useState({ type: 'email', value: '' });
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [storeId, setStoreId] = useState(null);
  const [addressSearch, setAddressSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [addressOptions, setAddressOptions] = useState([]);
  const [profileImage, setProfileImage] = useState(null);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
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
              address: storeResponse.data.address || '',
              location: storeResponse.data.location || { lat: '', lng: '' },
              profileImageURL: storeResponse.data.profileImageURL || '',
              averageRating: storeResponse.data.averageRating || 0,
              reviewCount: storeResponse.data.reviewCount || 0,
            });
            setEditing(false);
            setError('');
            try {
              const contactResponse = await axios.get(
                `${API_URL}/api/stores/contact-infos`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              setContactInfos(contactResponse.data || []);
            } catch (contactError) {
              console.error('Fetch contact infos error:', contactError.message);
              setContactInfos([]);
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
    setNewContact((prev) => ({ ...prev, [name]: value }));
  };

  const addContact = async () => {
    if (!newContact.value.trim()) {
      setError('Contact value cannot be empty.');
      return;
    }
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await axios.post(
        `${API_URL}/api/stores/contact-infos`,
        { type: newContact.type, value: newContact.value },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setContactInfos([...contactInfos, response.data]);
      setNewContact({ type: 'email', value: '' });
    } catch (error) {
      setError(
        'Failed to add contact: ' +
          (error.response?.data?.error || error.message)
      );
    }
  };

  const deleteContact = async (contactId) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      await axios.delete(`${API_URL}/api/stores/contact-infos/${contactId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setContactInfos(
        contactInfos.filter((contact) => contact.id !== contactId)
      );
    } catch (error) {
      setError(
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
    if (contactInfos.length === 0 && !newContact.value) {
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
        address: store.address || '',
        location: JSON.stringify(store.location),
        profileImageURL: profileImageURL || '',
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
        address: storeResponse.data.address,
        location: storeResponse.data.location,
        profileImageURL: storeResponse.data.profileImageURL,
        averageRating: storeResponse.data.averageRating || 0,
        reviewCount: storeResponse.data.reviewCount || 0,
      });

      if (newContact.value) await addContact();
      setEditing(false);
      setProfileImage(null);
      setError('');
      alert('Store created successfully!');
    } catch (error) {
      console.error('Submit error:', error.response?.data || error.message);
      setError(
        'Failed to create store: ' +
          (error.response?.data?.error || error.message)
      );
    } finally {
      setLoading(false);
    }
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
        <div className="sidebar">
          <div className="sidebar-item" onClick={() => navigate('/store/home')}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="currentColor"
              viewBox="0 0 256 256"
            >
              <path d="M218.83,103.77l-80-75.48a1.14,1.14,0,0,1-.11-.11a16,16,0,0,0-21.53,0l-.11.11L37.17,103.77A16,16,0,0,0,32,115.55V208a16,16,0,0,0,16,16H96a16,16,0,0,0,16-16V160h32v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V115.55A16,16,0,0,0,218.83,103.77ZM208,208H160V160a16,16,0,0,0-16-16H112a16,16,0,0,0-16,16v48H48V115.55l.11-.1L128,40l79.9,75.43.11.10Z"></path>
            </svg>
            <p>Home</p>
          </div>
          <div
            className="sidebar-item"
            onClick={() => navigate('/store/listings')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="currentColor"
              viewBox="0 0 256 256"
            >
              <path d="M56,128a16,16,0,1,1-16-16A16,16,0,0,1,56,128ZM40,48A16,16,0,1,0,56,64,16,16,0,0,0,40,48Zm0,128a16,16,0,1,0,16,16A16,16,0,0,0,40,176Zm176-64H88a8,8,0,0,0-8,8v16a8,8,0,0,0,8,8H216a8,8,0,0,0,8-8V120A8,8,0,0,0,216,112Zm0-64H88a8,8,0,0,0-8,8V72a8,8,0,0,0,8,8H216a8,8,0,0,0,8-8V56A8,8,0,0,0,216,48Zm0,128H88a8,8,0,0,0-8,8v16a8,8,0,0,0,8,8H216a8,8,0,0,0,8-8V184A8,8,0,0,0,216,176Z"></path>
            </svg>
            <p>Listings</p>
          </div>
          <div
            className="sidebar-item"
            onClick={() => navigate('/store/reservations')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="currentColor"
              viewBox="0 0 256 256"
            >
              <path d="M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM72,48v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24V80H48V48ZM208,208H48V96H208V208Zm-96-88v64a8,8,0,0,1-16,0V132.94l-4.42,2.22a8,8,0,0,1-7.16-14.32l16-8A8,8,0,0,1,112,120Zm59.16,30.45L152,176h16a8,8,0,0,1,0,16H136a8,8,0,0,1-6.4-12.8l28.78-38.37A8,8,0,1,0,145.07,132a8,8,0,1,1-13.85-8A24,24,0,0,1,176,136,23.76,23.76,0,0,1,171.16,150.45Z"></path>
            </svg>
            <p>Reservations</p>
          </div>
          <div
            className="sidebar-item"
            onClick={() => navigate('/store/chats')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="currentColor"
              viewBox="0 0 256 256"
            >
              <path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm0,16V168.45l-26.88-23.8a16,16,0,0,0-21.81.75L147.47,168H40V56Z M40,184V179.47l25.19-25.18a16,16,0,0,0,21.93-.58L107.47,176H194.12l26.88,23.8a8,8,0,0,0-.12-15.55Z"></path>
            </svg>
            <p>Chats</p>
          </div>
          <div
            className="sidebar-item active"
            onClick={() => navigate('/store/profile')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="currentColor"
              viewBox="0 0 256 256"
            >
              <path d="M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Z"></path>
            </svg>
            <p>Store Profile</p>
          </div>
          <div className="sidebar-item" onClick={handleLogout}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="currentColor"
              viewBox="0 0 256 256"
            >
              <path d="M120,216a8,8,0,0,1-8,8H40a8,8,0,0,1-8-8V40a8,8,0,0,1,8-8h72a8,8,0,0,1,0,16H48V208h64A8,8,0,0,1,120,216Zm108.56-96.56-48-48A8,8,0,0,0,174.93,80H104a8,8,0,0,0,0,16h50.64l35.2,35.2a8,8,0,0,0,11.32,0l48-48A8,8,0,0,0,228.56,119.44Z"></path>
            </svg>
            <p>Logout</p>
          </div>
        </div>
        <div className="content">
          {error && <div className="error">{error}</div>}
          {editing ? (
            <form onSubmit={handleSubmit} className="store-form">
              <h2>Create Store</h2>
              <input
                type="text"
                name="storeName"
                value={store.storeName}
                onChange={handleStoreChange}
                placeholder="Store Name"
                required
              />
              <textarea
                name="description"
                value={store.description}
                onChange={handleStoreChange}
                placeholder="Description"
              />
              <div className="address-search">
                <input
                  type="text"
                  value={addressSearch}
                  onChange={handleAddressSearchChange}
                  placeholder="Enter house number, street, suburb, city (e.g., 123 Main St, Rondebosch, Cape Town)"
                  className="large-input"
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
              <input
                type="text"
                name="address"
                value={store.address}
                readOnly
                placeholder="Selected address will appear here"
              />
              <input type="hidden" name="lat" value={store.location.lat} />
              <input type="hidden" name="lng" value={store.location.lng} />
              <input
                type="file"
                accept="image/*"
                onChange={handleProfileImageChange}
              />
              <h3>Contact Info</h3>
              {contactInfos.map((contact) => (
                <div key={contact.id} className="contact-item">
                  <select value={contact.type} disabled>
                    <option value="email">Email</option>
                    <option value="phone">Phone</option>
                    <option value="instagram">Instagram</option>
                    <option value="facebook">Facebook</option>
                  </select>
                  <input value={contact.value} disabled />
                  <button
                    type="button"
                    onClick={() => deleteContact(contact.id)}
                  >
                    Delete
                  </button>
                </div>
              ))}
              <div className="contact-item">
                <select
                  name="type"
                  value={newContact.type}
                  onChange={handleContactChange}
                >
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="instagram">Instagram</option>
                  <option value="facebook">Facebook</option>
                </select>
                <input
                  name="value"
                  value={newContact.value}
                  onChange={handleContactChange}
                  placeholder="Contact Value (e.g., @handle, email, phone)"
                />
                <button type="button" onClick={addContact}>
                  Add
                </button>
              </div>
              <button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save'}
              </button>
            </form>
          ) : (
            <div className="store-display">
              <div className="store-header-section">
                {store.profileImageURL ? (
                  <img src={store.profileImageURL} alt={store.storeName} className="store-profile-image" />
                ) : (
                  <div className="no-image">No Image</div>
                )}
                <div className="store-info-section">
                  <h1>{store.storeName || 'Your Store'}</h1>
                  <p className="store-description">{store.description || 'No description provided.'}</p>
                  <p className="store-address">{store.address || 'No address provided.'}</p>
                  
                  <div className="store-rating-section">
                    <StarRating 
                      rating={store.averageRating} 
                      reviewCount={store.reviewCount}
                      size="medium"
                    />
                    {store.reviewCount > 0 && (
                      <button 
                        className="view-reviews-btn"
                        onClick={handleViewReviews}
                      >
                        View All Reviews
                      </button>
                    )}
                    {store.reviewCount === 0 && (
                      <p className="no-reviews-text">No reviews yet</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="contact-section">
                <h3>Contact Information</h3>
                {contactInfos.length > 0 ? (
                  <div className="contact-list">
                    {contactInfos.map((contact) => (
                      <p
                        key={contact.id}
                        onClick={() => openContact(contact.type, contact.value)}
                        className="contact-link"
                      >
                        {contact.type.charAt(0).toUpperCase() +
                          contact.type.slice(1)}
                        : {contact.value}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="no-contact">No contact info provided.</p>
                )}
              </div>
              
              <button className="edit-profile-btn" onClick={() => setEditing(true)}>
                Edit Profile
              </button>
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
    </div>
  );
}