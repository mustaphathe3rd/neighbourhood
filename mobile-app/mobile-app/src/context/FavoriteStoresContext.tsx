import React, { createContext, useState, ReactNode, useContext, useEffect } from 'react';
import apiClient from '../api/client';
import { AuthContext } from './AuthContext';

type Store = { id: number; name: string };
type FavoriteStoresContextType = {
  favoriteIds: Set<number>;
  addFavorite: (storeId: number) => void;
  removeFavorite: (storeId: number) => void;
};

export const FavoriteStoresContext = createContext<FavoriteStoresContextType>({} as FavoriteStoresContextType);

export const FavoriteStoresProvider = ({ children }: { children: ReactNode }) => {
  const { userToken } = useContext(AuthContext);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());

  const fetchFavorites = async () => {
    if (!userToken) return;
    try {
      const response = await apiClient.get('/favorites/stores', {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      const ids = new Set(response.data.map((store: Store) => store.id));
      setFavoriteIds(ids);
    } catch (error) {
      console.error("Failed to fetch favorites on load", error);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, [userToken]);

  const addFavorite = async (storeId: number) => {
    try {
      await apiClient.post(`/favorites/stores/${storeId}`, {}, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      setFavoriteIds(prevIds => new Set(prevIds).add(storeId));
    } catch (error) {
      console.error("Failed to add favorite", error);
    }
  };

  const removeFavorite = async (storeId: number) => {
    try {
      await apiClient.delete(`/favorites/stores/${storeId}`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      setFavoriteIds(prevIds => {
        const newIds = new Set(prevIds);
        newIds.delete(storeId);
        return newIds;
      });
    } catch (error) {
      console.error("Failed to remove favorite", error);
    }
  };

  return (
    <FavoriteStoresContext.Provider value={{ favoriteIds, addFavorite, removeFavorite }}>
      {children}
    </FavoriteStoresContext.Provider>
  );
};