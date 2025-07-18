import React, { useState, useEffect } from 'react';
import { getAllProducts } from '../api/client';

export default function PriceFormModal({ isOpen, onClose, onSave, item }) {
  const [allProducts, setAllProducts] = useState([]);
  const [productId, setProductId] = useState('');
  const [price, setPrice] = useState('');
  const [stockLevel, setStockLevel] = useState(2);

  // When the modal opens for editing, pre-fill the form
  useEffect(() => {
    if (item) {
      setProductId(item.product.id);
      setPrice(item.price);
      setStockLevel(item.stock_level);
    } else {
      // Reset form when opening for a new item
      setProductId('');
      setPrice('');
      setStockLevel(2);
    }
  }, [item]);

  // Fetch the global list of products when the modal opens
  useEffect(() => {
    if (isOpen) {
      getAllProducts().then(res => setAllProducts(res.data));
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      product_id: parseInt(productId),
      price: parseFloat(price),
      stock_level: parseInt(stockLevel)
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">{item ? 'Edit Price' : 'Add New Price'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">Product</label>
            <select value={productId} onChange={(e) => setProductId(e.target.value)} required disabled={!!item} className="w-full p-2 border rounded bg-white disabled:bg-gray-200">
              <option value="">Select a Product</option>
              {allProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">Price (₦)</label>
            <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required className="w-full p-2 border rounded" />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">Stock Level</label>
            <select value={stockLevel} onChange={(e) => setStockLevel(e.target.value)} required className="w-full p-2 border rounded bg-white">
              <option value={1}>Low</option>
              <option value={2}>Medium</option>
              <option value={3}>High</option>
            </select>
          </div>
          <div className="flex justify-end gap-4 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-yellow-500 text-white font-bold rounded">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}