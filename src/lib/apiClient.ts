import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const AUTH_TOKEN_KEY = 'reservia-auth-token';

// Extract the host IP address from the Metro server URI dynamically
const getApiUrl = () => {
  const hostUri = Constants.expoConfig?.hostUri || '';
  const host = hostUri.split(':')[0];
  if (host) {
    return `http://${host}:3000`;
  }
  return 'http://localhost:3000';
};

export const API_URL = getApiUrl();
console.log('[API URL Detected]:', API_URL);

export const getAuthToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  } catch (e) {
    console.error('Error reading auth token:', e);
    return null;
  }
};

export const setAuthToken = async (token: string | null): Promise<void> => {
  try {
    if (token) {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
    } else {
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    }
  } catch (e) {
    console.error('Error saving auth token:', e);
  }
};

export const clearAuthToken = async (): Promise<void> => {
  await setAuthToken(null);
};

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await getAuthToken();
  if (token) {
    config.headers = config.headers ?? {};
    if (!config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

apiClient.interceptors.response.use(
  async (response) => {
    const responseToken = response.data?.token;
    if (typeof responseToken === 'string' && responseToken.length > 0) {
      await setAuthToken(responseToken);
    }
    return response;
  },
  async (error) => {
    const serverMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message;

    const enhancedError = new Error(serverMessage || 'Σφάλμα δικτύου');
    (enhancedError as any).response = error.response;
    (enhancedError as any).status = error.response?.status;

    return Promise.reject(enhancedError);
  }
);

export default apiClient;
