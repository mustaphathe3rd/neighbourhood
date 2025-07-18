import { Stack, router, useRootNavigationState } from 'expo-router';
import { AuthProvider, AuthContext } from '../src/context/AuthContext';
import { LocationProvider } from '../src/context/LocationContext';
import { ShoppingListProvider } from '../src/context/ShoppingListContext'; 
import { useContext, useEffect } from 'react';
import Toast from 'react-native-toast-message';
import { FavoriteStoresProvider } from '../src/context/FavoriteStoresContext';

const RootLayoutNav = () => {
  const { userToken, isLoading } = useContext(AuthContext);
  const navigationState = useRootNavigationState();

  useEffect(() => {
    if (isLoading || !navigationState?.key) return;

    if (!userToken) {
      // If the user is not signed in, redirect them to the login screen
      router.replace('/login');
    } else {
      // If the user is signed in, redirect them to the main '(tabs)' section
      router.replace('/(tabs)');
    }
  }, [userToken, isLoading, navigationState?.key]);

  // The Stack navigator renders the active route.
  // The '(tabs)' route is your main app, and 'login'/'register' are for auth.
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ presentation: 'modal', title: 'Login' }} />
      <Stack.Screen name="register" options={{ presentation: 'modal', title: 'Register' }} />
      <Stack.Screen name="location-select" options={{ presentation: 'modal', title: 'Select Location' }} />
      {/* Add this new screen with modal presentation */}
      <Stack.Screen name="location-settings" options={{ presentation: 'modal', title: 'Location Settings' }} />
      <Stack.Screen name="search-modal" options={{ presentation: 'modal', animation: 'fade' }} />
      <Stack.Screen name="barcode-scanner" options={{ presentation: 'modal', title: 'Scan Barcode' }} />
    </Stack>
);
};

export default function RootLayout() {
    return (
        <AuthProvider>
            <LocationProvider>
                <ShoppingListProvider> 
                    <FavoriteStoresProvider>  {/* <-- Wrap here */}
                        <RootLayoutNav />
                    </FavoriteStoresProvider>
                </ShoppingListProvider>
            </LocationProvider>
            <Toast />
        </AuthProvider>
    )
}