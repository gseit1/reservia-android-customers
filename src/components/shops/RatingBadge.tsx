import React from 'react';
import { View, Text } from 'react-native';
import * as Lucide from 'lucide-react-native';
const Star = Lucide.Star as any;
import tw from 'twrnc';

interface RatingBadgeProps {
  reviewRatingAverage: number;
  reviewCount?: number;
  size?: 'sm' | 'md';
}

export function RatingBadge({ reviewRatingAverage, reviewCount, size = 'md' }: RatingBadgeProps) {
  const hasRating = reviewRatingAverage !== undefined && reviewRatingAverage > -1;
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';
  const iconSize = size === 'sm' ? 10 : 13;

  if (!hasRating) {
    return (
      <View style={tw`flex-row items-center px-2 py-0.5 rounded-full bg-black/60 dark:bg-black/75`}>
        <Text style={tw`text-white font-bold tracking-wide ${textSize}`}>
          Νέος
        </Text>
      </View>
    );
  }

  return (
    <View style={tw`flex-row items-center px-2 py-0.5 rounded-full bg-black/60 dark:bg-black/75`}>
      <Star size={iconSize} color="#f59e0b" fill="#f59e0b" style={tw`mr-1`} />
      <Text style={tw`text-white font-bold ${textSize}`}>
        {reviewRatingAverage.toFixed(1)}
        {reviewCount !== undefined && reviewCount > 0 && (
          <Text style={tw`text-white/70 font-normal`}> ({reviewCount})</Text>
        )}
      </Text>
    </View>
  );
}
