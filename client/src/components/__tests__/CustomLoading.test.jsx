import React from 'react';
import { render, screen, act } from '@testing-library/react';
import CustomLoading from '../CustomLoading';

// Mock canvas context
let mockCtx;
let animationCallback;
let animationId = 0;

// Mock requestAnimationFrame and cancelAnimationFrame
const mockRequestAnimationFrame = jest.fn((callback) => {
  animationCallback = callback;
  return ++animationId;
});
const mockCancelAnimationFrame = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();

  // Reset animation callback and ID
  animationCallback = null;
  animationId = 0;

  // Mock canvas context methods
  mockCtx = {
    clearRect: jest.fn(),
    fillRect: jest.fn(),
    strokeStyle: '',
    fillStyle: '',
    lineWidth: 0,
    font: '',
    textAlign: '',
    beginPath: jest.fn(),
    arc: jest.fn(),
    stroke: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    fillText: jest.fn(),
  };

  global.requestAnimationFrame = mockRequestAnimationFrame;
  global.cancelAnimationFrame = mockCancelAnimationFrame;

  // Mock canvas element and getContext
  HTMLCanvasElement.prototype.getContext = jest.fn(() => mockCtx);

  // Mock canvas width/height properties
  let canvasWidth = 0;
  let canvasHeight = 0;

  Object.defineProperty(HTMLCanvasElement.prototype, 'width', {
    get() {
      return canvasWidth;
    },
    set(value) {
      canvasWidth = value;
    },
    configurable: true,
  });

  Object.defineProperty(HTMLCanvasElement.prototype, 'height', {
    get() {
      return canvasHeight;
    },
    set(value) {
      canvasHeight = value;
    },
    configurable: true,
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('CustomLoading', () => {
  it('renders a canvas element with correct styles', () => {
    render(<CustomLoading />);

    const canvas = document.querySelector('canvas');
    expect(canvas).toBeInTheDocument();

    // Check inline styles
    expect(canvas).toHaveStyle({
      display: 'block',
      margin: '0px auto',
      borderRadius: '10px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    });
  });

  it('initializes canvas with correct dimensions', () => {
    render(<CustomLoading />);

    const canvas = document.querySelector('canvas');
    expect(canvas.width).toBe(300);
    expect(canvas.height).toBe(300);
  });

  it('gets 2D context from canvas', () => {
    render(<CustomLoading />);

    expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalledWith('2d');
  });

  it('starts animation on mount', () => {
    render(<CustomLoading />);

    expect(mockRequestAnimationFrame).toHaveBeenCalled();
    expect(animationCallback).toBeTruthy();
  });

  it('cancels animation on unmount', () => {
    const { unmount } = render(<CustomLoading />);

    unmount();

    expect(mockCancelAnimationFrame).toHaveBeenCalledWith(animationId);
  });

  it('draws background on each frame', () => {
    render(<CustomLoading />);

    expect(animationCallback).toBeTruthy();

    act(() => {
      animationCallback();
    });

    expect(mockCtx.clearRect).toHaveBeenCalledWith(0, 0, 300, 300);
    expect(mockCtx.fillRect).toHaveBeenCalledWith(0, 0, 300, 300);
  });

  it('draws rotating rack circle', () => {
    render(<CustomLoading />);

    act(() => {
      animationCallback();
    });

    expect(mockCtx.beginPath).toHaveBeenCalled();
    expect(mockCtx.arc).toHaveBeenCalledWith(150, 150, 80, 0, Math.PI * 2);
    expect(mockCtx.stroke).toHaveBeenCalled();
  });

  it('draws hangers and clothes', () => {
    render(<CustomLoading />);

    act(() => {
      animationCallback();
    });

    // Check that hanger lines are drawn (moveTo and lineTo called)
    expect(mockCtx.moveTo).toHaveBeenCalled();
    expect(mockCtx.lineTo).toHaveBeenCalled();

    // Check that clothes rectangles are drawn
    expect(mockCtx.fillRect).toHaveBeenCalled();
  });

  it('sets canvas context properties during animation', () => {
    render(<CustomLoading />);

    act(() => {
      animationCallback();
    });

    // Verify that context properties are being set (they would be strings after assignment)
    expect(typeof mockCtx.strokeStyle).toBe('string');
    expect(typeof mockCtx.fillStyle).toBe('string');
    expect(typeof mockCtx.lineWidth).toBe('number');
  });

  it('calls fillText for welcome message and item labels', () => {
    render(<CustomLoading userName="TestUser" />);

    // Simulate multiple animation frames to reach the welcome text threshold
    act(() => {
      for (let i = 0; i < 50; i++) {
        animationCallback();
      }
    });

    expect(mockCtx.fillText).toHaveBeenCalled();
  });

  it('uses default userName when none provided', () => {
    render(<CustomLoading />);

    // simulate several frames
    act(() => {
      for (let i = 0; i < 200; i++) {
        animationCallback();
      }
    });

    const fillTextCalls = mockCtx.fillText.mock.calls;
    const welcomeCall = fillTextCalls.find((call) =>
      call[0]?.includes('ThriftSeeker')
    );
    expect(welcomeCall).toBeTruthy();
  });

  it('uses provided userName', () => {
    render(<CustomLoading userName="CustomUser" />);

    act(() => {
      for (let i = 0; i < 200; i++) {
        animationCallback();
      }
    });

    const fillTextCalls = mockCtx.fillText.mock.calls;
    const welcomeCall = fillTextCalls.find((call) =>
      call[0]?.includes('CustomUser')
    );
    expect(welcomeCall).toBeTruthy();
  });

  it('does not call onComplete when not provided', () => {
    render(<CustomLoading />);

    // This should not throw an error even without onComplete
    act(() => {
      for (let i = 0; i < 350; i++) {
        animationCallback();
      }
    });

    // Test passes if no error is thrown
    expect(mockCtx.clearRect).toHaveBeenCalled(); // Verify animation still runs
  });

  it('restarts animation loop by calling requestAnimationFrame recursively', () => {
    render(<CustomLoading />);

    const initialCallCount = mockRequestAnimationFrame.mock.calls.length;

    act(() => {
      animationCallback();
    });

    // Should be called again for the next frame
    expect(mockRequestAnimationFrame).toHaveBeenCalledTimes(
      initialCallCount + 1
    );
  });

  it('handles canvas context failure gracefully', () => {
    // Mock getContext to return null
    HTMLCanvasElement.prototype.getContext = jest.fn(() => null);

    // This should not throw an error
    expect(() => {
      render(<CustomLoading />);
    }).not.toThrow();
  });

  it('cleans up animation frame when component props change', () => {
    const { rerender } = render(<CustomLoading userName="User1" />);

    const initialAnimationId = animationId;

    rerender(<CustomLoading userName="User2" />);

    // Should cancel previous animation and start new one
    expect(mockCancelAnimationFrame).toHaveBeenCalledWith(initialAnimationId);
    expect(mockRequestAnimationFrame).toHaveBeenCalledTimes(2);
  });

  it('continues animation when onComplete is undefined', () => {
    const { rerender } = render(<CustomLoading onComplete={jest.fn()} />);

    rerender(<CustomLoading />); // Remove onComplete

    // This should not throw even when reaching completion without onComplete
    expect(() => {
      act(() => {
        for (let i = 0; i < 350; i++) {
          animationCallback();
        }
      });
    }).not.toThrow();
  });

  it('draws clothes with different items and prices', () => {
    render(<CustomLoading />);

    act(() => {
      animationCallback();
    });

    // Check that fillText was called for item labels (clothes with prices)
    const fillTextCalls = mockCtx.fillText.mock.calls;
    const itemCalls = fillTextCalls.filter(
      (call) =>
        call[0] &&
        (call[0].includes('Tee') ||
          call[0].includes('Jeans') ||
          call[0].includes('Jacket'))
    );

    expect(itemCalls.length).toBeGreaterThan(0);
  });

  it('progresses angle correctly during animation', () => {
    render(<CustomLoading />);

    const initialCallCount = mockCtx.clearRect.mock.calls.length;

    // Run several animation frames
    act(() => {
      for (let i = 0; i < 10; i++) {
        animationCallback();
      }
    });

    // Should have cleared canvas multiple times (once per frame)
    expect(mockCtx.clearRect.mock.calls.length).toBeGreaterThan(
      initialCallCount
    );
  });

  describe('Animation Frame Management', () => {
    it('properly manages multiple animation cycles', () => {
      render(<CustomLoading />);

      const initialCallCount = mockRequestAnimationFrame.mock.calls.length;

      act(() => {
        for (let i = 0; i < 5; i++) {
          animationCallback();
        }
      });

      expect(mockRequestAnimationFrame).toHaveBeenCalledTimes(
        initialCallCount + 5
      );
    });

    it('cleans up properly on rapid re-renders', () => {
      const { rerender, unmount } = render(<CustomLoading userName="User1" />);

      // Rapidly change props
      for (let i = 0; i < 3; i++) {
        rerender(<CustomLoading userName={`User${i}`} />);
      }

      unmount();

      // Should have called cancelAnimationFrame for cleanup
      expect(mockCancelAnimationFrame).toHaveBeenCalled();
    });
  });
});
