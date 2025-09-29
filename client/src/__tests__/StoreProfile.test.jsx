import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import StoreProfile from '../pages/store/StoreProfile';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import axios from 'axios';

// Mocks
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  onAuthStateChanged: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock('axios');

jest.mock('../components/StoreSidebar', () => ({ currentPage, onLogout }) => (
  <div data-testid="store-sidebar">
    <span>Current Page: {currentPage}</span>
    <button onClick={onLogout}>Logout</button>
  </div>
));

jest.mock('../components/StarRating', () => ({ rating }) => (
  <div data-testid="star-rating" data-rating={rating}>
    Star Rating: {rating}
  </div>
));

jest.mock(
  '../components/ReviewsModal',
  () =>
    ({ isOpen, onClose, storeId, storeName }) =>
      isOpen ? (
        <div data-testid="reviews-modal">
          <span>
            Reviews for {storeName} (Store ID: {storeId})
          </span>
          <button onClick={onClose}>Close Reviews</button>
        </div>
      ) : null
);

// Mock window.open and alert
global.open = jest.fn();
global.alert = jest.fn();

// Mock navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const renderStoreProfile = () =>
  render(
    <BrowserRouter>
      <StoreProfile />
    </BrowserRouter>
  );

describe('StoreProfile', () => {
  const mockAuth = {
    currentUser: {
      getIdToken: jest.fn().mockResolvedValue('fake-token'),
    },
    signOut: jest.fn(),
  };

  const mockUser = {
    getIdToken: jest.fn().mockResolvedValue('fake-token'),
  };

  const mockStoreData = {
    storeId: 'store123',
    storeName: 'Vintage Threads',
    description: 'A cozy thrift store with vintage finds',
    theme: 'theme-vintage',
    address: '123 Main St, Cape Town',
    location: { lat: '-33.9249', lng: '18.4241' },
    profileImageURL: 'http://example.com/store.jpg',
    averageRating: 4.5,
    reviewCount: 12,
    hours: {
      Monday: { open: true, start: '09:00', end: '17:00' },
      Tuesday: { open: true, start: '09:00', end: '17:00' },
      Wednesday: { open: true, start: '09:00', end: '17:00' },
      Thursday: { open: true, start: '09:00', end: '17:00' },
      Friday: { open: true, start: '09:00', end: '17:00' },
      Saturday: { open: true, start: '10:00', end: '16:00' },
      Sunday: { open: false, start: '09:00', end: '17:00' },
    },
  };

  const mockContactData = [
    { id: 1, type: 'email', value: 'store@example.com' },
    { id: 2, type: 'phone', value: '+27123456789' },
    { id: 3, type: 'instagram', value: '@vintagethreads' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    getAuth.mockReturnValue(mockAuth);
    signOut.mockResolvedValue();

    // Setup default axios responses
    axios.get.mockImplementation((url) => {
      if (url.includes('/api/my-store')) {
        return Promise.resolve({ data: mockStoreData });
      }
      if (url.includes('/api/stores/contact-infos')) {
        return Promise.resolve({ data: mockContactData });
      }
      if (url.includes('nominatim.openstreetmap.org')) {
        return Promise.resolve({
          data: [
            {
              display_name: '123 Test St, Test City, South Africa',
              address: {
                house_number: '123',
                road: 'Test St',
                suburb: 'Test Suburb',
                city: 'Test City',
              },
              lat: '-33.9249',
              lon: '18.4241',
            },
          ],
        });
      }
      return Promise.reject(new Error('Not found'));
    });

    axios.post.mockResolvedValue({ data: mockStoreData });
    axios.delete.mockResolvedValue({});
  });

  describe('Authentication', () => {
    it('redirects to login when user is not authenticated', () => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null);
        return jest.fn();
      });

      renderStoreProfile();

      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  describe('Loading State', () => {
    it('shows loading message while fetching data', () => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });

      axios.get.mockImplementation(() => new Promise(() => {}));

      renderStoreProfile();

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Store Display Mode', () => {
    beforeEach(() => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });
    });

    it('displays existing store profile', async () => {
      renderStoreProfile();

      await waitFor(() => {
        expect(screen.getByText('Vintage Threads')).toBeInTheDocument();
        expect(
          screen.getByText('A cozy thrift store with vintage finds')
        ).toBeInTheDocument();
        expect(screen.getByText('123 Main St, Cape Town')).toBeInTheDocument();
      });

      expect(screen.getByTestId('star-rating')).toHaveAttribute(
        'data-rating',
        '4.5'
      );
      expect(screen.getByText('(12 reviews)')).toBeInTheDocument();
    });

    it('displays operating hours correctly', async () => {
      renderStoreProfile();

      await waitFor(() => {
        expect(screen.getByText('Mon–Fri:')).toBeInTheDocument();
        expect(screen.getByText('09:00–17:00')).toBeInTheDocument();
        expect(screen.getByText('Sat:')).toBeInTheDocument();
        expect(screen.getByText('10:00–16:00')).toBeInTheDocument();
        expect(screen.getByText('Sun:')).toBeInTheDocument();
        expect(screen.getByText('Closed')).toBeInTheDocument();
      });
    });

    it('displays contact information', async () => {
      renderStoreProfile();

      await waitFor(() => {
        expect(screen.getByText('store@example.com')).toBeInTheDocument();
        expect(screen.getByText('+27123456789')).toBeInTheDocument();
        expect(screen.getByText('@vintagethreads')).toBeInTheDocument();
      });
    });

    it('opens reviews modal when reviews button is clicked', async () => {
      renderStoreProfile();

      await waitFor(() => {
        expect(screen.getByText('(12 reviews)')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('(12 reviews)'));

      expect(screen.getByTestId('reviews-modal')).toBeInTheDocument();
      expect(
        screen.getByText('Reviews for Vintage Threads (Store ID: store123)')
      ).toBeInTheDocument();
    });

    it('switches to edit mode when edit button is clicked', async () => {
      renderStoreProfile();

      await waitFor(() => {
        expect(screen.getByText('Edit Profile')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Edit Profile'));

      expect(screen.getByText('Edit Store Profile')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Vintage Threads')).toBeInTheDocument();
    });

    it('opens contact links correctly', async () => {
      renderStoreProfile();

      await waitFor(() => {
        expect(screen.getByText('store@example.com')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('store@example.com'));
      expect(global.open).toHaveBeenCalledWith(
        'mailto:store@example.com',
        '_blank'
      );

      fireEvent.click(screen.getByText('+27123456789'));
      expect(global.open).toHaveBeenCalledWith('tel:+27123456789', '_blank');

      fireEvent.click(screen.getByText('@vintagethreads'));
      expect(global.open).toHaveBeenCalledWith(
        'https://instagram.com/vintagethreads',
        '_blank'
      );
    });

    it('opens Google Maps when directions button is clicked', async () => {
      renderStoreProfile();

      await waitFor(() => {
        expect(screen.getByText('Get Directions')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Get Directions'));

      expect(global.open).toHaveBeenCalledWith(
        'https://www.google.com/maps/search/?api=1&query=-33.9249,18.4241',
        '_blank'
      );
    });
  });

  describe('Store Creation Mode', () => {
    beforeEach(() => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });

      axios.get.mockImplementation((url) => {
        if (url.includes('/api/my-store')) {
          return Promise.reject({
            response: { status: 400, data: { error: 'Store not found' } },
          });
        }
        return Promise.reject(new Error('Not found'));
      });
    });

    it('shows edit form when no store exists', async () => {
      renderStoreProfile();

      await waitFor(() => {
        expect(screen.getByText('Edit Store Profile')).toBeInTheDocument();
        expect(
          screen.getByText('No store found. Please create your store profile.')
        ).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/Store Name/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Description/)).toBeInTheDocument();
    });
  });

  describe('Form Editing', () => {
    beforeEach(async () => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });

      renderStoreProfile();

      await waitFor(() => {
        expect(screen.getByText('Edit Profile')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Edit Profile'));

      await waitFor(() => {
        expect(screen.getByText('Edit Store Profile')).toBeInTheDocument();
      });
    });

    it('updates store information', () => {
      const nameInput = screen.getByDisplayValue('Vintage Threads');
      fireEvent.change(nameInput, { target: { value: 'Updated Store Name' } });

      expect(
        screen.getByDisplayValue('Updated Store Name')
      ).toBeInTheDocument();
    });

    it('validates contact information requirement', async () => {
      // Clear all contact fields
      const emailInput = screen.getByDisplayValue('store@example.com');
      const phoneInput = screen.getByDisplayValue('+27123456789');
      const instagramInput = screen.getByDisplayValue('@vintagethreads');

      fireEvent.change(emailInput, { target: { value: '' } });
      fireEvent.change(phoneInput, { target: { value: '' } });
      fireEvent.change(instagramInput, { target: { value: '' } });

      fireEvent.click(screen.getByText('Save Profile'));

      await waitFor(() => {
        expect(
          screen.getByText('At least one contact info is required.')
        ).toBeInTheDocument();
      });
    });

    it('handles address search', async () => {
      const searchInput = screen.getByPlaceholderText(
        'Enter house number, street, suburb, city'
      );
      fireEvent.change(searchInput, { target: { value: '123 Test Street' } });

      fireEvent.click(screen.getByText('Search'));

      await waitFor(() => {
        expect(screen.getByText('Select an address')).toBeInTheDocument();
      });

      expect(axios.get).toHaveBeenCalledWith(
        'https://nominatim.openstreetmap.org/search',
        expect.objectContaining({
          params: expect.objectContaining({
            q: '123 Test Street, South Africa',
            format: 'json',
          }),
        })
      );
    });

    it('handles profile image upload', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText('Upload New Image');

      fireEvent.change(fileInput, { target: { files: [file] } });

      expect(fileInput.files[0]).toBe(file);
    });

    it('cancels editing', () => {
      fireEvent.click(screen.getByText('Cancel'));

      expect(screen.getByText('Vintage Threads')).toBeInTheDocument();
      expect(screen.queryByText('Edit Store Profile')).not.toBeInTheDocument();
    });
  });

  describe('Operating Hours Modal', () => {
    beforeEach(async () => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });

      renderStoreProfile();

      await waitFor(() => {
        expect(screen.getByText('Edit Profile')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Edit Profile'));

      await waitFor(() => {
        expect(screen.getByText('Edit Operating Hours')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Edit Operating Hours'));
    });

    it('opens hours modal', () => {
      expect(screen.getByText('Set Operating Hours')).toBeInTheDocument();
      expect(screen.getByText('Mon')).toBeInTheDocument();
      expect(screen.getByText('Tue')).toBeInTheDocument();
    });

    it('saves hours', async () => {
      fireEvent.click(screen.getByText('Save Hours'));

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          expect.stringContaining('/api/stores'),
          expect.objectContaining({
            hours: expect.any(String),
          }),
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: 'Bearer fake-token',
            }),
          })
        );
      });

      expect(global.alert).toHaveBeenCalledWith(
        'Operating hours saved successfully!'
      );
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });
    });

    it('handles API error when fetching store', async () => {
      axios.get.mockRejectedValue({
        response: { data: { error: 'Network error' } },
      });

      renderStoreProfile();

      await waitFor(() => {
        expect(
          screen.getByText('Failed to fetch store: Network error')
        ).toBeInTheDocument();
      });
    });

    it('handles address search error', async () => {
      axios.get.mockImplementation((url) => {
        if (url.includes('/api/my-store')) {
          return Promise.resolve({ data: mockStoreData });
        }
        if (url.includes('nominatim')) {
          return Promise.reject(new Error('Search failed'));
        }
        return Promise.resolve({ data: mockContactData });
      });

      renderStoreProfile();

      await waitFor(() => {
        fireEvent.click(screen.getByText('Edit Profile'));
      });

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(
          'Enter house number, street, suburb, city'
        );
        fireEvent.change(searchInput, { target: { value: '123 Test' } });
        fireEvent.click(screen.getByText('Search'));
      });

      await waitFor(() => {
        expect(
          screen.getByText('Failed to search address: Search failed')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Logout Functionality', () => {
    beforeEach(() => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });
    });

    it('handles logout correctly', async () => {
      renderStoreProfile();

      await waitFor(() => {
        expect(screen.getByTestId('store-sidebar')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Logout'));

      await waitFor(() => {
        expect(signOut).toHaveBeenCalledWith(mockAuth);
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });

    it('handles logout error', async () => {
      signOut.mockRejectedValue(new Error('Logout failed'));

      renderStoreProfile();

      await waitFor(() => {
        expect(screen.getByTestId('store-sidebar')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Logout'));

      await waitFor(() => {
        expect(
          screen.getByText('Failed to log out: Logout failed')
        ).toBeInTheDocument();
      });
    });
  });
});
