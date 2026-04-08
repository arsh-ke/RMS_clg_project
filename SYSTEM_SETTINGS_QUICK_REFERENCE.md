# 🚀 System Settings - Quick Reference Guide

## ⚡ 30-Second Overview

The System Settings module is a production-ready configuration system that allows admins to configure restaurants dynamically without touching code.

---

## 📍 Where to Find Everything

| Component | Location |
|-----------|----------|
| **MongoDB Model** | `backend/src/models/SystemSettings.js` |
| **Controller** | `backend/src/controllers/settingsController.js` |
| **Routes** | `backend/src/routes/settingsRoutes.js` |
| **React Context** | `frontend/src/context/SettingsContext.js` |
| **Settings Page** | `frontend/src/pages/SystemSettings.js` |
| **Custom Hook** | `frontend/src/hooks/useSettingsHook.js` |
| **API Docs** | `SYSTEM_SETTINGS_API.md` |
| **Examples** | `SYSTEM_SETTINGS_INTEGRATION_EXAMPLES.js` |
| **Full Guide** | `SYSTEM_SETTINGS_IMPLEMENTATION.md` |

---

## 🎮 Access Settings

**URL:** `http://localhost:3000/settings`  
**Access:** Admin only  
**Navigation:** Click "Settings" in left sidebar

---

## 🔧 Configuration Sections (6 Tabs)

### 1️⃣ Restaurant
- Restaurant name, address, phone
- GST number, email
- Currency selection
- Website URL

### 2️⃣ Financial
- Tax percentage (0-100%)
- Service charge (0-100%)
- Discount limit

### 3️⃣ Orders
- Auto-complete after payment ✓/✗
- Allow cancel after preparing ✓/✗
- Allow cancel after serving ✓/✗
- Auto-free table after billing ✓/✗
- Default order status
- Order time limit (minutes)

### 4️⃣ Notifications
- Kitchen sound enabled ✓/✗
- Kitchen sound volume (0-100%)
- Low stock alert ✓/✗
- Email report enabled ✓/✗
- Report email address
- Daily report time (HH:MM)
- Notification retention (days)

### 5️⃣ Inventory
- Auto-deduction on order ✓/✗
- Default low stock threshold
- Enable waste tracking ✓/✗
- Enable supplier tracking ✓/✗
- Measurement units array

### 6️⃣ Tables
- Default table capacity
- Enable QR codes ✓/✗
- Enable reservations ✓/✗

---

## 🔌 API Endpoints

```bash
# Get all settings (public)
GET /api/settings

# Get specific section
GET /api/settings/financial

# Update settings (admin only)
PUT /api/settings
Authorization: Bearer <token>

# Reset to defaults (admin only)
POST /api/settings/reset
Authorization: Bearer <token>
```

---

## 💻 Usage in Code

### Backend (Use Settings in Logic)

```javascript
// Import
const SystemSettings = require('../models/SystemSettings');

// In your controller
const settings = await SystemSettings.findOne();
const taxPercent = settings?.financial?.taxPercent || 0;
const lowStockThreshold = settings?.inventory?.defaultLowStockThreshold || 10;

// Use it
const tax = subtotal * (taxPercent / 100);
const hasLowStock = itemQuantity < lowStockThreshold;
```

### Frontend (Use Hook in Components)

```javascript
// Import
import useSettingsHook from '../hooks/useSettingsHook';

// In your component
function MyComponent() {
  const {
    getTaxPercent,
    getServiceChargePercent,
    isKitchenSoundEnabled,
    getLowStockThreshold,
    getCurrency
  } = useSettingsHook();

  return (
    <div>
      <p>Tax: {getTaxPercent()}%</p>
      <p>Currency: {getCurrency()}</p>
      <p>Sound: {isKitchenSoundEnabled() ? '🔊 On' : '🔇 Off'}</p>
    </div>
  );
}
```

---

## 🪝 All Available Hooks (30+ Methods)

### Restaurant Methods
```javascript
getRestaurantName()
getRestaurantPhone()
getRestaurantAddress()
getCurrency()
```

### Financial Methods
```javascript
getTaxPercent()
getServiceChargePercent()
getMaxDiscount()
```

### Order Methods
```javascript
isAutoCompleteAfterPayment()
isAllowCancelAfterPreparing()
isAllowCancelAfterServing()
isAutoFreeTableAfterBilling()
getDefaultOrderStatus()
getOrderTimeLimit()
```

### Notification Methods
```javascript
isKitchenSoundEnabled()
getKitchenSoundVolume()
isLowStockAlertEnabled()
isEmailReportEnabled()
getReportEmailAddress()
getDailyReportTime()
getNotificationRetentionDays()
```

### Inventory Methods
```javascript
getLowStockThreshold()
isAutoInventoryDeductionEnabled()
getMeasurementUnits()
isWasteTrackingEnabled()
isSupplierTrackingEnabled()
```

### Table Methods
```javascript
getDefaultTableCapacity()
isQRCodeEnabled()
isReservationEnabled()
```

---

## 🔒 Security Rules

| Role | Can Read | Can Write |
|------|----------|-----------|
| Admin | ✅ | ✅ |
| Manager | ✅ | ❌ |
| Staff | ✅ | ❌ |
| Kitchen | ✅ | ❌ |

---

## 📝 Workflow Example

### Admin Configures Tax Rate

1. **Admin logs in** → Navigate to `/settings`
2. **Click "Financial" tab**
3. **Change "Tax Percentage"** from 0% to 18%
4. **Click "Save Changes"** button
5. **See success toast:** "Settings saved successfully!"
6. **Billing system automatically uses 18% tax** ✨

### No code change needed!

---

## 🎯 In 5 Minutes

```javascript
// 1. Import hook
import useSettingsHook from '../hooks/useSettingsHook';

// 2. Use in component
const { getTaxPercent, getCurrency } = useSettingsHook();

// 3. Display/use setting
console.log(`Tax: ${getTaxPercent()}%`);
console.log(`Currency: ${getCurrency()}`);

// ✨ That's it! Settings are now dynamic!
```

---

## 📊 Data Flow

```
Admin Changes Setting
         ↓
   Clicks "Save"
         ↓
   PUT /api/settings
         ↓
   Backend validates
         ↓
   Save to MongoDB
         ↓
   Context updates
         ↓
   All components refresh
         ↓
   Billing uses new tax rate! 🎉
```

---

## ⚡ Common Patterns

### Pattern 1: Feature Flag
```javascript
if (isAutoCompleteAfterPayment()) {
  // Auto-complete the order
}
```

### Pattern 2: Dynamic Calculation
```javascript
const tax = subtotal * (getTaxPercent() / 100);
const serviceCharge = subtotal * (getServiceChargePercent() / 100);
```

### Pattern 3: Threshold Check
```javascript
if (itemQuantity < getLowStockThreshold()) {
  // Show low stock warning
}
```

### Pattern 4: Configuration Object
```javascript
const notificationConfig = {
  sound: isKitchenSoundEnabled(),
  volume: getKitchenSoundVolume(),
  retentionDays: getNotificationRetentionDays()
};
```

---

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Can't access settings | Login as admin |
| Changes don't save | Check network tab for errors |
| Settings not updating in UI | Hard refresh (Ctrl+Shift+R) |
| Settings undefined in component | Use `?.` optional chaining |
| Need default value | Use `|| defaultValue` |

---

## 📚 Full Documentation

- **API Reference:** `SYSTEM_SETTINGS_API.md` (20 pages)
- **Implementation Guide:** `SYSTEM_SETTINGS_IMPLEMENTATION.md` (25 pages)
- **Code Examples:** `SYSTEM_SETTINGS_INTEGRATION_EXAMPLES.js`
- **Complete Summary:** `SYSTEM_SETTINGS_SUMMARY.md`

---

## ✅ Checklist for Integration

When integrating settings into a module:

- [ ] Import SystemSettings in backend controller
- [ ] Fetch settings: `const settings = await SystemSettings.findOne();`
- [ ] Use settings instead of hardcoded values
- [ ] Import useSettingsHook in frontend component
- [ ] Call hook methods to get values
- [ ] Test with different settings values
- [ ] Document which settings your module uses

---

## 🎓 Learning Path

1. **Understand:** Read `SYSTEM_SETTINGS_SUMMARY.md` (5 mins)
2. **Navigate:** Go to `/settings` page and explore UI (5 mins)
3. **Implement:** Look at `SYSTEM_SETTINGS_INTEGRATION_EXAMPLES.js` (5 mins)
4. **Code:** Add settings to your module (10 mins)
5. **Test:** Change settings and see effect (5 mins)
6. **Reference:** Keep `SYSTEM_SETTINGS_API.md` handy

---

## 🚀 Production Checklist

- ✅ Settings initialized on first run
- ✅ Admin access protected
- ✅ Input validation implemented
- ✅ Error handling in place
- ✅ Frontend context wraps app
- ✅ Navigation menu updated
- ✅ Logging configured
- ✅ Rate limiting applied
- ✅ Documentation complete

---

## 💡 Pro Tips

1. **Cache settings** - Fetched once on app load
2. **Use optional chaining** - `settings?.financial?.taxPercent || 0`
3. **Handle nulls** - Always provide fallback values
4. **Log changes** - Track who changed what and when
5. **Test thoroughly** - Settings affect billing/inventory
6. **Version control** - Track setting changes
7. **Backup important** - Keep settings configuration backups

---

## 🎉 You're Ready!

The System Settings module is:
- ✨ **Complete** - All components implemented
- ✨ **Tested** - E2E flows working
- ✨ **Documented** - Comprehensive guides
- ✨ **Production-Ready** - Enterprise-grade
- ✨ **Extensible** - Easy to add new settings

**Start integrating today!** 🚀

---

## 📞 Need Help?

1. Check `SYSTEM_SETTINGS_IMPLEMENTATION.md` (full guide)
2. Look at `SYSTEM_SETTINGS_INTEGRATION_EXAMPLES.js` (code patterns)
3. Reference `SYSTEM_SETTINGS_API.md` (API details)
4. Check console logs for errors
5. Verify admin access and authentication
