// app/register.tsx
import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Text, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import apiClient from '@/src/api/client';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RegisterScreen() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [agree, setAgree] = useState(false);
    const router = useRouter();

    const handleRegister = async () => {
        if (!agree) {
            Alert.alert("Terms & Conditions", "You must agree to the Terms and Conditions to continue.");
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert("Password Error", "Passwords do not match.");
            return;
        }
        try {
            // Include the new 'name' field in the request
            await apiClient.post('/register', { name, email, password, role: 'consumer' });
            Alert.alert("Success!", "Your account has been created. Please log in.");
            router.replace('/login');
        } catch (error) {
            console.error("Registration failed:", error.response?.data || error.message);
            Alert.alert("Registration Error", "Could not create your account at this time.");
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.title}>Create Account</Text>

                <Text style={styles.label}>Name</Text>
                <TextInput style={styles.input} placeholder="Enter your name" value={name} onChangeText={setName} />

                <Text style={styles.label}>Email</Text>
                <TextInput style={styles.input} placeholder="Enter your email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                
                <Text style={styles.label}>Password</Text>
                <TextInput style={styles.input} placeholder="Enter your password" value={password} onChangeText={setPassword} secureTextEntry />

                <Text style={styles.label}>Confirm Password</Text>
                <TextInput style={styles.input} placeholder="Confirm your password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />

                <TouchableOpacity style={styles.termsContainer} onPress={() => setAgree(!agree)} activeOpacity={0.7}>
                    <View style={[styles.checkbox, agree && styles.checkboxChecked]}>
                        {agree && <Ionicons name="checkmark" size={14} color="#fff" />}
                    </View>
                    <Text style={styles.termsText}>I agree to the Terms and Conditions</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
                    <Text style={styles.registerButtonText}>Register</Text>
                </TouchableOpacity>
                
                <View style={styles.signInContainer}>
                    <Link href="/login">
                        <Text style={styles.signInText}>Already have an account? <Text style={styles.signInLink}>Sign in</Text></Text>
                    </Link>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F8F5F2' },
    container: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 20 },
    title: { fontSize: 28, fontWeight: 'bold', marginBottom: 40, textAlign: 'center', color: '#1A1A1A' },
    label: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 8 },
    input: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderRadius: 8,
        fontSize: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#EAEAEA'
    },
    termsContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: '#FFC107',
        marginRight: 10,
        justifyContent: 'center',
        alignItems: 'center'
    },
    checkboxChecked: { backgroundColor: '#FFC107' },
    termsText: { fontSize: 14, color: '#666' },
    registerButton: {
        backgroundColor: '#FFC107',
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    registerButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
    signInContainer: { alignItems: 'center', marginTop: 24 },
    signInText: { textAlign: 'center', color: '#666', fontSize: 14 },
    signInLink: { color: '#FFC107', fontWeight: 'bold' },
});