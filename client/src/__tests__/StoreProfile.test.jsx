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

  // Add these tests to the existing StoreProfile.test.jsx file

  describe('Profile Image Upload', () => {
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

    it('uploads profile image and saves store', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText('Upload New Image');

      // Mock image upload endpoint
      axios.post.mockImplementation((url, data) => {
        if (url.includes('/upload-image')) {
          return Promise.resolve({
            data: { imageURL: 'http://example.com/new-image.jpg' },
          });
        }
        return Promise.resolve({
          data: {
            ...mockStoreData,
            profileImageURL: 'http://example.com/new-image.jpg',
          },
        });
      });

      fireEvent.change(fileInput, { target: { files: [file] } });

      const nameInput = screen.getByDisplayValue('Vintage Threads');
      fireEvent.change(nameInput, { target: { value: 'Updated Store' } });

      fireEvent.click(screen.getByText('Save Profile'));

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          expect.stringContaining('/upload-image'),
          expect.any(FormData),
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: 'Bearer fake-token',
              'Content-Type': 'multipart/form-data',
            }),
          })
        );
      });
    });

    it('handles image upload error', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText('Upload New Image');

      axios.post.mockImplementation((url) => {
        if (url.includes('/upload-image')) {
          return Promise.reject({
            response: { data: { error: 'Upload failed' } },
          });
        }
        return Promise.resolve({ data: mockStoreData });
      });

      fireEvent.change(fileInput, { target: { files: [file] } });
      fireEvent.click(screen.getByText('Save Profile'));

      await waitFor(() => {
        expect(
          screen.getByText('Failed to save store profile: Upload failed')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
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

    it('validates store name is required', async () => {
      const nameInput = screen.getByDisplayValue('Vintage Threads');
      fireEvent.change(nameInput, { target: { value: '   ' } }); // Whitespace only

      fireEvent.click(screen.getByText('Save Profile'));

      await waitFor(() => {
        expect(screen.getByText('Store name is required.')).toBeInTheDocument();
      });
    });

    it('validates address search input', async () => {
      const searchInput = screen.getByPlaceholderText(
        'Enter house number, street, suburb, city'
      );
      fireEvent.change(searchInput, { target: { value: '' } });

      fireEvent.click(screen.getByText('Search'));

      expect(
        screen.getByText(
          'Please enter house number, street name, suburb, and city.'
        )
      ).toBeInTheDocument();
    });
  });

  describe('Address Search', () => {
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
    });

    it('shows no results message when address search returns empty', async () => {
      axios.get.mockImplementation((url) => {
        if (url.includes('/api/my-store')) {
          return Promise.resolve({ data: mockStoreData });
        }
        if (url.includes('nominatim')) {
          return Promise.resolve({ data: [] });
        }
        return Promise.resolve({ data: mockContactData });
      });

      const searchInput = screen.getByPlaceholderText(
        'Enter house number, street, suburb, city'
      );
      fireEvent.change(searchInput, { target: { value: '999 Fake St' } });
      fireEvent.click(screen.getByText('Search'));

      await waitFor(() => {
        expect(
          screen.getByText(
            'No results found for the address. Please try again.'
          )
        ).toBeInTheDocument();
      });
    });

    it('selects address from dropdown', async () => {
      const searchInput = screen.getByPlaceholderText(
        'Enter house number, street, suburb, city'
      );
      fireEvent.change(searchInput, { target: { value: '123 Test Street' } });
      fireEvent.click(screen.getByText('Search'));

      await waitFor(() => {
        expect(screen.getByText('Select an address')).toBeInTheDocument();
      });

      // Get the address dropdown specifically (not the theme dropdown)
      const addressDropdown = screen.getByRole('combobox', { name: '' });
      const dropdowns = screen.getAllByRole('combobox');
      const addressSelect = dropdowns.find((dropdown) =>
        dropdown.querySelector('option[value="0"]')
      );

      fireEvent.change(addressSelect, { target: { value: '0' } });

      await waitFor(() => {
        const addressInput = screen.getByDisplayValue(
          /123 Test St, Test Suburb, Test City/
        );
        expect(addressInput).toBeInTheDocument();
      });
    });
  });

  describe('Hours Modal', () => {
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

    it('toggles day open/closed', () => {
      const mondayCheckbox = screen
        .getByText('Mon')
        .parentElement.querySelector('input[type="checkbox"]');

      expect(mondayCheckbox.checked).toBe(true);

      fireEvent.click(mondayCheckbox);

      expect(mondayCheckbox.checked).toBe(false);
    });

    it('changes opening time', () => {
      const timeInputs = screen.getAllByDisplayValue('09:00');
      const mondayStartTime = timeInputs[0];

      fireEvent.change(mondayStartTime, { target: { value: '08:00' } });

      expect(screen.getByDisplayValue('08:00')).toBeInTheDocument();
    });

    it('changes closing time', () => {
      const timeInputs = screen.getAllByDisplayValue('17:00');
      const mondayEndTime = timeInputs[0];

      fireEvent.change(mondayEndTime, { target: { value: '18:00' } });

      expect(screen.getByDisplayValue('18:00')).toBeInTheDocument();
    });

    it('handles hours save error', async () => {
      axios.post.mockRejectedValue({
        response: { data: { error: 'Failed to save hours' } },
      });

      fireEvent.click(screen.getByText('Save Hours'));

      await waitFor(() => {
        expect(
          screen.getByText('Failed to save hours: Failed to save hours')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Theme Selection', () => {
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
    });

    it('changes theme selection', async () => {
      const themeSelect = screen.getByLabelText('Theme');

      fireEvent.change(themeSelect, { target: { value: 'theme-fashion' } });

      expect(themeSelect.value).toBe('theme-fashion');
    });

    it('displays theme in view mode', async () => {
      renderStoreProfile();

      await waitFor(() => {
        expect(screen.getByText('vintage')).toBeInTheDocument();
      });
    });
  });

  describe('Contact Information Management', () => {
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
    });

    it('handles multiple contact types', async () => {
      const emailInput = screen.getByDisplayValue('store@example.com');
      const phoneInput = screen.getByDisplayValue('+27123456789');
      const instagramInput = screen.getByDisplayValue('@vintagethreads');

      fireEvent.change(emailInput, {
        target: { value: 'newemail@example.com' },
      });
      fireEvent.change(phoneInput, { target: { value: '+27987654321' } });
      fireEvent.change(instagramInput, { target: { value: '@newhandle' } });

      expect(
        screen.getByDisplayValue('newemail@example.com')
      ).toBeInTheDocument();
      expect(screen.getByDisplayValue('+27987654321')).toBeInTheDocument();
      expect(screen.getByDisplayValue('@newhandle')).toBeInTheDocument();
    });

    it('deletes existing contacts on save', async () => {
      axios.delete.mockResolvedValue({});
      axios.post.mockResolvedValue({ data: mockStoreData });

      fireEvent.click(screen.getByText('Save Profile'));

      await waitFor(() => {
        expect(axios.delete).toHaveBeenCalledWith(
          expect.stringContaining('/api/stores/contact-infos/1'),
          expect.any(Object)
        );
        expect(axios.delete).toHaveBeenCalledWith(
          expect.stringContaining('/api/stores/contact-infos/2'),
          expect.any(Object)
        );
      });
    });

    it('handles contact deletion error gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      axios.delete.mockRejectedValue({
        response: { data: { error: 'Delete failed' } },
      });

      fireEvent.click(screen.getByText('Save Profile'));

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });
    });

    it('handles store with no contact infos', async () => {
      axios.get.mockImplementation((url) => {
        if (url.includes('/api/my-store')) {
          return Promise.resolve({ data: mockStoreData });
        }
        if (url.includes('/api/stores/contact-infos')) {
          return Promise.reject({
            response: { data: { error: 'No contacts found' } },
          });
        }
        return Promise.reject(new Error('Not found'));
      });

      renderStoreProfile();

      await waitFor(() => {
        expect(screen.getByText('Vintage Threads')).toBeInTheDocument();
      });

      expect(screen.getByText('No contact info provided.')).toBeInTheDocument();
    });

    it('displays placeholder when no profile image', async () => {
      axios.get.mockImplementation((url) => {
        if (url.includes('/api/my-store')) {
          return Promise.resolve({
            data: { ...mockStoreData, profileImageURL: '' },
          });
        }
        return Promise.resolve({ data: mockContactData });
      });

      renderStoreProfile();

      await waitFor(() => {
        expect(screen.getByText('Vintage Threads')).toBeInTheDocument();
      });

      // Check for placeholder URL in the background style
      const headerBackground = document.querySelector(
        '.profile-header-background'
      );
      expect(headerBackground.style.backgroundImage).toContain('placeholder');
    });

    it('handles missing hours data', async () => {
      axios.get.mockImplementation((url) => {
        if (url.includes('/api/my-store')) {
          return Promise.resolve({
            data: { ...mockStoreData, hours: null },
          });
        }
        return Promise.resolve({ data: mockContactData });
      });

      renderStoreProfile();

      await waitFor(() => {
        expect(screen.getByText('Vintage Threads')).toBeInTheDocument();
      });
    });

    it('disables directions button when no location', async () => {
      axios.get.mockImplementation((url) => {
        if (url.includes('/api/my-store')) {
          return Promise.resolve({
            data: { ...mockStoreData, location: { lat: '', lng: '' } },
          });
        }
        return Promise.resolve({ data: mockContactData });
      });

      renderStoreProfile();

      await waitFor(() => {
        const directionsButton = screen.getByText('Get Directions');
        expect(directionsButton).toBeDisabled();
      });
    });

    it('handles facebook contact type', async () => {
      axios.get.mockImplementation((url) => {
        if (url.includes('/api/my-store')) {
          return Promise.resolve({ data: mockStoreData });
        }
        if (url.includes('/api/stores/contact-infos')) {
          return Promise.resolve({
            data: [{ id: 4, type: 'facebook', value: '@storepage' }],
          });
        }
        return Promise.reject(new Error('Not found'));
      });

      renderStoreProfile();

      await waitFor(() => {
        expect(screen.getByText('@storepage')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('@storepage'));

      expect(global.open).toHaveBeenCalledWith(
        'https://facebook.com/storepage',
        '_blank'
      );
    });

    it('closes reviews modal', async () => {
      renderStoreProfile();

      await waitFor(() => {
        expect(screen.getByText('(12 reviews)')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('(12 reviews)'));

      expect(screen.getByTestId('reviews-modal')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Close Reviews'));

      expect(screen.queryByTestId('reviews-modal')).not.toBeInTheDocument();
    });
  });
});
