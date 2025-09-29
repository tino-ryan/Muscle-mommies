import React from 'react';
import { render, screen } from '@testing-library/react';
import StarRating from '../StarRating';

describe('StarRating', () => {
  it('renders correct number of full, half, and empty stars for integer rating', () => {
    render(<StarRating rating={3} />);

    const filledStars = screen.getAllByText('★', { selector: '.star.filled' });
    const emptyStars = screen.getAllByText('★', { selector: '.star.empty' });
    const halfStars = screen.queryAllByText('★', { selector: '.star.half' });

    expect(filledStars).toHaveLength(3);
    expect(emptyStars).toHaveLength(2);
    expect(halfStars).toHaveLength(0);
  });

  it('renders a half star for decimal rating >= 0.5', () => {
    render(<StarRating rating={3.5} />);

    const filledStars = screen.getAllByText('★', { selector: '.star.filled' });
    const halfStars = screen.getAllByText('★', { selector: '.star.half' });
    const emptyStars = screen.getAllByText('★', { selector: '.star.empty' });

    expect(filledStars).toHaveLength(3);
    expect(halfStars).toHaveLength(1);
    expect(emptyStars).toHaveLength(1); // 5 - 4 = 1
  });

  it('renders all empty stars when rating is 0', () => {
    render(<StarRating rating={0} />);

    const emptyStars = screen.getAllByText('★', { selector: '.star.empty' });
    const filledStars = screen.queryAllByText('★', {
      selector: '.star.filled',
    });
    const halfStars = screen.queryAllByText('★', { selector: '.star.half' });

    expect(emptyStars).toHaveLength(5);
    expect(filledStars).toHaveLength(0);
    expect(halfStars).toHaveLength(0);
    expect(screen.getByText('No rating')).toBeInTheDocument();
  });

  it('displays review count correctly', () => {
    render(<StarRating rating={4.5} reviewCount={3} />);

    expect(screen.getByText('(3 reviews)')).toBeInTheDocument();
  });

  it('uses singular "review" when reviewCount is 1', () => {
    render(<StarRating rating={4.5} reviewCount={1} />);
    expect(screen.getByText('(1 review)')).toBeInTheDocument();
  });

  it('does not display review count if showCount is false', () => {
    render(<StarRating rating={4.5} reviewCount={5} showCount={false} />);
    expect(screen.queryByText(/\(\d+ review/)).not.toBeInTheDocument();
  });

  it('applies custom size and className', () => {
    const { container } = render(
      <StarRating rating={5} size="large" className="custom-class" />
    );
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('star-rating');
    expect(wrapper).toHaveClass('large');
    expect(wrapper).toHaveClass('custom-class');
  });

  it('handles rating with no reviews', () => {
    render(<StarRating rating={4} reviewCount={0} />);
    expect(screen.queryByText(/\(\d+ review/)).not.toBeInTheDocument();
  });
});
