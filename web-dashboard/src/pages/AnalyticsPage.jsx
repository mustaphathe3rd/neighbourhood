import React, { useEffect, useState } from 'react';
import { getAnalytics } from '../api/client';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';

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
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Analytics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Placeholder for Stat Cards from dashboard3.png */}
            </div>
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