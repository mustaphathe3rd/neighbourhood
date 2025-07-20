import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Rating } from 'react-native-ratings';
import { Ionicons } from '@expo/vector-icons';

type PriceResultCardProps = {
  imageUrl?: string;
  productName: string;
  storeName: string;
  price: number;
  distance?: number | null;
  rating?: number | null;
  stockLevel: number;
  isOutOfState: boolean;
  onPress: () => void;
};

const AvailabilityTag = ({ stockLevel }: {stockLevel: number }) => {
  const stockInfo = {
    1: { text: 'Low Stock', color: '#FF453A' }, // Red
    2: { text: 'Medium Stock', color: '#FF9F0A' }, // Orange
    3: { text: 'High Stock', color: '#30D158' }, // Green
  };
  const info = stockInfo[stockLevel as keyof typeof stockInfo] || {text: 'N/A', color: 'gray'};

  return (
    <View style={[styles.tag, {backgroundColor: info.color }]}>
      <Text style={styles.tagText}>{info.text}</Text>
    </View>
  )
}

export const PriceResultCard = ({ imageUrl, productName, storeName, price, distance, rating, stockLevel, isOutOfState, onPress }: PriceResultCardProps) => {
  return (
    <TouchableOpacity style={styles.cardContainer} onPress={onPress}>
      <Image source={{ uri: imageUrl }} style={styles.image} />
      <View style={styles.infoContainer}>
        <Text style={styles.name} numberOfLines={2}>{productName}</Text>
        {isOutOfState && <Ionicons name="alert-circle-outline" size={20} color="#FF9F0A" />}
        <Text style={styles.store} numberOfLines={1}>at {storeName}</Text>
        
        <View style={styles.metaContainer}>
            {rating && <Rating imageSize={15} readonly startingValue={rating} style={{ paddingVertical: 5 }} />}
            {distance !== null && distance !== undefined && (
                <View style={styles.distanceContainer}>
                    <Ionicons name="location-sharp" size={14} color="gray" />
                    <Text style={styles.metaText}>{distance.toFixed(1)} km away</Text>
                </View>
            )}
        </View>

        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8}}>
            <Text style={styles.price}>₦{price.toLocaleString()}</Text>
            <AvailabilityTag stockLevel={stockLevel} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FFFFFF',
    borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#EAEAEA'
  },
  image: { width: 80, height: 80, borderRadius: 8, backgroundColor: '#F0F0F0' },
  infoContainer: { flex: 1, marginLeft: 12 },
  name: { fontSize: 16, fontWeight: '600', color: '#1A1A1A', marginBottom: 2 },
  store: { fontSize: 14, color: '#666', marginBottom: 4 },
  metaContainer: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  distanceContainer: { flexDirection: 'row', alignItems: 'center', marginLeft: 10 },
  metaText: { fontSize: 13, color: 'gray', marginLeft: 4 },
  price: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A' },
  tag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  tagText: { color: 'white', fontSize: 11, fontWeight: 'bold' },
   header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  outOfStateCard: {
    borderColor: '#FF9F0A', // Add an orange border to highlight
    borderWidth: 1.5,
  },
});