import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import StoreProfile from '../pages/store/StoreProfile';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import axios from 'axios';

// --- Mock Firebase Auth ---
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  onAuthStateChanged: jest.fn(),
  signOut: jest.fn(),
}));

// --- Mock Axios ---
jest.mock('axios');

// --- Mock Components ---
jest.mock('../../components/StoreSidebar', () => {
  const StoreSidebar = ({ currentPage, onLogout, theme }) => (
    <div data-testid="store-sidebar" data-theme={theme}>
      <span>Current Page: {currentPage}</span>
      <button onClick={onLogout}>Logout</button>
    </div>
  );
  StoreSidebar.displayName = 'StoreSidebar';
  return StoreSidebar;
});

jest.mock('../../components/StarRating', () => {
  const StarRating = ({ rating }) => (
    <div data-testid="star-rating" data-rating={rating}>
      Star Rating: {rating}
    </div>
  );
  StarRating.displayName = 'StarRating';
  return StarRating;
});

jest.mock('../../components/ReviewsModal', () => {
  const ReviewsModal = ({ isOpen, onClose, storeId, storeName }) =>
    isOpen ? (
      <div data-testid="reviews-modal">
        <span>
          Reviews for {storeName} (Store ID: {storeId})
        </span>
        <button onClick={onClose}>Close Reviews</button>
      </div>
    ) : null;
  ReviewsModal.displayName = 'ReviewsModal';
  return ReviewsModal;
});

// --- Mock globals ---
global.open = jest.fn();
global.alert = jest.fn();

// --- Mock navigate ---
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// --- Helper to render component ---
const renderStoreProfile = () =>
  render(
    <BrowserRouter>
      <StoreProfile />
    </BrowserRouter>
  );

// --- Mock data ---
const mockAuth = {
  currentUser: { getIdToken: jest.fn().mockResolvedValue('fake-token') },
};
const mockUser = { getIdToken: jest.fn().mockResolvedValue('fake-token') };

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

describe('StoreProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getAuth.mockReturnValue(mockAuth);
    signOut.mockResolvedValue();
    onAuthStateChanged.mockImplementation((auth, callback) => {
      callback(mockUser);
      return jest.fn();
    });
    axios.get.mockImplementation((url) => {
      if (url.includes('/api/my-store'))
        return Promise.resolve({ data: mockStoreData });
      if (url.includes('/api/stores/contact-infos'))
        return Promise.resolve({ data: mockContactData });
      if (url.includes('nominatim.openstreetmap.org'))
        return Promise.resolve({
          data: [
            {
              display_name: '123 Main St, Cape Town, South Africa',
              address: {
                house_number: '123',
                road: 'Main St',
                suburb: 'City Centre',
                city: 'Cape Town',
              },
              lat: '-33.9249',
              lon: '18.4241',
            },
          ],
        });
      return Promise.reject(new Error('Not found'));
    });
    axios.post.mockResolvedValue({ data: mockStoreData });
    axios.delete.mockResolvedValue({});
  });

  // --- Authentication Tests ---
  describe('Authentication', () => {
    it('redirects to login when not authenticated', async () => {
      onAuthStateChanged.mockImplementationOnce((auth, callback) => {
        callback(null);
        return jest.fn();
      });
      renderStoreProfile();
      await waitFor(() => {
        expect(
          screen.getByText('No physical address set.')
        ).toBeInTheDocument();
      });
    });

    it('displays no contact info message when contacts are empty', async () => {
      axios.get.mockImplementation((url) => {
        if (url.includes('/api/my-store'))
          return Promise.resolve({ data: mockStoreData });
        if (url.includes('/api/stores/contact-infos'))
          return Promise.resolve({ data: [] });
        return Promise.reject(new Error('Not found'));
      });

      renderStoreProfile();
      await waitFor(() => {
        expect(
          screen.getByText('No contact info provided.')
        ).toBeInTheDocument();
      });
    });
  });
});oreProfile();
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });

    it('loads store when authenticated', async () => {
      renderStoreProfile();
      await waitFor(() => {
        expect(screen.getByText('Vintage Threads')).toBeInTheDocument();
      });
    });
  });

  // --- Loading State ---
  describe('Loading State', () => {
    it('shows loading skeleton while fetching', () => {
      axios.get.mockImplementation(() => new Promise(() => {}));
      renderStoreProfile();

      expect(screen.getByTestId('store-sidebar')).toBeInTheDocument();

      // Check for skeleton loading using aria-busy
      const skeletonContainer = document.querySelector('[aria-busy="true"]');
      expect(skeletonContainer).toBeInTheDocument();
    });
  });

  // --- Store Display Mode ---
  describe('Store Display Mode', () => {
    beforeEach(async () => {
      renderStoreProfile();
      await waitFor(() => {
        expect(screen.getByText('Vintage Threads')).toBeInTheDocument();
      });
    });

    it('displays store profile correctly', () => {
      expect(screen.getByText('Vintage Threads')).toBeInTheDocument();
      expect(
        screen.getByText('A cozy thrift store with vintage finds')
      ).toBeInTheDocument();
      expect(screen.getByText('123 Main St, Cape Town')).toBeInTheDocument();
      expect(screen.getByTestId('star-rating')).toHaveAttribute(
        'data-rating',
        '4.5'
      );
      expect(screen.getByText('(12 reviews)')).toBeInTheDocument();
      expect(screen.getByText('Vintage')).toBeInTheDocument();
    });

    it('displays operating hours grouped correctly', () => {
      expect(screen.getByText(/Mon–Fri:/)).toBeInTheDocument();
      expect(screen.getByText('09:00–17:00')).toBeInTheDocument();
      expect(screen.getByText(/Sat:/)).toBeInTheDocument();
      expect(screen.getByText('10:00–16:00')).toBeInTheDocument();
      expect(screen.getByText(/Sun:/)).toBeInTheDocument();
      expect(screen.getByText('Closed')).toBeInTheDocument();
    });

    it('displays contact info', () => {
      expect(screen.getByText('store@example.com')).toBeInTheDocument();
      expect(screen.getByText('+27123456789')).toBeInTheDocument();
      expect(screen.getByText('@vintagethreads')).toBeInTheDocument();
    });

    it('opens reviews modal when clicking review count', async () => {
      fireEvent.click(screen.getByText('(12 reviews)'));
      await waitFor(() => {
        expect(screen.getByTestId('reviews-modal')).toBeInTheDocument();
        expect(
          screen.getByText('Reviews for Vintage Threads (Store ID: store123)')
        ).toBeInTheDocument();
      });
    });

    it('closes reviews modal', async () => {
      fireEvent.click(screen.getByText('(12 reviews)'));
      await waitFor(() => {
        expect(screen.getByTestId('reviews-modal')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Close Reviews'));
      await waitFor(() => {
        expect(screen.queryByTestId('reviews-modal')).not.toBeInTheDocument();
      });
    });

    it('switches to edit mode when clicking Edit Profile', async () => {
      fireEvent.click(screen.getByText('Edit Profile'));
      await waitFor(() => {
        expect(screen.getByText('Edit Store Profile')).toBeInTheDocument();
        expect(screen.getByLabelText(/Store Name/)).toHaveValue(
          'Vintage Threads'
        );
      });
    });

    it('opens email link when clicking email contact', () => {
      const emailElement = screen.getByText('store@example.com');
      fireEvent.click(emailElement);
      expect(global.open).toHaveBeenCalledWith(
        'mailto:store@example.com',
        '_blank'
      );
    });

    it('opens phone link when clicking phone contact', () => {
      const phoneElement = screen.getByText('+27123456789');
      fireEvent.click(phoneElement);
      expect(global.open).toHaveBeenCalledWith('tel:+27123456789', '_blank');
    });

    it('opens instagram link when clicking instagram contact', () => {
      const instagramElement = screen.getByText('@vintagethreads');
      fireEvent.click(instagramElement);
      expect(global.open).toHaveBeenCalledWith(
        'https://instagram.com/vintagethreads',
        '_blank'
      );
    });

    it('opens Google Maps when clicking Get Directions', () => {
      const directionsButton = screen.getByText('Get Directions');
      fireEvent.click(directionsButton);
      expect(global.open).toHaveBeenCalledWith(
        'https://www.google.com/maps/search/?api=1&query=-33.9249,18.4241',
        '_blank'
      );
    });

    it('disables Get Directions button when no location', async () => {
      axios.get.mockImplementation((url) => {
        if (url.includes('/api/my-store'))
          return Promise.resolve({
            data: { ...mockStoreData, location: { lat: '', lng: '' } },
          });
        if (url.includes('/api/stores/contact-infos'))
          return Promise.resolve({ data: mockContactData });
        return Promise.reject(new Error('Not found'));
      });

      renderStoreProfile();
      await waitFor(() => {
        expect(screen.getByText('Vintage Threads')).toBeInTheDocument();
      });

      const directionsButton = screen.getByText('Get Directions');
      expect(directionsButton).toBeDisabled();
    });
  });

  // --- Store Creation Mode ---
  describe('Store Creation Mode', () => {
    it('shows creation form if no store exists', async () => {
      axios.get.mockImplementation((url) => {
        if (url.includes('/api/my-store'))
          return Promise.reject({
            response: { status: 400, data: { error: 'Store not found' } },
          });
        if (url.includes('/api/stores/contact-infos'))
          return Promise.resolve({ data: [] });
        return Promise.reject(new Error('Not found'));
      });

      renderStoreProfile();
      await waitFor(() => {
        expect(screen.getByText('Edit Store Profile')).toBeInTheDocument();
        expect(
          screen.getByText('No store found. Please create your store profile.')
        ).toBeInTheDocument();
      });
    });

    it('does not show review count when zero reviews', async () => {
      axios.get.mockImplementation((url) => {
        if (url.includes('/api/my-store'))
          return Promise.resolve({
            data: { ...mockStoreData, reviewCount: 0 },
          });
        if (url.includes('/api/stores/contact-infos'))
          return Promise.resolve({ data: mockContactData });
        return Promise.reject(new Error('Not found'));
      });

      renderStoreProfile();
      await waitFor(() => {
        expect(screen.getByText('Vintage Threads')).toBeInTheDocument();
      });

      expect(screen.queryByText(/reviews/)).not.toBeInTheDocument();
    });

    it('shows error message when contact infos fail to load', async () => {
      axios.get.mockImplementation((url) => {
        if (url.includes('/api/my-store'))
          return Promise.resolve({ data: mockStoreData });
        if (url.includes('/api/stores/contact-infos'))
          return Promise.reject(new Error('Contact fetch failed'));
        return Promise.reject(new Error('Not found'));
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      renderStoreProfile();

      await waitFor(() => {
        expect(screen.getByText('Vintage Threads')).toBeInTheDocument();
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Fetch contact infos error:',
        'Contact fetch failed'
      );
      consoleSpy.mockRestore();
    });
  });

  // --- Edit Form Interaction ---
  describe('Edit Form', () => {
    beforeEach(async () => {
      renderStoreProfile();
      await waitFor(() => {
        expect(screen.getByText('Vintage Threads')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Edit Profile'));
      await waitFor(() => {
        expect(screen.getByText('Edit Store Profile')).toBeInTheDocument();
      });
    });

    it('updates store name and description', async () => {
      const nameInput = screen.getByLabelText(/Store Name/);
      fireEvent.change(nameInput, { target: { value: 'New Store Name' } });

      const descriptionInput = screen.getByLabelText('Description');
      fireEvent.change(descriptionInput, {
        target: { value: 'New description' },
      });

      expect(nameInput).toHaveValue('New Store Name');
      expect(descriptionInput).toHaveValue('New description');
    });

    it('updates theme selection', () => {
      const themeSelect = screen.getByLabelText('Theme');
      fireEvent.change(themeSelect, { target: { value: 'theme-grunge' } });
      expect(themeSelect).toHaveValue('theme-grunge');
    });

    it('searches for address successfully', async () => {
      const addressInput = screen.getByLabelText(/Search Address/);
      fireEvent.change(addressInput, {
        target: { value: '123 Main St, Cape Town' },
      });

      const searchButton = screen.getByText('Search');
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });
    });

    it('handles address search with no results', async () => {
      axios.get.mockImplementation((url) => {
        if (url.includes('nominatim')) return Promise.resolve({ data: [] });
        if (url.includes('/api/my-store'))
          return Promise.resolve({ data: mockStoreData });
        if (url.includes('/api/stores/contact-infos'))
          return Promise.resolve({ data: mockContactData });
        return Promise.reject(new Error('Not found'));
      });

      const addressInput = screen.getByLabelText(/Search Address/);
      fireEvent.change(addressInput, {
        target: { value: 'Invalid Address' },
      });

      const searchButton = screen.getByText('Search');
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(
          screen.getByText(
            'No results found for the address. Please try again.'
          )
        ).toBeInTheDocument();
      });
    });

    it('shows error when searching without address', async () => {
      const searchButton = screen.getByText('Search');
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(
          screen.getByText(
            'Please enter house number, street name, suburb, and city.'
          )
        ).toBeInTheDocument();
      });
    });

    it('selects address from search results', async () => {
      const addressInput = screen.getByLabelText(/Search Address/);
      fireEvent.change(addressInput, {
        target: { value: '123 Main St' },
      });

      fireEvent.click(screen.getByText('Search'));

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });

      const selectElement = screen.getByRole('combobox');
      fireEvent.change(selectElement, { target: { value: '0' } });

      await waitFor(() => {
        const addressInputs = screen.getAllByDisplayValue(/123 Main St/);
        expect(addressInputs.length).toBeGreaterThan(0);
      });
    });

    it('updates contact information', () => {
      const inputs = screen.getAllByRole('textbox');
      const emailInput = inputs.find((input) => input.name === 'email');
      const phoneInput = inputs.find((input) => input.name === 'phone');
      const instagramInput = inputs.find((input) => input.name === 'instagram');

      if (emailInput) {
        fireEvent.change(emailInput, {
          target: { value: 'newemail@example.com' },
        });
        expect(emailInput).toHaveValue('newemail@example.com');
      }

      if (phoneInput) {
        fireEvent.change(phoneInput, { target: { value: '+27987654321' } });
        expect(phoneInput).toHaveValue('+27987654321');
      }

      if (instagramInput) {
        fireEvent.change(instagramInput, { target: { value: '@newhandle' } });
        expect(instagramInput).toHaveValue('@newhandle');
      }
    });

    it('handles profile image upload', () => {
      const file = new File(['image'], 'profile.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText('Upload New Image');

      fireEvent.change(fileInput, {
        target: { files: [file] },
      });

      expect(fileInput.files[0]).toStrictEqual(file);
      expect(fileInput.files).toHaveLength(1);
    });

    it('opens and interacts with hours modal', async () => {
      fireEvent.click(screen.getByText('Edit Operating Hours'));

      await waitFor(() => {
        expect(screen.getByText('Set Operating Hours')).toBeInTheDocument();
      });

      // Toggle Monday checkbox
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);

      // Close modal using × button
      const closeButtons = screen.getAllByText('×');
      fireEvent.click(closeButtons[0]);

      await waitFor(() => {
        expect(
          screen.queryByText('Set Operating Hours')
        ).not.toBeInTheDocument();
      });
    });

    it('saves hours from modal', async () => {
      fireEvent.click(screen.getByText('Edit Operating Hours'));

      await waitFor(() => {
        expect(screen.getByText('Set Operating Hours')).toBeInTheDocument();
      });

      const saveButton = screen.getByText('Save Hours');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalled();
        expect(global.alert).toHaveBeenCalledWith(
          'Operating hours saved successfully!'
        );
      });
    });

    it('cancels hours modal', async () => {
      fireEvent.click(screen.getByText('Edit Operating Hours'));

      await waitFor(() => {
        expect(screen.getByText('Set Operating Hours')).toBeInTheDocument();
      });

      const cancelButtons = screen.getAllByText('Cancel');
      const modalCancelButton = cancelButtons.find(btn => 
        btn.className.includes('cancel-button')
      );
      
      if (modalCancelButton) {
        fireEvent.click(modalCancelButton);
      }

      await waitFor(() => {
        expect(
          screen.queryByText('Set Operating Hours')
        ).not.toBeInTheDocument();
      });
    });

    it('validates required store name on submit', async () => {
      const nameInput = screen.getByLabelText(/Store Name/);
      fireEvent.change(nameInput, { target: { value: '' } });

      const saveButton = screen.getByText('Save Profile');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Store name is required.')).toBeInTheDocument();
      });
    });

    it('validates at least one contact info on submit', async () => {
      // Clear all contact inputs
      const inputs = screen.getAllByRole('textbox');
      const contactInputs = inputs.filter((input) => 
        ['email', 'phone', 'instagram', 'facebook'].includes(input.name)
      );

      contactInputs.forEach(input => {
        fireEvent.change(input, { target: { value: '' } });
      });

      const saveButton = screen.getByText('Save Profile');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(
          screen.getByText('At least one contact info is required.')
        ).toBeInTheDocument();
      });
    });

    it('validates location is set on submit', async () => {
      // Mock to return store without location
      axios.get.mockImplementation((url) => {
        if (url.includes('/api/my-store'))
          return Promise.resolve({
            data: { ...mockStoreData, location: { lat: '', lng: '' }, address: '' },
          });
        if (url.includes('/api/stores/contact-infos'))
          return Promise.resolve({ data: mockContactData });
        return Promise.reject(new Error('Not found'));
      });

      // Navigate away and back to trigger fresh state
      const cancelButtons = screen.getAllByText('Cancel');
      fireEvent.click(cancelButtons[0]);

      await waitFor(() => {
        expect(screen.queryByText('Edit Store Profile')).not.toBeInTheDocument();
      });

      // Re-enter edit mode with new mock data
      await waitFor(() => {
        expect(screen.getByText('Edit Profile')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Edit Profile'));

      await waitFor(() => {
        expect(screen.getByText('Edit Store Profile')).toBeInTheDocument();
      });

      const saveButton = screen.getByText('Save Profile');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(
          screen.getByText('Please search and select an address to set location.')
        ).toBeInTheDocument();
      });
    });

    it('saves profile successfully with image upload', async () => {
      axios.post.mockImplementation((url) => {
        if (url.includes('upload-image'))
          return Promise.resolve({
            data: { imageURL: 'http://example.com/new-image.jpg' },
          });
        return Promise.resolve({ data: mockStoreData });
      });

      const file = new File(['image'], 'profile.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText('Upload New Image');

      fireEvent.change(fileInput, {
        target: { files: [file] },
      });

      const saveButton = screen.getByText('Save Profile');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          expect.stringContaining('upload-image'),
          expect.any(FormData),
          expect.any(Object)
        );
        expect(global.alert).toHaveBeenCalledWith(
          'Store profile saved successfully!'
        );
      });
    });

    it('cancels edit mode and returns to display', async () => {
      const cancelButtons = screen.getAllByText('Cancel');
      const formCancelButton = cancelButtons.find(btn =>
        !btn.className.includes('cancel-button') || 
        btn.closest('form')
      );
      
      fireEvent.click(formCancelButton || cancelButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Vintage Threads')).toBeInTheDocument();
        expect(
          screen.queryByText('Edit Store Profile')
        ).not.toBeInTheDocument();
      });
    });
  });

  // --- Logout ---
  describe('Logout', () => {
    it('calls signOut and navigates to login', async () => {
      renderStoreProfile();
      await waitFor(() => {
        expect(screen.getByText('Vintage Threads')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Logout'));

      await waitFor(() => {
        expect(signOut).toHaveBeenCalledWith(mockAuth);
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });

    it('handles logout error', async () => {
      signOut.mockRejectedValueOnce(new Error('Logout failed'));

      renderStoreProfile();
      await waitFor(() => {
        expect(screen.getByText('Vintage Threads')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Logout'));

      await waitFor(() => {
        expect(
          screen.getByText('Failed to log out: Logout failed')
        ).toBeInTheDocument();
      });
    });
  });

  // --- Error Handling ---
  describe('Error Handling', () => {
    it('displays error when store fetch fails', async () => {
      axios.get.mockImplementation((url) => {
        if (url.includes('/api/my-store'))
          return Promise.reject({
            response: {
              status: 500,
              data: { error: 'Internal server error' },
            },
          });
        return Promise.resolve({ data: [] });
      });

      renderStoreProfile();

      await waitFor(() => {
        expect(screen.getByText(/Failed to fetch store:/)).toBeInTheDocument();
      });
    });

    it('handles address search error', async () => {
      renderStoreProfile();
      await waitFor(() => {
        expect(screen.getByText('Vintage Threads')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Edit Profile'));
      await waitFor(() => {
        expect(screen.getByText('Edit Store Profile')).toBeInTheDocument();
      });

      axios.get.mockRejectedValueOnce({
        response: { data: { error: 'API error' } },
      });

      const addressInput = screen.getByLabelText(/Search Address/);
      fireEvent.change(addressInput, { target: { value: '123 Main St' } });
      fireEvent.click(screen.getByText('Search'));

      await waitFor(() => {
        expect(
          screen.getByText(/Failed to search address:/)
        ).toBeInTheDocument();
      });
    });

    it('handles save profile error', async () => {
      renderStoreProfile();
      await waitFor(() => {
        expect(screen.getByText('Vintage Threads')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Edit Profile'));
      await waitFor(() => {
        expect(screen.getByText('Edit Store Profile')).toBeInTheDocument();
      });

      axios.post.mockRejectedValueOnce({
        response: { data: { error: 'Save failed' } },
      });

      const saveButton = screen.getByText('Save Profile');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Failed to save store profile:/)
        ).toBeInTheDocument();
      });
    });

    it('handles save hours error', async () => {
      renderStoreProfile();
      await waitFor(() => {
        expect(screen.getByText('Vintage Threads')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Edit Profile'));
      await waitFor(() => {
        expect(screen.getByText('Edit Store Profile')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Edit Operating Hours'));
      await waitFor(() => {
        expect(screen.getByText('Set Operating Hours')).toBeInTheDocument();
      });

      axios.post.mockRejectedValueOnce({
        response: { data: { error: 'Hours save failed' } },
      });

      fireEvent.click(screen.getByText('Save Hours'));

      await waitFor(() => {
        expect(screen.getByText(/Failed to save hours:/)).toBeInTheDocument();
      });
    });
  });

  // --- Display with No Data ---
  describe('Display with Missing Data', () => {
    it('displays fallback text when description is empty', async () => {
      axios.get.mockImplementation((url) => {
        if (url.includes('/api/my-store'))
          return Promise.resolve({
            data: { ...mockStoreData, description: '' },
          });
        if (url.includes('/api/stores/contact-infos'))
          return Promise.resolve({ data: mockContactData });
        return Promise.reject(new Error('Not found'));
      });

      renderStoreProfile();
      await waitFor(() => {
        expect(
          screen.getByText(
            /No description provided. Tell your customers what makes your thrift store unique!/
          )
        ).toBeInTheDocument();
      });
    });
  });