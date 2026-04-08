# 🗺️ SETTINGS MODULE - FILE LOCATION GUIDE

**Quick reference to find Settings code in your project**

---

## 📁 Backend Files

### 1. MongoDB Model
**📄 File:** `backend/src/models/SystemSettings.js`  
**Size:** ~200 lines  
**Contains:**
- MongoDB schema definition
- 6 configuration sections
- Field validations
- Default values

**What to look for:**
```
- restaurant object with name, address, phone, etc.
- financial object with taxPercent, serviceChargePercent
- orders object with auto-complete settings
- notifications object with sound settings
- inventory object with thresholds
- tables object with capacity settings
```

---

### 2. Controller (Business Logic)
**📄 File:** `backend/src/controllers/settingsController.js`  
**Size:** ~250 lines  
**Contains:**
- `getSettings()` - Fetches settings (auto-creates defaults)
- `updateSettings()` - Updates with validation
- `getSettingSection()` - Gets one section only
- `resetSettings()` - Emergency reset

**What to look for:**
```
- Input validation (tax must be 0-100)
- MongoDB queries
- Error handling
- User tracking (updatedBy)
```

**Key functions to understand:**
```javascript
exports.getSettings = async (req, res) => { ... }
exports.updateSettings = async (req, res) => { ... }
exports.getSettingSection = async (req, res) => { ... }
exports.resetSettings = async (req, res) => { ... }
```

---

### 3. Routes (API Endpoints)
**📄 File:** `backend/src/routes/settingsRoutes.js`  
**Size:** ~40 lines  
**Contains:**
- `GET /api/settings` - Public read
- `GET /api/settings/:section` - Public section read
- `PUT /api/settings` - Admin update (protected)
- `POST /api/settings/reset` - Admin reset (protected)

**What to look for:**
```javascript
router.get('/', getSettings);
router.get('/:section', getSettingSection);
router.put('/', protect, authorize('admin'), updateSettings);
router.post('/reset', protect, authorize('admin'), resetSettings);
```

---

### 4. Server Integration
**📄 File:** `backend/src/server.js`  
**Size:** ~100 lines (only Settings part matters)  
**Contains:**
- Settings routes import
- Routes registration

**What to look for:**
```javascript
// Line ~10: Import
const settingsRoutes = require('./routes/settingsRoutes');

// Line ~65: Register
app.use('/api/settings', settingsRoutes);
```

---

## 🎨 Frontend Files

### 5. Settings Context (Global State)
**📄 File:** `frontend/src/context/SettingsContext.js`  
**Size:** ~100 lines  
**Contains:**
- `useSettings()` hook
- `SettingsProvider` component
- Auto-fetch on mount
- Update mechanism
- `getSettingValue()` path resolver

**What to look for:**
```javascript
export const useSettings = () => { ... }
export const SettingsProvider = ({ children }) => { ... }
const fetchSettings = async () => { ... }
const updateSettings = async (settingsData) => { ... }
const getSettingValue = (path) => { ... }
```

**Key hook for using settings anywhere:**
```javascript
const { settings, loading, error, updateSettings, getSettingValue } = useSettings();
```

---

### 6. Settings Admin Page
**📄 File:** `frontend/src/pages/SystemSettings.js`  
**Size:** ~700 lines  
**Contains:**
- 6 tabs (Restaurant, Financial, Orders, Notifications, Inventory, Tables)
- Form inputs for each setting
- Save/Discard functionality
- Real-time change tracking
- Success/error notifications
- Sub-components for each tab

**What to look for:**
```javascript
// Main component
function SystemSettings() { ... }

// Tab content components
function RestaurantSettings() { ... }
function FinancialSettings() { ... }
function OrderSettings() { ... }
function NotificationSettings() { ... }
function InventorySettings() { ... }
function TableSettings() { ... }
```

**Key function:**
```javascript
const handleSave = async () => {
  const result = await updateSettings(updateData);
  // Calls PUT /api/settings
}
```

---

### 7. Settings Hook (30+ Helper Methods)
**📄 File:** `frontend/src/hooks/useSettingsHook.js`  
**Size:** ~150 lines  
**Contains:**
- 30+ getter methods
- Easy-to-use API for components

**What to look for:**
```javascript
export const useSettingsHook = () => {
  // Restaurant getters
  getRestaurantName()
  getRestaurantPhone()
  getCurrency()
  
  // Financial getters
  getTaxPercent()
  getServiceChargePercent()
  getMaxDiscount()
  
  // Order getters
  isAutoCompleteAfterPayment()
  getOrderTimeLimit()
  
  // Notification getters
  isKitchenSoundEnabled()
  getKitchenSoundVolume()
  
  // Inventory getters
  getLowStockThreshold()
  getMeasurementUnits()
  
  // Table getters
  getDefaultTableCapacity()
  isQRCodeEnabled()
}
```

---

### 8. App Root
**📄 File:** `frontend/src/App.js`  
**Size:** ~120 lines (only Settings part matters)  
**Contains:**
- SettingsProvider wrapper
- Settings route definition

**What to look for:**
```javascript
// Line ~5: Import
import { SettingsProvider } from './context/SettingsContext';
import SystemSettings from './pages/SystemSettings';

// Line ~70: Wrap app
<SettingsProvider>
  <SocketProvider>
    <AppRoutes />
  </SocketProvider>
</SettingsProvider>

// Line ~85: Route
<Route path="settings" element={
  <ProtectedRoute allowedRoles={['admin']}>
    <SystemSettings />
  </ProtectedRoute>
} />
```

---

### 9. Navigation Menu
**📄 File:** `frontend/src/components/Layout.js`  
**Size:** ~530 lines (only nav part matters)  
**Contains:**
- Settings menu item in sidebar

**What to look for:**
```javascript
// Line ~30: In allNavItems array
{ 
  path: '/settings', 
  icon: Settings, 
  label: 'Settings', 
  color: '#8b5cf6', 
  roles: ['admin']  // Only admin can see
}
```

---

## 📚 Documentation Files

### 10. API Documentation
**📄 File:** `SYSTEM_SETTINGS_API.md`  
**Size:** ~500 lines  
**Contains:**
- Complete API reference
- Request/response examples
- cURL/JavaScript/Python examples
- Validation rules
- Error handling

---

### 11. Integration Guide
**📄 File:** `SYSTEM_SETTINGS_IMPLEMENTATION.md`  
**Size:** ~400 lines  
**Contains:**
- Full implementation details
- Architecture overview
- Integration patterns
- Deployment checklist

---

### 12. Quick Reference
**📄 File:** `SYSTEM_SETTINGS_QUICK_REFERENCE.md`  
**Size:** ~300 lines  
**Contains:**
- 5-minute overview
- Common patterns
- 30+ available hooks
- Troubleshooting

---

### 13. Where Settings Are Applied
**📄 File:** `WHERE_SETTINGS_ARE_APPLIED.md`  
**Size:** ~400 lines  
**Contains:**
- Visual maps
- Code examples
- Integration locations
- Testing guide

---

### 14. Complete API Calls
**📄 File:** `SETTINGS_API_CALLS_COMPLETE.md`  
**Size:** ~500 lines  
**Contains:**
- API endpoint details
- Backend controller usage
- Frontend component examples
- Complete data flow

---

### 15. Verification Checklist
**📄 File:** `SYSTEM_SETTINGS_VERIFICATION_CHECKLIST.md`  
**Size:** ~300 lines  
**Contains:**
- 33-point testing checklist
- Step-by-step tests
- Troubleshooting guide

---

## 🎯 Where Settings Are USED (Not Implemented Yet)

### These files should USE Settings but haven't been modified yet:

#### Backend Controllers
- **`backend/src/controllers/orderController.js`**
  - Line ~100: Tax calculation
  - Should use: `getTaxPercent()` from settings
  - Template provided in SETTINGS_INTEGRATION_EXAMPLES.js

- **`backend/src/controllers/notificationController.js`**
  - Should use: `isKitchenSoundEnabled()`, `getKitchenSoundVolume()`
  - Template provided

- **`backend/src/controllers/inventoryController.js`**
  - Should use: `getLowStockThreshold()`, `isAutoInventoryDeductionEnabled()`
  - Template provided

#### Frontend Components
- **`frontend/src/pages/OrderManagement.js`** (or billing page)
  - Should use: `getTaxPercent()`, `getServiceChargePercent()`
  - Example in SETTINGS_API_CALLS_COMPLETE.md

- **`frontend/src/pages/KitchenDisplay.js`**
  - Should use: `isKitchenSoundEnabled()`, `getKitchenSoundVolume()`
  - Example in SETTINGS_API_CALLS_COMPLETE.md

- **`frontend/src/pages/Inventory.js`**
  - Should use: `getLowStockThreshold()`, `getMeasurementUnits()`
  - Example in SETTINGS_API_CALLS_COMPLETE.md

---

## 📊 File Structure Summary

```
Backend Settings Implementation:
  ✅ backend/src/models/SystemSettings.js           (MongoDB Schema)
  ✅ backend/src/controllers/settingsController.js  (Business Logic)
  ✅ backend/src/routes/settingsRoutes.js           (API Routes)
  ✅ backend/src/server.js                          (UPDATED: routes registered)

Frontend Settings Implementation:
  ✅ frontend/src/context/SettingsContext.js        (Global State)
  ✅ frontend/src/pages/SystemSettings.js           (Admin UI)
  ✅ frontend/src/hooks/useSettingsHook.js          (Helper Methods)
  ✅ frontend/src/App.js                            (UPDATED: wrapper + route)
  ✅ frontend/src/components/Layout.js              (UPDATED: menu item)

Documentation:
  ✅ SYSTEM_SETTINGS_API.md                         (API Reference)
  ✅ SYSTEM_SETTINGS_IMPLEMENTATION.md              (Implementation Guide)
  ✅ SYSTEM_SETTINGS_QUICK_REFERENCE.md             (Quick Start)
  ✅ WHERE_SETTINGS_ARE_APPLIED.md                  (Map & Examples)
  ✅ SETTINGS_API_CALLS_COMPLETE.md                (API Details)
  ✅ SYSTEM_SETTINGS_VERIFICATION_CHECKLIST.md     (Testing)
  ✅ SYSTEM_SETTINGS_INTEGRATION_EXAMPLES.js        (Code Examples)
  ✅ SYSTEM_SETTINGS_SUMMARY.md                     (Overview)
```

---

## 🔍 How to Find Specific Things

### "Where is Settings API defined?"
→ `backend/src/routes/settingsRoutes.js`

### "How do I fetch settings in a component?"
→ `frontend/src/hooks/useSettingsHook.js`
→ or `frontend/src/context/SettingsContext.js`

### "Where is tax calculation supposed to use settings?"
→ `backend/src/controllers/orderController.js` (line ~100)
→ See template in `SYSTEM_SETTINGS_INTEGRATION_EXAMPLES.js`

### "How do I use settings in my component?"
→ `frontend/src/hooks/useSettingsHook.js`
→ Example in `SETTINGS_API_CALLS_COMPLETE.md`

### "What API endpoints exist?"
→ `backend/src/routes/settingsRoutes.js`
→ Full docs in `SYSTEM_SETTINGS_API.md`

### "How do I test Settings?"
→ `SYSTEM_SETTINGS_VERIFICATION_CHECKLIST.md`

---

## 🚀 Step-by-Step: Add Settings to Your Module

### Step 1: Find What Settings You Need
→ Look in `frontend/src/hooks/useSettingsHook.js` for available getters

### Step 2: Copy the Pattern
→ See `SYSTEM_SETTINGS_INTEGRATION_EXAMPLES.js` for your use case

### Step 3: Implement in Backend
```javascript
const SystemSettings = require('../models/SystemSettings');
const settings = await SystemSettings.findOne();
const value = settings?.section?.field || default;
```

### Step 4: Implement in Frontend
```javascript
import useSettingsHook from '../hooks/useSettingsHook';
const { getMethod } = useSettingsHook();
```

### Step 5: Test
→ Follow `SYSTEM_SETTINGS_VERIFICATION_CHECKLIST.md`

---

## 📍 Quick Navigation

| Need | Go To |
|------|-------|
| API Reference | `SYSTEM_SETTINGS_API.md` |
| Full Implementation | `SYSTEM_SETTINGS_IMPLEMENTATION.md` |
| Code Examples | `SETTINGS_API_CALLS_COMPLETE.md` |
| Quick Start | `SYSTEM_SETTINGS_QUICK_REFERENCE.md` |
| Integration Map | `WHERE_SETTINGS_ARE_APPLIED.md` |
| Testing | `SYSTEM_SETTINGS_VERIFICATION_CHECKLIST.md` |
| Backend Model | `backend/src/models/SystemSettings.js` |
| Backend Logic | `backend/src/controllers/settingsController.js` |
| Backend Routes | `backend/src/routes/settingsRoutes.js` |
| Frontend Context | `frontend/src/context/SettingsContext.js` |
| Frontend UI | `frontend/src/pages/SystemSettings.js` |
| Frontend Hook | `frontend/src/hooks/useSettingsHook.js` |

---

## ✨ Summary

**Backend is READY:**
- ✅ Model created
- ✅ Controller implemented
- ✅ Routes registered
- ✅ Integrated in server.js

**Frontend is READY:**
- ✅ Context created
- ✅ Page implemented
- ✅ Hook created
- ✅ App wrapped with provider
- ✅ Menu item added

**Documentation is COMPLETE:**
- ✅ 8 detailed guides
- ✅ API reference with examples
- ✅ Code templates
- ✅ Testing checklist
- ✅ Integration examples

**Ready to use!** 🎉
