// app/(tabs)/explore.tsx
// We will use this as our search results page for now.
import { StyleSheet, View, Text, ActivityIndicator, FlatList, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import apiClient from '@/src/api/client';

// We'll reuse the Market type
type PriceResult = {
  price: number;
  store_name: string;
  market_area: string;
  city: string;
  state: string;
};

export default function SearchResultsScreen() {
  const params = useLocalSearchParams();
  const { q } = params; // Get the search query from the URL

  const [results, setResults] = useState<PriceResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!q) return;

    const fetchResults = async () => {
      setIsLoading(true);
      try {
        // We'll hardcode city_id=5 (Wuse) for this test
        const response = await apiClient.get(`/products/search?q=${q}&city_id=5`);
        setResults(response.data);
      } catch (error) {
        console.error("Search failed", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchResults();
  }, [q]);

  if (isLoading) {
    return <ActivityIndicator size="large" style={{ flex: 1 }} />;
  }

  return (
    <View style={styles.container}>
      <ThemedText type="title">Results for "{q}"</ThemedText>
      <FlatList
        data={results}
        keyExtractor={(item, index) => `${item.store_name}-${index}`}
        renderItem={({ item }) => (
          <View style={styles.resultCard}>
            <ThemedText type="subtitle">₦{item.price.toLocaleString()}</ThemedText>
            <ThemedText>{item.store_name}</ThemedText>
            <ThemedText style={{color: 'gray'}}>{item.market_area}, {item.city}</ThemedText>
          </View>
        )}
        ListEmptyComponent={<ThemedText>No prices found for this product.</ThemedText>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 50 },
  resultCard: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
});