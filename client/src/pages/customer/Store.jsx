// src/pages/customer/Store.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getStoreItems,
  getStoreDetails,
  reserveItem,
} from "./itemController";

export default function Store({ currentUser }) {
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
  const sizeOptions = ["XS", "S", "M", "L", "XL"];
  const styleOptions = ["Vintage", "Casual", "Formal", "Streetwear"];
  const categoryOptions = ["Tops", "Pants", "Dresses", "Shoes", "Accessories"];

  // Fetch from DB instead of mocks
  useEffect(() => {
    const fetchData = async () => {
      try {
        const storeData = await getStoreDetails(id);
        const itemsData = await getStoreItems(id);

        setStore(storeData);
        setClothes(itemsData);
      } catch (err) {
        console.error("Error loading store:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Filtering logic
  const filteredClothes = clothes.filter((item) => {
    const inPrice = item.Price >= priceRange[0] && item.Price <= priceRange[1];
    const inSize =
      selectedSizes.length === 0 || selectedSizes.includes(item.Size);
    const inStyle =
      selectedStyles.length === 0 || selectedStyles.includes(item.Style);
    const inCategory =
      selectedCategories.length === 0 ||
      selectedCategories.includes(item.Category);

    return inPrice && inSize && inStyle && inCategory;
  });

  const toggleSelection = (value, list, setList) => {
    if (list.includes(value)) {
      setList(list.filter((v) => v !== value));
    } else {
      setList([...list, value]);
    }
  };

  // Reserve item → updates DB + UI
  const handleReserve = async (itemId) => {
    try {
      const reservation = await reserveItem(itemId, currentUser.id, id);

      // Update item in list
      setClothes((prev) =>
        prev.map((item) =>
          item.ItemId === itemId ? { ...item, Status: "Reserved" } : item
        )
      );

      // Update modal if open
      setSelectedItem((prev) =>
        prev && prev.ItemId === itemId ? { ...prev, Status: "Reserved" } : prev
      );
    } catch (err) {
      alert(err.message);
    }
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
        {store && (
  <>
    <img
      src={
        store.ProfileImageURL ||
        "https://via.placeholder.com/150?text=Thrift+Store"
      }
      alt={store.Name || "Store"}
      className="w-40 h-40 rounded-lg object-cover shadow"
    />
    <div>
      <h1 className="text-3xl font-bold text-gray-800">{store.Name}</h1>
      <p className="text-gray-600 mt-1">{store.Address}</p>
      <p className="text-gray-700 mt-3">{store.Description}</p>
    </div>
  </>
)}
      </div>

      {/* Layout: Clothes + Filters */}
      <div className="flex gap-8">
        {/* Clothes grid */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 overflow-y-auto max-h-[75vh]">
          {filteredClothes.map((item) => (
            <div
              key={item.ItemId}
              onClick={() => setSelectedItem(item)}
              className="bg-white shadow-lg rounded-lg overflow-hidden hover:shadow-xl hover:scale-105 transition-transform cursor-pointer relative flex flex-col"
            >
              {item.Status === "Reserved" && (
                <span className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
                  Reserved
                </span>
              )}
              <img
                src={item.ImageURL || "https://via.placeholder.com/200"}
                alt={item.Name}
                className="w-full h-48 object-cover rounded-t-lg"
              />
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800 truncate">
                    {item.Name}
                  </h3>
                  <p className="text-sm text-gray-600 truncate">
                    {item.Category}
                  </p>
                  <p className="text-sm text-gray-600">{item.Size}</p>
                </div>
                <p className="text-blue-600 font-bold mt-2">R{item.Price}</p>
              </div>
            </div>
          ))}
          {filteredClothes.length === 0 && (
            <p className="text-gray-600 col-span-full">
              No clothes match the selected filters.
            </p>
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
                  onChange={() =>
                    toggleSelection(size, selectedSizes, setSelectedSizes)
                  }
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
                  onChange={() =>
                    toggleSelection(style, selectedStyles, setSelectedStyles)
                  }
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
                  onChange={() =>
                    toggleSelection(cat, selectedCategories, setSelectedCategories)
                  }
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
                src={selectedItem.ImageURL || "https://via.placeholder.com/200"}
                alt={selectedItem.Name}
                className="w-full md:w-1/2 h-64 object-cover rounded-lg"
              />
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {selectedItem.Name}
                  </h2>
                  <p className="text-gray-600 mt-2">{selectedItem.Description}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Category: {selectedItem.Category}
                  </p>
                  <p className="text-sm text-gray-600">Size: {selectedItem.Size}</p>
                  <p className="text-blue-600 font-bold mt-2 text-xl">
                    R{selectedItem.Price}
                  </p>
                  {selectedItem.Status === "Reserved" && (
                    <p className="text-red-600 font-semibold mt-2">
                      This item is reserved
                    </p>
                  )}
                </div>
                <div className="mt-4 flex gap-4">
                  <button
                    onClick={() => handleReserve(selectedItem.ItemId)}
                    disabled={selectedItem.Status === "Reserved"}
                    className={`px-4 py-2 rounded-lg text-white font-semibold ${
                      selectedItem.Status === "Reserved"
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
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
