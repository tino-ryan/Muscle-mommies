import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// --- MOCK DATA ---
const mockStores = [
  {
    id: 1,
    name: 'Vintage Treasures',
    categories: ['Clothing', 'Accessories'],
    sizes: ['S', 'M', 'L'],
    description: 'Unique vintage clothing and accessories.',
  },
  {
    id: 2,
    name: 'Budget Buys',
    categories: ['Clothing', 'Shoes'],
    sizes: ['M', 'L', 'XL'],
    description: 'Affordable clothing for everyday wear.',
  },
  {
    id: 3,
    name: 'Retro Revival',
    categories: ['Clothing', 'Home Decor'],
    sizes: ['S', 'M'],
    description: 'Retro styles and home décor items.',
  },
];

export default function SearchPage() {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSize, setSelectedSize] = useState('');

  // Filter mock data
  const filteredStores = mockStores.filter((store) => {
    const matchesName = store.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory
      ? store.categories.includes(selectedCategory)
      : true;
    const matchesSize = selectedSize
      ? store.sizes.includes(selectedSize)
      : true;
    return matchesName && matchesCategory && matchesSize;
  });

  return (
    <div className="max-w-6xl mx-auto p-4 bg-gray-50 min-h-screen">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Search Stores & Items
        </h1>
      </div>

      {/* SEARCH FILTERS */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8 flex flex-col sm:flex-row gap-4 items-center">
        <input
          type="text"
          placeholder="Search by store name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Categories</option>
          <option value="Clothing">Clothing</option>
          <option value="Accessories">Accessories</option>
          <option value="Shoes">Shoes</option>
          <option value="Home Decor">Home Decor</option>
        </select>

        <select
          value={selectedSize}
          onChange={(e) => setSelectedSize(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Sizes</option>
          <option value="S">S</option>
          <option value="M">M</option>
          <option value="L">L</option>
          <option value="XL">XL</option>
        </select>
      </div>

      {/* RESULTS */}
      <div className="grid gap-4">
        {filteredStores.length > 0 ? (
          filteredStores.map((store) => (
            <div
              key={store.id}
              className="bg-white p-4 rounded-xl shadow cursor-pointer hover:shadow-lg transition"
              onClick={() => navigate(`/Store/${store.id}`)}
            >
              <h2 className="text-xl font-semibold text-gray-800">
                {store.name}
              </h2>
              <p className="text-gray-500 mt-1">{store.description}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {store.categories.map((cat) => (
                  <span
                    key={cat}
                    className="px-2 py-1 text-sm bg-blue-100 text-blue-800 rounded-full"
                  >
                    {cat}
                  </span>
                ))}
                {store.sizes.map((size) => (
                  <span
                    key={size}
                    className="px-2 py-1 text-sm bg-green-100 text-green-800 rounded-full"
                  >
                    {size}
                  </span>
                ))}
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center">
            No stores match your search criteria.
          </p>
        )}
      </div>
    </div>
  );
}
