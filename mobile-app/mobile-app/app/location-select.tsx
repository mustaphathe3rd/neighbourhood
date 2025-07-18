import { ThemedText } from '@/components/ThemedText';
import { LocationContext } from '@/src/context/LocationContext';
import apiClient from '@/src/api/client';
import { router, Stack } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

type State = { id: number; name: string; }
type City = { id: number; name: string; }

export default function LocationSelectScreen() {
    const [step, setStep] = useState<'state' | 'city'>('state');
    const [states, setStates] = useState<State[]>([]);
    const [cities, setCities] = useState<City[]>([]);
    const [selectedState, setSelectedState] = useState<State | null>(null);
    const { setActiveLocation } = useContext(LocationContext);

    useEffect(() => {
        apiClient.get('/locations/states').then(response => setStates(response.data));
    }, []);

    const handleSelectState = async (state: State) => {
        setSelectedState(state);
        try {
            const response = await apiClient.get(`/locations/cities/${state.id}`);
            setCities(response.data);
            setStep('city');
        } catch (error) {
            console.error("Failed to fetch cities", error);
        }
    }

    const handleSelectCity = (city: City) => {
        setActiveLocation({ type: 'manual', cityId: city.id, cityName: city.name });
        router.back();
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <Stack.Screen options={{ title: 'Select Location' }} />
            <View style={styles.container}>
                {step === 'state' && (
                    <>
                        <Text style={styles.title}>Select Your State</Text>
                        <FlatList
                            data={states}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.itemCard} onPress={() => handleSelectState(item)}>
                                    <Text style={styles.itemText}>{item.name}</Text>
                                    <Ionicons name="chevron-forward" size={20} color="#AEAEB2" />
                                </TouchableOpacity>
                            )}
                        />
                    </>
                )}
                {step === 'city' && selectedState && (
                    <>
                        <TouchableOpacity style={styles.backButton} onPress={() => setStep('state')}>
                            <Ionicons name="arrow-back" size={24} color="#333" />
                            <Text style={styles.backButtonText}>Back to States</Text>
                        </TouchableOpacity>
                        <Text style={styles.title}>Select City in {selectedState.name}</Text>
                        <FlatList
                            data={cities}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.itemCard} onPress={() => handleSelectCity(item)}>
                                    <Text style={styles.itemText}>{item.name}</Text>
                                    <Ionicons name="chevron-forward" size={20} color="#AEAEB2" />
                                </TouchableOpacity>
                            )}
                        />
                    </>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F8F5F2' },
    container: { flex: 1, padding: 16 },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1A1A1A',
        marginBottom: 20,
        textAlign: 'center'
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    backButtonText: {
        fontSize: 16,
        color: '#1A1A1A',
        marginLeft: 8,
        fontWeight: '500'
    },
    itemCard: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderRadius: 12,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#EAEAEA'
    },
    itemText: {
        fontSize: 17,
        fontWeight: '600',
    }
});