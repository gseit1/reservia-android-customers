import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, Modal, ScrollView, useWindowDimensions } from 'react-native';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import * as Lucide from 'lucide-react-native';
const ChevronDown = Lucide.ChevronDown as any;
const MapPin = Lucide.MapPin as any;
const ChevronLeft = Lucide.ChevronLeft as any;
const Sun = Lucide.Sun as any;
const Moon = Lucide.Moon as any;
import tw from 'twrnc';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCity } from '../../contexts/CityContext';
import { useTheme } from '../../contexts/ThemeContext';
import apiClient from '../../lib/apiClient';

interface City {
  _id: string;
  name: string;
}

export function Navbar() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const { selectedCityId, setSelectedCityId } = useCity();
  const { theme, toggleTheme } = useTheme();
  const [cities, setCities] = useState<City[]>([]);
  const [cityMenuOpen, setCityMenuOpen] = useState(false);

  // Determine if we can go back
  const canGoBack = useNavigationState((state) => (state ? state.index > 0 : false));

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const res = await apiClient.get('/api/cities');
        if (res.data?.success && res.data?.cities) {
          setCities(res.data.cities);
        }
      } catch (err) {
        console.error('Error fetching cities in navbar:', err);
      }
    };
    fetchCities();
  }, []);

  const activeCity = cities.find((c: City) => c._id === selectedCityId);
  const isDark = theme === 'dark';

  // Responsive sizes based on screen width
  const logoHeight = width < 360 ? 'h-10' : width < 400 ? 'h-12' : 'h-14';
  const logoWidth = width < 360 ? 'w-28' : width < 400 ? 'w-34' : 'w-40';
  const cityTextMaxW = width < 360 ? 'max-w-[45px]' : width < 400 ? 'max-w-[75px]' : 'max-w-[110px]';
  const controlGap = width < 375 ? 'gap-1.5' : 'gap-2.5';
  const containerPadding = width < 360 ? 'px-2' : 'px-4';

  return (
    <View style={[tw`bg-white dark:bg-black border-b border-zinc-100 dark:border-zinc-900`, { paddingTop: insets.top }]}>
      <View style={tw`h-16 ${containerPadding} flex-row items-center justify-between`}>
        {/* Left Section: Back Button and Logo (stacked on the left) */}
        <View style={tw`flex-row items-center ${width < 360 ? 'gap-1' : 'gap-1.5'}`}>
          {canGoBack && (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={tw`p-2 rounded-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900`}
            >
              <ChevronLeft size={20} color={isDark ? '#fff' : '#000'} />
            </TouchableOpacity>
          )}
          <Image
            source={require('../../../assets/logo3.png')}
            style={tw`${logoHeight} ${logoWidth}`}
            resizeMode="contain"
          />
        </View>

        {/* Right Section: Theme Toggle & City Selector (floated right) */}
        <View style={tw`flex-row items-center ${controlGap}`}>
          {/* Theme Mode Switcher */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={toggleTheme}
            style={tw`p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900`}
          >
            {isDark ? (
              <Sun size={15} color="#fff" />
            ) : (
              <Moon size={15} color="#000" />
            )}
          </TouchableOpacity>

          {/* City Selector */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setCityMenuOpen(true)}
            style={tw`flex-row items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2`}
          >
            <MapPin size={13} color={isDark ? '#fff' : '#000'} />
            <Text style={tw`text-xs font-bold text-zinc-700 dark:text-zinc-200 ${cityTextMaxW}`} numberOfLines={1}>
              {activeCity ? activeCity.name : 'Όλες οι πόλεις'}
            </Text>
            <ChevronDown size={12} color="#71717a" />
          </TouchableOpacity>
        </View>
      </View>

      {/* City Dropdown Modal */}
      <Modal
        visible={cityMenuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCityMenuOpen(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setCityMenuOpen(false)}
          style={tw`flex-1 justify-center items-center bg-black/60 px-6`}
        >
          <View style={tw`w-full max-h-[70%] bg-white dark:bg-zinc-950 rounded-3xl overflow-hidden border border-zinc-100 dark:border-zinc-800 shadow-2xl`}>
            <View style={tw`p-5 border-b border-zinc-100 dark:border-zinc-800`}>
              <Text style={tw`text-base font-bold text-zinc-900 dark:text-white text-center`}>
                Επιλογή Πόλης
              </Text>
            </View>

            <ScrollView style={tw`p-2`}>
              {/* Option: All Cities */}
              <TouchableOpacity
                onPress={() => {
                  setSelectedCityId('');
                  setCityMenuOpen(false);
                }}
                style={tw`w-full flex-row items-center justify-between px-5 py-3.5 rounded-xl ${
                  !selectedCityId ? 'bg-zinc-100 dark:bg-zinc-900' : ''
                }`}
              >
                <Text style={tw`text-sm font-semibold ${!selectedCityId ? 'text-black dark:text-white' : 'text-zinc-600 dark:text-zinc-400'}`}>
                  Όλες οι πόλεις
                </Text>
                {!selectedCityId && <View style={tw`w-2.5 h-2.5 rounded-full bg-black dark:bg-white`} />}
              </TouchableOpacity>

              {/* Dynamic Cities list */}
              {cities.map((city: City) => {
                const isSelected = selectedCityId === city._id;
                return (
                  <TouchableOpacity
                    key={city._id}
                    onPress={() => {
                      setSelectedCityId(city._id);
                      setCityMenuOpen(false);
                    }}
                    style={tw`w-full flex-row items-center justify-between px-5 py-3.5 rounded-xl ${
                      isSelected ? 'bg-zinc-100 dark:bg-zinc-900' : ''
                    }`}
                  >
                    <Text style={tw`text-sm font-semibold ${isSelected ? 'text-black dark:text-white' : 'text-zinc-600 dark:text-zinc-400'}`}>
                      {city.name}
                    </Text>
                    {isSelected && <View style={tw`w-2.5 h-2.5 rounded-full bg-black dark:bg-white`} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
