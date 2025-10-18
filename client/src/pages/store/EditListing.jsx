
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
          console.error('Fetch item error:', error.response?.data || error.message);
          setError('Failed to fetch item: ' + (error.response?.data?.error || error.message));
          if (error.response?.status === 400 || error.response?.status === 404) {
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
    if (!item.name || !item.price || !item.quantity || !item.category || !item.department) {
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
      setError('Failed to update item: ' + (error.response?.data?.error || error.message));
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
      setCurrentImageIndex((prev) => (prev - 1 + item.images.length) % item.images.length);
    }
  };

  // Inline styles
  const inputStyle = {
    padding: '14px 16px',
    border: '1px solid #000000',
    borderRadius: '9999px',
    fontSize: '16px',
    color: '#000000',
    background: 'rgba(255, 255, 255, 0.8)',
    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.5), 0 4px 0 #000000',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box',
    minHeight: '48px',
    width: '100%',
    fontFamily: '"Plus Jakarta Sans", sans-serif',
  };

  const inputHoverFocusStyle = `
    .input-field:hover, .text-area:hover, .select-menu:hover, .file-upload:hover {
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5), 0 6px 12px rgba(0, 0, 0, 0.15) !important;
    }
    .input-field:focus, .text-area:focus, .select-menu:focus, .file-upload:focus, .price-input-container:focus-within {
      outline: none !important;
      border-color: #D8FF6C !important;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5), 0 0 0 3px rgba(216, 255, 108, 0.3) !important;
    }
  `;

  const selectStyle = {
    ...inputStyle,
    appearance: 'none',
    backgroundImage: 'url("data:image/svg+xml;utf8,<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"24\\" height=\\"24\\" fill=\\"%23000000\\"><path d=\\"M7 10l5 5 5-5z\\"/></svg>")',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 16px center',
    paddingRight: '40px',
    cursor: 'pointer',
  };

  const textareaStyle = {
    ...inputStyle,
    minHeight: '120px',
    borderRadius: '12px',
    resize: 'vertical',
  };

  const fileInputStyle = {
    display: 'none',
  };

  const fileButtonStyle = {
    display: 'inline-block',
    padding: '14px 32px',
    border: '1px solid #000000',
    borderRadius: '9999px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#000000',
    background: '#FF9AE9',
    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.5), 0 4px 0 #000000',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    textAlign: 'center',
    width: '100%',
    fontFamily: '"Plus Jakarta Sans", sans-serif',
  };

  const fileButtonHoverStyle = `
    .file-button:hover {
      background: #FFC1EE !important;
      transform: translateY(-2px) !important;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5), 0 6px 12px rgba(0, 0, 0, 0.15) !important;
    }
    .file-button:active {
      background: #E88AD0 !important;
      transform: translateY(2px) !important;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5), inset 0 -2px 0 #000000 !important;
    }
  `;

  const buttonStyle = {
    padding: '14px 32px',
    border: '1px solid #000000',
    borderRadius: '9999px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.5), 0 4px 0 #000000',
    transition: 'all 0.2s ease',
    minWidth: '160px',
    fontFamily: '"Plus Jakarta Sans", sans-serif',
  };

  const carouselButtonStyle = {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    padding: '8px 12px',
    border: '1px solid #000000',
    borderRadius: '9999px',
    background: '#D8FF6C',
    color: '#000000',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.5), 0 4px 0 #000000',
    transition: 'all 0.2s ease',
    fontFamily: '"Plus Jakarta Sans", sans-serif',
  };

  const carouselButtonHoverStyle = `
    .prev-btn:hover, .next-btn:hover {
      transform: translateY(-52%) !important;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5), 0 6px 12px rgba(0, 0, 0, 0.15) !important;
    }
    .prev-btn:active, .next-btn:active {
      transform: translateY(-48%) !important;
      background: #BCE84D !important;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5), inset 0 -2px 0 #000000 !important;
    }
  `;

  const labelStyle = {
    fontSize: '14px',
    fontWeight: '600',
    color: '#000000',
    fontFamily: '"Plus Jakarta Sans", sans-serif',
    textTransform: 'uppercase',
  };

  const headingStyle = {
    fontSize: '20px',
    fontWeight: '700',
    color: '#000000',
    fontFamily: '"Plus Jakarta Sans", sans-serif',
    marginBottom: '20px',
    paddingBottom: '8px',
    borderBottom: '1px solid #D8FF6C',
  };

  return (
    <div className="edit-listing">
      <style>{inputHoverFocusStyle}</style>
      <style>{fileButtonHoverStyle}</style>
      <style>{carouselButtonHoverStyle}</style>
      <div className="layout-container">
        <StoreSidebar currentPage="Listings" onLogout={handleLogout} />
        <div className="content">
          <h1
            className="page-title"
            style={{
              fontSize: '48px',
              fontWeight: '700',
              color: '#000000',
              fontFamily: '"Orbitron", "Plus Jakarta Sans", sans-serif',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              marginBottom: '48px',
              textShadow: '1px 1px 2px rgba(0, 0, 0, 0.1)',
            }}
          >
            Edit Listing: {item.name || 'Loading...'}
          </h1>

          {error && (
            <div className="error-box">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="currentColor"
                viewBox="0 0 256 256"
                style={{ width: '24px', height: '24px', color: '#FF9AE9', flexShrink: 0 }}
              >
                <path d="M224,128A96,96,0,1,1,128,32,96.11,96.11,0,0,1,224,128Zm-20,0a76,76,0,1,0-76,76A76.08,76.08,0,0,0,204,128ZM128,168a8,8,0,0,0,8-8V104a8,8,0,0,0-16,0v56A8,8,0,0,0,128,168ZM128,88a8,8,0,1,0-8-8A8,8,0,0,0,128,88Z"></path>
              </svg>
              <p style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="item-form-new">
            <div className="form-content-grid">
              {/* LEFT COLUMN / DETAILS */}
              <div className="details-pane">
                {/* 1. Primary Details Card */}
                <div className="form-card">
                  <h3 style={headingStyle}>Item Details</h3>
                  <div className="form-grid-2-col">
                    <div className="form-group">
                      <label htmlFor="name" style={labelStyle}>
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
                        className="input-field"
                        style={inputStyle}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="price" style={labelStyle}>
                        Price (R) <span className="required">*</span>
                      </label>
                      <div className="price-input-container" style={inputStyle}>
                        <span
                          className="currency-label"
                          style={{ padding: '0 16px', fontSize: '16px', color: '#000000', fontWeight: '600', lineHeight: '1.5', fontFamily: '"Plus Jakarta Sans", sans-serif' }}
                        >
                          R
                        </span>
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
                          className="price-input"
                          style={{ flexGrow: 1, border: 'none', padding: '14px 0', background: 'transparent', fontSize: '16px', color: '#000000', lineHeight: '1.5', fontFamily: '"Plus Jakarta Sans", sans-serif' }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="description" style={labelStyle}>
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={item.description}
                      onChange={handleItemChange}
                      placeholder="Describe the item in detail"
                      className="text-area"
                      style={textareaStyle}
                    />
                  </div>
                </div>

                {/* 2. Categorization Card */}
                <div className="form-card">
                  <h3 style={headingStyle}>Categorization</h3>
                  <div className="form-grid-4-col">
                    <div className="form-group">
                      <label htmlFor="category" style={labelStyle}>
                        Category <span className="required">*</span>
                      </label>
                      <select
                        id="category"
                        name="category"
                        value={item.category}
                        onChange={handleItemChange}
                        required
                        className="select-menu"
                        style={selectStyle}
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
                    </div>
                    <div className="form-group">
                      <label htmlFor="department" style={labelStyle}>
                        Department <span className="required">*</span>
                      </label>
                      <select
                        id="department"
                        name="department"
                        value={item.department}
                        onChange={handleItemChange}
                        required
                        className="select-menu"
                        style={selectStyle}
                      >
                        <option value="">Select Department</option>
                        <option value="women's">Women&apos;s</option>
                        <option value="men's">Men&apos;s</option>
                        <option value="children">Children</option>
                        <option value="unisex">Unisex</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="style" style={labelStyle}>
                        Style
                      </label>
                      <select
                        id="style"
                        name="style"
                        value={item.style}
                        onChange={handleItemChange}
                        className="select-menu"
                        style={selectStyle}
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
                      <label htmlFor="size" style={labelStyle}>
                        Size
                      </label>
                      <select
                        id="size"
                        name="size"
                        value={item.size}
                        onChange={handleItemChange}
                        className="select-menu"
                        style={selectStyle}
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
                  <h3 style={headingStyle}>Inventory & Status</h3>
                  <div className="form-grid-2-col">
                    <div className="form-group">
                      <label htmlFor="quantity" style={labelStyle}>
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
                        className="input-field"
                        style={inputStyle}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="status" style={labelStyle}>
                        Status
                      </label>
                      <select
                        id="status"
                        name="status"
                        value={item.status}
                        onChange={handleItemChange}
                        className="select-menu"
                        style={selectStyle}
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
                  <h3 style={headingStyle}>
                    Product Images <span className="required">*</span>
                  </h3>
                  {item.images?.length > 0 ? (
                    <div className="image-carousel-new" style={{ position: 'relative', width: '100%', height: '200px', marginBottom: '16px' }}>
                      <img
                        src={item.images[currentImageIndex].imageURL}
                        alt={`${item.name || 'Item'} ${currentImageIndex + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px', border: '1px solid #000000', boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.5), 0 4px 0 #000000' }}
                      />
                      {item.images.length > 1 && (
                        <>
                          <button
                            type="button"
                            className="prev-btn"
                            onClick={prevImage}
                            style={{ ...carouselButtonStyle, left: '10px' }}
                          >
                            &lt;
                          </button>
                          <button
                            type="button"
                            className="next-btn"
                            onClick={nextImage}
                            style={{ ...carouselButtonStyle, right: '10px' }}
                          >
                            &gt;
                          </button>
                          <p
                            className="image-counter"
                            style={{
                              position: 'absolute',
                              bottom: '10px',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              background: 'rgba(255, 255, 255, 0.8)',
                              border: '1px solid #000000',
                              borderRadius: '9999px',
                              padding: '4px 12px',
                              fontSize: '12px',
                              color: '#000000',
                              fontWeight: '500',
                              fontFamily: '"Plus Jakarta Sans", sans-serif',
                            }}
                          >
                            {currentImageIndex + 1} / {item.images.length}
                          </p>
                        </>
                      )}
                    </div>
                  ) : (
                    <div
                      className="no-image"
                      style={{
                        width: '100%',
                        height: '200px',
                        background: 'rgba(255, 255, 255, 0.8)',
                        border: '1px solid #000000',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px',
                        color: '#000000',
                        marginBottom: '16px',
                        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.5), 0 4px 0 #000000',
                        fontFamily: '"Plus Jakarta Sans", sans-serif',
                      }}
                    >
                      No current images.
                    </div>
                  )}

                  <div className="form-group upload-group">
                    <label htmlFor="images" style={labelStyle}>
                      Replace All Images (Max 5)
                    </label>
                    <div>
                      <input
                        type="file"
                        id="images"
                        accept="image/*"
                        multiple
                        onChange={handleImageChange}
                        className="file-upload"
                        style={fileInputStyle}
                      />
                      <label
                        htmlFor="images"
                        className="file-button"
                        style={fileButtonStyle}
                      >
                        Choose Images
                      </label>
                    </div>
                    {newImages.length > 0 && (
                      <p
                        className="upload-note"
                        style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '14px', color: '#000000', marginTop: '8px' }}
                      >
                        {newImages.length} new image(s) selected. They will replace existing images upon update.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="primary-button"
                style={{ ...buttonStyle, background: '#FF9AE9', color: '#000000' }}
              >
                Update Listing
              </button>
              <button
                type="button"
                className="cancel-button"
                onClick={() => navigate('/store/listings')}
                style={{ ...buttonStyle, background: '#CCCCCC', color: '#000000' }}
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
