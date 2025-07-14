import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function DashboardPage() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow">
            <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
                <h1 className="text-xl font-bold text-gray-800">Neighbor Dashboard</h1>
                <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">Logout</button>
            </nav>
        </header>
        <main className="container mx-auto px-6 py-8">
            <h2 className="text-3xl font-bold text-gray-800">Welcome, Store Owner!</h2>
            <p className="mt-2 text-gray-600">This is where your inventory and analytics will go.</p>
        </main>
    </div>
  );
}