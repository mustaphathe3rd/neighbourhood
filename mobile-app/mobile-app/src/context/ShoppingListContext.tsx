import React, { createContext, useState, ReactNode, useContext } from 'react';
import apiClient from '../api/client';
import { AuthContext } from './AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// --- Types ---
export type ListItem = {
  id: number;
  product_id: number;
  store_id: number;
  quantity: number;
  product_name: string;
  store_name: string;
  price_at_addition: number;
  image_url?: string;
};

type ShoppingList = {
    items: ListItem[];
    total_price: number;
}

type NewListItemData = {
  product_id: number;
  store_id: number;
  price: number;
};

type ShoppingListContextType = {
  list: ShoppingList | null;
  addItem: (item: NewListItemData) => void;
  updateItemQuantity: (vars: {itemId: number, newQuantity: number}) => void;
  isUpdating: boolean; // To know if a mutation is in progress
  isLoading: boolean;
};

export const ShoppingListContext = createContext<ShoppingListContextType>({} as ShoppingListContextType);

// --- API Functions ---
const fetchShoppingList = async () => {
    const { data } = await apiClient.get('/list/');
    console.log('Shopping list API response:', JSON.stringify(data, null, 2));
    return data;
};

const addListItem = (item: NewListItemData) => apiClient.post('/list/items', item);
const updateListItem = ({ itemId, newQuantity }: { itemId: number, newQuantity: number }) => {
    if (newQuantity <= 0) {
        return apiClient.delete(`/list/items/${itemId}`);
    }
    return apiClient.put(`/list/items/${itemId}`, { quantity: newQuantity });
};


export const ShoppingListProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const { userToken } = useContext(AuthContext);

  // useQuery to fetch and cache the shopping list
  const { data: list, isLoading } = useQuery<ShoppingList>({
    queryKey: ['shoppingList'],
    queryFn: fetchShoppingList,
    enabled: !!userToken, // Only fetch if the user is logged in
  });

  // useMutation for adding and updating items
  const { mutate: updateItem, isPending: isUpdating } = useMutation({
      mutationFn: updateListItem,
      onSuccess: () => {
          // THIS IS THE KEY: After a successful mutation, invalidate the cache.
          queryClient.invalidateQueries({ queryKey: ['shoppingList'] });
      }
  });

  const { mutate: addItemMutation } = useMutation({
      mutationFn: addListItem,
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['shoppingList'] });
      }
  });

  return (
    <ShoppingListContext.Provider 
        value={{ 
            list: list ?? null, 
            addItem: addItemMutation, 
            updateItemQuantity: updateItem, 
            isLoading,
            isUpdating 
        }}
    >
      {children}
    </ShoppingListContext.Provider>
  );
};