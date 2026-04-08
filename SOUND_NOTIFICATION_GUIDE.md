# Real-Time Sound Notification Feature - Implementation Guide

## Overview

A comprehensive real-time sound notification system for your React + Socket.IO kitchen dashboard that plays alerts and shows visual highlights when new orders arrive, with role-based access control.

## Features Implemented

✅ **Sound Notifications**
- Plays notification sound only for kitchen role users
- Automatic fallback to Web Audio API if audio file fails
- Prevents overlapping/duplicate sounds
- Configurable volume and mute state
- Persists user mute preference in localStorage

✅ **Visual Highlights**
- Animated glow effect on new orders
- Bell icon animation
- Pulsing border highlight
- Toast notification at top of screen
- 3-second auto-clear of highlights

✅ **User Controls**
- Mute/Unmute button in kitchen dashboard header
- Volume control ready for extension
- Toast feedback on state changes

✅ **Performance & Best Practices**
- Audio instance reuse (no memory leaks)
- Error handling with graceful degradation
- Role-based access control at multiple levels
- Responsive and accessible UI

## Architecture

```
soundNotificationManager.js (Utility)
    ↓
KitchenDisplay.js (Component)
    ├→ useNotificationSound.js (Hook)
    ├→ NotificationHighlight.jsx (UI Components)
    └→ SocketContext.js (Event Handling)
```

## Files Added/Modified

### New Files

#### 1. **[src/utils/soundNotificationManager.js](../src/utils/soundNotificationManager.js)**
Central singleton manager for all sound notifications.

**Key Methods:**
- `playSound(soundId, soundPath)` - Play a sound with checks
- `stopSound(soundId)` - Stop specific sound
- `stopAllSounds()` - Stop all sounds
- `toggleMute()` - Toggle mute state
- `setVolume(0-1)` - Set volume level
- `playFallbackSound()` - Web Audio API fallback

**Features:**
- Prevents overlapping sounds
- Persists mute state and volume in localStorage
- Web Audio API fallback for audio file failures
- Audio instance pooling

#### 2. **[src/hooks/useNotificationSound.js](../src/hooks/useNotificationSound.js)**
React hook for managing notification sounds in components.

**Returns:**
```javascript
{
  playSound: async () => void,
  stopSound: () => void,
  setVolume: (number) => void,
  isPlaying: ref,
  isKitchenUser: boolean,
}
```

**Features:**
- Role-based playback (kitchen only by default)
- Automatic audio initialization
- Error handling with Web Audio fallback
- Configurable options (volume, sound path, allowed roles)

#### 3. **[src/components/NotificationHighlight.jsx](../src/components/NotificationHighlight.jsx)**
React components for visual notification effects.

**Components:**
- `<NotificationHighlight>` - Animated highlight wrapper with variants:
  - `badge` - Pulsing badge effect
  - `border` - Glowing border effect
  - `glow` - Opacity pulse effect
  
- `<NotificationToast>` - Toast notification that appears at top

**Variants:**
```javascript
<NotificationHighlight
  isActive={true}
  variant="border"    // or "badge" | "glow"
  color="orange"      // orange | blue | green | red
>
  {children}
</NotificationHighlight>
```

### Modified Files

#### **[src/context/SocketContext.js](../src/context/SocketContext.js)**
Added sound notification on 'new_order' event.

```javascript
// Import
import { soundNotificationManager } from '../utils/soundNotificationManager';

// In 'new_order' socket handler
if (user?.role === 'kitchen') {
  soundNotificationManager.playSound('new_order_notification', '/notification.mp3');
}
```

#### **[src/pages/KitchenDisplay.js](../src/pages/KitchenDisplay.js)**
Enhanced with visual highlights and sound control UI.

**Changes:**
- Tracks new order IDs in state for 3-second visual highlight
- Shows/hides notification toast
- Adds mute/unmute button to header
- Wraps new orders with visual highlight component
- Auto-clears highlights after 3 seconds

## Usage

### For Kitchen Users

The notification system works automatically:

1. **When a new order arrives:**
   - 🔔 Sound plays (if enabled and user has kitchen role)
   - Visual highlight and animation appears on the order card
   - Toast notification shows at the top
   - Bell icon animates next to order number

2. **To mute/unmute sounds:**
   - Click the Volume icon button in the header
   - State persists across sessions

### For Developers

#### Basic Implementation in Components

```javascript
import { useNotificationSound } from '../hooks/useNotificationSound';

function MyComponent() {
  const { playSound, stopSound, setVolume, isKitchenUser } = useNotificationSound({
    volume: 0.7,
    soundPath: '/custom-sound.mp3',
    allowedRoles: ['kitchen'],
  });

  const handleNewOrder = async () => {
    if (isKitchenUser) {
      await playSound();
    }
  };

  return <button onClick={handleNewOrder}>Trigger Notification</button>;
}
```

#### Using the Global Manager

```javascript
import soundNotificationManager from '../utils/soundNotificationManager';

// Play sound
await soundNotificationManager.playSound('new_order', '/notification.mp3');

// Control volume
soundNotificationManager.setVolume(0.5);

// Toggle mute
soundNotificationManager.toggleMute();
```

#### Using Visual Components

```javascript
import { NotificationHighlight, NotificationToast } from '../components/NotificationHighlight';

function OrderCard({ order, isNew }) {
  return (
    <>
      <NotificationHighlight isActive={isNew} variant="border" color="orange">
        <Card>{/* Order details */}</Card>
      </NotificationHighlight>

      <NotificationToast
        message="New order received!"
        show={isNew}
        duration={3000}
      />
    </>
  );
}
```

## Role-Based Access Control

Sound notifications only play for users with the `kitchen` role:

1. **Socket Context Level:**
   ```javascript
   if (user?.role === 'kitchen') {
     soundNotificationManager.playSound(...);
   }
   ```

2. **Hook Level:**
   ```javascript
   const { isKitchenUser } = useNotificationSound({
     allowedRoles: ['kitchen'],
   });
   ```

3. **Manager Level:**
   - No role check at manager level (abstraction layer)
   - Designed to be called only when appropriate

## Persistence & Configuration

### localStorage Keys
- `soundNotificationsMuted` - Boolean mute state
- `soundNotificationsVolume` - Volume level (0-1)

### Configuration Options

**useNotificationSound hook:**
```javascript
{
  volume: 0.7,              // 0-1
  soundPath: '/notification.mp3',
  allowedRoles: ['kitchen'],
}
```

**soundNotificationManager:**
- Singleton pattern - one instance across app
- Auto-loads saved mute state and volume on initialization

## Browser Compatibility

✅ **Desktop Browsers:**
- Chrome/Chromium
- Firefox
- Safari
- Edge

✅ **Fallbacks:**
- Web Audio API for audio file failures
- Graceful degradation if audio not supported
- Console warnings for debugging

## Audio File Setup

### Required File
Place your notification sound at: `public/notification.mp3`

**File Requirements:**
- Format: MP3, WAV, or OGG
- Duration: 0.2-2 seconds (recommend ~0.5s)
- Size: 10-100KB (for fast loading)
- Volume: Moderate (-6dB to -12dB to prevent clipping)

### Recommended Sound
Use a simple "chime" or "bell" sound for professional setting. Example values:
- Notification.mp3 (included with most systems)
- Or use Web Audio fallback (built-in)

## Performance Considerations

1. **Memory:** Audio instances are reused, not recreated
2. **Network:** Sound file preloaded and cached by browser
3. **CPU:** Animation runs at 60fps with GPU acceleration
4. **Audio:** Single instance per sound ID, prevents overlapping

## Testing

### Manual Testing
1. Log in as kitchen user
2. Place new order from customer portal
3. Verify sound plays and visual highlight appears
4. Click mute button - sound should stop
5. Click unmute - next order should play again

### Role-Based Testing
1. Log in as non-kitchen user (e.g., manager)
2. Place new order
3. Verify sound does NOT play for non-kitchen roles

### Sound Fallback Testing
1. Disable notification.mp3 in DevTools Network tab
2. Verify fallback Web Audio sound plays
3. Check console for error log

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Sound doesn't play | Check browser volume, verify audio file exists at `/notification.mp3` |
| Sound loops/overlaps | Check if `soundNotificationManager` is used correctly, should be singleton |
| Highlight doesn't show | Verify `newOrderIds` state is being set with order ID |
| Toast doesn't appear | Check Z-index conflicts, verify `showNotificationToast` state |
| Permission denied error | Check browser autoplay policy, may require user interaction first |

## Future Enhancements

1. **Volume Slider Control**
   ```javascript
   <input 
     type="range" 
     min="0" 
     max="1" 
     step="0.1"
     onChange={(e) => soundNotificationManager.setVolume(e.target.value)}
   />
   ```

2. **Multiple Sound Types**
   ```javascript
   soundNotificationManager.playSound('order_ready', '/sounds/ready.mp3');
   soundNotificationManager.playSound('low_stock', '/sounds/alert.mp3');
   ```

3. **Sound Preferences UI**
   - Per-user volume settings
   - Sound type selection
   - Do-not-disturb hours

4. **Notification Grouping**
   - Play sound once for batch of orders
   - Visual grouping in dashboard

5. **Analytics**
   - Track notification engagement
   - Monitor mute rates
   - User adoption metrics

## Best Practices Applied

✅ **React:**
- Hooks for state and side effects
- Context API for global state
- Component composition
- Proper cleanup with useEffect

✅ **Performance:**
- Lazy initialization
- Instance reuse
- Memoization of callbacks
- Efficient animations with Framer Motion

✅ **UX:**
- Persistent user preferences
- Graceful fallbacks
- Clear visual/audio feedback
- Non-intrusive but noticeable

✅ **Security:**
- Role-based access control
- No storing sensitive data in localStorage
- Safe error handling

## Support

For issues or questions:
1. Check browser console for error messages
2. Verify user role is 'kitchen'
3. Check audio file exists and is accessible
4. Test in incognito mode to clear cache
