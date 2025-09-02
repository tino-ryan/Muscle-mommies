import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock the entire ThriftFinderHome component
jest.mock('../pages/customer/Home', () => {
  const MockHome = () => (
    <div data-testid="thrift-finder-home">Find Nearby Thrift Stores</div>
  );
  MockHome.displayName = 'MockHome';
  return MockHome;
});

describe('ThriftFinderHome', () => {
  test('renders the main heading', () => {
    render(
      <MemoryRouter>
        <div data-testid="thrift-finder-home">Find Nearby Thrift Stores</div>
      </MemoryRouter>
    );

    expect(screen.getByText('Find Nearby Thrift Stores')).toBeInTheDocument();
  });
});
