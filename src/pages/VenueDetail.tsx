import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as Lucide from 'lucide-react-native';
const MapPin = Lucide.MapPin as any;
const Phone = Lucide.Phone as any;
const Clock = Lucide.Clock as any;
const Star = Lucide.Star as any;
const Heart = Lucide.Heart as any;
const ExternalLink = Lucide.ExternalLink as any;
const Send = Lucide.Send as any;
import tw from 'twrnc';
import { useAuth } from '../contexts/AuthContext';
import { strings } from '../strings/greek';
import apiClient from '../lib/apiClient';
import { RatingBadge } from '../components/shops/RatingBadge';
import { PriceRange } from '../components/shops/PriceRange';
import { resolveImageUrl } from '../components/shops/ShopCard';

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

function decimalToTime(decimal: number): string {
  const normalized = decimal >= 24 ? decimal - 24 : decimal;
  const h = Math.floor(normalized);
  const m = Math.round((normalized - h) * 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export default function VenueDetail() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { slug } = route.params || {};
  const { isAuthenticated } = useAuth();

  const [shop, setShop] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavToggling, setIsFavToggling] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  // Review Form State
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const fetchShopDetails = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get(`/api/shop/slug/${slug}`);
      const shopData = res.data;
      setShop(shopData);

      // Fetch reviews
      const reviewsRes = await apiClient.get(`/api/shop/${shopData._id}/reviews`);
      setReviews(reviewsRes.data || []);

      // Check favorite status
      if (isAuthenticated) {
        const favRes = await apiClient.get(`/api/user/favorites/${shopData._id}/status`);
        setIsFavorite(favRes.data?.isFavorite || false);
      }
    } catch (err) {
      console.error('Error fetching venue details:', err);
      Alert.alert('Σφάλμα', 'Αδυναμία φόρτωσης στοιχείων καταστήματος.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (slug) {
      fetchShopDetails();
    }
  }, [slug, isAuthenticated]);

  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      navigation.navigate('Login');
      return;
    }
    setIsFavToggling(true);
    try {
      if (isFavorite) {
        await apiClient.delete(`/api/user/favorites/${shop._id}`);
        setIsFavorite(false);
      } else {
        await apiClient.post('/api/user/favorites', { shopId: shop._id });
        setIsFavorite(true);
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    } finally {
      setIsFavToggling(false);
    }
  };

  const handleReviewSubmit = async () => {
    if (reviewRating === 0) {
      Alert.alert('Σφάλμα', 'Παρακαλώ επιλέξτε βαθμολογία.');
      return;
    }
    setIsSubmittingReview(true);
    try {
      await apiClient.post('/api/review', {
        shopId: shop._id,
        rating: reviewRating,
        text: reviewText.trim() || undefined,
      });
      setReviewSubmitted(true);
      setReviewRating(0);
      setReviewText('');
      // Refresh reviews list
      const reviewsRes = await apiClient.get(`/api/shop/${shop._id}/reviews`);
      setReviews(reviewsRes.data || []);
      Alert.alert('Επιτυχία', 'Η κριτική σας καταχωρήθηκε επιτυχώς!');
    } catch (err: any) {
      Alert.alert('Σφάλμα', err.message || 'Αποτυχία υποβολής κριτικής.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoading) {
    return (
      <View style={tw`flex-grow justify-center items-center bg-white dark:bg-black`}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (!shop) {
    return (
      <View style={tw`flex-grow justify-center items-center p-6 bg-white dark:bg-black`}>
        <Text style={tw`text-4xl mb-4`}>🍽️</Text>
        <Text style={tw`text-lg font-bold text-zinc-900 dark:text-white mb-3`}>
          Ο χώρος δεν βρέθηκε
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('SearchTab')}
          style={tw`bg-black dark:bg-white px-6 py-2.5 rounded-xl`}
        >
          <Text style={tw`text-white dark:text-black font-bold`}>Αναζήτηση χώρων</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const images = shop.images || [];
  const cityName = typeof shop.city === 'object' && shop.city ? shop.city.name : '';
  const categoryName = typeof shop.category === 'object' && shop.category ? shop.category.name : '';
  const rawDesc = shop.shopDescription || '';

  return (
    <View style={tw`flex-1 bg-white dark:bg-black`}>
      <ScrollView contentContainerStyle={tw`pb-24`}>
        {/* Photo Slider */}
        {images.length > 0 && (
          <View style={tw`relative w-full h-56 bg-zinc-100 dark:bg-zinc-900`}>
            <Image
              source={{ uri: resolveImageUrl(images[photoIndex]) }}
              style={tw`w-full h-full`}
              resizeMode="cover"
            />
            {images.length > 1 && (
              <View style={tw`absolute bottom-4 left-0 right-0 flex-row justify-center gap-1.5`}>
                {images.slice(0, 8).map((_: string, i: number) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => setPhotoIndex(i)}
                    style={tw`w-2 h-2 rounded-full ${i === photoIndex ? 'bg-black dark:bg-white w-4' : 'bg-black/40 dark:bg-white/40'}`}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* Thumbnailstrip */}
        {images.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={tw`px-4 py-3 gap-2`}
          >
            {images.slice(0, 6).map((img: string, i: number) => (
              <TouchableOpacity
                key={i}
                onPress={() => setPhotoIndex(i)}
                style={tw`w-14 h-14 rounded-xl overflow-hidden border-2 ${
                  i === photoIndex ? 'border-black dark:border-white' : 'border-transparent'
                }`}
              >
                <Image source={{ uri: resolveImageUrl(img) }} style={tw`w-full h-full`} resizeMode="cover" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <View style={tw`px-4 pt-4`}>
          {/* Category & Heart row */}
          <View style={tw`flex-row justify-between items-start`}>
            <View style={tw`flex-1`}>
              {!!categoryName && (
                <Text style={tw`text-xs font-bold text-zinc-500 uppercase tracking-widest`}>
                  {categoryName}
                </Text>
              )}
              <Text style={tw`font-bold text-2xl text-zinc-900 dark:text-white mt-1`}>
                {shop.shopName}
              </Text>
            </View>

            <TouchableOpacity
              onPress={toggleFavorite}
              disabled={isFavToggling}
              style={tw`p-3 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950`}
            >
              <Heart size={20} color={isFavorite ? '#e11d48' : '#9ca3af'} fill={isFavorite ? '#e11d48' : 'transparent'} />
            </TouchableOpacity>
          </View>

          {/* Subtitle row */}
          <View style={tw`flex-row items-center gap-3 mt-2`}>
            <RatingBadge reviewRatingAverage={shop.reviewRatingAverage} reviewCount={shop.reviewCount} />
            <PriceRange priceRange={shop.priceRange} />
            {!!cityName && (
              <View style={tw`flex-row items-center`}>
                <MapPin size={12} color="#9ca3af" style={tw`mr-1`} />
                <Text style={tw`text-xs text-zinc-500 dark:text-zinc-400`}>{cityName}</Text>
              </View>
            )}
          </View>

          {/* Policy description block */}
          {!!shop.reservationPolicy && (
            <View style={tw`mt-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900`}>
              <Text style={tw`text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1`}>
                Πολιτική Κρατήσεων
              </Text>
              <Text style={tw`text-xs text-zinc-600 dark:text-zinc-450 leading-relaxed`}>
                {shop.reservationPolicy}
              </Text>
            </View>
          )}

          {/* Description */}
          <View style={tw`mt-6`}>
            <Text style={tw`text-base font-bold text-zinc-900 dark:text-white mb-2`}>
              {strings.venue.description}
            </Text>
            <Text style={tw`text-sm text-zinc-650 dark:text-zinc-400 leading-relaxed`}>
              {rawDesc.length > 150 && !isDescExpanded ? (
                <>
                  {rawDesc.slice(0, 150)}...
                  <Text onPress={() => setIsDescExpanded(true)} style={tw`font-bold text-black dark:text-white ml-1`}>
                    {' '}περισσότερα
                  </Text>
                </>
              ) : (
                <>
                  {rawDesc}
                  {rawDesc.length > 150 && (
                    <Text onPress={() => setIsDescExpanded(false)} style={tw`font-bold text-black dark:text-white ml-1`}>
                      {' '}λιγότερα
                  </Text>
                  )}
                </>
              )}
            </Text>
          </View>

          {/* Contact Details */}
          <View style={tw`mt-6 border-t border-zinc-100 dark:border-zinc-900 pt-6 gap-3`}>
            <Text style={tw`text-base font-bold text-zinc-900 dark:text-white mb-1`}>
              {strings.venue.contact}
            </Text>
            {!!shop.phone && (
              <View style={tw`flex-row items-center gap-2.5`}>
                <Phone size={15} color="#71717a" />
                <Text style={tw`text-sm text-zinc-600 dark:text-zinc-400`}>{shop.phone}</Text>
              </View>
            )}
            {!!shop.address && (
              <View style={tw`flex-row items-center gap-2.5`}>
                <MapPin size={15} color="#71717a" />
                <Text style={tw`text-sm text-zinc-600 dark:text-zinc-400`}>
                  {shop.address}{!!cityName && `, ${cityName}`}
                </Text>
              </View>
            )}
          </View>

          {/* Working hours */}
          <View style={tw`mt-6 border-t border-zinc-100 dark:border-zinc-900 pt-6`}>
            <View style={tw`flex-row items-center gap-2 mb-4`}>
              <Clock size={16} color="#71717a" />
              <Text style={tw`text-base font-bold text-zinc-900 dark:text-white`}>
                {strings.venue.openingHours}
              </Text>
            </View>
            <View style={tw`border border-zinc-100 dark:border-zinc-800 rounded-2xl overflow-hidden`}>
              {DAY_ORDER.map((day, idx) => {
                const hours = shop.openingHours?.[day];
                const isOpen = hours?.isOpen ?? false;
                return (
                  <View
                    key={day}
                    style={tw`flex-row items-center justify-between px-5 py-3 ${
                      idx % 2 === 0 ? 'bg-zinc-50 dark:bg-zinc-950' : 'bg-white dark:bg-black'
                    }`}
                  >
                    <Text style={tw`text-sm font-semibold text-zinc-700 dark:text-zinc-300 capitalize`}>
                      {strings.venue.days[day]}
                    </Text>
                    {isOpen && hours ? (
                      <Text style={tw`text-sm text-zinc-600 dark:text-zinc-400`}>
                        {decimalToTime(hours.open)} – {decimalToTime(hours.close)}
                      </Text>
                    ) : (
                      <Text style={tw`text-sm text-zinc-400`}>{strings.venue.closed}</Text>
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          {/* Reviews list */}
          <View style={tw`mt-6 border-t border-zinc-100 dark:border-zinc-900 pt-6`}>
            <Text style={tw`text-base font-bold text-zinc-900 dark:text-white mb-4`}>
              {strings.venue.reviews(reviews.length)}
            </Text>
            {reviews.length === 0 ? (
              <Text style={tw`text-zinc-400 text-sm`}>{strings.venue.noReviews}</Text>
            ) : (
              <View style={tw`gap-4`}>
                {reviews.slice(0, 10).map((review: any) => (
                  <View key={review._id} style={tw`p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm`}>
                    <View style={tw`flex-row justify-between items-center mb-2`}>
                      <View style={tw`flex-row gap-0.5`}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            color={i < review.rating ? '#f59e0b' : '#e4e4e7'}
                            fill={i < review.rating ? '#f59e0b' : 'transparent'}
                          />
                        ))}
                      </View>
                      <Text style={tw`text-[10px] text-zinc-400`}>
                        {new Date(review.createdAt).toLocaleDateString('el-GR')}
                      </Text>
                    </View>
                    {!!review.text && (
                      <Text style={tw`text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed`}>
                        {review.text}
                      </Text>
                    )}
                    {!!review.reviewerName && (
                      <Text style={tw`text-[11px] text-zinc-400 mt-2`}>— {review.reviewerName}</Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Write a review */}
          <View style={tw`mt-6 border-t border-zinc-100 dark:border-zinc-900 pt-6`}>
            <Text style={tw`text-base font-bold text-zinc-900 dark:text-white mb-4`}>
              {strings.venue.writeReview}
            </Text>
            {!isAuthenticated ? (
              <View style={tw`p-5 rounded-2xl border border-zinc-100 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-950 items-center`}>
                <Text style={tw`text-sm text-zinc-500 mb-3`}>Συνδεθείτε για να γράψετε κριτική.</Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Login')}
                  style={tw`bg-black dark:bg-white px-5 py-2.5 rounded-xl`}
                >
                  <Text style={tw`text-white dark:text-black font-bold text-sm`}>Σύνδεση</Text>
                </TouchableOpacity>
              </View>
            ) : reviewSubmitted ? (
              <View style={tw`p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 items-center`}>
                <Text style={tw`text-sm font-bold text-emerald-700 dark:text-emerald-450`}>
                  ✓ Η κριτική σας καταχωρήθηκε! Ευχαριστούμε.
                </Text>
              </View>
            ) : (
              <View style={tw`p-5 rounded-2xl border border-zinc-100 dark:border-zinc-850 bg-white dark:bg-zinc-950 gap-4 shadow-sm`}>
                {/* Rating selection */}
                <View>
                  <Text style={tw`text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wide`}>
                    Βαθμολογία
                  </Text>
                  <View style={tw`flex-row gap-2`}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <TouchableOpacity key={star} onPress={() => setReviewRating(star)}>
                        <Star
                          size={28}
                          color={star <= reviewRating ? '#ec4899' : '#e4e4e7'}
                          fill={star <= reviewRating ? '#ec4899' : 'transparent'}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Text comment */}
                <View>
                  <Text style={tw`text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wide`}>
                    Σχόλιο (προαιρετικό)
                  </Text>
                  <TextInput
                    multiline
                    value={reviewText}
                    onChangeText={setReviewText}
                    maxLength={500}
                    placeholder="Πείτε μας για την εμπειρία σας…"
                    placeholderTextColor="#a1a1aa"
                    style={[tw`border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 rounded-xl p-3 text-sm text-zinc-900 dark:text-white h-24`, { textAlignVertical: 'top' }]}
                  />
                  <Text style={tw`text-right text-[10px] text-zinc-400 mt-1`}>{reviewText.length}/500</Text>
                </View>

                <TouchableOpacity
                  onPress={handleReviewSubmit}
                  disabled={isSubmittingReview || reviewRating === 0}
                  style={tw`flex-row items-center justify-center gap-2 bg-black dark:bg-white h-11 rounded-xl ${
                    isSubmittingReview || reviewRating === 0 ? 'opacity-55' : ''
                  }`}
                >
                  <Send size={14} color={tw.prefixMatch('dark') ? '#000' : '#fff'} />
                  <Text style={tw`text-sm font-bold text-white dark:text-black`}>
                    {isSubmittingReview ? 'Υποβολή…' : 'Υποβολή Κριτικής'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Floating Bottom Booking CTA bar */}
      <View style={tw`absolute bottom-0 left-0 right-0 bg-white/95 dark:bg-zinc-900/95 border-t border-zinc-200 dark:border-zinc-800 px-4 py-3 flex-row items-center justify-between shadow-xl`}>
        <View style={tw`flex-1 pr-3`}>
          <Text style={tw`font-bold text-sm text-zinc-800 dark:text-white`} numberOfLines={1}>
            {shop.shopName}
          </Text>
          <Text style={tw`text-[10px] text-zinc-400 uppercase tracking-wide mt-0.5`} numberOfLines={1}>
            {categoryName} {!!cityName && `• ${cityName}`}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('BookingFlow', { slug: shop.slug })}
          style={tw`bg-black dark:bg-white px-7 py-2.5 rounded-full`}
        >
          <Text style={tw`text-white dark:text-black font-bold text-sm`}>
            Κράτηση
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
