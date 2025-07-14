import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('userToken');
  if (!token) {
    // If no token, redirect to the login page
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default ProtectedRoute;