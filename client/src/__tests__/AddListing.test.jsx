// __tests__/AddListing.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AddListing from '../pages/store/AddListing';
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

// Mock navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const renderAddListing = () =>
  render(
    <BrowserRouter>
      <AddListing />
    </BrowserRouter>
  );

describe('AddListing', () => {
  const mockAuth = {
    currentUser: {
      getIdToken: jest.fn().mockResolvedValue('fake-token'),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    getAuth.mockReturnValue(mockAuth);
    onAuthStateChanged.mockImplementation((auth, callback) => {
      // Simulate authenticated user
      callback(mockAuth.currentUser);
      return jest.fn(); // Return unsubscribe function
    });
  });

  describe('Authentication', () => {
    it('redirects to login if user is not authenticated', () => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null); // No user
        return jest.fn();
      });

      renderAddListing();

      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    it('handles logout correctly', async () => {
      signOut.mockResolvedValueOnce();

      renderAddListing();

      fireEvent.click(screen.getByText('Logout'));

      await waitFor(() => {
        expect(signOut).toHaveBeenCalledWith(mockAuth);
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });

    it('shows error on logout failure', async () => {
      const errorMessage = 'Logout failed';
      signOut.mockRejectedValueOnce(new Error(errorMessage));

      renderAddListing();

      fireEvent.click(screen.getByText('Logout'));

      await waitFor(() => {
        expect(
          screen.getByText(`Failed to log out: ${errorMessage}`)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Form Rendering', () => {
    it('renders all form fields', () => {
      renderAddListing();

      expect(screen.getByLabelText(/Item Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Price \(R\)/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Category/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Department/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Size/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Style Tags/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Quantity/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Status/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Upload Images/i)).toBeInTheDocument();
    });

    it('renders sidebar with correct props', () => {
      renderAddListing();

      expect(screen.getByTestId('store-sidebar')).toBeInTheDocument();
      expect(screen.getByText('Current Page: Listings')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('prevents form submission when no images are uploaded due to HTML5 validation', () => {
      renderAddListing();

      // Fill required fields but don't upload images
      fireEvent.change(screen.getByLabelText(/Item Name/i), {
        target: { value: 'Test Item' },
      });
      fireEvent.change(screen.getByLabelText(/Price \(R\)/i), {
        target: { value: '100' },
      });
      fireEvent.change(screen.getByLabelText(/Quantity/i), {
        target: { value: '1' },
      });
      fireEvent.change(screen.getByLabelText(/Category/i), {
        target: { value: 'tops' },
      });
      fireEvent.change(screen.getByLabelText(/Department/i), {
        target: { value: "women's" },
      });

      // Try to submit - HTML5 validation should prevent submission
      fireEvent.click(screen.getByText('Add Item'));

      // Form should still be present (not submitted)
      expect(screen.getByText('Add Item')).toBeInTheDocument();
      expect(
        screen.queryByText('Please upload at least one image.')
      ).not.toBeInTheDocument();
    });

    it('shows JavaScript validation errors when form is programmatically submitted', async () => {
      renderAddListing();

      // Programmatically trigger form submission to bypass HTML5 validation
      const form = document.querySelector('form');

      // Create a custom event that bypasses HTML5 validation
      const submitEvent = new Event('submit', {
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(submitEvent, 'target', { value: form });

      // Directly dispatch the event
      form.dispatchEvent(submitEvent);

      await waitFor(() => {
        expect(
          screen.getByText('Please upload at least one image.')
        ).toBeInTheDocument();
      });
    });

    it('shows JavaScript validation for missing required fields when HTML5 is bypassed', async () => {
      renderAddListing();

      // Upload an image first
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText(/Upload Images/i);
      fireEvent.change(fileInput, {
        target: { files: [file] },
      });

      // Programmatically trigger form submission
      const form = document.querySelector('form');
      const submitEvent = new Event('submit', {
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(submitEvent, 'target', { value: form });
      form.dispatchEvent(submitEvent);

      await waitFor(() => {
        expect(
          screen.getByText(
            'Name, price, quantity, category, and department are required.'
          )
        ).toBeInTheDocument();
      });
    });

    it('validates price is positive', () => {
      renderAddListing();

      fireEvent.change(screen.getByLabelText(/Price \(R\)/i), {
        target: { value: '-10' },
      });

      expect(
        screen.getByText('Price must be a positive number.')
      ).toBeInTheDocument();
    });

    it('validates quantity is positive', () => {
      renderAddListing();

      fireEvent.change(screen.getByLabelText(/Quantity/i), {
        target: { value: '-1' },
      });

      expect(
        screen.getByText('Quantity must be a positive whole number.')
      ).toBeInTheDocument();
    });

    it('clears errors when valid input is provided', () => {
      renderAddListing();

      // First, trigger an error
      fireEvent.change(screen.getByLabelText(/Price \(R\)/i), {
        target: { value: '-10' },
      });
      expect(
        screen.getByText('Price must be a positive number.')
      ).toBeInTheDocument();

      // Then provide valid input
      fireEvent.change(screen.getByLabelText(/Price \(R\)/i), {
        target: { value: '100' },
      });

      expect(
        screen.queryByText('Price must be a positive number.')
      ).not.toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    const fillValidForm = () => {
      fireEvent.change(screen.getByLabelText(/Item Name/i), {
        target: { value: 'Test Item' },
      });
      fireEvent.change(screen.getByLabelText(/Description/i), {
        target: { value: 'Test description' },
      });
      fireEvent.change(screen.getByLabelText(/Price \(R\)/i), {
        target: { value: '100' },
      });
      fireEvent.change(screen.getByLabelText(/Quantity/i), {
        target: { value: '1' },
      });
      fireEvent.change(screen.getByLabelText(/Category/i), {
        target: { value: 'tops' },
      });
      fireEvent.change(screen.getByLabelText(/Department/i), {
        target: { value: "women's" },
      });
      fireEvent.change(screen.getByLabelText(/Size/i), {
        target: { value: 'M' },
      });
      fireEvent.change(screen.getByLabelText(/Style Tags/i), {
        target: { value: 'vintage' },
      });

      // Mock file upload
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText(/Upload Images/i);
      fireEvent.change(fileInput, {
        target: { files: [file] },
      });
    };

    it('shows error when no images are uploaded', async () => {
      renderAddListing();

      // Fill form without images
      fireEvent.change(screen.getByLabelText(/Item Name/i), {
        target: { value: 'Test Item' },
      });
      fireEvent.change(screen.getByLabelText(/Price \(R\)/i), {
        target: { value: '100' },
      });
      fireEvent.change(screen.getByLabelText(/Quantity/i), {
        target: { value: '1' },
      });
      fireEvent.change(screen.getByLabelText(/Category/i), {
        target: { value: 'tops' },
      });
      fireEvent.change(screen.getByLabelText(/Department/i), {
        target: { value: "women's" },
      });

      const form = document.querySelector('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(
          screen.getByText('Please upload at least one image.')
        ).toBeInTheDocument();
      });
    });

    it('shows error when required fields are missing', async () => {
      renderAddListing();

      // Only upload image, leave required fields empty
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      fireEvent.change(screen.getByLabelText(/Upload Images/i), {
        target: { files: [file] },
      });

      const form = document.querySelector('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(
          screen.getByText(
            'Name, price, quantity, category, and department are required.'
          )
        ).toBeInTheDocument();
      });
    });

    it('submits form successfully', async () => {
      axios.post.mockResolvedValueOnce({ data: { id: 'item-123' } });
      window.alert = jest.fn();

      renderAddListing();
      fillValidForm();

      const form = document.querySelector('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          expect.stringContaining('/api/stores/items'),
          expect.any(FormData),
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: 'Bearer fake-token',
              'Content-Type': 'multipart/form-data',
            }),
          })
        );
      });

      expect(window.alert).toHaveBeenCalledWith('Item added successfully!');
      expect(mockNavigate).toHaveBeenCalledWith('/store/listings');
    });

    it('handles API error with response data', async () => {
      const errorMessage = 'Item name already exists';
      axios.post.mockRejectedValueOnce({
        response: { data: { error: errorMessage } },
      });

      renderAddListing();
      fillValidForm();

      const form = document.querySelector('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(
          screen.getByText(`Failed to add item: ${errorMessage}`)
        ).toBeInTheDocument();
      });
    });

    it('handles API error without response data', async () => {
      const errorMessage = 'Network Error';
      axios.post.mockRejectedValueOnce(new Error(errorMessage));

      renderAddListing();
      fillValidForm();

      const form = document.querySelector('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(
          screen.getByText(`Failed to add item: ${errorMessage}`)
        ).toBeInTheDocument();
      });
    });

    it('logs error to console on API failure', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const errorResponse = { response: { data: { error: 'Server error' } } };
      axios.post.mockRejectedValueOnce(errorResponse);

      renderAddListing();
      fillValidForm();

      const form = document.querySelector('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Add item error:',
          errorResponse.response.data
        );
      });

      consoleSpy.mockRestore();
    });

    it('clears error state at start of submission', async () => {
      renderAddListing();

      // First create an error
      fireEvent.change(screen.getByLabelText(/Price \(R\)/i), {
        target: { value: '-1' },
      });
      expect(
        screen.getByText('Price must be a positive number.')
      ).toBeInTheDocument();

      // Then fill valid form and submit
      fillValidForm();

      const form = document.querySelector('form');
      fireEvent.submit(form);

      // Error should be cleared initially
      await waitFor(() => {
        expect(
          screen.queryByText('Price must be a positive number.')
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Image Upload', () => {
    it('shows selected image count', () => {
      renderAddListing();

      const file1 = new File(['test1'], 'test1.jpg', { type: 'image/jpeg' });
      const file2 = new File(['test2'], 'test2.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText(/Upload Images/i);

      fireEvent.change(fileInput, {
        target: { files: [file1, file2] },
      });

      expect(screen.getByText('2 image(s) selected.')).toBeInTheDocument();
    });

    it('handles single image upload', () => {
      renderAddListing();

      const file = new File(['single'], 'single.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText(/Upload Images/i);

      fireEvent.change(fileInput, {
        target: { files: [file] },
      });

      expect(screen.getByText('1 image(s) selected.')).toBeInTheDocument();
    });

    it('does not show image count when no images selected', () => {
      renderAddListing();

      const fileInput = screen.getByLabelText(/Upload Images/i);

      fireEvent.change(fileInput, {
        target: { files: [] },
      });

      expect(screen.queryByText(/image\(s\) selected/)).not.toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('navigates to listings on cancel', () => {
      renderAddListing();

      fireEvent.click(screen.getByText('Cancel'));

      expect(mockNavigate).toHaveBeenCalledWith('/store/listings');
    });
  });

  describe('Form Input Updates', () => {
    it('updates item state when inputs change', () => {
      renderAddListing();

      const nameInput = screen.getByLabelText(/Item Name/i);
      fireEvent.change(nameInput, { target: { value: 'New Item Name' } });

      expect(nameInput.value).toBe('New Item Name');
    });

    it('updates select fields correctly', () => {
      renderAddListing();

      const categorySelect = screen.getByLabelText(/Category/i);
      fireEvent.change(categorySelect, { target: { value: 'dresses' } });

      expect(categorySelect.value).toBe('dresses');
    });

    it('validates zero price as invalid', () => {
      renderAddListing();

      fireEvent.change(screen.getByLabelText(/Price \(R\)/i), {
        target: { value: '0' },
      });

      expect(
        screen.getByText('Price must be a positive number.')
      ).toBeInTheDocument();
    });

    it('validates zero quantity as invalid', () => {
      renderAddListing();

      fireEvent.change(screen.getByLabelText(/Quantity/i), {
        target: { value: '0' },
      });

      expect(
        screen.getByText('Quantity must be a positive whole number.')
      ).toBeInTheDocument();
    });

    it('shows error message in error box when validation fails', () => {
      renderAddListing();

      fireEvent.change(screen.getByLabelText(/Price \(R\)/i), {
        target: { value: '-5' },
      });

      const errorBox = document.querySelector('.error-box');
      expect(errorBox).toBeInTheDocument();
      expect(errorBox.querySelector('svg')).toBeInTheDocument();
      expect(errorBox.querySelector('p')).toHaveTextContent(
        'Price must be a positive number.'
      );
    });
  });

  describe('Authentication State Management', () => {
    it('sets login error when user is not authenticated', () => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null);
        return jest.fn();
      });

      renderAddListing();

      expect(screen.getByText('Please log in.')).toBeInTheDocument();
    });

    it('handles auth unsubscribe on component unmount', () => {
      const unsubscribeMock = jest.fn();
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockAuth.currentUser);
        return unsubscribeMock;
      });

      const { unmount } = renderAddListing();
      unmount();

      expect(unsubscribeMock).toHaveBeenCalled();
    });
  });
});
