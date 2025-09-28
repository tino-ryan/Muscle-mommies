import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import SearchPage from "../pages/Customer/SearchPage";
import axios from "axios";
import { getAuth } from "firebase/auth";

// Mock axios and Firebase
jest.mock("axios");
jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(),
}));

describe("SearchPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders loading state", async () => {
    getAuth.mockReturnValue({ currentUser: { getIdToken: jest.fn().mockResolvedValue("fakeToken") } });
    axios.get.mockResolvedValueOnce({ data: [] }).mockResolvedValueOnce({ data: [] });

    render(
      <MemoryRouter>
        <SearchPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Loading items/i)).toBeInTheDocument();
  });

  test("renders stores and items", async () => {
    getAuth.mockReturnValue({ currentUser: { getIdToken: jest.fn().mockResolvedValue("fakeToken") } });

    const mockStores = [
      { storeId: "1", storeName: "Thrift Heaven", address: "123 Main St", description: "Cool clothes" },
    ];
    const mockItems = [
      {
        itemId: "i1",
        name: "Vintage Shirt",
        category: "shirts",
        style: "grunge",
        department: "men's",
        price: 200,
        status: "Available",
        images: [{ imageURL: "https://via.placeholder.com/200", isPrimary: true }],
        storeId: "1",
      },
    ];

    axios.get
      .mockResolvedValueOnce({ data: mockStores })
      .mockResolvedValueOnce({ data: mockItems });

    render(
      <MemoryRouter>
        <SearchPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Thrift Heaven")).toBeInTheDocument();
      expect(screen.getByText("Vintage Shirt")).toBeInTheDocument();
    });
  });

  test("shows error if API fails", async () => {
    getAuth.mockReturnValue({ currentUser: { getIdToken: jest.fn().mockResolvedValue("fakeToken") } });
    axios.get.mockRejectedValue(new Error("Network error"));

    render(
      <MemoryRouter>
        <SearchPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Error Loading Data/i)).toBeInTheDocument();
    });
  });

  test("filters items by search term", async () => {
    getAuth.mockReturnValue({ currentUser: { getIdToken: jest.fn().mockResolvedValue("fakeToken") } });

    const mockStores = [{ storeId: "1", storeName: "Thrift Heaven", address: "123", description: "Cool clothes" }];
    const mockItems = [
      { itemId: "i1", name: "Vintage Shirt", category: "shirts", style: "grunge", department: "men's", price: 200, status: "Available", storeId: "1" },
      { itemId: "i2", name: "Summer Dress", category: "dresses", style: "vintage", department: "women's", price: 300, status: "Available", storeId: "1" },
    ];

    axios.get
      .mockResolvedValueOnce({ data: mockStores })
      .mockResolvedValueOnce({ data: mockItems });

    render(
      <MemoryRouter>
        <SearchPage />
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText("Vintage Shirt"));

    fireEvent.change(screen.getByPlaceholderText(/Search for stores or items/i), {
      target: { value: "Dress" },
    });

    expect(screen.getByText("Summer Dress")).toBeInTheDocument();
    expect(screen.queryByText("Vintage Shirt")).not.toBeInTheDocument();
  });
});
