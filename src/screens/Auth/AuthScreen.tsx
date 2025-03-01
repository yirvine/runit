import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native';

import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { signInWithCredential, GoogleAuthProvider, getAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define an interface that extends the GoogleSignin response type
interface ExtendedSignInResponse {
  type: string;
  data: {
    idToken: string;
    serverAuthCode: string;
    scopes: string[];
    user: {
      id: string;
      name: string;
      email: string;
      photo: string;
      familyName: string;
      givenName: string;
    };
  };
}

const AuthScreen = () => {
  const [loading, setLoading] = useState(false);
  const auth = getAuth();

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      
      // Make sure Google Play Services are available (for Android)
      await GoogleSignin.hasPlayServices();
      
      // Sign in with Google
      const userInfo = await GoogleSignin.signIn();
      
      // Cast to our extended type
      const extendedUserInfo = userInfo as unknown as ExtendedSignInResponse;
      
      // Log the response for debugging
      console.log('Google Sign-In response structure:', Object.keys(extendedUserInfo));
      
      // Get the ID token from the nested data structure
      const idToken = extendedUserInfo.data?.idToken;
      
      if (!idToken) {
        console.error('❌ No Google ID Token returned in the response');
        console.log('Full response:', JSON.stringify(extendedUserInfo));
        setLoading(false);
        Alert.alert(
          'Authentication Error',
          'Could not get authentication token from Google. Please try again.'
        );
        return;
      }
      
      console.log('✅ Successfully got ID token from Google');
      
      // Create a Google credential with the token
      const googleCredential = GoogleAuthProvider.credential(idToken);
      
      // Sign in to Firebase with the Google credential
      const firebaseUserCredential = await signInWithCredential(auth, googleCredential);
      
      // Get the Firebase ID token
      const firebaseIdToken = await firebaseUserCredential.user.getIdToken();
      
      // Store the token for session persistence
      await AsyncStorage.setItem('firebaseIdToken', firebaseIdToken);
      
      console.log('✅ Sign-in successful, session will persist.');
      setLoading(false);
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      setLoading(false);
      
      // Show a user-friendly error message
      Alert.alert(
        'Sign-In Failed',
        'There was a problem signing in with Google. Please try again.'
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>RunIt</Text>
          <Text style={styles.tagline}>Track, Connect, Compete</Text>
        </View>

        <View style={styles.authContainer}>
          <Text style={styles.welcomeText}>Welcome to RunIt</Text>
          <Text style={styles.descriptionText}>
            Sign in to track your runs, connect with friends, and join challenges.
          </Text>

          <TouchableOpacity
            style={styles.signInButton}
            onPress={signInWithGoogle}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.signInText}>Sign in with Google</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#d5f1d7',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  logoText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#4285F4',
    marginBottom: 10,
  },
  tagline: {
    fontSize: 18,
    color: '#666',
  },
  authContainer: {
    marginBottom: 60,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  descriptionText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
    lineHeight: 24,
  },
  signInButton: {
    backgroundColor: '#4285F4',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    width: '80%',
    alignItems: 'center',
  },
  signInText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AuthScreen;
