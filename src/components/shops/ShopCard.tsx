import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Lucide from 'lucide-react-native';
const MapPin = Lucide.MapPin as any;
import tw from 'twrnc';
import { RatingBadge } from './RatingBadge';
import { PriceRange } from './PriceRange';
import { API_URL } from '../../lib/apiClient';

export const resolveImageUrl = (imageStr: string | undefined | null): string => {
  if (!imageStr) return '';
  if (imageStr.startsWith('http://') || imageStr.startsWith('https://')) {
    return imageStr;
  }
  const path = imageStr.startsWith('/') ? imageStr : `/${imageStr}`;
  return `${API_URL}${path}`;
};

export interface ShopCardProps {
  shop: {
    _id: string;
    shopName?: string;
    name?: string;
    slug: string;
    shopDescription?: string;
    description?: string;
    images?: string[];
    firstImage?: string | null;
    reviewRatingAverage?: number;
    reviewCount?: number;
    priceRange?: { min: number; max: number };
    city?: { _id: string; name: string } | string;
    category?: { _id: string; name: string } | string;
  };
}

export function ShopCard({ shop }: ShopCardProps) {
  const navigation = useNavigation<any>();

  const name = shop.shopName || shop.name || '';
  const description = shop.shopDescription || shop.description || '';
  const imageUrl = resolveImageUrl(shop.firstImage ?? shop.images?.[0]);

  const cityName =
    typeof shop.city === 'object' && shop.city !== null
      ? shop.city.name
      : '';

  const categoryName =
    typeof shop.category === 'object' && shop.category !== null
      ? shop.category.name
      : '';

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => navigation.navigate('VenueDetail', { slug: shop.slug })}
      style={tw`mb-5 overflow-hidden`}
    >
      {/* Image Container */}
      <View style={tw`relative w-full h-48 rounded-2xl bg-zinc-100 dark:bg-zinc-900 overflow-hidden border border-zinc-100 dark:border-zinc-800`}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            resizeMode="cover"
            style={tw`w-full h-full`}
          />
        ) : (
          <View style={tw`w-full h-full items-center justify-center bg-zinc-100 dark:bg-zinc-950`}>
            <Text style={tw`text-3xl opacity-20`}>🍽️</Text>
          </View>
        )}

        {/* Rating Badge Overlay */}
        <View style={tw`absolute top-3 right-3`}>
          <RatingBadge
            reviewRatingAverage={shop.reviewRatingAverage ?? -1}
            reviewCount={shop.reviewCount}
            size="sm"
          />
        </View>
      </View>

      {/* Content wrapper */}
      <View style={tw`mt-3 px-1`}>
        {/* Category subtitle */}
        {!!categoryName && (
          <Text style={tw`text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1`}>
            {categoryName}
          </Text>
        )}

        {/* Title */}
        <Text style={tw`font-bold text-base text-zinc-900 dark:text-white mb-1`} numberOfLines={1}>
          {name}
        </Text>

        {/* Description */}
        {!!description && (
          <Text style={tw`text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-2`} numberOfLines={2}>
            {description}
          </Text>
        )}

        {/* Footer Meta Row */}
        <View style={tw`flex-row items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-2`}>
          {!!cityName && (
            <View style={tw`flex-row items-center`}>
              <MapPin size={12} color="#9ca3af" style={tw`mr-1`} />
              <Text style={tw`text-xs text-zinc-500 dark:text-zinc-400`}>
                {cityName}
              </Text>
            </View>
          )}
          <PriceRange priceRange={shop.priceRange} />
        </View>
      </View>
    </TouchableOpacity>
  );
}
