import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';

// Import screens
import HomeScreen from '../screens/Home/HomeScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import RecordScreen from '../screens/Record/RecordScreen';
import FriendsScreen from '../screens/Friends/FriendsScreen';
import ChallengesScreen from '../screens/Challenges/ChallengesScreen';

const Tab = createBottomTabNavigator();

// Base TabBarIcon component
const TabBarIcon = ({ focused, color, name }: { focused: boolean; color: string; name: string }) => {
  return (
    <View style={[styles.iconContainer, focused ? styles.iconFocused : null]}>
      <Text style={[styles.iconText, { color }]}>{name}</Text>
    </View>
  );
};

// Pre-defined icon components for each tab
const HomeIcon = (props: { focused: boolean; color: string }) => (
  <TabBarIcon {...props} name="🏠" />
);

const FriendsIcon = (props: { focused: boolean; color: string }) => (
  <TabBarIcon {...props} name="👥" />
);

const RecordIcon = (props: { focused: boolean; color: string }) => (
  <TabBarIcon {...props} name="🏃" />
);

const ChallengesIcon = (props: { focused: boolean; color: string }) => (
  <TabBarIcon {...props} name="🏆" />
);

const ProfileIcon = (props: { focused: boolean; color: string }) => (
  <TabBarIcon {...props} name="👤" />
);

const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#6bc76b',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: {
          height: 70,
          paddingBottom: 10,
          paddingTop: 10,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          borderTopWidth: 1,
          borderTopColor: '#eaeaea',
          backgroundColor: 'white',
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: HomeIcon,
        }}
      />
      <Tab.Screen
        name="Friends"
        component={FriendsScreen}
        options={{
          tabBarIcon: FriendsIcon,
        }}
      />
      <Tab.Screen
        name="Record"
        component={RecordScreen}
        options={{
          tabBarIcon: RecordIcon,
        }}
      />
      <Tab.Screen
        name="Challenges"
        component={ChallengesScreen}
        options={{
          tabBarIcon: ChallengesIcon,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ProfileIcon,
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  iconFocused: {
    backgroundColor: 'rgba(107, 199, 107, 0.1)', // Green instead of blue
  },
  iconText: {
    fontSize: 20,
  },
});

export default BottomTabNavigator;
