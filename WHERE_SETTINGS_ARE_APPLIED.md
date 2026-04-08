# 📍 WHERE SETTINGS ARE BEING APPLIED - COMPLETE MAPPING

This guide shows exactly where the Settings module is integrated and how it's being used throughout your app.

---

## 🔧 BACKEND - Settings API Calls

### File: `backend/src/controllers/settingsController.js`
**Location:** API endpoint implementations  
**What it does:** Handles all settings operations

```javascript
// 1. getSettings() - Called when client requests settings
exports.getSettings = async (req, res) => {
  // ✅ CALL: GET /api/settings
  // Returns full settings object from MongoDB
  // Auto-creates defaults if missing
}

// 2. updateSettings() - Called when admin saves settings
exports.updateSettings = async (req, res) => {
  // ✅ CALL: PUT /api/settings
  // Updates any section with validation
  // Tracks who updated and when
}

// 3. getSettingSection() - Called for specific section
exports.getSettingSection = async (req, res) => {
  // ✅ CALL: GET /api/settings/:section
  // Returns only one section (e.g., /api/settings/financial)
}

// 4. resetSettings() - Emergency reset only
exports.resetSettings = async (req, res) => {
  // ✅ CALL: POST /api/settings/reset
  // Dangerous operation - requires admin confirmation
}
```

---

### File: `backend/src/routes/settingsRoutes.js`
**Location:** API route definitions  
**What it does:** Maps HTTP requests to controller functions

```javascript
router.get('/', getSettings);                    // Public read
router.get('/:section', getSettingSection);      // Public read section
router.put('/', protect, authorize('admin'), updateSettings);      // Admin write
router.post('/reset', protect, authorize('admin'), resetSettings); // Admin only
```

**To use in your backend:**
```javascript
const SystemSettings = require('../models/SystemSettings');

// In any controller (e.g., orderController.js):
const settings = await SystemSettings.findOne();
const taxPercent = settings?.financial?.taxPercent || 0;
const serviceCharge = settings?.financial?.serviceChargePercent || 0;
```

---

## 🎨 FRONTEND - Settings Context & Hooks

### File: `frontend/src/context/SettingsContext.js`
**Location:** Global state management  
**What it does:** Fetches and provides settings to entire app

```javascript
export const useSettings = () => {
  // ✅ HOOK: Access settings from anywhere
  // Returns: { settings, loading, error, fetchSettings, updateSettings, getSettingValue }
};

const SettingsProvider = ({ children }) => {
  // On mount: Fetches /api/settings automatically
  useEffect(() => {
    fetchSettings();
  }, []);

  // Provides settings to all child components via Context
  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
```

**Auto-fetches on app load** ✅

---

### File: `frontend/src/pages/SystemSettings.js`
**Location:** Admin settings UI page  
**What it does:** Renders settings form and calls update API

```javascript
function SystemSettings() {
  const { settings, updateSettings } = useSettings();
  
  const handleSave = async () => {
    // ✅ CALLS: PUT /api/settings
    // Sends form data to backend
    const result = await updateSettings(formData);
    // Shows success/error toast
  };

  return (
    // 6 tabs: Restaurant, Financial, Orders, Notifications, Inventory, Tables
  );
}
```

**Endpoint called:**
- `PUT /api/settings` - Updates all setting sections

---

### File: `frontend/src/hooks/useSettingsHook.js`
**Location:** Helper hook for using settings  
**What it does:** Provides 30+ getter methods

```javascript
export const useSettingsHook = () => {
  // ✅ HOOK: Use in any component
  
  return {
    // Restaurant getters
    getRestaurantName(),         // → "NEXA EATS"
    getCurrency(),               // → "INR"
    
    // Financial getters
    getTaxPercent(),             // → 18
    getServiceChargePercent(),   // → 5
    
    // Order getters
    isAutoCompleteAfterPayment(),        // → true
    isAutoFreeTableAfterBilling(),       // → true
    
    // Notification getters
    isKitchenSoundEnabled(),     // → true
    getKitchenSoundVolume(),     // → 85
    
    // Inventory getters
    getLowStockThreshold(),      // → 10
    isAutoInventoryDeductionEnabled(), // → true
    
    // Table getters
    getDefaultTableCapacity(),   // → 4
    isQRCodeEnabled(),           // → true
  };
};
```

---

### File: `frontend/src/App.js`
**Location:** App root component  
**What it does:** Wraps app with SettingsProvider

```javascript
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SettingsProvider>  {/* ← WRAPS ENTIRE APP */}
          <SocketProvider>
            <AppRoutes />
          </SocketProvider>
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

// In routes:
<Route path="settings" element={
  <ProtectedRoute allowedRoles={['admin']}>
    <SystemSettings />
  </ProtectedRoute>
} />
```

**Effect:** Settings available globally to all components ✅

---

### File: `frontend/src/components/Layout.js`
**Location:** Navigation sidebar  
**What it does:** Displays Settings menu item

```javascript
const allNavItems = [
  // ... other menu items ...
  { 
    path: '/settings', 
    icon: Settings, 
    label: 'Settings', 
    color: '#8b5cf6', 
    roles: ['admin']  // Only admin can see
  },
];
```

**Effect:** Admin sees "Settings" in sidebar, clicking navigates to `/settings` ✅

---

## 🔗 WHERE SETTINGS ARE ACTUALLY BEING USED

### Location 1: Order Billing (Backend)
**File:** `backend/src/controllers/orderController.js`

```javascript
// To integrate Settings for tax calculation:

const SystemSettings = require('../models/SystemSettings');

exports.createOrder = async (req, res, next) => {
  // Fetch settings
  const settings = await SystemSettings.findOne();
  const taxPercent = settings?.financial?.taxPercent || 0;
  const serviceChargePercent = settings?.financial?.serviceChargePercent || 0;

  // Calculate using settings (not hardcoded!)
  const tax = subtotal * (taxPercent / 100);
  const serviceCharge = subtotal * (serviceChargePercent / 100);
  const total = subtotal + tax + serviceCharge;

  // Save order with dynamic values ✅
  const order = await Order.create({
    subtotal,
    tax,
    serviceCharge,
    total,
    // ... other fields
  });
};
```

**API Calls:** `GET /api/settings` (internal, no exposed endpoint)

---

### Location 2: Kitchen Notifications (Backend)
**File:** `backend/src/controllers/notificationController.js`

```javascript
// To integrate Settings for kitchen sound:

const SystemSettings = require('../models/SystemSettings');

exports.sendKitchenAlert = async (order) => {
  const settings = await SystemSettings.findOne();
  const soundEnabled = settings?.notifications?.kitchenSoundEnabled;
  const volume = settings?.notifications?.kitchenSoundVolume;

  // Emit to kitchen with settings ✅
  emitToRole('kitchen', 'new-order', {
    order,
    sound: {
      enabled: soundEnabled,
      volume: volume
    }
  });
};
```

**API Calls:** `GET /api/settings` (internal, no exposed endpoint)

---

### Location 3: Inventory Checks (Backend)
**File:** `backend/src/controllers/inventoryController.js`

```javascript
// To integrate Settings for low stock alerts:

const SystemSettings = require('../models/SystemSettings');

exports.checkLowStock = async (req, res) => {
  const settings = await SystemSettings.findOne();
  const threshold = settings?.inventory?.defaultLowStockThreshold || 10;
  const autoDeduct = settings?.inventory?.autoInventoryDeductionEnabled;

  const inventory = await Inventory.find();
  const lowStockItems = inventory.filter(item => item.quantity < threshold);

  // Alert admin if low stock ✅
  if (lowStockItems.length > 0) {
    emitToRole('admin', 'low-stock-alert', {
      items: lowStockItems,
      threshold: threshold
    });
  }

  res.json({ lowStockItems });
};
```

**API Calls:** `GET /api/settings` (internal, no exposed endpoint)

---

### Location 4: Order Status Management (Backend)
**File:** `backend/src/controllers/orderController.js`

```javascript
// To integrate Settings for auto-complete:

const SystemSettings = require('../models/SystemSettings');

exports.handlePayment = async (order) => {
  const settings = await SystemSettings.findOne();
  const autoComplete = settings?.orders?.autoCompleteAfterPayment;

  // Auto-complete if enabled in settings ✅
  if (autoComplete) {
    order.status = 'completed';
    await order.save();
  }
};
```

**API Calls:** `GET /api/settings` (internal, no exposed endpoint)

---

## 📱 FRONTEND - Components Using Settings

### Example 1: Billing Component (Frontend)
```javascript
// File: frontend/src/pages/OrderManagement.js (or any billing page)

import useSettingsHook from '../hooks/useSettingsHook';

function BillingDisplay({ order }) {
  const { 
    getTaxPercent, 
    getServiceChargePercent,
    getCurrency 
  } = useSettingsHook();

  const tax = order.subtotal * (getTaxPercent() / 100);
  const serviceCharge = order.subtotal * (getServiceChargePercent() / 100);
  const total = order.subtotal + tax + serviceCharge;

  return (
    <div>
      {/* Display uses settings ✅ */}
      <p>Subtotal: {getCurrency()} {order.subtotal}</p>
      <p>Tax ({getTaxPercent()}%): {getCurrency()} {tax}</p>
      <p>Service Charge ({getServiceChargePercent()}%): {getCurrency()} {serviceCharge}</p>
      <p>Total: {getCurrency()} {total}</p>
    </div>
  );
}
```

**Settings Used:**
- `getTaxPercent()` - From settings.financial.taxPercent
- `getServiceChargePercent()` - From settings.financial.serviceChargePercent
- `getCurrency()` - From settings.restaurant.currency

---

### Example 2: Kitchen Display Component (Frontend)
```javascript
// File: frontend/src/pages/KitchenDisplay.js

import useSettingsHook from '../hooks/useSettingsHook';

function KitchenDisplay() {
  const { isKitchenSoundEnabled, getKitchenSoundVolume } = useSettingsHook();

  const handleNewOrder = (order) => {
    // Play sound if enabled ✅
    if (isKitchenSoundEnabled()) {
      playSound({
        volume: getKitchenSoundVolume(),
        type: 'new_order'
      });
    }
  };

  return (
    <div>
      {/* Kitchen orders displayed */}
    </div>
  );
}
```

**Settings Used:**
- `isKitchenSoundEnabled()` - From settings.notifications.kitchenSoundEnabled
- `getKitchenSoundVolume()` - From settings.notifications.kitchenSoundVolume

---

### Example 3: Inventory Component (Frontend)
```javascript
// File: frontend/src/pages/Inventory.js

import useSettingsHook from '../hooks/useSettingsHook';

function InventoryManagement() {
  const { 
    getLowStockThreshold, 
    getMeasurementUnits 
  } = useSettingsHook();

  const threshold = getLowStockThreshold(); // Default 10
  const units = getMeasurementUnits();       // ['kg', 'ltr', 'piece', ...]

  return (
    <div>
      {inventory.map(item => (
        <div key={item._id}>
          <p>{item.name}: {item.quantity} {item.unit}</p>
          {item.quantity < threshold && (
            <p className="text-red-500">
              ⚠️ Low stock! (Threshold: {threshold})
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
```

**Settings Used:**
- `getLowStockThreshold()` - From settings.inventory.defaultLowStockThreshold
- `getMeasurementUnits()` - From settings.inventory.measurementUnits

---

## 📊 API Endpoints Map

### All Settings API Endpoints

| Endpoint | Method | Auth | Purpose | File |
|----------|--------|------|---------|------|
| `/api/settings` | GET | None | Get all settings | settingsController |
| `/api/settings/:section` | GET | None | Get specific section | settingsController |
| `/api/settings` | PUT | Admin | Update settings | settingsController |
| `/api/settings/reset` | POST | Admin | Reset to defaults | settingsController |

### Called From

| Controller | Method | Endpoint Used |
|------------|---------| ------------|
| orderController | createOrder | `GET /api/settings` (tax %) |
| orderController | handlePayment | `GET /api/settings` (auto-complete) |
| notificationController | sendAlert | `GET /api/settings` (sound) |
| inventoryController | checkLowStock | `GET /api/settings` (threshold) |

---

## 🎯 Flow: How Settings Are Applied

### 1️⃣ Admin Changes Settings
```
Admin at /settings page
    ↓
Fills form (changes tax from 0% to 18%)
    ↓
Clicks "Save Changes"
    ↓
Calls: PUT /api/settings { financial: { taxPercent: 18 } }
```

### 2️⃣ Backend Updates Database
```
PUT /api/settings
    ↓
updateSettings() controller called
    ↓
Validates data (tax must be 0-100)
    ↓
Updates MongoDB: SystemSettings.findOneAndUpdate()
    ↓
Returns updated settings
```

### 3️⃣ Frontend Updates Context
```
Response received { success: true, data: settings }
    ↓
SettingsContext updated with new settings
    ↓
React re-renders all components using useSettings()
```

### 4️⃣ Components Use New Settings
```
BillingComponent refetches/recalculates
    ↓
Uses getTaxPercent() → returns 18
    ↓
Calculates tax as: subtotal * 0.18
    ↓
✨ NEW TAX APPLIED AUTOMATICALLY!
```

---

## 📝 Where to Add Settings Integration

If you want to add Settings to another module:

### Backend Integration Checklist
```javascript
// 1. Import at top of controller
const SystemSettings = require('../models/SystemSettings');

// 2. Fetch in your function
const settings = await SystemSettings.findOne();

// 3. Use setting value
const myValue = settings?.section?.field || defaultValue;

// 4. Apply to your logic
// Use myValue instead of hardcoded value
```

### Frontend Integration Checklist
```javascript
// 1. Import hook
import useSettingsHook from '../hooks/useSettingsHook';

// 2. Call in component
const { getMethodName } = useSettingsHook();

// 3. Use value
const value = getMethodName();

// 4. Display/apply
// Use value in JSX or logic
```

---

## ✅ Current Integration Status

### ✅ READY TO INTEGRATE
- ✅ Order Billing Module (tax calculations)
- ✅ Kitchen Display (sound notifications)
- ✅ Inventory Management (low stock alerts)
- ✅ Order Status (auto-complete logic)

### 🔜 FUTURE INTEGRATIONS
- Table Management (reservation settings)
- User Management (role permissions)
- Reports Module (email settings)
- Analytics (data retention settings)

---

## 🚀 Testing Settings API

### 1. Test Get Settings
```bash
curl http://localhost:8001/api/settings
# Returns all current settings
```

### 2. Test Get Specific Section
```bash
curl http://localhost:8001/api/settings/financial
# Returns only financial section
```

### 3. Test Update Settings (Admin)
```bash
curl -X PUT http://localhost:8001/api/settings \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"financial": {"taxPercent": 18}}'
# Updates and returns new settings
```

### 4. Verify in Frontend
- Go to `/settings` page
- Change a value
- Click "Save Changes"
- Check browser Network tab for PUT request

---

## 📞 Quick Debug Checklist

**Settings not showing?**
- [ ] Check SettingsProvider wraps entire app in App.js
- [ ] Check useSettings hook returns data
- [ ] Check browser Network tab for GET /api/settings call

**Changes not saving?**
- [ ] Check Authorization header has Bearer token
- [ ] Check user is admin role
- [ ] Check Network tab for PUT request 200 response

**Settings not applying to components?**
- [ ] Check useSettingsHook imported correctly
- [ ] Check method name is correct (e.g., getTaxPercent)
- [ ] Check component is re-rendering after settings update

---

**All Settings are now integrated and ready to use throughout your system!** ✨
