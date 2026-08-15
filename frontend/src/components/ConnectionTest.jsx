// frontend/src/components/ConnectionTest.jsx
import React, { useState, useEffect } from 'react';
import { testConnection } from '../utils/api';
import { Wifi, WifiOff, Server } from 'lucide-react';

const ConnectionTest = () => {
  const [status, setStatus] = useState('checking');
  const [lastChecked, setLastChecked] = useState(null);

  const checkBackend = async () => {
  try {
    setStatus('checking');
    await testConnection();
    setStatus('connected');
    setLastChecked(new Date().toLocaleTimeString());
  } catch {
    setStatus('disconnected');
    setLastChecked(new Date().toLocaleTimeString());
  }
};


  useEffect(() => {
    checkBackend();
    // Check every 30 seconds
    const interval = setInterval(checkBackend, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 ${
        status === 'connected' ? 'bg-green-100 text-green-800' :
        status === 'disconnected' ? 'bg-red-100 text-red-800' :
        'bg-yellow-100 text-yellow-800'
      }`}>
        <Server className="w-4 h-4" />
        {status === 'connected' ? (
          <Wifi className="w-4 h-4" />
        ) : (
          <WifiOff className="w-4 h-4" />
        )}
        <span className="text-sm font-medium">
          Backend: {status === 'connected' ? 'Connected' : status === 'disconnected' ? 'Disconnected' : 'Checking...'}
        </span>
        {lastChecked && (
          <span className="text-xs opacity-75 ml-2">
            Last checked: {lastChecked}
          </span>
        )}
      </div>
    </div>
  );
};

export default ConnectionTest;