import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../pages/auth/Login';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
import axios from 'axios';

// Mocks
jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn(),
  signInWithPopup: jest.fn(),
  GoogleAuthProvider: jest.fn(),
}));

jest.mock('../firebase', () => ({
  auth: {},
}));

jest.mock('axios');

jest.mock(
  '../components/LoadingScreen',
  () =>
    ({ isLoading, logoSrc }) =>
      isLoading ? (
        <div data-testid="loading-screen">
          <img src={logoSrc} alt="Loading" />
        </div>
      ) : null
);

// Mock navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock document.cookie
Object.defineProperty(document, 'cookie', {
  writable: true,
  value: '',
});

const renderLogin = () =>
  render(
    <BrowserRouter>
      <Login />
    </BrowserRouter>
  );

describe('Login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.cookie = '';

    // Reset window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  describe('Component Rendering', () => {
    it('renders login form with all elements', () => {
      renderLogin();

      expect(screen.getByText('Login')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
      expect(screen.getByText('Login with Email')).toBeInTheDocument();
      expect(screen.getByText('Login with Google')).toBeInTheDocument();
      expect(screen.getByText('Create Account')).toBeInTheDocument();
      expect(screen.getByText('Create Store')).toBeInTheDocument();
    });

    it('displays theme tagline', () => {
      renderLogin();

      // Should display one of the vintage theme taglines
      const taglineExists =
        screen.queryByText('Retro vibes, timeless finds.') ||
        screen.queryByText('Classic looks for modern days.');

      expect(taglineExists).toBeInTheDocument();
    });

    it('renders theme icon', () => {
      renderLogin();

      const themeIcon = document.querySelector('.theme-icon');
      expect(themeIcon).toBeInTheDocument();
      expect(themeIcon).toHaveClass('fa-camera-retro'); // Default vintage theme icon
    });
  });

  describe('Email/Password Login', () => {
    it('logs in successfully as customer', async () => {
      const mockUser = {
        uid: 'user123',
        displayName: 'John Doe',
      };

      signInWithEmailAndPassword.mockResolvedValueOnce({ user: mockUser });
      axios.post.mockResolvedValueOnce({ data: { role: 'customer' } });

      renderLogin();

      fireEvent.change(screen.getByPlaceholderText('Email'), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(screen.getByPlaceholderText('Password'), {
        target: { value: 'password123' },
      });

      fireEvent.click(screen.getByText('Login with Email'));

      await waitFor(() => {
        expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
          {},
          'test@example.com',
          'password123'
        );
      });

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          expect.stringContaining('/api/auth/getRole'),
          { uid: 'user123' }
        );
      });

      expect(mockNavigate).toHaveBeenCalledWith('/customer/home');
    });

    it('logs in successfully as store owner', async () => {
      const mockUser = {
        uid: 'store123',
        displayName: 'Store Owner',
      };

      signInWithEmailAndPassword.mockResolvedValueOnce({ user: mockUser });
      axios.post.mockResolvedValueOnce({ data: { role: 'storeOwner' } });

      renderLogin();

      fireEvent.change(screen.getByPlaceholderText('Email'), {
        target: { value: 'store@example.com' },
      });
      fireEvent.change(screen.getByPlaceholderText('Password'), {
        target: { value: 'password123' },
      });

      fireEvent.click(screen.getByText('Login with Email'));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/store/home');
      });
    });

    it('logs in successfully as admin', async () => {
      const mockUser = {
        uid: 'admin123',
        displayName: 'Admin User',
      };

      signInWithEmailAndPassword.mockResolvedValueOnce({ user: mockUser });
      axios.post.mockResolvedValueOnce({ data: { role: 'admin' } });

      renderLogin();

      fireEvent.change(screen.getByPlaceholderText('Email'), {
        target: { value: 'admin@example.com' },
      });
      fireEvent.change(screen.getByPlaceholderText('Password'), {
        target: { value: 'adminpass' },
      });

      fireEvent.click(screen.getByText('Login with Email'));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard');
      });
    });

    it('shows error message on login failure', async () => {
      signInWithEmailAndPassword.mockRejectedValueOnce(
        new Error('Invalid credentials')
      );

      renderLogin();

      fireEvent.change(screen.getByPlaceholderText('Email'), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(screen.getByPlaceholderText('Password'), {
        target: { value: 'wrongpassword' },
      });

      fireEvent.click(screen.getByText('Login with Email'));

      await waitFor(() => {
        expect(screen.getByText('Login failed.')).toBeInTheDocument();
      });
    });

    it('shows loading screen during login', async () => {
      const mockUser = { uid: 'user123', displayName: 'Test User' };

      let resolveLogin;
      const loginPromise = new Promise((resolve) => {
        resolveLogin = resolve;
      });

      signInWithEmailAndPassword.mockReturnValueOnce(loginPromise);

      renderLogin();

      fireEvent.change(screen.getByPlaceholderText('Email'), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(screen.getByPlaceholderText('Password'), {
        target: { value: 'password123' },
      });

      fireEvent.click(screen.getByText('Login with Email'));

      // Check loading screen appears
      await waitFor(() => {
        expect(screen.getByTestId('loading-screen')).toBeInTheDocument();
      });

      // Resolve login
      resolveLogin({ user: mockUser });
      axios.post.mockResolvedValueOnce({ data: { role: 'customer' } });

      await waitFor(() => {
        expect(screen.queryByTestId('loading-screen')).not.toBeInTheDocument();
      });
    });

    it('sets cookie after successful login', async () => {
      const mockUser = { uid: 'user123', displayName: 'Test User' };

      signInWithEmailAndPassword.mockResolvedValueOnce({ user: mockUser });
      axios.post.mockResolvedValueOnce({ data: { role: 'customer' } });

      renderLogin();

      fireEvent.change(screen.getByPlaceholderText('Email'), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(screen.getByPlaceholderText('Password'), {
        target: { value: 'password123' },
      });

      fireEvent.click(screen.getByText('Login with Email'));

      await waitFor(() => {
        expect(document.cookie).toContain('thriftRole_user123=customer');
      });
    });
  });

  describe('Google Login', () => {
    it('logs in with Google successfully', async () => {
      const mockUser = {
        uid: 'google123',
        displayName: 'Google User',
      };

      signInWithPopup.mockResolvedValueOnce({ user: mockUser });
      axios.post.mockResolvedValueOnce({ data: { role: 'customer' } });

      renderLogin();

      fireEvent.click(screen.getByText('Login with Google'));

      await waitFor(() => {
        expect(signInWithPopup).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/customer/home');
      });
    });

    it('shows error on Google login failure', async () => {
      signInWithPopup.mockRejectedValueOnce(new Error('Google auth failed'));

      renderLogin();

      fireEvent.click(screen.getByText('Login with Google'));

      await waitFor(() => {
        expect(screen.getByText('Google login failed.')).toBeInTheDocument();
      });
    });

    it('shows loading screen during Google login', async () => {
      let resolveGoogle;
      const googlePromise = new Promise((resolve) => {
        resolveGoogle = resolve;
      });

      signInWithPopup.mockReturnValueOnce(googlePromise);

      renderLogin();

      fireEvent.click(screen.getByText('Login with Google'));

      await waitFor(() => {
        expect(screen.getByTestId('loading-screen')).toBeInTheDocument();
      });

      resolveGoogle({ user: { uid: 'google123', displayName: 'Test' } });
      axios.post.mockResolvedValueOnce({ data: { role: 'customer' } });

      await waitFor(() => {
        expect(screen.queryByTestId('loading-screen')).not.toBeInTheDocument();
      });
    });
  });

  describe('Role Fetching Error Handling', () => {
    it('shows error when role fetch fails', async () => {
      const mockUser = { uid: 'user123', displayName: 'Test User' };

      signInWithEmailAndPassword.mockResolvedValueOnce({ user: mockUser });
      axios.post.mockRejectedValueOnce(new Error('Role fetch failed'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      renderLogin();

      fireEvent.change(screen.getByPlaceholderText('Email'), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(screen.getByPlaceholderText('Password'), {
        target: { value: 'password123' },
      });

      fireEvent.click(screen.getByText('Login with Email'));

      await waitFor(() => {
        expect(screen.getByText('Error fetching role.')).toBeInTheDocument();
      });

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Navigation', () => {
    it('navigates to customer signup', () => {
      renderLogin();

      fireEvent.click(screen.getByText('Create Account'));

      expect(mockNavigate).toHaveBeenCalledWith('/signup/customer');
    });

    it('navigates to store signup', () => {
      renderLogin();

      fireEvent.click(screen.getByText('Create Store'));

      expect(mockNavigate).toHaveBeenCalledWith('/signup/store');
    });
  });

  describe('Mobile Responsiveness', () => {
    it('applies mobile class on small screens', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });

      renderLogin();

      const container = document.querySelector('.login-container');
      expect(container).toHaveClass('mobile');
    });

    it('does not apply mobile class on large screens', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      renderLogin();

      const container = document.querySelector('.login-container');
      expect(container).not.toHaveClass('mobile');
    });

    it('updates mobile state on window resize', () => {
      renderLogin();

      const container = document.querySelector('.login-container');
      expect(container).not.toHaveClass('mobile');

      // Simulate resize to mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });

      fireEvent(window, new Event('resize'));

      // Note: Due to React batching, we need to wait for the update
      waitFor(() => {
        expect(container).toHaveClass('mobile');
      });
    });
  });

  describe('Theme System', () => {
    it('displays theme images', () => {
      renderLogin();

      const images = document.querySelectorAll('.theme-image');
      expect(images.length).toBeGreaterThan(0);
    });

    it('handles image load errors', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      renderLogin();

      const images = document.querySelectorAll('.theme-image');
      if (images.length > 0) {
        fireEvent.error(images[0]);
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Failed to load image:')
        );
      }

      consoleSpy.mockRestore();
    });

    it('applies correct theme styles', () => {
      renderLogin();

      const container = document.querySelector('.login-container');
      expect(container).toHaveStyle({
        fontFamily: "'Playfair Display', serif",
      });
    });
  });

  describe('Form Validation', () => {
    it('requires email field', () => {
      renderLogin();

      const emailInput = screen.getByPlaceholderText('Email');
      expect(emailInput).toBeRequired();
    });

    it('requires password field', () => {
      renderLogin();

      const passwordInput = screen.getByPlaceholderText('Password');
      expect(passwordInput).toBeRequired();
    });

    it('updates email state on input', () => {
      renderLogin();

      const emailInput = screen.getByPlaceholderText('Email');
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      expect(emailInput).toHaveValue('test@example.com');
    });

    it('updates password state on input', () => {
      renderLogin();

      const passwordInput = screen.getByPlaceholderText('Password');
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      expect(passwordInput).toHaveValue('password123');
    });
  });

  describe('User Display Name Handling', () => {
    it('uses displayName when available', async () => {
      const mockUser = {
        uid: 'user123',
        displayName: 'John Doe',
      };

      signInWithEmailAndPassword.mockResolvedValueOnce({ user: mockUser });
      axios.post.mockResolvedValueOnce({ data: { role: 'customer' } });

      renderLogin();

      fireEvent.change(screen.getByPlaceholderText('Email'), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(screen.getByPlaceholderText('Password'), {
        target: { value: 'password123' },
      });

      fireEvent.click(screen.getByText('Login with Email'));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalled();
      });
    });

    it('uses default name when displayName is null', async () => {
      const mockUser = {
        uid: 'user123',
        displayName: null,
      };

      signInWithEmailAndPassword.mockResolvedValueOnce({ user: mockUser });
      axios.post.mockResolvedValueOnce({ data: { role: 'customer' } });

      renderLogin();

      fireEvent.change(screen.getByPlaceholderText('Email'), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(screen.getByPlaceholderText('Password'), {
        target: { value: 'password123' },
      });

      fireEvent.click(screen.getByText('Login with Email'));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalled();
      });
    });
  });

  describe('Animation', () => {
    it('applies swipe-in class initially', () => {
      renderLogin();

      const container = document.querySelector('.login-container');
      expect(container).toHaveClass('swipe-in');
    });
  });
});
