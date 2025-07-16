// app/results.tsx
import { StyleSheet, View, ActivityIndicator, FlatList, Text, TouchableOpacity, TextInput } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import React, { useEffect, useState, useContext } from 'react';
import apiClient from '@/src/api/client';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PriceResultCard } from '@/src/components/PriceResultCard';
import { Ionicons } from '@expo/vector-icons';
import { LocationContext } from '@/src/context/LocationContext';

type Product = {
  id: number;
  name: string;
  category: string;
};

const FilterPill = ({ label }: { label: string }) => (
    <TouchableOpacity style={styles.pill}>
        <Text style={styles.pillText}>{label}</Text>
        <Ionicons name="chevron-down" size={16} color="#333" />
    </TouchableOpacity>
);

export default function SearchResultsScreen() {
  const params = useLocalSearchParams();
  const { q } = params; 
  const { activeLocation } = useContext(LocationContext); 
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
      if (!q || typeof q !== 'string' || !activeLocation || activeLocation.type !== 'manual') {
        // Only search if we have a query and a manually selected city
        // GPS based search is on the home screen
        return;
      };

      const fetchProducts = async () => {
        setIsLoading(true);
        try {
          // Use the cityId from the context, not a hardcoded value
          const response = await apiClient.get(`/products/search?q=${q}&city_id=${activeLocation.cityId}`);
          setProducts(response.data);
        } catch (error) {
          console.error("Search failed", error);
          setProducts([]);
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchProducts();
    }, [q, activeLocation]);

  if (isLoading) {
    return <ActivityIndicator size="large" style={styles.centered} />;
  }

  return (
    <SafeAreaView style={styles.container}>
        {/* This dynamically sets the header for this screen */}
        <Stack.Screen options={{ 
            headerTitle: () => (
                <View style={styles.searchHeader}>
                    <Ionicons name="search" size={20} color="gray" />
                    <TextInput 
                        style={styles.searchInput} 
                        value={typeof q === 'string' ? q : ''}
                        placeholder='Search'
                    />
                     <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="close-circle" size={20} color="gray" />
                    </TouchableOpacity>
                </View>
            ),
            headerBackVisible: false, // Hides the default back arrow
        }} />

        <View style={styles.filterContainer}>
            <FilterPill label="Sort" />
            <FilterPill label="Price" />
            <FilterPill label="Rating" />
        </View>

        <FlatList
            data={products}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
            <PriceResultCard
                // Using a placeholder image service. The seed ensures the same image appears for the same product ID.
                imageUrl={`https://picsum.photos/seed/${item.id}/200`}
                name={item.name}
                // Using mock data for market and price until backend is updated
                market="Local Market" 
                price={14500 + item.id * 50} // Example dynamic price
                onPress={() => router.push(`/product/${item.id}`)}
            />
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>No products found for "{q}".</Text>}
            showsVerticalScrollIndicator={false}
        />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 16, backgroundColor: '#F8F5F2' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    searchHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        paddingHorizontal: 10,
        width: '100%',
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        padding: 8,
        marginLeft: 8,
    },
    filterContainer: {
        flexDirection: 'row',
        paddingVertical: 12,
        gap: 10,
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#EAEAEA'
    },
    pillText: {
        marginRight: 4,
        fontWeight: '500'
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 50,
        fontSize: 16,
        color: 'gray'
    }
});