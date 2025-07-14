// app/product/[id].tsx
import { StyleSheet, View, ActivityIndicator, Text, ScrollView, Image, TouchableOpacity, Linking, Dimensions, Alert } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
import apiClient from '@/src/api/client';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatDistanceToNow } from 'date-fns';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { ShoppingListContext } from '@/src/context/ShoppingListContext';
import { LocationContext } from '@/src/context/LocationContext'; 
import { FavoriteStoresContext } from '@/src/context/FavoriteStoresContext'; 
import Toast from 'react-native-toast-message';

// --- Types ---
type PriceResult = {
  store_id: number;
  product_name: string;
  price: number;
  store_name: string;
  market_area: string;
  city?: string;
  // We need to update the backend to send store coordinates
  // For now, we'll use mock coordinates.
};

type MockReview = {
  id: number;
  name: string;
  avatar: string;
  time: string;
  rating: number;
  comment: string;
};

// --- Mock Data ---
const mockReviews: MockReview[] = [
    { id: 1, name: 'Aisha', avatar: 'https://i.pravatar.cc/150?img=1', time: '2 weeks ago', rating: 5, comment: 'This rice is fantastic! The grains are long and cook up perfectly every time. Highly recommend.' },
    { id: 2, name: 'Chukwudi', avatar: 'https://i.pravatar.cc/150?img=5', time: '1 month ago', rating: 3, comment: 'Good quality rice, though a bit pricey. Still, it\'s worth it for the taste.' }
];

// --- Main Component ---
export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const { activeLocation } = useContext(LocationContext);
  const [prices, setPrices] = useState<PriceResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addItem } = useContext(ShoppingListContext);
  const { favoriteIds, addFavorite, removeFavorite } = useContext(FavoriteStoresContext);
  
// ...
   useEffect(() => {
    if (!id || typeof id !== 'string' || !activeLocation || activeLocation.type !== 'manual') {
        // We need a manually selected city to search within
        setIsLoading(false);
        return;
    };

    const fetchPrices = async () => {
      setIsLoading(true);
      try {
        // Pass the city_id from our context as a query parameter
        const response = await apiClient.get(`/products/${id}/prices`, {
            params: { city_id: activeLocation.cityId }
        });
        setPrices(response.data);
      } catch (error) {
        console.error("Failed to fetch prices:", error);
        setPrices([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPrices();
  }, [id, activeLocation]);
  
  const handleGetDirections = (lat: number, lon: number) => {
    const url = `http://maps.apple.com/?daddr=${lat},${lon}`;
    Linking.openURL(url);
  };

  if (isLoading) return <ActivityIndicator size="large" style={styles.centered} />;
  if (error) return <Text style={styles.centered}>{error}</Text>;
  if (prices.length === 0) return <Text style={styles.centered}>Product details not found.</Text>;

  const product = prices[0]; // All results are for the same product

  const handleAddToList = () => {
    if (prices.length > 0) {
      const productToAdd = {
        id: parseInt(id as string, 10),
        name: prices[0].product_name,
        imageUrl: `https://picsum.photos/seed/${id}/200`
      };
      addItem(productToAdd);
      Toast.show({
        type: 'success',
        text1: 'Added to List',
        text2: `${productToAdd.name} is now in your shopping List`,
        position: 'bottom'
      });
    }
  };

  return (
    <View style={{flex: 1}}>
      <ScrollView style={styles.container}>
        <Stack.Screen options={{ title: product.product_name, headerBackTitle: "Results" }} />
        
        <Image source={{ uri: `https://picsum.photos/seed/${id}/400/300` }} style={styles.productImage} />
        
        <View style={styles.contentContainer}>
            <Text style={styles.productName}>{product.product_name}</Text>
            <Text style={styles.description}>
                A 50kg bag of high-quality, long-grain rice, perfect for all your cooking needs. Sourced directly from local farmers, ensuring freshness and superior taste.
            </Text>

            <Text style={styles.sectionTitle}>Available at</Text>
            {prices.map((item, index) => {
                const isFavorited = favoriteIds.has(item.store_id);
                return (
                    <View key={index} style={styles.storeCard}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.storeName}>{item.store_name}</Text>
                            <Text style={styles.marketName}>{item.market_area}{item.city ? `, ${item.city}` : ''}</Text>
                        </View>
                        <View style={{alignItems: 'flex-end'}}>
                            <Text style={styles.price}>₦{item.price.toLocaleString()}</Text>
                            <TouchableOpacity 
                                onPress={() => isFavorited ? removeFavorite(item.store_id) : addFavorite(item.store_id)}
                                style={styles.favoriteButton}
                            >
                                <Ionicons 
                                    name={isFavorited ? "heart" : "heart-outline"} 
                                    size={28} 
                                    color={isFavorited ? "#FF3B30" : "#FFC107"} 
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                );
            })}

            <View style={styles.mapContainer}>
                <MapView
                    style={styles.map}
                    initialRegion={{
                        latitude: 5.48, // Centered on Owerri for now
                        longitude: 7.03,
                        latitudeDelta: 0.1,
                        longitudeDelta: 0.1,
                    }}
                >
                    {/* Add markers for stores later when coordinates are in API */}
                </MapView>
            </View>

            <Text style={styles.sectionTitle}>Reviews</Text>
            {mockReviews.map(review => (
                <View key={review.id} style={styles.reviewCard}>
                    <Image source={{ uri: review.avatar }} style={styles.avatar} />
                    <View style={styles.reviewContent}>
                        <View style={styles.reviewHeader}>
                            <Text style={styles.reviewName}>{review.name}</Text>
                            <Text style={styles.reviewTime}>{review.time}</Text>
                        </View>
                        <Text style={styles.reviewComment}>{review.comment}</Text>
                        {/* Add like/dislike icons here */}
                    </View>
                </View>
            ))}

        </View>
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.cartButton} onPress={handleAddToList}>
            <Text style={styles.cartButtonText}>Add to List</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const { width } = Dimensions.get('window');
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F5F2' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    contentContainer: { padding: 16 },
    productImage: { width: '100%', height: 250, backgroundColor: '#EAEAEA' },
    productName: { fontSize: 24, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 8 },
    description: { fontSize: 16, color: '#666', lineHeight: 22, marginBottom: 20 },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
    storeCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#FFF',
        borderRadius: 8,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#EAEAEA'
    },
    storeName: { fontSize: 16, fontWeight: '600' },
    marketName: { fontSize: 14, color: 'gray' },
    price: { fontSize: 18, fontWeight: 'bold' },
    favoriteButton: {
        marginTop: 4,
        padding: 4,
    },
    mapContainer: {
        height: 200,
        borderRadius: 12,
        overflow: 'hidden',
        marginTop: 10,
        marginBottom: 20,
    },
    map: { width: '100%', height: '100%' },
    reviewCard: { flexDirection: 'row', marginBottom: 20 },
    avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
    reviewContent: { flex: 1 },
    reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    reviewName: { fontWeight: 'bold' },
    reviewTime: { color: 'gray', fontSize: 12 },
    reviewComment: { color: '#333' },
    footer: {
        padding: 16,
        paddingBottom: 30, // Extra padding for home indicator
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderColor: '#EAEAEA'
    },
    cartButton: {
        backgroundColor: '#FFC107',
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    cartButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});