import React, { useEffect, useState } from 'react';
import { getMyProfile } from '../api/client';
import CreateStoreForm from '../components/CreateStoreForm'; 
import InventoryPage from './InventoryPage';

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const response = await getMyProfile();
      setUser(response.data);
    } catch (error) {
      console.error("Failed to fetch profile", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // When a store is created, we need to refresh the profile
  const onStoreCreated = () => {
      setIsLoading(true);
      fetchProfile();
  }

  if (isLoading) return <p className="text-center mt-8">Loading your profile...</p>;

  // Conditionally render based on whether user.store exists
  return user?.store 
    ? <InventoryPage /> 
    : <CreateStoreForm onStoreCreated={onStoreCreated} />;
}