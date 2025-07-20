import React, { useContext, useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, TouchableOpacity } from 'react-native';
import { AuthContext } from '@/src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import apiClient from '@/src/api/client';
import { useFocusEffect } from '@react-navigation/native';

// Reusable components (can be moved to their own files if desired)
const SettingsItem = ({ label, icon, onPress }: { label: string, icon: any, onPress: () => void }) => (
  <TouchableOpacity style={styles.itemContainer} onPress={onPress}>
    <View style={{ flexDirection: 'row', alignItems: 'center'}}>
      <Ionicons name={icon} size={22} color="#666" />
      <Text style={styles.itemLabel}>{label}</Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color="#AEAEB2" />
  </TouchableOpacity>
);

const SectionHeader = ({ title }: { title: string }) => (
  <Text style={styles.sectionHeader}>{title.toUpperCase()}</Text>
);

// Define types for the data we expect
type FavoriteStore = { id: number; name: string; };
type UserProfile = { name: string; email: string; };


export default function ProfileScreen() {
  const { logout, userToken } = useContext(AuthContext);
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [favoriteStores, setFavoriteStores] = useState<FavoriteStore[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // useFocusEffect will re-fetch data every time this screen is focused
  useFocusEffect(
    useCallback(() => {
      if (!userToken) return;

      const fetchData = async () => {
        setIsLoading(true);
        try {
          // Fetch both profile and favorites in parallel
          const [profileRes, favoritesRes] = await Promise.all([
            apiClient.get('/users/me'),
            apiClient.get('/favorites/stores')
          ]);
          setProfile(profileRes.data);
          setFavoriteStores(favoritesRes.data);
        } catch (error) {
          console.error("Failed to fetch data", error);
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchData();
    }, [userToken])
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView>
        <View style={styles.profileHeader}>
          <Image 
            source={{ uri: 'https://i.pravatar.cc/150' }} // Placeholder avatar
            style={styles.avatar} 
          />
          {/* Display the name and email from the fetched profile data */}
          <Text style={styles.profileName}>{profile?.name || 'Loading...'}</Text>
          <Text style={styles.profileEmail}>{profile?.email || ''}</Text>
        </View>
        
        <SectionHeader title="Favorites" />
        <View style={styles.section}>
          <SettingsItem label="Favorite Products" icon="heart-outline" onPress={() => {}} />
          {isLoading ? <ActivityIndicator style={{margin: 10}}/> : (
            favoriteStores.length > 0 ? (
              favoriteStores.map(store => (
                  <SettingsItem key={store.id} label={store.name} icon="storefront-outline" onPress={() => {}} />
              ))
            ) : (
              <SettingsItem label="No favorite stores yet" icon="storefront-outline" onPress={() => {}} />
            )
          )}
        </View>

        <SectionHeader title="App" />
        <View style={styles.section}>
            <SettingsItem label="Shopping List" icon="list-outline" onPress={() => {}} />
            <SettingsItem label="Settings" icon="settings-outline" onPress={() => {}} />
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8F5F2' },
  container: { flex: 1 },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA'
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A1A1A'
  },
  profileEmail: {
    fontSize: 16,
    color: '#666'
  },
  sectionHeader: {
    color: '#6D6D72',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
    fontSize: 13,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#FFFFFF',
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
  },
  itemLabel: {
    fontSize: 17,
    marginLeft: 16
  },
  logoutButton: {
    marginTop: 30,
    marginHorizontal: 16,
    alignItems: 'center',
    paddingBottom: 20
  },
  logoutButtonText: {
    color: '#FF3B30', // Standard iOS destructive red
    fontSize: 17,
    fontWeight: '600',
  },
});