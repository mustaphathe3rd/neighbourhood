// src/pages/RegisterPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../api/client';

export default function RegisterPage() {
    const [name, setName] = useState(''); // <-- ADD THIS STATE
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const location = useLocation();

    // Check if there's a success message from a previous action
    const successMessage = location.state?.message;

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        if (password.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }
        try {
            // --- THIS IS THE FIX ---
            // Include the 'name' field in the payload
            await apiClient.post('/register', {
                name,
                email,
                password,
                role: 'store_owner'
            });
            navigate('/login', { state: { message: 'Registration successful! Please log in.' } });
        } catch (err) {
            setError(err.response?.data?.detail || "Registration failed.");
            console.error("Registration Failed:", err);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="p-8 bg-white rounded-lg shadow-lg w-full max-w-md">
                <h2 className="text-3xl font-bold text-center mb-1 text-gray-900">Create a Store Account</h2>
                <p className="text-center text-gray-500 mb-8">Join the Neighbor network</p>
                {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                <form onSubmit={handleRegister} className="space-y-6">
                    <div>
                        <label className="block text-gray-700 font-semibold mb-2" htmlFor="name">Full Name</label>
                        <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required 
                               className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                    </div>
                    <div>
                        <label className="block text-gray-700 font-semibold mb-2" htmlFor="email">Email</label>
                        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required 
                               className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                    </div>
                    <div>
                        <label className="block text-gray-700 font-semibold mb-2" htmlFor="password">Password</label>
                        <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required 
                               className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                    </div>
                    <button type="submit" className="w-full bg-yellow-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-yellow-600 transition-colors">
                        Register
                    </button>
                </form>
                <p className="text-center text-sm text-gray-600 mt-6">
                    Already have an account? <Link to="/login" className="text-yellow-500 font-bold hover:underline">Login</Link>
                </p>
            </div>
        </div>
    );
}