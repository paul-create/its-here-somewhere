import React, { createContext, useState } from 'react';

interface AuthContextType {
  token: string | null;
  homeId: string | null;
  login: (email: string, password: string) => Promise<{ homeId: string | null }>;
  loginWithHome: (homeId: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: any) {
  const [token, setToken] = useState<string | null>(null);
  const [homeId, setHomeId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('http://192.168.1.146:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        // Friendly error messages
        if (response.status === 401) {
          throw new Error('Hmm, that didn\'t work. Double-check your email and password?');
        }
        throw new Error(data.message || 'Login failed');
      }

      const data = await response.json();
      // Don't log the token or userId
      console.log('Login successful');
      
      setToken(data.token);
      setHomeId(data.homeId || null);

      return { homeId: data.homeId || null };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Login failed';
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithHome = async (homeId: string) => {
    setHomeId(homeId);
  };

  const logout = () => {
    setToken(null);
    setHomeId(null);  
    setError(null);
  };

  return (
    <AuthContext.Provider value={{ token, homeId, login, loginWithHome, logout, isLoading, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}