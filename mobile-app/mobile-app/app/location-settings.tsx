import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LocationContext } from '@/src/context/LocationContext';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import apiClient from '@/src/api/client';

const distanceTips = [
    "5km is like driving from Rumuokoro to Garrison in Port Harcourt.",
    "10km is roughly the distance from Wuse Market to the Airport Road in Abuja.",
     "1km is like the distance from CMS to Tafawa Balewa Square in Lagos."
];

export default function LocationSettingsScreen() {
  const { activeLocation, setActiveLocation, radius, setRadius, fetchInitialLocation } = useContext(LocationContext);
  const [maxRadius, setMaxRadius] = useState(100);
  const [currentTip, setCurrentTip] = useState('')

  const isGpsEnabled = activeLocation?.type === 'gps';
  const isLeavingState = isGpsEnabled && radius > maxRadius;

  useEffect(() => {
    setCurrentTip(distanceTips[Math.floor(Math.random() * distanceTips.length)]);
    if (activeLocation?.type === 'gps' && activeLocation.coords) {
      apiClient.get('/locations/state-info', {
        params: {
          lat: activeLocation.coords.latitude,
          lon: activeLocation.coords.longitude
        }
      }).then(response => {
        setMaxRadius(response.data.max_safe_radius_km);
      }).catch(err => console.error("Failed to fetch state info"));
    }
  }, [activeLocation]);

  const handleToggleGps = (value: boolean) => {
    if (value) {
      fetchInitialLocation();
    } else {
      setActiveLocation(null);
    }
  };

  // --- THIS IS THE FIX ---
  // Determine the display name for the current manual location
  let manualLocationDisplay = "Select a location";
  if (activeLocation?.type === 'manual') {
    manualLocationDisplay = activeLocation.cityName;
  }
  
  return (
    <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Location Settings</Text>
        
        <View style={styles.row}>
            <Ionicons name="location-outline" size={24} color="#333" />
            <Text style={styles.rowText}>Use Current Location</Text>
            <Switch
              trackColor={{ false: "#EAEAEA", true: "#FFC107" }}
              thumbColor={"#FFFFFF"}
              onValueChange={handleToggleGps}
              value={isGpsEnabled}
            />
        </View>

        <TouchableOpacity 
            style={[styles.row, isGpsEnabled && styles.disabledRow]} 
            onPress={() => router.push('/location-select')}
            disabled={isGpsEnabled}
        >
           <Ionicons name="map-outline" size={24} color={isGpsEnabled ? '#ccc' : '#333'} />
          <View style={styles.rowTextContainer}>
              <Text style={[styles.rowText, isGpsEnabled && styles.disabledText]}>Search from Other Locations</Text>
              {/* Display the selected manual location here */}
              {!isGpsEnabled && <Text style={styles.subtleText}>Currently: {manualLocationDisplay}</Text>}
          </View>
        </TouchableOpacity>

        <View style={styles.sliderContainer}>
            <Text style={[styles.label, !isGpsEnabled && styles.disabledText]}>Search Radius</Text>
            <Text style={[styles.radiusValue, !isGpsEnabled && styles.disabledText]}>{Math.round(radius)}km</Text>
        </View>
        <Slider
            disabled={!isGpsEnabled}
            style={{ width: '100%', height: 40 }}
            minimumValue={1}
            maximumValue={100}
            step={1}
            value={radius}
            onValueChange={setRadius}
            minimumTrackTintColor={isGpsEnabled ? "#FFC107" : "#ccc"}
            maximumTrackTintColor="#EAEAEA"
            thumbTintColor={isGpsEnabled ? "#FFC107" : "#ccc"}
        />
        {isLeavingState && (
            <View style={styles.warningContainer}>
                <Ionicons name="warning-outline" size={16} color="#FF9F0A" />
                <Text style={styles.warningText}>This radius may include results from another state.</Text>
            </View>
        )}
        
        <View style={styles.tipCard}>
            <Text style={styles.tipTitle}>Distance Tip</Text>
            <Text style={styles.tipBody}>{currentTip}</Text>
        </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 24, backgroundColor: '#F8F5F2' },
    title: { textAlign: 'center', fontSize: 20, fontWeight: 'bold', marginBottom: 30 },
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#EAEAEA' },
    rowTextContainer: { flex: 1, marginLeft: 15 },
    rowText: { fontSize: 16, color: '#1A1A1A' },
    sliderContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 },
    label: { fontSize: 16, color: '#666' },
    radiusValue: { fontSize: 16, fontWeight: 'bold' },
    disabledRow: { backgroundColor: '#F0F0F0' },
    disabledText: { color: '#ccc' },
    subtleText: { fontSize: 12, color: 'gray', marginTop: 2 },
    warningContainer: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 8,
        borderRadius: 8, backgroundColor: 'rgba(255, 159, 10, 0.1)', marginTop: 4,
    },
    warningText: { color: '#FF9F0A', fontSize: 12, marginLeft: 6 },
    tipCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginTop: 'auto', borderWidth: 1, borderColor: '#EAEAEA' },
    tipTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
    tipBody: { fontSize: 14, color: '#666' },
});