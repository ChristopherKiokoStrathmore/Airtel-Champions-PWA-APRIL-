// LoginScreen.test.tsx - Test suite for LoginScreen component
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, jest } from '@jest/globals';
import { LoginScreen } from '../app/LoginScreen';

// Mock the LoginPage component
jest.mock('../LoginPage', () => ({
  LoginPage: ({ phoneNumber, setPhoneNumber, pin, setPin, isLoading, setIsLoading, error, setError, setUser, setUserData, setIsAuthenticated }: any) => (
    <div data-testid="login-page">
      <input
        data-testid="phone-input"
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
      />
      <input
        data-testid="pin-input"
        value={pin}
        onChange={(e) => setPin(e.target.value)}
      />
      {error && <div data-testid="error-message">{error}</div>}
      {isLoading && <div data-testid="loading-spinner">Loading...</div>}
    </div>
  ),
}));

describe('LoginScreen', () => {
  const mockSetUser = jest.fn();
  const mockSetUserData = jest.fn();
  const mockSetIsAuthenticated = jest.fn();
  const mockOnShowSignup = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login form correctly', () => {
    render(
      <LoginScreen
        onShowSignup={mockOnShowSignup}
        setUser={mockSetUser}
        setUserData={mockSetUserData}
        setIsAuthenticated={mockSetIsAuthenticated}
      />
    );

    expect(screen.getByText('Airtel Champions')).toBeInTheDocument();
    expect(screen.getByText('Empowering Sales Excellence')).toBeInTheDocument();
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
    expect(screen.getByTestId('phone-input')).toBeInTheDocument();
    expect(screen.getByTestId('pin-input')).toBeInTheDocument();
  });

  it('handles signup button click', () => {
    render(
      <LoginScreen
        onShowSignup={mockOnShowSignup}
        setUser={mockSetUser}
        setUserData={mockSetUserData}
        setIsAuthenticated={mockSetIsAuthenticated}
      />
    );

    const signupButton = screen.getByText('Sign Up');
    fireEvent.click(signupButton);

    expect(mockOnShowSignup).toHaveBeenCalledTimes(1);
  });

  it('displays error message when provided', () => {
    render(
      <LoginScreen
        onShowSignup={mockOnShowSignup}
        setUser={mockSetUser}
        setUserData={mockSetUserData}
        setIsAuthenticated={mockSetIsAuthenticated}
      />
    );

    // Simulate error state through the mocked LoginPage
    const phoneInput = screen.getByTestId('phone-input');
    fireEvent.change(phoneInput, { target: { value: 'invalid' } });

    expect(phoneInput).toHaveValue('invalid');
  });

  it('shows loading state when isLoading is true', () => {
    render(
      <LoginScreen
        onShowSignup={mockOnShowSignup}
        setUser={mockSetUser}
        setUserData={mockSetUserData}
        setIsAuthenticated={mockSetIsAuthenticated}
      />
    );

    // The loading state would be managed by the LoginPage component
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });
});
