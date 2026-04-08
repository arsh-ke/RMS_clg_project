import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken'));

  const api = axios.create({
    baseURL: `${API_URL}/api`,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      
      console.error('[API] Response error:', error.response?.status, error.response?.data);
      
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          try {
            console.log('[API] Attempting to refresh token...');
            const response = await axios.post(`${API_URL}/api/auth/refresh-token`, {
              refreshToken,
            });
            
            const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.data;
            
            localStorage.setItem('accessToken', newAccessToken);
            localStorage.setItem('refreshToken', newRefreshToken);
            setAccessToken(newAccessToken);
            
            console.log('[API] Token refreshed successfully');
            
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return api(originalRequest);
          } catch (refreshError) {
            console.error('[API] Token refresh failed:', refreshError);
            logout();
            return Promise.reject(refreshError);
          }
        }
      }
      
      return Promise.reject(error);
    }
  );

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        console.log('[AUTH] Initializing auth with existing token');
        try {
          const response = await api.get('/auth/me');
          console.log('[AUTH] Initialized with user:', response.data.data.id);
          setUser(response.data.data);
        } catch (error) {
          console.warn('[AUTH] Init failed, clearing auth:', error.response?.status);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          setUser(null);
        }
      } else {
        console.log('[AUTH] No token found, starting without auth');
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    console.log('[AUTH] Login attempt for:', email);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user: userData, accessToken: token, refreshToken } = response.data.data;
      
      console.log('[AUTH] Login successful for user:', userData.id);
      
      localStorage.setItem('accessToken', token);
      localStorage.setItem('refreshToken', refreshToken);
      setAccessToken(token);
      setUser(userData);
      
      return userData;
    } catch (error) {
      console.error('[AUTH] Login failed:', error.response?.data?.message || error.message);
      throw error;
    }
  };

  const register = async (userData) => {
    console.log('[AUTH] Register attempt for:', userData.email);
    try {
      const response = await api.post('/auth/register', userData);
      const { user: newUser, accessToken: token, refreshToken } = response.data.data;
      
      console.log('[AUTH] Registration successful for user:', newUser.id);
      
      localStorage.setItem('accessToken', token);
      localStorage.setItem('refreshToken', refreshToken);
      setAccessToken(token);
      setUser(newUser);
      
      return newUser;
    } catch (error) {
      console.error('[AUTH] Register failed:', error.response?.data?.message || error.message);
      throw error;
    }
  };

  const logout = () => {
    console.log('[AUTH] Logging out user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setAccessToken(null);
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    api,
    accessToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
