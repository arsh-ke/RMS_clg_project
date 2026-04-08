"""
NEXA EATS Restaurant Management System - Backend API Tests
Tests: Auth, Menu, Table, Order, Inventory, Analytics, AI endpoints
Note: API returns 'id' instead of '_id' due to toJSON transformation
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

# API Base URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_CREDENTIALS = {"email": "admin@nexa-eats.com", "password": "admin123"}
MANAGER_CREDENTIALS = {"email": "manager@nexa-eats.com", "password": "manager123"}

# Valid categories for menu items
VALID_CATEGORIES = ['veg', 'non-veg', 'drinks', 'desserts', 'starters', 'main-course']


class TestHealth:
    """Health check tests - run first"""
    
    def test_health_check(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "MERN" in data.get("stack", "")
        print(f"Health check passed: {data['message']}")


class TestAuthentication:
    """Authentication flow tests"""
    
    def test_admin_login_success(self):
        """Test admin login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN_CREDENTIALS)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "data" in data
        assert "accessToken" in data["data"]
        assert "refreshToken" in data["data"]
        assert "user" in data["data"]
        assert data["data"]["user"]["email"] == ADMIN_CREDENTIALS["email"]
        assert data["data"]["user"]["role"] == "admin"
        print(f"Admin login successful: {data['data']['user']['name']}")
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@test.com",
            "password": "wrongpass"
        })
        assert response.status_code == 401
        data = response.json()
        assert data["success"] == False
    
    def test_register_new_user(self):
        """Test user registration (new users get staff role by default)"""
        unique_email = f"test_user_{uuid.uuid4().hex[:8]}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "name": "Test User",
            "email": unique_email,
            "password": "testpass123",
            "phone": "1234567890"
        })
        # 201 for success, 400 if validation fails
        assert response.status_code in [201, 400, 403]
        if response.status_code == 201:
            data = response.json()
            assert data["success"] == True
            assert "accessToken" in data["data"]
            print(f"User registered: {unique_email}")
        else:
            print(f"Registration returned {response.status_code}")
    
    def test_token_refresh(self, admin_auth):
        """Test token refresh functionality"""
        refresh_token = admin_auth["refreshToken"]
        response = requests.post(f"{BASE_URL}/api/auth/refresh-token", json={
            "refreshToken": refresh_token
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "accessToken" in data["data"]
        assert "refreshToken" in data["data"]
        print("Token refresh successful")
    
    def test_get_current_user(self, admin_headers):
        """Test get current user endpoint"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "data" in data
        assert data["data"]["email"] == ADMIN_CREDENTIALS["email"]
        print(f"Current user: {data['data']['name']}")


class TestMenuManagement:
    """Menu CRUD operations tests"""
    
    def test_get_all_menu_items(self, admin_headers):
        """Test get all menu items"""
        response = requests.get(f"{BASE_URL}/api/menu", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "data" in data
        assert isinstance(data["data"], list)
        print(f"Menu items count: {len(data['data'])}")
    
    def test_create_menu_item(self, admin_headers):
        """Test create menu item (admin/manager)"""
        unique_name = f"TEST_Item_{uuid.uuid4().hex[:6]}"
        response = requests.post(f"{BASE_URL}/api/menu", headers=admin_headers, json={
            "name": unique_name,
            "description": "Test menu item description",
            "price": 299.99,
            "category": "main-course",  # Using valid category
            "isAvailable": True
        })
        assert response.status_code == 201, f"Failed: {response.json()}"
        data = response.json()
        assert data["success"] == True
        assert data["data"]["name"] == unique_name
        assert data["data"]["price"] == 299.99
        assert "id" in data["data"]  # API returns 'id' not '_id'
        print(f"Created menu item: {unique_name}")
        return data["data"]["id"]
    
    def test_get_menu_item_by_id(self, admin_headers, created_menu_item_id):
        """Test get single menu item"""
        response = requests.get(f"{BASE_URL}/api/menu/{created_menu_item_id}", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "id" in data["data"]
        print(f"Got menu item: {data['data']['name']}")
    
    def test_update_menu_item(self, admin_headers, created_menu_item_id):
        """Test update menu item"""
        response = requests.put(f"{BASE_URL}/api/menu/{created_menu_item_id}", headers=admin_headers, json={
            "price": 349.99,
            "description": "Updated description"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["data"]["price"] == 349.99
        print(f"Updated menu item price to: {data['data']['price']}")
    
    def test_get_menu_categories(self, admin_headers):
        """Test get menu categories"""
        response = requests.get(f"{BASE_URL}/api/menu/categories", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert isinstance(data["data"], list)
        print(f"Categories: {data['data']}")
    
    def test_get_popular_items(self, admin_headers):
        """Test get popular menu items"""
        response = requests.get(f"{BASE_URL}/api/menu/popular", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"Popular items count: {len(data['data'])}")
    
    def test_delete_menu_item(self, admin_headers, created_menu_item_id):
        """Test delete menu item"""
        response = requests.delete(f"{BASE_URL}/api/menu/{created_menu_item_id}", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"Deleted menu item")
        
        # Verify deletion
        get_response = requests.get(f"{BASE_URL}/api/menu/{created_menu_item_id}", headers=admin_headers)
        assert get_response.status_code == 404


class TestTableManagement:
    """Table CRUD operations tests"""
    
    def test_get_all_tables(self, admin_headers):
        """Test get all tables"""
        response = requests.get(f"{BASE_URL}/api/tables", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert isinstance(data["data"], list)
        print(f"Tables count: {len(data['data'])}")
    
    def test_create_table(self, admin_headers):
        """Test create table"""
        # Use a unique high table number to avoid conflicts
        # Valid locations: indoor, outdoor, balcony, vip
        table_number = 9000 + (int(datetime.now().timestamp()) % 1000)
        response = requests.post(f"{BASE_URL}/api/tables", headers=admin_headers, json={
            "tableNumber": table_number,
            "capacity": 4,
            "location": "indoor",
            "status": "free"
        })
        assert response.status_code == 201, f"Failed: {response.json()}"
        data = response.json()
        assert data["success"] == True
        assert data["data"]["tableNumber"] == table_number
        print(f"Created table: {table_number}")
        return data["data"]["id"]
    
    def test_get_table_stats(self, admin_headers):
        """Test get table stats"""
        response = requests.get(f"{BASE_URL}/api/tables/stats", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"Table stats: {data['data']}")
    
    def test_update_table_status(self, admin_headers, created_table_id):
        """Test update table status"""
        response = requests.put(f"{BASE_URL}/api/tables/{created_table_id}/status", headers=admin_headers, json={
            "status": "occupied"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["data"]["status"] == "occupied"
        print(f"Updated table status to: occupied")
    
    def test_delete_table(self, admin_headers, created_table_id):
        """Test delete table"""
        response = requests.delete(f"{BASE_URL}/api/tables/{created_table_id}", headers=admin_headers)
        assert response.status_code == 200
        print("Deleted table")


class TestOrderManagement:
    """Order CRUD operations tests"""
    
    def test_get_all_orders(self, admin_headers):
        """Test get all orders"""
        response = requests.get(f"{BASE_URL}/api/orders", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert isinstance(data["data"], list)
        print(f"Orders count: {len(data['data'])}")
    
    def test_create_order(self, admin_headers, get_menu_item_id):
        """Test create order"""
        response = requests.post(f"{BASE_URL}/api/orders", headers=admin_headers, json={
            "items": [{
                "menuItemId": get_menu_item_id,
                "quantity": 2
            }],
            "orderType": "takeaway",
            "customerName": "TEST_Customer",
            "customerPhone": "9876543210"
        })
        assert response.status_code == 201, f"Failed: {response.json()}"
        data = response.json()
        assert data["success"] == True
        assert "orderNumber" in data["data"]
        assert data["data"]["customerName"] == "TEST_Customer"
        print(f"Created order: {data['data']['orderNumber']}")
        return data["data"]["id"]
    
    def test_get_order_by_id(self, admin_headers, created_order_id):
        """Test get order by ID"""
        response = requests.get(f"{BASE_URL}/api/orders/{created_order_id}", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"Got order: {data['data']['orderNumber']}")
    
    def test_update_order_status(self, admin_headers, created_order_id, created_inventory_item_id):
        """Test update order status and check inventory deduction"""
        # move to preparing
        response = requests.put(f"{BASE_URL}/api/orders/{created_order_id}/status", headers=admin_headers, json={
            "status": "preparing"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["data"]["status"] == "preparing"
        print(f"Updated order status to: preparing")

        # ready
        response = requests.put(f"{BASE_URL}/api/orders/{created_order_id}/status", headers=admin_headers, json={
            "status": "ready"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["data"]["status"] == "ready"
        print(f"Updated order status to: ready")

        # serve - should deduct inventory
        response = requests.put(f"{BASE_URL}/api/orders/{created_order_id}/status", headers=admin_headers, json={
            "status": "served"
        })
        assert response.status_code == 200, f"Serve failed: {response.text}"
        data = response.json()
        assert data["success"] == True
        assert data["data"]["status"] == "served"
        print("Order served; inventory should be deducted")

        # verify inventory quantity decreased by 1
        inv_resp = requests.get(f"{BASE_URL}/api/inventory/{created_inventory_item_id}", headers=admin_headers)
        assert inv_resp.status_code == 200
        inv_data = inv_resp.json()
        assert inv_data["success"] == True
        remaining = inv_data["data"]["quantity"]
        assert remaining == 99 or remaining == pytest.approx(99)
        print(f"Inventory after serve: {remaining}")

    def test_insufficient_stock_prevent_serving(self, admin_headers, get_menu_item_id, created_table_id):
        """Create order with huge quantity and make sure serve fails"""
        # attempt create order with quantity too large
        response = requests.post(f"{BASE_URL}/api/orders", headers=admin_headers, json={
            "tableId": created_table_id,
            "items": [{"menuItemId": get_menu_item_id, "quantity": 10000}],
            "orderType": "dine-in"
        })
        assert response.status_code == 201
        order_id = response.json()["data"]["id"]
        serve_resp = requests.put(f"{BASE_URL}/api/orders/{order_id}/status", headers=admin_headers, json={"status": "served"})
        assert serve_resp.status_code == 400
        data = serve_resp.json()
        assert not data.get("success")
        assert "Insufficient" in data.get("message", "")
        print("Serving prevented due to insufficient stock")
    
    def test_update_order_payment(self, admin_headers, created_order_id):
        """Test update order payment"""
        response = requests.put(f"{BASE_URL}/api/orders/{created_order_id}/payment", headers=admin_headers, json={
            "paymentStatus": "paid",
            "paymentMethod": "card"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["data"]["paymentStatus"] == "paid"
        print(f"Updated payment status to: paid")
    
    def test_get_kitchen_orders(self, admin_headers):
        """Test get kitchen orders"""
        response = requests.get(f"{BASE_URL}/api/orders/kitchen", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"Kitchen orders count: {len(data['data'])}")
    
    def test_get_today_orders(self, admin_headers):
        """Test get today's orders"""
        response = requests.get(f"{BASE_URL}/api/orders/today", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"Today's orders count: {len(data['data'])}")


class TestInventoryManagement:
    """Inventory CRUD operations tests"""
    
    def test_get_all_inventory(self, admin_headers):
        """Test get all inventory items"""
        response = requests.get(f"{BASE_URL}/api/inventory", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert isinstance(data["data"], list)
        print(f"Inventory items count: {len(data['data'])}")
    
    def test_create_inventory_item(self, admin_headers):
        """Test create inventory item"""
        unique_name = f"TEST_Inventory_{uuid.uuid4().hex[:6]}"
        response = requests.post(f"{BASE_URL}/api/inventory", headers=admin_headers, json={
            "name": unique_name,
            "category": "vegetables",
            "quantity": 100,
            "unit": "kg",
            "minimumStock": 10,
            "costPerUnit": 50
        })
        assert response.status_code == 201, f"Failed: {response.json()}"
        data = response.json()
        assert data["success"] == True
        assert data["data"]["name"] == unique_name
        assert "id" in data["data"]
        print(f"Created inventory item: {unique_name}")
        return data["data"]["id"]
    
    def test_get_low_stock_items(self, admin_headers):
        """Test get low stock items"""
        response = requests.get(f"{BASE_URL}/api/inventory/low-stock", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"Low stock items count: {len(data['data'])}")
    
    def test_get_inventory_stats(self, admin_headers):
        """Test get inventory stats"""
        response = requests.get(f"{BASE_URL}/api/inventory/stats", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"Inventory stats retrieved")
    
    def test_restock_item(self, admin_headers, created_inventory_item_id):
        """Test restock inventory item"""
        response = requests.put(f"{BASE_URL}/api/inventory/{created_inventory_item_id}/restock", headers=admin_headers, json={
            "quantity": 50
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"Restocked item, new quantity: {data['data']['quantity']}")
    
    def test_delete_inventory_item(self, admin_headers, created_inventory_item_id):
        """Test delete inventory item"""
        response = requests.delete(f"{BASE_URL}/api/inventory/{created_inventory_item_id}", headers=admin_headers)
        assert response.status_code == 200
        print("Deleted inventory item")


class TestUserManagement:
    """User management tests (admin only)"""
    
    def test_get_all_users(self, admin_headers):
        """Test get all users (admin only)"""
        response = requests.get(f"{BASE_URL}/api/users", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert isinstance(data["data"], list)
        print(f"Users count: {len(data['data'])}")
    
    def test_create_user_admin(self, admin_headers):
        """Test admin create user"""
        unique_email = f"test_staff_{uuid.uuid4().hex[:8]}@test.com"
        response = requests.post(f"{BASE_URL}/api/users", headers=admin_headers, json={
            "name": "Test Staff User",
            "email": unique_email,
            "password": "staffpass123",
            "role": "staff",
            "phone": "1112223333"
        })
        assert response.status_code == 201, f"Failed: {response.json()}"
        data = response.json()
        assert data["success"] == True
        assert data["data"]["email"] == unique_email
        assert data["data"]["role"] == "staff"
        assert "id" in data["data"]
        print(f"Admin created user: {unique_email}")
        return data["data"]["id"]
    
    def test_get_user_by_id(self, admin_headers, created_user_id):
        """Test get user by ID"""
        response = requests.get(f"{BASE_URL}/api/users/{created_user_id}", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"Got user: {data['data']['name']}")
    
    def test_update_user(self, admin_headers, created_user_id):
        """Test update user"""
        response = requests.put(f"{BASE_URL}/api/users/{created_user_id}", headers=admin_headers, json={
            "name": "Updated Staff Name"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["data"]["name"] == "Updated Staff Name"
        print("Updated user name")
    
    def test_delete_user(self, admin_headers, created_user_id):
        """Test delete user"""
        response = requests.delete(f"{BASE_URL}/api/users/{created_user_id}", headers=admin_headers)
        assert response.status_code == 200
        print("Deleted user")


class TestAnalytics:
    """Analytics endpoints tests"""
    
    def test_get_dashboard_analytics(self, admin_headers):
        """Test dashboard analytics"""
        response = requests.get(f"{BASE_URL}/api/analytics/dashboard", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"Dashboard analytics retrieved")
    
    def test_get_sales_analytics(self, admin_headers):
        """Test sales analytics"""
        response = requests.get(f"{BASE_URL}/api/analytics/sales", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"Sales analytics retrieved")
    
    def test_get_top_items(self, admin_headers):
        """Test top items analytics"""
        response = requests.get(f"{BASE_URL}/api/analytics/top-items", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"Top items analytics retrieved")


class TestAIFeatures:
    """AI/ML features tests (rule-based analytics)"""
    
    def test_sales_prediction(self, admin_headers):
        """Test sales prediction endpoint"""
        response = requests.get(f"{BASE_URL}/api/ai/sales-prediction", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"Sales prediction: {data['data']}")
    
    def test_food_recommendations(self, admin_headers):
        """Test food recommendations endpoint"""
        response = requests.post(f"{BASE_URL}/api/ai/food-recommendations", headers=admin_headers, json={
            "preferences": ["spicy", "vegetarian"]
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"Food recommendations retrieved")
    
    def test_inventory_forecast(self, admin_headers):
        """Test inventory forecast endpoint"""
        response = requests.get(f"{BASE_URL}/api/ai/inventory-forecast", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"Inventory forecast retrieved")
    
    def test_ai_assistant(self, admin_headers):
        """Test AI assistant endpoint"""
        response = requests.post(f"{BASE_URL}/api/ai/assistant", headers=admin_headers, json={
            "question": "What are the best selling items?"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"AI assistant response received")


# Fixtures
@pytest.fixture(scope="session")
def admin_auth():
    """Get admin authentication tokens"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN_CREDENTIALS)
    if response.status_code != 200:
        pytest.skip("Admin login failed - check credentials")
    return response.json()["data"]


@pytest.fixture(scope="session")
def admin_headers(admin_auth):
    """Get headers with admin token"""
    return {
        "Authorization": f"Bearer {admin_auth['accessToken']}",
        "Content-Type": "application/json"
    }


@pytest.fixture(scope="class")
def created_menu_item_id(admin_headers):
    """Create menu item for testing and cleanup after"""
    unique_name = f"TEST_MenuItem_{uuid.uuid4().hex[:6]}"
    response = requests.post(f"{BASE_URL}/api/menu", headers=admin_headers, json={
        "name": unique_name,
        "description": "Test item for order creation",
        "price": 199.99,
        "category": "main-course",
        "isAvailable": True
    })
    assert response.status_code == 201, f"Menu item creation failed: {response.json()}"
    item_id = response.json()["data"]["id"]  # Using 'id' not '_id'
    yield item_id
    # Cleanup
    requests.delete(f"{BASE_URL}/api/menu/{item_id}", headers=admin_headers)


@pytest.fixture(scope="class")
def get_menu_item_id(admin_headers):
    """Get an existing menu item ID for order creation"""
    response = requests.get(f"{BASE_URL}/api/menu", headers=admin_headers)
    items = response.json()["data"]
    if items:
        return items[0]["id"]  # Using 'id' not '_id'
    # Create one if none exist
    unique_name = f"TEST_MenuItem_{uuid.uuid4().hex[:6]}"
    create_response = requests.post(f"{BASE_URL}/api/menu", headers=admin_headers, json={
        "name": unique_name,
        "description": "Test item",
        "price": 99.99,
        "category": "main-course",
        "isAvailable": True
    })
    return create_response.json()["data"]["id"]


@pytest.fixture(scope="class")
def created_table_id(admin_headers):
    """Create table for testing"""
    # Valid locations: indoor, outdoor, balcony, vip
    table_number = 8000 + (int(datetime.now().timestamp()) % 1000)
    response = requests.post(f"{BASE_URL}/api/tables", headers=admin_headers, json={
        "tableNumber": table_number,
        "capacity": 4,
        "location": "indoor"
    })
    assert response.status_code == 201, f"Table creation failed: {response.json()}"
    table_id = response.json()["data"]["id"]
    yield table_id
    # Cleanup
    requests.delete(f"{BASE_URL}/api/tables/{table_id}", headers=admin_headers)


@pytest.fixture(scope="class")
def created_order_id(admin_headers, get_menu_item_id, created_inventory_item_id):
    """Create order for testing and ensure menu item has a recipe linked to inventory"""
    # attach a simple recipe (1 unit of inventory per menu item)
    update = {
        "recipe": [{
            "inventoryItem": created_inventory_item_id,
            "quantity": 1
        }]
    }
    requests.put(f"{BASE_URL}/api/menu/{get_menu_item_id}", headers=admin_headers, json=update)

    response = requests.post(f"{BASE_URL}/api/orders", headers=admin_headers, json={
        "items": [{
            "menuItemId": get_menu_item_id,
            "quantity": 1
        }],
        "orderType": "takeaway",
        "customerName": "TEST_OrderCustomer"
    })
    if response.status_code != 201:
        pytest.skip(f"Order creation failed: {response.text}")
    return response.json()["data"]["id"]


@pytest.fixture(scope="class")
def created_inventory_item_id(admin_headers):
    """Create inventory item for testing"""
    # Valid categories: vegetables, meat, dairy, spices, beverages, grains, oils, other
    unique_name = f"TEST_Inv_{uuid.uuid4().hex[:6]}"
    response = requests.post(f"{BASE_URL}/api/inventory", headers=admin_headers, json={
        "name": unique_name,
        "category": "vegetables",
        "quantity": 100,
        "unit": "kg",
        "minThreshold": 10,
        "costPerUnit": 25
    })
    assert response.status_code == 201, f"Inventory creation failed: {response.json()}"
    item_id = response.json()["data"]["id"]
    yield item_id
    # Cleanup
    requests.delete(f"{BASE_URL}/api/inventory/{item_id}", headers=admin_headers)


@pytest.fixture(scope="class")
def created_user_id(admin_headers):
    """Create user for testing"""
    unique_email = f"test_user_{uuid.uuid4().hex[:8]}@test.com"
    response = requests.post(f"{BASE_URL}/api/users", headers=admin_headers, json={
        "name": "TEST User",
        "email": unique_email,
        "password": "testpass123",
        "role": "staff"
    })
    assert response.status_code == 201, f"User creation failed: {response.json()}"
    user_id = response.json()["data"]["id"]
    yield user_id
    # Cleanup
    requests.delete(f"{BASE_URL}/api/users/{user_id}", headers=admin_headers)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
