import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { soundNotificationManager } from '../utils/soundNotificationManager';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (user) {
      const SOCKET_URL = process.env.REACT_APP_BACKEND_URL;
      const newSocket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        autoConnect: true,
      });

      newSocket.on('connect', () => {
        setIsConnected(true);
        newSocket.emit('register', { userId: user.id, role: user.role });
      });

      newSocket.on('disconnect', () => {
        setIsConnected(false);
      });

      newSocket.on('new_order', (data) => {
        // Play sound notification only for kitchen role users
        if (user?.role === 'kitchen') {
          soundNotificationManager.playSound('new_order_notification', '/notification.mp3').catch((error) => {
            console.error('Failed to play order notification sound:', error);
          });
        }

        toast.info('New Order', {
          description: `Order ${data.orderNumber} received - ${data.tableNumber ? `Table ${data.tableNumber}` : 'Takeaway'}`,
        });
        setNotifications((prev) => [
          { type: 'order_new', data, timestamp: new Date() },
          ...prev.slice(0, 49),
        ]);
      });

      newSocket.on('order_update', (data) => {
        const statusColors = {
          preparing: '#3b82f6',
          ready: '#22c55e',
          served: '#a855f7',
          completed: '#6b7280',
          cancelled: '#ef4444',
        };
        toast(`Order ${data.orderNumber}`, {
          description: `Status: ${data.status.toUpperCase()}`,
          style: { borderLeft: `4px solid ${statusColors[data.status] || '#f97316'}` },
        });
        setNotifications((prev) => [
          { type: 'order_update', data, timestamp: new Date() },
          ...prev.slice(0, 49),
        ]);
      });

      newSocket.on('low_stock_alert', (data) => {
        toast.warning('Low Stock Alert', {
          description: `${data.items?.length || 0} items running low`,
        });
      });

      newSocket.on('payment_received', (data) => {
        toast.success('Payment Received', {
          description: `Order ${data.order?.orderNumber}`,
        });
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [user]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const value = {
    socket,
    isConnected,
    notifications,
    clearNotifications,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
