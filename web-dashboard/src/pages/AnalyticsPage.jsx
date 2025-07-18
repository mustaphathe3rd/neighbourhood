import React, { useEffect, useState } from 'react';
import { getAnalytics } from '../api/client';
import { Link } from 'react-router-dom';

const DashboardLayout = ({ children, onLogout }) => (
    <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow-sm">
            <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
                <h1 className="text-xl font-bold text-gray-800">Neighbor Dashboard</h1>
                <Link to="/dashboard/inventory" className="text-gray-600 font-semibold hover:text-yellow-500">Inventory</Link>
                <Link to="/dashboard/analytics" className="text-gray-600 font-semibold hover:text-yellow-500">Analytics</Link>
                <button onClick={onLogout} className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors">
                    Logout
                </button>
            </nav>
        </header>
        <main className="container mx-auto px-6 py-8">
            {children}
        </main>
    </div>
);


export default function AnalyticsPage() {
    const [analyticsData, setAnalyticsData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        getAnalytics().then(res => {
            setAnalyticsData(res.data);
            setIsLoading(false);
        }).catch(err => {
            console.error("Failed to fetch analytics", err);
            setIsLoading(false);
        });
    }, []);

    if (isLoading) return <DashboardLayout><p>Loading analytics...</p></DashboardLayout>;

    return (
        <DashboardLayout>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Product View Analytics</h2>
            <div className="bg-white shadow-md rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Total Views Per Product</h3>
                {analyticsData.length > 0 ? (
                    <ul className="divide-y divide-gray-200">
                        {analyticsData.map((item, index) => (
                            <li key={index} className="py-3 flex justify-between items-center">
                                <span className="text-gray-700">{item.product_name}</span>
                                <span className="font-bold text-gray-900">{item.view_count} views</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-500">No product views recorded yet.</p>
                )}
            </div>
        </DashboardLayout>
    );
}