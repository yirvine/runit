/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import type {PropsWithChildren} from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
  Button,
} from 'react-native';

import {
  Colors,
  DebugInstructions,
  Header,
  LearnMoreLinks,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';

import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GOOGLE_WEB_CLIENT_ID, GOOGLE_IOS_CLIENT_ID } from '@env';
import { FIREBASE_API_KEY, FIREBASE_AUTH_DOMAIN, FIREBASE_PROJECT_ID, FIREBASE_STORAGE_BUCKET, FIREBASE_MESSAGING_SENDER_ID, FIREBASE_APP_ID } from '@env';
// import auth, { getAuth, signInWithCredential } from '@react-native-firebase/auth';
import { getAuth, signInWithCredential, GoogleAuthProvider } from 'firebase/auth';
import { initializeApp, getApps } from 'firebase/app';

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
if (!getApps().length) {
  initializeApp(firebaseConfig);
  console.log('🔥 Firebase Initialized');
} else {
  console.log('✅ Firebase Already Initialized');
}

GoogleSignin.configure({
  webClientId: GOOGLE_WEB_CLIENT_ID,
  iosClientId: GOOGLE_IOS_CLIENT_ID,
});

type SectionProps = PropsWithChildren<{
  title: string;
}>;

function Section({children, title}: SectionProps): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  return (
    <View style={styles.sectionContainer}>
      <Text
        style={[
          styles.sectionTitle,
          {
            color: isDarkMode ? Colors.white : Colors.black,
          },
        ]}>
        {title}
      </Text>
      <Text
        style={[
          styles.sectionDescription,
          {
            color: isDarkMode ? Colors.light : Colors.dark,
          },
        ]}>
        {children}
      </Text>
    </View>
  );
}

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

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
      const auth = getAuth();
      const googleCredential = GoogleAuthProvider.credential(idToken);
      const firebaseUser = await signInWithCredential(auth, googleCredential);

      // ✅ Extract Firebase ID Token (this is what we send to NestJS)
      const firebaseIdToken = await firebaseUser.user.getIdToken();

      console.log('🔥 Firebase ID Token:', firebaseIdToken);

      // ✅ Now send it to the backend!
      sendTokenToBackend(firebaseIdToken);

    } catch (error) {
      console.error('Google Sign-In Error:', error);
    }
  };


  const safePadding = '5%';

  return (
    <View style={backgroundStyle}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <ScrollView
        style={backgroundStyle}>
        <View style={{paddingRight: safePadding}}>
          <Header/>
        </View>
        <View
          style={{
            backgroundColor: isDarkMode ? Colors.black : Colors.white,
            paddingHorizontal: safePadding,
            paddingBottom: safePadding,
          }}>
          <Section title="Step One">
            Edit <Text style={styles.highlight}>App.tsx</Text> to change this
            SCWEEEEN and then come back to see your edits.
          </Section>

          <Section title="Sign In">
          <Button title="Test Button" onPress={() => console.log('🔥 Button Pressed')} />
            {/* Add Button to Trigger Google Sign-In */}
            <TouchableOpacity onPress={signInWithGoogle} style={styles.signInButton}>
              <Text style={styles.signInText}>Sign in with Google</Text>
            </TouchableOpacity>
          </Section>

          <Section title="See Your Changes">
            <ReloadInstructions />
          </Section>
          <Section title="Debug">
            <DebugInstructions />
          </Section>
          <Section title="Learn More">
            Read the docs to discover what to do next:
          </Section>
          <LearnMoreLinks />
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
});

export default App;
