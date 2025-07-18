import React, { useCallback, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, Link } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ShoppingListContext } from '@/src/context/ShoppingListContext';
import { AuthContext } from '@/src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

// A reusable component for each item in the list
const ShoppingListItemCard = ({ item }: { item: any }) => {
  const { updateItemQuantity } = useContext(ShoppingListContext);

  const listingForNav = {
    product_id: item.product_id,
    product_name: item.product_name,
    price: item.price_at_addition,
    store_id: item.store_id,
    store_name: item.store_name,
  };

  return (
    <View style={styles.itemContainer}>
      <Link href={{ pathname: `/product/${item.product_id}`, params: { listingData: JSON.stringify(listingForNav) }}} asChild>
        <TouchableOpacity style={styles.itemInfoLink}>
          <Image source={{ uri: item.image_url || `https://picsum.photos/seed/${item.product_id}/200` }} style={styles.itemImage} />
          <View style={styles.itemInfo}>
            <Text style={styles.itemName} numberOfLines={2}>{item.product_name}</Text>
            <Text style={styles.itemStore}>from {item.store_name}</Text>
            <Text style={styles.itemPrice}>₦{item.price_at_addition.toLocaleString()}</Text>
          </View>
        </TouchableOpacity>
      </Link>
      <View style={styles.quantityControls}>
        <TouchableOpacity onPress={() => updateItemQuantity(item.id, item.quantity - 1)}>
          <Ionicons name="remove-circle" size={32} color="#FF595E" />
        </TouchableOpacity>
        <Text style={styles.quantityText}>{item.quantity}</Text>
        <TouchableOpacity onPress={() => updateItemQuantity(item.id, item.quantity + 1)}>
          <Ionicons name="add-circle" size={32} color="#1982C4" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function ShoppingListScreen() {
  const { list, isLoading, refreshList } = useContext(ShoppingListContext);
  const { userToken } = useContext(AuthContext);

  useFocusEffect(useCallback(() => {
    if (userToken) refreshList();
  }, [userToken]));
  
  if (isLoading && !list) {
    return <ActivityIndicator style={styles.centered} size="large" color="#FFC107" />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedText type="title" style={styles.pageTitle}>Shopping List</ThemedText>
      
      <FlatList
        data={list?.items || []}
        renderItem={({item}) => <ShoppingListItemCard item={item} />}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={<Text style={styles.emptyText}>Your list is empty.</Text>}
        style={styles.list}
        contentContainerStyle={{ paddingBottom: 20 }}
        
        // --- THIS IS THE FIX ---
        // We render the total price calculator as the official footer of the list itself.
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
    list: {
      paddingHorizontal: 16,
    },
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
        marginTop: 24,
        backgroundColor: '#FFFFFF', 
        padding: 20, 
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#EAEAEA',
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
    },
    totalLabel: { fontSize: 18, fontWeight: '600' },
    totalPrice: { fontSize: 22, fontWeight: 'bold', color: '#1A1A1A' }
});