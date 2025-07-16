// src/context/AuthContext.tsx
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import apiClient from '@/src/api/client';

type AuthContextType = {
  login: (token: string) => void;
  logout: () => void;
  userToken: string | null;
  isLoading: boolean;
};

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [userToken, setUserToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const saveToken = async (token: string | null) => {
    if (token) {
      if (Platform.OS === 'web') {
        localStorage.setItem('userToken', token);
      } else {
        await SecureStore.setItemAsync('userToken', token);
      }
    } else {
      if (Platform.OS === 'web') {
        localStorage.removeItem('userToken');
      } else {
        await SecureStore.deleteItemAsync('userToken');
      }
    }
  };

  const login = (token: string) => {
    setUserToken(token);
    saveToken(token);
  };

  const logout = () => {
    setUserToken(null);
    saveToken(null);
  };

  useEffect(() => {
     const checkUser = async () => {
      setIsLoading(true);
      try {
        let token;
        if (Platform.OS === 'web') {
            token = localStorage.getItem('userToken');
        } else {
            token = await SecureStore.getItemAsync('userToken');
        }
        setUserToken(token);

        if (token) {
            // --- NEW DEBUGGING STEP ---
            console.log("AuthContext: Found token, attempting to fetch user profile...");
            // This call will test if our token is being sent and validated correctly
            const response = await apiClient.get('/users/me');
            console.log("AuthContext: /users/me response SUCCESS! User:", response.data.email);
        }
      } catch (e: any) {
        console.error("AuthContext: /users/me response FAILED:", e.response?.data || e.message);
        // If this fails with a 401, the token is not being attached correctly.
      } finally {
        setIsLoading(false);
      }
    };
    checkUser();
  }, []);

  return (
    <AuthContext.Provider value={{ login, logout, isLoading, userToken }}>
      {children}
    </AuthContext.Provider>
  );
};