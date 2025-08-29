// src/pages/customer/Store.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function Store() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [store, setStore] = useState(null);
  const [clothes, setClothes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);

  // Filter states
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedStyles, setSelectedStyles] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);

  // Example options
  const sizeOptions = ['XS', 'S', 'M', 'L', 'XL'];
  const styleOptions = ['Vintage', 'Casual', 'Formal', 'Streetwear'];
  const categoryOptions = ['Tops', 'Pants', 'Dresses', 'Shoes', 'Accessories'];

  // Mock store and clothes data
  const mockStore = {
    name: 'Vintage Thrift',
    address: '123 Main St, Joburg',
    description: 'A cozy store full of unique finds',
    profileImageURL: 'https://via.placeholder.com/150?text=Thrift+Store',
  };

  const mockClothes = [
    { id: 1, name: 'Retro Jacket', category: 'Jackets', style: 'Vintage', size: 'M', price: 350, imageURL: 'https://via.placeholder.com/200?text=Jacket', reserved: false, description: 'A stylish retro jacket perfect for layering.' },
    { id: 2, name: 'Denim Jeans', category: 'Pants', style: 'Casual', size: 'L', price: 250, imageURL: 'https://via.placeholder.com/200?text=Jeans', reserved: false, description: 'Comfortable denim jeans for everyday wear.' },
    { id: 3, name: 'Floral Dress', category: 'Dresses', style: 'Vintage', size: 'S', price: 400, imageURL: 'https://via.placeholder.com/200?text=Dress', reserved: false, description: 'A beautiful floral dress for sunny days.' },
    { id: 4, name: 'White Sneakers', category: 'Shoes', style: 'Streetwear', size: 'M', price: 500, imageURL: 'https://via.placeholder.com/200?text=Sneakers', reserved: false, description: 'Classic white sneakers that go with everything.' },
    { id: 5, name: 'Leather Belt', category: 'Accessories', style: 'Formal', size: 'L', price: 150, imageURL: 'https://via.placeholder.com/200?text=Belt', reserved: false, description: 'A sleek leather belt to complete your outfit.' },
  ];

  // Simulate fetching data
  useEffect(() => {
    setTimeout(() => {
      setStore(mockStore);
      setClothes(mockClothes);
      setLoading(false);
    }, 500);
  }, []);

  // Filtering logic
  const filteredClothes = clothes.filter((item) => {
    const inPrice = item.price >= priceRange[0] && item.price <= priceRange[1];
    const inSize = selectedSizes.length === 0 || selectedSizes.includes(item.size);
    const inStyle = selectedStyles.length === 0 || selectedStyles.includes(item.style);
    const inCategory = selectedCategories.length === 0 || selectedCategories.includes(item.category);
    return inPrice && inSize && inStyle && inCategory;
  });

  const toggleSelection = (value, list, setList) => {
    if (list.includes(value)) {
      setList(list.filter((v) => v !== value));
    } else {
      setList([...list, value]);
    }
  };

  const handleReserve = (id) => {
    setClothes((prev) =>
      prev.map((item) => (item.id === id ? { ...item, reserved: true } : item))
    );
    setSelectedItem((prev) => ({ ...prev, reserved: true }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-600">
        Loading store...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="mb-4 bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
      >
        ← Back
      </button>

      {/* Store header */}
      <div className="flex flex-col sm:flex-row gap-6 items-start mb-8">
        <img
          src={store.profileImageURL}
          alt={store.name}
          className="w-40 h-40 rounded-lg object-cover shadow"
        />
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{store.name}</h1>
          <p className="text-gray-600 mt-1">{store.address}</p>
          <p className="text-gray-700 mt-3">{store.description}</p>
        </div>
      </div>

      {/* Layout: Clothes + Filters */}
      <div className="flex gap-8">
        {/* Clothes grid */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 overflow-y-auto max-h-[75vh]">
          {filteredClothes.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className={`bg-white shadow-lg rounded-lg overflow-hidden hover:shadow-xl hover:scale-105 transition-transform cursor-pointer relative flex flex-col`}
            >
              {item.reserved && (
                <span className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
                  Reserved
                </span>
              )}
              <img
                src={item.imageURL}
                alt={item.name}
                className="w-full h-48 object-cover rounded-t-lg"
              />
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800 truncate">{item.name}</h3>
                  <p className="text-sm text-gray-600 truncate">{item.category}</p>
                  <p className="text-sm text-gray-600">{item.size}</p>
                </div>
                <p className="text-blue-600 font-bold mt-2">R{item.price}</p>
              </div>
            </div>
          ))}
          {filteredClothes.length === 0 && (
            <p className="text-gray-600 col-span-full">No clothes match the selected filters.</p>
          )}
        </div>

        {/* Filters sidebar */}
        <aside className="w-64 bg-white shadow-lg rounded-lg p-6 h-fit sticky top-6 space-y-6">
          <h2 className="text-lg font-semibold mb-4">Filters</h2>

          {/* Price */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Price (R)</h3>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={priceRange[0]}
                onChange={(e) => setPriceRange([+e.target.value, priceRange[1]])}
                className="w-20 border rounded px-2 py-1 text-sm"
              />
              <span>-</span>
              <input
                type="number"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], +e.target.value])}
                className="w-20 border rounded px-2 py-1 text-sm"
              />
            </div>
          </div>

          {/* Sizes */}
          <div className="space-y-1">
            <h3 className="text-sm font-medium">Size</h3>
            {sizeOptions.map((size) => (
              <label key={size} className="block text-gray-700">
                <input
                  type="checkbox"
                  checked={selectedSizes.includes(size)}
                  onChange={() => toggleSelection(size, selectedSizes, setSelectedSizes)}
                  className="mr-2 h-4 w-4"
                />
                {size}
              </label>
            ))}
          </div>

          {/* Styles */}
          <div className="space-y-1">
            <h3 className="text-sm font-medium">Style</h3>
            {styleOptions.map((style) => (
              <label key={style} className="block text-gray-700">
                <input
                  type="checkbox"
                  checked={selectedStyles.includes(style)}
                  onChange={() => toggleSelection(style, selectedStyles, setSelectedStyles)}
                  className="mr-2 h-4 w-4"
                />
                {style}
              </label>
            ))}
          </div>

          {/* Categories */}
          <div className="space-y-1">
            <h3 className="text-sm font-medium">Category</h3>
            {categoryOptions.map((cat) => (
              <label key={cat} className="block text-gray-700">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(cat)}
                  onChange={() => toggleSelection(cat, selectedCategories, setSelectedCategories)}
                  className="mr-2 h-4 w-4"
                />
                {cat}
              </label>
            ))}
          </div>
        </aside>
      </div>

      {/* Item modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-lg w-full md:w-2/3 p-6 relative shadow-lg">
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 font-bold text-xl"
            >
              &times;
            </button>
            <div className="flex flex-col md:flex-row gap-6">
              <img
                src={selectedItem.imageURL}
                alt={selectedItem.name}
                className="w-full md:w-1/2 h-64 object-cover rounded-lg"
              />
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{selectedItem.name}</h2>
                  <p className="text-gray-600 mt-2">{selectedItem.description}</p>
                  <p className="text-sm text-gray-600 mt-1">Category: {selectedItem.category}</p>
                  <p className="text-sm text-gray-600">Size: {selectedItem.size}</p>
                  <p className="text-blue-600 font-bold mt-2 text-xl">R{selectedItem.price}</p>
                  {selectedItem.reserved && (
                    <p className="text-red-600 font-semibold mt-2">This item is reserved</p>
                  )}
                </div>
                <div className="mt-4 flex gap-4">
                  <button
                    onClick={() => handleReserve(selectedItem.id)}
                    disabled={selectedItem.reserved}
                    className={`px-4 py-2 rounded-lg text-white font-semibold ${selectedItem.reserved ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                  >
                    Reserve
                  </button>
                  <button className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold">
                    Enquire
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
