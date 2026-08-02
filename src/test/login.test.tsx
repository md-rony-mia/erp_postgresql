import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Login from '../components/Login';
import { AppSettings } from '../types';

// Mock the Postgres-backed auth client
const mockSignIn = vi.fn();
const mockSignOutUser = vi.fn();

vi.mock('../lib/dataClient', () => ({
  signIn: (...args: any[]) => mockSignIn(...args),
  signOutUser: (...args: any[]) => mockSignOutUser(...args),
}));

describe('Login Component Smoke Tests', () => {
  const mockSettings = {
    usersList: [
      { id: '1', name: 'Rony Mia', username: 'admin_rony', email: 'ronymia2022@gmail.com', role: 'Administrator', status: 'Active', avatar: 'RM' },
    ],
  } as AppSettings;

  const mockOnLoginSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login credentials fields and submit buttons', () => {
    render(<Login settings={mockSettings} onLoginSuccess={mockOnLoginSuccess} />);

    expect(screen.getByPlaceholderText('Enter username or email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });

  it('displays validation error if username or password are omitted', async () => {
    render(<Login settings={mockSettings} onLoginSuccess={mockOnLoginSuccess} />);

    const submitBtn = screen.getByRole('button', { name: /Sign In/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/Username or Email is required/i)).toBeInTheDocument();
  });

  it('signs in successfully with the entered identifier and invokes success callback with the returned profile', async () => {
    mockSignIn.mockResolvedValueOnce({
      user: {
        uid: 'user-uid-abc',
        name: 'Rony Mia',
        email: 'ronymia2022@gmail.com',
        role: 'Administrator',
        status: 'Active',
      },
    });

    render(<Login settings={mockSettings} onLoginSuccess={mockOnLoginSuccess} />);

    fireEvent.change(screen.getByPlaceholderText('Enter username or email'), {
      target: { value: 'admin_rony' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
      target: { value: 'secretPass123' },
    });

    const submitBtn = screen.getByRole('button', { name: /Sign In/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      // The backend resolves username-or-email itself, so the raw identifier is passed through
      expect(mockSignIn).toHaveBeenCalledWith('admin_rony', 'secretPass123');
      expect(mockOnLoginSuccess).toHaveBeenCalledWith({
        uid: 'user-uid-abc',
        name: 'Rony Mia',
        email: 'ronymia2022@gmail.com',
        role: 'Administrator',
        status: 'Active',
      });
    });
  });

  it('displays wrong password error on authentication failure', async () => {
    mockSignIn.mockRejectedValueOnce({
      code: 'auth/wrong-password',
    });

    render(<Login settings={mockSettings} onLoginSuccess={mockOnLoginSuccess} />);

    fireEvent.change(screen.getByPlaceholderText('Enter username or email'), {
      target: { value: 'admin_rony' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
      target: { value: 'wrong-pass' },
    });

    const submitBtn = screen.getByRole('button', { name: /Sign In/i });
    fireEvent.click(submitBtn);

    expect(
      await screen.findByText(/Incorrect password or invalid credentials/i)
    ).toBeInTheDocument();
    expect(mockOnLoginSuccess).not.toHaveBeenCalled();
  });
});
