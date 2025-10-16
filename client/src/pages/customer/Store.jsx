/* eslint-env browser */
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CustomerSidebar from '../../components/CustomerSidebar';
import StarRating from '../../components/StarRating';
import ReviewsModal from '../../components/ReviewsModal';
import StoreReviewModal from '../../components/WriteReviewModal';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import axios from 'axios';
import './store.css';
import '../../styles/theme.css';
import { API_URL } from '../../api';

const days = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const dayShortNames = {
  Monday: 'Mon',
  Tuesday: 'Tue',
  Wednesday: 'Wed',
  Thursday: 'Thu',
  Friday: 'Fri',
  Saturday: 'Sat',
  Sunday: 'Sun',
};

const defaultHours = Object.fromEntries(
  days.map((day) => [day, { open: false, start: '09:00', end: '17:00' }])
);

const groupHours = (hours) => {
  if (!hours || typeof hours !== 'object') return [];

  const grouped = [];
  const daysChecked = new Set();

  const normalizedHours = { ...defaultHours, ...hours };

  days.forEach((day, index) => {
    if (daysChecked.has(day)) return;

    const currentHours = normalizedHours[day] || defaultHours[day];
    if (!currentHours) return;

    const sameHoursDays = [dayShortNames[day]];
    daysChecked.add(day);

    for (let i = index + 1; i < days.length; i++) {
      const otherDay = days[i];
      if (daysChecked.has(otherDay)) continue;

      const otherHours = normalizedHours[otherDay] || defaultHours[otherDay];
      if (
        otherHours &&
        otherHours.open === currentHours.open &&
        (!currentHours.open ||
          (otherHours.start === currentHours.start &&
            otherHours.end === currentHours.end))
      ) {
        sameHoursDays.push(dayShortNames[otherDay]);
        daysChecked.add(otherDay);
      }
    }

    let daysLabel;
    if (sameHoursDays.length > 2) {
      if (sameHoursDays.join(', ') === 'Mon, Tue, Wed, Thu, Fri') {
        daysLabel = 'Mon–Fri';
      } else if (sameHoursDays.join(', ') === 'Sat, Sun') {
        daysLabel = 'Sat–Sun';
      } else {
        daysLabel = sameHoursDays.join(', ');
      }
    } else if (sameHoursDays.length === 2) {
      daysLabel = `${sameHoursDays[0]}–${sameHoursDays[1]}`;
    } else {
      daysLabel = sameHoursDays[0];
    }

    grouped.push({
      days: daysLabel,
      hours: currentHours.open
        ? `${currentHours.start}–${currentHours.end}`
        : 'Closed',
    });
  });

  return grouped;
};

const getTodayHours = (hours) => {
  if (!hours || typeof hours !== 'object') return 'Not available';
  const dayIndex = new Date().getDay();
  const dayNames = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  const today = dayNames[dayIndex];
  const times = hours[today];
  return times && times.open ? `${times.start}–${times.end}` : 'Closed';
};

const HoursModal = ({ isOpen, onClose, hours }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleCloseModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCloseModal = () => {
    const modal = modalRef.current;
    if (modal) {
      modal.classList.add('modal-closing');
      setTimeout(() => {
        onClose();
        modal.classList.remove('modal-closing');
      }, 300);
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  const groupedHours = groupHours(hours);

  return (
    <div
      className="modal-overlay modal-overlay-exit"
      onClick={handleCloseModal}
    >
      <div
        className="hours-modal"
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="hours-modal-header">
          <h3 className="hours-modal-title">Store Hours</h3>
          <button onClick={handleCloseModal} className="modal-close">
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="hours-modal-list">
          {groupedHours.length > 0 ? (
            groupedHours.map((group, index) => (
              <div key={index} className="hour-item">
                <span className="day-label">{group.days || 'Unknown'}</span>
                <span className="hour-value">{group.hours}</span>
              </div>
            ))
          ) : (
            <p className="no-hours-text">No hours information available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

const ContactUsModal = ({ isOpen, onClose, contactInfos }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleCloseModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCloseModal = () => {
    const modal = modalRef.current;
    if (modal) {
      modal.classList.add('modal-closing');
      setTimeout(() => {
        onClose();
        modal.classList.remove('modal-closing');
      }, 300);
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay modal-overlay-exit"
      onClick={handleCloseModal}
    >
      <div
        className="contact-modal"
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="contact-modal-header">
          <h3 className="contact-modal-title">Contact Us</h3>
          <button onClick={handleCloseModal} className="modal-close">
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="contact-modal-list">
          {contactInfos.length > 0 ? (
            contactInfos.map((contact) => (
              <div key={contact.id} className="contact-item">
                {contact.type === 'phone' ? (
                  <>
                    <button
                      onClick={() =>
                        openContact('phone', contact.value, 'call')
                      }
                      className="contact-button"
                      title={`Call ${contact.value}`}
                    >
                      <i className="fas fa-phone"></i>
                      <span className="contact-label">{contact.value}</span>
                    </button>
                    <button
                      onClick={() =>
                        openContact('phone', contact.value, 'whatsapp')
                      }
                      className="contact-button"
                      title={`WhatsApp ${contact.value}`}
                    >
                      <i className="fab fa-whatsapp"></i>
                      <span className="contact-label">{contact.value}</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => openContact(contact.type, contact.value)}
                    className="contact-button"
                    title={contact.value}
                  >
                    <i
                      className={`fa${contact.type === 'email' ? 's' : 'b'} fa-${contact.type === 'email' ? 'envelope' : contact.type}`}
                    ></i>
                    <span className="contact-label">{contact.value}</span>
                  </button>
                )}
              </div>
            ))
          ) : (
            <p className="no-contact-text">No contact information available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

const PriceFilterModal = ({ isOpen, onClose, priceRange, setPriceRange }) => {
  const modalRef = useRef(null);
  const [tempPriceRange, setTempPriceRange] = useState(priceRange);

  useEffect(() => {
    setTempPriceRange(priceRange);
  }, [priceRange]);

  const handleCloseModal = () => {
    const modal = modalRef.current;
    if (modal) {
      modal.classList.add('modal-closing');
      setTimeout(() => {
        onClose();
        modal.classList.remove('modal-closing');
      }, 300);
    } else {
      onClose();
    }
  };

  const handleApply = () => {
    setPriceRange(tempPriceRange);
    handleCloseModal();
  };

  const handleMinPriceChange = (e) => {
    const value = Math.min(Number(e.target.value), tempPriceRange[1] - 1);
    setTempPriceRange([value >= 0 ? value : 0, tempPriceRange[1]]);
  };

  const handleMaxPriceChange = (e) => {
    const value = Math.max(Number(e.target.value), tempPriceRange[0] + 1);
    setTempPriceRange([tempPriceRange[0], value <= 10000 ? value : 10000]);
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay modal-overlay-exit"
      onClick={handleCloseModal}
    >
      <div
        className="filter-modal"
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="filter-modal-header">
          <h3 className="filter-modal-title">Price Range</h3>
          <button onClick={handleCloseModal} className="modal-close">
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="price-filter-content">
          <div className="price-range-display">
            <div className="price-value">
              <span className="price-label">Minimum</span>
              <span className="price-amount">R{tempPriceRange[0]}</span>
            </div>
            <span className="price-separator">–</span>
            <div className="price-value">
              <span className="price-label">Maximum</span>
              <span className="price-amount">R{tempPriceRange[1]}</span>
            </div>
          </div>
          <div className="price-inputs">
            <div className="price-input-group">
              <label>Min Price</label>
              <input
                type="number"
                value={tempPriceRange[0]}
                onChange={handleMinPriceChange}
                className="price-input"
                min="0"
                max={tempPriceRange[1] - 1}
              />
            </div>
            <div className="price-input-group">
              <label>Max Price</label>
              <input
                type="number"
                value={tempPriceRange[1]}
                onChange={handleMaxPriceChange}
                className="price-input"
                min={tempPriceRange[0] + 1}
                max="10000"
              />
            </div>
          </div>
          <button onClick={handleApply} className="apply-button">
            Apply Price Range
          </button>
        </div>
      </div>
    </div>
  );
};

const openContact = (type, value, action = 'call') => {
  if (type === 'email') {
    window.location.href = `mailto:${value}`;
  } else if (type === 'phone') {
    if (action === 'call') {
      window.location.href = `tel:${value}`;
    } else if (action === 'whatsapp') {
      const cleanPhone = value.replace(/[^0-9]/g, '');
      const formattedPhone = cleanPhone.startsWith('0')
        ? `+27${cleanPhone.slice(1)}`
        : cleanPhone;
      const message = encodeURIComponent(
        "Hello, I'm interested in your store!"
      );
      window.open(`https://wa.me/${formattedPhone}?text=${message}`, '_blank');
    }
  } else if (type === 'instagram') {
    const cleanValue = value.startsWith('http')
      ? value
      : `https://www.instagram.com/${value.replace(/^@/, '')}`;
    window.open(cleanValue, '_blank');
  } else if (type === 'facebook') {
    const cleanValue = value.startsWith('http')
      ? value
      : `https://www.facebook.com/${value.replace(/^@/, '')}`;
    window.open(cleanValue, '_blank');
  } else if (type === 'twitter') {
    const cleanValue = value.startsWith('http')
      ? value
      : `https://twitter.com/${value.replace(/^@/, '')}`;
    window.open(cleanValue, '_blank');
  }
};

export default function Store() {
  const { id } = useParams();
  const navigate = useNavigate();
  const auth = getAuth();

  const [store, setStore] = useState(null);
  const [clothes, setClothes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showContactUsModal, setShowContactUsModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showHoursModal, setShowHoursModal] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedStyles, setSelectedStyles] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterVisible, setIsFilterVisible] = useState(true);
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const itemsPerPage = 12;
  const modalRef = useRef(null);
  const itemsGridRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          } else {
            entry.target.classList.remove('visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    const items = document.querySelectorAll('.item-card');
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [
    clothes,
    currentPage,
    selectedCategories,
    selectedStyles,
    selectedSizes,
    selectedDepartments,
    searchQuery,
    priceRange,
  ]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken();
          const storeResponse = await axios.get(`${API_URL}/api/stores/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const storeData = storeResponse.data;
          setStore({
            ...storeData,
            hours: storeData.hours || defaultHours,
            theme: storeData.theme || 'theme-default',
          });

          if (storeData.theme) {
            const root = document.documentElement;
            Object.entries(storeData.theme).forEach(([key, value]) => {
              root.style.setProperty(`--${key}`, value);
            });
          }

          const itemsResponse = await axios.get(
            `${API_URL}/api/stores/${id}/items`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          setClothes(itemsResponse.data || []);
        } catch (error) {
          console.error(
            'Error fetching store or items:',
            error.response?.data || error.message
          );
        } finally {
          setLoading(false);
        }
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [id, auth, navigate]);

  useEffect(() => {
    const items = document.querySelectorAll('.item-card');
    items.forEach((item) => {
      item.classList.remove('visible');
      setTimeout(() => item.classList.add('visible'), 100);
    });
  }, [
    clothes,
    selectedCategories,
    selectedStyles,
    selectedSizes,
    selectedDepartments,
    searchQuery,
    priceRange,
  ]);

  const categoryOptions = useMemo(() => {
    return Array.from(
      new Set(clothes.map((item) => item.category).filter(Boolean))
    ).sort();
  }, [clothes]);

  const styleOptions = useMemo(() => {
    return Array.from(
      new Set(clothes.map((item) => item.style).filter(Boolean))
    ).sort();
  }, [clothes]);

  const sizeOptions = useMemo(() => {
    return Array.from(
      new Set(clothes.map((item) => item.size).filter(Boolean))
    ).sort();
  }, [clothes]);

  const departmentOptions = useMemo(() => {
    return Array.from(
      new Set(clothes.map((item) => item.department).filter(Boolean))
    ).sort();
  }, [clothes]);

  const filteredClothes = useMemo(() => {
    return clothes.filter((item) => {
      const matchesSearch = item.name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategories.length === 0 ||
        (item.category && selectedCategories.includes(item.category));
      const matchesStyle =
        selectedStyles.length === 0 ||
        (item.style && selectedStyles.includes(item.style));
      const matchesSize =
        selectedSizes.length === 0 ||
        (item.size && selectedSizes.includes(item.size));
      const matchesDepartment =
        selectedDepartments.length === 0 ||
        (item.department && selectedDepartments.includes(item.department));
      const matchesPrice =
        item.price >= priceRange[0] && item.price <= priceRange[1];
      const isNotSold = item.status !== 'Sold';
      return (
        matchesSearch &&
        matchesCategory &&
        matchesStyle &&
        matchesSize &&
        matchesDepartment &&
        matchesPrice &&
        isNotSold
      );
    });
  }, [
    clothes,
    searchQuery,
    selectedCategories,
    selectedStyles,
    selectedSizes,
    selectedDepartments,
    priceRange,
  ]);

  const totalPages = Math.ceil(filteredClothes.length / itemsPerPage);
  const paginatedClothes = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredClothes.slice(start, start + itemsPerPage);
  }, [filteredClothes, currentPage]);

  const activeFiltersCount =
    selectedCategories.length +
    selectedStyles.length +
    selectedSizes.length +
    selectedDepartments.length +
    (searchQuery ? 1 : 0) +
    (priceRange[0] !== 0 || priceRange[1] !== 10000 ? 1 : 0);

  const handleReserve = async (itemId) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        navigate('/login');
        return;
      }
      const token = await user.getIdToken();
      const item = clothes.find((i) => i.itemId === itemId);
      if (!item) throw new Error('Item not found');

      const reserveResponse = await axios.put(
        `${API_URL}/api/stores/reserve/${itemId}`,
        { storeId: store.storeId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!reserveResponse.data.reservationId) {
        throw new Error('Failed to create reservation');
      }

      setClothes((prev) =>
        prev.map((i) =>
          i.itemId === itemId ? { ...i, status: 'Reserved' } : i
        )
      );
      setSelectedItem((prev) =>
        prev ? { ...prev, status: 'Reserved' } : null
      );

      const chatId = [user.uid, store.ownerId].sort().join('_');
      navigate(`/user/chats/${chatId}`);
    } catch (error) {
      console.error('Error reserving item:', error);
      alert(`Failed to reserve item: ${error.message}`);
    }
  };

  const handleEnquire = async (itemId) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        navigate('/login');
        return;
      }
      const token = await user.getIdToken();
      const item = clothes.find((i) => i.itemId === itemId);
      if (!item) throw new Error('Item not found');

      const storeId = store.storeId;
      const ownerId = store.ownerId;

      const messageResponse = await axios.post(
        `${API_URL}/api/stores/messages`,
        {
          receiverId: ownerId,
          message: `Hey, I would like to enquire about the item ${item.name}`,
          itemId,
          storeId,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!messageResponse.data.messageId) {
        throw new Error('Failed to send enquiry message');
      }

      const chatId = [user.uid, ownerId].sort().join('_');
      navigate(`/user/chats/${chatId}`);
    } catch (error) {
      console.error('Error sending enquiry:', error);
      alert(`Failed to send enquiry: ${error.message}`);
    }
  };

  const handleSubmitReview = async (rating, comment) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        navigate('/login');
        return;
      }
      const token = await user.getIdToken();
      const response = await axios.post(
        `${API_URL}/api/stores/${id}/reviews`,
        { rating, comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStore((prev) => ({
        ...prev,
        averageRating: response.data.averageRating,
        reviewCount: response.data.reviewCount,
      }));
      setShowReviewModal(false);
      alert('Review submitted successfully!');
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review. Please try again.');
    }
  };

  const toggleFilterOption = (option, setFilter) => {
    setFilter((prev) =>
      prev.includes(option)
        ? prev.filter((item) => item !== option)
        : [...prev, option]
    );
    setCurrentPage(1);
  };

  const handleItemNavigation = (direction) => {
    const currentIndex = filteredClothes.findIndex(
      (item) => item.itemId === selectedItem.itemId
    );
    let newIndex;
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % filteredClothes.length;
    } else {
      newIndex =
        (currentIndex - 1 + filteredClothes.length) % filteredClothes.length;
    }
    setSelectedItem(filteredClothes[newIndex]);
    setCurrentImageIndex(0);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategories([]);
    setSelectedStyles([]);
    setSelectedSizes([]);
    setSelectedDepartments([]);
    setPriceRange([0, 10000]);
    if (itemsGridRef.current) {
      itemsGridRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedItem) return;
      if (e.key === 'ArrowRight') {
        handleItemNavigation('next');
      } else if (e.key === 'ArrowLeft') {
        handleItemNavigation('prev');
      } else if (e.key === 'Escape') {
        setSelectedItem(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItem, filteredClothes]);

  const handleCloseModal = (setModalState) => {
    const modal = modalRef.current;
    if (modal) {
      modal.classList.add('modal-closing');
      setTimeout(() => {
        setModalState(null);
        modal.classList.remove('modal-closing');
      }, 300);
    } else {
      setModalState(null);
    }
  };

  if (loading) {
    return (
      <div className="store-home">
        <div className="layout-container">
          <CustomerSidebar activePage="home" />
          <div className="content">
            <div className="store-banner skeleton">
              <div className="banner-background skeleton-bg"></div>
            </div>
            <div className="filters-bar skeleton">
              <div className="filters-content skeleton-bg"></div>
            </div>
            <main className="main-content">
              <div className="items-grid">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="item-card skeleton">
                    <div className="item-image-container skeleton-bg"></div>
                    <div className="item-content">
                      <div className="item-title skeleton-bg"></div>
                      <div className="item-meta skeleton-bg"></div>
                      <div className="item-footer skeleton-bg"></div>
                    </div>
                  </div>
                ))}
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="store-home" data-theme={store?.theme || 'theme-default'}>
      <div className="layout-container">
        <CustomerSidebar activePage="home" />
        <div className="content">
          <div className="store-banner">
            <div
              className="banner-background"
              style={{
                backgroundImage: `url(${store?.profileImageURL || 'https://via.placeholder.com/1200x200?text=Store+Banner'})`,
              }}
            >
              <div className="banner-overlay">
                <div className="banner-content">
                  <div className="banner-text">
                    <h1 className="store-title">
                      {store?.storeName || 'Store'}
                    </h1>
                    {store?.address && (
                      <div className="address-section">
                        <div className="address-text">
                          <i
                            className="fas fa-map-marker-alt"
                            style={{ marginRight: '8px' }}
                          ></i>
                          {store.address}
                        </div>
                        <button
                          className="map-button"
                          onClick={() =>
                            window.open(
                              `https://www.google.com/maps/search/?api=1&query=${store.location.lat},${store.location.lng}`,
                              '_blank'
                            )
                          }
                          disabled={!store?.location?.lat}
                        >
                          <i className="fas fa-directions"></i> Directions
                        </button>
                      </div>
                    )}
                    {store?.hours && (
                      <div className="hours-section">
                        <div className="hours-summary">
                          <i
                            className="fas fa-clock"
                            style={{ marginRight: '8px' }}
                          ></i>
                          <span>Today: {getTodayHours(store.hours)}</span>
                          <button
                            className="view-hours-button"
                            onClick={() => setShowHoursModal(true)}
                          >
                            View All Hours
                          </button>
                        </div>
                        <button
                          className="contact-us-button"
                          onClick={() => setShowContactUsModal(true)}
                        >
                          <i className="fas fa-address-book"></i> Contact Us
                        </button>
                      </div>
                    )}
                    <div className="banner-meta">
                      <StarRating
                        rating={store?.averageRating || 0}
                        reviewCount={store?.reviewCount || 0}
                        size="medium"
                      />
                      <div className="rating-actions">
                        {store?.reviewCount > 0 && (
                          <button
                            className="review-button"
                            onClick={() => setShowReviewsModal(true)}
                          >
                            <i className="fas fa-book-open"></i> Reviews
                          </button>
                        )}
                        <button
                          className="review-button"
                          onClick={() => setShowReviewModal(true)}
                        >
                          <i className="fas fa-pen"></i> Write Review
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div>
            <h2>Description</h2>
            {store?.description && (
              <p className="store-description">
                {store.description.length > 150
                  ? `${store.description.substring(0, 147)}...`
                  : store.description}
              </p>
            )}
          </div>

          <div
            className={`filters-bar ${isFilterVisible ? 'visible' : 'hidden'}`}
          >
            <button
              className="toggle-filter-button"
              onClick={() => setIsFilterVisible(!isFilterVisible)}
            >
              <i
                className={`fas fa-${isFilterVisible ? 'chevron-up' : 'chevron-down'}`}
              ></i>
              {isFilterVisible ? 'Hide Filters' : 'Show Filters'}
            </button>
            <div className="filters-content">
              <div className="search-container">
                <i className="fas fa-search search-icon"></i>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search items..."
                  className="search-input"
                />
              </div>
              <div className="filter-buttons">
                <button
                  className="filter-button"
                  onClick={() => setShowFilterModal('category')}
                >
                  <i className="fas fa-tags"></i>
                  Category
                  {selectedCategories.length > 0 &&
                    ` (${selectedCategories.length})`}
                </button>
                <button
                  className="filter-button"
                  onClick={() => setShowFilterModal('style')}
                >
                  <i className="fas fa-palette"></i>
                  Style
                  {selectedStyles.length > 0 && ` (${selectedStyles.length})`}
                </button>
                <button
                  className="filter-button"
                  onClick={() => setShowFilterModal('size')}
                >
                  <i className="fas fa-ruler"></i>
                  Size
                  {selectedSizes.length > 0 && ` (${selectedSizes.length})`}
                </button>
                <button
                  className="filter-button"
                  onClick={() => setShowFilterModal('department')}
                >
                  <i className="fas fa-users"></i>
                  Department
                  {selectedDepartments.length > 0 &&
                    ` (${selectedDepartments.length})`}
                </button>
                <button
                  className="filter-button"
                  onClick={() => setShowFilterModal('price')}
                >
                  <i className="fas fa-dollar-sign"></i>
                  Price
                  {priceRange[0] !== 0 || priceRange[1] !== 10000
                    ? ` (R${priceRange[0]}-R${priceRange[1]})`
                    : ''}
                </button>
                {activeFiltersCount > 0 && (
                  <button onClick={clearFilters} className="clear-button">
                    <i className="fas fa-times"></i> Clear All
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="results-header">
            <h2 className="results-title">
              {filteredClothes.length}{' '}
              {filteredClothes.length === 1 ? 'Item' : 'Items'}
              {activeFiltersCount > 0 && (
                <span
                  style={{
                    fontSize: '1rem',
                    fontWeight: 'normal',
                    marginLeft: '12px',
                    color: 'var(--color-text-light)',
                  }}
                >
                  ({activeFiltersCount} filter
                  {activeFiltersCount !== 1 ? 's' : ''} active)
                </span>
              )}
            </h2>
          </div>

          <main className="main-content" ref={itemsGridRef}>
            {filteredClothes.length === 0 ? (
              <div className="no-items">
                <i className="fas fa-shopping-bag no-items-icon"></i>
                <h3 className="no-items-title">No items found</h3>
                <p className="no-items-text">
                  Try adjusting your filters to discover more items
                </p>
                <button onClick={clearFilters} className="clear-filters-button">
                  <i className="fas fa-times"></i> Clear All Filters
                </button>
              </div>
            ) : (
              <>
                <div className="items-grid">
                  {paginatedClothes.map((item) => (
                    <div
                      key={item.itemId}
                      onClick={() => {
                        setSelectedItem(item);
                        setCurrentImageIndex(0);
                      }}
                      className="item-card"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setSelectedItem(item);
                          setCurrentImageIndex(0);
                        }
                      }}
                    >
                      {item.status === 'Reserved' && (
                        <span className="reserved-badge">Reserved</span>
                      )}
                      <div className="item-image-container">
                        <img
                          src={
                            item.images && item.images.length > 0
                              ? item.images[0].imageURL
                              : 'https://via.placeholder.com/400x400?text=No+Image'
                          }
                          alt={item.name}
                          className="item-image"
                          onError={(e) => {
                            e.target.src =
                              'https://via.placeholder.com/400x400?text=No+Image';
                          }}
                        />
                        <div className="item-overlay">
                          <span className="view-details">View Details</span>
                        </div>
                      </div>
                      <div className="item-content">
                        <h3 className="item-title">{item.name}</h3>
                        <div className="item-meta">
                          {item.category && (
                            <span className="item-category">
                              {item.category}
                            </span>
                          )}
                          {item.size && (
                            <span className="item-size">{item.size}</span>
                          )}
                        </div>
                        <div className="item-footer">
                          <span className="item-price">R{item.price}</span>
                          {item.style && (
                            <span className="item-style">{item.style}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="pagination">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="pagination-button"
                    >
                      <i className="fas fa-chevron-left"></i> Previous
                    </button>
                    <span className="pagination-info">
                      Page {currentPage} of {totalPages} (
                      {filteredClothes.length} total items)
                    </span>
                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="pagination-button"
                    >
                      Next <i className="fas fa-chevron-right"></i>
                    </button>
                  </div>
                )}
              </>
            )}
          </main>

          {showFilterModal && showFilterModal !== 'price' && (
            <div
              className="modal-overlay modal-overlay-exit"
              onClick={() => handleCloseModal(setShowFilterModal)}
            >
              <div
                className="filter-modal"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="filter-modal-header">
                  <h3 className="filter-modal-title">
                    {showFilterModal === 'category' && 'Select Categories'}
                    {showFilterModal === 'style' && 'Select Styles'}
                    {showFilterModal === 'size' && 'Select Sizes'}
                    {showFilterModal === 'department' && 'Select Departments'}
                  </h3>
                  <button
                    onClick={() => handleCloseModal(setShowFilterModal)}
                    className="modal-close"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                <div className="filter-options">
                  {(showFilterModal === 'category'
                    ? categoryOptions
                    : showFilterModal === 'style'
                      ? styleOptions
                      : showFilterModal === 'size'
                        ? sizeOptions
                        : departmentOptions
                  ).map((option) => (
                    <label key={option} className="filter-option">
                      <input
                        type="checkbox"
                        checked={
                          showFilterModal === 'category'
                            ? selectedCategories.includes(option)
                            : showFilterModal === 'style'
                              ? selectedStyles.includes(option)
                              : showFilterModal === 'size'
                                ? selectedSizes.includes(option)
                                : selectedDepartments.includes(option)
                        }
                        onChange={() =>
                          toggleFilterOption(
                            option,
                            showFilterModal === 'category'
                              ? setSelectedCategories
                              : showFilterModal === 'style'
                                ? setSelectedStyles
                                : showFilterModal === 'size'
                                  ? setSelectedSizes
                                  : setSelectedDepartments
                          )
                        }
                        className="checkbox"
                      />
                      {option}
                    </label>
                  ))}
                </div>
                <button
                  onClick={() => handleCloseModal(setShowFilterModal)}
                  className="apply-button"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}

          {showFilterModal === 'price' && (
            <PriceFilterModal
              isOpen={showFilterModal === 'price'}
              onClose={() => handleCloseModal(setShowFilterModal)}
              priceRange={priceRange}
              setPriceRange={setPriceRange}
            />
          )}

          {selectedItem && (
            <div
              className="modal-overlay modal-overlay-exit"
              onClick={() => handleCloseModal(setSelectedItem)}
            >
              <div
                className="item-modal"
                ref={modalRef}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => handleCloseModal(setSelectedItem)}
                  className="modal-close-button"
                >
                  <i className="fas fa-times"></i>
                </button>
                <div className="item-navigation">
                  <button
                    className="nav-arrow left-arrow"
                    onClick={() => handleItemNavigation('prev')}
                    disabled={filteredClothes.length <= 1}
                  >
                    <i className="fas fa-chevron-left"></i>
                  </button>
                  <button
                    className="nav-arrow right-arrow"
                    onClick={() => handleItemNavigation('next')}
                    disabled={filteredClothes.length <= 1}
                  >
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </div>
                <div className="modal-body">
                  <div className="modal-gallery">
                    <img
                      src={
                        selectedItem.images && selectedItem.images.length > 0
                          ? selectedItem.images[currentImageIndex]?.imageURL ||
                            'https://via.placeholder.com/600x600?text=No+Image'
                          : 'https://via.placeholder.com/600x600?text=No+Image'
                      }
                      alt={selectedItem.name}
                      className="modal-image"
                      onError={(e) => {
                        e.target.src =
                          'https://via.placeholder.com/600x600?text=No+Image';
                      }}
                    />
                    {selectedItem.images && selectedItem.images.length > 1 && (
                      <div className="thumbnails">
                        {selectedItem.images.map((img, idx) => (
                          <img
                            key={idx}
                            src={img.imageURL}
                            alt={`${selectedItem.name} ${idx + 1}`}
                            className={`thumbnail ${idx === currentImageIndex ? 'thumbnail-active' : ''}`}
                            onClick={() => setCurrentImageIndex(idx)}
                            onError={(e) => {
                              e.target.src =
                                'https://via.placeholder.com/100x100?text=No+Image';
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="modal-info">
                    <h2 className="modal-title">{selectedItem.name}</h2>
                    <p className="modal-price">R{selectedItem.price}</p>
                    {selectedItem.status === 'Reserved' && (
                      <div className="reserved-banner">
                        <i className="fas fa-lock"></i> This item is currently
                        reserved
                      </div>
                    )}
                    <div className="modal-section">
                      <h4 className="modal-section-title">Description</h4>
                      <p className="modal-description">
                        {selectedItem.description || 'No description available'}
                      </p>
                    </div>
                    <div className="modal-section">
                      <h4 className="modal-section-title">Details</h4>
                      <div className="details-grid">
                        {selectedItem.category && (
                          <div className="detail-item">
                            <span className="detail-label">Category:</span>
                            <span>{selectedItem.category}</span>
                          </div>
                        )}
                        {selectedItem.size && (
                          <div className="detail-item">
                            <span className="detail-label">Size:</span>
                            <span>{selectedItem.size}</span>
                          </div>
                        )}
                        {selectedItem.style && (
                          <div className="detail-item">
                            <span className="detail-label">Style:</span>
                            <span>{selectedItem.style}</span>
                          </div>
                        )}
                        {selectedItem.department && (
                          <div className="detail-item">
                            <span className="detail-label">Department:</span>
                            <span>{selectedItem.department}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {selectedItem.measurements && (
                      <div className="modal-section">
                        <h4 className="modal-section-title">Measurements</h4>
                        <p className="modal-description">
                          {selectedItem.measurements}
                        </p>
                      </div>
                    )}
                    <div className="modal-actions">
                      <button
                        onClick={() => handleReserve(selectedItem.itemId)}
                        disabled={selectedItem.status === 'Reserved'}
                        className={`action-button primary-button ${
                          selectedItem.status === 'Reserved'
                            ? 'disabled-button'
                            : ''
                        }`}
                      >
                        <i className="fas fa-shopping-cart"></i>
                        {selectedItem.status === 'Reserved'
                          ? 'Reserved'
                          : 'Reserve Item'}
                      </button>
                      <button
                        onClick={() => handleEnquire(selectedItem.itemId)}
                        className="action-button secondary-button"
                      >
                        <i className="fas fa-envelope"></i> Send Enquiry
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {showHoursModal && (
            <HoursModal
              isOpen={showHoursModal}
              onClose={() => handleCloseModal(setShowHoursModal)}
              hours={store.hours}
            />
          )}
          {showContactUsModal && (
            <ContactUsModal
              isOpen={showContactUsModal}
              onClose={() => handleCloseModal(setShowContactUsModal)}
              contactInfos={store?.contactInfos || []}
            />
          )}

          {showReviewsModal && (
            <ReviewsModal
              storeId={store.storeId}
              storeName={store.storeName}
              isOpen={showReviewsModal}
              onClose={() => handleCloseModal(setShowReviewsModal)}
            />
          )}
          {showReviewModal && (
            <StoreReviewModal
              isOpen={showReviewModal}
              onClose={() => handleCloseModal(setShowReviewModal)}
              onSubmit={handleSubmitReview}
              storeName={store.storeName}
            />
          )}

          {showBackToTop && (
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="back-to-top"
            >
              <i className="fas fa-arrow-up"></i>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
