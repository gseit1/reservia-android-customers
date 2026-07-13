import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CityContextType {
  selectedCityId: string;
  setSelectedCityId: (id: string) => void;
}

const CityContext = createContext<CityContextType | undefined>(undefined);

const CITY_STORAGE_KEY = 'reservia_selected_city';

export function CityProvider({ children }: { children: ReactNode }) {
  const [selectedCityId, setSelectedCityId] = useState<string>('');

  useEffect(() => {
    const loadCity = async () => {
      try {
        const val = await AsyncStorage.getItem(CITY_STORAGE_KEY);
        if (val) setSelectedCityId(val);
      } catch (e) {
        console.error('Failed to load city:', e);
      }
    };
    loadCity();
  }, []);

  const changeCity = async (id: string) => {
    try {
      setSelectedCityId(id);
      await AsyncStorage.setItem(CITY_STORAGE_KEY, id);
    } catch (e) {
      console.error('Failed to save city:', e);
    }
  };

  return (
    <CityContext.Provider value={{ selectedCityId, setSelectedCityId: changeCity }}>
      {children}
    </CityContext.Provider>
  );
}

export function useCity() {
  const context = useContext(CityContext);
  if (!context) {
    throw new Error('useCity must be used within a CityProvider');
  }
  return context;
}
