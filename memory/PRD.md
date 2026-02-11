# NEXA EATS - Restaurant Management System

## Project Overview
A complete, production-grade Restaurant Management System (RMS) built for a final year college project. Features modern black & orange UI theme with smooth animations.

## Architecture (MERN Stack)
- **Frontend**: React.js + Tailwind CSS + Framer Motion + Shadcn/UI
- **Backend**: Node.js + Express.js + Socket.IO for real-time notifications
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Custom JWT (Access + Refresh Tokens)

## User Personas & Roles
1. **Admin** - Full system access, user management, reports
2. **Manager** - Menu, tables, orders, inventory, analytics
3. **Staff (Waiter/Cashier)** - Order creation, table management, payments
4. **Kitchen Staff** - Kitchen Display System, order status updates

## Core Features Implemented

### Authentication & Security
- [x] Custom JWT with access (15min) + refresh (7 days) tokens
- [x] Role-Based Access Control (RBAC)
- [x] Password hashing with bcrypt (12 rounds)
- [x] Rate limiting on API endpoints
- [x] Centralized error handling

### User Management (Admin Only)
- [x] Create, update, delete staff users
- [x] Assign roles and permissions
- [x] Activate/Deactivate users

### Menu Management
- [x] Add/update/delete food items
- [x] Categories: Veg, Non-Veg, Drinks, Desserts, Starters, Main Course
- [x] Price & availability control
- [x] Preparation time tracking
- [x] Order count tracking for popularity

### Table Management
- [x] Table configuration (number, capacity, location)
- [x] Status tracking: Free / Occupied / Reserved
- [x] Location zones: Indoor, Outdoor, Balcony, VIP

### Order Management
- [x] Create orders from tables or takeaway
- [x] Order lifecycle: Pending -> Preparing -> Ready -> Served -> Completed
- [x] Auto order numbering (ORD-00001)
- [x] Tax calculation (5% GST)
- [x] Discount application

### Real-Time Notifications (Socket.IO)
- [x] New order notifications to kitchen
- [x] Order status change alerts
- [x] Low stock alerts
- [x] Role-based event rooms

### Kitchen Display System
- [x] Kanban-style board (Pending -> Preparing -> Ready)
- [x] Elapsed time tracking per order
- [x] One-click status updates
- [x] Auto-refresh every 30 seconds

### Billing System
- [x] Auto bill calculation
- [x] Tax & discount support
- [x] Multiple payment methods: Cash, Card, UPI
- [x] Payment status tracking

### Inventory Management
- [x] Track ingredient stock with categories
- [x] Low stock alerts (threshold-based)
- [x] Restock functionality
- [x] Cost per unit tracking
- [x] Total inventory value calculation

### Reports & Analytics
- [x] Dashboard with real-time KPIs
- [x] Daily/Monthly sales reports
- [x] Top selling items chart
- [x] Revenue by category (pie chart)
- [x] Payment method breakdown
- [x] Order status distribution

### AI-Powered Features (Rule-Based - No External APIs)
- [x] Sales Prediction (7-day & monthly forecasts with confidence scores)
- [x] Food Recommendations (trending, time-based, category-based)
- [x] Inventory Demand Forecasting (days until empty, restock recommendations)
- [x] AI Assistant (answers questions about restaurant data using pattern matching)

## API Endpoints

### Authentication
- POST `/api/auth/register` - User registration
- POST `/api/auth/login` - User login
- POST `/api/auth/refresh-token` - Refresh access token
- GET `/api/auth/me` - Get current user

### Users (Admin Only)
- GET `/api/users` - List all users
- POST `/api/users` - Create user
- PUT `/api/users/:id` - Update user
- DELETE `/api/users/:id` - Delete user

### Menu
- GET `/api/menu` - List menu items
- POST `/api/menu` - Create menu item
- PUT `/api/menu/:id` - Update menu item
- DELETE `/api/menu/:id` - Delete menu item
- GET `/api/menu/popular` - Get popular items

### Tables
- GET `/api/tables` - List all tables
- POST `/api/tables` - Create table
- PUT `/api/tables/:id` - Update table
- PUT `/api/tables/:id/status` - Update table status
- GET `/api/tables/stats` - Get table statistics

### Orders
- GET `/api/orders` - List orders
- GET `/api/orders/today` - Today's orders
- GET `/api/orders/kitchen` - Kitchen orders (pending/preparing/ready)
- POST `/api/orders` - Create order
- PUT `/api/orders/:id/status` - Update order status
- PUT `/api/orders/:id/payment` - Process payment

### Inventory
- GET `/api/inventory` - List inventory items
- POST `/api/inventory` - Add inventory item
- PUT `/api/inventory/:id` - Update item
- PUT `/api/inventory/:id/restock` - Restock item
- GET `/api/inventory/low-stock` - Get low stock items
- GET `/api/inventory/stats` - Inventory statistics

### Analytics
- GET `/api/analytics/dashboard` - Dashboard stats
- GET `/api/analytics/sales` - Sales data
- GET `/api/analytics/top-items` - Top selling items
- GET `/api/analytics/category-revenue` - Revenue by category
- GET `/api/analytics/orders` - Order statistics

### AI Features
- GET `/api/ai/sales-prediction` - Sales forecast
- POST `/api/ai/food-recommendations` - Food suggestions
- GET `/api/ai/inventory-forecast` - Inventory predictions
- POST `/api/ai/assistant` - AI Q&A assistant

## Date: February 11, 2026

## What's Been Implemented
- Complete Node.js/Express backend (migrated from Python)
- Full React frontend with 10 responsive pages
- Real-time notification system with Socket.IO
- Role-based access control (Admin, Manager, Staff, Kitchen)
- Comprehensive analytics dashboard with Recharts
- Rule-based AI insights and predictions
- Responsive design with Tailwind CSS
- Framer Motion animations throughout

## Completed in Latest Session
- [x] Backend migration from Python/FastAPI to Node.js/Express
- [x] Created Python wrapper for supervisor compatibility
- [x] All API endpoints working with Node.js
- [x] User authentication with bcryptjs
- [x] Comprehensive testing (43 backend tests passed)
- [x] Created detailed viva presentation script

## Documentation
- `/app/memory/PRD.md` - This file
- `/app/memory/PRESENTATION_SCRIPT.md` - Complete viva presentation with all explanations

## Test Credentials
- Admin: admin@nexa-eats.com / admin123
- Manager: manager@nexa-eats.com / manager123

## Future Enhancements (P1-P2)
- [ ] Print receipt functionality
- [ ] Export reports to PDF/Excel
- [ ] Customer feedback system
- [ ] QR code table ordering
- [ ] Multi-language support (i18n)
- [ ] Mobile app (React Native)
- [ ] Payment gateway integration (Stripe/Razorpay)
- [ ] Employee scheduling module
