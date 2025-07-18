import React, { createContext, useState, ReactNode, useContext, useCallback, useEffect } from 'react';
import apiClient from '../api/client';
import { AuthContext } from './AuthContext';
import { useFocusEffect } from 'expo-router';

// The shape of a single item in our list
export type ListItem = {
  id: number; // The unique ID of the list item itself
  product_id: number;
  store_id: number;
  quantity: number;
  product_name: string;
  price_at_addition: number;
  image_url?: string;
};

// The shape of the entire shopping list object from the API
type ShoppingList = {
    id: number;
    items: ListItem[];
    total_price: number;
}

// The data needed to add a new item
type NewListItemData = {
  product_id: number;
  store_id: number;
  price: number;
};

type ShoppingListContextType = {
  list: ShoppingList | null;
  addItem: (item: NewListItemData) => Promise<void>;
  updateItemQuantity: (itemId: number, newQuantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  isLoading: boolean;
  refreshList: () => void;
};

export const ShoppingListContext = createContext<ShoppingListContextType>({} as ShoppingListContextType);

export const ShoppingListProvider = ({ children }: { children: ReactNode }) => {
  const [list, setList] = useState<ShoppingList | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { userToken } = useContext(AuthContext);

  const refreshList = async () => {
    if (!userToken) return; // Don't fetch if not logged in
    setIsLoading(true);
    try {
      const response = await apiClient.get('/list/');
      setList(response.data);
    } catch (error) {
      console.error("Failed to fetch shopping list", error);
    } finally {
      setIsLoading(false);
    }
  };

  // useFocusEffect from expo-router is a great way to re-fetch data
  // every time the user navigates to a screen that uses this context.
  // We'll use this in the shopping-list.tsx screen itself.
  // For now, let's fetch once on login.
  useEffect(() => {
    if (userToken) {
        refreshList();
    }
  }, [userToken]);


  const addItem = async (itemToAdd: NewListItemData) => {
    try {
      // The API now handles the logic of checking for existing items and updating quantity.
      // This makes the frontend simpler and more reliable.
      await apiClient.post('/list/items', itemToAdd);
      // After adding, refresh the whole list to get the latest state from the server.
      await refreshList();
    } catch (error) {
      console.error("Failed to add item", error);
    }
  };

  const removeItem = async (itemId: number) => {
    try {
      await apiClient.delete(`/list/items/${itemId}`);
      await refreshList();
    } catch (error) {
      console.error("Failed to remove item", error);
    }
  };
  

  const updateItemQuantity = async (itemId: number, newQuantity: number) => {
    // BUG FIX: Your previous code would remove the item locally but might fail
    // on the API, causing an inconsistent state. It's better to delegate this logic.
    if (newQuantity <= 0) {
        await removeItem(itemId);
    } else {
        try {
            await apiClient.put(`/list/items/${itemId}`, { quantity: newQuantity });
            await refreshList();
        } catch (error) {
            console.error("Failed to update quantity", error);
        }
    }
  };

  
  return (
    <ShoppingListContext.Provider value={{ list, addItem, updateItemQuantity, removeItem, isLoading, refreshList }}>
      {children}
    </ShoppingListContext.Provider>
  );
};