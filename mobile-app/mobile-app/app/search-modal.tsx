import { StyleSheet, View, ActivityIndicator, FlatList, Text, TouchableOpacity, TextInput, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { router, Stack, Link } from 'expo-router';
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
  stock_level: number;
  avg_rating: number | null;
  distance_km: number | null;
   
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
  const [results, setResults] = useState<PriceResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sortOption, setSortOption] = useState('distance_asc');
  const { activeLocation, radius } = useContext(LocationContext);

  useEffect(() => {
    const handleSearch = async () => {
      // Guard clause: Don't search if there's no query or no active location.
      if (!query.trim() || !activeLocation) {
        setResults([]);
        return;
      }

      setIsLoading(true);

      // --- THIS IS THE CORRECTED LOGIC ---
      // Dynamically build the search parameters based on location type.
      const params: any = { 
        q: query, 
        sort_by: sortOption
      };

      if (activeLocation.type === 'gps' && activeLocation.coords) {
        params.lat = activeLocation.coords.latitude;
        params.lon = activeLocation.coords.longitude;
        params.radius_km = radius; // Use a default radius for GPS search
      } else if (activeLocation.type === 'manual' && activeLocation.cityId) {
        params.city_id = activeLocation.cityId;
      } else {
        // If location type is invalid or missing data, don't search.
        setIsLoading(false);
        return;
      }

      try {
        const response = await apiClient.get('/products/search', { params });
        setResults(response.data);
      } catch (error) {
        console.error("Search failed", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Use a small delay (debounce) to avoid searching on every keystroke
    const timeoutId = setTimeout(() => handleSearch(), 300);
    return () => clearTimeout(timeoutId);

  }, [query, activeLocation, sortOption, radius]);

  // const toggleSortOrder = () => {
  //   setSortOption(currentOption => currentOption === 'price_asc' ? 'price_desc' : 'price_asc');
  // };

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
              data={results}
              keyExtractor={(item, index) => `${item.product_id}-${item.store_name}-${index}`}
              renderItem={({ item }) => (
                <PriceResultCard
                  imageUrl={`https://picsum.photos/seed/${item.product_id}/200`}
                  productName={item.product_name}
                  storeName={item.store_name}
                  price={item.price}
                  distance={item.distance_km}
                  rating={item.avg_rating}
                  stockLevel={item.stock_level}
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