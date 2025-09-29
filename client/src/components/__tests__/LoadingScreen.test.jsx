import React from 'react';
import { render, screen, act } from '@testing-library/react';
import LoadingScreen from '../LoadingScreen';

jest.useFakeTimers();

describe('LoadingScreen', () => {
  let containerRefMock;
  let logoRefMock;

  beforeEach(() => {
    jest.clearAllTimers();

    containerRefMock = {
      current: {
        clientWidth: 800,
        clientHeight: 600,
      },
    };

    logoRefMock = {
      current: {
        offsetWidth: 100,
        offsetHeight: 50,
      },
    };

    // Mock refs by overriding useRef
    jest
      .spyOn(React, 'useRef')
      .mockImplementationOnce(() => containerRefMock)
      .mockImplementationOnce(() => logoRefMock);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders overlay with loading text', () => {
    render(<LoadingScreen />);
    expect(screen.getByText('LOADING...')).toBeInTheDocument();
  });

  it('renders default text logo when no logoSrc provided', () => {
    render(<LoadingScreen />);
    expect(screen.getByText('LOGO')).toBeInTheDocument();
  });

  it('renders image logo when logoSrc is provided', () => {
    render(<LoadingScreen logoSrc="logo.png" />);
    const img = screen.getByAltText('Logo');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'logo.png');
  });

  it('positions logo according to state', () => {
    render(<LoadingScreen />);
    const logo = screen.getByText('LOGO').parentElement;
    expect(logo).toHaveStyle({
      left: '50px',
      top: '50px',
    });
  });

  it('bounces logo within container boundaries', () => {
    render(<LoadingScreen />);

    const initialPosition = { x: 50, y: 50 };
    const velocity = { x: 2, y: 1.5 };

    const animateFrames = 10;

    for (let i = 0; i < animateFrames; i++) {
      act(() => {
        jest.advanceTimersByTime(16); // simulate animation frame
      });
    }

    const logo = screen.getByText('LOGO').parentElement;
    // Logo should stay within container bounds
    expect(logo.offsetLeft + logo.offsetWidth).toBeLessThanOrEqual(
      containerRefMock.current.clientWidth
    );
    expect(logo.offsetTop + logo.offsetHeight).toBeLessThanOrEqual(
      containerRefMock.current.clientHeight
    );
    expect(logo.offsetLeft).toBeGreaterThanOrEqual(0);
    expect(logo.offsetTop).toBeGreaterThanOrEqual(0);
  });

  it('does not render when isLoading is false', () => {
    const { container } = render(<LoadingScreen isLoading={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('applies custom logoText', () => {
    render(<LoadingScreen logoText="MyLogo" />);
    expect(screen.getByText('MyLogo')).toBeInTheDocument();
  });

  it('cleans up interval on unmount', () => {
    const { unmount } = render(<LoadingScreen />);
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
    unmount();
    expect(clearIntervalSpy).toHaveBeenCalled();
  });
});
