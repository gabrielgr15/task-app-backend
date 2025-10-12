'use client';
import React, { createContext, useState, useContext, useEffect } from 'react';

// ... (Interface remains the same)
interface AuthContextType {
  isAuthenticated: boolean;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean, error?: string }>;
  register: (username: string, email: string, password: string) => Promise<{ success: boolean, error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  accessToken: null,
  isLoading: true,
  login: async (_email, _password) => {
     throw new Error('login function must be used within AuthProvider') 
  },
  register: (_username, _email, _password) => {
    throw new Error('register function must be used within AuthProvider')
  },
  logout: () => { throw new Error('logout function must be used within AuthProvider')}  
});


export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const tryRefreshToken = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/auth/refresh`, {
          method: 'POST',
          credentials: 'include'
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Could not refresh token');
        }
        setAccessToken(data.accessToken);
        setIsAuthenticated(true);

      } catch (error) {
        console.log('No valid session found. Hunter is awake.');
      } finally {
        setIsLoading(false);
      }
    };

    tryRefreshToken();
  }, []);

  const register = async (username: string, email: string, password: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.message || 'The covenant was rejected.' };
      }

      setAccessToken(data.accessToken);
      setIsAuthenticated(true);
      return { success: true };

    } catch (error) {
      console.error("Covenant Error:", error);
      return { success: false, error: 'An unknown nightmare occurred.' };
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        // --- FIX: Corrected error message ---
        return { success: false, error: data.message || 'The dream denies entry.' };
      }

      setAccessToken(data.accessToken);
      setIsAuthenticated(true);
      return { success: true };

    } catch (error) {
      console.error("Login Error:", error);
      return { success: false, error: 'An unknown nightmare occurred.' };
    }
  };

  // --- REFORGED LOGOUT FUNCTION ---
  const logout = async () => {
    try {
      // Step 1: Tell the backend to destroy its session cookie.
      await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error("Logout Error: Could not contact backend, but proceeding with client-side logout.", error);
    } finally {
      // Step 2: Always clear the frontend state, even if the backend call fails.
      setAccessToken(null);
      setIsAuthenticated(false);
    }
  };

  const contextValue: AuthContextType = {
    isAuthenticated,
    accessToken,
    isLoading,
    login,
    logout,
    register
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {/* This clever pattern prevents rendering until the initial auth check is done */}
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};