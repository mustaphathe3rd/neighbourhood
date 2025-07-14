// app/login.tsx
import React, { useState, useContext } from 'react';
import { View, TextInput, StyleSheet, Text, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { AuthContext } from '../src/context/AuthContext';
import apiClient from '../src/api/client';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
        Alert.alert("Error", "Please enter both email and password.");
        return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', password);
      
      const response = await apiClient.post('/token', formData, {
         headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      if (response.data.access_token) {
        login(response.data.access_token);
        router.replace('/(tabs)'); 
      }
    } catch (error) {
      Alert.alert("Login Failed", "Incorrect email or password.");
      console.error('Login failed:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome back</Text>
      
      <Text style={styles.label}>Username or Email</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Link href="#" style={styles.forgotPasswordLink}>
        Forgot Password?
      </Link>

      {loading ? (
        <ActivityIndicator size="large" color="#FFC107" style={{marginTop: 20}} />
      ) : (
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>Log In</Text>
        </TouchableOpacity>
      )}
      
      <Link href="/register" style={styles.signUpLink}>
        Don't have an account? Sign up
      </Link>
    </View>
  );
};

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        paddingHorizontal: 24, 
        paddingTop: 100,
        backgroundColor: '#F8F5F2' 
    },
    title: { 
        fontSize: 32, 
        fontWeight: 'bold', 
        marginBottom: 40, 
        textAlign: 'center',
        color: '#1A1A1A'
    },
    label: { 
        fontSize: 16, 
        fontWeight: '600', 
        color: '#333', 
        marginBottom: 8 
    },
    input: {
        backgroundColor: '#FFF',
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderRadius: 8,
        fontSize: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#EAEAEA'
    },
    forgotPasswordLink: {
        textAlign: 'right',
        color: '#FFC107',
        fontSize: 14,
        marginBottom: 30
    },
    loginButton: {
        backgroundColor: '#FFC107',
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    loginButtonText: { 
        color: '#FFF', 
        fontSize: 16, 
        fontWeight: 'bold' 
    },
    signUpLink: { 
        textAlign: 'center', 
        marginTop: 20, 
        color: '#FFC107', 
        fontSize: 16,
        fontWeight: '600'
    },
});