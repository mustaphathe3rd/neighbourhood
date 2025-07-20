import { StyleSheet, View, ActivityIndicator, FlatList, Text, TouchableOpacity, TextInput, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { router, Stack, Link } from 'expo-router';
import React, { useContext, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  stock_level: number;
  avg_rating: number | null;
  distance_km: number | null;
  is_out_of_state: boolean;
  image_url?: string; 
};

// A reusable sort button component
const SortButton = ({ label, sortKey, activeSort, setSort }: { label: string, sortKey: string, activeSort: string, setSort: (key: string) => void }) => {
  const isActive = activeSort === sortKey;
  return (
    <TouchableOpacity 
        style={[styles.pill, isActive && styles.activePill]} 
        onPress={() => setSort(sortKey)}
    >
        <Text style={[styles.pillText, isActive && styles.activePillText]}>{label}</Text>
    </TouchableOpacity>
  );
};

export default function SearchModal() {
  const [query, setQuery] = useState('');
  const { activeLocation, radius } = useContext(LocationContext);
  const [sortOption, setSortOption] = useState('distance_asc');

  // This is the query key. TanStack Query uses it to cache the data.
  // It will automatically re-fetch if any of these values change.
  const searchQueryKey = ['search', query, activeLocation, sortOption, radius];

  // The data-fetching function
  const fetchSearch = async () => {
    if (!query.trim() || !activeLocation) return [];

    const params: any = { 
      q: query, 
      sort_by: sortOption
    };

    if (activeLocation.type === 'gps' && activeLocation.coords) {
      params.lat = activeLocation.coords.latitude;
      params.lon = activeLocation.coords.longitude;
      params.radius_km = radius;
    } else if (activeLocation.type === 'manual' && activeLocation.cityId) {
      params.city_id = activeLocation.cityId;
    } else {
      return [];
    }

    const { data } = await apiClient.get('/products/search', { params });
    return data;
  };

  // The useQuery hook!
  const { data: results, isLoading, isError } = useQuery({
    queryKey: searchQueryKey,
    queryFn: fetchSearch,
    enabled: !!query.trim() && !!activeLocation, // Only run the query if we have a search term
  });

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{
        headerTitle: () => (
          <View style={styles.searchHeader}>
            <Ionicons name="search" size={20} color="gray" />
            <TextInput 
              style={styles.searchInput} 
              placeholder='Search products...'
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
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{flex: 1}}>
          <View style={styles.filterContainer}>
            <SortButton label="Distance" sortKey="distance_asc" activeSort={sortOption} setSort={setSortOption} />
            <SortButton label="Price" sortKey="price_asc" activeSort={sortOption} setSort={setSortOption} />
            <SortButton label="Rating" sortKey="rating_desc" activeSort={sortOption} setSort={setSortOption} />
          </View>
          
          <View style={styles.orSeparator}>
            <View style={styles.line} />
            <Text style={styles.orText}>OR</Text>
            <View style={styles.line} />
          </View>

          <Link href="/barcode-scanner" asChild>
            <TouchableOpacity style={styles.barcodeButton}>
                <Ionicons name="camera-outline" size={22} color="#FFF" />
                <Text style={styles.barcodeButtonText}>Scan Barcode</Text>
            </TouchableOpacity>
          </Link>

          <View style={styles.resultsHeader}>
            <Text style={styles.resultsTitle}>Results</Text>
          </View>

          {isLoading ? <ActivityIndicator size="large" /> : (
            <FlatList
              data={results || []}
              keyExtractor={(item, index) => `${item.product_id}-${item.store_name}-${index}`}
              renderItem={({ item }) => (
                <PriceResultCard
                  imageUrl={item.image_url}
                  productName={item.product_name}
                  storeName={item.store_name}
                  price={item.price}
                  distance={item.distance_km}
                  rating={item.avg_rating}
                  stockLevel={item.stock_level}
                  isOutOfState={item.is_out_of_state}
                  onPress={() => {
                    // This is the key change. We now pass the entire 'item' object
                    // as a stringified JSON parameter to the next screen.
                    router.push({
                        pathname: `/product/${item.product_id}`,
                        params: { listingData: JSON.stringify(item) }
                    });
                }}
                />
              )}
              ListEmptyComponent={<Text style={styles.emptyText}>No results found</Text>}
              contentContainerStyle={{paddingTop: 8}}
              keyboardShouldPersistTaps="handled"
            />
          )}
        </View>
      </TouchableWithoutFeedback>
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
        gap: 10,
    },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: '#EAEAEA'
    },
    activePill: {
        backgroundColor: '#FFC107',
        borderColor: '#FFC107',
    },
    pillText: {
        fontWeight: '600',
        color: '#333'
    },
    activePillText: {
        color: '#FFFFFF'
    },
    emptyText: { textAlign: 'center', marginTop: 50, color: 'gray' },
     orSeparator: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
    line: { flex: 1, height: 1, backgroundColor: '#EAEAEA' },
    orText: { marginHorizontal: 10, color: 'gray', fontWeight: '500' },
    barcodeButton: {
        backgroundColor: '#FFC107', // Use your brand color
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderRadius: 8,
        marginBottom: 20,
    },
    barcodeButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    resultsHeader: {
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#EAEAEA',
    },
    resultsTitle: {
        fontSize: 18,
        fontWeight: 'bold'
    }, 
});