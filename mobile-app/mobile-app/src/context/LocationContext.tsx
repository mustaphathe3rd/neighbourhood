import React, { createContext, useState, ReactNode, useEffect } from 'react';
import * as Location from 'expo-location';

// The types of location the app can have.
export type LocationType = 
  | { type: 'gps'; coords: Location.LocationObject['coords'] } 
  | { type: 'manual'; cityId: number; cityName: string };

// The shape of the data our context will provide to other components.
type LocationContextType = {
  activeLocation: LocationType | null;
  setActiveLocation: (location: LocationType | null) => void;
  radius: number;
  setRadius: (radius: number) => void;
  isLoading: boolean; // We still need a loading state for the initial GPS fetch.
  fetchInitialLocation: () => void;
};

export const LocationContext = createContext<LocationContextType>({} as LocationContextType);

export const LocationProvider = ({ children }: { children: ReactNode }) => {
  const [activeLocation, setActiveLocation] = useState<LocationType | null>(null);
  const [radius, setRadius] = useState<number>(10);
  const [isLoading, setIsLoading] = useState(true);

  // This function's only job is to get the initial GPS location and set it as active.
  const fetchInitialLocation = async () => {
    setIsLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        // If permission is denied, default to a manual state so the app doesn't break.
        // Let's default to Owerri as a fallback.
        setActiveLocation({ type: 'manual', cityId: 8, cityName: 'Owerri' });
        return;
      }
      
      let locationData = await Location.getCurrentPositionAsync({});
      setActiveLocation({ type: 'gps', coords: locationData.coords });

    } catch (error) {
        console.error("Failed to fetch initial location", error);
        // Fallback to manual if GPS fails
        setActiveLocation({ type: 'manual', cityId: 8, cityName: 'Owerri' });
    } finally {
        setIsLoading(false);
    }
  };

  // This effect runs only once on app startup to set the initial location.
  useEffect(() => {
    fetchInitialLocation();
  }, []);

  return (
    <LocationContext.Provider 
        value={{ activeLocation, setActiveLocation, radius, setRadius, isLoading, fetchInitialLocation }}
    >
      {children}
    </LocationContext.Provider>
  );
};