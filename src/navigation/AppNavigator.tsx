import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

import BottomTabNavigator from './BottomTabNavigator';
import AuthScreen from '../screens/Auth/AuthScreen';

// For local development, use localhost
// Change this URL when deploying to production
const API_URL = 'http://localhost:3000';

const AppNavigator = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to register user with backend
  const registerUserWithBackend = async (firebaseUser: User) => {
    try {
      // Get the Firebase ID token
      const firebaseIdToken = await firebaseUser.getIdToken();
      
      console.log('Sending request to:', `${API_URL}/auth/login`);
      
      // Call your backend API to register/verify the user
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken: firebaseIdToken,
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to register user with backend:', errorText);
      } else {
        const result = await response.json();
        console.log('✅ User registered/verified with backend successfully:', result);
      }
    } catch (error) {
      console.error('Backend registration error:', error);
    }
  };

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in, register with backend
        registerUserWithBackend(firebaseUser);
      }
      setUser(firebaseUser);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4285F4" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <BottomTabNavigator /> : <AuthScreen />}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#d5f1d7',
  },
});

export default AppNavigator;
