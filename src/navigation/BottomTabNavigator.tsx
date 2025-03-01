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

// Custom tab bar icons
const TabBarIcon = ({ focused, color, name }: { focused: boolean; color: string; name: string }) => {
  return (
    <View style={[styles.iconContainer, focused ? styles.iconFocused : null]}>
      <Text style={[styles.iconText, { color }]}>{name}</Text>
    </View>
  );
};

const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#4285F4',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: {
          height: 60,
          paddingBottom: 10,
          paddingTop: 10,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon focused={focused} color={color} name="🏠" />
          ),
        }}
      />
      <Tab.Screen 
        name="Friends" 
        component={FriendsScreen} 
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon focused={focused} color={color} name="👥" />
          ),
        }}
      />
      <Tab.Screen 
        name="Record" 
        component={RecordScreen} 
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon focused={focused} color={color} name="🏃" />
          ),
        }}
      />
      <Tab.Screen 
        name="Challenges" 
        component={ChallengesScreen} 
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon focused={focused} color={color} name="🏆" />
          ),
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon focused={focused} color={color} name="👤" />
          ),
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
    backgroundColor: 'rgba(66, 133, 244, 0.1)',
  },
  iconText: {
    fontSize: 20,
  },
});

export default BottomTabNavigator; 