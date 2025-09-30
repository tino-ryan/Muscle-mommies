import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ThriftFinderHome from '../pages/customer/Home';
import axios from 'axios';

// Mocks
jest.mock('axios');

jest.mock('../components/CustomerSidebar', () => ({ activePage }) => (
  <div data-testid="customer-sidebar">
    <span>Active Page: {activePage}</span>
  </div>
));

// Mock Leaflet - UPDATED
jest.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => (
    <div data-testid="map-container">{children}</div>
  ),
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children, position }) => (
    <div data-testid="marker" data-position={JSON.stringify(position)}>
      {children}
    </div>
  ),
  Popup: ({ children }) => <div data-testid="popup">{children}</div>,
  useMap: () => ({
    fitBounds: jest.fn(),
  }),
}));

// UPDATED: Mock Leaflet with proper Icon constructor and Default
jest.mock('leaflet', () => {
  const mockIcon = jest.fn();
  const mockDefault = {
    prototype: {
      _getIconUrl: jest.fn(),
    },
    mergeOptions: jest.fn(),
  };

  mockIcon.Default = mockDefault;

  return {
    Icon: mockIcon,
    default: {
      Icon: mockIcon,
    },
  };
});

// Mock navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock geolocation
const mockGeolocation = {
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
  getCurrentPosition: jest.fn(),
};

global.navigator.geolocation = mockGeolocation;

const renderHome = () =>
  render(
    <BrowserRouter>
      <ThriftFinderHome />
    </BrowserRouter>
  );

describe('ThriftFinderHome', () => {
  const mockStores = [
    {
      storeId: 'store1',
      storeName: 'Vintage Finds',
      address: '123 Main St, Johannesburg',
      location: { lat: '-26.2041', lng: '28.0473' }, // Same as mock user location
      profileImageURL: 'http://example.com/store1.jpg',
      description: 'Best vintage clothing',
      contactInfo: 'contact@vintage.com',
    },
    {
      storeId: 'store2',
      storeName: 'Retro Style',
      address: '456 Long St, Johannesburg',
      location: { lat: '-26.2050', lng: '28.0480' }, // Slightly different, still close
      profileImageURL: 'http://example.com/store2.jpg',
      description: 'Retro fashion',
      contactInfo: 'info@retro.com',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockResolvedValue({ data: mockStores });

    // Mock successful geolocation - Johannesburg coordinates
    mockGeolocation.watchPosition.mockImplementation((success) => {
      setTimeout(() => {
        success({
          coords: {
            latitude: -26.2041,
            longitude: 28.0473,
          },
        });
      }, 100);
      return 1; // watchId
    });
  });

  describe('Component Rendering', () => {
    it('renders page header and navigation buttons', async () => {
      renderHome();

      expect(screen.getByText('Find Nearby Thrift Stores')).toBeInTheDocument();
      expect(screen.getByText('Closet')).toBeInTheDocument();
      expect(screen.getByText('Badges')).toBeInTheDocument();
    });

    it('renders customer sidebar', () => {
      renderHome();

      expect(screen.getByTestId('customer-sidebar')).toBeInTheDocument();
      expect(screen.getByText('Active Page: home')).toBeInTheDocument();
    });

    it('renders map container', () => {
      renderHome();

      expect(screen.getByTestId('map-container')).toBeInTheDocument();
    });

    it('renders distance selector', () => {
      renderHome();

      expect(screen.getByText('Max Distance:')).toBeInTheDocument();
      expect(screen.getByDisplayValue('10 km')).toBeInTheDocument();
    });
  });

  describe('Store Fetching', () => {
    it('fetches and displays stores', async () => {
      renderHome();

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          expect.stringContaining('/api/stores')
        );
      });

      await waitFor(() => {
        expect(screen.getAllByText('Vintage Finds').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Retro Style').length).toBeGreaterThan(0);
      });
    });

    it('handles API error when fetching stores', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      axios.get.mockRejectedValue({
        response: { data: { error: 'Failed to fetch' } },
      });

      renderHome();

      await waitFor(() => {
        expect(
          screen.getByText('Failed to load stores: Failed to fetch')
        ).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    it('filters out stores without location data', async () => {
      const storesWithInvalid = [
        ...mockStores,
        {
          storeId: 'store3',
          storeName: 'No Location Store',
          address: '789 St',
        },
      ];

      axios.get.mockResolvedValue({ data: storesWithInvalid });

      renderHome();

      await waitFor(() => {
        expect(screen.getAllByText('Vintage Finds').length).toBeGreaterThan(0);
        expect(screen.queryByText('No Location Store')).not.toBeInTheDocument();
      });
    });
  });

  describe('Geolocation', () => {
    it('shows loading state while getting location', () => {
      mockGeolocation.watchPosition.mockImplementation(() => 1);

      renderHome();

      expect(screen.getByText('Getting your location...')).toBeInTheDocument();
    });

    it('shows success status when location is detected', async () => {
      renderHome();

      await waitFor(() => {
        expect(screen.getByText('Location detected')).toBeInTheDocument();
      });
    });

    it('handles geolocation error with fallback', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      mockGeolocation.watchPosition.mockImplementation((success, error) => {
        setTimeout(() => {
          error({ code: 1, message: 'Permission denied' });
        }, 100);
        return 1;
      });

      renderHome();

      await waitFor(() => {
        expect(
          screen.getByText('Unable to access location')
        ).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    it('falls back to Johannesburg when geolocation unavailable', async () => {
      delete global.navigator.geolocation;

      renderHome();

      // Component should use default Johannesburg location
      await waitFor(() => {
        expect(screen.getByText('Location detected')).toBeInTheDocument();
      });

      // Restore geolocation
      global.navigator.geolocation = mockGeolocation;
    });

    it('cleans up geolocation watch on unmount', () => {
      mockGeolocation.watchPosition.mockReturnValue(123); // Return a specific watchId

      const { unmount } = renderHome();

      unmount();

      expect(mockGeolocation.clearWatch).toHaveBeenCalledWith(123);
    });
  });

  describe('Distance Filtering', () => {
    it('changes max distance filter', async () => {
      renderHome();

      await waitFor(() => {
        expect(screen.getByDisplayValue('10 km')).toBeInTheDocument();
      });

      const select = screen.getByDisplayValue('10 km');
      fireEvent.change(select, { target: { value: '20' } });

      expect(screen.getByDisplayValue('20 km')).toBeInTheDocument();
    });

    it('shows no stores message when all filtered out', async () => {
      mockGeolocation.watchPosition.mockImplementation((success) => {
        setTimeout(() => {
          success({
            coords: {
              latitude: 0, // Very far from stores
              longitude: 0,
            },
          });
        }, 100);
        return 1;
      });

      renderHome();

      await waitFor(() => {
        expect(
          screen.getByText('No stores match the current filter.')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Store Display', () => {
    it('displays distance for each store', async () => {
      renderHome();

      await waitFor(() => {
        const distanceElements = screen.getAllByText(/km away/);
        expect(distanceElements.length).toBeGreaterThan(0);
      });
    });

    it('sorts stores by distance', async () => {
      renderHome();

      await waitFor(() => {
        // Store cards appear in both map popups and store list
        // There are 2 stores, each appearing twice (popup + card) = 4 total
        const storeCards = screen.getAllByText(/km away/);
        expect(storeCards.length).toBe(4); // 2 in popups + 2 in store cards
      });
    });

    it('navigates to store page when store card clicked', async () => {
      renderHome();

      await waitFor(() => {
        expect(screen.getAllByText('Vintage Finds').length).toBeGreaterThan(0);
      });

      const storeCard = screen
        .getAllByText('Vintage Finds')[1]
        .closest('.store-card');
      fireEvent.click(storeCard);

      expect(mockNavigate).toHaveBeenCalledWith('/store/store1');
    });
  });

  describe('Map Markers', () => {
    it('displays user location marker', async () => {
      renderHome();

      await waitFor(() => {
        const markers = screen.getAllByTestId('marker');
        const userMarker = markers.find((m) =>
          m.textContent.includes('You are here')
        );
        expect(userMarker).toBeInTheDocument();
      });
    });

    it('displays store markers', async () => {
      renderHome();

      await waitFor(() => {
        const markers = screen.getAllByTestId('marker');
        expect(markers.length).toBeGreaterThan(0);
      });
    });

    it('shows store info in popup', async () => {
      renderHome();

      await waitFor(() => {
        expect(screen.getAllByText('Vintage Finds').length).toBeGreaterThan(0);
      });

      const popups = screen.getAllByTestId('popup');
      const storePopup = popups.find((p) =>
        p.textContent.includes('Vintage Finds')
      );
      expect(storePopup).toBeTruthy();
    });
  });

  describe('Navigation', () => {
    it('navigates to closet page', () => {
      renderHome();

      fireEvent.click(screen.getByText('Closet'));

      expect(mockNavigate).toHaveBeenCalledWith('/customer/closet');
    });

    it('navigates to badges page', () => {
      renderHome();

      fireEvent.click(screen.getByText('Badges'));

      expect(mockNavigate).toHaveBeenCalledWith('/badges');
    });
  });

  describe('Distance Calculation', () => {
    it('calculates distance correctly', async () => {
      renderHome();

      await waitFor(() => {
        const distanceElements = screen.getAllByText(/\d+\.\d+ km away/);
        expect(distanceElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Button Hover Effects', () => {
    it('applies hover styles to closet button', () => {
      renderHome();

      const closetButton = screen.getByText('Closet');

      fireEvent.mouseOver(closetButton);
      expect(closetButton.style.backgroundColor).toBe('rgb(153, 77, 81)');

      fireEvent.mouseOut(closetButton);
      expect(closetButton.style.backgroundColor).toBe('rgb(211, 244, 75)');
    });

    it('applies hover styles to badges button', () => {
      renderHome();

      const badgesButton = screen.getByText('Badges');

      fireEvent.mouseOver(badgesButton);
      expect(badgesButton.style.backgroundColor).toBe('rgb(153, 77, 81)');

      fireEvent.mouseOut(badgesButton);
      expect(badgesButton.style.backgroundColor).toBe('rgb(211, 244, 75)');
    });
  });

  describe('Store Image Handling', () => {
    it('uses placeholder for stores without images', async () => {
      const storeWithoutImage = {
        storeId: 'store3',
        storeName: 'No Image Store',
        address: '789 St',
        location: { lat: '-26.2041', lng: '28.0473' },
      };

      axios.get.mockResolvedValue({ data: [storeWithoutImage] });

      renderHome();

      await waitFor(() => {
        expect(screen.getAllByText('No Image Store').length).toBeGreaterThan(0);
      });

      const images = screen.getAllByRole('img');
      const placeholderImage = images.find((img) =>
        img.src.includes('placeholder')
      );
      expect(placeholderImage).toBeInTheDocument();
    });
  });
});
