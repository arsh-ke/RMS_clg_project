// ============================================
// SOUND NOTIFICATION FEATURE - CODE EXAMPLES
// ============================================

// ===========================================
// EXAMPLE 1: Basic Usage in a React Component
// ===========================================

import React, { useEffect } from 'react';
import { useNotificationSound } from '../hooks/useNotificationSound';

function MyKitchenComponent() {
  const { playSound, stopSound, isKitchenUser } = useNotificationSound({
    volume: 0.7,
    soundPath: '/notification.mp3',
  });

  const handleOrderReceived = async () => {
    if (isKitchenUser) {
      // Play sound notification
      await playSound();
    }
  };

  return (
    <button onClick={handleOrderReceived}>
      {isKitchenUser ? '🔔 Order Received' : '📵 Not Kitchen User'}
    </button>
  );
}

export default MyKitchenComponent;


// ===========================================
// EXAMPLE 2: Using Global Sound Manager
// ===========================================

import soundNotificationManager from '../utils/soundNotificationManager';

// Play a sound
async function notifyNewOrder() {
  try {
    await soundNotificationManager.playSound('new_order', '/notification.mp3');
  } catch (error) {
    console.error('Failed to play sound:', error);
  }
}

// Control volume programmatically
function setNotificationVolume(level) {
  soundNotificationManager.setVolume(level); // 0-1
}

// Toggle mute state
function toggleNotifications() {
  const isMuted = soundNotificationManager.toggleMute();
  console.log('Sound muted:', isMuted);
}

// Get current state
function checkNotificationSettings() {
  const isMuted = soundNotificationManager.getMuteState();
  const volume = soundNotificationManager.getVolume();
  console.log(`Muted: ${isMuted}, Volume: ${volume}`);
}


// ===========================================
// EXAMPLE 3: Socket.IO Integration
// ===========================================

import { useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import soundNotificationManager from '../utils/soundNotificationManager';

function OrderNotificationListener() {
  const { socket } = useSocket();
  const { user } = useAuth();

  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = async (data) => {
      console.log('New order received:', data.orderNumber);

      // Only notify kitchen staff
      if (user?.role === 'kitchen') {
        // Play sound
        await soundNotificationManager.playSound('new_order', '/notification.mp3');

        // Show visual notification
        // (handled by component highlight system)
      }
    };

    socket.on('new_order', handleNewOrder);

    return () => {
      socket.off('new_order', handleNewOrder);
    };
  }, [socket, user?.role]);

  return null; // No UI needed, just handles events
}

export default OrderNotificationListener;


// ===========================================
// EXAMPLE 4: Visual Highlights Component
// ===========================================

import React, { useState } from 'react';
import { NotificationHighlight, NotificationToast } from '../components/NotificationHighlight';
import { Card } from '../components/ui/card';

function OrderCard({ order }) {
  const [isNew, setIsNew] = useState(true);

  // Auto-clear highlight after 3 seconds
  React.useEffect(() => {
    if (isNew) {
      const timer = setTimeout(() => setIsNew(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isNew]);

  return (
    <>
      {/* Wrapped card with highlight effect */}
      <NotificationHighlight
        isActive={isNew}
        variant="border"  // Options: 'border', 'badge', 'glow'
        color="orange"    // Options: 'orange', 'blue', 'green', 'red'
      >
        <Card className="p-4">
          <h3>Order #{order.orderNumber}</h3>
          <p>Table {order.tableNumber}</p>
        </Card>
      </NotificationHighlight>

      {/* Toast notification */}
      <NotificationToast
        message={`New order #${order.orderNumber} received!`}
        show={isNew}
        duration={3000}
      />
    </>
  );
}

export default OrderCard;


// ===========================================
// EXAMPLE 5: Volume Control UI
// ===========================================

import React, { useState } from 'react';
import soundNotificationManager from '../utils/soundNotificationManager';

function NotificationSettings() {
  const [volume, setVolume] = useState(soundNotificationManager.getVolume());
  const [isMuted, setIsMuted] = useState(soundNotificationManager.getMuteState());

  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume);
    soundNotificationManager.setVolume(newVolume);
  };

  const handleToggleMute = () => {
    const muted = soundNotificationManager.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="space-y-4">
      <h2>Notification Settings</h2>

      {/* Volume slider */}
      <div>
        <label>Volume Level</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={volume}
          onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
        />
        <span>{Math.round(volume * 100)}%</span>
      </div>

      {/* Mute toggle */}
      <div>
        <button onClick={handleToggleMute}>
          {isMuted ? '🔇 Unmute Notifications' : '🔔 Mute Notifications'}
        </button>
      </div>

      {/* Test button */}
      <div>
        <button
          onClick={() => soundNotificationManager.playSound('test', '/notification.mp3')}
        >
          🔊 Test Sound
        </button>
      </div>
    </div>
  );
}

export default NotificationSettings;


// ===========================================
// EXAMPLE 6: Advanced - Multiple Sound Types
// ===========================================

import soundNotificationManager from '../utils/soundNotificationManager';

// Different sounds for different events
async function handleOrderEvent(eventType, data) {
  const soundMap = {
    'new_order': {
      id: 'order_received',
      path: '/sounds/order-received.mp3',
    },
    'order_ready': {
      id: 'order_ready',
      path: '/sounds/ready-beep.mp3',
    },
    'low_stock': {
      id: 'stock_alert',
      path: '/sounds/alert-warning.mp3',
    },
  };

  const sound = soundMap[eventType];
  if (sound) {
    await soundNotificationManager.playSound(sound.id, sound.path);
  }
}

// Usage
handleOrderEvent('new_order', { orderNumber: 'ORD-001' });
handleOrderEvent('order_ready', { orderId: '123' });
handleOrderEvent('low_stock', { items: ['Flour', 'Sugar'] });


// ===========================================
// EXAMPLE 7: Custom Hook - Notifications with Retry
// ===========================================

import { useCallback, useState } from 'react';
import soundNotificationManager from '../utils/soundNotificationManager';

function useNotificationWithRetry(maxRetries = 3) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(null);

  const playWithRetry = useCallback(
    async (soundId, soundPath) => {
      let lastError;
      setIsPlaying(true);
      setError(null);

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          await soundNotificationManager.playSound(soundId, soundPath);
          setIsPlaying(false);
          return true;
        } catch (err) {
          lastError = err;
          console.warn(`Attempt ${attempt}/${maxRetries} failed:`, err);
          
          // Wait before retry
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }

      setIsPlaying(false);
      setError(lastError);
      return false;
    },
    [maxRetries]
  );

  return {
    playWithRetry,
    isPlaying,
    error,
  };
}

// Usage in component
function OrderNotifier() {
  const { playWithRetry, error } = useNotificationWithRetry(3);

  const handleNewOrder = async () => {
    const success = await playWithRetry('new_order', '/notification.mp3');
    if (!success) {
      console.error('Failed to play notification:', error);
    }
  };

  return <button onClick={handleNewOrder}>New Order</button>;
}


// ===========================================
// EXAMPLE 8: Testing Sound Manager
// ===========================================

// Unit test example using Jest
describe('soundNotificationManager', () => {
  test('toggles mute state', () => {
    const manager = require('../utils/soundNotificationManager').default;

    const initialMute = manager.getMuteState();
    manager.toggleMute();
    const newMute = manager.getMuteState();

    expect(newMute).toBe(!initialMute);
  });

  test('sets volume level', () => {
    const manager = require('../utils/soundNotificationManager').default;

    manager.setVolume(0.5);
    expect(manager.getVolume()).toBe(0.5);

    manager.setVolume(1.5); // Clamps to 1
    expect(manager.getVolume()).toBe(1);

    manager.setVolume(-0.5); // Clamps to 0
    expect(manager.getVolume()).toBe(0);
  });

  test('persists settings in localStorage', () => {
    const manager = require('../utils/soundNotificationManager').default;

    manager.toggleMute();
    manager.setVolume(0.8);

    // Create new instance - should load saved values
    const manager2 = require('../utils/soundNotificationManager').default;
    expect(manager2.getMuteState()).toBe(manager.getMuteState());
    expect(manager2.getVolume()).toBe(0.8);
  });
});


// ===========================================
// EXAMPLE 9: Kitchen Display System Integration
// ===========================================

// In your KitchenDisplay.js component

import { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { NotificationHighlight } from '../components/NotificationHighlight';
import soundNotificationManager from '../utils/soundNotificationManager';

function KitchenDisplaySystem() {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [newOrderIds, setNewOrderIds] = useState(new Set());

  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = async (data) => {
      // Add to new orders set for highlighting
      setNewOrderIds(prev => new Set([...prev, data.id]));

      // Play sound for kitchen users
      if (user?.role === 'kitchen') {
        await soundNotificationManager.playSound('new_order', '/notification.mp3');
      }

      // Refresh orders
      fetchOrders();

      // Auto-clear highlight after 3 seconds
      setTimeout(() => {
        setNewOrderIds(prev => {
          const updated = new Set(prev);
          updated.delete(data.id);
          return updated;
        });
      }, 3000);
    };

    socket.on('new_order', handleNewOrder);
    return () => socket.off('new_order', handleNewOrder);
  }, [socket, user?.role]);

  return (
    <div className="space-y-4">
      {orders.map(order => (
        <NotificationHighlight
          key={order.id}
          isActive={newOrderIds.has(order.id)}
          variant="border"
        >
          <OrderCard order={order} />
        </NotificationHighlight>
      ))}
    </div>
  );
}

export default KitchenDisplaySystem;


// ===========================================
// EXAMPLE 10: Cleanup & Disposal
// ===========================================

import { useEffect } from 'react';
import soundNotificationManager from '../utils/soundNotificationManager';

function AppCleanup() {
  useEffect(() => {
    return () => {
      // Cleanup on app unmount
      soundNotificationManager.dispose();
    };
  }, []);

  return null;
}

export default AppCleanup;
