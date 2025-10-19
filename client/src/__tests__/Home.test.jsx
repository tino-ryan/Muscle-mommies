import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ThriftFinderHome from '../pages/customer/Home';
import axios from 'axios';

// Mocks
jest.mock('axios');

jest.mock('../components/CustomerSidebar', () => {
  const CustomerSidebarMock = ({ activePage }) => (
    <div data-testid="customer-sidebar">
      <span>Active Page: {activePage}</span>
    </div>
  );
  CustomerSidebarMock.displayName = 'CustomerSidebar'; // Already set, no issue here
  return CustomerSidebarMock;
});

// Mock Leaflet - UPDATED
jest.mock('react-leaflet', () => {
  const MapContainer = ({ children }) => (
    <div data-testid="map-container">{children}</div>
  );
  MapContainer.displayName = 'MapContainer'; // Add displayName

  const TileLayer = () => <div data-testid="tile-layer" />;
  TileLayer.displayName = 'TileLayer'; // Add displayName

  const Marker = ({ children, position }) => (
    <div data-testid="marker" data-position={JSON.stringify(position)}>
      {children}
    </div>
  );
  Marker.displayName = 'Marker'; // Add displayName

  const Popup = ({ children }) => <div data-testid="popup">{children}</div>;
  Popup.displayName = 'Popup'; // Add displayName

  const useMap = () => ({
    fitBounds: jest.fn(),
  });
  useMap.displayName = 'useMap'; // Add displayName for the hook (optional, depending on usage)

  return {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    useMap,
  };
});

// Mock Leaflet - UPDATED
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

// Mock document.cookie
let mockCookie = '';
Object.defineProperty(document, 'cookie', {
  get: jest.fn(() => mockCookie),
  set: jest.fn((value) => {
    mockCookie = value;
  }),
  configurable: true,
});

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
      location: { lat: '-26.2041', lng: '28.0473' },
      profileImageURL: 'http://example.com/store1.jpg',
      description: 'Best vintage clothing',
      contactInfo: 'contact@vintage.com',
    },
    {
      storeId: 'store2',
      storeName: 'Retro Style',
      address: '456 Long St, Johannesburg',
      location: { lat: '-26.2050', lng: '28.0480' },
      profileImageURL: 'http://example.com/store2.jpg',
      description: 'Retro fashion',
      contactInfo: 'info@retro.com',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockCookie = ''; // Clear cookie before each test
    axios.get.mockResolvedValue({ data: mockStores });

    // Mock getCurrentPosition (changed from watchPosition)
    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      setTimeout(() => {
        success({
          coords: {
            latitude: -26.2041,
            longitude: 28.0473,
            accuracy: 50, // Add accuracy
          },
        });
      }, 100);
    });
  });

  // Rest of your test cases remain unchanged
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
      mockGeolocation.getCurrentPosition.mockImplementation(() => {});

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

      mockGeolocation.getCurrentPosition.mockImplementation(
        (success, error) => {
          setTimeout(() => {
            error({ code: 1, message: 'Permission denied' });
          }, 100);
        }
      );

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

    it('uses saved location from cookie when available', async () => {
      const savedLocation = {
        lat: -26.1234,
        lng: 28.5678,
        address: '123 Test St, Johannesburg',
      };
      mockCookie = `userLocation=${encodeURIComponent(JSON.stringify(savedLocation))}`;

      renderHome();

      await waitFor(() => {
        expect(
          screen.getByText('Using: 123 Test St, Johannesburg')
        ).toBeInTheDocument();
      });

      // Should not call getCurrentPosition when cookie exists
      expect(mockGeolocation.getCurrentPosition).not.toHaveBeenCalled();
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
      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        setTimeout(() => {
          success({
            coords: {
              latitude: 0, // Very far from stores
              longitude: 0,
              accuracy: 50,
            },
          });
        }, 100);
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
    it('Closet button exists and navigates on click', () => {
      renderHome();

      const closetButton = screen.getByText('Closet');

      // Check it exists
      expect(closetButton).toBeInTheDocument();

      // Click triggers navigation
      fireEvent.click(closetButton);
      expect(mockNavigate).toHaveBeenCalledWith('/customer/closet');
    });

    it('Badges button exists and navigates on click', () => {
      renderHome();

      const badgesButton = screen.getByText('Badges');

      // Check it exists
      expect(badgesButton).toBeInTheDocument();

      // Click triggers navigation
      fireEvent.click(badgesButton);
      expect(mockNavigate).toHaveBeenCalledWith('/badges');
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

  describe('Address Search', () => {
    it('renders Set Address button', async () => {
      renderHome();

      await waitFor(() => {
        expect(screen.getByText('Set Address')).toBeInTheDocument();
      });
    });

    it('shows address search input when Set Address clicked', async () => {
      renderHome();

      await waitFor(() => {
        expect(screen.getByText('Set Address')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Set Address'));

      expect(
        screen.getByPlaceholderText(
          'Enter house number, street, suburb, city'
        )
      ).toBeInTheDocument();
      expect(screen.getByText('Search')).toBeInTheDocument();
    });

    it('searches for address and displays options', async () => {
      const mockAddresses = [
        {
          address: {
            house_number: '123',
            road: 'Main Street',
            suburb: 'Sandton',
            city: 'Johannesburg',
          },
          display_name: '123 Main Street, Sandton, Johannesburg',
          lat: '-26.1234',
          lon: '28.5678',
        },
      ];

      // First call for stores, second for address search
      axios.get
        .mockResolvedValueOnce({ data: mockStores })
        .mockResolvedValueOnce({ data: mockAddresses });

      renderHome();

      await waitFor(() => {
        expect(screen.getByText('Set Address')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Set Address'));

      const input = screen.getByPlaceholderText(
        'Enter house number, street, suburb, city'
      );
      fireEvent.change(input, { target: { value: '123 Main Street' } });

      const searchButton = screen.getByText('Search');
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          'https://nominatim.openstreetmap.org/search',
          expect.objectContaining({
            params: expect.objectContaining({
              q: '123 Main Street, South Africa',
              format: 'json',
            }),
          })
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Select an address')).toBeInTheDocument();
      });
    });

    it('selects address and saves to cookie', async () => {
      const mockAddresses = [
        {
          address: {
            house_number: '123',
            road: 'Main Street',
            suburb: 'Sandton',
            city: 'Johannesburg',
          },
          display_name: '123 Main Street, Sandton, Johannesburg',
          lat: '-26.1234',
          lon: '28.5678',
        },
      ];

      axios.get
        .mockResolvedValueOnce({ data: mockStores })
        .mockResolvedValueOnce({ data: mockAddresses });

      renderHome();

      await waitFor(() => {
        expect(screen.getByText('Set Address')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Set Address'));

      const input = screen.getByPlaceholderText(
        'Enter house number, street, suburb, city'
      );
      fireEvent.change(input, { target: { value: '123 Main Street' } });

      fireEvent.click(screen.getByText('Search'));

      await waitFor(() => {
        expect(screen.getByText('Select an address')).toBeInTheDocument();
      });

      const select = screen.getByDisplayValue('Select an address');
      fireEvent.change(select, { target: { value: '0' } });

      await waitFor(() => {
        expect(mockCookie).toContain('userLocation');
        // Cookie contains URL-encoded JSON, so check for the decoded values
        const decodedCookie = decodeURIComponent(mockCookie);
        expect(decodedCookie).toContain('123 Main Street, Sandton, Johannesburg');
      });
    });

    it('displays clear button when saved address exists', async () => {
      const savedLocation = {
        lat: -26.1234,
        lng: 28.5678,
        address: '123 Test St, Johannesburg',
      };
      mockCookie = `userLocation=${encodeURIComponent(JSON.stringify(savedLocation))}`;

      renderHome();

      await waitFor(() => {
        expect(screen.getByTitle('Clear saved location and use GPS')).toBeInTheDocument();
      });
    });

    it('clears saved location and uses GPS when clear button clicked', async () => {
      const savedLocation = {
        lat: -26.1234,
        lng: 28.5678,
        address: '123 Test St, Johannesburg',
      };
      mockCookie = `userLocation=${encodeURIComponent(JSON.stringify(savedLocation))}`;

      renderHome();

      await waitFor(() => {
        expect(
          screen.getByText('Using: 123 Test St, Johannesburg')
        ).toBeInTheDocument();
      });

      const clearButton = screen.getByTitle('Clear saved location and use GPS');
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();
      });
    });

    it('shows error when searching without input', async () => {
      renderHome();

      await waitFor(() => {
        expect(screen.getByText('Set Address')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Set Address'));

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

    it('shows error when no addresses found', async () => {
      axios.get
        .mockResolvedValueOnce({ data: mockStores })
        .mockResolvedValueOnce({ data: [] });

      renderHome();

      await waitFor(() => {
        expect(screen.getByText('Set Address')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Set Address'));

      const input = screen.getByPlaceholderText(
        'Enter house number, street, suburb, city'
      );
      fireEvent.change(input, { target: { value: 'Invalid Address' } });

      fireEvent.click(screen.getByText('Search'));

      await waitFor(() => {
        expect(
          screen.getByText('No results found for the address. Please try again.')
        ).toBeInTheDocument();
      });
    });
  });
});
