// src/pages/InventoryPage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate,Link } from 'react-router-dom';
import { getInventory,addPrice, updatePrice, deletePrice  } from '../api/client';
import PriceFormModal from '../components/PriceFormModal';
import DashboardLayout from '../components/DashboardLayout';

export default function InventoryPage() {
    const [inventory, setInventory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const navigate = useNavigate();

    const fetchInventory = async () => {
        try {
            setIsLoading(true);
            const response = await getInventory();
            setInventory(response.data);
        } catch (error) {
            console.error("Failed to fetch inventory", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchInventory();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('userToken');
        navigate('/login');
    };

     const openAddModel = () => {
    setEditingItem(null); // Ensure we are in "add" mode
    setIsModalOpen(true);
  };

  const openEditModel = (item) => {
    setEditingItem(item); // Set the item to be edited
    setIsModalOpen(true);
  };
  
  const handleSave = async (data) => {
    try {
      if (editingItem) {
        // Update existing item
        await updatePrice(editingItem.id, { price: data.price, stock_level: data.stock_level });
      } else {
        // Add new item
        await addPrice(data);
      }
      setIsModalOpen(false);
      fetchInventory(); // Refresh the list
    } catch (error) {
        console.error("Failed to save price", error);
        alert("Error: Could not save price.");
    }
  };

    const handleDelete = async (priceId) => {
        // Use a confirmation dialog to prevent accidental deletion
        if (window.confirm("Are you sure you want to delete this price entry? This cannot be undone.")) {
            try {
                await deletePrice(priceId);
                // After successful deletion, refresh the inventory list
                fetchInventory();
            } catch (error) {
                console.error("Failed to delete price", error);
                alert("Error: Could not delete the price entry. Please try again.");
            }
        }
    };

    if (isLoading) {
        return (
            <DashboardLayout onLogout={handleLogout}>
                <p>Loading inventory...</p>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800">Inventory</h2>
                <button onClick={openAddModel} className="bg-yellow-500 text-white font-bold px-4 py-2 rounded-md hover:bg-yellow-600 transition-colors">
                    + Add New Price
                </button>
            </div>

            <div className="bg-white shadow-md rounded-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price (₦)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Level</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {inventory.map((item) => (
                            <tr key={item.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{item.product.name}</div>
                                    <div className="text-sm text-gray-500">{item.product.category}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{item.price.toLocaleString()}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.stock_level > 2 ? 'bg-green-100 text-green-800' :
                                            item.stock_level > 1 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                        {item.stock_level > 2 ? 'High' : item.stock_level > 1 ? 'Medium' : 'Low'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</button>
                                    <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900">Delete</button>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => openEditModel(item)} className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</button>
                                    <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900">Delete</button>
                                    </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {inventory.length === 0 && <p className="text-center text-gray-500 py-8">Your inventory is empty. Click "Add New Price" to get started.</p>}
                <PriceFormModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                item={editingItem}
      />
            </div>
        </DashboardLayout>
    );
}