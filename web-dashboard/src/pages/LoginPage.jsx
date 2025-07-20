import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', password);

      const response = await apiClient.post('/token', formData);

      if (response.data.access_token) {
        localStorage.setItem('userToken', response.data.access_token);
        navigate('/dashboard'); // Redirect on success
      }
    } catch (err) {
      setError('Invalid email or password.');
      console.error("Login Failed:", err);
    }
  };

   return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="p-8 bg-white rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold text-center mb-1 text-gray-900">Welcome Back!</h2>
        <p className="text-center text-gray-500 mb-8">Login to your Store Dashboard</p>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-gray-700 font-semibold mb-2" htmlFor="email">Email Address</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required 
                   className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400" />
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-2" htmlFor="password">Password</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required 
                   className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400" />
          </div>
          <button type="submit" className="w-full bg-yellow-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-yellow-600 transition-colors">
            Login
          </button>
        </form>
        <p className="text-center text-sm text-gray-600 mt-6">
          Need an account? <Link to="/register" className="text-yellow-500 font-bold hover:underline">Register here</Link>
        </p>
      </div>
    </div>
  );
}