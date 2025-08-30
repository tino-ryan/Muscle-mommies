// pages/SearchPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// --- NAVBAR COMPONENT ---
function NavBar() {
  const navigate = useNavigate();
  return (
    <nav className="bg-white shadow-md px-6 py-4 flex justify-between items-center sticky top-0 z-50">
      <div
        className="text-xl font-bold text-gray-800 cursor-pointer"
        onClick={() => navigate('/')}
      >
        ThriftFinder
      </div>
      <div className="flex space-x-4">
        <button
          onClick={() => navigate('/')}
          className="px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition"
        >
          Home
        </button>
        <button
          onClick={() => navigate('/search')}
          className="px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition"
        >
          Search
        </button>
        <button
          onClick={() => navigate('/profile')}
          className="px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition"
        >
          Profile
        </button>
      </div>
    </nav>
  );
}

// --- API FUNCTIONS ---
const API_BASE_URL = 'http://localhost:3000/api';

const fetchStores = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/stores`);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch stores: ${response.status} ${response.statusText}`
      );
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching stores:', error);
    return [];
  }
};

const fetchItems = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/items`);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch items: ${response.status} ${response.statusText}`
      );
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching items:', error);
    return [];
  }
};

export default function SearchPage() {
  const navigate = useNavigate();

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [styleFilter, setStyleFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [priceRange, setPriceRange] = useState([0, 500]);

  // Data states
  const [stores, setStores] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper function to get primary image URL
  const getPrimaryImageURL = (item) => {
    if (!item.images || item.images.length === 0) {
      return 'https://via.placeholder.com/200x200?text=No+Image';
    }
    const primaryImage =
      item.images.find((img) => img.isPrimary) || item.images[0];
    return primaryImage.imageURL;
  };

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [storesData, itemsData] = await Promise.all([
          fetchStores(),
          fetchItems(),
        ]);
        setStores(storesData);
        setItems(itemsData);
      } catch (err) {
        setError('Failed to load data');
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // --- FILTERING ---
  const filteredStores = stores.filter((store) =>
    store.storeName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredItems = items.filter((item) => {
    const matchesSearch = searchTerm
      ? item.name?.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    const matchesCategory = categoryFilter
      ? item.category === categoryFilter
      : true;
    const matchesStyle = styleFilter ? item.style === styleFilter : true;
    const matchesDepartment = departmentFilter
      ? item.department === departmentFilter
      : true;
    const matchesPrice =
      item.price >= priceRange[0] && item.price <= priceRange[1];
    const matchesStatus = item.status === 'Available';

    return (
      matchesSearch &&
      matchesCategory &&
      matchesStyle &&
      matchesDepartment &&
      matchesPrice &&
      matchesStatus
    );
  });

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <NavBar />
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex flex-col justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <div className="text-lg text-gray-600">Loading items...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <NavBar />
        <div className="max-w-7xl mx-auto p-6">
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
            <h3 className="font-semibold mb-2">Error Loading Data</h3>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <NavBar />

      <div className="max-w-7xl mx-auto p-6">
        {/* SEARCH + FILTER CONTROLS */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
          <div className="space-y-6">
            {/* Search Bar */}
            <div>
              <input
                type="text"
                placeholder="Search for stores or items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-4 text-lg rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
              />
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex flex-wrap gap-3">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-4 py-2 rounded-lg border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-300"
                >
                  <option value="">All Categories</option>
                  <option value="tops">Tops</option>
                  <option value="shirts">Shirts</option>
                  <option value="pants">Pants</option>
                  <option value="dresses">Dresses</option>
                  <option value="footwear">Footwear</option>
                  <option value="skirts">Skirts</option>
                  <option value="accessories">Accessories</option>
                </select>

                <select
                  value={styleFilter}
                  onChange={(e) => setStyleFilter(e.target.value)}
                  className="px-4 py-2 rounded-lg border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-300"
                >
                  <option value="">All Styles</option>
                  <option value="y2k">Y2K</option>
                  <option value="grunge">Grunge</option>
                  <option value="streetwear">Streetwear</option>
                  <option value="vintage">Vintage</option>
                  <option value="basics">Basics</option>
                </select>

                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="px-4 py-2 rounded-lg border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-300"
                >
                  <option value="">All Departments</option>
                  <option value="women's">Women's</option>
                  <option value="men's">Men's</option>
                  <option value="children">Children</option>
                  <option value="unisex">Unisex</option>
                </select>
              </div>

              {/* Price Range */}
              <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
                <span className="text-gray-700 font-medium whitespace-nowrap text-sm">
                  Price Range:
                </span>
                <input
                  type="number"
                  value={priceRange[0]}
                  onChange={(e) =>
                    setPriceRange([Number(e.target.value), priceRange[1]])
                  }
                  className="px-3 py-1 rounded-lg border border-gray-300 w-20 text-center focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Min"
                />
                <span className="text-gray-400">to</span>
                <input
                  type="number"
                  value={priceRange[1]}
                  onChange={(e) =>
                    setPriceRange([priceRange[0], Number(e.target.value)])
                  }
                  className="px-3 py-1 rounded-lg border border-gray-300 w-20 text-center focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Max"
                />
              </div>
            </div>
          </div>
        </div>

        {/* RESULTS SECTION */}
        <div className="space-y-8">
          {/* Stores Section */}
          {searchTerm && filteredStores.length > 0 && (
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <span className="text-blue-600">🏪</span>
                Stores
                <span className="text-lg font-normal text-gray-500">
                  ({filteredStores.length} found)
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {filteredStores.map((store) => (
                  <div
                    key={store.storeId}
                    className="bg-white p-6 border border-gray-200 rounded-xl cursor-pointer hover:shadow-xl hover:border-blue-300 hover:-translate-y-1 transition-all duration-300 group"
                    onClick={() => navigate(`/Store/${store.storeId}`)}
                  >
                    <div className="flex gap-4">
                      <img
                        src={
                          store.profileImageURL ||
                          'https://via.placeholder.com/64x64?text=Store'
                        }
                        alt={store.storeName}
                        className="w-16 h-16 object-cover rounded-lg flex-shrink-0 group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg text-gray-900 truncate group-hover:text-blue-600 transition-colors duration-300">
                          {store.storeName}
                        </h3>
                        <p className="text-gray-600 text-sm truncate">
                          {store.address}
                        </p>
                        <p className="text-gray-500 text-sm mt-2 line-clamp-2">
                          {store.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Items Section */}
          {filteredItems.length > 0 && (
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <span className="text-blue-600">👕</span>
                {searchTerm || categoryFilter || styleFilter || departmentFilter
                  ? 'Search Results'
                  : 'All Items'}
                <span className="text-lg font-normal text-gray-500">
                  ({filteredItems.length} items)
                </span>
              </h2>

              {/* Items Grid - Fixed 5 columns */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: '1.5rem',
                }}
              >
                {filteredItems.map((item) => (
                  <div
                    key={item.itemId || item.id}
                    className="bg-white rounded-xl border border-gray-300 cursor-pointer hover:shadow-lg hover:border-blue-400 hover:-translate-y-1 hover:scale-105 transition-all duration-300 group flex flex-col overflow-hidden"
                    style={{ minHeight: '400px', height: '400px' }}
                    onClick={() => navigate(`/Item/${item.itemId || item.id}`)}
                  >
                    {/* Image */}
                    <div className="aspect-square overflow-hidden bg-gray-100">
                      <img
                        src={getPrimaryImageURL(item)}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          e.target.src =
                            'https://via.placeholder.com/200x200?text=No+Image';
                        }}
                      />
                    </div>

                    {/* Content */}
                    <div className="p-4 flex flex-col flex-1">
                      {/* Name */}
                      <h3 className="font-semibold text-gray-900 text-sm leading-tight group-hover:text-blue-600 transition-colors duration-300 min-h-[2.5rem]">
                        {item.name}
                      </h3>

                      {/* Category + Style tags */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full group-hover:bg-blue-100 group-hover:text-blue-800 transition-all duration-300">
                          {item.category}
                        </span>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full group-hover:bg-blue-200 group-hover:text-blue-800 transition-all duration-300">
                          {' '}
                          {item.style}
                        </span>
                      </div>

                      {/* Department + Size */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-xs text-gray-600 font-medium bg-gray-50 px-2 py-1 rounded">
                          {item.department}
                        </span>
                        {item.size && (
                          <span className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded">
                            {' '}
                            {item.size}
                          </span>
                        )}
                      </div>

                      {/* Spacer to push price to bottom */}
                      <div className="flex-1"></div>

                      {/* Price + Quantity */}
                      <div className="flex justify-between items-end pt-2 border-t border-gray-100">
                        <p className="font-bold text-xl text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                          R{item.price}
                        </p>
                        {item.quantity && (
                          <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                            {item.quantity} left
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {!loading &&
            (searchTerm || categoryFilter || styleFilter || departmentFilter) &&
            filteredStores.length === 0 &&
            filteredItems.length === 0 && (
              <div className="text-center py-20">
                <div className="text-gray-300 text-9xl mb-8">🔍</div>
                <h3 className="text-3xl font-semibold text-gray-700 mb-4">
                  No results found
                </h3>
                <p className="text-gray-500 text-lg mb-8">
                  Try adjusting your search terms or filters to find what you're
                  looking for
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setCategoryFilter('');
                    setStyleFilter('');
                    setDepartmentFilter('');
                    setPriceRange([0, 500]);
                  }}
                  className="px-8 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                >
                  Clear All Filters
                </button>
              </div>
            )}

          {/* Default state - show all items when no filters */}
          {!searchTerm &&
            !categoryFilter &&
            !styleFilter &&
            !departmentFilter &&
            items.length === 0 &&
            !loading && (
              <div className="text-center py-20">
                <div className="text-gray-300 text-9xl mb-8">📦</div>
                <h3 className="text-3xl font-semibold text-gray-700 mb-4">
                  No items available
                </h3>
                <p className="text-gray-500 text-lg">
                  Check back later for new thrift finds!
                </p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
