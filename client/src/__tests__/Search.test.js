
import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import SearchPage from '../pages/customer/Search';
import { MemoryRouter } from 'react-router-dom';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(() => mockNavigate),
}));

// Mock fetch
global.fetch = jest.fn();

describe('SearchPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockClear();
  });

  it('renders navbar', async () => {
    fetch
      .mockResolvedValueOnce({ ok: true, json: async () => [] }) // stores
      .mockResolvedValueOnce({ ok: true, json: async () => [] }); // items

    await act(async () => {
      render(
        <MemoryRouter>
          <SearchPage />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('ThriftFinder')).toBeInTheDocument();
    });

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Search')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('navigates when navbar buttons are clicked', async () => {
    fetch
      .mockResolvedValueOnce({ ok: true, json: async () => [] }) // stores
      .mockResolvedValueOnce({ ok: true, json: async () => [] }); // items

    await act(async () => {
      render(
        <MemoryRouter>
          <SearchPage />
        </MemoryRouter>
      );
    });

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('ThriftFinder')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('ThriftFinder'));
    expect(mockNavigate).toHaveBeenCalledWith('/');

    fireEvent.click(screen.getByText('Home'));
    expect(mockNavigate).toHaveBeenCalledWith('/');

    fireEvent.click(screen.getByText('Search'));
    expect(mockNavigate).toHaveBeenCalledWith('/search');

    fireEvent.click(screen.getByText('Profile'));
    expect(mockNavigate).toHaveBeenCalledWith('/profile');
  });

  it('shows loading state initially', () => {
    // Never resolve fetch immediately
    fetch.mockImplementation(() => new Promise(() => {}));

    render(
      <MemoryRouter>
        <SearchPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Loading items.../i)).toBeInTheDocument();
  });

  it('renders stores and items when fetch succeeds', async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { storeId: '1', storeName: 'Test Store', address: '123 Street' },
        ],
      }) // stores
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: '1',
            name: 'Test Item',
            category: 'tops',
            style: 'y2k',
            department: "women's",
            price: 100,
            status: 'Available',
          },
        ],
      }); // items

    await act(async () => {
      render(
        <MemoryRouter>
          <SearchPage />
        </MemoryRouter>
      );
    });

    // First wait for items to load (they show by default)
    expect(await screen.findByText(/Test Item/i)).toBeInTheDocument();

    // For stores to show, we need a search term
    const searchInput = screen.getByPlaceholderText(
      /Search for stores or items/i
    );

    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'Test' } });
    });

    // Wait for stores to render after search
    await waitFor(() => {
      expect(screen.getByText(/Test Store/i)).toBeInTheDocument();
    });
  });

  it('filters items based on search term', async () => {
    fetch
      .mockResolvedValueOnce({ ok: true, json: async () => [] }) // stores
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: '1',
            name: 'Red Shirt',
            category: 'shirts',
            style: 'y2k',
            department: "men's",
            price: 150,
            status: 'Available',
          },
          {
            id: '2',
            name: 'Blue Pants',
            category: 'pants',
            style: 'streetwear',
            department: "women's",
            price: 200,
            status: 'Available',
          },
        ],
      }); // items

    await act(async () => {
      render(
        <MemoryRouter>
          <SearchPage />
        </MemoryRouter>
      );
    });

    const searchInput = await screen.findByPlaceholderText(
      /Search for stores or items/i
    );

    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'Red' } });
    });

    await waitFor(() => {
      expect(screen.getByText(/Red Shirt/i)).toBeInTheDocument();
      expect(screen.queryByText(/Blue Pants/i)).not.toBeInTheDocument();
    });
  });

  it('applies category, style, department, and price filters', async () => {
    fetch
      .mockResolvedValueOnce({ ok: true, json: async () => [] }) // stores
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: '1',
            name: 'Item1',
            category: 'tops',
            style: 'y2k',
            department: "women's",
            price: 50,
            status: 'Available',
          },
          {
            id: '2',
            name: 'Item2',
            category: 'shirts',
            style: 'grunge',
            department: "men's",
            price: 150,
            status: 'Available',
          },
        ],
      }); // items

    await act(async () => {
      render(
        <MemoryRouter>
          <SearchPage />
        </MemoryRouter>
      );
    });

    // Wait for component to load and items to be displayed
    await waitFor(() => {
      expect(screen.getByText(/All Items/i)).toBeInTheDocument();
    });

    // Use more specific selectors for the dropdowns
    const selects = screen.getAllByRole('combobox');
    const categorySelect = selects[0]; // First select is category
    const styleSelect = selects[1]; // Second select is style
    const departmentSelect = selects[2]; // Third select is department

    // Find price inputs by placeholder text
    const minPriceInput = screen.getByPlaceholderText('Min');
    const maxPriceInput = screen.getByPlaceholderText('Max');

    await act(async () => {
      fireEvent.change(categorySelect, { target: { value: 'tops' } });
      fireEvent.change(styleSelect, { target: { value: 'y2k' } });
      fireEvent.change(departmentSelect, { target: { value: "women's" } });
      fireEvent.change(minPriceInput, { target: { value: '0' } });
      fireEvent.change(maxPriceInput, { target: { value: '100' } });
    });

    await waitFor(() => {
      expect(screen.getByText(/Item1/i)).toBeInTheDocument();
      expect(screen.queryByText(/Item2/i)).not.toBeInTheDocument();
    });
  });

  it('clears all filters when clear button is clicked', async () => {
    fetch
      .mockResolvedValueOnce({ ok: true, json: async () => [] }) // stores
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: '1',
            name: 'Item1',
            category: 'tops',
            style: 'y2k',
            department: "women's",
            price: 50,
            status: 'Available',
          },
        ],
      }); // items

    await act(async () => {
      render(
        <MemoryRouter>
          <SearchPage />
        </MemoryRouter>
      );
    });

    const searchInput = await screen.findByPlaceholderText(
      /Search for stores or items/i
    );

    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'Nonexistent' } });
    });

    await waitFor(() => {
      expect(screen.getByText(/No results found/i)).toBeInTheDocument();
    });

    const clearButton = screen.getByText(/Clear All Filters/i);

    await act(async () => {
      fireEvent.click(clearButton);
    });

    await waitFor(() => {
      expect(searchInput.value).toBe('');
    });
  });

  it('navigates to item detail when an item is clicked', async () => {
    fetch
      .mockResolvedValueOnce({ ok: true, json: async () => [] }) // stores
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: '1',
            name: 'Clickable Item',
            category: 'tops',
            style: 'y2k',
            department: "women's",
            price: 50,
            status: 'Available',
          },
        ],
      }); // items

    await act(async () => {
      render(
        <MemoryRouter>
          <SearchPage />
        </MemoryRouter>
      );
    });

    const itemCard = await screen.findByText(/Clickable Item/i);

    await act(async () => {
      fireEvent.click(itemCard.closest('div.cursor-pointer'));
    });

    expect(mockNavigate).toHaveBeenCalledWith('/Item/1');
  });

  it('shows no results message when filters exclude all items', async () => {
    fetch
      .mockResolvedValueOnce({ ok: true, json: async () => [] }) // stores
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: '1',
            name: 'Item1',
            category: 'tops',
            style: 'y2k',
            department: "women's",
            price: 50,
            status: 'Available',
          },
        ],
      }); // items

    await act(async () => {
      render(
        <MemoryRouter>
          <SearchPage />
        </MemoryRouter>
      );
    });

    const searchInput = await screen.findByPlaceholderText(
      /Search for stores or items/i
    );

    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'Nonexistent' } });
    });

    await waitFor(() => {
      expect(screen.getByText(/No results found/i)).toBeInTheDocument();
    });
  });
});
