import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import axios from 'axios';
import { API_URL } from '../../api';
import './AddListing.css';

export default function AddListing() {
  const [item, setItem] = useState({
    name: '',
    description: '',
    category: '',
    department: '',
    style: '',
    size: '',
    price: '',
    quantity: '',
    status: 'Available',
  });
  const [images, setImages] = useState([]);
  const [error, setError] = useState('');
  const auth = getAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setError('Please log in.');
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [auth, navigate]);

  const handleItemChange = (e) => {
    const { name, value } = e.target;
    if (name === 'price' && value !== '' && parseFloat(value) <= 0) {
      setError('Price must be a positive number.');
      return;
    }
    if (name === 'quantity' && value !== '' && parseInt(value) <= 0) {
      setError('Quantity must be a positive whole number.');
      return;
    }
    setItem((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    setImages([...e.target.files]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (
      !item.name ||
      !item.price ||
      !item.quantity ||
      !item.category ||
      !item.department
    ) {
      setError('Name, price, quantity, category, and department are required.');
      return;
    }
    if (parseFloat(item.price) <= 0) {
      setError('Price must be a positive number.');
      return;
    }
    if (parseInt(item.quantity) <= 0) {
      setError('Quantity must be a positive whole number.');
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
      formData.append('department', item.department);
      formData.append('style', item.style);

      images.forEach((image) => formData.append('images', image));
      await axios.post(`${API_URL}/api/stores/items`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      alert('Item added successfully!');
      navigate('/store/listings');
    } catch (error) {
      console.error('Add item error:', error.response?.data || error.message);
      setError(
        'Failed to add item: ' + (error.response?.data?.error || error.message)
      );
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

  return (
    <div className="add-listing">
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
            className="sidebar-item"
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
          <h1>Add New Listing</h1>
          {error && <div className="error">{error}</div>}
          <form onSubmit={handleSubmit} className="add-listing-form">
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
            <select
              name="category"
              value={item.category}
              onChange={handleItemChange}
              required
            >
              <option value="">Select Category</option>
              <option value="tops">Tops</option>
              <option value="shirts">Shirts</option>
              <option value="pants">Pants</option>
              <option value="dresses">Dresses</option>
              <option value="footwear">Footwear</option>
              <option value="skirts">Skirts</option>
              <option value="accessories">Accessories</option>
            </select>
            <select
              name="department"
              value={item.department}
              onChange={handleItemChange}
              required
            >
              <option value="">Select Department</option>
              <option value="women's">Women&apos;s</option>
              <option value="men's">Men&apos;s</option>
              <option value="children">Children</option>
              <option value="unisex">Unisex</option>
            </select>
            <input
              type="text"
              name="style"
              value={item.style}
              onChange={handleItemChange}
              placeholder="Style (e.g., y2k, grunge)"
            />
            <select name="size" value={item.size} onChange={handleItemChange}>
              <option value="">Select Size (optional)</option>
              <option value="XS">XS</option>
              <option value="S">S</option>
              <option value="M">M</option>
              <option value="L">L</option>
              <option value="XL">XL</option>
              <option value="XXL">XXL</option>
              <option value="6">6</option>
              <option value="8">8</option>
              <option value="10">10</option>
              <option value="12">12</option>
              <option value="14">14</option>
              <option value="16">16</option>
            </select>
            <div className="price-input-container">
              <span className="currency-label">R</span>
              <input
                type="number"
                name="price"
                value={item.price}
                onChange={handleItemChange}
                placeholder="Price"
                step="0.01"
                min="0.01"
                required
              />
            </div>
            <input
              type="number"
              name="quantity"
              value={item.quantity}
              onChange={handleItemChange}
              placeholder="Quantity"
              step="1"
              min="1"
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
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
            />
            <button type="submit">Add Item</button>
          </form>
        </div>
      </div>
    </div>
  );
}
