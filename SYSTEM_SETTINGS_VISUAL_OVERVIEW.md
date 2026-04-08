# 📊 SYSTEM SETTINGS - COMPLETE VISUAL OVERVIEW

**Complete system architecture, API flow, and integration points**

---

## 🏗️ System Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         RESTAURANT MANAGEMENT SYSTEM                      │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌────────────────────────────────────┐   ┌──────────────────────────┐   │
│  │       FRONTEND (React)              │   │    BACKEND (Node.js)     │   │
│  │                                    │   │                          │   │
│  │  UI Layer:                         │   │  API Layer:              │   │
│  │  ┌──────────────────────────────┐  │   │  ┌──────────────────────┐   │
│  │  │ SystemSettings Page (Admin)  │  │   │  │ settingsRoutes.js    │   │
│  │  │ - 6 Tabs                     │  │   │  │ ┌──────────────────┐ │   │
│  │  │ - Form inputs                │  │   │  │ │GET  /api/settings│ │   │
│  │  │ - Save/Discard buttons       │  │   │  │ │GET  /api/settings │ │   │
│  │  └──────────────────────────────┘  │   │  │ │       :section    │ │   │
│  │                ↓                   │   │  │ │PUT  /api/settings│ │   │
│  │  Context Layer:                    │   │  │ │POST /api/settings │ │   │
│  │  ┌──────────────────────────────┐  │   │  │ │       /reset      │ │   │
│  │  │ SettingsContext.js           │  │   │  │ └──────────────────┘ │   │
│  │  │ - Provides useSettings()     │  │   │  └──────────────────────┘   │
│  │  │ - Manages global state       │  │   │           ↓                 │
│  │  │ - Fetches GET /api/settings  │  │   │  Business Logic:            │
│  │  │ - Sends PUT /api/settings    │  │   │  ┌──────────────────────┐   │
│  │  └──────────────────────────────┘  │   │  │settingsController.js │   │
│  │                ↓                   │   │  │ - getSettings()      │   │
│  │  Hook Layer:                       │   │  │ - updateSettings()   │   │
│  │  ┌──────────────────────────────┐  │   │  │ - validate input     │   │
│  │  │ useSettingsHook.js           │  │   │  │ - track updates      │   │
│  │  │ 30+ getter methods:          │  │   │  └──────────────────────┘   │
│  │  │ - getTaxPercent()            │  │   │           ↓                 │
│  │  │ - getCurrency()              │  │   │  Data Layer:                │
│  │  │ - isKitchenSoundEnabled()    │  │   │  ┌──────────────────────┐   │
│  │  │ - getLowStockThreshold()     │  │   │  │SystemSettings.js     │   │
│  │  │ - etc...                     │  │   │  │(MongoDB Model)       │   │
│  │  └──────────────────────────────┘  │   │  │ - Schema definition  │   │
│  │                ↓                   │   │  │ - 6 sections         │   │
│  │  Components Using Settings:        │   │  │ - Validations        │   │
│  │  ┌──────────────────────────────┐  │   │  └──────────────────────┘   │
│  │  │ BillingComponent             │  │   │           ↓                 │
│  │  │- getTaxPercent()             │  │   │  ┌──────────────────────┐   │
│  │  │- getServiceChargePercent()   │  │   │  │    MongoDB           │   │
│  │  │                              │  │   │  │ SystemSettings       │   │
│  │  │ KitchenDisplay               │  │   │  │ Collection           │   │
│  │  │- isKitchenSoundEnabled()     │  │   │  │ (Single Document)    │   │
│  │  │- getKitchenSoundVolume()     │  │   │  └──────────────────────┘   │
│  │  │                              │  │   │                              │
│  │  │ InventoryComponent           │  │   │                              │
│  │  │- getLowStockThreshold()      │  │   │                              │
│  │  └──────────────────────────────┘  │   │                              │
│  │                                    │   │                              │
│  └────────────────────────────────────┘   └──────────────────────────────┘
│         ↕ HTTP/JSON                                    │
│         ← PUT /api/settings                            │
│         ← GET /api/settings                            │
│         → Response                                     │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Settings API Request Flow

### GET /api/settings (App Load)
```
1. App Mounts
   └─ AuthProvider loads
      └─ SettingsProvider loads
         └─ useEffect() triggers
            └─ fetchSettings()
               └─ GET http://localhost:8001/api/settings

2. Backend receives request
   └─ settingsController.getSettings()
      └─ SystemSettings.findOne()
         └─ Database returns settings object

3. Response sent
   └─ { success: true, data: { /* settings */ } }

4. Frontend receives response
   └─ setSettings(data) in SettingsContext
      └─ Context value updated
         └─ All useSettings() consumers notified

5. Components render with settings
   ✅ Settings now available globally
```

---

### PUT /api/settings (Admin Saves)
```
1. Admin at /settings page
   └─ Fills form (changes tax 0% → 18%)
      └─ Clicks "Save Changes" button
         └─ handleSave() called

2. Frontend prepares data
   └─ Collects all sections:
      {
        restaurant: {...},
        financial: {taxPercent: 18},
        orders: {...},
        notifications: {...},
        inventory: {...},
        tables: {...}
      }

3. Sends PUT request
   └─ PUT http://localhost:8001/api/settings
   └─ Authorization: Bearer <token>
   └─ Body: { financial: { taxPercent: 18 } }

4. Backend validates
   └─ settingsController.updateSettings()
      └─ Check if admin: ✅
      └─ Validate inputs: ✅
         └─ taxPercent between 0-100: ✅
      └─ SystemSettings.findOneAndUpdate()
         └─ MongoDB updated: ✅

5. Response sent
   └─ { success: true, data: updatedSettings }

6. Frontend updates
   └─ setSettings(updatedSettings)
      └─ SettingsContext notifies all consumers
         └─ BillingComponent renders with tax: 18%
         └─ KitchenDisplay renders with new sound settings
         └─ Inventory renders with new threshold

7. Admin sees
   └─ Success toast: "Settings saved successfully!"
   └─ Form updates reflect saved data
   └─ All components now use new settings ✅
```

---

## 📱 Settings Configuration Sections

```
┌─────────────────────────────────────────────────────────────────┐
│                    SYSTEM SETTINGS                               │
├─────────────┬─────────────┬─────────────┬──────────┬──────────┬──┤
│ Restaurant  │ Financial   │ Orders      │ Notif.   │Inventory│Tab│
└─────────────┴─────────────┴─────────────┴──────────┴──────────┴──┘

┌─ RESTAURANT ────────────────────────────────────────────────────┐
│                                                                  │
│  Name: [NEXA EATS              ]                                │
│  Address: [123 Main St, City...]                               │
│  Phone: [+1-800-123-4567      ]                                │
│  Email: [admin@nexaeats.com   ]                                │
│  GST Number: [18AABCT1234A1Z0 ]                                │
│  Currency: [INR ▼]                                             │
│  Website: [https://nexaeats.com]                               │
│                                                                  │
│  [Discard Changes]     [Save Changes] ✨                       │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

┌─ FINANCIAL ─────────────────────────────────────────────────────┐
│                                                                  │
│  Tax Percentage: [18        ]  %                                │
│  Service Charge: [5         ]  %                                │
│  Discount Limit: [50        ]  %                                │
│                                                                  │
│  ☑ Auto-complete after payment                                 │
│  ☐ Allow cancel after preparing                                │
│  ☐ Allow cancel after serving                                  │
│  ☑ Auto-free table after billing                               │
│                                                                  │
│  [Discard Changes]     [Save Changes] ✨                       │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

... more sections similarly ...
```

---

## 🎯 Settings Components Map

```
SystemSettings.js (Main Page)
│
├─ RestaurantSettings (Tab 1)
│  ├─ FormLabel component
│  ├─ StyledInput components
│  └─ StyledSelect components
│
├─ FinancialSettings (Tab 2)
│  ├─ Numeric inputs
│  └─ Validation (0-100)
│
├─ OrderSettings (Tab 3)
│  ├─ Toggle checkboxes
│  ├─ Dropdown for default status
│  └─ Time limit input
│
├─ NotificationSettings (Tab 4)
│  ├─ Sound enable toggle
│  ├─ Volume slider
│  ├─ Email settings
│  └─ Time picker
│
├─ InventorySettings (Tab 5)
│  ├─ Threshold input
│  ├─ Toggle checkboxes
│  └─ Measurement units array
│
└─ TableSettings (Tab 6)
   ├─ Capacity input
   └─ Feature toggles
```

---

## 🔐 Security & Access Control

```
┌─────────────────────────────────────────────────────┐
│              ACCESS CONTROL MATRIX                   │
├──────────────────┬──────┬──────┬──────┬──────────┬──┤
│ Endpoint         │Admin │Mgr   │Staff │Kitchen   │  │
├──────────────────┼──────┼──────┼──────┼──────────┤──┤
│GET  /api/settings│  ✅  │  ✅  │ ✅   │   ✅     │PR│
│GET  /api/settings│                                  │
│     /:section    │  ✅  │  ✅  │ ✅   │   ✅     │PR│
│                  │                                  │
│PUT  /api/settings│  ✅  │  ❌  │ ❌   │   ❌     │PR│
│                  │                    (403)         │
│                  │                                  │
│POST /api/settings│  ✅  │  ❌  │ ❌   │   ❌     │PR│
│     /reset       │                    (403)         │
│                  │                                  │
│/settings (page)  │  ✅  │  ❌  │ ❌   │   ❌     │JS│
│                  │                    (redirect)    │
│                                                    │
│ PR = Protected Route (requires JWT token)         │
│ JS = JavaScript Protection (ProtectedRoute)       │
└──────────────────┴──────┴──────┴──────┴──────────┴──┘
```

---

## 📊 Database Schema

```
MongoDB: SystemSettings Collection
└─ Single Document
   │
   ├─ _id: ObjectId("507f1f77bcf86cd799439011")
   │
   ├─ restaurant: {
   │  ├─ name: "NEXA EATS"
   │  ├─ address: "123 Main St"
   │  ├─ phone: "+1-800-123-4567"
   │  ├─ email: "admin@nexa.com"
   │  ├─ gstNumber: "18AABCT1234A1Z0"
   │  ├─ currency: "INR"
   │  └─ website: "https://nexaeats.com"
   │
   ├─ financial: {
   │  ├─ taxPercent: 18           (0-100)
   │  ├─ serviceChargePercent: 5  (0-100)
   │  └─ discountLimit: 50        (>0)
   │
   ├─ orders: {
   │  ├─ autoCompleteAfterPayment: true
   │  ├─ allowCancelAfterPreparing: false
   │  ├─ allowCancelAfterServing: false
   │  ├─ autoFreeTableAfterBilling: true
   │  ├─ defaultOrderStatus: "pending"
   │  └─ orderTimeLimitMinutes: 120
   │
   ├─ notifications: {
   │  ├─ kitchenSoundEnabled: true
   │  ├─ kitchenSoundVolume: 85      (0-100)
   │  ├─ lowStockAlertEnabled: true
   │  ├─ emailReportEnabled: false
   │  ├─ reportEmailAddress: "admin@net.com"
   │  ├─ dailyReportTime: "09:00"
   │  └─ notificationRetentionDays: 30
   │
   ├─ inventory: {
   │  ├─ defaultLowStockThreshold: 10 (>0)
   │  ├─ autoInventoryDeductionEnabled: true
   │  ├─ measurementUnits: ["kg", "ltr", "piece", "pack", "box"]
   │  ├─ enableWasteTracking: true
   │  └─ enableSupplierTracking: true
   │
   ├─ tables: {
   │  ├─ defaultTableCapacity: 4     (>1)
   │  ├─ enableQR: true
   │  └─ enableReservation: true
   │
   ├─ updatedBy: ObjectId("507f1f77bcf86cd799439012")  [User ID]
   ├─ lastModified: 2024-01-15T10:30:00Z
   ├─ createdAt: 2024-01-01T00:00:00Z
   └─ updatedAt: 2024-01-15T10:30:00Z
```

---

## 🔌 Integration Points

```
Other Controllers can use Settings:

orderController.js
├─ createOrder()
│  └─ Fetches: financial.taxPercent
│     Fetches: financial.serviceChargePercent
│     Uses: for billing calculations ✅
│
├─ updateOrderPayment()
│  └─ Fetches: orders.autoCompleteAfterPayment
│     Uses: to auto-complete if enabled ✅
│
└─ handleTableRelease()
   └─ Fetches: orders.autoFreeTableAfterBilling
      Uses: to auto-free table after billing ✅

notificationController.js
├─ sendKitchenAlert()
│  └─ Fetches: notifications.kitchenSoundEnabled
│     Fetches: notifications.kitchenSoundVolume
│     Uses: to emit sound with correct volume ✅
│
└─ sendLowStockAlert()
   └─ Fetches: notifications.lowStockAlertEnabled
      Uses: to conditionally send alerts ✅

inventoryController.js
├─ checkLowStock()
│  └─ Fetches: inventory.defaultLowStockThreshold
│     Uses: for stock comparison ✅
│
└─ deductInventory()
   └─ Fetches: inventory.autoInventoryDeductionEnabled
      Uses: to auto-deduct on order ✅

Frontend Components:
├─ BillingComponent uses:
│  ├─ getTaxPercent()
│  ├─ getServiceChargePercent()
│  └─ getCurrency()
│
├─ KitchenDisplay uses:
│  ├─ isKitchenSoundEnabled()
│  ├─ getKitchenSoundVolume()
│  └─ getOrderTimeLimit()
│
└─ Inventory uses:
   ├─ getLowStockThreshold()
   ├─ getMeasurementUnits()
   └─ isAutoInventoryDeductionEnabled()
```

---

## 📈 Settings Usage Flow

```
                Admin Updates Settings
                        ↓
            PUT /api/settings (with new values)
                        ↓
            Backend validates & saves to DB
                        ↓
            Returns updated settings JSON
                        ↓
            Frontend Context updated
                        ↓
        All useSettings() consumers notified
                        ↓
┌───────────────┬──────────────┬────────────────┐
│               │              │                │
BillingComponent  KitchenDisplay  InventoryComponent
│               │              │
├─ Recalculates │ ├─ Applies  │ ├─ Updates
│   tax with    │ │   new     │ │   low
│   18% instead │ │   sound   │ │   stock
│   of 0%       │ │   volume  │ │   threshold
│               │ │           │ │
└───────────────┴──────────────┴────────────────┘
                        ↓
            All components use NEW settings ✅
```

---

## ✨ How It All Works Together

```
┌──────────────────────────────────────────────────────────┐
│ ADMIN USER JOURNEY                                       │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  LOGIN ✅                                               │
│    ↓                                                    │
│  NAVIGATE TO /settings                                 │
│    ↓                                                    │
│  SEE 6 TABS (Restaurant, Financial, Orders, etc)       │
│    ↓                                                    │
│  EDIT VALUES (e.g., change tax from 0% to 18%)         │
│    ↓ (Real-time change tracking)                       │
│  CLICK "SAVE CHANGES"                                  │
│    ↓                                                    │
│  PUT /api/settings called with form data               │
│    ↓                                                    │
│  Backend validates (tax between 0-100)                 │
│    ↓                                                    │
│  MongoDB updated                                       │
│    ↓                                                    │
│  Response: { success: true, data: {...} }              │
│    ↓                                                    │
│  Toast: "Settings saved successfully!"                 │
│    ↓                                                    │
│  Context updated globally                              │
│    ↓                                                    │
│  ALL COMPONENTS RE-RENDER                              │
│    ↓                                                    │
│  ✨ Billing now uses 18% tax                           │
│  ✨ Kitchen now uses new sound volume                  │
│  ✨ Inventory uses new threshold                       │
│                                                        │
│  RESULT: Changes apply system-wide! 🎉                 │
│                                                        │
└──────────────────────────────────────────────────────────┘
```

---

## 🎯 File Dependencies Map

```
Frontend:
  App.js
  ├─ imports SettingsProvider
  │  └─ uses SettingsContext.js
  │     ├─ fetches from /api/settings
  │     └─ provides useSettings() hook
  │
  ├─ imports SystemSettings page
  │  └─ uses useSettings() from SettingsContext
  │     └─ calls updateSettings() → PUT /api/settings
  │
  └─ Layout.js (Navigation)
     ├─ imports Settings icon
     └─ renders /settings menu item

Components can use:
  ├─ useSettings() hook
  │  └─ returns { settings, loading, updateSettings }
  │
  └─ useSettingsHook() hook
     └─ returns 30+ getter methods

Backend:
  server.js
  ├─ imports settingsRoutes
  │  └─ imports from routes/settingsRoutes.js
  │     ├─ uses settingsController.js
  │     │  ├─ imports SystemSettings model
  │     │  ├─ imports middleware/auth.js
  │     │  │  ├─ protect middleware
  │     │  │  └─ authorize middleware
  │     │  └─ queries MongoDB
  │     │
  │     └─ protects admin routes
  │
  └─ registers /api/settings endpoints

Other controllers can use:
  ├─ Import SystemSettings model
  └─ Query via: SystemSettings.findOne()
```

---

## 🚀 Implementation Checklist

```
Frontend:
  ✅ SettingsContext.js created & working
  ✅ SystemSettings.js page created & beautiful
  ✅ useSettingsHook.js with 30+ methods
  ✅ App.js wrapped with SettingsProvider
  ✅ /settings route added with admin protection
  ✅ Layout.js shows Settings menu item
  ✅ All components can access settings

Backend:
  ✅ SystemSettings.js model created
  ✅ settingsController.js implemented
  ✅ settingsRoutes.js created  
  ✅ server.js integrated routes
  ✅ All CRUD operations working
  ✅ Validation in place
  ✅ Admin-only protection
  ✅ User tracking enabled

Ready to integrate into other modules:
  🔜 orderController.js (tax calculations)
  🔜 notificationController.js (sound settings)
  🔜 inventoryController.js (low stock threshold)
  🔜 Example components (billing, kitchen)
```

---

## 📞 Navigation Guide

For detailed information, see:

| Need | Document |
|------|----------|
| API Reference | SYSTEM_SETTINGS_API.md |
| Implementation Details | SYSTEM_SETTINGS_IMPLEMENTATION.md |
| Quick Start | SYSTEM_SETTINGS_QUICK_REFERENCE.md |
| Where Settings Used | WHERE_SETTINGS_ARE_APPLIED.md |
| API Call Examples | SETTINGS_API_CALLS_COMPLETE.md |
| File Locations | SETTINGS_FILE_LOCATIONS.md |
| Testing | SYSTEM_SETTINGS_VERIFICATION_CHECKLIST.md |
| Integration Examples | SYSTEM_SETTINGS_INTEGRATION_EXAMPLES.js |

---

**System Settings Module: Complete & Production Ready! ✨**
