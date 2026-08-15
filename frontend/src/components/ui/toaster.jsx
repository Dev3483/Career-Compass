// src/components/ui/toaster.jsx
import React from "react";
import { Toaster as HotToaster } from "react-hot-toast";

export const Toaster = () => {
  return (
    <HotToaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#fff',
          color: '#374151',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
          padding: '12px 16px',
          fontSize: '14px',
          maxWidth: '500px',
        },
        success: {
          style: {
            border: '1px solid #10b981',
            background: '#f0fdf4',
          },
          iconTheme: {
            primary: '#10b981',
            secondary: '#fff',
          },
        },
        error: {
          style: {
            border: '1px solid #ef4444',
            background: '#fef2f2',
          },
          iconTheme: {
            primary: '#ef4444',
            secondary: '#fff',
          },
        },
        loading: {
          style: {
            border: '1px solid #f59e0b',
            background: '#fffbeb',
          },
        },
      }}
    />
  );
};