// app/(tabs)/index.tsx
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, TextInput } from 'react-native';
import React from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const iconColor = colorScheme === 'dark' ? '#1A1A1A' : '#1A1A1A';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* --- Top Right Options Button --- */}
        <TouchableOpacity style={styles.optionsButton} onPress={() => router.push('/location-settings')}>
            <Ionicons name="options-outline" size={28} color={iconColor} />
        </TouchableOpacity>
        
        {/* --- Centered Content --- */}
        <View style={styles.centeredContent}>
            <Text style={styles.title}>Neighbor</Text>
            <Text style={styles.subtitle}>Compare prices, save money.</Text>

            {/* This is a "fake" search bar. Tapping it opens the real search modal. */}
            <TouchableOpacity style={styles.searchBar} onPress={() => router.push('/search-modal')}>
                <Ionicons name="search" size={20} color="gray" />
                <Text style={styles.searchInputText}>Search for products or stores</Text>
            </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#F8F5F2' 
  },
  container: { 
    flex: 1, 
    padding: 16,
  },
  optionsButton: {
    alignSelf: 'flex-end'
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80, // Offset to raise it from the center
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 16,
    color: 'gray',
    marginBottom: 30,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 50,
    width: '100%',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInputText: {
    marginLeft: 8,
    fontSize: 16,
    color: 'gray',
  },
});