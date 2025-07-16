import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Rating } from 'react-native-ratings';
import { formatDistanceToNow } from 'date-fns';

type ReviewCardProps = {
  review: {
    user: { name: string };
    rating: number;
    comment: string | null;
    timestamp: string;
  };
};

export const ReviewCard = ({ review }: ReviewCardProps) => {
  return (
    <View style={styles.reviewCard}>
      <Image source={{ uri: 'https://i.pravatar.cc/150' }} style={styles.avatar} />
      <View style={styles.reviewContent}>
        <View style={styles.reviewHeader}>
          <Text style={styles.reviewName}>{review.user.name}</Text>
          <Text style={styles.reviewTime}>
            {formatDistanceToNow(new Date(review.timestamp), { addSuffix: true })}
          </Text>
        </View>
        <Rating imageSize={15} readonly startingValue={review.rating} style={styles.rating} />
        {review.comment && <Text style={styles.reviewComment}>{review.comment}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  reviewCard: { flexDirection: 'row', marginBottom: 20, padding: 12, backgroundColor: '#FFF', borderRadius: 8 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  reviewContent: { flex: 1 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  reviewName: { fontWeight: 'bold' },
  reviewTime: { color: 'gray', fontSize: 12 },
  rating: { paddingVertical: 4, alignItems: 'flex-start' },
  reviewComment: { color: '#333', marginTop: 4 },
});