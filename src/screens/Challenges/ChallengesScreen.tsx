import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity } from 'react-native';

interface Challenge {
  id: string;
  title: string;
  description: string;
  participants: number;
  daysLeft: number;
  type: 'active' | 'completed';
  result?: string;
}

// Dummy data for challenges
const dummyChallenges: Challenge[] = [
  {
    id: '1',
    title: '5K Challenge',
    description: 'Run 5 kilometers in under 30 minutes',
    participants: 24,
    daysLeft: 7,
    type: 'active',
  },
  {
    id: '2',
    title: 'Weekly Distance',
    description: 'Run at least 20 miles this week',
    participants: 56,
    daysLeft: 3,
    type: 'active',
  },
  {
    id: '3',
    title: 'Morning Runner',
    description: 'Complete 5 runs before 8 AM',
    participants: 18,
    daysLeft: 14,
    type: 'active',
  },
  {
    id: '4',
    title: 'Marathon Prep',
    description: 'Complete a 15-mile run',
    participants: 32,
    daysLeft: 0,
    type: 'completed',
    result: 'Completed',
  },
];

const ChallengesScreen = () => {
  const renderChallengeItem = ({ item }: { item: Challenge }) => (
    <View style={styles.challengeItem}>
      <View style={styles.challengeHeader}>
        <Text style={styles.challengeTitle}>{item.title}</Text>
        <View style={[
          styles.challengeStatus,
          item.type === 'completed' ? styles.completedStatus : styles.activeStatus,
        ]}>
          <Text style={styles.challengeStatusText}>
            {item.type === 'completed' ? 'Completed' : `${item.daysLeft} days left`}
          </Text>
        </View>
      </View>
      <Text style={styles.challengeDescription}>{item.description}</Text>
      <View style={styles.challengeFooter}>
        <Text style={styles.participantsText}>{item.participants} participants</Text>
        {item.type === 'active' && (
          <TouchableOpacity style={styles.joinButton}>
            <Text style={styles.joinButtonText}>Join</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Challenges</Text>
        <Text style={styles.subtitle}>Compete and achieve your goals</Text>

        <FlatList
          data={dummyChallenges}
          renderItem={renderChallengeItem}
          keyExtractor={item => item.id}
          style={styles.challengesList}
          contentContainerStyle={styles.challengesListContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No challenges available at the moment.</Text>
          }
        />

        <Text style={styles.description}>
          Join challenges to compete with friends and other runners to achieve your fitness goals.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  content: {
    flex: 1,
    padding: 20,
    paddingBottom: 90,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2e7d32',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 20,
    color: '#666',
  },
  challengesList: {
    flex: 1,
    width: '100%',
  },
  challengesListContent: {
    paddingVertical: 10,
    paddingBottom: 30,
  },
  challengeItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#8cd98c',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  challengeStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeStatus: {
    backgroundColor: '#e6ffe6',
  },
  completedStatus: {
    backgroundColor: '#e6ffe6',
  },
  challengeStatusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6bc76b',
  },
  challengeDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
  },
  challengeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  participantsText: {
    fontSize: 12,
    color: '#888',
  },
  joinButton: {
    backgroundColor: '#6bc76b',
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 15,
  },
  joinButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
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

export default ChallengesScreen;
