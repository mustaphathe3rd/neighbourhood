import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '@/src/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// The API function to fetch the list
const fetchShoppingList = async () => {
    const { data } = await apiClient.get('/list/');
    console.log('Shopping list API response:', JSON.stringify(data, null, 2));
    return data;
};

// The API function for updating quantity
const updateItemQuantity = ({ itemId, quantity }: { itemId: number, quantity: number }) => {
    if (quantity <= 0) {
        // If quantity is 0 or less, we call the delete endpoint
        return apiClient.delete(`/list/items/${itemId}`);
    }
    return apiClient.put(`/list/items/${itemId}`, { quantity });
};

// A reusable card component for each item in the list
const ShoppingListItemCard = ({ item }: { item: any }) => {
    const queryClient = useQueryClient();
    
    const { mutate, isPending } = useMutation({
        mutationFn: updateItemQuantity,
        onSuccess: () => {
            // After a successful update, invalidate the cache to trigger a re-fetch
            queryClient.invalidateQueries({ queryKey: ['shoppingList'] });
        },
    });

    const listingForNav = {
        product_id: item.product_id,
        product_name: item.product_name,
        price: item.price_at_addition,
        store_id: item.store_id,
        store_name: item.store_name,
        image_url: item.image_url,
    };

    console.log('Image URL for item:', item.product_name, ':', item.image_url);

    return (
        <View style={styles.itemContainer}>
            <Link href={{ pathname: `/product/${item.product_id}`, params: { listingData: JSON.stringify(listingForNav) }}} asChild>
                <TouchableOpacity style={styles.itemInfoLink}>
                    <Image 
                        source={{ 
                            uri: item.image_url || 'https://via.placeholder.com/60' 
                        }} 
                        style={styles.itemImage}
                        onError={(error) => {
                            console.error('Image load error for:', item.product_name, error.nativeEvent.error);
                            console.log('Failed image URL:', item.image_url);
                            console.log('Image URL type:', typeof item.image_url);
                            console.log('Full item data:', JSON.stringify(item, null, 2));
                        }}
                        onLoad={() => {
                            console.log('Image loaded successfully for:', item.product_name);
                        }}
                    />
                    <View style={styles.itemInfo}>
                        <Text style={styles.itemName} numberOfLines={2}>{item.product_name}</Text>
                        <Text style={styles.itemStore}>from {item.store_name}</Text>
                        <Text style={styles.itemPrice}>₦{item.price_at_addition.toLocaleString()}</Text>
                    </View>
                </TouchableOpacity>
            </Link>
            <View style={styles.quantityControls}>
                <TouchableOpacity onPress={() => mutate({ itemId: item.id, quantity: item.quantity - 1 })} disabled={isPending}>
                    <Ionicons name="remove-circle" size={32} color={isPending ? "#ccc" : "#FF595E"} />
                </TouchableOpacity>
                <Text style={styles.quantityText}>{item.quantity}</Text>
                <TouchableOpacity onPress={() => mutate({ itemId: item.id, quantity: item.quantity + 1 })} disabled={isPending}>
                    <Ionicons name="add-circle" size={32} color={isPending ? "#ccc" : "#1982C4"} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default function ShoppingListScreen() {
  // useQuery handles all the state for us: data, isLoading, isError, refetching, etc.
  const { data: list, isLoading, isError, error } = useQuery({
    queryKey: ['shoppingList'],
    queryFn: fetchShoppingList,
  });
  
  if (isLoading) {
    return <ActivityIndicator style={styles.centered} size="large" color="#FFC107" />;
  }

  if (isError) {
    return <Text style={styles.emptyText}>Error fetching shopping list: {error.message}</Text>
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedText type="title" style={styles.pageTitle}>Shopping List</ThemedText>
      
      <FlatList
        data={list?.items || []}
        renderItem={({ item }) => <ShoppingListItemCard item={item} />}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={<Text style={styles.emptyText}>Your list is empty.</Text>}
        style={styles.list}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListFooterComponent={
          list && list.items.length > 0 ? (
            <View style={styles.footer}>
              <Text style={styles.totalLabel}>List Total</Text>
              <Text style={styles.totalPrice}>₦{list.total_price.toLocaleString('en-US', {minimumFractionDigits: 2})}</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F8F5F2' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    pageTitle: {
      fontSize: 28, fontWeight: 'bold', paddingHorizontal: 16, 
      paddingBottom: 10, paddingTop: 10, color: '#1A1A1A',
    },
    list: { paddingHorizontal: 16 },
    itemContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, marginBottom: 12 },
    itemInfoLink: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    itemImage: { width: 60, height: 60, borderRadius: 8 },
    itemInfo: { flex: 1, marginLeft: 12 },
    itemName: { fontSize: 16, fontWeight: '600' },
    itemStore: { fontSize: 13, color: 'gray', fontStyle: 'italic' },
    itemPrice: { fontSize: 14, color: '#333', marginTop: 4, fontWeight: '500' },
    quantityControls: { flexDirection: 'row', alignItems: 'center' },
    quantityText: { fontSize: 18, fontWeight: 'bold', marginHorizontal: 10, minWidth: 20, textAlign: 'center' },
    emptyText: { textAlign: 'center', color: 'gray', marginTop: 40, fontSize: 16 },
    footer: {
        marginTop: 24, backgroundColor: '#FFFFFF', padding: 20, 
        borderRadius: 12, borderWidth: 1, borderColor: '#EAEAEA',
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    },
    totalLabel: { fontSize: 18, fontWeight: '600' },
    totalPrice: { fontSize: 22, fontWeight: 'bold', color: '#1A1A1A' }
});