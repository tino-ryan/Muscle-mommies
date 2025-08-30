import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import axios from 'axios';
import HamburgerMenu from '../../components/HamburgerMenu';
import './AddListing.css';
import { API_URL } from '../../api'; // Import API_URL from api.js

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

  const handleItemChange = (e) => {
    const { name, value } = e.target;
    setItem((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    setImages([...e.target.files]);
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
      formData.append('department', item.department);
      formData.append('style', item.style);
      images.forEach((image) => formData.append('images', image));
      await axios.post(`${API_URL}/api/stores/items`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      alert('Item created successfully!');
      navigate('/store/listings');
    } catch (error) {
      setError('Failed to create item: ' + error.message);
    }
  };

  return (
    <div className="add-listing">
      <HamburgerMenu />
      <div className="layout-container">
        <div className="sidebar">{/* Same sidebar as StoreProfile.jsx */}</div>
        <div className="content">
          <form onSubmit={handleSubmit} className="item-form">
            <h2>Add New Listing</h2>
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
            <select
              name="department"
              value={item.department}
              onChange={handleItemChange}
            >
              <option value="">Select Department</option>
              <option value="mens">Men&apos;s</option>
              <option value="womens">Women&apos;s</option>
            </select>
            <input
              type="text"
              name="style"
              value={item.style}
              onChange={handleItemChange}
              placeholder="Style Tags (e.g., streetwear,casual)"
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
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
            />
            <button type="submit">Create Item</button>
          </form>
          {error && <div className="error">{error}</div>}
        </div>
      </div>
    </div>
  );
}
