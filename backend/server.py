from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from bson import ObjectId
import os
import bcrypt
import jwt
import logging
from dotenv import load_dotenv
from pathlib import Path
import socketio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# MongoDB setup
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'nexa_eats')
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# JWT Settings
JWT_SECRET = os.environ.get('JWT_SECRET', 'nexa_eats_jwt_secret_key_2024')
JWT_REFRESH_SECRET = os.environ.get('JWT_REFRESH_SECRET', 'nexa_eats_refresh_secret')
JWT_ACCESS_EXPIRE = 15  # minutes
JWT_REFRESH_EXPIRE = 7  # days

# Socket.IO setup
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')

# FastAPI app
app = FastAPI(title="NEXA EATS - Restaurant Management System", version="1.0.0")

# Create ASGI app with Socket.IO
socket_app = socketio.ASGIApp(sio, app)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Helper functions
def serialize_doc(doc):
    if doc is None:
        return None
    doc['id'] = str(doc.pop('_id'))
    return doc

def serialize_docs(docs):
    return [serialize_doc(doc) for doc in docs]

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_access_token(user_id: str) -> str:
    payload = {
        'id': user_id,
        'exp': datetime.now(timezone.utc) + timedelta(minutes=JWT_ACCESS_EXPIRE),
        'type': 'access'
    }
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')

def create_refresh_token(user_id: str) -> str:
    payload = {
        'id': user_id,
        'exp': datetime.now(timezone.utc) + timedelta(days=JWT_REFRESH_EXPIRE),
        'type': 'refresh'
    }
    return jwt.encode(payload, JWT_REFRESH_SECRET, algorithm='HS256')

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        user = await db.users.find_one({'_id': ObjectId(payload['id'])})
        if not user or not user.get('isActive', True):
            raise HTTPException(status_code=401, detail="Invalid or inactive user")
        return serialize_doc(user)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

def authorize(*roles):
    async def check_role(user: dict = Depends(get_current_user)):
        if user['role'] not in roles:
            raise HTTPException(status_code=403, detail=f"Role {user['role']} not authorized")
        return user
    return check_role

# Pydantic Models
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = 'staff'
    phone: Optional[str] = None

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    phone: Optional[str] = None
    isActive: Optional[bool] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RefreshTokenRequest(BaseModel):
    refreshToken: str

class MenuItemCreate(BaseModel):
    name: str
    description: Optional[str] = ''
    price: float
    category: str
    image: Optional[str] = ''
    isAvailable: bool = True
    preparationTime: int = 15

class MenuItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    image: Optional[str] = None
    isAvailable: Optional[bool] = None
    preparationTime: Optional[int] = None

class TableCreate(BaseModel):
    tableNumber: int
    capacity: int
    location: str = 'indoor'

class TableUpdate(BaseModel):
    tableNumber: Optional[int] = None
    capacity: Optional[int] = None
    status: Optional[str] = None
    location: Optional[str] = None

class OrderItemInput(BaseModel):
    menuItemId: str
    quantity: int
    notes: Optional[str] = None

class OrderCreate(BaseModel):
    tableId: Optional[str] = None
    items: List[OrderItemInput]
    orderType: str = 'dine-in'
    customerName: Optional[str] = None
    customerPhone: Optional[str] = None
    notes: Optional[str] = None

class OrderStatusUpdate(BaseModel):
    status: str

class OrderPaymentUpdate(BaseModel):
    paymentStatus: Optional[str] = None
    paymentMethod: Optional[str] = None
    discount: Optional[float] = None

class InventoryCreate(BaseModel):
    name: str
    category: str = 'other'
    quantity: float
    unit: str = 'kg'
    minThreshold: float = 10
    costPerUnit: float = 0
    supplier: Optional[str] = None

class InventoryUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    minThreshold: Optional[float] = None
    costPerUnit: Optional[float] = None
    supplier: Optional[str] = None
    dailyUsage: Optional[float] = None

class RestockRequest(BaseModel):
    quantity: float

class AssistantQuestion(BaseModel):
    question: str

class FoodRecommendationRequest(BaseModel):
    tableId: Optional[str] = None
    orderItems: List[str] = []

# API Router
api = APIRouter(prefix="/api")

# Socket.IO events
@sio.event
async def connect(sid, environ):
    logger.info(f"Client connected: {sid}")

@sio.event
async def register(sid, data):
    role = data.get('role', 'staff')
    await sio.enter_room(sid, f'role_{role}')
    logger.info(f"User registered with role: {role}")

@sio.event
async def disconnect(sid):
    logger.info(f"Client disconnected: {sid}")

async def emit_to_role(role: str, event: str, data: dict):
    await sio.emit(event, data, room=f'role_{role}')

async def emit_to_all(event: str, data: dict):
    await sio.emit(event, data)

# Health check
@api.get("/health")
async def health_check():
    return {"success": True, "message": "NEXA EATS API is running", "timestamp": datetime.now(timezone.utc).isoformat()}

@api.get("/")
async def root():
    return {"success": True, "message": "Welcome to NEXA EATS Restaurant Management System", "version": "1.0.0"}

# Auth routes
@api.post("/auth/register")
async def register(user_data: UserCreate):
    existing = await db.users.find_one({'email': user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_doc = {
        'name': user_data.name,
        'email': user_data.email,
        'password': hash_password(user_data.password),
        'role': user_data.role,
        'phone': user_data.phone,
        'isActive': True,
        'createdAt': datetime.now(timezone.utc),
        'updatedAt': datetime.now(timezone.utc)
    }
    result = await db.users.insert_one(user_doc)
    user_doc['_id'] = result.inserted_id
    
    user = serialize_doc(user_doc)
    user.pop('password', None)
    
    return {
        "success": True,
        "data": {
            "user": user,
            "accessToken": create_access_token(user['id']),
            "refreshToken": create_refresh_token(user['id'])
        }
    }

@api.post("/auth/login")
async def login(login_data: LoginRequest):
    user = await db.users.find_one({'email': login_data.email})
    if not user or not verify_password(login_data.password, user['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user.get('isActive', True):
        raise HTTPException(status_code=401, detail="Account is deactivated")
    
    await db.users.update_one({'_id': user['_id']}, {'$set': {'lastLogin': datetime.now(timezone.utc)}})
    
    user_data = serialize_doc(user)
    user_data.pop('password', None)
    
    return {
        "success": True,
        "data": {
            "user": user_data,
            "accessToken": create_access_token(user_data['id']),
            "refreshToken": create_refresh_token(user_data['id'])
        }
    }

@api.post("/auth/refresh-token")
async def refresh_token(data: RefreshTokenRequest):
    try:
        payload = jwt.decode(data.refreshToken, JWT_REFRESH_SECRET, algorithms=['HS256'])
        user_id = payload['id']
        return {
            "success": True,
            "data": {
                "accessToken": create_access_token(user_id),
                "refreshToken": create_refresh_token(user_id)
            }
        }
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

@api.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    user.pop('password', None)
    return {"success": True, "data": user}

# User routes
@api.get("/users")
async def get_users(role: Optional[str] = None, isActive: Optional[bool] = None, user: dict = Depends(authorize('admin', 'manager'))):
    filter_query = {}
    if role:
        filter_query['role'] = role
    if isActive is not None:
        filter_query['isActive'] = isActive
    
    users = await db.users.find(filter_query, {'password': 0}).sort('createdAt', -1).to_list(1000)
    return {"success": True, "count": len(users), "data": serialize_docs(users)}

@api.post("/users")
async def create_user(user_data: UserCreate, current_user: dict = Depends(authorize('admin'))):
    existing = await db.users.find_one({'email': user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    user_doc = {
        'name': user_data.name,
        'email': user_data.email,
        'password': hash_password(user_data.password),
        'role': user_data.role,
        'phone': user_data.phone,
        'isActive': True,
        'createdAt': datetime.now(timezone.utc),
        'updatedAt': datetime.now(timezone.utc)
    }
    result = await db.users.insert_one(user_doc)
    user_doc['_id'] = result.inserted_id
    user = serialize_doc(user_doc)
    user.pop('password', None)
    return {"success": True, "data": user}

@api.get("/users/{user_id}")
async def get_user(user_id: str, current_user: dict = Depends(authorize('admin', 'manager'))):
    user = await db.users.find_one({'_id': ObjectId(user_id)}, {'password': 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"success": True, "data": serialize_doc(user)}

@api.put("/users/{user_id}")
async def update_user(user_id: str, user_data: UserUpdate, current_user: dict = Depends(authorize('admin'))):
    update_data = {k: v for k, v in user_data.model_dump().items() if v is not None}
    update_data['updatedAt'] = datetime.now(timezone.utc)
    
    result = await db.users.find_one_and_update(
        {'_id': ObjectId(user_id)},
        {'$set': update_data},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="User not found")
    
    user = serialize_doc(result)
    user.pop('password', None)
    return {"success": True, "data": user}

@api.delete("/users/{user_id}")
async def delete_user(user_id: str, current_user: dict = Depends(authorize('admin'))):
    result = await db.users.delete_one({'_id': ObjectId(user_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"success": True, "message": "User deleted successfully"}

# Menu routes
@api.get("/menu")
async def get_menu_items(category: Optional[str] = None, isAvailable: Optional[bool] = None, user: dict = Depends(get_current_user)):
    filter_query = {}
    if category:
        filter_query['category'] = category
    if isAvailable is not None:
        filter_query['isAvailable'] = isAvailable
    
    items = await db.menu_items.find(filter_query).sort([('category', 1), ('name', 1)]).to_list(1000)
    return {"success": True, "count": len(items), "data": serialize_docs(items)}

@api.get("/menu/popular")
async def get_popular_items(user: dict = Depends(get_current_user)):
    items = await db.menu_items.find({'isAvailable': True}).sort('orderCount', -1).limit(10).to_list(10)
    return {"success": True, "data": serialize_docs(items)}

@api.get("/menu/categories")
async def get_categories(user: dict = Depends(get_current_user)):
    categories = await db.menu_items.distinct('category')
    return {"success": True, "data": categories}

@api.post("/menu")
async def create_menu_item(item_data: MenuItemCreate, user: dict = Depends(authorize('admin', 'manager'))):
    item_doc = {
        **item_data.model_dump(),
        'orderCount': 0,
        'createdAt': datetime.now(timezone.utc),
        'updatedAt': datetime.now(timezone.utc)
    }
    result = await db.menu_items.insert_one(item_doc)
    item_doc['_id'] = result.inserted_id
    return {"success": True, "data": serialize_doc(item_doc)}

@api.get("/menu/{item_id}")
async def get_menu_item(item_id: str, user: dict = Depends(get_current_user)):
    item = await db.menu_items.find_one({'_id': ObjectId(item_id)})
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    return {"success": True, "data": serialize_doc(item)}

@api.put("/menu/{item_id}")
async def update_menu_item(item_id: str, item_data: MenuItemUpdate, user: dict = Depends(authorize('admin', 'manager'))):
    update_data = {k: v for k, v in item_data.model_dump().items() if v is not None}
    update_data['updatedAt'] = datetime.now(timezone.utc)
    
    result = await db.menu_items.find_one_and_update(
        {'_id': ObjectId(item_id)},
        {'$set': update_data},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Menu item not found")
    return {"success": True, "data": serialize_doc(result)}

@api.delete("/menu/{item_id}")
async def delete_menu_item(item_id: str, user: dict = Depends(authorize('admin', 'manager'))):
    result = await db.menu_items.delete_one({'_id': ObjectId(item_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Menu item not found")
    return {"success": True, "message": "Menu item deleted successfully"}

# Table routes
@api.get("/tables")
async def get_tables(status: Optional[str] = None, location: Optional[str] = None, user: dict = Depends(get_current_user)):
    filter_query = {}
    if status:
        filter_query['status'] = status
    if location:
        filter_query['location'] = location
    
    tables = await db.tables.find(filter_query).sort('tableNumber', 1).to_list(100)
    return {"success": True, "count": len(tables), "data": serialize_docs(tables)}

@api.get("/tables/stats")
async def get_table_stats(user: dict = Depends(get_current_user)):
    pipeline = [
        {'$group': {'_id': '$status', 'count': {'$sum': 1}}}
    ]
    stats = await db.tables.aggregate(pipeline).to_list(10)
    result = {'free': 0, 'occupied': 0, 'reserved': 0, 'total': 0}
    for s in stats:
        result[s['_id']] = s['count']
        result['total'] += s['count']
    return {"success": True, "data": result}

@api.post("/tables")
async def create_table(table_data: TableCreate, user: dict = Depends(authorize('admin', 'manager'))):
    existing = await db.tables.find_one({'tableNumber': table_data.tableNumber})
    if existing:
        raise HTTPException(status_code=400, detail="Table number already exists")
    
    table_doc = {
        **table_data.model_dump(),
        'status': 'free',
        'currentOrder': None,
        'createdAt': datetime.now(timezone.utc),
        'updatedAt': datetime.now(timezone.utc)
    }
    result = await db.tables.insert_one(table_doc)
    table_doc['_id'] = result.inserted_id
    return {"success": True, "data": serialize_doc(table_doc)}

@api.get("/tables/{table_id}")
async def get_table(table_id: str, user: dict = Depends(get_current_user)):
    table = await db.tables.find_one({'_id': ObjectId(table_id)})
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    return {"success": True, "data": serialize_doc(table)}

@api.put("/tables/{table_id}")
async def update_table(table_id: str, table_data: TableUpdate, user: dict = Depends(authorize('admin', 'manager'))):
    update_data = {k: v for k, v in table_data.model_dump().items() if v is not None}
    update_data['updatedAt'] = datetime.now(timezone.utc)
    
    result = await db.tables.find_one_and_update(
        {'_id': ObjectId(table_id)},
        {'$set': update_data},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Table not found")
    return {"success": True, "data": serialize_doc(result)}

@api.delete("/tables/{table_id}")
async def delete_table(table_id: str, user: dict = Depends(authorize('admin', 'manager'))):
    result = await db.tables.delete_one({'_id': ObjectId(table_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Table not found")
    return {"success": True, "message": "Table deleted successfully"}

@api.put("/tables/{table_id}/status")
async def update_table_status(table_id: str, data: TableUpdate, user: dict = Depends(get_current_user)):
    result = await db.tables.find_one_and_update(
        {'_id': ObjectId(table_id)},
        {'$set': {'status': data.status, 'updatedAt': datetime.now(timezone.utc)}},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Table not found")
    return {"success": True, "data": serialize_doc(result)}

# Order routes
@api.get("/orders")
async def get_orders(
    status: Optional[str] = None,
    orderType: Optional[str] = None,
    paymentStatus: Optional[str] = None,
    date: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    filter_query = {}
    if status:
        filter_query['status'] = status
    if orderType:
        filter_query['orderType'] = orderType
    if paymentStatus:
        filter_query['paymentStatus'] = paymentStatus
    if date:
        start_date = datetime.fromisoformat(date).replace(hour=0, minute=0, second=0, tzinfo=timezone.utc)
        end_date = start_date + timedelta(days=1)
        filter_query['createdAt'] = {'$gte': start_date, '$lt': end_date}
    
    orders = await db.orders.find(filter_query).sort('createdAt', -1).to_list(1000)
    return {"success": True, "count": len(orders), "data": serialize_docs(orders)}

@api.get("/orders/kitchen")
async def get_kitchen_orders(user: dict = Depends(authorize('kitchen', 'manager', 'admin'))):
    orders = await db.orders.find({
        'status': {'$in': ['pending', 'preparing', 'ready']}
    }).sort('createdAt', 1).to_list(100)
    return {"success": True, "count": len(orders), "data": serialize_docs(orders)}

@api.get("/orders/today")
async def get_today_orders(user: dict = Depends(get_current_user)):
    start_of_day = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    orders = await db.orders.find({'createdAt': {'$gte': start_of_day}}).sort('createdAt', -1).to_list(500)
    return {"success": True, "count": len(orders), "data": serialize_docs(orders)}

@api.post("/orders")
async def create_order(order_data: OrderCreate, user: dict = Depends(authorize('staff', 'manager', 'admin'))):
    table = None
    table_number = None
    
    if order_data.tableId:
        table = await db.tables.find_one({'_id': ObjectId(order_data.tableId)})
        if not table:
            raise HTTPException(status_code=404, detail="Table not found")
        table_number = table['tableNumber']
    
    order_items = []
    subtotal = 0
    
    for item in order_data.items:
        menu_item = await db.menu_items.find_one({'_id': ObjectId(item.menuItemId)})
        if not menu_item:
            raise HTTPException(status_code=404, detail=f"Menu item not found: {item.menuItemId}")
        
        order_items.append({
            'menuItem': str(menu_item['_id']),
            'name': menu_item['name'],
            'quantity': item.quantity,
            'price': menu_item['price'],
            'notes': item.notes
        })
        subtotal += menu_item['price'] * item.quantity
        
        await db.menu_items.update_one({'_id': menu_item['_id']}, {'$inc': {'orderCount': item.quantity}})
    
    count = await db.orders.count_documents({})
    order_number = f"ORD-{str(count + 1).zfill(5)}"
    
    tax = subtotal * 0.05
    total = subtotal + tax
    
    order_doc = {
        'orderNumber': order_number,
        'table': order_data.tableId,
        'tableNumber': table_number,
        'items': order_items,
        'orderType': order_data.orderType if not order_data.tableId else 'dine-in',
        'status': 'pending',
        'subtotal': subtotal,
        'tax': tax,
        'discount': 0,
        'total': total,
        'paymentStatus': 'pending',
        'paymentMethod': 'cash',
        'customerName': order_data.customerName,
        'customerPhone': order_data.customerPhone,
        'notes': order_data.notes,
        'createdBy': user['id'],
        'createdAt': datetime.now(timezone.utc),
        'updatedAt': datetime.now(timezone.utc)
    }
    
    result = await db.orders.insert_one(order_doc)
    order_doc['_id'] = result.inserted_id
    
    if table:
        await db.tables.update_one(
            {'_id': table['_id']},
            {'$set': {'status': 'occupied', 'currentOrder': str(result.inserted_id)}}
        )
    
    notification_doc = {
        'type': 'order_new',
        'title': 'New Order Received',
        'message': f"Order #{order_number} - {'Table ' + str(table_number) if table_number else 'Takeaway'} - {len(order_items)} items",
        'targetRoles': ['kitchen', 'manager'],
        'relatedOrder': str(result.inserted_id),
        'relatedTable': table_number,
        'isRead': False,
        'createdAt': datetime.now(timezone.utc)
    }
    await db.notifications.insert_one(notification_doc)
    
    await emit_to_role('kitchen', 'new_order', serialize_doc(order_doc))
    await emit_to_role('manager', 'new_order', serialize_doc(order_doc))
    
    return {"success": True, "data": serialize_doc(order_doc)}

@api.get("/orders/{order_id}")
async def get_order(order_id: str, user: dict = Depends(get_current_user)):
    order = await db.orders.find_one({'_id': ObjectId(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"success": True, "data": serialize_doc(order)}

@api.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, data: OrderStatusUpdate, user: dict = Depends(authorize('kitchen', 'staff', 'manager', 'admin'))):
    order = await db.orders.find_one({'_id': ObjectId(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    previous_status = order['status']
    await db.orders.update_one(
        {'_id': ObjectId(order_id)},
        {'$set': {'status': data.status, 'updatedAt': datetime.now(timezone.utc)}}
    )
    
    if data.status == 'completed' and order.get('table'):
        await db.tables.update_one(
            {'_id': ObjectId(order['table'])},
            {'$set': {'status': 'free', 'currentOrder': None}}
        )
    
    status_messages = {
        'preparing': 'Order is being prepared',
        'ready': 'Order is ready for serving',
        'served': 'Order has been served',
        'completed': 'Order completed',
        'cancelled': 'Order has been cancelled'
    }
    
    if data.status in status_messages:
        notification_doc = {
            'type': 'order_update',
            'title': f"Order Status: {data.status.upper()}",
            'message': f"{status_messages[data.status]} - Order #{order['orderNumber']}",
            'targetRoles': ['staff', 'manager', 'kitchen'],
            'relatedOrder': order_id,
            'relatedTable': order.get('tableNumber'),
            'isRead': False,
            'createdAt': datetime.now(timezone.utc)
        }
        await db.notifications.insert_one(notification_doc)
        
        order['status'] = data.status
        await emit_to_all('order_update', serialize_doc(order))
    
    updated_order = await db.orders.find_one({'_id': ObjectId(order_id)})
    return {"success": True, "data": serialize_doc(updated_order)}

@api.put("/orders/{order_id}/payment")
async def update_order_payment(order_id: str, data: OrderPaymentUpdate, user: dict = Depends(authorize('staff', 'manager', 'admin'))):
    order = await db.orders.find_one({'_id': ObjectId(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    update_data = {'updatedAt': datetime.now(timezone.utc)}
    
    if data.discount is not None:
        update_data['discount'] = data.discount
        update_data['total'] = order['subtotal'] + order['tax'] - data.discount
    
    if data.paymentMethod:
        update_data['paymentMethod'] = data.paymentMethod
    if data.paymentStatus:
        update_data['paymentStatus'] = data.paymentStatus
    
    await db.orders.update_one({'_id': ObjectId(order_id)}, {'$set': update_data})
    
    if data.paymentStatus == 'paid':
        notification_doc = {
            'type': 'payment',
            'title': 'Payment Received',
            'message': f"Payment received for Order #{order['orderNumber']}",
            'targetRoles': ['manager', 'admin'],
            'relatedOrder': order_id,
            'isRead': False,
            'createdAt': datetime.now(timezone.utc)
        }
        await db.notifications.insert_one(notification_doc)
    
    updated_order = await db.orders.find_one({'_id': ObjectId(order_id)})
    return {"success": True, "data": serialize_doc(updated_order)}

# Inventory routes
@api.get("/inventory")
async def get_inventory(category: Optional[str] = None, lowStock: Optional[bool] = None, user: dict = Depends(get_current_user)):
    filter_query = {}
    if category:
        filter_query['category'] = category
    
    items = await db.inventory.find(filter_query).sort([('category', 1), ('name', 1)]).to_list(1000)
    items = serialize_docs(items)
    
    for item in items:
        item['isLowStock'] = item['quantity'] <= item.get('minThreshold', 10)
    
    if lowStock:
        items = [i for i in items if i['isLowStock']]
    
    return {"success": True, "count": len(items), "data": items}

@api.get("/inventory/low-stock")
async def get_low_stock(user: dict = Depends(get_current_user)):
    items = await db.inventory.find().to_list(1000)
    low_stock = [serialize_doc(i) for i in items if i['quantity'] <= i.get('minThreshold', 10)]
    return {"success": True, "count": len(low_stock), "data": low_stock}

@api.get("/inventory/stats")
async def get_inventory_stats(user: dict = Depends(authorize('admin', 'manager'))):
    items = await db.inventory.find().to_list(1000)
    
    stats = {
        'totalItems': len(items),
        'lowStockCount': len([i for i in items if i['quantity'] <= i.get('minThreshold', 10)]),
        'totalValue': sum(i['quantity'] * i.get('costPerUnit', 0) for i in items),
        'categoryBreakdown': {}
    }
    
    for item in items:
        cat = item.get('category', 'other')
        if cat not in stats['categoryBreakdown']:
            stats['categoryBreakdown'][cat] = {'count': 0, 'value': 0}
        stats['categoryBreakdown'][cat]['count'] += 1
        stats['categoryBreakdown'][cat]['value'] += item['quantity'] * item.get('costPerUnit', 0)
    
    return {"success": True, "data": stats}

@api.post("/inventory")
async def create_inventory_item(item_data: InventoryCreate, user: dict = Depends(authorize('admin', 'manager'))):
    item_doc = {
        **item_data.model_dump(),
        'dailyUsage': 0,
        'lastRestocked': datetime.now(timezone.utc),
        'createdAt': datetime.now(timezone.utc),
        'updatedAt': datetime.now(timezone.utc)
    }
    result = await db.inventory.insert_one(item_doc)
    item_doc['_id'] = result.inserted_id
    return {"success": True, "data": serialize_doc(item_doc)}

@api.get("/inventory/{item_id}")
async def get_inventory_item(item_id: str, user: dict = Depends(get_current_user)):
    item = await db.inventory.find_one({'_id': ObjectId(item_id)})
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    return {"success": True, "data": serialize_doc(item)}

@api.put("/inventory/{item_id}")
async def update_inventory_item(item_id: str, item_data: InventoryUpdate, user: dict = Depends(authorize('admin', 'manager'))):
    update_data = {k: v for k, v in item_data.model_dump().items() if v is not None}
    update_data['updatedAt'] = datetime.now(timezone.utc)
    
    result = await db.inventory.find_one_and_update(
        {'_id': ObjectId(item_id)},
        {'$set': update_data},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    return {"success": True, "data": serialize_doc(result)}

@api.delete("/inventory/{item_id}")
async def delete_inventory_item(item_id: str, user: dict = Depends(authorize('admin', 'manager'))):
    result = await db.inventory.delete_one({'_id': ObjectId(item_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    return {"success": True, "message": "Inventory item deleted successfully"}

@api.put("/inventory/{item_id}/restock")
async def restock_item(item_id: str, data: RestockRequest, user: dict = Depends(authorize('admin', 'manager'))):
    result = await db.inventory.find_one_and_update(
        {'_id': ObjectId(item_id)},
        {
            '$inc': {'quantity': data.quantity},
            '$set': {'lastRestocked': datetime.now(timezone.utc), 'updatedAt': datetime.now(timezone.utc)}
        },
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    return {"success": True, "data": serialize_doc(result)}

# Notification routes
@api.get("/notifications")
async def get_notifications(type: Optional[str] = None, isRead: Optional[bool] = None, limit: int = 50, user: dict = Depends(get_current_user)):
    filter_query = {'targetRoles': user['role']}
    if type:
        filter_query['type'] = type
    if isRead is not None:
        filter_query['isRead'] = isRead
    
    notifications = await db.notifications.find(filter_query).sort('createdAt', -1).limit(limit).to_list(limit)
    return {"success": True, "count": len(notifications), "data": serialize_docs(notifications)}

@api.get("/notifications/unread-count")
async def get_unread_count(user: dict = Depends(get_current_user)):
    count = await db.notifications.count_documents({'targetRoles': user['role'], 'isRead': False})
    return {"success": True, "data": {"count": count}}

@api.put("/notifications/{notification_id}/read")
async def mark_as_read(notification_id: str, user: dict = Depends(get_current_user)):
    result = await db.notifications.find_one_and_update(
        {'_id': ObjectId(notification_id)},
        {'$set': {'isRead': True}},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"success": True, "data": serialize_doc(result)}

@api.put("/notifications/mark-all-read")
async def mark_all_as_read(user: dict = Depends(get_current_user)):
    await db.notifications.update_many(
        {'targetRoles': user['role'], 'isRead': False},
        {'$set': {'isRead': True}}
    )
    return {"success": True, "message": "All notifications marked as read"}

# Analytics routes
@api.get("/analytics/dashboard")
async def get_dashboard_stats(user: dict = Depends(authorize('admin', 'manager'))):
    start_of_today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    start_of_month = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    today_orders = await db.orders.find({'createdAt': {'$gte': start_of_today}}).to_list(1000)
    month_orders = await db.orders.find({'createdAt': {'$gte': start_of_month}}).to_list(5000)
    
    today_revenue = sum(o['total'] for o in today_orders if o.get('paymentStatus') == 'paid')
    month_revenue = sum(o['total'] for o in month_orders if o.get('paymentStatus') == 'paid')
    active_orders = len([o for o in today_orders if o['status'] in ['pending', 'preparing', 'ready']])
    
    all_orders = await db.orders.find().to_list(10000)
    total_revenue = sum(o['total'] for o in all_orders if o.get('paymentStatus') == 'paid')
    
    return {
        "success": True,
        "data": {
            "today": {"orders": len(today_orders), "revenue": today_revenue, "activeOrders": active_orders},
            "month": {"orders": len(month_orders), "revenue": month_revenue},
            "allTime": {"totalOrders": len(all_orders), "totalRevenue": total_revenue, "avgOrderValue": total_revenue / len(all_orders) if all_orders else 0}
        }
    }

@api.get("/analytics/sales")
async def get_sales_report(startDate: Optional[str] = None, endDate: Optional[str] = None, groupBy: str = 'day', user: dict = Depends(authorize('admin', 'manager'))):
    start = datetime.fromisoformat(startDate) if startDate else datetime.now(timezone.utc) - timedelta(days=30)
    end = datetime.fromisoformat(endDate) if endDate else datetime.now(timezone.utc)
    
    orders = await db.orders.find({
        'createdAt': {'$gte': start, '$lte': end},
        'paymentStatus': 'paid'
    }).to_list(10000)
    
    sales_data = {}
    for order in orders:
        if groupBy == 'day':
            key = order['createdAt'].strftime('%Y-%m-%d')
        elif groupBy == 'month':
            key = order['createdAt'].strftime('%Y-%m')
        else:
            key = order['createdAt'].strftime('%Y-%m-%d %H:00')
        
        if key not in sales_data:
            sales_data[key] = {'_id': key, 'orders': 0, 'revenue': 0}
        sales_data[key]['orders'] += 1
        sales_data[key]['revenue'] += order['total']
    
    result = sorted(sales_data.values(), key=lambda x: x['_id'])
    for item in result:
        item['avgOrderValue'] = item['revenue'] / item['orders'] if item['orders'] else 0
    
    return {"success": True, "data": result}

@api.get("/analytics/top-items")
async def get_top_selling_items(limit: int = 10, days: int = 30, user: dict = Depends(authorize('admin', 'manager'))):
    start_date = datetime.now(timezone.utc) - timedelta(days=days)
    
    orders = await db.orders.find({
        'createdAt': {'$gte': start_date},
        'status': {'$ne': 'cancelled'}
    }).to_list(10000)
    
    item_stats = {}
    for order in orders:
        for item in order.get('items', []):
            item_id = item.get('menuItem', item.get('name', 'Unknown'))
            if item_id not in item_stats:
                item_stats[item_id] = {'_id': item_id, 'name': item.get('name', 'Unknown'), 'totalQuantity': 0, 'totalRevenue': 0}
            item_stats[item_id]['totalQuantity'] += item['quantity']
            item_stats[item_id]['totalRevenue'] += item['price'] * item['quantity']
    
    result = sorted(item_stats.values(), key=lambda x: x['totalQuantity'], reverse=True)[:limit]
    return {"success": True, "data": result}

@api.get("/analytics/category-revenue")
async def get_category_revenue(days: int = 30, user: dict = Depends(authorize('admin', 'manager'))):
    start_date = datetime.now(timezone.utc) - timedelta(days=days)
    
    orders = await db.orders.find({
        'createdAt': {'$gte': start_date},
        'status': {'$ne': 'cancelled'}
    }).to_list(10000)
    
    menu_items = {str(m['_id']): m for m in await db.menu_items.find().to_list(1000)}
    
    category_stats = {}
    for order in orders:
        for item in order.get('items', []):
            menu_item = menu_items.get(item.get('menuItem'))
            category = menu_item.get('category', 'other') if menu_item else 'other'
            
            if category not in category_stats:
                category_stats[category] = {'_id': category, 'totalQuantity': 0, 'totalRevenue': 0}
            category_stats[category]['totalQuantity'] += item['quantity']
            category_stats[category]['totalRevenue'] += item['price'] * item['quantity']
    
    result = sorted(category_stats.values(), key=lambda x: x['totalRevenue'], reverse=True)
    return {"success": True, "data": result}

# AI routes
@api.get("/ai/sales-prediction")
async def get_sales_prediction(days: int = 30, user: dict = Depends(authorize('admin', 'manager'))):
    start_date = datetime.now(timezone.utc) - timedelta(days=days)
    
    orders = await db.orders.find({
        'createdAt': {'$gte': start_date},
        'paymentStatus': 'paid'
    }).to_list(10000)
    
    daily_data = {}
    for order in orders:
        day = order['createdAt'].strftime('%Y-%m-%d')
        if day not in daily_data:
            daily_data[day] = {'orders': 0, 'revenue': 0}
        daily_data[day]['orders'] += 1
        daily_data[day]['revenue'] += order['total']
    
    total_days = len(daily_data) or 1
    avg_daily_orders = sum(d['orders'] for d in daily_data.values()) / total_days
    avg_daily_revenue = sum(d['revenue'] for d in daily_data.values()) / total_days
    
    sorted_days = sorted(daily_data.keys())
    last_week = [daily_data[d] for d in sorted_days[-7:]] if len(sorted_days) >= 7 else list(daily_data.values())
    prev_week = [daily_data[d] for d in sorted_days[-14:-7]] if len(sorted_days) >= 14 else last_week
    
    last_week_avg = sum(d['revenue'] for d in last_week) / (len(last_week) or 1)
    prev_week_avg = sum(d['revenue'] for d in prev_week) / (len(prev_week) or 1)
    
    trend = ((last_week_avg - prev_week_avg) / prev_week_avg * 100) if prev_week_avg > 0 else 0
    
    predictions = []
    today = datetime.now(timezone.utc)
    for i in range(1, 8):
        pred_date = today + timedelta(days=i)
        predictions.append({
            'date': pred_date.strftime('%Y-%m-%d'),
            'dayOfWeek': pred_date.strftime('%a'),
            'predictedOrders': round(avg_daily_orders * (1 + trend / 1000)),
            'predictedRevenue': round(avg_daily_revenue * (1 + trend / 1000)),
            'confidence': min(85 + days / 10, 95)
        })
    
    return {
        "success": True,
        "data": {
            "historicalAverage": {"dailyOrders": round(avg_daily_orders), "dailyRevenue": round(avg_daily_revenue)},
            "trend": {"percentage": round(trend, 1), "direction": 'up' if trend > 0 else ('down' if trend < 0 else 'stable')},
            "dailyPredictions": predictions,
            "monthlyPrediction": {
                "predictedOrders": round(avg_daily_orders * 30),
                "predictedRevenue": round(avg_daily_revenue * 30),
                "confidence": min(75 + days / 15, 90)
            }
        }
    }

@api.post("/ai/food-recommendations")
async def get_food_recommendations(data: FoodRecommendationRequest, user: dict = Depends(get_current_user)):
    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    
    recent_orders = await db.orders.find({
        'createdAt': {'$gte': week_ago},
        'status': {'$ne': 'cancelled'}
    }).to_list(1000)
    
    item_counts = {}
    for order in recent_orders:
        for item in order.get('items', []):
            name = item.get('name', 'Unknown')
            if name not in item_counts:
                item_counts[name] = {'name': name, 'count': 0}
            item_counts[name]['count'] += item['quantity']
    
    trending = sorted(item_counts.values(), key=lambda x: x['count'], reverse=True)[:5]
    
    menu_items = await db.menu_items.find({'isAvailable': True}).sort('orderCount', -1).to_list(1000)
    
    popular_by_category = {}
    for item in menu_items:
        cat = item.get('category', 'other')
        if cat not in popular_by_category:
            popular_by_category[cat] = []
        if len(popular_by_category[cat]) < 3:
            popular_by_category[cat].append(serialize_doc(item))
    
    current_hour = datetime.now(timezone.utc).hour
    if current_hour < 11:
        time_category = 'starters'
    elif current_hour >= 15 and current_hour < 18:
        time_category = 'drinks'
    elif current_hour >= 21:
        time_category = 'desserts'
    else:
        time_category = 'main-course'
    
    time_based = await db.menu_items.find({'category': time_category, 'isAvailable': True}).sort('orderCount', -1).limit(3).to_list(3)
    
    return {
        "success": True,
        "data": {
            "trending": trending,
            "popularByCategory": [{'category': k, 'topItems': v} for k, v in popular_by_category.items()],
            "complementary": [],
            "timeBasedSuggestions": {
                "category": time_category,
                "reason": "Popular during this time of day",
                "items": serialize_docs(time_based)
            }
        }
    }

@api.get("/ai/inventory-forecast")
async def get_inventory_forecast(days: int = 7, user: dict = Depends(authorize('admin', 'manager'))):
    items = await db.inventory.find().to_list(1000)
    
    forecasts = []
    for item in items:
        daily_usage = item.get('dailyUsage', 0) or (item['quantity'] / 30)
        days_until_empty = int(item['quantity'] / daily_usage) if daily_usage > 0 else 999
        
        if days_until_empty <= 3:
            status, urgency = 'critical', 'high'
        elif days_until_empty <= 7:
            status, urgency = 'low', 'medium'
        elif days_until_empty <= 14:
            status, urgency = 'moderate', 'low'
        else:
            status, urgency = 'healthy', 'low'
        
        forecasts.append({
            'id': str(item['_id']),
            'name': item['name'],
            'category': item.get('category', 'other'),
            'currentStock': item['quantity'],
            'unit': item.get('unit', 'kg'),
            'dailyUsage': round(daily_usage, 2),
            'projectedUsage': round(daily_usage * days, 2),
            'daysUntilEmpty': '365+' if days_until_empty > 365 else days_until_empty,
            'status': status,
            'urgency': urgency,
            'recommendedRestockQuantity': round(daily_usage * 14)
        })
    
    forecasts.sort(key=lambda x: {'high': 0, 'medium': 1, 'low': 2}[x['urgency']])
    
    critical = [f for f in forecasts if f['urgency'] == 'high']
    warnings = [f for f in forecasts if f['urgency'] == 'medium']
    
    return {
        "success": True,
        "data": {
            "summary": {
                "totalItems": len(forecasts),
                "criticalCount": len(critical),
                "warningCount": len(warnings),
                "healthyCount": len(forecasts) - len(critical) - len(warnings)
            },
            "criticalAlerts": critical,
            "warnings": warnings,
            "forecasts": forecasts
        }
    }

@api.post("/ai/assistant")
async def ask_assistant(data: AssistantQuestion, user: dict = Depends(authorize('admin', 'manager'))):
    question = data.question.lower()
    response = {"question": data.question, "answer": "", "data": None}
    
    if 'today' in question and ('sales' in question or 'revenue' in question):
        start_of_today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        orders = await db.orders.find({'createdAt': {'$gte': start_of_today}, 'paymentStatus': 'paid'}).to_list(1000)
        total = sum(o['total'] for o in orders)
        response['answer'] = f"Today's sales: ₹{total:.2f} from {len(orders)} orders"
        response['data'] = {"revenue": total, "orderCount": len(orders)}
    
    elif 'low' in question and 'stock' in question:
        items = await db.inventory.find().to_list(1000)
        low_stock = [i for i in items if i['quantity'] <= i.get('minThreshold', 10)]
        names = ', '.join(i['name'] for i in low_stock[:5])
        response['answer'] = f"{len(low_stock)} items are low in stock: {names}"
        response['data'] = serialize_docs(low_stock)
    
    elif 'top' in question and ('selling' in question or 'popular' in question):
        items = await db.menu_items.find({'isAvailable': True}).sort('orderCount', -1).limit(5).to_list(5)
        item_list = ', '.join(f"{i+1}. {item['name']} ({item.get('orderCount', 0)} orders)" for i, item in enumerate(items))
        response['answer'] = f"Top 5 selling items: {item_list}"
        response['data'] = serialize_docs(items)
    
    elif 'active' in question and 'order' in question:
        orders = await db.orders.find({'status': {'$in': ['pending', 'preparing', 'ready']}}).to_list(100)
        response['answer'] = f"There are {len(orders)} active orders"
        response['data'] = serialize_docs(orders)
    
    elif 'table' in question and ('free' in question or 'available' in question):
        tables = await db.tables.find({'status': 'free'}).to_list(100)
        table_nums = ', '.join(str(t['tableNumber']) for t in tables)
        response['answer'] = f"{len(tables)} tables are currently free: Table {table_nums}"
        response['data'] = serialize_docs(tables)
    
    elif 'month' in question and ('sales' in question or 'revenue' in question):
        start_of_month = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        orders = await db.orders.find({'createdAt': {'$gte': start_of_month}, 'paymentStatus': 'paid'}).to_list(5000)
        total = sum(o['total'] for o in orders)
        response['answer'] = f"This month's revenue: ₹{total:.2f} from {len(orders)} orders"
        response['data'] = {"revenue": total, "orderCount": len(orders)}
    
    else:
        response['answer'] = "I can help you with: today's sales, low stock items, top selling items, active orders, free tables, and monthly revenue. Try asking about any of these!"
    
    return {"success": True, "data": response}

# Include API router
app.include_router(api)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# For Socket.IO support
app.mount("/socket.io", socket_app)
