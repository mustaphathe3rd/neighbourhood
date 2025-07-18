// app/product/[id].tsx
import { StyleSheet, View, Text, ScrollView, Image, TouchableOpacity, Linking, Dimensions, Alert, Button, ActivityIndicator, Modal, TextInput,Keyboard, KeyboardAvoidingView, TouchableWithoutFeedback, Platform } from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import React, { useContext, useEffect, useState, useMemo} from 'react';
import * as SecureStore from 'expo-secure-store';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { ShoppingListContext } from '@/src/context/ShoppingListContext';
import Toast from 'react-native-toast-message';
import { Rating } from 'react-native-ratings';
import apiClient from '@/src/api/client';
import { ReviewCard } from '@/src/components/ReviewCard';
import { LocationContext } from '@/src/context/LocationContext';

// This is the shape of the data we expect to receive
type PriceResult = {
  product_id: number;
  product_name: string;
  price: number;
  store_id: number;
  store_name: string;
  market_area: string;
  city: string;
  lat?: number;
  lon?: number;
};

type Review = {
    id: number; rating: number; comment: string | null;
    timestamp: string; user: { name: string };
};

const postReview = async (productId: number, rating: number, comment: string) => {
    return apiClient.post('/reviews/', { product_id: productId, rating, comment });
};


export default function ProductDetailScreen() {
  const { id, listingData } = useLocalSearchParams();
  const { addItem } = useContext(ShoppingListContext);
  const { activeLocation, radius } = useContext(LocationContext);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReviewModalVisible, setReviewModalVisible] = useState(false);
  const [myRating, setMyRating] = useState(3);
  const [myComment, setMyComment] = useState('');

  const listing: PriceResult | null = useMemo(() => {
    if (!listingData || typeof listingData !== 'string') return null;
    try {
      return JSON.parse(listingData);
    } catch (e) {
      return null;
    }
  }, [listingData]);

  const fetchReviews = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
          const response = await apiClient.get(`/reviews/product/${id}`);
          setReviews(response.data);
      } catch (error) { 
          console.error("Failed to fetch reviews", error);
      } finally {
          setIsLoading(false);
      }
  };

  useEffect(() => {
      fetchReviews();
  }, [id]);

  useEffect(() => {
    if (!listing) return;
    
    // Only log if we have the listing data
    const logView = async () => {
      try {
        // We don't need to wait for this, just send the request
        apiClient.post('/analytics/log-view', {
          product_id: listing.product_id,
          store_id: listing.store_id
        });
        console.log(`Logged view for product ${listing.product_id} at store ${listing.store_id}`);
      } catch (err) {
        // Fail silently, not critical for user experience
        console.error("Failed to log view", err);
      }
    }
    
    logView();
  }, [listing]);

  if (!listing) {
    return (
        <SafeAreaView style={styles.centered}>
            <Text>Could not load product details.</Text>
            <Button title="Go Back" onPress={() => router.back()} />
        </SafeAreaView>
    );
  }

 const handleSubmitReview = async () => {
    if (!id || typeof id !== 'string') {
        Toast.show({ type: 'error', text1: 'Could not identify the product.' });
        return;
    }

    const payload = {
        product_id: parseInt(id, 10),
        rating: myRating,
        comment: myComment.trim()
    };
     console.log("Submitting review payload:", payload);
    try {
        // --- THIS IS THE FIX ---
        // Add the headers object to explicitly set the Content-Type
        console.log("Auth token:", await SecureStore.getItemAsync('userToken'));
        await apiClient.post('/reviews/', payload, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        Toast.show({ type: 'success', text1: 'Review Submitted!' });
        setReviewModalVisible(false);
        setMyRating(3); // Reset rating
        setMyComment(''); // Reset comment
        fetchReviews();
    } catch (error) {
      Toast.show({
      type: 'error',
      text1: 'Submission Failed',
      text2: typeof error.response?.data === 'string' 
      ? error.response.data 
      : JSON.stringify(error.response?.data, null, 2)
    });
        console.error("Review submission failed:", error.response?.data || error);
    }
};
  const handleAddToList = () => {
    // FIX: The object passed to addItem now matches the expected type
    addItem({
        product_id: listing.product_id,
        store_id: listing.store_id,
        price: listing.price,
    });
    Toast.show({ type: 'success', text1: `${listing.product_name} added to list!` });
  };


    const handleGetDirections = (lat?: number, lon?: number) => {
    if (!lat || !lon) {
      Alert.alert("Location not available", "Directions cannot be provided for this store.");
      return;
    }
    // This URL format works for both iOS (Apple Maps) and Android (Google Maps)
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
    Linking.openURL(url);
  };

  return (
    <View style={{flex: 1, backgroundColor: '#F8F5F2'}}>
      <ScrollView>
        {/* The screen title now comes directly from the passed data */}
        <Stack.Screen options={{ title: listing.product_name }} />
        
        <Image source={{ uri: `https://picsum.photos/seed/${listing.product_id}/400/300` }} style={styles.productImage} />
        
        <View style={styles.contentContainer}>
            <Text style={styles.productName}>{listing.product_name}</Text>
            <Text style={styles.description}>
                Placeholder description for this high-quality product. Sourced directly from local farmers, ensuring freshness and superior taste.
            </Text>

            <Text style={styles.sectionTitle}>Available at</Text>

            {/* Display only the single store listing that was passed */}
            <View style={styles.storeCard}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.storeName}>{listing.store_name}</Text>
                    <Text style={styles.marketName}>{listing.market_area}, {listing.city}</Text>

                     {/* --- ADD THIS BUTTON --- */}
                    <TouchableOpacity 
                        style={styles.directionsButton} 
                        onPress={() => handleGetDirections(listing.lat, listing.lon)}
                    >
                        <Ionicons name="navigate-circle-outline" size={20} color="#007AFF" />
                        <Text style={styles.directionsButtonText}>Get Directions</Text>
                    </TouchableOpacity>

                </View>
                <View style={{alignItems: 'flex-end'}}>
                   <Text style={styles.price}>₦{listing.price.toLocaleString()}</Text>
                   {/* Add favorite button logic here later */}
                </View>
            </View>

            <View style={styles.mapContainer}>
                <MapView style={styles.map} 
                initialRegion={{
                        latitude: listing.lat ?? 6.52,
                        longitude: listing.lon ?? 3.37,
                        latitudeDelta: 0.0922,
                        longitudeDelta: 0.0421,
                    }}
                />
            </View>

            <Text style={styles.sectionTitle}>Reviews</Text>
            <TouchableOpacity style={styles.writeReviewButton} onPress={() => setReviewModalVisible(true)}>
                <Text style={styles.writeReviewButtonText}>Write a Review</Text>
            </TouchableOpacity>

            {isLoading ? <ActivityIndicator /> :
              reviews.length > 0 ? (
                  reviews.map(review => <ReviewCard key={review.id} review={review} />)
              ) : (
                  <Text style={{color: 'gray', textAlign: 'center'}}>No reviews yet. Be the first!</Text>
              )
            }
        </View>
      </ScrollView>
          <Modal
          animationType="slide"
          transparent={true}
          visible={isReviewModalVisible}
          onRequestClose={() => setReviewModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardAvoidingContainer}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>What do you think?</Text>
                  <Rating
                    showRating
                    onFinishRating={(rating) => setMyRating(rating)}
                    style={{ paddingVertical: 10 }}
                    startingValue={3}
                  />
                  <TextInput
                    style={styles.reviewInput}
                    placeholder="Tell us more..."
                    multiline
                    value={myComment}
                    onChangeText={setMyComment}
                  />
                  <View style={styles.modalButtonContainer}>
                    <Button title="Cancel" onPress={() => setReviewModalVisible(false)} color="gray" />
                    <Button title="Submit Review" onPress={handleSubmitReview} color="#FFC107" />
                  </View>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </Modal>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.cartButton} onPress={handleAddToList}>
            <Text style={styles.cartButtonText}>Add to List</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ... Use the same styles as before
const styles = StyleSheet.create({
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    container: { flex: 1, backgroundColor: '#F8F5F2' },
    contentContainer: { padding: 16 },
    productImage: { width: '100%', height: 250, backgroundColor: '#EAEAEA' },
    productName: { fontSize: 24, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 8 },
    description: { fontSize: 16, color: '#666', lineHeight: 22, marginBottom: 20 },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
    storeCard: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: 16, backgroundColor: '#FFF', borderRadius: 8,
        marginBottom: 10, borderWidth: 1, borderColor: '#EAEAEA'
    },
    storeName: { fontSize: 16, fontWeight: '600' },
    marketName: { fontSize: 14, color: 'gray' },
    price: { fontSize: 18, fontWeight: 'bold' },
    mapContainer: { height: 200, borderRadius: 12, overflow: 'hidden', marginTop: 10, marginBottom: 20 },
    map: { width: '100%', height: '100%' },
    footer: { padding: 16, paddingBottom: 30, backgroundColor: '#FFF', borderTopWidth: 1, borderColor: '#EAEAEA' },
    cartButton: { backgroundColor: '#FFC107', paddingVertical: 15, borderRadius: 8, alignItems: 'center' },
    cartButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
    directionsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        alignSelf: 'flex-start',
    },
    directionsButtonText: {
        color: '#007AFF', // Standard iOS blue for links
        fontSize: 15,
        fontWeight: '600',
        marginLeft: 6,
    },
    writeReviewButton: {
        backgroundColor: '#fff', padding: 12, borderRadius: 8,
        alignItems: 'center', marginVertical: 20, borderWidth: 1, borderColor: '#EAEAEA'
    },
    writeReviewButtonText: { fontWeight: 'bold', fontSize: 16, color: '#333' },
    modalContainer: {
        flex: 1, justifyContent: 'center', alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        width: '85%', backgroundColor: 'white', borderRadius: 12,
        padding: 20, alignItems: 'center',
    },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
    reviewInput: {
        width: '100%', height: 100, borderColor: 'gray', borderWidth: 1,
        borderRadius: 8, padding: 10, textAlignVertical: 'top', marginVertical: 20,
    },
    modalButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%'
    },
    keyboardAvoidingContainer: {
        flex: 1,
    },
});