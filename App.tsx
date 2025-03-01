/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';

import {
  Header,
} from 'react-native/Libraries/NewAppScreen';

import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GOOGLE_WEB_CLIENT_ID, GOOGLE_IOS_CLIENT_ID } from '@env';

import { signInWithCredential, GoogleAuthProvider, signOut, User, onAuthStateChanged } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from './firebase';

const sendTokenToBackend = async (firebaseIdToken: string) => {
  console.log('📤 Sending Firebase ID Token to backend:', firebaseIdToken);
  try {
    const response = await fetch('http://localhost:3000/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken: firebaseIdToken }),
    });

    const data = await response.json();
    console.log('✅ Backend Response:', data);
  } catch (error) {
    console.error('❌ Error sending token to backend:', error);
  }
};

console.log('🔥 App Loaded Successfully');

GoogleSignin.configure({
  webClientId: GOOGLE_WEB_CLIENT_ID,
  iosClientId: GOOGLE_IOS_CLIENT_ID,
});

function App(): React.JSX.Element {

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        console.log('✅ User session restored:', firebaseUser.email);
        setUser(firebaseUser);
      } else {
        console.log('❌ No session found');
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    console.log('🔥 Sign-In Button Clicked');

    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      // Access the idToken from the userInfo object
      // @ts-ignore - Ignoring type checking for this line as the GoogleSignin types might be incorrect
      const idToken = userInfo.data?.idToken;

      if (!idToken) {
        console.error('❌ No Google ID Token returned');
        return;
      }

      const googleCredential = GoogleAuthProvider.credential(idToken);
      const firebaseUser = await signInWithCredential(auth, googleCredential);
      const firebaseIdToken = await firebaseUser.user.getIdToken();

      console.log('🔥 Firebase ID Token:', firebaseIdToken);

      // ✅ Store Firebase token to persist session
      await ReactNativeAsyncStorage.setItem('firebaseIdToken', firebaseIdToken);

      // ✅ 🔥 Send token to backend (Re-added)
      sendTokenToBackend(firebaseIdToken);

      console.log('✅ Sign-in successful, session will persist.');
      setUser(firebaseUser.user);

    } catch (error) {
      console.error('Google Sign-In Error:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      await GoogleSignin.signOut();
      await ReactNativeAsyncStorage.removeItem('firebaseIdToken');
      console.log('✅ User signed out');
    } catch (error) {
      console.error('❌ Sign Out Error:', error);
    }
  };

  return (
    <View>
      <ScrollView>
        <View>
          <Header />
        </View>

        <View style={styles.sectionContainer}>
          {loading ? ( // Show loading indicator while Firebase is checking auth state
            <ActivityIndicator size="large" color="#4285F4" />
          ) : user ? (
            <>
              <Text style={styles.sectionTitle}>Welcome, {user?.displayName || 'User'}!</Text>
              <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
                <Text style={styles.signInText}>Sign Out</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Sign In</Text>
              <TouchableOpacity onPress={signInWithGoogle} style={styles.signInButton}>
                <Text style={styles.signInText}>Sign in with Google</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
  signInButton: {
    backgroundColor: '#4285F4',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  signInText: {
    color: 'white',
    fontSize: 18,
  },

  signOutButton: {
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
});

export default App;
