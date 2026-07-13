import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme as useDeviceColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import tw from 'twrnc';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const deviceColorScheme = useDeviceColorScheme();
  const [theme, setTheme] = useState<Theme>((deviceColorScheme as Theme) || 'light');

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('reservia-theme');
        if (savedTheme === 'light' || savedTheme === 'dark') {
          setTheme(savedTheme);
          (tw as any).setColorScheme(savedTheme);
        } else if (deviceColorScheme) {
          setTheme(deviceColorScheme as Theme);
          (tw as any).setColorScheme(deviceColorScheme as Theme);
        }
      } catch (err) {
        console.error('Error loading theme:', err);
      }
    };
    loadTheme();
  }, [deviceColorScheme]);

  const toggleTheme = async () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    (tw as any).setColorScheme(nextTheme);
    try {
      await AsyncStorage.setItem('reservia-theme', nextTheme);
    } catch (err) {
      console.error('Error saving theme:', err);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
