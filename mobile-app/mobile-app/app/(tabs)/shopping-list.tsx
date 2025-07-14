import { ThemedText } from '@/components/ThemedText';
import { ShoppingListContext, ListItem } from '@/src/context/ShoppingListContext';
import React, { useContext } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Mock data for AI Suggestions
const aiSuggestions: Omit<ListItem, 'quantity'>[] = [
    { id: 999, name: 'Salt', imageUrl: 'https://i.imgur.com/gO2n5hV.png' },
    { id: 998, name: 'Pepper', imageUrl: 'https://i.imgur.com/k2y3I1Y.png' },
];

const ShoppingListItem = ({ item, onUpdateQuantity }: { item: ListItem, onUpdateQuantity: (id: number, q: number) => void }) => (
    <View style={styles.itemContainer}>
        <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
        <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemQuantity}>Quantity: {item.quantity}</Text>
        </View>
        <View style={styles.quantityControls}>
            <TouchableOpacity onPress={() => onUpdateQuantity(item.id, item.quantity - 1)}>
                <Ionicons name="remove-circle-outline" size={28} color="#FFC107" />
            </TouchableOpacity>
            <Text style={styles.quantityText}>{item.quantity}</Text>
            <TouchableOpacity onPress={() => onUpdateQuantity(item.id, item.quantity + 1)}>
                <Ionicons name="add-circle" size={28} color="#FFC107" />
            </TouchableOpacity>
        </View>
    </View>
);

export default function ShoppingListScreen() {
  const { items, updateQuantity, addItem } = useContext(ShoppingListContext);

  return (
    <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.pageTitle}>Shopping List</ThemedText>
        <ScrollView>
            <Text style={styles.sectionTitle}>My List</Text>
            {items.length > 0 ? (
                items.map(item => <ShoppingListItem key={item.id} item={item} onUpdateQuantity={updateQuantity} />)
            ) : (
                <Text style={styles.emptyText}>Your list is empty. Add items from a product page!</Text>
            )}

            <Text style={styles.sectionTitle}>AI Suggestions</Text>
            {aiSuggestions.map(item => (
                <TouchableOpacity key={item.id} style={styles.itemContainer} onPress={() => addItem(item)}>
                    <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
                    <View style={styles.itemInfo}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <Text style={styles.itemQuantity}>Quantity: 1</Text>
                    </View>
                    <Ionicons name="add-circle-outline" size={28} color="gray" />
                </TouchableOpacity>
            ))}
        </ScrollView>
    </SafeAreaView>
  );
}
// Note: You need to add ScrollView to your imports from 'react-native'

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F8F5F2' },
    pageTitle: { paddingHorizontal: 16, paddingBottom: 16 },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', paddingHorizontal: 16, marginTop: 20, marginBottom: 10 },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 12,
        marginHorizontal: 16,
        marginBottom: 12,
    },
    itemImage: { width: 50, height: 50, borderRadius: 8, backgroundColor: '#EAEAEA' },
    itemInfo: { flex: 1, marginLeft: 12 },
    itemName: { fontSize: 16, fontWeight: '600' },
    itemQuantity: { fontSize: 14, color: 'gray', marginTop: 4 },
    quantityControls: { flexDirection: 'row', alignItems: 'center' },
    quantityText: { fontSize: 18, fontWeight: 'bold', marginHorizontal: 12 },
    emptyText: { textAlign: 'center', color: 'gray', margin: 20 },
});