import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Platform, Alert, PermissionsAndroid } from 'react-native';
import MapView, { Polyline } from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';
import haversine from 'haversine';

interface Coordinate {
  latitude: number;
  longitude: number;
}

const RecordScreen = () => {
  // State variables
  const [isRecording, setIsRecording] = useState(false);
  const [location, setLocation] = useState<Coordinate | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<Coordinate[]>([]);
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [pace, setPace] = useState('0\'00"/mi');
  const [startTime, setStartTime] = useState<number | null>(null);

  // Refs
  const mapRef = useRef<MapView | null>(null);
  const watchId = useRef<number | NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Request location permissions
  const requestLocationPermission = async () => {
    return new Promise<boolean>((resolve) => {
      if (Platform.OS === 'ios') {
        // Check current authorization status first
        Geolocation.getCurrentPosition(
          () => {
            // Already authorized
            resolve(true);
          },
          async (error) => {
            if (error.code === 1) { // PERMISSION_DENIED
              // Request authorization
              const auth = await Geolocation.requestAuthorization('whenInUse');
              resolve(auth === 'granted');
            } else {
              resolve(false);
            }
          },
          { enableHighAccuracy: false, timeout: 5000, maximumAge: 10000 }
        );
      } else if (Platform.OS === 'android') {
        // Android permission handling remains the same
        PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'RunIt needs access to your location to track your runs.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        ).then(granted => {
          resolve(granted === PermissionsAndroid.RESULTS.GRANTED);
        });
      } else {
        resolve(false);
      }
    });
  };

  // Get current location
  const getLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        const initialCoordinate = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setLocation(initialCoordinate);

        // Center map on initial location
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            ...initialCoordinate,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          });
        }
      },
      (error) => {
        console.log(error.code, error.message);
        Alert.alert('Error', 'Unable to get location');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  // Initialize location on component mount
  useEffect(() => {
    // Simplified initialization for simulator
    const initLocation = async () => {
      try {
        // For iOS simulator, this should work without additional configuration
        const hasPermission = await requestLocationPermission();
        if (hasPermission) {
          getLocation();
        } else {
          Alert.alert('Permission Denied', 'Location permission is required to track your runs');
        }
      } catch (error) {
        console.log('Location initialization error:', error);
      }
    };

    initLocation();

    // Cleanup function
    return () => {
      if (watchId.current !== null) {
        if (typeof watchId.current === 'number') {
          Geolocation.clearWatch(watchId.current);
        } else {
          clearInterval(watchId.current);
        }
        watchId.current = null;
      }

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  // Add separate timer function that uses actual elapsed time
  useEffect(() => {
    let timerInterval: NodeJS.Timeout | null = null;

    if (isRecording && startTime) {
      // Update timer every second based on actual elapsed time
      timerInterval = setInterval(() => {
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        setDuration(elapsedSeconds);

        // Update pace if we have distance
        if (distance > 0) {
          const paceMinutes = elapsedSeconds / 60 / distance;
          const paceMinutesWhole = Math.floor(paceMinutes);
          const paceSeconds = Math.floor((paceMinutes - paceMinutesWhole) * 60);
          setPace(`${paceMinutesWhole}'${paceSeconds.toString().padStart(2, '0')}"/mi`);
        }
      }, 1000);
    }

    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [isRecording, startTime, distance]);

  // Start recording function
  const startRecording = async () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      setStartTime(null);

      if (watchId.current !== null) {
        if (typeof watchId.current === 'number') {
          // For Geolocation.watchPosition
          Geolocation.clearWatch(watchId.current);
        } else {
          // For setInterval
          clearInterval(watchId.current);
        }
        watchId.current = null;
      }

      // Save run data or show summary
      Alert.alert(
        'Run Completed',
        `Distance: ${distance.toFixed(2)} mi\nDuration: ${formatTime(duration)}\nPace: ${pace}`,
        [{
          text: 'OK',
          onPress: () => {
            // Reset state for next run AFTER user acknowledges
            setRouteCoordinates([]);
            setDistance(0);
            setDuration(0);
            setPace('0\'00"/mi');
          },
        }]
      );
    } else {
      // Check permission before starting
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        Alert.alert('Permission Denied', 'Location permission is required to track your runs');
        return;
      }

      // Start recording
      setIsRecording(true);
      setStartTime(Date.now());

      // Reset state
      setRouteCoordinates([]);
      setDistance(0);
      setDuration(0);
      setPace('0\'00"/mi');

      // Start with current location
      if (location) {
        setRouteCoordinates([location]);
      }

      // For simulator testing - use a more aggressive polling approach
      if (__DEV__ && Platform.OS === 'ios') {
        // Poll for location changes more frequently
        watchId.current = setInterval(() => {
          // Get current location on each interval
          Geolocation.getCurrentPosition(
            (position) => {
              const newCoordinate = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              };

              // Only add to route if position actually changed
              if (!location ||
                  newCoordinate.latitude !== location.latitude ||
                  newCoordinate.longitude !== location.longitude) {

                setLocation(newCoordinate);

                setRouteCoordinates(prevCoordinates => {
                  if (!Array.isArray(prevCoordinates) || prevCoordinates.length === 0) {
                    return [newCoordinate];
                  }

                  const updatedCoordinates = [...prevCoordinates, newCoordinate];

                  // Calculate new distance
                  const lastCoord = prevCoordinates[prevCoordinates.length - 1];
                  if (lastCoord) {
                    const newDistance = haversine(lastCoord, newCoordinate, { unit: 'mile' });
                    setDistance(prevDistance => prevDistance + newDistance);
                  }

                  return updatedCoordinates;
                });
              }
            },
            (error) => console.log(error),
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
          );
        }, 500); // Poll every 500ms
      } else {
        // Watch position changes
        watchId.current = Geolocation.watchPosition(
          (position) => {
            try {
              // Strict validation of position data
              if (!position ||
                  !position.coords ||
                  typeof position.coords.latitude !== 'number' ||
                  typeof position.coords.longitude !== 'number') {
                console.log('Invalid position data received:', position);
                return;
              }

              const newCoordinate = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              };

              // Update location state with the new coordinates
              setLocation(newCoordinate);

              // IMPORTANT: Always add the new coordinate to route coordinates
              // This ensures the path follows the blue dot
              setRouteCoordinates(prevCoordinates => {
                // Safety check
                if (!Array.isArray(prevCoordinates)) {
                  return [newCoordinate];
                }

                // Create a new array with the new coordinate
                const updatedCoordinates = [...prevCoordinates, newCoordinate];

                // Calculate distance only if we have previous coordinates
                if (prevCoordinates.length > 0) {
                  try {
                    const lastCoord = prevCoordinates[prevCoordinates.length - 1];
                    if (lastCoord &&
                        typeof lastCoord.latitude === 'number' &&
                        typeof lastCoord.longitude === 'number') {
                      const newDistance = haversine(lastCoord, newCoordinate, { unit: 'mile' });
                      setDistance(prevDistance => prevDistance + newDistance);
                    }
                  } catch (error) {
                    console.log('Error calculating distance:', error);
                  }
                }

                return updatedCoordinates;
              });

              // Map animation
              if (mapRef.current) {
                mapRef.current.animateToRegion({
                  ...newCoordinate,
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                });
              }
            } catch (error) {
              console.log('Error processing location update:', error);
            }
          },
          (error) => {
            console.log('Location watch error:', error.code, error.message);
          },
          {
            enableHighAccuracy: true,
            distanceFilter: 5,
            interval: 1000,
            fastestInterval: 500,
          }
        );
      }
    }
  };

  // Format time for display (HH:MM:SS)
  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Record Run</Text>

        {/* Map View */}
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            showsUserLocation
            followsUserLocation
            initialRegion={location ? {
              ...location,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            } : undefined}
          >
            {routeCoordinates.length > 1 && (
              <Polyline
                coordinates={routeCoordinates}
                strokeWidth={4}
                strokeColor="#6bc76b"
              />
            )}
          </MapView>
        </View>

        {/* Record Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.recordButton, isRecording && styles.recordingButton]}
            onPress={startRecording}
          >
            <Text style={styles.recordButtonText}>
              {isRecording ? 'STOP' : 'START'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats Container */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Distance</Text>
            <Text style={styles.statValue}>{distance.toFixed(2)} mi</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Duration</Text>
            <Text style={styles.statValue}>{formatTime(duration)}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Pace</Text>
            <Text style={styles.statValue}>{pace}</Text>
          </View>
        </View>

        <Text style={styles.description}>
          {isRecording
            ? 'Recording in progress. Your route is being tracked in real-time.'
            : 'Press START to begin recording your run. Your route will be tracked and stats will be calculated in real-time.'}
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
    alignItems: 'center',
    paddingBottom: 90, // Add padding for the tab bar
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  mapContainer: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#eaeaea',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  recordButton: {
    backgroundColor: '#6bc76b',
    width: 150,
    height: 150,
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  recordingButton: {
    backgroundColor: '#f44336', // Red when recording
  },
  recordButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    marginHorizontal: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6bc76b',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    lineHeight: 24,
  },
});

export default RecordScreen;
