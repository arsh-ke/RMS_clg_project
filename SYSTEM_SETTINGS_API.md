# System Settings API Documentation

## Overview
The System Settings module provides a centralized configuration system for managing restaurant behavior dynamically without code modifications. Only admin users can modify settings.

---

## API Endpoints

### 1. Get All System Settings
**Endpoint:** `GET /api/settings`  
**Authentication:** Not required (but returns public data)  
**Authorization:** None required for reading  
**Rate Limit:** 200 requests / 15 minutes

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Settings retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "restaurant": {
      "name": "NEXA EATS",
      "address": "123 Main St",
      "phone": "+1-800-123-4567",
      "email": "info@nexaeats.com",
      "gstNumber": "18AABCT1234A1Z0",
      "currency": "INR",
      "website": "https://nexaeats.com"
    },
    "financial": {
      "taxPercent": 18,
      "serviceChargePercent": 5,
      "discountLimit": 50
    },
    "orders": {
      "autoCompleteAfterPayment": true,
      "allowCancelAfterPreparing": false,
      "allowCancelAfterServing": false,
      "autoFreeTableAfterBilling": true,
      "defaultOrderStatus": "pending",
      "orderTimeLimitMinutes": 120
    },
    "notifications": {
      "kitchenSoundEnabled": true,
      "kitchenSoundVolume": 85,
      "lowStockAlertEnabled": true,
      "emailReportEnabled": false,
      "reportEmailAddress": "admin@nexaeats.com",
      "dailyReportTime": "09:00",
      "notificationRetentionDays": 30
    },
    "inventory": {
      "defaultLowStockThreshold": 10,
      "autoInventoryDeductionEnabled": true,
      "measurementUnits": ["kg", "ltr", "piece", "pack", "box"],
      "enableWasteTracking": true,
      "enableSupplierTracking": true
    },
    "tables": {
      "defaultTableCapacity": 4,
      "enableQR": true,
      "enableReservation": true
    },
    "updatedBy": "507f1f77bcf86cd799439012",
    "lastModified": "2024-01-15T10:30:00Z",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### 2. Get Specific Settings Section
**Endpoint:** `GET /api/settings/:section`  
**Authentication:** Not required  
**Valid Sections:** 
- `restaurant`
- `financial`
- `roles`
- `orders`
- `notifications`
- `inventory`
- `tables`

**Example:** `GET /api/settings/financial`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "financial settings retrieved successfully",
  "data": {
    "financial": {
      "taxPercent": 18,
      "serviceChargePercent": 5,
      "discountLimit": 50
    }
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Invalid section. Valid sections are: restaurant, financial, roles, orders, notifications, inventory, tables"
}
```

---

### 3. Update System Settings
**Endpoint:** `PUT /api/settings`  
**Authentication:** Required (Bearer token)  
**Authorization:** Admin only  
**Rate Limit:** 200 requests / 15 minutes

**Request Body (all sections optional):**
```json
{
  "restaurant": {
    "name": "NEXA EATS Premium",
    "phone": "+1-800-987-6543",
    "taxPercent": 18
  },
  "financial": {
    "taxPercent": 18,
    "serviceChargePercent": 5,
    "discountLimit": 50
  },
  "orders": {
    "autoCompleteAfterPayment": true,
    "allowCancelAfterPreparing": false
  },
  "notifications": {
    "kitchenSoundEnabled": true,
    "kitchenSoundVolume": 90
  },
  "inventory": {
    "defaultLowStockThreshold": 15,
    "autoInventoryDeductionEnabled": true
  },
  "tables": {
    "defaultTableCapacity": 6,
    "enableQR": true
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Settings updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "restaurant": { ... },
    "financial": { ... },
    "orders": { ... },
    "notifications": { ... },
    "inventory": { ... },
    "tables": { ... },
    "updatedBy": "507f1f77bcf86cd799439012",
    "lastModified": "2024-01-15T11:45:00Z"
  }
}
```

**Error Responses:**

401 Unauthorized - No token provided:
```json
{
  "success": false,
  "message": "Not authorized to access this route"
}
```

403 Forbidden - Non-admin user:
```json
{
  "success": false,
  "message": "Role staff is not authorized to access this route"
}
```

400 Bad Request - Invalid values:
```json
{
  "success": false,
  "message": "Tax percent must be between 0 and 100"
}
```

---

### 4. Reset Settings to Defaults
**Endpoint:** `POST /api/settings/reset`  
**Authentication:** Required (Bearer token)  
**Authorization:** Admin only  
**Warning:** ⚠️ DANGEROUS - This cannot be undone!

**Request Body:**
```json
{
  "confirm": true
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Settings reset to defaults",
  "data": { ... }
}
```

---

## Default Settings

When no settings document exists, the system automatically creates one with these defaults:

```javascript
{
  restaurant: {
    name: 'NEXA EATS',
    address: '',
    phone: '',
    email: '',
    gstNumber: '',
    currency: 'INR',
    website: ''
  },
  financial: {
    taxPercent: 0,
    serviceChargePercent: 0,
    discountLimit: 100
  },
  orders: {
    autoCompleteAfterPayment: true,
    allowCancelAfterPreparing: false,
    allowCancelAfterServing: false,
    autoFreeTableAfterBilling: true,
    defaultOrderStatus: 'pending',
    orderTimeLimitMinutes: 120
  },
  notifications: {
    kitchenSoundEnabled: true,
    kitchenSoundVolume: 80,
    lowStockAlertEnabled: true,
    emailReportEnabled: false,
    reportEmailAddress: '',
    dailyReportTime: '09:00',
    notificationRetentionDays: 30
  },
  inventory: {
    defaultLowStockThreshold: 10,
    autoInventoryDeductionEnabled: true,
    measurementUnits: ['kg', 'ltr', 'piece', 'pack', 'box'],
    enableWasteTracking: true,
    enableSupplierTracking: true
  },
  tables: {
    defaultTableCapacity: 4,
    enableQR: true,
    enableReservation: true
  }
}
```

---

## Validation Rules

### Financial Settings
- `taxPercent`: 0-100 (%)
- `serviceChargePercent`: 0-100 (%)
- `discountLimit`: >= 0

### Notification Settings
- `kitchenSoundVolume`: 0-100 (%)
- `notificationRetentionDays`: >= 0
- `dailyReportTime`: Valid time format (HH:MM)

### Inventory Settings
- `defaultLowStockThreshold`: >= 0
- `measurementUnits`: Array of strings

### Table Settings
- `defaultTableCapacity`: >= 1

---

## Usage Examples

### cURL

```bash
# Get all settings
curl -X GET http://localhost:8001/api/settings

# Get specific section
curl -X GET http://localhost:8001/api/settings/financial

# Update settings (requires admin token)
curl -X PUT http://localhost:8001/api/settings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "financial": {
      "taxPercent": 18,
      "serviceChargePercent": 5
    }
  }'

# Reset settings (requires admin token)
curl -X POST http://localhost:8001/api/settings/reset \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"confirm": true}'
```

### JavaScript/Fetch

```javascript
// Get settings
async function getSettings() {
  const response = await fetch('/api/settings');
  return response.json();
}

// Update settings
async function updateSettings(data) {
  const token = localStorage.getItem('accessToken');
  const response = await fetch('/api/settings', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  return response.json();
}

// Example usage
const result = await updateSettings({
  financial: {
    taxPercent: 18,
    serviceChargePercent: 5
  }
});
```

### Python/Requests

```python
import requests

BASE_URL = "http://localhost:8001/api"
TOKEN = "your_admin_token"

# Get settings
response = requests.get(f"{BASE_URL}/settings")
settings = response.json()

# Update settings
headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

data = {
    "financial": {
        "taxPercent": 18,
        "serviceChargePercent": 5
    }
}

response = requests.put(
    f"{BASE_URL}/settings",
    json=data,
    headers=headers
)
result = response.json()
```

---

## Error Handling

All endpoints return standard error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message (development only)"
}
```

**Common HTTP Status Codes:**
- `200 OK` - Successful GET/PUT
- `201 Created` - Successful POST
- `400 Bad Request` - Invalid input/validation error
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - User role not authorized
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## Best Practices

1. **Cache Settings**: Fetch settings once on app load and store in React Context
2. **Validate Client-Side**: Validate inputs in UI before API call
3. **Handle Errors**: Always handle API errors gracefully
4. **Monitor Updates**: Log who updates settings and when
5. **Test Changes**: Test settings in development before production
6. **Backup Settings**: Keep backups of important settings configurations
7. **Gradual Rollout**: Test new settings with limited users first

---

## Security

- ✅ Only admin users can modify settings
- ✅ All updates are logged with user ID and timestamp
- ✅ Settings are stored in MongoDB (single document)
- ✅ JWT authentication required for modifications
- ✅ Rate limiting applied to prevent abuse
- ✅ Input validation on all numeric/enum fields

---

## Integration Checklist

When integrating settings into a module:

- [ ] Import SystemSettings model in controller
- [ ] Fetch settings at the beginning of the operation
- [ ] Use settings values instead of hardcoded values
- [ ] Handle cases where settings might be null
- [ ] Log important setting-dependent actions
- [ ] Test with different setting values
- [ ] Update frontend to reflect setting changes
- [ ] Document setting usage in module comments
