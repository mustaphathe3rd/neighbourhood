import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: 'home' },
    { name: 'Inventory', path: '/dashboard/inventory', icon: 'list' },
    { name: 'Analytics', path: '/dashboard/analytics', icon: 'analytics' },
];

export default function DashboardLayout({ children }) {
    const location = useLocation();
    const navigate = useNavigate();
    const handleLogout = () => {
        localStorage.removeItem('userToken');
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <div className="w-64 bg-white shadow-md">
                <div className="p-6">
                    <h1 className="text-2xl font-bold text-yellow-500">Neighbor</h1>
                    <p className="text-sm text-gray-500">Store Dashboard</p>
                </div>
                <nav className="mt-6">
                    {navLinks.map(link => (
                        <Link key={link.name} to={link.path} className={`block px-6 py-3 text-gray-700 font-semibold hover:bg-gray-200 ${location.pathname === link.path ? 'bg-gray-200 border-r-4 border-yellow-500' : ''}`}>
                            {link.name}
                        </Link>
                    ))}
                </nav>
                 <div className="absolute bottom-0 w-full p-6">
                    <button onClick={handleLogout} className="w-full text-left text-red-500 font-semibold">Logout</button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
                    <div className="container mx-auto px-6 py-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}