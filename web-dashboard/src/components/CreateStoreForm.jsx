// src/components/CreateStoreForm.jsx
import React, { useState, useEffect } from 'react';
import { getStates, getCities, getMarkets, createStore } from '../api/client';

export default function CreateStoreForm({ onStoreCreated }) {
    const [storeName, setStoreName] = useState('');
    const [states, setStates] = useState([]);
    const [cities, setCities] = useState([]);
    const [markets, setMarkets] = useState([]);
    const [selectedState, setSelectedState] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [selectedMarket, setSelectedMarket] = useState('');
    const [error, setError] = useState('');

    useEffect(() => { getStates().then(res => setStates(res.data)) }, []);

    useEffect(() => {
        if (selectedState) getCities(selectedState).then(res => setCities(res.data));
    }, [selectedState]);

    useEffect(() => {
        if (selectedCity) getMarkets(selectedCity).then(res => setMarkets(res.data));
    }, [selectedCity]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!storeName || !selectedMarket) {
            setError("All fields are required.");
            return;
        }
        try {
            await createStore({ name: storeName, market_area_id: parseInt(selectedMarket) });
            onStoreCreated(); // Tell the parent page to refresh the user profile
        } catch (err) {
            setError("Failed to create store. Please try again.");
            console.error(err);
        }
    };

   return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="p-8 bg-white rounded-lg shadow-lg w-full max-w-lg">
                <h2 className="text-3xl font-bold text-center mb-1">Welcome to Neighbor!</h2>
                <p className="text-center text-gray-500 mb-8">Let's set up your store.</p>
                {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="storeName" className="block text-gray-700 font-semibold mb-2">Store Name</label>
                        <input id="storeName" type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} required 
                               className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                    </div>
                    <div>
                        <label className="block text-gray-700 font-semibold mb-2">Location</label>
                        <select onChange={(e) => setSelectedState(e.target.value)} required className="w-full p-2 mb-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400">
                            <option value="">Select State</option>
                            {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <select onChange={(e) => setSelectedCity(e.target.value)} required className="w-full p-2 mb-2 border rounded-md bg-white" disabled={!cities.length}>
                            <option value="">Select City</option>
                            {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <select onChange={(e) => setSelectedMarket(e.target.value)} required 	className="w-full p-2 border rounded-md bg-white" disabled={!markets.length}>
                            <option value="">Select Market Area</option>
                            {markets.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                    </div>
                    <button type="submit" className="w-full bg-yellow-500 text-white p-3 rounded-lg hover:bg-yellow-600 font-bold transition-colors">
                        Create Store
                    </button>
                </form>
            </div>
        </div>
    );
}