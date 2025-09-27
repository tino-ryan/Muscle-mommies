import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom"; // use MemoryRouter for testing
import MyCloset from "../pages/customer/MyCloset";
import axios from "axios";
import { getAuth, onAuthStateChanged } from "firebase/auth";

jest.mock("axios");
jest.mock("firebase/auth");

describe("MyCloset", () => {
  const mockUser = {
    getIdToken: jest.fn().mockResolvedValue("fake-token"),
  };

  beforeEach(() => {
    // Mock Firebase Auth
    getAuth.mockReturnValue({});
    onAuthStateChanged.mockImplementation((auth, callback) => {
      callback(mockUser); // simulate logged-in user
      return jest.fn(); // unsubscribe
    });

    // Clear Axios mocks
    axios.get.mockReset();
    axios.post.mockReset();
  });

  test("renders headings", async () => {
    // Mock GET requests for outfits and reservations
    axios.get.mockResolvedValue({ data: [] });

    render(
      <MemoryRouter>
        <MyCloset />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Create New Outfit/i)).toBeInTheDocument();
      expect(screen.getByText(/My Outfits/i)).toBeInTheDocument();
    });
  });

  test("shows placeholder if no outfits", async () => {
    axios.get.mockResolvedValue({ data: [] });

    render(
      <MemoryRouter>
        <MyCloset />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText(/You haven’t saved any outfits yet/i)
      ).toBeInTheDocument();
    });
  });

  test("opens popup when clicking a slot", async () => {
    axios.get.mockResolvedValue({ data: [] });

    render(
      <MemoryRouter>
        <MyCloset />
      </MemoryRouter>
    );

    const slots = await screen.findAllByText("+");
    fireEvent.click(slots[0]);

    await waitFor(() => {
      expect(screen.getByText(/Select an item/i)).toBeInTheDocument();
    });
  });

  test("saves outfit and reloads outfits", async () => {
    // Initial GET (empty)
    axios.get.mockResolvedValueOnce({ data: [] });
    // POST mock
    axios.post.mockResolvedValueOnce({ data: {} });
    // GET after save
    axios.get.mockResolvedValueOnce({ data: [{ slots: [] }] });

    render(
      <MemoryRouter>
        <MyCloset />
      </MemoryRouter>
    );

    const saveBtn = await screen.findByText(/Save Outfit/i);
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining("/api/outfits"),
        expect.any(Object),
        expect.any(Object)
      );
      expect(axios.get).toHaveBeenCalledTimes(2); // initial + after save
    });
  });
});
