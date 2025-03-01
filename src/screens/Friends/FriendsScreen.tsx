import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList } from 'react-native';

interface Friend {
  id: string;
  name: string;
  runs: number;
  miles: number;
}

// Dummy data for friends list
const dummyFriends: Friend[] = [
  { id: '1', name: 'Sarah Johnson', runs: 12, miles: 45.2 },
  { id: '2', name: 'Mike Chen', runs: 8, miles: 32.7 },
  { id: '3', name: 'Jessica Williams', runs: 15, miles: 62.3 },
  { id: '4', name: 'David Kim', runs: 5, miles: 18.5 },
  { id: '5', name: 'Emma Davis', runs: 10, miles: 40.1 },
];

const FriendsScreen = () => {
  const renderFriendItem = ({ item }: { item: Friend }) => (
    <View style={styles.friendItem}>
      <View style={styles.friendAvatar}>
        <Text style={styles.friendInitial}>{item.name.charAt(0)}</Text>
      </View>
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{item.name}</Text>
        <Text style={styles.friendStats}>{item.runs} runs · {item.miles} miles</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Friends</Text>
        <Text style={styles.subtitle}>Connect with other runners</Text>

        <FlatList
          data={dummyFriends}
          renderItem={renderFriendItem}
          keyExtractor={item => item.id}
          style={styles.friendsList}
          contentContainerStyle={styles.friendsListContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No friends yet. Add some friends to see their activity!</Text>
          }
        />

        <Text style={styles.description}>
          Follow your friends' running activities and compete with them in challenges.
        </Text>
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
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 20,
    color: '#666',
  },
  friendsList: {
    flex: 1,
    width: '100%',
  },
  friendsListContent: {
    paddingVertical: 10,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  friendAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  friendInitial: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  friendStats: {
    fontSize: 14,
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 30,
    marginBottom: 30,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    lineHeight: 24,
    marginTop: 20,
  },
});

export default FriendsScreen;
