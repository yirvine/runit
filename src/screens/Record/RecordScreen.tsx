import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Platform, Alert, PermissionsAndroid, Modal, ScrollView, Dimensions } from 'react-native';
import MapView, { Polyline } from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';
import haversine from 'haversine';
import { LineChart } from 'react-native-chart-kit';
import { typography } from '../../theme/fonts';

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface PaceDataPoint {
  time: number;
  pace: number;
}

const RecordScreen = () => {
  // State variables
  const [isRecording, setIsRecording] = useState(false);
  const [location, setLocation] = useState<Coordinate | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<Coordinate[]>([]);
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [pace, setPace] = useState('0\'00"/km');
  const [startTime, setStartTime] = useState<number | null>(null);

  // Add new state for workout summary modal
  const [summaryVisible, setSummaryVisible] = useState(false);
  const [workoutData, setWorkoutData] = useState({
    distance: 0,
    duration: 0,
    pace: '0\'00"/km',
    routeCoordinates: [] as Coordinate[],
    date: new Date().toISOString(),
  });

  const [paceData, setPaceData] = useState<PaceDataPoint[]>([]);

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
        
        // Just set location but DON'T add to route coordinates here
        // Only center the map, don't track yet
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

  // Update the timer implementation
  useEffect(() => {
    if (isRecording && startTime) {
      const updateTimer = () => {
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - startTime) / 1000);
        setDuration(elapsedSeconds);

        // Update pace if we have distance
        if (distance > 0) {
          const paceMinutes = elapsedSeconds / 60 / distance;
          const paceMinutesWhole = Math.floor(paceMinutes);
          const paceSeconds = Math.floor((paceMinutes - paceMinutesWhole) * 60);
          setPace(formatPace(paceMinutesWhole, paceSeconds));
        }
      };

      // Initial update
      updateTimer();

      // Set up interval
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [isRecording, startTime, distance]);

  // Update pace data when pace changes
  useEffect(() => {
    if (isRecording && duration > 0) {
      const currentPace = distance > 0 ? (duration / 60) / distance : 0;
      setPaceData(prev => [...prev, { time: duration, pace: currentPace }]);
    }
  }, [duration, distance, isRecording]);

  // Start recording function
  const startRecording = async () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      setStartTime(null);

      if (watchId.current !== null) {
        if (typeof watchId.current === 'number') {
          Geolocation.clearWatch(watchId.current);
        } else {
          clearInterval(watchId.current);
        }
        watchId.current = null;
      }

      // Show workout summary modal
      setWorkoutData({
        distance: distance,
        duration: duration,
        pace: pace,
        routeCoordinates: routeCoordinates,
        date: new Date().toISOString(),
      });
      setSummaryVisible(true);
    } else {
      // Check permission before starting
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        Alert.alert('Permission Denied', 'Location permission is required to track your runs');
        return;
      }

      // Reset all state before starting
      setRouteCoordinates([]);
      setDistance(0);
      setDuration(0);
      setPace('0\'00"/km');
      setPaceData([]);

      // Start recording with current location
      setIsRecording(true);
      setStartTime(Date.now());

      // Get current location and start from there
      Geolocation.getCurrentPosition(
        (position) => {
          const initialCoordinate = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setLocation(initialCoordinate);
          setRouteCoordinates([initialCoordinate]);
        },
        (error) => console.log(error),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );

      // Start location tracking
      if (__DEV__ && Platform.OS === 'ios') {
        // Poll for location changes more frequently
        watchId.current = setInterval(() => {
          Geolocation.getCurrentPosition(
            (position) => {
              const newCoordinate = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              };

              setLocation(newCoordinate);
              setRouteCoordinates(prevCoordinates => {
                if (!Array.isArray(prevCoordinates)) {
                  return [newCoordinate];
                }

                const updatedCoordinates = [...prevCoordinates, newCoordinate];

                // Calculate new distance
                const lastCoord = prevCoordinates[prevCoordinates.length - 1];
                if (lastCoord) {
                  const newDistance = haversine(lastCoord, newCoordinate, { unit: 'km' });
                  setDistance(prevDistance => prevDistance + newDistance);
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
            },
            (error) => console.log(error),
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
          );
        }, 500);
      } else {
        // Watch position changes
        watchId.current = Geolocation.watchPosition(
          (position) => {
            const newCoordinate = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            };

            setLocation(newCoordinate);
            setRouteCoordinates(prevCoordinates => {
              if (!Array.isArray(prevCoordinates)) {
                return [newCoordinate];
              }

              const updatedCoordinates = [...prevCoordinates, newCoordinate];

              // Calculate new distance
              const lastCoord = prevCoordinates[prevCoordinates.length - 1];
              if (lastCoord) {
                const newDistance = haversine(lastCoord, newCoordinate, { unit: 'km' });
                setDistance(prevDistance => prevDistance + newDistance);
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

  // Calculate additional stats for workout summary
  const calculateCalories = (distanceKm: number) => {
    return Math.round(distanceKm * 60); // Rough estimate: ~60 calories per km
  };

  const calculateAvgSpeed = (distanceKm: number, durationSeconds: number) => {
    return distanceKm > 0 ? (distanceKm / (durationSeconds / 3600)).toFixed(1) : '0.0'; // km/h
  };

  // Get map region from route for summary view
  const getMapRegion = () => {
    if (workoutData.routeCoordinates.length === 0) {
      return {
        latitude: location?.latitude || 37.78825,
        longitude: location?.longitude || -122.4324,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
    }

    let minLat = workoutData.routeCoordinates[0].latitude;
    let maxLat = workoutData.routeCoordinates[0].latitude;
    let minLng = workoutData.routeCoordinates[0].longitude;
    let maxLng = workoutData.routeCoordinates[0].longitude;

    workoutData.routeCoordinates.forEach(coord => {
      minLat = Math.min(minLat, coord.latitude);
      maxLat = Math.max(maxLat, coord.latitude);
      minLng = Math.min(minLng, coord.longitude);
      maxLng = Math.max(maxLng, coord.longitude);
    });

    const midLat = (minLat + maxLat) / 2;
    const midLng = (minLng + maxLng) / 2;

    // Add padding
    const latDelta = (maxLat - minLat) * 1.2 + 0.02;
    const lngDelta = (maxLng - minLng) * 1.2 + 0.02;

    return {
      latitude: midLat,
      longitude: midLng,
      latitudeDelta: Math.max(latDelta, 0.01),
      longitudeDelta: Math.max(lngDelta, 0.01),
    };
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return date.toLocaleDateString(undefined, options);
  };

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Update pace format in the timer effect and where pace is set
  const formatPace = (minutes: number, seconds: number): string => {
    return `${minutes}:${seconds.toString().padStart(2, '0')} /km`;
  };

  // Format time of day
  const formatTimeOfDay = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Reset after viewing summary
  const handleCloseSummary = () => {
    setSummaryVisible(false);
    // Reset state for next run
    setRouteCoordinates([]);
    setDistance(0);
    setDuration(0);
    setPace('0\'00"/km');
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
            <Text style={styles.statValue}>{distance.toFixed(2)} km</Text>
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

      {/* Workout Summary Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={summaryVisible}
        onRequestClose={handleCloseSummary}
      >
        <SafeAreaView style={styles.container}>
          {/* Add header with close button */}
          <View style={styles.modalHeader}>
            <Text style={styles.title}>Workout Summary</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={handleCloseSummary}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
            <View style={styles.header}>
              <Text style={styles.date}>{formatDate(workoutData.date)}</Text>
              <Text style={styles.time}>{formatTimeOfDay(workoutData.date)}</Text>
            </View>

            {/* Map with route */}
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                initialRegion={getMapRegion()}
                scrollEnabled={false}
                zoomEnabled={false}
              >
                {workoutData.routeCoordinates.length > 1 && (
                  <Polyline
                    coordinates={workoutData.routeCoordinates}
                    strokeWidth={4}
                    strokeColor="#6bc76b"
                  />
                )}
              </MapView>
            </View>

            {/* Primary Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.mainStat}>
                <Text style={styles.mainStatValue}>{workoutData.distance.toFixed(2)}</Text>
                <Text style={styles.mainStatLabel}>Kilometers</Text>
              </View>
              <View style={styles.mainStat}>
                <Text style={styles.mainStatValue}>{formatTime(workoutData.duration)}</Text>
                <Text style={styles.mainStatLabel}>Duration</Text>
              </View>
              <View style={styles.mainStat}>
                <Text style={styles.mainStatValue}>{workoutData.pace}</Text>
                <Text style={styles.mainStatLabel}>Pace</Text>
              </View>
            </View>

            {/* Additional Stats */}
            <View style={styles.additionalStats}>
              <View style={styles.statRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Calories</Text>
                  <Text style={styles.statValue}>
                    {calculateCalories(workoutData.distance)} kcal
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Avg. Speed</Text>
                  <Text style={styles.statValue}>
                    {calculateAvgSpeed(workoutData.distance, workoutData.duration)} km/h
                  </Text>
                </View>
              </View>

              <View style={styles.statRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Steps</Text>
                  <Text style={styles.statValue}>~{Math.round(workoutData.distance * 1300)}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Weather</Text>
                  <Text style={styles.statValue}>Not available</Text>
                </View>
              </View>
            </View>

            {/* Pace Graph - only render if not in error state */}
            {typeof LineChart !== 'undefined' && (
              <View style={styles.graphContainer}>
                <Text style={[styles.graphTitle, typography.subtitle]}>Pace Over Time</Text>
                <LineChart
                  data={{
                    labels: paceData.map(d => Math.floor(d.time / 60).toString()),
                    datasets: [{
                      data: paceData.map(d => d.pace)
                    }]
                  }}
                  width={Dimensions.get('window').width - 40}
                  height={220}
                  chartConfig={{
                    backgroundColor: '#ffffff',
                    backgroundGradientFrom: '#ffffff',
                    backgroundGradientTo: '#ffffff',
                    decimalPlaces: 1,
                    color: (opacity = 1) => `rgba(107, 199, 107, ${opacity})`,
                    style: {
                      borderRadius: 16
                    }
                  }}
                  bezier
                  style={{
                    marginVertical: 8,
                    borderRadius: 16
                  }}
                />
              </View>
            )}

            {/* Only include graph if SVG is available */}
            {Platform.OS === 'web' ? null : (
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.saveButton]}
                  onPress={handleCloseSummary}
                >
                  <Text style={styles.buttonText}>Done</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
    ...typography.title,
    marginBottom: 10,
    color: '#333',
  },
  mapContainer: {
    width: '100%',
    height: '35%', // Changed from fixed 300 to percentage
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
    marginVertical: 10, // Added vertical margin
  },
  recordButton: {
    backgroundColor: '#6bc76b',
    width: 120, // Slightly smaller button
    height: 120,
    borderRadius: 60,
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
    marginTop: 10, // Added top margin
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
    ...typography.caption,
    color: '#666',
    marginBottom: 5,
  },
  statValue: {
    ...typography.body,
    fontWeight: '700',
    color: '#6bc76b',
  },
  description: {
    ...typography.body,
    textAlign: 'center',
    color: '#666',
    lineHeight: 24,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  date: {
    fontSize: 18,
    color: '#666',
    marginBottom: 4,
  },
  time: {
    fontSize: 16,
    color: '#888',
  },
  mainStat: {
    flex: 1,
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    marginHorizontal: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  mainStatValue: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#2E2E2E',
    marginBottom: 5,
  },
  mainStatLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  additionalStats: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#6bc76b',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 20,
  },
  saveButton: {
    backgroundColor: '#6bc76b',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  graphContainer: {
    marginHorizontal: 20,
    marginVertical: 20,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  graphTitle: {
    ...typography.subtitle,
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  scrollViewContent: {
    paddingBottom: 100, // Add padding at the bottom to ensure button is visible
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingVertical: 15,
    borderBottomColor: '#eaeaea',
    borderBottomWidth: 1,
  },
  closeButton: {
    position: 'absolute',
    right: 15,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  closeButtonText: {
    fontSize: 24,
    color: '#333',
  },
});

export default RecordScreen;
