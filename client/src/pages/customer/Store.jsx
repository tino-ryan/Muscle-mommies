// src/pages/customer/Store.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function Store() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [store, setStore] = useState(null);
  const [clothes, setClothes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedStyles, setSelectedStyles] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);

  // Example options (ideally fetched from backend)
  const sizeOptions = ['XS', 'S', 'M', 'L', 'XL'];
  const styleOptions = ['Vintage', 'Casual', 'Formal', 'Streetwear'];
  const categoryOptions = ['Tops', 'Pants', 'Dresses', 'Shoes', 'Accessories'];

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const storeRes = await fetch(http://localhost:3000/api/stores/${id});
        const storeData = await storeRes.json();

        const clothesRes = await fetch(
          http://localhost:3000/api/stores/${id}/clothes
        );
        const clothesData = await clothesRes.json();

        setStore(storeData);
        setClothes(clothesData);
      } catch (err) {
        console.error('Error fetching store:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStore();
  }, [id]);

  // Filtering logic
  const filteredClothes = clothes.filter((item) => {
    const inPrice = item.price >= priceRange[0] && item.price <= priceRange[1];
    const inSize =
      selectedSizes.length === 0 || selectedSizes.includes(item.size);
    const inStyle =
      selectedStyles.length === 0 || selectedStyles.includes(item.style);
    const inCategory =
      selectedCategories.length === 0 ||
      selectedCategories.includes(item.category);

    return inPrice && inSize && inStyle && inCategory;
  });

  const toggleSelection = (value, list, setList) => {
    if (list.includes(value)) {
      setList(list.filter((v) => v !== value));
    } else {
      setList([...list, value]);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-600">
        Loading store...
      </div>
    );
  }

  if (!store) {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-gray-600">
        <p>Store not found.</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Go Back
        </button>
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
          src={
            store.profileImageURL ||
            'https://via.placeholder.com/150?text=Thrift+Store'
          }
          alt={store.name}
          className="w-40 h-40 rounded-lg object-cover shadow"
        />
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{store.name}</h1>
          <p className="text-gray-600 mt-1">{store.address}</p>
          <p className="text-gray-700 mt-3">{store.description}</p>
        </div>
      </div>

      {/* Layout: Filters + Clothes */}
      <div className="flex gap-8">
        {/* Filters sidebar */}
        <aside className="w-64 bg-white shadow rounded-lg p-4 h-fit">
          <h2 className="text-lg font-semibold mb-4">Filters</h2>

          {/* Price Filter */}
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-2">Price (R)</h3>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={priceRange[0]}
                min="0"
                onChange={(e) =>
                  setPriceRange([Number(e.target.value), priceRange[1]])
                }
                className="w-20 border rounded px-2 py-1 text-sm"
              />
              <span>-</span>
              <input
                type="number"
                value={priceRange[1]}
                min="0"
                onChange={(e) =>
                  setPriceRange([priceRange[0], Number(e.target.value)])
                }
                className="w-20 border rounded px-2 py-1 text-sm"
              />
            </div>
          </div>

          {/* Sizes */}
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-2">Size</h3>
            {sizeOptions.map((size) => (
              <label key={size} className="block text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={selectedSizes.includes(size)}
                  onChange={() =>
                    toggleSelection(size, selectedSizes, setSelectedSizes)
                  }
                  className="mr-2"
                />
                {size}
              </label>
            ))}
          </div>

          {/* Styles */}
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-2">Style</h3>
            {styleOptions.map((style) => (
              <label key={style} className="block text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={selectedStyles.includes(style)}
                  onChange={() =>
                    toggleSelection(style, selectedStyles, setSelectedStyles)
                  }
                  className="mr-2"
                />
                {style}
              </label>
            ))}
          </div>

          {/* Categories */}
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-2">Category</h3>
            {categoryOptions.map((cat) => (
              <label key={cat} className="block text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(cat)}
                  onChange={() =>
                    toggleSelection(
                      cat,
                      selectedCategories,
                      setSelectedCategories
                    )
                  }
                  className="mr-2"
                />
                {cat}
              </label>
            ))}
          </div>
        </aside>

        {/* Clothes grid */}
        <main className="flex-1">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Clothes Available
          </h2>

          {filteredClothes.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
              {filteredClothes.map((item) => (
                <div
                  key={item.id}
                  className="bg-white shadow rounded-lg overflow-hidden hover:shadow-md transition"
                >
                  <img
                    src={item.imageURL || 'https://via.placeholder.com/200'}
                    alt={item.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-3">
                    <h3 className="font-semibold text-gray-800 truncate">
                      {item.name}
                    </h3>
                    <p className="text-sm text-gray-600 truncate">
                      {item.category}
                    </p>
                    <p className="text-sm text-gray-600">{item.size}</p>
                    <p className="text-blue-600 font-bold mt-1">
                      R{item.price}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">
              No clothes match the selected filters.
            </p>
          )}
        </main>
      </div>
    </div>
  );
}