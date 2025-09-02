import React from 'react';
import { render, screen } from '@testing-library/react';
import Dashboard from '../pages/admin/Dashboard';

describe('AdminDashboard', () => {
  test('renders the main heading', () => {
    render(<Dashboard />);
    expect(screen.getByText('Welcome, Admin! ⚡')).toBeInTheDocument();
  });
});
