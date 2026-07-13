import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import tw from 'twrnc';
import { useAuth } from '../contexts/AuthContext';
import { strings } from '../strings/greek';
import apiClient from '../lib/apiClient';

type Tab = 'login' | 'register';

export default function Login() {
  const navigation = useNavigation<any>();
  const { refreshUser } = useAuth();
  const [tab, setTab] = useState<Tab>('login');

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form
  const [regName, setRegName] = useState('');
  const [regSurname, setRegSurname] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      Alert.alert('Σφάλμα', 'Παρακαλώ συμπληρώστε όλα τα πεδία');
      return;
    }
    setIsLoading(true);
    try {
      await apiClient.post('/api/login', { email: loginEmail, password: loginPassword });
      const user = await refreshUser();
      if (user) {
        navigation.navigate('MainTabs', { screen: 'Profile' });
      }
    } catch (err: any) {
      Alert.alert('Σφάλμα', err.message || 'Σφάλμα σύνδεσης');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!regName || !regSurname || !regEmail || !regPassword || !regPhone) {
      Alert.alert('Σφάλμα', 'Παρακαλώ συμπληρώστε όλα τα πεδία');
      return;
    }
    setIsLoading(true);

    let finalPhone = regPhone.trim();
    if (/^(69\d{8}|2\d{2,3}\d{6,7})$/.test(finalPhone)) {
      finalPhone = '+30' + finalPhone;
    } else if (/^30(69\d{8}|2\d{2,3}\d{6,7})$/.test(finalPhone)) {
      finalPhone = '+' + finalPhone;
    }

    try {
      await apiClient.post('/api/signup', {
        name: regName,
        surname: regSurname,
        email: regEmail,
        password: regPassword,
        phone: finalPhone,
      });
      const user = await refreshUser();
      if (user) {
        navigation.navigate('MainTabs', { screen: 'Profile' });
      }
    } catch (err: any) {
      Alert.alert('Σφάλμα', err.message || 'Σφάλμα εγγραφής');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={tw`flex-1 bg-zinc-50 dark:bg-black`}
    >
      <ScrollView contentContainerStyle={tw`flex-grow justify-center px-6 py-10`}>
        {/* Card wrapper */}
        <View style={tw`bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 p-6 shadow-xl`}>
          {/* Brand header */}
          <View style={tw`items-center mb-8`}>
            <Text style={tw`text-3xl font-extrabold text-black dark:text-white tracking-wide`}>
              Reservia
            </Text>
          </View>

          {/* Tab buttons */}
          <View style={tw`flex-row rounded-xl bg-zinc-100 dark:bg-zinc-800/50 p-1 mb-6`}>
            <TouchableOpacity
              onPress={() => setTab('login')}
              style={tw`flex-1 py-2.5 rounded-lg items-center ${
                tab === 'login' ? 'bg-white dark:bg-zinc-800 shadow-sm' : ''
              }`}
            >
              <Text style={tw`text-sm font-bold ${
                tab === 'login' ? 'text-zinc-900 dark:text-white' : 'text-zinc-400 dark:text-zinc-500'
              }`}>
                {strings.auth.loginTitle}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setTab('register')}
              style={tw`flex-1 py-2.5 rounded-lg items-center ${
                tab === 'register' ? 'bg-white dark:bg-zinc-800 shadow-sm' : ''
              }`}
            >
              <Text style={tw`text-sm font-bold ${
                tab === 'register' ? 'text-zinc-900 dark:text-white' : 'text-zinc-400 dark:text-zinc-500'
              }`}>
                {strings.auth.registerTitle}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Forms */}
          {tab === 'login' ? (
            <View style={tw`gap-4`}>
              {/* Email */}
              <View>
                <Text style={tw`text-xs font-bold text-zinc-500 mb-1.5 uppercase tracking-wide`}>
                  {strings.auth.email}
                </Text>
                <TextInput
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={loginEmail}
                  onChangeText={setLoginEmail}
                  style={tw`h-11 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white text-sm`}
                />
              </View>

              {/* Password */}
              <View>
                <Text style={tw`text-xs font-bold text-zinc-500 mb-1.5 uppercase tracking-wide`}>
                  {strings.auth.password}
                </Text>
                <TextInput
                  secureTextEntry
                  autoCapitalize="none"
                  value={loginPassword}
                  onChangeText={setLoginPassword}
                  style={tw`h-11 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white text-sm`}
                />
              </View>

              {/* Submit */}
              <TouchableOpacity
                onPress={handleLogin}
                disabled={isLoading}
                style={tw`h-12 bg-black dark:bg-white rounded-xl items-center justify-center mt-4 ${
                  isLoading ? 'opacity-55' : ''
                }`}
              >
                <Text style={tw`text-sm font-bold text-white dark:text-black`}>
                  {isLoading ? strings.common.loading : strings.auth.loginBtn}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={tw`gap-4`}>
              {/* Name & Surname */}
              <View style={tw`flex-row gap-3`}>
                <View style={tw`flex-1`}>
                  <Text style={tw`text-xs font-bold text-zinc-500 mb-1.5 uppercase tracking-wide`}>
                    {strings.auth.name}
                  </Text>
                  <TextInput
                    value={regName}
                    onChangeText={setRegName}
                    style={tw`h-11 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white text-sm`}
                  />
                </View>
                <View style={tw`flex-1`}>
                  <Text style={tw`text-xs font-bold text-zinc-500 mb-1.5 uppercase tracking-wide`}>
                    {strings.auth.surname}
                  </Text>
                  <TextInput
                    value={regSurname}
                    onChangeText={setRegSurname}
                    style={tw`h-11 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white text-sm`}
                  />
                </View>
              </View>

              {/* Email */}
              <View>
                <Text style={tw`text-xs font-bold text-zinc-500 mb-1.5 uppercase tracking-wide`}>
                  {strings.auth.email}
                </Text>
                <TextInput
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={regEmail}
                  onChangeText={setRegEmail}
                  style={tw`h-11 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white text-sm`}
                />
              </View>

              {/* Phone */}
              <View>
                <Text style={tw`text-xs font-bold text-zinc-500 mb-1.5 uppercase tracking-wide`}>
                  {strings.auth.phone}
                </Text>
                <TextInput
                  keyboardType="phone-pad"
                  placeholder="e.g. 6912345678"
                  value={regPhone}
                  onChangeText={setRegPhone}
                  style={tw`h-11 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white text-sm`}
                />
              </View>

              {/* Password */}
              <View>
                <Text style={tw`text-xs font-bold text-zinc-500 mb-1.5 uppercase tracking-wide`}>
                  {strings.auth.password}
                </Text>
                <TextInput
                  secureTextEntry
                  autoCapitalize="none"
                  value={regPassword}
                  onChangeText={setRegPassword}
                  style={tw`h-11 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white text-sm`}
                />
              </View>

              {/* Submit */}
              <TouchableOpacity
                onPress={handleRegister}
                disabled={isLoading}
                style={tw`h-12 bg-black dark:bg-white rounded-xl items-center justify-center mt-4 ${
                  isLoading ? 'opacity-55' : ''
                }`}
              >
                <Text style={tw`text-sm font-bold text-white dark:text-black`}>
                  {isLoading ? strings.common.loading : strings.auth.registerBtn}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
