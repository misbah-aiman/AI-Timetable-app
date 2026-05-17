import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';
import { authApi } from '../services/api';
import { storage } from '../utils/localStorage';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  login: () => {},
  logout: () => {},
  updateUser: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(storage.getUser());
  const [token, setToken] = useState<string | null>(storage.getToken());
  const [loading, setLoading] = useState(true);

  // Validate token on app mount
  useEffect(() => {
    const validate = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await authApi.getMe();
        setUser(res.data.user);
        storage.setUser(res.data.user);
      } catch {
        // Token is invalid — clear everything
        storage.clearAll();
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };
    validate();
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const login = (newToken: string, newUser: User) => {
    storage.setToken(newToken);
    storage.setUser(newUser);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    storage.clearAll();
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    storage.setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
