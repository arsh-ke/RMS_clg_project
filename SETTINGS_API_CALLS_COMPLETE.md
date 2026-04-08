# 🔌 SETTINGS API INTEGRATION MAP - Visual Guide

This document shows **exactly where Settings API is called** in your codebase with code snippets.

---

## 📊 System-Wide Settings Usage

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  App.js (Wraps with SettingsProvider)                      │
│    ↓                                                        │
│  SettingsContext.js (Fetches GET /api/settings on mount)   │
│    ↓                                                        │
│  useSettingsHook() (30+ getter methods)                    │
│    ↓                                                        │
│  Components use settings:                                  │
│   ├─ BillingComponent (getTaxPercent)                      │
│   ├─ KitchenDisplay (isKitchenSoundEnabled)                │
│   ├─ Inventory (getLowStockThreshold)                      │
│   └─ OrderManagement (isAutoCompleteAfterPayment)          │
│                                                              │
│  SystemSettings.js (Admin UI)                              │
│    └─ Calls PUT /api/settings on Save                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
            ↓ HTTP Calls
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Express)                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Server.js registers settingsRoutes                        │
│    ↓                                                        │
│  settingsRoutes.js (API endpoints)                         │
│    ├─ GET    /api/settings                                 │
│    ├─ GET    /api/settings/:section                        │
│    ├─ PUT    /api/settings                                 │
│    └─ POST   /api/settings/reset                           │
│    ↓                                                        │
│  settingsController.js (Logic)                             │
│    ├─ getSettings()                                        │
│    ├─ updateSettings()                                     │
│    ├─ getSettingSection()                                  │
│    └─ resetSettings()                                      │
│    ↓                                                        │
│  SystemSettings.js (MongoDB Model)                         │
│    └─ Database operations                                  │
│                                                              │
│  Other Controllers use settings:                           │
│   ├─ orderController (uses GET /api/settings for tax)      │
│   ├─ notificationController (uses for sound)               │
│   ├─ inventoryController (uses for threshold)              │
│   └─ orderController (uses for auto-complete)              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔌 API Endpoint Details

### 1. GET /api/settings
**Called From:** SettingsContext.js (on app mount)

```javascript
// Location: frontend/src/context/SettingsContext.js
useEffect(() => {
  fetchSettings();  // Calls this endpoint
}, []);

const fetchSettings = async () => {
  try {
    const response = await api.get('/settings');  // ← API CALL
    if (response.data.success) {
      setSettings(response.data.data);
    }
  } catch (err) {
    console.error('[SETTINGS] Error fetching settings:', err);
    setError(err.response?.data?.message || 'Failed to fetch settings');
  }
};
```

**Response Structure:**
```json
{
  "success": true,
  "message": "Settings retrieved successfully",
  "data": {
    "restaurant": { ... },
    "financial": { ... },
    "orders": { ... },
    "notifications": { ... },
    "inventory": { ... },
    "tables": { ... }
  }
}
```

---

### 2. GET /api/settings/:section
**Called From:** Direct API calls when needed

```javascript
// OPTIONAL: Fetch specific section only
// Example in frontend:

const getSectionSettings = async (section) => {
  try {
    const response = await fetch(`/api/settings/${section}`);
    const data = await response.json();
    console.log(`${section} settings:`, data.data);
  } catch (error) {
    console.error('Error fetching section:', error);
  }
};

// Usage:
getSectionSettings('financial');  // Gets only financial settings
getSectionSettings('inventory');  // Gets only inventory settings
```

**Response Example:**
```json
{
  "success": true,
  "message": "financial settings retrieved successfully",
  "data": {
    "financial": {
      "taxPercent": 18,
      "serviceChargePercent": 5,
      "discountLimit": 100
    }
  }
}
```

---

### 3. PUT /api/settings
**Called From:** SystemSettings.js (Admin save button)

```javascript
// Location: frontend/src/pages/SystemSettings.js

const handleSave = async () => {
  try {
    setIsSaving(true);
    
    const updateData = {
      restaurant: formData.restaurant,
      financial: formData.financial,
      orders: formData.orders,
      notifications: formData.notifications,
      inventory: formData.inventory,
      tables: formData.tables
    };

    const result = await updateSettings(updateData);  // ← API CALL
    
    if (result.success) {
      toast.success(result.message || 'Settings saved successfully!');
      setHasChanges(false);
    } else {
      toast.error(result.message || 'Failed to save settings');
    }
  } catch (error) {
    console.error('Error saving settings:', error);
    toast.error('An error occurred while saving settings');
  }
};

// From SettingsContext.js:
const updateSettings = async (settingsData) => {
  try {
    const response = await api.put('/settings', settingsData);  // ← API CALL
    if (response.data.success) {
      setSettings(response.data.data);
      return { success: true, message: response.data.message };
    }
  } catch (err) {
    const errorMsg = err.response?.data?.message || 'Failed to update settings';
    setError(errorMsg);
    return { success: false, message: errorMsg };
  }
};
```

**Request Body Example:**
```json
{
  "financial": {
    "taxPercent": 18,
    "serviceChargePercent": 5
  },
  "orders": {
    "autoCompleteAfterPayment": true
  }
}
```

**Response Example:**
```json
{
  "success": true,
  "message": "Settings updated successfully",
  "data": {
    "_id": "...",
    "restaurant": { ... },
    "financial": { ... },
    ... all updated settings
  }
}
```

---

### 4. POST /api/settings/reset
**Called From:** Admin emergency reset only

```javascript
// DANGEROUS: Only use with confirmation

const resetSettings = async () => {
  const confirmed = window.confirm(
    'This will reset ALL settings to defaults. Are you sure?'
  );
  
  if (confirmed) {
    try {
      const response = await api.post('/settings/reset', { 
        confirm: true 
      });  // ← API CALL
      
      if (response.data.success) {
        toast.success('Settings reset to defaults');
        // Refresh page or refetch settings
      }
    } catch (error) {
      toast.error('Error resetting settings');
    }
  }
};
```

---

## 🏠 Backend: How Settings are Used in Controllers

### 1. Order Controller - Using Tax Settings
**File:** `backend/src/controllers/orderController.js`

```javascript
const SystemSettings = require('../models/SystemSettings');
const Order = require('../models/Order');

exports.createOrder = async (req, res, next) => {
  try {
    const { items, table, customerName } = req.body;

    // ✅ FETCH SETTINGS
    const settings = await SystemSettings.findOne();
    const taxPercent = settings?.financial?.taxPercent || 0;
    const serviceChargePercent = settings?.financial?.serviceChargePercent || 0;
    const autoCompleteAfterPayment = settings?.orders?.autoCompleteAfterPayment ?? true;

    // ... order items processing ...

    let subtotal = 0;
    // Calculate subtotal from items
    
    // ✅ USE SETTINGS FOR CALCULATIONS
    const taxAmount = subtotal * (taxPercent / 100);
    const serviceCharge = subtotal * (serviceChargePercent / 100);
    const total = subtotal + taxAmount + serviceCharge;

    // Create order with dynamic values
    const order = await Order.create({
      items: orderItems,
      subtotal,
      tax: taxAmount,
      serviceCharge,
      total,
      customerName,
      // ... other fields
    });

    res.status(201).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};
```

**Settings Used:**
- `settings.financial.taxPercent`
- `settings.financial.serviceChargePercent`
- `settings.orders.autoCompleteAfterPayment`

---

### 2. Notification Controller - Using Sound Settings
**File:** `backend/src/controllers/notificationController.js` (example to add)

```javascript
const SystemSettings = require('../models/SystemSettings');
const { emitToRole } = require('../config/socket');

exports.sendKitchenAlert = async (orderId) => {
  try {
    // ✅ FETCH SETTINGS
    const settings = await SystemSettings.findOne();
    const kitchenSoundEnabled = settings?.notifications?.kitchenSoundEnabled;
    const kitchenSoundVolume = settings?.notifications?.kitchenSoundVolume || 80;

    const order = await Order.findById(orderId).populate('items');

    // ✅ USE SETTINGS FOR NOTIFICATION
    emitToRole('kitchen', 'new-order-alert', {
      orderId: order._id,
      items: order.items,
      tableNumber: order.tableNumber,
      sound: {
        enabled: kitchenSoundEnabled,
        volume: kitchenSoundVolume
      }
    });

    console.log('[NOTIFICATION] Alert sent to kitchen');
  } catch (error) {
    console.error('[NOTIFICATION] Error:', error);
  }
};
```

**Settings Used:**
- `settings.notifications.kitchenSoundEnabled`
- `settings.notifications.kitchenSoundVolume`

---

### 3. Inventory Controller - Using Threshold Settings
**File:** `backend/src/controllers/inventoryController.js` (example to add)

```javascript
const SystemSettings = require('../models/SystemSettings');
const Inventory = require('../models/Inventory');
const { emitToRole } = require('../config/socket');

exports.checkLowStock = async (req, res) => {
  try {
    // ✅ FETCH SETTINGS
    const settings = await SystemSettings.findOne();
    const lowStockThreshold = settings?.inventory?.defaultLowStockThreshold || 10;
    const autoDeductEnabled = settings?.inventory?.autoInventoryDeductionEnabled;

    const inventory = await Inventory.find();

    // ✅ USE SETTINGS FOR LOW STOCK CHECK
    const lowStockItems = inventory.filter(
      item => item.quantity < lowStockThreshold
    );

    // Alert admin if low stock
    if (lowStockItems.length > 0) {
      emitToRole('admin', 'low-stock-alert', {
        items: lowStockItems,
        threshold: lowStockThreshold,
        count: lowStockItems.length
      });
    }

    res.json({
      success: true,
      data: {
        inventory,
        lowStockItems,
        threshold: lowStockThreshold
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking inventory',
      error: error.message
    });
  }
};
```

**Settings Used:**
- `settings.inventory.defaultLowStockThreshold`
- `settings.inventory.autoInventoryDeductionEnabled`

---

## 📱 Frontend: How Settings are Used in Components

### 1. Billing Display Component
**File:** `frontend/src/pages/OrderManagement.js` (example)

```javascript
import useSettingsHook from '../hooks/useSettingsHook';

function OrderBilling({ order }) {
  // ✅ USE HOOK TO GET SETTINGS
  const { 
    getTaxPercent,
    getServiceChargePercent,
    getCurrency,
    isAutoCompleteAfterPayment 
  } = useSettingsHook();

  // ✅ USE SETTINGS IN CALCULATIONS
  const tax = order.subtotal * (getTaxPercent() / 100);
  const serviceCharge = order.subtotal * (getServiceChargePercent() / 100);
  const total = order.subtotal + tax + serviceCharge;

  const handlePayment = async () => {
    // ✅ USE SETTINGS FOR BUSINESS LOGIC
    if (isAutoCompleteAfterPayment()) {
      // Auto-complete the order
      await updateOrderStatus(order._id, 'completed');
    }
  };

  return (
    <div className="billing-display">
      <h2>Order Bill</h2>
      
      <div className="bill-item">
        <span>Subtotal:</span>
        <span>{getCurrency()} {order.subtotal}</span>
      </div>

      <div className="bill-item">
        <span>Tax ({getTaxPercent()}%):</span>
        <span>{getCurrency()} {tax}</span>
      </div>

      <div className="bill-item">
        <span>Service Charge ({getServiceChargePercent()}%):</span>
        <span>{getCurrency()} {serviceCharge}</span>
      </div>

      <div className="bill-total">
        <span>Total:</span>
        <span>{getCurrency()} {total}</span>
      </div>

      <button onClick={handlePayment}>
        Process Payment
      </button>
    </div>
  );
}
```

**Settings Used:**
- `getTaxPercent()`
- `getServiceChargePercent()`
- `getCurrency()`
- `isAutoCompleteAfterPayment()`

---

### 2. Kitchen Display Component
**File:** `frontend/src/pages/KitchenDisplay.js` (example)

```javascript
import { useSocket } from '../context/SocketContext';
import useSettingsHook from '../hooks/useSettingsHook';

function KitchenDisplay() {
  const { socketConnected } = useSocket();
  
  // ✅ USE HOOK TO GET SETTINGS
  const { 
    isKitchenSoundEnabled,
    getKitchenSoundVolume,
    getOrderTimeLimit
  } = useSettingsHook();

  // Socket listener for new orders
  useSocket().on('new-order-alert', (data) => {
    // ✅ USE SETTINGS FOR SOUND ALERT
    if (isKitchenSoundEnabled()) {
      playKitchenSound({
        volume: getKitchenSoundVolume(),
        type: 'alert'
      });
    }
  });

  return (
    <div className="kitchen-display">
      <h1>Kitchen Orders</h1>
      
      <div className="settings-info">
        <p>
          🔊 Sound: {isKitchenSoundEnabled() ? 'ON' : 'OFF'} 
          (Volume: {getKitchenSoundVolume()}%)
        </p>
        <p>
          ⏱️ Order Time Limit: {getOrderTimeLimit()} minutes
        </p>
      </div>

      {/* Orders display */}
      <OrdersList />
    </div>
  );
}
```

**Settings Used:**
- `isKitchenSoundEnabled()`
- `getKitchenSoundVolume()`
- `getOrderTimeLimit()`

---

### 3. Inventory Component
**File:** `frontend/src/pages/Inventory.js` (example)

```javascript
import useSettingsHook from '../hooks/useSettingsHook';

function InventoryManagement() {
  const [items, setItems] = useState([]);

  // ✅ USE HOOK TO GET SETTINGS
  const { 
    getLowStockThreshold,
    getMeasurementUnits,
    isAutoInventoryDeductionEnabled
  } = useSettingsHook();

  const threshold = getLowStockThreshold(); // Default 10
  const units = getMeasurementUnits();       // ['kg', 'ltr', 'piece', ...]
  const autoDeduct = isAutoInventoryDeductionEnabled();

  return (
    <div className="inventory-management">
      <h1>Inventory</h1>

      <div className="settings-info">
        <p>Low Stock Threshold: {threshold} units</p>
        <p>Measurement Units: {units.join(', ')}</p>
        <p>Auto-Deduction: {autoDeduct ? 'Enabled' : 'Disabled'}</p>
      </div>

      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Quantity ({units[0]})</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item._id}>
              <td>{item.name}</td>
              <td>{item.quantity}</td>
              <td>
                {item.quantity < threshold ? (
                  <span className="low-stock">
                    ⚠️ Low (Threshold: {threshold})
                  </span>
                ) : (
                  <span className="ok">✓ OK</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

**Settings Used:**
- `getLowStockThreshold()`
- `getMeasurementUnits()`
- `isAutoInventoryDeductionEnabled()`

---

## 🔄 Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: ADMIN UPDATES SETTINGS                                   │
└─────────────────────────────────────────────────────────────────┘
   Admin clicks /settings → Fills form → Clicks "Save Changes"

┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: SETTINGS CONTEXT SENDS REQUEST                           │
└─────────────────────────────────────────────────────────────────┘
   SettingsContext.updateSettings()
       ↓
   PUT /api/settings (with updated data)

┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: BACKEND VALIDATES & SAVES                                │
└─────────────────────────────────────────────────────────────────┘
   settingsController.updateSettings()
       ↓
   Validate input (tax 0-100, etc.)
       ↓
   SystemSettings.findOneAndUpdate()
       ↓
   MongoDB updated ✅

┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: RESPONSE SENT BACK                                       │
└─────────────────────────────────────────────────────────────────┘
   Returns: { success: true, data: updatedSettings }

┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: FRONTEND UPDATES CONTEXT                                │
└─────────────────────────────────────────────────────────────────┘
   setSettings(response.data.data)
       ↓
   Context updated ✅

┌─────────────────────────────────────────────────────────────────┐
│ STEP 6: ALL COMPONENTS RE-RENDER                                │
└─────────────────────────────────────────────────────────────────┘
   BillingComponent → getTaxPercent() returns 18 ✅
   KitchenDisplay → isKitchenSoundEnabled() returns true ✅
   Inventory → getLowStockThreshold() returns 15 ✅

┌─────────────────────────────────────────────────────────────────┐
│ RESULT: NEW SETTINGS APPLIED SYSTEM-WIDE 🎉                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✅ Verification: Test Each API Call

### Test 1: Frontend Fetch
```javascript
// Open Console → paste:
fetch('/api/settings')
  .then(r => r.json())
  .then(data => console.log('Settings:', data.data));
```

### Test 2: Admin Update
```bash
curl -X PUT http://localhost:8001/api/settings \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"financial": {"taxPercent": 18}}'
```

### Test 3: Verify in Component
Navigate to a component using settings, check console for correct values.

---

**All Settings API calls are now documented and ready to use!** ✨
