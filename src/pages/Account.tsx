import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Modal } from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import * as Lucide from 'lucide-react-native';
const User = Lucide.User as any;
const Heart = Lucide.Heart as any;
const CalendarIcon = Lucide.Calendar as any;
const Star = Lucide.Star as any;
const Edit2 = Lucide.Edit2 as any;
const LogOut = Lucide.LogOut as any;
const Trash2 = Lucide.Trash2 as any;
import tw from 'twrnc';
import { useAuth } from '../contexts/AuthContext';
import { strings } from '../strings/greek';
import apiClient from '../lib/apiClient';
import { ShopCard } from '../components/shops/ShopCard';

type AccountTab = 'profile' | 'reservations' | 'favorites' | 'reviews';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  accepted: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-450',
  rejected: 'bg-red-100 text-red-650 dark:bg-red-900/30 dark:text-red-400',
  notShown: 'bg-zinc-100 text-zinc-650 dark:bg-zinc-800 dark:text-zinc-400',
  noshow: 'bg-zinc-100 text-zinc-650 dark:bg-zinc-800 dark:text-zinc-400',
  completed: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-405',
  cancelled: 'bg-zinc-105 text-zinc-400 dark:bg-zinc-900 dark:text-zinc-600',
};

function decimalToTime(decimal: number): string {
  const normalized = decimal >= 24 ? decimal - 24 : decimal;
  const h = Math.floor(normalized);
  const m = Math.round((normalized - h) * 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export default function Account() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { user, isAuthenticated, logout, refreshUser } = useAuth();

  const [tab, setTab] = useState<AccountTab>('profile');

  // Edit profile
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editSurname, setEditSurname] = useState(user?.surname || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Lists
  const [reservations, setReservations] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);

  // Loaders
  const [isTabLoading, setIsTabLoading] = useState(false);

  // Review editing Modal
  const [editingReview, setEditingReview] = useState<any>(null);
  const [editReviewRating, setEditReviewRating] = useState(0);
  const [editReviewText, setEditReviewText] = useState('');
  const [isUpdatingReview, setIsUpdatingReview] = useState(false);

  // Focus effect to sync initialTab param from navigation or tab presses
  useFocusEffect(
    useCallback(() => {
      const initialTab = route.params?.initialTab || 'profile';
      setTab(initialTab);
    }, [route.params])
  );

  const fetchTabData = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsTabLoading(true);
    try {
      if (tab === 'reservations') {
        const res = await apiClient.get('/api/user/reservationHistory');
        setReservations(res.data?.reservationHistory || []);
      } else if (tab === 'favorites') {
        const res = await apiClient.get('/api/user/favorites');
        setFavorites(res.data?.favouriteShops || []);
      } else if (tab === 'reviews') {
        const res = await apiClient.get('/api/users/my-reviews');
        setReviews(res.data?.reviews || []);
      }
    } catch (err) {
      console.error('Error fetching account tab data:', err);
    } finally {
      setIsTabLoading(false);
    }
  }, [tab, isAuthenticated]);

  useEffect(() => {
    fetchTabData();
  }, [tab, fetchTabData]);

  const handleLogout = async () => {
    Alert.alert('Αποσύνδεση', 'Είστε σίγουροι ότι θέλετε να αποσυνδεθείτε;', [
      { text: 'Ακύρωση', style: 'cancel' },
      {
        text: 'Αποσύνδεση',
        style: 'destructive',
        onPress: async () => {
          await logout();
          navigation.navigate('Home');
        },
      },
    ]);
  };

  const handleSaveProfile = async () => {
    if (!editName || !editSurname) {
      Alert.alert('Σφάλμα', 'Όνομα και Επώνυμο είναι υποχρεωτικά.');
      return;
    }
    setIsSavingProfile(true);
    try {
      await apiClient.put('/api/user/profile', { name: editName, surname: editSurname });
      await refreshUser();
      setEditing(false);
      Alert.alert('Επιτυχία', 'Το προφίλ ενημερώθηκε.');
    } catch (err: any) {
      Alert.alert('Σφάλμα', err.message || 'Αποτυχία ενημέρωσης προφίλ.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleCancelReservation = async (resId: string) => {
    Alert.alert('Ακύρωση Κράτησης', 'Θέλετε σίγουρα να ακυρώσετε αυτή την κράτηση;', [
      { text: 'Όχι', style: 'cancel' },
      {
        text: 'Ναι, Ακύρωση',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.patch(`/api/reservation/${resId}/cancel`);
            Alert.alert('Επιτυχία', 'Η κράτηση ακυρώθηκε.');
            fetchTabData();
          } catch (err: any) {
            Alert.alert('Σφάλμα', err.message || 'Αποτυχία ακύρωσης.');
          }
        },
      },
    ]);
  };

  const handleRemoveFavorite = async (shopId: string) => {
    try {
      await apiClient.delete(`/api/user/favorites/${shopId}`);
      Alert.alert('Επιτυχία', 'Αφαιρέθηκε από τα αγαπημένα.');
      fetchTabData();
    } catch (err: any) {
      Alert.alert('Σφάλμα', err.message || 'Αποτυχία αφαίρεσης.');
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    Alert.alert('Διαγραφή Κριτικής', 'Θέλετε σίγουρα να διαγράψετε αυτή την κριτική;', [
      { text: 'Όχι', style: 'cancel' },
      {
        text: 'Διαγραφή',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.delete(`/api/review/${reviewId}`);
            Alert.alert('Επιτυχία', 'Η κριτική διαγράφηκε.');
            fetchTabData();
          } catch (err: any) {
            Alert.alert('Σφάλμα', err.message || 'Αποτυχία διαγραφής.');
          }
        },
      },
    ]);
  };

  const handleUpdateReview = async () => {
    if (editReviewRating === 0) {
      Alert.alert('Σφάλμα', 'Παρακαλώ επιλέξτε βαθμολογία.');
      return;
    }
    setIsUpdatingReview(true);
    try {
      await apiClient.patch(`/api/review/${editingReview._id}`, {
        rating: editReviewRating,
        text: editReviewText.trim() || undefined,
      });
      setEditingReview(null);
      Alert.alert('Επιτυχία', 'Η κριτική ενημερώθηκε.');
      fetchTabData();
    } catch (err: any) {
      Alert.alert('Σφάλμα', err.message || 'Αποτυχία ενημέρωσης.');
    } finally {
      setIsUpdatingReview(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <View style={tw`flex-grow justify-center items-center p-6 bg-zinc-50 dark:bg-black`}>
        <Text style={tw`text-5xl mb-4`}>🔒</Text>
        <Text style={tw`text-base font-bold text-zinc-900 dark:text-white mb-2 text-center`}>
          Απαιτείται σύνδεση
        </Text>
        <Text style={tw`text-xs text-zinc-400 mb-6 text-center max-w-xs`}>
          Συνδεθείτε στον λογαριασμό σας για να δείτε το προφίλ σας και το ιστορικό κρατήσεων.
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
          style={tw`bg-black dark:bg-white px-8 py-3 rounded-xl`}
        >
          <Text style={tw`text-white dark:text-black font-bold text-sm`}>Σύνδεση / Εγγραφή</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={tw`flex-1 bg-white dark:bg-black`}>
      {/* Upper Tab Navigation */}
      <View style={tw`border-b border-zinc-100 dark:border-zinc-900 bg-white dark:bg-black`}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={tw`px-4 py-1.5`}>
          {[
            { id: 'profile', label: strings.account.profile, icon: User },
            { id: 'reservations', label: strings.account.reservations, icon: CalendarIcon },
            { id: 'favorites', label: strings.account.favorites, icon: Heart },
            { id: 'reviews', label: 'Κριτικές μου', icon: Star },
          ].map((tabItem) => {
            const isActive = tab === tabItem.id;
            const TabIcon = tabItem.icon;
            return (
              <TouchableOpacity
                key={tabItem.id}
                onPress={() => setTab(tabItem.id as AccountTab)}
                style={tw`flex-row items-center gap-1.5 px-4 py-2 border-b-2 ${
                  isActive ? 'border-black dark:border-white' : 'border-transparent'
                }`}
              >
                <TabIcon size={14} color={isActive ? (tw.prefixMatch('dark') ? '#fff' : '#000') : '#71717a'} />
                <Text style={tw`text-xs font-bold ${
                  isActive ? 'text-black dark:text-white' : 'text-zinc-500'
                }`}>
                  {tabItem.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Content Area */}
      {isTabLoading ? (
        <View style={tw`flex-grow justify-center items-center`}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={tw`p-5`}>
          {/* PROFILE TAB */}
          {tab === 'profile' && (
            <View style={tw`gap-4`}>
              <View style={tw`bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 gap-4`}>
                <View style={tw`flex-row justify-between items-center`}>
                  <Text style={tw`text-base font-bold text-zinc-900 dark:text-white`}>
                    Στοιχεία Προφίλ
                  </Text>
                  {!editing ? (
                    <TouchableOpacity onPress={() => { setEditing(true); setEditName(user?.name || ''); setEditSurname(user?.surname || ''); }} style={tw`flex-row items-center gap-1`}>
                      <Edit2 size={12} color="#4b5563" />
                      <Text style={tw`text-xs font-bold text-zinc-600 dark:text-zinc-400`}>Επεξεργασία</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                {editing ? (
                  <View style={tw`gap-3`}>
                    <View>
                      <Text style={tw`text-xs font-bold text-zinc-500 mb-1`}>Όνομα</Text>
                      <TextInput
                        value={editName}
                        onChangeText={setEditName}
                        style={tw`h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black text-sm text-zinc-900 dark:text-white`}
                      />
                    </View>
                    <View>
                      <Text style={tw`text-xs font-bold text-zinc-500 mb-1`}>Επώνυμο</Text>
                      <TextInput
                        value={editSurname}
                        onChangeText={setEditSurname}
                        style={tw`h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black text-sm text-zinc-900 dark:text-white`}
                      />
                    </View>
                    <View style={tw`flex-row gap-2 mt-2`}>
                      <TouchableOpacity onPress={handleSaveProfile} disabled={isSavingProfile} style={tw`flex-1 h-10 bg-black dark:bg-white rounded-lg items-center justify-center`}>
                        <Text style={tw`text-xs font-bold text-white dark:text-black`}>Αποθήκευση</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setEditing(false)} style={tw`flex-1 h-10 border border-zinc-200 dark:border-zinc-800 rounded-lg items-center justify-center`}>
                        <Text style={tw`text-xs font-bold text-zinc-700 dark:text-zinc-300`}>Ακύρωση</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={tw`gap-3 text-sm`}>
                    <View>
                      <Text style={tw`text-[10px] uppercase font-bold text-zinc-400 mb-0.5`}>Πλήρες όνομα</Text>
                      <Text style={tw`text-sm font-semibold text-zinc-850 dark:text-zinc-200`}>
                        {user?.name} {user?.surname}
                      </Text>
                    </View>
                    <View>
                      <Text style={tw`text-[10px] uppercase font-bold text-zinc-400 mb-0.5`}>Email</Text>
                      <Text style={tw`text-sm text-zinc-850 dark:text-zinc-200`}>{user?.email}</Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Logout button */}
              <TouchableOpacity
                onPress={handleLogout}
                style={tw`flex-row items-center justify-center gap-2 border border-red-200 dark:border-red-950/20 bg-red-50 dark:bg-red-950/10 h-11 rounded-xl mt-4`}
              >
                <LogOut size={14} color="#e11d48" />
                <Text style={tw`text-sm font-bold text-rose-600`}>Έξοδος</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* RESERVATIONS TAB */}
          {tab === 'reservations' && (
            <View style={tw`gap-4`}>
              {reservations.length === 0 ? (
                <Text style={tw`text-zinc-400 text-sm text-center py-10`}>
                  {strings.account.noReservations}
                </Text>
              ) : (
                reservations.map((res: any) => {
                  const isCancellable = res.state === 'pending' || res.state === 'accepted';
                  const dateFormatted = new Date(res.reservationDate).toLocaleDateString('el-GR', {
                    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
                  });

                  return (
                    <View key={res._id} style={tw`p-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 gap-3`}>
                      <View style={tw`flex-row justify-between items-center`}>
                        <Text style={tw`text-sm font-bold text-zinc-800 dark:text-white`}>
                          {res.shopName}
                        </Text>
                        <View style={tw`px-2.5 py-1 rounded-full ${STATUS_COLORS[res.state as keyof typeof STATUS_COLORS] || 'bg-zinc-100'}`}>
                          <Text style={tw`text-[10px] font-bold text-center`}>
                            {strings.account.reservationStatus[res.state as keyof typeof strings.account.reservationStatus] || res.state}
                          </Text>
                        </View>
                      </View>
                      <View style={tw`gap-1`}>
                        <Text style={tw`text-xs text-zinc-600 dark:text-zinc-400`}>
                          📅 {dateFormatted}
                        </Text>
                        <Text style={tw`text-xs text-zinc-600 dark:text-zinc-400`}>
                          ⏰ {decimalToTime(res.reservationTime)}
                        </Text>
                        <Text style={tw`text-xs text-zinc-600 dark:text-zinc-400`}>
                          👥 {res.seats} άτομα
                        </Text>
                      </View>

                      {isCancellable && (
                        <TouchableOpacity
                          onPress={() => handleCancelReservation(res._id)}
                          style={tw`h-9 border border-zinc-200 dark:border-zinc-800 rounded-lg items-center justify-center mt-1 bg-white dark:bg-zinc-950`}
                        >
                          <Text style={tw`text-xs font-bold text-zinc-600 dark:text-zinc-350`}>
                            Ακύρωση Κράτησης
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })
              )}
            </View>
          )}

          {/* FAVORITES TAB */}
          {tab === 'favorites' && (
            <View style={tw`gap-4`}>
              {favorites.length === 0 ? (
                <Text style={tw`text-zinc-400 text-sm text-center py-10`}>
                  {strings.account.noFavorites}
                </Text>
              ) : (
                favorites.map((shop: any) => (
                  <View key={shop._id} style={tw`relative`}>
                    <ShopCard shop={shop} />
                    <TouchableOpacity
                      onPress={() => handleRemoveFavorite(shop._id)}
                      style={tw`absolute top-3 left-3 p-2 bg-white/90 dark:bg-black/90 rounded-full shadow-sm z-50`}
                    >
                      <Trash2 size={14} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          )}

          {/* REVIEWS TAB */}
          {tab === 'reviews' && (
            <View style={tw`gap-4`}>
              {reviews.length === 0 ? (
                <Text style={tw`text-zinc-400 text-sm text-center py-10`}>
                  Δεν έχετε υποβάλλει κριτικές ακόμα.
                </Text>
              ) : (
                reviews.map((rev: any) => (
                  <View key={rev._id} style={tw`p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 gap-2`}>
                    <View style={tw`flex-row justify-between items-center`}>
                      <Text style={tw`text-xs font-bold text-zinc-800 dark:text-white`}>
                        {rev.shopId?.shopName || 'Κατάστημα'}
                      </Text>
                      <View style={tw`flex-row gap-2`}>
                        <TouchableOpacity onPress={() => { setEditingReview(rev); setEditReviewRating(rev.rating); setEditReviewText(rev.text || ''); }}>
                          <Text style={tw`text-xs font-semibold text-blue-500`}>Επεξεργασία</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeleteReview(rev._id)}>
                          <Text style={tw`text-xs font-semibold text-red-500`}>Διαγραφή</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={tw`flex-row gap-0.5`}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={11}
                          color={i < rev.rating ? '#f59e0b' : '#e4e4e7'}
                          fill={i < rev.rating ? '#f59e0b' : 'transparent'}
                        />
                      ))}
                    </View>
                    {!!rev.text && (
                      <Text style={tw`text-xs text-zinc-650 dark:text-zinc-400 leading-relaxed`}>
                        {rev.text}
                      </Text>
                    )}
                  </View>
                ))
              )}
            </View>
          )}
        </ScrollView>
      )}

      {/* Editing Review Modal */}
      {editingReview && (
        <Modal visible={!!editingReview} transparent animationType="slide">
          <TouchableOpacity activeOpacity={1} style={tw`flex-1 justify-end bg-black/60`}>
            <View style={tw`bg-white dark:bg-zinc-950 rounded-t-3xl p-6 border-t border-zinc-200 dark:border-zinc-800 gap-4`}>
              <Text style={tw`text-base font-bold text-zinc-905 dark:text-white text-center`}>
                Επεξεργασία Κριτικής
              </Text>

              {/* Stars selection */}
              <View>
                <Text style={tw`text-xs font-bold text-zinc-500 mb-2 uppercase`}>Βαθμολογία</Text>
                <View style={tw`flex-row gap-2`}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity key={star} onPress={() => setEditReviewRating(star)}>
                      <Star
                        size={28}
                        color={star <= editReviewRating ? '#f59e0b' : '#e4e4e7'}
                        fill={star <= editReviewRating ? '#f59e0b' : 'transparent'}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Comment text */}
              <View>
                <Text style={tw`text-xs font-bold text-zinc-500 mb-2 uppercase`}>Σχόλιο</Text>
                <TextInput
                  multiline
                  value={editReviewText}
                  onChangeText={setEditReviewText}
                  maxLength={500}
                  style={[tw`border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 rounded-xl p-3 text-sm text-zinc-900 dark:text-white h-24`, { textAlignVertical: 'top' }]}
                />
              </View>

              {/* Buttons */}
              <View style={tw`flex-row gap-3 mt-2`}>
                <TouchableOpacity onPress={handleUpdateReview} disabled={isUpdatingReview} style={tw`flex-[2] h-11 bg-black dark:bg-white rounded-xl items-center justify-center`}>
                  <Text style={tw`text-sm font-bold text-white dark:text-black`}>Ενημέρωση</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setEditingReview(null)} style={tw`flex-1 h-11 border border-zinc-200 dark:border-zinc-800 rounded-xl items-center justify-center`}>
                  <Text style={tw`text-sm font-bold text-zinc-700 dark:text-zinc-300`}>Ακύρωση</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
}
