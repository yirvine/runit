/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect, useState } from 'react';
// import type {PropsWithChildren} from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
  ActivityIndicator,
} from 'react-native';

import {
  Colors,
  Header,
} from 'react-native/Libraries/NewAppScreen';

import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GOOGLE_WEB_CLIENT_ID, GOOGLE_IOS_CLIENT_ID } from '@env';
import { FIREBASE_API_KEY, FIREBASE_AUTH_DOMAIN, FIREBASE_PROJECT_ID, FIREBASE_STORAGE_BUCKET, FIREBASE_MESSAGING_SENDER_ID, FIREBASE_APP_ID } from '@env';

import { getAuth, signInWithCredential, GoogleAuthProvider, onAuthStateChanged, signOut, User } from 'firebase/auth';
import { initializeApp, getApps } from 'firebase/app';

// import AsyncStorage from '@react-native-async-storage/async-storage';

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
const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID,
};

// ✅ Check if Firebase is already initialized
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
console.log('🔥 Firebase Initialized:', app.name);


GoogleSignin.configure({
  webClientId: GOOGLE_WEB_CLIENT_ID,
  iosClientId: GOOGLE_IOS_CLIENT_ID,
});

function App(): React.JSX.Element {

  const isDarkMode = useColorScheme() === 'dark';
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const auth = getAuth(app);

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        console.log('✅ User is logged in:', firebaseUser.email);
        setUser(firebaseUser);
      } else {
        console.log('❌ No user logged in');
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]); // Add `auth` to dependencies

  const signInWithGoogle = async () => {
    console.log('🔥 Sign-In Button Clicked'); // Debug log

    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();  // ✅ Gets Google User Info
      const idToken = userInfo.data?.idToken; // Ensure we access it properly

      if (!idToken) {
        console.error('❌ No Google ID Token returned');
        return;
      }

      // ✅ Exchange Google Token for Firebase Token
      const googleCredential = GoogleAuthProvider.credential(idToken);
      const firebaseUser = await signInWithCredential(auth, googleCredential);
      const firebaseIdToken = await firebaseUser.user.getIdToken();  // This is what we send to NestJS

      console.log('🔥 Firebase ID Token:', firebaseIdToken);

      sendTokenToBackend(firebaseIdToken);  // Send it to the backend!

    } catch (error) {
      console.error('Google Sign-In Error:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      await GoogleSignin.signOut();
      console.log('✅ User signed out');
    } catch (error) {
      console.error('❌ Sign Out Error:', error);
    }
  };

  // const safePadding = '5%';

  return (
    <View style={backgroundStyle}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
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
