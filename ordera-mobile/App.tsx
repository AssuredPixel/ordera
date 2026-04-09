import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import "./global.css";
import { Text, View, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from './src/hooks/useAuth';

export default function App() {
  const [salesId, setSalesId] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { user, login, logout, loading } = useAuth();

  const handleLogin = async () => {
    if (!salesId || !password) {
      Alert.alert('Error', 'Please enter both Sales ID and Password');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(salesId, password);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to sign in. Please check your credentials.';
      Alert.alert('Login Failed', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#C97B2A" />
      </View>
    );
  }

  if (user) {
    return (
      <View className="flex-1 bg-white items-center justify-center p-6">
        <Text className="text-2xl font-bold text-[#1A1A2E] mb-2">Welcome, {user.name}!</Text>
        <Text className="text-gray-600 mb-8">{user.role} @ {user.branchId || 'Main Office'}</Text>
        
        <TouchableOpacity 
          onPress={logout}
          className="w-full border-2 border-[#C97B2A] rounded-xl py-4 items-center"
        >
          <Text className="text-[#C97B2A] font-bold text-base">Sign Out</Text>
        </TouchableOpacity>
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white items-center justify-center p-6">
      <View className="w-full max-w-sm">
        <Text className="text-3xl font-bold text-[#1A1A2E] mb-8 text-center">
          Ordera
        </Text>
        
        <View className="space-y-4">
          <View>
            <Text className="text-gray-600 mb-2 font-medium">Sales ID</Text>
            <TextInput 
              className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-gray-50 text-base"
              placeholder="Enter your Sales ID"
              value={salesId}
              onChangeText={setSalesId}
              autoCapitalize="none"
            />
          </View>
          
          <View className="mt-4">
            <Text className="text-gray-600 mb-2 font-medium">Password</Text>
            <TextInput 
              className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-gray-50 text-base"
              placeholder="Enter your password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity 
            onPress={handleLogin}
            disabled={isSubmitting}
            className={`w-full bg-[#C97B2A] rounded-xl py-4 mt-8 items-center ${isSubmitting ? 'opacity-70' : ''}`}
          >
            {isSubmitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-base">
                Sign In
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
      <StatusBar style="auto" />
    </View>
  );
}
