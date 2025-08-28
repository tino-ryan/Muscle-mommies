import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import axios from 'axios';
import HamburgerMenu from '../../components/HamburgerMenu';
import './EditListing.css';
import { API_URL } from '../../api'; // Import API_URL from api.js

export default function EditListing() {
  const [item, setItem] = useState({
    name: '',
    description: '',
    category: '',
    size: '',
    price: '',
    quantity: '',
    status: 'Available',
    images: [],
  });
  const [newImages, setNewImages] = useState([]);
  const [error, setError] = useState('');
  const auth = getAuth();
  const navigate = useNavigate();
  const { itemId } = useParams();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken();
          const response = await axios.get(
            `${API_URL}/api/stores/items/${itemId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          setItem(response.data);
        } catch (error) {
          setError('Failed to fetch item: ' + error.message);
          if (
            error.response?.status === 400 ||
            error.response?.status === 404
          ) {
            navigate('/store/listings');
          }
        }
      } else {
        setError('Please log in.');
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [auth, navigate, itemId]);

  const handleItemChange = (e) => {
    const { name, value } = e.target;
    setItem((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    setNewImages([...e.target.files]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!item.name || !item.price || !item.quantity) {
      setError('Name, price, and quantity are required.');
      return;
    }
    try {
      const token = await auth.currentUser?.getIdToken();
      const formData = new FormData();
      formData.append('name', item.name);
      formData.append('description', item.description);
      formData.append('category', item.category);
      formData.append('size', item.size);
      formData.append('price', item.price);
      formData.append('quantity', item.quantity);
      formData.append('status', item.status);
      newImages.forEach((image) => formData.append('images', image));
      await axios.put(`${API_URL}/api/stores/items/${itemId}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      alert('Item updated successfully!');
      navigate('/store/listings');
    } catch (error) {
      setError('Failed to update item: ' + error.message);
    }
  };

  return (
    <div className="edit-listing">
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
            className="sidebar-item active"
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
            className="sidebar-item"
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
          <form onSubmit={handleSubmit} className="item-form">
            <h2>Edit Listing</h2>
            <input
              type="text"
              name="name"
              value={item.name}
              onChange={handleItemChange}
              placeholder="Item Name"
              required
            />
            <textarea
              name="description"
              value={item.description}
              onChange={handleItemChange}
              placeholder="Description"
            />
            <input
              type="text"
              name="category"
              value={item.category}
              onChange={handleItemChange}
              placeholder="Category"
            />
            <input
              type="text"
              name="size"
              value={item.size}
              onChange={handleItemChange}
              placeholder="Size"
            />
            <input
              type="number"
              name="price"
              value={item.price}
              onChange={handleItemChange}
              placeholder="Price"
              required
            />
            <input
              type="number"
              name="quantity"
              value={item.quantity}
              onChange={handleItemChange}
              placeholder="Quantity"
              required
            />
            <select
              name="status"
              value={item.status}
              onChange={handleItemChange}
            >
              <option value="Available">Available</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
            <div className="current-images">
              <h3>Current Images</h3>
              {item.images?.length > 0 ? (
                item.images.map((image, index) => (
                  <img
                    key={index}
                    src={image.imageURL}
                    alt={`Image ${index + 1}`}
                    style={{ width: '100px', margin: '5px' }}
                  />
                ))
              ) : (
                <p>No images available.</p>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
            />
            <button type="submit">Update Item</button>
          </form>
          {error && <div className="error">{error}</div>}
        </div>
      </div>
    </div>
  );
}
