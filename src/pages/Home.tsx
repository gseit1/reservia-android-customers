import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Lucide from 'lucide-react-native';
const Fish = Lucide.Fish as any;
const Sun = Lucide.Sun as any;
const Utensils = Lucide.Utensils as any;
const Martini = Lucide.Martini as any;
const Music = Lucide.Music as any;
const Coffee = Lucide.Coffee as any;
const Sparkles = Lucide.Sparkles as any;
import tw from 'twrnc';
import { useCity } from '../contexts/CityContext';
import { strings } from '../strings/greek';
import apiClient from '../lib/apiClient';
import { ShopCard, resolveImageUrl } from '../components/shops/ShopCard';

interface Category {
  _id: string;
  name: string;
  image?: string;
}

interface City {
  _id: string;
  name: string;
  image?: string;
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
}

const getCategoryDesign = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes('ψαρ') || lower.includes('fish')) {
    return { icon: Fish, iconBg: 'bg-sky-50 dark:bg-sky-950/40', iconColor: '#0ea5e9' };
  }
  if (lower.includes('beach') || lower.includes('pool') || lower.includes('πισίν') || lower.includes('παραλ')) {
    return { icon: Sun, iconBg: 'bg-amber-50 dark:bg-amber-950/40', iconColor: '#f59e0b' };
  }
  if (lower.includes('εστιατ') || lower.includes('μεζεδο') || lower.includes('ταβερν') || lower.includes('φαγητ') || lower.includes('restau')) {
    return { icon: Utensils, iconBg: 'bg-emerald-50 dark:bg-emerald-950/40', iconColor: '#10b981' };
  }
  if (lower.includes('μπαρ') || lower.includes('bar') || lower.includes('cocktail') || lower.includes('ποτό')) {
    return { icon: Martini, iconBg: 'bg-violet-50 dark:bg-violet-950/40', iconColor: '#8b5cf6' };
  }
  if (lower.includes('κλαμπ') || lower.includes('club') || lower.includes('music') || lower.includes('χορό')) {
    return { icon: Music, iconBg: 'bg-indigo-50 dark:bg-indigo-950/40', iconColor: '#6366f1' };
  }
  if (lower.includes('brunch') || lower.includes('coffe') || lower.includes('καφέ') || lower.includes('cafe')) {
    return { icon: Coffee, iconBg: 'bg-orange-50 dark:bg-orange-950/40', iconColor: '#ea580c' };
  }
  return { icon: Sparkles, iconBg: 'bg-pink-50 dark:bg-pink-950/40', iconColor: '#ec4899' };
};

export default function Home() {
  const navigation = useNavigation<any>();
  const { selectedCityId, setSelectedCityId } = useCity();

  const [categories, setCategories] = useState<Category[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [featuredShops, setFeaturedShops] = useState<Shop[]>([]);
  const [categoryShops, setCategoryShops] = useState<Record<string, Shop[]>>({});

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [catsRes, citiesRes] = await Promise.all([
          apiClient.get('/api/categories'),
          apiClient.get('/api/cities'),
        ]);

        const cats = catsRes.data?.categories || [];
        const cts = citiesRes.data?.cities || [];
        setCategories(cats);
        setCities(cts);

        // Fetch featured shops (recommended)
        const featUrl = selectedCityId
          ? `/recommended/city/${selectedCityId}`
          : '/recommended';
        const featRes = await apiClient.get(featUrl);
        setFeaturedShops(featRes.data?.shops || []);

        // Fetch shops by active city and categories
        const activeCity = selectedCityId || cts[0]?._id;
        if (activeCity) {
          const shopPromises = cats.map(async (cat: Category) => {
            try {
              const res = await apiClient.get(`/recommended/city/${activeCity}/category/${cat._id}`);
              return { catId: cat._id, shops: res.data?.shops || [] };
            } catch {
              return { catId: cat._id, shops: [] };
            }
          });
          const results = await Promise.all(shopPromises);
          const shopMap: Record<string, Shop[]> = {};
          results.forEach((item) => {
            if (item.shops.length > 0) {
              shopMap[item.catId] = item.shops;
            }
          });
          setCategoryShops(shopMap);
        }
      } catch (err) {
        console.error('Error fetching home data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedCityId]);

  if (isLoading) {
    return (
      <View style={tw`flex-grow justify-center items-center bg-white dark:bg-black`}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  const activeCityName = cities.find((c) => c._id === (selectedCityId || cities[0]?._id))?.name || '';

  return (
    <ScrollView style={tw`flex-1 bg-white dark:bg-black`}>
      {/* ───────── CATEGORIES (TOP SLIDER) ───────── */}
      <View style={tw`py-4 border-b border-zinc-100 dark:border-zinc-900 bg-white dark:bg-black`}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={tw`px-4 gap-4`}
        >
          {categories.map((category) => {
            const hasImage = !!category.image;
            const design = getCategoryDesign(category.name);
            const CategoryIcon = design.icon;

            return (
              <TouchableOpacity
                key={category._id}
                activeOpacity={0.8}
                onPress={() => {
                  navigation.navigate('SearchTab', { category_id: category._id });
                }}
                style={tw`w-28 h-24 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 items-center justify-center p-2 shadow-sm overflow-hidden`}
              >
                {hasImage ? (
                  <>
                    <Image
                      source={{ uri: resolveImageUrl(category.image) }}
                      style={tw`absolute inset-0 w-full h-full`}
                      resizeMode="cover"
                    />
                    <View style={tw`absolute inset-0 bg-black/60`} />
                    <Text style={tw`relative z-10 text-[11px] font-bold text-center text-white`} numberOfLines={2}>
                      {category.name}
                    </Text>
                  </>
                ) : (
                  <>
                    <View style={tw`h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-zinc-900 shadow-sm mb-1.5`}>
                      <CategoryIcon size={20} color={design.iconColor} />
                    </View>
                    <Text style={tw`text-[11px] font-bold text-center text-zinc-800 dark:text-zinc-200`} numberOfLines={1}>
                      {category.name}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ───────── FEATURED VENUES ───────── */}
      {featuredShops.length > 0 && (
        <View style={tw`py-6 bg-white dark:bg-black`}>
          <View style={tw`flex-row items-center justify-between mb-4 px-4`}>
            <Text style={tw`text-xl font-bold text-zinc-900 dark:text-white`}>
              {strings.home.featuredTitle}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SearchTab')}>
              <Text style={tw`text-xs font-bold text-zinc-400 dark:text-zinc-500`}>
                {strings.home.ctaViewAll}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={tw`px-4 gap-6`}
          >
            {featuredShops.map((shop) => (
              <View key={shop._id} style={tw`w-[280px]`}>
                <ShopCard shop={shop} />
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ───────── CATEGORY SPECIFIC SECTIONS ───────── */}
      {categories.map((category) => {
        const shops = categoryShops[category._id] || [];
        if (shops.length === 0) return null;

        return (
          <View key={category._id} style={tw`py-4 border-t border-zinc-100 dark:border-zinc-900 bg-white dark:bg-black`}>
            <View style={tw`flex-row items-center justify-between mb-4 px-4`}>
              <Text style={tw`text-lg font-bold text-zinc-900 dark:text-white`}>
                {category.name} στη {activeCityName}
              </Text>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('SearchTab', {
                    city_id: selectedCityId || cities[0]?._id,
                    category_id: category._id,
                  })
                }
              >
                <Text style={tw`text-xs font-bold text-zinc-400 dark:text-zinc-500`}>
                  {strings.home.ctaViewAll}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={tw`px-4 gap-6`}
            >
              {shops.map((shop) => (
                <View key={shop._id} style={tw`w-[280px]`}>
                  <ShopCard shop={shop} />
                </View>
              ))}
            </ScrollView>
          </View>
        );
      })}

      {/* ───────── DISCOVER BY CITY ───────── */}
      {cities.length > 0 && (
        <View style={tw`py-6 border-t border-zinc-100 dark:border-zinc-900 bg-white dark:bg-black`}>
          <View style={tw`px-4 mb-4`}>
            <Text style={tw`text-xl font-bold text-zinc-900 dark:text-white`}>
              Ανακαλύψτε ανά Πόλη
            </Text>
            <Text style={tw`text-xs text-zinc-400 dark:text-zinc-500 mt-1`}>
              Βρείτε τα καλύτερα καταστήματα στους πιο δημοφιλείς προορισμούς.
            </Text>
          </View>

          <View style={tw`px-4 flex-row flex-wrap justify-between gap-3`}>
            {cities.map((city) => (
              <TouchableOpacity
                key={city._id}
                activeOpacity={0.8}
                onPress={() => {
                  setSelectedCityId(city._id);
                  navigation.navigate('SearchTab', { city_id: city._id });
                }}
                style={tw`w-[48%] h-24 rounded-2xl bg-zinc-100 dark:bg-zinc-900 overflow-hidden shadow-sm`}
              >
                {city.image ? (
                  <Image
                    source={{ uri: resolveImageUrl(city.image) }}
                    style={tw`w-full h-full`}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={tw`w-full h-full bg-zinc-200 dark:bg-zinc-800`} />
                )}
                <View style={tw`absolute inset-0 bg-black/45`} />
                <View style={tw`absolute bottom-3 left-3`}>
                  <Text style={tw`font-bold text-sm text-white`}>
                    {city.name}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* ───────── CTA BAND ───────── */}
      <View style={tw`py-10 bg-zinc-50 dark:bg-zinc-950 items-center px-6 border-t border-zinc-100 dark:border-zinc-900`}>
        <Text style={tw`text-2xl font-bold text-zinc-900 dark:text-white text-center mb-2`}>
          Έτοιμοι για την επόμενη σας έξοδο;
        </Text>
        <Text style={tw`text-zinc-500 dark:text-zinc-400 text-center mb-6 text-sm max-w-sm`}>
          Εξερευνήστε χιλιάδες χώρους και κάντε κράτηση σε λιγότερο από 2 λεπτά.
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('SearchTab')}
          style={tw`bg-black dark:bg-white px-8 py-3 rounded-full`}
        >
          <Text style={tw`text-white dark:text-black font-bold text-sm`}>
            Εξερευνήστε Τώρα
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
