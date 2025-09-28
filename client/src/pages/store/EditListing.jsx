import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import axios from 'axios';
import StoreSidebar from '../../components/StoreSidebar';
import './EditListing.css';
import { API_URL } from '../../api';

export default function EditListing() {
  const [item, setItem] = useState({
    name: '',
    description: '',
    category: '',
    department: '',
    style: '',
    size: '',
    price: '',
    quantity: 1,
    status: 'Available',
    images: [],
  });
  const [newImages, setNewImages] = useState([]);
  const [error, setError] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const auth = getAuth();
  const navigate = useNavigate();
  const { itemId } = useParams();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken();
          const response = await axios.get(`${API_URL}/api/items/${itemId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setItem({
            ...response.data,
            quantity: response.data.quantity || 1,
            price: response.data.price || '',
            images: response.data.images || [],
          });
        } catch (error) {
          console.error(
            'Fetch item error:',
            error.response?.data || error.message
          );
          setError(
            'Failed to fetch item: ' +
              (error.response?.data?.error || error.message)
          );
          if (
            error.response?.status === 400 ||
            error.response?.status === 404
          ) {
            navigate('/store/listings');
          }
        }
      } else {
        setError('Please log in to edit listings.');
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [auth, navigate, itemId]);

  const handleItemChange = (e) => {
    const { name, value } = e.target;
    setError('');
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
    const files = Array.from(e.target.files);
    if (files.length > 5) {
      setError('You can upload a maximum of 5 images.');
      return;
    }
    setNewImages(files);
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
      let url = `${API_URL}/api/stores/items/${itemId}`;
      if (newImages.length > 0) {
        url += '/images';
        const formData = new FormData();
        formData.append('name', String(item.name));
        formData.append('description', String(item.description || ''));
        formData.append('category', String(item.category || ''));
        formData.append('size', String(item.size || ''));
        formData.append('price', String(item.price));
        formData.append('quantity', String(item.quantity));
        formData.append('status', String(item.status));
        formData.append('department', String(item.department || ''));
        formData.append('style', String(item.style || ''));
        newImages.forEach((image) => formData.append('images', image));
        await axios.put(url, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        const payload = {
          name: item.name,
          description: item.description || '',
          category: item.category || '',
          size: item.size || '',
          price: parseFloat(item.price),
          quantity: parseInt(item.quantity, 10),
          status: item.status,
          department: item.department || '',
          style: item.style || '',
        };
        await axios.put(url, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
      alert('Item updated successfully!');
      navigate('/store/listings');
    } catch (error) {
      console.error('Update error:', error.response?.data || error.message);
      setError(
        'Failed to update item: ' +
          (error.response?.data?.error || error.message)
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

  const nextImage = () => {
    if (item.images && item.images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % item.images.length);
    }
  };

  const prevImage = () => {
    if (item.images && item.images.length > 1) {
      setCurrentImageIndex(
        (prev) => (prev - 1 + item.images.length) % item.images.length
      );
    }
  };

  return (
    <div className="edit-listing">
      <div className="layout-container">
        {/* Assume StoreSidebar is handled and styled to collapse/hide on mobile */}
        <StoreSidebar currentPage="Listings" onLogout={handleLogout} />

        <div className="content">
          <h1 className="page-title">
            Edit Listing: {item.name || 'Loading...'}
          </h1>

          {error && (
            <div className="error-box">
              <svg /* ... your error icon path ... */></svg>
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="item-form-new">
            {/* Main Content Grid: Image + Details */}
            <div className="form-content-grid">
              {/* LEFT COLUMN / DETAILS */}
              <div className="details-pane">
                {/* 1. Primary Details Card */}
                <div className="form-card">
                  <h3>Item Details</h3>
                  <div className="form-grid-2-col">
                    {' '}
                    {/* Two-column grid for Name & Price */}
                    <div className="form-group">
                      <label htmlFor="name">
                        Item Name <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={item.name}
                        onChange={handleItemChange}
                        placeholder="Enter item name"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="price">
                        Price (R) <span className="required">*</span>
                      </label>
                      <div className="price-input-container">
                        <span className="currency-label">R</span>
                        <input
                          type="number"
                          id="price"
                          name="price"
                          value={item.price}
                          onChange={handleItemChange}
                          placeholder="0.00"
                          step="0.01"
                          min="0.01"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="description">Description</label>
                    <textarea
                      id="description"
                      name="description"
                      value={item.description}
                      onChange={handleItemChange}
                      placeholder="Describe the item in detail"
                    />
                  </div>
                </div>

                {/* 2. Categorization Card */}
                <div className="form-card">
                  <h3>Categorization</h3>
                  <div className="form-grid-4-col">
                    {' '}
                    {/* Flexible four-column grid */}
                    <div className="form-group">
                      <label htmlFor="category">
                        Category <span className="required">*</span>
                      </label>
                      <select
                        id="category"
                        name="category"
                        value={item.category}
                        onChange={handleItemChange}
                        required
                      >
                        <option value="">Select Category</option>
                        {/* ... (Your category options) ... */}
                        <option value="tops">Tops</option>
                        <option value="shirts">Shirts</option>
                        <option value="pants">Pants</option>
                        <option value="dresses">Dresses</option>
                        <option value="footwear">Footwear</option>
                        <option value="accessories">Accessories</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="department">
                        Department <span className="required">*</span>
                      </label>
                      <select
                        id="department"
                        name="department"
                        value={item.department}
                        onChange={handleItemChange}
                        required
                      >
                        <option value="">Select Department</option>
                        {/* ... (Your department options) ... */}
                        <option value="women's">Women&apos;s</option>
                        <option value="men's">Men&apos;s</option>
                        <option value="children">Children</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="style">Style</label>
                      <select
                        id="style"
                        name="style"
                        value={item.style}
                        onChange={handleItemChange}
                      >
                        <option value="">Select Style (optional)</option>
                        <option value="y2k">Y2K</option>
                        <option value="grunge">Grunge</option>
                        <option value="minimalist">Minimalist</option>
                        <option value="bohemian">Bohemian</option>
                        <option value="streetwear">Streetwear</option>
                        <option value="vintage">Vintage</option>
                        <option value="athleisure">Athleisure</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="size">Size</label>
                      <select
                        id="size"
                        name="size"
                        value={item.size}
                        onChange={handleItemChange}
                      >
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
                    </div>
                  </div>
                </div>

                {/* 3. Inventory Card */}
                <div className="form-card">
                  <h3>Inventory & Status</h3>
                  <div className="form-grid-2-col">
                    {' '}
                    {/* Two-column grid for Inventory */}
                    <div className="form-group">
                      <label htmlFor="quantity">
                        Quantity <span className="required">*</span>
                      </label>
                      <input
                        type="number"
                        id="quantity"
                        name="quantity"
                        value={item.quantity}
                        onChange={handleItemChange}
                        placeholder="1"
                        step="1"
                        min="1"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="status">Status</label>
                      <select
                        id="status"
                        name="status"
                        value={item.status}
                        onChange={handleItemChange}
                      >
                        <option value="Available">Available</option>
                        <option value="Out of Stock">Out of Stock</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN / IMAGES */}
              <div className="image-pane">
                <div className="form-card image-card">
                  <h3>Product Images</h3>

                  {/* Image Carousel (Enhanced) */}
                  {item.images?.length > 0 ? (
                    <div className="image-carousel-new">
                      <img
                        src={item.images[currentImageIndex].imageURL}
                        alt={`${item.name || 'Item'} ${currentImageIndex + 1}`}
                      />
                      {item.images.length > 1 && (
                        <>
                          <button
                            type="button"
                            className="prev-btn"
                            onClick={prevImage}
                          >
                            &lt;
                          </button>
                          <button
                            type="button"
                            className="next-btn"
                            onClick={nextImage}
                          >
                            &gt;
                          </button>
                          <p className="image-counter">
                            {currentImageIndex + 1} / {item.images.length}
                          </p>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="no-image">No current images.</div>
                  )}

                  {/* Image Upload */}
                  <div className="form-group upload-group">
                    <label htmlFor="images">Replace All Images (Max 5)</label>
                    <input
                      type="file"
                      id="images"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                    />
                    {newImages.length > 0 && (
                      <p className="upload-note">
                        {newImages.length} new image(s) selected. They will
                        replace existing images upon update.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Actions */}
            <div className="form-actions">
              <button type="submit">Update Listing</button>
              <button
                type="button"
                className="cancel-button"
                onClick={() => navigate('/store/listings')}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
