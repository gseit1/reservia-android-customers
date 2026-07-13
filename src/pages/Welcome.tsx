import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import tw from 'twrnc';
import { useAuth } from '../contexts/AuthContext';

export default function Welcome() {
  const navigation = useNavigation<any>();
  const { setGuestMode } = useAuth();

  return (
    <View style={tw`flex-1 bg-white dark:bg-black px-6 py-12 justify-between`}>
      {/* Top spacing */}
      <View />

      {/* Middle Brand Section */}
      <View style={tw`items-center gap-6`}>
        <Image
          source={require('../../assets/logo3.png')}
          style={tw`h-18 w-56`}
          resizeMode="contain"
        />
        <View style={tw`gap-2 items-center`}>
          <Text style={tw`text-lg font-bold text-zinc-900 dark:text-white text-center`}>
            Reservia
          </Text>
          <Text style={tw`text-sm text-zinc-400 dark:text-zinc-550 text-center px-4 leading-relaxed`}>
            Ανακαλύψτε τα καλύτερα καταστήματα της πόλης σας και κλείστε το επόμενο ραντεβού σας σε δευτερόλεπτα.
          </Text>
        </View>
      </View>

      {/* Bottom Actions */}
      <View style={tw`gap-3 w-full mb-4`}>
        {/* Login Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Login', { initialTab: 'login' })}
          style={tw`w-full h-13 bg-black dark:bg-white rounded-2xl items-center justify-center shadow-sm`}
        >
          <Text style={tw`text-sm font-bold text-white dark:text-black`}>
            Σύνδεση
          </Text>
        </TouchableOpacity>

        {/* Register Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Login', { initialTab: 'register' })}
          style={tw`w-full h-13 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-2xl items-center justify-center`}
        >
          <Text style={tw`text-sm font-bold text-zinc-800 dark:text-zinc-200`}>
            Εγγραφή
          </Text>
        </TouchableOpacity>

        {/* Continue as Guest Button */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setGuestMode(true)}
          style={tw`w-full py-3.5 items-center justify-center mt-2`}
        >
          <Text style={tw`text-xs font-semibold text-zinc-500 dark:text-zinc-400 decoration-line`}>
            Συνέχεια ως Επισκέπτης
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
