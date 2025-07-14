// src/context/ShoppingListContext.tsx
import React, { createContext, useState, ReactNode } from 'react';

export type ListItem = {
  id: number;
  name: string;
  imageUrl: string;
  quantity: number;
};

type ShoppingListContextType = {
  items: ListItem[];
  addItem: (item: Omit<ListItem, 'quantity'>) => void;
  removeItem: (itemId: number) => void;
  updateQuantity: (itemId: number, newQuantity: number) => void;
};

export const ShoppingListContext = createContext<ShoppingListContextType>({} as ShoppingListContextType);

export const ShoppingListProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<ListItem[]>([]);

  const addItem = (itemToAdd: Omit<ListItem, 'quantity'>) => {
    setItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === itemToAdd.id);
      if (existingItem) {
        // If item already exists, increase its quantity
        return prevItems.map(item =>
          item.id === itemToAdd.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      // Otherwise, add the new item with quantity 1
      return [...prevItems, { ...itemToAdd, quantity: 1 }];
    });
  };

  const removeItem = (itemId: number) => {
    setItems(prevItems => prevItems.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId: number, newQuantity: number) => {
      if (newQuantity <= 0) {
          removeItem(itemId);
      } else {
          setItems(prevItems => prevItems.map(item => 
              item.id === itemId ? { ...item, quantity: newQuantity } : item
          ));
      }
  };

  return (
    <ShoppingListContext.Provider value={{ items, addItem, removeItem, updateQuantity }}>
      {children}
    </ShoppingListContext.Provider>
  );
};