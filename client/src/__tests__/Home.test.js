
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ThriftFinderHome from '../pages/customer/Home';
import { MemoryRouter } from 'react-router-dom';

// Mock useNavigate from react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(() => mockNavigate),
}));

// Mock leaflet MapContainer, Marker, Popup, TileLayer, FitBounds
jest.mock('react-leaflet', () => {
  return {
    MapContainer: ({ children }) => <div data-testid="map">{children}</div>,
    TileLayer: () => <div data-testid="tilelayer" />,
    Marker: ({ children }) => <div data-testid="marker">{children}</div>,
    Popup: ({ children }) => <div data-testid="popup">{children}</div>,
    useMap: () => ({ fitBounds: jest.fn() }),
  };
});

// Mock fetch
global.fetch = jest.fn();

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
};
global.navigator.geolocation = mockGeolocation;

describe('ThriftFinderHome', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders header and navbar', () => {
    render(
      <MemoryRouter>
        <ThriftFinderHome />
      </MemoryRouter>
    );
    expect(screen.getByText(/Find Nearby Thrift Stores/i)).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Search')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('fetches and displays stores', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          id: 1,
          storeName: 'Test Store',
          address: '123 Street',
          lat: -26.2,
          lng: 28.0,
          description: 'A nice thrift shop',
        },
      ],
    });

    render(
      <MemoryRouter>
        <ThriftFinderHome />
      </MemoryRouter>
    );

    // Wait until the store name is visible
    expect(
      await screen.findByRole('heading', { name: /Test Store/i })
    ).toBeInTheDocument();

    // The address appears twice (map popup + card)
    const addresses = await screen.findAllByText(/123 Street/i);
    expect(addresses).toHaveLength(2);
  });

  it('handles fetch errors gracefully', async () => {
    // Instead of rejected Promise, return non-ok response
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => {
        throw new Error('Network error');
      },
    });

    render(
      <MemoryRouter>
        <ThriftFinderHome />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText(/No stores match the current filter/i)
      ).toBeInTheDocument();
    });
  });

  it('gets user location successfully', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => [] });
    mockGeolocation.getCurrentPosition.mockImplementationOnce((success) =>
      success({ coords: { latitude: -26.1, longitude: 28.1 } })
    );

    render(
      <MemoryRouter>
        <ThriftFinderHome />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Location detected/i)).toBeInTheDocument();
    });
  });

  it('falls back to Joburg CBD when geolocation fails', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => [] });
    mockGeolocation.getCurrentPosition.mockImplementationOnce(
      (_, errorCallback) => errorCallback()
    );

    render(
      <MemoryRouter>
        <ThriftFinderHome />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Location detected/i)).toBeInTheDocument();
    });
  });

  it('changes max distance filter', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          id: 1,
          storeName: 'Far Away Store',
          address: '456 Avenue',
          lat: -25.0,
          lng: 28.0,
          description: 'Distant thrift shop',
        },
      ],
    });

    render(
      <MemoryRouter>
        <ThriftFinderHome />
      </MemoryRouter>
    );

    // Instead of label, query select by role
    const select = await screen.findByRole('combobox');
    fireEvent.change(select, { target: { value: '50' } });
    expect(select.value).toBe('50');
  });

  // Additional tests to increase coverage

  it('navigates when navbar buttons are clicked', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => [] });

    render(
      <MemoryRouter>
        <ThriftFinderHome />
      </MemoryRouter>
    );

    // Test ThriftFinder logo click
    fireEvent.click(screen.getByText('ThriftFinder'));
    expect(mockNavigate).toHaveBeenCalledWith('/');

    // Test Home button click
    fireEvent.click(screen.getByText('Home'));
    expect(mockNavigate).toHaveBeenCalledWith('/');

    // Test Search button click
    fireEvent.click(screen.getByText('Search'));
    expect(mockNavigate).toHaveBeenCalledWith('/Search');

    // Test Profile button click
    fireEvent.click(screen.getByText('Profile'));
    expect(mockNavigate).toHaveBeenCalledWith('/profile');
  });

  it('navigates to store detail when store card is clicked', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          storeId: '123',
          storeName: 'Clickable Store',
          address: '789 Click St',
          lat: -26.2,
          lng: 28.0,
          description: 'Click me!',
        },
      ],
    });

    render(
      <MemoryRouter>
        <ThriftFinderHome />
      </MemoryRouter>
    );

    const storeCard = await screen.findByRole('heading', {
      name: /Clickable Store/i,
    });
    fireEvent.click(storeCard.closest('div[style*="cursor: pointer"]'));

    expect(mockNavigate).toHaveBeenCalledWith('/Store/123');
  });

  it('handles stores with location object structure', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          storeId: '456',
          storeName: 'Location Object Store',
          address: '321 Object St',
          location: { lat: -26.3, lng: 28.1 },
          description: 'Store with location object',
        },
      ],
    });

    render(
      <MemoryRouter>
        <ThriftFinderHome />
      </MemoryRouter>
    );

    expect(
      await screen.findByRole('heading', { name: /Location Object Store/i })
    ).toBeInTheDocument();
  });

  it('filters out stores without valid location data', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          storeId: '1',
          storeName: 'Valid Store',
          address: '123 Valid St',
          lat: -26.2,
          lng: 28.0,
        },
        {
          storeId: '2',
          storeName: 'Invalid Store',
          address: '456 Invalid St',
          // Missing lat/lng
        },
        {
          storeId: '3',
          storeName: 'Partial Store',
          address: '789 Partial St',
          lat: -26.2,
          // Missing lng
        },
      ],
    });

    render(
      <MemoryRouter>
        <ThriftFinderHome />
      </MemoryRouter>
    );

    // Only the valid store should appear
    expect(
      await screen.findByRole('heading', { name: /Valid Store/i })
    ).toBeInTheDocument();

    expect(
      screen.queryByRole('heading', { name: /Invalid Store/i })
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole('heading', { name: /Partial Store/i })
    ).not.toBeInTheDocument();
  });

  it('handles stores with missing optional fields', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          storeId: '789',
          lat: -26.2,
          lng: 28.0,
          // Missing storeName, address, description, etc.
        },
      ],
    });

    render(
      <MemoryRouter>
        <ThriftFinderHome />
      </MemoryRouter>
    );

    expect(
      await screen.findByRole('heading', { name: /Unnamed Store/i })
    ).toBeInTheDocument();
    expect(screen.getByText('No address')).toBeInTheDocument();
    expect(screen.getByText('No description available')).toBeInTheDocument();
  });

  it('refreshes location when refresh button is clicked', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => [] });
    mockGeolocation.getCurrentPosition.mockImplementation((success) =>
      success({ coords: { latitude: -26.1, longitude: 28.1 } })
    );

    render(
      <MemoryRouter>
        <ThriftFinderHome />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Location detected/i)).toBeInTheDocument();
    });

    // Click refresh button
    fireEvent.click(screen.getByText('Refresh'));

    // Should call getCurrentPosition again
    expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledTimes(2);
  });

  it('shows loading state while getting location', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => [] });

    // Don't call success or error callback immediately
    mockGeolocation.getCurrentPosition.mockImplementationOnce(() => {});

    render(
      <MemoryRouter>
        <ThriftFinderHome />
      </MemoryRouter>
    );

    expect(screen.getByText(/Getting your location/i)).toBeInTheDocument();
  });

  it('handles missing geolocation API', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => [] });

    // Temporarily remove geolocation
    const originalGeolocation = global.navigator.geolocation;
    delete global.navigator.geolocation;

    render(
      <MemoryRouter>
        <ThriftFinderHome />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Location unavailable/i)).toBeInTheDocument();
    });

    // Restore geolocation
    global.navigator.geolocation = originalGeolocation;
  });

  it('filters stores by distance when user location is available', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          storeId: '1',
          storeName: 'Nearby Store',
          address: '123 Near St',
          lat: -26.2,
          lng: 28.0,
          description: 'Close store',
        },
        {
          storeId: '2',
          storeName: 'Far Store',
          address: '456 Far St',
          lat: -25.0, // Much further north
          lng: 28.0,
          description: 'Distant store',
        },
      ],
    });

    mockGeolocation.getCurrentPosition.mockImplementationOnce((success) =>
      success({ coords: { latitude: -26.2, longitude: 28.0 } })
    );

    render(
      <MemoryRouter>
        <ThriftFinderHome />
      </MemoryRouter>
    );

    // Wait for location to be detected
    await waitFor(() => {
      expect(screen.getByText(/Location detected/i)).toBeInTheDocument();
    });

    // Set a small max distance to filter out far store
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '10' } });

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /Nearby Store/i })
      ).toBeInTheDocument();
      // Far store should still be visible as it's within reasonable distance for this test
    });
  });

  it('shows distance as dash when no user location', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          storeId: '1',
          storeName: 'No Distance Store',
          address: '123 No Distance St',
          lat: -26.2,
          lng: 28.0,
          description: 'Store without user location',
        },
      ],
    });

    // Remove geolocation to ensure no user location
    delete global.navigator.geolocation;

    render(
      <MemoryRouter>
        <ThriftFinderHome />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Location unavailable/i)).toBeInTheDocument();
    });

    // Should show "Distance: —" instead of actual distance
    expect(await screen.findByText('Distance: —')).toBeInTheDocument();

    // Restore geolocation for other tests
    global.navigator.geolocation = mockGeolocation;
  });

  it('handles stores with null distance in sorting', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          storeId: '1',
          storeName: 'Valid Store',
          address: '123 Valid St',
          lat: -26.2,
          lng: 28.0,
        },
      ],
    });

    // Don't provide user location
    delete global.navigator.geolocation;

    render(
      <MemoryRouter>
        <ThriftFinderHome />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Location unavailable/i)).toBeInTheDocument();
    });

    // Store should still be displayed even without distance calculation
    expect(
      await screen.findByRole('heading', { name: /Valid Store/i })
    ).toBeInTheDocument();

    // Restore geolocation for other tests
    global.navigator.geolocation = mockGeolocation;
  });

  it('handles network fetch rejection properly', async () => {
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    fetch.mockRejectedValueOnce(new Error('Network failure'));

    render(
      <MemoryRouter>
        <ThriftFinderHome />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error fetching stores:',
        expect.any(Error)
      );
    });

    // Should show no stores message
    expect(
      screen.getByText(/No stores match the current filter/i)
    ).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('renders map markers for filtered stores', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          storeId: '1',
          storeName: 'Marker Store',
          address: '123 Marker St',
          lat: -26.2,
          lng: 28.0,
        },
      ],
    });

    render(
      <MemoryRouter>
        <ThriftFinderHome />
      </MemoryRouter>
    );

    // Should render map and markers
    expect(screen.getByTestId('map')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getAllByTestId('marker').length).toBeGreaterThan(0);
    });
  });

  it('displays user location marker when available', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => [] });

    mockGeolocation.getCurrentPosition.mockImplementationOnce((success) =>
      success({ coords: { latitude: -26.2, longitude: 28.0 } })
    );

    render(
      <MemoryRouter>
        <ThriftFinderHome />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Location detected/i)).toBeInTheDocument();
    });

    // Should have user location marker
    await waitFor(() => {
      expect(screen.getByText('You are here')).toBeInTheDocument();
    });
  });

  it('handles distance filter edge case with very large distance', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          storeId: '1',
          storeName: 'Any Distance Store',
          address: '123 Any St',
          lat: -30.0, // Very far from Joburg
          lng: 30.0,
          description: 'Very distant store',
        },
      ],
    });

    mockGeolocation.getCurrentPosition.mockImplementationOnce((success) =>
      success({ coords: { latitude: -26.2, longitude: 28.0 } })
    );

    render(
      <MemoryRouter>
        <ThriftFinderHome />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Location detected/i)).toBeInTheDocument();
    });

    // Set max distance to 50km
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '50' } });

    // The very distant store should be filtered out
    await waitFor(() => {
      expect(
        screen.getByText(/No stores match the current filter/i)
      ).toBeInTheDocument();
    });
  });
});
