import { StyleSheet, View, ActivityIndicator, FlatList, Text, TouchableOpacity, TextInput } from 'react-native';
import { router, Stack } from 'expo-router';
import React, { useEffect, useState, useContext } from 'react';
import apiClient from '@/src/api/client';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PriceResultCard } from '@/src/components/PriceResultCard';
import { Ionicons } from '@expo/vector-icons';
import { LocationContext } from '@/src/context/LocationContext';

type PriceResult = {
  product_id: number;
  product_name: string;
  price: number;
  store_name: string;
};

export default function SearchModal() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PriceResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { activeLocation } = useContext(LocationContext);
  
  // --- NEW: State to manage the sort order ---
  const [sortOrder, setSortOrder] = useState('price_asc'); // 'price_asc' or 'price_desc'

  useEffect(() => {
    const handleSearch = async () => {
      // Don't search if the query is empty
      if (!query.trim()) {
        setResults([]);
        return;
      }
      // Also ensure we have a location to search in
      if (!activeLocation || activeLocation.type !== 'manual') { 
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        // --- UPDATED: Add sort_by to the API call params ---
        const response = await apiClient.get(`/products/search`, {
          params: {
            q: query,
            city_id: activeLocation.cityId,
            sort_by: sortOrder,
          }
        });
        setResults(response.data);
      } catch (error) {
        console.error("Search failed", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(() => handleSearch(), 300);
    return () => clearTimeout(timeoutId);
    // --- UPDATED: Re-run the search if the sortOrder changes ---
  }, [query, activeLocation, sortOrder]);


  // --- NEW: Function to toggle the sort order ---
  const toggleSortOrder = () => {
    setSortOrder(currentOrder => currentOrder === 'price_asc' ? 'price_desc' : 'price_asc');
  };


  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{
        headerTitle: () => (
          <View style={styles.searchHeader}>
            <Ionicons name="search" size={20} color="gray" />
            <TextInput 
              style={styles.searchInput} 
              placeholder='Search for "Rice"'
              autoFocus={true}
              value={query}
              onChangeText={setQuery}
            />
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="close-circle" size={24} color="gray" />
            </TouchableOpacity>
          </View>
        ),
        headerBackVisible: false,
      }} />

      {/* --- NEW: Functional sorting button --- */}
      <View style={styles.filterContainer}>
        <TouchableOpacity style={styles.pill} onPress={toggleSortOrder}>
            <Ionicons name={sortOrder === 'price_asc' ? 'arrow-up' : 'arrow-down'} size={16} color="#333" />
            <Text style={styles.pillText}>
                Price: {sortOrder === 'price_asc' ? 'Low to High' : 'High to Low'}
            </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? <ActivityIndicator size="large" /> : (
        <FlatList
          data={results}
          keyExtractor={(item, index) => `${item.product_id}-${item.store_name}-${index}`}
          renderItem={({ item }) => (
            <PriceResultCard
              imageUrl={`https://picsum.photos/seed/${item.product_id}/200`}
              productName={item.product_name}
              storeName={item.store_name}
              price={item.price}
              onPress={() => router.push(`/product/${item.product_id}`)}
            />
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>Start typing to see prices.</Text>}
          contentContainerStyle={{paddingTop: 16}}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, backgroundColor: '#F8F5F2' },
  searchHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 8, paddingHorizontal: 10, width: '100%', height: 40 },
  searchInput: { flex: 1, fontSize: 16, padding: 8, marginLeft: 8 },
  filterContainer: { 
    flexDirection: 'row', 
    paddingVertical: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: '#EAEAEA', 
    marginBottom: 10 
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EAEAEA'
  },
  pillText: {
    marginLeft: 6,
    fontWeight: '500'
  },
  emptyText: { textAlign: 'center', marginTop: 50, color: 'gray' },
});