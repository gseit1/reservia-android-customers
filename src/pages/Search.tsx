import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Modal, FlatList, Image } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as Lucide from 'lucide-react-native';
const SearchIcon = Lucide.Search as any;
const SlidersHorizontal = Lucide.SlidersHorizontal as any;
const ChevronDown = Lucide.ChevronDown as any;
const X = Lucide.X as any;
const Map = Lucide.Map as any;
const List = Lucide.List as any;
const MapPin = Lucide.MapPin as any;
import tw from 'twrnc';
import MapView, { Marker, Callout } from 'react-native-maps';
import { useCity } from '../contexts/CityContext';
import { useTheme } from '../contexts/ThemeContext';
import { strings } from '../strings/greek';
import apiClient from '../lib/apiClient';
import { ShopCard, resolveImageUrl } from '../components/shops/ShopCard';

const darkMapStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#1f1f1f" }] },
  { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#1f1f1f" }] },
  { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "color": "#757575" }] },
  { "featureType": "landscape", "elementType": "geometry", "stylers": [{ "color": "#2c2c2c" }] },
  { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
  { "featureType": "road", "elementType": "geometry.fill", "stylers": [{ "color": "#252525" }] },
  { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#8a8a8a" }] },
  { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#3c3c3c" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#0d0d0d" }] }
];

interface City {
  _id: string;
  name: string;
}

interface Category {
  _id: string;
  name: string;
}

interface Shop {
  _id: string;
  shopName: string;
  slug: string;
  shopDescription: string;
  category: Category | string;
  city: City | string;
  images: string[];
  priceRange: { min: number; max: number };
  reviewRatingAverage: number;
  reviewCount: number;
  firstImage?: string;
  address?: string;
  location?: {
    type: string;
    coordinates: number[];
  };
}

const SORT_OPTIONS = [
  { value: 'relevance', label: strings.search.sortRelevance },
  { value: 'rating', label: strings.search.sortRating },
  { value: 'name', label: strings.search.sortName },
  { value: 'price_low', label: strings.search.sortPriceLow },
  { value: 'price_high', label: strings.search.sortPriceHigh },
] as const;

export default function Search() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { selectedCityId, setSelectedCityId } = useCity();

  // Route parameters
  const routeCityId = route.params?.city_id || '';
  const routeCategoryId = route.params?.category_id || '';

  const [query, setQuery] = useState('');
  const [cityId, setCityId] = useState(routeCityId);
  const [categoryId, setCategoryId] = useState(routeCategoryId);
  const [sortBy, setSortBy] = useState('relevance');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [selectedMapShop, setSelectedMapShop] = useState<Shop | null>(null);

  const [cities, setCities] = useState<City[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(false);

  // Modals for filters
  const [cityModalOpen, setCityModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [sortModalOpen, setSortModalOpen] = useState(false);

  // Sync state with route parameters
  useEffect(() => {
    if (route.params?.city_id) {
      setCityId(route.params.city_id);
    }
    if (route.params?.category_id) {
      setCategoryId(route.params.category_id);
    }
  }, [route.params]);

  // Sync with global city context
  useEffect(() => {
    if (selectedCityId) {
      setCityId(selectedCityId);
    }
  }, [selectedCityId]);

  // Fetch filters
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [catsRes, citiesRes] = await Promise.all([
          apiClient.get('/api/categories'),
          apiClient.get('/api/cities'),
        ]);
        setCategories(catsRes.data?.categories || []);
        setCities(citiesRes.data?.cities || []);
      } catch (err) {
        console.error('Error fetching search filters:', err);
      }
    };
    fetchFilters();
  }, []);

  // Fetch shops
  const fetchShops = useCallback(async (pageNum = 1, append = false) => {
    if (pageNum === 1) setIsLoading(true);
    else setIsFetchingMore(true);

    try {
      const params: any = {
        query: query || undefined,
        city_id: cityId || undefined,
        category_id: categoryId || undefined,
        sort_by: sortBy,
        page: pageNum,
        per_page: 10,
      };

      const res = await apiClient.get('/api/search/shops', { params });
      const newShops = res.data?.shops || [];
      const pagination = res.data?.pagination;

      setShops((prev) => (append ? [...prev, ...newShops] : newShops));
      setHasNextPage(pagination?.has_next || false);
      setPage(pageNum);
    } catch (err) {
      console.error('Error fetching shops in search:', err);
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  }, [query, cityId, categoryId, sortBy]);

  // Trigger search on filter changes or manual submit
  useEffect(() => {
    fetchShops(1, false);
    setSelectedMapShop(null);
  }, [fetchShops]);

  // Clear selection on view mode change
  useEffect(() => {
    setSelectedMapShop(null);
  }, [viewMode]);

  const handleSearchSubmit = () => {
    fetchShops(1, false);
  };

  const loadMore = () => {
    if (hasNextPage && !isFetchingMore) {
      fetchShops(page + 1, true);
    }
  };

  const clearFilters = () => {
    setQuery('');
    setCityId('');
    setSelectedCityId('');
    setCategoryId('');
    setSortBy('relevance');
  };

  const { theme } = useTheme();
  const isFiltered = !!(query || cityId || categoryId || sortBy !== 'relevance');
  const activeCity = cities.find((c) => c._id === cityId);
  const activeCategory = categories.find((c) => c._id === categoryId);
  const activeSort = SORT_OPTIONS.find((s) => s.value === sortBy);

  // Filter shops with valid coordinates for map rendering
  const validShops = shops.filter(
    (shop: any) =>
      shop.location?.coordinates &&
      Array.isArray(shop.location.coordinates) &&
      shop.location.coordinates.length === 2
  );

  return (
    <View style={tw`flex-1 bg-white dark:bg-black`}>
      {/* Search and Filters Bar */}
      <View style={tw`px-4 pt-4 pb-2 border-b border-zinc-100 dark:border-zinc-900`}>
        <View style={tw`flex-row gap-3 mb-3`}>
          <View style={tw`flex-1 relative flex-row items-center border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 rounded-xl px-3 h-12`}>
            <SearchIcon size={16} color="#9ca3af" style={tw`mr-2`} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={handleSearchSubmit}
              placeholder={strings.home.searchPlaceholder}
              placeholderTextColor="#9ca3af"
              style={tw`flex-1 text-sm text-zinc-900 dark:text-white h-full`}
            />
            {!!query && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <X size={16} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            onPress={() => setShowFilters((f) => !f)}
            style={tw`h-12 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex-row items-center gap-2`}
          >
            <SlidersHorizontal size={16} color="#4b5563" />
            <Text style={tw`text-xs font-bold text-zinc-600 dark:text-zinc-300`}>
              {strings.search.filters}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Filters Panel */}
        {showFilters && (
          <View style={tw`p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 gap-3`}>
            <View style={tw`flex-row gap-2`}>
              {/* City Filter */}
              <TouchableOpacity
                onPress={() => setCityModalOpen(true)}
                style={tw`flex-1 h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black flex-row items-center justify-between`}
              >
                <Text style={tw`text-xs font-semibold text-zinc-700 dark:text-zinc-300`} numberOfLines={1}>
                  {activeCity ? activeCity.name : strings.search.city}
                </Text>
                <ChevronDown size={12} color="#9ca3af" />
              </TouchableOpacity>

              {/* Category Filter */}
              <TouchableOpacity
                onPress={() => setCategoryModalOpen(true)}
                style={tw`flex-1 h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black flex-row items-center justify-between`}
              >
                <Text style={tw`text-xs font-semibold text-zinc-700 dark:text-zinc-300`} numberOfLines={1}>
                  {activeCategory ? activeCategory.name : strings.search.category}
                </Text>
                <ChevronDown size={12} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <View style={tw`flex-row justify-between items-center mt-1`}>
              {/* Sort Filter */}
              <TouchableOpacity
                onPress={() => setSortModalOpen(true)}
                style={tw`w-[60%] h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black flex-row items-center justify-between`}
              >
                <Text style={tw`text-xs font-semibold text-zinc-700 dark:text-zinc-300`} numberOfLines={1}>
                  {activeSort ? activeSort.label : strings.search.sortBy}
                </Text>
                <ChevronDown size={12} color="#9ca3af" />
              </TouchableOpacity>

              {isFiltered && (
                <TouchableOpacity
                  onPress={clearFilters}
                  style={tw`flex-row items-center gap-1 py-2`}
                >
                  <X size={12} color="#ec4899" />
                  <Text style={tw`text-xs font-bold text-pink-600`}>Καθαρισμός</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>

      {/* View Modes */}
      {viewMode === 'list' ? (
        isLoading ? (
          <View style={tw`flex-1 justify-center items-center`}>
            <ActivityIndicator size="large" color="#000" />
          </View>
        ) : shops.length > 0 ? (
          <FlatList
            data={shops}
            keyExtractor={(item) => item._id}
            contentContainerStyle={tw`p-4`}
            renderItem={({ item }) => <ShopCard shop={item} />}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              isFetchingMore ? (
                <ActivityIndicator size="small" color="#000" style={tw`py-4`} />
              ) : null
            }
          />
        ) : (
          /* Empty State */
          <ScrollView contentContainerStyle={tw`flex-grow justify-center items-center px-6 py-20`}>
            <Text style={tw`text-5xl mb-4`}>🔍</Text>
            <Text style={tw`text-lg font-bold text-zinc-900 dark:text-white mb-2 text-center`}>
              {strings.search.noResults}
            </Text>
            <Text style={tw`text-xs text-zinc-400 dark:text-zinc-500 mb-6 text-center max-w-xs`}>
              {strings.search.noResultsHint}
            </Text>
            <View style={tw`gap-2.5 w-full max-w-xs`}>
              <TouchableOpacity
                onPress={() => navigation.navigate('Home')}
                style={tw`h-11 bg-black dark:bg-white rounded-xl items-center justify-center`}
              >
                <Text style={tw`text-sm font-bold text-white dark:text-black`}>Αρχική</Text>
              </TouchableOpacity>
              {isFiltered && (
                <TouchableOpacity
                  onPress={clearFilters}
                  style={tw`h-11 border border-zinc-200 dark:border-zinc-800 rounded-xl items-center justify-center`}
                >
                  <Text style={tw`text-sm font-bold text-zinc-700 dark:text-zinc-300`}>
                    Καθαρισμός φίλτρων
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        )
      ) : (
        /* Map Mode (Real MapView with circular image markers and detailed overlay card) */
        <View style={tw`flex-1 w-full h-full relative`}>
          <MapView
            style={tw`w-full h-full`}
            customMapStyle={theme === 'dark' ? darkMapStyle : undefined}
            onPress={() => setSelectedMapShop(null)}
            initialRegion={{
              latitude: validShops.length > 0 ? validShops[0].location!.coordinates[1] : 37.9838,
              longitude: validShops.length > 0 ? validShops[0].location!.coordinates[0] : 23.7275,
              latitudeDelta: 0.08,
              longitudeDelta: 0.08,
            }}
          >
            {validShops.map((shop: any) => (
              <Marker
                key={shop._id}
                coordinate={{
                  latitude: shop.location!.coordinates[1],
                  longitude: shop.location!.coordinates[0],
                }}
                onPress={(e) => {
                  e.stopPropagation();
                  setSelectedMapShop(shop);
                }}
              >
                {/* Custom Circly Image Pin */}
                <View style={tw`items-center justify-center`}>
                  <View style={tw`w-11 h-11 rounded-full border-2 border-black dark:border-white overflow-hidden bg-white dark:bg-zinc-900 shadow-lg`}>
                    {shop.firstImage ?? shop.images?.[0] ? (
                      <Image
                        source={{ uri: resolveImageUrl(shop.firstImage ?? shop.images?.[0]) }}
                        style={tw`w-full h-full`}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={tw`w-full h-full items-center justify-center bg-zinc-100 dark:bg-zinc-800`}>
                        <Text style={tw`text-[10px]`}>🍽️</Text>
                      </View>
                    )}
                  </View>
                  <View style={tw`w-2 h-2 bg-black dark:bg-white rotate-45 -mt-1 shadow-sm`} />
                </View>
              </Marker>
            ))}
          </MapView>

          {/* Floating Shop Details Card overlay */}
          {selectedMapShop && (
            <View style={tw`absolute bottom-20 left-4 right-4 bg-white dark:bg-zinc-950 p-4 rounded-3xl shadow-2xl border border-zinc-100 dark:border-zinc-900 z-50 gap-3.5`}>
              <View style={tw`flex-row gap-3.5`}>
                {/* Shop Image */}
                <Image
                  source={{ uri: resolveImageUrl(selectedMapShop.firstImage ?? selectedMapShop.images?.[0]) }}
                  style={tw`w-14 h-14 rounded-2xl`}
                  resizeMode="cover"
                />
                {/* Name, Category */}
                <View style={tw`flex-1 justify-center`}>
                  <Text style={tw`text-[9px] font-bold uppercase tracking-widest text-zinc-500`}>
                    {typeof selectedMapShop.category === 'object' && selectedMapShop.category
                      ? selectedMapShop.category.name
                      : ''}
                  </Text>
                  <Text style={tw`text-sm font-bold text-zinc-900 dark:text-white mt-0.5`} numberOfLines={1}>
                    {selectedMapShop.shopName}
                  </Text>
                  <Text style={tw`text-xs text-zinc-400 mt-0.5`} numberOfLines={1}>
                    📍 {selectedMapShop.address}
                  </Text>
                </View>
                {/* Close Button */}
                <TouchableOpacity onPress={() => setSelectedMapShop(null)} style={tw`p-1.5 self-start`}>
                  <X size={14} color="#71717a" />
                </TouchableOpacity>
              </View>

              {/* Book / View Buttons */}
              <View style={tw`flex-row gap-2`}>
                <TouchableOpacity
                  onPress={() => navigation.navigate('VenueDetail', { slug: selectedMapShop.slug })}
                  style={tw`flex-1 h-10 border border-zinc-200 dark:border-zinc-800 rounded-xl items-center justify-center`}
                >
                  <Text style={tw`text-xs font-bold text-zinc-700 dark:text-zinc-300`}>Λεπτομέρειες</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => navigation.navigate('BookingFlow', { shopId: selectedMapShop._id, shopName: selectedMapShop.shopName })}
                  style={tw`flex-1 h-10 bg-black dark:bg-white rounded-xl items-center justify-center`}
                >
                  <Text style={tw`text-xs font-bold text-white dark:text-black`}>Κράτηση</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Floating Toggle Button */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setViewMode((m) => (m === 'list' ? 'map' : 'list'))}
        style={tw`absolute bottom-6 self-center flex-row items-center gap-2 px-6 py-3 bg-zinc-900 dark:bg-white rounded-full shadow-lg z-50`}
      >
        {viewMode === 'list' ? (
          <>
            <Map size={15} color={tw.prefixMatch('dark') ? '#000' : '#fff'} />
            <Text style={tw`text-xs font-bold text-white dark:text-black`}>Χάρτης</Text>
          </>
        ) : (
          <>
            <List size={15} color={tw.prefixMatch('dark') ? '#000' : '#fff'} />
            <Text style={tw`text-xs font-bold text-white dark:text-black`}>Λίστα</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Selection Modals (Styled as Premium Bottom Sheets) */}
      {/* City Modal */}
      <Modal visible={cityModalOpen} transparent animationType="slide">
        <TouchableOpacity activeOpacity={1} onPress={() => setCityModalOpen(false)} style={tw`flex-1 justify-end bg-black/50`}>
          <View style={tw`bg-white dark:bg-zinc-950 rounded-t-3xl border-t border-zinc-200 dark:border-zinc-900 max-h-[60%] w-full overflow-hidden`}>
            <View style={tw`w-12 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full self-center mt-3 mb-1`} />
            <View style={tw`p-4 border-b border-zinc-100 dark:border-zinc-900`}>
              <Text style={tw`text-sm font-bold text-zinc-900 dark:text-white text-center`}>Επιλογή Πόλης</Text>
            </View>
            <ScrollView contentContainerStyle={tw`p-3 pb-8`}>
              <TouchableOpacity
                onPress={() => { setCityId(''); setCityModalOpen(false); }}
                style={tw`px-5 py-3.5 rounded-xl mb-1 ${!cityId ? 'bg-zinc-100 dark:bg-zinc-900' : ''}`}
              >
                <Text style={tw`text-xs font-semibold text-zinc-800 dark:text-zinc-200`}>{strings.search.allCities}</Text>
              </TouchableOpacity>
              {cities.map((c) => (
                <TouchableOpacity
                  key={c._id}
                  onPress={() => { setCityId(c._id); setCityModalOpen(false); }}
                  style={tw`px-5 py-3.5 rounded-xl mb-1 ${cityId === c._id ? 'bg-zinc-100 dark:bg-zinc-900' : ''}`}
                >
                  <Text style={tw`text-xs font-semibold text-zinc-800 dark:text-zinc-200`}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Category Modal */}
      <Modal visible={categoryModalOpen} transparent animationType="slide">
        <TouchableOpacity activeOpacity={1} onPress={() => setCategoryModalOpen(false)} style={tw`flex-1 justify-end bg-black/50`}>
          <View style={tw`bg-white dark:bg-zinc-950 rounded-t-3xl border-t border-zinc-200 dark:border-zinc-900 max-h-[60%] w-full overflow-hidden`}>
            <View style={tw`w-12 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full self-center mt-3 mb-1`} />
            <View style={tw`p-4 border-b border-zinc-100 dark:border-zinc-900`}>
              <Text style={tw`text-sm font-bold text-zinc-900 dark:text-white text-center`}>Επιλογή Κατηγορίας</Text>
            </View>
            <ScrollView contentContainerStyle={tw`p-3 pb-8`}>
              <TouchableOpacity
                onPress={() => { setCategoryId(''); setCategoryModalOpen(false); }}
                style={tw`px-5 py-3.5 rounded-xl mb-1 ${!categoryId ? 'bg-zinc-100 dark:bg-zinc-900' : ''}`}
              >
                <Text style={tw`text-xs font-semibold text-zinc-800 dark:text-zinc-200`}>{strings.search.allCategories}</Text>
              </TouchableOpacity>
              {categories.map((c) => (
                <TouchableOpacity
                  key={c._id}
                  onPress={() => { setCategoryId(c._id); setCategoryModalOpen(false); }}
                  style={tw`px-5 py-3.5 rounded-xl mb-1 ${categoryId === c._id ? 'bg-zinc-100 dark:bg-zinc-900' : ''}`}
                >
                  <Text style={tw`text-xs font-semibold text-zinc-800 dark:text-zinc-200`}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Sort Modal */}
      <Modal visible={sortModalOpen} transparent animationType="slide">
        <TouchableOpacity activeOpacity={1} onPress={() => setSortModalOpen(false)} style={tw`flex-1 justify-end bg-black/50`}>
          <View style={tw`bg-white dark:bg-zinc-950 rounded-t-3xl border-t border-zinc-200 dark:border-zinc-900 max-h-[60%] w-full overflow-hidden`}>
            <View style={tw`w-12 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full self-center mt-3 mb-1`} />
            <View style={tw`p-4 border-b border-zinc-100 dark:border-zinc-900`}>
              <Text style={tw`text-sm font-bold text-zinc-900 dark:text-white text-center`}>Ταξινόμηση</Text>
            </View>
            <ScrollView contentContainerStyle={tw`p-3 pb-8`}>
              {SORT_OPTIONS.map((o) => (
                <TouchableOpacity
                  key={o.value}
                  onPress={() => { setSortBy(o.value); setSortModalOpen(false); }}
                  style={tw`px-5 py-3.5 rounded-xl mb-1 ${sortBy === o.value ? 'bg-zinc-100 dark:bg-zinc-900' : ''}`}
                >
                  <Text style={tw`text-xs font-semibold text-zinc-800 dark:text-zinc-200`}>{o.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
