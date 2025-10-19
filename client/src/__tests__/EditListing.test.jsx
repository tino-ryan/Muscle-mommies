import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import EditListing from '../pages/store/EditListing';
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

// Mock API_URL to match the expected URL in tests
jest.mock('../api', () => ({
  API_URL: 'https://muscle-mommies-server.onrender.com',
}));

// Mock navigate and useParams
const mockNavigate = jest.fn();
const mockItemId = 'test-item-123';
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ itemId: mockItemId }),
}));

const renderEditListing = () =>
  render(
    <BrowserRouter>
      <EditListing />
    </BrowserRouter>
  );

describe('EditListing', () => {
  const mockAuth = {
    currentUser: {
      getIdToken: jest.fn().mockResolvedValue('fake-token'),
    },
  };

  const mockUser = {
    uid: 'user123',
    getIdToken: jest.fn().mockResolvedValue('fake-token'),
  };

  const mockItemData = {
    id: 'test-item-123',
    name: 'Vintage Jacket',
    description: 'A beautiful vintage leather jacket',
    category: 'tops',
    department: "women's",
    style: 'vintage',
    size: 'M',
    price: 150.0,
    quantity: 1,
    status: 'Available',
    images: [
      { imageURL: 'http://example.com/jacket1.jpg' },
      { imageURL: 'http://example.com/jacket2.jpg' },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    getAuth.mockReturnValue(mockAuth);
    signOut.mockResolvedValue();
    window.alert = jest.fn(); // Mock alert
  });

  describe('Authentication and Data Loading', () => {
    it('redirects to login when user is not authenticated', () => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null); // No user
        return jest.fn();
      });

      renderEditListing();

      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    it('loads item data successfully when authenticated', async () => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });

      axios.get.mockResolvedValue({ data: mockItemData });

      renderEditListing();

      await waitFor(() => {
        expect(screen.getByDisplayValue('Vintage Jacket')).toBeInTheDocument();
        expect(screen.getByDisplayValue('150')).toBeInTheDocument();
        expect(
          screen.getByDisplayValue('A beautiful vintage leather jacket')
        ).toBeInTheDocument();
      });

      expect(axios.get).toHaveBeenCalledWith(
        `https://muscle-mommies-server.onrender.com/api/items/${mockItemId}`,
        {
          headers: { Authorization: 'Bearer fake-token' },
        }
      );
    });

    it('handles item fetch errors and redirects on 400/404', async () => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });

      const mockError = {
        response: {
          status: 404,
          data: { error: 'Item not found' },
        },
      };

      axios.get.mockRejectedValue(mockError);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      renderEditListing();

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/store/listings');
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Fetch item error:',
        mockError.response.data
      );

      consoleSpy.mockRestore();
    });

    it('displays error message for non-404 fetch errors', async () => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });

      const mockError = {
        response: {
          status: 500,
          data: { error: 'Server error' },
        },
      };

      axios.get.mockRejectedValue(mockError);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      renderEditListing();

      await waitFor(() => {
        expect(
          screen.getByText('Failed to fetch item: Server error')
        ).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Form Interactions', () => {
    beforeEach(async () => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });

      axios.get.mockResolvedValue({ data: mockItemData });

      renderEditListing();

      await waitFor(() => {
        expect(screen.getByDisplayValue('Vintage Jacket')).toBeInTheDocument();
      });
    });

    it('updates form fields correctly', () => {
      const nameInput = screen.getByLabelText(/Item Name/);
      const priceInput = screen.getByLabelText(/Price \(R\)/);
      const descriptionInput = screen.getByLabelText(/Description/);

      fireEvent.change(nameInput, { target: { value: 'Updated Jacket' } });
      fireEvent.change(priceInput, { target: { value: '200' } });
      fireEvent.change(descriptionInput, {
        target: { value: 'Updated description' },
      });

      expect(nameInput.value).toBe('Updated Jacket');
      expect(priceInput.value).toBe('200');
      expect(descriptionInput.value).toBe('Updated description');
    });

    it('validates price to be positive', async () => {
      const priceInput = screen.getByLabelText(/Price \(R\)/);

      await act(async () => {
        fireEvent.change(priceInput, { target: { value: '-10' } });
      });

      await waitFor(() => {
        expect(
          screen.getByText('Price must be a positive number.')
        ).toBeInTheDocument();
      });
      expect(priceInput.value).toBe('150'); // Should not update to negative value
    });

    it('validates quantity to be positive integer', async () => {
      const quantityInput = screen.getByLabelText(/Quantity/);

      await act(async () => {
        fireEvent.change(quantityInput, { target: { value: '0' } });
      });

      await waitFor(() => {
        expect(
          screen.getByText('Quantity must be a positive whole number.')
        ).toBeInTheDocument();
      });
      expect(quantityInput.value).toBe('1'); // Should not update to zero
    });

    it('handles dropdown selections correctly', () => {
      const categorySelect = screen.getByLabelText(/Category/);
      const departmentSelect = screen.getByLabelText(/Department/);
      const styleSelect = screen.getByLabelText(/Style/);

      fireEvent.change(categorySelect, { target: { value: 'pants' } });
      fireEvent.change(departmentSelect, { target: { value: "men's" } });
      fireEvent.change(styleSelect, { target: { value: 'streetwear' } });

      expect(categorySelect.value).toBe('pants');
      expect(departmentSelect.value).toBe("men's");
      expect(styleSelect.value).toBe('streetwear');
    });

    it('handles image file selection', () => {
      const fileInput = screen.getByLabelText(/Replace All Images/);
      const file1 = new File(['image1'], 'image1.jpg', { type: 'image/jpeg' });
      const file2 = new File(['image2'], 'image2.jpg', { type: 'image/jpeg' });

      fireEvent.change(fileInput, { target: { files: [file1, file2] } });

      expect(
        screen.getByText(
          '2 new image(s) selected. They will replace existing images upon update.'
        )
      ).toBeInTheDocument();
    });

    it('validates maximum image upload limit', () => {
      const fileInput = screen.getByLabelText(/Replace All Images/);
      const files = Array.from(
        { length: 6 },
        (_, i) =>
          new File([`image${i}`], `image${i}.jpg`, { type: 'image/jpeg' })
      );

      fireEvent.change(fileInput, { target: { files } });

      expect(
        screen.getByText('You can upload a maximum of 5 images.')
      ).toBeInTheDocument();
    });
  });

  describe('Image Carousel', () => {
    beforeEach(async () => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });

      axios.get.mockResolvedValue({ data: mockItemData });

      renderEditListing();

      await waitFor(() => {
        expect(screen.getByDisplayValue('Vintage Jacket')).toBeInTheDocument();
      });
    });

    it('displays images and navigation controls', () => {
      expect(screen.getByAltText('Vintage Jacket 1')).toBeInTheDocument();
      expect(screen.getByText('1 / 2')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '<' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '>' })).toBeInTheDocument();
    });

    it('navigates between images', () => {
      const nextButton = screen.getByRole('button', { name: '>' });
      const prevButton = screen.getByRole('button', { name: '<' });

      // Click next
      fireEvent.click(nextButton);
      expect(screen.getByText('2 / 2')).toBeInTheDocument();
      expect(screen.getByAltText('Vintage Jacket 2')).toBeInTheDocument();

      // Click previous
      fireEvent.click(prevButton);
      expect(screen.getByText('1 / 2')).toBeInTheDocument();
      expect(screen.getByAltText('Vintage Jacket 1')).toBeInTheDocument();
    });

    it('handles carousel wraparound', () => {
      const nextButton = screen.getByRole('button', { name: '>' });

      // Go to last image
      fireEvent.click(nextButton);
      expect(screen.getByText('2 / 2')).toBeInTheDocument();

      // Click next again to wrap around
      fireEvent.click(nextButton);
      expect(screen.getByText('1 / 2')).toBeInTheDocument();
    });

    it('displays no images message when no images exist', async () => {
      // Re-render with no images
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });

      axios.get.mockResolvedValue({
        data: { ...mockItemData, images: [] },
      });

      renderEditListing();

      await waitFor(() => {
        expect(screen.getByText('No current images.')).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    beforeEach(async () => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });

      axios.get.mockResolvedValue({ data: mockItemData });

      renderEditListing();

      await waitFor(() => {
        expect(screen.getByDisplayValue('Vintage Jacket')).toBeInTheDocument();
      });
    });

    it('submits form successfully without new images', async () => {
      axios.put.mockResolvedValue({});

      const nameInput = screen.getByLabelText(/Item Name/);
      const submitButton = screen.getByRole('button', {
        name: 'Update Listing',
      });

      fireEvent.change(nameInput, { target: { value: 'Updated Jacket Name' } });

      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(axios.put).toHaveBeenCalledWith(
          `https://muscle-mommies-server.onrender.com/api/stores/items/${mockItemId}`,
          {
            name: 'Updated Jacket Name',
            description: 'A beautiful vintage leather jacket',
            category: 'tops',
            size: 'M',
            price: 150,
            quantity: 1,
            status: 'Available',
            department: "women's",
            style: 'vintage',
          },
          {
            headers: {
              Authorization: 'Bearer fake-token',
              'Content-Type': 'application/json',
            },
          }
        );
      });

      expect(window.alert).toHaveBeenCalledWith('Item updated successfully!');
      expect(mockNavigate).toHaveBeenCalledWith('/store/listings');
    });

    it('submits form successfully with new images', async () => {
      axios.put.mockResolvedValue({});

      const fileInput = screen.getByLabelText(/Replace All Images/);
      const file = new File(['image'], 'image.jpg', { type: 'image/jpeg' });
      const submitButton = screen.getByRole('button', {
        name: 'Update Listing',
      });

      fireEvent.change(fileInput, { target: { files: [file] } });

      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(axios.put).toHaveBeenCalledWith(
          `https://muscle-mommies-server.onrender.com/api/stores/items/${mockItemId}/images`,
          expect.any(FormData),
          {
            headers: {
              Authorization: 'Bearer fake-token',
              'Content-Type': 'multipart/form-data',
            },
          }
        );
      });

      expect(window.alert).toHaveBeenCalledWith('Item updated successfully!');
      expect(mockNavigate).toHaveBeenCalledWith('/store/listings');
    });

    it('handles submission errors', async () => {
      const mockError = {
        response: {
          data: { error: 'Update failed' },
        },
      };

      axios.put.mockRejectedValue(mockError);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const submitButton = screen.getByRole('button', {
        name: 'Update Listing',
      });

      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(
          screen.getByText('Failed to update item: Update failed')
        ).toBeInTheDocument();
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Update error:',
        mockError.response.data
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Navigation and Actions', () => {
    beforeEach(async () => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });

      axios.get.mockResolvedValue({ data: mockItemData });

      renderEditListing();

      await waitFor(() => {
        expect(screen.getByDisplayValue('Vintage Jacket')).toBeInTheDocument();
      });
    });

    it('handles cancel button correctly', () => {
      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      fireEvent.click(cancelButton);

      expect(mockNavigate).toHaveBeenCalledWith('/store/listings');
    });

    it('handles logout correctly', async () => {
      const logoutButton = screen.getByText('Logout');

      await act(async () => {
        fireEvent.click(logoutButton);
      });

      await waitFor(() => {
        expect(signOut).toHaveBeenCalledWith(mockAuth);
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });

    it('handles logout error', async () => {
      signOut.mockRejectedValue(new Error('Logout failed'));

      const logoutButton = screen.getByText('Logout');

      await act(async () => {
        fireEvent.click(logoutButton);
      });

      await waitFor(() => {
        expect(
          screen.getByText('Failed to log out: Logout failed')
        ).toBeInTheDocument();
      });
    });
  });

  describe('UI Elements', () => {
    beforeEach(async () => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });

      axios.get.mockResolvedValue({ data: mockItemData });

      renderEditListing();

      await waitFor(() => {
        expect(screen.getByDisplayValue('Vintage Jacket')).toBeInTheDocument();
      });
    });

    it('renders sidebar with correct props', () => {
      expect(screen.getByTestId('store-sidebar')).toBeInTheDocument();
      expect(screen.getByText('Current Page: Listings')).toBeInTheDocument();
    });

    it('displays page title with item name', () => {
      expect(
        screen.getByText('Edit Listing: Vintage Jacket')
      ).toBeInTheDocument();
    });

    it('renders all form sections and fields', () => {
      // Item Details section
      expect(screen.getByText('Item Details')).toBeInTheDocument();
      expect(screen.getByLabelText(/Item Name/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Price \(R\)/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Description/)).toBeInTheDocument();

      // Categorization section
      expect(screen.getByText('Categorization')).toBeInTheDocument();
      expect(screen.getByLabelText(/Category/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Department/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Style/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Size/)).toBeInTheDocument();

      // Inventory section
      expect(screen.getByText('Inventory & Status')).toBeInTheDocument();
      expect(screen.getByLabelText(/Quantity/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Status/)).toBeInTheDocument();

      // Images section
      expect(screen.getByText('Product Images')).toBeInTheDocument();
      expect(screen.getByLabelText(/Replace All Images/)).toBeInTheDocument();
    });

    it('displays currency label for price input', () => {
      expect(screen.getByText('R')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles missing item data gracefully', async () => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });

      axios.get.mockResolvedValue({
        data: {
          name: 'Test Item',
          // Missing most fields
        },
      });

      renderEditListing();

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Item')).toBeInTheDocument();
      });

      // Check default values are applied
      const quantityInput = screen.getByLabelText(/Quantity/);
      const statusSelect = screen.getByLabelText(/Status/);

      expect(quantityInput.value).toBe('1');
      expect(statusSelect.value).toBe('Available');
    });

    it('clears errors when form is modified', async () => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });

      axios.get.mockResolvedValue({ data: mockItemData });

      renderEditListing();

      await waitFor(() => {
        expect(screen.getByDisplayValue('Vintage Jacket')).toBeInTheDocument();
      });

      // Trigger an error
      const priceInput = screen.getByLabelText(/Price \(R\)/);

      await act(async () => {
        fireEvent.change(priceInput, { target: { value: '-10' } });
      });

      await waitFor(() => {
        expect(
          screen.getByText('Price must be a positive number.')
        ).toBeInTheDocument();
      });

      // Make a valid change
      await act(async () => {
        fireEvent.change(priceInput, { target: { value: '200' } });
      });

      // Error should be cleared
      await waitFor(() => {
        expect(
          screen.queryByText('Price must be a positive number.')
        ).not.toBeInTheDocument();
      });
    });
  });
});
