// app/search-modal.tsx
import { StyleSheet, View, ActivityIndicator, FlatList, Text, TouchableOpacity, TextInput } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import React, { useEffect, useState, useContext } from 'react';
import apiClient from '@/src/api/client';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProductCard } from '@/src/components/ProductCard';
import { Ionicons } from '@expo/vector-icons';
import { LocationContext } from '@/src/context/LocationContext';

type ProductResult = {
  product_id: number;
  name: string;
  min_price: number;
  store_count: number;
};

export default function SearchModal() {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<ProductResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sortOrder, setSortOrder] = useState('price_asc');
  const { activeLocation } = useContext(LocationContext);

  const handleSearch = async (searchText: string) => {
    if (!searchText.trim() || !activeLocation || activeLocation.type !== 'manual') {
      setProducts([]);
      return;
    }
    setIsLoading(true);
    try {
      // Pass the sortOrder state to the API call
      const response = await apiClient.get(`/products/search`, {
          params: {
              q: searchText,
              city_id: activeLocation.cityId,
              sort_by: sortOrder,
          }
      });
      setProducts(response.data);
    } catch (error) {
      console.error("Search failed", error);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

    useEffect(() => {
        handleSearch(query);
    }, [sortOrder]);

    const toggleSortOrder = () => {
        setSortOrder(currentOrder => currentOrder === 'price_asc' ? 'price_desc' : 'price_asc');
    }

  return (
    <SafeAreaView style={styles.container}>
        {/* This Stack.Screen gives us a modal with a header */}
        <Stack.Screen options={{
            headerTitle: () => (
                <View style={styles.searchHeader}>
                    <Ionicons name="search" size={20} color="gray" />
                    <TextInput 
                        style={styles.searchInput} 
                        placeholder='Search...'
                        autoFocus={true}
                        value={query}
                        onChangeText={(text) => {
                            setQuery(text);
                            handleSearch(text);
                        }}
                    />
                     <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="close-circle" size={24} color="gray" />
                    </TouchableOpacity>
                </View>
            ),
        }} />

        {/* ---NEW: Sorting Button --- */}
        <View style={styles.filterContainer}>
            <TouchableOpacity style={styles.pill} onPress={toggleSortOrder}>
                <Ionicons name={sortOrder === 'price_asc' ? 'arrow-up' : 'arrow-down'} size={16} color="#333" />
                < Text style={styles.pillText}>
                    Price: {sortOrder === 'price_asc' ? 'Low to High' : 'High to Low'}
                </Text>
            </TouchableOpacity>
        </View>

        {isLoading ? (
            <ActivityIndicator size="large" />
        ) : (
            <FlatList
                data={products}
                keyExtractor={(item) => item.product_id.toString()}
                renderItem={({ item }) => (
                <ProductCard
                    imageUrl={`https://picsum.photos/seed/${item.id}/200`}
                    name={item.name}
                    market="Local Market" 
                    price={14500 + item.id * 50}
                    onPress={() => router.push(`/product/${item.product_id}`)}
                />
                )}
                ListEmptyComponent={<Text style={styles.emptyText}>Start typing to see product results.</Text>}
                contentContainerStyle={{paddingTop: 16}}
            />
        )}
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 16, backgroundColor: '#F8F5F2' },
    filterContainer: {
        flexDirection: 'row',
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#EAEAEA'
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
    searchHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 8, paddingHorizontal: 10, width: '100%', height: 40 },
    searchInput: { flex: 1, fontSize: 16, padding: 8, marginLeft: 8 },
    emptyText: { textAlign: 'center', marginTop: 50, color: 'gray' }
});