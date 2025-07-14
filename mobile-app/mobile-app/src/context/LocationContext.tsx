import React, { createContext, useState, ReactNode, useEffect } from 'react';
import * as Location from 'expo-location';
import apiClient from '../api/client';

type LocationType = { type: 'gps' } | { type: 'manual'; cityId: number; cityName: string };
type Market = { id: number; name: string; city_name: string; state_name: string; };

type LocationContextType = {
  activeLocation: LocationType | null;
  setActiveLocation: (location: LocationType | null) => void;
  radius: number;
  setRadius: (radius: number) => void;
  markets: Market[];
  isLoading: boolean;
  errorMsg: string | null;
  fetchInitialLocation: () => void; // Add function to re-trigger GPS
};

export const LocationContext = createContext<LocationContextType>({} as LocationContextType);

export const LocationProvider = ({ children }: { children: ReactNode }) => {
  const [activeLocation, setActiveLocation] = useState<LocationType | null>(null);
  const [radius, setRadius] = useState<number>(10);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchInitialLocation = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setErrorMsg('Permission to access location was denied');
      setIsLoading(false);
      return;
    }
    // Set activeLocation to trigger the main useEffect
    setActiveLocation({ type: 'gps' });
  };

  useEffect(() => {
    fetchInitialLocation(); // Fetch on initial load
  }, []);

  useEffect(() => {
    const fetchMarkets = async () => {
      if (!activeLocation) return;
      setIsLoading(true);
      setErrorMsg(null);
      try {
        let response;
        if (activeLocation.type === 'gps') {
          let locationData = await Location.getCurrentPositionAsync({});
          response = await apiClient.get('/locations/markets/nearby', {
            params: { lat: locationData.coords.latitude, lon: locationData.coords.longitude, radius_km: radius }
          });
        } else { // Manual selection
          response = await apiClient.get(`/locations/markets/${activeLocation.cityId}`);
        }
        setMarkets(response.data);
      } catch (err) {
        setErrorMsg('Could not fetch markets for this location.');
        console.error(err);
        setMarkets([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMarkets();
  }, [activeLocation, radius]);

  return (
    <LocationContext.Provider value={{ activeLocation, setActiveLocation, radius, setRadius, markets, isLoading, errorMsg, fetchInitialLocation }}>
      {children}
    </LocationContext.Provider>
  );
};