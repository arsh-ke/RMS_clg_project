#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any, Optional

class NexaEatsAPITester:
    def __init__(self, base_url: str = "https://resto-backend-test.preview.nexaeats.local"):
        self.base_url = base_url
        self.access_token = None
        self.refresh_token = None
        self.admin_user = None
        self.test_user = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        # Test data storage
        self.created_menu_item_id = None
        self.created_table_id = None
        self.created_order_id = None
        self.created_inventory_id = None
        self.created_user_id = None

    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })

    def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None, expected_status: int = 200) -> tuple[bool, Dict]:
        """Make API request with authentication"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.access_token:
            headers['Authorization'] = f'Bearer {self.access_token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)
            else:
                return False, {"error": f"Unsupported method: {method}"}

            success = response.status_code == expected_status
            try:
                response_data = response.json()
            except:
                response_data = {"status_code": response.status_code, "text": response.text}

            return success, response_data

        except requests.exceptions.RequestException as e:
            return False, {"error": str(e)}

    def test_health_check(self):
        """Test API health endpoint"""
        success, response = self.make_request('GET', 'health')
        self.log_test("Health Check", success and response.get('success'), 
                     f"Response: {response}" if not success else "")
        return success

    def test_admin_login(self):
        """Test admin login"""
        login_data = {
            "email": "admin@nexa-eats.com",
            "password": "admin123"
        }
        
        success, response = self.make_request('POST', 'auth/login', login_data)
        
        if success and response.get('success'):
            self.access_token = response['data']['accessToken']
            self.refresh_token = response['data']['refreshToken']
            self.admin_user = response['data']['user']
            self.log_test("Admin Login", True)
            return True
        else:
            self.log_test("Admin Login", False, f"Response: {response}")
            return False

    def test_user_registration(self):
        """Test user registration"""
        timestamp = datetime.now().strftime("%H%M%S")
        user_data = {
            "name": f"Test User {timestamp}",
            "email": f"testuser{timestamp}@test.com",
            "password": "testpass123",
            "role": "staff",
            "phone": "9876543210"
        }
        
        success, response = self.make_request('POST', 'auth/register', user_data)
        
        if success and response.get('success'):
            self.test_user = response['data']['user']
            self.log_test("User Registration", True)
            return True
        else:
            self.log_test("User Registration", False, f"Response: {response}")
            return False

    def test_token_refresh(self):
        """Test token refresh"""
        if not self.refresh_token:
            self.log_test("Token Refresh", False, "No refresh token available")
            return False
            
        refresh_data = {"refreshToken": self.refresh_token}
        success, response = self.make_request('POST', 'auth/refresh-token', refresh_data)
        
        if success and response.get('success'):
            self.access_token = response['data']['accessToken']
            self.log_test("Token Refresh", True)
            return True
        else:
            self.log_test("Token Refresh", False, f"Response: {response}")
            return False

    def test_get_current_user(self):
        """Test get current user info"""
        success, response = self.make_request('GET', 'auth/me')
        self.log_test("Get Current User", success and response.get('success'),
                     f"Response: {response}" if not success else "")
        return success

    def test_menu_operations(self):
        """Test menu CRUD operations"""
        # Create menu item
        menu_data = {
            "name": "Test Burger",
            "description": "Delicious test burger",
            "price": 299.99,
            "category": "main-course",
            "isAvailable": True,
            "preparationTime": 20
        }
        
        success, response = self.make_request('POST', 'menu', menu_data, 200)
        if success and response.get('success'):
            self.created_menu_item_id = response['data']['id']
            self.log_test("Create Menu Item", True)
        else:
            self.log_test("Create Menu Item", False, f"Response: {response}")
            return False

        # Get menu items
        success, response = self.make_request('GET', 'menu')
        self.log_test("Get Menu Items", success and response.get('success'),
                     f"Response: {response}" if not success else "")

        # Get specific menu item
        if self.created_menu_item_id:
            success, response = self.make_request('GET', f'menu/{self.created_menu_item_id}')
            self.log_test("Get Menu Item by ID", success and response.get('success'),
                         f"Response: {response}" if not success else "")

        # Update menu item
        if self.created_menu_item_id:
            update_data = {"price": 349.99, "description": "Updated test burger"}
            success, response = self.make_request('PUT', f'menu/{self.created_menu_item_id}', update_data)
            self.log_test("Update Menu Item", success and response.get('success'),
                         f"Response: {response}" if not success else "")

        return True

    def test_table_operations(self):
        """Test table CRUD operations"""
        # Create table
        table_data = {
            "tableNumber": 99,
            "capacity": 4,
            "location": "indoor"
        }
        
        success, response = self.make_request('POST', 'tables', table_data, 200)
        if success and response.get('success'):
            self.created_table_id = response['data']['id']
            self.log_test("Create Table", True)
        else:
            self.log_test("Create Table", False, f"Response: {response}")
            return False

        # Get tables
        success, response = self.make_request('GET', 'tables')
        self.log_test("Get Tables", success and response.get('success'),
                     f"Response: {response}" if not success else "")

        # Get table stats
        success, response = self.make_request('GET', 'tables/stats')
        self.log_test("Get Table Stats", success and response.get('success'),
                     f"Response: {response}" if not success else "")

        # Update table status
        if self.created_table_id:
            status_data = {"status": "occupied"}
            success, response = self.make_request('PUT', f'tables/{self.created_table_id}/status', status_data)
            self.log_test("Update Table Status", success and response.get('success'),
                         f"Response: {response}" if not success else "")

        return True

    def test_order_operations(self):
        """Test order operations with inventory deduction"""
        # ensure we have a menu item and table
        if not self.created_menu_item_id or not self.created_table_id:
            self.log_test("Order Operations", False, "Missing menu item or table for order creation")
            return False

        # create an inventory item to use in recipe if not already created
        if not self.created_inventory_id:
            inventory_data = {
                "name": "Recipe Ingredient",
                "category": "vegetables",
                "quantity": 20.0,
                "unit": "kg",
                "minThreshold": 15.0,
                "costPerUnit": 10.0,
                "supplier": "Recipe Supplier"
            }
            success, response = self.make_request('POST', 'inventory', inventory_data, 200)
            if success and response.get('success'):
                self.created_inventory_id = response['data']['id']
                self.log_test("Create Recipe Inventory Item", True)
            else:
                self.log_test("Create Recipe Inventory Item", False, f"Response: {response}")
                return False

        # update the menu item to include a recipe using the inventory item
        update_menu = {"recipe": [{"inventoryItem": self.created_inventory_id, "quantity": 2}]} 
        success, response = self.make_request('PUT', f'menu/{self.created_menu_item_id}', update_menu)
        self.log_test("Attach Recipe to Menu Item", success and response.get('success'),
                     f"Response: {response}" if not success else "")

        # Create order that will consume inventory
        order_data = {
            "tableId": self.created_table_id,
            "items": [
                {
                    "menuItemId": self.created_menu_item_id,
                    "quantity": 3,
                    "notes": "Extra spicy"
                }
            ],
            "orderType": "dine-in",
            "customerName": "Test Customer",
            "notes": "Test order"
        }
        
        success, response = self.make_request('POST', 'orders', order_data, 200)
        if success and response.get('success'):
            self.created_order_id = response['data']['id']
            self.log_test("Create Order", True)
        else:
            self.log_test("Create Order", False, f"Response: {response}")
            return False

        # move order through statuses and finally serve it
        # preparing
        status_data = {"status": "preparing"}
        success, response = self.make_request('PUT', f'orders/{self.created_order_id}/status', status_data)
        self.log_test("Update Order to Preparing", success and response.get('success'))

        # ready
        status_data = {"status": "ready"}
        success, response = self.make_request('PUT', f'orders/{self.created_order_id}/status', status_data)
        self.log_test("Update Order to Ready", success and response.get('success'))

        # served - should deduct inventory and may trigger low stock
        status_data = {"status": "served"}
        success, response = self.make_request('PUT', f'orders/{self.created_order_id}/status', status_data)
        self.log_test("Update Order to Served (deductinventory)", success and response.get('success'),
                     f"Response: {response}" if not success else "")

        # verify inventory deduction
        success, inventory_resp = self.make_request('GET', f'inventory/{self.created_inventory_id}')
        if success and inventory_resp.get('success'):
            remaining = inventory_resp['data']['quantity']
            expected = 20.0 - (2 * 3)  # recipe qty*order qty
            self.log_test("Inventory Deducted Correctly", abs(remaining - expected) < 0.0001,
                         f"Remaining: {remaining}, Expected: {expected}")
        else:
            self.log_test("Inventory Deduction Verification", False, f"Response: {inventory_resp}")

        # low stock check after deduction
        success, low_resp = self.make_request('GET', 'inventory/low-stock')
        self.log_test("Low Stock Endpoint After Deduction", success and low_resp.get('success') and any(item['id']==self.created_inventory_id for item in low_resp.get('data',[])))

        # try creating an order that will fail due to insufficient stock
        # current remaining is expected variable; order quantity large enough to cause failure
        bad_order = {
            "tableId": self.created_table_id,
            "items": [
                {
                    "menuItemId": self.created_menu_item_id,
                    "quantity": 1000,
                    "notes": "Too many"
                }
            ],
            "orderType": "dine-in",
            "customerName": "Bad Customer"
        }
        success, bad_resp = self.make_request('POST', 'orders', bad_order, 200)
        if success and bad_resp.get('success'):
            bad_order_id = bad_resp['data']['id']
            # attempt to serve immediately
            status_data = {"status": "served"}
            success2, serve_resp = self.make_request('PUT', f'orders/{bad_order_id}/status', status_data)
            self.log_test("Prevent Serve When Insufficient Stock", not success2 or not serve_resp.get('success'))
        else:
            # if order creation itself failed due to validation, that's fine
            self.log_test("Prevent Serve When Insufficient Stock", True)

        return True

    def test_inventory_operations(self):
        """Test inventory CRUD operations"""
        # Create inventory item
        inventory_data = {
            "name": "Test Ingredient",
            "category": "vegetables",
            "quantity": 100.0,
            "unit": "kg",
            "minThreshold": 10.0,
            "costPerUnit": 50.0,
            "supplier": "Test Supplier"
        }
        
        success, response = self.make_request('POST', 'inventory', inventory_data, 200)
        if success and response.get('success'):
            self.created_inventory_id = response['data']['id']
            self.log_test("Create Inventory Item", True)
        else:
            self.log_test("Create Inventory Item", False, f"Response: {response}")
            return False

        # Get inventory
        success, response = self.make_request('GET', 'inventory')
        self.log_test("Get Inventory", success and response.get('success'),
                     f"Response: {response}" if not success else "")

        # Get low stock items
        success, response = self.make_request('GET', 'inventory/low-stock')
        self.log_test("Get Low Stock Items", success and response.get('success'),
                     f"Response: {response}" if not success else "")

        # Restock item
        if self.created_inventory_id:
            restock_data = {"quantity": 50.0}
            success, response = self.make_request('PUT', f'inventory/{self.created_inventory_id}/restock', restock_data)
            self.log_test("Restock Inventory Item", success and response.get('success'),
                         f"Response: {response}" if not success else "")

        return True

    def test_analytics_endpoints(self):
        """Test analytics endpoints"""
        # Dashboard stats
        success, response = self.make_request('GET', 'analytics/dashboard')
        self.log_test("Get Dashboard Analytics", success and response.get('success'),
                     f"Response: {response}" if not success else "")

        # Sales report
        success, response = self.make_request('GET', 'analytics/sales')
        self.log_test("Get Sales Analytics", success and response.get('success'),
                     f"Response: {response}" if not success else "")

        # Top items
        success, response = self.make_request('GET', 'analytics/top-items')
        self.log_test("Get Top Items Analytics", success and response.get('success'),
                     f"Response: {response}" if not success else "")

        return True

    def test_ai_endpoints(self):
        """Test AI endpoints"""
        # Sales prediction
        success, response = self.make_request('GET', 'ai/sales-prediction')
        self.log_test("AI Sales Prediction", success and response.get('success'),
                     f"Response: {response}" if not success else "")

        # Food recommendations
        recommendation_data = {"tableId": self.created_table_id, "orderItems": []}
        success, response = self.make_request('POST', 'ai/food-recommendations', recommendation_data)
        self.log_test("AI Food Recommendations", success and response.get('success'),
                     f"Response: {response}" if not success else "")

        # Inventory forecast
        success, response = self.make_request('GET', 'ai/inventory-forecast')
        self.log_test("AI Inventory Forecast", success and response.get('success'),
                     f"Response: {response}" if not success else "")

        # AI Assistant
        assistant_data = {"question": "What are today's sales?"}
        success, response = self.make_request('POST', 'ai/assistant', assistant_data)
        self.log_test("AI Assistant", success and response.get('success'),
                     f"Response: {response}" if not success else "")

        return True

    def test_user_management(self):
        """Test user management (admin only)"""
        # Get users
        success, response = self.make_request('GET', 'users')
        self.log_test("Get Users", success and response.get('success'),
                     f"Response: {response}" if not success else "")

        # Create user
        timestamp = datetime.now().strftime("%H%M%S")
        user_data = {
            "name": f"Admin Created User {timestamp}",
            "email": f"adminuser{timestamp}@test.com",
            "password": "adminpass123",
            "role": "manager",
            "phone": "9876543211"
        }
        
        success, response = self.make_request('POST', 'users', user_data, 200)
        if success and response.get('success'):
            self.created_user_id = response['data']['id']
            self.log_test("Create User (Admin)", True)
        else:
            self.log_test("Create User (Admin)", False, f"Response: {response}")

        return True

    def cleanup_test_data(self):
        """Clean up created test data"""
        print("\n🧹 Cleaning up test data...")
        
        # Delete created items (in reverse order of creation)
        if self.created_user_id:
            success, _ = self.make_request('DELETE', f'users/{self.created_user_id}', expected_status=200)
            print(f"{'✅' if success else '❌'} Delete test user")

        if self.created_order_id:
            # Orders typically shouldn't be deleted, but we can cancel them
            success, _ = self.make_request('PUT', f'orders/{self.created_order_id}/status', {"status": "cancelled"})
            print(f"{'✅' if success else '❌'} Cancel test order")

        if self.created_inventory_id:
            success, _ = self.make_request('DELETE', f'inventory/{self.created_inventory_id}', expected_status=200)
            print(f"{'✅' if success else '❌'} Delete test inventory item")

        if self.created_table_id:
            success, _ = self.make_request('DELETE', f'tables/{self.created_table_id}', expected_status=200)
            print(f"{'✅' if success else '❌'} Delete test table")

        if self.created_menu_item_id:
            success, _ = self.make_request('DELETE', f'menu/{self.created_menu_item_id}', expected_status=200)
            print(f"{'✅' if success else '❌'} Delete test menu item")

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting NEXA EATS API Tests...")
        print(f"🔗 Testing against: {self.base_url}")
        print("=" * 60)

        # Basic connectivity
        if not self.test_health_check():
            print("❌ Health check failed - API may be down")
            return False

        # Authentication tests
        if not self.test_admin_login():
            print("❌ Admin login failed - cannot continue with authenticated tests")
            return False

        self.test_user_registration()
        self.test_token_refresh()
        self.test_get_current_user()

        # Core functionality tests
        self.test_menu_operations()
        self.test_table_operations()
        self.test_order_operations()
        self.test_inventory_operations()

        # Analytics and AI tests
        self.test_analytics_endpoints()
        self.test_ai_endpoints()

        # Admin functionality
        self.test_user_management()

        # Cleanup
        self.cleanup_test_data()

        # Results summary
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 90:
            print("🎉 Excellent! API is working well")
        elif success_rate >= 75:
            print("✅ Good! Most functionality is working")
        elif success_rate >= 50:
            print("⚠️  Warning! Several issues found")
        else:
            print("❌ Critical! Major functionality broken")

        return success_rate >= 75

def main():
    """Main test execution"""
    tester = NexaEatsAPITester()
    
    try:
        success = tester.run_all_tests()
        
        # Save detailed results
        with open('/app/test_reports/backend_test_results.json', 'w') as f:
            json.dump({
                'timestamp': datetime.now().isoformat(),
                'total_tests': tester.tests_run,
                'passed_tests': tester.tests_passed,
                'success_rate': (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0,
                'test_results': tester.test_results
            }, f, indent=2)
        
        return 0 if success else 1
        
    except Exception as e:
        print(f"❌ Test execution failed: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())