import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import axios from 'axios';
import HamburgerMenu from '../../components/HamburgerMenu';
import './StoreProfile.css';
import { useNavigate } from 'react-router-dom';

export default function StoreProfile() {
  const [store, setStore] = useState({
    storeName: '',
    description: '',
    address: '',
    location: { lat: '', lng: '' },
    profileImageURL: '',
  });
  const [contactInfos, setContactInfos] = useState([]);
  const [newContact, setNewContact] = useState({ type: 'email', value: '' });
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [storeId, setStoreId] = useState(null);
  const [addressSearch, setAddressSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [addressOptions, setAddressOptions] = useState([]);
  const [profileImage, setProfileImage] = useState(null);
  const auth = getAuth();
  const navigate = useNavigate();
  const API_URL = 'http://localhost:3000';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken();
          const storeResponse = await axios.get(
            `${API_URL}/api/stores/my-store`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (storeResponse.data.storeId) {
            setStoreId(storeResponse.data.storeId);
            setStore(storeResponse.data);
            const contactResponse = await axios.get(
              `${API_URL}/api/stores/contact-infos`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            setContactInfos(contactResponse.data);
          } else {
            setEditing(true); // Prompt setup if no store
          }
        } catch (error) {
          console.error(
            'Fetch store error:',
            error.response?.data || error.message
          );
          setError(
            'Failed to fetch store: ' +
              (error.response?.data?.error || error.message)
          );
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
      setError(
        'Please enter house number, street name, suburb, and city (e.g., 123 Main St, Rondebosch, Cape Town).'
      );
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
          headers: {
            'User-Agent': 'MuscleMommies/1.0 (contact@example.com)',
          },
        }
      );
      if (response.data.length > 0) {
        const options = response.data.map((result) => ({
          display: `${
            result.address.house_number ? result.address.house_number + ' ' : ''
          }${result.address.road || result.address.street || 'Unknown Street'}, ${
            result.address.suburb ||
            result.address.neighbourhood ||
            'Unknown Suburb'
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
      console.error(
        'Address search error:',
        error.response?.data || error.message
      );
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
      console.error(
        'Add contact error:',
        error.response?.data || error.message
      );
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
      console.error(
        'Delete contact error:',
        error.response?.data || error.message
      );
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
      const token = await auth.currentUser?.getIdToken();
      let profileImageURL = store.profileImageURL;
      if (profileImage) {
        const formData = new FormData();
        formData.append('profileImage', profileImage);
        const response = await axios.post(
          `${API_URL}/api/stores/upload-image`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        profileImageURL = response.data.imageURL;
      }
      const storeData = {
        storeName: store.storeName,
        description: store.description,
        address: store.address,
        location: JSON.stringify(store.location), // Send as JSON string
        profileImageURL,
      };
      const storeResponse = await axios.post(
        `${API_URL}/api/stores`,
        storeData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setStoreId(storeResponse.data.storeId);
      setStore(storeResponse.data);
      if (newContact.value) await addContact();
      setEditing(false);
      alert('Store updated successfully!');
    } catch (error) {
      console.error('Submit error:', error.response?.data || error.message);
      setError(
        'Failed to update store: ' +
          (error.response?.data?.error || error.message)
      );
    }
  };

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="store-profile">
      <HamburgerMenu />
      <div className="layout-container">
        <div className="sidebar">
          <div className="sidebar-item" onClick={() => navigate('/store/home')}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24px"
              height="24px"
              fill="currentColor"
              viewBox="0 0 256 256"
            >
              <path d="M218.83,103.77l-80-75.48a1.14,1.14,0,0,1-.11-.11,16,16,0,0,0-21.53,0l-.11.11L37.17,103.77A16,16,0,0,0,32,115.55V208a16,16,0,0,0,16,16H96a16,16,0,0,0,16-16V160h32v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V115.55A16,16,0,0,0,218.83,103.77ZM208,208H160V160a16,16,0,0,0-16-16H112a16,16,0,0,0-16,16v48H48V115.55l.11-.1L128,40l79.9,75.43.11.1Z"></path>
            </svg>
            <p>Home</p>
          </div>
          <div
            className="sidebar-item"
            onClick={() => navigate('/store/listings')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24px"
              height="24px"
              fill="currentColor"
              viewBox="0 0 256 256"
            >
              <path d="M56,128a16,16,0,1,1-16-16A16,16,0,0,1,56,128ZM40,48A16,16,0,1,0,56,64,16,16,0,0,0,40,48Zm0,128a16,16,0,1,0,16,16A16,16,0,0,0,40,176Zm176-64H88a8,8,0,0,0-8,8v16a8,8,0,0,0,8,8H216a8,8,0,0,0,8-8V120A8,8,0,0,0,216,112Zm0-64H88a8,8,0,0,0-8,8V72a8,8,0,0,0,8,8H216a8,8,0,0,0,8-8V56A8,8,0,0,0,216,48Zm0,128H88a8,8,0,0,0-8,8v16a8,8,0,0,0,8,8H216a8,8,0,0,0,8-8V184A8,8,0,0,0,216,176Z"></path>
            </svg>
            <p>Listings</p>
          </div>
          <div className="sidebar-item" onClick={() => navigate('/analytics')}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24px"
              height="24px"
              fill="currentColor"
              viewBox="0 0 256 256"
            >
              <path d="M232,208a8,8,0,0,1-8,8H32a8,8,0,0,1-8-8V48a8,8,0,0,1,16,0v94.37L90.73,98a8,8,0,0,1,10.07-.38l58.81,44.11L218.73,90a8,8,0,1,1,10.54,12l-64,56a8,8,0,0,1-10.07.38L96.39,114.29,40,163.63V200H224A8,8,0,0,1,232,208Z"></path>
            </svg>
            <p>Analytics</p>
          </div>
          <div
            className="sidebar-item"
            onClick={() => navigate('/store/reservations')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24px"
              height="24px"
              fill="currentColor"
              viewBox="0 0 256 256"
            >
              <path d="M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM72,48v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24V80H48V48ZM208,208H48V96H208V208Zm-96-88v64a8,8,0,0,1-16,0V132.94l-4.42,2.22a8,8,0,0,1-7.16-14.32l16-8A8,8,0,0,1,112,120Zm59.16,30.45L152,176h16a8,8,0,0,1,0,16H136a8,8,0,0,1-6.4-12.8l28.78-38.37A8,8,0,1,0,145.07,132a8,8,0,1,1-13.85-8A24,24,0,0,1,176,136,23.76,23.76,0,0,1,171.16,150.45Z"></path>
            </svg>
            <p>Reservations</p>
          </div>
          <div
            className="sidebar-item active"
            onClick={() => navigate('/store/profile')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24px"
              height="24px"
              fill="currentColor"
              viewBox="0 0 256 256"
            >
              <path d="M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Z"></path>
            </svg>
            <p>Store Profile</p>
          </div>
        </div>
        <div className="content">
          {editing ? (
            <form onSubmit={handleSubmit} className="store-form">
              <h2>{storeId ? 'Edit Store' : 'Create Store'}</h2>
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
              <button type="submit">Save</button>
            </form>
          ) : (
            <div className="store-display">
              {store.profileImageURL ? (
                <img src={store.profileImageURL} alt={store.storeName} />
              ) : (
                <div className="no-image">No Image</div>
              )}
              <h1>{store.storeName || 'Your Store'}</h1>
              <p>{store.description || 'No description provided.'}</p>
              <p>{store.address || 'No address provided.'}</p>
              <h3>Contact</h3>
              {contactInfos.length > 0 ? (
                contactInfos.map((contact) => (
                  <p
                    key={contact.id}
                    onClick={() => openContact(contact.type, contact.value)}
                    className="contact-link"
                  >
                    {contact.type.charAt(0).toUpperCase() +
                      contact.type.slice(1)}
                    : {contact.value}
                  </p>
                ))
              ) : (
                <p>No contact info provided.</p>
              )}
              <button onClick={() => setEditing(true)}>Edit Profile</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
