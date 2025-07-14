// app/location-settings.tsx
import React, { useContext } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LocationContext } from '@/src/context/LocationContext';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function LocationSettingsScreen() {
  const { activeLocation, setActiveLocation, radius, setRadius, fetchInitialLocation } = useContext(LocationContext);
  const isGpsEnabled = activeLocation?.type === 'gps';

  const handleToggleGps = (value:boolean) => {
    if (value) {
      // If turning GPS on, re-trigger the GPS fetch but don't navigate
      fetchInitialLocation();
    } else {
      // If turning GPS OFF, just clear the active location
      // This will stop the app from using GPS but won't navigate anywhere.
      setActiveLocation(null);
    }
  };
  
  // Determine the display name for the current manual location
  let manualLocationDisplay = "Select a location";
  if (activeLocation?.type === 'manual') {
    manualLocationDisplay = activeLocation.cityName;
  }

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#F8F5F2'}}>
      <View style={styles.container}>
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

        {/* The "Other Locations" button is now separate and always visible */}
        <TouchableOpacity 
          style={[styles.row, isGpsEnabled && styles.disabledRow]} 
          onPress={() => !isGpsEnabled && router.push('/location-select')}
          disabled={isGpsEnabled}
        >
           <Ionicons name="map-outline" size={24} color={isGpsEnabled ? "#ccc" : "#333"} />
          <View style={styles.rowTextContainer}>
              <Text style={[styles.rowText, isGpsEnabled && styles.disabledText]}>Search from Other Locations</Text>
              {activeLocation?.type === 'manual' && <Text style={[styles.subtleText, isGpsEnabled && styles.disabledText]}>Currently: {activeLocation.cityName}</Text>}
          </View>
        </TouchableOpacity>

        {/* The radius slider is only active when using GPS */}
        <View style={styles.sliderContainer}>
          <Text style={[styles.label, !isGpsEnabled && styles.disabledText]}>Search Radius</Text>
          <Text style={[styles.radiusValue, !isGpsEnabled && styles.disabledText]}>{Math.round(radius)}km</Text>
        </View>
        <Slider
          disabled={!isGpsEnabled} // Disable slider if not using GPS
          style={{ width: '100%', height: 40 }}
          minimumValue={1}
          maximumValue={100}
          step={1}
          value={radius}
          onSlidingComplete={(value) => setRadius(value)}
          minimumTrackTintColor={isGpsEnabled ? "#FFC107" : "#ccc"}
          maximumTrackTintColor="#EAEAEA"
          thumbTintColor={isGpsEnabled ? "#FFC107" : "#ccc"}
        />
        
        <View style={styles.tipCard}>
        <Text style={styles.tipTitle}>Distance Tip</Text>
        <Text style={styles.tipBody}>1km is like the distance from Urratta 		Junction to World Bank.</Text>
        <TouchableOpacity style={styles.dismissButton}>
          <Text style={styles.dismissText}>Dismiss</Text>
        </TouchableOpacity>
      </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 24, backgroundColor: '#F8F5F2' },
    title: { textAlign: 'center', fontSize: 20, fontWeight: 'bold', marginBottom: 30 },
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#EAEAEA' },
    rowText: { fontSize: 16, color: '#1A1A1A', marginLeft: 15 },
    rowTextContainer: { 
        flex: 1, 
        marginLeft: 15,
        flexDirection: 'column',
        justifyContent: 'center'
    },
    sliderContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 },
    label: { fontSize: 16, color: '#666' },
    radiusValue: { fontSize: 16, fontWeight: 'bold' },
    warningText: { color: 'orange', fontSize: 12, textAlign: 'center', marginTop: 5 },
    tipCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginTop: 'auto', marginBottom: 20, borderWidth: 1, borderColor: '#EAEAEA' },
    tipTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
    tipBody: { fontSize: 14, color: '#666', marginBottom: 16 },
    dismissButton: { backgroundColor: '#FFC107', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
    dismissText: { color: '#FFF', fontWeight: 'bold' },
    disabledRow: {
        backgroundColor: '#f9f9f9',
    },
    disabledText: {
        color: '#ccc',
    },
    subtleText: {
        fontSize: 12,
        color: 'gray',
        marginTop: 2,
    }
});