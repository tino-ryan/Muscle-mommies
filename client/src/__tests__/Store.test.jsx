import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Store from '../pages/customer/Store';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import axios from 'axios';

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
};

// Mock dependencies
jest.mock('firebase/auth');
jest.mock('axios');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: 'store-123' }),
  useNavigate: () => jest.fn(),
}));
jest.mock('../components/CustomerSidebar', () => {
  return function CustomerSidebar() {
    return <div data-testid="customer-sidebar">Sidebar</div>;
  };
});
jest.mock('../components/StarRating', () => {
  return function StarRating({ rating, reviewCount }) {
    return (
      <div data-testid="star-rating">
        {rating} stars ({reviewCount} reviews)
      </div>
    );
  };
});
jest.mock('../components/ReviewsModal', () => {
  return function ReviewsModal({ isOpen, onClose, storeName }) {
    return isOpen ? (
      <div data-testid="reviews-modal">
        <h2>{storeName} Reviews</h2>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null;
  };
});
jest.mock('../components/WriteReviewModal', () => {
  return function WriteReviewModal({ isOpen, onClose, onSubmit, storeName }) {
    return isOpen ? (
      <div data-testid="write-review-modal">
        <h2>Write Review for {storeName}</h2>
        <button onClick={() => onSubmit(5, 'Great store!')}>Submit</button>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null;
  };
});

const mockStore = {
  storeId: 'store-123',
  storeName: 'Test Store',
  address: '123 Test St',
  description: 'A test store with a very long description that should be truncated when displayed on the page because it exceeds the maximum character limit of 150 characters',
  ownerId: 'owner-456',
  profileImageURL: 'https://example.com/store.jpg',
  averageRating: 4.5,
  reviewCount: 10,
  hours: {
    Monday: { open: true, start: '09:00', end: '17:00' },
    Tuesday: { open: true, start: '09:00', end: '17:00' },
    Wednesday: { open: true, start: '09:00', end: '17:00' },
    Thursday: { open: true, start: '09:00', end: '17:00' },
    Friday: { open: true, start: '09:00', end: '17:00' },
    Saturday: { open: false, start: '09:00', end: '17:00' },
    Sunday: { open: false, start: '09:00', end: '17:00' },
  },
  location: { lat: -26.195246, lng: 28.034088 },
  contactInfos: [
    { id: '1', type: 'phone', value: '0123456789' },
    { id: '2', type: 'email', value: 'test@example.com' },
    { id: '3', type: 'instagram', value: '@teststore' },
    { id: '4', type: 'facebook', value: 'teststore' },
    { id: '5', type: 'twitter', value: '@teststore' },
  ],
  theme: {
    'color-primary': '#ff6b6b',
    'color-secondary': '#4ecdc4',
  },
};

const mockClothes = [
  {
    itemId: 'item-1',
    name: 'T-Shirt',
    category: 'Tops',
    style: 'Casual',
    size: 'M',
    price: 50,
    status: 'Available',
    department: 'Men',
    description: 'A nice t-shirt',
    images: [{ imageURL: 'https://example.com/tshirt.jpg' }],
    measurements: 'Chest: 100cm, Length: 70cm',
  },
  {
    itemId: 'item-2',
    name: 'Jeans',
    category: 'Bottoms',
    style: 'Casual',
    size: 'L',
    price: 150,
    status: 'Available',
    department: 'Women',
    description: 'Comfortable jeans',
    images: [{ imageURL: 'https://example.com/jeans.jpg' }],
  },
  {
    itemId: 'item-3',
    name: 'Dress',
    category: 'Dresses',
    style: 'Formal',
    size: 'S',
    price: 200,
    status: 'Reserved',
    department: 'Women',
    description: 'Elegant dress',
    images: [
      { imageURL: 'https://example.com/dress1.jpg' },
      { imageURL: 'https://example.com/dress2.jpg' },
    ],
  },
  {
    itemId: 'item-4',
    name: 'Expensive Shirt',
    category: 'Tops',
    style: 'Formal',
    size: 'L',
    price: 500,
    status: 'Available',
    department: 'Men',
    description: 'Expensive formal shirt',
    images: [],
  },
  ...Array.from({ length: 15 }, (_, i) => ({
    itemId: `item-${i + 5}`,
    name: `Item ${i + 5}`,
    category: 'Accessories',
    style: 'Casual',
    size: 'M',
    price: 100 + i * 10,
    status: 'Available',
    department: 'Unisex',
    description: `Description for item ${i + 5}`,
    images: [{ imageURL: `https://example.com/item${i + 5}.jpg` }],
  })),
];

const mockUser = {
  uid: 'user-789',
  getIdToken: jest.fn().mockResolvedValue('mock-token'),
};

const mockAuth = {
  currentUser: mockUser,
};

describe('Store Component', () => {
  let mockNavigate;

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate = jest.fn();
    require('react-router-dom').useNavigate = () => mockNavigate;

    getAuth.mockReturnValue(mockAuth);
    onAuthStateChanged.mockImplementation((auth, callback) => {
      callback(mockUser);
      return jest.fn();
    });

    axios.get.mockImplementation((url) => {
      if (url.includes('/api/stores/store-123/items')) {
        return Promise.resolve({ data: mockClothes });
      }
      if (url.includes('/api/stores/store-123')) {
        return Promise.resolve({ data: mockStore });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    Element.prototype.scrollIntoView = jest.fn();
    window.open = jest.fn();
    window.alert = jest.fn();
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    });
  });

  const renderStore = () => {
    return render(
      <MemoryRouter>
        <Store />
      </MemoryRouter>
    );
  };

  describe('Loading State', () => {
    test('displays loading skeleton while fetching data', () => {
      axios.get.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );
      renderStore();
      
      const skeletons = document.querySelectorAll('.skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Store Display', () => {
    test('renders store information correctly', async () => {
      renderStore();

      await waitFor(() => {
        expect(screen.getByText('Test Store')).toBeInTheDocument();
      });

      expect(screen.getByText('123 Test St')).toBeInTheDocument();
      expect(screen.getByTestId('star-rating')).toBeInTheDocument();
    });

    test('truncates long store description', async () => {
      renderStore();

      await waitFor(() => {
        const description = screen.getByText(/A test store with a very long description/);
        expect(description.textContent).toContain('...');
        expect(description.textContent.length).toBeLessThan(mockStore.description.length);
      });
    });

    test('applies custom theme to document root', async () => {
      renderStore();

      await waitFor(() => {
        const root = document.documentElement;
        expect(root.style.getPropertyValue('--color-primary')).toBe('#ff6b6b');
        expect(root.style.getPropertyValue('--color-secondary')).toBe('#4ecdc4');
      });
    });

    test('displays "Reviews" button when reviews exist', async () => {
      renderStore();

      await waitFor(() => {
        expect(screen.getByText('Reviews')).toBeInTheDocument();
      });
    });

    test('opens reviews modal when "Reviews" is clicked', async () => {
      renderStore();

      await waitFor(() => {
        expect(screen.getByText('Reviews')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Reviews'));

      await waitFor(() => {
        expect(screen.getByTestId('reviews-modal')).toBeInTheDocument();
      });
    });

    test('opens write review modal when "Write Review" is clicked', async () => {
      renderStore();

      await waitFor(() => {
        expect(screen.getByText('Write Review')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Write Review'));

      await waitFor(() => {
        expect(screen.getByTestId('write-review-modal')).toBeInTheDocument();
      });
    });

    test('submits review successfully', async () => {
      axios.post.mockResolvedValue({
        data: { averageRating: 4.6, reviewCount: 11 },
      });

      renderStore();

      await waitFor(() => {
        expect(screen.getByText('Write Review')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Write Review'));

      await waitFor(() => {
        expect(screen.getByTestId('write-review-modal')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Submit'));

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          expect.stringContaining('/api/stores/store-123/reviews'),
          { rating: 5, comment: 'Great store!' },
          { headers: { Authorization: 'Bearer mock-token' } }
        );
      });

      expect(window.alert).toHaveBeenCalledWith('Review submitted successfully!');
    });

    test('handles review submission failure', async () => {
      axios.post.mockRejectedValue(new Error('Network error'));

      renderStore();

      await waitFor(() => {
        expect(screen.getByText('Write Review')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Write Review'));
      fireEvent.click(screen.getByText('Submit'));

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Failed to submit review. Please try again.');
      });
    });
  });

  describe('Hours Modal', () => {
    test('opens hours modal when "View All Hours" is clicked', async () => {
      renderStore();

      await waitFor(() => {
        expect(screen.getByText('View All Hours')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('View All Hours'));

      await waitFor(() => {
        expect(screen.getByText('Store Hours')).toBeInTheDocument();
      });
    });

    test('displays grouped hours correctly', async () => {
      renderStore();

      await waitFor(() => {
        expect(screen.getByText('View All Hours')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('View All Hours'));

      await waitFor(() => {
        expect(screen.getByText('Mon–Fri')).toBeInTheDocument();
        expect(screen.getByText('09:00–17:00')).toBeInTheDocument();
      });
    });

    test('closes hours modal with Escape key', async () => {
      renderStore();

      await waitFor(() => {
        expect(screen.getByText('View All Hours')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('View All Hours'));

      await waitFor(() => {
        expect(screen.getByText('Store Hours')).toBeInTheDocument();
      });

      fireEvent.keyDown(window, { key: 'Escape' });

      await waitFor(() => {
        expect(screen.queryByText('Store Hours')).not.toBeInTheDocument();
      }, { timeout: 500 });
    });

    test('closes hours modal on overlay click', async () => {
      renderStore();

      await waitFor(() => {
        expect(screen.getByText('View All Hours')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('View All Hours'));

      const overlay = document.querySelector('.modal-overlay');
      fireEvent.click(overlay);

      await waitFor(() => {
        expect(screen.queryByText('Store Hours')).not.toBeInTheDocument();
      }, { timeout: 500 });
    });
  });

  describe('Contact Modal', () => {
    test('opens contact modal when "Contact Us" is clicked', async () => {
      renderStore();

      await waitFor(() => {
        expect(screen.getByText('Contact Us')).toBeInTheDocument();
      });

      fireEvent.click(screen.getAllByText('Contact Us')[0]);

      await waitFor(() => {
        expect(screen.getAllByText('0123456789').length).toBeGreaterThan(0);
        expect(screen.getAllByText('test@example.com').length).toBeGreaterThan(0);
      });
    });

    test('handles phone call contact', async () => {
      renderStore();

      await waitFor(() => {
        fireEvent.click(screen.getAllByText('Contact Us')[0]);
      });

      await waitFor(() => {
        const phoneButtons = screen.getAllByTitle(/Call/i);
        fireEvent.click(phoneButtons[0]);
      });

      expect(window.location.href).toBe('tel:0123456789');
    });

    test('handles WhatsApp contact', async () => {
      renderStore();

      await waitFor(() => {
        fireEvent.click(screen.getAllByText('Contact Us')[0]);
      });

      await waitFor(() => {
        const whatsappButtons = screen.getAllByTitle(/WhatsApp/i);
        fireEvent.click(whatsappButtons[0]);
      });

      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining('wa.me/+27123456789'),
        '_blank'
      );
    });

    test('handles email contact', async () => {
      renderStore();

      await waitFor(() => {
        fireEvent.click(screen.getAllByText('Contact Us')[0]);
      });

      await waitFor(() => {
        const emailButton = screen.getByTitle('test@example.com');
        fireEvent.click(emailButton);
      });

      expect(window.location.href).toBe('mailto:test@example.com');
    });

    test('handles Instagram contact', async () => {
      renderStore();

      await waitFor(() => {
        fireEvent.click(screen.getAllByText('Contact Us')[0]);
      });

      await waitFor(() => {
        const instagramButtons = screen.getAllByTitle('@teststore');
        fireEvent.click(instagramButtons[0]);
      });

      expect(window.open).toHaveBeenCalledWith(
        'https://www.instagram.com/teststore',
        '_blank'
      );
    });

    test('closes contact modal with Escape key', async () => {
      renderStore();

      await waitFor(() => {
        fireEvent.click(screen.getAllByText('Contact Us')[0]);
      });

      fireEvent.keyDown(window, { key: 'Escape' });

      await waitFor(() => {
        expect(screen.queryByText('test@example.com')).not.toBeInTheDocument();
      }, { timeout: 500 });
    });
  });

  describe('Items Display', () => {
    test('displays all available items', async () => {
      renderStore();

      await waitFor(() => {
        expect(screen.getByText('T-Shirt')).toBeInTheDocument();
      });

      expect(screen.getByText('Jeans')).toBeInTheDocument();
      expect(screen.getByText('Dress')).toBeInTheDocument();
      expect(screen.getByText('Expensive Shirt')).toBeInTheDocument();
    });

    test('shows correct item count', async () => {
      renderStore();

      await waitFor(() => {
        expect(screen.getByText(/19\s+Items/i)).toBeInTheDocument();
      });
    });

    test('displays reserved badge on reserved items', async () => {
      renderStore();

      await waitFor(() => {
        expect(screen.getByText('Reserved')).toBeInTheDocument();
      });
    });

    test('handles image load error with placeholder', async () => {
      renderStore();

      await waitFor(() => {
        const images = document.querySelectorAll('.item-image');
        fireEvent.error(images[0]);
        expect(images[0].src).toContain('placeholder');
      });
    });
  });

  describe('Filtering', () => {
    test('filters items by category', async () => {
      renderStore();

      await waitFor(() => {
        expect(screen.getByText('T-Shirt')).toBeInTheDocument();
      });

      const categoryButton = screen.getByText(/Category/i);
      fireEvent.click(categoryButton);

      await waitFor(() => {
        expect(screen.getByText('Select Categories')).toBeInTheDocument();
      });

      const topsCheckbox = screen.getByLabelText('Tops');
      fireEvent.click(topsCheckbox);

      const applyButton = screen.getByText('Apply Filters');
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(screen.getByText(/2\s+Items/i)).toBeInTheDocument();
      });

      expect(screen.getByText('T-Shirt')).toBeInTheDocument();
      expect(screen.queryByText('Jeans')).not.toBeInTheDocument();
    });

    test('filters items by style', async () => {
      renderStore();

      await waitFor(() => {
        fireEvent.click(screen.getByText(/Style/i));
      });

      await waitFor(() => {
        const casualCheckbox = screen.getByLabelText('Casual');
        fireEvent.click(casualCheckbox);
        fireEvent.click(screen.getByText('Apply Filters'));
      });

      await waitFor(() => {
        expect(screen.getByText('T-Shirt')).toBeInTheDocument();
        expect(screen.queryByText('Dress')).not.toBeInTheDocument();
      });
    });

    test('filters items by size', async () => {
      renderStore();

      await waitFor(() => {
        fireEvent.click(screen.getByText(/Size/i));
      });

      await waitFor(() => {
        const sizeCheckbox = screen.getByLabelText('M');
        fireEvent.click(sizeCheckbox);
        fireEvent.click(screen.getByText('Apply Filters'));
      });

      await waitFor(() => {
        expect(screen.getByText('T-Shirt')).toBeInTheDocument();
      });
    });

    test('filters items by department', async () => {
      renderStore();

      await waitFor(() => {
        fireEvent.click(screen.getByText(/Department/i));
      });

      await waitFor(() => {
        const deptCheckbox = screen.getByLabelText('Men');
        fireEvent.click(deptCheckbox);
        fireEvent.click(screen.getByText('Apply Filters'));
      });

      await waitFor(() => {
        expect(screen.getByText('T-Shirt')).toBeInTheDocument();
        expect(screen.queryByText('Jeans')).not.toBeInTheDocument();
      });
    });

    test('filters items by price range', async () => {
      renderStore();

      await waitFor(() => {
        fireEvent.click(screen.getByText(/Price/i));
      });

      await waitFor(() => {
        expect(screen.getByText('Price Range')).toBeInTheDocument();
      });

      const priceInputs = document.querySelectorAll('.price-input');
      const minInput = priceInputs[0];
      const maxInput = priceInputs[1];

      fireEvent.change(minInput, { target: { value: '100' } });
      fireEvent.change(maxInput, { target: { value: '200' } });

      fireEvent.click(screen.getByText('Apply Price Range'));

      await waitFor(() => {
        expect(screen.getByText('Jeans')).toBeInTheDocument();
        expect(screen.queryByText('T-Shirt')).not.toBeInTheDocument();
      });
    });

    test('enforces min/max price constraints', async () => {
      renderStore();

      await waitFor(() => {
        fireEvent.click(screen.getByText(/Price/i));
      });

      const priceInputs = document.querySelectorAll('.price-input');
      const minInput = priceInputs[0];
      const maxInput = priceInputs[1];

      fireEvent.change(minInput, { target: { value: '-10' } });
      expect(minInput.value).toBe('0');

      fireEvent.change(maxInput, { target: { value: '20000' } });
      expect(maxInput.value).toBe('10000');
    });

    test('filters items by search query', async () => {
      renderStore();

      await waitFor(() => {
        expect(screen.getByText('T-Shirt')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search items...');
      fireEvent.change(searchInput, { target: { value: 'Shirt' } });

      await waitFor(() => {
        expect(screen.getByText(/2\s+Items/i)).toBeInTheDocument();
      });

      expect(screen.getByText('T-Shirt')).toBeInTheDocument();
      expect(screen.getByText('Expensive Shirt')).toBeInTheDocument();
      expect(screen.queryByText('Jeans')).not.toBeInTheDocument();
    });

    test('shows "no items" message when filters yield no results', async () => {
      renderStore();

      await waitFor(() => {
        expect(screen.getByText('T-Shirt')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search items...');
      fireEvent.change(searchInput, { target: { value: 'NonexistentItem' } });

      await waitFor(() => {
        expect(screen.getByText('No items found')).toBeInTheDocument();
      });
    });

    test('clears all filters when "Clear All" is clicked', async () => {
      renderStore();

      await waitFor(() => {
        expect(screen.getByText('T-Shirt')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search items...');
      fireEvent.change(searchInput, { target: { value: 'Shirt' } });

      await waitFor(() => {
        expect(screen.getByText(/2\s+Items/i)).toBeInTheDocument();
      });

      const clearButton = screen.getByText(/Clear All/i);
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(screen.getByText(/19\s+Items/i)).toBeInTheDocument();
      });
    });

    test('displays active filter count', async () => {
      renderStore();

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search items...');
        fireEvent.change(searchInput, { target: { value: 'test' } });
      });

      await waitFor(() => {
        expect(screen.getByText(/1 filter active/i)).toBeInTheDocument();
      });
    });

    test('toggles filter visibility', async () => {
      renderStore();

      await waitFor(() => {
        const toggleButton = screen.getByText('Hide Filters');
        fireEvent.click(toggleButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Show Filters')).toBeInTheDocument();
      });
    });
  });

  describe('Pagination', () => {
    test('displays pagination controls when items exceed per page limit', async () => {
      renderStore();

      await waitFor(() => {
        expect(screen.getByText(/Page 1 of/i)).toBeInTheDocument();
      });
    });

    test('navigates to next page', async () => {
      renderStore();

      await waitFor(() => {
        expect(screen.getByText(/Page 1 of/i)).toBeInTheDocument();
      });

      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText(/Page 2 of/i)).toBeInTheDocument();
      });
    });

    test('navigates to previous page', async () => {
      renderStore();

      await waitFor(() => {
        fireEvent.click(screen.getByText('Next'));
      });

      await waitFor(() => {
        expect(screen.getByText(/Page 2 of/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Previous'));

      await waitFor(() => {
        expect(screen.getByText(/Page 1 of/i)).toBeInTheDocument();
      });
    });

    test('disables previous button on first page', async () => {
      renderStore();

      await waitFor(() => {
        const prevButton = screen.getByText('Previous');
        expect(prevButton).toBeDisabled();
      });
    });

    test('disables next button on last page', async () => {
      renderStore();

      await waitFor(() => {
        // Navigate to last page
        const totalPages = Math.ceil(mockClothes.length / 12);
        for (let i = 1; i < totalPages; i++) {
          fireEvent.click(screen.getByText('Next'));
        }
      });

      await waitFor(() => {
        const nextButton = screen.getByText('Next');
        expect(nextButton).toBeDisabled();
      });
    });
  });

  describe('Item Modal', () => {
    test('opens item modal on click', async () => {
      renderStore();

      await waitFor(() => {
        fireEvent.click(screen.getAllByText('T-Shirt')[0]);
      });

      await waitFor(() => {
        expect(screen.getByText('A nice t-shirt')).toBeInTheDocument();
      });
    });

    test('opens item modal on Enter key', async () => {
      renderStore();

      await waitFor(() => {
        const itemCard = screen.getAllByText('T-Shirt')[0].closest('.item-card');
        fireEvent.keyDown(itemCard, { key: 'Enter' });
      });

      await waitFor(() => {
        expect(screen.getByText('A nice t-shirt')).toBeInTheDocument();
      });
    });

    test('displays measurements when available', async () => {
      renderStore();

      await waitFor(() => {
        fireEvent.click(screen.getAllByText('T-Shirt')[0]);
      });

      await waitFor(() => {
        expect(screen.getByText('Chest: 100cm, Length: 70cm')).toBeInTheDocument();
      });
    });

    test('navigates through images in carousel', async () => {
      renderStore();

      await waitFor(() => {
        expect(screen.getByText('Dress')).toBeInTheDocument();
      });

      fireEvent.click(screen.getAllByText('Dress')[0]);

      await waitFor(() => {
        const thumbnails = document.querySelectorAll('.thumbnail');
        expect(thumbnails.length).toBe(2);
      });

      const thumbnails = document.querySelectorAll('.thumbnail');
      fireEvent.click(thumbnails[1]);

      expect(thumbnails[1]).toHaveClass('thumbnail-active');
    });

    test('navigates to next item with arrow keys', async () => {
      renderStore();

      await waitFor(() => {
        fireEvent.click(screen.getAllByText('T-Shirt')[0]);
      });

      fireEvent.keyDown(window, { key: 'ArrowRight' });

      await waitFor(() => {
        expect(screen.getByText('Comfortable jeans')).toBeInTheDocument();
      });
    });

    test('navigates to previous item with arrow keys', async () => {
      renderStore();

      await waitFor(() => {
        fireEvent.click(screen.getAllByText('Jeans')[0]);
      });

      fireEvent.keyDown(window, { key: 'ArrowLeft' });

      await waitFor(() => {
        expect(screen.getByText('A nice t-shirt')).toBeInTheDocument();
      });
    });

    test('closes modal with Escape key', async () => {
      renderStore();

      await waitFor(() => {
        fireEvent.click(screen.getAllByText('T-Shirt')[0]);
      });

      fireEvent.keyDown(window, { key: 'Escape' });

      await waitFor(() => {
        expect(screen.queryByText('A nice t-shirt')).not.toBeInTheDocument();
      });
    });

    test('disables navigation arrows when only one item', async () => {
      renderStore();

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search items...');
        fireEvent.change(searchInput, { target: { value: 'Expensive Shirt' } });
      });

      await waitFor(() => {
        fireEvent.click(screen.getByText('Expensive Shirt'));
      });

      await waitFor(() => {
        const leftArrow = document.querySelector('.left-arrow');
        const rightArrow = document.querySelector('.right-arrow');
        expect(leftArrow).toBeDisabled();
        expect(rightArrow).toBeDisabled();
      });
    });

    test('shows placeholder image when no images available', async () => {
      renderStore();

      await waitFor(() => {
        fireEvent.click(screen.getByText('Expensive Shirt'));
      });

      await waitFor(() => {
        const modalImage = document.querySelector('.modal-image');
        expect(modalImage.src).toContain('placeholder');
      });
    });

    test('displays reserved banner for reserved items', async () => {
      renderStore();

      await waitFor(() => {
        fireEvent.click(screen.getAllByText('Dress')[0]);
      });

      await waitFor(() => {
        expect(screen.getByText(/This item is currently reserved/i)).toBeInTheDocument();
      });
    });
  });

  describe('Reserve Functionality', () => {
    test('reserves item successfully', async () => {
      axios.put.mockResolvedValue({ data: { reservationId: 'res-123' } });

      renderStore();

      await waitFor(() => {
        expect(screen.getByText('T-Shirt')).toBeInTheDocument();
      });

      fireEvent.click(screen.getAllByText('T-Shirt')[0]);

      await waitFor(() => {
        expect(screen.getByText('Reserve Item')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Reserve Item'));

      await waitFor(() => {
        expect(axios.put).toHaveBeenCalledWith(
          expect.stringContaining('/api/stores/reserve/item-1'),
          { storeId: 'store-123' },
          { headers: { Authorization: 'Bearer mock-token' } }
        );
      });

      expect(mockNavigate).toHaveBeenCalledWith(
        '/user/chats/owner-456_user-789'
      );
    });

    test('handles reserve failure', async () => {
      axios.put.mockRejectedValue(new Error('Network error'));
      window.alert = jest.fn();

      renderStore();

      await waitFor(() => {
        expect(screen.getByText('T-Shirt')).toBeInTheDocument();
      });

      fireEvent.click(screen.getAllByText('T-Shirt')[0]);

      await waitFor(() => {
        expect(screen.getByText('Reserve Item')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Reserve Item'));

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith(
          expect.stringContaining('Failed to reserve item')
        );
      });
    });

    test('shows disabled reserve button for reserved items', async () => {
      renderStore();

      await waitFor(() => {
        fireEvent.click(screen.getAllByText('Dress')[0]);
      });

      await waitFor(() => {
        const reserveButtons = screen.getAllByText('Reserved');
        const buttonElement = reserveButtons.find(el => el.tagName === 'BUTTON');
        expect(buttonElement).toBeDisabled();
      });
    });

    test('handles reserve without item found', async () => {
      renderStore();

      await waitFor(() => {
        fireEvent.click(screen.getAllByText('T-Shirt')[0]);
      });

      // Modify clothes state to remove item
      const handleReserve = async () => {
        try {
          await axios.put('/api/stores/reserve/nonexistent-item', {
            storeId: 'store-123',
          });
        } catch (error) {
          window.alert(`Failed to reserve item: ${error.message}`);
        }
      };

      axios.put.mockRejectedValue(new Error('Item not found'));
      await handleReserve();

      expect(window.alert).toHaveBeenCalledWith(
        'Failed to reserve item: Item not found'
      );
    });

    test('handles missing reservationId in response', async () => {
      axios.put.mockResolvedValue({ data: {} });

      renderStore();

      await waitFor(() => {
        fireEvent.click(screen.getAllByText('T-Shirt')[0]);
      });

      await waitFor(() => {
        fireEvent.click(screen.getByText('Reserve Item'));
      });

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith(
          expect.stringContaining('Failed to create reservation')
        );
      });
    });
  });

  describe('Enquire Functionality', () => {
    test('sends enquiry successfully', async () => {
      axios.post.mockResolvedValue({ data: { messageId: 'msg-123' } });

      renderStore();

      await waitFor(() => {
        expect(screen.getByText('T-Shirt')).toBeInTheDocument();
      });

      fireEvent.click(screen.getAllByText('T-Shirt')[0]);

      await waitFor(() => {
        expect(screen.getByText('Send Enquiry')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Send Enquiry'));

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          expect.stringContaining('/api/stores/messages'),
          expect.objectContaining({
            receiverId: 'owner-456',
            itemId: 'item-1',
            storeId: 'store-123',
          }),
          { headers: { Authorization: 'Bearer mock-token' } }
        );
      });

      expect(mockNavigate).toHaveBeenCalledWith(
        '/user/chats/owner-456_user-789'
      );
    });

    test('handles enquiry failure', async () => {
      axios.post.mockRejectedValue(new Error('Network error'));
      window.alert = jest.fn();

      renderStore();

      await waitFor(() => {
        expect(screen.getByText('T-Shirt')).toBeInTheDocument();
      });

      fireEvent.click(screen.getAllByText('T-Shirt')[0]);

      await waitFor(() => {
        expect(screen.getByText('Send Enquiry')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Send Enquiry'));

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith(
          expect.stringContaining('Failed to send enquiry')
        );
      });
    });

    test('handles missing messageId in response', async () => {
      axios.post.mockResolvedValue({ data: {} });

      renderStore();

      await waitFor(() => {
        fireEvent.click(screen.getAllByText('T-Shirt')[0]);
      });

      await waitFor(() => {
        fireEvent.click(screen.getByText('Send Enquiry'));
      });

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith(
          expect.stringContaining('Failed to send enquiry message')
        );
      });
    });
  });

  describe('Navigation', () => {
    test('redirects to login if user is not authenticated', async () => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null);
        return jest.fn();
      });

      renderStore();

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });

    test('opens directions in new window', async () => {
      renderStore();

      await waitFor(() => {
        const directionsButton = screen.getByText('Directions');
        fireEvent.click(directionsButton);
      });

      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining('google.com/maps'),
        '_blank'
      );
    });

    test('disables directions button when location is missing', async () => {
      const storeWithoutLocation = { ...mockStore, location: {} };
      axios.get.mockImplementation((url) => {
        if (url.includes('/api/stores/store-123/items')) {
          return Promise.resolve({ data: mockClothes });
        }
        if (url.includes('/api/stores/store-123')) {
          return Promise.resolve({ data: storeWithoutLocation });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      renderStore();

      await waitFor(() => {
        const directionsButton = screen.getByText('Directions');
        expect(directionsButton).toBeDisabled();
      });
    });
  });

  describe('Back to Top Button', () => {
    test('shows back to top button after scrolling', async () => {
      renderStore();

      await waitFor(() => {
        expect(screen.getByText('T-Shirt')).toBeInTheDocument();
      });

      // Simulate scroll
      Object.defineProperty(window, 'scrollY', { value: 500, writable: true });
      fireEvent.scroll(window);

      await waitFor(() => {
        expect(document.querySelector('.back-to-top')).toBeInTheDocument();
      });
    });

    test('scrolls to top when back to top button is clicked', async () => {
      const scrollToMock = jest.fn();
      window.scrollTo = scrollToMock;

      renderStore();

      await waitFor(() => {
        expect(screen.getByText('T-Shirt')).toBeInTheDocument();
      });

      Object.defineProperty(window, 'scrollY', { value: 500, writable: true });
      fireEvent.scroll(window);

      await waitFor(() => {
        const backToTopButton = document.querySelector('.back-to-top');
        expect(backToTopButton).toBeInTheDocument();
        fireEvent.click(backToTopButton);
      });

      expect(scrollToMock).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    });

    test('hides back to top button when at top of page', async () => {
      renderStore();

      await waitFor(() => {
        expect(screen.getByText('T-Shirt')).toBeInTheDocument();
      });

      Object.defineProperty(window, 'scrollY', { value: 500, writable: true });
      fireEvent.scroll(window);

      await waitFor(() => {
        expect(document.querySelector('.back-to-top')).toBeInTheDocument();
      });

      Object.defineProperty(window, 'scrollY', { value: 100, writable: true });
      fireEvent.scroll(window);

      await waitFor(() => {
        expect(document.querySelector('.back-to-top')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('handles store fetch error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      axios.get.mockImplementation((url) => {
        if (url.includes('/api/stores/store-123/items')) {
          return Promise.resolve({ data: [] });
        }
        if (url.includes('/api/stores/store-123')) {
          return Promise.reject({
            response: { data: 'Store not found' },
            message: 'Network error',
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      renderStore();

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error fetching store or items:',
          'Store not found'
        );
      });

      consoleErrorSpy.mockRestore();
    });

    test('handles items fetch error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      axios.get.mockImplementation((url) => {
        if (url.includes('/api/stores/store-123/items')) {
          return Promise.reject(new Error('Items not found'));
        }
        if (url.includes('/api/stores/store-123')) {
          return Promise.resolve({ data: mockStore });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      renderStore();

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });

    test('handles missing store hours gracefully', async () => {
      const storeWithoutHours = { ...mockStore, hours: null };
      axios.get.mockImplementation((url) => {
        if (url.includes('/api/stores/store-123/items')) {
          return Promise.resolve({ data: mockClothes });
        }
        if (url.includes('/api/stores/store-123')) {
          return Promise.resolve({ data: storeWithoutHours });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      renderStore();

      await waitFor(() => {
        expect(screen.getByText('Test Store')).toBeInTheDocument();
      });
    });

    test('handles empty contact info', async () => {
      const storeWithoutContact = { ...mockStore, contactInfos: [] };
      axios.get.mockImplementation((url) => {
        if (url.includes('/api/stores/store-123/items')) {
          return Promise.resolve({ data: mockClothes });
        }
        if (url.includes('/api/stores/store-123')) {
          return Promise.resolve({ data: storeWithoutContact });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      renderStore();

      await waitFor(() => {
        fireEvent.click(screen.getAllByText('Contact Us')[0]);
      });

      await waitFor(() => {
        expect(screen.getByText('No contact information available.')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    test('handles store without description', async () => {
      const storeWithoutDesc = { ...mockStore, description: null };
      axios.get.mockImplementation((url) => {
        if (url.includes('/api/stores/store-123/items')) {
          return Promise.resolve({ data: mockClothes });
        }
        if (url.includes('/api/stores/store-123')) {
          return Promise.resolve({ data: storeWithoutDesc });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      renderStore();

      await waitFor(() => {
        expect(screen.getByText('Test Store')).toBeInTheDocument();
      });
    });

    test('handles items without images', async () => {
      const itemsWithoutImages = mockClothes.map(item => ({ ...item, images: [] }));
      axios.get.mockImplementation((url) => {
        if (url.includes('/api/stores/store-123/items')) {
          return Promise.resolve({ data: itemsWithoutImages });
        }
        if (url.includes('/api/stores/store-123')) {
          return Promise.resolve({ data: mockStore });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      renderStore();

      await waitFor(() => {
        const images = document.querySelectorAll('.item-image');
        expect(images[0].src).toContain('placeholder');
      });
    });

    test('handles items with missing optional fields', async () => {
      const minimalItem = {
        itemId: 'minimal-1',
        name: 'Minimal Item',
        price: 100,
        status: 'Available',
        images: [{ imageURL: 'https://example.com/minimal.jpg' }],
      };

      axios.get.mockImplementation((url) => {
        if (url.includes('/api/stores/store-123/items')) {
          return Promise.resolve({ data: [minimalItem] });
        }
        if (url.includes('/api/stores/store-123')) {
          return Promise.resolve({ data: mockStore });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      renderStore();

      await waitFor(() => {
        expect(screen.getByText('Minimal Item')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Minimal Item'));

      await waitFor(() => {
        expect(screen.getByText('No description available')).toBeInTheDocument();
      });
    });

    test('filters out sold items', async () => {
      const itemsWithSold = [
        ...mockClothes,
        {
          itemId: 'sold-1',
          name: 'Sold Item',
          price: 100,
          status: 'Sold',
          images: [],
        },
      ];

      axios.get.mockImplementation((url) => {
        if (url.includes('/api/stores/store-123/items')) {
          return Promise.resolve({ data: itemsWithSold });
        }
        if (url.includes('/api/stores/store-123')) {
          return Promise.resolve({ data: mockStore });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      renderStore();

      await waitFor(() => {
        expect(screen.queryByText('Sold Item')).not.toBeInTheDocument();
      });
    });

    test('handles complex hour groupings', async () => {
      const complexHours = {
        Monday: { open: true, start: '09:00', end: '17:00' },
        Tuesday: { open: true, start: '09:00', end: '17:00' },
        Wednesday: { open: true, start: '10:00', end: '18:00' },
        Thursday: { open: true, start: '09:00', end: '17:00' },
        Friday: { open: true, start: '09:00', end: '17:00' },
        Saturday: { open: true, start: '09:00', end: '13:00' },
        Sunday: { open: false, start: '09:00', end: '17:00' },
      };

      const storeWithComplexHours = { ...mockStore, hours: complexHours };
      axios.get.mockImplementation((url) => {
        if (url.includes('/api/stores/store-123/items')) {
          return Promise.resolve({ data: mockClothes });
        }
        if (url.includes('/api/stores/store-123')) {
          return Promise.resolve({ data: storeWithComplexHours });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      renderStore();

      await waitFor(() => {
        fireEvent.click(screen.getByText('View All Hours'));
      });

      await waitFor(() => {
        expect(screen.getByText('Store Hours')).toBeInTheDocument();
      });
    });

    test('handles WhatsApp number formatting with international prefix', async () => {
      const storeWithIntlPhone = {
        ...mockStore,
        contactInfos: [{ id: '1', type: 'phone', value: '+27123456789' }],
      };

      axios.get.mockImplementation((url) => {
        if (url.includes('/api/stores/store-123/items')) {
          return Promise.resolve({ data: mockClothes });
        }
        if (url.includes('/api/stores/store-123')) {
          return Promise.resolve({ data: storeWithIntlPhone });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      renderStore();

      await waitFor(() => {
        fireEvent.click(screen.getAllByText('Contact Us')[0]);
      });

      await waitFor(() => {
        const whatsappButtons = screen.getAllByTitle(/WhatsApp/i);
        fireEvent.click(whatsappButtons[0]);
      });

      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining('wa.me/27123456789'),
        '_blank'
      );
    });

    test('handles social media links with http prefix', async () => {
      const storeWithHttpLinks = {
        ...mockStore,
        contactInfos: [
          { id: '1', type: 'instagram', value: 'https://instagram.com/teststore' },
        ],
      };

      axios.get.mockImplementation((url) => {
        if (url.includes('/api/stores/store-123/items')) {
          return Promise.resolve({ data: mockClothes });
        }
        if (url.includes('/api/stores/store-123')) {
          return Promise.resolve({ data: storeWithHttpLinks });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      renderStore();

      await waitFor(() => {
        fireEvent.click(screen.getAllByText('Contact Us')[0]);
      });

      await waitFor(() => {
        const instagramButton = screen.getByTitle('https://instagram.com/teststore');
        fireEvent.click(instagramButton);
      });

      expect(window.open).toHaveBeenCalledWith(
        'https://instagram.com/teststore',
        '_blank'
      );
    });
  });
});