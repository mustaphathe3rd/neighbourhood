import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { LocationContext } from '@/src/context/LocationContext';
import apiClient from '@/src/api/client';
import { router } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View, Button } from 'react-native';

type State = { id: number; name: string; }
type City = { id: number; name: string; }

export default function LocationSelectScreen() {
    const [step, setStep] = useState<'state' | 'city'>('state');
    const [states, setStates] = useState<State[]>([]);
    const [cities, setCities] = useState<City[]>([]);
    const [selectedState, setSelectedState] = useState<State | null>(null);
    const { setActiveLocation } = useContext(LocationContext);

    // Fetch all states when the component mounts
    useEffect(() => {
        apiClient.get('/locations/states').then(response => setStates(response.data));
    }, []);

    // When a state is selected, fetch its cities
    const handleSelectState = async (state: State) => {
        setSelectedState(state);
        try {
            const response = await apiClient.get(`/locations/cities/${state.id}`);
            setCities(response.data);
            setStep('city'); // Move to the next step
        } catch (error) {
            console.error("Failed to fetch cities", error);
        }
    }

    // When a city is selected, update the global context and go back
    const handleSelectCity = (city: City) => {
        setActiveLocation({ type: 'manual', cityId: city.id, cityName: city.name });
        router.back();
    }

    return (
        <ThemedView style={styles.container}>
            {step === 'state' && (
                <>
                    <ThemedText type="title">Select Your State</ThemedText>
                    <FlatList
                        data={states}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={styles.itemCard} onPress={() => handleSelectState(item)}>
                                <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
                            </TouchableOpacity>
                        )}
                    />
                </>
            )}
            {step === 'city' && selectedState && (
                <>
                    <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 20}}>
                        <Button title="< Back to States" onPress={() => setStep('state')} />
                        <ThemedText type="title" style={{marginLeft: 10}}>Select City</ThemedText>
                    </View>
                    <FlatList
                        data={cities}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={styles.itemCard} onPress={() => handleSelectCity(item)}>
                                <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
                            </TouchableOpacity>
                        )}
                    />
                </>
            )}
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, paddingTop: 60 },
    itemCard: {
        backgroundColor: '#1C1C1E',
        padding: 20,
        borderRadius: 8,
        marginBottom: 12,
    }
});