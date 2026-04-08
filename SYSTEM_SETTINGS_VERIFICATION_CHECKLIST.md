# 🧪 System Settings - Verification Checklist

Run through these tests to verify the implementation is working correctly.

---

## ✅ Backend Verification

### 1. Model Creation
```javascript
// Test: Check if model exists
const SystemSettings = require('./backend/src/models/SystemSettings');
console.log(SystemSettings); // Should output: [Function]

// ✅ PASS: Module loads without error
```

### 2. Routes Registration
```bash
# Test: Check if routes are registered
curl http://localhost:8001/api/settings

# Expected Response:
# {
#   "success": true,
#   "message": "Settings retrieved successfully",
#   "data": { ... settings object ... }
# }

# ✅ PASS: Returns 200 with settings data
```

### 3. Default Settings Creation
```bash
# Test: First request creates defaults
curl http://localhost:8001/api/settings

# Check response includes:
# - restaurant.name = "NEXA EATS"
# - financial.taxPercent = 0
# - orders.autoCompleteAfterPayment = true
# - notifications.kitchenSoundEnabled = true

# ✅ PASS: Default values present
```

### 4. Get Specific Section
```bash
# Test: Fetch financial section only
curl http://localhost:8001/api/settings/financial

# Expected:
# {
#   "success": true,
#   "data": {
#     "financial": { taxPercent, serviceChargePercent, discountLimit }
#   }
# }

# ✅ PASS: Section returned correctly
```

### 5. Admin Update (Protected Route)
```bash
# Test: Update without token (should fail)
curl -X PUT http://localhost:8001/api/settings \
  -H "Content-Type: application/json" \
  -d '{"financial": {"taxPercent": 18}}'

# Expected: 401 Unauthorized
# ✅ PASS: Protected route requires token

# Test: Update with admin token
curl -X PUT http://localhost:8001/api/settings \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"financial": {"taxPercent": 18}}'

# Expected: 200 with updated settings
# ✅ PASS: Admin can update
```

### 6. Validation Testing
```bash
# Test: Invalid tax value (> 100)
curl -X PUT http://localhost:8001/api/settings \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"financial": {"taxPercent": 150}}'

# Expected: 400 Bad Request
# Message: "Tax percent must be between 0 and 100"
# ✅ PASS: Validation works
```

### 7. Permission Testing
```bash
# Test: Non-admin tries to update
curl -X PUT http://localhost:8001/api/settings \
  -H "Authorization: Bearer <STAFF_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"financial": {"taxPercent": 18}}'

# Expected: 403 Forbidden
# Message: "Role staff is not authorized to access this route"
# ✅ PASS: Authorization works
```

---

## ✅ Frontend Verification

### 1. Page Access
```
Test: Navigate to /settings
Expected: 
  - Page loads without errors
  - Shows 6 tabs: Restaurant, Financial, Orders, etc.
  - Settings form displays current values

✅ PASS: Settings page accessible
```

### 2. Admin-Only Route Protection
```
Test: Login as staff → Navigate to /settings
Expected:
  - Redirected to /dashboard
  - Cannot access settings page

✅ PASS: Route protected correctly
```

```
Test: Login as admin → Navigate to /settings
Expected:
  - Settings page loads successfully
  - All form fields visible

✅ PASS: Admin access granted
```

### 3. Tab Navigation
```
Test: Click each tab
Expected:
  - Restaurant tab: Shows name, address, phone fields
  - Financial tab: Shows tax %, service charge %
  - Orders tab: Shows checkboxes and dropdowns
  - Notifications tab: Shows sound, email settings
  - Inventory tab: Shows thresholds and toggles
  - Tables tab: Shows capacity and feature toggles

✅ PASS: All tabs render correctly
```

### 4. Form Input Validation
```
Test: Update Restaurant Name
  1. Change name to "New Restaurant"
  2. Click "Save Changes"
  Expected: Success toast appears

✅ PASS: Update works

Test: Invalid tax value
  1. Go to Financial tab
  2. Try to set Tax % to 150
  3. Blur field
  Expected: Validation error shows

✅ PASS: Validation works
```

### 5. Change Tracking
```
Test: Edit a field
Expected:
  - "Save Changes" button appears
  - "Discard Changes" button appears
  - Buttons in orange color

✅ PASS: Change tracking works

Test: Click "Discard Changes"
Expected:
  - Form resets to original values
  - Buttons disappear
  
✅ PASS: Discard works
```

### 6. Context Integration
```
Test: Open Console
  > const user = JSON.parse(localStorage.getItem('user'))
  > user.role === 'admin'

Expected: true

✅ PASS: User context available
```

### 7. Navigation Menu
```
Test: Check left sidebar
Expected:
  - "Settings" menu item visible (if admin)
  - Settings item has purple icon
  - Clicking Settings navigates to /settings

✅ PASS: Navigation menu updated
```

---

## ✅ Settings Context Verification

### 1. Context Provider Wrapping
```javascript
// In App.js, verify:
<BrowserRouter>
  <AuthProvider>
    <SettingsProvider>  {/* ← Should exist */}
      <SocketProvider>
        <AppRoutes />
      </SocketProvider>
    </SettingsProvider>
  </AuthProvider>
</BrowserRouter>

// ✅ PASS: SettingsProvider wraps app
```

### 2. Settings Hook Access
```javascript
// Test in a component:
import { useSettings } from '../context/SettingsContext';

function TestComponent() {
  const { settings, loading } = useSettings();
  
  console.log('Settings loaded:', !loading);
  console.log('Tax percent:', settings?.financial?.taxPercent);
}

// ✅ PASS: Hook works in components
```

### 3. Get Setting Value Method
```javascript
const { getSettingValue } = useSettings();

const tax = getSettingValue('financial.taxPercent');
const name = getSettingValue('restaurant.name');

console.log('Tax:', tax);
console.log('Name:', name);

// ✅ PASS: getSettingValue works
```

---

## ✅ useSettingsHook Verification

### 1. Hook Import
```javascript
import useSettingsHook from '../hooks/useSettingsHook';

// Should import without error
// ✅ PASS: Hook imports successfully
```

### 2. All Methods Available
```javascript
const settings = useSettingsHook();

// Test sample methods:
console.log(settings.getTaxPercent());           // Number
console.log(settings.getCurrency());              // String
console.log(settings.isKitchenSoundEnabled());   // Boolean
console.log(settings.getLowStockThreshold());    // Number

// ✅ PASS: All methods work
```

### 3. Return Values Are Correct
```javascript
// Test: After setting tax to 18%
const { getTaxPercent } = useSettingsHook();
console.log(getTaxPercent()); // Should output: 18

// ✅ PASS: Returns correct values
```

---

## ✅ Integration Testing

### 1. Settings Used in Billing
```javascript
// In order creation, verify tax calculation:
const { getTaxPercent } = useSettingsHook();
const tax = subtotal * (getTaxPercent() / 100);

// Change tax to 18%
// Create new order
// Verify tax = subtotal * 0.18

// ✅ PASS: Billing uses settings
```

### 2. Settings Update Triggers Re-render
```
Test:
1. Open billing/orders page
2. Go to Settings (new tab)
3. Update tax percentage
4. Go back to orders page
5. Create new order
6. Verify new tax rate applied

✅ PASS: Changes propagate instantly
```

### 3. No Hardcoded Values
```javascript
// Search codebase for hardcoded values:
// grep -r "const tax = 0.05"
// grep -r "const taxRate = 0.05"

// Should find 0 matches (all use settings)
// ✅ PASS: No hardcoded values
```

---

## ✅ Error Handling

### 1. Network Error Handling
```
Test: Disconnect internet → Try to fetch settings
Expected:
  - Error state shows
  - User sees error message
  - No crash

✅ PASS: Error handled gracefully
```

### 2. Invalid Data Handling
```
Test: MongoDB returns corrupt data
Expected:
  - Error logged to console
  - Fallback values used
  - App continues working

✅ PASS: Invalid data handled
```

### 3. Permission Denied
```
Test: Non-admin tries to update
Expected:
  - 403 response received
  - Error toast shown
  - Form doesn't update

✅ PASS: Permission error handled
```

---

## ✅ Performance Testing

### 1. Initial Load Time
```
Test: Open Settings page
Expected:
  - Page loads in < 2 seconds
  - No unnecessary re-renders
  - Form fields interactive

✅ PASS: Performance acceptable
```

### 2. Save Operation
```
Test: Click "Save Changes"
Expected:
  - Request sent quickly
  - Response received
  - Toast shown
  - Takes < 1 second total

✅ PASS: Save is responsive
```

### 3. Memory Usage
```
Test: Open/close Settings page multiple times
Expected:
  - No memory leaks
  - Memory returns to baseline
  - Context properly cleaned up

✅ PASS: No memory leaks
```

---

## ✅ Browser Compatibility

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile browsers

---

## ✅ Final Checklist

### Functionality
- [ ] GET /api/settings returns all settings
- [ ] GET /api/settings/:section returns section
- [ ] PUT /api/settings updates successfully
- [ ] Admin-only routes are protected
- [ ] Validation prevents invalid data
- [ ] Default settings created automatically

### Frontend
- [ ] Settings page loads
- [ ] All 6 tabs visible and functional
- [ ] Form inputs work
- [ ] Save/Discard buttons work
- [ ] Notifications display
- [ ] Mobile responsive

### Context & Hooks
- [ ] SettingsProvider wraps app
- [ ] useSettings hook works
- [ ] useSettingsHook hook works
- [ ] getSettingValue path resolution works
- [ ] All 30+ methods available

### Security
- [ ] Non-admin cannot access /api/settings PUT
- [ ] Non-admin cannot see Settings page
- [ ] JWT validation works
- [ ] User tracking works

### Documentation
- [ ] API docs complete
- [ ] Integration examples provided
- [ ] Implementation guide complete
- [ ] Quick reference available
- [ ] README has links

### Code Quality
- [ ] No console errors
- [ ] No console warnings
- [ ] Code follows conventions
- [ ] Proper error handling
- [ ] No hardcoded values

---

## 🎉 Final Verification

When all checkboxes above are checked:

✅ **System Settings Module is PRODUCTION READY**

---

## 📝 Test Report Template

```
Date: ___________
Tester: ___________
Environment: Development / Staging / Production

Backend Tests: ___/7 passed
Frontend Tests: ___/7 passed
Context Tests: ___/3 passed
Hook Tests: ___/3 passed
Integration Tests: ___/3 passed
Error Handling: ___/3 passed
Performance: ___/3 passed

Total: ___/33 tests passed

Issues Found:
- [ ] None
- [ ] Minor (non-blocking)
- [ ] Major (blocking)

Description:
_____________________________________________________________________

Status: _____ PASS / FAIL

Signed: ___________________
```

---

## 🚀 Deployment Go/No-Go

**✅ GO** - All tests passed, ready for production  
**⚠️ CONDITIONAL** - Minor issues, can deploy with caution  
**❌ NO-GO** - Major issues, do not deploy

---

**Keep this checklist for regression testing after future updates!**
