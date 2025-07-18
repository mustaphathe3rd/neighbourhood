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
            <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-sm">
                <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Create Store Account</h2>
                {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                {successMessage && <p className="text-green-500 text-center mb-4">{successMessage}</p>}
                <form onSubmit={handleRegister} className="space-y-4">
                    {/* --- ADD THIS NEW INPUT FIELD --- */}
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">Full Name</label>
                        <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full p-2 border rounded shadow-sm" />
                    </div>
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">Email</label>
                        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full p-2 border rounded shadow-sm" />
                    </div>
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">Password</label>
                        <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full p-2 border rounded shadow-sm" />
                    </div>
                    <button type="submit" className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700 transition-colors font-bold">Register</button>
                </form>
                <p className="text-center text-sm text-gray-600 mt-4">
                    Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Login</Link>
                </p>
            </div>
        </div>
    );
}