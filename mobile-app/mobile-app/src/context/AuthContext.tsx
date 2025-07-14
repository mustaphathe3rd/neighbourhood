import React, { createContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

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

  // Helper function to save the token
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
    setIsLoading(true);
    setUserToken(token);
    saveToken(token);
    setIsLoading(false);
  };

  const logout = () => {
    setIsLoading(true);
    setUserToken(null);
    saveToken(null);
    setIsLoading(false);
  };

  useEffect(() => {
    const isLoggedIn = async () => {
      try {
        let token: string | null = null;
        if (Platform.OS === 'web') {
          token = localStorage.getItem('userToken');
        } else {
          token = await SecureStore.getItemAsync('userToken');
        }
        setUserToken(token);
      } catch (e) {
        console.log(`isLoggedIn error ${e}`);
      } finally {
        setIsLoading(false);
      }
    };
    isLoggedIn();
  }, []);

  return (
    <AuthContext.Provider value={{ login, logout, isLoading, userToken }}>
      {children}
    </AuthContext.Provider>
  );
};