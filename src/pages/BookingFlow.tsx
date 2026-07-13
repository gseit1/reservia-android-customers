import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as Lucide from 'lucide-react-native';
const ChevronLeft = Lucide.ChevronLeft as any;
const CalendarIcon = Lucide.Calendar as any;
const Users = Lucide.Users as any;
const Check = Lucide.Check as any;
import tw from 'twrnc';
import { useAuth } from '../contexts/AuthContext';
import { strings } from '../strings/greek';
import apiClient from '../lib/apiClient';

type Step = 1 | 2 | 3;

function decimalToTime(decimal: number): string {
  const normalized = decimal >= 24 ? decimal - 24 : decimal;
  const h = Math.floor(normalized);
  const m = Math.round((normalized - h) * 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function dateToISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const MONTHS_GR = [
  'Ιανουάριος', 'Φεβρουάριος', 'Μάρτιος', 'Απρίλιος', 'Μάιος', 'Ιούνιος',
  'Ιούλιος', 'Αύγουστος', 'Σεπτέμβριος', 'Οκτώβριος', 'Νοέμβριος', 'Δεκέμβριος'
];

export default function BookingFlow() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { slug } = route.params || {};
  const { isAuthenticated, user, refreshUser } = useAuth();

  const [step, setStep] = useState<Step>(1);

  // Shop details
  const [shop, setShop] = useState<any>(null);
  const [shopLoading, setShopLoading] = useState(true);
  const [fullDates, setFullDates] = useState<string[]>([]);
  const [bookingSettings, setBookingSettings] = useState<any>(null);
  const [loadingSettings, setLoadingSettings] = useState(false);

  // Step 1 selections
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<number | null>(null);
  const [seats, setSeats] = useState(2);
  const [currentMonth, setCurrentMonth] = useState<Date>(() => new Date());

  // Step 2 details (pre-fill if auth)
  const [name, setName] = useState(user?.name || '');
  const [surname, setSurname] = useState(user?.surname || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [comment, setComment] = useState('');

  // Inline auth selection (if guest wants to login/register)
  const [authAction, setAuthAction] = useState<'guest' | 'login' | 'register'>('guest');
  const [loginPassword, setLoginPassword] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-fill user data
  useEffect(() => {
    if (user) {
      setName(user.name);
      setSurname(user.surname);
      setEmail(user.email);
    }
  }, [user]);

  // Load shop and full dates
  useEffect(() => {
    const fetchShop = async () => {
      setShopLoading(true);
      try {
        const shopRes = await apiClient.get(`/api/shop/slug/${slug}`);
        setShop(shopRes.data);

        const datesRes = await apiClient.get(`/api/shop/${shopRes.data._id}/full-dates`);
        setFullDates(datesRes.data?.isFull || []);
      } catch (err) {
        console.error('Error fetching booking venue info:', err);
        Alert.alert('Σφάλμα', 'Αδυναμία φόρτωσης στοιχείων.');
      } finally {
        setShopLoading(false);
      }
    };
    if (slug) fetchShop();
  }, [slug]);

  // Load booking settings for selected date
  useEffect(() => {
    const fetchSettings = async () => {
      if (!shop || !selectedDate) return;
      setLoadingSettings(true);
      try {
        const dateParam = selectedDate.includes('T') ? selectedDate : `${selectedDate}T12:00:00`;
        const res = await apiClient.get(`/api/shop/${shop._id}/bookingSettings`, { params: { date: dateParam } });
        setBookingSettings(res.data);
        setSelectedTime(null); // Reset selected time when date changes
      } catch (err) {
        console.error('Error loading booking settings:', err);
      } finally {
        setLoadingSettings(false);
      }
    };
    fetchSettings();
  }, [selectedDate, shop]);

  // Extract available time slots
  const timeSlots = useMemo(() => {
    if (!bookingSettings) return [];
    if (Array.isArray(bookingSettings.availableSlots)) return bookingSettings.availableSlots;
    if (Array.isArray(bookingSettings.timeSlots)) return bookingSettings.timeSlots;

    const start = Number(bookingSettings.bookingStart ?? 19);
    const end = Number(bookingSettings.bookingEnd ?? 23.5);
    const splitRaw = Number(bookingSettings.timeSlotSplit ?? 30);
    const split = splitRaw > 1 ? splitRaw / 60 : splitRaw;

    if (start === 0 && end === 0) return [];

    const slots: number[] = [];
    const stepVal = split > 0 ? split : 0.5;

    for (let time = start; time <= end; time += stepVal) {
      slots.push(time);
    }
    return slots;
  }, [bookingSettings]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const firstDayIndex = (firstDay.getDay() + 6) % 7; // Monday start
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days: { day: number; dateStr: string; isPast: boolean; isFull: boolean }[] = [];

    // Empty days prefix
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ day: 0, dateStr: '', isPast: true, isFull: false });
    }

    const todayStr = dateToISO(new Date());

    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        day: d,
        dateStr,
        isPast: dateStr < todayStr,
        isFull: fullDates.includes(dateStr),
      });
    }

    return days;
  }, [currentMonth, fullDates]);

  const weeks = useMemo(() => {
    const days = [...calendarDays];
    const remaining = days.length % 7;
    if (remaining > 0) {
      for (let i = 0; i < 7 - remaining; i++) {
        days.push({ day: 0, dateStr: '', isPast: true, isFull: false });
      }
    }
    const chunked = [];
    for (let i = 0; i < days.length; i += 7) {
      chunked.push(days.slice(i, i + 7));
    }
    return chunked;
  }, [calendarDays]);

  const handleNextStep = () => {
    if (step === 1) {
      if (!selectedDate || selectedTime === null) {
        Alert.alert('Σφάλμα', 'Παρακαλώ επιλέξτε ημερομηνία και ώρα.');
        return;
      }
      setStep(2);
    }
  };

  const handleSubmit = async () => {
    if (!name || !surname || !email) {
      Alert.alert('Σφάλμα', 'Παρακαλώ συμπληρώστε τα στοιχεία επικοινωνίας.');
      return;
    }
    setIsSubmitting(true);
    try {
      let finalPhone = phone.trim();
      if (finalPhone) {
        if (/^(69\d{8}|2\d{2,3}\d{6,7})$/.test(finalPhone)) {
          finalPhone = '+30' + finalPhone;
        } else if (/^30(69\d{8}|2\d{2,3}\d{6,7})$/.test(finalPhone)) {
          finalPhone = '+' + finalPhone;
        }
      }

      if (isAuthenticated) {
        await apiClient.post('/api/reservation/user', {
          reservationDate: selectedDate,
          reservationTime: selectedTime,
          shopId: shop._id,
          seats,
          name,
          surname,
          commentFromUser: comment || undefined,
        });
      } else if (authAction === 'register') {
        if (!regPassword) {
          Alert.alert('Σφάλμα', 'Παρακαλώ ορίστε έναν κωδικό πρόσβασης.');
          setIsSubmitting(false);
          return;
        }
        // Register & Login in-place
        await apiClient.post('/api/signup', {
          name,
          surname,
          email,
          password: regPassword,
          phone: finalPhone,
        });
        await refreshUser();
        // Book
        await apiClient.post('/api/reservation/user', {
          reservationDate: selectedDate,
          reservationTime: selectedTime,
          shopId: shop._id,
          seats,
          name,
          surname,
          commentFromUser: comment || undefined,
        });
      } else if (authAction === 'login') {
        if (!loginPassword) {
          Alert.alert('Σφάλμα', 'Παρακαλώ συμπληρώστε τον κωδικό πρόσβασης.');
          setIsSubmitting(false);
          return;
        }
        await apiClient.post('/api/login', { email, password: loginPassword });
        await refreshUser();
        // Book
        await apiClient.post('/api/reservation/user', {
          reservationDate: selectedDate,
          reservationTime: selectedTime,
          shopId: shop._id,
          seats,
          name,
          surname,
          commentFromUser: comment || undefined,
        });
      } else {
        // Guest Booking
        if (!finalPhone) {
          Alert.alert('Σφάλμα', 'Το τηλέφωνο είναι υποχρεωτικό για κρατήσεις επισκεπτών.');
          setIsSubmitting(false);
          return;
        }
        await apiClient.post('/api/reservation/guest', {
          reservationDate: selectedDate,
          reservationTime: selectedTime,
          shopId: shop._id,
          seats,
          name,
          surname,
          email,
          phone: finalPhone,
          commentFromUser: comment || undefined,
        });
      }
      setStep(3);
    } catch (err: any) {
      Alert.alert('Σφάλμα Κράτησης', err.message || 'Κάτι πήγε στραβά. Δοκιμάστε ξανά.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const changeMonth = (dir: 'prev' | 'next') => {
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    d.setMonth(d.getMonth() + (dir === 'prev' ? -1 : 1));
    setCurrentMonth(d);
  };

  if (shopLoading) {
    return (
      <View style={tw`flex-grow justify-center items-center bg-white dark:bg-black`}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <ScrollView style={tw`flex-1 bg-white dark:bg-black`}>
      {/* Header bar */}
      <View style={tw`flex-row items-center p-4 border-b border-zinc-100 dark:border-zinc-900`}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={tw`p-2 rounded-full mr-2`}>
          <ChevronLeft size={22} color={tw.prefixMatch('dark') ? '#fff' : '#000'} />
        </TouchableOpacity>
        <View style={tw`flex-1`}>
          <Text style={tw`text-lg font-bold text-zinc-900 dark:text-white`}>
            {strings.booking.title}
          </Text>
          <Text style={tw`text-xs text-zinc-400 dark:text-zinc-500`}>{shop?.shopName}</Text>
        </View>
      </View>

      <View style={tw`p-5`}>
        {/* Step indicator */}
        <View style={tw`flex-row justify-between mb-8`}>
          {['Ημερομηνία', 'Στοιχεία', 'Επιβεβαίωση'].map((label, idx) => {
            const stepNum = idx + 1;
            const isActive = step >= stepNum;
            const isCurrent = step === stepNum;
            return (
              <View key={label} style={tw`items-center flex-1`}>
                <View style={tw`w-7 h-7 rounded-full items-center justify-center mb-1.5 ${
                  isCurrent ? 'bg-black dark:bg-white' : isActive ? 'bg-zinc-800' : 'bg-zinc-200 dark:bg-zinc-800'
                }`}>
                  <Text style={tw`text-xs font-bold ${
                    isCurrent ? 'text-white dark:text-black' : 'text-zinc-500'
                  }`}>
                    {stepNum}
                  </Text>
                </View>
                <Text style={tw`text-[10px] font-bold text-center ${isActive ? 'text-zinc-800 dark:text-zinc-250' : 'text-zinc-400'}`}>
                  {label}
                </Text>
              </View>
            );
          })}
        </View>

        {/* STEP 1: Date, Time & Seats */}
        {step === 1 && (
          <View style={tw`gap-6`}>
            {/* Calendar */}
            <View>
              <Text style={tw`text-sm font-bold text-zinc-900 dark:text-white mb-3 flex-row items-center`}>
                <CalendarIcon size={14} style={tw`mr-2`} /> 1. {strings.booking.stepDate}
              </Text>
              <View style={tw`border border-zinc-200 dark:border-zinc-800 rounded-3xl p-4 bg-zinc-50 dark:bg-zinc-950`}>
                {/* Header month switcher */}
                <View style={tw`flex-row justify-between items-center mb-4`}>
                  <TouchableOpacity onPress={() => changeMonth('prev')} style={tw`p-2`}>
                    <Text style={tw`font-bold text-zinc-700 dark:text-zinc-300`}>◀</Text>
                  </TouchableOpacity>
                  <Text style={tw`text-sm font-bold text-zinc-800 dark:text-zinc-200`}>
                    {MONTHS_GR[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                  </Text>
                  <TouchableOpacity onPress={() => changeMonth('next')} style={tw`p-2`}>
                    <Text style={tw`font-bold text-zinc-700 dark:text-zinc-300`}>▶</Text>
                  </TouchableOpacity>
                </View>

                {/* Weekdays */}
                <View style={tw`flex-row justify-between mb-3 w-full`}>
                  {['Δε', 'Τρ', 'Τε', 'Πε', 'Πα', 'Σα', 'Κυ'].map((w) => (
                    <Text key={w} style={tw`text-center w-10 text-[11px] font-bold text-zinc-400`}>
                      {w}
                    </Text>
                  ))}
                </View>

                {/* Days Grid (Rendered in structured weeks rows to ensure perfect alignment) */}
                <View style={tw`w-full gap-y-1.5`}>
                  {weeks.map((week, weekIdx) => (
                    <View key={weekIdx} style={tw`flex-row justify-between w-full`}>
                      {week.map((item, idx) => {
                        const isSelected = selectedDate === item.dateStr;
                        const isDisabled = item.day === 0 || item.isPast || item.isFull;

                        return (
                          <TouchableOpacity
                            key={idx}
                            disabled={isDisabled}
                            onPress={() => setSelectedDate(item.dateStr)}
                            style={[
                              tw`w-10 h-10 rounded-full items-center justify-center`,
                              isSelected ? tw`bg-black dark:bg-white` : tw`bg-transparent`,
                              item.isFull ? tw`bg-red-50 dark:bg-red-955/20` : tw`bg-transparent`
                            ]}
                          >
                            <Text style={tw`text-xs font-semibold ${
                              isSelected
                                ? 'text-white dark:text-black font-bold'
                                : isDisabled
                                ? 'text-zinc-300 dark:text-zinc-800 line-through'
                                : 'text-zinc-800 dark:text-zinc-200'
                            }`}>
                              {item.day > 0 ? item.day : ''}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Time Slots */}
            <View>
              <Text style={tw`text-sm font-bold text-zinc-900 dark:text-white mb-3`}>
                2. {strings.booking.selectTime}
              </Text>
              {!selectedDate ? (
                <Text style={tw`text-xs text-zinc-400 italic`}>
                  Επιλέξτε πρώτα ημερομηνία για να δείτε διαθέσιμες ώρες.
                </Text>
              ) : loadingSettings ? (
                <ActivityIndicator size="small" color="#000" />
              ) : timeSlots.length === 0 ? (
                <Text style={tw`text-xs text-zinc-400`}>{strings.booking.noSlots}</Text>
              ) : (
                <View style={tw`flex-row flex-wrap gap-2`}>
                  {timeSlots.map((time: number) => {
                    const isSel = selectedTime === time;
                    return (
                      <TouchableOpacity
                        key={time}
                        onPress={() => setSelectedTime(time)}
                        style={tw`px-4 py-2.5 rounded-xl border ${
                          isSel
                            ? 'bg-black dark:bg-white border-black dark:border-white'
                            : 'border-zinc-200 dark:border-zinc-800'
                        }`}
                      >
                        <Text style={tw`text-xs font-bold ${
                          isSel ? 'text-white dark:text-black' : 'text-zinc-700 dark:text-zinc-300'
                        }`}>
                          {decimalToTime(time)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Seats selector */}
            <View>
              <Text style={tw`text-sm font-bold text-zinc-900 dark:text-white mb-3 flex-row items-center`}>
                <Users size={14} style={tw`mr-2`} /> 3. {strings.booking.seats}
              </Text>
              <View style={tw`flex-row items-center gap-4`}>
                <TouchableOpacity
                  onPress={() => setSeats((s) => Math.max(1, s - 1))}
                  style={tw`w-10 h-10 border border-zinc-200 dark:border-zinc-800 rounded-full items-center justify-center`}
                >
                  <Text style={tw`text-lg font-bold text-zinc-700 dark:text-zinc-350`}>-</Text>
                </TouchableOpacity>
                <Text style={tw`text-base font-bold text-zinc-900 dark:text-white`}>
                  {seats} {strings.booking.persons(seats)}
                </Text>
                <TouchableOpacity
                  onPress={() => setSeats((s) => Math.min(20, s + 1))}
                  style={tw`w-10 h-10 border border-zinc-200 dark:border-zinc-800 rounded-full items-center justify-center`}
                >
                  <Text style={tw`text-lg font-bold text-zinc-700 dark:text-zinc-350`}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Next Button */}
            <TouchableOpacity
              onPress={handleNextStep}
              style={tw`h-12 bg-black dark:bg-white rounded-xl items-center justify-center mt-4`}
            >
              <Text style={tw`text-sm font-bold text-white dark:text-black`}>
                {strings.booking.next}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 2: Customer details */}
        {step === 2 && (
          <View style={tw`gap-4`}>
            <Text style={tw`text-sm font-bold text-zinc-900 dark:text-white mb-2`}>
              {strings.booking.stepDetails}
            </Text>

            {/* Non-authenticated selection */}
            {!isAuthenticated && (
              <View style={tw`mb-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-1 flex-row bg-zinc-50 dark:bg-zinc-950`}>
                {['guest', 'login', 'register'].map((act) => {
                  const isActive = authAction === act;
                  return (
                    <TouchableOpacity
                      key={act}
                      onPress={() => setAuthAction(act as any)}
                      style={tw`flex-1 py-2 items-center rounded-xl ${
                        isActive ? 'bg-white dark:bg-zinc-800 shadow-sm' : ''
                      }`}
                    >
                      <Text style={tw`text-[10px] font-bold capitalize ${
                        isActive ? 'text-black dark:text-white' : 'text-zinc-400'
                      }`}>
                        {act === 'guest' ? 'Επισκέπτης' : act === 'login' ? 'Σύνδεση' : 'Εγγραφή'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Inputs */}
            <View style={tw`flex-row gap-3`}>
              <View style={tw`flex-1`}>
                <Text style={tw`text-xs font-bold text-zinc-500 mb-1.5`}>Όνομα</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  style={tw`h-11 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white text-sm`}
                />
              </View>
              <View style={tw`flex-1`}>
                <Text style={tw`text-xs font-bold text-zinc-500 mb-1.5`}>Επώνυμο</Text>
                <TextInput
                  value={surname}
                  onChangeText={setSurname}
                  style={tw`h-11 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white text-sm`}
                />
              </View>
            </View>

            <View>
              <Text style={tw`text-xs font-bold text-zinc-500 mb-1.5`}>Email</Text>
              <TextInput
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                style={tw`h-11 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white text-sm`}
              />
            </View>

            {(authAction === 'guest' || authAction === 'register' || isAuthenticated) && (
              <View>
                <Text style={tw`text-xs font-bold text-zinc-500 mb-1.5`}>Τηλέφωνο</Text>
                <TextInput
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                  style={tw`h-11 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white text-sm`}
                />
              </View>
            )}

            {/* Password if Login */}
            {authAction === 'login' && !isAuthenticated && (
              <View>
                <Text style={tw`text-xs font-bold text-zinc-500 mb-1.5`}>Κωδικός</Text>
                <TextInput
                  secureTextEntry
                  value={loginPassword}
                  onChangeText={setLoginPassword}
                  style={tw`h-11 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white text-sm`}
                />
              </View>
            )}

            {/* Password if Register */}
            {authAction === 'register' && !isAuthenticated && (
              <View>
                <Text style={tw`text-xs font-bold text-zinc-500 mb-1.5`}>Ορίστε Κωδικό</Text>
                <TextInput
                  secureTextEntry
                  value={regPassword}
                  onChangeText={setRegPassword}
                  style={tw`h-11 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white text-sm`}
                />
              </View>
            )}

            {/* Comment */}
            <View>
              <Text style={tw`text-xs font-bold text-zinc-500 mb-1.5`}>Σχόλια (προαιρετικά)</Text>
              <TextInput
                multiline
                value={comment}
                onChangeText={setComment}
                placeholder={strings.booking.commentPlaceholder}
                placeholderTextColor="#a1a1aa"
                style={[tw`h-20 px-4 py-2 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 rounded-xl text-sm text-zinc-900 dark:text-white`, { textAlignVertical: 'top' }]}
              />
            </View>

            {/* Navigation buttons */}
            <View style={tw`flex-row gap-3 mt-4`}>
              <TouchableOpacity
                onPress={() => setStep(1)}
                style={tw`flex-1 h-12 border border-zinc-200 dark:border-zinc-800 rounded-xl items-center justify-center`}
              >
                <Text style={tw`text-sm font-bold text-zinc-700 dark:text-zinc-300`}>
                  {strings.booking.back}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={isSubmitting}
                style={tw`flex-[2] h-12 bg-black dark:bg-white rounded-xl items-center justify-center ${
                  isSubmitting ? 'opacity-55' : ''
                }`}
              >
                <Text style={tw`text-sm font-bold text-white dark:text-black`}>
                  {isSubmitting ? 'Υποβολή…' : strings.booking.confirm}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* STEP 3: Confirm Screen */}
        {step === 3 && (
          <View style={tw`items-center py-10 gap-4`}>
            <View style={tw`w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/40 items-center justify-center mb-2`}>
              <Check size={32} color="#10b981" />
            </View>
            <Text style={tw`text-xl font-bold text-zinc-900 dark:text-white text-center`}>
              {strings.booking.success}
            </Text>
            <Text style={tw`text-sm text-zinc-500 dark:text-zinc-400 text-center mb-6`}>
              {strings.booking.successHint}
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Home')}
              style={tw`w-full max-w-xs h-12 bg-black dark:bg-white rounded-xl items-center justify-center`}
            >
              <Text style={tw`text-sm font-bold text-white dark:text-black`}>
                Επιστροφή στην Αρχική
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
